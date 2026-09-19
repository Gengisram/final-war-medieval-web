// Stats derivados. Nunca se guarda un stat calculado en el estado:
// ataque = base + tecnologías + plus del asentamiento + terreno + habilidades.
window.FWM = window.FWM || {};

FWM.stats = (function () {
  function tieneTec(jugador, id) { return jugador.tecnologias.includes(id); }
  function nivelTec(jugador, id) { return jugador.nivelesTec[id] || (tieneTec(jugador, id) ? 1 : 0); }

  // Todos los efectos activos de un jugador (tecnologías por nivel + bonos de bando).
  function efectos(estado, datos, jugadorId) {
    const j = estado.jugadores[jugadorId];
    const lista = [];
    for (const id of j.tecnologias) {
      const t = datos.tecnologias[id]; if (!t) continue;
      const n = nivelTec(j, id);
      for (const e of t.efectos || []) for (let i = 0; i < n; i++) lista.push(e);
    }
    // con facción, el rasgo lo pone la facción; sin ella (reinos de la máquina en las grandes batallas), el bando
    const fac = j.faccion && datos.facciones && datos.facciones[j.faccion];
    if (fac) for (const e of fac.rasgo.efectos || []) lista.push(e);
    else { const bando = datos.bandos[j.bando]; for (const e of (bando && bando.bonos) || []) lista.push(e); }
    // mejoras de reino del héroe (leva, armero, cantero)
    if (j.heroe && FWM.heroes) {
      const ef = FWM.heroes.efectosDe(j.heroe);
      if (ef.costeCampesino) lista.push({ tipo: "coste_tropa", tropa: "campesino", recurso: "oro", valor: ef.costeCampesino });
      if (ef.costeArmados) { lista.push({ tipo: "coste_tropa", tropa: "espadachin", recurso: "oro", valor: ef.costeArmados }); lista.push({ tipo: "coste_tropa", tropa: "lancero", recurso: "oro", valor: ef.costeArmados }); }
      if (ef.murallas) for (const tipo of Object.keys(datos.asentamientos)) lista.push({ tipo: "asentamiento", asentamiento: tipo, prop: "integridad", valor: ef.murallas });
    }
    // bonos limitados a un modo (solo oro / con recursos)
    return lista.filter(e => !e.modo || (e.modo === "soloOro" ? !!estado.soloOro : !estado.soloOro));
  }

  // Nivel de experiencia (índice en reglas.experiencia.niveles) según los puntos de la tropa.
  function nivelExperiencia(datos, tropa) {
    const ex = datos.reglas && datos.reglas.experiencia; if (!ex) return 0;
    let n = 0;
    ex.niveles.forEach((niv, i) => { if ((tropa.xp || 0) >= niv.umbral) n = i; });
    return n;
  }

  // opciones.sinPlus: sin el plus de las murallas (salida desde la guarnición).
  function statTropa(estado, datos, tropa, nombre, opciones) {
    const def = FWM.facciones ? FWM.facciones.defDe(estado, datos, tropa) : datos.tropas[tropa.tipo]; // la unidad propia suma lo de su nivel
    let valor = def.stats[nombre] || 0;
    const ex = datos.reglas && datos.reglas.experiencia;
    if (ex && (nombre === "ataque" || nombre === "defensa")) valor += ex.niveles[nivelExperiencia(datos, tropa)][nombre] || 0;
    for (const e of efectos(estado, datos, tropa.dueno)) {
      if (e.tipo === "stat" && e.stat === nombre && (e.tropa ? e.tropa === tropa.tipo : (e.etiqueta === "*" || def.etiquetas.includes(e.etiqueta)))) valor += e.valor;
    }
    if (nombre === "defensa" && tropa.acuarteladaEn && !(opciones && opciones.sinPlus)) {
      const a = estado.asentamientos[tropa.acuarteladaEn];
      if (a && a.integridad > 0) valor += propAsentamiento(estado, datos, a, "plusDefensa");
    }
    if (nombre === "defensa" && tropa.estados && tropa.estados.includes("atrincherada")) {
      valor += (datos.reglas && datos.reglas.atrincherar ? datos.reglas.atrincherar.defensa : 0);
    }
    // terreno: solo para tropas en campo abierto (las acuarteladas ya tienen las murallas)
    if (tropa.hex && estado.mapa.hexes[tropa.hex]) {
      const terr = datos.terrenos[estado.mapa.hexes[tropa.hex].terreno];
      const mods = (terr && terr.modificadores) || {};
      if (nombre === "defensa" && mods.defensa) valor += mods.defensa;
      if (nombre === "alcance" && mods.alcanceDistancia && def.stats.alcance > 0) valor += mods.alcanceDistancia;
    }
    // el héroe: sus propias mejoras y la furia del nórdico; las demás tropas: el aura de su héroe y los caminos
    valor += statHeroe(estado, datos, tropa, nombre, def);
    // la facción: rasgo de casa, poder del líder en marcha y habilidades de la unidad propia
    valor += statFaccion(estado, datos, tropa, nombre, def);
    // terreno (v1: sin modificadores) y habilidades: ganchos
    valor += FWM.ganchos.modificador("stat", estado, { datos, tropa, nombre });
    if (nombre === "movimiento" && (def.stats.movimiento || 0) > 0) valor = Math.max(1, valor); // el Invierno frena, pero nadie se queda clavado
    return valor;
  }

  // Parte de la facción en un stat (13 sep 2026): Tierra de frontera (Castilla), el poder del líder mientras dura,
  // el caballero de Santiago firme junto a sus pueblos y su aura de maestro, y la furia del berserker.
  function statFaccion(estado, datos, tropa, nombre, def) {
    const j = estado.jugadores[tropa.dueno]; if (!j) return 0;
    let v = 0;
    const pos = tropa.hex || tropa.acuarteladaEn;
    if (j.faccion && FWM.facciones) {
      const casa = FWM.facciones.rasgo(estado, tropa.dueno, "stat_casa");
      if (casa && casa.stat === nombre && pos && estado.mapa.hexes[pos] && estado.mapa.hexes[pos].dueno === tropa.dueno) v += casa.valor;
      const pa = j.poderActivo && datos.facciones[j.faccion] && datos.facciones[j.faccion].poder.id === j.poderActivo.id ? datos.facciones[j.faccion].poder.efecto : null;
      if (pa && pa[nombre] && (nombre !== "movimiento") && (!pa.etiqueta || (def.etiquetas || []).includes(pa.etiqueta)) && (nombre !== "alcance" || (def.stats.alcance || 0) > 0)) v += pa[nombre];
    }
    // Hijos del bosque (eslavos): + defensa en bosque y colina; el guardián del bosque suma lo suyo
    if (nombre === "defensa" && pos && estado.mapa.hexes[pos] && !tropa.acuarteladaEn) {
      const ter = estado.mapa.hexes[pos].terreno;
      const dt = j.faccion && FWM.facciones && FWM.facciones.rasgo(estado, tropa.dueno, "defensa_terreno");
      if (dt && dt.terrenos.includes(ter)) v += dt.valor;
      if (def.defensaTerreno && def.defensaTerreno.terrenos.includes(ter)) v += def.defensaTerreno.valor;
    }
    // Invierno (eslavos): mientras dure, las tropas de sus enemigos mueven menos
    if (nombre === "movimiento" && FWM.facciones) {
      for (const p of estado.jugadores) {
        if (!p.poderActivo || !p.faccion || p.id === tropa.dueno) continue;
        const ef = datos.facciones[p.faccion] && datos.facciones[p.faccion].poder.id === p.poderActivo.id ? datos.facciones[p.faccion].poder.efecto : null;
        if (ef && ef.inviernoEnemigos && FWM.estado.enemigos(estado, p.id, tropa.dueno)) v -= ef.inviernoEnemigos;
      }
    }
    if (nombre === "defensa" && def.firme && pos) {
      if (tropa.acuarteladaEn) v += def.firme;
      else if (FWM.hex.vecinos(pos).some(k => estado.asentamientos[k] && estado.asentamientos[k].dueno === tropa.dueno)) v += def.firme;
    }
    if (nombre === "ataque" && def.furia && !def.heroe) {
      const perdida = Math.max(0, statTropa(estado, datos, tropa, "vida") - tropa.vida);
      v += Math.min(def.furia.tope, Math.floor(perdida / def.furia.porVida) * def.furia.valor);
    }
    // maestro de Santiago: +defensa a las tropas propias pegadas (solo si la facción tiene alguna unidad con aura)
    if (nombre === "defensa" && pos && j.faccion && FWM.facciones && FWM.facciones.nivelDe(j) >= FWM.facciones.MAESTRA) {
      const unidad = datos.facciones[j.faccion] && datos.facciones[j.faccion].unidad; const du = unidad && FWM.facciones.defNivel(datos, unidad, j.nivel);
      if (du && du.auraDefensa) {
        for (const x of Object.values(estado.tropas)) {
          if (x.dueno !== tropa.dueno || x.id === tropa.id || x.tipo !== unidad || !x.hex) continue;
          if (FWM.hex.distancia(x.hex, pos) === 1) { v += du.auraDefensa; break; }
        }
      }
    }
    return v;
  }

  // Parte del héroe en un stat. Para el propio héroe: mejoras (vida, ataque, defensa, movimiento) y furia.
  // Para el resto de tropas del jugador: aura del héroe (si está vivo y fuera de guarnición, a su alcance) y caminos.
  function statHeroe(estado, datos, tropa, nombre, def) {
    const j = estado.jugadores[tropa.dueno]; if (!j || !j.heroe || !FWM.heroes) return 0;
    const ef = FWM.heroes.efectosDe(j.heroe);
    let v = 0;
    if (def.heroe) {
      if (nombre === "vida" || nombre === "ataque" || nombre === "defensa" || nombre === "movimiento" || nombre === "asedio") v += ef[nombre] || 0;
      const clase = datos.heroes.clases[def.heroe];
      if (nombre === "ataque" && clase && clase.furia) { const max = def.stats.vida + (ef.vida || 0); const perdida = Math.max(0, max - tropa.vida); v += Math.min(clase.furia.tope, Math.floor(perdida / clase.furia.porVida) * clase.furia.valor); }
      return v;
    }
    if (nombre === "movimiento" && ef.movimientoCasa && tropa.hex && estado.mapa.hexes[tropa.hex] && estado.mapa.hexes[tropa.hex].dueno === tropa.dueno) v += ef.movimientoCasa;
    // aura del Kan: los jinetes pegados a él mueven más
    if (nombre === "movimiento" && (def.etiquetas || []).includes("montada")) { const aura = auraSobre(estado, datos, tropa); if (aura && aura.movimientoMontada) v += aura.movimientoMontada; }
    // escudo del blasón: +defensa a las tropas acuarteladas con el héroe
    if (nombre === "defensa" && ef.guarnicionDefensa && tropa.acuarteladaEn && j.heroeTropa) { const h = estado.tropas[j.heroeTropa]; if (h && h.acuarteladaEn === tropa.acuarteladaEn) v += ef.guarnicionDefensa; }
    if (nombre === "ataque" || nombre === "defensa") {
      const aura = auraSobre(estado, datos, tropa);
      if (aura) {
        if (nombre === "defensa") { v += aura.defensa; if (aura.atrincherada && tropa.estados && tropa.estados.includes("atrincherada")) v += aura.atrincherada; }
        if (nombre === "ataque") { v += aura.ataque; if (aura.ataqueDistancia && (def.stats.alcance || 0) > 0) v += aura.ataqueDistancia; }
      }
    }
    return v;
  }
  // El héroe vivo del dueño de la tropa, si está en campo abierto y a su alcance: devuelve su aura o null.
  function auraSobre(estado, datos, tropa) {
    const j = estado.jugadores[tropa.dueno]; if (!j || !j.heroe || !j.heroeTropa) return null;
    const h = estado.tropas[j.heroeTropa]; if (!h || h.id === tropa.id || !h.hex) return null;
    const pos = tropa.hex || tropa.acuarteladaEn; if (!pos) return null;
    const aura = FWM.heroes.auraDe(j.heroe);
    return FWM.hex.distancia(h.hex, pos) <= aura.alcance ? aura : null;
  }

  function propAsentamiento(estado, datos, asent, prop) {
    const def = datos.asentamientos[asent.tipo];
    let valor = def[prop] || 0;
    for (const e of efectos(estado, datos, asent.dueno)) {
      if (e.tipo === "asentamiento" && e.asentamiento === asent.tipo && e.prop === prop) valor += e.valor;
    }
    return valor;
  }

  function produccionAsentamiento(estado, datos, asent) {
    const def = datos.asentamientos[asent.tipo];
    const p = Object.assign({}, def.produce);
    for (const e of efectos(estado, datos, asent.dueno)) {
      if (e.tipo === "produccion_asentamiento" && e.asentamientos.includes(asent.tipo)) p[e.recurso] = (p[e.recurso] || 0) + e.valor;
    }
    return p;
  }

  function produccionYacimiento(estado, datos, jugadorId, yacId) {
    const def = datos.yacimientos[yacId];
    const p = Object.assign({}, def.produce);
    for (const e of efectos(estado, datos, jugadorId)) {
      if (e.tipo === "produccion_yacimiento" && e.yacimiento === yacId) p[e.recurso] = (p[e.recurso] || 0) + e.valor;
    }
    return p;
  }

  function vidaMax(estado, datos, tropa) { return statTropa(estado, datos, tropa, "vida"); }

  // Defensa extra del defensor contra las etiquetas del atacante: { valor, contra: "a_distancia" } o null.
  // Con estado, el héroe suma su Coraza contra tropas a distancia.
  const fichaDe = (estado, datos, tropa) => (estado && FWM.facciones ? FWM.facciones.defDe(estado, datos, tropa) : datos.tropas[tropa.tipo]);
  function defensaContra(datos, atacante, defensor, estado) {
    const dc = Object.assign({}, fichaDe(estado, datos, defensor).defensaContra || {});
    if (estado && datos.tropas[defensor.tipo].heroe && FWM.heroes) { const ef = FWM.heroes.efectosDe(estado.jugadores[defensor.dueno].heroe); if (ef.defensaDistancia) dc.a_distancia = (dc.a_distancia || 0) + ef.defensaDistancia; }
    const et = datos.tropas[atacante.tipo].etiquetas || [];
    let mejor = null;
    for (const [etiqueta, valor] of Object.entries(dc)) if (et.includes(etiqueta) && (!mejor || valor > mejor.valor)) mejor = { valor, contra: etiqueta };
    return mejor;
  }
  // Ataque extra del atacante contra las etiquetas del defensor: { valor, contra: "lanza" } o null.
  // Con estado, el héroe suma los bonos de sus objetos (lanza larga).
  function bonoContra(datos, atacante, defensor, estado) {
    const fa = fichaDe(estado, datos, atacante);
    const bonos = Object.assign({}, fa.bonos || {});
    if (estado && datos.tropas[atacante.tipo].heroe && FWM.heroes) { const ef = FWM.heroes.efectosDe(estado.jugadores[atacante.dueno].heroe); for (const [et, v] of Object.entries(ef.bonos || {})) bonos[et] = (bonos[et] || 0) + v; }
    const et = datos.tropas[defensor.tipo].etiquetas || [];
    let mejor = null;
    for (const [etiqueta, valor] of Object.entries(bonos)) if (et.includes(etiqueta) && (!mejor || valor > mejor.valor)) mejor = { valor, contra: etiqueta };
    // arquero a caballo maestro: +ataque contra tropas heridas (se suma al mejor bono de etiqueta)
    if (estado && fa.contraHeridos && defensor.vida < vidaMax(estado, datos, defensor)) mejor = { valor: (mejor ? mejor.valor : 0) + fa.contraHeridos, contra: mejor ? mejor.contra : "heridas" };
    return mejor;
  }

  // Coste de reclutar una tropa para un jugador (con descuentos de bando/tecnología).
  function costeTropa(estado, datos, jugadorId, tipo) {
    const c = Object.assign({}, datos.tropas[tipo].coste);
    for (const e of efectos(estado, datos, jugadorId)) {
      if (e.tipo === "coste_tropa" && e.tropa === tipo) c[e.recurso] = Math.max(0, (c[e.recurso] || 0) + e.valor);
    }
    return soloOro(estado, c);
  }
  // En partidas de solo oro, cualquier coste se queda solo con su parte de oro.
  function soloOro(estado, c) { return estado.soloOro ? { oro: c.oro || 0 } : c; }

  // Coste de construir o mejorar a un asentamiento.
  function costeAsentamiento(estado, datos, jugadorId, tipo) {
    const c = Object.assign({}, datos.asentamientos[tipo].coste);
    for (const e of efectos(estado, datos, jugadorId)) {
      if (e.tipo === "coste_asentamiento" && e.asentamiento === tipo) {
        if (e.factor != null) c[e.recurso] = Math.ceil((c[e.recurso] || 0) * e.factor);
        if (e.valor != null) c[e.recurso] = Math.max(0, (c[e.recurso] || 0) + e.valor);
      }
    }
    return soloOro(estado, c);
  }

  function factorExperiencia(estado, datos, jugadorId) {
    let f = 1;
    for (const e of efectos(estado, datos, jugadorId)) if (e.tipo === "experiencia_factor") f *= e.valor;
    return f;
  }

  // Ataque con el que golpea de verdad: una tropa herida pega más flojo.
  function ataqueEfectivo(estado, datos, tropa) {
    const base = statTropa(estado, datos, tropa, "ataque");
    if (!datos.reglas || !datos.reglas.heridasReducenAtaque) return base;
    const max = vidaMax(estado, datos, tropa);
    if (max <= 0) return base;
    return Math.max(1, Math.round(base * Math.max(0, tropa.vida) / max));
  }

  function tecDisponible(estado, datos, jugador, id) {
    const t = datos.tecnologias[id];
    if (!t) return false;
    if (tieneTec(jugador, id) && !t.repetible) return false;
    return (t.requiere || []).every(r => tieneTec(jugador, r));
  }

  function costeTec(datos, jugador, id) {
    const t = datos.tecnologias[id];
    const n = nivelTec(jugador, id);
    if (!t.repetible || !t.costeCrecimiento || n === 0) return t.coste;
    const c = {};
    for (const k of Object.keys(t.coste)) c[k] = Math.ceil(t.coste[k] * Math.pow(t.costeCrecimiento[k] || 1, n));
    return c;
  }

  return { tieneTec, nivelTec, efectos, statTropa, auraSobre, propAsentamiento, produccionAsentamiento, produccionYacimiento, vidaMax, ataqueEfectivo, tecDisponible, costeTec, nivelExperiencia, costeTropa, costeAsentamiento, factorExperiencia, bonoContra, defensaContra };
})();

