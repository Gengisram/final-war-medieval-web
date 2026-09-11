// Territorio: conectividad, capital, zonas aisladas y huchas locales.
window.FWM = window.FWM || {};

FWM.territorio = (function () {
  const H = () => FWM.hex;

  // Componentes conexos de los hexágonos de un jugador.
  function componentes(estado, jugadorId) {
    const visto = new Set();
    const lista = [];
    for (const [k, h] of Object.entries(estado.mapa.hexes)) {
      if (h.dueno !== jugadorId || visto.has(k)) continue;
      const comp = new Set();
      const cola = [k]; visto.add(k);
      while (cola.length) {
        const c = cola.pop(); comp.add(c);
        for (const v of H().vecinos(c)) {
          const hv = estado.mapa.hexes[v];
          if (hv && hv.dueno === jugadorId && !visto.has(v)) { visto.add(v); cola.push(v); }
        }
      }
      lista.push(comp);
    }
    return lista;
  }

  // Zonas: { reino: Set, aisladas: [{ hexes, asentamientos }], sinHucha: [Set] }
  function zonas(estado, jugadorId) {
    const j = estado.jugadores[jugadorId];
    const r = { reino: new Set(), aisladas: [], sinHucha: [] };
    for (const comp of componentes(estado, jugadorId)) {
      const asents = [...comp].filter(k => estado.asentamientos[k] && estado.asentamientos[k].dueno === jugadorId).sort();
      if (j.capital && comp.has(j.capital)) r.reino = comp;
      else if (asents.length) r.aisladas.push({ hexes: comp, asentamientos: asents });
      else r.sinHucha.push(comp);
    }
    return r;
  }

  // Hucha que corresponde a un hexágono (para pagar o ingresar allí).
  function huchaDe(estado, datos, jugadorId, hex, z) {
    z = z || zonas(estado, jugadorId);
    const j = estado.jugadores[jugadorId];
    if (!hex || z.reino.has(hex)) return j.hucha;
    for (const zona of z.aisladas) {
      if (zona.hexes.has(hex)) {
        const a = estado.asentamientos[zona.asentamientos[0]];
        if (!a.huchaLocal) a.huchaLocal = FWM.util.huchaVacia(datos);
        return a.huchaLocal;
      }
    }
    return j.hucha;
  }

  // Al inicio de turno: fusiona huchas locales que hayan reconectado
  // y consolida las de cada zona aislada en su primer asentamiento.
  function consolidar(estado, datos, jugadorId) {
    const j = estado.jugadores[jugadorId];
    const z = zonas(estado, jugadorId);
    for (const k of z.reino) {
      const a = estado.asentamientos[k];
      if (a && a.dueno === jugadorId && a.huchaLocal) { FWM.util.ingresar(j.hucha, a.huchaLocal); a.huchaLocal = null; }
    }
    for (const zona of z.aisladas) {
      const principal = estado.asentamientos[zona.asentamientos[0]];
      if (!principal.huchaLocal) principal.huchaLocal = FWM.util.huchaVacia(datos);
      for (const k of zona.asentamientos.slice(1)) {
        const a = estado.asentamientos[k];
        if (a.huchaLocal) { FWM.util.ingresar(principal.huchaLocal, a.huchaLocal); a.huchaLocal = null; }
      }
    }
    // asentamientos en zonas sin conexión ni capital: no debería pasar (tienen asentamiento => aislada)
    return z;
  }

  // Si la capital ya no es del jugador, elegir otra.
  function revisarCapital(estado, datos, jugadorId) {
    const j = estado.jugadores[jugadorId];
    const cap = j.capital && estado.asentamientos[j.capital];
    if (cap && cap.dueno === jugadorId) return;
    let mejor = null, mejorOro = -1;
    for (const { hex, a } of FWM.estado.asentamientosDe(estado, jugadorId)) {
      const oro = FWM.stats.produccionAsentamiento(estado, datos, a).oro || 0;
      if (oro > mejorOro) { mejorOro = oro; mejor = hex; }
    }
    j.capital = mejor;
  }

  function esCapital(estado, hex) {
    const a = estado.asentamientos[hex];
    return !!a && estado.jugadores[a.dueno].capital === hex;
  }

  return { componentes, zonas, huchaDe, consolidar, revisarCapital, esCapital };
})();
