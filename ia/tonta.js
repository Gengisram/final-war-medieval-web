// IA v1 "tonta": reglas fijas con prioridades, sin búsqueda.
// Solo usa FWM.motor.aplicar y accionesPosibles; nunca toca el estado a mano.
window.FWM = window.FWM || {};

FWM.ia = (function () {
  const H = () => FWM.hex, E = () => FWM.estado, S = () => FWM.stats, M = () => FWM.motor;
  const ORDEN_TEC = ["agricultura", "milicia", "canteria", "maquinaria", "arqueria", "caballeria", "fortificacion", "catapulta"];
  const MAX_ACCIONES = 300;

  // Juega el turno completo del jugador activo y devuelve { estado, eventos }.
  // opciones.alAplicar(estado, accion, eventos) se llama tras cada acción.
  function jugar(estado, datos, opciones) {
    opciones = opciones || {};
    const ctx = { estado, datos, yo: estado.jugadorActivo, acciones: 0, eventos: [] };
    const hacer = (accion) => {
      if (ctx.acciones >= MAX_ACCIONES) return false;
      const r = M().aplicar(ctx.estado, datos, accion);
      if (!r.ok) return false;
      ctx.estado = r.estado; ctx.acciones++;
      ctx.eventos.push(...r.eventos);
      if (opciones.alAplicar) opciones.alAplicar(ctx.estado, accion, r.eventos);
      return true;
    };
    ctx.hacer = hacer;

    if (!ctx.estado.jugadores[ctx.yo].eliminado && ctx.estado.ganador == null) {
      investigar(ctx);
      construir(ctx);
      reclutar(ctx);
      moverTropas(ctx);
    }
    hacer({ tipo: "finTurno" });
    return { estado: ctx.estado, eventos: ctx.eventos };
  }

  function investigar(ctx) {
    const j = ctx.estado.jugadores[ctx.yo];
    if (j.investigando) return;
    for (const id of ORDEN_TEC) {
      if (!S().tecDisponible(ctx.estado, ctx.datos, j, id)) continue;
      if (ctx.hacer({ tipo: "investigar", tec: id })) return;
    }
  }

  function construir(ctx) {
    for (const { hex, a } of E().asentamientosDe(ctx.estado, ctx.yo)) {
      if (a.tipo === "pueblo") ctx.hacer({ tipo: "mejorarAsentamiento", asentamiento: hex });
    }
    const j = ctx.estado.jugadores[ctx.yo];
    const asents = E().asentamientosDe(ctx.estado, ctx.yo);
    const castillos = asents.filter(x => x.a.tipo === "castillo").length;
    const otros = asents.length - castillos;
    if (j.capital && castillos < Math.max(1, Math.floor(otros / 2)) && (j.hucha.piedra || 0) >= 5 && (j.hucha.oro || 0) >= 45) {
      for (const v of H().vecinos(j.capital)) {
        if (ctx.hacer({ tipo: "construir", hex: v, que: "castillo" })) break;
      }
    }
  }

  function reclutar(ctx) {
    const datos = ctx.datos;
    for (const { hex, a } of E().asentamientosDe(ctx.estado, ctx.yo)) {
      const estado = ctx.estado;
      const j = estado.jugadores[ctx.yo];
      const tropas = E().tropasDe(estado, ctx.yo);
      const campesinos = tropas.filter(t => t.tipo === "campesino").length;
      const nAsent = E().asentamientosDe(estado, ctx.yo).length;
      const res = FWM.economia.resumen(estado, datos, ctx.yo);
      const neto = (res.ingresos.oro || 0) - res.gasto;
      if (tropas.length >= nAsent * 3 + 2) return;
      // si hay campesinos libres que quieren fundar, guardar el oro para eso
      const quieroFundar = nAsent < 3 + Math.floor(estado.turno / 12);
      const campesinosLibres = tropas.filter(t => t.tipo === "campesino" && !t.acuarteladaEn).length;
      if (quieroFundar && campesinosLibres > 0 && (j.hucha.oro || 0) < 40) return;
      const def = datos.asentamientos[a.tipo];
      const opciones = Object.keys(datos.tropas).filter(t => !datos.tropas[t].noReclutable && (def.recluta.includes("*") || def.recluta.includes(t)));
      const catapultas = tropas.filter(t => t.tipo === "catapulta").length;
      const militares = tropas.length - campesinos;
      let orden;
      if (campesinos < 2 + Math.floor(nAsent / 3)) orden = ["campesino"].concat(opciones.filter(t => t !== "campesino"));
      else if (catapultas < 1 + Math.floor(militares / 4)) orden = ["catapulta", "caballero", "lancero", "arquero", "campesino"];
      else orden = ["caballero", "lancero", "arquero", "catapulta", "campesino"];
      orden = orden.filter(t => opciones.includes(t));
      if (a.tipo === "pueblo" && campesinos >= 3 + nAsent) continue;
      for (const tipo of orden) {
        const c = datos.tropas[tipo].coste;
        if (neto - datos.tropas[tipo].mantenimiento < 1) continue;       // no gastar más de lo que entra
        if ((j.hucha.oro || 0) - (c.oro || 0) < 8) continue;               // colchón
        if (ctx.hacer({ tipo: "reclutar", asentamiento: hex, que: tipo })) break;
      }
    }
  }

  function moverTropas(ctx) {
    const ids = E().tropasDe(ctx.estado, ctx.yo).map(t => t.id);
    for (const id of ids) {
      const t = ctx.estado.tropas[id];
      if (!t || t.accionUsada) continue;
      actuarTropa(ctx, id);
    }
  }

  function actuarTropa(ctx, id) {
    const { datos, yo } = ctx;
    let estado = ctx.estado;
    let t = estado.tropas[id];
    const def = datos.tropas[t.tipo];
    const p = M().accionesPosibles(estado, datos, id);
    const j = estado.jugadores[yo];
    const nAsent = E().asentamientosDe(estado, yo).length;
    const quieroFundar = nAsent < 3 + Math.floor(estado.turno / 12);

    if (t.acuarteladaEn) {
      const a = estado.asentamientos[t.acuarteladaEn];
      if (p.atacar.length) { const o = mejorAtaque(estado, datos, t, p.atacar); if (o) return ctx.hacer({ tipo: "atacar", tropa: id, objetivo: o }); }
      if (p.asediar.length && def.stats.asedio >= 30) return ctx.hacer({ tipo: "asediar", tropa: id, objetivo: p.asediar[0] });
      if (p.mejorarA.length && (j.hucha.oro || 0) > 50) return ctx.hacer({ tipo: "mejorarTropa", tropa: id, que: p.mejorarA[p.mejorarA.length - 1] });
      // la última tropa de la guarnición se queda
      if (a.guarnicion.length <= 1) return false;
    }

    if (p.atacar.length) {
      const o = mejorAtaque(estado, datos, t, p.atacar);
      if (o) return ctx.hacer({ tipo: "atacar", tropa: id, objetivo: o });
    }
    if (p.asediar.length && (def.stats.asedio >= 30 || !p.atacar.length)) {
      return ctx.hacer({ tipo: "asediar", tropa: id, objetivo: p.asediar[0] });
    }
    if (p.fundar && quieroFundar) return ctx.hacer({ tipo: "fundar", tropa: id });
    if (p.reclamar && t.hex) {
      const h = estado.mapa.hexes[t.hex];
      if (h.yacimiento) return ctx.hacer({ tipo: "reclamar", tropa: id });
    }

    const destinos = Object.keys(p.mover);
    if (!destinos.length) return false;
    const objetivo = elegirObjetivo(estado, datos, yo, t, quieroFundar);
    if (!objetivo) return false;
    const distActual = H().distancia(E().posicionTropa(estado, t), objetivo);
    let mejor = null, mejorD = Infinity;
    for (const d of destinos) {
      const h = estado.mapa.hexes[d];
      if (h.construccion === "asentamiento" && estado.asentamientos[d].dueno === yo && d !== objetivo) continue;
      const dist = H().distancia(d, objetivo);
      if (def.disparaSinMover && dist < 2) continue;
      if (dist < mejorD) { mejorD = dist; mejor = d; }
    }
    if (!mejor || mejorD >= distActual) {
      // no puede acercarse: al menos reclamar donde está si es útil
      if (p.reclamar && t.hex) {
        const vecinoPropio = H().vecinos(t.hex).some(v => estado.mapa.hexes[v] && estado.mapa.hexes[v].dueno === yo);
        if (vecinoPropio) return ctx.hacer({ tipo: "reclamar", tropa: id });
      }
      return false;
    }
    if (!ctx.hacer({ tipo: "mover", tropa: id, a: mejor })) return false;

    // tras moverse
    estado = ctx.estado; t = estado.tropas[id];
    if (!t || t.accionUsada) return true;
    const p2 = M().accionesPosibles(estado, datos, id);
    if (p2.atacar.length) { const o = mejorAtaque(estado, datos, t, p2.atacar); if (o) return ctx.hacer({ tipo: "atacar", tropa: id, objetivo: o }); }
    if (p2.fundar && quieroFundar) return ctx.hacer({ tipo: "fundar", tropa: id });
    if (p2.reclamar && t.hex) {
      const h = estado.mapa.hexes[t.hex];
      const vecinoPropio = H().vecinos(t.hex).some(v => estado.mapa.hexes[v] && estado.mapa.hexes[v].dueno === yo);
      if (h.yacimiento || t.hex === objetivo || (vecinoPropio && def.puedeFundar)) return ctx.hacer({ tipo: "reclamar", tropa: id });
    }
    return true;
  }

  function mejorAtaque(estado, datos, t, objetivos) {
    let mejor = null, mejorPunt = -Infinity;
    for (const o of objetivos) {
      const pv = M().prever(estado, datos, t.id, o);
      if (!pv) continue;
      const haces = (pv.haces[0] + pv.haces[1]) / 2;
      const recibes = pv.recibes ? (pv.recibes[0] + pv.recibes[1]) / 2 : 0;
      const mata = pv.haces[0] >= pv.vidaDefensor ? 50 : 0;
      const muero = pv.recibes && pv.recibes[1] >= t.vida ? -80 : 0;
      const punt = haces - recibes + mata + muero + (pv.asentamiento ? 10 : 0);
      if (punt > mejorPunt) { mejorPunt = punt; mejor = o; }
    }
    return mejorPunt > -25 ? mejor : null;
  }

  function elegirObjetivo(estado, datos, yo, t, quieroFundar) {
    const pos = E().posicionTropa(estado, t);
    const def = datos.tropas[t.tipo];
    const candidatos = [];
    const militar = !def.puedeFundar;
    for (const [k, h] of Object.entries(estado.mapa.hexes)) {
      if (h.terreno === "agua") continue;
      if (h.yacimiento && h.dueno !== yo && !E().tropaEn(estado, k)) candidatos.push({ hex: k, prioridad: militar ? 1.5 : (h.dueno == null ? 3 : 2) });
    }
    if (def.puedeFundar && quieroFundar) {
      const asents = Object.keys(estado.asentamientos);
      for (const [k, h] of Object.entries(estado.mapa.hexes)) {
        if (h.terreno === "agua" || h.construccion || (h.dueno != null && h.dueno !== yo)) continue;
        if (E().tropaEn(estado, k)) continue;
        if (!asents.every(a => H().distancia(a, k) >= 2)) continue;
        if (!asents.some(a => estado.asentamientos[a].dueno === yo && H().distancia(a, k) <= 4)) continue;
        candidatos.push({ hex: k, prioridad: 3.2 });
      }
    }
    if (militar || !candidatos.length) {
      for (const [k, a] of Object.entries(estado.asentamientos)) {
        if (a.dueno === yo) continue;
        candidatos.push({ hex: k, prioridad: a.guarnicion.length === 0 ? 4.5 : 3 });
      }
      for (const e of Object.values(estado.tropas)) {
        if (e.dueno === yo || !e.hex) continue;
        candidatos.push({ hex: e.hex, prioridad: 2 });
      }
    }
    for (const { hex, a } of E().asentamientosDe(estado, yo)) {
      if (a.guarnicion.length === 0 && !def.disparaSinMover && !def.puedeFundar) candidatos.push({ hex, prioridad: 3.5 });
    }
    let mejor = null, mejorV = -Infinity;
    for (const c of candidatos) {
      const d = H().distancia(pos, c.hex);
      if (d === 0) continue;
      const v = c.prioridad * 10 - d;
      if (v > mejorV) { mejorV = v; mejor = c.hex; }
    }
    return mejor;
  }

  return { jugar };
})();