// Ganchos: puntos donde se enchufan reglas nuevas sin tocar el resto.
// FWM.ganchos.registrar("antesGolpe", fn). fn(estado, contexto) puede devolver un número (modificador) o nada.
FWM.ganchos = (function () {
  const lista = {};
  function registrar(momento, fn) { (lista[momento] = lista[momento] || []).push(fn); }
  function modificador(momento, estado, contexto) {
    let total = 0;
    for (const fn of lista[momento] || []) { const v = fn(estado, contexto); if (typeof v === "number") total += v; }
    return total;
  }
  function avisar(momento, estado, contexto) { for (const fn of lista[momento] || []) fn(estado, contexto); }
  function limpiar() { for (const k of Object.keys(lista)) delete lista[k]; }
  return { registrar, modificador, avisar, limpiar };
})();

// Habilidades: registro de tipos. Una tropa declara { tipo, ...parámetros, condicion }.
// En v1 el registro existe y está vacío.
FWM.habilidades = (function () {
  const tipos = {};
  const condiciones = {};
  function registrarTipo(nombre, def) { tipos[nombre] = def; }
  function registrarCondicion(nombre, fn) { condiciones[nombre] = fn; }
  function activa(estado, contexto, hab) {
    if (!hab.condicion) return true;
    const fn = condiciones[hab.condicion];
    return fn ? fn(estado, contexto, hab) : false;
  }
  return { tipos, condiciones, registrarTipo, registrarCondicion, activa };
})();
