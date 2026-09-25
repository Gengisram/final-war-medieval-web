// Figuras "cabezonas": personajes y edificios dibujados con código, estilo cómic
// (cabeza grande, contorno grueso, colores planos). Cada función: (ctx, x, y, s, op)
// s = radio aproximado de la figura. op = { color: color del reino, enemigo: bool }.
window.FWM = window.FWM || {};

FWM.figuras = (function () {
  const F = {};
  const TINTA = "#2a2419", PIEL = "#f6cfa6", PIEL2 = "#e0a878", METAL = "#c9cdd3", METAL2 = "#8c939c", MADERA = "#a5713e", MADERA2 = "#6e4626", PAJA = "#e8c35a";

  // Cada facción, su gente (13 sep 2026): el tono de piel y, en la infantería de siempre, lo que llevan en la cabeza.
  // Mismo estilo para todos (cabezones de cómic): nada de rasgos exagerados, solo ropa y color.
  const PIELES = { mali: "#8d5b3d", saladino: "#d9a878", mongoles: "#e8c093", vikingos: "#f8dcc0", eslavos: "#f7d6b4" };
  const piel = (op) => (op && op.faccion && PIELES[op.faccion]) || PIEL;
  // Tocado de la facción sobre la cabeza (sustituye al casco o gorro de siempre). Devuelve true si ha dibujado algo.
  function tocado(ctx, x, y, s, op) {
    const f = op && op.faccion; if (!f || f === "castilla") return false;
    borde(ctx, s);
    if (f === "vikingos") { // casco redondo de placas con nasal, sin cuernos (los cuernos son de ópera)
      ctx.beginPath(); ctx.arc(x, y - s * .2, s * .52, Math.PI, 0); ctx.closePath(); relleno(ctx, METAL2);
      ctx.strokeStyle = TINTA; ctx.lineWidth = Math.max(1.2, s * .06); ctx.beginPath(); ctx.moveTo(x, y - s * .72); ctx.lineTo(x, y - s * .2); ctx.stroke();
      borde(ctx, s); redondo(ctx, x, y - s * .22, s * 1.06, s * .12, s * .05, METAL);
      ctx.strokeStyle = TINTA; ctx.lineWidth = Math.max(1.5, s * .08); ctx.beginPath(); ctx.moveTo(x, y - s * .2); ctx.lineTo(x, y + s * .02); ctx.stroke();
      return true;
    }
    if (f === "inglaterra") { // capelina: sombrero de hierro de ala ancha
      ctx.beginPath(); ctx.ellipse(x, y - s * .38, s * .74, s * .15, 0, 0, Math.PI * 2); relleno(ctx, METAL2);
      ctx.beginPath(); ctx.arc(x, y - s * .4, s * .4, Math.PI, 0); ctx.closePath(); relleno(ctx, METAL);
      return true;
    }
    if (f === "mali") { // gorro alto de tela añil con banda blanca
      poligono(ctx, [[x - s * .44, y - s * .28], [x - s * .36, y - s * .82], [x, y - s * .96], [x + s * .36, y - s * .82], [x + s * .44, y - s * .28]], "#2f3f78");
      redondo(ctx, x, y - s * .33, s * .92, s * .14, s * .06, "#f2ede0");
      return true;
    }
    if (f === "saladino") { // turbante blanco enrollado sobre un casco con punta
      poligono(ctx, [[x - s * .14, y - s * .7], [x, y - s * 1.0], [x + s * .14, y - s * .7]], METAL);
      ctx.beginPath(); ctx.ellipse(x, y - s * .5, s * .5, s * .24, 0, Math.PI, 0); ctx.closePath(); relleno(ctx, "#f4efe2");
      redondo(ctx, x, y - s * .32, s * 1.0, s * .18, s * .09, "#f4efe2");
      ctx.strokeStyle = "#c9bfa6"; ctx.lineWidth = Math.max(1, s * .04); ctx.beginPath(); ctx.moveTo(x - s * .42, y - s * .38); ctx.quadraticCurveTo(x, y - s * .5, x + s * .42, y - s * .3); ctx.stroke();
      return true;
    }
    if (f === "eslavos") { // gorro redondo de lana parda con ancha banda de piel (sin nada de ningún país concreto)
      ctx.beginPath(); ctx.arc(x, y - s * .3, s * .44, Math.PI, 0); ctx.closePath(); relleno(ctx, "#6b4a2b");
      redondo(ctx, x, y - s * .3, s * 1.02, s * .2, s * .1, "#b9a589");
      ctx.fillStyle = "#8f7a5e"; for (const dx of [-.36, -.18, 0, .18, .36]) { ctx.beginPath(); ctx.arc(x + dx * s, y - s * .31, s * .03, 0, Math.PI * 2); ctx.fill(); }
      return true;
    }
    if (f === "mongoles") { // gorro cónico de fieltro con ala de piel
      poligono(ctx, [[x - s * .4, y - s * .36], [x, y - s * 1.02], [x + s * .4, y - s * .36]], "#b8423a");
      ctx.beginPath(); ctx.ellipse(x, y - s * .34, s * .56, s * .15, 0, 0, Math.PI * 2); relleno(ctx, "#7a5230");
      ctx.fillStyle = "#5c3d22"; for (const dx of [-.34, -.12, .12, .34]) { ctx.beginPath(); ctx.arc(x + dx * s, y - s * .34, s * .035, 0, Math.PI * 2); ctx.fill(); }
      return true;
    }
    return false;
  }

  function borde(ctx, s) { ctx.strokeStyle = TINTA; ctx.lineWidth = Math.max(1.2, s * .09); ctx.lineJoin = "round"; ctx.lineCap = "round"; }
  function relleno(ctx, color) { ctx.fillStyle = color; ctx.fill(); ctx.stroke(); }
  function circulo(ctx, x, y, r, color) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); relleno(ctx, color); }
  function redondo(ctx, x, y, w, h, r, color) {
    ctx.beginPath(); ctx.moveTo(x - w / 2 + r, y - h / 2);
    ctx.arcTo(x + w / 2, y - h / 2, x + w / 2, y + h / 2, r); ctx.arcTo(x + w / 2, y + h / 2, x - w / 2, y + h / 2, r);
    ctx.arcTo(x - w / 2, y + h / 2, x - w / 2, y - h / 2, r); ctx.arcTo(x - w / 2, y - h / 2, x + w / 2, y - h / 2, r); ctx.closePath();
    relleno(ctx, color);
  }
  function poligono(ctx, puntos, color) {
    ctx.beginPath(); ctx.moveTo(puntos[0][0], puntos[0][1]);
    for (let i = 1; i < puntos.length; i++) ctx.lineTo(puntos[i][0], puntos[i][1]);
    ctx.closePath(); relleno(ctx, color);
  }
  // cara: ojos de punto y boca (sonrisa si es tuya, ceño si es enemiga)
  function cara(ctx, x, y, r, op) {
    ctx.fillStyle = TINTA;
    ctx.beginPath(); ctx.arc(x - r * .3, y - r * .05, r * .11, 0, Math.PI * 2); ctx.arc(x + r * .3, y - r * .05, r * .11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = TINTA; ctx.lineWidth = Math.max(1, r * .08); ctx.beginPath();
    if (op && op.enemigo) { ctx.moveTo(x - r * .28, y + r * .45); ctx.quadraticCurveTo(x, y + r * .25, x + r * .28, y + r * .45); ctx.stroke();
      // cejas de enfado
      ctx.beginPath(); ctx.moveTo(x - r * .45, y - r * .38); ctx.lineTo(x - r * .15, y - r * .25); ctx.moveTo(x + r * .45, y - r * .38); ctx.lineTo(x + r * .15, y - r * .25); ctx.stroke();
    } else { ctx.moveTo(x - r * .28, y + r * .3); ctx.quadraticCurveTo(x, y + r * .55, x + r * .28, y + r * .3); ctx.stroke(); }
    // mejillas
    ctx.fillStyle = op && op.faccion === "mali" ? "rgba(190,80,70,.35)" : "rgba(230,120,110,.45)"; ctx.beginPath(); ctx.arc(x - r * .5, y + r * .25, r * .14, 0, Math.PI * 2); ctx.arc(x + r * .5, y + r * .25, r * .14, 0, Math.PI * 2); ctx.fill();
  }
  // cuerpo pequeño bajo la cabeza, del color del reino; y la cabeza encima
  function cuerpo(ctx, x, y, s, op) {
    borde(ctx, s);
    redondo(ctx, x, y + s * .55, s * .8, s * .7, s * .2, op.color || "#888");
    // pies
    ctx.beginPath(); ctx.ellipse(x - s * .2, y + s * .92, s * .17, s * .1, 0, 0, Math.PI * 2); relleno(ctx, TINTA);
    ctx.beginPath(); ctx.ellipse(x + s * .2, y + s * .92, s * .17, s * .1, 0, 0, Math.PI * 2); relleno(ctx, TINTA);
  }
  function cabeza(ctx, x, y, s, op) {
    borde(ctx, s);
    circulo(ctx, x, y - s * .05, s * .5, piel(op));
    cara(ctx, x, y - s * .05, s * .5, op);
  }

  // ---------- tropas ----------
  F.campesino = (ctx, x, y, s, op) => {
    op = op || {};
    cuerpo(ctx, x, y, s, op);
    // horca a la derecha
    borde(ctx, s); ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .11);
    ctx.beginPath(); ctx.moveTo(x + s * .62, y + s * .9); ctx.lineTo(x + s * .62, y - s * .55); ctx.stroke();
    ctx.strokeStyle = METAL2; ctx.beginPath();
    for (const dx of [-.15, 0, .15]) { ctx.moveTo(x + s * .62 + dx * s, y - s * .55); ctx.lineTo(x + s * .62 + dx * s, y - s * .85); }
    ctx.moveTo(x + s * .47, y - s * .55); ctx.lineTo(x + s * .77, y - s * .55); ctx.stroke();
    cabeza(ctx, x, y, s, op);
    // sombrero de paja
    borde(ctx, s);
    ctx.beginPath(); ctx.ellipse(x, y - s * .42, s * .72, s * .16, 0, 0, Math.PI * 2); relleno(ctx, PAJA);
    ctx.beginPath(); ctx.arc(x, y - s * .45, s * .36, Math.PI, 0); ctx.closePath(); relleno(ctx, PAJA);
  };

  F.lancero = (ctx, x, y, s, op) => {
    op = op || {};
    cuerpo(ctx, x, y, s, op);
    // lanza muy alta
    borde(ctx, s); ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .1);
    ctx.beginPath(); ctx.moveTo(x + s * .6, y + s * .9); ctx.lineTo(x + s * .6, y - s * .75); ctx.stroke();
    borde(ctx, s); poligono(ctx, [[x + s * .6, y - s * 1.1], [x + s * .74, y - s * .72], [x + s * .46, y - s * .72]], METAL);
    // escudo redondo a la izquierda
    circulo(ctx, x - s * .55, y + s * .45, s * .3, op.color || "#888");
    circulo(ctx, x - s * .55, y + s * .45, s * .1, METAL);
    cabeza(ctx, x, y, s, op);
    // casco con nasal (o el tocado de su facción)
    if (tocado(ctx, x, y, s, op)) return;
    borde(ctx, s);
    ctx.beginPath(); ctx.arc(x, y - s * .2, s * .5, Math.PI, 0); ctx.closePath(); relleno(ctx, METAL);
    ctx.beginPath(); ctx.moveTo(x, y - s * .2); ctx.lineTo(x, y + s * .05); ctx.stroke();
  };

  F.espadachin = (ctx, x, y, s, op) => {
    op = op || {};
    cuerpo(ctx, x, y, s, op);
    cabeza(ctx, x, y, s, op);
    // pañuelo rojo en la cabeza (o el tocado de su facción)
    borde(ctx, s);
    if (!tocado(ctx, x, y, s, op)) {
      ctx.beginPath(); ctx.arc(x, y - s * .2, s * .5, Math.PI, 0); ctx.closePath(); relleno(ctx, "#c0392b");
      ctx.beginPath(); ctx.moveTo(x + s * .45, y - s * .25); ctx.lineTo(x + s * .8, y - s * .05); ctx.lineTo(x + s * .55, y - s * .1); ctx.closePath(); relleno(ctx, "#c0392b");
    }
    // espadón delante, en diagonal
    borde(ctx, s);
    ctx.save(); ctx.translate(x - s * .15, y + s * .45); ctx.rotate(-Math.PI / 4);
    redondo(ctx, 0, -s * .55, s * .2, s * 1.1, s * .05, METAL);
    ctx.beginPath(); ctx.moveTo(-s * .3, 0); ctx.lineTo(s * .3, 0); ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .12); ctx.stroke();
    ctx.restore();
  };

  F.arquero = (ctx, x, y, s, op) => {
    op = op || {};
    cuerpo(ctx, x, y, s, op);
    // arco a la izquierda
    borde(ctx, s); ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .1);
    ctx.beginPath(); ctx.arc(x - s * .55, y + s * .3, s * .55, Math.PI * .6, Math.PI * 1.4); ctx.stroke();
    ctx.strokeStyle = "#f5f0e0"; ctx.lineWidth = Math.max(1, s * .04);
    ctx.beginPath(); ctx.moveTo(x - s * .55 + s * .55 * Math.cos(Math.PI * .6), y + s * .3 + s * .55 * Math.sin(Math.PI * .6)); ctx.lineTo(x - s * .55 + s * .55 * Math.cos(Math.PI * 1.4), y + s * .3 + s * .55 * Math.sin(Math.PI * 1.4)); ctx.stroke();
    cabeza(ctx, x, y, s, op);
    // capucha verde con pluma (o el tocado de su facción)
    if (tocado(ctx, x, y, s, op)) return;
    borde(ctx, s);
    poligono(ctx, [[x - s * .56, y - s * .2], [x, y - s * 1.0], [x + s * .56, y - s * .2], [x + s * .5, y - s * .3], [x, y - s * .6], [x - s * .5, y - s * .3]], "#4c8a3f");
    ctx.beginPath(); ctx.moveTo(x + s * .2, y - s * .75); ctx.lineTo(x + s * .65, y - s * 1.0); ctx.strokeStyle = "#c0392b"; ctx.lineWidth = Math.max(2, s * .1); ctx.stroke();
  };

  F.caballero = (ctx, x, y, s, op) => {
    op = op || {};
    borde(ctx, s);
    // caballo regordete
    ctx.beginPath(); ctx.ellipse(x, y + s * .5, s * .95, s * .5, 0, 0, Math.PI * 2); relleno(ctx, MADERA);
    // cabeza del caballo a la derecha, grande
    ctx.beginPath(); ctx.ellipse(x + s * .92, y + s * .18, s * .36, s * .28, -.5, 0, Math.PI * 2); relleno(ctx, MADERA);
    ctx.beginPath(); ctx.moveTo(x + s * .8, y - s * .05); ctx.lineTo(x + s * .88, y - s * .38); ctx.lineTo(x + s * 1.02, y - s * .08); ctx.closePath(); relleno(ctx, MADERA); // oreja
    ctx.fillStyle = TINTA; ctx.beginPath(); ctx.arc(x + s * 1.0, y + s * .1, s * .06, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PIEL2; ctx.beginPath(); ctx.ellipse(x + s * 1.15, y + s * .32, s * .14, s * .1, -.5, 0, Math.PI * 2); ctx.fill(); // morro
    // patas
    for (const dx of [-.6, -.25, .25, .6]) { ctx.beginPath(); ctx.moveTo(x + dx * s, y + s * .85); ctx.lineTo(x + dx * s, y + s * 1.05); ctx.strokeStyle = TINTA; ctx.lineWidth = Math.max(2, s * .14); ctx.stroke(); }
    // gualdrapa del color del reino
    borde(ctx, s); redondo(ctx, x, y + s * .55, s * 1.05, s * .36, s * .1, op.color || "#888");
    // caballero encima (cuerpo pequeño + cabeza grande con yelmo)
    redondo(ctx, x, y + s * .1, s * .55, s * .5, s * .15, op.color || "#888");
    circulo(ctx, x, y - s * .35, s * .42, METAL);
    ctx.fillStyle = TINTA; ctx.fillRect(x - s * .3, y - s * .45, s * .6, s * .1); // ranura del yelmo
    // penacho
    borde(ctx, s); ctx.beginPath(); ctx.moveTo(x, y - s * .75); ctx.quadraticCurveTo(x - s * .3, y - s * 1.1, x - s * .55, y - s * .8); ctx.strokeStyle = "#c0392b"; ctx.lineWidth = Math.max(2, s * .14); ctx.stroke();
    // lanza
    ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .09); ctx.beginPath(); ctx.moveTo(x - s * .4, y + s * .5); ctx.lineTo(x + s * .5, y - s * .9); ctx.stroke();
  };

  F.catapulta = (ctx, x, y, s, op) => {
    op = op || {};
    borde(ctx, s);
    // ruedas
    circulo(ctx, x - s * .5, y + s * .75, s * .22, MADERA2); circulo(ctx, x + s * .5, y + s * .75, s * .22, MADERA2);
    // bastidor
    redondo(ctx, x, y + s * .55, s * 1.3, s * .22, s * .06, MADERA);
    poligono(ctx, [[x - s * .35, y + s * .45], [x - s * .05, y - s * .1], [x + s * .25, y + s * .45]], MADERA);
    // brazo con cuchara y piedra
    ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .13); ctx.beginPath(); ctx.moveTo(x - s * .3, y + s * .45); ctx.lineTo(x + s * .55, y - s * .75); ctx.stroke();
    circulo(ctx, x + s * .6, y - s * .82, s * .17, "#8c8a85");
    // operario cabezón asomando por detrás
    redondo(ctx, x - s * .65, y + s * .35, s * .38, s * .35, s * .1, op.color || "#888");
    circulo(ctx, x - s * .65, y - s * .05, s * .32, piel(op));
    cara(ctx, x - s * .65, y - s * .05, s * .32, Object.assign({}, op, { enemigo: false }));
    borde(ctx, s); ctx.beginPath(); ctx.arc(x - s * .65, y - s * .15, s * .32, Math.PI, 0); ctx.closePath(); relleno(ctx, METAL);
  };

  // ---------- unidades que abre el héroe por nivel ----------
  // Regla de estilo: nada tapa los ojos ni la boca; el color del reino va en el cuerpo o en el escudo.
  F.monje = (ctx, x, y, s, op) => {
    op = op || {};
    borde(ctx, s);
    // capucha caída por detrás, del color del reino
    circulo(ctx, x, y - s * .02, s * .62, op.color || "#888");
    // hábito pardo largo
    poligono(ctx, [[x - s * .42, y + s * .18], [x + s * .42, y + s * .18], [x + s * .54, y + s * .98], [x - s * .54, y + s * .98]], "#8a6a3a");
    // cordón y cruz
    ctx.strokeStyle = "#e8c35a"; ctx.lineWidth = Math.max(1.5, s * .06);
    ctx.beginPath(); ctx.moveTo(x - s * .38, y + s * .55); ctx.lineTo(x + s * .38, y + s * .55); ctx.stroke();
    ctx.lineWidth = Math.max(2, s * .08);
    // la cruz solo en los sanadores de los reinos cristianos; en Malí, Saladino y los mongoles, una bolsa de hierbas
    if (!op.faccion || ["castilla", "inglaterra", "vikingos"].includes(op.faccion)) { ctx.beginPath(); ctx.moveTo(x + s * .24, y + s * .55); ctx.lineTo(x + s * .24, y + s * .85); ctx.moveTo(x + s * .1, y + s * .66); ctx.lineTo(x + s * .38, y + s * .66); ctx.stroke(); }
    else { borde(ctx, s); redondo(ctx, x + s * .26, y + s * .72, s * .22, s * .2, s * .06, "#6f8a3a"); ctx.fillStyle = "#b5d67a"; ctx.beginPath(); ctx.arc(x + s * .26, y + s * .6, s * .06, 0, Math.PI * 2); ctx.fill(); }
    cabeza(ctx, x, y, s, op);
    if (tocado(ctx, x, y, s, op)) return; // el sanador de cada facción va con su tocado
    // tonsura: media corona de pelo por encima de las orejas
    ctx.strokeStyle = TINTA; ctx.lineWidth = Math.max(2, s * .1);
    ctx.beginPath(); ctx.arc(x, y - s * .05, s * .5, Math.PI * .82, Math.PI * .18, true); ctx.stroke();
  };

  F.ballestero = (ctx, x, y, s, op) => {
    op = op || {};
    cuerpo(ctx, x, y, s, op);
    cabeza(ctx, x, y, s, op);
    // gorro de fieltro con ala corta, por encima de la frente (o el tocado de su facción)
    borde(ctx, s);
    if (!tocado(ctx, x, y, s, op)) {
      ctx.beginPath(); ctx.ellipse(x, y - s * .42, s * .6, s * .12, 0, 0, Math.PI * 2); relleno(ctx, "#5a4632");
      ctx.beginPath(); ctx.arc(x, y - s * .46, s * .34, Math.PI, 0); ctx.closePath(); relleno(ctx, "#5a4632");
    }
    // ballesta cruzada por delante del pecho, baja
    borde(ctx, s);
    redondo(ctx, x, y + s * .66, s * 1.15, s * .16, s * .04, MADERA);
    ctx.strokeStyle = METAL2; ctx.lineWidth = Math.max(2, s * .1);
    ctx.beginPath(); ctx.arc(x + s * .5, y + s * .66, s * .34, Math.PI * .55, Math.PI * 1.45); ctx.stroke();
    ctx.strokeStyle = "#f5f0e0"; ctx.lineWidth = Math.max(1, s * .04);
    ctx.beginPath(); ctx.moveTo(x + s * .5 + s * .34 * Math.cos(Math.PI * .55), y + s * .66 + s * .34 * Math.sin(Math.PI * .55)); ctx.lineTo(x + s * .5 + s * .34 * Math.cos(Math.PI * 1.45), y + s * .66 + s * .34 * Math.sin(Math.PI * 1.45)); ctx.stroke();
    ctx.strokeStyle = TINTA; ctx.lineWidth = Math.max(1.5, s * .06);
    ctx.beginPath(); ctx.moveTo(x - s * .1, y + s * .66); ctx.lineTo(x + s * .62, y + s * .66); ctx.stroke();
  };

  F.alabardero = (ctx, x, y, s, op) => {
    op = op || {};
    cuerpo(ctx, x, y, s, op);
    // alabarda: asta larga, punta y hoja de hacha, a la derecha
    borde(ctx, s); ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .1);
    ctx.beginPath(); ctx.moveTo(x + s * .68, y + s * .95); ctx.lineTo(x + s * .68, y - s * .8); ctx.stroke();
    borde(ctx, s);
    poligono(ctx, [[x + s * .68, y - s * 1.15], [x + s * .78, y - s * .82], [x + s * .58, y - s * .82]], METAL);
    ctx.beginPath(); ctx.moveTo(x + s * .68, y - s * .78); ctx.quadraticCurveTo(x + s * 1.08, y - s * .72, x + s * .98, y - s * .3);
    ctx.quadraticCurveTo(x + s * .84, y - s * .42, x + s * .68, y - s * .36); ctx.closePath(); relleno(ctx, METAL);
    cabeza(ctx, x, y, s, op);
    // capacete de ala ancha, por encima de la frente (o el tocado de su facción)
    if (tocado(ctx, x, y, s, op)) return;
    borde(ctx, s);
    ctx.beginPath(); ctx.ellipse(x, y - s * .44, s * .66, s * .13, 0, 0, Math.PI * 2); relleno(ctx, METAL);
    ctx.beginPath(); ctx.arc(x, y - s * .46, s * .38, Math.PI, 0); ctx.closePath(); relleno(ctx, METAL);
  };

  F.infanteria_pesada = (ctx, x, y, s, op) => {
    op = op || {};
    cuerpo(ctx, x, y, s, op);
    // maza al hombro derecho
    borde(ctx, s); ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .1);
    ctx.beginPath(); ctx.moveTo(x + s * .7, y + s * .75); ctx.lineTo(x + s * .7, y - s * .35); ctx.stroke();
    borde(ctx, s); redondo(ctx, x + s * .7, y - s * .5, s * .32, s * .28, s * .07, METAL2);
    cabeza(ctx, x, y, s, op);
    // casco con carrilleras: casquete alto y dos piezas a los lados de la cara
    borde(ctx, s);
    ctx.beginPath(); ctx.arc(x, y - s * .22, s * .52, Math.PI, 0); ctx.closePath(); relleno(ctx, METAL);
    poligono(ctx, [[x - s * .52, y - s * .22], [x - s * .3, y - s * .22], [x - s * .34, y + s * .28], [x - s * .5, y + s * .18]], METAL2);
    poligono(ctx, [[x + s * .52, y - s * .22], [x + s * .3, y - s * .22], [x + s * .34, y + s * .28], [x + s * .5, y + s * .18]], METAL2);
    // escudo grande a la izquierda, apoyado en el suelo
    borde(ctx, s);
    ctx.beginPath(); ctx.moveTo(x - s * 1.02, y - s * .12); ctx.lineTo(x - s * .42, y - s * .12); ctx.lineTo(x - s * .42, y + s * .62);
    ctx.quadraticCurveTo(x - s * .72, y + s * 1.04, x - s * 1.02, y + s * .62); ctx.closePath(); relleno(ctx, op.color || "#888");
    ctx.strokeStyle = METAL; ctx.lineWidth = Math.max(1.5, s * .07);
    ctx.beginPath(); ctx.moveTo(x - s * .72, y - s * .08); ctx.lineTo(x - s * .72, y + s * .88); ctx.moveTo(x - s * .98, y + s * .24); ctx.lineTo(x - s * .46, y + s * .24); ctx.stroke();
  };

  F.caballeria_pesada = (ctx, x, y, s, op) => {
    op = op || {};
    borde(ctx, s);
    // caballo acorazado
    ctx.beginPath(); ctx.ellipse(x, y + s * .5, s * .98, s * .52, 0, 0, Math.PI * 2); relleno(ctx, "#6b4a2f");
    ctx.beginPath(); ctx.ellipse(x + s * .95, y + s * .18, s * .36, s * .28, -.5, 0, Math.PI * 2); relleno(ctx, "#6b4a2f");
    ctx.beginPath(); ctx.moveTo(x + s * .82, y - s * .05); ctx.lineTo(x + s * .9, y - s * .4); ctx.lineTo(x + s * 1.04, y - s * .08); ctx.closePath(); relleno(ctx, METAL); // testera
    ctx.fillStyle = TINTA; ctx.beginPath(); ctx.arc(x + s * 1.02, y + s * .1, s * .06, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = METAL2; ctx.beginPath(); ctx.ellipse(x + s * 1.18, y + s * .32, s * .14, s * .1, -.5, 0, Math.PI * 2); ctx.fill();
    for (const dx of [-.6, -.25, .25, .6]) { ctx.beginPath(); ctx.moveTo(x + dx * s, y + s * .88); ctx.lineTo(x + dx * s, y + s * 1.08); ctx.strokeStyle = TINTA; ctx.lineWidth = Math.max(2, s * .15); ctx.stroke(); }
    // gualdrapa larga con faldón dentado, del color del reino
    borde(ctx, s); redondo(ctx, x, y + s * .58, s * 1.1, s * .5, s * .08, op.color || "#888");
    ctx.beginPath(); ctx.moveTo(x - s * .55, y + s * .82);
    for (let i = 0; i < 5; i++) { ctx.lineTo(x - s * .55 + (i + .5) * s * .22, y + s * .96); ctx.lineTo(x - s * .55 + (i + 1) * s * .22, y + s * .82); }
    ctx.closePath(); relleno(ctx, op.color || "#888");
    // lanza en ristre, por detrás del jinete y fuera de la cara
    ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .12);
    ctx.beginPath(); ctx.moveTo(x - s * .75, y + s * .35); ctx.lineTo(x + s * .35, y - s * 1.05); ctx.stroke();
    borde(ctx, s); poligono(ctx, [[x + s * .35, y - s * 1.05], [x + s * .5, y - s * .72], [x + s * .18, y - s * .82]], METAL);
    // jinete: coraza de placas y cabeza con casco abierto y penacho
    borde(ctx, s);
    redondo(ctx, x, y + s * .08, s * .6, s * .54, s * .12, METAL);
    ctx.strokeStyle = METAL2; ctx.lineWidth = Math.max(1.5, s * .06);
    ctx.beginPath(); ctx.moveTo(x - s * .28, y + s * .02); ctx.lineTo(x + s * .28, y + s * .02); ctx.moveTo(x - s * .28, y + s * .2); ctx.lineTo(x + s * .28, y + s * .2); ctx.stroke();
    cabeza(ctx, x, y - s * .35, s * .92, op);
    borde(ctx, s);
    ctx.beginPath(); ctx.arc(x, y - s * .58, s * .5, Math.PI, 0); ctx.closePath(); relleno(ctx, METAL);
    ctx.beginPath(); ctx.moveTo(x - s * .5, y - s * .58); ctx.lineTo(x + s * .5, y - s * .58); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - s * 1.06); ctx.quadraticCurveTo(x - s * .35, y - s * 1.42, x - s * .62, y - s * 1.08); ctx.strokeStyle = "#c0392b"; ctx.lineWidth = Math.max(2, s * .16); ctx.stroke();
  };

  F.trabuquete = (ctx, x, y, s, op) => {
    op = op || {};
    borde(ctx, s);
    // base y ruedas grandes
    circulo(ctx, x - s * .55, y + s * .8, s * .26, MADERA2); circulo(ctx, x + s * .55, y + s * .8, s * .26, MADERA2);
    redondo(ctx, x, y + s * .62, s * 1.4, s * .2, s * .05, MADERA);
    // caballete en A
    ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .12);
    ctx.beginPath(); ctx.moveTo(x - s * .45, y + s * .55); ctx.lineTo(x, y - s * .55); ctx.lineTo(x + s * .45, y + s * .55); ctx.stroke();
    ctx.lineWidth = Math.max(1.5, s * .07); ctx.beginPath(); ctx.moveTo(x - s * .24, y + s * .1); ctx.lineTo(x + s * .24, y + s * .1); ctx.stroke();
    // viga larga: contrapeso a la izquierda, honda con piedra a la derecha
    ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .11);
    ctx.beginPath(); ctx.moveTo(x - s * .75, y - s * .1); ctx.lineTo(x + s * .8, y - s * .95); ctx.stroke();
    borde(ctx, s); redondo(ctx, x - s * .8, y + s * .12, s * .42, s * .42, s * .06, "#6b6a66");
    ctx.strokeStyle = "#f5f0e0"; ctx.lineWidth = Math.max(1, s * .05);
    ctx.beginPath(); ctx.moveTo(x + s * .8, y - s * .95); ctx.lineTo(x + s * .95, y - s * .5); ctx.stroke();
    circulo(ctx, x + s * .98, y - s * .4, s * .18, "#8c8a85");
  };

  // ---------- unidades propias de cada facción (13 sep 2026) ----------
  // Caballo cabezón de perfil, mirando a la derecha. pelo: color; gualdrapa: color del reino o null.
  function caballo(ctx, x, y, s, pelo, gualdrapa, op) {
    borde(ctx, s);
    ctx.beginPath(); ctx.ellipse(x, y + s * .5, s * .95, s * .5, 0, 0, Math.PI * 2); relleno(ctx, pelo);
    ctx.beginPath(); ctx.ellipse(x + s * .92, y + s * .18, s * .36, s * .28, -.5, 0, Math.PI * 2); relleno(ctx, pelo);
    ctx.beginPath(); ctx.moveTo(x + s * .8, y - s * .05); ctx.lineTo(x + s * .88, y - s * .38); ctx.lineTo(x + s * 1.02, y - s * .08); ctx.closePath(); relleno(ctx, pelo);
    ctx.fillStyle = TINTA; ctx.beginPath(); ctx.arc(x + s * 1.0, y + s * .1, s * .06, 0, Math.PI * 2); ctx.fill();
    for (const dx of [-.6, -.25, .25, .6]) { ctx.beginPath(); ctx.moveTo(x + dx * s, y + s * .85); ctx.lineTo(x + dx * s, y + s * 1.05); ctx.strokeStyle = TINTA; ctx.lineWidth = Math.max(2, s * .14); ctx.stroke(); }
    if (gualdrapa) { borde(ctx, s); redondo(ctx, x, y + s * .55, s * 1.05, s * .36, s * .1, gualdrapa); }
  }
  // Brillo dorado de la unidad propia en el nivel 10 de su facción: un ribete de oro alrededor.
  function dorada(ctx, x, y, s, op) {
    if (!op || !op.dorada) return;
    ctx.save(); ctx.strokeStyle = "#f2c230"; ctx.lineWidth = Math.max(1.5, s * .07); ctx.globalAlpha = .9;
    ctx.beginPath(); ctx.ellipse(x, y + s * .98, s * .9, s * .22, 0, 0, Math.PI * 2); ctx.stroke();
    FWM.iconos && FWM.iconos.I && FWM.iconos.I.estrella && FWM.iconos.I.estrella(ctx, x + s * .78, y - s * .82, s * .2, "#f2c230");
    ctx.restore();
  }

  // Castilla: caballero de la Orden de Santiago, sobre caballo blanco, capa blanca con la cruz-espada roja.
  F.caballero_santiago = (ctx, x, y, s, op) => {
    op = op || {};
    caballo(ctx, x, y, s, "#ece6da", op.color || "#888", op);
    // jinete: capa blanca con la cruz roja de Santiago
    borde(ctx, s); redondo(ctx, x, y + s * .1, s * .6, s * .54, s * .15, "#f6f2ea");
    ctx.strokeStyle = "#b3261e"; ctx.lineWidth = Math.max(2, s * .09);
    ctx.beginPath(); ctx.moveTo(x, y - s * .08); ctx.lineTo(x, y + s * .32); ctx.moveTo(x - s * .15, y + s * .04); ctx.lineTo(x + s * .15, y + s * .04); ctx.stroke();
    cabeza(ctx, x, y - s * .38, s * .86, op);
    borde(ctx, s); ctx.beginPath(); ctx.arc(x, y - s * .6, s * .46, Math.PI, 0); ctx.closePath(); relleno(ctx, METAL);
    ctx.beginPath(); ctx.moveTo(x, y - s * 1.04); ctx.quadraticCurveTo(x - s * .3, y - s * 1.36, x - s * .56, y - s * 1.04); ctx.strokeStyle = "#b3261e"; ctx.lineWidth = Math.max(2, s * .14); ctx.stroke();
    // escudo blanco con la cruz, a la izquierda
    borde(ctx, s); ctx.beginPath(); ctx.moveTo(x - s * .98, y - s * .08); ctx.lineTo(x - s * .5, y - s * .08); ctx.lineTo(x - s * .5, y + s * .36); ctx.quadraticCurveTo(x - s * .74, y + s * .66, x - s * .98, y + s * .36); ctx.closePath(); relleno(ctx, "#f6f2ea");
    ctx.strokeStyle = "#b3261e"; ctx.lineWidth = Math.max(2, s * .08); ctx.beginPath(); ctx.moveTo(x - s * .74, y - s * .02); ctx.lineTo(x - s * .74, y + s * .44); ctx.moveTo(x - s * .9, y + s * .12); ctx.lineTo(x - s * .58, y + s * .12); ctx.stroke();
    // lanza
    ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .09); ctx.beginPath(); ctx.moveTo(x + s * .1, y + s * .55); ctx.lineTo(x + s * .7, y - s * .95); ctx.stroke();
    dorada(ctx, x, y, s, op);
  };

  // Vikingos: berserker con piel de lobo sobre la cabeza, pecho descubierto y hacha a dos manos.
  F.berserker = (ctx, x, y, s, op) => {
    op = op || {};
    borde(ctx, s);
    // calzas del color del reino y torso desnudo
    redondo(ctx, x, y + s * .72, s * .78, s * .38, s * .12, op.color || "#888");
    redondo(ctx, x, y + s * .42, s * .72, s * .42, s * .2, piel(op));
    ctx.strokeStyle = "rgba(60,40,20,.35)"; ctx.lineWidth = Math.max(1, s * .04); ctx.beginPath(); ctx.moveTo(x - s * .16, y + s * .36); ctx.quadraticCurveTo(x, y + s * .46, x + s * .16, y + s * .36); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x - s * .2, y + s * .94, s * .17, s * .1, 0, 0, Math.PI * 2); borde(ctx, s); relleno(ctx, TINTA);
    ctx.beginPath(); ctx.ellipse(x + s * .2, y + s * .94, s * .17, s * .1, 0, 0, Math.PI * 2); relleno(ctx, TINTA);
    // hacha grande en diagonal, detrás
    ctx.save(); ctx.translate(x + s * .45, y + s * .5); ctx.rotate(-Math.PI / 6);
    ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .11); ctx.beginPath(); ctx.moveTo(0, s * .45); ctx.lineTo(0, -s * 1.05); ctx.stroke();
    borde(ctx, s); ctx.beginPath(); ctx.moveTo(0, -s * 1.05); ctx.quadraticCurveTo(s * .48, -s * 1.0, s * .42, -s * .52); ctx.quadraticCurveTo(s * .2, -s * .66, 0, -s * .6); ctx.closePath(); relleno(ctx, METAL);
    ctx.restore();
    // piel de lobo cayendo por los hombros, por detrás de la cabeza
    borde(ctx, s); poligono(ctx, [[x - s * .68, y + s * .34], [x - s * .5, y - s * .3], [x + s * .5, y - s * .3], [x + s * .68, y + s * .34], [x + s * .3, y + s * .26], [x - s * .3, y + s * .26]], "#7c6a58");
    cabeza(ctx, x, y, s, op);
    borde(ctx, s);
    // barba pelirroja trenzada
    poligono(ctx, [[x - s * .38, y + s * .1], [x + s * .38, y + s * .1], [x + s * .24, y + s * .46], [x, y + s * .6], [x - s * .24, y + s * .46]], "#c26a2a");
    ctx.fillStyle = TINTA; ctx.beginPath(); ctx.arc(x - s * .15, y - s * .07, s * .055, 0, Math.PI * 2); ctx.arc(x + s * .15, y - s * .07, s * .055, 0, Math.PI * 2); ctx.fill();
    // la cabeza del lobo encima de la frente, sin tapar los ojos
    borde(ctx, s); ctx.beginPath(); ctx.arc(x, y - s * .32, s * .46, Math.PI, 0); ctx.closePath(); relleno(ctx, "#8d7a66");
    poligono(ctx, [[x - s * .36, y - s * .62], [x - s * .22, y - s * .98], [x - s * .06, y - s * .7]], "#8d7a66");
    poligono(ctx, [[x + s * .36, y - s * .62], [x + s * .22, y - s * .98], [x + s * .06, y - s * .7]], "#8d7a66");
    ctx.fillStyle = TINTA; ctx.beginPath(); ctx.arc(x - s * .16, y - s * .52, s * .045, 0, Math.PI * 2); ctx.arc(x + s * .16, y - s * .52, s * .045, 0, Math.PI * 2); ctx.fill();
    dorada(ctx, x, y, s, op);
  };

  // Inglaterra: arquero largo, con un arco más alto que él, jubón acolchado y capelina.
  // Tribus eslavas: guardián del bosque, con un gran escudo redondo de roble, lanza larga y casco de punta con banda de piel.
  F.guardian_bosque = (ctx, x, y, s, op) => {
    op = op || {};
    cuerpo(ctx, x, y, s, op);
    // lanza muy alta a la derecha
    borde(ctx, s); ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .1);
    ctx.beginPath(); ctx.moveTo(x + s * .62, y + s * .92); ctx.lineTo(x + s * .62, y - s * .8); ctx.stroke();
    borde(ctx, s); poligono(ctx, [[x + s * .62, y - s * 1.16], [x + s * .76, y - s * .76], [x + s * .48, y - s * .76]], METAL);
    cabeza(ctx, x, y, s, op);
    // casco de punta con banda de piel
    borde(ctx, s);
    poligono(ctx, [[x - s * .46, y - s * .3], [x - s * .3, y - s * .74], [x, y - s * .96], [x + s * .3, y - s * .74], [x + s * .46, y - s * .3]], METAL2);
    redondo(ctx, x, y - s * .3, s * 1.0, s * .2, s * .1, "#b9a589");
    // el gran escudo de roble, delante del cuerpo a la izquierda: tablas, reborde de hierro y una hoja de roble pintada
    borde(ctx, s); circulo(ctx, x - s * .42, y + s * .45, s * .44, MADERA);
    ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = Math.max(1, s * .04);
    for (const dx of [-.2, 0, .2]) { ctx.beginPath(); ctx.moveTo(x - s * .42 + dx * s, y + s * .06); ctx.lineTo(x - s * .42 + dx * s, y + s * .84); ctx.stroke(); }
    ctx.strokeStyle = METAL2; ctx.lineWidth = Math.max(1.5, s * .07); ctx.beginPath(); ctx.arc(x - s * .42, y + s * .45, s * .4, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = op.color || "#3f6b35"; ctx.beginPath(); ctx.ellipse(x - s * .42, y + s * .45, s * .1, s * .2, .5, 0, Math.PI * 2); ctx.fill();
    borde(ctx, s); circulo(ctx, x - s * .42, y + s * .45, s * .07, METAL);
    dorada(ctx, x, y, s, op);
  };

  F.arquero_largo = (ctx, x, y, s, op) => {
    op = op || {};
    cuerpo(ctx, x, y, s, op);
    // costuras del jubón acolchado
    ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = Math.max(1, s * .04);
    for (const dx of [-.18, 0, .18]) { ctx.beginPath(); ctx.moveTo(x + dx * s, y + s * .26); ctx.lineTo(x + dx * s, y + s * .86); ctx.stroke(); }
    // aljaba a la espalda con flechas
    borde(ctx, s); redondo(ctx, x + s * .45, y + s * .15, s * .2, s * .6, s * .06, MADERA);
    ctx.strokeStyle = "#f5f0e0"; ctx.lineWidth = Math.max(1.5, s * .05); for (const dx of [.38, .46, .54]) { ctx.beginPath(); ctx.moveTo(x + dx * s, y - s * .15); ctx.lineTo(x + dx * s + s * .04, y - s * .35); ctx.stroke(); }
    // arco largo: de la cabeza a los pies y más
    borde(ctx, s); ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .1);
    ctx.beginPath(); ctx.moveTo(x - s * .62, y - s * 1.1); ctx.quadraticCurveTo(x - s * 1.08, y, x - s * .62, y + s * 1.08); ctx.stroke();
    ctx.strokeStyle = "#f5f0e0"; ctx.lineWidth = Math.max(1, s * .04); ctx.beginPath(); ctx.moveTo(x - s * .62, y - s * 1.1); ctx.lineTo(x - s * .62, y + s * 1.08); ctx.stroke();
    cabeza(ctx, x, y, s, op);
    borde(ctx, s);
    ctx.beginPath(); ctx.ellipse(x, y - s * .38, s * .74, s * .15, 0, 0, Math.PI * 2); relleno(ctx, METAL2);
    ctx.beginPath(); ctx.arc(x, y - s * .4, s * .4, Math.PI, 0); ctx.closePath(); relleno(ctx, METAL);
    dorada(ctx, x, y, s, op);
  };

  // Malí: jinete mandinga, con túnica larga blanca y añil, gorro alto, lanza y escudo redondo de cuero.
  F.jinete_mandinga = (ctx, x, y, s, op) => {
    op = op || {};
    caballo(ctx, x, y, s, "#a8703f", null, op);
    // manta de colores con flecos bajo la silla
    borde(ctx, s); redondo(ctx, x, y + s * .55, s * 1.0, s * .3, s * .08, op.color || "#888");
    ctx.fillStyle = "#e9c46a"; for (let i = 0; i < 6; i++) ctx.fillRect(x - s * .45 + i * s * .18, y + s * .69, s * .07, s * .12);
    // jinete: boubou blanco con franja añil
    borde(ctx, s); poligono(ctx, [[x - s * .32, y - s * .08], [x + s * .32, y - s * .08], [x + s * .42, y + s * .48], [x - s * .42, y + s * .48]], "#f4f1ea");
    ctx.fillStyle = "#2f3f78"; ctx.fillRect(x - s * .06, y - s * .06, s * .12, s * .52);
    cabeza(ctx, x, y - s * .4, s * .86, op);
    borde(ctx, s); poligono(ctx, [[x - s * .38, y - s * .6], [x - s * .3, y - s * 1.06], [x, y - s * 1.18], [x + s * .3, y - s * 1.06], [x + s * .38, y - s * .6]], "#2f3f78");
    redondo(ctx, x, y - s * .64, s * .8, s * .12, s * .05, "#f4f1ea");
    // escudo redondo de cuero a la izquierda y lanza
    circulo(ctx, x - s * .66, y + s * .12, s * .3, "#b98a52"); circulo(ctx, x - s * .66, y + s * .12, s * .09, "#e9c46a");
    ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .08); ctx.beginPath(); ctx.moveTo(x + s * .05, y + s * .5); ctx.lineTo(x + s * .62, y - s * 1.0); ctx.stroke();
    borde(ctx, s); poligono(ctx, [[x + s * .62, y - s * 1.0], [x + s * .75, y - s * .72], [x + s * .52, y - s * .78]], METAL);
    dorada(ctx, x, y, s, op);
  };

  // Saladino: mameluco con casco de punta, cota bajo una túnica de seda, escudo redondo y lanza.
  F.mameluco = (ctx, x, y, s, op) => {
    op = op || {};
    caballo(ctx, x, y, s, "#c9c3b6", null, op);
    // gualdrapa de seda con ribete dorado
    borde(ctx, s); redondo(ctx, x, y + s * .56, s * 1.08, s * .34, s * .1, op.color || "#888");
    ctx.strokeStyle = "#e8b923"; ctx.lineWidth = Math.max(1.5, s * .05); ctx.beginPath(); ctx.moveTo(x - s * .5, y + s * .68); ctx.lineTo(x + s * .5, y + s * .68); ctx.stroke();
    // jinete: cota de malla y túnica
    borde(ctx, s); redondo(ctx, x, y + s * .1, s * .62, s * .56, s * .15, METAL2);
    poligono(ctx, [[x - s * .3, y - s * .1], [x + s * .3, y - s * .1], [x + s * .22, y + s * .36], [x - s * .22, y + s * .36]], op.color || "#888");
    cabeza(ctx, x, y - s * .38, s * .86, op);
    // casco de punta con cubrenuca de malla
    borde(ctx, s); poligono(ctx, [[x - s * .46, y - s * .6], [x - s * .4, y - s * .84], [x, y - s * 1.2], [x + s * .4, y - s * .84], [x + s * .46, y - s * .6]], METAL);
    ctx.fillStyle = METAL2; ctx.fillRect(x - s * .5, y - s * .6, s * .1, s * .42); ctx.fillRect(x + s * .4, y - s * .6, s * .1, s * .42);
    // escudo redondo con estrella dorada
    borde(ctx, s); circulo(ctx, x - s * .7, y + s * .14, s * .3, "#8a2f2a");
    if (FWM.iconos && FWM.iconos.I && FWM.iconos.I.estrella) FWM.iconos.I.estrella(ctx, x - s * .7, y + s * .14, s * .16, "#e8b923");
    // lanza con banderola
    ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .08); ctx.beginPath(); ctx.moveTo(x + s * .05, y + s * .5); ctx.lineTo(x + s * .64, y - s * 1.05); ctx.stroke();
    borde(ctx, s); poligono(ctx, [[x + s * .56, y - s * .84], [x + s * .9, y - s * .74], [x + s * .5, y - s * .66]], "#e8b923");
    dorada(ctx, x, y, s, op);
  };

  // Mongoles: arquero a caballo en un caballo pequeño de la estepa, con gorro de piel y arco curvo.
  F.arquero_caballo = (ctx, x, y, s, op) => {
    op = op || {};
    // caballo de la estepa: bajo, pardo, crin oscura
    caballo(ctx, x, y + s * .05, s * .92, "#b58a55", null, op);
    ctx.strokeStyle = "#3f2c1a"; ctx.lineWidth = Math.max(2, s * .1); ctx.beginPath(); ctx.moveTo(x + s * .45, y + s * .2); ctx.quadraticCurveTo(x + s * .62, y - s * .02, x + s * .8, y - s * .05); ctx.stroke();
    // deel (túnica cruzada) del color del reino con ribete
    borde(ctx, s); redondo(ctx, x - s * .05, y + s * .12, s * .6, s * .56, s * .16, op.color || "#888");
    ctx.strokeStyle = "#e9c46a"; ctx.lineWidth = Math.max(1.5, s * .06); ctx.beginPath(); ctx.moveTo(x - s * .25, y - s * .08); ctx.lineTo(x + s * .15, y + s * .34); ctx.stroke();
    cabeza(ctx, x - s * .05, y - s * .36, s * .86, op);
    borde(ctx, s); poligono(ctx, [[x - s * .42, y - s * .66], [x - s * .05, y - s * 1.18], [x + s * .32, y - s * .66]], "#b8423a");
    ctx.beginPath(); ctx.ellipse(x - s * .05, y - s * .64, s * .5, s * .13, 0, 0, Math.PI * 2); relleno(ctx, "#7a5230");
    // arco compuesto con doble curva, tensado hacia delante
    ctx.strokeStyle = "#5a3a1e"; ctx.lineWidth = Math.max(2, s * .09);
    ctx.beginPath(); ctx.moveTo(x + s * .62, y - s * .62); ctx.quadraticCurveTo(x + s * .42, y - s * .3, x + s * .66, y - s * .1); ctx.quadraticCurveTo(x + s * .9, y + s * .1, x + s * .66, y + s * .42); ctx.stroke();
    ctx.strokeStyle = "#f5f0e0"; ctx.lineWidth = Math.max(1, s * .04); ctx.beginPath(); ctx.moveTo(x + s * .62, y - s * .62); ctx.lineTo(x + s * .25, y - s * .1); ctx.lineTo(x + s * .66, y + s * .42); ctx.stroke();
    ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(1.5, s * .05); ctx.beginPath(); ctx.moveTo(x + s * .25, y - s * .1); ctx.lineTo(x + s * 1.0, y - s * .12); ctx.stroke();
    dorada(ctx, x, y, s, op);
  };

  // ---------- asentamientos ----------
  function casa(ctx, x, y, s, pared, tejado) {
    borde(ctx, s);
    redondo(ctx, x, y + s * .3, s * 1.1, s * .8, s * .08, pared);
    poligono(ctx, [[x - s * .75, y - s * .05], [x, y - s * .85], [x + s * .75, y - s * .05]], tejado);
    // puerta y ventana
    redondo(ctx, x - s * .25, y + s * .45, s * .28, s * .45, s * .12, MADERA2);
    redondo(ctx, x + s * .28, y + s * .25, s * .28, s * .28, s * .05, "#9ed3e8");
  }
  // ---------- héroes: seis clases (una por facción); marca de nivel; adornos solo en tamaño grande (op.detalle) ----------
  // op = { color, enemigo, faccion, heroe: { clase, nivel, mejoras, leyenda }, detalle: bool }
  // Diez niveles (13 sep 2026): 8 hombreras doradas, 9 gala, 10 estandarte. La aureola es de la Leyenda, no de un nivel.
  const NIVEL_MARCA = { 2: "casco", 3: "cota", 4: "blason", 5: "capa", 6: "corona", 7: "manto", 8: "hombreras", 9: "gala", 10: "estandarte" };
  const CAPAS = { capa_verde: "#2e7d4f", capa_embajador: "#2e7d4f", capa_granate: "#7d1f2a", capa_azul: "#2f5c9a", capa_armino: "#f4f1ea", manto_estrellas: "#1d2b52", capa_oro: "#d8a722",
    capa_lobo: "#8d7a66", estandarte_dragon: "#9e2a22", capa_arquero: "#3f6b35", capa_leones: "#a3202c", capa_indigo: "#2f3f78", manto_dorado: "#e0b43a", capa_seda: "#1f6b62", capa_aguila: "#d9b13a", capa_abedul: "#cdbf9f", manto_primavera: "#3f8a3a", capa_fieltro: "#9c7b52", capa_estepa: "#4f86c6" };
  // Objetos del héroe: montura debajo (antes del cuerpo) y arma/escudo/cabeza encima (después).
  function dibujarObjetos(ctx, x, y, s, op, cuando) {
    const h = op.heroe || {}; const ob = h.objetos || {}; const O = (FWM.datosBase && FWM.datosBase.objetos) || {};
    const dib = (tipo) => { const o = O[ob[tipo]]; return o ? o.dibujo : null; };
    borde(ctx, s);
    if (cuando === "antes") {
      // sin saber montar, el caballo no se dibuja debajo: el héroe va a pie, como dicen sus números (23 sep 2026)
      const oM = O[ob.montura]; const aPie = oM && oM.requiereMonta && FWM.heroes && !FWM.heroes.sabeMontar(h);
      const m = aPie ? null : dib("montura");
      if (m) { // montura: cuerpo redondo detrás con cabeza a la derecha (mula gris, caballo marrón, corcel negro con gualdrapa)
        const col = m === "mula" ? "#9a9a9a" : m === "corcel" ? "#3a3a3a" : m === "poni" ? "#c08a55" : m === "barda" ? "#5a4a3a" : MADERA;
        ctx.beginPath(); ctx.ellipse(x, y + s * .62, s * .95, s * .42, 0, 0, Math.PI * 2); relleno(ctx, col);
        ctx.beginPath(); ctx.ellipse(x + s * .9, y + s * .3, s * .32, s * .24, -.5, 0, Math.PI * 2); relleno(ctx, col);
        if (m === "mula") { poligono(ctx, [[x + s * .78, y + s * .05], [x + s * .8, y - s * .35], [x + s * .95, y + s * .02]], col); poligono(ctx, [[x + s * .95, y + s * .05], [x + s * 1.05, y - s * .32], [x + s * 1.12, y + s * .08]], col); }
        else poligono(ctx, [[x + s * .8, y + s * .02], [x + s * .88, y - s * .3], [x + s * 1.02, y - s * .02]], col);
        for (const dx of [-.6, -.25, .25, .6]) { ctx.beginPath(); ctx.moveTo(x + dx * s, y + s * .95); ctx.lineTo(x + dx * s, y + s * 1.12); ctx.strokeStyle = TINTA; ctx.lineWidth = Math.max(2, s * .13); ctx.stroke(); }
        if (m === "corcel") { borde(ctx, s); redondo(ctx, x, y + s * .66, s * 1.0, s * .3, s * .08, op.color || "#888"); }
        if (m === "barda") { borde(ctx, s); redondo(ctx, x, y + s * .6, s * 1.1, s * .36, s * .08, METAL); ctx.beginPath(); ctx.ellipse(x + s * .9, y + s * .3, s * .26, s * .18, -.5, 0, Math.PI * 2); relleno(ctx, METAL); ctx.fillStyle = METAL2; for (const dx of [-.35, 0, .35]) { ctx.beginPath(); ctx.arc(x + dx * s, y + s * .6, s * .05, 0, Math.PI * 2); ctx.fill(); } }
      }
      return;
    }
    const a = dib("arma"), e = dib("escudo"), c = dib("cabeza");
    if (e) { // escudo a la izquierda (sustituye al escudo del blasón del nivel 4)
      if (e === "rodela") circulo(ctx, x - s * .62, y + s * .55, s * .24, MADERA);
      else if (e === "torre") redondo(ctx, x - s * .64, y + s * .5, s * .36, s * .62, s * .06, METAL2);
      else if (e === "reforzado") { redondo(ctx, x - s * .62, y + s * .55, s * .42, s * .5, s * .1, METAL2); borde(ctx, s); redondo(ctx, x - s * .62, y + s * .55, s * .26, s * .34, s * .06, op.color || "#888"); }
      else if (e === "puas") { const cx = x - s * .62, cy = y + s * .55; for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4; poligono(ctx, [[cx + Math.cos(an - .2) * s * .24, cy + Math.sin(an - .2) * s * .24], [cx + Math.cos(an) * s * .38, cy + Math.sin(an) * s * .38], [cx + Math.cos(an + .2) * s * .24, cy + Math.sin(an + .2) * s * .24]], METAL); } circulo(ctx, cx, cy, s * .26, MADERA2); circulo(ctx, cx, cy, s * .08, METAL); }
      else if (e === "blason") { redondo(ctx, x - s * .62, y + s * .55, s * .38, s * .46, s * .1, op.color || "#888"); ctx.fillStyle = "#ffd86b"; ctx.beginPath(); ctx.arc(x - s * .62, y + s * .55, s * .1, 0, Math.PI * 2); ctx.fill(); }
      else if (e === "egida") { circulo(ctx, x - s * .62, y + s * .55, s * .28, "#e8b923"); ctx.fillStyle = "#2f6fd6"; ctx.beginPath(); ctx.arc(x - s * .62, y + s * .55, s * .12, 0, Math.PI * 2); ctx.fill(); }
    }
    if (a && ARMA_CAMBIABLE.includes(h.clase)) { // arma a la derecha, EN LUGAR de la de su clase (la clase no dibuja la suya)
      if (a === "maza") { ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .1); ctx.beginPath(); ctx.moveTo(x + s * .66, y + s * .95); ctx.lineTo(x + s * .7, y - s * .2); ctx.stroke(); borde(ctx, s); const cx = x + s * .7, cy = y - s * .32; for (let i = 0; i < 6; i++) { const an = i * Math.PI / 3; poligono(ctx, [[cx + Math.cos(an - .35) * s * .16, cy + Math.sin(an - .35) * s * .16], [cx + Math.cos(an) * s * .28, cy + Math.sin(an) * s * .28], [cx + Math.cos(an + .35) * s * .16, cy + Math.sin(an + .35) * s * .16]], METAL2); } circulo(ctx, cx, cy, s * .18, METAL); }
      else if (a === "martillo") { ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .1); ctx.beginPath(); ctx.moveTo(x + s * .68, y + s * .95); ctx.lineTo(x + s * .68, y - s * .55); ctx.stroke(); borde(ctx, s); redondo(ctx, x + s * .68, y - s * .6, s * .5, s * .24, s * .05, METAL); }
      else if (a === "sable") { borde(ctx, s); ctx.beginPath(); ctx.moveTo(x + s * .56, y + s * .55); ctx.quadraticCurveTo(x + s * 1.12, y + s * .05, x + s * .8, y - s * .66); ctx.quadraticCurveTo(x + s * .84, y + s * .05, x + s * .72, y + s * .48); ctx.closePath(); relleno(ctx, METAL); ctx.strokeStyle = "#e8b923"; ctx.lineWidth = Math.max(2, s * .08); ctx.beginPath(); ctx.moveTo(x + s * .5, y + s * .55); ctx.lineTo(x + s * .8, y + s * .5); ctx.stroke(); }
      else if (a === "espada" || a === "espada_oro" || a === "mandoble" || a === "espada_larga") { ctx.save(); ctx.translate(x + s * .72, y + s * .5); ctx.rotate(Math.PI / 7); const largo = a === "mandoble" ? 1.5 : a === "espada_larga" ? 1.35 : 1.15; redondo(ctx, 0, -s * largo / 2, s * .16, s * largo, s * .04, a === "espada_oro" ? "#e8b923" : METAL); ctx.beginPath(); ctx.moveTo(-s * .25, 0); ctx.lineTo(s * .25, 0); ctx.strokeStyle = a === "espada_oro" ? "#8a5a10" : MADERA2; ctx.lineWidth = Math.max(2, s * .1); ctx.stroke(); ctx.restore(); }
      else if (a === "lanza") { ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .09); ctx.beginPath(); ctx.moveTo(x + s * .7, y + s * .95); ctx.lineTo(x + s * .7, y - s * .9); ctx.stroke(); borde(ctx, s); poligono(ctx, [[x + s * .7, y - s * 1.1], [x + s * .82, y - s * .8], [x + s * .58, y - s * .8]], METAL); }
      else if (a === "hacha") { ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .1); ctx.beginPath(); ctx.moveTo(x + s * .68, y + s * .95); ctx.lineTo(x + s * .68, y - s * .4); ctx.stroke(); borde(ctx, s); ctx.beginPath(); ctx.moveTo(x + s * .68, y - s * .5); ctx.quadraticCurveTo(x + s * 1.05, y - s * .45, x + s * .98, y - s * .05); ctx.quadraticCurveTo(x + s * .8, y - s * .18, x + s * .68, y - s * .08); ctx.closePath(); relleno(ctx, METAL); }
    }
    if (c) { // cabeza
      if (c === "gorro") { ctx.beginPath(); ctx.arc(x, y - s * .2, s * .56, Math.PI, 0); ctx.closePath(); relleno(ctx, "#8c5a3c"); circulo(ctx, x, y - s * .78, s * .1, "#f2e3c2"); } // tapa el casco de la clase
      else if (c === "yelmo") { ctx.beginPath(); ctx.arc(x, y - s * .22, s * .52, Math.PI, 0); ctx.closePath(); relleno(ctx, METAL); ctx.fillStyle = TINTA; ctx.fillRect(x - s * .3, y - s * .3, s * .6, s * .08); }
      else if (c === "casco_hierro") { ctx.beginPath(); ctx.arc(x, y - s * .2, s * .52, Math.PI, 0); ctx.closePath(); relleno(ctx, METAL2); circulo(ctx, x, y - s * .74, s * .07, METAL); }
      else if (c === "diadema") { redondo(ctx, x, y - s * .55, s * .8, s * .12, s * .05, "#e8b923"); ctx.fillStyle = "#2e9e4f"; ctx.beginPath(); ctx.arc(x, y - s * .55, s * .07, 0, Math.PI * 2); ctx.fill(); }
      else if (c === "cimera") { ctx.beginPath(); ctx.arc(x, y - s * .22, s * .52, Math.PI, 0); ctx.closePath(); relleno(ctx, METAL); ctx.fillStyle = TINTA; ctx.fillRect(x - s * .3, y - s * .3, s * .6, s * .08); borde(ctx, s); ctx.beginPath(); ctx.moveTo(x - s * .05, y - s * .72); ctx.quadraticCurveTo(x + s * .1, y - s * 1.25, x + s * .45, y - s * 1.05); ctx.quadraticCurveTo(x + s * .15, y - s * .95, x + s * .1, y - s * .7); ctx.closePath(); relleno(ctx, "#c8352b"); }
      else if (c === "laurel") { ctx.strokeStyle = "#2e9e4f"; ctx.lineWidth = Math.max(2, s * .1); ctx.beginPath(); ctx.arc(x, y - s * .15, s * .5, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
      else if (c === "corona_rey") { poligono(ctx, [[x - s * .4, y - s * .5], [x - s * .4, y - s * .9], [x - s * .2, y - s * .7], [x, y - s * 1.0], [x + s * .2, y - s * .7], [x + s * .4, y - s * .9], [x + s * .4, y - s * .5]], "#e8b923"); ctx.fillStyle = "#d63b3b"; ctx.beginPath(); ctx.arc(x, y - s * .62, s * .07, 0, Math.PI * 2); ctx.fill(); }
    }
    // capa de aspecto
  }
  // 15 sep 2026, a petición de Rodrigo: el héroe se viste por HUECOS y lo nuevo SUSTITUYE a lo de antes, no se pone
  // encima. Espalda: capa de aspecto > manto (7) > capa (5). Torso: armadura de gala (9) > hombreras (8) > cota (3).
  // Mano izquierda: escudo equipado > escudo del blasón (4). Cabeza: objeto de cabeza > corona (6) > casco de la
  // clase. Mano derecha: el arma equipada sustituye a la de la clase en las de cuerpo a cuerpo; las de distancia y la
  // hechicera siguen con su arco o su bastón. Estandarte: el de aspecto > el del nivel 10. Las mejoras ya no ponen
  // adornos sueltos (brazaletes, plumas, galones…): se amontonaban.
  const ARMA_CAMBIABLE = ["espadachin", "nordico"];
  // 16 sep 2026, a petición de Rodrigo: el nivel se lee en la estrellita de la esquina, sin recargar al héroe.
  // La estrella cambia de metal cada cuatro niveles y debajo cuelgan los galones: bronce 1-4, plata 5-8, oro 9.
  // El 10 no lleva galón: lleva otra estrella detrás, girada. El 11 es la Leyenda: estrella roja, también con otra detrás
  // (antes llevaba una aureola sobre la cabeza; fuera). El estandarte del nivel 10 se fue al lado derecho.
  const METAL_NIVEL = ["#c9803f", "#e3e7ec", "#ffd23f"];
  function galonNivel(ctx, x, y, a, color) {
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x - a, y); ctx.lineTo(x, y + a * .62); ctx.lineTo(x + a, y);
    ctx.strokeStyle = TINTA; ctx.lineWidth = Math.max(1.6, a * .9); ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(.8, a * .38); ctx.stroke();
  }
  function marcaNivel(ctx, x, y, s, h) {
    if (!FWM.iconos || !FWM.iconos.I || !FWM.iconos.I.estrella) return;
    const leyenda = !!(h && (h.leyenda || h.nivel >= 11)), nivel = Math.max(1, Math.min(10, (h && h.nivel) || 1));
    const etapa = Math.min(2, Math.floor((nivel - 1) / 4));
    const color = leyenda ? "#e03a2f" : METAL_NIVEL[etapa];
    const galones = leyenda || nivel === 10 ? 0 : Math.min(3, nivel - 1 - etapa * 4);
    const ex = x - s * .86, ey = y - s * .95;
    // 10 y 11: otra estrella detrás, girada, cuyas puntas asoman entre las de delante (como en las insignias militares)
    if (leyenda || nivel === 10) { ctx.save(); ctx.translate(ex, ey); ctx.rotate(Math.PI / 5); FWM.iconos.I.estrella(ctx, 0, 0, s * .22, TINTA); FWM.iconos.I.estrella(ctx, 0, 0, s * .16, leyenda ? "#9e1f17" : "#c79a12"); ctx.restore(); }
    FWM.iconos.I.estrella(ctx, ex, ey, s * .22, TINTA); FWM.iconos.I.estrella(ctx, ex, ey, s * .16, color);
    for (let i = 0; i < galones; i++) galonNivel(ctx, ex, ey + s * .26 + i * s * .11, s * .10, color);
  }
  function tieneObjeto(h, tipo) { const O = (FWM.datosBase && FWM.datosBase.objetos) || {}; const id = h && h.objetos && h.objetos[tipo]; return !!(id && O[id]); }
  function heroeBase(ctx, x, y, s, op, dibujarClase, antes) {
    const h = op.heroe || {}; const nivel = h.nivel || 1; const ef = (FWM.heroes && FWM.heroes.efectosDe(h)) || {};
    if (antes) antes(); // montura propia de la clase (el Kan va a caballo)
    else dibujarObjetos(ctx, x, y, s, op, "antes");
    const idAspecto = h.aspecto || (h.objetos && h.objetos.aspecto);
    if (idAspecto === "estandarte_leon") { ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .07); ctx.beginPath(); ctx.moveTo(x - s * .5, y + s * .9); ctx.lineTo(x - s * .5, y - s * 1.0); ctx.stroke(); borde(ctx, s); poligono(ctx, [[x - s * .5, y - s * 1.0], [x - s * .05, y - s * .9], [x - s * .5, y - s * .55]], "#b3261e"); ctx.fillStyle = "#e8b923"; ctx.beginPath(); ctx.arc(x - s * .36, y - s * .8, s * .07, 0, Math.PI * 2); ctx.fill(); }
    else if (CAPAS[idAspecto]) { borde(ctx, s); poligono(ctx, [[x - s * .45, y + s * .2], [x + s * .45, y + s * .2], [x + s * .6, y + s * .95], [x - s * .6, y + s * .95]], CAPAS[idAspecto]); if (idAspecto === "capa_armino") { ctx.fillStyle = TINTA; for (const [dx, dy] of [[-.3, .5], [0, .7], [.3, .5], [-.15, .85], [.18, .85]]) ctx.fillRect(x + dx * s, y + dy * s, s * .05, s * .09); } if (idAspecto === "manto_estrellas") { ctx.fillStyle = "#ffd86b"; for (const [dx, dy] of [[-.3, .55], [.2, .45], [.05, .8], [-.4, .85], [.38, .78]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, s * .035, 0, Math.PI * 2); ctx.fill(); } } }
    const marcas = []; for (let n = 2; n <= Math.min(nivel, 10); n++) marcas.push(NIVEL_MARCA[n]);
    const capaAspecto = !!CAPAS[idAspecto];
    // capa / manto (detrás del cuerpo), solo si no lleva una capa de aspecto
    if (capaAspecto) { /* ya está puesta */ }
    else if (marcas.includes("manto")) { borde(ctx, s); poligono(ctx, [[x - s * .5, y + s * .15], [x + s * .5, y + s * .15], [x + s * .7, y + s * .98], [x - s * .7, y + s * .98]], "#6b2fa0"); }
    else if (marcas.includes("capa")) { borde(ctx, s); poligono(ctx, [[x - s * .45, y + s * .2], [x + s * .45, y + s * .2], [x + s * .6, y + s * .95], [x - s * .6, y + s * .95]], op.capa || "#a83232"); }
    cuerpo(ctx, x, y, s, op);
    const torso = marcas.includes("gala") ? "gala" : marcas.includes("hombreras") ? "hombreras" : marcas.includes("cota") ? "cota" : null;
    if (torso) { borde(ctx, s); redondo(ctx, x, y + s * .5, s * .6, s * .4, s * .12, torso === "gala" ? "#e2c46a" : METAL); ctx.fillStyle = METAL2; for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.arc(x - s * .2 + i * s * .2, y + s * .4 + k * s * .18, s * .04, 0, Math.PI * 2); ctx.fill(); } }
    dibujarClase(marcas);
    // escudo con blasón a la izquierda (si no lleva un escudo equipado)
    if (marcas.includes("blason") && !tieneObjeto(h, "escudo")) { borde(ctx, s); redondo(ctx, x - s * .62, y + s * .55, s * .38, s * .46, s * .1, op.color || "#888"); ctx.fillStyle = "#ffd86b"; ctx.beginPath(); ctx.moveTo(x - s * .62, y + s * .4); ctx.lineTo(x - s * .5, y + s * .6); ctx.lineTo(x - s * .62, y + s * .72); ctx.lineTo(x - s * .74, y + s * .6); ctx.closePath(); ctx.fill(); }
    // corona (si no lleva algo en la cabeza)
    if (marcas.includes("corona") && !tieneObjeto(h, "cabeza")) { borde(ctx, s); poligono(ctx, [[x - s * .38, y - s * .55], [x - s * .38, y - s * .85], [x - s * .19, y - s * .68], [x, y - s * .95], [x + s * .19, y - s * .68], [x + s * .38, y - s * .85], [x + s * .38, y - s * .55]], "#e8b923"); }
    // hombreras doradas (nivel 8), cinturón de gala (9) y estandarte de su facción (10)
    if (torso === "hombreras" || torso === "gala") { borde(ctx, s); ctx.beginPath(); ctx.ellipse(x - s * .4, y + s * .26, s * .18, s * .11, -.4, 0, Math.PI * 2); relleno(ctx, "#e8b923"); ctx.beginPath(); ctx.ellipse(x + s * .4, y + s * .26, s * .18, s * .11, .4, 0, Math.PI * 2); relleno(ctx, "#e8b923"); }
    if (torso === "gala") { ctx.strokeStyle = "#e8b923"; ctx.lineWidth = Math.max(2, s * .08); ctx.beginPath(); ctx.moveTo(x - s * .4, y + s * .68); ctx.lineTo(x + s * .4, y + s * .68); ctx.stroke(); }
    if (marcas.includes("estandarte") && op.detalle && idAspecto !== "estandarte_leon" && idAspecto !== "estandarte_dragon") { ctx.strokeStyle = "#8a5a10"; ctx.lineWidth = Math.max(2, s * .07); ctx.beginPath(); ctx.moveTo(x + s * .82, y + s * .95); ctx.lineTo(x + s * .82, y - s * 1.1); ctx.stroke(); borde(ctx, s); poligono(ctx, [[x + s * .82, y - s * 1.1], [x + s * .36, y - s * .98], [x + s * .82, y - s * .7]], (op.faccion && FWM.datosBase.facciones && FWM.datosBase.facciones[op.faccion] && FWM.datosBase.facciones[op.faccion].color) || "#e8b923"); ctx.fillStyle = "#e8b923"; ctx.beginPath(); ctx.arc(x + s * .66, y - s * .92, s * .05, 0, Math.PI * 2); ctx.fill(); }
    // objetos equipados: montura (detrás, ya dibujada por dibujarObjetos "antes"), arma, escudo, cabeza
    dibujarObjetos(ctx, x, y, s, op, "despues");
    marcaNivel(ctx, x, y, s, h);
  }
  F.heroe_espadachin = (ctx, x, y, s, op) => {
    op = op || {};
    heroeBase(ctx, x, y, s, op, (marcas) => {
      // espada grande a la derecha, detrás de la cabeza (si lleva otra arma equipada, esa la sustituye)
      if (!tieneObjeto(op.heroe, "arma")) {
        ctx.save(); ctx.translate(x + s * .7, y + s * .55); ctx.rotate(Math.PI / 7);
        borde(ctx, s); redondo(ctx, 0, -s * .6, s * .2, s * 1.2, s * .05, METAL);
        ctx.beginPath(); ctx.moveTo(-s * .3, 0); ctx.lineTo(s * .3, 0); ctx.strokeStyle = "#e8b923"; ctx.lineWidth = Math.max(2, s * .12); ctx.stroke();
        ctx.restore();
      }
      cabeza(ctx, x, y, s, op);
      borde(ctx, s);
      // el de siempre (rojo en nivel 1) con nasal (14 sep 2026: sin la pieza de la nariz parecía una gorra)
      const colCasco = marcas.includes("casco") ? (marcas.includes("cota") ? METAL : "#8a5a2a") : "#c0392b";
      ctx.beginPath(); ctx.arc(x, y - s * .2, marcas.includes("casco") ? s * .52 : s * .5, Math.PI, 0); ctx.closePath(); relleno(ctx, colCasco);
      redondo(ctx, x, y - s * .08, s * .1, s * .26, s * .05, colCasco); // nasal, entre los ojos
    });
  };
  F.heroe_arquero = (ctx, x, y, s, op) => {
    op = op || {};
    heroeBase(ctx, x, y, s, op, (marcas) => {
      // arco a la izquierda
      borde(ctx, s); ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .11);
      ctx.beginPath(); ctx.arc(x - s * .55, y + s * .3, s * .6, Math.PI * .6, Math.PI * 1.4); ctx.stroke();
      ctx.strokeStyle = "#f5f0e0"; ctx.lineWidth = Math.max(1, s * .04);
      ctx.beginPath(); ctx.moveTo(x - s * .55 + s * .6 * Math.cos(Math.PI * .6), y + s * .3 + s * .6 * Math.sin(Math.PI * .6)); ctx.lineTo(x - s * .55 + s * .6 * Math.cos(Math.PI * 1.4), y + s * .3 + s * .6 * Math.sin(Math.PI * 1.4)); ctx.stroke();
      cabeza(ctx, x, y, s, op);
      // capucha granate (con casco: capucha sobre casco)
      borde(ctx, s);
      poligono(ctx, [[x - s * .56, y - s * .2], [x, y - s * 1.0], [x + s * .56, y - s * .2], [x + s * .5, y - s * .3], [x, y - s * .6], [x - s * .5, y - s * .3]], "#7a2a3a");
      if (marcas.includes("casco")) { ctx.beginPath(); ctx.arc(x, y - s * .25, s * .34, Math.PI, 0); ctx.closePath(); relleno(ctx, METAL); }
    });
  };
  F.heroe_nordico = (ctx, x, y, s, op) => {
    op = op || {};
    heroeBase(ctx, x, y, s, op, (marcas) => {
      cabeza(ctx, x, y, s, op);
      borde(ctx, s);
      // barba rubia
      poligono(ctx, [[x - s * .42, y + s * .05], [x + s * .42, y + s * .05], [x + s * .3, y + s * .5], [x, y + s * .62], [x - s * .3, y + s * .5]], "#d9a43a");
      // casco con cuernos
      ctx.beginPath(); ctx.arc(x, y - s * .22, s * .5, Math.PI, 0); ctx.closePath(); relleno(ctx, marcas.includes("cota") ? METAL : "#7d8792");
      poligono(ctx, [[x - s * .42, y - s * .35], [x - s * .85, y - s * .75], [x - s * .5, y - s * .6]], "#f2e3c2");
      poligono(ctx, [[x + s * .42, y - s * .35], [x + s * .85, y - s * .75], [x + s * .5, y - s * .6]], "#f2e3c2");
      // hacha a la derecha (si lleva otra arma equipada, esa la sustituye)
      if (!tieneObjeto(op.heroe, "arma")) {
        ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .11); ctx.beginPath(); ctx.moveTo(x + s * .6, y + s * .95); ctx.lineTo(x + s * .6, y - s * .5); ctx.stroke();
        borde(ctx, s); ctx.beginPath(); ctx.moveTo(x + s * .6, y - s * .55); ctx.quadraticCurveTo(x + s * 1.05, y - s * .5, x + s * .95, y - s * .05); ctx.quadraticCurveTo(x + s * .75, y - s * .2, x + s * .6, y - s * .1); ctx.closePath(); relleno(ctx, METAL);
      }
    });
  };
  F.heroe_alquimista = (ctx, x, y, s, op) => {
    op = op || {};
    heroeBase(ctx, x, y, s, op, (marcas) => {
      // túnica larga sobre el cuerpo (verde con fajín dorado si es Saladino)
      borde(ctx, s); poligono(ctx, [[x - s * .4, y + s * .2], [x + s * .4, y + s * .2], [x + s * .5, y + s * .95], [x - s * .5, y + s * .95]], op.faccion === "saladino" ? "#1f6b62" : "#5b3d8a");
      if (op.faccion === "saladino") { ctx.fillStyle = "#e8b923"; ctx.fillRect(x - s * .44, y + s * .5, s * .88, s * .09); }
      cabeza(ctx, x, y, s, op);
      borde(ctx, s);
      if (op.faccion === "saladino") { // Saladino: turbante blanco con joya verde y barba negra corta
        poligono(ctx, [[x - s * .34, y + s * .12], [x + s * .34, y + s * .12], [x + s * .2, y + s * .42], [x, y + s * .5], [x - s * .2, y + s * .42]], "#2f2620");
        ctx.fillStyle = "#e8c9a6"; ctx.beginPath(); ctx.ellipse(x, y + s * .22, s * .14, s * .06, 0, 0, Math.PI * 2); ctx.fill();
        // turbante enrollado (14 sep 2026: con ala ancha parecía una gorra de capitán): vueltas de tela
        // apiladas, cada una algo más estrecha, que se cruzan en la frente; con casco asoma la punta arriba
        if (marcas.includes("casco")) { borde(ctx, s); poligono(ctx, [[x - s * .14, y - s * .78], [x, y - s * 1.1], [x + s * .14, y - s * .78]], METAL); }
        borde(ctx, s);
        ctx.beginPath(); ctx.moveTo(x - s * .44, y - s * .2);
        ctx.bezierCurveTo(x - s * .66, y - s * .42, x - s * .6, y - s * .86, x, y - s * .9);
        ctx.bezierCurveTo(x + s * .6, y - s * .86, x + s * .66, y - s * .42, x + s * .44, y - s * .2);
        ctx.quadraticCurveTo(x, y - s * .32, x - s * .44, y - s * .2); ctx.closePath(); relleno(ctx, "#f4efe2");
        // pliegues de la tela, finos y cruzados
        ctx.strokeStyle = "#b9ad94"; ctx.lineWidth = Math.max(1.2, s * .06); ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(x - s * .5, y - s * .38); ctx.quadraticCurveTo(x - s * .05, y - s * .6, x + s * .52, y - s * .5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - s * .48, y - s * .6); ctx.quadraticCurveTo(x + s * .05, y - s * .78, x + s * .44, y - s * .7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + s * .5, y - s * .34); ctx.quadraticCurveTo(x + s * .1, y - s * .44, x - s * .12, y - s * .74); ctx.stroke();

      } else {
        // capucha morada puntiaguda
        poligono(ctx, [[x - s * .56, y - s * .2], [x + s * .1, y - s * 1.05], [x + s * .56, y - s * .2], [x + s * .5, y - s * .3], [x + s * .05, y - s * .62], [x - s * .5, y - s * .3]], "#7a52b5");
        if (marcas.includes("casco")) { ctx.beginPath(); ctx.arc(x, y - s * .25, s * .3, Math.PI, 0); ctx.closePath(); relleno(ctx, METAL); }
      }
      // frasco con fuego a la derecha
      borde(ctx, s); redondo(ctx, x + s * .62, y + s * .45, s * .28, s * .4, s * .1, "#2f6fd6");
      ctx.fillStyle = "#ff7a1a"; ctx.beginPath(); ctx.moveTo(x + s * .62, y - s * .15); ctx.lineTo(x + s * .78, y + s * .15); ctx.lineTo(x + s * .62, y + s * .05); ctx.lineTo(x + s * .46, y + s * .15); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#ffd23f"; ctx.beginPath(); ctx.arc(x + s * .62, y + s * .05, s * .07, 0, Math.PI * 2); ctx.fill();
    });
  };
  // Malí: el Mansa, con corona de oro, túnica blanca y cetro con un orbe dorado (así lo pinta el Atlas Catalán).
  F.heroe_mansa = (ctx, x, y, s, op) => {
    op = op || {};
    heroeBase(ctx, x, y, s, op, (marcas) => {
      borde(ctx, s); poligono(ctx, [[x - s * .42, y + s * .18], [x + s * .42, y + s * .18], [x + s * .52, y + s * .96], [x - s * .52, y + s * .96]], "#f4f1ea");
      ctx.fillStyle = "#e8b923"; ctx.fillRect(x - s * .05, y + s * .2, s * .1, s * .74);
      // cetro con orbe
      ctx.strokeStyle = "#8a5a10"; ctx.lineWidth = Math.max(2, s * .09); ctx.beginPath(); ctx.moveTo(x + s * .66, y + s * .95); ctx.lineTo(x + s * .66, y - s * .5); ctx.stroke();
      borde(ctx, s); circulo(ctx, x + s * .66, y - s * .6, s * .15, "#f2c230");
      cabeza(ctx, x, y, s, op);
      borde(ctx, s);
      if (marcas.includes("casco")) { ctx.beginPath(); ctx.arc(x, y - s * .22, s * .5, Math.PI, 0); ctx.closePath(); relleno(ctx, "#2f3f78"); }
      // corona de oro alta sobre un gorro blanco
      redondo(ctx, x, y - s * .36, s * .92, s * .16, s * .07, "#f4f1ea");
      poligono(ctx, [[x - s * .38, y - s * .42], [x - s * .38, y - s * .82], [x - s * .19, y - s * .64], [x, y - s * .92], [x + s * .19, y - s * .64], [x + s * .38, y - s * .82], [x + s * .38, y - s * .42]], "#f2c230");
      ctx.fillStyle = "#b3261e"; ctx.beginPath(); ctx.arc(x, y - s * .56, s * .06, 0, Math.PI * 2); ctx.fill();
    });
  };
  // Mongoles: el Kan, con gorro de piel alto, deel con ribete dorado y arco a la espalda.
  // 24 sep 2026: a caballo solo si lleva caballo, como los demás héroes. Anda a una casilla a pie, y dibujarle
  // siempre montado decía otra cosa. Sabe montar de nacimiento: cualquier caballo que le pongas lo monta.
  F.heroe_kan = (ctx, x, y, s, op) => {
    op = op || {};
    heroeBase(ctx, x, y, s, op, (marcas) => {
      // arco a la espalda
      ctx.strokeStyle = "#5a3a1e"; ctx.lineWidth = Math.max(2, s * .09);
      ctx.beginPath(); ctx.moveTo(x - s * .55, y - s * .3); ctx.quadraticCurveTo(x - s * .85, y + s * .1, x - s * .6, y + s * .3); ctx.quadraticCurveTo(x - s * .35, y + s * .55, x - s * .6, y + s * .85); ctx.stroke();
      borde(ctx, s); poligono(ctx, [[x - s * .4, y + s * .18], [x + s * .4, y + s * .18], [x + s * .46, y + s * .78], [x - s * .46, y + s * .78]], "#5b3d8a");
      ctx.strokeStyle = "#e8b923"; ctx.lineWidth = Math.max(1.5, s * .06); ctx.beginPath(); ctx.moveTo(x - s * .3, y + s * .2); ctx.lineTo(x + s * .12, y + s * .76); ctx.stroke();
      cabeza(ctx, x, y, s, op);
      borde(ctx, s);
      poligono(ctx, [[x - s * .42, y - s * .3], [x, y - s * 1.05], [x + s * .42, y - s * .3]], marcas.includes("casco") ? METAL : "#b8423a");
      ctx.beginPath(); ctx.ellipse(x, y - s * .3, s * .58, s * .15, 0, 0, Math.PI * 2); relleno(ctx, "#7a5230");
      ctx.fillStyle = "#e8b923"; ctx.beginPath(); ctx.arc(x, y - s * 1.05, s * .06, 0, Math.PI * 2); ctx.fill();
    });
  };

  // Tribus eslavas: Vesna, la hechicera. Trenza larga, túnica de lino con cinturón verde, capa y un bastón de
  // madera con una piedra que brilla y un rayo pequeño. Inventada: nada de coronas ni tocados de un país concreto.
  F.heroe_hechicera = (ctx, x, y, s, op) => {
    op = op || {};
    heroeBase(ctx, x, y, s, op, (marcas) => {
      // túnica larga de lino y cinturón verde
      borde(ctx, s); poligono(ctx, [[x - s * .38, y + s * .2], [x + s * .38, y + s * .2], [x + s * .5, y + s * .95], [x - s * .5, y + s * .95]], "#ece4d0");
      ctx.fillStyle = "#3f8a3a"; ctx.fillRect(x - s * .42, y + s * .5, s * .84, s * .08);
      // bastón a la derecha con la piedra encendida
      ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .09); ctx.beginPath(); ctx.moveTo(x + s * .66, y + s * .95); ctx.lineTo(x + s * .66, y - s * .55); ctx.stroke();
      ctx.fillStyle = "rgba(150,210,255,.35)"; ctx.beginPath(); ctx.arc(x + s * .66, y - s * .68, s * .26, 0, Math.PI * 2); ctx.fill();
      borde(ctx, s); circulo(ctx, x + s * .66, y - s * .68, s * .13, "#bfe6ff");
      ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = Math.max(1.5, s * .06); ctx.beginPath(); ctx.moveTo(x + s * .8, y - s * 1.02); ctx.lineTo(x + s * .7, y - s * .9); ctx.lineTo(x + s * .8, y - s * .88); ctx.lineTo(x + s * .7, y - s * .76); ctx.stroke();
      // melena por detrás de la cara, hasta los hombros
      borde(ctx, s); ctx.beginPath(); ctx.moveTo(x - s * .56, y + s * .3); ctx.quadraticCurveTo(x - s * .64, y - s * .62, x, y - s * .62); ctx.quadraticCurveTo(x + s * .64, y - s * .62, x + s * .56, y + s * .3); ctx.lineTo(x + s * .3, y + s * .3); ctx.lineTo(x - s * .3, y + s * .3); ctx.closePath(); relleno(ctx, "#b98a45");
      cabeza(ctx, x, y, s, op);
      // flequillo con raya en medio
      borde(ctx, s); ctx.beginPath(); ctx.moveTo(x - s * .5, y - s * .1); ctx.quadraticCurveTo(x - s * .5, y - s * .58, x, y - s * .57); ctx.quadraticCurveTo(x + s * .5, y - s * .58, x + s * .5, y - s * .1); ctx.quadraticCurveTo(x + s * .32, y - s * .38, x, y - s * .36); ctx.quadraticCurveTo(x - s * .32, y - s * .38, x - s * .5, y - s * .1); ctx.closePath(); relleno(ctx, "#b98a45");
      // trenza por delante, sobre el hombro derecho, con lazo verde
      borde(ctx, s); redondo(ctx, x + s * .36, y + s * .42, s * .17, s * .5, s * .085, "#b98a45");
      ctx.strokeStyle = "rgba(0,0,0,.3)"; ctx.lineWidth = Math.max(1, s * .04); for (const dy of [.26, .4, .54]) { ctx.beginPath(); ctx.moveTo(x + s * .29, y + s * dy); ctx.lineTo(x + s * .43, y + s * (dy + .07)); ctx.stroke(); }
      borde(ctx, s); circulo(ctx, x + s * .36, y + s * .7, s * .06, "#3f8a3a");
      // cinta de lana (con casco: diadema de plata)
      ctx.strokeStyle = marcas.includes("casco") ? "#dfe3e8" : "#3f8a3a"; ctx.lineWidth = Math.max(2, s * .08); ctx.beginPath(); ctx.arc(x, y - s * .05, s * .5, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
    });
  };

  // Lienzo con el héroe grande (perfil, cara a cara, ceremonia) o pequeño. heroe = { clase, nivel, mejoras }.
  F.canvasHeroe = function (heroe, color, tam, detalle, enemigo) {
    const c = document.createElement("canvas");
    const dpr = window.devicePixelRatio || 1;
    c.width = tam * dpr; c.height = tam * dpr;
    const ctx = c.getContext("2d"); ctx.scale(dpr, dpr);
    const s = tam * .36;
    const faccion = (heroe && heroe.faccion) || (FWM.facciones && heroe && FWM.facciones.porClase(heroe.clase)) || null;
    (F["heroe_" + (heroe && heroe.clase)] || F.heroe_espadachin)(ctx, tam / 2, tam / 2 + s * .02, s, { color, enemigo: !!enemigo, heroe: heroe || {}, detalle: !!detalle, faccion });
    return c;
  };

  F.pueblo = (ctx, x, y, s) => { casa(ctx, x, y, s, "#f2e3c2", "#c9573f"); };
  F.ciudad = (ctx, x, y, s) => {
    casa(ctx, x - s * .5, y + s * .25, s * .6, "#f2e3c2", "#c9573f");
    casa(ctx, x + s * .5, y + s * .25, s * .6, "#f2e3c2", "#7f9cc9");
    // torre central con banderín
    borde(ctx, s); redondo(ctx, x, y + s * .05, s * .5, s * 1.1, s * .06, "#e6d5ae");
    poligono(ctx, [[x - s * .35, y - s * .5], [x, y - s * 1.05], [x + s * .35, y - s * .5]], "#c9573f");
    ctx.beginPath(); ctx.moveTo(x, y - s * 1.05); ctx.lineTo(x, y - s * 1.35); ctx.stroke();
    poligono(ctx, [[x, y - s * 1.35], [x + s * .35, y - s * 1.25], [x, y - s * 1.15]], "#e8c35a");
  };
  F.castillo = (ctx, x, y, s) => {
    borde(ctx, s);
    // muro
    redondo(ctx, x, y + s * .35, s * 1.4, s * .75, s * .06, "#cfc6b5");
    // torres gordas
    for (const dx of [-.62, .62]) {
      redondo(ctx, x + dx * s, y - s * .05, s * .5, s * 1.3, s * .06, "#bdb3a0");
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.rect(x + dx * s + i * s * .17 - s * .07, y - s * .82, s * .14, s * .16); relleno(ctx, "#bdb3a0"); }
    }
    // almenas del muro
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.rect(x + i * s * .25 - s * .08, y - s * .12, s * .16, s * .16); relleno(ctx, "#cfc6b5"); }
    // puerta grande
    ctx.beginPath(); ctx.arc(x, y + s * .35, s * .26, Math.PI, 0); ctx.lineTo(x + s * .26, y + s * .72); ctx.lineTo(x - s * .26, y + s * .72); ctx.closePath(); relleno(ctx, MADERA2);
    // banderín
    ctx.beginPath(); ctx.moveTo(x + s * .62, y - s * .7); ctx.lineTo(x + s * .62, y - s * 1.05); ctx.stroke();
    poligono(ctx, [[x + s * .62, y - s * 1.05], [x + s * .95, y - s * .95], [x + s * .62, y - s * .85]], "#c9573f");
  };

  // ---------- insignias: cada medalla tiene su propia forma y color ----------
  // motivo: "laurel" (trofeo) | "rayo" (rombo) | "escudo" | "espadas" (medalla) | "estrella" | "castillo" (estandarte)
  //         | "sol" | "llama" (antorcha) | "siete" (pergamino) | "banderines" | "galones" (parche) | "cien" (corona)
  F.medalla = (ctx, x, y, s, motivo, apagada) => {
    // apagada = gris, pero conservando lo claro/oscuro de cada color para que el dibujo se siga viendo
    const gris = (c) => { const n = parseInt(c.slice(1), 16); const l = (.3 * (n >> 16) + .59 * ((n >> 8) & 255) + .11 * (n & 255)) / 255; const v = Math.round(120 + l * 100); return "rgb(" + v + "," + (v - 4) + "," + (v - 12) + ")"; };
    const g = (c) => apagada ? gris(c) : c, g2 = (c) => apagada ? gris(c) : c;
    const tinta = apagada ? "#7a746a" : TINTA;
    borde(ctx, s); ctx.strokeStyle = tinta;
    const P = (pts, c) => poligono(ctx, pts, c), C = (cx, cy, r, c) => circulo(ctx, cx, cy, r, c), R = (cx, cy, w, h, r, c) => redondo(ctx, cx, cy, w, h, r, c);
    const texto = (t, tam, cx, cy, color) => { ctx.fillStyle = color || tinta; ctx.font = "900 " + Math.round(tam) + "px -apple-system, Helvetica, Arial, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(t, cx, cy + tam * .05); };
    const lin = (ax, ay, bx, by, w) => { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); };
    const m = s;
    if (motivo === "laurel") { // trofeo: copa con asas y base, laurel grabado
      R(x, y + m * .95, m * .9, m * .18, m * .04, g("#8a6a10")); R(x, y + m * .78, m * .35, m * .22, m * .04, g("#e8b923"));
      for (const d of [-1, 1]) { // asas: una curva que sale del borde y vuelve al cuerpo de la copa
        ctx.lineWidth = Math.max(2, m * .12); ctx.strokeStyle = tinta; ctx.beginPath(); ctx.moveTo(x + d * m * .55, y - m * .6); ctx.bezierCurveTo(x + d * m * 1.2, y - m * .65, x + d * m * 1.15, y + m * .3, x + d * m * .45, y + m * .2); ctx.stroke();
        ctx.lineWidth = Math.max(1, m * .05); ctx.strokeStyle = g("#e8b923"); ctx.stroke(); ctx.strokeStyle = tinta;
      }
      P([[x - m * .62, y - m * .75], [x + m * .62, y - m * .75], [x + m * .45, y + m * .35], [x - m * .45, y + m * .35]], g("#e8b923"));
      P([[x - m * .32, y + m * .35], [x + m * .32, y + m * .35], [x + m * .2, y + m * .68], [x - m * .2, y + m * .68]], g("#e8b923"));
      texto("1", m * .75, x, y - m * .15, tinta);
    } else if (motivo === "rayo") { // rombo azul con rayo amarillo
      P([[x, y - m * 1.0], [x + m * .85, y], [x, y + m * 1.0], [x - m * .85, y]], g("#2f6fd6"));
      P([[x + m * .15, y - m * .6], [x - m * .35, y + m * .05], [x - m * .02, y + m * .05], [x - m * .18, y + m * .6], [x + m * .35, y - m * .1], [x + m * .04, y - m * .1]], g("#ffd23f"));
    } else if (motivo === "escudo") { // escudo heráldico con corazón
      P([[x - m * .85, y - m * .85], [x + m * .85, y - m * .85], [x + m * .85, y + m * .1], [x, y + m * 1.0], [x - m * .85, y + m * .1]], g("#2f6fd6"));
      P([[x - m * .85, y - m * .85], [x, y - m * .85], [x, y + m * 1.0], [x - m * .85, y + m * .1]], g("#3f86e6"));
      const rojo = apagada ? "#ebe5d8" : "#ff6b6b";
      ctx.fillStyle = rojo; ctx.beginPath(); ctx.arc(x - m * .22, y - m * .2, m * .26, 0, Math.PI * 2); ctx.arc(x + m * .22, y - m * .2, m * .26, 0, Math.PI * 2); ctx.fill();
      P([[x - m * .48, y - m * .1], [x + m * .48, y - m * .1], [x, y + m * .5]], rojo);
    } else if (motivo === "espadas") { // medalla oscura con cinta negra y espadas cruzadas
      P([[x - m * .42, y - m * .9], [x - m * .05, y - m * .9], [x - m * .2, y - m * .2], [x - m * .52, y - m * .3]], g("#2a2419")); P([[x + m * .05, y - m * .9], [x + m * .42, y - m * .9], [x + m * .52, y - m * .3], [x + m * .2, y - m * .2]], g("#4a4035"));
      C(x, y + m * .3, m * .66, g("#8e2a20")); ctx.beginPath(); ctx.arc(x, y + m * .3, m * .5, 0, Math.PI * 2); ctx.strokeStyle = g2("#5e1a12"); ctx.lineWidth = Math.max(1, m * .06); ctx.stroke(); ctx.strokeStyle = tinta;
      for (const d of [-1, 1]) { ctx.strokeStyle = g("#e6e9ee"); lin(x - d * m * .4, y + m * .7, x + d * m * .34, y - m * .1, Math.max(2, m * .12)); ctx.strokeStyle = tinta; lin(x - d * m * .44, y + m * .48, x - d * m * .2, y + m * .7, Math.max(2, m * .1)); }
    } else if (motivo === "estrella") { // estrella turquesa grande con borde
      FWM.iconos.I.estrella(ctx, x, y + m * .05, m * 1.05, tinta); FWM.iconos.I.estrella(ctx, x, y + m * .05, m * .85, g("#1fa39a")); FWM.iconos.I.estrella(ctx, x, y + m * .05, m * .4, g("#bff5f0"));
    } else if (motivo === "castillo") { // estandarte en mástil con castillo
      ctx.strokeStyle = g2("#6e4626"); lin(x - m * .7, y - m * 1.05, x - m * .7, y + m * 1.05, Math.max(2, m * .12)); ctx.strokeStyle = tinta;
      P([[x - m * .62, y - m * .95], [x + m * .9, y - m * .95], [x + m * .9, y + m * .35], [x + m * .14, y + m * .6], [x - m * .62, y + m * .35]], g("#c9573f"));
      FWM.iconos.I.castillo(ctx, x + m * .14, y - m * .1, m * .42);
    } else if (motivo === "sol") { // sol grande con cara
      ctx.strokeStyle = g("#ff9f1a"); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; lin(x + Math.cos(a) * m * .62, y + Math.sin(a) * m * .62, x + Math.cos(a) * m * 1.0, y + Math.sin(a) * m * 1.0, Math.max(2, m * .13)); }
      ctx.strokeStyle = tinta; C(x, y, m * .6, g("#ffd23f")); cara(ctx, x, y, m * .5, { enemigo: false });
    } else if (motivo === "llama") { // antorcha
      ctx.strokeStyle = g2("#6e4626"); lin(x, y + m * .1, x, y + m * 1.05, Math.max(3, m * .2)); ctx.strokeStyle = tinta;
      R(x, y + m * .1, m * .55, m * .22, m * .05, g("#a5713e"));
      P([[x, y - m * 1.05], [x + m * .55, y - m * .25], [x + m * .35, y + m * .05], [x - m * .35, y + m * .05], [x - m * .55, y - m * .25]], g("#ff7a1a"));
      P([[x, y - m * .55], [x + m * .25, y - m * .2], [x, y + m * .0], [x - m * .25, y - m * .2]], g("#ffd23f"));
    } else if (motivo === "siete") { // pergamino con un 7
      R(x, y, m * 1.4, m * 1.2, m * .08, g("#f2e3c2")); C(x - m * .7, y - m * .6, m * .16, g("#d9c39a")); C(x + m * .7, y - m * .6, m * .16, g("#d9c39a")); C(x - m * .7, y + m * .6, m * .16, g("#d9c39a")); C(x + m * .7, y + m * .6, m * .16, g("#d9c39a"));
      texto("7", m * 1.1, x, y, apagada ? tinta : "#8e2a20");
    } else if (motivo === "banderines") { // tres banderines de colores
      for (let i = -1; i <= 1; i++) { const bx = x + i * m * .62; ctx.strokeStyle = g2("#6e4626"); lin(bx, y - m * .95, bx, y + m * 1.0, Math.max(2, m * .1)); ctx.strokeStyle = tinta; P([[bx, y - m * .95], [bx + m * .6, y - m * .62], [bx, y - m * .3]], [g("#2f6fd6"), g("#d63b3b"), g("#2e9e4f")][i + 1]); }
    } else if (motivo === "galones") { // parche de tela verde con galones dorados
      R(x, y, m * 1.5, m * 1.5, m * .2, g("#3f7d2f"));
      ctx.strokeStyle = apagada ? "#8f887c" : "#e8b923"; for (let i = 0; i < 3; i++) { const gy = y - m * .45 + i * m * .42; lin(x - m * .5, gy + m * .28, x, gy - m * .1, Math.max(2, m * .14)); lin(x, gy - m * .1, x + m * .5, gy + m * .28, Math.max(2, m * .14)); }
      ctx.strokeStyle = tinta;
    } else if (motivo === "cien") { // libro abierto con el 100 (la crónica de cien partidas)
      P([[x - m * 1.0, y - m * .6], [x, y - m * .45], [x, y + m * .75], [x - m * 1.0, y + m * .6]], g("#f2e3c2"));
      P([[x + m * 1.0, y - m * .6], [x, y - m * .45], [x, y + m * .75], [x + m * 1.0, y + m * .6]], g("#f2e3c2"));
      R(x, y + m * .78, m * 2.05, m * .18, m * .05, g("#8e2a20"));
      ctx.strokeStyle = g2("#c9b98f"); for (const d of [-1, 1]) for (let k = 0; k < 3; k++) lin(x + d * m * .2, y - m * .2 + k * m * .28, x + d * m * .8, y - m * .25 + k * m * .28, Math.max(1, m * .05)); ctx.strokeStyle = tinta;
      texto("100", m * .5, x, y + m * .1, apagada ? tinta : "#8e2a20");
    } else if (motivo === "diana") { // diana con una flecha clavada (Cazador)
      C(x, y, m * 1.0, g("#f2e3c2")); C(x, y, m * .7, g("#d63b3b")); C(x, y, m * .42, g("#f2e3c2")); C(x, y, m * .16, g("#d63b3b"));
      ctx.strokeStyle = g2("#6e4626"); lin(x + m * .05, y - m * .05, x + m * 1.0, y - m * 1.0, Math.max(2, m * .1)); ctx.strokeStyle = tinta;
      P([[x + m * .85, y - m * 1.15], [x + m * 1.2, y - m * 1.0], [x + m * 1.05, y - m * .8]], g("#e6e9ee")); P([[x + m * .7, y - m * .95], [x + m * 1.05, y - m * .8], [x + m * .9, y - m * .6]], g("#e6e9ee"));
    } else if (motivo === "guante") { // guantelete lanzado (Duelista): el reto
      R(x, y + m * .35, m * 1.1, m * .9, m * .25, g("#c9cdd3"));
      for (const dx of [-.4, -.13, .13, .4]) R(x + m * dx, y - m * .35, m * .22, m * .8, m * .1, g("#c9cdd3"));
      R(x - m * .75, y + m * .2, m * .3, m * .55, m * .12, g("#c9cdd3"));
      R(x, y + m * .85, m * 1.15, m * .3, m * .08, g("#8a6a10"));
      ctx.strokeStyle = g2("#7d8792"); lin(x - m * .3, y + m * .2, x + m * .3, y + m * .2, Math.max(1, m * .05)); ctx.strokeStyle = tinta;
    } else texto("?", m, x, y, tinta);
  };
  F.canvasMedalla = function (motivo, tam, apagada) {
    const c = document.createElement("canvas"); const dpr = window.devicePixelRatio || 1;
    c.width = tam * dpr; c.height = tam * dpr; const ctx = c.getContext("2d"); ctx.scale(dpr, dpr);
    F.medalla(ctx, tam / 2, tam / 2 + tam * .06, tam * .4, motivo, apagada);
    return c;
  };

  // Peana del color del reino bajo la figura (para que el bando se vea de un vistazo).
  F.peana = (ctx, x, y, s, color) => {
    ctx.beginPath(); ctx.ellipse(x, y + s * .95, s * .85, s * .3, 0, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = TINTA; ctx.lineWidth = Math.max(1, s * .08); ctx.stroke();
  };
  // Canvas pequeño con la figura (paneles HTML).
  F.canvasTropa = function (tipo, color, tam, enemigo, faccion) {
    const c = document.createElement("canvas");
    const dpr = window.devicePixelRatio || 1;
    c.width = tam * dpr; c.height = tam * dpr;
    const ctx = c.getContext("2d"); ctx.scale(dpr, dpr);
    const s = tam * .4;
    F.peana(ctx, tam / 2, tam / 2 - s * .05, s, color);
    (F[tipo] || F["heroe_" + tipo] || F.campesino)(ctx, tam / 2, tam / 2 - s * .05, s, { color, enemigo: !!enemigo, faccion: faccion || null, heroe: (F[tipo] ? null : { clase: tipo, nivel: 1 }) || (typeof enemigo === "object" ? enemigo : null) });
    return c;
  };
  // Sustituye los iconos antiguos de tropas y asentamientos por las figuras.
  F.instalar = function () {
    if (!FWM.iconos) return;
    for (const id of ["pueblo", "ciudad", "castillo"]) FWM.iconos.I[id] = (ctx, x, y, s) => F[id](ctx, x, y, s * .95);
    FWM.iconos.canvasTropa = F.canvasTropa;
  };
  F.instalar();
  return F;
})();
