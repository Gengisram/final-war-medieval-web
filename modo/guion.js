// Guion de una partida (21 sep 2026): "cuando pase X, ocurre Y".
// Es lo que permite que un capítulo de campaña tenga refuerzos que llegan en el turno 8, un aliado que te traiciona,
// un objetivo que cambia a mitad de partida o un camino que se abre al tomar un pueblo. Sustituye a escribir un modo
// de juego nuevo por cada idea: el motor solo entiende de condiciones y efectos, y los capítulos son datos.
//
// estado.guion = [ { id, cuando: {...}, hacer: {...}, repetible?: true, hecho?: true } ]
//
// CUANDO (se cumplen todas las claves que lleve):
//   { turno: 8 }                          al llegar a ese turno (o después)
//   { cadaTurnos: 3, desde: 4 }           cada tres turnos a partir del 4 (repetible)
//   { controla: "q,r", equipo: 0 }        ese hexágono o asentamiento es de ese equipo
//   { sinTropas: 1 }                      ese equipo se ha quedado sin tropas
//   { heroeMuerto: 1 }                    ese equipo ya no tiene héroe
//   { asentamientos: { equipo: 1, menosDe: 2 } }
// HACER (todo lo que lleve):
//   { refuerzos: { jugador: 1, tropas: ["caballero","lancero"], donde: "capital" | "borde" | "q,r" } }
//   { equipo: { jugador: 1, nuevo: 2 } }  el que era tu aliado se pasa al otro bando
//   { objetivo: { tipo: "aguantar", equipo: 0, turnos: 12 } }   cambia el objetivo de la partida
//   { oro: { jugador: 0, cantidad: 30 } }
//   { aviso: "refuerzos_del_rey" }        clave de texto para contarlo en pantalla
window.FWM = window.FWM || {};

