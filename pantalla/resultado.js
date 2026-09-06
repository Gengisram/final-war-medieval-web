// Pantalla de final de partida: resultado, estadísticas, línea de tiempo y récords.
window.FWM = window.FWM || {};

FWM.resultado = (function () {
  function render(App, opciones) {
    const { estado, datos } = App; const T = datos.textos;
    const yo = estado.jugadores[App.humano];
    const gano = estado.ganador === App.humano;
    const st = estado.estadisticas || {};
    const cont = document.createElement("div"); cont.className = "resultado";
    const porPuntos = (estado.registro || []).some(ev => ev.tipo === "victoria" && ev.porPuntos);
    const enDuelo = !!(App.opciones && App.opciones.duelo);
    const anulada = estado.ganador === -1;
    const motivoDuelo = enDuelo && estado.finDuelo && T.duelo[estado.finDuelo] ? ` <small class="suave">${T.duelo[estado.finDuelo]}</small>` : "";
    // en Bárbaros siempre acabas cayendo: lo que cuenta son las rondas, no quién gana
    const esBarbaros = !!estado.barbaros;
    const rondasB = esBarbaros ? FWM.barbaros.rondas(estado) : 0;
    const titulo = esBarbaros ? T.barbaros.aguantaste.replace("{n}", rondasB)
      : anulada ? T.duelo.anulada : (gano ? T.ganaste : (estado.ganador != null && estado.jugadores[estado.ganador] ? FWM.paneles.nombreReino(App, estado.jugadores[estado.ganador]) + " " + T.gano : T.perdiste)) + (porPuntos ? ` <small class="suave">${T.victoriaPorPuntos}</small>` : "") + motivoDuelo;
    cont.innerHTML = `<h2>${titulo}</h2><p class="suave">${estado.mapa.nombre || ""} · ${T.turno.toLowerCase()} ${estado.turno} · ${T.tipos[(App.opciones && App.opciones.tipo) || "normal"] || ""}</p>`;

    // tabla por reino
    const tabla = document.createElement("table"); tabla.className = "tabla-reino tabla-resultado";
    tabla.innerHTML = `<thead><tr><th class="izq">${T.reino}</th><th>${T.puntos}</th><th>${T.asentamientos}</th><th>${T.tropas}</th><th>${T.conquistas}</th><th>${T.matadas}</th><th>${T.perdidas}</th><th>${T.oroGanado}</th></tr></thead>`;
    const cuerpo = document.createElement("tbody");
    for (const j of (esBarbaros ? estado.jugadores.filter(x => !x.barbaros) : estado.jugadores)) {
      const s = st[j.id] || {};
      const tr = document.createElement("tr");
      const nombre = FWM.paneles.nombreReino(App, j) + (!j.humano && !enDuelo ? ` <small class="suave">${j.apodo ? j.apodo + " (" + T.iaEtiqueta + ")" : ""}${j.personalidad ? " · " + (T.personalidades[j.personalidad] || "") : ""}</small>` : "");
      const estadoJ = j.eliminado ? `<small class="error">${T.eliminado}${s.eliminadoEn ? " · " + T.turno.toLowerCase() + " " + s.eliminadoEn : ""}</small>` : (estado.ganador === j.id ? `<small class="ok">★</small>` : "");
      tr.innerHTML = `<td class="izq"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${j.color};margin-right:6px"></span>${nombre} ${estadoJ}</td>
        <td class="num" title="${FWM.victoria.desglose(estado, datos, j.id).map(d => d.texto + ": " + d.puntos).join("\n")}" style="cursor:help"><b>${esBarbaros ? rondasB * 20 : FWM.victoria.puntos(estado, datos, j.id)}</b> <small class="suave">?</small></td><td class="num">${FWM.estado.asentamientosDe(estado, j.id).length}</td><td class="num">${FWM.estado.tropasDe(estado, j.id).length}</td>
        <td class="num">${s.conquistas || 0}</td><td class="num">${s.matadas || 0}</td><td class="num">${s.perdidas || 0}</td><td class="num">${s.oro || 0}</td>`;
      cuerpo.appendChild(tr);
      // desglose desplegable al tocar la fila (en móvil no hay tooltip)
      const det = document.createElement("tr"); det.hidden = true;
      det.innerHTML = `<td colspan="8" class="izq"><small class="suave">${FWM.victoria.desglose(estado, datos, j.id).map(d => `${d.texto}: <b>${d.puntos}</b>`).join(" · ") || T.nada}</small></td>`;
      tr.style.cursor = "pointer"; tr.addEventListener("click", () => { det.hidden = !det.hidden; });
      cuerpo.appendChild(det);
    }
    tabla.appendChild(cuerpo); const envR = document.createElement("div"); envR.className = "tabla-scroll"; envR.appendChild(tabla); cont.appendChild(envR);
    // lo que sumas a tu marcador, contado desde cero
    const misPuntos = esBarbaros ? rondasB * 20 : FWM.victoria.puntos(estado, datos, App.humano);
    if (opciones && opciones.records && misPuntos > 0 && !anulada) {
      const g = document.createElement("div"); g.className = "ganancia" + (gano ? " gano" : "");
      g.innerHTML = `<div class="ganancia-n">+<span>0</span></div><div class="ganancia-txt">${T.puntosAlMarcador}<br><small class="suave">${FWM.guardado.textoPuntos(opciones.records, T)}</small></div>`;
      cont.appendChild(g);
      const span = g.querySelector("span"); const t0 = performance.now(); const dur = 1300;
      const paso = () => { const p = Math.min(1, (performance.now() - t0) / dur); span.textContent = Math.round(misPuntos * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(paso); else g.classList.add("lista"); };
      requestAnimationFrame(paso);
      if (gano) FWM.sonido.fanfarria(); else FWM.sonido.tambor();
      // medallas recién ganadas
      const nuevas = medallasNuevas(datos, opciones.nuevas);
      if (nuevas.length) {
        const md = document.createElement("div"); md.className = "medallas-nuevas";
        for (const { m, nivel } of nuevas) { const d = document.createElement("div"); d.className = "medalla ganada" + (m.niveles ? " nivel-" + nivel : ""); const ic = document.createElement("div"); ic.className = "medalla-icono"; ic.appendChild(FWM.figuras.canvasMedalla(m.icono, 64, false)); d.appendChild(ic); const nm = document.createElement("div"); nm.className = "medalla-nombre"; nm.textContent = T.medallaNueva + ": " + FWM.medallas.nombre(m, nivel, T); d.appendChild(nm); if (m.niveles) { const es = document.createElement("div"); es.className = "medalla-estrellas"; es.textContent = "★".repeat(nivel); d.appendChild(es); } const ds = document.createElement("small"); ds.textContent = FWM.medallas.descripcion(m, nivel - 1); d.appendChild(ds); md.appendChild(d); }
        cont.appendChild(md);
        setTimeout(() => FWM.sonido.fanfarria(), 900);
      }
      // ranking online: enviado, o botón para crear cuenta y enviarlo
      const est = document.createElement("p"); est.className = "pista";
      if (FWM.nube.disponible() && FWM.nube.usuario()) est.textContent = "☁ " + T.enviadoRanking + " · " + FWM.nube.nombre();
      else if (FWM.nube.disponible()) { est.textContent = T.pendienteRanking + ". "; est.appendChild(App.boton(T.guardarEnRanking, () => { App.cerrarModal(); App.irInicio(); FWM.inicio.vistaCuenta(); }, "btn btn-peq btn-claro")); }
      else est.textContent = T.sinConexion;
      cont.appendChild(est);
    }

    // línea de tiempo: asentamientos por reino y turno
    const linea = (estado.linea || []).filter(p => !p.puntos); // partidas antiguas sin puntos: línea de asentamientos
    const svgPuntos = FWM.paneles.graficaLinea(estado, datos, p => p.puntos, T);
    if (svgPuntos) { const h3 = document.createElement("h3"); h3.textContent = T.evolucionPuntos; cont.appendChild(h3); const div = document.createElement("div"); div.innerHTML = svgPuntos; cont.appendChild(div); }
    else if (linea.length > 1) {
      const W = 640, H = 140, ml = 28, mb = 18;
      const maxA = Math.max(1, ...linea.map(p => Math.max(...p.asentamientos)));
      const maxT = linea[linea.length - 1].turno;
      const x = (t) => ml + (t - 1) / Math.max(1, maxT - 1) * (W - ml - 8);
      const y = (a) => H - mb - a / maxA * (H - mb - 8);
      let svg = `<svg viewBox="0 0 ${W} ${H}" class="linea-tiempo" preserveAspectRatio="none">`;
      svg += `<line x1="${ml}" y1="${H - mb}" x2="${W - 8}" y2="${H - mb}" stroke="#8b7f6a" stroke-width="1"/><line x1="${ml}" y1="8" x2="${ml}" y2="${H - mb}" stroke="#8b7f6a" stroke-width="1"/>`;
      svg += `<text x="${ml - 4}" y="12" font-size="10" text-anchor="end" fill="#6b6050">${maxA}</text><text x="${W - 8}" y="${H - 4}" font-size="10" text-anchor="end" fill="#6b6050">${T.turno} ${maxT}</text>`;
      estado.jugadores.forEach((j, i) => {
        const pts = linea.map(p => `${x(p.turno).toFixed(1)},${y(p.asentamientos[i]).toFixed(1)}`).join(" ");
        svg += `<polyline points="${pts}" fill="none" stroke="${j.color}" stroke-width="${j.humano ? 3 : 2}" stroke-linejoin="round"/>`;
      });
      svg += `</svg>`;
      const h3 = document.createElement("h3"); h3.textContent = T.lineaTiempo; cont.appendChild(h3);
      const div = document.createElement("div"); div.innerHTML = svg; cont.appendChild(div);
    }

    // récords
    if (opciones && opciones.records) {
      const r = opciones.records;
      const mejor = Object.entries(r.mejorVictoria || {}).map(([k, v]) => `${T.tipos[k] || k}: ${v} ${T.turnos}`).join(" · ");
      const p = document.createElement("p"); p.className = "suave";
      p.innerHTML = `<b>${T.records}</b>: ${T.partidas} ${r.partidas} · ${T.ganadas} ${r.ganadas} · ${T.racha} ${r.racha} (${T.mejorRacha} ${r.mejorRacha})${mejor ? " · " + T.mejorVictoria + " " + mejor : ""}<br><b>${T.puntos}</b>: ${FWM.guardado.textoPuntos(r, T)}`;
      cont.appendChild(p);
    }

    // compartir y repetición: solo cuando la partida ha acabado de verdad
    if (estado.ganador != null && !anulada) {
      const extra = document.createElement("div"); extra.className = "modal-botones";
      extra.appendChild(App.boton("📷 " + T.compartir.boton, () => FWM.compartir.resultado(App, { posicion: posicionDe(App, estado, datos), puntos: FWM.victoria.puntos(estado, datos, App.humano), nombre: nombreJugador() }), "btn btn-claro"));
      if (FWM.repeticion.hay(App)) extra.appendChild(App.boton(T.repeticion.boton, () => FWM.repeticion.abrir(App), "btn btn-claro"));
      cont.appendChild(extra);
    }
    const fila = document.createElement("div"); fila.className = "modal-botones";
    fila.appendChild(App.boton(T.revancha, () => App.revancha(), "btn btn-primario"));
    fila.appendChild(App.boton(T.otraPartida, () => App.otraPartida(), "btn btn-claro"));
    // partida acabada: Cerrar lleva al inicio (quedarse en un tablero muerto confundía); si sigue viva, solo cierra
    fila.appendChild(App.boton(T.cerrar, () => { if (estado.ganador != null) App.irInicio(); else App.cerrarModal(); }, "btn btn-claro"));
    cont.appendChild(fila);
    return cont;
  }

  // En qué puesto has quedado (0 = primero): por puntos, con los eliminados al final y el ganador siempre delante.
  function posicionDe(App, estado, datos) {
    const orden = estado.jugadores.map(j => ({ id: j.id, p: FWM.victoria.puntos(estado, datos, j.id), elim: !!j.eliminado })).sort((a, b) => (a.elim - b.elim) || (b.p - a.p));
    let pos = orden.findIndex(o => o.id === App.humano);
    if (estado.ganador === App.humano) pos = 0; else if (estado.ganador != null && pos === 0) pos = 1;
    return pos;
  }
  function nombreJugador() { return (FWM.nube.usuario() && FWM.nube.nombre()) || FWM.guardado.ajustes().nombre || ""; }

  // Ceremonia de final: posición, puntos que se recuentan y se suman a tu total, medallas que aparecen. Luego, el resumen.
  function ceremonia(App, opciones, alAcabar) {
    const { estado, datos } = App; const T = datos.textos;
    const misPuntos = estado.barbaros ? FWM.barbaros.rondas(estado) * 20 : FWM.victoria.puntos(estado, datos, App.humano);
    const pos = posicionDe(App, estado, datos);
    const primero = pos === 0;
    const r = opciones.records || {}; const totalAntes = Math.max(0, (r.puntosTotal || 0) - misPuntos);
    const nuevas = medallasNuevas(datos, opciones.nuevas);

    const capa = document.createElement("div"); capa.id = "ceremonia"; capa.className = primero ? "primero" : "";
    const caja = document.createElement("div"); caja.className = "ceremonia-caja"; capa.appendChild(caja);
    const esBarbaros = !!estado.barbaros;
    const rondas = esBarbaros ? FWM.barbaros.rondas(estado) : 0;
    const recordAntes = (opciones.records && opciones.records.barbarosRecordAntes) || 0;
    const hPos = document.createElement("div"); hPos.className = "ceremonia-pos";
    hPos.textContent = esBarbaros ? rondas + "" : (T.posiciones[pos] || (pos + 1) + ".º"); caja.appendChild(hPos);
    if (esBarbaros) { const s2 = document.createElement("div"); s2.className = "ceremonia-sub"; s2.textContent = rondas > recordAntes ? T.barbaros.nuevoRecord.replace("{n}", rondas) : T.barbaros.aguantaste.replace("{n}", rondas); caja.appendChild(s2); }
    const sub = document.createElement("div"); sub.className = "ceremonia-sub suave"; sub.textContent = `${estado.mapa.nombre || ""} · ${T.turno.toLowerCase()} ${estado.turno}`; caja.appendChild(sub);
    const pts = document.createElement("div"); pts.className = "ceremonia-puntos"; pts.innerHTML = `<span class="n">0</span><small>${T.puntos.toLowerCase()}</small>`; caja.appendChild(pts);
    const total = document.createElement("div"); total.className = "ceremonia-total"; total.innerHTML = `<small>${T.tuTotal}</small><span class="n">${totalAntes}</span>`; caja.appendChild(total);
    const meds = document.createElement("div"); meds.className = "ceremonia-medallas"; caja.appendChild(meds);
    const fila = document.createElement("div"); fila.className = "modal-botones ceremonia-botones"; fila.appendChild(App.boton(T.verResumen, terminar, "btn btn-primario")); caja.appendChild(fila);
    document.body.appendChild(capa);
    let acabado = false;
    function terminar() { if (acabado) return; acabado = true; capa.classList.add("fuera"); setTimeout(() => { capa.remove(); parar = true; alAcabar(); }, 350); }
    capa.addEventListener("click", (e) => { if (listo && !e.target.closest("button")) terminar(); });
    let listo = false, parar = false;
    // confeti solo si quedas primero
    if (esBarbaros ? rondas > recordAntes && rondas > 0 : primero) { confeti(capa); FWM.sonido.victoria(); } else FWM.sonido.derrota();
    const espera = (ms) => new Promise(res => setTimeout(res, ms));
    const contar = (el, desde, hasta, dur, tic) => new Promise(res => {
      const t0 = performance.now(); let ultimo = desde;
      // con la pestaña oculta requestAnimationFrame no corre: se usa setTimeout para que la ceremonia no se quede colgada
      const siguiente = (fn) => document.hidden ? setTimeout(fn, 40) : requestAnimationFrame(fn);
      const paso = () => { const p = Math.min(1, (performance.now() - t0) / dur); const v = Math.round(desde + (hasta - desde) * (1 - Math.pow(1 - p, 3))); el.textContent = v; if (tic && v !== ultimo && Math.random() < .5) FWM.sonido.tic(); ultimo = v; if (p < 1 && !parar) siguiente(paso); else res(); };
      siguiente(paso);
    });
    (async () => {
      // Acto 1: posición, puntos que se recuentan y se suman a tu total
      await espera(700);
      pts.classList.add("ver");
      await contar(pts.querySelector(".n"), 0, misPuntos, Math.max(900, Math.min(1600, 40 * misPuntos)), true);
      await espera(400);
      total.classList.add("ver"); await espera(350);
      if (misPuntos > 0) { pts.classList.add("vuela"); FWM.sonido.suma(); await espera(250); total.classList.add("suma"); await contar(total.querySelector(".n"), totalAntes, totalAntes + misPuntos, 800, false); pts.classList.add("sumado"); }
      // Acto 2: lo mejor de lo nuevo (nivel > medallas, hasta dos > cofre)
      const rec = opciones.recompensas || {}; const sub = opciones.heroe || {};
      const TH = T.heroeUI;
      if (sub.nivel) {
        await espera(500);
        const hp = FWM.heroe.paraPartida({}); hp.nivel = sub.nivel; const dn = FWM.heroes.datosNivel(sub.nivel);
        const d = document.createElement("div"); d.className = "ceremonia-nivel";
        d.appendChild(FWM.figuras.canvasHeroe(hp, "#2f6fd6", 140, true));
        const t1 = document.createElement("div"); t1.className = "cer-nivel-txt"; t1.textContent = TH.nivelNuevo; d.appendChild(t1);
        const t2 = document.createElement("div"); t2.className = "cer-nivel-nombre"; t2.textContent = dn.nombre.toUpperCase(); d.appendChild(t2);
        if (dn.unidad && datos.tropas[dn.unidad]) { const u = document.createElement("div"); u.className = "cer-nivel-unidad"; u.appendChild(FWM.iconos.canvasTropa(datos.tropas[dn.unidad].icono, "#2f6fd6", 48)); const ut = document.createElement("span"); ut.textContent = TH.desbloqueado + ": " + datos.tropas[dn.unidad].nombre; u.appendChild(ut); d.appendChild(u); }
        meds.appendChild(d); FWM.sonido.fanfarria(); if (!primero) confeti(capa); requestAnimationFrame(() => d.classList.add("ver"));
        await espera(1400);
      }
      for (const { m, nivel } of nuevas.slice(0, sub.nivel ? 1 : 2)) {
        await espera(450);
        const d = document.createElement("div"); d.className = "ceremonia-medalla" + (m.niveles ? " nivel-" + nivel : "");
        const ic = document.createElement("div"); ic.className = "medalla-icono"; ic.appendChild(FWM.figuras.canvasMedalla(m.icono, 96, false)); d.appendChild(ic);
        const nm = document.createElement("div"); nm.className = "medalla-nombre"; nm.textContent = FWM.medallas.nombre(m, nivel, T); d.appendChild(nm);
        if (m.niveles) { const es = document.createElement("div"); es.className = "medalla-estrellas"; es.textContent = "★".repeat(nivel); d.appendChild(es); }
        const premios = (rec.medallas || []).filter(x => x.id === m.id);
        if (premios.length) { const pr = document.createElement("div"); pr.className = "cer-medalla-premio"; pr.textContent = premios.map(x => x.objeto ? (datos.objetos[x.objeto] ? datos.objetos[x.objeto].nombre : x.objeto) : "+" + x.oro + " " + TH.oroCorto).join(" · "); d.appendChild(pr); }
        meds.appendChild(d); FWM.sonido.pop(); requestAnimationFrame(() => d.classList.add("ver"));
      }
      if (nuevas.length > (sub.nivel ? 1 : 2)) { const mas = document.createElement("div"); mas.className = "ceremonia-oro ver"; mas.textContent = T.medallaMas.replace("{n}", nuevas.length - (sub.nivel ? 1 : 2)); meds.appendChild(mas); }
      if (rec.botin && datos.objetos[rec.botin]) {
        await espera(500);
        const o = datos.objetos[rec.botin];
        const d = document.createElement("div"); d.className = "ceremonia-cofre";
        d.innerHTML = `<div class="cofre">🎁</div><div class="cer-cofre-txt">${TH.botin}</div><div class="medalla-nombre">${o.nombre}</div><small>${o.texto}</small>`;
        meds.appendChild(d); requestAnimationFrame(() => d.classList.add("ver")); await espera(700); d.classList.add("abierto"); FWM.sonido.fanfarria();
        await espera(500);
      }
      // Acto 3: una línea con lo que te llevas, y los botones
      const partes = [];
      if (rec.oro) partes.push(`<b>+${rec.oro}</b> ${TH.oroCorto}`);
      if (sub.puntos > 0) partes.push(`<b>+${sub.puntos}</b> ${sub.puntos === 1 ? TH.puntoMejora : TH.puntosMejora.toLowerCase()}`);
      if (rec.misiones && rec.misiones.length) partes.push(`<b>${rec.misiones.length}</b> ${rec.misiones.length === 1 ? T.misiones.cumplidaUna : T.misiones.cumplidas}`);
      if (rec.elo) partes.push(`${T.duelo.elo} <b>${rec.elo.cambio >= 0 ? "+" : ""}${rec.elo.cambio}</b>`);
      if (rec.campana) partes.push(`<b>${T.campana.superadoCer.replace("{n}", rec.campana.capitulo)}</b>${rec.campana.objeto && datos.objetos[rec.campana.objeto] ? " · " + datos.objetos[rec.campana.objeto].nombre : ""}`);
      if (rec.batalla) partes.push(T.batalla.mejorSemana.replace("{n}", rec.batalla.mejor));
      if (partes.length) { await espera(400); const d = document.createElement("div"); d.className = "ceremonia-oro"; d.innerHTML = partes.join(" · "); meds.appendChild(d); FWM.sonido.moneda(); requestAnimationFrame(() => d.classList.add("ver")); }
      fila.insertBefore(App.boton("📷 " + T.compartir.boton, () => FWM.compartir.resultado(App, { posicion: pos, puntos: misPuntos, nombre: nombreJugador() }), "btn btn-claro cer-compartir"), fila.firstChild);
      if (sub.puntos > 0 || (sub.disponibles || 0) > 0) fila.insertBefore(App.boton(TH.mejorarAhora, () => { terminar(); setTimeout(() => { App.cerrarModal(); App.irInicio(); FWM.inicio.vistaHeroe({ pestana: "mejoras" }); }, 400); }, "btn btn-claro"), fila.firstChild);
      if (sub.puntos > 0 && !FWM.nube.usuario() && FWM.nube.disponible() && !FWM.heroe.avisado("primerPunto")) { const av = document.createElement("div"); av.className = "ceremonia-oro ver"; av.innerHTML = `<small>${TH.sinCuenta}</small>`; meds.appendChild(av); }
      await espera(300); fila.classList.add("ver"); listo = true;
    })();
  }

  // Medallas recién ganadas: [{ id, nivel }] (o ids sueltos, formato viejo) → [{ m, nivel }]
  function medallasNuevas(datos, lista) {
    return (lista || []).map(x => { const id = typeof x === "string" ? x : x.id; const m = (datos.medallas || []).find(k => k.id === id); return m ? { m, nivel: typeof x === "string" ? 1 : x.nivel } : null; }).filter(Boolean);
  }

  // Confeti: partículas que caen unos segundos sobre la capa.
  function confeti(capa) {
    const c = document.createElement("canvas"); c.className = "confeti"; capa.appendChild(c);
    const ctx = c.getContext("2d"); const dpr = Math.min(2, window.devicePixelRatio || 1);
    const ajustar = () => { c.width = innerWidth * dpr; c.height = innerHeight * dpr; }; ajustar();
    const colores = ["#e8b923", "#d63b3b", "#2f6fd6", "#2e9e4f", "#ff9f1a", "#f2e3c2"];
    const N = 160, ps = [];
    for (let i = 0; i < N; i++) ps.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * .8, vx: (Math.random() - .5) * 1.2, vy: 1.5 + Math.random() * 2.5, w: 6 + Math.random() * 6, h: 4 + Math.random() * 5, a: Math.random() * Math.PI * 2, va: (Math.random() - .5) * .25, color: colores[i % colores.length], fase: Math.random() * Math.PI * 2 });
    const t0 = performance.now();
    const paso = () => {
      if (!c.isConnected) return;
      const t = (performance.now() - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of ps) {
        p.x += p.vx + Math.sin(t * 3 + p.fase) * .6; p.y += p.vy; p.a += p.va;
        if (p.y > innerHeight + 20 && t < 4) { p.y = -20; p.x = Math.random() * innerWidth; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.color; ctx.globalAlpha = Math.abs(Math.cos(t * 4 + p.fase)) * .6 + .4; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      }
      if (t < 7) requestAnimationFrame(paso); else c.remove();
    };
    requestAnimationFrame(paso);
  }

  return { render, ceremonia };
})();
