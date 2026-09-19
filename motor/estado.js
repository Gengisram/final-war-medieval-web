// Estado de la partida: creación y utilidades de consulta.
// El estado es un objeto plano que se puede guardar como JSON.
window.FWM = window.FWM || {};

FWM.util = (function () {
  function sumar(a, b) {
    const s = Object.assign({}, a);
    for (const k of Object.keys(b || {})) s[k] = (s[k] || 0) + b[k];
    return s;
  }
  function puedePagar(hucha, coste) {
    for (const k of Object.keys(coste || {})) if ((hucha[k] || 0) < coste[k]) return false;
    return true;
  }
  function pagar(hucha, coste) {
    for (const k of Object.keys(coste || {})) hucha[k] = (hucha[k] || 0) - coste[k];
  }
  function ingresar(hucha, cantidad) {
    for (const k of Object.keys(cantidad || {})) hucha[k] = (hucha[k] || 0) + cantidad[k];
  }
  function huchaVacia(datos) {
    const h = {};
    for (const k of Object.keys(datos.recursos)) h[k] = 0;
    return h;
  }
  function textoCoste(coste, datos) {
    return Object.keys(coste || {}).filter(k => coste[k]).map(k => coste[k] + " " + datos.recursos[k].nombre.toLowerCase()).join(", ") || "—";
  }
  function clonar(x) { return (typeof structuredClone === "function") ? structuredClone(x) : JSON.parse(JSON.stringify(x)); }
  return { sumar, puedePagar, pagar, ingresar, huchaVacia, textoCoste, clonar };
})();

