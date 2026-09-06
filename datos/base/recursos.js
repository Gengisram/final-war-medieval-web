// Recursos del juego. Añadir uno nuevo = añadir una entrada aquí.
// Cualquier coste o producción en el resto de ficheros puede usar estos nombres.
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.recursos = {
  oro:    { nombre: "Oro",    icono: "oro",    orden: 1, descripcion: "La moneda de todo: reclutar, mantener tropas, construir e investigar. Sale de los asentamientos y de las minas de oro." },
  madera: { nombre: "Madera", icono: "madera", orden: 2, descripcion: "Sale de los bosques. Para mejorar a ciudad, tropas ligeras y catapultas." },
  piedra: { nombre: "Piedra", icono: "piedra", orden: 3, descripcion: "Sale de las canteras. Para castillos y fortificaciones." },
  hierro: { nombre: "Hierro", icono: "hierro", orden: 4, descripcion: "Sale de las minas de hierro. Para caballeros y catapultas." },
};

// Con qué empieza cada jugador.
FWM.datosBase.huchaInicial = { oro: 40, madera: 5, piedra: 5, hierro: 2 };
