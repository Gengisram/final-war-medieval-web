// Tutorial jugable: una partida Rápida contra una IA fácil con un mensaje por paso.
// Cada paso tiene un texto, una condición sobre el estado y, sobre todo, una SEÑAL: una flecha dorada
// que parpadea justo encima de lo que hay que tocar (6 sep 2026; antes solo había un aro en el hexágono
// y el jugador no sabía dónde estaba, por ejemplo, "el circulito de la guarnición").
// El mensaje no se puede saltar: solo minimizar y volver a abrir.
window.FWM = window.FWM || {};

FWM.tutorial = (function () {
  let App = null, paso = 0, activo = false, avanzando = false, minimizado = false;

  const H = () => FWM.hex;
  const capital = () => App.estado.jugadores[App.humano].capital;
  // insignias del asentamiento, en píxeles del mapa
  const puntoGuarnicion = (hex) => { const c = App.L.centro(hex), t = App.L.tam(); return { x: c.x + t * .6, y: c.y + t * .55 }; };
  const puntoReclutar = (hex) => { const c = App.L.centro(hex), t = App.L.tam(); return { x: c.x - t * .6, y: c.y + t * .55 }; };
  const puntoMejora = (hex) => { const c = App.L.centro(hex), t = App.L.tam(); return { x: c.x + t * .58, y: c.y - t * .6 }; };
  const misTropas = () => FWM.estado.tropasDe(App.estado, App.humano);
  const enemigos = () => Object.values(App.estado.tropas).filter(t => t.dueno !== App.humano);

  // Un hexágono al que merezca la pena mover: el más cercano con yacimiento; si no, cualquiera.
  function destinoSugerido() {
    const e = App.estado; const p = App.posibles;
    const opciones = Object.keys((p && p.mover) || {});
    if (!opciones.length) return null;
    const conYac = opciones.filter(h => e.mapa.hexes[h] && e.mapa.hexes[h].yacimiento);
    return (conYac[0] || opciones[0]);
  }
  // El yacimiento libre más cercano a mis tropas (para el paso de explorar).
  function yacimientoCercano() {
    const e = App.estado; const mias = misTropas().map(t => FWM.estado.posicionTropa(e, t)).filter(Boolean);
    if (!mias.length) return null;
    let mejor = null, mejorD = 99;
    for (const [k, h] of Object.entries(e.mapa.hexes)) {
      if (!h.yacimiento || h.dueno === App.humano) continue;
      const d = Math.min(...mias.map(m => H().distancia(m, k)));
      if (d < mejorD) { mejorD = d; mejor = k; }
    }
    return mejor;
  }

  const PASOS = () => [
    { id: "seleccionar",
      destacar: () => capital(),
      senal: () => ({ punto: puntoGuarnicion(capital()) }),
      cumplido: (e) => { const t = App.sel.tropa && e.tropas[App.sel.tropa]; return !!(t && t.dueno === App.humano); } },
    { id: "mover",
      senal: () => { const d = destinoSugerido(); return d ? { hex: d } : null; },
      cumplido: (e) => FWM.estado.tropasDe(e, App.humano).some(t => t.hex) },
    { id: "finTurno",
      senal: () => ({ sel: "#btn-fin" }),
      cumplido: (e) => e.turno >= 2 },
    { id: "reclutar",
      destacar: () => capital(),
      senal: () => (App.reclutaAbierto ? { punto: (() => { const col = document.getElementById("recluta"); const b = col && !col.hidden && col.querySelector("button"); if (!b) return puntoReclutar(capital()); const r = b.getBoundingClientRect(); const cv = document.getElementById("mapa").getBoundingClientRect(); return { x: r.left + r.width / 2 - cv.left, y: r.top + r.height / 2 - cv.top }; })() } : { punto: puntoReclutar(capital()) }),
      cumplido: (e) => FWM.estado.tropasDe(e, App.humano).length >= 2 },
    { id: "explorar",
      senal: () => { const y = yacimientoCercano(); return y ? { hex: y } : { punto: puntoMejora(capital()) }; },
      cumplido: (e) => e.turno >= 5 || FWM.estado.asentamientosDe(e, App.humano).some(x => x.a.tipo !== "pueblo") },
    { id: "atacar",
      senal: () => { const p = App.posibles; if (p && p.atacar && p.atacar.length) return { hex: p.atacar[0] }; const en = enemigos().map(t => FWM.estado.posicionTropa(App.estado, t)).filter(Boolean); return en.length ? { hex: en[0] } : null; },
      cumplido: (e) => (e.registro || []).some(ev => ev.tipo === "ataque" && ev.jugador === App.humano) },
    { id: "final", senal: () => null, cumplido: () => false },
  ];

  function empezar(app) {
    App = app; paso = 0; activo = true; avanzando = false; minimizado = false;
    App.nuevaPartida({ tipo: "rapida", rivales: 1, dificultad: "facil", tamano: "pequeno", tecnologia: "todo", hucha: 2, recursos: "equilibrado", limite: 15, bando: "castilla", semilla: 4242 });
    App.tutorial = true;
    pintar();
  }

  function terminar() {
    activo = false; App.tutorial = false; App.destacar = null; App.senalar(null);
    document.getElementById("tutorial").hidden = true;
    FWM.guardado.guardarAjustes({ tutorialHecho: true });
    if (App.estado) App.dibujar();
  }

  // Se llama en cada refresco: si el paso actual se ha cumplido, avanza; si no, recoloca la señal.
  function comprobar(app) {
    if (!activo || avanzando || !app.estado) return;
    App = app;
    const pasos = PASOS(); const p = pasos[paso];
    if (!p) return;
    App.destacar = p.destacar ? p.destacar(App.estado) : null;
    if (p.cumplido(App.estado)) {
      avanzando = true;
      const caja = document.getElementById("tutorial"); caja.classList.add("hecho");
      App.senalar(null);
      FWM.sonido.pop();
      setTimeout(() => { caja.classList.remove("hecho"); paso++; avanzando = false; pintar(); comprobar(App); }, 700);
      return;
    }
    try { App.senalar(p.senal ? p.senal() : null); } catch (e) { App.senalar(null); }
  }

  function pintar() {
    const T = App.datos.textos; const pasos = PASOS(); const p = pasos[paso];
    const caja = document.getElementById("tutorial");
    if (!p) { terminar(); return; }
    caja.hidden = false;
    caja.classList.toggle("mini", minimizado);
    caja.innerHTML = `<div class="tut-texto"><b>${paso + 1}/${pasos.length}</b> · ${T.tutorialPasos[p.id]}</div>`;
    const fila = document.createElement("div"); fila.className = "tut-botones";
    if (p.id === "final") fila.appendChild(App.boton(T.entendido, terminar, "btn btn-peq btn-primario"));
    else fila.appendChild(App.boton(minimizado ? T.maximizar : T.minimizar, () => { minimizado = !minimizado; pintar(); }, "btn btn-peq btn-claro"));
    caja.appendChild(fila);
    App.destacar = p.destacar ? p.destacar(App.estado) : null;
    try { App.senalar(p.senal ? p.senal() : null); } catch (e) { App.senalar(null); }
    App.dibujar(); if (App.destacar) App.arrancarAnimacion();
  }

  return { empezar, terminar, comprobar, activo: () => activo };
})();
