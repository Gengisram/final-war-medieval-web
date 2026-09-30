// Sonidos sintetizados con Web Audio (sin archivos). Para usar sonidos de verdad
// basta con cambiar estas funciones por reproducciones de ficheros.
window.FWM = window.FWM || {};

FWM.sonido = (function () {
  const CLAVE = "fwm.sonido";
  let ctx = null;
  let activo = true;
  try { activo = localStorage.getItem(CLAVE) !== "off"; } catch (e) { /* nada */ }

  function contexto() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  // El navegador exige un gesto del usuario antes de sonar: desbloqueamos con el primer toque.
  function desbloquear() { contexto(); }
  document.addEventListener("pointerdown", desbloquear, { once: true, passive: true });
  document.addEventListener("keydown", desbloquear, { once: true });

  function tono(freq, dur, tipo, vol, freqFin, retraso) {
    const c = activo && contexto(); if (!c) return;
    const t0 = c.currentTime + (retraso || 0);
    const o = c.createOscillator(); const g = c.createGain();
    o.type = tipo || "sine"; o.frequency.setValueAtTime(freq, t0);
    if (freqFin) o.frequency.exponentialRampToValueAtTime(freqFin, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || .2, t0 + .01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + dur + .02);
  }
  function ruido(dur, vol, filtro, freq, retraso) {
    const c = activo && contexto(); if (!c) return;
    const t0 = c.currentTime + (retraso || 0);
    const n = Math.floor(c.sampleRate * dur); const buf = c.createBuffer(1, n, c.sampleRate); const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = filtro || "lowpass"; f.frequency.value = freq || 400;
    const g = c.createGain(); g.gain.setValueAtTime(vol || .3, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(c.destination); src.start(t0);
  }

  const S = {};
  S.golpe = (retraso) => { ruido(.14, .5, "lowpass", 300, retraso); tono(90, .18, "sine", .35, 40, retraso); };          // golpe seco
  S.clinc = (retraso) => { tono(1900, .12, "triangle", .12, 1400, retraso); tono(2600, .09, "sine", .06, 2200, retraso); }; // metal contra metal
  S.flecha = (retraso) => { ruido(.18, .18, "highpass", 2500, retraso); };                                                 // silbido
  S.piedra = (retraso) => { ruido(.25, .6, "lowpass", 180, retraso); tono(60, .3, "sine", .4, 30, retraso); };             // pedrada en la muralla
  S.muerte = (retraso) => { tono(220, .35, "sawtooth", .12, 70, retraso); };                                               // caída
  S.tambor = () => { tono(70, .35, "sine", .5, 35); ruido(.12, .25, "lowpass", 200); };                                    // fin de turno
  S.suma = () => { [660, 880].forEach((f, i) => tono(f, .12, "triangle", .14, null, i * .1)); };                            // puntos que se suman al total
  S.fanfarria = () => { [523, 659, 784].forEach((f, i) => tono(f, .16, "square", .08, null, i * .12)); tono(1047, .35, "square", .08, null, .36); };
  // final de partida (6 sep 2026): victoria larga y clara; derrota, cuatro notas cayendo
  S.victoria = () => { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tono(f, i === 5 ? .6 : .17, "square", .09, null, i * .14)); [262, 330, 392].forEach((f, i) => tono(f, .5, "triangle", .07, null, .7 + i * .02)); ruido(.35, .18, "lowpass", 220, .7); };
  S.derrota = () => { [392, 349, 311, 262].forEach((f, i) => tono(f, i === 3 ? .8 : .32, "sawtooth", .07, null, i * .3)); tono(65, 1.0, "sine", .25, 40, .9); };
  S.pop = () => { tono(600, .09, "sine", .2, 300); };                                                                      // reclutar
  S.moneda = () => { tono(1200, .08, "triangle", .1, null); tono(1600, .12, "triangle", .1, null, .06); };                 // fundar / construir
  S.tic = () => { tono(900, .04, "sine", .08, 700); };                                                                      // clic de interfaz
  S.inicio = () => { [392, 523, 659, 784].forEach((f, i) => tono(f, .18, "triangle", .12, null, i * .11)); tono(1047, .5, "triangle", .12, null, .44); ruido(.3, .2, "lowpass", 250, .44); };
  S.desbloquear = () => contexto();
  S.activo = () => activo;
  S.alternar = (on) => { activo = on == null ? !activo : !!on; try { localStorage.setItem(CLAVE, activo ? "on" : "off"); } catch (e) { /* nada */ } if (activo) contexto(); return activo; };
  return S;
})();
