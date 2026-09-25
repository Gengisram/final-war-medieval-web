const M = require("./mapas.js");
const A = require("./acabado.js");

// Europa, de Iberia a Constantinopla. Varios polígonos que se solapan: cada uno es una parte del
// continente cerrada por su costa (y por el borde del mapa donde la tierra se corta).
const def = {
  lon0: -10.5, lon1: 30.5, lat0: 65.0, lat1: 36.0, cols: 26, filas: 33,
  tierras: [
    // 1. Iberia
    { nombre: "iberia", puntos: [
      [-7.7, 43.8], [-5.7, 43.6], [-3.0, 43.4], [-1.5, 43.5], [-1.2, 44.7], [-1.0, 43.0], [0.7, 42.7], [3.0, 42.5],
      [2.2, 41.3], [0.7, 40.6], [-0.3, 39.4], [-0.8, 37.6], [-2.5, 36.8], [-5.4, 36.1], [-6.9, 37.2],
      [-8.9, 37.0], [-9.5, 38.8], [-8.7, 41.2], [-9.3, 42.9], [-8.4, 43.4],
    ] },
    // 2. Francia, Países Bajos, Alemania y Europa central hasta Polonia y los Cárpatos
    { nombre: "europa central", puntos: [
      [-1.5, 43.4], [-1.2, 44.7], [-1.2, 46.2], [-2.2, 47.3], [-4.8, 48.4], [-1.6, 49.7], [0.1, 49.5],
      [1.6, 51.0], [4.3, 51.4], [4.9, 52.9], [8.5, 53.7], [8.4, 55.5], [10.6, 57.7], [10.2, 56.2],
      [10.1, 54.4], [12.1, 54.4], [14.5, 54.0], [18.7, 54.4], [21.1, 55.7], [24.1, 57.0], [24.7, 59.4],
      [30.6, 59.9], [30.6, 47.0], [28.7, 45.3], [26.0, 44.0], [22.5, 44.5], [19.5, 45.5], [16.0, 45.6],
      [13.6, 45.8], [12.3, 45.4], [10.0, 44.2], [8.9, 44.4], [7.3, 43.7], [5.3, 43.3], [3.0, 42.5],
      [0.7, 42.7], [-1.0, 43.0],
    ] },
    // 3. Italia (la bota) y Sicilia, pegada por el estrecho de Mesina
    { nombre: "italia", puntos: [
      [8.9, 44.4], [10.3, 43.5], [11.2, 42.4], [12.2, 41.7], [13.6, 41.2], [14.2, 40.8], [15.3, 40.0],
      [15.6, 38.0], [15.1, 37.5], [12.4, 37.8], [13.4, 38.4], [15.6, 38.6], [16.6, 39.0], [17.2, 40.5],
      [18.5, 40.1], [16.9, 41.1], [14.0, 42.4], [13.5, 43.6], [12.3, 45.4], [10.0, 44.2],
    ] },
    // 4. Los Balcanes y Grecia
    { nombre: "balcanes", puntos: [
      [13.6, 45.8], [16.0, 45.6], [19.5, 45.5], [22.5, 44.5], [26.0, 44.0], [28.7, 45.3], [27.9, 43.2],
      [28.2, 41.6], [26.2, 40.0], [23.7, 40.5], [22.9, 40.6], [23.8, 38.0], [23.2, 37.0], [22.5, 36.4],
      [21.7, 38.2], [20.8, 38.9], [19.5, 41.3], [18.1, 42.6], [16.4, 43.5],
    ] },
    // 5. Tracia y el rincón de Anatolia (Constantinopla a caballo entre dos orillas)
    { nombre: "anatolia", puntos: [
      [26.2, 40.0], [28.2, 41.6], [30.6, 41.7], [30.6, 38.0], [27.1, 38.4], [26.4, 39.5],
    ] },
    // 6. Gran Bretaña e Irlanda, con el paso de Calais como única unión (no hay barcos)
    { nombre: "gran bretaña", puntos: [
      [-4.7, 58.6], [-3.0, 58.6], [-2.1, 57.1], [-2.5, 56.4], [-1.5, 55.0], [-0.2, 54.1], [0.3, 52.9],
      [1.75, 52.6], [1.45, 51.05], [-1.9, 50.65], [-5.7, 50.07], [-3.0, 51.4], [-5.05, 51.7],
      [-4.1, 52.9], [-3.0, 53.4], [-3.5, 54.9], [-5.0, 55.5], [-5.3, 56.5], [-5.7, 57.3], [-5.0, 58.3],
    ] },
    { nombre: "irlanda", puntos: [
      [-7.3, 55.4], [-5.9, 54.6], [-6.1, 53.3], [-6.2, 52.2], [-8.4, 51.8], [-10.3, 52.2],
      [-9.5, 53.3], [-9.9, 54.2], [-8.5, 54.7], [-8.8, 55.2],
    ] },
    { nombre: "paso de Calais", puntos: [[1.2, 51.7], [2.7, 51.7], [2.7, 50.7], [1.2, 50.7]] },
    { nombre: "canal del Norte", puntos: [[-6.7, 55.7], [-4.5, 55.7], [-4.5, 54.8], [-6.7, 54.8]] },
    // 7. Escandinavia: Noruega y Suecia, cortadas por arriba (Laponia sigue fuera del mapa)
    { nombre: "escandinavia", puntos: [
      [5.0, 65.4], [5.3, 60.4], [5.5, 58.9], [8.0, 58.0], [10.5, 59.0], [11.9, 57.7], [12.9, 55.4],
      [16.4, 56.7], [18.1, 59.3], [17.1, 60.7], [20.3, 63.8], [21.5, 65.4],
    ] },
    // 8. Finlandia y el noroeste de Rusia, unidos a Escandinavia por arriba
    { nombre: "finlandia", puntos: [
      [21.5, 65.4], [30.6, 65.4], [30.6, 59.9], [24.7, 59.4], [21.4, 61.0], [21.0, 63.5],
    ] },
  ],
  relieves: [
    { tipo: M.MONTANA, ancho: 0.5, puntos: [[-1.5, 43.2], [0.7, 42.7], [2.9, 42.4]] },                       // Pirineos
    { tipo: M.COLINA, ancho: 0.55, puntos: [[-6.5, 43.0], [-3.5, 42.8]] },                                   // Cordillera Cantábrica
    { tipo: M.COLINA, ancho: 0.5, puntos: [[-5.5, 40.5], [-3.5, 41.0]] },                                    // Sistema Central
    { tipo: M.COLINA, ancho: 0.5, puntos: [[-5.5, 38.3], [-3.0, 37.9]] },                                    // Sierra Morena y Bética
    { tipo: M.MONTANA, ancho: 0.6, puntos: [[6.0, 45.2], [8.5, 46.5], [11.0, 47.0], [13.5, 47.2]] },         // Alpes
    { tipo: M.COLINA, ancho: 0.5, puntos: [[2.5, 45.0], [4.0, 44.8]] },                                      // Macizo Central
    { tipo: M.COLINA, ancho: 0.5, puntos: [[10.5, 43.8], [13.0, 42.5], [15.0, 40.5]] },                      // Apeninos
    { tipo: M.COLINA, ancho: 0.5, puntos: [[8.0, 50.0], [11.0, 50.3], [13.5, 50.5]] },                       // macizos de Alemania central
    { tipo: M.MONTANA, ancho: 0.55, puntos: [[19.0, 49.5], [22.5, 48.0], [25.5, 46.0], [24.0, 45.4]] },      // Cárpatos
    { tipo: M.COLINA, ancho: 0.55, puntos: [[16.5, 44.0], [19.5, 42.8], [21.0, 41.5], [21.5, 39.8]] },       // montes dináricos y Pindo
    { tipo: M.MONTANA, ancho: 0.5, puntos: [[7.5, 61.5], [9.0, 62.5]] },                                     // montes de Noruega
    { tipo: M.COLINA, ancho: 0.6, puntos: [[6.5, 59.5], [10.0, 61.0], [13.0, 63.5]] },                       // dorsal escandinava
    { tipo: M.BOSQUE, ancho: 0.6, puntos: [[9.0, 52.5], [13.0, 52.8], [17.0, 52.5]] },                       // llanura del norte
    { tipo: M.BOSQUE, ancho: 0.6, puntos: [[22.0, 54.0], [26.0, 55.5], [29.0, 57.0]] },                      // bosques bálticos
    { tipo: M.BOSQUE, ancho: 0.6, puntos: [[25.0, 62.0], [28.0, 63.5]] },                                    // bosques de Finlandia
    { tipo: M.BOSQUE, ancho: 0.5, puntos: [[7.0, 48.8], [8.5, 48.0]] },                                      // Selva Negra
    { tipo: M.BOSQUE, ancho: 0.5, puntos: [[-0.5, 47.5], [1.5, 47.8]] },                                     // bosques del Loira
  ],
};

