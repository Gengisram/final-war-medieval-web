// Glosario: fichas de todo lo que hay en el juego, generadas de los datos.
window.FWM = window.FWM || {};

FWM.glosario = (function () {
  const PESTANAS = ["bandos", "tropas", "asentamientos", "terrenos", "reglas"];

  function normalizar(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  // Construye la lista de fichas de todas las categorías.
  function fichas(App) {
    const { datos } = App; const T = datos.textos; const F = T.fichas;
    const lista = [];
    const costeTxt = (c) => FWM.util.textoCoste(c, datos);
    const tecs = (ids) => (ids || []).map(i => datos.tecnologias[i] ? datos.tecnologias[i].nombre : i).join(", ");
    for (const [id, b] of Object.entries(datos.bandos)) {
      lista.push({ pestana: "bandos", id, nombre: b.nombre, descripcion: b.descripcion || "", filas: [[T.rasgo, b.rasgo || "—"], [F.nombresAsent, (b.nombres || []).slice(0, 5).join(", ") + "…"]], icono: null, clave: normalizar(b.nombre + " " + (b.rasgo || "") + " " + (b.descripcion || "")) });
    }
    for (const [id, t] of Object.entries(datos.tropas)) {
      if (t.noReclutable) continue; // los héroes tienen su propia pantalla
      const reclutan = Object.entries(datos.asentamientos).filter(([, a]) => a.recluta.includes("*") || a.recluta.includes(id)).map(([, a]) => a.nombre).join(", ");
      const filas = [
        [T.ataque, t.stats.ataque], [T.defensa, t.stats.defensa], [T.vida, t.stats.vida], [T.asedio, t.stats.asedio],
        [T.alcance, t.stats.alcance === 0 ? F.cuerpoACuerpo : t.stats.alcance], [T.movimiento, t.stats.movimiento],
        [T.coste, costeTxt(t.coste)], [T.mantenimiento, t.mantenimiento + " oro " + T.porTurno],
        [T.requiere, tecs(t.requiere) || "—"], [F.seReclutaEn, reclutan || "—"],
        [F.mejoraA, (t.mejoraA || []).map(m => datos.tropas[m].nombre).join(", ") || "—"],
      ];
      if (t.defensaContra && Object.keys(t.defensaContra).length) filas.push([T.defensaContra, Object.entries(t.defensaContra).map(([e, v]) => "+" + v + " " + (T.etiquetasNombre[e] || e)).join(", ")]);
      if (t.bonos && Object.keys(t.bonos).length) filas.push([T.bonusContra, Object.entries(t.bonos).map(([e, v]) => "+" + v + " " + (T.etiquetasNombre[e] || e)).join(", ")]);
      if (t.puedeFundar) filas.push([F.especial, F.puedeFundar]);
      if (t.disparaSinMover) filas.push([F.especial, F.noMoverDisparar]);
      lista.push({ pestana: "tropas", id, nombre: t.nombre, descripcion: t.descripcion || "", filas, icono: () => FWM.iconos.canvasTropa(t.icono, "#55493d", 48), clave: normalizar(t.nombre + " " + (t.descripcion || "") + " " + t.etiquetas.join(" ")) });
    }
    for (const [id, a] of Object.entries(datos.asentamientos)) {
      const filas = [
        [F.comoSeConsigue, a.comoSeConsigue === "fundar" ? F.loFunda : a.comoSeConsigue === "mejorar" ? F.mejorando.replace("{que}", datos.asentamientos[a.desde].nombre.toLowerCase()) : F.seConstruye],
        [T.coste, costeTxt(a.coste)], [T.requiere, tecs(a.requiere) || "—"], [T.produce, costeTxt(a.produce) + " " + T.porTurno],
        [F.huecosGuarnicion, a.huecosGuarnicion], [F.plusDefensa, "+" + a.plusDefensa], [T.murallas, a.integridad],
        [F.reclutaFicha, a.recluta.includes("*") ? F.todasLasTropas : a.recluta.map(r => datos.tropas[r].nombre).join(", ")],
        [F.mejoraTropas, a.mejoraTropas ? F.si : F.no], [F.alConquistarlo, F.pasaA.replace("{que}", datos.asentamientos[a.alConquistar].nombre.toLowerCase())],
      ];
      lista.push({ pestana: "asentamientos", id, nombre: a.nombre, descripcion: a.descripcion || "", filas, icono: () => FWM.iconos.canvasIcono(a.icono, 48), clave: normalizar(a.nombre + " " + (a.descripcion || "")) });
    }
    for (const [id, t] of Object.entries(datos.tecnologias)) {
      const desbloquea = [].concat(
        Object.entries(datos.tropas).filter(([, x]) => x.requiere.includes(id)).map(([, x]) => x.nombre),
        Object.entries(datos.asentamientos).filter(([, x]) => x.requiere.includes(id)).map(([, x]) => x.nombre),
        Object.entries(datos.tecnologias).filter(([, x]) => (x.requiere || []).includes(id)).map(([, x]) => F.esTecnologia.replace("{nombre}", x.nombre)));
      const filas = [[T.coste, costeTxt(t.coste)], [F.tarda, t.turnos + " " + T.turnos], [T.requiere, tecs(t.requiere) || "—"], [F.desbloquea, desbloquea.join(", ") || "—"]];
      if (true) continue; // tecnologías: fuera del juego (5 sep 2026)
      lista.push({ pestana: "tecnologias", id, nombre: t.nombre, descripcion: t.descripcion || "", filas, icono: null, clave: normalizar(t.nombre + " " + t.descripcion) });
    }
    const soloOro = !!(App.estado && App.estado.soloOro);
    for (const [id, r] of Object.entries(datos.recursos)) {
      if (soloOro && id !== "oro") continue;
      if (id !== "oro") continue;
      lista.push({ pestana: "terrenos", id, nombre: r.nombre, descripcion: r.descripcion || "", filas: [], icono: () => FWM.iconos.canvasIcono(r.icono, 48), clave: normalizar(r.nombre + " " + (r.descripcion || "")) });
    }
    for (const [id, y] of Object.entries(datos.yacimientos)) {
      if (y.soloModo === "soloOro" ? !soloOro : (soloOro && !(y.produce || {}).oro)) continue; // cada modo enseña sus yacimientos
      if (!y.puntos && !(y.produce || {}).oro) continue;
      lista.push({ pestana: "terrenos", id, nombre: y.nombre, descripcion: y.descripcion || "", filas: [y.puntos ? [T.puntos, y.puntos] : [T.produce, costeTxt(y.produce) + " " + T.porTurno]], icono: () => FWM.iconos.canvasIcono(y.icono, 48), clave: normalizar(y.nombre + " " + (y.descripcion || "")) });
    }
    for (const [id, te] of Object.entries(datos.terrenos)) {
      const filas = [[F.mover, te.costeMovimiento == null ? F.noSePuede : F.puntosPasos.replace("{p}", te.costeMovimiento).replace("{n}", te.costeMovimiento / (datos.reglas.puntosPorPaso || 2)).replace("{pasos}", T.pasos)]];
      if (te.modificadores && te.modificadores.defensa) filas.push([T.defensa, "+" + te.modificadores.defensa]);
      if (te.modificadores && te.modificadores.alcanceDistancia) filas.push([T.alcance, "+" + te.modificadores.alcanceDistancia + " a las tropas a distancia"]);
      filas.push([F.sePuedeConstruir, te.construible ? F.si : F.no]);
      lista.push({ pestana: "terrenos", id, nombre: te.nombre, descripcion: te.descripcion || "", filas, icono: () => FWM.iconos.canvasTerreno(id, te.color, 48), clave: normalizar(te.nombre + " " + (te.descripcion || "")) });
    }
    if (false && datos.reglas && datos.reglas.carretera) { // carreteras: fuera del juego (5 sep 2026)
      const c = datos.reglas.carretera;
      lista.push({ pestana: "terrenos", id: "carretera", nombre: T.carretera, descripcion: F.carreteraDesc.replace("{n}", c.costeMovimiento), filas: [[T.coste, FWM.util.textoCoste(c.coste, datos)], [T.requiere, tecs(c.requiere) || "—"]], icono: () => FWM.iconos.canvasTerreno("carretera", "#d9cfae", 48), clave: normalizar("carretera camino") });
    }
    for (const g of datos.glosario || []) {
      lista.push({ pestana: "reglas", id: g.id, nombre: g.titulo, descripcion: g.texto, filas: [], icono: null, clave: normalizar(g.titulo + " " + g.texto + " " + (g.palabras || "")) });
    }
    return lista;
  }

  // vista: { pestana, busqueda, id }
  function render(App, vista) {
    const T = App.datos.textos;
    vista = vista || {}; vista.pestana = vista.pestana || "tropas";
    const todas = fichas(App);
    const q = normalizar(vista.busqueda);
    const visibles = q ? todas.filter(f => f.clave.includes(q)) : todas.filter(f => f.pestana === vista.pestana);
    const cont = document.createElement("div"); cont.className = "glosario";
    const cab = document.createElement("div"); cab.className = "glosario-cab";
    cab.innerHTML = `<h2>${T.glosario}</h2>`;
    const buscador = document.createElement("input"); buscador.type = "search"; buscador.placeholder = T.buscar; buscador.value = vista.busqueda || "";
    buscador.addEventListener("input", () => { vista.busqueda = buscador.value; vista.id = null; App.modalNodo(render(App, vista)); document.querySelector(".glosario input").focus(); });
    cab.appendChild(buscador); cont.appendChild(cab);
    const tabs = document.createElement("div"); tabs.className = "glosario-tabs";
    for (const p of PESTANAS) {
      const b = App.boton(T.pestanas[p], () => { vista.pestana = p; vista.busqueda = ""; vista.id = null; App.modalNodo(render(App, vista)); }, "btn btn-peq " + (p === vista.pestana && !q ? "btn-primario" : "btn-claro"));
      tabs.appendChild(b);
    }
    cont.appendChild(tabs);
    const lista = document.createElement("div"); lista.className = "glosario-lista";
    if (!visibles.length) lista.innerHTML = `<p class="suave">${T.nada}</p>`;
    for (const f of visibles) {
      const tarjeta = document.createElement("div"); tarjeta.className = "glosario-ficha" + (vista.id === f.id ? " sel" : "");
      tarjeta.id = "glo-" + f.pestana + "-" + f.id;
      const cabF = document.createElement("div"); cabF.className = "glosario-ficha-cab";
      if (f.icono) cabF.appendChild(f.icono());
      const tit = document.createElement("div");
      tit.innerHTML = `<b>${f.nombre}</b>${q ? ` <small class="suave">· ${T.pestanas[f.pestana]}</small>` : ""}<br><span>${f.descripcion}</span>`;
      cabF.appendChild(tit); tarjeta.appendChild(cabF);
      if (f.filas.length) {
        const tabla = document.createElement("table"); tabla.className = "glosario-tabla";
        for (const [k, v] of f.filas) { const tr = document.createElement("tr"); tr.innerHTML = `<td>${k}</td><td>${v}</td>`; tabla.appendChild(tr); }
        tarjeta.appendChild(tabla);
      }
      lista.appendChild(tarjeta);
    }
    cont.appendChild(lista);
    const fila = document.createElement("div"); fila.className = "modal-botones";
    fila.appendChild(App.boton(T.cerrar, () => App.cerrarModal(), "btn btn-claro"));
    cont.appendChild(fila);
    if (vista.id) setTimeout(() => { const el = document.getElementById("glo-" + vista.pestana + "-" + vista.id); if (el) el.scrollIntoView({ block: "start" }); }, 0);
    return cont;
  }

  return { render, fichas };
})();
