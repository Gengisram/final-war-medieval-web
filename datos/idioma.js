// Idioma del juego (6 sep 2026). Español por defecto; inglés si lo elige el jugador o si el aparato está en inglés.
// Los textos de la interfaz están en datos/base/textos.<idioma>.js y los de los datos (nombres, descripciones,
// misiones, medallas, glosario, legal) en datos/base/traduccion.<idioma>.js. Lo que falte se queda en español.
window.FWM = window.FWM || {};

FWM.idioma = (function () {
  const CLAVE = "fwm.idioma";
  const DISPONIBLES = ["es", "en"];
  const NOMBRES = { es: "Español", en: "English" };

  function delAparato() {
    try { return (navigator.language || "es").toLowerCase().startsWith("en") ? "en" : "es"; } catch (e) { return "es"; }
  }
  function actual() {
    try { const g = localStorage.getItem(CLAVE); if (DISPONIBLES.includes(g)) return g; } catch (e) { /* nada */ }
    return delAparato();
  }
  function poner(id) {
    if (!DISPONIBLES.includes(id) || id === actual()) return false;
    try { localStorage.setItem(CLAVE, id); } catch (e) { /* nada */ }
    return true;
  }

  // Mezcla profunda: lo traducido pisa al español, y lo que no esté traducido se queda como está.
  function mezclar(base, encima) {
    if (!encima) return base;
    const salida = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    for (const [k, v] of Object.entries(encima)) {
      if (v && typeof v === "object" && !Array.isArray(v) && base && typeof base[k] === "object" && !Array.isArray(base[k])) salida[k] = mezclar(base[k], v);
      else salida[k] = v;
    }
    return salida;
  }

  // Aplica el idioma a unos datos ya cargados. Devuelve los mismos datos, modificados.
  function aplicar(datos) {
    const id = actual(); if (id === "es") return datos;
    const T = (FWM.textos || {})[id]; if (T) datos.textos = mezclar(datos.textos, T);
    const D = (FWM.traducciones || {})[id]; if (!D) return datos;
    // secciones de "cartas": nombre, descripción, rasgo, texto
    for (const s of ["tropas", "asentamientos", "terrenos", "yacimientos", "recursos", "tecnologias", "bandos", "objetos"]) {
      if (!datos[s] || !D[s]) continue;
      for (const [k, v] of Object.entries(D[s])) if (datos[s][k]) Object.assign(datos[s][k], v);
    }
    if (D.medallas && datos.medallas) datos.medallas = datos.medallas.map(m => D.medallas[m.id] ? Object.assign({}, m, D.medallas[m.id]) : m);
    if (D.glosario && datos.glosario) datos.glosario = datos.glosario.map(g => D.glosario[g.id] ? Object.assign({}, g, D.glosario[g.id]) : g);
    if (D.legal && datos.legal) datos.legal = mezclar(datos.legal, D.legal);
    // el héroe: clases, niveles y mejoras
    const H = datos.heroes;
    if (H && D.heroesClases) for (const [k, v] of Object.entries(D.heroesClases)) if (H.clases[k]) Object.assign(H.clases[k], v);
    if (H && D.heroesNiveles) H.niveles = H.niveles.map(n => D.heroesNiveles[n.nivel] ? Object.assign({}, n, { nombre: D.heroesNiveles[n.nivel] }) : n);
    if (H && D.heroesMejoras) for (const [k, v] of Object.entries(D.heroesMejoras)) if (H.mejoras[k]) Object.assign(H.mejoras[k], v);
    // las tropas del héroe las crea el cargador a partir de las clases: se rehacen los nombres
    if (H && D.tropas) for (const clase of Object.keys(H.clases || {})) { const t = datos.tropas["heroe_" + clase]; const tr = D.tropas["heroe_" + clase]; if (t && tr) Object.assign(t, tr); }
    // misiones, campaña, batallas y mapas hechos a mano viven fuera de "datos": se traducen en su sitio
    if (D.misiones && FWM.datosBase.misiones) {
      for (const lista of [FWM.datosBase.misiones.diarias, FWM.datosBase.misiones.semanales]) {
        for (const m of lista || []) if (D.misiones[m.id]) m.texto = D.misiones[m.id];
      }
    }
    if (D.campana && FWM.datosBase.campana) for (const c of FWM.datosBase.campana) if (D.campana[c.id]) Object.assign(c, D.campana[c.id]);
    if (D.batallas && FWM.datosBase.batallas) for (const b of FWM.datosBase.batallas) if (D.batallas[b.id]) Object.assign(b, D.batallas[b.id]);
    if (D.mapas && FWM.mapasHechos) for (const [k, v] of Object.entries(D.mapas)) if (FWM.mapasHechos.MAPAS[k]) Object.assign(FWM.mapasHechos.MAPAS[k], v);
    if (D.escenarios && FWM.datosBase.escenarios) for (const e of FWM.datosBase.escenarios) if (D.escenarios[e.id]) Object.assign(e, D.escenarios[e.id]);
    return datos;
  }

  return { actual, poner, aplicar, disponibles: () => DISPONIBLES.slice(), nombre: (id) => NOMBRES[id] || id };
})();
