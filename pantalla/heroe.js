// El héroe del jugador fuera de la partida: clase elegida, puntos de mejora gastados, nivel por puntos
// acumulados, guardado en el aparato (fwm.heroe) y en la nube (perfiles.heroe) cuando hay cuenta.
// Los cálculos puros están en FWM.heroes (datos/base/heroes.js).
window.FWM = window.FWM || {};

FWM.heroe = (function () {
  const CLAVE = "fwm.heroe";
  let cache = null;

  function vacio() { return { clase: "espadachin", mejoras: {}, oro: 0, objetos: {}, inventario: [], puntosNube: 0, leyenda: false, avisado: {} }; }
  function leer() {
    if (cache) return cache;
    try { cache = Object.assign(vacio(), JSON.parse(localStorage.getItem(CLAVE) || "{}")); } catch (e) { cache = vacio(); }
    if (!FWM.datosBase.heroes.clases[cache.clase]) cache.clase = "espadachin";
    return cache;
  }
  function guardar(h) {
    cache = h;
    try { localStorage.setItem(CLAVE, JSON.stringify(h)); } catch (e) { /* nada */ }
    if (FWM.nube && FWM.nube.usuario && FWM.nube.usuario()) FWM.nube.guardarHeroe(h).catch(() => {});
    return h;
  }

  // Puntos acumulados: el mayor entre el aparato y la nube (la nube manda si hay cuenta; el local se puede borrar).
  function puntos() {
    const r = FWM.guardado.records(); const h = leer();
    return Math.max(r.puntosTotal || 0, h.puntosNube || 0);
  }
  function nivel() { return leer().leyenda ? 8 : FWM.heroes.nivelPorPuntos(puntos()); }
  function nivelJugable() { return Math.min(7, nivel()); }
  function puntosMejoraGanados() { return FWM.heroes.puntosMejoraPorPuntos(puntos()) + (leer().puntosExtra || 0); }
  // Puntos regalados (el primero, en la bienvenida). Solo una vez por clave.
  function darPuntoExtra(n) { const h = leer(); if (h.extraDado) return false; h.extraDado = true; h.puntosExtra = (h.puntosExtra || 0) + (n || 1); guardar(h); return true; }
  function puntosMejoraDisponibles() { return Math.max(0, puntosMejoraGanados() - FWM.heroes.puntosGastados(leer())); }
  // Progreso hacia el siguiente nivel y el siguiente punto: { nivel, siguienteNivel, puntosNivel, puntosSiguiente, puntoActual, puntoSiguiente }
  function progreso() {
    const p = puntos(); const n = nivelJugable(); const D = FWM.datosBase.heroes;
    const sig = D.niveles.find(x => x.nivel === n + 1 && x.puntos != null);
    const ganados = puntosMejoraGanados();
    return { puntos: p, nivel: n, nombre: FWM.heroes.nombreNivel(nivel()), siguienteNivel: sig || null, desdeNivel: FWM.heroes.datosNivel(n).puntos || 0,
      puntosMejora: ganados, disponibles: puntosMejoraDisponibles(), umbralAnterior: ganados ? FWM.heroes.umbralPunto(ganados) : 0, umbralSiguiente: ganados < D.puntosMejora.maximo ? FWM.heroes.umbralPunto(ganados + 1) : null };
  }

  function cambiarClase(clase) { const h = leer(); if (!FWM.datosBase.heroes.clases[clase]) return h; h.clase = clase; guardar(h); return h; }
  // Gasta un punto en una cadena. Devuelve null si va bien o el motivo.
  function mejorar(id) {
    const h = leer(); h.nivel = nivelJugable();
    if (puntosMejoraDisponibles() <= 0) return "sin_puntos";
    const m = FWM.heroes.puedeMejorar(h, id); if (m) return m;
    h.mejoras[id] = (h.mejoras[id] || 0) + 1; guardar(h); return null;
  }

  // Lo que va a la partida: { clase, nivel, mejoras }. En el mapa del día todos a nivel 1 y sin mejoras.
  function paraPartida(op) {
    const h = leer();
    const objetos = {}; for (const [k, v] of Object.entries(h.objetos || {})) if (k !== "consumible" && k !== "aspecto" && O()[v]) objetos[k] = v;
    const pocima = !!(h.objetos && h.objetos.consumible === "pocima" && tiene("pocima"));
    if (op && op.tipo === "dia") return { clase: h.clase, nivel: 1, mejoras: {}, objetos: {}, pocima: false };
    return { clase: h.clase, nivel: nivelJugable(), mejoras: Object.assign({}, h.mejoras), objetos, pocima, aspecto: h.objetos && h.objetos.aspecto };
  }
  // Héroe de una IA al nivel del humano, con los mismos puntos gastados, repartidos al azar.
  function paraIA(semilla, nivelH, gastados, clase) { return FWM.heroes.heroeIA(nivelH, gastados, FWM.azar.crear(semilla), clase); }

  // Nube: al entrar con cuenta, fusiona (gana quien tiene más puntos gastados; el oro y objetos, el máximo).
  function fusionar(deNube) {
    if (!deNube || typeof deNube !== "object") return leer();
    const h = leer();
    const gL = FWM.heroes.puntosGastados(h), gN = FWM.heroes.puntosGastados(deNube);
    const base = gN > gL ? Object.assign(vacio(), deNube) : h;
    base.oro = Math.max(h.oro || 0, deNube.oro || 0);
    base.puntosNube = Math.max(h.puntosNube || 0, deNube.puntosNube || 0);
    cache = base; try { localStorage.setItem(CLAVE, JSON.stringify(base)); } catch (e) { /* nada */ }
    return base;
  }
  // ---------- objetos, oro del héroe, premios ----------
  const O = () => FWM.datosBase.objetos || {};
  function tiene(id) { const h = leer(); return (h.inventario || []).includes(id) || Object.values(h.objetos || {}).includes(id); }
  // Da un objeto (botín, medalla, campaña). Si ya lo tiene, devuelve false.
  function darObjeto(id) { if (!O()[id] || tiene(id)) return false; const h = leer(); h.inventario = (h.inventario || []).concat([id]); guardar(h); return true; }
  function darOro(n) { const h = leer(); h.oro = Math.max(0, (h.oro || 0) + Math.round(n)); guardar(h); return h.oro; }
  function equipar(id) {
    const o = O()[id]; const h = leer(); if (!o || !tiene(id)) return "no_tienes";
    if (o.tipo === "consumible" || o.tipo === "aspecto") { h.objetos[o.tipo] = id; }
    else h.objetos[o.tipo] = id;
    guardar(h); return null;
  }
  function desequipar(tipo) { const h = leer(); delete h.objetos[tipo]; guardar(h); }
  function comprar(id) {
    const o = O()[id]; const h = leer(); if (!o || !o.tienda) return "no_se_vende"; if (tiene(id)) return "ya_tienes"; if ((h.oro || 0) < o.tienda) return "sin_oro";
    h.oro -= o.tienda; h.inventario = (h.inventario || []).concat([id]); guardar(h); return null;
  }
  function consumir(id) { const h = leer(); h.inventario = (h.inventario || []).filter(x => x !== id); for (const k of Object.keys(h.objetos)) if (h.objetos[k] === id) delete h.objetos[k]; guardar(h); }
  // Recompensas al acabar una partida: oro, botín y premios de medallas nuevas. Devuelve lo dado para la ceremonia.
  function recompensas(res, nuevasMedallas, datos) {
    const R = FWM.datosBase.objetosReglas || {}; const ro = R.oro || {}; const rb = R.botin || {};
    const salida = { oro: 0, detalle: [], botin: null, botinOro: 0, medallas: [] };
    // oro del héroe por la partida
    let oro = 0;
    if (!res.bancarrota) oro += Math.floor((res.oroFinal || 0) * (ro.porcentajeOroFinal || 0));
    if (res.gano) oro += ro.ganar || 0;
    if (res.tipo === "dia") oro += ro.dia || 0;
    if (res.tipo === "duelo" && res.rivalHumano) oro += ro.dueloHumano || 0;
    if (oro) { salida.oro += oro; salida.detalle.push({ texto: "partida", oro }); }
    // medallas con premio
    for (const nm of nuevasMedallas || []) {
      const m = (datos.medallas || []).find(x => x.id === nm.id); if (!m || !m.premio) continue;
      const desde = nm.desde || 0; // niveles ganados de golpe: se pagan todos
      for (let n = desde + 1; n <= nm.nivel; n++) {
        const oroM = (m.premio.oro || [])[n - 1] || 0; if (oroM) { salida.oro += oroM; salida.medallas.push({ id: m.id, nivel: n, oro: oroM }); }
        if (m.premio.objeto && m.premio.objeto.nivel === n && darObjeto(m.premio.objeto.id)) salida.medallas.push({ id: m.id, nivel: n, objeto: m.premio.objeto.id });
      }
    }
    // botín
    let p = res.gano ? (rb.gana || 0) : (rb.pierde || 0); if (res.tipo === "dia") p += rb.dia || 0; if (res.tipo === "duelo" && res.rivalHumano) p += rb.duelo || 0;
    if (Math.random() < p) {
      const raro = Math.random() < (rb.raro || 0);
      const posibles = Object.entries(O()).filter(([id, o]) => o.botin && !tiene(id) && (raro ? (o.rareza === "raro" || o.botin === "raro") : (o.rareza === "comun" && o.botin === true))).map(([id]) => id);
      const lista = posibles.length ? posibles : Object.entries(O()).filter(([id, o]) => o.botin && !tiene(id)).map(([id]) => id);
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

  return { leer, guardar, puntos, nivel, nivelJugable, progreso, puntosMejoraGanados, puntosMejoraDisponibles, darPuntoExtra, cambiarClase, mejorar, paraPartida, paraIA, fusionar, anotarPuntosNube, ponerLeyenda, avisado, tiene, darObjeto, darOro, equipar, desequipar, comprar, consumir, recompensas };
})();
