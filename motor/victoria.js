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

  // ---------- equipos y objetivos de partida (21 sep 2026) ----------
  // El objetivo vive en estado.objetivo = { tipo, ... } y decide cómo se gana. Sin objetivo se juega como siempre:
  // gana el último en pie y, con límite de turnos, quien más puntos tenga.
  //   { tipo: "aguantar", equipo, turnos }         el equipo gana si sigue vivo al pasar ese turno
  //   { tipo: "tomar", hex | jugador }              gana el equipo que tenga ese asentamiento (jugador: su capital)
  //   { tipo: "heroe" }                             gana el equipo que deje sin héroe a todos los demás
  //   { tipo: "clave", n, turnos }                  gana quien tenga n puntos clave durante esos turnos seguidos
  //   { tipo: "escapar", equipo, hex | lado }       el equipo gana si lleva a su héroe a ese sitio o a ese lado
  //                                                  (lado: "norte" | "sur" | "este" | "oeste" | "lejos" = el borde
  //                                                  contrario al que empezó; sin lado vale cualquier borde)
  const equipoDe = (j) => (j && j.equipo != null ? j.equipo : (j ? j.id : null));
  function equipos(estado) {
    const m = new Map();
    for (const j of estado.jugadores) { const e = equipoDe(j); if (!m.has(e)) m.set(e, []); m.get(e).push(j); }
    return m;
  }
  const equipoVivo = (estado, eq) => estado.jugadores.some(j => equipoDe(j) === eq && !j.eliminado);
  const puntosEquipo = (estado, datos, eq) => estado.jugadores.filter(j => equipoDe(j) === eq && !j.eliminado).reduce((s, j) => s + puntos(estado, datos, j.id), 0);
  function ganaEquipo(estado, eq, eventos, extra) {
    const j = estado.jugadores.find(x => equipoDe(x) === eq && !x.eliminado) || estado.jugadores.find(x => equipoDe(x) === eq);
    if (!j) return;
    estado.ganador = j.id; estado.ganadorEquipo = eq;
    eventos.push(Object.assign({ tipo: "victoria", jugador: j.id, equipo: eq }, extra || {}));
  }
  // cuántos puntos clave tiene cada equipo
  function clavePorEquipo(estado, eq) {
    let n = 0;
    for (const h of Object.values(estado.mapa.hexes)) {
      if (h.yacimiento !== "punto_clave" || h.dueno == null) continue;
      if (equipoDe(estado.jugadores[h.dueno]) === eq) n++;
    }
    return n;
  }
  // El objetivo de la partida, si lo hay. Devuelve true si ya hay ganador.
  function comprobarObjetivo(estado, datos, eventos) {
    const ob = estado.objetivo; if (!ob || estado.ganador != null) return false;
    if (ob.tipo === "aguantar") {
      if (!equipoVivo(estado, ob.equipo)) return false; // si cae, gana el otro por eliminación
      // con capital: "aguanta sin perder tu pueblo principal" (25 sep 2026). Si te lo quitan, gana quien lo tenga.
      // Sin esto había que barrerte entero, y en 12 turnos no daba tiempo: aguantar no tenía tensión.
      if (ob.capital) {
        if (!ob.hexCapital) { const j = estado.jugadores.find(x => equipoDe(x) === ob.equipo && x.capital); if (j) ob.hexCapital = j.capital; }
        const a = ob.hexCapital && estado.asentamientos[ob.hexCapital];
        if (a && a.dueno != null && equipoDe(estado.jugadores[a.dueno]) !== ob.equipo) { ganaEquipo(estado, equipoDe(estado.jugadores[a.dueno]), eventos, { capitalPerdida: true }); return true; }
      }
      if (estado.turno > ob.turnos) { ganaEquipo(estado, ob.equipo, eventos, { aguantado: true }); return true; }
      return false;
    }
    if (ob.tipo === "tomar") {
      const a = estado.asentamientos[ob.hex];
      if (a && a.dueno != null && (ob.equipoSalida == null || equipoDe(estado.jugadores[a.dueno]) !== ob.equipoSalida)) { ganaEquipo(estado, equipoDe(estado.jugadores[a.dueno]), eventos, { tomado: ob.hex }); return true; }
      return false;
    }
    if (ob.tipo === "heroe") {
      const conHeroe = new Set();
      for (const j of estado.jugadores) if (!j.eliminado && j.heroeTropa && estado.tropas[j.heroeTropa]) conHeroe.add(equipoDe(j));
      if (conHeroe.size === 1 && equipos(estado).size > 1) { ganaEquipo(estado, [...conHeroe][0], eventos, { porHeroe: true }); return true; }
      return false;
    }
    if (ob.tipo === "clave") {
      // OJO: comprobar() corre después de CADA acción, no una vez por turno. El contador de turnos seguidos
      // se apunta el turno en el que ya contó, o si no subía con cada movimiento y se ganaba en dos acciones
      // en vez de en dos turnos (22 sep 2026: a Rodrigo le dio la victoria nada más volver a una partida).
      estado.claveSeguidos = estado.claveSeguidos || {};
      estado.claveContado = estado.claveContado || {};
      for (const eq of equipos(estado).keys()) {
        const tiene = clavePorEquipo(estado, eq) >= (ob.n || 2);
        if (!tiene) { estado.claveSeguidos[eq] = 0; estado.claveContado[eq] = estado.turno; continue; }
        if (estado.claveContado[eq] !== estado.turno) { estado.claveSeguidos[eq] = (estado.claveSeguidos[eq] || 0) + 1; estado.claveContado[eq] = estado.turno; }
        if (estado.claveSeguidos[eq] >= (ob.turnos || 2)) { ganaEquipo(estado, eq, eventos, { porClave: true }); return true; }
      }
      return false;
    }
    if (ob.tipo === "escapar") {
      for (const j of estado.jugadores) {
        if (equipoDe(j) !== ob.equipo || j.eliminado || !j.heroeTropa) continue;
        const h = estado.tropas[j.heroeTropa]; if (!h) continue;
        const pos = FWM.estado.posicionTropa(estado, h); if (!pos) continue;
        if (ob.hex ? pos === ob.hex : enBorde(estado, pos, ob.lado, j.inicio)) { ganaEquipo(estado, ob.equipo, eventos, { escapado: true }); return true; }
      }
      return false;
    }
    return false;
  }
  // Los bordes de verdad del mapa: la primera y la última fila (y columna) por las que se puede andar. En los mapas
  // hechos a mano las filas de fuera son agua, así que "el borde" no es la fila 0 sino la primera con tierra.
  function limites(estado) {
    if (estado.__limites) return estado.__limites;
    let minQ = 1e9, maxQ = -1e9, minR = 1e9, maxR = -1e9;
    for (const [k, h] of Object.entries(estado.mapa.hexes)) {
      if (h.terreno === "agua") continue;
      const [q, r] = k.split(",").map(Number);
      if (q < minQ) minQ = q; if (q > maxQ) maxQ = q;
      if (r < minR) minR = r; if (r > maxR) maxR = r;
    }
    return (estado.__limites = { minQ, maxQ, minR, maxR });
  }

  // El borde de salida cuando hay que "cruzar al otro lado": los hexes del borde lejos de donde empezaste.
  // (Sin esto, en los mapas hechos a mano se empieza pegado al borde de arriba y se escapa en el primer turno.)
  function bordeLejano(estado, inicio) {
    const k = "__lejos_" + inicio;
    // una partida guardada con la versión anterior lo trae como {} (vacío): se vuelve a calcular
    if (estado[k] && Object.keys(estado[k]).length) return estado[k];
    const bordes = Object.keys(estado.mapa.hexes).filter(h => estado.mapa.hexes[h].terreno !== "agua" && enBorde(estado, h));
    const dmax = bordes.reduce((m, h) => Math.max(m, FWM.hex.distancia(h, inicio)), 0);
    // OJO: un objeto normal, no un Set: la partida se guarda en texto y un Set vuelve como {} (23 sep 2026: el
    // capítulo 9 de Castilla reventaba al volver a una partida guardada; lo pilló pruebas/barrido.js)
    const lejos = {}; for (const h of bordes) if (FWM.hex.distancia(h, inicio) >= dmax * 0.7) lejos[h] = 1;
    return (estado[k] = lejos);
  }

  function enBorde(estado, hex, lado, inicio) {
    if (lado === "lejos") return !!(inicio && bordeLejano(estado, inicio)[hex]);
    const [q, r] = hex.split(",").map(Number); const L = limites(estado);
    if (lado === "norte") return r <= L.minR;
    if (lado === "sur") return r >= L.maxR;
    if (lado === "oeste") return q <= L.minQ;
    if (lado === "este") return q >= L.maxQ;
    return q <= L.minQ || r <= L.minR || q >= L.maxQ || r >= L.maxR;
  }

  function comprobar(estado, datos) {
    const eventos = [];
    for (const j of estado.jugadores) {
      if (j.eliminado || j.sinEliminar) continue; // las hordas del modo Resistir no se eliminan: siempre viene otra oleada
      const tieneAsent = FWM.estado.asentamientosDe(estado, j.id).length > 0;
      const tieneTropas = FWM.estado.tropasDe(estado, j.id).length > 0;
      if (!tieneAsent && !tieneTropas) {
        j.eliminado = true;
        eventos.push({ tipo: "eliminado", jugador: j.id });
      }
    }
    const vivos = estado.jugadores.filter(j => !j.eliminado);
    // En Resistir se pierde al perder la CAPITAL, no al quedarse sin nada (9 sep 2026). Antes hacía falta
    // barrer al defensor entero, así que fundar pueblos te hacía prácticamente inmortal y hubo que
    // prohibir fundar; con la capital como punto débil, se puede volver a fundar sin romper el modo.
    if (estado.oleadas) {
      if (estado.ganador == null) {
        const defensores = estado.jugadores.filter(j => !j.sinEliminar);
        const enPie = defensores.filter(j => {
          if (j.eliminado) return false;
          const hexCap = j.capitalInicial || j.capital;
          const cap = hexCap && estado.asentamientos[hexCap];
          return !!(cap && cap.dueno === j.id);
        });
        for (const j of defensores) {
          if (j.eliminado || enPie.includes(j)) continue;
          j.eliminado = true; // ha caído su capital
          eventos.push({ tipo: "eliminado", jugador: j.id });
        }
        if (!enPie.length) { estado.ganador = (estado.jugadores.find(j => j.sinEliminar) || {}).id; eventos.push({ tipo: "victoria", jugador: estado.ganador }); }
      }
      return eventos;
    }
    if (comprobarObjetivo(estado, datos, eventos)) return eventos;
    // el último EQUIPO en pie
    const equiposVivos = [...new Set(vivos.filter(j => !j.retirado).map(equipoDe))]; // el retirado ya no cuenta
    if (equiposVivos.length === 1 && estado.ganador == null && vivos.length) ganaEquipo(estado, equiposVivos[0], eventos);
    // límite de turnos con un objetivo que alguien tenía que CUMPLIR (escapar, tomar un sitio): si no lo ha cumplido,
    // pierde él, no se decide a puntos (24 sep 2026, Rodrigo: "que pierda quien no lo ha conseguido"). Los objetivos
    // que son de todos por igual (puntos clave, matar al héroe) se siguen decidiendo a puntos.
    if (estado.ganador == null && datos && estado.limiteTurnos && estado.turno > estado.limiteTurnos && estado.objetivo) {
      const ob = estado.objetivo; let gana = null;
      if (ob.tipo === "escapar") {
        const otros = [...equipos(estado).keys()].filter(eq => eq !== ob.equipo && equipoVivo(estado, eq));
        gana = otros.sort((x, y) => puntosEquipo(estado, datos, y) - puntosEquipo(estado, datos, x))[0];
      }
      if (ob.tipo === "tomar" && ob.equipoSalida != null && equipoVivo(estado, ob.equipoSalida)) gana = ob.equipoSalida; // lo ha defendido
      if (gana != null) { ganaEquipo(estado, gana, eventos, { objetivoFallido: ob.tipo }); return eventos; }
    }
    // límite de turnos: al pasarlo, gana quien más puntos tenga (empate: más asentamientos, luego más oro)
    if (estado.ganador == null && datos && estado.limiteTurnos && estado.turno > estado.limiteTurnos) {
      // los puntos se suman por equipo (un equipo de dos gana si entre los dos tiene más)
      const porEq = new Map();
      for (const j of vivos) {
        const eq = equipoDe(j); const x = porEq.get(eq) || { eq, p: 0, a: 0, oro: 0 };
        x.p += puntos(estado, datos, j.id); x.a += FWM.estado.asentamientosDe(estado, j.id).length; x.oro += j.hucha.oro || 0;
        porEq.set(eq, x);
      }
      const orden = [...porEq.values()].sort((x, y) => (y.p - x.p) || (y.a - x.a) || (y.oro - x.oro));
      if (orden.length) ganaEquipo(estado, orden[0].eq, eventos, { porPuntos: true });
    }
    return eventos;
  }
  // ¿Ha ganado este jugador? Gana el equipo: si el ganador "oficial" es tu compañero, también has ganado tú
  // (23 sep 2026: a dobles o en una sala con un amigo, uno de los dos veía "Segundo" siendo del equipo ganador).
  function haGanado(estado, id) {
    if (estado.ganador == null || estado.ganador === -1) return false;
    if (estado.ganadorEquipo != null) return equipoDe(estado.jugadores[id]) === estado.ganadorEquipo;
    return estado.ganador === id;
  }
  return { haGanado, enBorde, bordeLejano, limites, comprobar, puntos, desglose, equipoDe, equipos, clavePorEquipo };
})();
