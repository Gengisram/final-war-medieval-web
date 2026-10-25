const M = require("./mapas.js");

// distancia hexagonal entre dos celdas (col, fila) usando coordenadas axiales q = c - floor(r/2)
function axial(c, r) { return { q: c - Math.floor(r / 2), r }; }
function dist(a, b) {
  const A = axial(a[0], a[1]), B = axial(b[0], b[1]);
  return (Math.abs(A.q - B.q) + Math.abs(A.q + A.r - B.q - B.r) + Math.abs(A.r - B.r)) / 2;
}

// Coloca capitales (letra), minas de oro y puntos clave respetando las reglas de los mapas del juego:
//   · capitales separadas al menos `sepCapitales`
//   · cada capital con `oroCerca` minas a distancia 2 o menos
//   · puntos clave a 3 o más de cualquier capital
//   · nada de esto sobre montaña ni agua
function acabar(rejilla, proy, opciones) {
  const { capitales, oroCerca = 2, puntosClave = 0, sepCapitales = 4, minasSueltas = 0 } = opciones;
  const filas = rejilla.length, cols = rejilla[0].length;
  const esTierra = (c, r) => rejilla[r] && rejilla[r][c] && rejilla[r][c] !== M.AGUA;
  const libre = (c, r) => esTierra(c, r) && rejilla[r][c] !== M.MONTANA && !/[A-Z1-9*o]/.test(rejilla[r][c]);
  const todas = [];
  for (let r = 0; r < filas; r++) for (let c = 0; c < cols; c++) if (esTierra(c, r)) todas.push([c, r]);

  // 1. capitales: en su ciudad real, o en la casilla libre más cercana
  const puestas = [];
  for (const cap of capitales) {
    const c0 = Math.round(proy.col(cap.lon)), r0 = Math.round(proy.fila(cap.lat));
    const cand = todas.filter(p => libre(p[0], p[1]) && puestas.every(q => dist(p, q.pos) >= sepCapitales))
      .sort((a, b) => dist(a, [c0, r0]) - dist(b, [c0, r0]));
    if (!cand.length) throw new Error("sin sitio para la capital " + cap.letra);
    const pos = cand[0];
    rejilla[pos[1]][pos[0]] = cap.letra;
    puestas.push({ letra: cap.letra, nombre: cap.nombre, pos, desviacion: dist(pos, [c0, r0]) });
  }
  // 2. oro junto a cada capital
  for (const cap of puestas) {
    const cerca = todas.filter(p => libre(p[0], p[1]) && dist(p, cap.pos) <= 2 && dist(p, cap.pos) >= 1)
      .sort((a, b) => dist(a, cap.pos) - dist(b, cap.pos));
    let puesto = 0;
    for (const p of cerca) { if (puesto >= oroCerca) break; rejilla[p[1]][p[0]] = M.ORO; puesto++; }
  }
  // 3. puntos clave, lejos de las capitales y repartidos
  const claves = [];
  const candidatosClave = todas.filter(p => libre(p[0], p[1]) && puestas.every(q => dist(p, q.pos) >= 3));
  for (let i = 0; i < puntosClave; i++) {
    let mejor = null, mejorD = -1;
    for (const p of candidatosClave) {
      if (!libre(p[0], p[1])) continue;
      const d = Math.min(...claves.map(q => dist(p, q)), 99) + Math.min(...puestas.map(q => dist(p, q.pos))) * 0.35;
      if (d > mejorD) { mejorD = d; mejor = p; }
    }
    if (!mejor) break;
    rejilla[mejor[1]][mejor[0]] = M.CLAVE; claves.push(mejor);
  }
  // 4. minas sueltas repartidas por el mapa
  const oros = [];
  for (let i = 0; i < minasSueltas; i++) {
    let mejor = null, mejorD = -1;
    for (const p of todas) {
      if (!libre(p[0], p[1])) continue;
      const d = Math.min(...oros.map(q => dist(p, q)), 99) + Math.min(...claves.map(q => dist(p, q)), 99) * 0.2;
      if (d > mejorD) { mejorD = d; mejor = p; }
    }
    if (!mejor) break;
    rejilla[mejor[1]][mejor[0]] = M.ORO; oros.push(mejor);
  }
  return { puestas, claves: claves.length, oros: oros.length };
}

// Comprobaciones que exige el juego.
function revisar(rejilla) {
  const grupos = M.masas(rejilla);
  const filas = rejilla.length, cols = rejilla[0].length;
  const capitales = [];
  for (let r = 0; r < filas; r++) for (let c = 0; c < cols; c++) if (/[A-Z]/.test(rejilla[r][c]) && rejilla[r][c] !== "M") capitales.push([c, r]);
  const problemas = [];
  if (grupos.length > 1) problemas.push("hay " + grupos.length + " masas de tierra: " + grupos.map(g => g.length).join(", "));
  for (let i = 0; i < capitales.length; i++) for (let j = i + 1; j < capitales.length; j++) {
    const d = dist(capitales[i], capitales[j]);
    if (d < 4) problemas.push("capitales a " + d + ": " + JSON.stringify(capitales[i]) + " y " + JSON.stringify(capitales[j]));
  }
  for (const cap of capitales) {
    let oro = 0;
    for (let r = 0; r < filas; r++) for (let c = 0; c < cols; c++) if (rejilla[r][c] === M.ORO && dist([c, r], cap) <= 2) oro++;
    if (!oro) problemas.push("capital sin oro cerca: " + JSON.stringify(cap));
  }
  for (let r = 0; r < filas; r++) for (let c = 0; c < cols; c++) {
    if (rejilla[r][c] !== M.CLAVE) continue;
    for (const cap of capitales) if (dist([c, r], cap) < 3) problemas.push("punto clave pegado a una capital: " + c + "," + r);
  }
  return { grupos: grupos.map(g => g.length), capitales: capitales.length, problemas };
}

