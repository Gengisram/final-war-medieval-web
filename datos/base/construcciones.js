// Construcciones dentro de los asentamientos (huecos de construcción).
// Vacío en v1. El formato queda definido para el futuro:
//
// herreria: {
//   nombre: "Herrería",
//   coste: { oro: 30, hierro: 2 },
//   requiere: ["cantería"],
//   enAsentamientos: ["ciudad"],
//   efectos: [ { tipo: "stat", etiqueta: "armadura", stat: "defensa", valor: 1 } ],
//   integridad: 4,          // para saqueo
//   valorSaqueo: { oro: 15 },
//   icono: "herreria",
// }
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.construcciones = {};
