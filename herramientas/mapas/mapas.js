// Generador de mapas históricos a partir de coordenadas reales (lon, lat).
// La rejilla es hexagonal pointy-top: columna c -> x = √3·(c + 0.5 si fila impar), fila r -> y = 1.5·r.
// Para que la escala sea la misma en los dos ejes: km por unidad de dibujo igual en x e y.

const AGUA = "~", LLANURA = ".", BOSQUE = "f", COLINA = "c", MONTANA = "M", ORO = "o", CLAVE = "*";

function crearProyeccion({ lon0, lon1, lat0, lat1, cols, filas }) {
  return {
    col: (lon) => (lon - lon0) / (lon1 - lon0) * (cols - 1),
    fila: (lat) => (lat0 - lat) / (lat0 - lat1) * (filas - 1),
    cols, filas,
  };
}
// Comprobación de escala: cuántos km representa una unidad de dibujo en cada eje.
function escala(p, { lon0, lon1, lat0, lat1, cols, filas }) {
  const latMedia = (lat0 + lat1) / 2;
  const kmLon = 111 * Math.cos(latMedia * Math.PI / 180);
  const anchoKm = (lon1 - lon0) * kmLon, altoKm = (lat0 - lat1) * 111;
  return { x: anchoKm / ((cols - 1) * Math.sqrt(3)), y: altoKm / ((filas - 1) * 1.5) };
}

// punto dentro de polígono (coordenadas ya en col/fila)
function dentro(px, py, pol) {
  let d = false;
  for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) {
    const [xi, yi] = pol[i], [xj, yj] = pol[j];
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) d = !d;
  }
  return d;
}
// distancia de un punto a un segmento (para cordilleras y ríos definidos por polilíneas)
function distSeg(px, py, [x1, y1], [x2, y2]) {
  const dx = x2 - x1, dy = y2 - y1; const L2 = dx * dx + dy * dy;
  let t = L2 ? ((px - x1) * dx + (py - y1) * dy) / L2 : 0; t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
function distPolilinea(px, py, linea) {
  let d = Infinity;
  for (let i = 1; i < linea.length; i++) d = Math.min(d, distSeg(px, py, linea[i - 1], linea[i]));
  return d;
}

// centro visual de la celda (col, fila): las filas impares van medio hexágono a la derecha
const cx = (c, r) => c + (r % 2 ? 0.5 : 0);

function construir(def) {
  const p = crearProyeccion(def);
  const P = (pts) => pts.map(([lon, lat]) => [p.col(lon), p.fila(lat)]);
  const tierras = (def.tierras || []).map(t => ({ pol: P(t.puntos), nombre: t.nombre }));
  const relieves = (def.relieves || []).map(m => ({ linea: P(m.puntos), ancho: m.ancho, tipo: m.tipo }));
  const rejilla = [];
  for (let r = 0; r < def.filas; r++) {
    const fila = [];
    for (let c = 0; c < def.cols; c++) {
      const x = cx(c, r), y = r;
      let ch = AGUA;
      if (tierras.some(t => dentro(x, y, t.pol))) ch = LLANURA;
      fila.push(ch);
    }
    rejilla.push(fila);
  }
  // istmos: uniones a mano (sin barcos, las islas quedarían incomunicadas)
  for (const [c, r] of (def.istmos || [])) if (rejilla[r] && rejilla[r][c] !== undefined) rejilla[r][c] = LLANURA;
  for (const [c, r] of (def.mares || [])) if (rejilla[r] && rejilla[r][c] !== undefined) rejilla[r][c] = AGUA;
  // relieve encima de la tierra
  for (let r = 0; r < def.filas; r++) for (let c = 0; c < def.cols; c++) {
    if (rejilla[r][c] === AGUA) continue;
    const x = cx(c, r);
    for (const m of relieves) if (distPolilinea(x, r, m.linea) <= m.ancho) { rejilla[r][c] = m.tipo; break; }
  }
  return rejilla;
}

// ---- utilidades de comprobación ----
const vecinosDe = (c, r) => {
  const impar = r % 2 ? 1 : 0;
  return [[c - 1, r], [c + 1, r], [c - 1 + impar, r - 1], [c + impar, r - 1], [c - 1 + impar, r + 1], [c + impar, r + 1]];
};
function masas(rejilla) {
  const filas = rejilla.length, cols = rejilla[0].length;
  const visto = rejilla.map(f => f.map(() => false));
  const grupos = [];
  for (let r = 0; r < filas; r++) for (let c = 0; c < cols; c++) {
    if (rejilla[r][c] === AGUA || visto[r][c]) continue;
    const pila = [[c, r]]; visto[r][c] = true; const g = [];
    while (pila.length) {
      const [cc, rr] = pila.pop(); g.push([cc, rr]);
      for (const [vc, vr] of vecinosDe(cc, rr)) {
        if (vr < 0 || vr >= filas || vc < 0 || vc >= cols) continue;
        if (visto[vr][vc] || rejilla[vr][vc] === AGUA) continue;
        visto[vr][vc] = true; pila.push([vc, vr]);
      }
    }
    grupos.push(g);
  }
  return grupos.sort((a, b) => b.length - a.length);
}
function pintar(rejilla) { return rejilla.map((f, r) => (r % 2 ? " " : "") + f.join(" ")).join("\n"); }
function comoFilas(rejilla) { return rejilla.map(f => '"' + f.join("") + '",').join("\n"); }

module.exports = { AGUA, LLANURA, BOSQUE, COLINA, MONTANA, ORO, CLAVE, construir, escala, masas, pintar, comoFilas, vecinosDe, cx };
