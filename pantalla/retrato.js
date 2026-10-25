// Rediseño del 25 oct 2026 (maqueta rediseno-versiones.html, versión 2): piezas de dibujo de la interfaz nueva.
//  · isla(): la islita de hexágonos con grosor, árboles, montaña, agua y un castillo pequeño (cabecera del inicio)
//  · nodo(): el héroe de pie sobre una casilla de hierba, con la bandera de su facción al viento detrás
// La bandera es tela de verdad: se parte en tiras verticales que suben y bajan con una onda que nace quieta en el mástil
// y crece hacia la punta; cada tira se aclara o se oscurece según su pendiente (los pliegues cogen luz o sombra), el
// contorno con el picado a la derecha recorta las tiras y el símbolo de la facción va pegado a la tela.
window.FWM = window.FWM || {};

FWM.retrato = (function () {
  const NS = "http://www.w3.org/2000/svg";

  // ---------- la islita ----------
  function isla() {
    const r = 17, w = Math.sqrt(3) * r, cx0 = 187, cy0 = 118;
    const celdas = [[-3, 0, "p"], [-2, 0, "b"], [-1, 0, "p"], [0, 0, "c"], [1, 0, "p"], [2, 0, "b"], [3, 0, "p"], [-2.5, -1, "p"], [-1.5, -1, "b"], [-.5, -1, "p"], [.5, -1, "p"], [1.5, -1, "m"], [2.5, -1, "p"], [-2.5, 1, "a"], [-1.5, 1, "p"], [-.5, 1, "p"], [.5, 1, "b"], [1.5, 1, "p"], [2.5, 1, "a"], [-1, -2, "p"], [0, -2, "b"], [1, -2, "p"]];
    const col = { p: ["#93c56f", "#6a9c4c"], b: ["#5aa458", "#3d7e3f"], m: ["#bdb39b", "#938a72"], a: ["#5fb0dc", "#3c8cbb"], c: ["#e6c470", "#bf9a44"] };
    const hex = (x, y) => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 180 * (60 * i - 30); return `${(x + r * Math.cos(a)).toFixed(1)},${(y + r * .62 * Math.sin(a)).toFixed(1)}`; }).join(" ");
    let s = `<ellipse cx="${cx0}" cy="${cy0 + 34}" rx="150" ry="16" fill="rgba(64,86,74,.12)"/>`;
    for (const [q, f, t] of celdas.slice().sort((a, b) => a[1] - b[1])) {
      const x = cx0 + q * w, y = cy0 + f * r * .93;
      s += `<polygon points="${hex(x, y + 7)}" fill="${col[t][1]}"/><polygon points="${hex(x, y)}" fill="${col[t][0]}" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>`;
      if (t === "b") s += `<circle cx="${x - 5}" cy="${y - 7}" r="6" fill="#2f7a3b"/><circle cx="${x + 5}" cy="${y - 5}" r="5" fill="#3e8c45"/><rect x="${x - 6}" y="${y - 2}" width="2" height="4" fill="#9a7a5c"/>`;
      if (t === "m") s += `<path d="M${x - 9} ${y + 2} L${x} ${y - 14} L${x + 9} ${y + 2}Z" fill="#c4bba8"/><path d="M${x - 3} ${y - 9} L${x} ${y - 14} L${x + 3} ${y - 9}Z" fill="#fff"/>`;
      if (t === "c") s += `<g stroke="#5a4a36" stroke-width="1" stroke-linejoin="round">
        <rect x="${x - 7}" y="${y - 11}" width="14" height="9" fill="#efe6d4"/>
        <path d="M${x - 7} ${y - 11}v-2h2.5v2h2v-2h2.5v2h2v-2h2.5v2" fill="none"/>
        <rect x="${x - 10}" y="${y - 16}" width="5" height="14" fill="#e6dcc7"/><rect x="${x + 5}" y="${y - 16}" width="5" height="14" fill="#e6dcc7"/>
        <path d="M${x - 10.6} ${y - 16}l3.1 -5l3.1 5z" fill="#d4452f"/><path d="M${x + 4.4} ${y - 16}l3.1 -5l3.1 5z" fill="#d4452f"/>
        <path d="M${x - 2} ${y - 2}v-3.5a2 2 0 0 1 4 0v3.5z" fill="#6b5640"/>
        <path d="M${x + 7.5} ${y - 21}v-6"/><path d="M${x + 7.5} ${y - 27}l5 1.7 -5 1.7z" fill="#c8102e" stroke="none"/></g>`;
    }
    return `<svg class="isla-svg" viewBox="0 0 375 178" aria-hidden="true">${s}</svg>`;
  }

  // ---------- el retrato: héroe sobre su casilla, bandera detrás ----------
  // tam: ancho del retrato en píxeles (alto ≈ tam × 146/140). heroe: el de paraPartida, con nivel. faccion: id.
  function nodo(heroe, faccion, tam, color) {
    const d = document.createElement("div"); d.className = "retrato"; d.style.width = tam + "px"; d.style.height = Math.round(tam * 146 / 140) + "px";
    d.innerHTML = `<svg viewBox="0 0 140 146" aria-hidden="true">
      <line x1="36" y1="2" x2="36" y2="112" stroke="#2b2620" stroke-width="3.5" stroke-linecap="round"/>
      <g class="tela"></g>
      <circle cx="36" cy="3" r="3.5" fill="#f2c94c" stroke="#2b2620" stroke-width="2"/>
      <polygon points="70,106 112,118 70,130 28,118" fill="#93c56f"/>
      <polygon points="28,118 70,130 70,140 28,128" fill="#6a9c4c"/><polygon points="112,118 70,130 70,140 112,128" fill="#557f3c"/>
      <circle cx="44" cy="117" r="3" fill="#6a9c4c"/><circle cx="96" cy="114" r="2.4" fill="#6a9c4c"/>
    </svg>`;
    // el héroe del juego (canvas), con sus objetos, de pie sobre la casilla
    // medido en el dibujo: los pies quedan al 89 % del alto del lienzo y el cuerpo, centrado al 48 %
    const h = Math.round(tam * .8);
    const fig = FWM.figuras.canvasHeroe(Object.assign({ faccion }, heroe), color || "#2f6fd6", h, true);
    fig.className = "retrato-heroe"; fig.style.width = fig.style.height = h + "px";
    fig.style.left = Math.round(tam * .5 - h * .48) + "px"; fig.style.top = Math.round(tam * .857 - h * .89) + "px";
    d.appendChild(fig);
    const f = FWM.datosBase.facciones[faccion] || { color: "#c8102e" };
    montarBandera(d.querySelector(".tela"), f.color, FWM.emblemas.simbolo ? FWM.emblemas.simbolo(faccion) : "");
    return d;
  }

  // ---------- bandera al viento ----------
  const X0 = 36, X1 = 94, MUESCA = 84, ARR = 6, ABA = 46, TIRAS = 18;
  const vivas = new Set(); let corriendo = false; let idClip = 0;
  const rgb = (hex) => { const n = parseInt(hex.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  function montarBandera(g, color, simbolo) {
    const id = "fwm-tela-" + (++idClip);
    g.innerHTML = `<defs><clipPath id="${id}"><path/></clipPath></defs><g clip-path="url(#${id})"></g>
      <path fill="none" stroke="#2b2620" stroke-width="2.4" stroke-linejoin="round"/>
      <g><svg x="49" y="11" width="27" height="27" viewBox="14 14 72 72">${simbolo}</svg></g>`;
    const tiras = g.children[1];
    for (let i = 0; i < TIRAS; i++) tiras.appendChild(document.createElementNS(NS, "path"));
    const b = { g, clip: g.querySelector("clipPath path"), tiras: [...tiras.children], borde: g.children[2], simbolo: g.children[3], base: rgb(color), fase: Math.random() * 3 };
    vivas.add(b); pintar(b, 0);
    if (!corriendo && !quieto()) { corriendo = true; requestAnimationFrame(bucle); }
  }
  const quieto = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const onda = (x, t, ret) => {
    const u = (x - X0) / (X1 - X0); const a = 3.4 * Math.pow(u, 1.3);
    return a * Math.sin(2 * Math.PI * (1.15 * u - t / 1.5 - ret)) + .9 * u * Math.sin(2 * Math.PI * (2.4 * u - t / .8 - ret));
  };
  const recoge = (x, t) => { const u = (x - X0) / (X1 - X0); return X0 + (x - X0) * (1 - .045 * u * (1 + Math.sin(2 * Math.PI * (t / 1.5)))); };
  const pt = (x, y, t, ret) => `${recoge(x, t).toFixed(2)} ${(y + onda(x, t, ret)).toFixed(2)}`;
  function pintar(b, t) {
    t += b.fase;
    let d = `M${pt(X0, ARR, t, 0)}`;
    for (let x = X0 + 4; x <= X1; x += 4) d += ` L${pt(Math.min(x, X1), ARR, t, 0)}`;
    d += ` L${pt(MUESCA, (ARR + ABA) / 2, t, .03)} L${pt(X1, ABA, t, .06)}`;
    for (let x = X1 - 4; x >= X0; x -= 4) d += ` L${pt(Math.max(x, X0), ABA, t, .06)}`;
    d += " Z";
    b.clip.setAttribute("d", d); b.borde.setAttribute("d", d);
    const ancho = (X1 - X0) / TIRAS;
    b.tiras.forEach((tira, i) => {
      const xa = X0 + i * ancho, xb = xa + ancho + .6;
      tira.setAttribute("d", `M${pt(xa, ARR - 6, t, 0)} L${pt(xb, ARR - 6, t, 0)} L${pt(xb, ABA + 6, t, .06)} L${pt(xa, ABA + 6, t, .06)} Z`);
      const pend = (onda(xb, t, .03) - onda(xa, t, .03)) / ancho;
      const luz = Math.max(.72, Math.min(1.22, 1 - pend * .55));
      tira.setAttribute("fill", `rgb(${b.base.map(c => Math.min(255, Math.round(c * luz + (luz > 1 ? (luz - 1) * 120 : 0)))).join(",")})`);
    });
    const xc = 62, yc = 25, dy = onda(xc, t, .03), ang = Math.atan((onda(xc + 2, t, .03) - onda(xc - 2, t, .03)) / 4) * 180 / Math.PI;
    b.simbolo.setAttribute("transform", `translate(${(recoge(xc, t) - xc).toFixed(2)} ${dy.toFixed(2)}) rotate(${ang.toFixed(1)} ${xc} ${yc})`);
  }
  const t0 = performance.now();
  function bucle(ahora) {
    const t = (ahora - t0) / 1000;
    for (const b of vivas) { if (!b.g.isConnected) { vivas.delete(b); continue; } if (b.g.getBoundingClientRect().width) pintar(b, t); }
    if (vivas.size) requestAnimationFrame(bucle); else corriendo = false;
  }

  return { isla, nodo };
})();
