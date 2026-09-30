// Tipos de batalla (21 sep 2026). Cada tipo es UNA ficha de datos: con qué empieza cada equipo, cuál es el objetivo
// y qué guion tiene. El motor no sabe de "modos": sabe de equipos, salidas, objetivos y guion (modo/guion.js).
// Añadir un modo de juego nuevo es añadir una entrada aquí, no escribir código ni una IA nueva.
//
//   conquista  la de siempre: cada uno su pueblo; gana el último equipo en pie (o el que más puntos tenga al límite)
//   campo      campo de batalla: sin pueblos, cada uno con su ejército; gana quien barre al otro
//   asalto     tú entras con un ejército y el otro tiene pueblos: hay que tomarle la capital
//   resistir   tu pueblo contra hordas que entran por los bordes, cada ronda más fuertes
//   heroes     ejércitos pequeños; gana quien mate al héroe rival
//   clave      la de siempre, pero se gana controlando los puntos clave del mapa dos turnos seguidos
window.FWM = window.FWM || {};

FWM.batallas = (function () {
  // Ejércitos de salida. La lista se repite hasta llenar el tamaño pedido.
  const EJERCITOS = {
    campo: ["caballero", "espadachin", "lancero", "arquero", "lancero", "caballero", "arquero", "espadachin", "alabardero", "ballestero"],
    asalto: ["caballero", "espadachin", "lancero", "arquero", "catapulta", "lancero", "espadachin", "arquero", "caballero", "catapulta"],
    heroes: ["lancero", "arquero", "espadachin", "caballero"],
  };
  const TIPOS = {
    conquista: { limite: 15, pueblos: true },
    campo:     { limite: 0, pueblos: false, ejercito: "campo", tamano: 8 },
    asalto:    { limite: 25, pueblos: "defensor", ejercito: "asalto", tamano: 10 },
    resistir:  { limite: 0, pueblos: true, oleadas: true, mapaHecho: "arena" },
    heroes:    { limite: 20, pueblos: false, ejercito: "heroes", tamano: 4, objetivo: { tipo: "heroe" } },
    clave:     { limite: 20, pueblos: true, objetivo: { tipo: "clave", n: 2, turnos: 2 } },
  };

  const def = (tipo) => TIPOS[tipo] || TIPOS.conquista;
  const lista = () => Object.keys(TIPOS);

  function ejercito(tipo, tamano) {
    const base = EJERCITOS[def(tipo).ejercito] || [];
    const n = tamano || def(tipo).tamano || base.length;
    const out = [];
    for (let i = 0; i < n; i++) out.push(base[i % base.length]);
    return out;
  }

  // Antes de crear la partida: pone la salida de cada jugador (pueblo o ejército) según el tipo.
  // jugadores es la lista que se le pasa al motor; se les respeta el equipo que traigan.
  function preparar(tipo, jugadores, op) {
    const d = def(tipo); op = op || {};
    const atacantes = op.atacantes || [0]; // quién entra con ejército en "asalto"
    jugadores.forEach((j, i) => {
      if (j.bando === "hordas") return; // la horda la monta modo/oleadas.js
      if (d.pueblos === true) return;   // todos con pueblo: como siempre
      const conEjercito = d.pueblos === false || atacantes.includes(i);
      if (!conEjercito) return;
      // el tamaño puede ser un número (todos igual) o { yo, rival } para equilibrar el capítulo
      const t = op.tamanoEjercito;
      const tam = t && typeof t === "object" ? (atacantes.includes(i) || i === 0 ? t.yo : t.rival) : t;
      j.salida = { pueblo: false, tropas: ejercito(tipo, tam) };
    });
    return { limiteTurnos: op.limite != null ? op.limite : d.limite, objetivo: d.objetivo || null, guion: [] };
  }

  // Después de crear la partida: lo que necesita saber dónde ha caído cada capital.
  function despues(estado, tipo, op) {
    const d = def(tipo); op = op || {};
    if (tipo === "asalto") {
      const defensor = estado.jugadores.find(j => j.capital && !(op.atacantes || [0]).includes(j.id));
      if (defensor) estado.objetivo = { tipo: "tomar", hex: defensor.capital, equipoSalida: FWM.victoria.equipoDe(defensor) };
    }
    if (d.oleadas && FWM.oleadas) FWM.oleadas.preparar(estado);
    return estado;
  }

  return { TIPOS, lista, def, ejercito, preparar, despues };
})();