const rejilla = M.construir(def);
const proy = { col: (lon) => (lon - def.lon0) / (def.lon1 - def.lon0) * (def.cols - 1), fila: (lat) => (def.lat0 - lat) / (def.lat0 - def.lat1) * (def.filas - 1) };
console.log("masas antes de unir:", M.masas(rejilla).map(g => g.length + " [" + g[0] + "]").join(" | "));
console.log("islotes de un hexágono borrados:", JSON.stringify(A.quitarIslotes(rejilla, 2)));
console.log("pasos de tierra añadidos:", JSON.stringify(A.conectarMasas(rejilla)));

console.log("pasos abiertos en la montaña:", JSON.stringify(A.abrirPasos(rejilla)));

const res = A.acabar(rejilla, proy, {
  sepCapitales: 4,
  capitales: [
    { letra: "E", nombre: "Scone (Escocia)", lon: -3.42, lat: 56.42 },
    { letra: "I", nombre: "Londres (Inglaterra)", lon: -0.13, lat: 51.51 },
    { letra: "N", nombre: "Nidaros (Noruega)", lon: 10.4, lat: 63.4 },
    { letra: "F", nombre: "París (Francia)", lon: 2.35, lat: 48.85 },
    { letra: "S", nombre: "Aquisgrán (Sacro Imperio)", lon: 6.08, lat: 50.78 },
    { letra: "L", nombre: "Cracovia (Polonia)", lon: 19.94, lat: 50.06 },
    { letra: "H", nombre: "Buda (Hungría)", lon: 19.04, lat: 47.5 },
    { letra: "V", nombre: "Venecia", lon: 12.33, lat: 45.44 },
    { letra: "B", nombre: "Constantinopla (Bizancio)", lon: 28.98, lat: 41.01 },
    { letra: "C", nombre: "Toledo (Castilla)", lon: -4.02, lat: 39.86 },
    { letra: "A", nombre: "Zaragoza (Aragón)", lon: -0.88, lat: 41.65 },
    { letra: "P", nombre: "Lisboa (Portugal)", lon: -9.14, lat: 38.72 },
  ],
  oroCerca: 2, puntosClave: 10, minasSueltas: 16,
});
console.log("escala km/unidad:", M.escala(null, def));
console.log("capitales:\n  " + res.puestas.map(p => p.letra + " " + p.nombre + " en " + p.pos + (p.desviacion ? " (movida " + p.desviacion + ")" : "")).join("\n  "));
console.log(JSON.stringify(A.revisar(rejilla), null, 1));
console.log(M.pintar(rejilla));
console.log("\n--- filas ---");
console.log(M.comoFilas(rejilla));
