// Yacimientos: un hexágono que produce un recurso por turno mientras sea tuyo
// y esté conectado a un asentamiento tuyo.
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.yacimientos = {
  bosque:     { descripcion: "Da madera mientras sea tuyo y esté conectado a un asentamiento tuyo.", nombre: "Bosque",         produce: { madera: 1 }, icono: "bosque",  frecuencia: 4 },
  mina_oro:   { descripcion: "Da oro. El recurso que más falta hace: todo cuesta oro.", nombre: "Mina de oro",    produce: { oro: 1 },    icono: "oro",     frecuencia: 3 },
  cantera:    { descripcion: "Da piedra, para castillos y defensas.", nombre: "Cantera",        produce: { piedra: 1 }, icono: "piedra",  frecuencia: 3 },
  mina_hierro:{ descripcion: "Da hierro, para las tropas pesadas y las catapultas.", nombre: "Mina de hierro", produce: { hierro: 1 }, icono: "hierro",  frecuencia: 2 },
  // Solo en partidas Rápidas (solo oro): sustituye a bosques, canteras y minas de hierro. No produce: vale puntos al final.
  punto_clave:{ descripcion: "No produce nada. Vale 10 puntos al final de la partida para quien lo posea en ese momento. Hay que ir pensando en tenerlos.", nombre: "Punto clave", produce: {}, puntos: 10, icono: "estrellaClave", frecuencia: 0, soloModo: "soloOro" },
};