FWM.guion = (function () {
  const H = () => FWM.hex, E = () => FWM.estado, S = () => FWM.stats;

  const equipoDe = (j) => (j && j.equipo != null ? j.equipo : (j ? j.id : null));
  const jugadoresDe = (estado, equipo) => estado.jugadores.filter(j => equipoDe(j) === equipo);

  function seCumple(estado, datos, c) {
    if (!c) return false;
    if (c.turno != null && estado.turno < c.turno) return false;
    if (c.cadaTurnos != null) {
      const desde = c.desde || 1;
      if (estado.turno < desde || (estado.turno - desde) % c.cadaTurnos !== 0) return false;
    }
    if (c.controla != null) {
      const a = estado.asentamientos[c.controla];
      const dueno = a ? a.dueno : (estado.mapa.hexes[c.controla] || {}).dueno;
      if (dueno == null || equipoDe(estado.jugadores[dueno]) !== c.equipo) return false;
    }
    if (c.sinTropas != null && jugadoresDe(estado, c.sinTropas).some(j => E().tropasDe(estado, j.id).length > 0)) return false;
    if (c.heroeMuerto != null && jugadoresDe(estado, c.heroeMuerto).some(j => j.heroeTropa && estado.tropas[j.heroeTropa])) return false;
    if (c.asentamientos) {
      const n = jugadoresDe(estado, c.asentamientos.equipo).reduce((s, j) => s + E().asentamientosDe(estado, j.id).length, 0);
      if (!(n < c.asentamientos.menosDe)) return false;
    }
    return true;
  }

  // Sitio libre para dejar una tropa, buscando en anillos desde un hexágono.
  function hueco(estado, datos, centro, usados) {
    for (let r = 0; r <= 6; r++) {
      for (const v of (r === 0 ? [centro] : H().anillo(centro, r))) {
        const h = estado.mapa.hexes[v];
        if (!h || h.construccion || usados.has(v) || E().tropaEn(estado, v)) continue;
        if (FWM.acciones.costeTerreno(estado, datos, v) == null) continue;
        usados.add(v); return v;
      }
    }
    return null;
  }

  // Por dónde entran los refuerzos: su capital, un hexágono concreto o el borde más cercano a su gente.
  function sitioRefuerzos(estado, datos, j, donde) {
    // "objetivo": a tres casillas del pueblo que hay que tomar, en el lado de quien recibe la ayuda (25 sep 2026).
    // Sin esto la ayuda salía en tu capital, a diez casillas, y las catapultas no llegaban nunca a la muralla.
    const ob = estado.objetivo, hexOb = ob && (ob.hex || ob.hexCapital);
    if (donde === "objetivo" && hexOb) {
      const desde = j.capital || (E().tropasDe(estado, j.id).map(t => E().posicionTropa(estado, t)).filter(Boolean)[0]) || hexOb;
      const cand = Object.keys(estado.mapa.hexes).filter(k => H().distancia(k, hexOb) === 3 && datos.terrenos[estado.mapa.hexes[k].terreno].costeMovimiento != null && estado.mapa.hexes[k].construccion !== "asentamiento");
      if (cand.length) return cand.sort((a, b) => H().distancia(a, desde) - H().distancia(b, desde))[0];
    }
    if (donde && donde !== "capital" && donde !== "borde" && donde !== "objetivo" && estado.mapa.hexes[donde]) return donde;
    if (donde !== "borde" && j.capital && estado.asentamientos[j.capital]) return j.capital;
    const bordes = Object.keys(estado.mapa.hexes).filter(k => {
      const [q, r] = k.split(",").map(Number);
      const h = estado.mapa.hexes[k];
      return h.terreno !== "agua" && (q <= 0 || r <= 0 || q >= estado.mapa.ancho - 1 || r >= estado.mapa.alto - 1);
    });
    if (!bordes.length) return j.capital || Object.keys(estado.mapa.hexes)[0];
    const mios = E().tropasDe(estado, j.id).map(t => E().posicionTropa(estado, t)).filter(Boolean);
    if (!mios.length) return bordes[Math.floor(FWM.azar.siguiente(estado) * bordes.length)];
    return bordes.slice().sort((a, b) => Math.min(...mios.map(m => H().distancia(a, m))) - Math.min(...mios.map(m => H().distancia(b, m))))[0];
  }

  function refuerzos(estado, datos, ref, eventos) {
    const j = estado.jugadores[ref.jugador != null ? ref.jugador : (jugadoresDe(estado, ref.equipo)[0] || {}).id];
    if (!j || j.eliminado) return;
    const centro = sitioRefuerzos(estado, datos, j, ref.donde);
    const usados = new Set(); const puestas = [];
    for (const tipo of ref.tropas || []) {
      if (!datos.tropas[tipo]) continue;
      const hex = hueco(estado, datos, centro, usados); if (!hex) break;
      const t = E().crearTropa(estado, datos, tipo, j.id, hex);
      t.vida = S().vidaMax(estado, datos, t);
      // las paga quien las manda: si cobraran, con un solo pueblo desertaban al turno siguiente (24 sep 2026)
      t.sinPaga = true;
      puestas.push(tipo);
    }
    if (puestas.length) eventos.push({ tipo: "refuerzos", jugador: j.id, tropas: puestas, hex: centro });
  }

  // Se llama al acabar cada turno (desde motor/acciones.js). Devuelve los eventos de lo que haya pasado.
  function revisar(estado, datos) {
    const eventos = [];
    if (!estado.guion || !estado.guion.length || estado.ganador != null) return eventos;
    for (const paso of estado.guion) {
      if (paso.hecho && !paso.repetible) continue;
      // se revisa al acabar el turno de CADA jugador, pero un paso que se repite va una vez por ronda: con cuatro
      // jugadores, "cada tres turnos" disparaba cuatro veces (23 sep 2026: al Cuervo le llegaban 8 caballeros, no 2)
      if (paso.repetible && paso.ultimaRonda === estado.turno) continue;
      if (!seCumple(estado, datos, paso.cuando)) continue;
      paso.hecho = true; paso.ultimaRonda = estado.turno;
      const h = paso.hacer || {};
      if (h.refuerzos) refuerzos(estado, datos, h.refuerzos, eventos);
      if (h.equipo) {
        const j = estado.jugadores[h.equipo.jugador];
        if (j) { j.equipo = h.equipo.nuevo; eventos.push({ tipo: "cambiaBando", jugador: j.id, equipo: j.equipo }); }
      }
      // se retira de la pelea: queda en el mapa, pero ni ataca ni le atacan (capítulo 3: antes "se retiraba"
      // cambiando de equipo y seguía peleando contra todos en medio del valle)
      if (h.retirar) { const j = estado.jugadores[h.retirar.jugador]; if (j) { j.retirado = true; eventos.push({ tipo: "retirada", jugador: j.id }); } }
      if (h.objetivo) { estado.objetivo = h.objetivo; eventos.push({ tipo: "objetivo", objetivo: h.objetivo }); }
      if (h.oro) {
        const j = estado.jugadores[h.oro.jugador];
        if (j) { j.hucha.oro = Math.max(0, (j.hucha.oro || 0) + h.oro.cantidad); eventos.push({ tipo: "oroGuion", jugador: j.id, cantidad: h.oro.cantidad }); }
      }
      if (h.aviso) eventos.push({ tipo: "avisoGuion", clave: h.aviso, jugador: h.jugador != null ? h.jugador : null });
    }
    return eventos;
  }

  return { revisar, seCumple };
})();
