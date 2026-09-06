// Asentamientos: pueblo (expandir), ciudad (economía y ejército de calidad),
// castillo (defensa).
//
// comoSeConsigue: "fundar" (un campesino), "mejorar" (desde otro), "construir" (en hexágono vacío).
// recluta: lista de tropas o ["*"] para todas.
// alConquistar: en qué se convierte cuando lo toma el enemigo.
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.asentamientos = {
  pueblo: {
    nombre: "Pueblo",
    descripcion: "El asentamiento inicial y la forma de expandirse. Lo funda un campesino. Da oro, recluta campesinos y tiene un hueco de guarnición.",
    comoSeConsigue: "fundar",
    desde: null,
    coste: { oro: 20 },
    requiere: [],
    produce: { oro: 3 },
    huecosGuarnicion: 1,
    plusDefensa: 10,
    integridad: 40,
    huecosConstruccion: 1,
    recluta: ["campesino"],
    mejoraTropas: false,
    mejoraA: "ciudad",
    alConquistar: "pueblo",
    distanciaMinima: 3,
    icono: "pueblo",
  },
  ciudad: {
    nombre: "Ciudad",
    descripcion: "Un pueblo mejorado. Es la economía y el ejército de calidad: produce más oro, recluta todas las tropas y es el único sitio donde se mejoran.",
    comoSeConsigue: "mejorar",
    desde: "pueblo",
    coste: { oro: 40, madera: 5 },
    requiere: ["agricultura"],
    produce: { oro: 6 },
    huecosGuarnicion: 2,
    plusDefensa: 10,
    integridad: 80,
    huecosConstruccion: 3,
    recluta: ["*"],
    mejoraTropas: true,
    mejoraA: null,
    alConquistar: "pueblo",
    icono: "ciudad",
  },
  castillo: {
    nombre: "Castillo",
    descripcion: "Pura defensa. Se construye en cualquier hexágono tuyo vacío. Tres huecos de guarnición, murallas gruesas y un gran plus de defensa para quien esté dentro. Produce casi nada.",
    comoSeConsigue: "construir",
    distanciaEnemigo: 2, // no se construye pegado a un asentamiento enemigo (a menos de 2)
    desde: null,
    coste: { oro: 30, piedra: 5 },
    requiere: [],
    produce: { oro: 1 },
    huecosGuarnicion: 3,
    plusDefensa: 30,
    integridad: 120,
    huecosConstruccion: 1,
    recluta: ["*"],
    mejoraTropas: false,
    mejoraA: null,
    alConquistar: "castillo",
    icono: "castillo",
  },
};

// Nombres para los asentamientos, al azar.
FWM.datosBase.nombresAsentamientos = [
  "Villafranca", "Castrojeriz", "Aguilar", "Sahagún", "Frómista", "Belorado",
  "Nájera", "Estella", "Carrión", "Astorga", "Ponferrada", "Molina",
  "Medinaceli", "Sigüenza", "Atienza", "Berlanga", "Almazán", "Soria",
  "Calatañazor", "Peñafiel", "Simancas", "Tordesillas", "Olmedo", "Arévalo",
  "Coca", "Cuéllar", "Sepúlveda", "Ayllón", "Pedraza", "Turégano",
  "Ledesma", "Ciudad Rodrigo", "Béjar", "Plasencia", "Coria", "Alcántara",
  "Trujillo", "Zafra", "Jerez", "Alburquerque", "Montánchez", "Medellín",
  "Oropesa", "Talavera", "Escalona", "Maqueda", "Illescas", "Uclés",
  "Alarcón", "Requena", "Chinchilla", "Alcaraz", "Montiel", "Calatrava",
];
