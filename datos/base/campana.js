// Campaña (10 mapas, uno tras otro) y Batalla de la semana (un mapa hecho a mano con reglas propias, que cambia cada lunes).
// Decisión del 6 sep 2026. Los premios son oro del héroe; los objetos corcel (mapa 8) y corona_rey (mapa 10) ya lo decían en objetos.js.
//
// 9 sep 2026: los diez mapas cuentan UNA historia seguida. El rey ha muerto sin heredero y su condestable,
// Alvar el Cuervo, se ha quedado la corona y la Torre del Rey. Empiezas siendo un señor de un feudo pequeño
// al que le han quitado el molino y acabas delante de él. Cada capítulo tiene:
//   `texto`    una línea de qué vas a jugar (la que se ve en la lista)
//   `historia` el diálogo que sale antes de empezar: dónde estás y por qué peleas
//   `voz`      quién habla en ese diálogo
//   `jefe`     solo el último: el rival principal es Alvar, con héroe de leyenda y más oro
// Los textos están escritos para que los entienda un niño de ocho años (Rodrigo, 9 sep): frases cortas,
// una idea por frase, y nada de palabras de castillo (vado, senescal, feudo…). Cada capítulo empieza
// recordando en qué punto estamos, para que la historia se siga aunque se juegue de semana en semana.
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.campana = [
  { id: 1, nombre: "El molino del río", mapa: "hoz", rivales: 1, dificultad: "facil", limite: 12, premio: { oro: 15 },
    texto: "Cruza el río, échalos de su pueblo y recupera tu grano.",
    voz: "Tu capitán",
    historia: "El rey ha muerto y no ha dejado hijos. Ya no manda nadie por aquí. Anoche unos hombres cruzaron el río, entraron en tu molino y se llevaron el grano. Son pocos y están mal armados, pero si nadie los para volverán cada semana." },

  { id: 2, nombre: "Las minas del norte", mapa: "costa", rivales: 1, dificultad: "normal", limite: 15, premio: { oro: 20 },
    texto: "Toma las dos minas de oro de la costa y paga a tus soldados.",
    voz: "Tu capitán",
    historia: "Ya has echado a los ladrones, pero tus soldados llevan dos meses sin cobrar. En la costa hay dos minas de oro que guarda un señor con muy poca gente. Si son tuyas, podrás pagar un ejército de verdad." },

  { id: 3, nombre: "Los tres juramentos", mapa: "torres", rivales: 2, dificultad: "normal", limite: 15, premio: { oro: 25 },
    texto: "Tus dos aliados se han pasado al enemigo. Quítales el centro del valle.",
    voz: "Tu capitán",
    historia: "Con las minas ya tienes con qué pagar, pero llegan malas noticias. Las otras dos familias del valle, que juraron defenderlo contigo, se han pasado a Alvar el Cuervo: el general que se ha quedado con la corona del rey. Esta mañana han movido sus ejércitos al centro del valle." },

  { id: 4, nombre: "El paso de la sierra", mapa: "sierra", rivales: 2, dificultad: "normal", limite: 15, premio: { oro: 30 },
    texto: "Toma los dos pasos de la montaña antes de que te cierren el camino.",
    voz: "Un pastor de las montañas",
    historia: "El valle ya es tuyo, señor, y el camino sigue hacia el norte. Detrás de estas montañas empiezan las tierras del Cuervo. Solo se puede pasar por dos caminos estrechos, y él tiene hombres vigilando los dos. Subir es fácil; lo difícil es que no nos estén esperando arriba." },

  { id: 5, nombre: "Los puentes quemados", mapa: "isla", rivales: 3, dificultad: "normal", limite: 15, premio: { oro: 35 },
    texto: "Tres enemigos rodean el lago. Pasa por los puentes de tierra que quedan.",
    voz: "Tu capitán",
    historia: "Ya estamos al otro lado de las montañas, en su tierra. El Cuervo ha quemado dos puentes del lago para frenarnos y ha prometido mil monedas de oro a quien acabe contigo. Tres de sus señores han rodeado el agua y nos cierran el paso." },

  { id: 6, nombre: "Cofres vacíos", mapa: "hoz", rivales: 2, dificultad: "dificil", limite: 15, hucha: 1, premio: { oro: 40 },
    texto: "Empiezas con la mitad de oro. Cruza el río y gasta cada moneda con cabeza.",
    voz: "Tu capitán",
    historia: "Estamos lejos de casa y en tierra enemiga. Y esta noche el hombre que guardaba tu dinero se ha escapado con la mitad del cofre: dicen que se ha ido con el Cuervo. Delante tenemos otro río y dos señores esperando al otro lado." },

  { id: 7, nombre: "El cerco", mapa: "torres", rivales: 3, dificultad: "dificil", limite: 15, premio: { oro: 50 },
    texto: "Te han rodeado tres ejércitos. Rompe por un lado y devuelve el golpe.",
    voz: "Tu capitán",
    historia: "El Cuervo ha prometido repartir tus tierras entre quien acabe contigo, y tres de sus señores han venido a cobrar. Nos han encerrado entre sus torres. Hay que romper por un lado antes de que cierren el círculo del todo." },

  { id: 8, nombre: "La carga", mapa: "costa", rivales: 3, dificultad: "dificil", limite: 15, premio: { oro: 50, objeto: "corcel" },
    texto: "Campo abierto y tres enemigos. Ataca tú primero: gana y el caballo de guerra es tuyo.",
    voz: "Tu jefe de caballería",
    historia: "Hemos salido del cerco y ahora los perseguimos nosotros. Aquí no hay ríos ni montañas donde esconderse: es todo campo abierto, y eso es bueno para los caballos. Déjame salir el primero, señor, y verás cómo corren." },

  { id: 9, nombre: "Sierra de hierro", mapa: "sierra", rivales: 3, dificultad: "dificil", limite: 12, premio: { oro: 60 },
    texto: "Solo tienes doce turnos. Cruza los pasos antes de que llegue la nieve.",
    voz: "Tu capitán",
    historia: "Estas montañas son lo último que nos separa de la Torre del Cuervo. Ha llamado a todos los que le deben algo y los ha puesto a guardar los caminos. Solo tienen que aguantar doce días: después llega la nieve y nadie podrá pasar hasta la primavera." },

  { id: 10, nombre: "La Torre del Cuervo", mapa: "isla", rivales: 3, dificultad: "dificil", limite: 18, premio: { oro: 100, objeto: "corona_rey" },
    texto: "Cruza el lago y toma la Torre. Si ganas, la corona es tuya.",
    voz: "Alvar el Cuervo",
    // el rival 1 es el jefe: héroe de leyenda, más oro y nombre propio
    jefe: { apodo: "Alvar el Cuervo", reino: "Los del Cuervo", clase: "nordico", nivel: 8, oro: 1.7, color: "#3a3340" },
    historia: "«Vaya, el chico del molino. Has llegado más lejos de lo que esperaba nadie.» Alvar te habla tranquilo desde lo alto de su muralla. «Yo no maté al rey. La corona estaba en el suelo y la cogí, eso es todo. Cruza el lago si te atreves. Aquí te espero, con todo lo que me queda.»" },
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
