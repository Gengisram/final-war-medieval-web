// Bandos (facciones). Cada uno tiene un rasgo fuerte y su lista de nombres de asentamiento.
// Los bonos usan los mismos efectos que las tecnologías, más algunos propios:
//   { tipo: "stat", tropa: "arquero", stat: "ataque", valor: 10 }          // a una tropa concreta
//   { tipo: "coste_tropa", tropa: "caballero", recurso: "oro", valor: -5 } // descuento fijo
//   { tipo: "coste_asentamiento", asentamiento: "castillo", recurso: "piedra", factor: 0.5 }
//   { tipo: "experiencia_factor", valor: 2 }
// modo: "soloOro" o "recursos" limita el bono a partidas de solo oro (Rápida) o con recursos.
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.bandos = {
  castilla: {
    nombre: "Corona de Castilla",
    rasgo: "Los castillos cuestan la mitad de piedra (en Rápida, un 25 % menos de oro).",
    descripcion: "Tierra de castillos. La Reconquista se ganó fortificando cada frontera.",
    asentamientoInicial: "pueblo", tropasIniciales: ["campesino"], tecnologiasIniciales: [], hucha: null, arbol: null,
    bonos: [{ tipo: "coste_asentamiento", asentamiento: "castillo", recurso: "piedra", factor: 0.5, modo: "recursos" }, { tipo: "coste_asentamiento", asentamiento: "castillo", recurso: "oro", factor: 0.75, modo: "soloOro" }],
    nombres: ["Burgos", "Toledo", "Valladolid", "Segovia", "Ávila", "Soria", "Zamora", "León", "Salamanca", "Cuenca", "Palencia", "Sepúlveda", "Simancas", "Medina", "Arévalo", "Olmedo", "Coca", "Cuéllar", "Peñafiel", "Aranda"],
  },
  inglaterra: {
    nombre: "Reino de Inglaterra",
    rasgo: "Arqueros +10 de ataque.",
    descripcion: "El arco largo decidió batallas enteras. Sus arqueros son los mejores del mundo conocido.",
    asentamientoInicial: "pueblo", tropasIniciales: ["campesino"], tecnologiasIniciales: [], hucha: null, arbol: null,
    bonos: [{ tipo: "stat", tropa: "arquero", stat: "ataque", valor: 10 }],
    nombres: ["York", "Winchester", "Lincoln", "Norwich", "Exeter", "Chester", "Durham", "Oxford", "Gloucester", "Warwick", "Nottingham", "Leicester", "Canterbury", "Dover", "Bristol", "Carlisle", "Lancaster", "Shrewsbury", "Hereford", "Worcester"],
  },
  francia: {
    nombre: "Reino de Francia",
    rasgo: "Caballeros +10 de defensa y 5 oro más baratos.",
    descripcion: "La caballería pesada francesa es el martillo de Europa: cara, lenta de armar, imparable.",
    asentamientoInicial: "pueblo", tropasIniciales: ["campesino"], tecnologiasIniciales: [], hucha: null, arbol: null,
    bonos: [{ tipo: "stat", tropa: "caballero", stat: "defensa", valor: 10 }, { tipo: "coste_tropa", tropa: "caballero", recurso: "oro", valor: -5 }],
    nombres: ["Orléans", "Reims", "Tours", "Bourges", "Chartres", "Rouen", "Amiens", "Troyes", "Poitiers", "Angers", "Blois", "Laon", "Sens", "Auxerre", "Nevers", "Dijon", "Beauvais", "Senlis", "Meaux", "Provins"],
  },
  ming: {
    nombre: "Dinastía Ming",
    rasgo: "Catapultas +20 de asedio y alcance 4.",
    descripcion: "Pólvora, ingenieros y murallas: nadie asedia como el Imperio del Centro.",
    asentamientoInicial: "pueblo", tropasIniciales: ["campesino"], tecnologiasIniciales: [], hucha: null, arbol: null,
    bonos: [{ tipo: "stat", tropa: "catapulta", stat: "asedio", valor: 20 }, { tipo: "stat", tropa: "catapulta", stat: "alcance", valor: 1 }],
    nombres: ["Nanjing", "Kaifeng", "Luoyang", "Hangzhou", "Suzhou", "Xi'an", "Chengdu", "Yangzhou", "Jinan", "Taiyuan", "Fuzhou", "Guangzhou", "Wuchang", "Nanchang", "Changsha", "Ningbo", "Xuzhou", "Datong", "Baoding", "Jingdezhen"],
  },
  abasi: {
    nombre: "Califato Abasí",
    rasgo: "Cada mina de oro produce +1.",
    descripcion: "Bagdad, la Casa de la Sabiduría y las rutas del oro: el comercio es su ejército.",
    asentamientoInicial: "pueblo", tropasIniciales: ["campesino"], tecnologiasIniciales: [], hucha: null, arbol: null,
    bonos: [{ tipo: "produccion_yacimiento", yacimiento: "mina_oro", recurso: "oro", valor: 1 }],
    nombres: ["Bagdad", "Basora", "Damasco", "Alepo", "Kufa", "Samarra", "Mosul", "Wasit", "Rayy", "Nishapur", "Merv", "Hamadán", "Tabriz", "Ahvaz", "Anbar", "Raqqa", "Harrán", "Homs", "Tarso", "Amida"],
  },
  // --- bandos europeos, para los grandes escenarios (6 sep 2026). Mismas reglas: un rasgo fuerte cada uno.
  aragon: {
    nombre: "Corona de Aragón",
    rasgo: "Cada asentamiento produce +1 de oro.",
    descripcion: "Barcelona, Valencia y media Italia: una corona que vivía del mar y del comercio.",
    asentamientoInicial: "pueblo", tropasIniciales: ["campesino"], tecnologiasIniciales: [], hucha: null, arbol: null,
    bonos: [{ tipo: "produccion_asentamiento", asentamientos: ["pueblo", "ciudad", "castillo"], recurso: "oro", valor: 1 }],
    nombres: ["Zaragoza", "Barcelona", "Valencia", "Huesca", "Lérida", "Tarragona", "Girona", "Teruel", "Jaca", "Calatayud", "Tortosa", "Perpiñán", "Vic", "Manresa", "Játiva", "Alcañiz", "Fraga", "Balaguer", "Cervera", "Morella"],
  },
  portugal: {
    nombre: "Reino de Portugal",
    rasgo: "Campesinos +1 de movimiento y 3 oro más baratos.",
    descripcion: "Un reino estrecho y largo: quien se mueve rápido por su tierra defiende una frontera imposible.",
    asentamientoInicial: "pueblo", tropasIniciales: ["campesino"], tecnologiasIniciales: [], hucha: null, arbol: null,
    bonos: [{ tipo: "stat", tropa: "campesino", stat: "movimiento", valor: 1 }, { tipo: "coste_tropa", tropa: "campesino", recurso: "oro", valor: -3 }],
    nombres: ["Lisboa", "Oporto", "Coimbra", "Braga", "Évora", "Guimarães", "Santarém", "Leiria", "Viseu", "Lamego", "Faro", "Beja", "Tomar", "Óbidos", "Guarda", "Bragança", "Setúbal", "Elvas", "Silves", "Aveiro"],
  },
  granada: {
    nombre: "Emirato de Granada",
    rasgo: "Tus asentamientos dan +10 de defensa a la guarnición y tienen +20 de murallas.",
    descripcion: "El último reino andalusí: montañas, torres y una capacidad de resistir que duró dos siglos.",
    asentamientoInicial: "pueblo", tropasIniciales: ["campesino"], tecnologiasIniciales: [], hucha: null, arbol: null,
    bonos: ["pueblo", "ciudad", "castillo"].flatMap(a => [{ tipo: "asentamiento", asentamiento: a, prop: "plusDefensa", valor: 10 }, { tipo: "asentamiento", asentamiento: a, prop: "integridad", valor: 20 }]),
    nombres: ["Granada", "Málaga", "Almería", "Ronda", "Guadix", "Baza", "Loja", "Motril", "Vera", "Antequera", "Marbella", "Alhama", "Berja", "Órgiva", "Illora", "Moclín", "Salobreña", "Purchena", "Cambil", "Vélez"],
  },
  sacro_imperio: {
    nombre: "Sacro Imperio",
    rasgo: "Lanceros y alabarderos +10 de defensa.",
    descripcion: "Cientos de ciudades y príncipes bajo una sola corona: su fuerza es la infantería de las ciudades libres.",
    asentamientoInicial: "pueblo", tropasIniciales: ["campesino"], tecnologiasIniciales: [], hucha: null, arbol: null,
    bonos: [{ tipo: "stat", tropa: "lancero", stat: "defensa", valor: 10 }, { tipo: "stat", tropa: "alabardero", stat: "defensa", valor: 10 }],
    nombres: ["Aquisgrán", "Colonia", "Maguncia", "Espira", "Worms", "Núremberg", "Ratisbona", "Augsburgo", "Fráncfort", "Tréveris", "Magdeburgo", "Lübeck", "Bremen", "Ulm", "Estrasburgo", "Basilea", "Viena", "Praga", "Erfurt", "Goslar"],
  },
  noruega: {
    nombre: "Reino de Noruega",
    rasgo: "Espadachines +10 de ataque y +10 de vida.",
    descripcion: "Herederos de los hombres del norte: pocos, duros y acostumbrados a pelear lejos de casa.",
    asentamientoInicial: "pueblo", tropasIniciales: ["campesino"], tecnologiasIniciales: [], hucha: null, arbol: null,
    bonos: [{ tipo: "stat", tropa: "espadachin", stat: "ataque", valor: 10 }, { tipo: "stat", tropa: "espadachin", stat: "vida", valor: 10 }],
    nombres: ["Nidaros", "Bergen", "Oslo", "Tønsberg", "Stavanger", "Hamar", "Skien", "Sarpsborg", "Konghelle", "Borg", "Vestfold", "Trøndelag", "Voss", "Førde", "Molde", "Steinkjer", "Narvik", "Tromsø", "Bodø", "Alta"],
  },
  polonia: {
    nombre: "Reino de Polonia",
    rasgo: "Caballeros y caballería pesada 10 oro más baratos.",
    descripcion: "Llanuras sin fin y la mejor caballería del este: se defiende cargando.",
    asentamientoInicial: "pueblo", tropasIniciales: ["campesino"], tecnologiasIniciales: [], hucha: null, arbol: null,
    bonos: [{ tipo: "coste_tropa", tropa: "caballero", recurso: "oro", valor: -10 }, { tipo: "coste_tropa", tropa: "caballeria_pesada", recurso: "oro", valor: -10 }],
    nombres: ["Cracovia", "Gniezno", "Poznań", "Wrocław", "Płock", "Sandomierz", "Lublin", "Kalisz", "Łęczyca", "Sieradz", "Opole", "Legnica", "Toruń", "Chełmno", "Radom", "Wiślica", "Głogów", "Racibórz", "Przemyśl", "Halych"],
  },
  bizancio: {
    nombre: "Imperio Bizantino",
    rasgo: "Arqueros y ballesteros +1 de alcance.",
    descripcion: "Las murallas de Constantinopla y el fuego griego: mil años aguantando a todo el que llegaba.",
    asentamientoInicial: "pueblo", tropasIniciales: ["campesino"], tecnologiasIniciales: [], hucha: null, arbol: null,
    bonos: [{ tipo: "stat", tropa: "arquero", stat: "alcance", valor: 1 }, { tipo: "stat", tropa: "ballestero", stat: "alcance", valor: 1 }],
    nombres: ["Constantinopla", "Tesalónica", "Nicea", "Esmirna", "Éfeso", "Trebisonda", "Adrianópolis", "Ancira", "Antioquía", "Corinto", "Atenas", "Patras", "Mistra", "Dirraquio", "Filipópolis", "Cesarea", "Iconio", "Sardes", "Amorion", "Dorilea"],
  },
  venecia: {
    nombre: "República de Venecia",
    rasgo: "Cada mina de oro y cada ciudad producen +1 de oro.",
    descripcion: "Ni ejército propio ni tierras: dinero, galeras y mercenarios pagados a tiempo.",
    asentamientoInicial: "pueblo", tropasIniciales: ["campesino"], tecnologiasIniciales: [], hucha: null, arbol: null,
    bonos: [{ tipo: "produccion_yacimiento", yacimiento: "mina_oro", recurso: "oro", valor: 1 }, { tipo: "produccion_asentamiento", asentamientos: ["ciudad"], recurso: "oro", valor: 1 }],
    nombres: ["Venecia", "Padua", "Verona", "Treviso", "Vicenza", "Rávena", "Ferrara", "Bolonia", "Génova", "Pisa", "Florencia", "Siena", "Milán", "Módena", "Parma", "Údine", "Trieste", "Ancona", "Rímini", "Mantua"],
  },
  escocia: {
    nombre: "Reino de Escocia",
    rasgo: "Toda tu infantería +5 de defensa.",
    descripcion: "Montañas, pantanos y muros de picas: se gana eligiendo el terreno y esperando.",
    asentamientoInicial: "pueblo", tropasIniciales: ["campesino"], tecnologiasIniciales: [], hucha: null, arbol: null,
    bonos: [{ tipo: "stat", etiqueta: "a_pie", stat: "defensa", valor: 5 }],
    nombres: ["Edimburgo", "Stirling", "Perth", "Dunfermline", "Scone", "Aberdeen", "Inverness", "Glasgow", "Dundee", "Ayr", "Berwick", "Roxburgh", "Elgin", "Dumbarton", "Falkirk", "Melrose", "Lanark", "Forfar", "Banff", "Nairn"],
  },
  hungria: {
    nombre: "Reino de Hungría",
    rasgo: "Todas tus tropas montadas +10 de ataque.",
    descripcion: "Jinetes de la estepa asentados en la llanura: llegan antes de que los veas venir.",
    asentamientoInicial: "pueblo", tropasIniciales: ["campesino"], tecnologiasIniciales: [], hucha: null, arbol: null,
    bonos: [{ tipo: "stat", etiqueta: "montada", stat: "ataque", valor: 10 }],
    nombres: ["Esztergom", "Buda", "Székesfehérvár", "Pécs", "Eger", "Győr", "Veszprém", "Szeged", "Debrecen", "Vác", "Nyitra", "Pozsony", "Kalocsa", "Zagreb", "Varasd", "Temesvár", "Kolozsvár", "Nagyvárad", "Sopron", "Miskolc"],
  },
  // Las hordas del modo Bárbaros. No es un bando jugable: no sale en los selectores (noJugable).
  barbaros: {
    nombre: "Hordas bárbaras",
    rasgo: "No construyen ni cobran: solo vienen.",
    descripcion: "Llegan por los cuatro costados, oleada tras oleada, y cada vez son más.",
    noJugable: true,
    asentamientoInicial: "pueblo", tropasIniciales: [], tecnologiasIniciales: [], hucha: null, arbol: null,
    bonos: [],
    nombres: ["Campamento", "Horda", "Túmulo", "Estacada", "Vado", "Otero", "Cañada", "Majada"],
  },
  azteca: {
    nombre: "Imperio Azteca",
    rasgo: "Campesinos +10 de ataque y las tropas ganan experiencia doble.",
    descripcion: "Guerreros jaguar y águila: la infantería es el ejército, y cada batalla forja veteranos.",
    asentamientoInicial: "pueblo", tropasIniciales: ["campesino"], tecnologiasIniciales: [], hucha: null, arbol: null,
    bonos: [{ tipo: "stat", tropa: "campesino", stat: "ataque", valor: 10 }, { tipo: "experiencia_factor", valor: 2 }],
    nombres: ["Tenochtitlan", "Texcoco", "Tlacopan", "Tlatelolco", "Xochimilco", "Chalco", "Azcapotzalco", "Cholula", "Tlaxcala", "Cuauhnáhuac", "Coyoacán", "Culhuacán", "Iztapalapa", "Tula", "Malinalco", "Tepoztlán", "Oaxtepec", "Toluca", "Tehuacán", "Huexotla"],
  },
};
