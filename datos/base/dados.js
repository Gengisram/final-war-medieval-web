// Azar del combate. Cada golpe tira un dado de "caras" caras y aplica el
// ajuste de la tabla. Lo que no esté en la tabla es 0.
// Para quitar el azar: caras: 1, ajustes: {}.
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.dados = {
  combate: {
    caras: 6,
    ajustes: { 1: -10, 6: 10 },
    minimoDano: 10,
    textoAlto: "golpe certero",
    textoBajo: "golpe flojo",
  },
};
