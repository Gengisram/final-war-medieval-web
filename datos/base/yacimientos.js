// Yacimientos: un hexágono que da algo mientras sea tuyo y esté conectado a un asentamiento tuyo.
// Desde el 21 sep 2026 solo hay dos: la mina de oro (da oro) y el punto clave (no da nada, vale puntos al final).
// Antes había bosques, canteras y minas de hierro, de cuando el juego tenía cuatro recursos.
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.yacimientos = {
  mina_oro:   { descripcion: "Da oro. El recurso que más falta hace: todo cuesta oro.", nombre: "Mina de oro", produce: { oro: 1 }, icono: "oro", frecuencia: 3 },
  punto_clave:{ descripcion: "No produce nada. Vale 10 puntos al final de la partida para quien lo posea en ese momento. Hay que ir pensando en tenerlos.", nombre: "Punto clave", produce: {}, puntos: 10, icono: "estrellaClave", frecuencia: 9 },
};
