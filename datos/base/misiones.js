// Misiones diarias (3, se renuevan a las 00:00 UTC) y semanales (2, desde el lunes). Misma lista para todo el mundo:
// se eligen con la fecha como semilla, sin servidor. Se comprueban al acabar cada partida con los datos del resultado.
// res: { gano, tipo, turnos, matadas, conquistas, puntosClave, fundados, bando, heroeVivo, rivalHumano, perdidas }
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.misiones = {
  diarias: [
    { id: "gana", texto: "Gana una partida", oro: 8, cumple: (r) => r.gano },
    { id: "gana_bando", texto: "Gana con {bando}", oro: 12, bando: true, cumple: (r, x) => r.gano && r.bando === x.bando },
    { id: "mata8", texto: "Mata 8 tropas en una partida", oro: 10, cumple: (r) => (r.matadas || 0) >= 8 },
    { id: "funda2", texto: "Funda 2 pueblos en una partida", oro: 8, cumple: (r) => (r.fundados || 0) >= 2 },
    { id: "dia", texto: "Juega el mapa del día", oro: 6, cumple: (r) => r.tipo === "dia" },
    { id: "heroe_vivo", texto: "Gana con el héroe vivo", oro: 10, cumple: (r) => r.gano && r.heroeVivo },
    { id: "toma1", texto: "Toma un asentamiento", oro: 10, cumple: (r) => (r.conquistas || 0) >= 1 },
    { id: "clave4", texto: "Acaba con 4 puntos clave", oro: 12, cumple: (r) => (r.puntosClave || 0) >= 4 },
    { id: "rapido", texto: "Gana antes del turno 16", oro: 12, cumple: (r) => r.gano && r.turnos < 16 },
    { id: "pierde2", texto: "Gana perdiendo 2 tropas o menos", oro: 10, cumple: (r) => r.gano && (r.perdidas || 0) <= 2 },
    { id: "mata5", texto: "Mata 5 tropas en una partida", oro: 6, cumple: (r) => (r.matadas || 0) >= 5 },
    { id: "duelo", texto: "Juega un duelo online", oro: 10, cumple: (r) => r.tipo === "duelo" },
    { id: "gana_duelo", texto: "Gana un duelo online", oro: 15, cumple: (r) => r.tipo === "duelo" && r.gano },
    { id: "heroe_mata", texto: "Abate al héroe rival", oro: 12, cumple: (r) => (r.heroesMatados || 0) >= 1 },
    { id: "clave2", texto: "Acaba con 2 puntos clave", oro: 6, cumple: (r) => (r.puntosClave || 0) >= 2 },
    { id: "toma2", texto: "Toma 2 asentamientos en una partida", oro: 15, cumple: (r) => (r.conquistas || 0) >= 2 },
    { id: "gana_rapida", texto: "Gana una partida Rápida", oro: 8, cumple: (r) => r.gano && r.tipo === "rapida" },
    { id: "juega2", texto: "Juega 2 partidas", oro: 6, acumula: (r) => 1, meta: 2 },
    { id: "mata12", texto: "Mata 12 tropas entre todas las partidas de hoy", oro: 10, acumula: (r) => r.matadas || 0, meta: 12 },
    { id: "gana2", texto: "Gana 2 partidas", oro: 15, acumula: (r) => r.gano ? 1 : 0, meta: 2 },
  ],
  semanales: [
    { id: "s_gana5", texto: "Gana 5 partidas", oro: 40, acumula: (r) => r.gano ? 1 : 0, meta: 5 },
    { id: "s_mata40", texto: "Mata 40 tropas", oro: 40, acumula: (r) => r.matadas || 0, meta: 40 },
    { id: "s_duelos3", texto: "Juega 3 duelos online", oro: 50, acumula: (r) => r.tipo === "duelo" ? 1 : 0, meta: 3 },
    { id: "s_bandos3", texto: "Gana con 3 bandos distintos", oro: 50, bandos: true, meta: 3 },
    { id: "s_dias3", texto: "Juega 3 mapas del día", oro: 40, acumula: (r) => r.tipo === "dia" ? 1 : 0, meta: 3 },
    { id: "s_toma5", texto: "Toma 5 asentamientos", oro: 40, acumula: (r) => r.conquistas || 0, meta: 5 },
    { id: "s_heroes5", texto: "Abate 5 héroes", oro: 50, acumula: (r) => r.heroesMatados || 0, meta: 5 },
  ],
  bonoDiarias: 10, // por completar las 3 del día
};

