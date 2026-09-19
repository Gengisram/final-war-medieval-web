// Campañas (10 mapas cada una, uno tras otro) y Batalla de la semana (un mapa hecho a mano con reglas propias, que cambia cada lunes).
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

// Campañas (13 sep 2026): una por facción, de diez capítulos cada una, incluida con la facción. La de Castilla es
// la de siempre (Alvar el Cuervo). Las demás cuentan una historia de verdad de su cultura, contada para que la
// entienda un niño de ocho años y sin pelear por religiones: se pelea por tierras, coronas y venganzas.
// Cada capítulo: `enemigos` dice contra quién se juega (una facción o un reino de los de siempre con su nombre
// propio); `jefe`, solo en el último, es el malo final (héroe al nivel 10, más oro y nombre propio).
FWM.datosBase.campanas = {
  // ---------- Castilla: el chico del molino contra Alvar el Cuervo ----------
  castilla: {
    nombre: "El Cuervo", destino: "La Torre del Cuervo", paisaje: "castilla",
    pista: "Diez mapas hechos a mano, cada uno más difícil que el anterior. Cada mapa superado da su premio una sola vez.",
    capitulos: [
  { id: 1, nombre: "El molino del río", mapa: "hoz", rivales: 1, enemigos: [{ bando: "castilla", reino: "Los ladrones del río" }], dificultad: "facil", limite: 12, premio: { oro: 15 },
    texto: "Cruza el río, échalos de su pueblo y recupera tu grano.",
    voz: "Tu capitán",
    historia: "El rey ha muerto y no ha dejado hijos. Ya no manda nadie por aquí. Anoche unos hombres cruzaron el río, entraron en tu molino y se llevaron el grano. Son pocos y están mal armados, pero si nadie los para volverán cada semana." },

  { id: 2, nombre: "Las minas de la costa", mapa: "costa", rivales: 1, enemigos: [{ bando: "portugal", reino: "El señor de las minas" }], dificultad: "normal", limite: 15, premio: { oro: 20 },
    texto: "Toma las dos minas de oro de la costa y paga a tus soldados.",
    voz: "Tu capitán",
    historia: "Ya has echado a los ladrones, pero tus soldados llevan dos meses sin cobrar. En la costa hay dos minas de oro que guarda un señor con muy poca gente. Si son tuyas, podrás pagar un ejército de verdad." },

  { id: 3, nombre: "Los tres juramentos", mapa: "torres", rivales: 2, enemigos: [{ bando: "aragon", reino: "Casa de Lara" }, { bando: "aragon", reino: "Casa de Haro" }], dificultad: "normal", limite: 15, premio: { oro: 25 },
    texto: "Tus dos aliados se han pasado al enemigo. Quítales el centro del valle.",
    voz: "Tu capitán",
    historia: "Con las minas ya tienes con qué pagar, pero llegan malas noticias. Las otras dos familias del valle, que juraron defenderlo contigo, se han pasado a Alvar el Cuervo: el general que se ha quedado con la corona del rey. Esta mañana han movido sus ejércitos al centro del valle." },

  { id: 4, nombre: "El paso de la sierra", mapa: "sierra", rivales: 2, enemigos: [{ bando: "granada", reino: "Guardia del paso oeste" }, { bando: "granada", reino: "Guardia del paso este" }], dificultad: "normal", limite: 15, premio: { oro: 30 },
    texto: "Toma los dos pasos de la montaña antes de que te cierren el camino.",
    voz: "Un pastor de las montañas",
    historia: "El valle ya es tuyo, señor, y el camino sigue hacia el norte. Detrás de estas montañas empiezan las tierras del Cuervo. Solo se puede pasar por dos caminos estrechos, y él tiene hombres vigilando los dos. Subir es fácil; lo difícil es que no nos estén esperando arriba." },

  { id: 5, nombre: "Los puentes quemados", mapa: "isla", rivales: 3, enemigos: [{ bando: "sacro_imperio", reino: "Señores del lago" }, { bando: "sacro_imperio", reino: "Señores del lago" }, { bando: "sacro_imperio", reino: "Señores del lago" }], dificultad: "normal", limite: 15, premio: { oro: 35 },
    texto: "Tres enemigos rodean el lago. Pasa por los puentes de tierra que quedan.",
    voz: "Tu capitán",
    historia: "Ya estamos al otro lado de las montañas, en su tierra. El Cuervo ha quemado dos puentes del lago para frenarnos y ha prometido mil monedas de oro a quien acabe contigo. Tres de sus señores han rodeado el agua y nos cierran el paso." },

  { id: 6, nombre: "Cofres vacíos", mapa: "hoz", rivales: 2, enemigos: [{ bando: "francia", reino: "Los del otro río" }, { bando: "francia", reino: "Los del otro río" }], dificultad: "dificil", limite: 15, hucha: 1, premio: { oro: 40 },
    texto: "Empiezas con la mitad de oro. Cruza el río y gasta cada moneda con cabeza.",
    voz: "Tu capitán",
    historia: "Estamos lejos de casa y en tierra enemiga. Y esta noche el hombre que guardaba tu dinero se ha escapado con la mitad del cofre: dicen que se ha ido con el Cuervo. Delante tenemos otro río y dos señores esperando al otro lado." },

  { id: 7, nombre: "El cerco", mapa: "torres", rivales: 3, enemigos: [{ bando: "escocia", reino: "Las torres del Cuervo" }, { bando: "escocia", reino: "Las torres del Cuervo" }, { bando: "escocia", reino: "Las torres del Cuervo" }], dificultad: "dificil", limite: 15, premio: { oro: 50 },
    texto: "Te han rodeado tres ejércitos. Rompe por un lado y devuelve el golpe.",
    voz: "Tu capitán",
    historia: "El Cuervo ha mandado a sus mejores señores a por ti. Tres de ellos nos han encerrado entre sus torres. Hay que romper por un lado antes de que cierren el círculo del todo." },

  { id: 8, nombre: "La carga", mapa: "costa", rivales: 3, enemigos: [{ bando: "hungria", reino: "Jinetes del Cuervo" }, { bando: "francia", reino: "Los del Cuervo" }, { bando: "francia", reino: "Los del Cuervo" }], dificultad: "dificil", limite: 15, premio: { oro: 50, objeto: "corcel" },
    texto: "Campo abierto y tres enemigos. Ataca tú primero: gana y el caballo de guerra es tuyo.",
    voz: "Tu jefe de caballería",
    historia: "Hemos salido del cerco y ahora los perseguimos nosotros. Aquí no hay ríos ni torres donde esconderse: es campo abierto entre el mar y las montañas, y eso es bueno para los caballos. Déjame salir el primero, señor, y verás cómo corren." },

  { id: 9, nombre: "Sierra de hierro", mapa: "sierra", rivales: 3, enemigos: [{ bando: "sacro_imperio", reino: "Deudores del Cuervo" }, { bando: "sacro_imperio", reino: "Deudores del Cuervo" }, { bando: "sacro_imperio", reino: "Deudores del Cuervo" }], dificultad: "dificil", limite: 12, premio: { oro: 60 },
    texto: "Solo tienes doce turnos. Cruza los pasos antes de que llegue la nieve.",
    voz: "Tu capitán",
    historia: "Estas montañas son lo último que nos separa de la Torre del Cuervo. Ha llamado a todos los que le deben algo y los ha puesto a guardar los caminos. Solo tienen que aguantar doce días: después llega la nieve y nadie podrá pasar hasta la primavera." },

  { id: 10, nombre: "La Torre del Cuervo", mapa: "isla", rivales: 3, enemigos: [{ bando: "noruega" }, { bando: "francia", reino: "Los fieles del Cuervo" }, { bando: "francia", reino: "Los fieles del Cuervo" }], dificultad: "dificil", limite: 18, premio: { oro: 100, objeto: "corona_rey" },
    texto: "Cruza el lago y toma la Torre. Si ganas, la corona es tuya.",
    voz: "Alvar el Cuervo",
    // el rival 1 es el jefe: héroe de leyenda, más oro y nombre propio
    jefe: { apodo: "Alvar el Cuervo", reino: "Los del Cuervo", clase: "nordico", nivel: 10, oro: 1.7, color: "#3a3340" },
    historia: "«Vaya, el chico del molino. Has llegado más lejos de lo que esperaba nadie.» Alvar te habla tranquilo desde lo alto de su muralla. «Yo no maté al rey. La corona estaba en el suelo y la cogí, eso es todo. Cruza el lago si te atreves. Aquí te espero, con todo lo que me queda.»" },
] },

  // ---------- Vikingos: la saga de Harald Hardrada (1030-1066) ----------
  vikingos: {
    nombre: "La saga de Harald", destino: "El puente de Stamford", paisaje: "norte",
    pista: "De chico que huye de una batalla perdida a rey de Noruega… y un último viaje a Inglaterra. Diez capítulos, uno detrás de otro.",
    capitulos: [
      { id: 1, nombre: "La huida", mapa: "fiordo", rivales: 1, dificultad: "facil", limite: 12, premio: { oro: 15 }, enemigos: [{ bando: "noruega", reino: "Los hombres de Knut" }],
        texto: "Echa a los hombres de Knut de la costa y consigue un barco.", voz: "Rognvald, tu amigo",
        historia: "Tu hermano, el rey Olaf, ha caído en la batalla. Tú solo tienes quince años y has salido vivo, pero herido. Los hombres del nuevo rey te buscan por los bosques. Si llegamos a la costa, podremos coger un barco y huir lejos." },
      { id: 2, nombre: "La guardia del emperador", mapa: "costa", rivales: 1, dificultad: "normal", limite: 15, premio: { oro: 20 }, enemigos: [{ bando: "venecia", reino: "Piratas del estrecho" }],
        texto: "Echa a los piratas de las minas y gana tu sitio en la guardia.", voz: "El capitán de la guardia",
        historia: "Has cruzado el mar hasta Constantinopla, la ciudad más grande del mundo. El emperador paga en oro a los guerreros del norte que lo protegen. Pero aquí nadie te conoce: para entrar en su guardia tienes que demostrar lo que vales." },
      { id: 3, nombre: "La isla de los castillos", mapa: "isla", rivales: 2, dificultad: "normal", limite: 15, premio: { oro: 25 }, enemigos: [{ bando: "abasi", reino: "Señores de la isla" }, { bando: "abasi", reino: "Señores de la isla" }],
        texto: "Cruza a la isla del sur y toma sus castillos para el emperador.", voz: "El capitán de la guardia",
        historia: "Ya eres de la guardia del emperador. Ahora te manda a una isla del sur llena de castillos. Si la tomas, te dejará quedarte con una parte del botín. Por primera vez, vas a mandar a tus propios hombres." },
      { id: 4, nombre: "El tesoro escondido", mapa: "sierra", rivales: 2, dificultad: "normal", limite: 15, premio: { oro: 30 }, enemigos: [{ bando: "bizancio", reino: "Soldados del emperador" }, { bando: "bizancio", reino: "Soldados del emperador" }],
        texto: "Vence a los soldados del emperador en los pasos y salva el oro.", voz: "Rognvald, tu amigo",
        historia: "Has juntado mucho oro en la isla, y ahora el emperador lo quiere para él. Dice que le debes todo. Hemos escondido el tesoro y hay que sacarlo por los pasos de la montaña antes de que lleguen sus soldados." },
      { id: 5, nombre: "El príncipe del este", mapa: "hoz", rivales: 2, dificultad: "normal", limite: 15, premio: { oro: 35 }, enemigos: [{ bando: "polonia", reino: "Bandidos del río" }, { bando: "polonia", reino: "Bandidos del río" }],
        texto: "Limpia el río de bandidos y el príncipe te dará a su hija.", voz: "Elisiv, la hija del príncipe",
        historia: "Con el oro a salvo has llegado a las tierras del gran príncipe del este. Yo soy su hija. Mi padre dice que me casaré contigo si limpias de bandidos el camino del río. Yo ya he dicho que sí." },
      { id: 6, nombre: "Vuelta a casa", mapa: "fiordo", rivales: 2, dificultad: "dificil", limite: 15, premio: { oro: 40 }, enemigos: [{ bando: "noruega", reino: "Jefes de Magnus" }, { bando: "noruega", reino: "Jefes de Magnus" }],
        texto: "Tu sobrino no quiere compartir la corona. Pasa los fiordos.", voz: "Elisiv, tu esposa",
        historia: "Volvemos a Noruega con un barco lleno de oro. Pero tu sobrino Magnus es ahora el rey y no quiere compartir la corona con nadie. Sus jefes nos cierran el paso en los fiordos. Que vean que no venimos a pedir." },
      { id: 7, nombre: "El rey de Dinamarca", mapa: "mar_norte", rivales: 3, dificultad: "dificil", limite: 15, premio: { oro: 50 }, enemigos: [{ faccion: "vikingos", reino: "Reino de Dinamarca" }, { faccion: "vikingos", reino: "Reino de Dinamarca" }, { faccion: "vikingos", reino: "Reino de Dinamarca" }],
        texto: "Svein se ha quedado con Dinamarca. Échalo de tus islas.", voz: "Rognvald, tu amigo",
        historia: "Magnus ha muerto y ahora eres el único rey de Noruega. Pero Svein se ha quedado con Dinamarca, que era de Magnus, y sus barcos ya están en nuestras islas. Ellos pelean como nosotros: esto va a ser duro." },
      { id: 8, nombre: "Las islas del norte", mapa: "isla", rivales: 3, dificultad: "dificil", limite: 15, premio: { oro: 50, objeto: "capa_lobo" }, enemigos: [{ bando: "escocia", reino: "Señores de las islas" }, { bando: "escocia", reino: "Señores de las islas" }, { bando: "escocia", reino: "Señores de las islas" }],
        texto: "Toma las islas del norte: serán tu puerto para ir a Inglaterra.", voz: "Un mensajero inglés",
        historia: "Traigo noticias de Inglaterra, señor: nuestro rey ha muerto sin hijos. Muchos dicen que la corona podría ser vuestra. Pero para cruzar el mar con un ejército necesitáis antes las islas del norte, y sus señores no quieren dueño." },
      { id: 9, nombre: "Fulford", mapa: "costa", rivales: 3, dificultad: "dificil", limite: 12, premio: { oro: 60 }, enemigos: [{ faccion: "inglaterra", reino: "Los condes del norte" }, { faccion: "inglaterra", reino: "Los condes del norte" }, { faccion: "inglaterra", reino: "Los condes del norte" }],
        texto: "Has llegado a Inglaterra. Vence a los condes antes de que llegue su rey.", voz: "Rognvald, tu amigo",
        historia: "Hemos desembarcado con trescientos barcos. Los condes del norte nos esperan con sus hombres junto a un río, cerca de la ciudad de York. Si los vencemos rápido, la ciudad abrirá sus puertas antes de que llegue el rey inglés con su ejército." },
      { id: 10, nombre: "El puente de Stamford", mapa: "hoz", rivales: 3, dificultad: "dificil", limite: 18, premio: { oro: 100, objeto: "estandarte_dragon" }, enemigos: [{ faccion: "inglaterra" }, { faccion: "inglaterra", reino: "Los sajones" }, { faccion: "inglaterra", reino: "Los sajones" }],
        texto: "El rey inglés ha llegado. Cruza el puente y gana Inglaterra.", voz: "Harold, rey de Inglaterra",
        jefe: { apodo: "Harold, rey de Inglaterra", reino: "Reino de Inglaterra", faccion: "inglaterra", nivel: 10, oro: 1.7, color: "#7a2230" },
        historia: "«Harald de Noruega. Has venido a por mi reino. Te daré un trozo de Inglaterra: dos metros de tierra, lo que ocupa un hombre tumbado.» Harold te habla desde el otro lado del puente. «Mi ejército ha corrido día y noche para llegar. Te estamos esperando.»" },
    ] },

  // ---------- Inglaterra: el príncipe Eduardo contra el conde rebelde (1264-1265) ----------
  inglaterra: {
    nombre: "El príncipe Eduardo", destino: "Evesham", paisaje: "verde",
    pista: "Un príncipe prisionero, un conde que se ha quedado con el reino y un año para darle la vuelta. Diez capítulos, uno detrás de otro.",
    capitulos: [
      { id: 1, nombre: "El príncipe preso", mapa: "costa", rivales: 1, dificultad: "facil", limite: 12, premio: { oro: 15 }, enemigos: [{ bando: "inglaterra", reino: "Guardias del conde" }],
        texto: "Vence a los guardias del conde y escapa al bosque.", voz: "Tu escudero",
        historia: "Tu padre, el rey, perdió la batalla de Lewes. Desde entonces el conde Simón de Montfort os tiene presos a los dos. Hoy los guardias te dejan salir a montar a caballo. Haz carreras hasta cansar sus caballos y escápate en el único que quede fresco. Es ahora o nunca, príncipe." },
      { id: 2, nombre: "La carrera de caballos", mapa: "sierra", rivales: 1, dificultad: "normal", limite: 15, premio: { oro: 20 }, enemigos: [{ bando: "inglaterra", reino: "Jinetes del conde" }],
        texto: "Vence a los jinetes del conde que te persiguen por las montañas.", voz: "Roger Mortimer",
        historia: "¡Muy listo, príncipe! Hiciste carreras con los caballos de tus guardias hasta cansarlos, y te escapaste en el único que estaba fresco. Ahora te persiguen. Cruza las montañas hasta mis tierras y aquí estarás a salvo." },
      { id: 3, nombre: "Los señores de la frontera", mapa: "torres", rivales: 2, dificultad: "normal", limite: 15, premio: { oro: 25 }, enemigos: [{ bando: "escocia", reino: "Barones del valle" }, { bando: "escocia", reino: "Barones del valle" }],
        texto: "Toma el centro del valle y los señores de la frontera te seguirán.", voz: "Roger Mortimer",
        historia: "Estás a salvo en mis tierras, pero un príncipe sin ejército no asusta a nadie. Los señores de la frontera no se fían de ti. Toma el centro del valle a los barones del conde, y vendrán a jurarte lealtad." },
      { id: 4, nombre: "Los puentes del Severn", mapa: "hoz", rivales: 2, dificultad: "normal", limite: 15, premio: { oro: 30 }, enemigos: [{ bando: "escocia", reino: "Galeses del conde" }, { bando: "inglaterra", reino: "Barones rebeldes" }],
        texto: "Cierra los pasos del gran río para que el conde no pueda cruzar.", voz: "Roger Mortimer",
        historia: "Ya tienes ejército. El conde Simón está al otro lado del gran río, con los galeses de su lado. Si cerramos los pasos del río, se quedará encerrado en el oeste, lejos de Londres y de sus amigos." },
      { id: 5, nombre: "Gloucester", mapa: "marca", rivales: 2, dificultad: "normal", limite: 15, premio: { oro: 35 }, enemigos: [{ bando: "inglaterra", reino: "Guarnición de Gloucester" }, { bando: "inglaterra", reino: "Barones rebeldes" }],
        texto: "La ciudad de Gloucester es la llave del oeste. Tómala.", voz: "El conde de Gloucester",
        historia: "Antes estaba con Simón, pero me he cansado de sus órdenes, y ahora estoy contigo, príncipe. Mi ciudad, Gloucester, la tienen todavía sus hombres. Tiene buenas murallas: habrá que rodearla bien." },
      { id: 6, nombre: "Kenilworth", mapa: "isla", rivales: 2, dificultad: "dificil", limite: 12, premio: { oro: 40 }, enemigos: [{ bando: "francia", reino: "El joven Simón" }, { bando: "francia", reino: "Caballeros del joven Simón" }],
        texto: "El hijo del conde duerme fuera del castillo. Atácalo antes de que se arme.", voz: "Tu escudero",
        historia: "El hijo del conde, que también se llama Simón, viene a ayudar a su padre con otro ejército. Han llegado cansados y duermen fuera del castillo de Kenilworth, junto al lago. Si atacamos de madrugada, no llegarán a juntarse nunca." },
      { id: 7, nombre: "Las colinas de Gales", mapa: "sierra", rivales: 3, dificultad: "dificil", limite: 15, premio: { oro: 50 }, enemigos: [{ bando: "escocia", reino: "Galeses de Llywelyn" }, { bando: "escocia", reino: "Galeses de Llywelyn" }, { bando: "escocia", reino: "Galeses de Llywelyn" }],
        texto: "Los galeses conocen cada paso de las colinas. Pasa igualmente.", voz: "Roger Mortimer",
        historia: "Llywelyn, el príncipe de Gales, manda a sus arqueros a ayudar al conde. Nacieron en estas colinas y conocen cada camino. Ten cuidado: sus arcos son largos y disparan desde donde menos te lo esperas." },
      { id: 8, nombre: "Los arqueros del rey", mapa: "costa", rivales: 3, dificultad: "dificil", limite: 15, premio: { oro: 50, objeto: "capa_arquero" }, enemigos: [{ bando: "francia", reino: "Caballeros del conde" }, { bando: "inglaterra", reino: "Barones rebeldes" }, { bando: "inglaterra", reino: "Barones rebeldes" }],
        texto: "Campo abierto. Tus arqueros largos contra la caballería del conde.", voz: "Tu escudero",
        historia: "Has aprendido algo de los galeses, príncipe: sus arcos largos llegan más lejos que cualquier cosa. Ahora los tienes tú. El conde manda a su caballería contra nosotros en campo abierto. Pon a los arqueros detrás de las lanzas." },
      { id: 9, nombre: "El paso del Avon", mapa: "hoz", rivales: 3, dificultad: "dificil", limite: 12, premio: { oro: 60 }, enemigos: [{ bando: "inglaterra", reino: "Barones rebeldes" }, { bando: "inglaterra", reino: "Barones rebeldes" }, { bando: "francia", reino: "Caballeros del conde" }],
        texto: "El conde escapa hacia el sur. Cierra el paso del río y vence a sus barones.", voz: "Roger Mortimer",
        historia: "El conde Simón ha encontrado otro paso del río y escapa hacia el sur para juntarse con su hijo. No sabe que su hijo ya no tiene ejército. Solo le queda un camino. Si llegamos antes que él al paso, lo tendremos atrapado." },
      { id: 10, nombre: "Evesham", mapa: "evesham", rivales: 3, dificultad: "dificil", limite: 18, premio: { oro: 100, objeto: "capa_leones" }, enemigos: [{ bando: "francia" }, { bando: "inglaterra", reino: "Barones rebeldes" }, { bando: "inglaterra", reino: "Barones rebeldes" }],
        texto: "El conde está encerrado en la curva del río. Gana y el reino vuelve a tu padre.", voz: "Simón de Montfort",
        jefe: { apodo: "Simón de Montfort", reino: "Los barones del conde", bando: "francia", clase: "espadachin", nivel: 10, oro: 1.7, color: "#3b4a6b" },
        historia: "«Príncipe Eduardo. Cuando eras un niño, yo mismo te enseñé a manejar la espada. Veo que aprendiste bien… pero no tanto como para ganarme.» El conde te mira desde la villa, con el río detrás. «Aquí, entre el agua y la colina, se decide quién manda en Inglaterra.»" },
    ] },

  // ---------- Malí: la epopeya de Sundiata, como la cantan los griots (siglo XIII) ----------
  mali: {
    nombre: "El León de Malí", destino: "Kirina", paisaje: "sabana",
    pista: "La historia que los griots cantan desde hace ochocientos años: el niño que no podía andar y el rey herrero de Sosso. Diez capítulos, uno detrás de otro.",
    capitulos: [
      { id: 1, nombre: "El niño de la barra de hierro", mapa: "sabana", rivales: 1, dificultad: "facil", limite: 12, premio: { oro: 15 }, enemigos: [{ bando: "mali", reino: "Guardia de la reina" }],
        texto: "Vence a la guardia de la reina y pon a salvo a tu familia.", voz: "Balla Fasséké, el griot",
        historia: "Escucha, que esta historia es verdad. De niño no podías andar y todos se reían de ti. Hoy te has levantado apoyado en una barra de hierro y has andado delante de todo el pueblo. La reina, que manda en el palacio, ahora te tiene miedo, y ha mandado a sus guardias a por ti." },
      { id: 2, nombre: "El reino de Mema", mapa: "costa", rivales: 1, dificultad: "normal", limite: 15, premio: { oro: 20 }, enemigos: [{ bando: "abasi", reino: "Ladrones de caballos" }],
        texto: "Echa a los ladrones de caballos y el rey de Mema te dará soldados.", voz: "El rey de Mema",
        historia: "Has caminado años lejos de tu casa, de reino en reino, con tu madre y tus hermanas. Aquí, en Mema, os doy techo. Pero antes quiero saber si sabes mandar hombres: unos ladrones se llevan los caballos de mis pastos. Échalos." },
      { id: 3, nombre: "Malas noticias", mapa: "niger", rivales: 2, dificultad: "normal", limite: 15, premio: { oro: 25 }, enemigos: [{ bando: "sacro_imperio", reino: "Soldados de Sosso" }, { bando: "sacro_imperio", reino: "Soldados de Sosso" }],
        texto: "Sumaoro ha conquistado tu tierra. Vuelve por el río y abre camino.", voz: "Unos mensajeros de tu pueblo",
        historia: "Venimos desde muy lejos a buscarte. Sumaoro, el rey herrero de Sosso, ha conquistado nuestra tierra. Dicen que es un brujo y que las lanzas no le tocan. Todos se acuerdan del niño de la barra de hierro. Vuelve, te lo pedimos." },
      { id: 4, nombre: "Los jefes del río", mapa: "hoz", rivales: 2, dificultad: "normal", limite: 15, premio: { oro: 30 }, enemigos: [{ bando: "sacro_imperio", reino: "Soldados de Sosso" }, { bando: "mali", reino: "Aliados de Sumaoro" }],
        texto: "Toma los pasos del río antes que Sumaoro y los jefes de los pueblos se unirán a ti.", voz: "Balla Fasséké, el griot",
        historia: "Has vuelto con el ejército del rey de Mema, pero solo no puedes con Sumaoro. Los jefes de los pueblos del río miran para ver quién es más fuerte. Si tomas los pasos del río antes que sus soldados, te darán sus guerreros." },
      { id: 5, nombre: "La sabana abierta", mapa: "sabana", rivales: 2, dificultad: "normal", limite: 15, premio: { oro: 35 }, enemigos: [{ bando: "sacro_imperio", reino: "Herreros de Sosso" }, { bando: "sacro_imperio", reino: "Herreros de Sosso" }],
        texto: "Sus soldados llevan hierro; los tuyos, caballos. Pelea en campo abierto.", voz: "Tu jefe de jinetes",
        historia: "Sumaoro tiene los mejores herreros del mundo, y todos sus soldados llevan hierro. Pesan mucho y andan despacio. Nosotros tenemos caballos rápidos. No pelees donde él quiere: llévalo a la sabana abierta y dale vueltas." },
      { id: 6, nombre: "El griot secuestrado", mapa: "torres", rivales: 2, dificultad: "dificil", limite: 12, premio: { oro: 40 }, enemigos: [{ bando: "sacro_imperio", reino: "Guardia de Sumaoro" }, { bando: "sacro_imperio", reino: "Guardia de Sumaoro" }],
        texto: "Tu griot ha escapado. Vence a los guardias que lo persiguen.", voz: "Tu jefe de jinetes",
        historia: "Hace meses, Sumaoro se llevó a Balla Fasséké, tu griot, la voz que canta tu historia. ¡Esta noche se ha escapado! Viene corriendo hacia nuestras torres, pero los guardias del brujo lo persiguen. Sal a buscarlo antes de que lo alcancen." },
      { id: 7, nombre: "El secreto del brujo", mapa: "isla", rivales: 3, dificultad: "dificil", limite: 15, premio: { oro: 50 }, enemigos: [{ bando: "sacro_imperio", reino: "Guardia de Sumaoro" }, { bando: "sacro_imperio", reino: "Guardia de Sumaoro" }, { bando: "sacro_imperio", reino: "Guardia de Sumaoro" }],
        texto: "Tu hermana trae el secreto de Sumaoro. Vence a los guardias que la rodean en el lago.", voz: "Tu hermana Nana Triban",
        historia: "Hermano, vengo del palacio de Sumaoro y sé su secreto: su brujería no sirve contra una flecha con la punta de espolón de gallo blanco. Pero sus guardias me han seguido hasta el lago, y rodean los caminos. Ayúdame a cruzar." },
      { id: 8, nombre: "Los doce reyes", mapa: "sabana", rivales: 3, dificultad: "dificil", limite: 15, premio: { oro: 50, objeto: "capa_indigo" }, enemigos: [{ bando: "sacro_imperio", reino: "Ejército de Sosso" }, { bando: "sacro_imperio", reino: "Ejército de Sosso" }, { bando: "sacro_imperio", reino: "Ejército de Sosso" }],
        texto: "Sumaoro ataca antes de que se junten los doce reyes. Aguanta y devuelve el golpe.", voz: "Balla Fasséké, el griot",
        historia: "Con el secreto en la mano, los doce reyes del río te han jurado lealtad. Sumaoro lo sabe, y ha mandado todo su ejército contra ti antes de que lleguen los demás. Tienes que aguantar hasta que se junten todos." },
      { id: 9, nombre: "Las montañas de Sosso", mapa: "sierra", rivales: 3, dificultad: "dificil", limite: 12, premio: { oro: 60 }, enemigos: [{ bando: "sacro_imperio", reino: "Ejército de Sosso" }, { bando: "sacro_imperio", reino: "Ejército de Sosso" }, { bando: "sacro_imperio", reino: "Ejército de Sosso" }],
        texto: "El brujo se esconde en sus montañas. Pasa antes de que lleguen las lluvias.", voz: "Tu jefe de jinetes",
        historia: "Sumaoro ha perdido y retrocede hacia sus montañas peladas. Detrás está la llanura de Kirina, donde se juega todo. Pero llegan las lluvias, y en doce días los caminos serán barro. Hay que pasar ya." },
      { id: 10, nombre: "Kirina", mapa: "niger", rivales: 3, dificultad: "dificil", limite: 18, premio: { oro: 100, objeto: "manto_dorado" }, enemigos: [{ bando: "sacro_imperio" }, { bando: "sacro_imperio", reino: "Ejército de Sosso" }, { bando: "sacro_imperio", reino: "Ejército de Sosso" }],
        texto: "La batalla de Kirina. Gana y serás el primer rey de todo Malí.", voz: "Sumaoro, el rey herrero",
        jefe: { apodo: "Sumaoro, el rey herrero", reino: "Reino de Sosso", bando: "sacro_imperio", clase: "espadachin", nivel: 10, oro: 1.7, color: "#4a3b2f" },
        historia: "«Hijo de Sogolon. De niño te arrastrabas por el suelo y ahora vienes a por mí con doce reyes detrás.» Sumaoro te habla con voz de trueno. «Soy el rey herrero: el hierro me obedece. Ven a Kirina, y veremos a quién cantan mañana los griots.»" },
    ] },

  // ---------- Saladino: de soldado en Egipto a los cuernos de Hattin (1167-1187) ----------
  saladino: {
    nombre: "El sultán", destino: "Hattin", paisaje: "desierto",
    pista: "Un soldado joven que acaba mandando en Egipto y Siria, y un señor que rompe todas las treguas. Diez capítulos, uno detrás de otro.",
    capitulos: [
      { id: 1, nombre: "Alejandría", mapa: "costa", rivales: 1, dificultad: "facil", limite: 12, premio: { oro: 15 }, enemigos: [{ bando: "francia", reino: "Los francos" }],
        texto: "Tu tío te ha dejado la ciudad. Aguanta y echa al enemigo de las minas.", voz: "Shirkuh, tu tío",
        historia: "Sobrino, tengo que salir con el ejército a buscar comida. Te dejo al mando de Alejandría. Tienes pocos soldados, y los francos rodean la ciudad por tierra. No te pido que ganes: te pido que no la pierdas." },
      { id: 2, nombre: "Visir de Egipto", mapa: "nilo", rivales: 1, dificultad: "normal", limite: 15, premio: { oro: 20 }, enemigos: [{ bando: "abasi", reino: "Emires del delta" }],
        texto: "Eres el nuevo visir. Haz que los emires del delta te obedezcan.", voz: "Al-Qadi al-Fadil, tu secretario",
        historia: "Vuestro tío ha muerto, que en paz descanse, y el califa os ha nombrado visir de Egipto: el que manda en su nombre. Pero los emires del delta dicen que sois un soldado demasiado joven. Hay que enseñarles quién manda ahora." },
      { id: 3, nombre: "Damieta", mapa: "nilo", rivales: 2, dificultad: "normal", limite: 15, premio: { oro: 25 }, enemigos: [{ bando: "bizancio", reino: "Flota de Bizancio" }, { bando: "francia", reino: "Los francos" }],
        texto: "Una flota enorme ataca la boca del Nilo. Defiende Damieta.", voz: "Al-Qadi al-Fadil, tu secretario",
        historia: "¡Doscientos barcos, señor! Los griegos de Bizancio y los francos han llegado juntos a Damieta, en la boca del Nilo. Si la ciudad cae, el río queda abierto hasta El Cairo. Hay que llegar antes de que desembarquen todos." },
      { id: 4, nombre: "Damasco", mapa: "torres", rivales: 2, dificultad: "normal", limite: 15, premio: { oro: 30 }, enemigos: [{ bando: "abasi", reino: "Emires de Siria" }, { bando: "abasi", reino: "Emires de Siria" }],
        texto: "Los emires se pelean por Damasco. Llega antes que nadie.", voz: "Tu hermano al-Adil",
        historia: "Ha muerto Nur al-Din, el señor de Siria, y ha dejado un hijo pequeño. Sus emires se pelean por la ciudad de Damasco como perros por un hueso. La gente de la ciudad nos abrirá las puertas si llegamos los primeros." },
      { id: 5, nombre: "Alepo", mapa: "sierra", rivales: 2, dificultad: "normal", limite: 15, premio: { oro: 35 }, enemigos: [{ bando: "abasi", reino: "Guardia de Alepo" }, { bando: "abasi", reino: "Guardia de Alepo" }],
        texto: "Alepo, en el norte, no te acepta. Pasa las montañas y rodéala.", voz: "Tu hermano al-Adil",
        historia: "Damasco ya es nuestra, pero Alepo, en el norte, no nos quiere. Tiene las murallas más altas de toda Siria y está detrás de las montañas. Mientras Alepo no esté con nosotros, Siria seguirá partida en dos." },
      { id: 6, nombre: "Montgisard", mapa: "hoz", rivales: 2, dificultad: "dificil", limite: 15, hucha: 1, premio: { oro: 40 }, enemigos: [{ bando: "francia", reino: "El rey Balduino" }, { bando: "francia", reino: "Los francos" }],
        texto: "Has perdido la mitad del oro. Vence a los que te persiguen con lo que te queda.", voz: "Tu hermano al-Adil",
        historia: "Nos confiamos, hermano. Pensamos que el joven rey Balduino no se atrevería a salir, y nos sorprendió en Montgisard. Hemos perdido la mitad de los hombres y la mitad del oro. Ahora hay que volver a Egipto cruzando el río, y nos persiguen." },
      { id: 7, nombre: "Las caravanas", mapa: "costa", rivales: 3, dificultad: "dificil", limite: 15, premio: { oro: 50 }, enemigos: [{ bando: "francia", reino: "Jinetes de Kerak" }, { bando: "francia", reino: "Jinetes de Kerak" }, { bando: "francia", reino: "Los francos" }],
        texto: "Reinaldo ataca las caravanas aunque hay tregua. Echa a sus jinetes del camino.", voz: "Un mercader del camino",
        historia: "¡Señor, ayudadnos! Reinaldo de Châtillon, el señor del castillo de Kerak, ha atacado nuestra caravana. Hay tregua, pero a él no le importa: roba, quema y se lleva presa a la gente. Dice que nadie le va a parar." },
      { id: 8, nombre: "El castillo de Kerak", mapa: "isla", rivales: 3, dificultad: "dificil", limite: 15, premio: { oro: 50, objeto: "capa_seda" }, enemigos: [{ bando: "francia", reino: "Guardia de Kerak" }, { bando: "francia", reino: "Guardia de Kerak" }, { bando: "francia", reino: "Guardia de Kerak" }],
        texto: "Rodea el castillo de Reinaldo y rompe sus murallas.", voz: "Tu hermano al-Adil",
        historia: "Hemos llegado a Kerak, el nido de Reinaldo. Dentro hay una boda, y la madre del novio nos ha mandado comida de la fiesta. Tú has ordenado no disparar a la torre donde duermen los novios. Al resto del castillo, sí." },
      { id: 9, nombre: "Los pozos de Séforis", mapa: "sierra", rivales: 3, dificultad: "dificil", limite: 12, premio: { oro: 60 }, enemigos: [{ bando: "francia", reino: "Ejército del reino" }, { bando: "francia", reino: "Ejército del reino" }, { bando: "francia", reino: "Ejército del reino" }],
        texto: "El ejército enemigo sale de donde está el agua. Toma los pasos y déjalos con sed.", voz: "Al-Qadi al-Fadil, tu secretario",
        historia: "El ejército más grande que han juntado nunca los francos ha salido de Séforis, donde tenían agua de sobra, para venir a por nosotros. Hace un calor terrible. Si tomamos los pasos del camino, llegarán a la batalla muertos de sed." },
      { id: 10, nombre: "Los cuernos de Hattin", mapa: "hattin", rivales: 3, dificultad: "dificil", limite: 18, premio: { oro: 100, objeto: "capa_aguila" }, enemigos: [{ bando: "francia" }, { bando: "francia", reino: "Ejército del reino" }, { bando: "francia", reino: "Ejército del reino" }],
        texto: "La gran batalla entre las dos colinas. Gana y el reino enemigo caerá.", voz: "Reinaldo de Châtillon",
        jefe: { apodo: "Reinaldo de Châtillon", reino: "Señorío de Kerak", bando: "francia", clase: "nordico", nivel: 10, oro: 1.7, color: "#5a3a2a" },
        historia: "«Saladino. Rompí tu tregua y la volvería a romper.» Reinaldo grita desde lo alto de una de las dos colinas, con la boca seca. «Tengo el ejército más grande que ha visto nunca este reino. Aquí, entre estos dos cuernos de piedra, te voy a enseñar lo que es pelear.»" },
    ] },

  // ---------- Mongoles: Temujín, antes de ser Gengis Kan (1175-1204) ----------
  mongoles: {
    nombre: "Temujín", destino: "Chakirmaut", paisaje: "estepa",
    pista: "Un niño abandonado en la estepa, un hermano de sangre y la guerra por todas las tribus. Diez capítulos, uno detrás de otro.",
    capitulos: [
      { id: 1, nombre: "El yugo de madera", mapa: "estepa", rivales: 1, dificultad: "facil", limite: 12, premio: { oro: 15 }, enemigos: [{ bando: "hungria", reino: "Los taichiutos" }],
        texto: "Escapa del campamento de los taichiutos y vuelve con tu familia.", voz: "Hoelún, tu madre",
        historia: "Hijo, tu padre murió envenenado y la tribu nos dejó solos en la estepa, sin nada. Ahora los taichiutos te han cogido y te han puesto un yugo de madera en el cuello. Esta noche celebran una fiesta. Escapa y vuelve con nosotros." },
      { id: 2, nombre: "Los ocho caballos", mapa: "gobi", rivales: 1, dificultad: "normal", limite: 15, premio: { oro: 20 }, enemigos: [{ bando: "hungria", reino: "Ladrones de la estepa" }],
        texto: "Unos ladrones se han llevado tus caballos. Persíguelos con tu nuevo amigo.", voz: "Bo'orchu, tu nuevo amigo",
        historia: "No te conozco de nada, pero me has caído bien. Unos ladrones se han llevado los ocho caballos de tu familia, ¿verdad? Toma mi caballo, que está fresco, y vamos juntos a por ellos. Desde hoy, lo que sea tuyo es mío, y lo mío, tuyo." },
      { id: 3, nombre: "Börte", mapa: "isla", rivales: 2, dificultad: "normal", limite: 15, premio: { oro: 25 }, enemigos: [{ bando: "hungria", reino: "Los merkitas" }, { bando: "hungria", reino: "Los merkitas" }],
        texto: "Los merkitas se han llevado a tu mujer. Vence a sus guerreros al otro lado del lago y rescátala.", voz: "Yamuja, tu hermano de sangre",
        historia: "Hermano, me he enterado. Los merkitas entraron de noche en tu campamento y se llevaron a Börte, tu mujer. No vas a ir solo: cuando éramos niños juramos ser hermanos, y un hermano no se queda mirando. Mis jinetes vienen contigo." },
      { id: 4, nombre: "Los pastos del río", mapa: "estepa", rivales: 2, dificultad: "normal", limite: 15, premio: { oro: 30 }, enemigos: [{ bando: "hungria", reino: "Los de Yamuja" }, { bando: "hungria", reino: "Clanes de la estepa" }],
        texto: "Los clanes eligen entre Yamuja y tú. Toma los pastos antes que él.", voz: "Börte, tu mujer",
        historia: "Ya estoy en casa, gracias a ti y a Yamuja. Pero ¿no lo ves? Los clanes empiezan a elegir: unos te siguen a ti y otros a él. Yamuja quiere a los ricos; tú, a los que valen. Toma los pastos del río antes de que la tribu se parta en dos." },
      { id: 5, nombre: "Los tártaros", mapa: "gobi", rivales: 2, dificultad: "normal", limite: 15, premio: { oro: 35 }, enemigos: [{ bando: "hungria", reino: "Los tártaros" }, { bando: "hungria", reino: "Los tártaros" }],
        texto: "Los que envenenaron a tu padre están en el desierto. Ve a por ellos.", voz: "Bo'orchu, tu amigo",
        historia: "Los tártaros, los que envenenaron a tu padre, han atacado la frontera del imperio de China. Su emperador pagará a quien los castigue. Es la ocasión de vengar a tu padre, y encima te pagan por ello. Cruzaremos el desierto." },
      { id: 6, nombre: "Los trece campamentos", mapa: "sierra", rivales: 2, dificultad: "dificil", limite: 15, hucha: 1, premio: { oro: 40 }, enemigos: [{ bando: "hungria", reino: "Los de Yamuja" }, { bando: "hungria", reino: "Los de Yamuja" }],
        texto: "Yamuja te ha vencido. Con la mitad del oro, aguanta en las montañas y devuélvele el golpe.", voz: "Börte, tu mujer",
        historia: "Yamuja te ha atacado por sorpresa con trece campamentos de guerreros, y has perdido. Ya no es tu hermano: ahora es tu rival. Nos quedan la mitad de los hombres y la mitad del oro. Hay que llegar a las montañas antes de que nos alcancen." },
      { id: 7, nombre: "La trampa de Togril", mapa: "torres", rivales: 3, dificultad: "dificil", limite: 15, premio: { oro: 50 }, enemigos: [{ bando: "polonia", reino: "Los keraítas" }, { bando: "polonia", reino: "Los keraítas" }, { bando: "hungria", reino: "Los de Yamuja" }],
        texto: "Togril, que era como tu padre, te ha tendido una trampa. Rompe el cerco y vence a los keraítas.", voz: "Bo'orchu, tu amigo",
        historia: "¡Es una trampa, Temujín! Togril, el kan de los keraítas, te invitó a una boda, pero Yamuja lo ha convencido de que eres un peligro. Sus campamentos nos cercan. Hay que abrirse paso antes de que nos rodeen del todo." },
      { id: 8, nombre: "El agua de barro", mapa: "estepa", rivales: 3, dificultad: "dificil", limite: 15, premio: { oro: 50, objeto: "capa_fieltro" }, enemigos: [{ bando: "polonia", reino: "Los keraítas" }, { bando: "polonia", reino: "Los keraítas" }, { bando: "polonia", reino: "Los keraítas" }],
        texto: "Te quedan pocos hombres, pero fieles. Sorprende al campamento de Togril.", voz: "Börte, tu mujer",
        historia: "Solo te quedan unos pocos hombres, y habéis bebido juntos agua de barro, jurando no separaros nunca. Son pocos, pero valen por cien. Togril cree que estás acabado y está celebrándolo. Esta noche no lo esperan." },
      { id: 9, nombre: "Las hogueras", mapa: "gobi", rivales: 3, dificultad: "dificil", limite: 12, premio: { oro: 60 }, enemigos: [{ bando: "sacro_imperio", reino: "Los naimanos" }, { bando: "sacro_imperio", reino: "Los naimanos" }, { bando: "hungria", reino: "Los de Yamuja" }],
        texto: "Los naimanos son el doble. Hazles creer que sois más y gana los pasos.", voz: "Bo'orchu, tu amigo",
        historia: "El último gran pueblo de la estepa, los naimanos, se ha unido a Yamuja. Tienen el doble de hombres que nosotros. Esta noche que cada soldado encienda cinco hogueras: cuando las vean, pensarán que somos muchísimos." },
      { id: 10, nombre: "Chakirmaut", mapa: "estepa", rivales: 3, dificultad: "dificil", limite: 18, premio: { oro: 100, objeto: "capa_estepa" }, enemigos: [{ bando: "hungria" }, { bando: "sacro_imperio", reino: "Los naimanos" }, { bando: "sacro_imperio", reino: "Los naimanos" }],
        texto: "La última batalla por la estepa entera. Gana y todas las tribus serán una.", voz: "Yamuja",
        jefe: { apodo: "Yamuja", reino: "Los de Yamuja", bando: "hungria", clase: "nordico", nivel: 10, oro: 1.7, color: "#3f4a2a" },
        historia: "«Temujín, hermano. Cuando éramos niños jugábamos en el río helado y te regalé una punta de flecha de hueso.» Yamuja habla desde la montaña, con los naimanos detrás. «Ahora uno de los dos tiene que quedarse con la estepa entera. Ven a buscarme.»" },
    ] },
  // Tribus eslavas (15 sep 2026): una historia inventada a propósito, antes de los reinos, para que no sea de
  // ningún país. Los malos son los ávaros, un pueblo de jinetes que cobró tributo a todos los eslavos y ya no existe.
  eslavos: {
    nombre: "Vesna", destino: "La primavera", paisaje: "bosque",
    pista: "Una aldea quemada, una muchacha a la que escuchan las tormentas y todas las tribus del bosque contra el kagan. Diez capítulos, uno detrás de otro.",
    capitulos: [
      { id: 1, nombre: "La aldea en llamas", mapa: "bosque_viejo", rivales: 1, dificultad: "facil", limite: 12, premio: { oro: 15 }, enemigos: [{ bando: "avaros", reino: "Jinetes ávaros" }],
        texto: "Echa a los jinetes ávaros del bosque.", voz: "La abuela Zlata",
        historia: "Vesna, niña, los jinetes de la llanura han quemado la aldea. Tú tienes el don: las tormentas te escuchan. Llévate a los que quedan al bosque viejo. Ellos no conocen las sendas; nosotros, sí." },
      { id: 2, nombre: "El tributo del río", mapa: "hoz", rivales: 1, dificultad: "normal", limite: 15, premio: { oro: 20 }, enemigos: [{ bando: "avaros", reino: "Cobradores del kagan" }],
        texto: "Vence a los cobradores del kagan que cierran los pasos del río.", voz: "Radim, el herrero",
        historia: "Los ávaros cobran por cruzar el río: grano, pieles y chicos para su ejército. Yo forjo las lanzas y tú haces caer los rayos. Si les quitamos los dos pasos, se acabó el tributo." },
      { id: 3, nombre: "La tribu del lago", mapa: "isla", rivales: 2, dificultad: "normal", limite: 15, premio: { oro: 25 }, enemigos: [{ bando: "eslavos", reino: "Guerreros de Borislav" }, { bando: "eslavos", reino: "Guerreros de Borislav" }],
        texto: "Borislav no quiere unirse. Vence a sus guerreros y demuéstrale que juntos sois más fuertes.", voz: "Radim, el herrero",
        historia: "La tribu del lago no quiere saber nada de nosotros. Su jefe, Borislav, dice que una muchacha no manda a nadie. Pues demuéstrale lo contrario: si ganas, sus guerreros te seguirán." },
      { id: 4, nombre: "Las colinas del trueno", mapa: "sierra", rivales: 2, dificultad: "normal", limite: 15, premio: { oro: 30 }, enemigos: [{ bando: "avaros", reino: "Vigías ávaros" }, { bando: "avaros", reino: "Vigías ávaros" }],
        texto: "Los ávaros vigilan desde las colinas. Échalos antes de que llegue el grueso de su ejército.", voz: "Borislav, jefe del lago",
        historia: "Me ganaste limpio, hechicera, y mi palabra se cumple: mis hombres son tuyos. Desde las colinas del trueno los ávaros ven todos los caminos. Si las tomamos, sabremos por dónde vienen antes de que lleguen." },
      { id: 5, nombre: "El invierno largo", mapa: "bosque_viejo", rivales: 2, dificultad: "normal", limite: 15, hucha: 1, premio: { oro: 35 }, enemigos: [{ bando: "avaros", reino: "Jinetes ávaros" }, { bando: "avaros", reino: "Jinetes ávaros" }],
        texto: "Poco oro y mucho frío. Aguanta en el bosque y vence a los que vienen a buscarte.", voz: "La abuela Zlata",
        historia: "No recuerdo un invierno tan duro. Los graneros están casi vacíos y los ávaros lo saben: vienen ahora que estamos débiles. Pero el frío también es nuestro. Que entren en el bosque y verán." },
      { id: 6, nombre: "Los tratantes de la costa", mapa: "costa", rivales: 2, dificultad: "dificil", limite: 15, premio: { oro: 40 }, enemigos: [{ bando: "sacro_imperio", reino: "Tratantes del oeste" }, { bando: "avaros", reino: "Jinetes ávaros" }],
        texto: "Los ávaros venden a los prisioneros en la costa. Vence a los tratantes y a su escolta y libera a los tuyos.", voz: "Radim, el herrero",
        historia: "¿Sabes adónde se llevan a los que capturan los ávaros? Los venden a unos tratantes que vienen del oeste por la costa. Mi hermano está entre ellos. Si ganamos allí, volverá a casa, y con él muchos otros." },
      { id: 7, nombre: "Las siete tribus", mapa: "torres", rivales: 3, dificultad: "dificil", limite: 15, premio: { oro: 50 }, enemigos: [{ bando: "eslavos", reino: "Tribus que dudan" }, { bando: "eslavos", reino: "Tribus que dudan" }, { bando: "avaros", reino: "Emisarios del kagan" }],
        texto: "El kagan quiere comprar a las tribus que dudan. Vence a sus jefes antes de que se vendan del todo.", voz: "Borislav, jefe del lago",
        historia: "Siete tribus se reúnen entre las cuatro torres para decidir si van contigo o con el oro de los ávaros. Los emisarios del kagan ya están allí, repartiendo regalos. Llega antes de que se decidan y que vean de qué lado está la fuerza." },
      { id: 8, nombre: "Fuera del bosque", mapa: "llanura_avara", rivales: 3, dificultad: "dificil", limite: 15, premio: { oro: 50, objeto: "capa_abedul" }, enemigos: [{ bando: "avaros", reino: "Jinetes del kagan" }, { bando: "avaros", reino: "Jinetes del kagan" }, { bando: "avaros", reino: "Jinetes del kagan" }],
        texto: "Por primera vez salís del bosque. Aguanta a los jinetes en campo abierto y vence.", voz: "Radim, el herrero",
        historia: "Ya somos muchos, Vesna, de todas las tribus. Pero mientras sigamos escondidos entre los árboles, el kagan seguirá mandando en la llanura. Hay que salir. Sus caballos son rápidos, pero nuestras lanzas son largas." },
      { id: 9, nombre: "El Anillo", mapa: "estepa", rivales: 3, dificultad: "dificil", limite: 12, premio: { oro: 60 }, enemigos: [{ bando: "avaros", reino: "Guardia del Anillo" }, { bando: "avaros", reino: "Guardia del Anillo" }, { bando: "avaros", reino: "Jinetes del kagan" }],
        texto: "El kagan ha dejado su campamento con poca guardia. Vence a la guardia del Anillo antes de que vuelva.", voz: "La abuela Zlata",
        historia: "Los ávaros guardan todo lo que han robado en su gran campamento redondo, el Anillo, rodeado de empalizadas. El kagan ha salido con su ejército y lo ha dejado con pocos guardias. No volverá a haber una ocasión así, niña." },
      { id: 10, nombre: "La primavera", mapa: "llanura_avara", rivales: 3, dificultad: "dificil", limite: 18, premio: { oro: 100, objeto: "manto_primavera" }, enemigos: [{ bando: "avaros" }, { bando: "avaros", reino: "Jinetes del kagan" }, { bando: "avaros", reino: "Jinetes del kagan" }],
        texto: "La batalla que decide quién manda en la llanura y en el bosque.", voz: "Bayan, el kagan",
        jefe: { apodo: "Bayan", reino: "Kaganato ávaro", bando: "avaros", clase: "kan", nivel: 10, oro: 1.7, color: "#5a3a2a" },
        historia: "«Así que tú eres la bruja del bosque.» El kagan Bayan te mira desde su caballo, con todo su ejército detrás. «Mis abuelos cobraron tributo a los tuyos, y mis nietos se lo cobrarán a tus nietos. Aquí se acaba tu primavera.»" },
    ] },
};
// La campaña de siempre, con su nombre de siempre (la usan las pruebas y las partidas guardadas de antes).
FWM.datosBase.campana = FWM.datosBase.campanas.castilla.capitulos;

