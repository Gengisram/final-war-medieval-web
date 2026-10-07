// Recursos del juego. Desde el 21 sep 2026 solo hay ORO: la madera, la piedra y el hierro eran del primer
// prototipo y se quitaron del todo (ningún modo los usaba ya). Si algún día vuelve otro recurso, se añade aquí.
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.recursos = {
  oro: { nombre: "Oro", icono: "oro", orden: 1, descripcion: "La moneda de todo: reclutar, mantener tropas, construir e investigar. Sale de los asentamientos y de las minas de oro." },
};

// Con qué empieza cada jugador.
FWM.datosBase.huchaInicial = { oro: 40 };
