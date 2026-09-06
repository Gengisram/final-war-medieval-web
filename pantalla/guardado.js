// Guardado en el navegador (localStorage).
window.FWM = window.FWM || {};

FWM.guardado = (function () {
  const CLAVE = "fwm.partida";
  function guardar(estado, opciones) {
    try { localStorage.setItem(CLAVE, JSON.stringify({ estado, opciones, fecha: Date.now() })); } catch (e) { /* sin sitio o modo privado */ }
  }
  function cargar() {
    try {
      const s = localStorage.getItem(CLAVE);
      if (!s) return null;
      const d = JSON.parse(s);
      if (!d || !d.estado || d.estado.version !== 4) return null;
      return d;
    } catch (e) { return null; }
  }
  function borrar() { try { localStorage.removeItem(CLAVE); } catch (e) { /* nada */ } }

  // Récords locales: partidas, victorias, racha, mejor victoria por tipo, historial.
  const CLAVE_RECORDS = "fwm.records";
  function records() {
    try {
      const r = JSON.parse(localStorage.getItem(CLAVE_RECORDS) || "null");
      return Object.assign(vacios(), r || {});
    } catch (e) { return vacios(); }
  }
  function vacios() { return { barbarosRecord: 0, partidas: 0, ganadas: 0, racha: 0, mejorRacha: 0, mejorVictoria: {}, historial: [], puntosTotal: 0, mejorPuntos: 0, rachaDias: 0, mejorRachaDias: 0, ultimoDia: null, ganadasPorBando: {}, medallas: {}, heroesMatados: 0, duelosGanados: 0, diasGanados: 0 }; }
  const diaAnterior = (f) => { const d = new Date(f + "T12:00:00"); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); };
  // resultado: { gano, turnos, tipo, mapa, fecha, semilla, puntos, bando, matadas, perdidas, conquistas, puntosClave }
  // ctx (opcional): { datos, estado, humano } para comprobar medallas. Devuelve los récords; r.nuevasMedallas lista las recién ganadas (no se guarda).
  function anotarResultado(resultado, ctx) {
    const r = records();
    r.partidas += 1;
    // racha de días seguidos jugando
    const hoy = resultado.fecha || new Date().toISOString().slice(0, 10);
    if (r.ultimoDia !== hoy) { r.rachaDias = (r.ultimoDia === diaAnterior(hoy)) ? (r.rachaDias || 0) + 1 : 1; r.ultimoDia = hoy; r.mejorRachaDias = Math.max(r.mejorRachaDias || 0, r.rachaDias); }
    if (resultado.gano && resultado.bando) r.ganadasPorBando[resultado.bando] = (r.ganadasPorBando[resultado.bando] || 0) + 1;
    if (resultado.gano) {
      r.ganadas += 1; r.racha += 1; r.mejorRacha = Math.max(r.mejorRacha, r.racha);
      const tipo = resultado.tipo || "normal";
      if (!r.mejorVictoria[tipo] || resultado.turnos < r.mejorVictoria[tipo]) r.mejorVictoria[tipo] = resultado.turnos;
    } else r.racha = 0;
    r.puntosTotal += resultado.puntos || 0;
    r.heroesMatados = (r.heroesMatados || 0) + (resultado.heroesMatados || 0);
    if (resultado.gano && resultado.tipo === "duelo" && resultado.rivalHumano) r.duelosGanados = (r.duelosGanados || 0) + 1;
    if (resultado.gano && resultado.tipo === "dia") r.diasGanados = (r.diasGanados || 0) + 1;
    if (resultado.gano && resultado.dificultad === "dificil") r.ganadasDificil = (r.ganadasDificil || 0) + 1;
    // el récord anterior se guarda aparte: la ceremonia lo necesita para saber si esta partida lo ha batido
    if (resultado.tipo === "barbaros") { r.barbarosRecordAntes = r.barbarosRecord || 0; r.barbarosRecord = Math.max(r.barbarosRecord || 0, resultado.rondas || 0); }
    if (resultado.gano && resultado.tipo === "campana" && FWM.campana) r.campana = FWM.campana.progreso().hechos + (FWM.campana.superado(resultado.capitulo) ? 0 : 1);
    r.mejorPuntos = Math.max(r.mejorPuntos || 0, resultado.puntos || 0);
    r.historial.unshift(resultado);
    if (r.historial.length > 30) r.historial.length = 30;
    // medallas nuevas
    const nuevas = [];
    if (ctx && ctx.datos && ctx.datos.medallas) {
      for (const m of ctx.datos.medallas) {
        const tengo = FWM.medallas.nivelGuardado(r, m.id);
        if (tengo >= FWM.medallas.maxNivel(m)) continue;
        const n = FWM.medallas.nivelAlcanzado(m, { res: resultado, r, estado: ctx.estado, datos: ctx.datos, humano: ctx.humano });
        if (n > tengo) { r.medallas[m.id] = { nivel: n, fecha: hoy }; nuevas.push({ id: m.id, nivel: n, desde: tengo }); }
      }
    }
    try { localStorage.setItem(CLAVE_RECORDS, JSON.stringify(r)); } catch (e) { /* nada */ }
    r.nuevasMedallas = nuevas;
    return r;
  }
  // Racha de días viva: hoy o ayer se jugó.
  function rachaViva(r) { const hoy = new Date().toISOString().slice(0, 10); return r.ultimoDia === hoy || r.ultimoDia === diaAnterior(hoy) ? (r.rachaDias || 0) : 0; }
  // Semilla del mapa del día: la misma para todo el mundo durante el día (fecha UTC).
  function semillaDelDia() { const f = new Date().toISOString().slice(0, 10).replace(/-/g, ""); return (parseInt(f, 10) * 7919) % 900000 + 1000; }
  // Puntos acumulados: hoy, últimos 7 días (del historial), total y mejor partida.
  function resumenPuntos(r, hoy) {
    hoy = hoy || new Date();
    const dia = (f) => new Date(f + "T00:00:00");
    const msDia = 86400000;
    let puntosHoy = 0, semana = 0;
    for (const h of r.historial || []) {
      if (!h.fecha) continue;
      const d = (hoy - dia(h.fecha)) / msDia;
      if (d < 1) puntosHoy += h.puntos || 0;
      if (d < 7) semana += h.puntos || 0;
    }
    return { hoy: puntosHoy, semana, total: r.puntosTotal || 0, mejor: r.mejorPuntos || 0 };
  }
  function textoPuntos(r, T) {
    const p = resumenPuntos(r);
    return `${p.hoy} ${T.puntosHoy} · ${p.semana} ${T.puntosSemana} · ${p.total} ${T.puntosTotal} · ${T.mejorPartida} ${p.mejor}`;
  }
  // Ajustes del jugador: nombre y bando favorito (el sonido va aparte, en sonido.js).
  const CLAVE_AJUSTES = "fwm.ajustes";
  function ajustes() { try { return Object.assign({ nombre: "", bando: "aleatorio" }, JSON.parse(localStorage.getItem(CLAVE_AJUSTES) || "{}")); } catch (e) { return { nombre: "", bando: "aleatorio" }; } }
  function guardarAjustes(a) { try { localStorage.setItem(CLAVE_AJUSTES, JSON.stringify(Object.assign(ajustes(), a))); } catch (e) { /* nada */ } }
  return { guardar, cargar, borrar, records, anotarResultado, resumenPuntos, textoPuntos, ajustes, guardarAjustes, rachaViva, semillaDelDia };
})();
