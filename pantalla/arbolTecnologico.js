// Pantalla del árbol tecnológico.
window.FWM = window.FWM || {};

FWM.arbolTecnologico = (function () {
  function render(App) {
    const { estado, datos } = App;
    const T = datos.textos;
    const j = estado.jugadores[estado.jugadorActivo];
    const cont = document.createElement("div");
    const inv = j.investigando;
    cont.innerHTML = `<h2>${T.tecnologia}</h2>
      <p class="suave">${inv ? `${T.investigando}: <b>${datos.tecnologias[inv.id].nombre}</b> · ${inv.turnosRestantes} ${T.turnos}` : T.fichas.sinInvestigarNada}</p>`;
    const grid = document.createElement("div"); grid.className = "arbol";
    const ids = Object.keys(datos.tecnologias).sort((a, b) => (datos.tecnologias[a].columna - datos.tecnologias[b].columna) || (datos.tecnologias[a].fila - datos.tecnologias[b].fila));
    // ordenar por columnas para que el grid quede en 3 columnas (raíz, segunda, tercera)
    const columnas = [[], [], []];
    for (const id of ids) columnas[Math.min(2, datos.tecnologias[id].columna || 0)].push(id);
    const maxFilas = Math.max(...columnas.map(c => c.length));
    for (let f = 0; f < maxFilas; f++) {
      for (let c = 0; c < 3; c++) {
        const id = columnas[c][f];
        const celda = document.createElement("div");
        if (!id) { celda.style.visibility = "hidden"; celda.className = "tec"; grid.appendChild(celda); continue; }
        const t = datos.tecnologias[id];
        const hecha = FWM.stats.tieneTec(j, id);
        const enCurso = inv && inv.id === id;
        const disponible = FWM.stats.tecDisponible(estado, datos, j, id);
        const err = FWM.acciones.acciones.investigar.validar(estado, datos, { tec: id });
        celda.className = "tec " + (hecha ? "hecha" : enCurso ? "curso" : disponible ? "disponible" : "bloqueada");
        const req = (t.requiere || []).map(r => datos.tecnologias[r].nombre).join(", ");
        celda.innerHTML = `<b>${t.nombre}</b><span>${t.descripcion}</span>
          <span class="suave">${T.coste}: ${FWM.util.textoCoste(FWM.stats.costeTec(datos, j, id), datos)} · ${t.turnos} ${T.turnos}</span>
          ${req ? `<span class="suave">${T.requiere}: ${req}</span>` : ""}
          <span>${hecha ? "✓ " + T.investigado : enCurso ? "⏳ " + T.investigando + " (" + inv.turnosRestantes + ")" : disponible ? T.disponible : T.bloqueado}</span>`;
        if (!hecha && !enCurso && disponible) {
          const b = App.boton(T.investigar, () => { App.aplicar({ tipo: "investigar", tec: id }); App.cerrarModal(); App.abrirTecnologia(); }, "btn btn-peq btn-primario");
          if (err) { b.disabled = true; b.title = T.errores[err] || err; }
          celda.appendChild(b);
          if (err) { const s = document.createElement("span"); s.className = "error"; s.textContent = T.errores[err] || err; celda.appendChild(s); }
        }
        grid.appendChild(celda);
      }
    }
    cont.appendChild(grid);
    const botones = document.createElement("div"); botones.className = "modal-botones";
    botones.appendChild(App.boton(T.cerrar, () => App.cerrarModal(), "btn btn-claro"));
    cont.appendChild(botones);
    return cont;
  }
  return { render };
})();
