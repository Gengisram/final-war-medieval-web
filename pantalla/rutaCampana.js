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
    // 13 sep 2026, para las campañas de las facciones
    barco: "M-11 3h22l-4 6h-14zM0 3V-10M0-10l8 8H0M-11 3c-2-3-1-6 2-7",                      // barco largo
    corona: "M-10 7h20M-10 7V-4l5 4 5-8 5 8 5-4V7",                                          // corona
    arco: "M-6-10c-8 6-8 14 0 20M-6-10L-2 0L-6 10M-4 0h14M10 0l-4-3M10 0l-4 3",               // arco y flecha
    hoguera: "M-9 8h18M-6 8l12-4M6 8L-6 4M0 4c-5-4-3-9 0-13c1 4 5 5 3 9c3-2 3 2 0 4",           // hoguera
    gota: "M0-10c5 7 8 11 8 14a8 8 0 0 1-16 0c0-3 3-7 8-14z",                                  // agua, pozo
    espadas: "M-9-9l18 18M9-9L-9 9M-9 5l4 4M5 9l4-4",                                          // espadas cruzadas
    puerta: "M-9 9V-2a9 9 0 0 1 18 0V9zM-3 9V2h6v7M-9-2h18",                                   // puerta de ciudad
    caballo2: "M-9 6c3-9 9-12 14-12l3-3 1 4 3 2-4 2c0 6-5 10-11 11M-3 6l-2 3M3 3l1 4",          // jinete
    sol: "M0-4a4 4 0 1 1 0 8a4 4 0 1 1 0-8M0-11v4M0 7v4M-11 0h4M7 0h4M-8-8l3 3M5 5l3 3M8-8l-3 3M-5 5l-3 3", // sol
    colinas: "M-12 8l7-10 5 6 5-9 7 13z",                                                     // dos colinas (Hattin)
    yurta: "M-10 7V0a10 7 0 0 1 20 0v7zM-3 7V2h6v5M0-7v-3",                                   // tienda de la estepa
    libro: "M-10-7h8a2 2 0 0 1 2 2V8a2 2 0 0 0-2-2h-8zM10-7H2a2 2 0 0 0-2 2V8a2 2 0 0 1 2-2h8z", // pergamino del griot
  };
  // qué sello lleva cada capítulo en cada campaña (Castilla usa los números de siempre)
  const SELLOS = {
    vikingos: ["barco", "espadas", 3, 2, "corona", 4, "barco", "puerta", "espadas", 5],
    inglaterra: ["puerta", "caballo2", 3, 5, 10, "hoguera", 4, "arco", "gota", "corona"],
    mali: ["libro", "caballo2", "gota", "puerta", "sol", "libro", "arco", "corona", 9, "espadas"],
    saladino: ["puerta", "corona", "barco", 3, 10, 5, "caballo2", 10, "gota", "colinas"],
    mongoles: ["yurta", "caballo2", "gota", "yurta", "espadas", 4, "puerta", "gota", "hoguera", "corona"],
    eslavos: ["hoguera", 2, "gota", 4, "hoguera", "barco", 10, "caballo2", "puerta", "sol"],
  };

  function emblema(padre, id, x, y, escala) {
    const g = el("g", { transform: `translate(${x},${y}) scale(${escala || 1})` }, padre);
    el("path", { d: EMBLEMAS[id] || EMBLEMAS[1], fill: "none", stroke: "currentColor", "stroke-width": 2.6, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    return g;
  }

  // ---------- el pergamino y su geografía ----------
  function papel(svg) {
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
  }
  function cartela(svg) {
    const cart = el("g", { transform: "translate(180,42)" }, svg);
    el("path", { d: "M-128,-24 h256 l-10,24 l10,24 h-256 l10,-24 z", fill: "#f2e6c8", stroke: "#8b6b33", "stroke-width": 1.6, filter: "url(#rc-sombra)" }, cart);
    return cart;
  }
  function rio(svg, d, ancho) {
    el("path", { d, fill: "none", stroke: "#9db9c9", "stroke-width": ancho || 7, "stroke-linecap": "round", opacity: ".9" }, svg);
    el("path", { d, fill: "none", stroke: "#c3d2d6", "stroke-width": Math.max(2, (ancho || 7) - 4), "stroke-linecap": "round" }, svg);
  }
  function agua(svg, d, opacidad) { el("path", { d, fill: "url(#rc-mar)", opacity: opacidad || ".95" }, svg); }
  function barco(svg, x, y) {
    const b = el("g", { transform: `translate(${x},${y}) scale(.85)` }, svg);
    el("path", { d: "M-11,6 h22 l-4,6 h-14 z", fill: "#e2d2ab", stroke: "#7a6440", "stroke-width": 1.2, "stroke-linejoin": "round" }, b);
    el("path", { d: "M0,6 V-12 M0,-12 L10,-2 L0,-2", fill: "#f2e6c8", stroke: "#7a6440", "stroke-width": 1.2, "stroke-linejoin": "round" }, b);
  }
  function pino(svg, x, y) {
    const g = el("g", { transform: `translate(${x},${y})` }, svg);
    el("path", { d: "M0,8 L0,3", stroke: "#8b6b33", "stroke-width": 1.6, "stroke-linecap": "round" }, g);
    el("path", { d: "M0,-11 L5,-3 L2,-3 L7,4 L-7,4 L-2,-3 L-5,-3 Z", fill: "#7f9e77", stroke: "#5c7a58", "stroke-width": 1 }, g);
  }
  function acacia(svg, x, y) {
    const g = el("g", { transform: `translate(${x},${y})` }, svg);
    el("path", { d: "M0,8 L0,-2 M0,0 L-4,-4 M0,-1 L4,-5", stroke: "#8b6b33", "stroke-width": 1.6, "stroke-linecap": "round", fill: "none" }, g);
    el("path", { d: "M-10,-5 C-8,-10 8,-10 10,-5 Z", fill: "#a9b67a", stroke: "#7d8a55", "stroke-width": 1 }, g);
  }
  function palmera(svg, x, y) {
    const g = el("g", { transform: `translate(${x},${y})` }, svg);
    el("path", { d: "M0,9 C1,3 -1,-3 1,-8", stroke: "#8b6b33", "stroke-width": 1.8, fill: "none", "stroke-linecap": "round" }, g);
    el("path", { d: "M1,-8 C-4,-11 -8,-9 -10,-5 M1,-8 C6,-11 9,-9 10,-4 M1,-8 C-2,-13 2,-15 5,-13", stroke: "#7d9a5a", "stroke-width": 2, fill: "none", "stroke-linecap": "round" }, g);
  }
  function duna(svg, x, y, w) { el("path", { d: `M${x - w},${y} Q${x},${y - w * .45} ${x + w},${y}`, fill: "none", stroke: "#c9a86a", "stroke-width": 1.6, opacity: ".8", "stroke-linecap": "round" }, svg); }
  function hierba(svg, x, y) { el("path", { d: `M${x - 4},${y} l2,-6 M${x},${y} l0,-8 M${x + 4},${y} l-2,-6`, stroke: "#9aa66a", "stroke-width": 1.4, "stroke-linecap": "round", opacity: ".8" }, svg); }
  function yurta(svg, x, y) {
    const g = el("g", { transform: `translate(${x},${y})` }, svg);
    el("path", { d: "M-9,6 V-1 A9,6 0 0 1 9,-1 V6 Z", fill: "#f2e6c8", stroke: "#8b6b33", "stroke-width": 1.2 }, g);
    el("path", { d: "M-2,6 V1 H2 V6", fill: "#8b6b33" }, g);
  }
  // ---------- paisajes de cada campaña ----------
  // Castilla: la de siempre (mar al suroeste, río, cordillera, lago de la Torre al norte).
  function fondo(svg, paisaje) {
    papel(svg);
    if (paisaje && PAISAJES[paisaje]) { PAISAJES[paisaje](svg); return cartela(svg); }
    return fondoCastilla(svg);
  }
  function fondoCastilla(svg) {
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

    return cartela(svg);
  }

  const PAISAJES = {
    // Tribus eslavas: el bosque viejo abajo, un río, aldeas de madera y la llanura de los jinetes arriba
    bosque(svg) {
      rio(svg, "M30,1000 C90,920 70,840 140,780 C210,720 180,640 240,580 C300,520 260,440 320,400", 8);
      agua(svg, "M70,560 C60,530 90,508 118,516 C146,524 150,552 134,572 C118,590 80,590 70,560 Z", ".85");
      for (const [bx, by, n] of [[60, 900, 6], [240, 900, 6], [300, 780, 5], [70, 760, 5], [180, 680, 4], [60, 640, 4], [290, 640, 4], [150, 520, 5], [270, 500, 3], [70, 440, 4]]) for (let i = 0; i < n; i++) (i % 2 ? arbol : pino)(svg, bx + (i % 3) * 15 - 15, by + Math.floor(i / 3) * 14);
      for (const [cx, cy] of [[200, 860], [110, 700], [230, 620]]) { const al = el("g", { transform: `translate(${cx},${cy})` }, svg); el("path", { d: "M-10,6 V-2 L0,-9 L10,-2 V6 Z", fill: "#c9a878", stroke: "#5a4a2e", "stroke-width": 1.3 }, al); }
      for (let i = 0; i < 18; i++) hierba(svg, 30 + (i * 83) % 300, 130 + (i * 37) % 240);
      montanas(svg, [[80, 200], [300, 220]], .7);
    },
    // Vikingos: el mar del norte al oeste con fiordos, islas, pinos y el puente de Stamford arriba
    norte(svg) {
      agua(svg, "M0,1020 L0,520 C40,540 70,600 50,660 C30,720 90,760 70,820 C50,880 100,940 90,1020 Z");
      agua(svg, "M0,300 C60,300 90,330 80,380 C70,430 30,440 0,430 Z", ".9");
      agua(svg, "M50,640 C90,630 130,650 150,640 C130,670 90,672 60,668 Z", ".85");
      agua(svg, "M60,800 C110,790 160,800 190,790 C170,820 110,830 70,826 Z", ".85");
      for (const [ix, iy, ir] of [[26, 470, 12], [40, 900, 14], [22, 360, 9]]) el("ellipse", { cx: ix, cy: iy, rx: ir, ry: ir * .6, fill: "#e7d8b2", stroke: "#c2a878", "stroke-width": 1 }, svg);
      montanas(svg, [[210, 560], [244, 548], [278, 560], [310, 552]], 1);
      montanas(svg, [[150, 700], [182, 690]], .85);
      montanas(svg, [[260, 300], [294, 290], [326, 302]], 1);
      for (const [bx, by, n] of [[260, 880, 5], [300, 720, 4], [140, 520, 4], [230, 420, 5], [120, 250, 3], [300, 180, 3]]) for (let i = 0; i < n; i++) pino(svg, bx + (i % 3) * 15 - 15, by + Math.floor(i / 3) * 14);
      rio(svg, "M190,110 C200,160 170,200 180,240", 6);
      barco(svg, 40, 760); barco(svg, 60, 560);
      // el puente de Stamford, arriba
      const pu = el("g", { transform: "translate(196,150)" }, svg);
      el("path", { d: "M-26,4 Q0,-12 26,4", fill: "none", stroke: "#6b5230", "stroke-width": 5 }, pu);
      el("path", { d: "M-24,4 V12 M-8,-2 V12 M8,-2 V12 M24,4 V12", stroke: "#6b5230", "stroke-width": 2.4 }, pu);
    },
    // Inglaterra: colinas verdes de Gales al oeste, el Severn, bosques y la villa de Evesham en su meandro
    verde(svg) {
      agua(svg, "M0,1020 L0,880 C30,890 60,920 70,960 C76,990 70,1005 80,1020 Z");
      rio(svg, "M60,960 C100,880 90,800 130,740 C170,680 150,600 190,540 C230,480 210,400 240,340", 8);
      rio(svg, "M240,340 C270,280 250,220 206,196", 6);
      el("path", { d: "M176,190 C176,150 236,150 236,190 C236,220 200,236 196,210", fill: "none", stroke: "#9db9c9", "stroke-width": 7 }, svg);
      montanas(svg, [[40, 640], [70, 628], [44, 560], [74, 548]], .8);
      montanas(svg, [[40, 380], [70, 370], [100, 382]], .75);
      for (const [bx, by, n] of [[260, 880, 6], [150, 820, 4], [280, 640, 5], [80, 460, 4], [290, 460, 4], [120, 300, 4], [290, 120, 3]]) for (let i = 0; i < n; i++) arbol(svg, bx + (i % 3) * 16 - 16, by + Math.floor(i / 3) * 14);
      const villa = el("g", { transform: "translate(206,178)" }, svg);
      el("path", { d: "M-12,8 V-2 L-6,-8 L0,-2 V8 Z M2,8 V-6 L7,-12 L12,-6 V8 Z", fill: "#e2d2ab", stroke: "#5a4a2e", "stroke-width": 1.4 }, villa);
    },
    // Malí: la sabana, el Níger dando su gran curva, acacias y las montañas peladas de Sosso arriba
    sabana(svg) {
      rio(svg, "M20,980 C80,900 60,820 130,760 C200,700 300,700 300,600 C300,500 200,470 180,380 C160,300 240,240 330,220", 10);
      for (const [ix, iy] of [[150, 748], [292, 612]]) el("ellipse", { cx: ix, cy: iy, rx: 10, ry: 5, fill: "#e7d8b2", stroke: "#c2a878", "stroke-width": 1 }, svg);
      montanas(svg, [[80, 240], [112, 228], [144, 240]], .9);
      montanas(svg, [[250, 150], [284, 140]], .8);
      for (const [ax, ay] of [[60, 860], [240, 880], [300, 800], [90, 680], [220, 620], [60, 520], [120, 440], [300, 440], [60, 340], [270, 330], [180, 280]]) acacia(svg, ax, ay);
      for (let i = 0; i < 26; i++) hierba(svg, 30 + (i * 83) % 300, 120 + (i * 137) % 860);
      const k = el("g", { transform: "translate(196,150)" }, svg);
      el("path", { d: "M-18,10 L-18,-4 L0,-14 L18,-4 L18,10 Z", fill: "#d8b27a", stroke: "#5a4a2e", "stroke-width": 1.4 }, k);
      el("path", { d: "M-6,10 V2 H6 V10", fill: "#5a4a2e" }, k);
    },
    // Saladino: el Nilo con su delta abajo, el desierto con dunas y palmeras, y los cuernos de Hattin arriba
    desierto(svg) {
      agua(svg, "M0,1020 L0,960 C80,940 160,950 360,940 L360,1020 Z");
      rio(svg, "M90,950 C100,860 70,800 90,720 C110,640 80,580 100,520", 9);
      rio(svg, "M90,950 C60,920 40,930 20,950", 5); rio(svg, "M90,950 C130,920 150,930 170,948", 5);
      agua(svg, "M250,260 C240,220 270,196 296,204 C322,212 330,244 316,270 C302,292 262,292 250,260 Z", ".9");
      for (let i = 0; i < 20; i++) duna(svg, 150 + (i * 97) % 200, 360 + (i * 151) % 520, 16 + (i % 3) * 6);
      for (const [px, py] of [[70, 900], [120, 880], [60, 760], [130, 700], [70, 600], [230, 240], [330, 300]]) palmera(svg, px, py);
      montanas(svg, [[70, 420], [100, 410]], .7);
      // los dos cuernos de Hattin
      montanas(svg, [[160, 160], [226, 164]], .9);
    },
    // Mongoles: la estepa infinita, un río, las tiendas, el Gobi al este y la montaña de Chakirmaut arriba
    estepa(svg) {
      rio(svg, "M40,1000 C90,900 60,820 120,760 C180,700 150,620 200,560", 7);
      agua(svg, "M60,520 C50,490 80,470 104,478 C128,486 132,512 118,530 C104,546 70,546 60,520 Z", ".85");
      for (let i = 0; i < 40; i++) hierba(svg, 20 + (i * 71) % 320, 110 + (i * 113) % 880);
      for (let i = 0; i < 8; i++) duna(svg, 260 + (i * 23) % 80, 600 + (i * 67) % 260, 14);
      for (const [yx, yy] of [[70, 900], [200, 820], [260, 640], [110, 380], [280, 420]]) yurta(svg, yx, yy);
      montanas(svg, [[120, 180], [156, 166], [192, 180], [228, 170], [262, 182]], 1.05);
      montanas(svg, [[300, 520], [330, 510]], .75);
      for (const [bx, by, n] of [[60, 260, 3], [300, 260, 2]]) for (let i = 0; i < n; i++) pino(svg, bx + i * 15, by);
    },
  };

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
    const datosC = C.datos ? C.datos() : null; const paisaje = datosC && datosC.paisaje !== "castilla" ? datosC.paisaje : null;
    const cart = fondo(svg, paisaje);
    const tit = el("text", { x: 0, y: 6, "text-anchor": "middle", class: "rc-titulo" }, cart);
    tit.textContent = (datosC && datosC.destino) || T.campana.torre;

    // camino: primero el entero en puntitos, encima lo ya recorrido
    el("path", { d: caminoD(lista.length), fill: "none", stroke: "#8b6b33", "stroke-width": 3, "stroke-linecap": "round", "stroke-dasharray": "1 11", opacity: ".75" }, svg);
    if (hechos > 0) el("path", { d: caminoD(Math.min(hechos + 1, lista.length)), fill: "none", stroke: "#8b1a1a", "stroke-width": 3.4, "stroke-linecap": "round", "stroke-dasharray": "1 11", opacity: ".9" }, svg);

    if (!paisaje) {
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
    } else {
      const rosa = el("g", { transform: "translate(306,952)", opacity: ".8" }, svg);
      el("circle", { r: 22, fill: "none", stroke: "#8b6b33", "stroke-width": 1.2 }, rosa);
      el("path", { d: "M0,-20 L5,0 L0,20 L-5,0 Z", fill: "#8b6b33" }, rosa);
      el("path", { d: "M-20,0 L0,-5 L20,0 L0,5 Z", fill: "#c2a878" }, rosa);
    }

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
      const sellos = C.id && SELLOS[C.id];
      emblema(s, sellos ? sellos[i] : (cap.jefe ? 10 : cap.id), 0, 1, 1.18);
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
