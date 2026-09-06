// Objetos del héroe. Cuatro tipos equipables (arma, escudo, montura, cabeza), consumibles y de aspecto.
// Ningún objeto pasa de +3 en nada. Cómo sale: tienda (precio en oro del héroe), botín al acabar, medalla (id:nivel), campaña, liga.
// efecto: se suma a las mejoras del héroe (mismos nombres que en heroes.js) más: asedio, bonos { etiqueta: valor },
// guarnicionDefensa (tropas acuarteladas con el héroe), resurreccion (vuelve una vez).
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.objetos = {
  espada_hierro: { nombre: "Espada de hierro", tipo: "arma", rareza: "comun", efecto: { ataque: 1 }, texto: "+1 de ataque", tienda: 120, botin: true, dibujo: "espada" },
  lanza_larga: { nombre: "Lanza larga", tipo: "arma", rareza: "comun", efecto: { bonos: { montada: 15 } }, texto: "+15 contra caballería", tienda: 150, botin: true, dibujo: "lanza" },
  hacha: { nombre: "Hacha de leñador", tipo: "arma", rareza: "comun", efecto: { asedio: 10 }, texto: "+10 de asedio", tienda: 120, botin: true, dibujo: "hacha" },
  espada_capitan: { nombre: "Espada del capitán", tipo: "arma", rareza: "raro", efecto: { ataque: 2, auraAtaque: 1 }, texto: "+2 de ataque; tropas pegadas +1 de ataque", medalla: "carnicero:3", dibujo: "espada_oro" },
  mandoble: { nombre: "Mandoble", tipo: "arma", rareza: "epico", efecto: { ataque: 3, defensa: -1 }, texto: "+3 de ataque, −1 de defensa", liga: 1, dibujo: "mandoble" },
  rodela: { nombre: "Rodela", tipo: "escudo", rareza: "comun", efecto: { defensa: 1 }, texto: "+1 de defensa", tienda: 120, botin: true, dibujo: "rodela" },
  escudo_torre: { nombre: "Escudo de torre", tipo: "escudo", rareza: "raro", efecto: { defensaDistancia: 2 }, texto: "+2 de defensa contra tropas a distancia", medalla: "intacto:1", dibujo: "torre" },
  escudo_blason: { nombre: "Escudo del blasón", tipo: "escudo", rareza: "raro", efecto: { guarnicionDefensa: 1 }, texto: "+1 de defensa a las tropas acuarteladas con el héroe", tienda: 450, dibujo: "blason" },
  egida: { nombre: "Égida", tipo: "escudo", rareza: "epico", efecto: { defensa: 3 }, texto: "+3 de defensa", liga: 2, dibujo: "egida" },
  mula: { nombre: "Mula", tipo: "montura", rareza: "comun", efecto: { vida: 5 }, texto: "+5 de vida", tienda: 120, botin: true, dibujo: "mula" },
  caballo: { nombre: "Caballo", tipo: "montura", rareza: "raro", efecto: { movimiento: 1 }, texto: "+1 de movimiento", medalla: "relampago:3", dibujo: "caballo" },
  corcel: { nombre: "Corcel de guerra", tipo: "montura", rareza: "epico", efecto: { movimiento: 1, ataque: 1 }, texto: "+1 de movimiento, +1 de ataque", campana: 8, dibujo: "corcel" },
  gorro_lana: { nombre: "Gorro de lana", tipo: "cabeza", rareza: "comun", efecto: { vida: 5 }, texto: "+5 de vida", botin: true, dibujo: "gorro" },
  yelmo: { nombre: "Yelmo", tipo: "cabeza", rareza: "raro", efecto: { defensa: 1, vida: 5 }, texto: "+1 de defensa, +5 de vida", tienda: 400, dibujo: "yelmo" },
  corona_laurel: { nombre: "Corona de laurel", tipo: "cabeza", rareza: "raro", efecto: { oro: 1 }, texto: "+1 de oro por turno", medalla: "del_dia:3", dibujo: "laurel" },
  corona_rey: { nombre: "Corona del rey", tipo: "cabeza", rareza: "epico", efecto: { oro: 2, defensa: 1 }, texto: "+2 de oro por turno, +1 de defensa", campana: 10, dibujo: "corona_rey" },
  pocima: { nombre: "Pócima de resurrección", tipo: "consumible", rareza: "raro", efecto: { resurreccion: 1 }, texto: "Si el héroe muere, vuelve a la capital al turno siguiente con la mitad de la vida. Se gasta al usarla.", tienda: 400, botin: "raro", dibujo: "pocima" },
  capa_embajador: { nombre: "Capa del embajador", tipo: "aspecto", rareza: "raro", efecto: {}, texto: "Solo aspecto: capa verde y oro", medalla: "tres_bandos:3", dibujo: "capa_verde" },
};

FWM.datosBase.objetosReglas = {
  tipos: ["arma", "escudo", "montura", "cabeza", "consumible", "aspecto"],
  rarezas: { comun: "Común", raro: "Raro", epico: "Épico" },
  // botín al acabar una partida: probabilidad base y extras
  botin: { pierde: 0.03, gana: 0.08, dia: 0.02, duelo: 0.02, raro: 0.10, repetidoOro: 30 },
  // oro del héroe por partida
  oro: { porcentajeOroFinal: 0.05, ganar: 10, dia: 5, dueloHumano: 10 },
};
