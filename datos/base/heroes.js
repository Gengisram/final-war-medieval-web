// El héroe: cuatro clases, ocho niveles, cincuenta puntos de mejora en un árbol de cadenas.
// Diseño en DISENO-HEROE.md (5 sep 2026). Los datos viven aquí; los cálculos puros en FWM.heroes.
// El héroe de cada jugador va en estado.jugadores[i].heroe = { clase, nivel, mejoras: { cadena: peldaños } }
// y su tropa es de tipo "heroe_<clase>" (las crea el cargador a partir de las clases).
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.heroes = {
  // ---------- clases ----------
  clases: {
    espadachin: {
      nombre: "Espadachín", descripcion: "Equilibrado. Se cuela entre las lanzas y su rodela para flechas. Su presencia hace más duras a las tropas de al lado.",
      stats: { ataque: 32, asedio: 10, defensa: 22, vida: 70, alcance: 0, movimiento: 2 },
      etiquetas: ["heroe", "a_pie", "cuerpo_a_cuerpo", "armadura"], bonos: { lanza: 10 }, defensaContra: { a_distancia: 5 },
      aura: { defensa: 1 }, rasgo: "+10 contra lanzas, +5 de defensa contra flechas. Aura: +1 defensa.",
    },
    arquero: {
      nombre: "Arquero", descripcion: "Dispara a un hexágono sin recibir contraataque y más lejos desde una colina. Anima a los tiradores.",
      stats: { ataque: 22, asedio: 5, defensa: 12, vida: 55, alcance: 1, movimiento: 2 },
      etiquetas: ["heroe", "a_pie", "a_distancia"], bonos: {}, defensaContra: {},
      aura: { ataqueDistancia: 1 }, rasgo: "Dispara a 1 hexágono; +1 alcance en colina. Aura: +1 ataque a las tropas a distancia.",
    },
    nordico: {
      nombre: "Nórdico", descripcion: "Pega como nadie y pega más cuanto más herido está. Poca armadura. Sus gritos enardecen a los de al lado.",
      stats: { ataque: 40, asedio: 10, defensa: 12, vida: 75, alcance: 0, movimiento: 2 },
      etiquetas: ["heroe", "a_pie", "cuerpo_a_cuerpo"], bonos: {}, defensaContra: {},
      furia: { porVida: 25, valor: 5, tope: 10 }, aura: { ataque: 1 }, rasgo: "Furia: +5 de ataque por cada 25 de vida perdida (hasta +10). Aura: +1 ataque.",
    },
    alquimista: {
      nombre: "Alquimista", descripcion: "Lanza fuego a un hexágono: el objetivo arde y los enemigos pegados a él se chamuscan. Sus ungüentos curan a los de al lado.",
      stats: { ataque: 20, asedio: 10, defensa: 14, vida: 55, alcance: 1, movimiento: 2 },
      etiquetas: ["heroe", "a_pie", "a_distancia"], bonos: {}, defensaContra: {},
      fuego: { dano: 5 }, aura: { cura: 3 }, rasgo: "Fuego: su ataque quema 5 a los enemigos pegados al objetivo. Aura: las tropas que descansan curan +3 más.",
    },
  },

  // ---------- niveles (puntos acumulados) ----------
  niveles: [
    { nivel: 1, nombre: "Recluta", puntos: 0, unidad: null, marca: null },
    { nivel: 2, nombre: "Escudero", puntos: 500, unidad: "monje", marca: "casco" },
    { nivel: 3, nombre: "Soldado", puntos: 1500, unidad: "ballestero", marca: "cota" },
    { nivel: 4, nombre: "Caballero", puntos: 3200, unidad: "alabardero", marca: "blason" },
    { nivel: 5, nombre: "Señor", puntos: 5800, unidad: "infanteria_pesada", marca: "capa" },
    { nivel: 6, nombre: "Rey", puntos: 9500, unidad: "caballeria_pesada", marca: "corona" },
    { nivel: 7, nombre: "Emperador", puntos: 14500, unidad: "trabuco", marca: "manto" },
    { nivel: 8, nombre: "La Leyenda", puntos: null, unidad: null, marca: "aureola" }, // solo una persona: el Emperador con más puntos
  ],

  // ---------- puntos de mejora: el peldaño n cuesta 60 + 12·(n−1) más que el anterior ----------
  puntosMejora: { base: 60, paso: 12, maximo: 50 },

  // ---------- el árbol ----------
  // efecto: lo que suma cada peldaño. requiere: { cadena: peldaños }.
  mejoras: {
    vigor: { nombre: "Vigor", familia: "heroe", peldanos: 5, efecto: { vida: 5 }, texto: "+5 de vida del héroe", adorno: "brazalete" },
    filo: { nombre: "Filo", familia: "heroe", peldanos: 4, efecto: { ataque: 1 }, texto: "+1 de ataque del héroe", adorno: "arma" },
    temple: { nombre: "Temple", familia: "heroe", peldanos: 4, efecto: { defensa: 1 }, texto: "+1 de defensa del héroe", adorno: "hombrera" },
    paso_ligero: { nombre: "Paso ligero", familia: "heroe", peldanos: 1, efecto: { movimiento: 1 }, texto: "+1 de movimiento del héroe", requiere: { vigor: 3 }, adorno: "botas" },
    segundo_aliento: { nombre: "Segundo aliento", familia: "heroe", peldanos: 1, efecto: { segundoAliento: 10 }, texto: "El héroe cura 10 al empezar tu turno si no atacó el anterior", requiere: { temple: 2 }, adorno: "cantimplora" },
    coraza: { nombre: "Coraza", familia: "heroe", peldanos: 2, efecto: { defensaDistancia: 2 }, texto: "+2 de defensa del héroe contra tropas a distancia", requiere: { temple: 3 }, adorno: "peto" },
    escudo_hermanos: { nombre: "Escudo de hermanos", familia: "aura", peldanos: 3, efecto: { auraDefensa: 1 }, texto: "Tropas pegadas al héroe: +1 de defensa", adorno: "pluma" },
    grito: { nombre: "Grito de guerra", familia: "aura", peldanos: 3, efecto: { auraAtaque: 1 }, texto: "Tropas pegadas al héroe: +1 de ataque", adorno: "galon" },
    cirujano: { nombre: "Cirujano", familia: "aura", peldanos: 3, efecto: { auraCura: 3 }, texto: "Tropas pegadas al héroe que descansan: curan +3 más", adorno: "bolsa" },
    estandarte: { nombre: "Estandarte", familia: "aura", peldanos: 1, efecto: { auraAlcance: 1 }, texto: "El aura llega a 2 hexágonos", requiere: { escudo_hermanos: 2, grito: 2 }, adorno: "banderin" },
    disciplina: { nombre: "Disciplina", familia: "aura", peldanos: 2, efecto: { auraAtrincherada: 2 }, texto: "Tropas pegadas al héroe y atrincheradas: +2 de defensa más", requiere: { escudo_hermanos: 3 }, adorno: "silbato" },
    inspiracion: { nombre: "Inspiración", familia: "aura", peldanos: 2, efecto: { auraExperiencia: 1 }, texto: "Tropas pegadas al héroe: +1 de experiencia por combate", requiere: { grito: 3 }, adorno: "medallon" },
    tesorero: { nombre: "Tesorero", familia: "reino", peldanos: 4, efecto: { oro: 1 }, texto: "+1 de oro por turno", adorno: "cadena" },
    leva: { nombre: "Leva", familia: "reino", peldanos: 2, efecto: { costeCampesino: -1 }, texto: "El campesino cuesta 1 oro menos", adorno: "cuerno" },
    armero: { nombre: "Armero", familia: "reino", peldanos: 2, efecto: { costeArmados: -1 }, texto: "Espadachín y lancero cuestan 1 oro menos", requiere: { leva: 2 }, adorno: "yunque" },
    cantero: { nombre: "Cantero", familia: "reino", peldanos: 3, efecto: { murallas: 5 }, texto: "Murallas de tus asentamientos: +5 de integridad máxima", adorno: "martillo" },
    forrajeo: { nombre: "Forrajeo", familia: "reino", peldanos: 2, efecto: { curaCasa: 2 }, texto: "Tropas en territorio propio curan +2 más", adorno: "zurron" },
    maestre: { nombre: "Maestre", familia: "reino", peldanos: 1, efecto: { reclutasCapital: 1 }, texto: "La capital puede reclutar dos veces por turno", requiere: { tesorero: 3 }, adorno: "anillo" },
    caminos: { nombre: "Caminos", familia: "reino", peldanos: 1, efecto: { movimientoCasa: 1 }, texto: "Tus tropas mueven +1 si empiezan el turno en territorio propio", requiere: { forrajeo: 2 }, adorno: "baston" },
    gala: { nombre: "Gala", familia: "aspecto", peldanos: 6, efecto: {}, texto: "Un adorno de gala (solo aspecto)", porNivel: true, adorno: "gala" },
  },
};