// Estado y comprobación (guardado en fwm.misiones).
FWM.misiones = (function () {
  const CLAVE = "fwm.misiones";
  const D = () => FWM.datosBase.misiones;
  const hoyClave = () => new Date().toISOString().slice(0, 10);
  function semanaClave() { const h = new Date(); const l = new Date(Date.UTC(h.getUTCFullYear(), h.getUTCMonth(), h.getUTCDate() - ((h.getUTCDay() + 6) % 7))); return l.toISOString().slice(0, 10); }
  function leer() {
    let m = {}; try { m = JSON.parse(localStorage.getItem(CLAVE) || "{}"); } catch (e) { m = {}; }
    if (m.dia !== hoyClave()) { m.dia = hoyClave(); m.hechas = {}; m.progreso = {}; m.bono = false; }
    if (m.semana !== semanaClave()) { m.semana = semanaClave(); m.hechasSemana = {}; m.progresoSemana = {}; m.bandosSemana = {}; }
    m.hechas = m.hechas || {}; m.progreso = m.progreso || {}; m.hechasSemana = m.hechasSemana || {}; m.progresoSemana = m.progresoSemana || {}; m.bandosSemana = m.bandosSemana || {};
    return m;
  }
  function guardar(m) { try { localStorage.setItem(CLAVE, JSON.stringify(m)); } catch (e) { /* nada */ } }
  // Elección determinista por fecha: n misiones distintas de la lista.
  function elegir(lista, semilla, n) {
    const g = FWM.azar.crear(semilla); const copia = lista.slice(); const out = [];
    while (out.length < n && copia.length) { const i = Math.floor(g.siguiente ? g.siguiente() * copia.length : Math.random() * copia.length); out.push(copia.splice(i, 1)[0]); }
    return out;
  }
  function semillaDe(clave) { return parseInt(clave.replace(/-/g, ""), 10) % 1000003; }
  function bandoDelDia(datos) { const ids = Object.keys(datos.bandos); const g = FWM.azar.crear(semillaDe(hoyClave()) + 7); return ids[Math.floor((g.siguiente ? g.siguiente() : Math.random()) * ids.length)]; }
  // Las de hoy y las de la semana, con su estado: [{ id, texto, oro, hecha, progreso, meta }]
  function activas(datos) {
    const m = leer(); const bando = bandoDelDia(datos);
    const dia = elegir(D().diarias, semillaDe(m.dia) * 3, 3).map(x => ({ id: x.id, texto: x.texto.replace("{bando}", datos.bandos[bando] ? datos.bandos[bando].nombre : bando), oro: x.oro, hecha: !!m.hechas[x.id], progreso: m.progreso[x.id] || 0, meta: x.meta || null, ambito: "dia" }));
    const sem = elegir(D().semanales, semillaDe(m.semana) * 5 + 1, 2).map(x => ({ id: x.id, texto: x.texto, oro: x.oro, hecha: !!m.hechasSemana[x.id], progreso: x.bandos ? Object.keys(m.bandosSemana).length : (m.progresoSemana[x.id] || 0), meta: x.meta || null, ambito: "semana" }));
    return { dia, semana: sem, bono: m.bono, bandoDelDia: bando };
  }
  // Al acabar una partida: comprueba y devuelve las cumplidas [{ id, texto, oro }]. Da el oro al héroe.
  function comprobar(res, datos) {
    const m = leer(); const bando = bandoDelDia(datos); const cumplidas = [];
    for (const x of elegir(D().diarias, semillaDe(m.dia) * 3, 3)) {
      if (m.hechas[x.id]) continue;
      let ok = false;
      if (x.acumula) { m.progreso[x.id] = (m.progreso[x.id] || 0) + x.acumula(res); ok = m.progreso[x.id] >= x.meta; }
      else { try { ok = !!x.cumple(res, { bando }); } catch (e) { ok = false; } }
      if (ok) { m.hechas[x.id] = true; cumplidas.push({ id: x.id, texto: x.texto.replace("{bando}", datos.bandos[bando] ? datos.bandos[bando].nombre : bando), oro: x.oro }); }
    }
    if (!m.bono && elegir(D().diarias, semillaDe(m.dia) * 3, 3).every(x => m.hechas[x.id])) { m.bono = true; cumplidas.push({ id: "bono", texto: "Las 3 misiones del día", oro: D().bonoDiarias }); }
    if (res.gano && res.bando) m.bandosSemana[res.bando] = true;
    for (const x of elegir(D().semanales, semillaDe(m.semana) * 5 + 1, 2)) {
      if (m.hechasSemana[x.id]) continue;
      let ok = false;
      if (x.bandos) ok = Object.keys(m.bandosSemana).length >= x.meta;
      else { m.progresoSemana[x.id] = (m.progresoSemana[x.id] || 0) + x.acumula(res); ok = m.progresoSemana[x.id] >= x.meta; }
      if (ok) { m.hechasSemana[x.id] = true; cumplidas.push({ id: x.id, texto: x.texto, oro: x.oro }); }
    }
    guardar(m);
    const oro = cumplidas.reduce((s, c) => s + c.oro, 0);
    if (oro && FWM.heroe) FWM.heroe.darOro(oro);
    return cumplidas;
  }
  return { activas, comprobar, leer, bandoDelDia };
})();
