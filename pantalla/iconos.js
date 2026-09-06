// Iconos dibujados con código. Cada uno es una función (ctx, x, y, s, color).
// s = "tamaño" (radio aproximado). Para sustituirlos por imágenes en el
// futuro basta con cambiar estas funciones.
window.FWM = window.FWM || {};

FWM.iconos = (function () {
  const I = {};

  function trazo(ctx, color, ancho) { ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.lineCap = "round"; ctx.lineJoin = "round"; }

  // ---- tropas (dibujadas en blanco/oscuro sobre el círculo del jugador) ----
  I.campesino = (ctx, x, y, s, c) => { // horca
    trazo(ctx, c, s * .18);
    ctx.beginPath(); ctx.moveTo(x, y + s * .8); ctx.lineTo(x, y - s * .3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s * .45, y - s * .2); ctx.lineTo(x - s * .45, y - s * .8);
    ctx.moveTo(x, y - s * .3); ctx.lineTo(x, y - s * .85);
    ctx.moveTo(x + s * .45, y - s * .2); ctx.lineTo(x + s * .45, y - s * .8);
    ctx.moveTo(x - s * .45, y - s * .2); ctx.lineTo(x + s * .45, y - s * .2); ctx.stroke();
  };
  I.lancero = (ctx, x, y, s, c) => { // lanza y escudo
    trazo(ctx, c, s * .18);
    ctx.beginPath(); ctx.moveTo(x - s * .3, y + s * .85); ctx.lineTo(x + s * .35, y - s * .75); ctx.stroke();
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x + s * .35, y - s * .95); ctx.lineTo(x + s * .55, y - s * .55); ctx.lineTo(x + s * .15, y - s * .6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(x - s * .25, y + s * .1, s * .38, 0, Math.PI * 2); ctx.stroke();
  };
  I.espadachin = (ctx, x, y, s, c) => { // espada
    trazo(ctx, c, s * .2);
    ctx.beginPath(); ctx.moveTo(x - s * .35, y + s * .75); ctx.lineTo(x + s * .45, y - s * .7); ctx.stroke(); // hoja
    ctx.beginPath(); ctx.moveTo(x - s * .55, y + s * .15); ctx.lineTo(x - s * .05, y + s * .55); ctx.stroke(); // guarda
    ctx.beginPath(); ctx.moveTo(x - s * .35, y + s * .75); ctx.lineTo(x - s * .6, y + s * .95); ctx.stroke(); // empuñadura
  };
  I.arquero = (ctx, x, y, s, c) => { // arco y flecha
    trazo(ctx, c, s * .16);
    ctx.beginPath(); ctx.arc(x - s * .1, y, s * .75, -Math.PI * .42, Math.PI * .42); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s * .1 + s * .75 * Math.cos(-Math.PI * .42), y + s * .75 * Math.sin(-Math.PI * .42));
    ctx.lineTo(x - s * .1 + s * .75 * Math.cos(Math.PI * .42), y + s * .75 * Math.sin(Math.PI * .42)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s * .55, y); ctx.lineTo(x + s * .8, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + s * .8, y); ctx.lineTo(x + s * .55, y - s * .18); ctx.moveTo(x + s * .8, y); ctx.lineTo(x + s * .55, y + s * .18); ctx.stroke();
  };
  I.caballero = (ctx, x, y, s, c) => { // cabeza de caballo (silueta simple)
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - s * .55, y + s * .8);
    ctx.lineTo(x - s * .5, y);
    ctx.lineTo(x - s * .2, y - s * .5);
    ctx.lineTo(x - s * .1, y - s * .9);
    ctx.lineTo(x + s * .15, y - s * .55);
    ctx.lineTo(x + s * .6, y - s * .35);
    ctx.lineTo(x + s * .7, y - s * .05);
    ctx.lineTo(x + s * .35, y + s * .05);
    ctx.lineTo(x + s * .2, y + s * .3);
    ctx.lineTo(x + s * .15, y + s * .8);
    ctx.closePath(); ctx.fill();
  };
  I.catapulta = (ctx, x, y, s, c) => {
    trazo(ctx, c, s * .16);
    ctx.beginPath(); ctx.moveTo(x - s * .7, y + s * .6); ctx.lineTo(x + s * .7, y + s * .6); ctx.stroke(); // base
    ctx.beginPath(); ctx.moveTo(x - s * .4, y + s * .6); ctx.lineTo(x + s * .55, y - s * .75); ctx.stroke(); // brazo
    ctx.beginPath(); ctx.moveTo(x - s * .2, y + s * .6); ctx.lineTo(x, y - s * .05); ctx.stroke(); // soporte
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + s * .62, y - s * .82, s * .2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - s * .5, y + s * .75, s * .16, 0, Math.PI * 2); ctx.arc(x + s * .5, y + s * .75, s * .16, 0, Math.PI * 2); ctx.fill();
  };

  // ---- asentamientos ----
  function casa(ctx, x, y, s, relleno, borde) {
    ctx.fillStyle = relleno; ctx.strokeStyle = borde; ctx.lineWidth = Math.max(1, s * .1);
    ctx.beginPath(); ctx.rect(x - s * .5, y - s * .1, s, s * .7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s * .65, y - s * .1); ctx.lineTo(x, y - s * .7); ctx.lineTo(x + s * .65, y - s * .1); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  I.pueblo = (ctx, x, y, s) => { casa(ctx, x, y + s * .1, s * .9, "#f5e6c8", "#5a4632"); };
  I.ciudad = (ctx, x, y, s) => {
    casa(ctx, x - s * .45, y + s * .25, s * .6, "#f5e6c8", "#5a4632");
    casa(ctx, x + s * .45, y + s * .25, s * .6, "#f5e6c8", "#5a4632");
    casa(ctx, x, y - s * .15, s * .75, "#f0d9a8", "#5a4632");
  };
  I.castillo = (ctx, x, y, s) => {
    ctx.fillStyle = "#cfc6b5"; ctx.strokeStyle = "#4a4035"; ctx.lineWidth = Math.max(1, s * .1);
    ctx.beginPath(); ctx.rect(x - s * .7, y - s * .2, s * 1.4, s * .85); ctx.fill(); ctx.stroke();
    // almenas
    for (let i = -3; i <= 3; i += 2) { ctx.beginPath(); ctx.rect(x + i * s * .2 - s * .1, y - s * .45, s * .2, s * .28); ctx.fill(); ctx.stroke(); }
    // torre central
    ctx.beginPath(); ctx.rect(x - s * .22, y - s * .9, s * .44, s * .75); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(x - s * .25, y - s * 1.05, s * .14, s * .2); ctx.rect(x + s * .11, y - s * 1.05, s * .14, s * .2); ctx.fill(); ctx.stroke();
    // puerta
    ctx.fillStyle = "#4a4035"; ctx.beginPath(); ctx.arc(x, y + s * .45, s * .2, Math.PI, 0); ctx.lineTo(x + s * .2, y + s * .65); ctx.lineTo(x - s * .2, y + s * .65); ctx.closePath(); ctx.fill();
  };

  // ---- yacimientos ----
  I.bosque = (ctx, x, y, s) => {
    const pino = (px, py, ps) => {
      ctx.fillStyle = "#2f6b3a"; ctx.beginPath(); ctx.moveTo(px, py - ps); ctx.lineTo(px + ps * .7, py + ps * .4); ctx.lineTo(px - ps * .7, py + ps * .4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#5a3a1e"; ctx.fillRect(px - ps * .12, py + ps * .4, ps * .24, ps * .35);
    };
    pino(x - s * .45, y + s * .15, s * .5); pino(x + s * .45, y + s * .15, s * .5); pino(x, y - s * .15, s * .62);
  };
  I.oro = (ctx, x, y, s) => {
    ctx.fillStyle = "#e8b923"; ctx.strokeStyle = "#8a6a10"; ctx.lineWidth = Math.max(1, s * .1);
    ctx.beginPath(); ctx.arc(x, y, s * .6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, s * .35, 0, Math.PI * 2); ctx.stroke();
  };
  I.estrellaClave = (ctx, x, y, s) => { I.estrella(ctx, x, y, s * .9, "#2a2419"); I.estrella(ctx, x, y, s * .68, "#1fa39a"); }; // turquesa: distinto del oro y de los reinos
  I.piedra = (ctx, x, y, s) => {
    ctx.fillStyle = "#9d9a93"; ctx.strokeStyle = "#4d4a45"; ctx.lineWidth = Math.max(1, s * .1);
    ctx.beginPath(); ctx.rect(x - s * .65, y, s * .6, s * .45); ctx.rect(x + s * .05, y, s * .6, s * .45); ctx.rect(x - s * .3, y - s * .45, s * .6, s * .45); ctx.fill(); ctx.stroke();
  };
  I.hierro = (ctx, x, y, s) => { // yunque
    ctx.fillStyle = "#4b4f5a"; ctx.strokeStyle = "#1e2026"; ctx.lineWidth = Math.max(1, s * .08);
    ctx.beginPath(); ctx.moveTo(x - s * .7, y - s * .35); ctx.lineTo(x + s * .7, y - s * .35); ctx.lineTo(x + s * .45, y); ctx.lineTo(x + s * .15, y); ctx.lineTo(x + s * .3, y + s * .45); ctx.lineTo(x - s * .3, y + s * .45); ctx.lineTo(x - s * .15, y); ctx.lineTo(x - s * .45, y); ctx.closePath(); ctx.fill(); ctx.stroke();
  };
  I.madera = (ctx, x, y, s) => { // tronco
    ctx.fillStyle = "#8a5a2b"; ctx.strokeStyle = "#4a2e12"; ctx.lineWidth = Math.max(1, s * .1);
    ctx.beginPath(); ctx.rect(x - s * .7, y - s * .3, s * 1.4, s * .6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#d9a86c"; ctx.beginPath(); ctx.ellipse(x + s * .7, y, s * .18, s * .3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  };

  // ---- marcas ----
  I.espada = (ctx, x, y, s, c) => {
    trazo(ctx, c, s * .2);
    ctx.beginPath(); ctx.moveTo(x - s * .5, y + s * .5); ctx.lineTo(x + s * .5, y - s * .5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s * .45, y - s * .05); ctx.lineTo(x + s * .05, y + s * .45); ctx.stroke();
  };
  I.arco = (ctx, x, y, s, c) => { I.arquero(ctx, x, y, s * .8, c); };
  I.estrella = (ctx, x, y, s, c) => {
    ctx.fillStyle = c; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? s * .45 : s; const a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); }
    ctx.closePath(); ctx.fill();
  };

  // Dibuja un icono de tropa en un canvas pequeño (para paneles HTML).
  function canvasTropa(tipo, color, tam) {
    const c = document.createElement("canvas");
    const dpr = window.devicePixelRatio || 1;
    c.width = tam * dpr; c.height = tam * dpr;
    const ctx = c.getContext("2d"); ctx.scale(dpr, dpr);
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(tam / 2, tam / 2, tam / 2 - 1, 0, Math.PI * 2); ctx.fill();
    (I[tipo] || I.campesino)(ctx, tam / 2, tam / 2, tam * .28, "#fff");
    return c;
  }
  // ---- terrenos (relieve sobre el color del hexágono) ----
  I.colina = (ctx, x, y, s) => {
    ctx.strokeStyle = "rgba(90,70,40,.55)"; ctx.lineWidth = Math.max(1, s * .12); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x - s * .7, y + s * .25); ctx.quadraticCurveTo(x - s * .3, y - s * .35, x + s * .05, y + s * .25); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s * .05, y + s * .5); ctx.quadraticCurveTo(x + s * .35, y - s * .05, x + s * .75, y + s * .5); ctx.stroke();
  };
  I.montana = (ctx, x, y, s) => {
    ctx.fillStyle = "#6f6b64"; ctx.strokeStyle = "#3f3c37"; ctx.lineWidth = Math.max(1, s * .08);
    ctx.beginPath(); ctx.moveTo(x - s * .8, y + s * .5); ctx.lineTo(x - s * .25, y - s * .5); ctx.lineTo(x + s * .1, y + s * .05); ctx.lineTo(x + s * .35, y - s * .3); ctx.lineTo(x + s * .8, y + s * .5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f4f4f2"; ctx.beginPath(); ctx.moveTo(x - s * .25, y - s * .5); ctx.lineTo(x - s * .1, y - s * .22); ctx.lineTo(x - s * .4, y - s * .22); ctx.closePath(); ctx.fill();
  };
  I.bosqueTerreno = (ctx, x, y, s) => {
    ctx.fillStyle = "rgba(40,90,50,.35)";
    for (const [dx, dy] of [[-.45, .2], [.4, .25], [0, -.25]]) { ctx.beginPath(); ctx.moveTo(x + dx * s, y + dy * s - s * .45); ctx.lineTo(x + dx * s + s * .3, y + dy * s + s * .2); ctx.lineTo(x + dx * s - s * .3, y + dy * s + s * .2); ctx.closePath(); ctx.fill(); }
  };
  I.carretera = (ctx, x, y, s) => {
    ctx.strokeStyle = "#8a6a3a"; ctx.lineWidth = Math.max(2, s * .3); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x - s * .8, y); ctx.lineTo(x + s * .8, y); ctx.stroke();
    ctx.strokeStyle = "#f0e2c0"; ctx.lineWidth = Math.max(1, s * .06); ctx.setLineDash([s * .25, s * .2]);
    ctx.beginPath(); ctx.moveTo(x - s * .8, y); ctx.lineTo(x + s * .8, y); ctx.stroke(); ctx.setLineDash([]);
  };

  // Un hexágono de terreno pequeño para el glosario.
  function canvasTerreno(id, color, tam) {
    const c = document.createElement("canvas");
    const dpr = window.devicePixelRatio || 1;
    c.width = tam * dpr; c.height = tam * dpr;
    const ctx = c.getContext("2d"); ctx.scale(dpr, dpr);
    const e = FWM.hex.esquinas(tam / 2, tam / 2, tam / 2 - 1);
    ctx.beginPath(); ctx.moveTo(e[0][0], e[0][1]); for (let i = 1; i < 6; i++) ctx.lineTo(e[i][0], e[i][1]); ctx.closePath();
    ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 1; ctx.stroke();
    const glifo = id === "bosque" ? I.bosqueTerreno : I[id];
    if (glifo) glifo(ctx, tam / 2, tam / 2, tam * .3);
    return c;
  }

  function canvasIcono(nombre, tam) {
    const c = document.createElement("canvas");
    const dpr = window.devicePixelRatio || 1;
    c.width = tam * dpr; c.height = tam * dpr;
    const ctx = c.getContext("2d"); ctx.scale(dpr, dpr);
    (I[nombre] || I.oro)(ctx, tam / 2, tam / 2, tam * .38, "#333");
    return c;
  }

  return { I, canvasTropa, canvasIcono, canvasTerreno };
})();
