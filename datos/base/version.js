// Versión del juego y del "protocolo" de los duelos.
//
// VERSION: se enseña en Ajustes y en la información legal. Súbela en cada publicación con cambios visibles.
// PROTOCOLO: súbelo SIEMPRE que cambie algo que altere el resultado de una acción (reglas, stats de tropas,
//   generación del mapa, orden de las tiradas del dado...). Los duelos comparan una firma del estado entre los
//   dos aparatos: si uno tiene reglas distintas, la partida se anulaba a mitad. Ahora, con protocolos distintos,
//   ni siquiera se emparejan y se avisa de que hay que recargar (6 sep 2026).
window.FWM = window.FWM || {};

FWM.VERSION = "1.0.0";
FWM.PROTOCOLO = 1;
