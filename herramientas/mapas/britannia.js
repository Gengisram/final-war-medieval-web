const M = require("./mapas.js");
const A = require("./acabado.js");

// Gran Bretaña e Irlanda, con una esquina del continente al sureste.
const def = {
  lon0: -10.9, lon1: 3.7, lat0: 58.9, lat1: 49.3, cols: 24, filas: 32,
  tierras: [
    { nombre: "gran bretaña", puntos: [
      [-4.7, 58.6], [-3.0, 58.65], [-2.0, 57.7], [-2.1, 57.1], [-2.5, 56.4], [-2.1, 55.8], [-1.5, 55.0],
      [-0.2, 54.1], [0.1, 53.5], [0.3, 52.9], [1.75, 52.6], [1.0, 51.8], [1.45, 51.05],
      [0.0, 50.75], [-1.9, 50.65], [-3.5, 50.55], [-5.7, 50.07], [-4.2, 51.2], [-3.0, 51.4],
      [-5.05, 51.7], [-4.1, 52.9], [-4.7, 53.3], [-3.0, 53.4], [-3.1, 54.1], [-3.5, 54.9],
      [-5.0, 55.5], [-5.7, 55.3], [-5.3, 56.5], [-5.7, 57.3], [-5.0, 58.3],
    ] },
    { nombre: "irlanda", puntos: [
      [-7.3, 55.4], [-5.9, 54.6], [-6.0, 53.9], [-6.1, 53.3], [-6.2, 52.2], [-7.6, 52.0], [-8.4, 51.8],
      [-9.9, 51.8], [-10.3, 52.2], [-9.5, 53.3], [-9.9, 54.2], [-8.5, 54.7], [-8.8, 55.2],
    ] },
    // licencias del juego (no hay barcos): dos pasos de tierra donde la historia cruzaba en barca
    { nombre: "paso de Antrim", puntos: [[-6.2, 55.45], [-4.9, 55.55], [-4.9, 55.15], [-6.2, 55.05]] },
    { nombre: "paso de Calais", puntos: [[1.3, 51.15], [2.1, 51.15], [2.1, 50.85], [1.3, 50.85]] },
    { nombre: "continente", puntos: [
      [1.55, 51.05], [3.9, 51.3], [3.9, 48.9], [0.1, 49.4], [0.4, 49.8],
    ] },
  ],
  relieves: [
    { tipo: M.MONTANA, ancho: 0.6, puntos: [[-5.0, 58.2], [-4.6, 57.3], [-4.9, 56.6]] },        // Highlands
    { tipo: M.COLINA, ancho: 0.7, puntos: [[-3.4, 57.1], [-4.3, 56.5]] },                        // Grampianos
    { tipo: M.COLINA, ancho: 0.7, puntos: [[-4.4, 55.3], [-2.9, 55.4]] },                        // Southern Uplands
    { tipo: M.COLINA, ancho: 0.55, puntos: [[-2.3, 54.9], [-2.0, 53.6]] },                       // Peninos
    { tipo: M.MONTANA, ancho: 0.45, puntos: [[-3.1, 54.5]] },                                    // Lake District
    { tipo: M.MONTANA, ancho: 0.5, puntos: [[-4.0, 53.05], [-3.7, 52.6]] },                      // Snowdonia
    { tipo: M.COLINA, ancho: 0.6, puntos: [[-3.6, 52.3], [-3.4, 51.9]] },                        // Gales central
    { tipo: M.COLINA, ancho: 0.5, puntos: [[-3.9, 50.6]] },                                      // Dartmoor
    { tipo: M.COLINA, ancho: 0.5, puntos: [[-2.0, 51.8], [-0.9, 51.7]] },                        // Cotswolds y Chilterns
    { tipo: M.MONTANA, ancho: 0.45, puntos: [[-9.6, 52.0]] },                                    // montes de Kerry
    { tipo: M.COLINA, ancho: 0.5, puntos: [[-6.4, 53.0]] },                                      // montes de Wicklow
    { tipo: M.COLINA, ancho: 0.55, puntos: [[-9.7, 53.5], [-9.5, 54.2]] },                       // Connemara y Mayo
    { tipo: M.BOSQUE, ancho: 0.6, puntos: [[-1.1, 53.1], [-1.0, 52.6]] },                        // Sherwood
    { tipo: M.BOSQUE, ancho: 0.55, puntos: [[0.4, 51.05], [-0.7, 50.95]] },                      // el Weald
    { tipo: M.BOSQUE, ancho: 0.5, puntos: [[-1.6, 50.9]] },                                      // New Forest
    { tipo: M.BOSQUE, ancho: 0.6, puntos: [[-7.6, 53.2], [-7.0, 52.7]] },                        // bosques de Irlanda
    { tipo: M.BOSQUE, ancho: 0.6, puntos: [[2.6, 50.3], [1.6, 49.6]] },                          // bosques del continente
  ],
  // sin barcos, dos pasos de tierra: el canal del Norte (Kintyre-Antrim) y el paso de Calais
  istmos: [],
};

const rejilla = M.construir(def);
const proy = { col: (lon) => (lon - def.lon0) / (def.lon1 - def.lon0) * (def.cols - 1), fila: (lat) => (def.lat0 - lat) / (def.lat0 - def.lat1) * (def.filas - 1) };
// istmos por coordenadas: entre Kintyre y Antrim, y entre Dover y Calais
console.log("islotes de un hexágono borrados:", JSON.stringify(A.quitarIslotes(rejilla, 2)));
console.log("pasos de tierra añadidos:", JSON.stringify(A.conectarMasas(rejilla)));

console.log("pasos abiertos en la montaña:", JSON.stringify(A.abrirPasos(rejilla)));

const res = A.acabar(rejilla, proy, {
  capitales: [
    { letra: "E", nombre: "Scone (Escocia)", lon: -3.42, lat: 56.42 },
    { letra: "I", nombre: "Londres (Inglaterra)", lon: -0.13, lat: 51.51 },
    { letra: "N", nombre: "Dublín (nórdicos)", lon: -6.26, lat: 53.35 },
    { letra: "F", nombre: "Ruan (Francia)", lon: 1.1, lat: 49.44 },
  ],
  oroCerca: 2, puntosClave: 6, minasSueltas: 8,
});
console.log("escala km/unidad:", M.escala(null, def));
console.log("capitales:\n  " + res.puestas.map(p => p.letra + " " + p.nombre + " en " + p.pos + (p.desviacion ? " (movida " + p.desviacion + ")" : "")).join("\n  "));
console.log(JSON.stringify(A.revisar(rejilla), null, 1));
console.log(M.pintar(rejilla));
console.log("\n--- filas ---");
console.log(M.comoFilas(rejilla));
