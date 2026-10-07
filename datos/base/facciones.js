// Las seis facciones (diseño cerrado el 13 sep 2026 con Rodrigo; la ficha completa está en FACCIONES.html).
//
// Cada facción es un pack: su líder (que es tu héroe, con su clase), su unidad propia desde el nivel 1,
// un rasgo, un poder del líder que se abre en el nivel 5 y una o dos tropas de siempre que NO tiene
// (para que cada una se juegue distinta). Dos son gratis y cuatro de pago.
//
// La escalera es la MISMA para todas: diez niveles con los mismos puntos, más el 11 (la Leyenda). Lo que cambia es lo que da cada
// nivel. En los niveles 1, 3, 5, 7 y 10 cada facción da algo suyo; en el resto, las tropas de siempre.
//
// rasgo.efectos usa los mismos efectos que las tecnologías y los bandos, más estos propios:
//   { tipo: "stat_casa", stat, valor }        tus tropas en tu territorio
//   { tipo: "saqueo", oro: { pueblo, ... } }   oro al conquistar un asentamiento, según lo que era
//   { tipo: "ingresos_factor", valor }         multiplica el oro que entra cada turno
//   { tipo: "cura_extra", etiqueta, valor }    más cura al descansar
//   { tipo: "terreno_llano", etiqueta, terrenos? }  bosque y colina (o solo los terrenos dados) cuestan como llanura
//   { tipo: "defensa_terreno", terrenos, valor }     tus tropas en esos terrenos, + defensa
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.facciones = {
  castilla: {
    nombre: "Corona de Castilla", pais: "España", lider: "Alfonso VIII", clase: "espadachin", bando: "castilla", pago: false,
    color: "#9c2a1f", emblema: "castillo", estilo: "Defensiva y equilibrada",
    descripcion: "Aguanta y gana por desgaste. Es la facción para aprender: perdona errores. Si defiendes tu tierra, es muy difícil de romper; si sales lejos, pierde su ventaja.",
    // 21 sep 2026 (Rodrigo): un SOLO bloque de texto para decidir en diez segundos; la descripción de siempre y lo
    // que hay que saber (héroe, poder, unidad propia y lo que le falta), seguido. Los detalles, más abajo.
    resumen: "Aguanta y gana por desgaste: es la facción para aprender, porque perdona errores. Tu héroe es Alfonso VIII, un espadachín equilibrado que hace más duras a las tropas que pelean a su lado, y su poder, Las Navas, da a todo tu ejército +5 de ataque y +5 de defensa durante un turno. Su unidad propia es el Caballero de Santiago: mejor que el caballero de siempre en todo y casi imposible de echar de un pueblo tuyo. A cambio, no tiene trabuquete y lejos de tu tierra pierde su ventaja.",
    unidad: "caballero_santiago", sinTropas: ["trabuquete"],
    rasgo: { nombre: "Tierra de frontera", texto: "Tus tropas en tu propio territorio tienen +3 de defensa.", efectos: [{ tipo: "stat_casa", stat: "defensa", valor: 3 }] },
    poder: { id: "navas", nombre: "Las Navas", texto: "Hasta tu próximo turno, todas tus tropas +5 de ataque y +5 de defensa.", efecto: { ataque: 5, defensa: 5 } },
    campana: "castilla",
  },
  vikingos: {
    nombre: "Vikingos", pais: "Noruega", lider: "Harald Hardrada", clase: "nordico", bando: "vikingos", pago: false,
    color: "#3d4c57", emblema: "barco", estilo: "Ataque rápido",
    descripcion: "Golpea primero y fuerte, y vive de lo que saquea. Si no avanza, se queda sin oro; si avanza bien, arrasa.",
    resumen: "Golpea primero y fuerte, y vive de lo que saquea. Tu héroe es Harald Hardrada, un nórdico que pega como nadie y más aún cuanto más herido está. Su poder, la Furia del norte, da +10 de ataque a toda tu infantería durante un turno, y su rasgo, Saqueo, te deja el oro de cada asentamiento que tomas. Su unidad propia es el berserker: un espadachín mejor que entra en trance al caer herido. A cambio, no tiene caballería pesada y, si no avanza, se queda sin oro.",
    unidad: "berserker", sinTropas: ["caballeria_pesada"],
    rasgo: { nombre: "Saqueo", texto: "Al conquistar un asentamiento te llevas su oro: 15 un pueblo, 25 una ciudad o un castillo.", efectos: [{ tipo: "saqueo", oro: { pueblo: 15, ciudad: 25, castillo: 25 } }] },
    poder: { id: "furia_norte", nombre: "Furia del norte", texto: "Hasta tu próximo turno, todas tus tropas a pie +10 de ataque.", efecto: { ataque: 10, etiqueta: "a_pie" } },
    campana: "vikingos",
  },
  inglaterra: {
    nombre: "Reino de Inglaterra", pais: "Reino Unido", lider: "Eduardo I", clase: "arquero", bando: "inglaterra", pago: true,
    color: "#3f6b35", emblema: "leon", estilo: "A distancia",
    descripcion: "Gana sin que el enemigo llegue a tocarle. Con un muro de lanceros delante, sus arqueros no tienen rival; si les llega la caballería, caen enseguida.",
    resumen: "Gana sin que el enemigo llegue a tocarle. Tu héroe es Eduardo I, un arquero que dispara sin recibir respuesta y anima a tus tiradores, y su rasgo de reino, Tiradores, da +3 de ataque y +2 de defensa a todas tus tropas que disparan. Su poder, Lluvia de flechas, hace que durante un turno todas tus tropas a distancia alcancen un hexágono más lejos. Su unidad propia es el arquero largo, que dispara a dos hexágonos, cuesta lo mismo que un arquero corriente y clava estacas contra la caballería. A cambio, no tiene ballesteros y, si le llega la caballería encima, cae enseguida.",
    unidad: "arquero_largo", sinTropas: ["ballestero"],
    rasgo: { nombre: "Tiradores", texto: "Todas tus tropas a distancia, +3 de ataque y +2 de defensa.", efectos: [{ tipo: "stat", etiqueta: "a_distancia", stat: "ataque", valor: 3 }, { tipo: "stat", etiqueta: "a_distancia", stat: "defensa", valor: 2 }] },
    poder: { id: "lluvia", nombre: "Lluvia de flechas", texto: "Hasta tu próximo turno, todas tus tropas a distancia disparan un hexágono más lejos.", efecto: { alcance: 1, etiqueta: "a_distancia" } },
    campana: "inglaterra",
  },
  mali: {
    nombre: "Imperio de Malí", pais: "Malí", lider: "Mansa Musa", clase: "mansa", bando: "mali", pago: true,
    color: "#b07a1e", emblema: "sol", estilo: "Económica",
    descripcion: "Gana con la bolsa. Mansa Musa pasa por ser el hombre más rico de la historia: Malí saca más oro cada turno y puede pagar tropas mejores antes que nadie.",
    resumen: "Gana con la bolsa. Tu héroe es Mansa Musa, que saca +3 de oro por cada enemigo que derrota y hace más duras a las tropas de al lado, y su rasgo, Oro de Malí, te da un 6 % más de oro cada turno. Su poder, los griots, cura 15 de vida a las tropas que tenga a tres casillas o menos. Su unidad propia es el jinete mandinga: un caballero algo mejor en todo, que cuesta algo más; con el oro de Malí, lo pagas antes que nadie. A cambio, no tiene infantería pesada ni trabuquete, así que le cuesta tomar murallas.",
    unidad: "jinete_mandinga", sinTropas: ["infanteria_pesada", "trabuquete"],
    rasgo: { nombre: "Oro de Malí", texto: "Ganas un 6 % más de oro cada turno.", efectos: [{ tipo: "ingresos_factor", valor: 1.06 }] },
    poder: { id: "griots", nombre: "Los griots", texto: "Los cantores del Mansa levantan el ánimo: tus tropas a tres casillas o menos de él recuperan 15 de vida al momento.", efecto: { curaTodas: 15, cerca: 3 } },
    campana: "mali",
  },
  saladino: {
    nombre: "Sultanato de Saladino", pais: "Egipto y Siria", lider: "Saladino", clase: "alquimista", bando: "saladino", pago: true,
    color: "#1f6b62", emblema: "media_luna", estilo: "Caballería de élite",
    descripcion: "Pocas tropas, pero las mejores. Todo gira en torno a una caballería carísima que no se puede perder. Sus lanzadores de nafta queman lo que tocan.",
    resumen: "Pocas tropas, pero las mejores. Tu héroe es Saladino, un alquimista cuyo ataque quema 5 de vida a todos los enemigos pegados al objetivo y cura a los tuyos que descansan a su lado. Su poder, Hattin, quita 10 de vida a todas las tropas enemigas pegadas a las tuyas, y su rasgo hace que tus jinetes curen 5 más al descansar. Su unidad propia es el mameluco: un caballero mejor y protegido de las flechas. A cambio, no tiene infantería pesada y cada tropa que pierde le duele mucho.",
    unidad: "mameluco", sinTropas: ["infanteria_pesada"],
    rasgo: { nombre: "Jinetes curtidos", texto: "Tus tropas montadas curan 5 más cuando descansan.", efectos: [{ tipo: "cura_extra", etiqueta: "montada", valor: 5 }] },
    poder: { id: "hattin", nombre: "Hattin", texto: "La sed: todas las tropas enemigas pegadas a las tuyas pierden 10 de vida (sin bajar de 1).", efecto: { danoPegados: 10 } },
    campana: "saladino",
  },
  mongoles: {
    nombre: "Imperio mongol", pais: "Mongolia", lider: "Gengis Kan", clase: "kan", bando: "mongoles", pago: true,
    color: "#4b4f8f", emblema: "arco", estilo: "Movilidad total",
    descripcion: "Está en todas partes. La única facción que se juega a caballo y a distancia a la vez: acosa, dispara y se va antes de que le respondan. La más difícil de manejar.",
    resumen: "Está en todas partes. Tu héroe es Gengis Kan, que puede moverse después de disparar, sabe montar de nacimiento y da +2 de ataque a los jinetes de al lado, y su rasgo, Estepa, hace que tu caballería cruce bosques y colinas como si fueran llanura. Su poder, el Yam, da +2 de movimiento a todo tu ejército durante un turno. Su unidad propia es el arquero a caballo, que dispara al galope y se va antes de que le respondan. A cambio, no tiene alabarderos ni infantería pesada, y los lanceros enemigos le hacen mucho daño.",
    unidad: "arquero_caballo", sinTropas: ["alabardero", "infanteria_pesada"],
    rasgo: { nombre: "Estepa", texto: "Tus tropas montadas entran en bosques y colinas como si fueran llanura.", efectos: [{ tipo: "terreno_llano", etiqueta: "montada" }] },
    poder: { id: "yam", nombre: "El Yam", texto: "La red de postas: este turno, todas tus tropas andan una casilla más.", efecto: { movimiento: 2 } },
    campana: "mongoles",
  },
  // La séptima (15 sep 2026): las tribus eslavas antes de los reinos, para que la sientan suya polacos, ucranianos,
  // rusos, checos… sin ser de ningún país. Vesna ("primavera" en todas sus lenguas) es inventada a propósito.
  // Colores de bosque y un roble: nada de banderas, águilas, tridentes ni kolovrat.
  eslavos: {
    nombre: "Tribus eslavas", pais: "Europa del Este", lider: "Vesna", clase: "hechicera", bando: "eslavos", pago: true,
    color: "#6b4a2b", emblema: "roble", estilo: "Bosque y aguante",
    descripcion: "Pelea donde el enemigo no quiere entrar. En el bosque y en las colinas es casi imposible de echar, y su hechicera cura a quien lucha a su lado. En campo abierto y sin caballería pesada, sufre.",
    resumen: "Pelea donde el enemigo no quiere entrar. Tu heroína es Vesna, una hechicera que lanza un rayo a dos hexágonos y cura 10 a las tropas que luchan a su lado al acabar el turno. Su rasgo, Hijos del bosque, da +3 de defensa en bosque y colina y deja que tu infantería cruce el bosque como si fuera llanura, y su poder, Invierno, quita 1 de movimiento a todo el ejército enemigo. Su unidad propia es el guardián del bosque, un lancero mejor que en el bosque es casi inamovible. A cambio, no tiene caballería pesada y en campo abierto sufre.",
    unidad: "guardian_bosque", sinTropas: ["caballeria_pesada"],
    rasgo: { nombre: "Hijos del bosque", texto: "Tus tropas en bosque o colina tienen +3 de defensa, y las que van a pie cruzan el bosque como si fuera llanura.", efectos: [{ tipo: "defensa_terreno", terrenos: ["bosque", "colina"], valor: 3 }, { tipo: "terreno_llano", etiqueta: "a_pie", terrenos: ["bosque"] }] },
    poder: { id: "invierno", nombre: "Invierno", texto: "Hasta tu próximo turno, todas las tropas enemigas mueven 1 menos (nunca menos de 1).", efecto: { inviernoEnemigos: 1 } },
    campana: "eslavos",
  },
};