// Batallas de la semana: una batalla histórica por semana, rotando en este orden (lunes a domingo).
// `facciones` (13 sep 2026): con qué facciones se puede jugar esa semana; siempre va una gratis.
// `historia` son las dos frases que se leen antes de jugar; `regla` explica en una línea por qué esta batalla se juega así.
// No son simulaciones históricas: son el mapa hecho a mano que mejor cuenta esa batalla, con las reglas ajustadas.
FWM.datosBase.batallas = [
  { id: "navas", nombre: "Las Navas de Tolosa", anio: 1212, facciones: ["castilla", "saladino"], mapa: "sierra", rivales: 2, dificultad: "dificil", limite: 15,
    historia: "El ejército cristiano llevaba días detenido ante una sierra que nadie sabía cruzar. Un pastor les enseñó un paso escondido y aparecieron al otro lado, a la espalda del campamento almohade.",
    regla: "Dos rivales implacables. Quien controle los puertos de la sierra, gana." },
  { id: "hastings", nombre: "Hastings", anio: 1066, facciones: ["vikingos", "inglaterra"], mapa: "costa", rivales: 1, dificultad: "dificil", limite: 12, hucha: 3,
    historia: "Guillermo cruzó el canal con su ejército mientras Harold luchaba contra los vikingos en la otra punta del reino. Harold volvió agotado, a marchas forzadas, y aun así aguantó todo el día en la colina.",
    regla: "Un solo rival, implacable. Triple oro inicial y 12 turnos: todo se decide de golpe." },
  { id: "granada", nombre: "El cerco de Granada", anio: 1491, facciones: ["castilla", "mali"], mapa: "torres", rivales: 3, dificultad: "dificil", limite: 15,
    historia: "La última ciudad del reino nazarí resistía tras sus torres, con la vega entera para abastecerse. Los sitiadores levantaron un campamento de piedra para demostrar que no pensaban marcharse.",
    regla: "Tres rivales implacables. El centro rico lo decide todo." },
  { id: "stirling", nombre: "El puente de Stirling", anio: 1297, facciones: ["vikingos", "inglaterra"], mapa: "hoz", rivales: 1, dificultad: "dificil", limite: 15,
    historia: "El río solo se cruzaba por un puente de madera por el que pasaban dos jinetes a la vez. Wallace esperó a que la mitad del ejército inglés estuviera al otro lado y entonces bajó de la colina.",
    regla: "Un rival implacable y un río con dos pasos. Elige bien dónde esperas." },
  { id: "paris", nombre: "El sitio de París", anio: 885, facciones: ["vikingos", "mongoles"], mapa: "isla", rivales: 3, dificultad: "normal", limite: 20, hucha: 1,
    historia: "París cabía entera en una isla del Sena, unida a tierra por dos puentes fortificados. Cientos de barcos vikingos remontaron el río en otoño y se quedaron allí casi un año.",
    regla: "Tres rivales, la mitad de oro y 20 turnos: una guerra de aguante." },
];
