// Progreso de la campaña (fwm.campana) y batalla de la semana (fwm.batalla). Los datos están en datos/base/campana.js.
window.FWM = window.FWM || {};

FWM.campana = (function () {
  const CLAVE = "fwm.campana";
  const D = () => FWM.datosBase.campana || [];
  function leer() { try { return Object.assign({ superados: {} }, JSON.parse(localStorage.getItem(CLAVE) || "{}")); } catch (e) { return { superados: {} }; } }
  function guardar(c) { try { localStorage.setItem(CLAVE, JSON.stringify(c)); } catch (e) { /* nada */ } return c; }
  function capitulo(id) { return D().find(c => c.id === Number(id)) || null; }
  function superado(id) { return !!leer().superados[id]; }
  // el siguiente por jugar: el primero no superado (null si está toda hecha)
  function siguiente() { const c = leer(); return D().find(x => !c.superados[x.id]) || null; }
  function desbloqueado(id) { const s = siguiente(); return superado(id) || (s && s.id === Number(id)); }
  // Se llama al ganar: anota y devuelve el premio dado { oro, objeto } (null si ya estaba superado).
  function superar(id, turnos) {
    const cap = capitulo(id); if (!cap) return null;
    const c = leer(); if (c.superados[id]) return null;
    c.superados[id] = { turnos: turnos || 0, fecha: new Date().toISOString().slice(0, 10) }; guardar(c);
    const premio = { oro: cap.premio.oro || 0, objeto: null };
    if (cap.premio.objeto && FWM.heroe.darObjeto(cap.premio.objeto)) premio.objeto = cap.premio.objeto;
    if (premio.oro) FWM.heroe.darOro(premio.oro);
    return premio;
  }
  // Opciones de partida de un capítulo (para App.nuevaPartida).
  function opciones(id, bando) {
    const cap = capitulo(id); if (!cap) return null;
    return { tipo: "campana", capitulo: cap.id, mapaHecho: cap.mapa, rivales: cap.rivales, dificultad: cap.dificultad, limite: cap.limite, hucha: cap.hucha || 2, tecnologia: "todo", recursos: "equilibrado", bando: bando || "aleatorio", semilla: 5000 + cap.id * 17 };
  }
  function progreso() { const c = leer(); return { hechos: D().filter(x => c.superados[x.id]).length, total: D().length }; }
  function reiniciar() { try { localStorage.removeItem(CLAVE); } catch (e) { /* nada */ } }
  return { leer, capitulo, superado, siguiente, desbloqueado, superar, opciones, progreso, reiniciar, lista: D };
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
  // Opciones de partida de la batalla de esta semana. La semilla depende de la semana: el mismo reparto de bandos para todos.
  function opciones(bando) {
    const b = actual(); if (!b) return null;
    return { tipo: "batalla", batalla: b.id, mapaHecho: b.mapa, rivales: b.rivales, dificultad: b.dificultad, limite: b.limite, hucha: b.hucha || 2, tecnologia: "todo", recursos: "equilibrado", bando: bando || "aleatorio", semilla: 9000 + numeroSemana() };
  }
  // Días que quedan (contando hoy) hasta la batalla siguiente.
  function diasRestantes() { const l = new Date(semanaClave() + "T00:00:00Z"); return Math.max(1, 7 - Math.floor((Date.now() - l) / 864e5)); }
  return { actual, leer, anotar, opciones, semanaClave, diasRestantes };
})();