// Cálculos puros del héroe (sin pantalla, sin guardado).
FWM.heroes = (function () {
  const D = () => FWM.datosBase.heroes;

  // Nivel por puntos acumulados (1..7; Leyenda se asigna aparte).
  function nivelPorPuntos(puntos) {
    let n = 1;
    for (const niv of D().niveles) if (niv.puntos != null && puntos >= niv.puntos) n = niv.nivel;
    return n;
  }
  function datosNivel(nivel) { return D().niveles.find(n => n.nivel === nivel) || D().niveles[0]; }
  function nombreNivel(nivel) { return datosNivel(nivel).nombre; }
  // Puntos acumulados que exige el peldaño n de mejora (n = 1..maximo).
  function umbralPunto(n) {
    const p = D().puntosMejora; let total = 0;
    for (let i = 1; i <= n; i++) total += p.base + p.paso * (i - 1);
    return total;
  }
  function puntosMejoraPorPuntos(puntos) {
    const p = D().puntosMejora; let n = 0;
    while (n < p.maximo && puntos >= umbralPunto(n + 1)) n++;
    return n;
  }
  // Unidades que abre un nivel (todas las de niveles ≤ nivel).
  function unidadesDesbloqueadas(nivel) { return D().niveles.filter(n => n.unidad && n.nivel <= nivel).map(n => n.unidad); }

  // Suma de efectos de las mejoras de un héroe: { vida, ataque, defensa, movimiento, auraDefensa, ... }.
  function efectosDe(heroe) {
    const e = {};
    if (!heroe) return e;
    for (const [id, peld] of Object.entries(heroe.mejoras || {})) {
      const m = D().mejoras[id]; if (!m || !peld) continue;
      for (const [k, v] of Object.entries(m.efecto)) e[k] = (e[k] || 0) + v * Math.min(peld, m.peldanos);
    }
    // objetos equipados (arma, escudo, montura, cabeza)
    const O = FWM.datosBase.objetos || {};
    for (const id of Object.values(heroe.objetos || {})) {
      const o = O[id]; if (!o) continue;
      for (const [k, v] of Object.entries(o.efecto || {})) {
        if (k === "bonos") { e.bonos = Object.assign({}, e.bonos || {}); for (const [et, val] of Object.entries(v)) e.bonos[et] = (e.bonos[et] || 0) + val; }
        else e[k] = (e[k] || 0) + v;
      }
    }
    return e;
  }
  // Aura total (clase + mejoras): { ataque, defensa, cura, ataqueDistancia, alcance, atrincherada, experiencia }.
  function auraDe(heroe) {
    const c = D().clases[heroe && heroe.clase] || D().clases.espadachin; const ef = efectosDe(heroe);
    const base = c.aura || {};
    return {
      ataque: (base.ataque || 0) + (ef.auraAtaque || 0), defensa: (base.defensa || 0) + (ef.auraDefensa || 0),
      cura: (base.cura || 0) + (ef.auraCura || 0), ataqueDistancia: base.ataqueDistancia || 0,
      alcance: 1 + (ef.auraAlcance || 0), atrincherada: ef.auraAtrincherada || 0, experiencia: ef.auraExperiencia || 0,
    };
  }
  // ¿Se puede gastar un punto en esta cadena? Devuelve null o el motivo.
  function puedeMejorar(heroe, id) {
    const m = D().mejoras[id]; if (!m) return "no_existe";
    const tengo = (heroe.mejoras && heroe.mejoras[id]) || 0;
    if (tengo >= m.peldanos) return "tope";
    if (m.porNivel && tengo >= Math.max(0, (heroe.nivel || 1) - 1)) return "nivel"; // gala: uno por nivel a partir de Escudero
    for (const [req, n] of Object.entries(m.requiere || {})) if (((heroe.mejoras && heroe.mejoras[req]) || 0) < n) return "requiere";
    return null;
  }
  function puntosGastados(heroe) { return Object.values((heroe && heroe.mejoras) || {}).reduce((s, n) => s + n, 0); }

  // Héroe de una IA: misma cantidad de puntos que el humano, repartidos al azar respetando el árbol.
  function heroeIA(nivel, puntos, azar, clase) {
    const clases = Object.keys(D().clases);
    const h = { clase: clase || azar.elegir(clases), nivel, mejoras: {} };
    let restantes = puntos, intentos = 0;
    while (restantes > 0 && intentos < 500) {
      intentos++;
      const ids = Object.keys(D().mejoras).filter(id => !D().mejoras[id].porNivel && puedeMejorar(h, id) == null);
      if (!ids.length) break;
      const id = azar.elegir(ids); h.mejoras[id] = (h.mejoras[id] || 0) + 1; restantes--;
    }
    return h;
  }

  // Igualar dos héroes (reto con amigo): nivel y puntos gastados del más bajo, sin objetos ni pócima.
  // Los puntos sobrantes se quitan de las cadenas en orden inverso a como se guardaron.
  function igualar(a, b) {
    const nivel = Math.min(a.nivel || 1, b.nivel || 1); const puntos = Math.min(puntosGastados(a), puntosGastados(b));
    const recortar = (h) => {
      const m = Object.assign({}, h.mejoras || {}); let sobran = puntosGastados({ mejoras: m }) - puntos;
      const ids = Object.keys(m).reverse();
      while (sobran > 0) { let quito = false; for (const id of ids) { if (sobran <= 0) break; if (m[id] > 0) { m[id]--; sobran--; quito = true; } } if (!quito) break; }
      return { clase: h.clase, nivel, mejoras: m, objetos: {}, pocima: false };
    };
    return [recortar(a), recortar(b)];
  }

  return { igualar, nivelPorPuntos, datosNivel, nombreNivel, umbralPunto, puntosMejoraPorPuntos, unidadesDesbloqueadas, efectosDe, auraDe, puedeMejorar, puntosGastados, heroeIA };
})();
