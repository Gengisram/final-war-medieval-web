// Generador de mapas. Produce un fichero de mapa:
//   { ancho, alto, semilla, hexes: { "q,r": { terreno, yacimiento } }, inicios: ["q,r", ...] }
// Un mapa hecho a mano tiene exactamente el mismo formato.
window.FWM = window.FWM || {};

FWM.generador = (function () {
  const H = () => FWM.hex;

  function claves(ancho, alto) {
    const lista = [];
    for (let r = 0; r < alto; r++) {
      const desplaz = Math.floor(r / 2);
      for (let col = 0; col < ancho; col++) lista.push(H().clave(col - desplaz, r));
    }
    return lista;
  }

  // reparto: "equilibrado" (cada capital tiene lo mismo cerca) o "aleatorio" (solo se garantiza uno de cada a 1-2).
  function generar({ semilla, ancho, alto, jugadores, datos, densidadYacimientos, reparto }) {
    reparto = reparto || "equilibrado";
    densidadYacimientos = densidadYacimientos == null ? (reparto === "aleatorio" ? 0.2 : 0.07) : densidadYacimientos;
    for (let intento = 0; intento < 60; intento++) {
      const g = FWM.azar.crear(semilla + intento * 1000);
      // si no cabe con separación 5, se relaja a 4 y luego a 3
      const separacion = intento < 25 ? 5 : intento < 45 ? 4 : 3;
      const mapa = intentar(g, ancho, alto, jugadores, datos, densidadYacimientos, reparto, separacion);
      if (mapa) { mapa.semilla = semilla; mapa.reparto = reparto; mapa.nombre = nombreMapa(semilla, datos); return mapa; }
    }
    throw new Error("No se pudo generar un mapa válido");
  }

  function intentar(g, ancho, alto, nJug, datos, densidad, reparto, separacion) {
    separacion = separacion || 5;
    const todas = claves(ancho, alto);
    const enMapa = new Set(todas);
    const pos = {};
    todas.forEach((k, i) => { pos[k] = i; });
    const borde = new Set();
    for (let r = 0; r < alto; r++) {
      const d = Math.floor(r / 2);
      borde.add(H().clave(-d, r)); borde.add(H().clave(ancho - 1 - d, r));
    }
    for (let col = 0; col < ancho; col++) { borde.add(H().clave(col, 0)); borde.add(H().clave(col - Math.floor((alto - 1) / 2), alto - 1)); }

    // 1. ruido inicial
    let tierra = new Set();
    for (const k of todas) if (!borde.has(k) && g.siguiente() > 0.28) tierra.add(k);

    // 2. suavizado (autómata celular)
    for (let it = 0; it < 3; it++) {
      const nueva = new Set();
      for (const k of todas) {
        if (borde.has(k)) continue;
        let n = 0;
        for (const v of H().vecinos(k)) if (tierra.has(v)) n++;
        if (tierra.has(k) ? n >= 3 : n >= 5) nueva.add(k);
      }
      tierra = nueva;
    }

    // 3. un solo continente: quedarse con el componente mayor
    const visto = new Set();
    let mayor = new Set();
    for (const k of tierra) {
      if (visto.has(k)) continue;
      const comp = new Set(); const cola = [k]; visto.add(k);
      while (cola.length) {
        const c = cola.pop(); comp.add(c);
        for (const v of H().vecinos(c)) if (tierra.has(v) && !visto.has(v)) { visto.add(v); cola.push(v); }
      }
      if (comp.size > mayor.size) mayor = comp;
    }
    tierra = mayor;
    if (tierra.size < todas.length * 0.5) return null;

    // 4. inicios: muestreo del punto más lejano, con espacio alrededor
    const candidatos = [...tierra].filter(k => H().vecinos(k).filter(v => tierra.has(v)).length >= 5);
    if (candidatos.length < nJug * 3) return null;
    const inicios = [g.elegir(candidatos)];
    while (inicios.length < nJug) {
      let mejor = null, mejorD = -1;
      for (const k of g.barajar(candidatos)) {
        const d = Math.min(...inicios.map(i => H().distancia(i, k)));
        if (d > mejorD) { mejorD = d; mejor = k; }
      }
      if (mejorD < separacion) return null;
      inicios.push(mejor);
    }

    // 5. yacimientos
    const tipos = Object.keys(datos.yacimientos).filter(t => (datos.yacimientos[t].frecuencia || 0) > 0); // los de frecuencia 0 (punto_clave) se ponen después según el modo
    const pesos = tipos.map(t => datos.yacimientos[t].frecuencia || 1);
    const totalPeso = pesos.reduce((a, b) => a + b, 0);
    const elegirTipo = () => {
      let x = g.siguiente() * totalPeso;
      for (let i = 0; i < tipos.length; i++) { x -= pesos[i]; if (x <= 0) return tipos[i]; }
      return tipos[tipos.length - 1];
    };
    const yac = {};
    const prohibido = new Set(inicios);
    const libre = (k, ini) => tierra.has(k) && !yac[k] && !prohibido.has(k) && inicios.every(o => o === ini || H().distancia(k, o) >= separacion - 1);
    // 1. garantía: cada capital tiene exactamente uno de cada tipo a distancia 1-2 (mejor 2)
    for (const ini of inicios) {
      for (const t of g.barajar(tipos)) {
        const anillo2 = H().anillo(ini, 2).filter(k => H().distancia(k, ini) === 2 && libre(k, ini));
        const anillo1 = H().anillo(ini, 1).filter(k => H().distancia(k, ini) === 1 && libre(k, ini));
        const sitio = anillo2.length ? g.elegir(anillo2) : anillo1.length ? g.elegir(anillo1) : null;
        if (!sitio) return null;
        yac[sitio] = t;
      }
    }
    if (reparto === "equilibrado") {
      // 2. extras iguales para todos: tres yacimientos a distancia 3-4 de cada capital, tipos rotando
      const extrasPorJugador = 3;
      inicios.forEach((ini, i) => {
        for (let n = 0; n < extrasPorJugador; n++) {
          const t = tipos[(i + n) % tipos.length];
          // a distancia 3; si la costa no deja, a 4 o a 2
          let cand = null;
          const libreExtra = (k) => tierra.has(k) && !yac[k] && !prohibido.has(k) && inicios.every(o => o === ini || H().distancia(k, o) >= 3);
          for (const d of [3, 4, 2]) { cand = H().anillo(ini, d).filter(k => H().distancia(k, ini) === d && libreExtra(k)); if (cand.length) break; }
          if (!cand || !cand.length) continue;
          yac[g.elegir(cand)] = t;
        }
      });
      // 3. y unos pocos dispersos por el resto del mapa, lejos de todas las capitales
      for (const k of tierra) {
        if (yac[k] || prohibido.has(k)) continue;
        if (inicios.some(o => H().distancia(k, o) <= 4)) continue;
        if (g.siguiente() < densidad * 1.5) yac[k] = elegirTipo();
      }
    } else {
      // aleatorio: el resto del mapa al azar
      for (const k of tierra) {
        if (yac[k] || prohibido.has(k)) continue;
        if (inicios.some(o => H().distancia(k, o) <= 2)) continue;
        if (g.siguiente() < densidad) yac[k] = elegirTipo();
      }
    }

    // 6. relieve: montañas en cordilleras cortas, colinas y bosques en manchas.
    const terreno = {};
    for (const k of tierra) terreno[k] = "llanura";
    const cercaDeInicio = (k, d) => inicios.some(o => H().distancia(o, k) <= d);
    const tipoTerr = Object.entries(datos.terrenos).filter(([id, t]) => t.frecuencia > 0);
    const objetivo = {}; for (const [id, t] of tipoTerr) objetivo[id] = Math.round(tierra.size * t.frecuencia);
    const cuenta = {}; for (const [id] of tipoTerr) cuenta[id] = 0;
    // montañas: cordilleras (semilla + 1-3 hexágonos seguidos)
    if (objetivo.montana) {
      let intentos = 0;
      while (cuenta.montana < objetivo.montana && intentos++ < 200) {
        const semilla = g.elegir([...tierra]);
        if (cercaDeInicio(semilla, 2) || terreno[semilla] !== "llanura") continue;
        const dir = g.entero(0, 5);
        let k = semilla; const largo = g.entero(2, 4);
        for (let n = 0; n < largo; n++) {
          if (!tierra.has(k) || cercaDeInicio(k, 2) || terreno[k] !== "llanura") break;
          // no cerrar el paso: la montaña no puede convertir a un vecino de tierra en isla
          terreno[k] = "montana"; cuenta.montana++;
          if (!conectado(tierra, terreno, inicios)) { terreno[k] = "llanura"; cuenta.montana--; break; }
          const [dq, dr] = H().VECINOS[dir]; const { q, r } = H().desde(k); k = H().clave(q + dq, r + dr);
        }
      }
    }
    // colinas y bosques: manchas (semilla + vecinos al azar)
    for (const id of ["colina", "bosque"]) {
      if (!objetivo[id]) continue;
      let intentos = 0;
      while (cuenta[id] < objetivo[id] && intentos++ < 400) {
        const semilla = g.elegir([...tierra]);
        if (cercaDeInicio(semilla, 1) || terreno[semilla] !== "llanura") continue;
        terreno[semilla] = id; cuenta[id]++;
        for (const v of g.barajar(H().vecinos(semilla)).slice(0, g.entero(1, 3))) {
          if (tierra.has(v) && terreno[v] === "llanura" && !cercaDeInicio(v, 1) && cuenta[id] < objetivo[id]) { terreno[v] = id; cuenta[id]++; }
        }
      }
    }
    // yacimientos: cada uno sobre su terreno natural (bosque de madera sobre bosque, canteras y hierro sobre colina)
    for (const [k, y] of Object.entries(yac)) {
      const pref = tipoTerr.find(([id, t]) => (t.yacimientos || []).includes(y));
      if (pref && terreno[k] !== "montana") terreno[k] = pref[0];
      if (terreno[k] === "montana") terreno[k] = "colina";
    }
    // las capitales y su primer anillo, en llanura
    for (const ini of inicios) { terreno[ini] = "llanura"; for (const v of H().vecinos(ini)) if (tierra.has(v) && !yac[v]) terreno[v] = "llanura"; }
    if (!conectado(tierra, terreno, inicios)) return null;

    const hexes = {};
    for (const k of todas) hexes[k] = { terreno: tierra.has(k) ? terreno[k] : "agua", yacimiento: yac[k] || null };
    return { ancho, alto, hexes, inicios };
  }

  // Nombre legible del mapa a partir de la semilla ("Valle de Sahagún").
  function nombreMapa(semilla, datos) {
    const g = FWM.azar.crear(semilla + 4242);
    const prefijos = ["Valle de", "Tierras de", "Marca de", "Campos de", "Sierra de", "Ribera de", "Páramo de", "Alfoz de"];
    const nombres = datos.nombresAsentamientos || ["Castilla"];
    return g.elegir(prefijos) + " " + g.elegir(nombres);
  }

  // ¿Todos los inicios están en el mismo componente transitable (sin montañas)?
  function conectado(tierra, terreno, inicios) {
    const pasable = (k) => tierra.has(k) && terreno[k] !== "montana";
    const visto = new Set([inicios[0]]); const cola = [inicios[0]];
    while (cola.length) {
      const c = cola.pop();
      for (const v of H().vecinos(c)) if (pasable(v) && !visto.has(v)) { visto.add(v); cola.push(v); }
    }
    // además, ningún hexágono de tierra transitable puede quedar aislado (para que las tropas no se encierren)
    for (const k of tierra) if (pasable(k) && !visto.has(k)) return false;
    return inicios.every(i => visto.has(i));
  }

  return { generar, claves };
})();
