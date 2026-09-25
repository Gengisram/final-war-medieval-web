// Terrenos. El movimiento va en puntos: llanura cuesta 2, bosque y colina 4,
// carretera 1 (ver reglas.js). Una tropa con movimiento 2 da un paso en llano.
//
// costeMovimiento: null = intransitable.
// modificadores: lo que gana la tropa que está encima (no acuartelada).
//   defensa: +N defensa. alcanceDistancia: +N alcance a las tropas a distancia.
// construible: si se puede fundar o construir encima.
// yacimientos: qué yacimientos prefieren este terreno (el generador los coloca ahí).
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.terrenos = {
  llanura: { nombre: "Llanura", descripcion: "Terreno abierto: se anda sin trabas y no da nada.", costeMovimiento: 2, construible: true, modificadores: {}, color: "#d9cfae", frecuencia: 0 },
  bosque:  { nombre: "Bosque",  descripcion: "Al entrar, se acaba tu movimiento: a pie o a caballo, ahí te paras. Quien está dentro gana +10 de defensa.", costeMovimiento: 4, construible: true, modificadores: { defensa: 10 }, color: "#9fb27a", frecuencia: 0.14, yacimientos: [] },
  colina:  { nombre: "Colina",  descripcion: "Al entrar, se acaba tu movimiento: a pie o a caballo, ahí te paras. +10 de defensa, y los arqueros disparan un hexágono más lejos desde arriba.", costeMovimiento: 4, construible: true, modificadores: { defensa: 10, alcanceDistancia: 1 }, color: "#c9b58a", frecuencia: 0.08, yacimientos: [] },
  montana: { nombre: "Montaña", descripcion: "Intransitable. Crea pasos y cuellos de botella.", costeMovimiento: null, construible: false, modificadores: {}, color: "#8d8a83", frecuencia: 0.06 },
  agua:    { nombre: "Agua",    descripcion: "Intransitable.", costeMovimiento: null, construible: false, modificadores: {}, color: "#7fa7c9", frecuencia: 0 },
};
