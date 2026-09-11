// El mapa de la campaña: un pergamino dibujado con el camino desde tu molino hasta la Torre del Cuervo.
// (9 sep 2026. La primera versión eran cajitas en zigzag sobre el fondo del menú y quedaba pobre.)
//
// Es un SVG hecho a mano, no una foto: pergamino con manchas, mar al oeste, río, bosques, una cordillera
// que cruza el mapa, el lago del final con su isla, y diez sellos de lacre —uno por capítulo— unidos por
// el camino de un viajero. Cada sello lleva su propio dibujo (rueda de molino, pico de minero, tres
// torres, un puerto de montaña, un puente roto, un arca vacía, un cerco, un caballo, una sierra de hierro
// y la torre con el cuervo), y cambia de aspecto según esté superado, sea el siguiente o siga cerrado.
//
// Se lee de abajo arriba: empiezas en tu feudo, al sur, y subes hacia el norte. Las posiciones están
// puestas a mano para que cada capítulo caiga donde le toca en la geografía (las minas en la costa, el
// paso en la cordillera, los puentes en el lago…).
window.FWM = window.FWM || {};

FWM.rutaCampana = (function () {
  const W = 360, H = 1020;                 // lienzo del pergamino
  const NS = "http://www.w3.org/2000/svg";
  // dónde cae cada capítulo, en coordenadas del pergamino
  const PARADAS = [
    { id: 1,  x: 176, y: 928 },  // el molino, en el río del sur
    { id: 2,  x: 84,  y: 838 },  // las minas, en la costa del oeste
    { id: 3,  x: 214, y: 772 },  // las tres torres del valle
    { id: 4,  x: 150, y: 660 },  // el puerto de la cordillera
    { id: 5,  x: 246, y: 578 },  // el lago pequeño de los puentes
    { id: 6,  x: 100, y: 512 },  // de vuelta al río, con los cofres vacíos
    { id: 7,  x: 226, y: 430 },  // el cerco, en el llano del norte
    { id: 8,  x: 108, y: 344 },  // la carga, en la llanura de la costa
    { id: 9,  x: 196, y: 250 },  // la sierra de hierro
    { id: 10, x: 146, y: 186 },  // el desembarco en la isla de la Torre
  ];

  const el = (n, attrs, padre) => { const e = document.createElementNS(NS, n); for (const k in attrs) e.setAttribute(k, attrs[k]); if (padre) padre.appendChild(e); return e; };

  // ---------- dibujos de cada sello ----------
  // Trazos sencillos, pensados para verse a 30 px. Se pintan con currentColor.
  const EMBLEMAS = {
    1: "M-9 7h18M-6 7V-2l6-5 6 5v9M-3 7V1h6v6M0-9v2",                                   // molino: casa y aspa
    2: "M-8 8l9-9M-2 2l-6-6 3-3 6 6M3-4l6 6-3 3-6-6M4-9l5 5",                            // pico de minero
    3: "M-9 8V-3l3-3 3 3v11M-1 8V-6l2-2 2 2v14M6 8V-1l3-3 3 3v9M-11 8h22",               // tres torres
    4: "M-11 7l7-11 4 6 4-8 7 13zM-4-4l-2-3M4-6l-2-3",                                   // puerto entre montañas
    5: "M-11 3h22M-8 3V-1M-2 3V-1M4 3V-1M-11 7h7M4 7h7M-2 8l4-4M2 8l-4-4",                // puente roto
    6: "M-9-3h18v11h-18zM-9-3l3-4h12l3 4M-2 3h4M-9 8h18",                                 // arca abierta
    7: "M0-8v16M-8 0h16M-6-6l12 12M6-6L-6 6",                                             // cerco: cruz de sitio
    8: "M-9 6c3-9 9-12 14-12l3-3 1 4 3 2-4 2c0 6-5 10-11 11M-3 6l-2 3M3 3l1 4",           // caballo a la carga
    9: "M-11 7l6-10 4 5 3-6 9 11zM-1-6l2-3 2 3",                                          // sierra de hierro
    10: "M-8 8V-4l3-3v-3l2 2 3-3 3 3 2-2v3l3 3v12zM-3 8V2h6v6M0-9v2",                     // torre almenada
  };

  function emblema(padre, id, x, y, escala) {
    const g = el("g", { transform: `translate(${x},${y}) scale(${escala || 1})` }, padre);
    el("path", { d: EMBLEMAS[id] || EMBLEMAS[1], fill: "none", stroke: "currentColor", "stroke-width": 2.6, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    return g;
  }

  // ---------- el pergamino y su geografía ----------
  function fondo(svg) {
    const defs = el("defs", {}, svg);
    // papel viejo: base clara con manchas de té en las esquinas
    const gp = el("radialGradient", { id: "rc-papel", cx: "50%", cy: "42%", r: "78%" }, defs);
    el("stop", { offset: "0%", "stop-color": "#f7ecd2" }, gp);
    el("stop", { offset: "70%", "stop-color": "#eddfbe" }, gp);
    el("stop", { offset: "100%", "stop-color": "#dcc79a" }, gp);
    const gm = el("linearGradient", { id: "rc-mar", x1: "0", y1: "0", x2: "1", y2: "0" }, defs);
    el("stop", { offset: "0%", "stop-color": "#9db9c9" }, gm);
    el("stop", { offset: "100%", "stop-color": "#c3d2d6" }, gm);
    // borde quemado del pergamino
    const sombra = el("filter", { id: "rc-sombra", x: "-20%", y: "-20%", width: "140%", height: "140%" }, defs);
    el("feDropShadow", { dx: 0, dy: 2, stdDeviation: 3, "flood-color": "#3a2c15", "flood-opacity": ".35" }, sombra);

    el("rect", { x: 0, y: 0, width: W, height: H, rx: 10, fill: "url(#rc-papel)" }, svg);
    // manchas de humedad
    const manchas = [[40, 120, 70], [320, 260, 90], [60, 700, 80], [300, 880, 70], [180, 460, 110]];
    for (const [mx, my, mr] of manchas) el("circle", { cx: mx, cy: my, r: mr, fill: "#c9ac74", opacity: ".10" }, svg);

    // ---- la bahía del sur, donde muere el río (antes el mar era una franja de arriba abajo por el
    // lateral y molestaba: Rodrigo pidió mar, pero no todo el borde) ----
    el("path", { d: "M0,1020 L0,846 C34,858 62,884 74,916 C86,948 78,984 96,1020 Z", fill: "url(#rc-mar)" }, svg);
    for (const [ox, oy] of [[16, 900], [34, 940], [12, 966], [46, 976]]) {
      el("path", { d: `M${ox},${oy} q7,-5 14,0 q7,5 14,0`, fill: "none", stroke: "#6f97b8", "stroke-width": 1.4, opacity: ".55", "stroke-linecap": "round" }, svg);
    }

    // ---- el lago del norte, con la isla de la Torre ----
    el("path", { d: "M120,196 C104,150 140,96 190,86 C244,74 292,104 296,152 C300,200 258,228 210,224 C168,220 134,226 120,196 Z", fill: "url(#rc-mar)", opacity: ".95" }, svg);
    el("path", { d: "M168,150 C166,124 186,108 210,108 C236,108 252,126 250,150 C248,172 228,184 208,182 C186,180 170,172 168,150 Z", fill: "#e7d8b2", stroke: "#c2a878", "stroke-width": 1.2 }, svg);

    // ---- el lago pequeño de los puentes quemados ----
    el("path", { d: "M214,548 C206,528 226,510 252,510 C280,510 296,528 292,550 C288,572 262,584 240,578 C222,574 218,566 214,548 Z", fill: "url(#rc-mar)", opacity: ".9" }, svg);

    // ---- el río del sur: nace en la sierra y baja hasta el mar ----
    el("path", { d: "M258,690 C238,742 210,760 206,806 C202,852 168,872 160,908 C154,936 110,952 62,930", fill: "none", stroke: "#9db9c9", "stroke-width": 7, "stroke-linecap": "round", opacity: ".9" }, svg);
    el("path", { d: "M258,690 C238,742 210,760 206,806 C202,852 168,872 160,908 C154,936 110,952 62,930", fill: "none", stroke: "#c3d2d6", "stroke-width": 3, "stroke-linecap": "round" }, svg);

    // ---- la cordillera que cruza el mapa (la sierra del capítulo 4) ----
    montanas(svg, [[92, 700], [124, 690], [156, 700], [188, 688], [220, 698], [252, 690], [284, 700]], 1);
    // ---- la sierra de hierro, al norte ----
    montanas(svg, [[120, 292], [152, 280], [184, 292], [216, 282], [248, 294]], 1.1);
    // ---- colinas sueltas ----
    montanas(svg, [[96, 470], [128, 462]], .75);
    montanas(svg, [[268, 392], [296, 400]], .75);

    // ---- bosques ----
    for (const [bx, by, n] of [[268, 840, 4], [96, 606, 3], [286, 620, 3], [128, 386, 3], [252, 462, 4], [140, 178, 2]]) {
      for (let i = 0; i < n; i++) arbol(svg, bx + (i % 2) * 17 - 8, by + Math.floor(i / 2) * 15);
    }

    // ---- un barco navegando la costa ----
    const barco = el("g", { transform: "translate(44,930) scale(.85)" }, svg);
    el("path", { d: "M-11,6 h22 l-4,6 h-14 z", fill: "#e2d2ab", stroke: "#7a6440", "stroke-width": 1.2, "stroke-linejoin": "round" }, barco);
    el("path", { d: "M0,6 V-12 M0,-12 L10,-2 L0,-2", fill: "#f2e6c8", stroke: "#7a6440", "stroke-width": 1.2, "stroke-linejoin": "round" }, barco);

    // ---- cartela del título, arriba ----
    const cart = el("g", { transform: "translate(180,42)" }, svg);
    el("path", { d: "M-128,-24 h256 l-10,24 l10,24 h-256 l10,-24 z", fill: "#f2e6c8", stroke: "#8b6b33", "stroke-width": 1.6, filter: "url(#rc-sombra)" }, cart);
    return cart;
  }

  function montanas(svg, picos, escala) {
    for (const [mx, my] of picos) {
      const s = (escala || 1) * (0.9 + ((mx * 7 + my) % 5) / 14);
      const g = el("g", { transform: `translate(${mx},${my}) scale(${s})` }, svg);
      el("path", { d: "M-20,10 L0,-16 L20,10 Z", fill: "#d8c399", stroke: "#a98d5c", "stroke-width": 1.3, "stroke-linejoin": "round" }, g);
      el("path", { d: "M-7,-3 L0,-16 L7,-3 L3,-6 L0,-3 L-3,-6 Z", fill: "#f4ead2" }, g);
    }
  }
  function arbol(svg, x, y) {
    const g = el("g", { transform: `translate(${x},${y})` }, svg);
    el("path", { d: "M0,7 L0,2", stroke: "#8b6b33", "stroke-width": 1.6, "stroke-linecap": "round" }, g);
    el("path", { d: "M0,-9 L6,3 L-6,3 Z", fill: "#9db486", stroke: "#6f8a5e", "stroke-width": 1 }, g);
  }

  // ---------- el camino ----------
  function caminoD(hasta) {
    let d = "";
    for (let i = 0; i < hasta; i++) {
      const p = PARADAS[i];
      if (!i) { d = `M${p.x},${p.y}`; continue; }
      const a = PARADAS[i - 1];
      // curva suave, con el punto de control desplazado a un lado para que serpentee
      const mx = (a.x + p.x) / 2 + (i % 2 ? 34 : -34), my = (a.y + p.y) / 2;
      d += ` Q${mx},${my} ${p.x},${p.y}`;
    }
    return d;
  }

  // ---------- el mapa entero ----------
  // C: FWM.campana; alTocar(capitulo) se llama al pulsar una parada abierta.
  function crear(App, C, alTocar) {
    const T = App.datos.textos;
    const lista = C.lista();
    const sig = C.siguiente();
    const hechos = lista.filter(c => C.superado(c.id)).length;

    const env = document.createElement("div"); env.className = "ruta-campana";
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "ruta-svg", role: "img" });
    el("title", {}, svg).textContent = T.campana.titulo;
    env.appendChild(svg);
    const cartela = fondo(svg);
    const tit = el("text", { x: 0, y: 6, "text-anchor": "middle", class: "rc-titulo" }, cartela);
    tit.textContent = T.campana.torre;

    // camino: primero el entero en puntitos, encima lo ya recorrido
    el("path", { d: caminoD(lista.length), fill: "none", stroke: "#8b6b33", "stroke-width": 3, "stroke-linecap": "round", "stroke-dasharray": "1 11", opacity: ".75" }, svg);
    if (hechos > 0) el("path", { d: caminoD(Math.min(hechos + 1, lista.length)), fill: "none", stroke: "#8b1a1a", "stroke-width": 3.4, "stroke-linecap": "round", "stroke-dasharray": "1 11", opacity: ".9" }, svg);

    // la Torre del Cuervo, dibujada en su isla
    const torre = el("g", { transform: "translate(206,126)", class: "rc-torre" + (hechos >= lista.length ? " tomada" : "") }, svg);
    el("path", { d: "M-16,26 L-16,-10 L-11,-16 L-11,-24 L-6,-19 L0,-26 L6,-19 L11,-24 L11,-16 L16,-10 L16,26 Z", fill: "#e2d2ab", stroke: "#5a4a2e", "stroke-width": 2, "stroke-linejoin": "round" }, torre);
    el("path", { d: "M-5,26 L-5,12 L5,12 L5,26 Z M-9,-4 h5 v7 h-5 z M4,-4 h5 v7 h-5 z", fill: "#5a4a2e" }, torre);
    el("path", { d: "M0,-26 L0,-36 L14,-32 L0,-28", fill: "#8b1a1a", stroke: "#5a4a2e", "stroke-width": 1.2, "stroke-linejoin": "round" }, torre);

    // el cuervo, volando sobre el lago
    const cuervo = el("g", { transform: "translate(250,104)", class: "rc-cuervo" }, svg);
    el("path", { d: "M-14,0 q7,-8 14,0 q7,-8 14,0", fill: "none", stroke: "#2a2419", "stroke-width": 2.4, "stroke-linecap": "round" }, cuervo);

    // rosa de los vientos, abajo a la derecha
    const rosa = el("g", { transform: "translate(306,952)", opacity: ".8" }, svg);
    el("circle", { r: 22, fill: "none", stroke: "#8b6b33", "stroke-width": 1.2 }, rosa);
    el("path", { d: "M0,-20 L5,0 L0,20 L-5,0 Z", fill: "#8b6b33" }, rosa);
    el("path", { d: "M-20,0 L0,-5 L20,0 L0,5 Z", fill: "#c2a878" }, rosa);
    const n = el("text", { x: 0, y: -26, "text-anchor": "middle", class: "rc-norte" }, rosa); n.textContent = "N";

    // ---------- los sellos, encima del pergamino ----------
    for (let i = 0; i < lista.length; i++) {
      const cap = lista[i], p = PARADAS[i] || PARADAS[PARADAS.length - 1];
      const hecha = C.superado(cap.id), esSig = sig && sig.id === cap.id, abierto = hecha || esSig;
      const b = document.createElement("button");
      b.className = "rc-parada" + (hecha ? " hecha" : esSig ? " sig" : " bloq") + (cap.jefe ? " jefe" : "");
      b.style.left = (p.x / W * 100) + "%";
      b.style.top = (p.y / H * 100) + "%";
      b.disabled = !abierto;
      b.setAttribute("aria-label", cap.nombre);
      // el sello: círculo de lacre con el emblema del capítulo
      const s = el("svg", { viewBox: "-26 -26 52 52", class: "rc-sello" });
      el("circle", { r: 22, class: "rc-lacre" }, s);
      el("circle", { r: 18, class: "rc-lacre-borde", fill: "none", "stroke-dasharray": "2 3" }, s);
      emblema(s, cap.jefe ? 10 : cap.id, 0, 1, 1.18);
      if (hecha) { // marca de tinta encima del sello cumplido: el emblema se queda de fondo
        el("path", { d: "M-11,1 L-3,10 L12,-9", fill: "none", stroke: "#1e5c22", "stroke-width": 7, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: ".35" }, s);
        el("path", { d: "M-11,1 L-3,10 L12,-9", fill: "none", stroke: "#6dd47e", "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round", class: "rc-visto" }, s);
      }
      b.appendChild(s);
      const et = document.createElement("span"); et.className = "rc-nombre";
      et.textContent = cap.nombre;
      b.appendChild(et);
      if (abierto) b.addEventListener("click", () => alTocar(cap));
      env.appendChild(b);
    }
    return env;
  }

  return { crear, PARADAS };
})();
