// Figuras "cabezonas": personajes y edificios dibujados con código, estilo cómic
// (cabeza grande, contorno grueso, colores planos). Cada función: (ctx, x, y, s, op)
// s = radio aproximado de la figura. op = { color: color del reino, enemigo: bool }.
window.FWM = window.FWM || {};

FWM.figuras = (function () {
  const F = {};
  const TINTA = "#2a2419", PIEL = "#f6cfa6", PIEL2 = "#e0a878", METAL = "#c9cdd3", METAL2 = "#8c939c", MADERA = "#a5713e", MADERA2 = "#6e4626", PAJA = "#e8c35a";

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
    ctx.fillStyle = "rgba(230,120,110,.45)"; ctx.beginPath(); ctx.arc(x - r * .5, y + r * .25, r * .14, 0, Math.PI * 2); ctx.arc(x + r * .5, y + r * .25, r * .14, 0, Math.PI * 2); ctx.fill();
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
    circulo(ctx, x, y - s * .05, s * .5, PIEL);
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
    // casco con nasal
    borde(ctx, s);
    ctx.beginPath(); ctx.arc(x, y - s * .2, s * .5, Math.PI, 0); ctx.closePath(); relleno(ctx, METAL);
    ctx.beginPath(); ctx.moveTo(x, y - s * .2); ctx.lineTo(x, y + s * .05); ctx.stroke();
  };

  F.espadachin = (ctx, x, y, s, op) => {
    op = op || {};
    cuerpo(ctx, x, y, s, op);
    cabeza(ctx, x, y, s, op);
    // pañuelo rojo en la cabeza
    borde(ctx, s);
    ctx.beginPath(); ctx.arc(x, y - s * .2, s * .5, Math.PI, 0); ctx.closePath(); relleno(ctx, "#c0392b");
    ctx.beginPath(); ctx.moveTo(x + s * .45, y - s * .25); ctx.lineTo(x + s * .8, y - s * .05); ctx.lineTo(x + s * .55, y - s * .1); ctx.closePath(); relleno(ctx, "#c0392b");
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
    // capucha verde con pluma
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
    circulo(ctx, x - s * .65, y - s * .05, s * .32, PIEL);
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
    ctx.beginPath(); ctx.moveTo(x + s * .24, y + s * .55); ctx.lineTo(x + s * .24, y + s * .85); ctx.moveTo(x + s * .1, y + s * .66); ctx.lineTo(x + s * .38, y + s * .66); ctx.stroke();
    cabeza(ctx, x, y, s, op);
    // tonsura: media corona de pelo por encima de las orejas
    ctx.strokeStyle = TINTA; ctx.lineWidth = Math.max(2, s * .1);
    ctx.beginPath(); ctx.arc(x, y - s * .05, s * .5, Math.PI * .82, Math.PI * .18, true); ctx.stroke();
  };

  F.ballestero = (ctx, x, y, s, op) => {
    op = op || {};
    cuerpo(ctx, x, y, s, op);
    cabeza(ctx, x, y, s, op);
    // gorro de fieltro con ala corta, por encima de la frente
    borde(ctx, s);
    ctx.beginPath(); ctx.ellipse(x, y - s * .42, s * .6, s * .12, 0, 0, Math.PI * 2); relleno(ctx, "#5a4632");
    ctx.beginPath(); ctx.arc(x, y - s * .46, s * .34, Math.PI, 0); ctx.closePath(); relleno(ctx, "#5a4632");
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
    // capacete de ala ancha, por encima de la frente
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

  F.trabuco = (ctx, x, y, s, op) => {
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

  // ---------- asentamientos ----------
  function casa(ctx, x, y, s, pared, tejado) {
    borde(ctx, s);
    redondo(ctx, x, y + s * .3, s * 1.1, s * .8, s * .08, pared);
    poligono(ctx, [[x - s * .75, y - s * .05], [x, y - s * .85], [x + s * .75, y - s * .05]], tejado);
    // puerta y ventana
    redondo(ctx, x - s * .25, y + s * .45, s * .28, s * .45, s * .12, MADERA2);
    redondo(ctx, x + s * .28, y + s * .25, s * .28, s * .28, s * .05, "#9ed3e8");
  }
  // ---------- héroes: cuatro clases; marca de nivel; adornos solo en tamaño grande (op.detalle) ----------
  // op = { color, enemigo, heroe: { clase, nivel, mejoras }, detalle: bool }
  const NIVEL_MARCA = { 2: "casco", 3: "cota", 4: "blason", 5: "capa", 6: "corona", 7: "manto", 8: "aureola" };
  // Objetos del héroe: montura debajo (antes del cuerpo) y arma/escudo/cabeza encima (después).
  function dibujarObjetos(ctx, x, y, s, op, cuando) {
    const h = op.heroe || {}; const ob = h.objetos || {}; const O = (FWM.datosBase && FWM.datosBase.objetos) || {};
    const dib = (tipo) => { const o = O[ob[tipo]]; return o ? o.dibujo : null; };
    borde(ctx, s);
    if (cuando === "antes") {
      const m = dib("montura");
      if (m) { // montura: cuerpo redondo detrás con cabeza a la derecha (mula gris, caballo marrón, corcel negro con gualdrapa)
        const col = m === "mula" ? "#9a9a9a" : m === "corcel" ? "#3a3a3a" : MADERA;
        ctx.beginPath(); ctx.ellipse(x, y + s * .62, s * .95, s * .42, 0, 0, Math.PI * 2); relleno(ctx, col);
        ctx.beginPath(); ctx.ellipse(x + s * .9, y + s * .3, s * .32, s * .24, -.5, 0, Math.PI * 2); relleno(ctx, col);
        if (m === "mula") { poligono(ctx, [[x + s * .78, y + s * .05], [x + s * .8, y - s * .35], [x + s * .95, y + s * .02]], col); poligono(ctx, [[x + s * .95, y + s * .05], [x + s * 1.05, y - s * .32], [x + s * 1.12, y + s * .08]], col); }
        else poligono(ctx, [[x + s * .8, y + s * .02], [x + s * .88, y - s * .3], [x + s * 1.02, y - s * .02]], col);
        for (const dx of [-.6, -.25, .25, .6]) { ctx.beginPath(); ctx.moveTo(x + dx * s, y + s * .95); ctx.lineTo(x + dx * s, y + s * 1.12); ctx.strokeStyle = TINTA; ctx.lineWidth = Math.max(2, s * .13); ctx.stroke(); }
        if (m === "corcel") { borde(ctx, s); redondo(ctx, x, y + s * .66, s * 1.0, s * .3, s * .08, op.color || "#888"); }
      }
      return;
    }
    const a = dib("arma"), e = dib("escudo"), c = dib("cabeza");
    if (e) { // escudo a la izquierda
      if (e === "rodela") circulo(ctx, x - s * .62, y + s * .55, s * .24, MADERA);
      else if (e === "torre") redondo(ctx, x - s * .64, y + s * .5, s * .36, s * .62, s * .06, METAL2);
      else if (e === "blason") { redondo(ctx, x - s * .62, y + s * .55, s * .38, s * .46, s * .1, op.color || "#888"); ctx.fillStyle = "#ffd86b"; ctx.beginPath(); ctx.arc(x - s * .62, y + s * .55, s * .1, 0, Math.PI * 2); ctx.fill(); }
      else if (e === "egida") { circulo(ctx, x - s * .62, y + s * .55, s * .28, "#e8b923"); ctx.fillStyle = "#2f6fd6"; ctx.beginPath(); ctx.arc(x - s * .62, y + s * .55, s * .12, 0, Math.PI * 2); ctx.fill(); }
    }
    if (a) { // arma a la derecha
      if (a === "espada" || a === "espada_oro" || a === "mandoble") { ctx.save(); ctx.translate(x + s * .72, y + s * .5); ctx.rotate(Math.PI / 7); const largo = a === "mandoble" ? 1.5 : 1.15; redondo(ctx, 0, -s * largo / 2, s * .16, s * largo, s * .04, a === "espada_oro" ? "#e8b923" : METAL); ctx.beginPath(); ctx.moveTo(-s * .25, 0); ctx.lineTo(s * .25, 0); ctx.strokeStyle = a === "espada_oro" ? "#8a5a10" : MADERA2; ctx.lineWidth = Math.max(2, s * .1); ctx.stroke(); ctx.restore(); }
      else if (a === "lanza") { ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .09); ctx.beginPath(); ctx.moveTo(x + s * .7, y + s * .95); ctx.lineTo(x + s * .7, y - s * .9); ctx.stroke(); borde(ctx, s); poligono(ctx, [[x + s * .7, y - s * 1.1], [x + s * .82, y - s * .8], [x + s * .58, y - s * .8]], METAL); }
      else if (a === "hacha") { ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .1); ctx.beginPath(); ctx.moveTo(x + s * .68, y + s * .95); ctx.lineTo(x + s * .68, y - s * .4); ctx.stroke(); borde(ctx, s); ctx.beginPath(); ctx.moveTo(x + s * .68, y - s * .5); ctx.quadraticCurveTo(x + s * 1.05, y - s * .45, x + s * .98, y - s * .05); ctx.quadraticCurveTo(x + s * .8, y - s * .18, x + s * .68, y - s * .08); ctx.closePath(); relleno(ctx, METAL); }
    }
    if (c) { // cabeza
      if (c === "gorro") { ctx.beginPath(); ctx.arc(x, y - s * .3, s * .48, Math.PI, 0); ctx.closePath(); relleno(ctx, "#8c5a3c"); circulo(ctx, x, y - s * .8, s * .1, "#f2e3c2"); }
      else if (c === "yelmo") { ctx.beginPath(); ctx.arc(x, y - s * .22, s * .52, Math.PI, 0); ctx.closePath(); relleno(ctx, METAL); ctx.fillStyle = TINTA; ctx.fillRect(x - s * .3, y - s * .3, s * .6, s * .08); }
      else if (c === "laurel") { ctx.strokeStyle = "#2e9e4f"; ctx.lineWidth = Math.max(2, s * .1); ctx.beginPath(); ctx.arc(x, y - s * .15, s * .5, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
      else if (c === "corona_rey") { poligono(ctx, [[x - s * .4, y - s * .5], [x - s * .4, y - s * .9], [x - s * .2, y - s * .7], [x, y - s * 1.0], [x + s * .2, y - s * .7], [x + s * .4, y - s * .9], [x + s * .4, y - s * .5]], "#e8b923"); ctx.fillStyle = "#d63b3b"; ctx.beginPath(); ctx.arc(x, y - s * .62, s * .07, 0, Math.PI * 2); ctx.fill(); }
    }
    // capa de aspecto
  }
  function heroeBase(ctx, x, y, s, op, dibujarClase) {
    const h = op.heroe || {}; const nivel = h.nivel || 1; const ef = (FWM.heroes && FWM.heroes.efectosDe(h)) || {};
    dibujarObjetos(ctx, x, y, s, op, "antes");
    if (h.aspecto === "capa_embajador" || (h.objetos && h.objetos.aspecto === "capa_embajador")) { borde(ctx, s); poligono(ctx, [[x - s * .45, y + s * .2], [x + s * .45, y + s * .2], [x + s * .6, y + s * .95], [x - s * .6, y + s * .95]], "#2e7d4f"); }
    const marcas = []; for (let n = 2; n <= Math.min(nivel, 8); n++) marcas.push(NIVEL_MARCA[n]);
    // capa / manto (detrás del cuerpo)
    if (marcas.includes("manto")) { borde(ctx, s); poligono(ctx, [[x - s * .5, y + s * .15], [x + s * .5, y + s * .15], [x + s * .7, y + s * .98], [x - s * .7, y + s * .98]], "#6b2fa0"); }
    else if (marcas.includes("capa")) { borde(ctx, s); poligono(ctx, [[x - s * .45, y + s * .2], [x + s * .45, y + s * .2], [x + s * .6, y + s * .95], [x - s * .6, y + s * .95]], op.capa || "#a83232"); }
    cuerpo(ctx, x, y, s, op);
    if (marcas.includes("cota")) { borde(ctx, s); redondo(ctx, x, y + s * .5, s * .6, s * .4, s * .12, METAL); ctx.fillStyle = METAL2; for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.arc(x - s * .2 + i * s * .2, y + s * .4 + k * s * .18, s * .04, 0, Math.PI * 2); ctx.fill(); } }
    dibujarClase(marcas);
    // escudo con blasón a la izquierda
    if (marcas.includes("blason")) { borde(ctx, s); redondo(ctx, x - s * .62, y + s * .55, s * .38, s * .46, s * .1, op.color || "#888"); ctx.fillStyle = "#ffd86b"; ctx.beginPath(); ctx.moveTo(x - s * .62, y + s * .4); ctx.lineTo(x - s * .5, y + s * .6); ctx.lineTo(x - s * .62, y + s * .72); ctx.lineTo(x - s * .74, y + s * .6); ctx.closePath(); ctx.fill(); }
    // corona
    if (marcas.includes("corona")) { borde(ctx, s); poligono(ctx, [[x - s * .38, y - s * .55], [x - s * .38, y - s * .85], [x - s * .19, y - s * .68], [x, y - s * .95], [x + s * .19, y - s * .68], [x + s * .38, y - s * .85], [x + s * .38, y - s * .55]], "#e8b923"); }
    // aureola (Leyenda)
    if (marcas.includes("aureola")) { ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = Math.max(2, s * .1); ctx.beginPath(); ctx.ellipse(x, y - s * .98, s * .5, s * .14, 0, 0, Math.PI * 2); ctx.stroke(); }
    // adornos de las mejoras (solo en grande)
    if (op.detalle && h.mejoras) {
      const m = h.mejoras; borde(ctx, s);
      if (m.vigor) redondo(ctx, x + s * .48, y + s * .55, s * .16, s * .1 + s * .03 * Math.min(5, m.vigor), s * .03, "#8a5a10"); // brazalete
      if (m.temple) { ctx.beginPath(); ctx.ellipse(x - s * .42, y + s * .25, s * .2, s * .12, -.4, 0, Math.PI * 2); relleno(ctx, METAL); } // hombrera
      if (m.escudo_hermanos) { ctx.strokeStyle = "#e6e9ee"; ctx.lineWidth = Math.max(2, s * .09); ctx.beginPath(); ctx.moveTo(x + s * .3, y - s * .6); ctx.quadraticCurveTo(x + s * .55, y - s * 1.15, x + s * .8, y - s * .95); ctx.stroke(); } // pluma
      if (m.grito) { ctx.strokeStyle = "#e8b923"; ctx.lineWidth = Math.max(2, s * .07); for (let i = 0; i < Math.min(3, m.grito); i++) { ctx.beginPath(); ctx.moveTo(x - s * .48, y + s * .35 + i * s * .1); ctx.lineTo(x - s * .34, y + s * .42 + i * s * .1); ctx.lineTo(x - s * .2, y + s * .35 + i * s * .1); ctx.stroke(); } } // galones
      if (m.tesorero) { ctx.strokeStyle = "#e8b923"; ctx.lineWidth = Math.max(1.5, s * .06); ctx.beginPath(); ctx.arc(x, y + s * .22, s * .28, Math.PI * .15, Math.PI * .85); ctx.stroke(); } // cadena
      if (m.cirujano) { borde(ctx, s); redondo(ctx, x + s * .3, y + s * .8, s * .18, s * .16, s * .04, "#8a6a3a"); } // bolsa
      if (m.cantero) { ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .08); ctx.beginPath(); ctx.moveTo(x - s * .3, y + s * .85); ctx.lineTo(x - s * .3, y + s * .6); ctx.stroke(); ctx.fillStyle = METAL2; ctx.fillRect(x - s * .4, y + s * .55, s * .2, s * .1); } // martillo
      if (m.estandarte) { ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .07); ctx.beginPath(); ctx.moveTo(x + s * .55, y + s * .9); ctx.lineTo(x + s * .55, y - s * .9); ctx.stroke(); borde(ctx, s); poligono(ctx, [[x + s * .57, y - s * .9], [x + s * .95, y - s * .75], [x + s * .57, y - s * .6]], op.color || "#888"); } // banderín
      if (m.gala) { ctx.strokeStyle = "#e8b923"; ctx.lineWidth = Math.max(1.5, s * .05); ctx.beginPath(); ctx.moveTo(x - s * .4, y + s * .72); ctx.lineTo(x + s * .4, y + s * .72); ctx.stroke(); } // cinturón de gala
    }
    // objetos equipados: montura (detrás, ya dibujada por dibujarObjetos "antes"), arma, escudo, cabeza
    dibujarObjetos(ctx, x, y, s, op, "despues");
    // marca de héroe: estrella dorada pequeña arriba a la izquierda (se ve también en el mapa)
    if (FWM.iconos && FWM.iconos.I && FWM.iconos.I.estrella) { FWM.iconos.I.estrella(ctx, x - s * .72, y - s * .82, s * .24, TINTA); FWM.iconos.I.estrella(ctx, x - s * .72, y - s * .82, s * .18, "#ffd23f"); }
  }
  F.heroe_espadachin = (ctx, x, y, s, op) => {
    op = op || {};
    heroeBase(ctx, x, y, s, op, (marcas) => {
      // espada grande a la derecha, detrás de la cabeza
      ctx.save(); ctx.translate(x + s * .7, y + s * .55); ctx.rotate(Math.PI / 7);
      borde(ctx, s); redondo(ctx, 0, -s * .6, s * .2, s * 1.2, s * .05, METAL);
      ctx.beginPath(); ctx.moveTo(-s * .3, 0); ctx.lineTo(s * .3, 0); ctx.strokeStyle = "#e8b923"; ctx.lineWidth = Math.max(2, s * .12); ctx.stroke();
      ctx.restore();
      cabeza(ctx, x, y, s, op);
      borde(ctx, s);
      if (marcas.includes("casco")) { ctx.beginPath(); ctx.arc(x, y - s * .2, s * .52, Math.PI, 0); ctx.closePath(); relleno(ctx, marcas.includes("cota") ? METAL : "#8a5a2a"); }
      else { ctx.beginPath(); ctx.arc(x, y - s * .2, s * .5, Math.PI, 0); ctx.closePath(); relleno(ctx, "#c0392b"); }
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
      // hacha a la derecha
      ctx.strokeStyle = MADERA2; ctx.lineWidth = Math.max(2, s * .11); ctx.beginPath(); ctx.moveTo(x + s * .6, y + s * .95); ctx.lineTo(x + s * .6, y - s * .5); ctx.stroke();
      borde(ctx, s); ctx.beginPath(); ctx.moveTo(x + s * .6, y - s * .55); ctx.quadraticCurveTo(x + s * 1.05, y - s * .5, x + s * .95, y - s * .05); ctx.quadraticCurveTo(x + s * .75, y - s * .2, x + s * .6, y - s * .1); ctx.closePath(); relleno(ctx, METAL);
    });
  };
  F.heroe_alquimista = (ctx, x, y, s, op) => {
    op = op || {};
    heroeBase(ctx, x, y, s, op, (marcas) => {
      // túnica morada larga sobre el cuerpo
      borde(ctx, s); poligono(ctx, [[x - s * .4, y + s * .2], [x + s * .4, y + s * .2], [x + s * .5, y + s * .95], [x - s * .5, y + s * .95]], "#5b3d8a");
      cabeza(ctx, x, y, s, op);
      // capucha morada puntiaguda
      borde(ctx, s);
      poligono(ctx, [[x - s * .56, y - s * .2], [x + s * .1, y - s * 1.05], [x + s * .56, y - s * .2], [x + s * .5, y - s * .3], [x + s * .05, y - s * .62], [x - s * .5, y - s * .3]], "#7a52b5");
      if (marcas.includes("casco")) { ctx.beginPath(); ctx.arc(x, y - s * .25, s * .3, Math.PI, 0); ctx.closePath(); relleno(ctx, METAL); }
      // frasco con fuego a la derecha
      borde(ctx, s); redondo(ctx, x + s * .62, y + s * .45, s * .28, s * .4, s * .1, "#2f6fd6");
      ctx.fillStyle = "#ff7a1a"; ctx.beginPath(); ctx.moveTo(x + s * .62, y - s * .15); ctx.lineTo(x + s * .78, y + s * .15); ctx.lineTo(x + s * .62, y + s * .05); ctx.lineTo(x + s * .46, y + s * .15); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#ffd23f"; ctx.beginPath(); ctx.arc(x + s * .62, y + s * .05, s * .07, 0, Math.PI * 2); ctx.fill();
    });
  };
  // Lienzo con el héroe grande (perfil, cara a cara, ceremonia) o pequeño. heroe = { clase, nivel, mejoras }.
  F.canvasHeroe = function (heroe, color, tam, detalle, enemigo) {
    const c = document.createElement("canvas");
    const dpr = window.devicePixelRatio || 1;
    c.width = tam * dpr; c.height = tam * dpr;
    const ctx = c.getContext("2d"); ctx.scale(dpr, dpr);
    const s = tam * .36;
    (F["heroe_" + (heroe && heroe.clase)] || F.heroe_espadachin)(ctx, tam / 2, tam / 2 + s * .02, s, { color, enemigo: !!enemigo, heroe: heroe || {}, detalle: !!detalle });
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
  F.canvasTropa = function (tipo, color, tam, enemigo) {
    const c = document.createElement("canvas");
    const dpr = window.devicePixelRatio || 1;
    c.width = tam * dpr; c.height = tam * dpr;
    const ctx = c.getContext("2d"); ctx.scale(dpr, dpr);
    const s = tam * .4;
    F.peana(ctx, tam / 2, tam / 2 - s * .05, s, color);
    (F[tipo] || F["heroe_" + tipo] || F.campesino)(ctx, tam / 2, tam / 2 - s * .05, s, { color, enemigo: !!enemigo, heroe: (F[tipo] ? null : { clase: tipo, nivel: 1 }) || (typeof enemigo === "object" ? enemigo : null) });
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
