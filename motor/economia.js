// Inicio de turno: ingresos, mantenimiento, bancarrota, investigación,
// curación, reparación y reinicio de banderas.
window.FWM = window.FWM || {};

FWM.economia = (function () {
  const E = () => FWM.estado, S = () => FWM.stats, T = () => FWM.territorio, U = () => FWM.util;

  function inicioTurno(estado, datos, jugadorId) {
    const eventos = [];
    const j = estado.jugadores[jugadorId];
    if (j.eliminado) return eventos;
    j.poderActivo = null; // el poder del líder dura hasta que vuelve a tocarle
    // las hordas del modo Resistir no cobran ni pagan: si pagaran mantenimiento sin oro, la oleada entera
    // desertaría en su propio turno y el modo no funcionaría (7 sep 2026)
    if (j.sinEconomia) {
      for (const t of E().tropasDe(estado, jugadorId)) {
        t.movRestante = S().statTropa(estado, datos, t, "movimiento");
        t.accionUsada = false;
      }
      return eventos;
    }

    T().revisarCapital(estado, datos, jugadorId);
    const z = T().consolidar(estado, datos, jugadorId);

    // 1. Ingresos
    const ingresos = calcularIngresos(estado, datos, jugadorId, z);
    for (const { hucha, cantidad } of ingresos) { U().ingresar(hucha, cantidad); if (estado.estadisticas && estado.estadisticas[jugadorId]) estado.estadisticas[jugadorId].oro += cantidad.oro || 0; }
    // Oro de Malí: un tanto por ciento más sobre lo que entra en la hucha del reino
    const extraOro = oroExtraFaccion(estado, datos, jugadorId, ingresos);
    if (extraOro) { j.hucha.oro = (j.hucha.oro || 0) + extraOro; if (estado.estadisticas && estado.estadisticas[jugadorId]) estado.estadisticas[jugadorId].oro += extraOro; }
    // ayuda (o lastre) de la dificultad: oro fijo de más en difícil, de menos en fácil, cada turno (19 sep 2026)
    if (j.oroPorTurno) { j.hucha.oro = Math.max(0, (j.hucha.oro || 0) + j.oroPorTurno); if (estado.estadisticas && estado.estadisticas[jugadorId]) estado.estadisticas[jugadorId].oro += j.oroPorTurno; }
    // Tesorero (héroe): +1 oro por turno y peldaño
    if (j.heroe && FWM.heroes) { const oroH = FWM.heroes.efectosDe(j.heroe).oro || 0; if (oroH) { j.hucha.oro = (j.hucha.oro || 0) + oroH; if (estado.estadisticas && estado.estadisticas[jugadorId]) estado.estadisticas[jugadorId].oro += oroH; } }

    // 2. Mantenimiento y bancarrota, por hucha
    const grupos = new Map(); // hucha -> { hucha, tropas: [] }
    for (const t of E().tropasDe(estado, jugadorId)) {
      const hex = E().posicionTropa(estado, t);
      const hucha = T().huchaDe(estado, datos, jugadorId, hex, z);
      if (!grupos.has(hucha)) grupos.set(hucha, { hucha, tropas: [] });
      grupos.get(hucha).tropas.push(t);
    }
    for (const { hucha, tropas } of grupos.values()) {
      // ejércitos sin tierra (batallas sin pueblos): no pagan mantenimiento, si no desertarían solos en el turno 1
      let total = j.sinMantenimiento ? 0 : tropas.reduce((s, t) => s + mantenimientoDe(datos, t, estado), 0);
      // solo desertan las que cuestan algo: el héroe (y cualquier tropa sin mantenimiento) se queda (6 sep 2026)
      const orden = tropas.filter(t => mantenimientoDe(datos, t, estado) > 0 && !datos.tropas[t.tipo].heroe).sort((a, b) => {
        const ca = datos.tropas[a.tipo].coste.oro || 0, cb = datos.tropas[b.tipo].coste.oro || 0;
        if (ca !== cb) return ca - cb;
        return FWM.azar.siguiente(estado) < 0.5 ? -1 : 1;
      });
      while (total > (hucha.oro || 0) && orden.length) {
        const victima = orden.shift();
        total -= mantenimientoDe(datos, victima, estado);
        const hexV = E().posicionTropa(estado, victima);
        eliminarTropa(estado, victima);
        eventos.push({ tipo: "bancarrota", jugador: jugadorId, tropa: victima.tipo, hex: hexV, falta: total + mantenimientoDe(datos, victima, estado) - (hucha.oro || 0) });
        if (estado.estadisticas && estado.estadisticas[jugadorId]) estado.estadisticas[jugadorId].bancarrotaTurno = estado.turno;
      }
      hucha.oro = (hucha.oro || 0) - total;
    }

    // 3. Investigación
    if (j.investigando) {
      j.investigando.turnosRestantes -= 1;
      if (j.investigando.turnosRestantes <= 0) {
        const id = j.investigando.id;
        if (!j.tecnologias.includes(id)) j.tecnologias.push(id);
        j.nivelesTec[id] = (j.nivelesTec[id] || 0) + 1;
        j.investigando = null;
        eventos.push({ tipo: "investigado", jugador: jugadorId, tec: id });
      }
    }

    // 3b. Pócima de resurrección: el héroe caído vuelve a la capital con la mitad de la vida (una vez)
    if (j.heroeCaido && j.heroe && j.heroe.pocima && !j.heroe.pocimaUsada && j.capital && estado.asentamientos[j.capital] && estado.asentamientos[j.capital].dueno === jugadorId) {
      const tipo = "heroe_" + j.heroe.clase;
      if (datos.tropas[tipo]) {
        const h = E().crearTropa(estado, datos, tipo, jugadorId, null);
        h.vida = Math.max(1, Math.floor(S().vidaMax(estado, datos, h) / 2));
        const a = estado.asentamientos[j.capital];
        if (a.guarnicion.length < S().propAsentamiento(estado, datos, a, "huecosGuarnicion")) { h.acuarteladaEn = j.capital; a.guarnicion.push(h.id); }
        else { const libre = FWM.hex.vecinos(j.capital).find(v => estado.mapa.hexes[v] && !E().esAgua(estado, v, datos) && !E().tropaEn(estado, v)); if (libre) h.hex = libre; else h.acuarteladaEn = j.capital, a.guarnicion.push(h.id); }
        j.heroeTropa = h.id; j.heroe.pocimaUsada = true; j.heroeCaido = null;
        eventos.push({ tipo: "resucita", jugador: jugadorId, hex: E().posicionTropa(estado, h), tropa: tipo });
      }
    }
    // 4. Curación y reparación
    const curaMontada = FWM.facciones && FWM.facciones.rasgo(estado, jugadorId, "cura_extra");
    for (const t of E().tropasDe(estado, jugadorId)) {
      const def = FWM.facciones ? FWM.facciones.defDe(estado, datos, t) : datos.tropas[t.tipo];
      const descanso = !t.accionUsada && t.movRestante >= S().statTropa(estado, datos, t, "movimiento") && t.creadaEnTurno < estado.turno;
      const enCasa = t.acuarteladaEn || (t.hex && estado.mapa.hexes[t.hex].dueno === jugadorId);
      let cura = t.acuarteladaEn ? ((datos.reglas && datos.reglas.curacionAcuartelada) || (datos.reglas && datos.reglas.curacionPorTurno) || 1) : ((datos.reglas && datos.reglas.curacionPorTurno) || 1);
      // héroe: Forrajeo (más cura en casa) y aura de Cirujano / alquimista (más cura junto al héroe)
      if (j.heroe && FWM.heroes) { const efH = FWM.heroes.efectosDe(j.heroe); if (!t.acuarteladaEn && efH.curaCasa) cura += efH.curaCasa; const aura = S().auraSobre(estado, datos, t); if (aura && aura.cura) cura += aura.cura; }
      if (curaMontada && (def.etiquetas || []).includes(curaMontada.etiqueta)) cura += curaMontada.valor; // Jinetes curtidos (Saladino)
      if (descanso && enCasa) t.vida = Math.min(S().vidaMax(estado, datos, t), t.vida + cura);
      // caballero de Santiago curtido: en su tierra se cura aunque no descanse
      if (def.sanaEnCasa && enCasa) t.vida = Math.min(S().vidaMax(estado, datos, t), t.vida + def.sanaEnCasa);
      // Segundo aliento: el héroe cura 10 al empezar el turno si no atacó el anterior
      if (datos.tropas[t.tipo].heroe && j.heroe && FWM.heroes) { const efH = FWM.heroes.efectosDe(j.heroe); if (efH.segundoAliento && t.ultimoAtaque !== estado.turno - 1 && !(descanso && enCasa)) t.vida = Math.min(S().vidaMax(estado, datos, t), t.vida + efH.segundoAliento); }
    }
    for (const { a } of E().asentamientosDe(estado, jugadorId)) {
      const max = S().propAsentamiento(estado, datos, a, "integridad");
      if (!a.atacadaEsteTurno && a.integridad < max) a.integridad += ((datos.reglas && datos.reglas.reparacionPorTurno) || 1);
      a.integridad = Math.min(a.integridad, max);
      a.atacadaEsteTurno = false;
      a.reclutadoEsteTurno = false; a.reclutas = 0;
    }

    // 5. Reinicio de banderas; las dormidas despiertan si hay un enemigo pegado al asentamiento
    const enemigosPos = Object.values(estado.tropas).filter(x => E().enemigos(estado, x.dueno, jugadorId)).map(x => E().posicionTropa(estado, x)).filter(Boolean);
    for (const t of E().tropasDe(estado, jugadorId)) {
      t.movRestante = S().statTropa(estado, datos, t, "movimiento");
      t.accionUsada = false; t.trasAtaque = false;
      if (t.estados && t.estados.includes("dormida")) {
        const donde = E().posicionTropa(estado, t);
        const enemigoCerca = donde && enemigosPos.some(p => FWM.hex.distancia(p, donde) <= 1);
        const curada = t.dormidaHerida && t.vida >= S().vidaMax(estado, datos, t);
        if (enemigoCerca || curada) {
          t.estados = t.estados.filter(x => x !== "dormida"); delete t.dormidaHerida;
          const lugar = t.acuarteladaEn ? estado.asentamientos[t.acuarteladaEn].nombre : (datos.terrenos[estado.mapa.hexes[donde].terreno].nombre.toLowerCase());
          eventos.push({ tipo: enemigoCerca ? "despierta" : "despiertaCurada", jugador: jugadorId, tropa: t.tipo, asentamiento: lugar, hex: donde });
        }
      }
    }
    FWM.ganchos.avisar("inicioTurno", estado, { datos, jugadorId });
    return eventos;
  }

  // Con estado, el aura del Mansa: las tropas pegadas a él no pagan.
  function mantenimientoDe(datos, tropa, estado) {
    if (tropa.sinPaga) return 0;
    const m = datos.tropas[tropa.tipo].mantenimiento;
    let coste = m;
    if (estado && m) { const aura = S().auraSobre(estado, datos, tropa); if (aura && aura.sinMantenimiento) return 0; if (aura && aura.mantenimientoMenos) coste = Math.max(0, m - aura.mantenimientoMenos); }
    return tropa.acuarteladaEn ? Math.floor(coste / 2) : coste;
  }
  // Oro extra de la facción sobre los ingresos de la hucha del reino (Oro de Malí).
  function oroExtraFaccion(estado, datos, jugadorId, ingresos) {
    const f = FWM.facciones && FWM.facciones.rasgo(estado, jugadorId, "ingresos_factor"); if (!f) return 0;
    const j = estado.jugadores[jugadorId];
    const base = ingresos.filter(x => x.hucha === j.hucha).reduce((s, x) => s + (x.cantidad.oro || 0), 0);
    return Math.round(base * (f.valor - 1));
  }

  // Lista de { hucha, cantidad } sin aplicar. También sirve para la interfaz.
  function calcularIngresos(estado, datos, jugadorId, z) {
    z = z || T().zonas(estado, jugadorId);
    const lista = [];
    for (const [k, h] of Object.entries(estado.mapa.hexes)) {
      if (h.dueno !== jugadorId) continue;
      if (h.construccion === "asentamiento") {
        const a = estado.asentamientos[k];
        lista.push({ hucha: T().huchaDe(estado, datos, jugadorId, k, z), cantidad: S().produccionAsentamiento(estado, datos, a), origen: k });
      }
      if (h.yacimiento) { // también bajo un asentamiento: el yacimiento queda dentro de las murallas
        const enZona = z.reino.has(k) || z.aisladas.some(zz => zz.hexes.has(k));
        if (!enZona) continue;
        const ocupante = E().tropaEn(estado, k);
        if (ocupante && E().enemigos(estado, ocupante.dueno, jugadorId)) continue;
        lista.push({ hucha: T().huchaDe(estado, datos, jugadorId, k, z), cantidad: S().produccionYacimiento(estado, datos, jugadorId, h.yacimiento), origen: k });
      }
    }
    return lista;
  }

  // Resumen para la barra superior: ingresos y gastos que van a la hucha del reino.
  function resumen(estado, datos, jugadorId) {
    const j = estado.jugadores[jugadorId];
    const z = T().zonas(estado, jugadorId);
    const ingresos = FWM.util.huchaVacia(datos);
    const lista = calcularIngresos(estado, datos, jugadorId, z);
    for (const { hucha, cantidad } of lista) if (hucha === j.hucha) FWM.util.ingresar(ingresos, cantidad);
    ingresos.oro = (ingresos.oro || 0) + oroExtraFaccion(estado, datos, jugadorId, lista);
    if (j.heroe && FWM.heroes) ingresos.oro = (ingresos.oro || 0) + (FWM.heroes.efectosDe(j.heroe).oro || 0);
    if (j.oroPorTurno) ingresos.oro = (ingresos.oro || 0) + j.oroPorTurno;
    let gasto = 0;
    if (!j.sinMantenimiento) for (const t of E().tropasDe(estado, jugadorId)) {
      const hucha = T().huchaDe(estado, datos, jugadorId, E().posicionTropa(estado, t), z);
      if (hucha === j.hucha) gasto += mantenimientoDe(datos, t, estado);
    }
    return { ingresos, gasto };
  }

  // Desglose para la pestaña del reino: por qué entra y por qué sale cada recurso (hucha del reino).
  function desglose(estado, datos, jugadorId) {
    const j = estado.jugadores[jugadorId];
    const z = T().zonas(estado, jugadorId);
    const ingresos = {}, gastos = {};
    for (const k of Object.keys(datos.recursos)) { ingresos[k] = []; gastos[k] = []; }
    const anadir = (lista, texto, cantidad) => {
      const fila = lista.find(f => f.texto === texto);
      if (fila) { fila.cantidad += cantidad; fila.veces += 1; } else lista.push({ texto, cantidad, veces: 1 });
    };
    for (const { hucha, cantidad, origen } of calcularIngresos(estado, datos, jugadorId, z)) {
      if (hucha !== j.hucha) continue;
      const h = estado.mapa.hexes[origen];
      const texto = h.construccion === "asentamiento"
        ? datos.asentamientos[estado.asentamientos[origen].tipo].nombre
        : datos.yacimientos[h.yacimiento].nombre;
      for (const r of Object.keys(cantidad)) if (cantidad[r]) anadir(ingresos[r], texto, cantidad[r]);
    }
    for (const t of E().tropasDe(estado, jugadorId)) {
      const hucha = T().huchaDe(estado, datos, jugadorId, E().posicionTropa(estado, t), z);
      if (hucha !== j.hucha) continue;
      const m = mantenimientoDe(datos, t, estado);
      if (m) anadir(gastos.oro, datos.tropas[t.tipo].nombre + (t.acuarteladaEn ? " (acuartelado)" : ""), m);
    }
    // yacimientos propios que no producen, para explicarlo
    const parados = [];
    for (const [k, h] of Object.entries(estado.mapa.hexes)) {
      if (h.dueno !== jugadorId || !h.yacimiento || !Object.keys(datos.yacimientos[h.yacimiento].produce || {}).length) continue;
      const enZona = z.reino.has(k) || z.aisladas.some(zz => zz.hexes.has(k));
      const ocupante = E().tropaEn(estado, k);
      if (!enZona) parados.push({ nombre: datos.yacimientos[h.yacimiento].nombre, motivo: "sin conexión" });
      else if (ocupante && ocupante.dueno !== jugadorId) parados.push({ nombre: datos.yacimientos[h.yacimiento].nombre, motivo: "tropa enemiga encima" });
      else if (!z.reino.has(k)) parados.push({ nombre: datos.yacimientos[h.yacimiento].nombre, motivo: "zona aislada (va al almacén local)" });
    }
    return { ingresos, gastos, parados, aisladas: z.aisladas };
  }

  function eliminarTropa(estado, tropa) {
    if (tropa.acuarteladaEn) {
      const a = estado.asentamientos[tropa.acuarteladaEn];
      if (a) a.guarnicion = a.guarnicion.filter(id => id !== tropa.id);
    }
    delete estado.tropas[tropa.id];
  }

  return { inicioTurno, mantenimientoDe, calcularIngresos, resumen, desglose, eliminarTropa, oroExtraFaccion };
})();
