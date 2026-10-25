const M = require("./mapas.js");
const A = require("./acabado.js");

// Península Ibérica + el Languedoc y Aquitania al noreste (para que Francia tenga tierra propia).
const def = {
  lon0: -9.9, lon1: 3.6, lat0: 44.9, lat1: 35.8, cols: 20, filas: 19,
  tierras: [{
    nombre: "iberia", puntos: [
      [-7.7, 43.8], [-5.7, 43.6], [-3.8, 43.5], [-3.0, 43.4], [-2.0, 43.4], [-1.5, 43.5],
      [-1.2, 45.4], [4.5, 45.4], [3.3, 43.3], [3.2, 42.4],
      [2.2, 41.3], [0.9, 41.0], [0.7, 40.6], [0.0, 40.0], [-0.3, 39.4], [-0.5, 38.3], [-0.8, 37.6],
      [-1.9, 36.9], [-2.5, 36.8], [-4.4, 36.7], [-5.4, 36.1],
      [-6.3, 36.6], [-6.9, 37.2], [-7.4, 37.2], [-8.9, 36.98], [-8.8, 38.5], [-9.5, 38.8],
      [-8.8, 40.2], [-8.7, 41.2], [-8.9, 41.9], [-9.3, 42.9], [-8.4, 43.4],
    ],
  }],
  relieves: [
    { tipo: M.MONTANA, ancho: 0.55, puntos: [[-1.5, 43.2], [-0.5, 42.8], [0.7, 42.7], [1.8, 42.5], [2.9, 42.4]] },   // Pirineos
    { tipo: M.COLINA, ancho: 0.75, puntos: [[-7.0, 43.0], [-5.5, 43.0], [-4.0, 42.9], [-3.2, 42.8]] },               // Cordillera Cantábrica
    { tipo: M.MONTANA, ancho: 0.55, puntos: [[-6.1, 40.3], [-4.6, 40.6], [-3.5, 41.0]] },                            // Sistema Central
    { tipo: M.MONTANA, ancho: 0.5, puntos: [[-3.4, 37.1], [-2.6, 37.2]] },                                           // Sierra Nevada
    { tipo: M.COLINA, ancho: 0.7, puntos: [[-6.3, 38.2], [-4.8, 38.4], [-3.5, 38.6]] },                              // Sierra Morena
    { tipo: M.COLINA, ancho: 0.7, puntos: [[-2.6, 41.8], [-1.6, 40.7], [-0.9, 40.2]] },                              // Sistema Ibérico
    { tipo: M.COLINA, ancho: 0.6, puntos: [[-2.2, 38.0], [-1.2, 38.6]] },                                            // Sistema Bético
    { tipo: M.BOSQUE, ancho: 0.6, puntos: [[-8.3, 42.6], [-7.0, 42.5], [-6.0, 42.9]] },                              // Galicia y bosques del norte
    { tipo: M.BOSQUE, ancho: 0.55, puntos: [[-7.9, 40.3], [-7.3, 39.6]] },                                           // Sierra de la Estrella
    { tipo: M.BOSQUE, ancho: 0.5, puntos: [[0.5, 44.3], [2.0, 44.0]] },                                              // bosques de Aquitania
  ],
};

const rejilla = M.construir(def);
const proy = { col: (lon) => (lon - def.lon0) / (def.lon1 - def.lon0) * (def.cols - 1), fila: (lat) => (def.lat0 - lat) / (def.lat0 - def.lat1) * (def.filas - 1) };
console.log("islotes de un hexágono borrados:", JSON.stringify(A.quitarIslotes(rejilla, 2)));
console.log("pasos abiertos en la montaña:", JSON.stringify(A.abrirPasos(rejilla)));

const res = A.acabar(rejilla, proy, {
  capitales: [
    { letra: "P", nombre: "Lisboa (Portugal)", lon: -9.14, lat: 38.72 },
    { letra: "C", nombre: "Toledo (Castilla)", lon: -4.02, lat: 39.86 },
    { letra: "A", nombre: "Zaragoza (Aragón)", lon: -0.88, lat: 41.65 },
    { letra: "G", nombre: "Granada (Granada)", lon: -3.60, lat: 37.18 },
    { letra: "F", nombre: "Toulouse (Francia)", lon: 1.44, lat: 43.60 },
  ],
  oroCerca: 2, puntosClave: 6, minasSueltas: 8,
});
console.log("escala km/unidad:", M.escala(null, def));
console.log("capitales:", res.puestas.map(p => p.letra + " " + p.nombre + " en " + p.pos + (p.desviacion ? " (movida " + p.desviacion + ")" : "")).join("\n           "));
console.log(JSON.stringify(A.revisar(rejilla), null, 1));
console.log(M.pintar(rejilla));
console.log("\n--- filas ---");
console.log(M.comoFilas(rejilla));
