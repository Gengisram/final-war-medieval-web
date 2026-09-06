// Modo Bárbaros (6 sep 2026): resistir hordas en una arena. Empiezas en el centro con tu asentamiento
// y algo de oro alrededor; desde el turno 3 entran oleadas por los bordes, cada vez más fuertes y por más
// lados. La partida acaba cuando caes: la puntuación son las rondas aguantadas.
//
// Pensado para admitir después el modo cooperativo: todo lo que depende del defensor trabaja con una LISTA
// de jugadores humanos (`defensores`), y el mapa "arena" ya tiene dos inicios pegados en el centro.
window.FWM = window.FWM || {};

FWM.barbaros = (function () {
  const H = () => FWM.hex, E = () => FWM.estado;
  const PRIMERA_OLEADA = 3;   // los dos primeros turnos son para prepararse

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
    { tipo: "trabuco", coste: 7, desde: 24 },
  ];

  // Fuerza de la oleada de un turno y por cuántos lados entra. Sube deprisa: aguantar 25 rondas es mucho.
  function fuerza(turno, defensores) {
    const t = Math.max(0, turno - PRIMERA_OLEADA + 1);
    return Math.round((2 + t * 1.35 + t * t * 0.06) * (defensores > 1 ? 1.6 : 1));
  }
  function lados(turno) { return turno >= 18 ? 4 : turno >= 12 ? 3 : turno >= 6 ? 2 : 1; }
  // Cuántas hordas puede haber a la vez. Sin tope se amontonan en el borde, se estorban y el modo se atasca.
  function maxVivas(turno, defensores) { return Math.round((8 + turno * 1.1) * (defensores > 1 ? 1.6 : 1)); }

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
    const libre = (k) => { const h = estado.mapa.hexes[k]; return h && h.terreno !== "agua" && h.terreno !== "montana" && !h.construccion && !E().tropaEn(estado, k); };
    const grupos = { norte: [], sur: [], oeste: [], este: [] };
    for (const k of claves) {
      if (!libre(k)) continue;
      if (fil[k] <= minR + 1) grupos.norte.push(k);
      else if (fil[k] >= maxR - 1) grupos.sur.push(k);
      else if (col[k] <= minC + 1) grupos.oeste.push(k);
      else if (col[k] >= maxC - 1) grupos.este.push(k);
    }
    return grupos;
  }

  // Los jugadores a los que atacan las hordas (todos los que no son bárbaros y siguen vivos).
  function defensores(estado) { return estado.jugadores.filter(j => !j.barbaros && !j.eliminado); }
  function idHordas(estado) { const j = estado.jugadores.find(x => x.barbaros); return j ? j.id : null; }

  // Prepara la partida: el último jugador es la horda, no se elimina y no cobra ni recluta.
  function preparar(estado) {
    const j = estado.jugadores[estado.jugadores.length - 1];
    j.barbaros = true; j.sinEliminar = true; j.sinEconomia = true; j.hucha.oro = 0;
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
    estado.barbaros = true;
    estado.oleadaHecha = 0;
    return estado;
  }

  // Oleada del turno: crea tropas en los bordes. Determinista (misma semilla y turno = misma oleada),
  // así deshacer o recargar la partida no cambia lo que viene.
  function oleada(estado, datos) {
    const id = idHordas(estado); if (id == null) return [];
    const turno = estado.turno;
    if (turno < PRIMERA_OLEADA || estado.oleadaHecha >= turno) return [];
    estado.oleadaHecha = turno;
    const g = FWM.azar.crear((estado.semilla || 1) * 7919 + turno * 131);
    const posibles = CATALOGO.filter(x => x.desde <= turno);
    let restante = fuerza(turno, defensores(estado).length);
    const vivas = E().tropasDe(estado, id).length;
    let hueco = maxVivas(turno, defensores(estado).length) - vivas;
    if (hueco <= 0) return [];
    const grupos = bordes(estado);
    const nombres = g.barajar(["norte", "sur", "este", "oeste"]).slice(0, lados(turno)).filter(n => grupos[n] && grupos[n].length);
    if (!nombres.length) return [];
    const creadas = [];
    let vuelta = 0;
    while (restante > 0 && hueco > 0 && vuelta < 80) {
      vuelta++;
      const asequibles = posibles.filter(x => x.coste <= restante);
      if (!asequibles.length) break;
      // cuanto más avanzada la ronda, más probable la tropa cara
      const pesos = asequibles.map(x => 1 + x.coste * (turno / 14));
      let corte = g.siguiente() * pesos.reduce((a, b) => a + b, 0);
      let elegida = asequibles[asequibles.length - 1];
      for (let i = 0; i < asequibles.length; i++) { corte -= pesos[i]; if (corte <= 0) { elegida = asequibles[i]; break; } }
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
      const asent = Object.entries(ctx.estado.asentamientos).filter(([, a]) => dd.includes(a.dueno)).map(([hex]) => hex);
      if (asent.length) return asent;
      return Object.values(ctx.estado.tropas).filter(t => dd.includes(t.dueno)).map(t => E().posicionTropa(ctx.estado, t)).filter(Boolean);
    };
    for (const tropa of E().tropasDe(ctx.estado, yo)) {
      let t = ctx.estado.tropas[tropa.id];
      if (!t || t.accionUsada) continue;
      // 1. atacar o asediar lo que tenga a tiro
      let p = FWM.motor.accionesPosibles(ctx.estado, datos, t.id);
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
    const t = estado.turno + 1;
    if (t < PRIMERA_OLEADA) return null;
    return { ronda: t, fuerza: fuerza(t, defensores(estado).length), lados: lados(t) };
  }

  return { preparar, oleada, jugar, rondas, siguienteOleada, fuerza, lados, maxVivas, PRIMERA_OLEADA, defensores, idHordas };
})();

FWM.ias = FWM.ias || {};
FWM.ias.barbaros = (e, d, o) => FWM.barbaros.jugar(e, d, o);