// Orden en el que se enseñan: las gratis primero.
FWM.datosBase.ordenFacciones = ["castilla", "vikingos", "inglaterra", "mali", "saladino", "mongoles", "eslavos"];

// La escalera: la misma para las seis. `hito` marca los niveles donde cada facción da algo suyo.
//   unidad    la unidad propia y el rasgo       curtida   la unidad propia gana su primera habilidad
//   poder     el poder del líder (1 por partida) maestra   la unidad propia gana la segunda
//   techo     el poder se usa dos veces y la unidad propia se viste de oro
// `tropas`: las de siempre que abre ese nivel. `marca`: lo que se ve en la figura del héroe.
FWM.datosBase.escalera = [
  { nivel: 1, nombre: "Recluta", puntos: 0, hito: "unidad", tropas: [], marca: null },
  { nivel: 2, nombre: "Escudero", puntos: 400, tropas: ["monje"], marca: "casco" },
  { nivel: 3, nombre: "Soldado", puntos: 1200, hito: "curtida", tropas: [], marca: "cota" },
  { nivel: 4, nombre: "Sargento", puntos: 2500, tropas: ["ballestero", "alabardero"], marca: "blason" },
  { nivel: 5, nombre: "Caballero", puntos: 4200, hito: "poder", tropas: [], marca: "capa" },
  { nivel: 6, nombre: "Capitán", puntos: 6500, tropas: ["infanteria_pesada", "caballeria_pesada"], marca: "corona" },
  { nivel: 7, nombre: "Señor", puntos: 9500, hito: "maestra", tropas: [], marca: "manto" },
  { nivel: 8, nombre: "Príncipe", puntos: 13000, tropas: ["trabuquete"], marca: "hombreras" },
  { nivel: 9, nombre: "Rey", puntos: 17000, tropas: [], marca: "gala" },
  { nivel: 10, nombre: "Emperador", puntos: 22000, hito: "techo", tropas: [], marca: "estandarte" },
  // 16 sep 2026: la Leyenda es el nivel 11, un escalón más de la escalera (nunca un "10 + Leyenda"). No se sube
  // por puntos (`puntos: null`), lo ocupa una sola persona: quien llega a 10 y tiene más puntos que nadie.
  // Juega con las reglas del 10.
  { nivel: 11, nombre: "Leyenda", puntos: null, unica: true, tropas: [], marca: "leyenda" },
];

