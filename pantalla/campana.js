// Progreso de la campaña (fwm.campana) y batalla de la semana (fwm.batalla). Los datos están en datos/base/campana.js.
window.FWM = window.FWM || {};

// 13 sep 2026: una campaña por facción. FWM.campana.de("mali") da la de Malí con la misma forma de siempre;
// FWM.campana a secas sigue siendo la de Castilla (así no se rompe nada de lo que ya la usaba). El progreso de
// Castilla sigue en fwm.campana; el de las demás, en fwm.campana.<facción>.
FWM.campana = (function () {
  const cache = {};
  // De qué gente son los jefes rivales de cada campaña (para sus nombres): el bando del rival solo da el color.
  // Los merkitas de Temujín no se llaman Kálmán, ni los de Sosso, Konrad (14 sep 2026).
  function culturaEnemigo(campana, e) {
    if (campana === "mongoles") return "mongoles";
    if (campana === "mali") return "mali";
    if (campana === "eslavos") return e.bando;
    if (campana === "castilla") return e.bando === "granada" ? "granada" : "castilla";
    return e.faccion || e.bando;
  }
  function de(id) {
    id = (FWM.datosBase.campanas && FWM.datosBase.campanas[id]) ? id : "castilla";
    if (cache[id]) return cache[id];
    const CLAVE = id === "castilla" ? "fwm.campana" : "fwm.campana." + id;
    const def = () => (FWM.datosBase.campanas && FWM.datosBase.campanas[id]) || { capitulos: FWM.datosBase.campana || [] };
    const D = () => def().capitulos || [];
    function leer() { try { return Object.assign({ superados: {} }, JSON.parse(localStorage.getItem(CLAVE) || "{}")); } catch (e) { return { superados: {} }; } }
    function guardar(c) { try { localStorage.setItem(CLAVE, JSON.stringify(c)); } catch (e) { /* nada */ } return c; }
    function capitulo(n) { return D().find(c => c.id === Number(n)) || null; }
    function superado(n) { return !!leer().superados[n]; }
    // el siguiente por jugar: el primero no superado (null si está toda hecha)
    function siguiente() { const c = leer(); return D().find(x => !c.superados[x.id]) || null; }
    function desbloqueado(n) { const sg = siguiente(); return superado(n) || (sg && sg.id === Number(n)); }
    // Se llama al ganar: anota y devuelve el premio dado { oro, objeto } (null si ya estaba superado).
    function superar(n, turnos) {
      const cap = capitulo(n); if (!cap) return null;
      const c = leer(); if (c.superados[n]) return null;
      c.superados[n] = { turnos: turnos || 0, fecha: new Date().toISOString().slice(0, 10) }; guardar(c);
      const premio = { oro: cap.premio.oro || 0, objeto: null };
      if (cap.premio.objeto && FWM.heroe.darObjeto(cap.premio.objeto)) premio.objeto = cap.premio.objeto;
      if (premio.oro) FWM.heroe.darOro(premio.oro);
      return premio;
    }
    // Opciones de partida de un capítulo (para App.nuevaPartida). Se juega con la facción de la campaña.
    // Cada campaña tiene su semilla (antes vikingos, saladino y mongoles compartían: sus nombres miden 8 letras).
    function opciones(n) {
      const cap = capitulo(n); if (!cap) return null;
      return { tipo: "campana", campana: id, faccion: id, capitulo: cap.id, mapaHecho: cap.mapa, rivales: cap.rivales, dificultad: cap.dificultad, limite: cap.limite, hucha: cap.hucha || 2, tecnologia: "todo", recursos: "equilibrado", semilla: 5000 + cap.id * 17 + (id === "castilla" ? 0 : [...id].reduce((s, c) => s * 31 + c.charCodeAt(0), 7) % 100000), jefe: cap.jefe || null, enemigos: cap.enemigos ? cap.enemigos.map(e => Object.assign({ cultura: culturaEnemigo(id, e) }, e)) : null };
    }
    function progreso() { const c = leer(); return { hechos: D().filter(x => c.superados[x.id]).length, total: D().length }; }
    function reiniciar() { try { localStorage.removeItem(CLAVE); } catch (e) { /* nada */ } }
    cache[id] = { id, datos: def, leer, capitulo, superado, siguiente, desbloqueado, superar, opciones, progreso, reiniciar, lista: D };
    return cache[id];
  }
  const castilla = de("castilla");
  // la mejor campaña de todas (para la medalla Cronista)
  function mejorProgreso() { return Math.max(0, ...Object.keys(FWM.datosBase.campanas || { castilla: 1 }).map(id => de(id).progreso().hechos)); }
  return Object.assign({ de, mejorProgreso, ids: () => Object.keys(FWM.datosBase.campanas || { castilla: 1 }) }, castilla, { opciones: (n) => castilla.opciones(n) });
})();

FWM.batalla = (function () {
  const CLAVE = "fwm.batalla";
  const D = () => FWM.datosBase.batallas || [];
  // clave de la semana (lunes, fecha UTC) y su número desde el 1 de enero de 2024
  function semanaClave() { const h = new Date(); const l = new Date(Date.UTC(h.getUTCFullYear(), h.getUTCMonth(), h.getUTCDate() - ((h.getUTCDay() + 6) % 7))); return l.toISOString().slice(0, 10); }
  function numeroSemana() { const l = new Date(semanaClave() + "T00:00:00Z"); return Math.floor((l - Date.UTC(2024, 0, 1)) / (7 * 864e5)); }
  function actual() { const lista = D(); if (!lista.length) return null; const b = lista[((numeroSemana() % lista.length) + lista.length) % lista.length]; return Object.assign({ semana: semanaClave() }, b); }
  function leer() { try { const x = JSON.parse(localStorage.getItem(CLAVE) || "{}"); return x.semana === semanaClave() ? x : { semana: semanaClave(), partidas: 0, mejor: 0, ganadas: 0 }; } catch (e) { return { semana: semanaClave(), partidas: 0, mejor: 0, ganadas: 0 }; } }
  function anotar(res) { const x = leer(); x.partidas = (x.partidas || 0) + 1; x.mejor = Math.max(x.mejor || 0, res.puntos || 0); if (res.gano) x.ganadas = (x.ganadas || 0) + 1; try { localStorage.setItem(CLAVE, JSON.stringify(x)); } catch (e) { /* nada */ } return x; }
  // Opciones de partida de la batalla de esta semana. La semilla depende de la semana: los mismos rivales para todos.
  function opciones(faccion) {
    const b = actual(); if (!b) return null;
    return { tipo: "batalla", batalla: b.id, mapaHecho: b.mapa, rivales: b.rivales, dificultad: b.dificultad, limite: b.limite, hucha: b.hucha || 2, tecnologia: "todo", recursos: "equilibrado", faccion: faccion || null, semilla: 9000 + numeroSemana() };
  }
  // Días que quedan (contando hoy) hasta la batalla siguiente.
  function diasRestantes() { const l = new Date(semanaClave() + "T00:00:00Z"); return Math.max(1, 7 - Math.floor((Date.now() - l) / 864e5)); }
  return { actual, leer, anotar, opciones, semanaClave, diasRestantes };
})();
