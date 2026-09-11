// Música: pistas grabadas. Dos escenas:
//   "inicio"  : el tema de taberna de la pantalla de inicio (musica/inicio.m4a).
//   "partida" : tres piezas que se van alternando al azar.
// Si un fichero no carga, hay SILENCIO. Antes había un laúd sintetizado de respaldo (Web Audio): sonaba
// a pitidos, aparecía solo cuando algo fallaba y era imposible de rastrear. Fuera (8 sep 2026).
// El jugador puede silenciarla en cualquier momento con el botón de la barra o desde Ajustes (fwm.musica).
window.FWM = window.FWM || {};

FWM.musica = (function () {
  const CLAVE = "fwm.musica";
  let activa = true;
  try { activa = localStorage.getItem(CLAVE) !== "off"; } catch (e) { /* nada */ }
  let sonando = false, volumenObjetivo = .5;
  let escena = "inicio";

  // Ficheros por escena. La partida tiene tres piezas: al acabar una entra otra al azar (nunca la misma
  // seguida), para que una partida larga no repita siempre lo mismo. El menú siempre suena igual (6 sep 2026).
  const FICHERO = { inicio: ["musica/inicio.m4a"], partida: ["musica/village-ambiance.m4a", "musica/might-magic.m4a", "musica/medieval-chateau.m4a"] };
  const pistas = {}, fallo = {}, fundido = {};
  // Todos los <audio> que se han llegado a crear. Hace falta la lista aparte porque cuando una pista da
  // error se soltaba su referencia (`pistas[x] = null`) sin pausarla: el elemento seguía sonando y ya no
  // había forma de callarlo desde el juego, ni con el botón de silencio (8 sep 2026).
  const todos = [];
  function pausarTodos() {
    for (const a of todos) { try { a.pause(); a.volume = 0; } catch (e) { /* nada */ } }
    for (const k of Object.keys(fundido)) { clearInterval(fundido[k]); fundido[k] = null; }
  }
  // Solo los sueltos: los que ya no son la pista de ninguna escena. Así parar() no puede cargarse por
  // error la pista que se acaba de arrancar al cambiar de pantalla.
  function pausarHuerfanos() {
    const vivos = new Set(Object.values(pistas).filter(Boolean));
    for (const a of todos) if (!vivos.has(a)) { try { a.pause(); a.volume = 0; } catch (e) { /* nada */ } }
  }
  let cualPista = {}; // escena -> índice de la pieza que suena ahora
  function elegirPieza(cual) {
    const lista = FICHERO[cual] || []; if (lista.length <= 1) return 0;
    let i; do { i = Math.floor(Math.random() * lista.length); } while (i === cualPista[cual] && lista.length > 1);
    return i;
  }
  // Sube o baja el volumen de una pista. Un solo desvanecido por pista: el nuevo cancela al anterior.
  // (6 sep 2026: sin esto, al ir del menú a la partida y volver, el desvanecido viejo pausaba la pista
  //  recién arrancada y el menú se quedaba en silencio.)
  function fundir(cual, destino, alAcabar) {
    const a = pistas[cual]; if (!a) return;
    clearInterval(fundido[cual]);
    fundido[cual] = setInterval(() => {
      const v = a.volume;
      const nuevo = v < destino ? Math.min(destino, v + .06) : Math.max(destino, v - .08);
      a.volume = nuevo;
      if (Math.abs(nuevo - destino) < .001) { clearInterval(fundido[cual]); fundido[cual] = null; if (alAcabar) alAcabar(); }
    }, 70);
  }
  // Reintenta al primer toque o tecla del jugador (los navegadores solo dejan sonar después de eso).
  let esperando = false;
  function esperarToque() {
    if (esperando || typeof document === "undefined") return;
    esperando = true;
    const otraVez = () => {
      esperando = false;
      document.removeEventListener("pointerdown", otraVez, true);
      document.removeEventListener("keydown", otraVez, true);
      if (activa) { sonando = false; empezar(escena); }
    };
    document.addEventListener("pointerdown", otraVez, true);
    document.addEventListener("keydown", otraVez, true);
  }

  function empezarPista() {
    if (fallo[escena]) return false;
    const cual = escena; const lista = FICHERO[cual] || []; if (!lista.length) return false;
    if (cualPista[cual] == null) cualPista[cual] = elegirPieza(cual);
    if (!pistas[cual]) {
      const a = new Audio(lista[cualPista[cual]]); a.loop = lista.length === 1; a.volume = 0; a.preload = "auto"; a.muted = !activa;
      todos.push(a);
      a.addEventListener("error", () => {
        fallo[cual] = true;
        try { a.pause(); a.volume = 0; } catch (e) { /* nada */ } // callarla antes de soltarla
        pistas[cual] = null;
        if (activa && sonando && escena === cual) { sonando = false; empezar(cual); }
      });
      // varias piezas: al acabar una entra otra distinta, sin cortes
      a.addEventListener("ended", () => {
        if (!activa || escena !== cual) return;
        cualPista[cual] = elegirPieza(cual);
        a.src = (FICHERO[cual] || [])[cualPista[cual]]; a.currentTime = 0;
        const pp = a.play(); if (pp && pp.catch) pp.catch(() => {});
      });
      pistas[cual] = a;
    }
    clearInterval(fundido[cual]); fundido[cual] = null;
    // corta en seco la música de las otras pantallas: si se dejaban desvanecer, durante medio segundo
    // sonaban las dos a la vez al entrar en la partida (6 sep 2026)
    for (const k of Object.keys(pistas)) {
      if (k === cual || !pistas[k]) continue;
      clearInterval(fundido[k]); fundido[k] = null;
      pistas[k].pause(); pistas[k].volume = 0;
    }
    // al volver a entrar en la escena, si hay varias piezas se pone otra: así no empieza siempre igual
    if (lista.length > 1 && pistas[cual].paused) {
      cualPista[cual] = elegirPieza(cual);
      if (pistas[cual].getAttribute("src") !== lista[cualPista[cual]]) { pistas[cual].src = lista[cualPista[cual]]; pistas[cual].currentTime = 0; }
    }
    const p = pistas[cual].play();
    // Si el navegador no deja sonar todavía (hace falta que el jugador toque algo primero), NO es un
    // fallo de la pista: se espera al primer toque y se reintenta. Antes se marcaba como rota para
    // siempre y el menú se quedaba mudo (o caía en el laúd sintetizado) toda la sesión (8 sep 2026).
    if (p && p.catch) p.catch((err) => {
      if (err && (err.name === "NotAllowedError" || err.name === "AbortError")) { esperarToque(); return; }
      fallo[cual] = true;
      try { if (pistas[cual]) { pistas[cual].pause(); pistas[cual].volume = 0; } } catch (e) { /* nada */ }
      pistas[cual] = null;
      if (activa && escena === cual) { sonando = false; empezar(cual); }
    });
    fundir(cual, volumenObjetivo);
    mandarYo(); anunciar();
    return true;
  }
  function pararPista(cual) {
    const a = pistas[cual]; if (!a || a.paused) return;
    fundir(cual, 0, () => { if (pistas[cual]) pistas[cual].pause(); });
  }

  // empezar("inicio" | "partida"): cambia de pieza si hace falta. Sin argumento, sigue con la de ahora.
  function empezar(cual) {
    cual = cual || escena;
    if (!activa) { escena = cual; return; }
    if (sonando && cual === escena) return;
    if (sonando && cual !== escena) parar();
    escena = cual;
    volumenObjetivo = (cual === "partida" ? .24 : .5);
    sonando = true;
    if (empezarPista()) return;
    sonando = false; // el fichero no está o no carga: silencio, y ya está
  }
  function parar() {
    sonando = false;
    for (const k of Object.keys(pistas)) pararPista(k);
    pausarHuerfanos(); // los <audio> que ya no están en `pistas` y que si no, nadie podría callar
  }
  // Volumen relativo (1 = el de la escena).
  function volumen(v) {
    volumenObjetivo = (escena === "partida" ? .24 : .5) * v;
    const a = pistas[escena]; if (a) a.volume = volumenObjetivo;
  }
  function alternar(on) {
    activa = on == null ? !activa : !!on;
    try { localStorage.setItem(CLAVE, activa ? "on" : "off"); } catch (e) { /* nada */ }
    // silencio a prueba de todo: además de pausar, se marcan como silenciadas. Así, si algo vuelve a
    // arrancarlas (el relevo de pieza, una reconexión), no suena nada mientras el jugador quiera silencio.
    for (const a of todos) { try { a.muted = !activa; } catch (e) { /* nada */ } }
    if (!activa) pausarTodos();
    if (activa) empezar(escena); else parar();
    if (FWM.paneles && FWM.paneles.pintarBotonMusica) FWM.paneles.pintarBotonMusica();
    return activa;
  }

  // ---------- una sola ventana suena a la vez ----------
  // Si el juego está abierto en dos sitios (dos pestañas, o además la versión instalada), cada uno tenía
  // su propia música y se oía la de una ventana que ya no se ve. Ahora la última ventana que se mira
  // avisa por un canal común y las demás se callan (7 sep 2026).
  const YO = Math.random().toString(36).slice(2);
  let canal = null;
  try { canal = new BroadcastChannel("fwm-musica"); } catch (e) { canal = null; }
  if (canal) canal.onmessage = (ev) => { if (ev.data && ev.data.manda && ev.data.id !== YO) dormir(); };
  function mandarYo() { if (canal) try { canal.postMessage({ manda: true, id: YO }); } catch (e) { /* nada */ } }

  // El control de música del ordenador (y del móvil) enseña quién está sonando: así se puede
  // reconocer y parar desde fuera aunque no se encuentre la ventana.
  function anunciar() {
    const ms = typeof navigator !== "undefined" && navigator.mediaSession;
    if (!ms || typeof MediaMetadata === "undefined") return;
    try {
      ms.metadata = new MediaMetadata({ title: escena === "partida" ? "Música de partida" : "Final War: Medieval", artist: "Final War: Medieval", album: "Alexander Nakarada (CC BY 4.0)" });
      ms.setActionHandler("pause", () => alternar(false));
      ms.setActionHandler("play", () => alternar(true));
      ms.setActionHandler("stop", () => alternar(false));
    } catch (e) { /* nada */ }
  }

  // ---------- callar cuando el juego no está a la vista ----------
  // Al cambiar de ventana, minimizar, bloquear el móvil o cerrar la pestaña (algunos navegadores la
  // guardan viva un rato en vez de tirarla), la música seguía sonando de fondo. Ahora se pausa en cuanto
  // la página deja de verse y vuelve por donde iba al mirar otra vez (7 sep 2026).
  let dormida = false, esperaBlur = null;
  function dormir() {
    if (!sonando || dormida) return;
    dormida = true;
    pausarTodos();
  }
  function despertar() {
    if (!dormida) return;
    dormida = false;
    if (!activa || !sonando) return;
    mandarYo(); // la ventana que se está mirando manda: las demás se callan
    const a = pistas[escena];
    if (a) { a.volume = 0; const p = a.play(); if (p && p.catch) p.catch(() => {}); fundir(escena, volumenObjetivo); }
  }
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => { if (document.hidden) dormir(); else despertar(); });
    window.addEventListener("pagehide", dormir);   // cerrar o irse a otra página
    window.addEventListener("pageshow", despertar); // volver desde el historial
    window.addEventListener("focus", () => { clearTimeout(esperaBlur); despertar(); });
    // Perder el foco calla, porque hay ventanas (paneles dentro de otra aplicación, ventanas tapadas)
    // que siguen "visibles" para el navegador aunque el jugador ya no las tenga delante. Pero se espera
    // un segundo y medio y se vuelve a comprobar: un `blur` suelto (tocar la barra del navegador, un
    // diálogo) dejaba la música dormida para siempre y el menú se quedaba mudo (8 sep 2026).
    window.addEventListener("blur", () => {
      clearTimeout(esperaBlur);
      esperaBlur = setTimeout(() => { if (!document.hasFocus() || document.hidden) dormir(); }, 1500);
    });
    // cualquier toque o tecla despierta: así nunca se queda dormida sin que el jugador pueda arreglarlo
    document.addEventListener("pointerdown", despertar, true);
    document.addEventListener("keydown", despertar, true);
  }

  // Para depurar desde la consola: qué pista está sonando de verdad.
  function diagnostico() {
    return { escena, sonando, activa, dormida, oculta: typeof document !== "undefined" && document.hidden,
      volumenObjetivo, pieza: cualPista[escena], fichero: (FICHERO[escena] || [])[cualPista[escena]], pistas: Object.fromEntries(Object.entries(pistas).map(([k, a]) => [k, a ? { pausada: a.paused, silenciada: a.muted, volumen: +a.volume.toFixed(2), segundo: +a.currentTime.toFixed(1) } : null])) };
  }
  function saltar() {
    const cual = escena; const lista = FICHERO[cual] || []; const a = pistas[cual];
    if (!a || lista.length < 2) return false;
    cualPista[cual] = elegirPieza(cual); a.src = lista[cualPista[cual]]; a.currentTime = 0; a.volume = volumenObjetivo;
    const p = a.play(); if (p && p.catch) p.catch(() => {});
    return true;
  }
  return { empezar, parar, volumen, alternar, diagnostico, saltar, activa: () => activa, sonando: () => sonando, escena: () => escena };
})();
