// Pantalla de inicio: bienvenida (elige tu héroe), inicio limpio (héroe + Jugar + lo de hoy), héroe con pestañas,
// ranking, duelo, cuenta y ajustes. Es una capa encima del juego (#inicio). mostrar() la enseña; ocultar() la quita.
// Regla: cada pantalla responde a una pregunta; lo que no la responde va detrás de un toque.
window.FWM = window.FWM || {};

FWM.inicio = (function () {
  let App = null, animando = false, figuras = [];
  // iconos del menú (estilo D): placa clara con borde granate e icono de línea granate (trazos de Tabler Icons, licencia MIT)
  const SVG = (d) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const MEDALLON = (color, d) => `<span class="medallon">${SVG(d)}</span>`; // el color ya no se usa: todos granate sobre placa clara
  const ICONOS = {
    dia: MEDALLON("#2e9e4f", '<path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M16 3v4M8 3v4M4 11h16M8 15h2v2H8z"/>'),
    duelo: MEDALLON("#c0392b", '<path d="M21 3v5l-11 9-4 4-3-3 4-4 9-11z"/><path d="M5 13l6 6"/><path d="M14.32 17.32L18 21l3-3-3.365-3.365"/><path d="M10 5.5L8 3H3v5l3 2.5"/>'),
    heroe: MEDALLON("#2f6fd6", '<path d="M12 3a12 12 0 0 0 8.5 3 12 12 0 0 1-8.5 15A12 12 0 0 1 3.5 6 12 12 0 0 0 12 3"/>'),
    ranking: MEDALLON("#d6a92e", '<path d="M8 21h8M12 17v4M7 4h10M17 4v8a5 5 0 0 1-10 0V4"/><path d="M7 9H5a2 2 0 0 1 0-4h2M17 9h2a2 2 0 0 0 0-4h-2"/>'),
    tutorial: MEDALLON("#8e3bd6", '<path d="M22 9l-10-4-10 4 10 4 10-4v6"/><path d="M6 10.6V16a6 3 0 0 0 12 0v-5.4"/>'),
    libro: MEDALLON("#a5713e", '<path d="M3 19a9 9 0 0 1 9 0 9 9 0 0 1 9 0"/><path d="M3 6a9 9 0 0 1 9 0 9 9 0 0 1 9 0"/><path d="M3 6v13M12 6v13M21 6v13"/>'),
    ajustes: MEDALLON("#5f5e5a", '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'),
    cuenta: MEDALLON("#1d9e75", '<path d="M8 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>'),
    campana: MEDALLON("#8e2a20", '<path d="M5 3v18"/><path d="M5 4h13l-3 4.5 3 4.5H5"/>'),
    batalla: MEDALLON("#8e2a20", '<path d="M4 21V10h16v11z"/><path d="M4 10V7h3v3M9 10V6h6v4M17 10V7h3v3"/><path d="M10 21v-4h4v4"/>'),
    barbaros: MEDALLON("#7a2a3a", '<path d="M6 21V10l6-7 6 7v11z"/><path d="M9 21v-5h6v5"/><path d="M3 21h18"/><path d="M12 3v3"/>'),
    escenarios: MEDALLON("#2f6fd6", '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  };
  let entrado = false; // ya hubo un toque: el audio está desbloqueado
  let pestanaHeroe = "mejoras";

  function visible() { const n = document.getElementById("inicio"); return !!n && !n.hidden; }

  function mostrar(app) {
    App = app;
    document.getElementById("inicio").hidden = false;
    document.getElementById("inicio-sub").textContent = "";
    if (entrado) { vistaPrincipal(); FWM.musica.empezar("inicio"); }
    else vistaPortada();
    arrancarDesfile();
  }
  // Portada: un toque en cualquier sitio entra y, de paso, desbloquea el sonido (el navegador lo exige).
  function vistaPortada() {
    const T = App.datos.textos;
    const cont = document.createElement("div"); cont.className = "inicio-botones";
    cont.appendChild(App.boton(T.tocaParaEntrar, entrar, "btn btn-primario"));
    vista(cont);
    const capa = document.getElementById("inicio");
    const alTocar = () => { capa.removeEventListener("pointerdown", alTocar, true); entrar(); };
    setTimeout(() => capa.addEventListener("pointerdown", alTocar, true), 50);
    function entrar() {
      if (entrado) return; entrado = true; FWM.sonido.desbloquear(); FWM.musica.empezar("inicio"); vistaPrincipal();
      // el mismo toque que entra dispara después un "click" sobre lo que haya debajo (el botón Jugar): un escudo invisible se lo traga
      const escudo = document.createElement("div"); escudo.style.cssText = "position:fixed;inset:0;z-index:99;background:transparent";
      escudo.addEventListener("click", (ev) => { ev.stopPropagation(); ev.preventDefault(); }, true);
      // se quita medio segundo después de soltar el dedo (si se mantiene pulsado, el click llega al soltar)
      document.body.appendChild(escudo);
      const soltar = () => { document.removeEventListener("pointerup", soltar, true); document.removeEventListener("touchend", soltar, true); setTimeout(() => escudo.remove(), 500); };
      document.addEventListener("pointerup", soltar, true); document.addEventListener("touchend", soltar, true);
      setTimeout(() => escudo.remove(), 4000);
    }
  }
  function refrescar() { if (visible() && entrado) vistaPrincipal(); }
  function ocultar() {
    document.getElementById("inicio").hidden = true;
    animando = false;
    // la música no se para al salir del inicio: la partida tiene su propia pieza (la pone App.irPartida / nuevaPartida)
  }

  // ---------- utilidades ----------
  function vista(nodo, mantenerScroll) { const capa = document.getElementById("inicio"); const y = capa.scrollTop; const v = document.getElementById("inicio-vista"); v.innerHTML = ""; v.appendChild(nodo); if (mantenerScroll) capa.scrollTop = y; else { v.scrollTop = 0; capa.scrollTop = 0; } }
  function cabecera(titulo, atras) {
    const T = App.datos.textos;
    const c = document.createElement("div"); c.className = "inicio-vista-titulo";
    c.appendChild(App.boton("← " + T.volver, atras || vistaPrincipal, "btn btn-peq btn-claro"));
    const h = document.createElement("h2"); h.textContent = titulo; c.appendChild(h);
    return c;
  }
  function escapar(s) { return String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c])); }
  function nombreJugador() { return (FWM.nube.usuario() && FWM.nube.nombre()) || FWM.guardado.ajustes().nombre || ""; }
  function heroeConNivel() { const h = FWM.heroe.paraPartida({}); h.nivel = FWM.heroe.nivel(); return h; }
  function figuraHeroe(tam, detalle) { return FWM.figuras.canvasHeroe(heroeConNivel(), "#2f6fd6", tam, detalle); }

  // ---------- bienvenida: elige tu héroe → nombre → primer punto → cuenta ----------
  function vistaBienvenida(paso) {
    const T = App.datos.textos, TB = T.bienvenida; const D = FWM.datosBase.heroes;
    const cont = document.createElement("div"); cont.className = "bienvenida";
    paso = paso || 1;
    if (paso === 1) { // elige tu héroe
      cont.innerHTML = `<h2>${TB.elige}</h2><p class="suave">${TB.eligePista}</p>`;
      const fila = document.createElement("div"); fila.className = "heroe-clases";
      let elegido = FWM.heroe.leer().clase;
      const desc = document.createElement("p"); desc.className = "suave"; desc.style.margin = "0";
      const pintarGrande = () => { const c = D.clases[elegido]; desc.textContent = c.descripcion; fila.querySelectorAll(".heroe-clase").forEach(b => b.classList.toggle("sel", b.dataset.clase === elegido)); };
      for (const [id, c] of Object.entries(D.clases)) {
        const b = document.createElement("button"); b.className = "heroe-clase"; b.dataset.clase = id;
        b.appendChild(FWM.figuras.canvasHeroe({ clase: id, nivel: 1 }, "#2f6fd6", 84, true));
        const n = document.createElement("div"); n.className = "medalla-nombre"; n.textContent = c.nombre; b.appendChild(n);
        const l = document.createElement("small"); l.textContent = TB.lemas[id] || ""; b.appendChild(l);
        b.addEventListener("click", () => { elegido = id; pintarGrande(); FWM.sonido.tic(); });
        fila.appendChild(b);
      }
      cont.appendChild(fila); cont.appendChild(desc); pintarGrande();
      cont.appendChild(App.boton(TB.esteEsElMio, () => { FWM.heroe.cambiarClase(elegido); FWM.sonido.fanfarria(); vistaBienvenida(2); }, "btn btn-primario bienvenida-boton"));
      vista(cont); return;
    }
    if (paso === 2) { // nombre
      cont.innerHTML = `<h2>${TB.nombre}</h2>`;
      cont.appendChild(figuraHeroe(110, true));
      const inp = document.createElement("input"); inp.className = "bienvenida-input"; inp.maxLength = 20; inp.placeholder = TB.nombreEjemplo; inp.value = FWM.guardado.ajustes().nombre || ""; inp.autocomplete = "off"; cont.appendChild(inp);
      const b = App.boton(TB.seguir, () => { const n = inp.value.trim(); if (n.length < 2) { inp.focus(); FWM.paneles.aviso(T.errNombre, 2500); return; } FWM.guardado.guardarAjustes({ nombre: n }); vistaBienvenida(3); }, "btn btn-primario bienvenida-boton");
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") b.click(); });
      cont.appendChild(b); vista(cont); setTimeout(() => inp.focus(), 100); return;
    }
    if (paso === 3) { // primer punto de mejora: tres opciones
      FWM.heroe.darPuntoExtra(1);
      cont.innerHTML = `<h2>${TB.primerPunto}</h2><p class="suave">${TB.primerPuntoPista}</p>`;
      const fig = document.createElement("div"); fig.className = "bienvenida-grande"; fig.appendChild(figuraHeroe(130, true)); cont.appendChild(fig);
      const fila = document.createElement("div"); fila.className = "bienvenida-opciones";
      let elegida = null;
      const bConf = App.boton(T.confirmar, () => { if (!elegida) return; const err = FWM.heroe.mejorar(elegida); if (err) { FWM.paneles.aviso(T.errores[err] || err, 2500); return; } FWM.sonido.moneda(); fig.innerHTML = ""; fig.appendChild(figuraHeroe(130, true)); fig.firstChild.classList.add("brilla"); bConf.disabled = true; setTimeout(() => vistaBienvenida(4), 900); }, "btn btn-primario bienvenida-boton"); bConf.disabled = true;
      for (const id of ["vigor", "filo", "temple"]) {
        const m = D.mejoras[id];
        const b = document.createElement("button"); b.className = "bienvenida-opcion"; b.innerHTML = `<b>${m.nombre}</b><br><small>${m.texto.replace(T.fichas.delHeroe, "")}</small>`;
        b.addEventListener("click", () => { elegida = id; fila.querySelectorAll("button").forEach(x => x.classList.toggle("sel", x === b)); bConf.disabled = false; FWM.sonido.tic(); });
        fila.appendChild(b);
      }
      cont.appendChild(fila); cont.appendChild(bConf); vista(cont); return;
    }
    if (paso === 4) { // cuenta
      cont.innerHTML = `<h2>${TB.cuenta}</h2>`;
      cont.appendChild(figuraHeroe(100, true));
      const p = document.createElement("p"); p.textContent = TB.cuentaPista; cont.appendChild(p);
      const acabar = () => { FWM.guardado.guardarAjustes({ heroeElegido: true }); vistaBienvenida(5); };
      if (FWM.nube.posible() && !FWM.nube.usuario()) {
        cont.appendChild(App.boton(T.crearCuenta, () => { FWM.guardado.guardarAjustes({ heroeElegido: true }); vistaCuenta("alta", () => vistaBienvenida(5)); }, "btn btn-primario bienvenida-boton"));
        cont.appendChild(App.boton(T.yaTengoCuenta, () => { FWM.guardado.guardarAjustes({ heroeElegido: true }); vistaCuenta("entrar", () => vistaBienvenida(5)); }, "btn btn-claro bienvenida-boton"));
        cont.appendChild(App.boton(T.seguirSinCuenta, acabar, "btn btn-claro bienvenida-boton"));
      } else cont.appendChild(App.boton(TB.seguir, acabar, "btn btn-primario bienvenida-boton"));
      vista(cont); return;
    }
    // 5: tutorial o jugar
    cont.innerHTML = `<h2>${TB.listo.replace("{nombre}", escapar(nombreJugador()))}</h2>`;
    cont.appendChild(figuraHeroe(100, true));
    const p = document.createElement("p"); p.className = "suave"; p.textContent = T.primeraVez; cont.appendChild(p);
    cont.appendChild(App.boton(T.tutorial + " · 3 min", () => FWM.tutorial.empezar(App), "btn btn-primario bienvenida-boton"));
    // el segundo botón lleva al menú, no a una partida: con siete modos, soltar al jugador dentro de una
    // partida rápida sin haber visto el menú desorienta (y no sabe que existen campaña, bárbaros o duelos)
    cont.appendChild(App.boton(TB.alMenu, () => { FWM.guardado.guardarAjustes({ tutorialHecho: true }); vistaPrincipal(); }, "btn btn-claro bienvenida-boton"));
    vista(cont);
  }

  // ---------- inicio: tu héroe, Jugar y lo de hoy; el resto en iconos ----------
  function vistaPrincipal() {
    const T = App.datos.textos;
    const aj = FWM.guardado.ajustes();
    if (!aj.heroeElegido) { vistaBienvenida(1); return; }
    const cont = document.createElement("div"); cont.className = "inicio-botones";
    // duelo en curso: lo primero y lo más visible; salir al inicio no debe dejarlo inalcanzable (6 sep 2026)
    if (FWM.duelo && FWM.duelo.activo()) {
      const d = document.createElement("div"); d.className = "duelo-vivo";
      d.innerHTML = `<div class="duelo-vivo-txt"><b>⚔ ${T.dueloEnCurso}</b><small>${T.dueloRelojSigue}</small></div>`;
      d.appendChild(App.boton(T.dueloVolver, () => App.irPartida(), "btn btn-primario late"));
      cont.appendChild(d);
    }
    // tarjeta del héroe
    const card = document.createElement("button"); card.className = "inicio-heroe"; card.addEventListener("click", () => vistaHeroe());
    card.appendChild(figuraHeroe(72, true));
    const pr = FWM.heroe.progreso(); const disp = FWM.heroe.puntosMejoraDisponibles();
    const info = document.createElement("div"); info.className = "inicio-heroe-info";
    const pct = pr.siguienteNivel ? Math.min(100, Math.round(100 * (pr.puntos - pr.desdeNivel) / (pr.siguienteNivel.puntos - pr.desdeNivel))) : 100;
    const hh = FWM.heroe.leer();
    info.innerHTML = `<div class="perfil-nombre">${escapar(nombreJugador() || T.heroeUI.titulo)}</div><div class="perfil-escalon">${FWM.heroes.nombreNivel(FWM.heroe.nivel())}</div><div class="suave lineas"><span>${T.heroeUI.nivel} ${Math.min(8, FWM.heroe.nivel())}</span><span>${pr.puntos} ${T.puntos.toLowerCase()}</span><span>${hh.oro || 0} ${T.heroeUI.oroCorto}</span></div><div class="heroe-barra"><i style="width:${pct}%"></i></div>`;
    if (disp > 0) { const b = document.createElement("span"); b.className = "btn btn-peq btn-primario late"; b.textContent = `${T.heroeUI.gastar} (${disp})`; info.appendChild(b); }
    card.appendChild(info); cont.appendChild(card);
    if (FWM.nube.usuario()) FWM.nube.miRanking("total", "suma").then(m => { if (m) { const antes = FWM.heroe.nivel(); FWM.heroe.anotarPuntosNube(m.puntos); if (FWM.heroe.nivel() !== antes && visible()) vistaPrincipal(); } }).catch(() => {});
    // Leyenda: quien más puntos tiene de todos
    if (FWM.nube.disponible() && FWM.nube.usuario()) FWM.nube.ranking("total", 1, "suma").then(f => { const yo = FWM.nube.usuario(); const soy = !!(f && f[0] && yo && f[0].usuario === yo.id && FWM.heroes.nivelPorPuntos(Number(f[0].puntos)) >= 7); const antes = FWM.heroe.leer().leyenda; FWM.heroe.ponerLeyenda(soy); if (soy !== antes) refrescar(); }).catch(() => {});
    // jugar / continuar
    if (App.estado && App.estado.ganador == null) cont.appendChild(App.boton(T.continuar, () => App.irPartida(), "btn btn-primario"));
    cont.appendChild(App.boton(T.jugar, vistaJugar, "btn " + (App.estado && App.estado.ganador == null ? "btn-claro" : "btn-primario")));
    // lo de hoy: misiones (plegadas), retos pendientes, racha
    try {
      const act = FWM.misiones.activas(App.datos); const hechas = act.dia.filter(x => x.hecha).length;
      const caja = document.createElement("div"); caja.className = "misiones";
      const tit = document.createElement("button"); tit.className = "misiones-tit";
      const pintarTit = (abierto) => { tit.innerHTML = `<span>${T.misiones.deHoy} · ${T.misiones.hechas.replace("{n}", hechas)}</span><span class="misiones-flecha">${abierto ? "▲" : "▼"}</span>`; };
      const lista = document.createElement("div"); lista.hidden = !aj.misionesAbiertas; pintarTit(!lista.hidden);
      const cab = document.createElement("div"); cab.className = "mision cabecera"; cab.innerHTML = `<span>${T.misiones.mision}</span><b>${T.misiones.premio}</b>`; lista.appendChild(cab);
      for (const x of act.dia.concat(act.semana)) { const d = document.createElement("div"); d.className = "mision" + (x.hecha ? " hecha" : "") + (x.ambito === "semana" ? " semana" : ""); d.innerHTML = `<span>${x.hecha ? "✓" : "○"} ${x.texto}${x.meta ? ` <small class="suave">${Math.min(x.progreso, x.meta)}/${x.meta}</small>` : ""}${x.ambito === "semana" ? ` <small class="suave">${T.misiones.semanal}</small>` : ""}</span><b>+${x.oro}</b>`; lista.appendChild(d); }
      tit.addEventListener("click", () => { lista.hidden = !lista.hidden; pintarTit(!lista.hidden); FWM.guardado.guardarAjustes({ misionesAbiertas: !lista.hidden }); });
      caja.appendChild(tit); caja.appendChild(lista); cont.appendChild(caja);
    } catch (e) { /* sin misiones */ }
    if (FWM.nube.disponible() && FWM.nube.usuario()) {
      const caja = document.createElement("div"); cont.appendChild(caja);
      FWM.nube.retosPendientes().then(retos => {
        for (const r of retos.slice(0, 3)) {
          const d = document.createElement("div"); d.className = "reto-pendiente";
          d.appendChild(FWM.iconos.canvasTropa((r.p && r.p.avatar) || "espadachin", "#d63b3b", 30));
          const sp = document.createElement("span"); sp.textContent = T.duelo.teReta.replace("{nombre}", (r.p && r.p.nombre) || "?"); d.appendChild(sp);
          d.appendChild(App.boton(T.duelo.aceptarReto, () => { FWM.nube.borrarReto(r.id).catch(() => {}); vistaDuelo({ codigo: r.codigo }); }, "btn btn-peq btn-primario"));
          caja.appendChild(d);
        }
      }).catch(() => {});
      reclamarLiga();
    }
    // racha de días y aviso de día nuevo (una vez al día): motivo para volver mañana
    try {
      const rec = FWM.guardado.records(); const racha = FWM.guardado.rachaViva(rec); const hoyStr = new Date().toISOString().slice(0, 10);
      const nuevoDia = aj.ultimaVisita !== hoyStr && (rec.partidas || 0) > 0;
      if (aj.ultimaVisita !== hoyStr) FWM.guardado.guardarAjustes({ ultimaVisita: hoyStr });
      const banda = document.createElement("div"); banda.className = "inicio-hoy" + (nuevoDia ? " nuevo" : "");
      const partes = [];
      if (nuevoDia) partes.push(`<span>${T.rachaDias.nuevoDia}</span>`);
      if (racha >= 1) partes.push(`<span>🔥 <b>${racha === 1 ? T.rachaDias.uno : T.rachaDias.dias.replace("{n}", racha)}</b> · ${rec.ultimoDia === hoyStr ? T.rachaDias.hecha : T.rachaDias.hoy}</span>`);
      else partes.push(`<span>${T.rachaDias.empieza}</span>`);
      banda.innerHTML = partes.join(""); cont.appendChild(banda);
    } catch (e) { /* sin racha */ }
    // el resto: iconos con nombre
    const fila = document.createElement("div"); fila.className = "inicio-iconos";
    const icono = (nombre, texto, fn, aviso) => { const b = document.createElement("button"); b.className = "inicio-icono"; b.innerHTML = `<span class="ico">${ICONOS[nombre] || ""}</span><span class="rotulo">${texto}</span>`; if (aviso) { const s = document.createElement("span"); s.className = "punto-aviso"; s.textContent = aviso; b.appendChild(s); } b.addEventListener("click", fn); fila.appendChild(b); };
    const campSig = FWM.campana && FWM.campana.siguiente();
    const recB = FWM.guardado.records().barbarosRecord || 0;
    icono("barbaros", T.barbaros.boton, vistaBarbaros, recB ? String(recB) : null);
    icono("escenarios", T.escenarios.boton, vistaEscenarios);
    icono("campana", T.campana.boton, vistaCampana, campSig && campSig.id > 1 ? String(FWM.campana.progreso().hechos) : null);
    icono("batalla", T.batalla.boton, vistaBatalla);
    icono("dia", T.mapaDelDia, () => App.nuevaPartida({ tipo: "dia", bando: FWM.guardado.ajustes().bando || "aleatorio" }));
    if (FWM.nube.posible()) icono("duelo", T.duelo.boton, vistaDuelo);
    icono("heroe", T.heroeUI.boton, vistaHeroe, disp > 0 ? disp : null);
    icono("ranking", T.ranking, vistaRanking);
    icono("tutorial", T.tutorial, () => FWM.tutorial.empezar(App));
    icono("libro", T.comoSeJuega, () => App.abrirGlosario({ pestana: "reglas" }));
    icono("ajustes", T.ajustes, vistaAjustes);
    if (FWM.nube.posible()) icono("cuenta", FWM.nube.usuario() ? T.cuenta : T.crearCuenta, () => vistaCuenta(FWM.nube.usuario() ? "dentro" : "alta"));
    const resto = fila.children.length % 4; if (resto === 2) fila.classList.add("sobran2"); else if (resto === 1) fila.classList.add("sobran1");
    cont.appendChild(fila);
    // instalar (Android) / pista (iPhone)
    const yaInstalada = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    if (!yaInstalada && window.__instalar) cont.appendChild(App.boton("📲 " + T.instalar, async () => { const ev = window.__instalar; window.__instalar = null; ev.prompt(); await ev.userChoice; vistaPrincipal(); }, "btn btn-peq btn-claro"));
    vista(cont);
  }

  function vistaJugar() {
    const T = App.datos.textos;
    const cont = document.createElement("div");
    cont.appendChild(cabecera(T.jugar));
    const f = App.formularioPartida();
    cont.appendChild(f.nodo);
    const fila = document.createElement("div"); fila.className = "modal-botones";
    fila.appendChild(App.boton(T.empezar, () => App.nuevaPartida(f.leer()), "btn btn-primario"));
    cont.appendChild(fila);
    vista(cont);
  }

  // ---------- textos legales ----------
  function textoLegal(txt) {
    const L = App.datos.legal || FWM.datosBase.legal;
    return String(txt).replace("{titular}", L.titular).replace("{contacto}", L.contacto).replace("{paisDatos}", L.paisDatos)
      .replace("{edad}", L.edadMinima).replace("{actualizado}", L.actualizado);
  }
  function vistaLegal(cual, atras) {
    const T = App.datos.textos; const L = App.datos.legal || FWM.datosBase.legal;
    const doc = L[cual] || L.privacidad;
    const cont = document.createElement("div"); cont.appendChild(cabecera(doc.titulo, atras || vistaAjustes));
    const sec = document.createElement("section"); sec.className = "reino-sec legal";
    for (const s of doc.secciones) {
      const h = document.createElement("h3"); h.textContent = s.h; sec.appendChild(h);
      const p = document.createElement("p"); p.textContent = textoLegal(s.p); sec.appendChild(p);
    }
    const pie = document.createElement("p"); pie.className = "pista"; pie.textContent = `${T.version} ${FWM.VERSION}`; sec.appendChild(pie);
    cont.appendChild(sec); vista(cont);
  }

  // ---------- bárbaros: resistir hordas y contar rondas ----------
  function vistaBarbaros() {
    const T = App.datos.textos, TB = T.barbaros; const aj = FWM.guardado.ajustes(); const r = FWM.guardado.records();
    const cont = document.createElement("div"); cont.appendChild(cabecera(TB.titulo));
    const p = document.createElement("p"); p.className = "pista"; p.textContent = TB.pista; cont.appendChild(p);
    const card = document.createElement("div"); card.className = "batalla-card";
    const rec = r.barbarosRecord || 0;
    card.innerHTML = `<h3>${escapar(FWM.mapasHechos.MAPAS.arena.nombre)}</h3><p class="batalla-historia">${escapar(FWM.mapasHechos.MAPAS.arena.texto)}</p>
      <p class="barbaros-record">${rec ? TB.record.replace("{n}", rec) : TB.sinRecord}</p>`;
    // el bando decide tu rasgo, como siempre
    const selBando = document.createElement("select");
    for (const [id, b] of Object.entries(App.datos.bandos)) { if (b.noJugable) continue; const o = document.createElement("option"); o.value = id; o.textContent = b.nombre; if (id === aj.bando) o.selected = true; selBando.appendChild(o); }
    const campo = document.createElement("div"); campo.className = "campo"; const lab = document.createElement("label"); lab.textContent = T.tuBando; campo.appendChild(lab); campo.appendChild(selBando); card.appendChild(campo);
    const rasgo = document.createElement("p"); rasgo.className = "pista"; card.appendChild(rasgo);
    const pintar = () => { const b = App.datos.bandos[selBando.value]; rasgo.textContent = b ? b.rasgo : ""; };
    selBando.addEventListener("change", pintar); pintar();
    const consejo = document.createElement("p"); consejo.className = "pista"; consejo.textContent = TB.consejo; card.appendChild(consejo);
    const fila = document.createElement("div"); fila.className = "modal-botones"; fila.style.marginTop = "10px";
    fila.appendChild(App.boton(TB.jugar, () => {
      FWM.guardado.guardarAjustes({ bando: selBando.value });
      App.nuevaPartida({ tipo: "barbaros", mapaHecho: "arena", bando: selBando.value, rivales: 1, dificultad: "normal", tecnologia: "todo", hucha: 2, recursos: "equilibrado", limite: 0, semilla: Math.floor(Math.random() * 1e6) + 1 });
    }, "btn btn-primario"));
    if (FWM.nube.disponible()) fila.appendChild(App.boton(TB.ranking, () => vistaRanking("barbaros"), "btn btn-claro"));
    card.appendChild(fila); cont.appendChild(card);
    vista(cont);
  }

  // ---------- grandes batallas: mapas históricos con cada reino en su tierra ----------
  function vistaEscenarios(elegido) {
    const T = App.datos.textos, TE = T.escenarios; const aj = FWM.guardado.ajustes();
    const lista = FWM.datosBase.escenarios || [];
    const esc = lista.find(e => e.id === elegido) || lista[0];
    const cont = document.createElement("div"); cont.appendChild(cabecera(TE.titulo));
    const p = document.createElement("p"); p.className = "pista"; p.textContent = TE.pista; cont.appendChild(p);
    // elegir escenario
    const tabs = document.createElement("div"); tabs.className = "glosario-tabs";
    for (const e of lista) tabs.appendChild(App.boton(e.nombre, () => vistaEscenarios(e.id), "btn btn-peq " + (e.id === esc.id ? "btn-primario" : "btn-claro")));
    cont.appendChild(tabs);
    if (!esc) { vista(cont); return; }
    const mapa = FWM.mapasHechos.parsear(esc.mapa);
    const bandosMapa = Object.keys(mapa.porBando || {});
    const card = document.createElement("div"); card.className = "batalla-card";
    card.innerHTML = `<h3>${escapar(esc.nombre)}</h3><p class="batalla-historia">${escapar(esc.texto)}</p>`;
    // bando (dónde empiezas), rivales, turnos y fin
    const selBando = document.createElement("select");
    for (const b of bandosMapa) { const o = document.createElement("option"); o.value = b; o.textContent = App.datos.bandos[b].nombre; if (b === aj.bando) o.selected = true; selBando.appendChild(o); }
    const campo = (etiqueta, nodo) => { const d = document.createElement("div"); d.className = "campo"; const l = document.createElement("label"); l.textContent = etiqueta; d.appendChild(l); d.appendChild(nodo); return d; };
    card.appendChild(campo(TE.tuBando, selBando));
    const selRivales = document.createElement("select");
    for (let n = esc.rivalesMin; n <= Math.min(esc.rivalesMax, bandosMapa.length - 1); n++) { const o = document.createElement("option"); o.value = String(n); o.textContent = String(n); if (n === esc.rivalesPorDefecto) o.selected = true; selRivales.appendChild(o); }
    card.appendChild(campo(T.jugadores, selRivales));
    const selFin = document.createElement("select");
    for (const [v, txt] of [["puntos", T.finPuntos], ["eliminacion", T.finEliminacion]]) { const o = document.createElement("option"); o.value = v; o.textContent = txt; selFin.appendChild(o); }
    card.appendChild(campo(T.finPartida, selFin));
    const selTurnos = document.createElement("select");
    for (const n of [30, 40, 60, 80, 120]) { const o = document.createElement("option"); o.value = String(n); o.textContent = String(n); if (n === esc.turnos) o.selected = true; selTurnos.appendChild(o); }
    const campoTurnos = campo(T.limiteTurnos, selTurnos); card.appendChild(campoTurnos);
    const rasgo = document.createElement("p"); rasgo.className = "pista"; card.appendChild(rasgo);
    const pintar = () => { const b = App.datos.bandos[selBando.value]; rasgo.textContent = (b ? b.rasgo + " " : "") + TE.bandoPista; campoTurnos.hidden = selFin.value !== "puntos"; };
    selBando.addEventListener("change", pintar); selFin.addEventListener("change", pintar); pintar();
    const av = document.createElement("p"); av.className = "pista"; av.textContent = TE.aviso; card.appendChild(av);
    const fila = document.createElement("div"); fila.className = "modal-botones"; fila.style.marginTop = "10px";
    fila.appendChild(App.boton(TE.jugar, () => {
      FWM.guardado.guardarAjustes({ bando: selBando.value });
      App.nuevaPartida(Object.assign({ tipo: "escenario", escenario: esc.id, mapaHecho: esc.mapa, bando: selBando.value,
        rivales: parseInt(selRivales.value, 10), dificultad: "normal", tecnologia: "todo", hucha: 2, recursos: "equilibrado",
        semilla: Math.floor(Math.random() * 1e6) + 1, limite: selFin.value === "puntos" ? parseInt(selTurnos.value, 10) : 0 }));
    }, "btn btn-primario"));
    card.appendChild(fila); cont.appendChild(card);
    vista(cont);
  }

  // ---------- campaña: diez mapas hechos a mano, uno tras otro ----------
  function vistaCampana() {
    const T = App.datos.textos, TC = T.campana; const C = FWM.campana; const aj = FWM.guardado.ajustes();
    const cont = document.createElement("div"); cont.appendChild(cabecera(TC.titulo));
    const pr = C.progreso(); const sig = C.siguiente();
    const p = document.createElement("p"); p.className = "pista"; p.textContent = TC.pista; cont.appendChild(p);
    const prog = document.createElement("p"); prog.innerHTML = `<b>${sig ? TC.progreso.replace("{n}", pr.hechos).replace("{t}", pr.total) : TC.completa}</b>`; cont.appendChild(prog);
    for (const cap of C.lista()) {
      const hecha = C.superado(cap.id); const esSig = sig && sig.id === cap.id; const abierto = hecha || esSig;
      const d = document.createElement("div"); d.className = "campana-fila" + (hecha ? " hecha" : esSig ? " sig" : " bloq");
      const num = document.createElement("div"); num.className = "campana-num"; num.textContent = hecha ? "✓" : cap.id; d.appendChild(num);
      const txt = document.createElement("div"); txt.className = "campana-txt";
      const mapa = FWM.mapasHechos.MAPAS[cap.mapa]; const dif = cap.dificultad === "dificil" ? T.dificil : cap.dificultad === "facil" ? T.facil : T.normal;
      const premio = `${TC.premio}: +${cap.premio.oro} ${T.heroeUI.oroCorto}${cap.premio.objeto && App.datos.objetos[cap.premio.objeto] ? " · " + App.datos.objetos[cap.premio.objeto].nombre : ""}`;
      txt.innerHTML = `<b>${cap.nombre}</b>${abierto ? `${escapar(cap.texto)}<small>${mapa ? mapa.nombre + " · " : ""}${TC.rivales.replace("{n}", cap.rivales).replace("{d}", dif).replace("{t}", cap.limite)}</small><small>${premio}</small>` : `<small>${TC.bloqueado}</small>`}`;
      d.appendChild(txt);
      if (abierto) d.appendChild(App.boton(hecha ? TC.repetir : TC.jugar, () => App.nuevaPartida(C.opciones(cap.id, aj.bando || "aleatorio")), "btn btn-peq " + (esSig ? "btn-primario" : "btn-claro")));
      cont.appendChild(d);
    }
    vista(cont);
  }

  // ---------- batalla de la semana: un mapa hecho a mano con reglas propias ----------
  function vistaBatalla() {
    const T = App.datos.textos, TB = T.batalla; const B = FWM.batalla; const aj = FWM.guardado.ajustes();
    const cont = document.createElement("div"); cont.appendChild(cabecera(TB.titulo));
    const b = B.actual(); if (!b) { vista(cont); return; }
    const p = document.createElement("p"); p.className = "pista"; p.textContent = TB.pista; cont.appendChild(p);
    const mapa = FWM.mapasHechos.MAPAS[b.mapa]; const dif = b.dificultad === "dificil" ? T.dificil : b.dificultad === "facil" ? T.facil : T.normal;
    const card = document.createElement("div"); card.className = "batalla-card";
    card.innerHTML = `<h3>${escapar(b.nombre)}${b.anio ? ` <small class="batalla-anio">${b.anio}</small>` : ""}</h3>
      <p class="batalla-historia">${escapar(b.historia || "")}</p>
      <p class="suave" style="margin:0 0 6px"><b>${escapar(b.regla || "")}</b></p>
      <div>${[mapa ? mapa.nombre : "", `${b.rivales} ${T.jugadores.toLowerCase()}`, dif, `${b.limite} ${T.turnos}`, b.hucha === 3 ? "oro ×3" : b.hucha === 1 ? "mitad de oro" : ""].filter(Boolean).map(x => `<span class="batalla-regla">${x}</span>`).join("")}</div>
      <p class="pista" style="margin:8px 0 0">${TB.noEsSimulacion} ${B.diasRestantes() <= 1 ? TB.cambiaManana : TB.cambia.replace("{n}", B.diasRestantes())}</p>`;
    const mio = B.leer(); const est = document.createElement("p"); est.style.margin = "6px 0 0"; est.textContent = mio.partidas ? TB.tuSemana.replace("{n}", mio.partidas).replace("{m}", mio.mejor) : TB.sinJugar; card.appendChild(est);
    const fila = document.createElement("div"); fila.className = "modal-botones"; fila.style.marginTop = "10px";
    fila.appendChild(App.boton(TB.jugar, () => App.nuevaPartida(B.opciones(aj.bando || "aleatorio")), "btn btn-primario"));
    if (FWM.nube.disponible()) fila.appendChild(App.boton(TB.verRanking, () => vistaRanking("batalla"), "btn btn-claro"));
    card.appendChild(fila); cont.appendChild(card);
    vista(cont);
  }

  // ---------- el héroe: cabecera limpia y pestañas ----------
  function vistaHeroe(op) {
    const T = App.datos.textos, TH = T.heroeUI; const D = FWM.datosBase.heroes; const H = FWM.heroe;
    if (op && op.pestana) pestanaHeroe = op.pestana;
    const h = H.leer(); const pr = H.progreso(); const clase = D.clases[h.clase];
    const cont = document.createElement("div"); cont.appendChild(cabecera(TH.titulo));
    const card = document.createElement("section"); card.className = "reino-sec heroe-card";
    const fig = figuraHeroe(150, true); card.appendChild(fig);
    const info = document.createElement("div"); info.className = "heroe-info";
    let barra = pr.siguienteNivel ? `<div class="heroe-barra"><i style="width:${Math.min(100, Math.round(100 * (pr.puntos - pr.desdeNivel) / (pr.siguienteNivel.puntos - pr.desdeNivel)))}%"></i></div><small class="suave">${TH.siguienteNivel.replace("{nombre}", pr.siguienteNivel.nombre).replace("{n}", pr.siguienteNivel.puntos)} · ${pr.puntos} ${T.puntos.toLowerCase()}</small>` : `<small class="suave">${TH.cima} · ${pr.puntos} ${T.puntos.toLowerCase()}</small>`;
    info.innerHTML = `<div class="perfil-escalon">${FWM.heroes.nombreNivel(H.nivel())}</div><div class="perfil-nombre">${escapar(nombreJugador() || TH.titulo)}</div><div class="suave lineas"><span>${TH.nivel} ${Math.min(8, H.nivel())}</span><span>${pr.puntos} ${T.puntos.toLowerCase()}</span><span>${h.oro || 0} ${TH.oroCorto}</span></div><div><b>${clase.nombre}</b> <small class="suave">${clase.rasgo}</small></div>${barra}`;
    if (pr.disponibles > 0) { const b = App.boton(`${TH.gastar} (${pr.disponibles})`, () => vistaHeroe({ pestana: "mejoras" }), "btn btn-peq btn-primario late"); info.appendChild(b); }
    else if (pr.umbralSiguiente) { const s = document.createElement("small"); s.className = "suave"; s.textContent = TH.siguientePunto.replace("{n}", pr.umbralSiguiente); info.appendChild(s); }
    card.appendChild(info); cont.appendChild(card);
    if (!FWM.nube.usuario() && FWM.nube.posible()) { const av = document.createElement("div"); av.className = "aviso-cuenta"; const t = document.createElement("span"); t.textContent = TH.sinCuenta; av.appendChild(t); av.appendChild(App.boton(T.crearCuentaOEntrar, () => vistaCuenta("alta", () => vistaHeroe()), "btn btn-peq btn-primario")); cont.appendChild(av); }
    // pestañas
    const tabs = document.createElement("div"); tabs.className = "glosario-tabs";
    for (const [id, txt] of [["mejoras", TH.mejoras], ["objetos", TH.objetos], ["tienda", TH.tienda], ["niveles", TH.niveles], ["logros", TH.logros]]) tabs.appendChild(App.boton(txt, () => vistaHeroe({ pestana: id }), "btn btn-peq " + (id === pestanaHeroe ? "btn-primario" : "btn-claro")));
    cont.appendChild(tabs);
    const sec = document.createElement("section"); sec.className = "reino-sec";
    if (pestanaHeroe === "mejoras") pintarMejoras(sec, h, pr);
    else if (pestanaHeroe === "objetos") pintarObjetos(sec, h);
    else if (pestanaHeroe === "tienda") pintarTienda(sec, h);
    else if (pestanaHeroe === "niveles") sec.innerHTML = `<h3>${TH.niveles}</h3>` + D.niveles.map(n => `<div class="heroe-nivel${n.nivel <= H.nivel() ? " tiene" : ""}"><span>${n.nivel}. <b>${n.nombre}</b> <small class="suave">${n.puntos == null ? TH.leyenda : n.puntos + " " + T.puntos.toLowerCase()}</small></span><span class="suave">${n.unidad ? TH.desbloquea + ": " + (App.datos.tropas[n.unidad] ? App.datos.tropas[n.unidad].nombre : (TH.unidadFutura[n.unidad] || TH.unidadPronto)) : TH.nada}</span></div>`).join("");
    else { sec.className = ""; sec.appendChild(seccionMedallas(FWM.guardado.records())); }
    cont.appendChild(sec);
    vista(cont, !!(op && (op.pestana || op.subida || op.quieto)));
    if (op && op.subida) fig.classList.add("brilla");
  }
  // Mejoras: primero las que puedes tocar ahora; las demás, en gris debajo.
  function pintarMejoras(sec, h, pr) {
    const T = App.datos.textos, TH = T.heroeUI; const D = FWM.datosBase.heroes; const H = FWM.heroe;
    const hn = Object.assign({}, h, { nivel: H.nivelJugable() });
    const filas = Object.entries(D.mejoras).map(([id, m]) => ({ id, m, tengo: h.mejoras[id] || 0, motivo: FWM.heroes.puedeMejorar(hn, id) }));
    // las completas ("tope") se quedan en su sitio, marcadas al máximo; a "Más adelante" solo van las aún bloqueadas
    const ahora = filas.filter(f => !f.motivo || f.motivo === "tope"), luego = filas.filter(f => f.motivo && f.motivo !== "tope");
    const p = document.createElement("p"); p.className = "suave"; p.style.margin = "0 0 6px"; p.textContent = pr.disponibles > 0 ? TH.sinGastar.replace("{n}", pr.disponibles) : (pr.umbralSiguiente ? TH.siguientePunto.replace("{n}", pr.umbralSiguiente) : TH.cima); sec.appendChild(p);
    // elegir una mejora la marca; el punto solo se gasta al pulsar Confirmar
    let elegida = null; const confirmar = document.createElement("div"); confirmar.className = "heroe-confirmar"; confirmar.hidden = true;
    const pintarConfirmar = () => {
      confirmar.innerHTML = ""; confirmar.hidden = !elegida; sec.querySelectorAll(".heroe-mejora").forEach(x => x.classList.toggle("elegida", x.dataset.id === elegida));
      if (!elegida) return;
      const m = D.mejoras[elegida]; const t = document.createElement("span"); t.innerHTML = `<b>${m.nombre}</b> · ${m.texto}`; confirmar.appendChild(t);
      const fila = document.createElement("div"); fila.className = "modal-botones";
      fila.appendChild(App.boton(T.cancelar, () => { elegida = null; pintarConfirmar(); }, "btn btn-peq btn-claro"));
      fila.appendChild(App.boton(T.confirmar, () => { const err = H.mejorar(elegida); if (err) FWM.paneles.aviso(T.errores[err] || err, 2500); else { FWM.sonido.moneda(); vistaHeroe({ subida: elegida }); } }, "btn btn-peq btn-primario"));
      confirmar.appendChild(fila);
    };
    const fila = (f, activa) => {
      const completa = f.motivo === "tope";
      const d = document.createElement("div"); d.className = "heroe-mejora" + (f.tengo ? " tiene" : "") + (activa ? "" : " apagada") + (completa ? " completa" : ""); d.dataset.id = f.id;
      const req = f.motivo === "requiere" ? Object.entries(f.m.requiere).map(([r, n]) => D.mejoras[r].nombre + " " + n).join(", ") : "";
      d.innerHTML = `<div class="hm-txt"><b>${f.m.nombre}</b> <span class="hm-puntos">${"●".repeat(f.tengo)}${"○".repeat(Math.max(0, f.m.peldanos - f.tengo))}</span><br><small class="suave">${f.m.texto}${req ? " · " + TH.requiere.replace("{que}", req) : ""}</small></div>`;
      if (completa) { const b = document.createElement("span"); b.className = "hm-completa"; b.textContent = TH.tope; d.appendChild(b); }
      else if (activa) { const b = App.boton(TH.elegir, () => { elegida = f.id; pintarConfirmar(); confirmar.scrollIntoView({ block: "nearest" }); }, "btn btn-peq " + (pr.disponibles > 0 ? "btn-primario" : "btn-claro")); b.disabled = pr.disponibles <= 0; d.appendChild(b); }
      return d;
    };
    sec.appendChild(confirmar);
    for (const fam of ["heroe", "aura", "reino", "aspecto"]) {
      const mias = ahora.filter(f => f.m.familia === fam); if (!mias.length) continue;
      const h3 = document.createElement("h3"); h3.textContent = TH.familia[fam]; sec.appendChild(h3);
      for (const f of mias) sec.appendChild(fila(f, true));
    }
    if (luego.length) { const h3 = document.createElement("h3"); h3.textContent = TH.masAdelante; h3.className = "suave"; sec.appendChild(h3); for (const f of luego) sec.appendChild(fila(f, false)); }
  }
  // Objetos: cuatro huecos; tocar uno enseña lo que tienes para él.
  function pintarObjetos(sec, h) {
    const T = App.datos.textos, TH = T.heroeUI; const O = App.datos.objetos || {}; const H = FWM.heroe;
    sec.innerHTML = `<h3>${TH.objetos} <span class="suave">· ${TH.oro}: <b>${h.oro || 0}</b></span></h3>`;
    const slots = document.createElement("div"); slots.className = "heroe-slots"; sec.appendChild(slots);
    const detalle = document.createElement("div"); sec.appendChild(detalle);
    const tipos = ["arma", "escudo", "montura", "cabeza", "consumible", "aspecto"];
    const inv = (h.inventario || []).filter(id => O[id]);
    let abierto = null;
    const pintar = () => {
      slots.innerHTML = ""; detalle.innerHTML = "";
      for (const tipo of tipos) {
        const id = h.objetos && h.objetos[tipo]; const o = id && O[id];
        const cuantos = inv.filter(x => O[x].tipo === tipo).length;
        const d = document.createElement("button"); d.className = "heroe-slot" + (o ? " lleno" : "") + (abierto === tipo ? " sel" : "");
        d.innerHTML = `<small class="suave">${TH.tipos[tipo]}</small><div class="medalla-nombre">${o ? o.nombre : TH.vacio}</div><small>${o ? o.texto : (cuantos ? cuantos + " " + TH.disponibles : "")}</small>`;
        d.addEventListener("click", () => { abierto = abierto === tipo ? null : tipo; pintar(); });
        slots.appendChild(d);
      }
      if (!abierto) { if (!inv.length) { const p = document.createElement("p"); p.className = "suave"; p.textContent = TH.nadaInventario + " "; p.appendChild(App.boton(T.jugar, vistaJugar, "btn btn-peq btn-primario")); detalle.appendChild(p); } return; }
      const equipado = h.objetos && h.objetos[abierto];
      if (equipado) detalle.appendChild(App.boton(TH.quitar + ": " + O[equipado].nombre, () => { H.desequipar(abierto); vistaHeroe({ quieto: true }); }, "btn btn-peq btn-claro"));
      const candidatos = inv.filter(id => O[id].tipo === abierto && id !== equipado);
      if (!candidatos.length && !equipado) { const p = document.createElement("p"); p.className = "suave"; p.textContent = TH.nadaDeEsteTipo; detalle.appendChild(p); }
      for (const id of candidatos) {
        const o = O[id]; const fila = document.createElement("div"); fila.className = "heroe-mejora tiene rareza-" + o.rareza;
        fila.innerHTML = `<div class="hm-txt"><b>${o.nombre}</b> <small class="suave">${App.datos.objetosReglas.rarezas[o.rareza]}</small><br><small class="suave">${o.texto}</small></div>`;
        fila.appendChild(App.boton(TH.equipar, () => { const err = H.equipar(id); if (err) FWM.paneles.aviso(T.errores[err] || err, 2500); else { FWM.sonido.pop(); vistaHeroe({ quieto: true }); } }, "btn btn-peq btn-primario"));
        detalle.appendChild(fila);
      }
    };
    pintar();
  }
  function pintarTienda(sec, h) {
    const T = App.datos.textos, TH = T.heroeUI; const O = App.datos.objetos || {}; const H = FWM.heroe;
    sec.innerHTML = `<h3>${TH.tienda} <span class="suave">· ${TH.oro}: <b>${h.oro || 0}</b></span></h3><p class="suave" style="margin:0 0 6px">${TH.tiendaPista}</p>`;
    for (const [id, o] of Object.entries(O)) {
      if (!o.tienda) continue;
      const ya = H.tiene(id); const fila = document.createElement("div"); fila.className = "heroe-mejora rareza-" + o.rareza + (ya ? " tiene" : "");
      fila.innerHTML = `<div class="hm-txt"><b>${o.nombre}</b> <small class="suave">${TH.tipos[o.tipo]}</small><br><small class="suave">${o.texto}</small></div>`;
      const b = App.boton(ya ? TH.equipado : TH.precio.replace("{n}", o.tienda), () => { const err = H.comprar(id); if (err) FWM.paneles.aviso(T.errores[err] || err, 2500); else { FWM.sonido.moneda(); vistaHeroe({ quieto: true }); } }, "btn btn-peq " + (!ya && (h.oro || 0) >= o.tienda ? "btn-primario" : "btn-claro"));
      b.disabled = ya || (h.oro || 0) < o.tienda; fila.appendChild(b); sec.appendChild(fila);
    }
    const otros = Object.entries(O).filter(([, o]) => !o.tienda);
    if (otros.length) { const h3 = document.createElement("h3"); h3.className = "suave"; h3.textContent = TH.noSeVenden; sec.appendChild(h3); const p2 = document.createElement("p"); p2.className = "suave"; p2.style.margin = "0"; p2.innerHTML = otros.map(([id, o]) => { const como = o.medalla ? TH.comoSale.medalla.replace("{nombre}", (App.datos.medallas.find(m => m.id === o.medalla.split(":")[0]) || {}).nombre || "").replace("{nivel}", T.nivelesMedalla[Number(o.medalla.split(":")[1]) - 1] || "") : o.campana ? TH.comoSale.campana.replace("{n}", o.campana) : o.liga ? TH.comoSale.liga.replace("{n}", o.liga) : TH.comoSale.botin; return `<b>${o.nombre}</b>: ${como}${H.tiene(id) ? " ✓" : ""}`; }).join("<br>"); sec.appendChild(p2); }
  }
  // Logros: medallas, las ganadas a color.
  function seccionMedallas(r) {
    const T = App.datos.textos; const lista = App.datos.medallas || []; const M = FWM.medallas;
    const sec = document.createElement("section"); sec.className = "reino-sec";
    const n = lista.reduce((s, m) => s + M.nivelGuardado(r, m.id), 0), total = lista.reduce((s, m) => s + M.maxNivel(m), 0);
    sec.innerHTML = `<h3>${T.medallas} <span class="suave">· ${T.medallasPista.replace("{n}", n).replace("{total}", total)}</span></h3>`;
    const g = document.createElement("div"); g.className = "medallas";
    for (const m of lista) {
      const nivel = M.nivelGuardado(r, m.id), ok = nivel > 0, max = nivel >= M.maxNivel(m);
      const d = document.createElement("div"); d.className = "medalla" + (ok ? " ganada" : "") + (m.niveles && ok ? " nivel-" + nivel : "");
      const ic = document.createElement("div"); ic.className = "medalla-icono"; ic.appendChild(FWM.figuras.canvasMedalla(m.icono, 56, !ok)); d.appendChild(ic);
      const nm = document.createElement("div"); nm.className = "medalla-nombre"; nm.textContent = M.nombre(m, nivel, T); d.appendChild(nm);
      if (m.niveles) { const es = document.createElement("div"); es.className = "medalla-estrellas"; es.textContent = "★".repeat(nivel) + "☆".repeat(M.maxNivel(m) - nivel); d.appendChild(es); }
      const ds = document.createElement("small"); ds.textContent = max ? (m.niveles ? T.nivelMaximo + " · " : "") + M.descripcion(m, nivel - 1) : (ok ? T.siguienteObjetivo + ": " : "") + M.descripcion(m, nivel); d.appendChild(ds);
      if (m.premio) { const pr = document.createElement("small"); pr.className = "medalla-premio"; const sig = Math.min(nivel, (m.premio.oro || []).length - 1); pr.textContent = "+" + ((m.premio.oro || [])[max ? sig : nivel] || 0) + " " + T.heroeUI.oroCorto + (m.premio.objeto && App.datos.objetos[m.premio.objeto.id] ? " · " + App.datos.objetos[m.premio.objeto.id].nombre : ""); d.appendChild(pr); }
      g.appendChild(d);
    }
    sec.appendChild(g); return sec;
  }

  // ---------- ranking: tu tarjeta arriba, una lista y un selector ----------
  async function vistaRanking(pestana) {
    const T = App.datos.textos;
    pestana = pestana || "semana";
    const periodo = (pestana === "semana" || pestana === "batalla") ? "semana" : pestana === "dia" ? "hoy" : "total", modo = (pestana === "mejor" || pestana === "dia" || pestana === "batalla" || pestana === "barbaros") ? "mejor" : "suma", tipoFiltro = pestana === "dia" ? "dia" : pestana === "batalla" ? "batalla" : pestana === "barbaros" ? "barbaros" : null;
    const r = FWM.guardado.records();
    const cont = document.createElement("div");
    cont.appendChild(cabecera(T.ranking));
    if (!FWM.nube.disponible()) { const aviso = document.createElement("p"); aviso.className = "pista"; aviso.textContent = T.sinConexion; cont.appendChild(aviso); cont.appendChild(marcadorLocal(r)); vista(cont); return; }
    // tu tarjeta (o invitación pequeña)
    const cta = document.createElement("section"); cta.className = "reino-sec perfil-card";
    if (FWM.nube.usuario()) {
      const izq = document.createElement("div"); izq.className = "perfil-izq";
      izq.innerHTML = `<div class="perfil-escalon">${FWM.heroes.nombreNivel(FWM.heroe.nivel())}</div><div class="perfil-nombre">${escapar(FWM.nube.nombre())}</div><div class="suave" id="rk-mio">…</div>`;
      cta.appendChild(izq);
      const der = document.createElement("div"); der.className = "perfil-der"; const fig = figuraHeroe(72, true); fig.style.cursor = "pointer"; fig.addEventListener("click", () => vistaHeroe()); der.appendChild(fig); cta.appendChild(der);
    } else {
      cta.innerHTML = `<p style="margin:0">${T.paraRanking}</p>`;
      const fila = document.createElement("div"); fila.className = "acciones-gestion"; fila.style.border = "0"; fila.style.margin = "4px 0 0";
      fila.appendChild(App.boton(T.crearCuenta, () => vistaCuenta("alta", () => vistaRanking(pestana)), "btn btn-peq btn-primario"));
      fila.appendChild(App.boton(T.entrar, () => vistaCuenta("entrar", () => vistaRanking(pestana)), "btn btn-peq btn-claro"));
      cta.appendChild(fila);
    }
    cont.appendChild(cta);
    // selector
    const sel = document.createElement("div"); sel.className = "glosario-tabs";
    for (const [id, txt] of [["semana", T.rankingSemana], ["total", T.rankingTotal], ["dia", T.rankingDia], ["batalla", T.batalla.ranking], ["barbaros", T.barbaros.ranking], ["mejor", T.rankingMejor], ["duelos", T.duelo.rankingDuelos]]) sel.appendChild(App.boton(txt, () => vistaRanking(id), "btn btn-peq " + (id === pestana ? "btn-primario" : "btn-claro")));
    cont.appendChild(sel);
    if (pestana === "duelos") { vista(cont); seccionDuelos(cont); return; }
    const online = document.createElement("section"); online.className = "reino-sec";
    const pista = document.createElement("p"); pista.className = "pista"; pista.style.margin = "0 0 6px"; pista.textContent = pestana === "dia" ? T.rankingDiaPista : pestana === "batalla" ? T.batalla.rankingPista : pestana === "barbaros" ? T.barbaros.rankingPista : modo === "mejor" ? T.rankingMejorPista : T.rankingSumaPista; online.appendChild(pista);
    const lista = document.createElement("div"); lista.className = "historial"; lista.innerHTML = `<p class="suave">…</p>`; online.appendChild(lista);
    cont.appendChild(online);
    vista(cont);
    try {
      const [filas, mio] = await Promise.all([FWM.nube.ranking(periodo, 50, modo, tipoFiltro), FWM.nube.miRanking(periodo, modo, tipoFiltro)]);
      // el héroe de cada uno (clase, nivel, mejoras, aspecto), para dibujarlo en vez de un soldado genérico
      let perfiles = {}; try { perfiles = await FWM.nube.perfilesDe(filas.map(f => f.usuario)); } catch (e) { perfiles = {}; }
      lista.innerHTML = "";
      let ia = []; try { ia = JSON.parse(localStorage.getItem("fwm.ultimaIA") || "[]"); } catch (e) { /* nada */ }
      const yoId = FWM.nube.usuario() && FWM.nube.usuario().id;
      const miTotal = mio ? Number(mio.puntos) : (filas.find(f => f.usuario === yoId) || {}).puntos;
      const mezcla = filas.map(f => ({ tipo: "jugador", nombre: f.nombre, avatar: f.avatar, perfil: perfiles[f.usuario], puntos: Number(f.puntos), partidas: Number(f.partidas), posicion: Number(f.posicion), yo: f.usuario === yoId }))
        .concat(pestana === "mejor" ? ia.map(j => ({ tipo: "ia", nombre: j.apodo || "IA", bando: j.bando || j.nombre, puntos: j.puntos, personalidad: j.personalidad })) : [])
        .concat(modo === "suma" && pestana === "total" ? FWM.datosBase.heroes.niveles.filter(n => n.puntos).map(n => ({ tipo: "escalon", nombre: n.nombre, puntos: n.puntos })) : [])
        .sort((a, b) => b.puntos - a.puntos || (a.tipo === "jugador" ? -1 : 1));
      if (!filas.length) { const p = document.createElement("p"); p.className = "suave"; p.textContent = T.sinRanking; lista.appendChild(p); }
      for (const m of mezcla) {
        const d = document.createElement("div"); d.className = "rk-" + m.tipo;
        if (m.tipo === "jugador") { d.innerHTML = `<span class="rk-nombre">${m.posicion}. ${m.yo ? "<b>" : ""}${escapar(m.nombre)}${m.yo ? "</b>" : ""} <small class="suave">${m.partidas} ${T.partidas}</small></span><span><b>${m.puntos}</b></span>`; const hp = m.perfil && m.perfil.heroe && typeof m.perfil.heroe === "object" ? Object.assign({ clase: m.avatar || "espadachin" }, m.perfil.heroe, { nivel: m.perfil.nivel || 1 }) : null; const av = hp && FWM.figuras.canvasHeroe ? FWM.figuras.canvasHeroe(hp, m.yo ? "#2f6fd6" : "#8c7a5a", 30, false) : FWM.iconos.canvasTropa(m.avatar || "espadachin", m.yo ? "#2f6fd6" : "#8c7a5a", 26); av.className = "rk-avatar"; d.insertBefore(av, d.firstChild); }
        else if (m.tipo === "ia") d.innerHTML = `<span class="suave">${escapar(m.nombre)} <span class="chip">${T.iaEtiqueta}</span> <small>${escapar(m.bando)} · ${T.personalidades[m.personalidad] || ""}</small></span><span class="suave">${m.puntos}</span>`;
        else d.innerHTML = `<span>★ ${T.escalon}: <b>${m.nombre}</b></span><span>${m.puntos}</span>`;
        if (m.yo) d.style.background = "#e9f3e3";
        lista.appendChild(d);
      }
      const mioEl = cont.querySelector("#rk-mio");
      if (mioEl) mioEl.textContent = mio ? `${T.tuPosicion}: ${mio.posicion} · ${mio.puntos} ${T.puntos.toLowerCase()} · ${mio.partidas} ${T.partidas}` : T.sinPartidas;
      if (mio) FWM.heroe.anotarPuntosNube(periodo === "total" && modo === "suma" ? mio.puntos : 0);
      if (pestana === "mejor" && ia.length) { const n = document.createElement("p"); n.className = "pista"; n.textContent = T.iaUltimaPartida; lista.appendChild(n); }
    } catch (e) { lista.innerHTML = `<p class="error">${FWM.nube.textoError(e, T)}</p>`; }
  }
  function marcadorLocal(r) {
    const T = App.datos.textos; const sec = document.createElement("section"); sec.className = "reino-sec";
    if (!r.partidas) { sec.innerHTML = `<p class="suave">${T.sinPartidas}</p>`; return sec; }
    const mejor = Object.entries(r.mejorVictoria || {}).map(([k, v]) => `${T.tipos[k] || k}: ${v} ${T.turnos}`).join(" · ");
    sec.innerHTML = `<h3>${T.marcador}</h3><p><b>${T.puntos}</b>: ${FWM.guardado.textoPuntos(r, T)}</p><p><b>${T.records}</b>: ${T.partidas} ${r.partidas} · ${T.ganadas} ${r.ganadas} · ${T.racha} ${r.racha} (${T.mejorRacha} ${r.mejorRacha})${mejor ? " · " + T.mejorVictoria + " " + mejor : ""}</p>`;
    return sec;
  }

  // ---------- duelo: Buscar rival grande; jugar con un amigo, pequeño ----------
  function vistaDuelo(op) {
    const T = App.datos.textos;
    const cont = document.createElement("div"); cont.appendChild(cabecera(T.duelo.titulo));
    if (!FWM.nube.usuario()) {
      const p = document.createElement("p"); p.textContent = T.duelo.necesitaCuenta; cont.appendChild(p);
      cont.appendChild(App.boton(T.crearCuentaOEntrar, () => vistaCuenta("alta", vistaDuelo), "btn btn-primario"));
      vista(cont); return;
    }
    const p = document.createElement("p"); p.className = "suave"; p.textContent = T.duelo.explicacion; cont.appendChild(p);
    const estadoP = document.createElement("div"); estadoP.className = "duelo-estado"; estadoP.hidden = true; cont.appendChild(estadoP);
    const botones = document.createElement("div"); botones.className = "inicio-botones"; cont.appendChild(botones);
    const mostrarEstado = (texto, seg, codigo) => {
      estadoP.hidden = false; botones.hidden = true; estadoP.innerHTML = "";
      if (codigo) { const c = document.createElement("div"); c.className = "duelo-codigo"; c.textContent = codigo; estadoP.appendChild(c); }
      const t = document.createElement("p"); t.textContent = texto.replace("{s}", seg == null ? "" : seg); estadoP.appendChild(t);
      if (seg != null) { const g = document.createElement("div"); g.className = "duelo-girando"; estadoP.appendChild(g); }
      estadoP.appendChild(App.boton(T.cancelar, () => { FWM.duelo.cancelarBusqueda(); estadoP.hidden = true; botones.hidden = false; }, "btn btn-peq btn-claro"));
    };
    const empezar = (ses) => {
      estadoP.innerHTML = `<p><b>${T.duelo.rivalEncontrado.replace("{nombre}", escapar(ses.rival.nombre))}</b></p>`;
      estadoP.appendChild(FWM.figuras.canvasHeroe((ses.rival.heroe) || { clase: ses.rival.avatar || "espadachin", nivel: 1 }, "#d63b3b", 64, false));
      setTimeout(() => App.nuevaPartida({ tipo: "duelo", duelo: ses }), 1200);
    };
    botones.appendChild(App.boton(T.duelo.buscarRival, () => { if (!FWM.duelo.buscar(App, mostrarEstado, empezar)) FWM.paneles.aviso(T.duelo.sinRed, 3000); }, "btn btn-primario"));
    // con un amigo: plegado
    const amigo = document.createElement("div"); amigo.className = "duelo-amigo"; amigo.hidden = !(op && op.codigo);
    let igualar = true;
    const chk = document.createElement("label"); chk.className = "duelo-check"; const cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = true; cb.addEventListener("change", () => { igualar = cb.checked; }); chk.appendChild(cb); chk.appendChild(document.createTextNode(" " + T.duelo.igualar)); const chkP = document.createElement("small"); chkP.className = "suave"; chkP.textContent = T.duelo.igualarPista; chk.appendChild(chkP);
    amigo.appendChild(chk); // la opción se ve ANTES de crear el código: si va después, nadie la lee
    amigo.appendChild(App.boton(T.duelo.retar, () => { if (!FWM.duelo.retar(App, null, mostrarEstado, empezar, { igualar })) FWM.paneles.aviso(T.duelo.sinRed, 3000); }, "btn btn-primario"));
    const fila = document.createElement("div"); fila.className = "duelo-codigo-fila";
    const inp = document.createElement("input"); inp.placeholder = T.duelo.codigo; inp.maxLength = 4; inp.autocapitalize = "characters"; inp.className = "duelo-input"; fila.appendChild(inp);
    fila.appendChild(App.boton(T.duelo.entrar, () => { const c = inp.value.trim(); if (c.length < 4) return; if (!FWM.duelo.retar(App, c, mostrarEstado, empezar)) FWM.paneles.aviso(T.duelo.sinRed, 3000); }, "btn btn-claro"));
    const lab = document.createElement("p"); lab.className = "suave"; lab.style.margin = "8px 0 0"; lab.textContent = T.duelo.tengoCodigo; amigo.appendChild(lab); amigo.appendChild(fila);
    const enlace = App.boton(T.duelo.conAmigo + " ▾", () => { amigo.hidden = !amigo.hidden; }, "btn btn-peq btn-claro");
    botones.appendChild(enlace); botones.appendChild(amigo);
    vista(cont);
    if (op && op.codigo) { inp.value = op.codigo; if (!FWM.duelo.retar(App, op.codigo, mostrarEstado, empezar)) FWM.paneles.aviso(T.duelo.sinRed, 3000); }
  }

  // Liga de la semana pasada: si quedé entre los 3 primeros y no lo he reclamado, premio.
  async function reclamarLiga() {
    try {
      const T = App.datos.textos; const perfil = FWM.nube.perfil(); if (!perfil) return;
      const hoy = new Date(); const lunes = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() - ((hoy.getUTCDay() + 6) % 7)));
      const pasada = new Date(lunes.getTime() - 7 * 86400000); const clave = pasada.toISOString().slice(0, 10);
      if (perfil.liga_reclamada === clave) return;
      const filas = await FWM.nube.ligaSemanal(clave, 3);
      const mia = filas.find(f => f.usuario === FWM.nube.usuario().id);
      await FWM.nube.marcarLigaReclamada(clave);
      if (!mia || Number(mia.posicion) > 3 || Number(mia.ganado) <= 0) return;
      const pos = Number(mia.posicion); let premio = "";
      if (pos === 1 && FWM.heroe.darObjeto("mandoble")) premio = App.datos.objetos.mandoble.nombre; else if (pos === 2 && FWM.heroe.darObjeto("egida")) premio = App.datos.objetos.egida.nombre; else { FWM.heroe.darOro(150); premio = "150 " + T.heroeUI.oroCorto; }
      FWM.paneles.aviso(T.duelo.ligaPremio.replace("{pos}", pos).replace("{premio}", premio), 6000); FWM.sonido.fanfarria();
    } catch (e) { /* sin red o sin tabla */ }
  }

  // Pestaña Duelos del ranking: Elo, liga de la semana y mis últimos duelos con revancha.
  async function seccionDuelos(cont) {
    const T = App.datos.textos; const yoId = FWM.nube.usuario() && FWM.nube.usuario().id;
    const sec = document.createElement("section"); sec.className = "reino-sec";
    sec.innerHTML = `<h3>${T.duelo.rankingDuelos} · ${T.duelo.elo}</h3>`;
    const lista = document.createElement("div"); lista.className = "historial"; lista.innerHTML = `<p class="suave">…</p>`; sec.appendChild(lista);
    const secL = document.createElement("section"); secL.className = "reino-sec"; secL.innerHTML = `<h3>${T.duelo.liga}</h3><p class="pista" style="margin:0 0 6px">${T.duelo.ligaPista}</p>`;
    const listaL = document.createElement("div"); listaL.className = "historial"; listaL.innerHTML = `<p class="suave">…</p>`; secL.appendChild(listaL);
    const secH = document.createElement("section"); secH.className = "reino-sec"; secH.innerHTML = `<h3>${T.duelo.historial}</h3>`;
    const listaH = document.createElement("div"); listaH.className = "historial"; listaH.innerHTML = `<p class="suave">…</p>`; secH.appendChild(listaH);
    cont.appendChild(sec); cont.appendChild(secL); if (yoId) cont.appendChild(secH);
    const fila = (m, derecha) => { const d = document.createElement("div"); d.className = "rk-jugador"; if (m.usuario === yoId) d.style.background = "#e9f3e3"; d.innerHTML = `<span class="rk-nombre">${m.posicion}. ${m.usuario === yoId ? "<b>" : ""}${escapar(m.nombre)}${m.usuario === yoId ? "</b>" : ""} <small class="suave">${FWM.heroes.nombreNivel(Number(m.nivel) || 1)}</small></span><span>${derecha}</span>`; const av = FWM.iconos.canvasTropa(m.avatar || "espadachin", m.usuario === yoId ? "#2f6fd6" : "#8c7a5a", 26); av.className = "rk-avatar"; d.insertBefore(av, d.firstChild); return d; };
    try {
      const [rk, liga] = await Promise.all([FWM.nube.rankingDuelos(50), FWM.nube.ligaSemanal(null, 50)]);
      lista.innerHTML = ""; if (!rk.length) lista.innerHTML = `<p class="suave">${T.duelo.sinDuelos}</p>`;
      for (const m of rk) lista.appendChild(fila(m, `<b>${m.elo}</b> <small class="suave">${m.ganados}-${m.perdidos}</small>`));
      listaL.innerHTML = ""; if (!liga.length) listaL.innerHTML = `<p class="suave">${T.duelo.sinDuelos}</p>`;
      for (const m of liga) listaL.appendChild(fila(m, `<b>${Number(m.ganado) > 0 ? "+" : ""}${m.ganado}</b> <small class="suave">${m.duelos}</small>`));
    } catch (e) { lista.innerHTML = `<p class="error">${FWM.nube.textoError(e, T)}</p>`; listaL.innerHTML = ""; }
    if (!yoId) return;
    try {
      const mios = await FWM.nube.misDuelos(20); listaH.innerHTML = ""; if (!mios.length) listaH.innerHTML = `<p class="suave">${T.duelo.sinDuelos}</p>`;
      const marca = {};
      for (const d of mios) { const rivalId = d.anfitrion === yoId ? d.invitado : d.anfitrion; marca[rivalId] = marca[rivalId] || { g: 0, p: 0 }; if (d.ganador === yoId) marca[rivalId].g++; else marca[rivalId].p++; }
      for (const d of mios) {
        const soyAnf = d.anfitrion === yoId; const rival = soyAnf ? d.i : d.a; const rivalId = soyAnf ? d.invitado : d.anfitrion; const gane = d.ganador === yoId;
        const el = document.createElement("div"); el.className = "rk-jugador";
        el.innerHTML = `<span class="rk-nombre"><b class="${gane ? "ok" : "error"}">${gane ? T.duelo.ganaste : T.duelo.perdiste}</b> · ${escapar((rival && rival.nombre) || "?")} <small class="suave">${gane ? "+" : "−"}${d.delta} · ${T.duelo.marca.replace("{nombre}", escapar((rival && rival.nombre) || "?")).replace("{g}", marca[rivalId].g).replace("{p}", marca[rivalId].p)}</small></span>`;
        el.appendChild(App.boton(T.duelo.revancha, async () => {
          vistaDuelo();
          const est = document.querySelector(".duelo-estado"); const bots = document.querySelector(".duelo-estado + .inicio-botones");
          const codigo = FWM.duelo.retar(App, null, (texto, seg, cod) => { if (est) { est.hidden = false; est.innerHTML = `<div class="duelo-codigo">${cod}</div><p>${T.duelo.retoEnviado.replace("{nombre}", escapar((rival && rival.nombre) || ""))}</p>`; est.appendChild(App.boton(T.cancelar, () => { FWM.duelo.cancelarBusqueda(); vistaDuelo(); }, "btn btn-peq btn-claro")); if (bots) bots.hidden = true; } }, (ses) => App.nuevaPartida({ tipo: "duelo", duelo: ses }), { igualar: true });
          if (codigo) { try { await FWM.nube.crearReto(rivalId, codigo); } catch (e) { /* nada */ } }
        }, "btn btn-peq btn-claro"));
        listaH.appendChild(el);
      }
    } catch (e) { listaH.innerHTML = `<p class="error">${FWM.nube.textoError(e, T)}</p>`; }
  }

  // ---------- cuenta ----------
  function vistaCuenta(modo, despues) {
    const T = App.datos.textos;
    modo = modo || (FWM.nube.usuario() ? "dentro" : "alta");
    const aj = FWM.guardado.ajustes();
    const cont = document.createElement("div");
    cont.appendChild(cabecera(T.cuenta, despues || vistaPrincipal));
    if (!FWM.nube.disponible()) { const p = document.createElement("p"); p.className = "pista"; p.textContent = FWM.nube.posible() ? T.nubeCargando : T.sinConexion; cont.appendChild(p); if (FWM.nube.posible()) setTimeout(() => { if (FWM.nube.disponible()) vistaCuenta(modo, despues); }, 1500); vista(cont); return; }
    if (FWM.nube.usuario()) {
      cont.innerHTML += `<p>${T.conectadoComo} <b>${escapar(FWM.nube.nombre())}</b></p>`;
      cont.appendChild(App.boton(T.salir, async () => { await FWM.nube.salir(); vistaPrincipal(); }, "btn btn-peq btn-claro"));
      vista(cont); return;
    }
    const f = document.createElement("div");
    f.innerHTML = `<p class="suave">${T.paraRanking}</p>
      ${modo === "alta" ? `<div class="campo"><label>${T.nombreJugador}</label><input id="cu-nombre" maxlength="20" value="${escapar(aj.nombre)}"></div>` : ""}
      <div class="campo"><label>${T.correo}</label><input id="cu-correo" type="email" autocomplete="email"></div>
      <div class="campo"><label>${T.clave}</label><input id="cu-clave" type="password" autocomplete="${modo === "alta" ? "new-password" : "current-password"}"></div>
      <p class="error" id="cu-error"></p>`;
    cont.appendChild(f);
    const $ = (id) => f.querySelector("#" + id);
    const fila = document.createElement("div"); fila.className = "modal-botones";
    const principal = App.boton(modo === "alta" ? T.crearCuenta : T.entrar, async () => {
      $("cu-error").textContent = ""; principal.disabled = true; principal.textContent = "…";
      try {
        const correo = $("cu-correo").value.trim(), clave = $("cu-clave").value;
        if (modo === "alta") {
          const nombre = $("cu-nombre").value.trim();
          if (nombre.length < 2 || nombre.length > 20) throw new Error(T.errNombre);
          FWM.guardado.guardarAjustes({ nombre });
          await FWM.nube.registrar(correo, clave, nombre);
          FWM.nube.evento && FWM.nube.evento("cuenta");
        } else await FWM.nube.entrar(correo, clave);
        try { await FWM.nube.guardarHeroe(FWM.heroe.leer()); } catch (e) { /* nada */ }
        FWM.sonido.fanfarria();
        (despues || vistaPrincipal)();
      } catch (e) { $("cu-error").textContent = FWM.nube.textoError(e, T); principal.disabled = false; principal.textContent = modo === "alta" ? T.crearCuenta : T.entrar; }
    }, "btn btn-primario");
    fila.appendChild(App.boton(T.seguirSinCuenta, despues || vistaPrincipal, "btn btn-claro"));
    fila.appendChild(principal);
    cont.appendChild(fila);
    if (modo === "alta") { // aceptar condiciones y privacidad al crear la cuenta
      const L = App.datos.legal || FWM.datosBase.legal;
      const av = document.createElement("p"); av.className = "pista";
      const partes = T.aceptasAlCrear.split(/\{condiciones\}|\{privacidad\}/);
      av.appendChild(document.createTextNode(partes[0]));
      const a1 = document.createElement("a"); a1.href = "#"; a1.textContent = L.condiciones.titulo.toLowerCase(); a1.addEventListener("click", (e) => { e.preventDefault(); vistaLegal("condiciones", () => vistaCuenta(modo, despues)); }); av.appendChild(a1);
      av.appendChild(document.createTextNode(partes[1] || " y la "));
      const a2 = document.createElement("a"); a2.href = "#"; a2.textContent = L.privacidad.titulo.toLowerCase(); a2.addEventListener("click", (e) => { e.preventDefault(); vistaLegal("privacidad", () => vistaCuenta(modo, despues)); }); av.appendChild(a2);
      av.appendChild(document.createTextNode(partes[2] || "."));
      cont.appendChild(av);
    }
    const alt = document.createElement("p"); alt.style.textAlign = "center";
    alt.appendChild(App.boton(modo === "alta" ? T.yaTengoCuenta : T.noTengoCuenta, () => vistaCuenta(modo === "alta" ? "entrar" : "alta", despues), "btn btn-peq btn-claro"));
    if (modo === "entrar") alt.appendChild(App.boton(T.olvideClave, async () => { try { await FWM.nube.recuperar($("cu-correo").value.trim()); $("cu-error").textContent = T.claveEnviada; } catch (e) { $("cu-error").textContent = FWM.nube.textoError(e, T); } }, "btn btn-peq btn-claro"));
    cont.appendChild(alt);
    vista(cont);
  }

  // ---------- ajustes (con la cuenta dentro) ----------
  function vistaAjustes() {
    const T = App.datos.textos;
    const aj = FWM.guardado.ajustes();
    const cont = document.createElement("div");
    cont.appendChild(cabecera(T.ajustes));
    const bandos = Object.entries(App.datos.bandos).map(([id, b]) => `<option value="${id}" ${aj.bando === id ? "selected" : ""}>${b.nombre}</option>`).join("");
    const f = document.createElement("div");
    f.innerHTML = `
      <div class="campo"><label>${T.nombreJugador}</label><input id="aj-nombre" maxlength="20" value="${(aj.nombre || "").replace(/"/g, "&quot;")}" placeholder="…"></div>
      <div class="campo"><label>${T.bandoFavorito}</label><select id="aj-bando"><option value="aleatorio" ${aj.bando === "aleatorio" ? "selected" : ""}>${T.bandoAleatorio}</option>${bandos}</select></div>
      <div class="campo"><label>${T.musica}</label><select id="aj-musica"><option value="on" ${FWM.musica.activa() ? "selected" : ""}>${T.sonidoOn}</option><option value="off" ${FWM.musica.activa() ? "" : "selected"}>${T.sonidoOff}</option></select></div>
      <div class="campo"><label>${T.idioma}</label><select id="aj-idioma">${FWM.idioma.disponibles().map(i => `<option value="${i}" ${FWM.idioma.actual() === i ? "selected" : ""}>${FWM.idioma.nombre(i)}</option>`).join("")}</select></div>
      <div class="campo"><label>${T.paleta}</label><select id="aj-paleta"><option value="normal" ${aj.paleta !== "daltonicos" ? "selected" : ""}>${T.paletaNormal}</option><option value="daltonicos" ${aj.paleta === "daltonicos" ? "selected" : ""}>${T.paletaDaltonicos}</option></select></div>
      <p class="pista">${T.paletaPista}</p>
      <div class="campo"><label>${T.sonido}</label><select id="aj-sonido"><option value="on" ${FWM.sonido.activo() ? "selected" : ""}>${T.sonidoOn}</option><option value="off" ${FWM.sonido.activo() ? "" : "selected"}>${T.sonidoOff}</option></select></div>`;
    cont.appendChild(f);
    const $ = (id) => f.querySelector("#" + id);
    $("aj-nombre").addEventListener("input", () => FWM.guardado.guardarAjustes({ nombre: $("aj-nombre").value.trim() }));
    $("aj-nombre").addEventListener("change", () => { const n = $("aj-nombre").value.trim(); if (FWM.nube.usuario() && n.length >= 2) FWM.nube.cambiarNombre(n).catch(() => {}); });
    $("aj-bando").addEventListener("change", () => FWM.guardado.guardarAjustes({ bando: $("aj-bando").value }));
    $("aj-sonido").addEventListener("change", () => { FWM.sonido.alternar($("aj-sonido").value === "on"); if (FWM.sonido.activo()) FWM.sonido.pop(); });
    $("aj-musica").addEventListener("change", () => FWM.musica.alternar($("aj-musica").value === "on"));
    $("aj-paleta").addEventListener("change", () => { FWM.guardado.guardarAjustes({ paleta: $("aj-paleta").value }); App.aplicarPaleta(); });
    // cambiar de idioma recarga la página: es lo más seguro (los textos están repartidos por todas las pantallas)
    $("aj-idioma").addEventListener("change", () => { if (FWM.idioma.poner($("aj-idioma").value)) { App.guardar(); location.reload(); } });
    // legal y versión
    {
      const L = App.datos.legal || FWM.datosBase.legal;
      const sec = document.createElement("section"); sec.className = "reino-sec"; sec.innerHTML = `<h3>${T.legal}</h3>`;
      const fl = document.createElement("div"); fl.className = "acciones-gestion"; fl.style.border = "0"; fl.style.margin = "0";
      fl.appendChild(App.boton(T.verPrivacidad, () => vistaLegal("privacidad"), "btn btn-peq btn-claro"));
      fl.appendChild(App.boton(T.verCondiciones, () => vistaLegal("condiciones"), "btn btn-peq btn-claro"));
      sec.appendChild(fl);
      const v = document.createElement("p"); v.className = "pista"; v.style.margin = "6px 0 0"; v.textContent = `${T.version} ${FWM.VERSION} · ${L.titular}`; sec.appendChild(v);
      cont.appendChild(sec);
    }
    // cuenta
    if (FWM.nube.posible()) {
      const sec = document.createElement("section"); sec.className = "reino-sec"; sec.innerHTML = `<h3>${T.cuenta}</h3>`;
      if (FWM.nube.usuario()) {
        const p = document.createElement("p"); p.innerHTML = `${T.conectadoComo} <b>${escapar(FWM.nube.nombre())}</b> `;
        p.appendChild(App.boton(T.salir, async () => { await FWM.nube.salir(); vistaAjustes(); }, "btn btn-peq btn-claro")); sec.appendChild(p);
        // baja de la cuenta: obligatorio para las tiendas y para el reglamento de datos
        const av = document.createElement("p"); av.className = "pista"; av.textContent = T.borrarCuentaAviso; sec.appendChild(av);
        const bBorrar = App.boton(T.borrarCuenta, () => {
          App.confirmar(T.borrarCuentaConfirmar, async () => {
            bBorrar.disabled = true; bBorrar.textContent = "…";
            try { await FWM.nube.borrarCuenta(); FWM.paneles.aviso(T.borrarCuentaHecho, 5000); vistaPrincipal(); }
            catch (e) { const L = App.datos.legal || FWM.datosBase.legal; FWM.paneles.aviso(T.borrarCuentaError.replace("{contacto}", L.contacto), 8000); bBorrar.disabled = false; bBorrar.textContent = T.borrarCuenta; }
          });
        }, "btn btn-peq btn-peligro");
        sec.appendChild(bBorrar);
      }
      else { const p = document.createElement("p"); p.className = "suave"; p.textContent = T.paraRanking + " "; p.appendChild(App.boton(T.crearCuentaOEntrar, () => vistaCuenta("alta", vistaAjustes), "btn btn-peq btn-primario")); sec.appendChild(p); }
      cont.appendChild(sec);
    }
    const yaInstalada = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    if (!yaInstalada && /iPhone|iPad/.test(navigator.userAgent) && !window.__instalar) { const p = document.createElement("p"); p.className = "pista"; p.textContent = T.instalarIos; cont.appendChild(p); }
    const cr = document.createElement("p"); cr.className = "pista"; cr.innerHTML = `<b>${T.creditos}</b>: ${T.creditoMusica}`; cont.appendChild(cr);
    vista(cont);
  }

  // ---------- desfile de figuras bajo el título ----------
  function arrancarDesfile() {
    const canvas = document.getElementById("inicio-desfile");
    const tipos = ["campesino", "lancero", "espadachin", "arquero", "caballero", "catapulta"];
    const colores = ["#2f6fd6", "#d63b3b", "#2e9e4f", "#d6a92e", "#8e3bd6"];
    const ancho = canvas.getBoundingClientRect().width || 500;
    figuras = tipos.map((tipo, i) => ({ tipo, x: 30 + i * (ancho / tipos.length), v: 22 + (i % 3) * 5, color: colores[i % colores.length], fase: Math.random() * 6 }));
    animando = true;
    let ultimo = performance.now();
    const paso = (ahora) => {
      if (!animando) return;
      const dt = Math.min(0.05, (ahora - ultimo) / 1000); ultimo = ahora;
      const r = canvas.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(r.width * dpr)) { canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); }
      const ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, r.width, r.height);
      const suelo = r.height * .62;
      for (const f of figuras) {
        f.x += f.v * dt; f.fase += dt * 8;
        if (f.x > r.width + 60) f.x = -70;
        const bote = Math.abs(Math.sin(f.fase)) * 3;
        (FWM.figuras[f.tipo] || FWM.figuras.campesino)(ctx, f.x, suelo - 6 - bote, 26, { color: f.color, enemigo: false });
      }
      requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }

  return { mostrar, ocultar, visible, refrescar, vistaCuenta, vistaRanking, vistaHeroe, vistaDuelo, vistaBienvenida, vistaCampana, vistaBatalla, vistaEscenarios, vistaBarbaros };
})();
