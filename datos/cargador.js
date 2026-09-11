// Carga los datos base y los mods (si los hay), los fusiona y los valida.
// Un mod es un objeto con la misma forma que FWM.datosBase; lo que traiga
// se añade o sobrescribe por clave.
window.FWM = window.FWM || {};

FWM.cargador = (function () {
  const SECCIONES = ["recursos", "terrenos", "yacimientos", "tropas", "asentamientos",
    "construcciones", "tecnologias", "bandos", "dados", "tiposDano", "reglas"];

  function fusionar(base, mod) {
    const salida = JSON.parse(JSON.stringify(base));
    for (const s of SECCIONES) {
      if (!mod[s]) continue;
      salida[s] = salida[s] || {};
      for (const k of Object.keys(mod[s])) salida[s][k] = mod[s][k];
    }
    if (mod.textos) salida.textos = Object.assign({}, salida.textos, mod.textos);
    if (mod.glosario) salida.glosario = (salida.glosario || []).concat(mod.glosario);
    if (mod.legal) salida.legal = Object.assign({}, salida.legal, mod.legal);
    if (mod.huchaInicial) salida.huchaInicial = mod.huchaInicial;
    if (mod.nombresAsentamientos) salida.nombresAsentamientos = mod.nombresAsentamientos;
    return salida;
  }

  function validar(d) {
    const errores = [];
    const existeTec = id => !!d.tecnologias[id];
    const existeRec = id => !!d.recursos[id];
    const revisarCoste = (coste, donde) => {
      for (const r of Object.keys(coste || {})) if (!existeRec(r)) errores.push(donde + ": recurso desconocido " + r);
    };
    for (const [id, t] of Object.entries(d.tropas)) {
      revisarCoste(t.coste, "tropa " + id);
      for (const req of t.requiere || []) if (!existeTec(req)) errores.push("tropa " + id + " requiere tecnología desconocida " + req);
      for (const m of t.mejoraA || []) if (!d.tropas[m]) errores.push("tropa " + id + " mejora a tropa desconocida " + m);
      for (const s of ["ataque", "asedio", "defensa", "vida", "alcance", "movimiento"]) {
        if (typeof t.stats[s] !== "number") errores.push("tropa " + id + ": falta stat " + s);
      }
      if (!d.tiposDano[t.tipoDano]) errores.push("tropa " + id + ": tipo de daño desconocido " + t.tipoDano);
    }
    for (const [id, a] of Object.entries(d.asentamientos)) {
      revisarCoste(a.coste, "asentamiento " + id);
      revisarCoste(a.produce, "asentamiento " + id + " produce");
      for (const req of a.requiere || []) if (!existeTec(req)) errores.push("asentamiento " + id + " requiere tecnología desconocida " + req);
      if (a.desde && !d.asentamientos[a.desde]) errores.push("asentamiento " + id + " desde desconocido " + a.desde);
      if (a.mejoraA && !d.asentamientos[a.mejoraA]) errores.push("asentamiento " + id + " mejoraA desconocido " + a.mejoraA);
      if (!d.asentamientos[a.alConquistar]) errores.push("asentamiento " + id + " alConquistar desconocido");
      for (const r of a.recluta) if (r !== "*" && !d.tropas[r]) errores.push("asentamiento " + id + " recluta tropa desconocida " + r);
    }
    for (const [id, y] of Object.entries(d.yacimientos)) revisarCoste(y.produce, "yacimiento " + id);
    for (const [id, t] of Object.entries(d.tecnologias)) {
      revisarCoste(t.coste, "tecnología " + id);
      for (const req of t.requiere || []) if (!existeTec(req)) errores.push("tecnología " + id + " requiere desconocida " + req);
      for (const e of t.efectos || []) {
        if (e.tipo === "produccion_yacimiento" && !d.yacimientos[e.yacimiento]) errores.push("tecnología " + id + ": yacimiento desconocido " + e.yacimiento);
        if (e.tipo === "produccion_asentamiento") for (const a of e.asentamientos) if (!d.asentamientos[a]) errores.push("tecnología " + id + ": asentamiento desconocido " + a);
        if (e.tipo === "asentamiento" && !d.asentamientos[e.asentamiento]) errores.push("tecnología " + id + ": asentamiento desconocido " + e.asentamiento);
        if ((e.tipo === "produccion_yacimiento" || e.tipo === "produccion_asentamiento") && !existeRec(e.recurso)) errores.push("tecnología " + id + ": recurso desconocido " + e.recurso);
      }
    }
    for (const [id, b] of Object.entries(d.bandos)) {
      if (!d.asentamientos[b.asentamientoInicial]) errores.push("bando " + id + ": asentamiento inicial desconocido");
      for (const t of b.tropasIniciales) if (!d.tropas[t]) errores.push("bando " + id + ": tropa inicial desconocida " + t);
    }
    // ciclos en el árbol
    const visitando = new Set(), listo = new Set();
    const visitar = id => {
      if (listo.has(id)) return;
      if (visitando.has(id)) { errores.push("ciclo en tecnologías en " + id); return; }
      visitando.add(id);
      for (const r of d.tecnologias[id].requiere || []) if (d.tecnologias[r]) visitar(r);
      visitando.delete(id); listo.add(id);
    };
    for (const id of Object.keys(d.tecnologias)) visitar(id);
    return errores;
  }

  function cargarBase(mods) {
    let datos = fusionar(FWM.datosBase, {});
    for (const m of mods || []) datos = fusionar(datos, m);
    const errores = validar(datos);
    if (errores.length) throw new Error("Datos inválidos:\n" + errores.join("\n"));
    return datos;
  }

  function cargar(mods) {
    const d = cargarBase(mods);
    d.nombresIA = (FWM.datosBase.nombresIA || []).slice();
    d.medallas = (FWM.datosBase.medallas || []).slice();
    // el héroe: una tropa por clase (heroe_espadachin, …), no reclutable, sin mantenimiento
    d.heroes = FWM.datosBase.heroes;
    d.objetos = FWM.datosBase.objetos || {}; d.objetosReglas = FWM.datosBase.objetosReglas || {};
    d.legal = FWM.datosBase.legal || null;
    d.idioma = FWM.idioma ? FWM.idioma.actual() : "es";
    for (const [clase, c] of Object.entries((d.heroes && d.heroes.clases) || {})) {
      d.tropas["heroe_" + clase] = { nombre: c.nombre, descripcion: c.descripcion, etiquetas: c.etiquetas.slice(), stats: Object.assign({}, c.stats), bonos: Object.assign({}, c.bonos || {}), defensaContra: Object.assign({}, c.defensaContra || {}),
        tipoDano: "normal", coste: { oro: 0 }, mantenimiento: 0, requiere: [], mejoraA: [], puedeFundar: false, habilidades: [], icono: "heroe_" + clase, noReclutable: true, heroe: clase };
    }
    if (FWM.idioma) FWM.idioma.aplicar(d);
    return d;
  }
  return { cargar, validar, fusionar };
})();
