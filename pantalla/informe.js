// Botón flotante para informar (29 sep 2026, Rodrigo): abajo a la izquierda, en TODAS las pantallas (menús, partidas,
// ventanas), se puede arrastrar. Al tocarlo hace una captura de la pantalla tal como está y abre una ventana para
// contar qué pasa ("Algo falla" / "Tengo una idea"). Va a la tabla public.reportes con la captura, la partida y dónde
// estabas; se leen con herramientas/reportes.sh. Es para la fase de pruebas: al lanzar, FLOTANTE = false.
window.FWM = window.FWM || {};

FWM.informe = (function () {
  const FLOTANTE = true;
  const CLAVE_POS = "fwm.informe.pos";
  const LIB = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
  let boton = null, abierto = false;

  // App se declara con const en app.js: no cuelga de window, se pide por su nombre
  const A = () => (typeof App !== "undefined" ? App : null);
  const T = () => (A() && A().datos && A().datos.textos) || {};
  const TR = () => T().reporte || {};

  // ---------- el botón ----------
  function crearBoton() {
    if (!FLOTANTE || boton) return;
    boton = document.createElement("button");
    boton.id = "boton-informe"; boton.type = "button";
    boton.setAttribute("aria-label", TR().titulo || "Informar");
    boton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5 H20 V16 H11 L6 20 V16 H4 Z"/><path d="M12 8 V11.5 M12 13.6 V13.7"/></svg>`;
    document.body.appendChild(boton);
    colocar(leerPos());
    arrastrable();
    const recolocar = () => { if (boton && !boton.classList.contains("moviendo")) colocar(leerPos()); };
    window.addEventListener("resize", recolocar);
    window.addEventListener("orientationchange", recolocar);
    document.addEventListener("visibilitychange", recolocar);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", recolocar);
    // por si algo lo saca del documento o lo deja fuera de la pantalla: se comprueba cada pocos segundos
    setInterval(() => { if (!boton) return; if (!boton.isConnected) document.body.appendChild(boton); boton.style.visibility = ""; const r = boton.getBoundingClientRect(); if (r.right < 8 || r.bottom < 8 || r.left > window.innerWidth - 8 || r.top > window.innerHeight - 8) recolocar(); }, 4000);
  }
  function leerPos() { try { return JSON.parse(localStorage.getItem(CLAVE_POS) || "null"); } catch (e) { return null; } }
  function guardarPos(p) { try { localStorage.setItem(CLAVE_POS, JSON.stringify(p)); } catch (e) { /* nada */ } }
  // la posición se guarda en proporción a la pantalla, así sigue en su sitio al girar el móvil
  function colocar(p) {
    const w = boton.offsetWidth || 48, h = boton.offsetHeight || 48;
    const x = p ? p.x * window.innerWidth : 12, y = p ? p.y * window.innerHeight : window.innerHeight - h - 90;
    boton.style.left = Math.max(4, Math.min(window.innerWidth - w - 4, x)) + "px";
    boton.style.top = Math.max(4, Math.min(window.innerHeight - h - 4, y)) + "px";
  }
  // arrastrar: si el dedo se mueve más de 12 px es mover el botón, si no es un toque
  function arrastrable() {
    let ini = null, movido = false;
    boton.addEventListener("pointerdown", (e) => { ini = { x: e.clientX, y: e.clientY, l: boton.offsetLeft, t: boton.offsetTop }; movido = false; boton.setPointerCapture(e.pointerId); e.stopPropagation(); });
    boton.addEventListener("pointermove", (e) => {
      if (!ini) return;
      const dx = e.clientX - ini.x, dy = e.clientY - ini.y;
      if (!movido && Math.hypot(dx, dy) < 12) return; // un dedo tiembla: con 6 px muchos toques contaban como arrastrar y no abrían nada
      movido = true; boton.classList.add("moviendo");
      colocarPx(ini.l + dx, ini.t + dy);
    });
    const soltar = (e) => {
      if (!ini) return; ini = null; boton.classList.remove("moviendo");
      if (movido) guardarPos({ x: boton.offsetLeft / window.innerWidth, y: boton.offsetTop / window.innerHeight });
      else pulsado();
      e.stopPropagation();
    };
    boton.addEventListener("pointerup", soltar);
    boton.addEventListener("pointercancel", () => { ini = null; boton.classList.remove("moviendo"); });
    boton.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); }); // el toque ya se trató en pointerup
  }
  function colocarPx(x, y) {
    const w = boton.offsetWidth, h = boton.offsetHeight;
    boton.style.left = Math.max(4, Math.min(window.innerWidth - w - 4, x)) + "px";
    boton.style.top = Math.max(4, Math.min(window.innerHeight - h - 4, y)) + "px";
  }

  // ---------- la captura ----------
  function cargarLib() {
    if (window.html2canvas) return Promise.resolve();
    return new Promise((ok, mal) => { const s = document.createElement("script"); s.src = LIB; s.onload = ok; s.onerror = mal; document.head.appendChild(s); });
  }
  // La pantalla tal como se ve (sin el botón), reducida a unos 720 px de ancho, en JPEG. null si no se puede.
  // 30 sep 2026 (aviso de Rodrigo: "el botón desaparece cuando lo uso varias veces"): antes el botón se escondía
  // mientras se hacía la captura y, si la captura se quedaba colgada (en el iPhone pasa a la tercera o cuarta: se acaba
  // la memoria para lienzos), ya no volvía. Ahora NO se esconde (la captura lo salta sola), la captura tiene un tope
  // de tiempo y, pase lo que pase, la ventana se abre (sin captura si hace falta).
  function capturar() {
    const tope = new Promise((ok) => setTimeout(() => ok(null), 7000));
    return Promise.race([capturarDeVerdad(), tope]).catch(() => null);
  }
  async function capturarDeVerdad() {
    try {
      await cargarLib();
      const escala = Math.min(1, 720 / window.innerWidth);
      // El menú baja con su propio rodillo (#inicio) y html2canvas solo pinta bien lo que cabe sin bajar: en la copia se
      // sube la caja lo bajado y la barra de abajo se deja fija donde se ve (29 sep 2026: salía media captura en blanco)
      const capa = document.getElementById("inicio"); const bajado = capa && !capa.hidden ? capa.scrollTop : 0;
      const navReal = document.getElementById("inicio-nav"); const rNav = navReal && !navReal.hidden ? navReal.getBoundingClientRect() : null;
      const onclone = (doc) => {
        const ci = doc.getElementById("inicio"), caja = doc.getElementById("inicio-caja"), nav = doc.getElementById("inicio-nav");
        if (ci && bajado) { ci.scrollTop = 0; ci.style.overflow = "hidden"; if (caja) caja.style.marginTop = (-bajado) + "px"; }
        if (nav && rNav) Object.assign(nav.style, { position: "fixed", left: rNav.left + "px", top: rNav.top + "px", width: rNav.width + "px", bottom: "auto", margin: "0" });
      };
      const c = await window.html2canvas(document.body, { onclone, scale: escala, logging: false, useCORS: true, backgroundColor: "#2b2620",
        x: window.scrollX, y: window.scrollY, width: window.innerWidth, height: window.innerHeight, windowWidth: window.innerWidth, windowHeight: window.innerHeight,
        ignoreElements: (el) => el.id === "boton-informe" || el.id === "informe-capa" });
      let url = c.toDataURL("image/jpeg", .6);
      if (url.length > 850000) url = c.toDataURL("image/jpeg", .35);
      c.width = c.height = 0; // suelta la memoria del lienzo: el iPhone tiene un tope y a la cuarta captura fallaba
      return url.length > 850000 ? null : url;
    } catch (e) { return null; }
  }

  // ---------- la ventana ----------
  async function pulsado() {
    if (abierto) return; abierto = true;
    boton.classList.add("ocupado");
    let captura = null;
    try { captura = await capturar(); } catch (e) { captura = null; }
    boton.classList.remove("ocupado");
    try { abrir("problema", captura); } catch (e) { abierto = false; }
  }
  // Se puede abrir también desde el menú ("Informar de un problema o sugerencia"): entonces también captura.
  async function desdeMenu(tipo) {
    if (abierto) return; abierto = true;
    let captura = null; try { captura = await capturar(); } catch (e) { captura = null; }
    try { abrir(tipo || "problema", captura); } catch (e) { abierto = false; }
  }

  function abrir(tipoInicial, captura) {
    abierto = true;
    const tr = TR(); let tipo = tipoInicial || "problema";
    const capa = document.createElement("div"); capa.id = "informe-capa";
    capa.innerHTML = `<div class="informe-caja" role="dialog" aria-modal="true" aria-label="${tr.titulo || ""}">
      <h2>${tr.titulo || ""}</h2>
      ${captura ? `<img class="informe-captura" alt="" src="${captura}"><p class="pista informe-nota-captura">${tr.conCaptura || ""}</p>` : `<p class="pista">${tr.sinCaptura || ""}</p>`}
      <div class="reporte-tipos"><button type="button" class="btn btn-peq" data-t="problema">🐞 ${tr.problema || ""}</button><button type="button" class="btn btn-peq" data-t="sugerencia">💡 ${tr.sugerencia || ""}</button></div>
      <textarea class="reporte-texto" maxlength="2000" rows="4"></textarea>
      <p class="pista reporte-nota"></p>
      <div class="modal-botones"><button type="button" class="btn btn-primario" data-accion="enviar">${tr.enviar || "OK"}</button><button type="button" class="btn btn-claro" data-accion="cancelar">${T().cancelar || "×"}</button></div>
    </div>`;
    // nada de lo que se toca aquí dentro llega al juego de debajo
    for (const ev of ["pointerdown", "pointerup", "click", "keydown", "wheel", "touchstart"]) capa.addEventListener(ev, (e) => e.stopPropagation());
    document.body.appendChild(capa);
    const ta = capa.querySelector("textarea"), nota = capa.querySelector(".reporte-nota"), enviar = capa.querySelector('[data-accion="enviar"]');
    const hayPartida = () => !!(A() && A().estado && !(FWM.inicio && FWM.inicio.visible && FWM.inicio.visible()));
    const pintar = () => {
      capa.querySelectorAll("[data-t]").forEach(b => b.className = "btn btn-peq " + (b.dataset.t === tipo ? "btn-primario" : "btn-claro"));
      ta.placeholder = tipo === "problema" ? tr.queHaPasado : tr.queMejorarias;
      nota.textContent = tipo === "problema" && hayPartida() ? tr.conPartida : "";
    };
    capa.querySelectorAll("[data-t]").forEach(b => b.addEventListener("click", () => { tipo = b.dataset.t; pintar(); }));
    pintar();
    const cerrar = () => { capa.remove(); abierto = false; };
    capa.querySelector('[data-accion="cancelar"]').addEventListener("click", cerrar);
    capa.addEventListener("click", (e) => { if (e.target === capa) cerrar(); });
    enviar.addEventListener("click", async () => {
      const texto = ta.value.trim();
      if (!texto) { FWM.paneles.aviso(tr.vacio, 2200); ta.focus(); return; }
      enviar.disabled = true;
      const r = await mandar(tipo, texto, captura, hayPartida());
      cerrar(); FWM.paneles.aviso(r === "enviado" ? tr.gracias : tr.guardado, 3500);
    });
    setTimeout(() => ta.focus(), 50);
  }

  // Lo que se manda: el texto, la captura, dónde estabas y, en un problema dentro de una partida, la partida entera.
  async function mandar(tipo, texto, captura, conPartida) {
    const App_ = A() || {}; const e = App_.estado, o = App_.opciones || {};
    let partida = null;
    if (tipo === "problema" && conPartida && e) {
      try { partida = JSON.parse(JSON.stringify(e)); if (partida.registro && partida.registro.length > 150) partida.registro = partida.registro.slice(-150); if (JSON.stringify(partida).length > 1400000) partida = null; } catch (er) { partida = null; }
    }
    const enInicio = !!(FWM.inicio && FWM.inicio.visible && FWM.inicio.visible());
    const titulo = enInicio ? (document.querySelector("#inicio-vista h2") || {}).textContent || "inicio" : null;
    const contexto = { pantalla: enInicio ? "inicio" : "partida", vista: titulo, desdeBoton: true, ancho: window.innerWidth, alto: window.innerHeight,
      tipoPartida: o.tipo || null, campana: o.campana || null, capitulo: o.capitulo || null, batalla: o.batalla || null, turno: e ? e.turno : null,
      faccion: FWM.heroe && FWM.heroe.faccion ? FWM.heroe.faccion() : null, registro: (App_.registro || []).slice(-30) };
    try { contexto.cache = window.caches ? (await caches.keys()).join(",") : null; } catch (er) { /* nada */ }
    return FWM.nube.reportar({ tipo, texto, version: FWM.VERSION || null, idioma: FWM.idioma && FWM.idioma.actual ? FWM.idioma.actual() : null,
      movil: (navigator.userAgent || "").slice(0, 300), contexto, partida, captura: captura || null });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", crearBoton); else crearBoton();
  return { abrir: desdeMenu, capturar, FLOTANTE };
})();
