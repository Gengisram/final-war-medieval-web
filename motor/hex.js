// Geometría hexagonal. Coordenadas axiales (q, r), punta arriba.
// Las claves de hexágono son cadenas "q,r".
window.FWM = window.FWM || {};

FWM.hex = (function () {
  const VECINOS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

  function clave(q, r) { return q + "," + r; }
  function desde(clave) { const [q, r] = clave.split(",").map(Number); return { q, r }; }

  function vecinos(clave) {
    const { q, r } = desde(clave);
    return VECINOS.map(([dq, dr]) => clave_(q + dq, r + dr));
  }
  function clave_(q, r) { return q + "," + r; }

  function distancia(a, b) {
    const A = desde(a), B = desde(b);
    const dq = A.q - B.q, dr = A.r - B.r;
    return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
  }

  // Todos los hexágonos a distancia <= n de "centro" (incluido él).
  function anillo(centro, n) {
    const { q, r } = desde(centro);
    const lista = [];
    for (let dq = -n; dq <= n; dq++) {
      for (let dr = Math.max(-n, -dq - n); dr <= Math.min(n, -dq + n); dr++) {
        lista.push(clave_(q + dq, r + dr));
      }
    }
    return lista;
  }

  // Hex -> píxel (centro), tamaño = radio.
  function aPixel(clave, tam) {
    const { q, r } = desde(clave);
    return { x: tam * Math.sqrt(3) * (q + r / 2), y: tam * 1.5 * r };
  }

  // Píxel -> hex (redondeo cúbico).
  function desdePixel(x, y, tam) {
    const qf = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / tam;
    const rf = (2 / 3 * y) / tam;
    return redondear(qf, rf);
  }

  function redondear(qf, rf) {
    const sf = -qf - rf;
    let q = Math.round(qf), r = Math.round(rf), s = Math.round(sf);
    const dq = Math.abs(q - qf), dr = Math.abs(r - rf), ds = Math.abs(s - sf);
    if (dq > dr && dq > ds) q = -r - s;
    else if (dr > ds) r = -q - s;
    return clave_(q, r);
  }

  // Vértices de un hexágono (para dibujar).
  function esquinas(cx, cy, tam) {
    const puntos = [];
    for (let i = 0; i < 6; i++) {
      const ang = Math.PI / 180 * (60 * i - 30);
      puntos.push([cx + tam * Math.cos(ang), cy + tam * Math.sin(ang)]);
    }
    return puntos;
  }

  // Búsqueda de alcance con coste. puedeEntrar(clave, esDestino) -> coste o null.
  // Devuelve { clave: { coste, desde } } para todos los alcanzables con puntos.
  // terminal(clave) -> true si se puede entrar pero no seguir desde ahí.
  function alcanzables(origen, puntos, costeDe, terminal) {
    const resultado = {};
    resultado[origen] = { coste: 0, desde: null };
    const cola = [origen];
    while (cola.length) {
      const actual = cola.shift();
      if (actual !== origen && terminal && terminal(actual)) continue;
      const gastado = resultado[actual].coste;
      for (const v of vecinos(actual)) {
        const c = costeDe(v, actual);
        if (c == null) continue;
        const total = gastado + c;
        if (total > puntos) continue;
        if (resultado[v] && resultado[v].coste <= total) continue;
        resultado[v] = { coste: total, desde: actual };
        cola.push(v);
      }
    }
    delete resultado[origen];
    return resultado;
  }

  function ruta(alcanzados, destino) {
    const camino = [];
    let c = destino;
    while (c && alcanzados[c]) { camino.unshift(c); c = alcanzados[c].desde; }
    return camino;
  }

  return { clave, desde, vecinos, distancia, anillo, aPixel, desdePixel, esquinas, alcanzables, ruta, VECINOS };
})();
