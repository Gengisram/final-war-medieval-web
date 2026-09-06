// Campaña (10 mapas, uno tras otro) y Batalla de la semana (un mapa hecho a mano con reglas propias, que cambia cada lunes).
// Decisión del 6 sep 2026. Los premios son oro del héroe; los objetos corcel (mapa 8) y corona_rey (mapa 10) ya lo decían en objetos.js.
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.campana = [
  { id: 1,  nombre: "El primer feudo",      texto: "Un vecino débil al otro lado del río. Aprende a cruzar y a tomar su pueblo.", mapa: "hoz",    rivales: 1, dificultad: "facil",   limite: 12, premio: { oro: 15 } },
  { id: 2,  nombre: "Las minas del norte",  texto: "La costa es estrecha y las minas, pocas. Quien las tenga, manda.",            mapa: "costa",  rivales: 1, dificultad: "normal",  limite: 15, premio: { oro: 20 } },
  { id: 3,  nombre: "Tres reinos",          texto: "Dos rivales y un centro rico. No dejes que se lo repartan.",                  mapa: "torres", rivales: 2, dificultad: "normal",  limite: 15, premio: { oro: 25 } },
  { id: 4,  nombre: "El paso de la sierra", texto: "La cordillera solo se cruza por los puertos. Guárdalos o tómalos.",           mapa: "sierra", rivales: 2, dificultad: "normal",  limite: 15, premio: { oro: 30 } },
  { id: 5,  nombre: "La isla",              texto: "Tres reinos alrededor del lago. Los puentes de tierra valen oro.",            mapa: "isla",   rivales: 3, dificultad: "normal",  limite: 15, premio: { oro: 35 } },
  { id: 6,  nombre: "Cofres vacíos",        texto: "Empiezas con la mitad de oro. Cada moneda cuenta.",                           mapa: "hoz",    rivales: 2, dificultad: "dificil", limite: 15, hucha: 1, premio: { oro: 40 } },
  { id: 7,  nombre: "El cerco",             texto: "Tres reinos implacables a tu alrededor. Resiste y devuelve el golpe.",        mapa: "torres", rivales: 3, dificultad: "dificil", limite: 15, premio: { oro: 50 } },
  { id: 8,  nombre: "La carga",             texto: "Llanura abierta y tres rivales. Gana y el corcel de guerra es tuyo.",         mapa: "costa",  rivales: 3, dificultad: "dificil", limite: 15, premio: { oro: 50, objeto: "corcel" } },
  { id: 9,  nombre: "Sierra de hierro",     texto: "Poco tiempo y muchos puertos que guardar.",                                   mapa: "sierra", rivales: 3, dificultad: "dificil", limite: 12, premio: { oro: 60 } },
  { id: 10, nombre: "El trono",             texto: "La última batalla. Gana y llevarás la corona del rey.",                       mapa: "isla",   rivales: 3, dificultad: "dificil", limite: 18, premio: { oro: 100, objeto: "corona_rey" } },
];

// Batallas de la semana: una batalla histórica por semana, rotando en este orden (lunes a domingo).
// `historia` son las dos frases que se leen antes de jugar; `regla` explica en una línea por qué esta batalla se juega así.
// No son simulaciones históricas: son el mapa hecho a mano que mejor cuenta esa batalla, con las reglas ajustadas.
FWM.datosBase.batallas = [
  { id: "navas", nombre: "Las Navas de Tolosa", anio: 1212, mapa: "sierra", rivales: 2, dificultad: "dificil", limite: 15,
    historia: "El ejército cristiano llevaba días detenido ante una sierra que nadie sabía cruzar. Un pastor les enseñó un paso escondido y aparecieron al otro lado, a la espalda del campamento almohade.",
    regla: "Dos rivales implacables. Quien controle los puertos de la sierra, gana." },
  { id: "hastings", nombre: "Hastings", anio: 1066, mapa: "costa", rivales: 1, dificultad: "dificil", limite: 12, hucha: 3,
    historia: "Guillermo cruzó el canal con su ejército y mandó quemar los barcos en la playa: no habría retirada. Harold llegó agotado desde el norte y aun así aguantó todo el día en la colina.",
    regla: "Un solo rival, implacable. Triple oro inicial y 12 turnos: todo se decide de golpe." },
  { id: "granada", nombre: "El cerco de Granada", anio: 1491, mapa: "torres", rivales: 3, dificultad: "dificil", limite: 15,
    historia: "La última ciudad del reino nazarí resistía tras sus torres, con la vega entera para abastecerse. Los sitiadores levantaron un campamento de piedra para demostrar que no pensaban marcharse.",
    regla: "Tres rivales implacables. El centro rico lo decide todo." },
  { id: "stirling", nombre: "El puente de Stirling", anio: 1297, mapa: "hoz", rivales: 1, dificultad: "dificil", limite: 15,
    historia: "El río solo se cruzaba por un puente de madera por el que pasaban dos jinetes a la vez. Wallace esperó a que la mitad del ejército inglés estuviera al otro lado y entonces bajó de la colina.",
    regla: "Un rival implacable y un río con dos pasos. Elige bien dónde esperas." },
  { id: "paris", nombre: "El sitio de París", anio: 885, mapa: "isla", rivales: 3, dificultad: "normal", limite: 20, hucha: 1,
    historia: "París cabía entera en una isla del Sena, unida a tierra por dos puentes fortificados. Cientos de barcos vikingos remontaron el río en otoño y se quedaron allí casi un año.",
    regla: "Tres rivales, la mitad de oro y 20 turnos: una guerra de aguante." },
];
