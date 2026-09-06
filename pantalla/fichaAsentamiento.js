// Ficha de un asentamiento: datos, guarnición, reclutar. (Sin construcciones: decisión del 5 sep 2026, ver GDD.)
window.FWM = window.FWM || {};

FWM.fichaAsentamiento = (function () {
  function render(App, hex) {
    const { estado, datos } = App;
    const T = datos.textos;
    const a = estado.asentamientos[hex];
    const def = datos.asentamientos[a.tipo];
    const j = estado.jugadores[a.dueno];
    const mio = a.dueno === estado.jugadorActivo && j.humano;
    const esCapital = j.capital === hex;
    const prod = FWM.stats.produccionAsentamiento(estado, datos, a);
    const integMax = FWM.stats.propAsentamiento(estado, datos, a, "integridad");
    const huecosG = FWM.stats.propAsentamiento(estado, datos, a, "huecosGuarnicion");
    const zonas = FWM.territorio.zonas(estado, a.dueno);
    const aislado = !zonas.reino.has(hex);
    const plus = FWM.stats.propAsentamiento(estado, datos, a, "plusDefensa");

    const cont = document.createElement("div"); cont.className = "ficha";
    // 1. cabecera: figura, nombre y chips (misma estructura que la tropa)
    const cab = document.createElement("div"); cab.className = "ficha-cab";
    cab.appendChild(FWM.iconos.canvasIcono(def.icono, 52));
    const tit = document.createElement("div");
    tit.innerHTML = `<h2 style="margin:0">${a.nombre} <button class="btn-ayuda" title="${T.verEnGlosario}">?</button></h2>
      <span class="chip">${def.nombre}</span><span class="chip" style="background:${FWM.lienzo.conAlpha(j.color, .35)}">${FWM.paneles.nombreReino(App, j, true)}${!j.humano && j.personalidad ? " · " + (T.personalidades[j.personalidad] || j.personalidad) : ""}</span>${esCapital ? `<span class="chip capital">★ ${T.capital}</span>` : ""}${aislado ? `<span class="chip aislado">${T.aislado}</span>` : ""}`;
    cab.appendChild(tit); cont.appendChild(cab);
    tit.querySelector(".btn-ayuda").addEventListener("click", () => App.abrirGlosario({ pestana: "asentamientos", id: a.tipo }));

    // 2. acciones: mejorar a ciudad
    if (mio && def.mejoraA) {
      const nuevo = datos.asentamientos[def.mejoraA];
      const acc = document.createElement("div"); acc.className = "acciones";
      const coste = FWM.stats.costeAsentamiento(estado, datos, j.id, def.mejoraA);
      FWM.paneles.botonAccion(App, acc, `${T.mejorarACiudad} (${FWM.util.textoCoste(coste, datos)})`, { tipo: "mejorarAsentamiento", asentamiento: hex }, "btn btn-claro btn-peq", { coste, requiere: nuevo.requiere, hex });
      cont.appendChild(acc);
    }

    // 3. reclutar: tira de fichas (en móvil se desliza de lado)
    if (mio) {
      const h3 = document.createElement("h3"); h3.textContent = T.reclutar + (a.reclutadoEsteTurno ? " · " + T.errores.ya_reclutado : ""); cont.appendChild(h3);
      const lista = document.createElement("div"); lista.className = "lista-reclutar";
      const tipos = Object.keys(datos.tropas).filter(t => !datos.tropas[t].noReclutable && (def.recluta.includes("*") || def.recluta.includes(t)) && (!datos.tropas[t].nivelHeroe || (j.heroe && (j.heroe.nivel || 1) >= datos.tropas[t].nivelHeroe)));
      for (const tipo of tipos) {
        const dt = datos.tropas[tipo];
        const coste = FWM.stats.costeTropa(estado, datos, j.id, tipo);
        const err = FWM.acciones.acciones.reclutar.validar(estado, datos, { asentamiento: hex, que: tipo });
        const motivo = err ? FWM.paneles.motivo(App, err, { coste, requiere: dt.requiere, hex }) : "";
        const ficha = document.createElement("button"); ficha.className = "ficha-recluta" + (err ? " no" : "");
        ficha.title = motivo || `${T.ataque} ${dt.stats.ataque} · ${T.defensa} ${dt.stats.defensa} · ${T.vida} ${dt.stats.vida}`;
        ficha.appendChild(FWM.iconos.canvasTropa(dt.icono, j.color, 36));
        const info = document.createElement("div"); info.className = "info";
        info.innerHTML = `<b>${dt.nombre}</b><small>${FWM.util.textoCoste(coste, datos)} · ${T.fichas.mantenimientoCorto} ${dt.mantenimiento}</small><small class="suave">⚔${dt.stats.ataque} 🛡${dt.stats.defensa} ❤${dt.stats.vida}</small>${err ? `<small class="error">${motivo}</small>` : ""}`;
        ficha.appendChild(info);
        ficha.addEventListener("click", () => { if (err) FWM.paneles.aviso(motivo, 2600); else App.aplicar({ tipo: "reclutar", asentamiento: hex, que: tipo }); });
        lista.appendChild(ficha);
      }
      if (!tipos.length) lista.innerHTML = `<p class="suave">${T.nada}</p>`;
      cont.appendChild(lista);
    }

    // 4. guarnición
    const h3g = document.createElement("h3"); h3g.textContent = `${T.guarnicion} (${a.guarnicion.length}/${huecosG})`; cont.appendChild(h3g);
    const hg = document.createElement("div"); hg.className = "huecos";
    for (let i = 0; i < huecosG; i++) {
      const d = document.createElement("div"); d.className = "hueco";
      const id = a.guarnicion[i];
      if (id) {
        const tr = estado.tropas[id]; const dt = datos.tropas[tr.tipo];
        d.classList.add("lleno"); if (App.sel.tropa === id) d.classList.add("sel");
        if (mio) {
          const punto = document.createElement("span"); punto.className = "punto " + (tr.accionUsada ? "usada" : "lista");
          punto.title = tr.accionUsada ? T.yaActuo : T.puedeActuar; d.appendChild(punto);
        }
        d.appendChild(dt.heroe ? FWM.figuras.canvasHeroe(j.heroe, j.color, 40, false, tr.dueno !== App.humano) : FWM.iconos.canvasTropa(dt.icono, j.color, 40, tr.dueno !== App.humano));
        const nombre = document.createElement("div"); nombre.textContent = (FWM.acciones.dormida(tr) ? "💤 " : "") + dt.nombre; d.appendChild(nombre);
        const nivel = FWM.stats.nivelExperiencia(datos, tr);
        if (nivel > 0) { const g = document.createElement("div"); g.className = "galones"; g.textContent = "★".repeat(nivel); d.appendChild(g); }
        const max = FWM.stats.vidaMax(estado, datos, tr);
        const v = document.createElement("div"); v.className = "vida"; v.title = `${T.vida} ${tr.vida}/${max}`; v.innerHTML = `<i style="width:${100 * tr.vida / max}%"></i>`; d.appendChild(v);
        const vt = document.createElement("small"); vt.textContent = `${tr.vida}/${max}`; d.appendChild(vt);
        if (mio) d.addEventListener("click", () => App.seleccionarTropa(id, hex));
      } else {
        d.textContent = T.vacio;
      }
      hg.appendChild(d);
    }
    cont.appendChild(hg);
    if (mio && !a.guarnicion.length) { const p = document.createElement("p"); p.className = "pista error"; p.textContent = a.integridad > 0 ? T.fichas.sinGuarnicion : T.fichas.sinGuarnicionBrecha; cont.appendChild(p); }

    // 5. datos: producción y murallas
    const datosP = document.createElement("div"); datosP.className = "ficha-datos";
    datosP.innerHTML = `<p>${T.produce}: <b>${FWM.util.textoCoste(prod, datos)}</b> <span class="suave">${T.porTurno}</span> · ${T.murallas}: <b>${a.integridad}/${integMax}</b> <span class="suave">(${a.integridad > 0 ? "+" + plus + " " + T.defensa.toLowerCase() + " " + T.fichas.aLaGuarnicion : T.fichas.brechaSinPlus})</span></p>
      <div class="muralla"><i style="width:${integMax ? (100 * a.integridad / integMax) : 0}%${a.integridad === 0 ? ";background:#e53935" : ""}"></i></div>
      ${a.huchaLocal ? `<p>${T.almacen}: <b>${FWM.util.textoCoste(a.huchaLocal, datos)}</b></p>` : ""}`;
    cont.appendChild(datosP);
    return cont;
  }
  // Solo la tira de reclutar (la hoja que abre el icono ⚒ de la burbuja).
  function renderReclutar(App, hex) {
    const { estado, datos } = App; const T = datos.textos;
    const a = estado.asentamientos[hex]; const def = datos.asentamientos[a.tipo]; const j = estado.jugadores[a.dueno];
    const cont = document.createElement("div"); cont.className = "ficha";
    const h3 = document.createElement("h2"); h3.style.margin = "0 32px 6px 0"; h3.textContent = T.reclutar + " · " + a.nombre + (a.reclutadoEsteTurno ? " · " + T.errores.ya_reclutado : ""); cont.appendChild(h3);
    const lista = document.createElement("div"); lista.className = "lista-reclutar";
    const tipos = Object.keys(datos.tropas).filter(t => !datos.tropas[t].noReclutable && (def.recluta.includes("*") || def.recluta.includes(t)) && (!datos.tropas[t].nivelHeroe || (j.heroe && (j.heroe.nivel || 1) >= datos.tropas[t].nivelHeroe)));
    for (const tipo of tipos) {
      const dt = datos.tropas[tipo];
      const coste = FWM.stats.costeTropa(estado, datos, j.id, tipo);
      const err = FWM.acciones.acciones.reclutar.validar(estado, datos, { asentamiento: hex, que: tipo });
      const motivo = err ? FWM.paneles.motivo(App, err, { coste, requiere: dt.requiere, hex }) : "";
      const ficha = document.createElement("button"); ficha.className = "ficha-recluta" + (err ? " no" : "");
      ficha.appendChild(FWM.iconos.canvasTropa(dt.icono, j.color, 36));
      const info = document.createElement("div"); info.className = "info";
      info.innerHTML = `<b>${dt.nombre}</b><small>${FWM.util.textoCoste(coste, datos)} · ${T.fichas.mantenimientoCorto} ${dt.mantenimiento}</small><small class="suave">⚔${dt.stats.ataque} 🛡${dt.stats.defensa} ❤${dt.stats.vida}</small>${err ? `<small class="error">${motivo}</small>` : ""}`;
      ficha.appendChild(info);
      ficha.addEventListener("click", () => { if (err) FWM.paneles.aviso(motivo, 2600); else { App.aplicar({ tipo: "reclutar", asentamiento: hex, que: tipo }); App.cerrarHoja(); } });
      lista.appendChild(ficha);
    }
    if (!tipos.length) lista.innerHTML = `<p class="suave">${T.nada}</p>`;
    cont.appendChild(lista);
    const p = document.createElement("p"); p.className = "pista"; p.textContent = T.oroDisponible.replace("{n}", j.hucha.oro || 0); cont.appendChild(p);
    return cont;
  }
  return { render, renderReclutar };
})();