// Cálculos puros de las facciones (sin pantalla ni guardado).
FWM.facciones = (function () {
  const D = () => FWM.datosBase.facciones;
  const ESC = () => FWM.datosBase.escalera;
  const NIVEL_MAX = 10, NIVEL_LEYENDA = 11; // el 11 es la Leyenda: se juega con las reglas del 10
  const CURTIDA = 3, PODER = 5, MAESTRA = 7, TECHO = 10;

  function lista() { return FWM.datosBase.ordenFacciones.slice(); }
  function de(id) { return D()[id] || null; }
  function gratis() { return lista().filter(id => !D()[id].pago); }
  function dePago() { return lista().filter(id => D()[id].pago); }
  function porClase(clase) { return lista().find(id => D()[id].clase === clase) || null; }

  // Nivel en el que se abre una tropa de siempre (1 si no está en la escalera).
  function nivelTropa(tipo) { const n = ESC().find(x => x.tropas.includes(tipo)); return n ? n.nivel : 1; }
  function nivelPorPuntos(p) { let n = 1; for (const x of ESC()) if (x.puntos != null && p >= x.puntos) n = x.nivel; return n; }
  function datosNivel(n) { return ESC().find(x => x.nivel === n) || ESC()[0]; }

  // ¿Puede tener esta tropa un jugador de la partida? null o el motivo.
  // jugador: { faccion, nivel }. Sin facción (reinos de la máquina en las grandes batallas): todo lo de siempre por nivel.
  // nivel de un jugador de la partida (las partidas guardadas antes de las facciones solo tienen el del héroe)
  const nivelDe = (j) => (j && (j.nivel || (j.heroe && j.heroe.nivel))) || 1;
  function puedeTener(datos, jugador, tipo) {
    const def = datos.tropas[tipo]; if (!def) return "no_se_puede";
    if (def.noReclutable) return "no_se_puede";
    const nivel = nivelDe(jugador);
    if (def.faccion) return jugador && jugador.faccion === def.faccion ? null : "otra_faccion";
    const f = jugador && jugador.faccion && D()[jugador.faccion];
    if (f && f.sinTropas.includes(tipo)) return "sin_esa_tropa";
    if (nivel < nivelTropa(tipo)) return "nivel_heroe";
    return null;
  }

  // Qué tropas de la escalera no tiene la facción hasta ese nivel: cada una da un punto de mejora extra.
  function puntosExtra(faccion, nivel) {
    const f = D()[faccion]; if (!f) return 0;
    return ESC().filter(x => x.nivel <= nivel).reduce((s, x) => s + x.tropas.filter(t => f.sinTropas.includes(t)).length, 0);
  }

  // La ficha de una tropa al nivel de su dueño: la unidad propia suma sus habilidades de nivel 3 y 7.
  // Se guarda en caché por tipo y nivel (el motor la pide muchísimas veces).
  const cache = new WeakMap();
  function defNivel(datos, tipo, nivel) {
    const base = datos.tropas[tipo]; if (!base || (!base.curtida && !base.maestra)) return base;
    let porDatos = cache.get(datos); if (!porDatos) { porDatos = {}; cache.set(datos, porDatos); }
    const clave = tipo + ":" + (nivel >= MAESTRA ? MAESTRA : nivel >= CURTIDA ? CURTIDA : 1);
    if (porDatos[clave]) return porDatos[clave];
    const d = Object.assign({}, base, { stats: Object.assign({}, base.stats), bonos: Object.assign({}, base.bonos || {}), defensaContra: Object.assign({}, base.defensaContra || {}) });
    const sumar = (m) => {
      if (!m) return;
      for (const [k, v] of Object.entries(m)) {
        if (k === "stats") for (const [s, x] of Object.entries(v)) d.stats[s] = (d.stats[s] || 0) + x;
        else if (k === "bonos" || k === "defensaContra") for (const [s, x] of Object.entries(v)) d[k][s] = (d[k][s] || 0) + x;
        else d[k] = v;
      }
    };
    if (nivel >= CURTIDA) sumar(base.curtida);
    if (nivel >= MAESTRA) sumar(base.maestra);
    porDatos[clave] = d;
    return d;
  }
  // Atajo con estado: la ficha de una tropa concreta de la partida.
  function defDe(estado, datos, tropa) {
    const j = estado && estado.jugadores && estado.jugadores[tropa.dueno];
    return defNivel(datos, tropa.tipo, nivelDe(j));
  }

  // Efectos del rasgo de un jugador de un tipo concreto (los propios de las facciones).
  function rasgo(estado, jugadorId, tipo) {
    const j = estado.jugadores[jugadorId]; const f = j && j.faccion && D()[j.faccion];
    if (!f) return null;
    return f.rasgo.efectos.find(e => e.tipo === tipo) || null;
  }

  // Poder del líder: cuántos usos le quedan (0 si aún no llega al nivel 5).
  function usosPoder(jugador) {
    if (!jugador || !jugador.faccion || !D()[jugador.faccion]) return 0;
    const nivel = nivelDe(jugador); if (nivel < PODER) return 0;
    return Math.max(0, (nivel >= TECHO ? 2 : 1) - (jugador.poderUsos || 0));
  }

  return { nivelDe, lista, de, gratis, dePago, porClase, nivelTropa, nivelPorPuntos, datosNivel, puedeTener, puntosExtra, defNivel, defDe, rasgo, usosPoder, NIVEL_MAX, NIVEL_LEYENDA, CURTIDA, PODER, MAESTRA, TECHO };
})();