FWM.estado = (function () {
  const H = () => FWM.hex;

  // jugadores: [{ nombre, color, humano, bando, faccion, nivel, heroe: { clase, nivel, mejoras } }]
  // faccion: si viene, manda sobre el bando y la clase del héroe. nivel: el de la facción (1..10), abre tropas.
  // heroe: si viene, sustituye al campesino inicial de la capital por la tropa del héroe.
  // todasTecnologias: todos los reinos empiezan con el árbol entero (partidas rápidas).
  // multiplicadorHucha: 1 normal, 2 doble, 3 triple (partidas rápidas).
  // limiteTurnos: 0 = sin límite; si se alcanza, gana quien más puntos tenga.
  // sinCarreteras: el modo no permite construir carreteras (partida Rápida).
  // soloOro: el único recurso es el oro; los yacimientos que no son de oro pasan a ser puntos clave.
  function crearPartida({ datos, mapa, jugadores, semilla, todasTecnologias, multiplicadorHucha, limiteTurnos, sinCarreteras, soloOro }) {
    const estado = {
      version: 4,
      semilla: semilla | 0,
      contadorAzar: 0,
      turno: 1,
      jugadorActivo: 0,
      ganador: null,
      jugadores: [],
      mapa: { ancho: mapa.ancho, alto: mapa.alto, hexes: {} },
      tropas: {},
      asentamientos: {},
      siguienteTropa: 1,
      siguienteNombre: 0,
      nombres: [],
      registro: [],
      modoTec: todasTecnologias ? "todo" : "arbol",
      estadisticas: {},
      linea: [],
      limiteTurnos: limiteTurnos || 0,
      sinCarreteras: !!sinCarreteras,
      soloOro: !!soloOro,
    };
    estado.mapa.nombre = mapa.nombre || "";
    for (const [k, h] of Object.entries(mapa.hexes)) {
      // solo oro: los yacimientos sin oro pegados a una capital (a 2 o menos) desaparecen; los demás pasan a ser puntos clave, pocos y disputados
      let yac = h.yacimiento || null;
      if (yac && soloOro && !(datos.yacimientos[yac].produce || {}).oro) yac = (mapa.inicios || []).some(ini => H().distancia(ini, k) <= 2) ? null : "punto_clave";
      estado.mapa.hexes[k] = { terreno: h.terreno, yacimiento: yac, construccion: null, dueno: null, carretera: !!h.carretera };
    }
    const g = FWM.azar.crear(semilla + 77);
    estado.nombres = g.barajar(datos.nombresAsentamientos);

    jugadores.forEach((j, i) => {
      // facción (13 sep 2026): trae su bando (nombres), la clase del héroe, su unidad y su rasgo
      const fac = j.faccion && datos.facciones && datos.facciones[j.faccion] ? j.faccion : null;
      const idBando = fac && datos.bandos[datos.facciones[fac].bando] ? datos.facciones[fac].bando : datos.bandos[j.bando] ? j.bando : Object.keys(datos.bandos)[0];
      const bando = datos.bandos[idBando];
      const jugador = {
        id: i, nombre: j.nombre, color: j.color, humano: !!j.humano, remoto: !!j.remoto, bando: idBando, apodo: j.apodo || null,
        faccion: fac, nivel: Math.max(1, Math.min(10, j.nivel || (j.heroe && j.heroe.nivel) || 1)), poderUsos: 0, poderActivo: null,
        heroe: j.heroe ? { clase: fac ? datos.facciones[fac].clase : j.heroe.clase, nivel: j.heroe.nivel || 1, mejoras: Object.assign({}, j.heroe.mejoras || {}), objetos: Object.assign({}, j.heroe.objetos || {}), pocima: !!j.heroe.pocima } : null, heroeTropa: null,
        hucha: multiplicar(Object.assign(FWM.util.huchaVacia(datos), bando.hucha || datos.huchaInicial), multiplicadorHucha || 1),
        tecnologias: todasTecnologias ? Object.keys(datos.tecnologias) : (bando.tecnologiasIniciales || []).slice(),
        nivelesTec: todasTecnologias ? Object.fromEntries(Object.keys(datos.tecnologias).map(k => [k, 1])) : {},
        investigando: null,
        capital: null,
        eliminado: false,
        nombres: FWM.azar.crear(semilla + 31 * (i + 1)).barajar(bando.nombres || datos.nombresAsentamientos),
        siguienteNombre: 0,
      };
      estado.jugadores.push(jugador);
      estado.estadisticas[i] = { conquistas: 0, perdidas: 0, matadas: 0, oro: 0, eliminadoEn: null, heroesMatados: 0 };
      const inicio = mapa.inicios[i];
      crearAsentamiento(estado, datos, inicio, bando.asentamientoInicial, i);
      jugador.capital = inicio;
      // con héroe, el héroe ocupa el sitio del campesino inicial
      const iniciales = jugador.heroe && datos.tropas["heroe_" + jugador.heroe.clase] ? ["heroe_" + jugador.heroe.clase].concat(bando.tropasIniciales.slice(1)) : bando.tropasIniciales;
      for (const t of iniciales) {
        const a = estado.asentamientos[inicio];
        const tropa = crearTropa(estado, datos, t, i, null);
        if (datos.tropas[t].heroe) { jugador.heroeTropa = tropa.id; tropa.vida = FWM.stats.vidaMax(estado, datos, tropa); }
        if (a.guarnicion.length < datos.asentamientos[a.tipo].huecosGuarnicion) {
          tropa.acuarteladaEn = inicio; a.guarnicion.push(tropa.id);
        } else {
          const libre = H().vecinos(inicio).find(v => estado.mapa.hexes[v] && estado.mapa.hexes[v].terreno !== "agua" && !tropaEn(estado, v));
          tropa.hex = libre; estado.mapa.hexes[libre].dueno = i;
        }
      }
    });
    return estado;
  }

  function multiplicar(h, m) { const r = {}; for (const k of Object.keys(h)) r[k] = h[k] * m; return r; }

  // Nombre para un asentamiento nuevo: de la lista del bando del jugador (si la tiene).
  function siguienteNombre(estado, dueno) {
    const j = dueno != null ? estado.jugadores[dueno] : null;
    const fuente = (j && j.nombres && j.nombres.length) ? j : estado;
    const n = fuente.nombres[fuente.siguienteNombre % fuente.nombres.length];
    const vuelta = Math.floor(fuente.siguienteNombre / fuente.nombres.length);
    fuente.siguienteNombre += 1;
    return vuelta ? n + " " + (vuelta + 1) : n;
  }

  function crearAsentamiento(estado, datos, hex, tipo, dueno, nombre) {
    const def = datos.asentamientos[tipo];
    const a = {
      tipo, dueno, nombre: nombre || siguienteNombre(estado, dueno),
      integridad: def.integridad,
      atacadaEsteTurno: false,
      guarnicion: [], construcciones: [], poblacion: 0,
      reclutadoEsteTurno: false,
      huchaLocal: null,
    };
    estado.asentamientos[hex] = a;
    estado.mapa.hexes[hex].construccion = "asentamiento";
    estado.mapa.hexes[hex].dueno = dueno;
    return a;
  }

  function crearTropa(estado, datos, tipo, dueno, hex) {
    const def = datos.tropas[tipo];
    const id = "t" + estado.siguienteTropa++;
    const t = {
      id, tipo, dueno, hex, acuarteladaEn: null,
      vida: def.stats.vida,
      movRestante: def.stats.movimiento,
      accionUsada: false,
      creadaEnTurno: estado.turno,
      descansoTurno: estado.turno, // último turno en que no hizo nada (para curar)
      estados: [],
      xp: 0,
    };
    estado.tropas[id] = t;
    return t;
  }

  function tropaEn(estado, hex) {
    for (const t of Object.values(estado.tropas)) if (t.hex === hex) return t;
    return null;
  }
  function tropasDe(estado, jugadorId) {
    return Object.values(estado.tropas).filter(t => t.dueno === jugadorId);
  }
  function asentamientosDe(estado, jugadorId) {
    return Object.entries(estado.asentamientos).filter(([, a]) => a.dueno === jugadorId).map(([k, a]) => ({ hex: k, a }));
  }
  function posicionTropa(estado, tropa) { return tropa.hex || tropa.acuarteladaEn; }
  // Bárbaros a dobles (14 sep 2026): los dos defensores van en el mismo bando. No se atacan, no se pisan la
  // tierra ni se toman los pueblos. Antes el motor los trataba como rivales y el compañero podía atacarte.
  function aliados(estado, a, b) {
    if (a === b) return true;
    if (!estado.barbaros || a == null || b == null) return false;
    const ja = estado.jugadores[a], jb = estado.jugadores[b];
    return !!(ja && jb && !ja.barbaros && !jb.barbaros);
  }
  function enemigos(estado, a, b) { return a != null && b != null && !aliados(estado, a, b); }
  function hexEs(estado, hex) { return estado.mapa.hexes[hex]; }
  function esAgua(estado, hex, datos) {
    const h = estado.mapa.hexes[hex];
    return !h || datos.terrenos[h.terreno].costeMovimiento == null;
  }
  function jugadorActivo(estado) { return estado.jugadores[estado.jugadorActivo]; }

  return { crearPartida, crearAsentamiento, crearTropa, tropaEn, tropasDe, asentamientosDe, posicionTropa, aliados, enemigos, hexEs, esAgua, jugadorActivo, siguienteNombre };
})();