module.exports = { acabar, revisar, dist };

// Une las islas a la masa principal por el paso de agua más corto (sin barcos, una isla queda fuera del juego).
function conectarMasas(rejilla) {
  const M2 = require("./mapas.js");
  const puentes = [];
  for (let vuelta = 0; vuelta < 8; vuelta++) {
    const g = M2.masas(rejilla);
    if (g.length <= 1) break;
    const grande = g[0];
    let mejor = null;
    for (let i = 1; i < g.length; i++) for (const a of g[i]) for (const b of grande) {
      const d = dist(a, b);
      if (!mejor || d < mejor.d) mejor = { d, a, b };
    }
    if (!mejor) break;
    // rellenar el camino recto entre las dos orillas
    const N = mejor.d;
    const ax = mejor.a[0] + (mejor.a[1] % 2 ? 0.5 : 0), bx = mejor.b[0] + (mejor.b[1] % 2 ? 0.5 : 0);
    for (let k = 1; k < N; k++) {
      const t = k / N;
      const r = Math.round(mejor.a[1] + (mejor.b[1] - mejor.a[1]) * t);
      const x = ax + (bx - ax) * t;
      const c = Math.round(x - (r % 2 ? 0.5 : 0));
      if (rejilla[r] && rejilla[r][c] === M2.AGUA) { rejilla[r][c] = M2.LLANURA; puentes.push([c, r]); }
    }
  }
  return puentes;
}
module.exports.conectarMasas = conectarMasas;

// Abre pasos en las cordilleras: si un trozo de tierra solo se alcanza cruzando montaña, la montaña
// que lo cierra pasa a colina. El juego exige que toda la tierra sea alcanzable sin pisar montaña.
function abrirPasos(rejilla) {
  const M2 = require("./mapas.js");
  const filas = rejilla.length, cols = rejilla[0].length;
  const pasable = (c, r) => rejilla[r] && rejilla[r][c] && rejilla[r][c] !== M2.AGUA && rejilla[r][c] !== M2.MONTANA;
  const abiertas = [];
  for (let vuelta = 0; vuelta < 20; vuelta++) {
    // componentes de terreno pasable
    const visto = rejilla.map(f => f.map(() => false));
    const comps = [];
    for (let r = 0; r < filas; r++) for (let c = 0; c < cols; c++) {
      if (!pasable(c, r) || visto[r][c]) continue;
      const pila = [[c, r]]; visto[r][c] = true; const g = [];
      while (pila.length) {
        const [cc, rr] = pila.pop(); g.push([cc, rr]);
        for (const [vc, vr] of M2.vecinosDe(cc, rr)) {
          if (vr < 0 || vr >= filas || vc < 0 || vc >= cols) continue;
          if (visto[vr][vc] || !pasable(vc, vr)) continue;
          visto[vr][vc] = true; pila.push([vc, vr]);
        }
      }
      comps.push(g);
    }
    comps.sort((a, b) => b.length - a.length);
    if (comps.length <= 1) break;
    // la montaña que menos hay que tocar para unir la componente suelta con la grande
    const grande = new Set(comps[0].map(p => p[0] + "," + p[1]));
    let mejor = null;
    for (let i = 1; i < comps.length; i++) for (const p of comps[i]) {
      for (const [vc, vr] of M2.vecinosDe(p[0], p[1])) {
        if (vr < 0 || vr >= filas || vc < 0 || vc >= cols) continue;
        if (rejilla[vr][vc] !== M2.MONTANA) continue;
        // ¿esa montaña toca la componente grande?
        const tocaGrande = M2.vecinosDe(vc, vr).some(([wc, wr]) => grande.has(wc + "," + wr));
        const puntos = (tocaGrande ? 0 : 1) + comps[i].length * 0.001;
        if (!mejor || puntos < mejor.puntos) mejor = { puntos, c: vc, r: vr };
      }
    }
    if (!mejor) break;
    rejilla[mejor.r][mejor.c] = M2.COLINA; abiertas.push([mejor.c, mejor.r]);
  }
  return abiertas;
}
module.exports.abrirPasos = abrirPasos;

// Borra los islotes de un solo hexágono: unirlos con un puente inventado deforma la costa.
function quitarIslotes(rejilla, minimo) {
  const M2 = require("./mapas.js");
  minimo = minimo || 2; const fuera = [];
  for (const g of M2.masas(rejilla)) {
    if (g.length >= minimo || g === M2.masas(rejilla)[0]) continue;
    if (g.length >= minimo) continue;
    for (const [c, r] of g) { rejilla[r][c] = M2.AGUA; fuera.push([c, r]); }
  }
  return fuera;
}
module.exports.quitarIslotes = quitarIslotes;
