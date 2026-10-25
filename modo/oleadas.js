// Modo Resistir (antes "Resistir", renombrado el 21 sep 2026): aguantar oleadas de hordas en una arena. Empiezas en el centro con tu asentamiento
// y algo de oro alrededor; desde el turno 2 entran oleadas por los bordes, cada vez más fuertes y por más
// lados. La partida acaba cuando caes: la puntuación son las rondas aguantadas.
//
// 7 oct 2026 (aviso 34, Rodrigo): los capítulos de "aguantar" de las campañas también son hordas. El capítulo trae
// `hordas: { factor, desde }` (fuerza relativa y turno de la primera oleada) y su objetivo de aguantar N turnos; las
// oleadas entran por los bordes del mapa del capítulo, nunca pegadas a un pueblo del defensor.
//
// Pensado para admitir después el modo cooperativo: todo lo que depende del defensor trabaja con una LISTA
// de jugadores humanos (`defensores`), y el mapa "arena" ya tiene dos inicios pegados en el centro.
window.FWM = window.FWM || {};

FWM.oleadas = (function () {
  const H = () => FWM.hex, E = () => FWM.estado;
  const PRIMERA_OLEADA = 2;   // la primera oleada entra en la ronda 2: el turno 1 es para colocarse

  // Coste en "fuerza" de cada tropa y desde qué ronda puede aparecer.
  const CATALOGO = [
    { tipo: "campesino", coste: 1, desde: 1 },
    { tipo: "lancero", coste: 2, desde: 3 },
    { tipo: "arquero", coste: 2, desde: 6 },
    { tipo: "espadachin", coste: 3, desde: 8 },
    { tipo: "alabardero", coste: 3, desde: 11 },
    { tipo: "caballero", coste: 4, desde: 13 },
    { tipo: "ballestero", coste: 3, desde: 15 },
    { tipo: "catapulta", coste: 4, desde: 10 },
    { tipo: "infanteria_pesada", coste: 5, desde: 16 },
    { tipo: "caballeria_pesada", coste: 6, desde: 20 },
    { tipo: "trabuquete", coste: 7, desde: 24 },
  ];

  // Fuerza de la oleada de un turno y por cuántos lados entra. Sube deprisa: aguantar 25 rondas es mucho.
  // cfg (capítulos): { factor, desde }. Sin cfg, el modo Resistir de siempre.
  const desdeDe = (cfg) => (cfg && cfg.desde) || PRIMERA_OLEADA;
  function fuerza(turno, defensores, cfg) {
    const t = Math.max(0, turno - desdeDe(cfg) + 1);
    return Math.round((2 + t * 1.35 + t * t * 0.06) * (defensores > 1 ? 1.6 : 1) * ((cfg && cfg.factor) || 1));
  }
  function lados(turno, cfg) { const t = turno - desdeDe(cfg) + PRIMERA_OLEADA; return t >= 18 ? 4 : t >= 12 ? 3 : t >= 6 ? 2 : 1; }
  // Cuántas hordas puede haber a la vez. Sin tope se amontonan en el borde, se estorban y el modo se atasca.
  function maxVivas(turno, defensores, cfg) { return Math.round((8 + turno * 1.1) * (defensores > 1 ? 1.6 : 1) * Math.max(1, (cfg && cfg.factor) || 1)); }

  // Hexágonos del borde del mapa, agrupados por lado (norte, sur, oeste, este).
  function bordes(estado) {
    const claves = Object.keys(estado.mapa.hexes);
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    const col = {}, fil = {};
    for (const k of claves) {
      const { q, r } = H().desde(k); const c = q + Math.floor(r / 2);
      col[k] = c; fil[k] = r;
      minR = Math.min(minR, r); maxR = Math.max(maxR, r); minC = Math.min(minC, c); maxC = Math.max(maxC, c);
    }
    // nunca pegadas a un pueblo del defensor (en los mapas de campaña la capital puede estar cerca del borde)
    const cerca = Object.entries(estado.asentamientos).filter(([, a]) => { const d = estado.jugadores[a.dueno]; return d && !d.horda; }).map(([hex]) => hex);
    const libre = (k) => { const h = estado.mapa.hexes[k]; return h && h.terreno !== "agua" && h.terreno !== "montana" && !h.construccion && !E().tropaEn(estado, k) && !cerca.some(c => H().distancia(c, k) <= 2); };
    const grupos = { norte: [], sur: [], oeste: [], este: [] };
    // capítulos (hordasCfg): es un cerco, así que entran por los bordes CERCANOS a la capital (de 3 a `radio` casillas,
    // y el radio crece con los turnos); si no hay sitio tan cerca, se amplía hasta encontrarlo
    const cfg = estado.hordasCfg; let dentro = () => true;
    if (cfg) {
      const caps = estado.jugadores.filter(j => !j.horda && !j.eliminado).map(j => j.capitalInicial || j.capital).filter(Boolean);
      const dist = (k) => Math.min(...caps.map(c => H().distancia(c, k)));
      let radio = (cfg.radio || 5) + Math.floor(Math.max(0, estado.turno - desdeDe(cfg)) / 4);
      while (radio < 40 && !claves.some(k => libre(k) && dist(k) <= radio && (fil[k] <= minR + 1 || fil[k] >= maxR - 1 || col[k] <= minC + 1 || col[k] >= maxC - 1))) radio++;
      dentro = (k) => dist(k) <= radio;
    }
    for (const k of claves) {
      if (!libre(k) || !dentro(k)) continue;
      if (fil[k] <= minR + 1) grupos.norte.push(k);
      else if (fil[k] >= maxR - 1) grupos.sur.push(k);
      else if (col[k] <= minC + 1) grupos.oeste.push(k);
      else if (col[k] >= maxC - 1) grupos.este.push(k);
    }
    return grupos;
  }

  // Los jugadores a los que atacan las hordas (todos los que no son la horda y siguen vivos).
  function defensores(estado) { return estado.jugadores.filter(j => !j.horda && !j.eliminado); }
  function idHordas(estado) { const j = estado.jugadores.find(x => x.horda); return j ? j.id : null; }

  // Prepara la partida: el último jugador es la horda, no se elimina y no cobra ni recluta.
  function preparar(estado, cfg) {
    const j = estado.jugadores[estado.jugadores.length - 1];
    // tropas: desde qué ronda viene cada tipo (manda sobre el catálogo). En un cerco vienen pocas tropas pero buenas, y
    // catapultas desde la primera oleada: con muchos campesinos se atascan en los pasos y nunca llegan a la muralla
    // (medido el 7 oct 2026: más tropas = menos presión), y sin máquinas la ciudad aguanta sola.
    estado.hordasCfg = cfg ? { factor: cfg.factor || 1, desde: cfg.desde || PRIMERA_OLEADA, radio: cfg.radio || 5, catapultas: cfg.catapultas || 1, tropas: Object.assign({ campesino: 99, lancero: 99, arquero: 2, espadachin: 2, catapulta: 2, caballero: 4, alabardero: 5, trabuquete: 5, ballestero: 7, infanteria_pesada: 7, caballeria_pesada: 9 }, cfg.tropas || {}) } : null;
    j.horda = true; j.sinEliminar = true; j.sinEconomia = true; j.hucha.oro = 0;
    // equipos (21 sep 2026): los defensores juegan juntos y la horda va por su cuenta
    for (const d of estado.jugadores) d.equipo = d === j ? 99 : 0;
    // las hordas no tienen tierra: se les quita el asentamiento y las tropas con que nacen, porque el mapa
    // les da un inicio como a todos (el segundo del centro, que es para el modo cooperativo)
    for (const [hex, a] of Object.entries(estado.asentamientos)) {
      if (a.dueno !== j.id) continue;
      for (const id of a.guarnicion.slice()) delete estado.tropas[id];
      delete estado.asentamientos[hex];
      const h = estado.mapa.hexes[hex]; if (h) { h.construccion = null; h.dueno = null; }
    }
    for (const t of E().tropasDe(estado, j.id)) delete estado.tropas[t.id];
    for (const h of Object.values(estado.mapa.hexes)) if (h.dueno === j.id) h.dueno = null;
    j.capital = null; j.heroeTropa = null;
    // la capital con la que empieza cada defensor: perderla acaba su partida aunque tenga otros pueblos. Si solo se
    // miraba j.capital, al caer pasaba a ser capital otro pueblo y la partida seguía (14 sep 2026)
    for (const d of estado.jugadores) if (!d.horda && d.capital) d.capitalInicial = d.capital;
    estado.oleadas = true;
    estado.oleadaHecha = 0;
    return estado;
  }

  // Oleada del turno: crea tropas en los bordes. Determinista (misma semilla y turno = misma oleada),
  // así deshacer o recargar la partida no cambia lo que viene.
  function oleada(estado, datos) {
    const id = idHordas(estado); if (id == null) return [];
    const turno = estado.turno; const cfg = estado.hordasCfg || null;
    if (turno < desdeDe(cfg) || estado.oleadaHecha >= turno) return [];
    estado.oleadaHecha = turno;
    const g = FWM.azar.crear((estado.semilla || 1) * 7919 + turno * 131);
    const ronda = turno - desdeDe(cfg) + PRIMERA_OLEADA; // qué tropas pueden venir: como en Resistir, contando desde la primera oleada
    const posibles = CATALOGO.filter(x => ((cfg && cfg.tropas && cfg.tropas[x.tipo]) || x.desde) <= ronda);
    let restante = fuerza(turno, defensores(estado).length, cfg);
    const vivas = E().tropasDe(estado, id).length;
    let hueco = maxVivas(turno, defensores(estado).length, cfg) - vivas;
    if (hueco <= 0) return [];
    const grupos = bordes(estado);
    const nombres = g.barajar(["norte", "sur", "este", "oeste"]).filter(n => grupos[n] && grupos[n].length).slice(0, lados(turno, cfg));
    if (!nombres.length) return [];
    const creadas = [];
    let vuelta = 0;
    // en un cerco (capítulos) cada oleada trae una catapulta en cuanto toca: sin máquinas, las murallas no caen nunca
    const esMaquina = (x) => x.tipo === "trabuquete" || x.tipo === "catapulta";
    let catapultaPendiente = (cfg && posibles.some(esMaquina)) ? (cfg.catapultas || 1) : 0;
    while (restante > 0 && hueco > 0 && vuelta < 80) {
      vuelta++;
      const asequibles = posibles.filter(x => x.coste <= restante);
      if (!asequibles.length) break;
      // cuanto más avanzada la ronda, más probable la tropa cara
      const pesos = asequibles.map(x => 1 + x.coste * (turno / 14));
      let corte = g.siguiente() * pesos.reduce((a, b) => a + b, 0);
      let elegida = asequibles[asequibles.length - 1];
      for (let i = 0; i < asequibles.length; i++) { corte -= pesos[i]; if (corte <= 0) { elegida = asequibles[i]; break; } }
      if (catapultaPendiente > 0) { const c = asequibles.find(x => x.tipo === "trabuquete") || asequibles.find(x => x.tipo === "catapulta"); if (c) { elegida = c; catapultaPendiente--; } }
      // el lado que toca; si está lleno, cualquier otro con hueco
      let lado = nombres[vuelta % nombres.length];
      let sitios = grupos[lado].filter(k => !E().tropaEn(estado, k));
      if (!sitios.length) { for (const otro of nombres) { const s2 = grupos[otro].filter(k => !E().tropaEn(estado, k)); if (s2.length) { lado = otro; sitios = s2; break; } } }
      if (!sitios.length) break; // no cabe nadie más en los bordes
      const hex = g.elegir(sitios);
      const t = E().crearTropa(estado, datos, elegida.tipo, id, hex);
      t.movRestante = 0; t.accionUsada = true; // llegan agotadas: atacan a partir del turno siguiente
      creadas.push({ tipo: elegida.tipo, hex, lado });
      restante -= elegida.coste; hueco--;
    }
    if (creadas.length) estado.registro.push({ turno, tipo: "oleada", n: creadas.length, ronda: turno });
    return creadas;
  }

  // Turno de las hordas: cada tropa ataca lo que tenga al lado o avanza hacia el defensor más cercano.
  // No reclutan, no fundan y no cobran: solo vienen.
  function jugar(estado, datos, opciones) {
    opciones = opciones || {};
    const ctx = { estado, eventos: [] };
    const yo = idHordas(estado);
    const hacer = (accion) => {
      const r = FWM.motor.aplicar(ctx.estado, datos, accion);
      if (!r.ok) return false;
      ctx.estado = r.estado; ctx.eventos.push(...r.eventos);
      if (opciones.alAplicar) opciones.alAplicar(ctx.estado, accion, r.eventos);
      return true;
    };
    if (yo == null || ctx.estado.ganador != null) { hacer({ tipo: "finTurno" }); return { estado: ctx.estado, eventos: ctx.eventos }; }
    // objetivos: asentamientos de los defensores; si no queda ninguno, sus tropas
    const objetivos = () => {
      const dd = defensores(ctx.estado).map(j => j.id);
      // en un capítulo de aguantar (hay objetivo), lo que cuenta es la capital: las hordas van a por ella
      if (ctx.estado.objetivo) { const caps = defensores(ctx.estado).map(j => j.capitalInicial || j.capital).filter(h => h && ctx.estado.asentamientos[h] && dd.includes(ctx.estado.asentamientos[h].dueno)); if (caps.length) return caps; }
      const asent = Object.entries(ctx.estado.asentamientos).filter(([, a]) => dd.includes(a.dueno)).map(([hex]) => hex);
      if (asent.length) return asent;
      return Object.values(ctx.estado.tropas).filter(t => dd.includes(t.dueno)).map(t => E().posicionTropa(ctx.estado, t)).filter(Boolean);
    };
    // las máquinas de asedio van primero: necesitan el anillo a dos casillas de la muralla, y si la infantería lo
    // ocupa antes, se quedan detrás y las murallas no caen nunca (7 oct 2026)
    const orden = E().tropasDe(ctx.estado, yo).slice().sort((a, b) => (datos.tropas[b.tipo].asedio || 0) - (datos.tropas[a.tipo].asedio || 0));
    for (const tropa of orden) {
      let t = ctx.estado.tropas[tropa.id];
      if (!t || t.accionUsada) continue;
      // 1. atacar o asediar lo que tenga a tiro. En un cerco (hay objetivo) lo primero es derribar la muralla de la
      // capital: si no, se estrellan contra la guarnición y la ciudad no cae nunca (7 oct 2026)
      let p = FWM.motor.accionesPosibles(ctx.estado, datos, t.id);
      if (ctx.estado.objetivo) { const cap = p.asediar.find(h => objetivos().includes(h)); if (cap) { hacer({ tipo: "asediar", tropa: t.id, objetivo: cap }); continue; } }
      if (p.atacar.length) { hacer({ tipo: "atacar", tropa: t.id, objetivo: p.atacar[0] }); continue; }
      if (p.asediar.length) { hacer({ tipo: "asediar", tropa: t.id, objetivo: p.asediar[0] }); continue; }
      // 2. acercarse al objetivo más cercano
      const obj = objetivos(); if (!obj.length) continue;
      const pos = E().posicionTropa(ctx.estado, t); if (!pos) continue;
      const meta = obj.slice().sort((a, b) => H().distancia(a, pos) - H().distancia(b, pos))[0];
      const destinos = Object.keys(p.mover);
      if (!destinos.length) continue;
      const mejor = destinos.slice().sort((a, b) => H().distancia(a, meta) - H().distancia(b, meta))[0];
      // si ningún paso acerca (hay tropas delante), vale moverse a distancia igual: así la masa se descongestiona
      if (H().distancia(mejor, meta) <= H().distancia(pos, meta)) {
        hacer({ tipo: "mover", tropa: t.id, a: mejor });
        t = ctx.estado.tropas[t.id];
        if (t && !t.accionUsada) {
          p = FWM.motor.accionesPosibles(ctx.estado, datos, t.id);
          if (p.atacar.length) hacer({ tipo: "atacar", tropa: t.id, objetivo: p.atacar[0] });
          else if (p.asediar.length) hacer({ tipo: "asediar", tropa: t.id, objetivo: p.asediar[0] });
        }
      }
    }
    hacer({ tipo: "finTurno" });
    return { estado: ctx.estado, eventos: ctx.eventos };
  }

  // Rondas aguantadas: los turnos completos que ha sobrevivido el defensor.
  function rondas(estado) { return Math.max(0, (estado.turno || 1) - 1); }
  // Lo que viene en el turno siguiente, para avisar en la barra.
  function siguienteOleada(estado) {
    const t = estado.turno + 1; const cfg = estado.hordasCfg || null;
    if (t < desdeDe(cfg)) return null;
    return { ronda: t, fuerza: fuerza(t, defensores(estado).length, cfg), lados: lados(t, cfg) };
  }

  return { preparar, oleada, jugar, rondas, siguienteOleada, fuerza, lados, maxVivas, PRIMERA_OLEADA, defensores, idHordas };
})();

FWM.ias = FWM.ias || {};
FWM.ias.hordas = (e, d, o) => FWM.oleadas.jugar(e, d, o);
