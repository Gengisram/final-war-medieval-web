// Reglas generales ajustables (interruptores y números sueltos).
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.reglas = {
  // Atrincherarse: la tropa gasta su acción y gana defensa hasta que se mueva o ataque.
  // excluye: etiquetas de tropa que no pueden atrincherarse (la caballería no cava).
  atrincherar: { defensa: 10, excluye: ["montada"] },
  contraataque: { excluye: ["maquina"] }, // las máquinas (catapulta) no devuelven el golpe
  // Lo que recupera por turno una tropa que descansa en casa, y una muralla que nadie ataca.
  curacionPorTurno: 10,
  curacionAcuartelada: 20, // dentro de un asentamiento se cura el doble
  reparacionPorTurno: 10,
  // Una tropa herida ataca con menos fuerza, en la misma proporción que su vida perdida.
  heridasReducenAtaque: true,
  // El asedio cuerpo a cuerpo (escaleras, ariete) recibe contraataque de la guarnición.
  asedioCuerpoACuerpoRecibeContraataque: true,
  // Carreteras: las construye un campesino en un hexágono propio; cualquiera las usa.
  // Un asentamiento cuenta como carretera. Coste de entrar en puntos de movimiento.
  // Se construye a distancia en cualquier hexágono tuyo transitable, sin tropa. Barata a propósito.
  carretera: { coste: { oro: 2 }, requiere: ["canteria"], costeMovimiento: 1 },
  // Cuántos puntos de movimiento son "un paso" (para mostrarlo en pantalla).
  puntosPorPaso: 2,
  // Experiencia: cada combate sobrevivido da puntos; matar da extra. Los niveles suman ataque y defensa.
  experiencia: {
    porCombate: 1,
    porMuerte: 2,
    niveles: [
      { nombre: "Recluta",  umbral: 0, ataque: 0,  defensa: 0 },
      { nombre: "Veterano", umbral: 3, ataque: 5,  defensa: 5 },
      { nombre: "Élite",    umbral: 8, ataque: 10, defensa: 10 },
    ],
  },
  // Puntos para el límite de turnos.
  // Un yacimiento con entrada propia (punto_clave) usa su valor y solo exige poseer el hexágono; el resto exige conexión.
  // baja: puntos por cada tropa enemiga matada. punto_clave: 10 (Rodrigo, 5 sep: que pesen más que el oro).
  puntos: { pueblo: 10, ciudad: 20, castillo: 15, yacimiento: 2, punto_clave: 10, baja: 2, oroPor: 10, tecnologia: 5, hexagono: 1, heroe: 8 }, // hexagono: cada hexágono en propiedad; heroe: extra por matar al héroe rival (2 de baja + 8 = 10)
  // Salida: una tropa cuerpo a cuerpo acuartelada puede atacar a un vecino desde dentro,
  // pero en ese intercambio no tiene el plus de las murallas.
  salidaDesdeGuarnicion: true,
};
