// Objetos del héroe. Cuatro tipos equipables (arma, escudo, montura, cabeza), consumibles y de aspecto.
// Ningún objeto pasa de +3 en nada. Cómo sale: tienda (precio en oro del héroe), botín al acabar, medalla (id:nivel), campaña, liga.
// efecto: se suma a las mejoras del héroe (mismos nombres que en heroes.js) más: asedio, bonos { etiqueta: valor },
// guarnicionDefensa (tropas acuarteladas con el héroe), resurreccion (vuelve una vez).
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.objetos = {
  // 18 sep 2026: precios y efectos con la tabla de valores del banco de pruebas (pruebas/banco/banco.js valores y
  // valoresHumano: % de victorias de más que da cada efecto en el héroe). Lo que más vale es aguantar (vida, defensa),
  // la economía (oro por turno) y moverse; el ataque casi no cambia nada y los bonos contra un tipo, poco. Regla:
  // unos 30 de oro del héroe por cada punto de victoria de más; común hasta 200, raro hasta 450, épico por encima.
  // Por huecos, del más barato al más caro. Los bonos contra un tipo de tropa bajan a +5 (antes +15: absurdo).
  espada_hierro: { nombre: "Espada de hierro", tipo: "arma", rareza: "comun", efecto: { ataque: 2 }, texto: "+2 de ataque", tienda: 90, botin: true, dibujo: "espada" },
  lanza_larga: { nombre: "Lanza larga", tipo: "arma", rareza: "comun", efecto: { bonos: { montada: 5 } }, texto: "+5 contra caballería", tienda: 90, botin: true, dibujo: "lanza" },
  hacha: { nombre: "Hacha de leñador", tipo: "arma", rareza: "comun", efecto: { asedio: 10 }, texto: "+10 de asedio", tienda: 90, botin: true, dibujo: "hacha" },
  maza: { nombre: "Maza de guerra", tipo: "arma", rareza: "comun", efecto: { bonos: { armadura: 5 }, asedio: 5 }, texto: "+5 contra tropas con armadura, +5 de asedio", tienda: 120, botin: true, dibujo: "maza" },
  sable: { nombre: "Sable de jinete", tipo: "arma", rareza: "comun", efecto: { bonos: { a_pie: 5 } }, texto: "+5 contra tropas a pie", tienda: 150, dibujo: "sable" },
  espada_larga: { nombre: "Espada larga", tipo: "arma", rareza: "raro", efecto: { ataque: 3, vida: 5 }, texto: "+3 de ataque, +5 de vida", tienda: 260, dibujo: "espada_larga" },
  martillo: { nombre: "Martillo de asedio", tipo: "arma", rareza: "raro", efecto: { asedio: 20, ataque: 1 }, texto: "+20 de asedio, +1 de ataque", tienda: 250, dibujo: "martillo" },
  espada_capitan: { nombre: "Espada del capitán", tipo: "arma", rareza: "raro", efecto: { ataque: 2, auraAtaque: 1 }, texto: "+2 de ataque; tropas pegadas +1 de ataque", medalla: "carnicero:3", dibujo: "espada_oro" },
  mandoble: { nombre: "Mandoble", tipo: "arma", rareza: "epico", efecto: { ataque: 3, vida: 10 }, texto: "+3 de ataque, +10 de vida", liga: 1, dibujo: "mandoble" },
  rodela: { nombre: "Rodela", tipo: "escudo", rareza: "comun", efecto: { defensa: 1 }, texto: "+1 de defensa", tienda: 140, botin: true, dibujo: "rodela" },
  escudo_puas: { nombre: "Escudo de púas", tipo: "escudo", rareza: "comun", efecto: { defensa: 1, ataque: 1 }, texto: "+1 de defensa, +1 de ataque", tienda: 170, dibujo: "puas" },
  escudo_reforzado: { nombre: "Escudo reforzado", tipo: "escudo", rareza: "raro", efecto: { defensa: 2 }, texto: "+2 de defensa", tienda: 280, dibujo: "reforzado" },
  escudo_torre: { nombre: "Escudo de torre", tipo: "escudo", rareza: "raro", efecto: { defensa: 1, defensaDistancia: 3 }, texto: "+1 de defensa, y +3 más contra tropas a distancia", medalla: "intacto:1", dibujo: "torre" },
  escudo_blason: { nombre: "Escudo del blasón", tipo: "escudo", rareza: "raro", efecto: { guarnicionDefensa: 2 }, texto: "+2 de defensa a las tropas acuarteladas con el héroe", tienda: 300, dibujo: "blason" },
  egida: { nombre: "Égida", tipo: "escudo", rareza: "epico", efecto: { defensa: 3 }, texto: "+3 de defensa", liga: 2, dibujo: "egida" },
  mula: { nombre: "Mula", tipo: "montura", rareza: "comun", efecto: { vida: 5 }, texto: "+5 de vida", tienda: 150, botin: true, dibujo: "mula" },
  poni: { nombre: "Poni", tipo: "montura", rareza: "raro", efecto: { vida: 10 }, texto: "+10 de vida", tienda: 280, dibujo: "poni" },
  caballo: { nombre: "Caballo", tipo: "montura", rareza: "raro", efecto: { movimiento: 1 }, texto: "+1 de movimiento", tienda: 320, medalla: "relampago:3", dibujo: "caballo" },
  caballo_barda: { nombre: "Caballo con barda", tipo: "montura", rareza: "epico", efecto: { movimiento: 1, defensa: 1 }, texto: "+1 de movimiento, +1 de defensa", tienda: 520, dibujo: "barda" },
  corcel: { nombre: "Corcel de guerra", tipo: "montura", rareza: "epico", efecto: { movimiento: 1, vida: 10 }, texto: "+1 de movimiento, +10 de vida", campana: 8, dibujo: "corcel" },
  gorro_lana: { nombre: "Gorro de lana", tipo: "cabeza", rareza: "comun", efecto: { vida: 5 }, texto: "+5 de vida", tienda: 150, botin: true, dibujo: "gorro" },
  casco_hierro: { nombre: "Casco de hierro", tipo: "cabeza", rareza: "comun", efecto: { defensa: 1 }, texto: "+1 de defensa", tienda: 140, dibujo: "casco_hierro" },
  yelmo: { nombre: "Yelmo", tipo: "cabeza", rareza: "raro", efecto: { defensa: 1, vida: 5 }, texto: "+1 de defensa, +5 de vida", tienda: 280, dibujo: "yelmo" },
  yelmo_cimera: { nombre: "Yelmo con cimera", tipo: "cabeza", rareza: "raro", efecto: { defensa: 1, auraAtaque: 1 }, texto: "+1 de defensa; tropas pegadas +1 de ataque", tienda: 320, dibujo: "cimera" },
  diadema: { nombre: "Diadema del tesorero", tipo: "cabeza", rareza: "raro", efecto: { oro: 1 }, texto: "+1 de oro por turno", tienda: 300, dibujo: "diadema" },
  corona_laurel: { nombre: "Corona de laurel", tipo: "cabeza", rareza: "raro", efecto: { oro: 1, vida: 5 }, texto: "+1 de oro por turno, +5 de vida", medalla: "del_dia:3", dibujo: "laurel" },
  corona_rey: { nombre: "Corona del rey", tipo: "cabeza", rareza: "epico", efecto: { oro: 2, defensa: 1 }, texto: "+2 de oro por turno, +1 de defensa", campana: 10, dibujo: "corona_rey" },
  pocima: { nombre: "Pócima de resurrección", tipo: "consumible", rareza: "raro", efecto: { resurreccion: 1 }, texto: "Si el héroe muere, vuelve a la capital al turno siguiente con la mitad de la vida. Se gasta al usarla.", tienda: 400, botin: "raro", dibujo: "pocima" },
  capa_embajador: { nombre: "Capa del embajador", tipo: "aspecto", rareza: "raro", efecto: {}, texto: "Solo aspecto: capa verde y oro", medalla: "tres_bandos:3", dibujo: "capa_verde" },
  // aspectos del nivel de cuenta (13 sep 2026): uno cada cinco niveles, sin efecto en el juego
  capa_granate: { nombre: "Capa granate", tipo: "aspecto", rareza: "comun", efecto: {}, texto: "Solo aspecto: capa granate", cuenta: 5, dibujo: "capa_granate" },
  capa_azul: { nombre: "Capa azul de viaje", tipo: "aspecto", rareza: "comun", efecto: {}, texto: "Solo aspecto: capa azul", cuenta: 10, dibujo: "capa_azul" },
  estandarte_leon: { nombre: "Estandarte del león", tipo: "aspecto", rareza: "raro", efecto: {}, texto: "Solo aspecto: un estandarte con un león a la espalda", cuenta: 15, dibujo: "estandarte_leon" },
  capa_armino: { nombre: "Capa de armiño", tipo: "aspecto", rareza: "raro", efecto: {}, texto: "Solo aspecto: capa blanca moteada, de rey", cuenta: 20, dibujo: "capa_armino" },
  manto_estrellas: { nombre: "Manto de estrellas", tipo: "aspecto", rareza: "epico", efecto: {}, texto: "Solo aspecto: manto azul noche con estrellas", cuenta: 25, dibujo: "manto_estrellas" },
  capa_oro: { nombre: "Capa de oro", tipo: "aspecto", rareza: "epico", efecto: {}, texto: "Solo aspecto: capa dorada", cuenta: 30, dibujo: "capa_oro" },
  // aspectos de las campañas de las facciones (13 sep 2026): el capítulo 8 y el 10 de cada una
  capa_lobo: { nombre: "Piel de lobo", tipo: "aspecto", rareza: "raro", efecto: {}, texto: "Solo aspecto: una piel de lobo sobre los hombros", campana: 8, campanaDe: "vikingos", dibujo: "capa_lobo" },
  estandarte_dragon: { nombre: "Estandarte del dragón", tipo: "aspecto", rareza: "epico", efecto: {}, texto: "Solo aspecto: el estandarte de Harald, un dragón negro sobre rojo", campana: 10, campanaDe: "vikingos", dibujo: "estandarte_dragon" },
  capa_arquero: { nombre: "Capa del arquero", tipo: "aspecto", rareza: "raro", efecto: {}, texto: "Solo aspecto: capa verde de los bosques", campana: 8, campanaDe: "inglaterra", dibujo: "capa_arquero" },
  capa_leones: { nombre: "Capa de los leones", tipo: "aspecto", rareza: "epico", efecto: {}, texto: "Solo aspecto: capa roja con leones de oro", campana: 10, campanaDe: "inglaterra", dibujo: "capa_leones" },
  capa_indigo: { nombre: "Manto añil", tipo: "aspecto", rareza: "raro", efecto: {}, texto: "Solo aspecto: manto teñido de añil", campana: 8, campanaDe: "mali", dibujo: "capa_indigo" },
  manto_dorado: { nombre: "Manto de oro de Malí", tipo: "aspecto", rareza: "epico", efecto: {}, texto: "Solo aspecto: el manto de oro del primer rey de Malí", campana: 10, campanaDe: "mali", dibujo: "manto_dorado" },
  capa_seda: { nombre: "Capa de seda", tipo: "aspecto", rareza: "raro", efecto: {}, texto: "Solo aspecto: seda verde de Damasco", campana: 8, campanaDe: "saladino", dibujo: "capa_seda" },
  capa_aguila: { nombre: "Capa del águila", tipo: "aspecto", rareza: "epico", efecto: {}, texto: "Solo aspecto: capa amarilla con el águila de Saladino", campana: 10, campanaDe: "saladino", dibujo: "capa_aguila" },
  capa_fieltro: { nombre: "Capa de fieltro", tipo: "aspecto", rareza: "raro", efecto: {}, texto: "Solo aspecto: fieltro de la estepa, bueno para el frío", campana: 8, campanaDe: "mongoles", dibujo: "capa_fieltro" },
  capa_abedul: { nombre: "Capa de abedul", tipo: "aspecto", rareza: "raro", efecto: {}, texto: "Solo aspecto: lana teñida del color de la corteza de abedul", campana: 8, campanaDe: "eslavos", dibujo: "capa_abedul" },
  manto_primavera: { nombre: "Manto de la primavera", tipo: "aspecto", rareza: "epico", efecto: {}, texto: "Solo aspecto: el manto verde de la que trajo la primavera a las tribus", campana: 10, campanaDe: "eslavos", dibujo: "manto_primavera" },
  capa_estepa: { nombre: "Manto del kan", tipo: "aspecto", rareza: "epico", efecto: {}, texto: "Solo aspecto: el manto azul cielo del kan de todas las tribus", campana: 10, campanaDe: "mongoles", dibujo: "capa_estepa" },
};

FWM.datosBase.objetosReglas = {
  tipos: ["arma", "escudo", "montura", "cabeza", "consumible", "aspecto"],
  rarezas: { comun: "Común", raro: "Raro", epico: "Épico" },
  // botín al acabar una partida: probabilidad base y extras
  botin: { pierde: 0.03, gana: 0.08, dia: 0.02, duelo: 0.02, raro: 0.10, repetidoOro: 30 },
  // oro del héroe por partida
  oro: { porcentajeOroFinal: 0.05, ganar: 10, dia: 5, dueloHumano: 10 },
};
