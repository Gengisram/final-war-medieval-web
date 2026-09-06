// Música (Web Audio o pista grabada). Dos escenas:
//   "inicio"  : el tema de taberna de la pantalla de inicio (musica/inicio.mp3; si no está, un laúd sintetizado).
//   "partida" : tres piezas que se van alternando al azar; si no cargan, una pieza sintetizada de respaldo.
// El jugador puede silenciarla en cualquier momento con el botón de la barra o desde Ajustes (fwm.musica).
window.FWM = window.FWM || {};

FWM.musica = (function () {
  const CLAVE = "fwm.musica";
  let activa = true;
  try { activa = localStorage.getItem(CLAVE) !== "off"; } catch (e) { /* nada */ }
  let ctx = null, maestro = null, sonando = false, temporizador = null, paso = 0, volumenObjetivo = .5;
  let escena = "inicio";

  // Melodía en re dórico (medieval sin pretensiones). [nota MIDI o 0 = silencio, duración en corcheas]
  const MELODIA = [
    [62, 2], [65, 1], [67, 1], [69, 2], [67, 1], [65, 1], [62, 2], [60, 2], [62, 4],
    [69, 2], [72, 1], [71, 1], [69, 2], [67, 1], [65, 1], [67, 2], [65, 2], [62, 4],
    [62, 1], [65, 1], [69, 1], [72, 1], [71, 2], [69, 2], [67, 1], [65, 1], [67, 1], [69, 1], [65, 2], [62, 2],
    [60, 2], [62, 1], [65, 1], [67, 2], [65, 1], [62, 1], [60, 2], [57, 2], [62, 4], [0, 4],
  ];
  const BORDON = [38, 38, 41, 43, 38, 38, 36, 38]; // una nota grave por compás
  // Música de partida: una pieza de verdad en re dórico, lenta (60 bpm), con bajo, acordes de laúd
  // arpegiados y una melodía que respira. Antes eran notas sueltas al azar y sonaba a pitidos (6 sep 2026).
  // Ocho compases de cuatro tiempos que se repiten: Dm - C - F - Gm | Dm - Bb - C - Dm
  const ACORDES = [
    [50, 57, 62, 65], [48, 55, 60, 64], [53, 60, 65, 69], [55, 62, 67, 70],
    [50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64], [50, 57, 62, 65],
  ];
  // melodía por compás: [nota, tiempo de entrada, duración en tiempos]; 0 = silencio
  const CANTO = [
    [[74, 0, 2], [72, 2, 1], [70, 3, 1]], [[69, 0, 3], [67, 3, 1]],
    [[65, 0, 2], [69, 2, 2]], [[70, 0, 2], [69, 2, 1], [67, 3, 1]],
    [[65, 0, 3], [62, 3, 1]], [[65, 0, 2], [67, 2, 2]],
    [[69, 0, 2], [67, 2, 1], [65, 3, 1]], [[62, 0, 4]],
  ];
  const TIEMPO = 1.0; // segundos por tiempo (60 bpm)

  function contexto() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === "suspended") ctx.resume();
    if (!maestro) { maestro = ctx.createGain(); maestro.gain.value = 0; maestro.connect(ctx.destination); }
    return ctx;
  }
  const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);

  // Cuerda pulsada: dos osciladores (fundamental triángulo + octava suave) con caída rápida.
  function cuerda(nota, t0, dur, vol) {
    const c = ctx;
    for (const [tipo, mult, v] of [["triangle", 1, 1], ["sine", 2, .35]]) {
      const o = c.createOscillator(); const g = c.createGain();
      o.type = tipo; o.frequency.value = hz(nota) * mult;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol * v, t0 + .015);
      g.gain.exponentialRampToValueAtTime(vol * v * .35, t0 + dur * .5); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + .1);
      o.connect(g); g.connect(maestro); o.start(t0); o.stop(t0 + dur + .15);
    }
  }
  function bordon(nota, t0, dur, vol) {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = "sine"; o.frequency.value = hz(nota);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || .12, t0 + .3); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(maestro); o.start(t0); o.stop(t0 + dur + .05);
  }

  // Golpe de tambor suave: ruido grave y corto.
  function tambor(t0, vol) {
    const c = ctx; const n = Math.floor(c.sampleRate * .25); const buf = c.createBuffer(1, n, c.sampleRate); const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 170;
    const g = c.createGain(); g.gain.setValueAtTime(vol || .08, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + .25);
    src.connect(f); f.connect(g); g.connect(maestro); src.start(t0);
  }

  // Programa un par de segundos por delante y se vuelve a llamar.
  let siguienteT = 0, compas = 0;
  function programar() {
    if (!sonando || !ctx) return;
    const ahora = ctx.currentTime;
    if (escena === "partida") {
      while (siguienteT < ahora + 4) {
        const c = compas % 8; const t0 = siguienteT;
        const acorde = ACORDES[c];
        bordon(acorde[0] - 12, t0, TIEMPO * 4, .09);                 // bajo del compás
        for (let i = 0; i < 4; i++) cuerda(acorde[i], t0 + i * TIEMPO * .5 + .02, TIEMPO * 1.6, .075); // arpegio de laúd
        cuerda(acorde[1], t0 + TIEMPO * 2.5, TIEMPO * 1.2, .05);
        for (const [nota, en, dur] of CANTO[c]) cuerda(nota, t0 + en * TIEMPO, dur * TIEMPO, .085);    // el canto encima
        tambor(t0, .1); tambor(t0 + TIEMPO * 2, .06);                                                  // pulso suave
        siguienteT += TIEMPO * 4; compas++;
      }
      temporizador = setTimeout(programar, 1500);
      return;
    }
    while (siguienteT < ahora + 1.2) {
      const [nota, dur] = MELODIA[paso % MELODIA.length];
      if (paso % 4 === 0) { bordon(BORDON[compas % BORDON.length], siguienteT, CORCHEA * 4); compas++; }
      if (nota) cuerda(nota, siguienteT, CORCHEA * dur, .22);
      siguienteT += CORCHEA * dur; paso++;
    }
    temporizador = setTimeout(programar, 400);
  }

  // Pista grabada por escena (musica/inicio.mp3, musica/partida.mp3) si existe; si no, la sintetizada.
  // Ficheros por escena. La partida tiene tres piezas: al acabar una entra otra al azar (nunca la misma
  // seguida), para que una partida larga no repita siempre lo mismo. El menú siempre suena igual (6 sep 2026).
  const FICHERO = { inicio: ["musica/inicio.mp3"], partida: ["musica/village-ambiance.m4a", "musica/might-magic.m4a", "musica/medieval-chateau.m4a"] };
  const pistas = {}, fallo = {}, fundido = {};
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
  function empezarPista() {
    if (fallo[escena]) return false;
    const cual = escena; const lista = FICHERO[cual] || []; if (!lista.length) return false;
    if (cualPista[cual] == null) cualPista[cual] = elegirPieza(cual);
    if (!pistas[cual]) {
      const a = new Audio(lista[cualPista[cual]]); a.loop = lista.length === 1; a.volume = 0; a.preload = "auto"; a.muted = !activa;
      a.addEventListener("error", () => { fallo[cual] = true; pistas[cual] = null; if (activa && sonando && escena === cual) { sonando = false; empezar(cual); } });
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
    if (p && p.catch) p.catch(() => { fallo[cual] = true; pistas[cual] = null; if (activa && escena === cual) { sonando = false; empezar(cual); } });
    fundir(cual, volumenObjetivo);
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
    volumenObjetivo = (cual === "partida" ? .34 : .5);
    sonando = true;
    if (empezarPista()) return;
    sonando = false;
    if (!contexto()) return;
    sonando = true; siguienteT = ctx.currentTime + .1; paso = 0; compas = 0;
    maestro.gain.cancelScheduledValues(ctx.currentTime); maestro.gain.setValueAtTime(0.0001, ctx.currentTime);
    maestro.gain.exponentialRampToValueAtTime(volumenObjetivo, ctx.currentTime + 1.5);
    programar();
  }
  function parar() {
    sonando = false; clearTimeout(temporizador);
    for (const k of Object.keys(pistas)) pararPista(k);
    if (ctx && maestro) { maestro.gain.cancelScheduledValues(ctx.currentTime); maestro.gain.setValueAtTime(Math.max(0.0001, maestro.gain.value), ctx.currentTime); maestro.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + .6); }
  }
  // Volumen relativo (1 = el de la escena).
  function volumen(v) {
    volumenObjetivo = (escena === "partida" ? .34 : .5) * v;
    const a = pistas[escena]; if (a) a.volume = volumenObjetivo;
    if (ctx && maestro && sonando) { maestro.gain.cancelScheduledValues(ctx.currentTime); maestro.gain.setValueAtTime(Math.max(0.0001, maestro.gain.value), ctx.currentTime); maestro.gain.exponentialRampToValueAtTime(Math.max(0.0001, volumenObjetivo), ctx.currentTime + 1); }
  }
  function alternar(on) {
    activa = on == null ? !activa : !!on;
    try { localStorage.setItem(CLAVE, activa ? "on" : "off"); } catch (e) { /* nada */ }
    // silencio a prueba de todo: además de pausar, se marcan como silenciadas. Así, si algo vuelve a
    // arrancarlas (el relevo de pieza, una reconexión), no suena nada mientras el jugador quiera silencio.
    for (const k of Object.keys(pistas)) if (pistas[k]) { pistas[k].muted = !activa; if (!activa) { clearInterval(fundido[k]); fundido[k] = null; pistas[k].pause(); pistas[k].volume = 0; } }
    if (activa) empezar(escena); else parar();
    if (FWM.paneles && FWM.paneles.pintarBotonMusica) FWM.paneles.pintarBotonMusica();
    return activa;
  }

  // Para depurar desde la consola: qué pista está sonando de verdad.
  function diagnostico() {
    return { escena, sonando, activa, volumenObjetivo, pieza: cualPista[escena], fichero: (FICHERO[escena] || [])[cualPista[escena]], pistas: Object.fromEntries(Object.entries(pistas).map(([k, a]) => [k, a ? { pausada: a.paused, silenciada: a.muted, volumen: +a.volume.toFixed(2), segundo: +a.currentTime.toFixed(1) } : null])) };
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
