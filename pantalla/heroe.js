// El jugador fuera de la partida: su facción, el progreso de cada facción, el oro y los objetos del héroe,
// y la cuenta. Se guarda en el aparato (fwm.heroe) y en la nube (perfiles.heroe) cuando hay cuenta.
// Los cálculos puros están en FWM.heroes (datos/base/heroes.js) y FWM.facciones (datos/base/facciones.js).
//
// 13 sep 2026, facciones: el héroe ES el líder de su facción. Cada facción tiene su propia escalera de diez
// niveles (sus puntos y sus mejoras); el oro, los objetos, los puntos de la cuenta y la Leyenda son de la cuenta.
//   { v: 2, faccion, facciones: { castilla: { puntos, mejoras, puntosExtra } }, oro, objetos, inventario,
//     propias: [facciones de pago conseguidas con oro o regaladas], puntosNube, leyenda, cuentaCobrada, avisado }
// Quien ya jugaba con la versión anterior (una clase y unos puntos) pasa a la facción de su clase con todo su
// progreso; si esa facción es de pago, se le regala.
window.FWM = window.FWM || {};

FWM.heroe = (function () {
  const CLAVE = "fwm.heroe";
  const PRECIO_ORO = 5000;      // una facción de pago con oro del héroe
  const PUNTOS_CUENTA = 1000;   // cada nivel de cuenta
  let cache = null;
  const F = () => FWM.facciones;

  function vacio() { return { v: 2, faccion: "castilla", facciones: {}, oro: 0, objetos: {}, inventario: [], propias: [], puntosNube: 0, leyenda: false, cuentaCobrada: 0, avisado: {} }; }
  function progresoVacio() { return { puntos: 0, mejoras: {}, puntosExtra: 0 }; }

  // Paso de la versión anterior: una clase, mejoras y los puntos del marcador → la facción de esa clase.
  function migrar(viejo) {
    const h = Object.assign(vacio(), viejo);
    const f = (viejo.clase && F().porClase(viejo.clase)) || "castilla";
    let puntosViejos = 0; try { const r = FWM.guardado.records(); puntosViejos = Math.max(r.puntosTotal || 0, viejo.puntosNube || 0); } catch (e) { puntosViejos = viejo.puntosNube || 0; }
    h.faccion = f;
    h.facciones = { [f]: { puntos: puntosViejos, mejoras: Object.assign({}, viejo.mejoras || {}), puntosExtra: viejo.puntosExtra || 0 } };
    if (FWM.datosBase.facciones[f].pago && (puntosViejos > 0 || Object.keys(viejo.mejoras || {}).length)) h.propias = [f]; // se le regala
    h.migrado = { de: viejo.clase || null, puntos: puntosViejos, fecha: new Date().toISOString().slice(0, 10) };
    delete h.clase; delete h.mejoras; delete h.puntosExtra;
    return h;
  }
  function leer() {
    if (cache) return cache;
    let crudo = null; try { crudo = JSON.parse(localStorage.getItem(CLAVE) || "null"); } catch (e) { crudo = null; }
    if (!crudo) cache = vacio();
    else if (crudo.v !== 2) { cache = migrar(crudo); try { localStorage.setItem(CLAVE, JSON.stringify(cache)); } catch (e) { /* nada */ } }
    else cache = Object.assign(vacio(), crudo);
    if (!FWM.datosBase.facciones[cache.faccion]) cache.faccion = "castilla";
    ajustarMejoras(cache);
    return cache;
  }
  // Si una mejora tiene ahora menos peldaños (18 sep 2026: Filo, Tesorero, Escudo de hermanos y Grito pasaron de 4 o
  // 3 a 3 o 2, cada uno más fuerte), lo gastado de más vuelve a estar libre: los puntos se cuentan por lo gastado.
  function ajustarMejoras(h) {
    const M = (FWM.datosBase.heroes && FWM.datosBase.heroes.mejoras) || {};
    for (const p of Object.values(h.facciones || {})) {
      if (!p || !p.mejoras) continue;
      for (const [id, n] of Object.entries(p.mejoras)) { if (!M[id]) delete p.mejoras[id]; else if (n > M[id].peldanos) p.mejoras[id] = M[id].peldanos; }
    }
    return h;
  }
  function guardar(h) {
    ajustarMejoras(h);
    cache = h;
    try { localStorage.setItem(CLAVE, JSON.stringify(h)); } catch (e) { /* nada */ }
    if (FWM.nube && FWM.nube.usuario && FWM.nube.usuario()) FWM.nube.guardarHeroe(h).catch(() => {});
    return h;
  }
  function prog(f) { const h = leer(); f = f || h.faccion; if (!h.facciones[f]) h.facciones[f] = progresoVacio(); return h.facciones[f]; }

  // ---------- facción ----------
  function faccion() { return leer().faccion; }
  function datosFaccion(f) { return FWM.datosBase.facciones[f || faccion()]; }
  function clase(f) { return datosFaccion(f).clase; }
  // ¿La tiene? Las gratis siempre; las de pago, compradas en la tienda (FWM.cobro), con oro o regaladas.
  function tiene(f) {
    const d = FWM.datosBase.facciones[f]; if (!d) return false;
    if (!d.pago) return true;
    if ((leer().propias || []).includes(f)) return true;
    return !!(FWM.cobro && FWM.cobro.tieneFaccion(f));
  }
  function elegirFaccion(f) { if (!tiene(f)) return "no_la_tienes"; const h = leer(); h.faccion = f; prog(f); guardar(h); return null; }
  function darFaccion(f) { const h = leer(); if (!FWM.datosBase.facciones[f] || (h.propias || []).includes(f)) return false; h.propias = (h.propias || []).concat([f]); guardar(h); return true; }
  function comprarConOro(f) {
    const d = FWM.datosBase.facciones[f]; if (!d || !d.pago) return "no_se_vende";
    if (tiene(f)) return "ya_tienes";
    const h = leer(); if ((h.oro || 0) < PRECIO_ORO) return "sin_oro";
    h.oro -= PRECIO_ORO; h.propias = (h.propias || []).concat([f]); guardar(h); return null;
  }

  // ---------- puntos y niveles ----------
  // Puntos de la cuenta: el mayor entre el aparato y la nube (la nube manda si hay cuenta; el local se puede borrar).
  function puntosCuenta() { const r = FWM.guardado.records(); const h = leer(); return Math.max(r.puntosTotal || 0, h.puntosNube || 0); }
  function puntos(f) { return prog(f).puntos || 0; }
  function nivel(f) { return F().nivelPorPuntos(puntos(f)); }
  function nivelJugable(f) { return nivel(f); }
  function mejorNivel() { const h = leer(); return Math.max(1, ...Object.keys(h.facciones).map(x => F().nivelPorPuntos(h.facciones[x].puntos || 0))); }
  function leyenda() { return !!leer().leyenda; }
  // Nivel que se ENSEÑA: la Leyenda es el nivel 11 (16 sep 2026), un escalón más, nunca un "10 + Leyenda".
  // Solo se enseña con la facción en la que ya estás en el 10, que es lo que pide la Leyenda.
  function nivelVisible(f) { const n = nivel(f); return leyenda() && n >= F().NIVEL_MAX ? F().NIVEL_LEYENDA : n; }
  // ¿Esta facción sube al doble? Mientras va por debajo de tu mejor facción.
  function subeDoble(f) { return nivel(f) < mejorNivel(); }
  // Suma los puntos de una partida a la facción con la que se ha jugado. Devuelve { sumados, doble, antes, despues }.
  function anotarPartida(f, puntosPartida) {
    f = FWM.datosBase.facciones[f] ? f : faccion();
    const p = prog(f); const antes = F().nivelPorPuntos(p.puntos || 0);
    const doble = subeDoble(f); const sumados = Math.max(0, Math.round(puntosPartida || 0)) * (doble ? 2 : 1);
    p.puntos = (p.puntos || 0) + sumados; guardar(leer());
    return { faccion: f, sumados, doble, antes, despues: F().nivelPorPuntos(p.puntos) };
  }
  function puntosMejoraGanados(f) { f = f || faccion(); return FWM.heroes.puntosMejoraPorPuntos(puntos(f)) + (prog(f).puntosExtra || 0) + F().puntosExtra(f, nivel(f)); }
  // Punto regalado (el primero, en la bienvenida). Solo una vez por cuenta.
  function darPuntoExtra(n) { const h = leer(); if (h.extraDado) return false; h.extraDado = true; const p = prog(); p.puntosExtra = (p.puntosExtra || 0) + (n || 1); guardar(h); return true; }
  function puntosMejoraDisponibles(f) { return Math.max(0, puntosMejoraGanados(f) - FWM.heroes.puntosGastados({ mejoras: prog(f).mejoras })); }
  // Progreso hacia el siguiente nivel y el siguiente punto de la facción actual.
  function progreso(f) {
    f = f || faccion(); const p = puntos(f); const n = nivel(f); const E = FWM.datosBase.escalera;
    const sig = E.find(x => x.nivel === n + 1 && x.puntos != null) || null; // el 11 (Leyenda) no se sube por puntos
    const ganados = puntosMejoraGanados(f); const base = FWM.heroes.puntosMejoraPorPuntos(p);
    return { faccion: f, puntos: p, nivel: n, nombre: F().datosNivel(n).nombre, siguienteNivel: sig, desdeNivel: F().datosNivel(n).puntos || 0, doble: subeDoble(f),
      puntosMejora: ganados, disponibles: puntosMejoraDisponibles(f), umbralAnterior: base ? FWM.heroes.umbralPunto(base) : 0, umbralSiguiente: base < FWM.datosBase.heroes.puntosMejora.maximo ? FWM.heroes.umbralPunto(base + 1) : null };
  }

  // Gasta un punto en una cadena de la facción actual. Devuelve null si va bien o el motivo.
  function mejorar(id) {
    const h = leer(); const p = prog();
    if (puntosMejoraDisponibles() <= 0) return "sin_puntos";
    const m = FWM.heroes.puedeMejorar({ clase: clase(), nivel: nivel(), mejoras: p.mejoras }, id); if (m) return m;
    p.mejoras[id] = (p.mejoras[id] || 0) + 1; guardar(h); return null;
  }

  // Lo que va a la partida: { faccion, clase, nivel, mejoras, objetos, pocima, aspecto }.
  // Mapa del día: todos a nivel 1 y sin mejoras. Duelos: cada uno con su nivel (el reto entre amigos puede igualar al más bajo).
  function paraPartida(op, f) {
    const h = leer(); f = f || h.faccion;
    const objetos = {}; for (const [k, v] of Object.entries(h.objetos || {})) if (k !== "consumible" && k !== "aspecto" && O()[v]) objetos[k] = v;
    const pocima = !!(h.objetos && h.objetos.consumible === "pocima" && tieneObjeto("pocima"));
    const base = { faccion: f, clase: clase(f), aspecto: h.objetos && h.objetos.aspecto, leyenda: !!h.leyenda };
    if (op && op.tipo === "dia") return Object.assign(base, { nivel: 1, mejoras: {}, objetos: {}, pocima: false });
    return Object.assign(base, { nivel: nivel(f), mejoras: Object.assign({}, prog(f).mejoras), objetos, pocima });
  }
  // Héroe de una IA al nivel del humano, con los mismos puntos gastados, repartidos al azar.
  function paraIA(semilla, nivelH, gastados, claseIA) { return FWM.heroes.heroeIA(nivelH, gastados, FWM.azar.crear(semilla), claseIA); }

  // ---------- cuenta: nivel por puntos totales y sus premios ----------
  function nivelCuenta() { return 1 + Math.floor(puntosCuenta() / PUNTOS_CUENTA); }
  const ASPECTOS_CUENTA = ["capa_granate", "capa_azul", "estandarte_leon", "capa_armino", "manto_estrellas", "capa_oro"];
  function oroInicialCuenta() { return Math.min(25, Math.floor((nivelCuenta() - 1) / 10) * 5); }
  // Cobra lo que se debe por los niveles de cuenta nuevos: 60 de oro por nivel y un aspecto cada 5. Devuelve lo dado.
  function cobrarCuenta() {
    const h = leer(); const n = nivelCuenta(); const ya = h.cuentaCobrada || 1;
    if (!h.cuentaCobrada) { h.cuentaCobrada = n; guardar(h); return null; } // la primera vez no se paga lo de antes: ya lo cobró jugando
    if (n <= ya) return null;
    const salida = { niveles: n - ya, oro: 0, aspectos: [] };
    for (let k = ya + 1; k <= n; k++) {
      salida.oro += 60;
      if (k % 5 === 0) { const id = ASPECTOS_CUENTA[(k / 5 - 1) % ASPECTOS_CUENTA.length]; if (darObjeto(id)) salida.aspectos.push(id); }
    }
    h.oro = (h.oro || 0) + salida.oro; h.cuentaCobrada = n; guardar(h);
    return salida;
  }

  // Nube: al entrar con cuenta, fusiona. Por facción, lo que más puntos tenga; el oro, el máximo; los objetos y las propias, juntos.
  function fusionar(deNube) {
    if (!deNube || typeof deNube !== "object") return leer();
    const nube = deNube.v === 2 ? deNube : migrar(deNube);
    const h = leer();
    // Cambios de facción hechos desde la base de datos (15 sep 2026), con permiso del jugador: la facción `de`
    // desaparece y todo su progreso pasa a `a`, como si hubiera jugado siempre con ella. Se aplican una sola vez
    // por aparato y se guardan en el héroe para que lleguen también a sus otros aparatos.
    const hechos = new Set(h.cambiosHechos || []);
    for (const c of (nube.cambios || []).concat(h.cambios || [])) {
      if (!c || !c.id || hechos.has(c.id) || !FWM.datosBase.facciones[c.a]) continue;
      const prog = h.facciones[c.de] || (nube.facciones || {})[c.de] || null;
      if (prog && (!h.facciones[c.a] || (h.facciones[c.a].puntos || 0) < (prog.puntos || 0))) h.facciones[c.a] = Object.assign(progresoVacio(), prog);
      delete h.facciones[c.de];
      h.propias = (h.propias || []).filter(x => x !== c.de); if (FWM.datosBase.facciones[c.a].pago && !h.propias.includes(c.a)) h.propias.push(c.a);
      if (h.faccion === c.de) h.faccion = c.a;
      hechos.add(c.id);
    }
    h.cambiosHechos = Array.from(hechos);
    h.cambios = Array.from(new Map((h.cambios || []).concat(nube.cambios || []).filter(c => c && c.id).map(c => [c.id, c])).values());
    const quitadas = new Set(h.cambios.map(c => c.de));
    for (const [f, p] of Object.entries(nube.facciones || {})) {
      if (quitadas.has(f)) continue; // la que se cambió no vuelve desde la nube
      const mio = h.facciones[f];
      if (!mio || (p.puntos || 0) > (mio.puntos || 0)) h.facciones[f] = Object.assign(progresoVacio(), p);
    }
    h.oro = Math.max(h.oro || 0, nube.oro || 0);
    h.puntosNube = Math.max(h.puntosNube || 0, nube.puntosNube || 0);
    h.inventario = Array.from(new Set((h.inventario || []).concat(nube.inventario || [])));
    h.propias = Array.from(new Set((h.propias || []).concat(nube.propias || []))).filter(x => !quitadas.has(x));
    h.cuentaCobrada = Math.max(h.cuentaCobrada || 0, nube.cuentaCobrada || 0);
    if (!Object.keys(h.facciones).length) h.faccion = nube.faccion || h.faccion;
    cache = h; try { localStorage.setItem(CLAVE, JSON.stringify(h)); } catch (e) { /* nada */ }
    return h;
  }

  // ---------- objetos, oro del héroe, premios ----------
  const O = () => FWM.datosBase.objetos || {};
  function tieneObjeto(id) { const h = leer(); return (h.inventario || []).includes(id) || Object.values(h.objetos || {}).includes(id); }
  // Da un objeto (botín, medalla, campaña, cuenta). Si ya lo tiene, devuelve false.
  function darObjeto(id) { if (!O()[id] || tieneObjeto(id)) return false; const h = leer(); h.inventario = (h.inventario || []).concat([id]); guardar(h); return true; }
  function darOro(n) { const h = leer(); h.oro = Math.max(0, (h.oro || 0) + Math.round(n)); guardar(h); return h.oro; }
  function equipar(id) {
    const o = O()[id]; const h = leer(); if (!o || !tieneObjeto(id)) return "no_tienes";
    h.objetos[o.tipo] = id; guardar(h); return null;
  }
  function desequipar(tipo) { const h = leer(); delete h.objetos[tipo]; guardar(h); }
  function comprar(id) {
    const o = O()[id]; const h = leer(); if (!o || !o.tienda) return "no_se_vende"; if (tieneObjeto(id)) return "ya_tienes"; if ((h.oro || 0) < o.tienda) return "sin_oro";
    h.oro -= o.tienda; h.inventario = (h.inventario || []).concat([id]); guardar(h); return null;
  }
  function consumir(id) { const h = leer(); h.inventario = (h.inventario || []).filter(x => x !== id); for (const k of Object.keys(h.objetos)) if (h.objetos[k] === id) delete h.objetos[k]; guardar(h); }
  // Recompensas al acabar una partida: oro, botín y premios de medallas nuevas. Devuelve lo dado para la ceremonia.
  function recompensas(res, nuevasMedallas, datos) {
    const R = FWM.datosBase.objetosReglas || {}; const ro = R.oro || {}; const rb = R.botin || {};
    const salida = { oro: 0, detalle: [], botin: null, botinOro: 0, medallas: [] };
    let oro = 0;
    if (!res.bancarrota) oro += Math.floor((res.oroFinal || 0) * (ro.porcentajeOroFinal || 0));
    if (res.gano) oro += ro.ganar || 0;
    if (res.tipo === "dia") oro += ro.dia || 0;
    if (res.tipo === "duelo" && res.rivalHumano) oro += ro.dueloHumano || 0;
    if (oro) { salida.oro += oro; salida.detalle.push({ texto: "partida", oro }); }
    for (const nm of nuevasMedallas || []) {
      const m = (datos.medallas || []).find(x => x.id === nm.id); if (!m || !m.premio) continue;
      const desde = nm.desde || 0; // niveles ganados de golpe: se pagan todos
      for (let n = desde + 1; n <= nm.nivel; n++) {
        const oroM = (m.premio.oro || [])[n - 1] || 0; if (oroM) { salida.oro += oroM; salida.medallas.push({ id: m.id, nivel: n, oro: oroM }); }
        if (m.premio.objeto && m.premio.objeto.nivel === n && darObjeto(m.premio.objeto.id)) salida.medallas.push({ id: m.id, nivel: n, objeto: m.premio.objeto.id });
      }
    }
    let p = res.gano ? (rb.gana || 0) : (rb.pierde || 0); if (res.tipo === "dia") p += rb.dia || 0; if (res.tipo === "duelo" && res.rivalHumano) p += rb.duelo || 0;
    if (Math.random() < p) {
      const raro = Math.random() < (rb.raro || 0);
      const posibles = Object.entries(O()).filter(([id, o]) => o.botin && !tieneObjeto(id) && (raro ? (o.rareza === "raro" || o.botin === "raro") : (o.rareza === "comun" && o.botin === true))).map(([id]) => id);
      const lista = posibles.length ? posibles : Object.entries(O()).filter(([id, o]) => o.botin && !tieneObjeto(id)).map(([id]) => id);
      if (lista.length) { const id = lista[Math.floor(Math.random() * lista.length)]; darObjeto(id); salida.botin = id; }
      else { salida.botinOro = rb.repetidoOro || 0; salida.oro += salida.botinOro; }
    }
    if (salida.oro) darOro(salida.oro);
    return salida;
  }

  function anotarPuntosNube(p) { const h = leer(); if (Number(p) > (h.puntosNube || 0)) { h.puntosNube = Number(p); guardar(h); } }
  function ponerLeyenda(si) { const h = leer(); if (!!h.leyenda !== !!si) { h.leyenda = !!si; guardar(h); } }
  // avisos de cuenta: una vez cada uno
  function avisado(clave) { const h = leer(); if (h.avisado[clave]) return true; h.avisado[clave] = true; guardar(h); return false; }
  // para las pruebas
  function olvidar() { cache = null; }

  return { leer, guardar, olvidar, PRECIO_ORO, PUNTOS_CUENTA, ASPECTOS_CUENTA,
    faccion, datosFaccion, clase, tiene, elegirFaccion, darFaccion, comprarConOro,
    puntos, puntosCuenta, nivel, nivelVisible, nivelJugable, mejorNivel, leyenda, subeDoble, anotarPartida, progreso, puntosMejoraGanados, puntosMejoraDisponibles, darPuntoExtra, mejorar,
    paraPartida, paraIA, nivelCuenta, oroInicialCuenta, cobrarCuenta, fusionar, anotarPuntosNube, ponerLeyenda, avisado,
    tieneObjeto, darObjeto, darOro, equipar, desequipar, comprar, consumir, recompensas };
})();
