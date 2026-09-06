// Eliminación y fin de partida.
window.FWM = window.FWM || {};

FWM.victoria = (function () {
  // Puntos de un jugador (para el límite de turnos y para verlo en Reino).
  // De dónde sale cada punto: lista de { texto, puntos } (para el tooltip de la pestaña Reino).
  function desglose(estado, datos, jugadorId) {
    const j = estado.jugadores[jugadorId]; const T = datos.textos || {};
    if (!j || j.eliminado) return [];
    const P = (datos.reglas && datos.reglas.puntos) || { pueblo: 10, ciudad: 20, castillo: 15, yacimiento: 2, oroPor: 10, tecnologia: 5 };
    const filas = [];
    const porTipo = {};
    for (const { a } of FWM.estado.asentamientosDe(estado, jugadorId)) porTipo[a.tipo] = (porTipo[a.tipo] || 0) + 1;
    for (const [tipo, n] of Object.entries(porTipo)) filas.push({ texto: n + " × " + datos.asentamientos[tipo].nombre.toLowerCase(), puntos: n * (P[tipo] || 10) });
    const z = FWM.territorio.zonas(estado, jugadorId);
    const porYac = {};
    for (const [k, h] of Object.entries(estado.mapa.hexes)) {
      if (h.dueno !== jugadorId || !h.yacimiento) continue;
      const v = P[h.yacimiento] != null ? P[h.yacimiento] : ((z.reino.has(k) || z.aisladas.some(zz => zz.hexes.has(k))) ? P.yacimiento : 0);
      if (!v) continue;
      porYac[h.yacimiento] = porYac[h.yacimiento] || { n: 0, p: 0 }; porYac[h.yacimiento].n++; porYac[h.yacimiento].p += v;
    }
    for (const [id, x] of Object.entries(porYac)) filas.push({ texto: x.n + " × " + datos.yacimientos[id].nombre.toLowerCase(), puntos: x.p });
    if (P.hexagono) { const nh = Object.values(estado.mapa.hexes).filter(h => h.dueno === jugadorId).length; if (nh) filas.push({ texto: nh + " " + (T.hexagonos || "hexágonos").toLowerCase() + " (" + P.hexagono + " cada uno)", puntos: nh * P.hexagono }); }
    const tropas = FWM.estado.tropasDe(estado, jugadorId);
    if (tropas.length) filas.push({ texto: tropas.length + " " + (T.tropas || "tropas").toLowerCase() + " (" + (T.mantenimiento || "mantenimiento").toLowerCase() + ")", puntos: tropas.reduce((s, t) => s + datos.tropas[t.tipo].mantenimiento, 0) });
    const st = estado.estadisticas && estado.estadisticas[jugadorId];
    if (st && P.baja && st.matadas) filas.push({ texto: st.matadas + " " + (T.matadas || "bajas causadas").toLowerCase() + " (" + P.baja + " cada una)", puntos: st.matadas * P.baja });
    if (st && P.heroe && st.heroesMatados) filas.push({ texto: st.heroesMatados + " " + (T.heroesMatados || "héroes abatidos").toLowerCase() + " (+" + P.heroe + ")", puntos: st.heroesMatados * P.heroe });
    const oro = Math.floor((j.hucha.oro || 0) / P.oroPor);
    if (oro) filas.push({ texto: (j.hucha.oro || 0) + " oro (1 por " + P.oroPor + ")", puntos: oro });
    if (estado.modoTec !== "todo" && j.tecnologias.length) filas.push({ texto: j.tecnologias.length + " " + (T.tecnologias || "tecnologías").toLowerCase(), puntos: j.tecnologias.length * P.tecnologia });
    return filas;
  }

  function puntos(estado, datos, jugadorId) {
    const j = estado.jugadores[jugadorId];
    if (!j || j.eliminado) return 0;
    const P = (datos.reglas && datos.reglas.puntos) || { pueblo: 10, ciudad: 20, castillo: 15, yacimiento: 2, oroPor: 10, tecnologia: 5 };
    let p = 0;
    for (const { a } of FWM.estado.asentamientosDe(estado, jugadorId)) p += P[a.tipo] || 10;
    const z = FWM.territorio.zonas(estado, jugadorId);
    for (const [k, h] of Object.entries(estado.mapa.hexes)) {
      if (h.dueno !== jugadorId || !h.yacimiento) continue;
      if (P[h.yacimiento] != null) { p += P[h.yacimiento]; continue; } // punto clave: basta con poseerlo
      if (z.reino.has(k) || z.aisladas.some(zz => zz.hexes.has(k))) p += P.yacimiento;
    }
    if (P.hexagono) for (const h of Object.values(estado.mapa.hexes)) if (h.dueno === jugadorId) p += P.hexagono;
    for (const t of FWM.estado.tropasDe(estado, jugadorId)) p += datos.tropas[t.tipo].mantenimiento;
    const st = estado.estadisticas && estado.estadisticas[jugadorId];
    if (st && P.baja) p += (st.matadas || 0) * P.baja;
    if (st && P.heroe) p += (st.heroesMatados || 0) * P.heroe;
    p += Math.floor((j.hucha.oro || 0) / P.oroPor);
    if (estado.modoTec !== "todo") p += j.tecnologias.length * P.tecnologia;
    return p;
  }

  function comprobar(estado, datos) {
    const eventos = [];
    for (const j of estado.jugadores) {
      if (j.eliminado || j.sinEliminar) continue; // las hordas del modo Bárbaros no se eliminan: siempre viene otra oleada
      const tieneAsent = FWM.estado.asentamientosDe(estado, j.id).length > 0;
      const tieneTropas = FWM.estado.tropasDe(estado, j.id).length > 0;
      if (!tieneAsent && !tieneTropas) {
        j.eliminado = true;
        eventos.push({ tipo: "eliminado", jugador: j.id });
      }
    }
    const vivos = estado.jugadores.filter(j => !j.eliminado);
    // en Bárbaros no hay victoria por quedarse solo: la partida acaba cuando cae el defensor
    if (estado.barbaros) {
      if (estado.ganador == null && vivos.filter(j => !j.sinEliminar).length === 0) { estado.ganador = (estado.jugadores.find(j => j.sinEliminar) || {}).id; eventos.push({ tipo: "victoria", jugador: estado.ganador }); }
      return eventos;
    }
    if (vivos.length === 1 && estado.ganador == null) {
      estado.ganador = vivos[0].id;
      eventos.push({ tipo: "victoria", jugador: vivos[0].id });
    }
    // límite de turnos: al pasarlo, gana quien más puntos tenga (empate: más asentamientos, luego más oro)
    if (estado.ganador == null && datos && estado.limiteTurnos && estado.turno > estado.limiteTurnos) {
      const orden = vivos.map(j => ({ id: j.id, p: puntos(estado, datos, j.id), a: FWM.estado.asentamientosDe(estado, j.id).length, oro: j.hucha.oro || 0 }))
        .sort((x, y) => (y.p - x.p) || (y.a - x.a) || (y.oro - x.oro));
      if (orden.length) { estado.ganador = orden[0].id; eventos.push({ tipo: "victoria", jugador: orden[0].id, porPuntos: true }); }
    }
    return eventos;
  }
  return { comprobar, puntos , desglose };
})();
