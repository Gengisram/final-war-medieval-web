// Árbol tecnológico. Se investiga por reino, una a la vez.
//
// efectos posibles:
//   { tipo: "produccion_asentamiento", asentamientos: ["pueblo","ciudad"], recurso: "oro", valor: 1 }
//   { tipo: "produccion_yacimiento", yacimiento: "cantera", recurso: "piedra", valor: 1 }
//   { tipo: "stat", etiqueta: "armadura", stat: "defensa", valor: 1 }          // a tropas con esa etiqueta
//   { tipo: "asentamiento", asentamiento: "castillo", prop: "plusDefensa", valor: 1 }
// Lo que desbloquea (tropas, mejoras) se declara en "requiere" de cada cosa.
//
// repetible + costeCrecimiento: para la carrera infinita del futuro
// (cada nivel multiplica el coste). En v1 ninguna es repetible.
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.tecnologias = {
  agricultura: {
    nombre: "Agricultura",
    descripcion: "Cada pueblo y ciudad produce +1 oro. Permite mejorar pueblo a ciudad.",
    requiere: [],
    coste: { oro: 20 },
    turnos: 3,
    repetible: false,
    costeCrecimiento: null,
    efectos: [
      { tipo: "produccion_asentamiento", asentamientos: ["pueblo", "ciudad"], recurso: "oro", valor: 1 },
    ],
    fila: 0, columna: 0,
  },
  canteria: {
    nombre: "Cantería",
    descripcion: "Cada cantera produce +1 piedra.",
    requiere: [],
    coste: { oro: 20 },
    turnos: 3,
    repetible: false,
    costeCrecimiento: null,
    efectos: [
      { tipo: "produccion_yacimiento", yacimiento: "cantera", recurso: "piedra", valor: 1 },
    ],
    fila: 1, columna: 0,
  },
  maquinaria: {
    nombre: "Maquinaria",
    descripcion: "Cada bosque produce +1 madera.",
    requiere: [],
    coste: { oro: 20 },
    turnos: 3,
    repetible: false,
    costeCrecimiento: null,
    efectos: [
      { tipo: "produccion_yacimiento", yacimiento: "bosque", recurso: "madera", valor: 1 },
    ],
    fila: 2, columna: 0,
  },
  milicia: {
    nombre: "Milicia",
    descripcion: "Permite reclutar lanceros.",
    requiere: ["agricultura"],
    coste: { oro: 30, madera: 3 },
    turnos: 4,
    repetible: false,
    costeCrecimiento: null,
    efectos: [],
    desbloquea: ["lancero"],
    fila: 0, columna: 1,
  },
  fortificacion: {
    nombre: "Fortificación",
    descripcion: "Castillos: +1 hueco de guarnición, +10 defensa, +40 murallas.",
    requiere: ["canteria"],
    coste: { oro: 30, piedra: 3 },
    turnos: 4,
    repetible: false,
    costeCrecimiento: null,
    efectos: [
      { tipo: "asentamiento", asentamiento: "castillo", prop: "huecosGuarnicion", valor: 1 },
      { tipo: "asentamiento", asentamiento: "castillo", prop: "plusDefensa", valor: 10 },
      { tipo: "asentamiento", asentamiento: "castillo", prop: "integridad", valor: 40 },
    ],
    fila: 1, columna: 1,
  },
  catapulta: {
    nombre: "Catapulta",
    descripcion: "Permite reclutar catapultas.",
    requiere: ["maquinaria"],
    coste: { oro: 40, madera: 3 },
    turnos: 5,
    repetible: false,
    costeCrecimiento: null,
    efectos: [],
    desbloquea: ["catapulta"],
    fila: 2, columna: 1,
  },
  arqueria: {
    nombre: "Arquería",
    descripcion: "Permite reclutar arqueros.",
    requiere: ["milicia"],
    coste: { oro: 40, madera: 3 },
    turnos: 5,
    repetible: false,
    costeCrecimiento: null,
    efectos: [],
    desbloquea: ["arquero"],
    fila: 0, columna: 2,
  },
  caballeria: {
    nombre: "Caballería",
    descripcion: "Permite reclutar caballeros.",
    requiere: ["milicia"],
    coste: { oro: 40, hierro: 3 },
    turnos: 5,
    repetible: false,
    costeCrecimiento: null,
    efectos: [],
    desbloquea: ["caballero"],
    fila: 0.5, columna: 2,
  },
};
