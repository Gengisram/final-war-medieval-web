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
  // objetivo: cómo se gana esta partida (ver motor/victoria.js). Sin objetivo, gana el último equipo en pie.
  // Coloca las tropas con las que empieza un jugador: dentro de su pueblo si lo tiene y cabe, y si no, alrededor
  // del sitio de salida, en anillos (batallas sin pueblos: un ejército entero desplegado).
  function ponerTropasIniciales(estado, datos, jugador, i, inicio, tipos, conPueblo) {
    const usados = new Set();
    const sitioLibre = () => {
      for (let r = conPueblo ? 1 : 0; r <= 4; r++) {
        for (const v of (r === 0 ? [inicio] : H().anillo(inicio, r))) {
          const h = estado.mapa.hexes[v];
          if (!h || h.terreno === "agua" || h.construccion || usados.has(v) || tropaEn(estado, v)) continue;
          if (FWM.acciones && FWM.acciones.costeTerreno && FWM.acciones.costeTerreno(estado, datos, v) == null) continue;
          usados.add(v); return v;
        }
      }
      return null;
    };
    for (const t of tipos) {
      if (!datos.tropas[t]) continue;
      const tropa = crearTropa(estado, datos, t, i, null);
      if (datos.tropas[t].heroe) { jugador.heroeTropa = tropa.id; tropa.vida = FWM.stats.vidaMax(estado, datos, tropa); }
      const a = conPueblo ? estado.asentamientos[inicio] : null;
      if (a && a.guarnicion.length < datos.asentamientos[a.tipo].huecosGuarnicion) { tropa.acuarteladaEn = inicio; a.guarnicion.push(tropa.id); continue; }
      const libre = sitioLibre();
      if (libre) { tropa.hex = libre; estado.mapa.hexes[libre].dueno = i; }
      else delete estado.tropas[tropa.id];
    }
  }

  function crearPartida({ datos, mapa, jugadores, semilla, todasTecnologias, multiplicadorHucha, limiteTurnos, sinCarreteras, objetivo, guion }) {
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
      objetivo: objetivo || null,
      guion: (guion || []).map(p => Object.assign({}, p)),
      ganadorEquipo: null,
    };
    estado.mapa.nombre = mapa.nombre || "";
    for (const [k, h] of Object.entries(mapa.hexes)) {
      // los puntos clave pegados a una capital (a 2 o menos) desaparecen: se quieren pocos y disputados
      let yac = h.yacimiento || null;
      if (yac === "punto_clave" && (mapa.inicios || []).some(ini => H().distancia(ini, k) <= 2)) yac = null;
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
        // 21 sep 2026: equipos. Dos jugadores del mismo equipo son aliados; por defecto cada uno va por su cuenta.
        equipo: j.equipo != null ? j.equipo : i,
        faccion: fac, nivel: Math.max(1, Math.min(10, j.nivel || (j.heroe && j.heroe.nivel) || 1)), poderUsos: 0, poderActivo: null,
        heroe: j.heroe ? { clase: fac ? datos.facciones[fac].clase : j.heroe.clase, nivel: j.heroe.nivel || 1, mejoras: Object.assign({}, j.heroe.mejoras || {}), objetos: Object.assign({}, j.heroe.objetos || {}), pocima: !!j.heroe.pocima } : null, heroeTropa: null,
        hucha: multiplicar(Object.assign(FWM.util.huchaVacia(datos), bando.hucha || datos.huchaInicial), multiplicadorHucha || 1),
        tecnologias: todasTecnologias ? Object.keys(datos.tecnologias) : (bando.tecnologiasIniciales || []).slice(),
        nivelesTec: todasTecnologias ? Object.fromEntries(Object.keys(datos.tecnologias).map(k => [k, 1])) : {},
        investigando: null,
        capital: null,
        eliminado: false,
        // los pueblos se llaman según la tierra de la historia, no según cómo pelea (25 sep 2026: en Malí, el fuerte
        // de Sosso se llamaba "Worms" porque sus soldados son de hierro, como los del Sacro Imperio)
        nombres: FWM.azar.crear(semilla + 31 * (i + 1)).barajar((j.nombresDe && datos.bandos[j.nombresDe] && datos.bandos[j.nombresDe].nombres) || bando.nombres || datos.nombresAsentamientos),
        siguienteNombre: 0,
      };
      estado.jugadores.push(jugador);
      estado.estadisticas[i] = { conquistas: 0, perdidas: 0, matadas: 0, oro: 0, eliminadoEn: null, heroesMatados: 0 };
      const inicio = mapa.inicios[i];
      jugador.inicio = inicio; // por dónde entró: lo usa el objetivo de escapar ("sal por el otro lado")
      // 21 sep 2026: con qué empieza cada uno. salida: { pueblo: false } para batallas sin pueblos y
      // salida: { tropas: ["caballero", ...] } para dar un ejército ya puesto en el mapa.
      const salida = j.salida || {};
      const conPueblo = salida.pueblo !== false;
      // la capital puede llevar el nombre que dice la historia ("Conquista Gloucester"): si no, salía otro (25 sep 2026)
      if (conPueblo) { crearAsentamiento(estado, datos, inicio, bando.asentamientoInicial, i, j.nombreCapital || undefined); jugador.capital = inicio; }
      else { jugador.sinMantenimiento = true; jugador.hucha.oro = salida.oro != null ? salida.oro : 0; }
      // con héroe, el héroe ocupa el sitio del campesino inicial
      const base = salida.tropas ? salida.tropas.slice() : bando.tropasIniciales;
      const iniciales = jugador.heroe && datos.tropas["heroe_" + jugador.heroe.clase]
        ? ["heroe_" + jugador.heroe.clase].concat(salida.tropas ? base : base.slice(1))
        : base;
      ponerTropasIniciales(estado, datos, jugador, i, inicio, iniciales, conPueblo);
    });
    // objetivo "toma el pueblo de ese señor": ahora que ya sabemos dónde ha caído cada capital
    const ob = estado.objetivo;
    if (ob && ob.tipo === "tomar" && ob.hex == null && ob.jugador != null) {
      const j = estado.jugadores[ob.jugador];
      if (j && j.capital) { ob.hex = j.capital; if (ob.equipoSalida == null) ob.equipoSalida = j.equipo != null ? j.equipo : j.id; }
    }
    return estado;
  }

  function multiplicar(h, m) { const r = {}; for (const k of Object.keys(h)) r[k] = h[k] * m; return r; }

  // Nombre para un asentamiento nuevo: de la lista del bando del jugador (si la tiene).
  function siguienteNombre(estado, dueno) {
    const j = dueno != null ? estado.jugadores[dueno] : null;
    const fuente = (j && j.nombres && j.nombres.length) ? j : estado;
    // sin repetir un nombre que ya lleve otro pueblo del mapa (dos reinos pueden sacar nombres de la misma tierra)
    const usados = new Set(Object.values(estado.asentamientos || {}).map(a => a.nombre));
    let nombre = null;
    for (let intento = 0; intento <= fuente.nombres.length && (nombre == null || usados.has(nombre)); intento++) {
      const n = fuente.nombres[fuente.siguienteNombre % fuente.nombres.length];
      const vuelta = Math.floor(fuente.siguienteNombre / fuente.nombres.length);
      fuente.siguienteNombre += 1;
      nombre = vuelta ? n + " " + (vuelta + 1) : n;
    }
    return nombre;
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
  // Resistir a dobles (14 sep 2026): los dos defensores van en el mismo bando. No se atacan, no se pisan la
  // tierra ni se toman los pueblos. Antes el motor los trataba como rivales y el compañero podía atacarte.
  // Aliados: el mismo jugador o dos jugadores del mismo equipo (21 sep 2026; antes solo existían alianzas
  // en el modo Resistir, a lo bruto: "los que no son la horda son amigos").
  function aliados(estado, a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    const ja = estado.jugadores[a], jb = estado.jugadores[b];
    // el que se ha retirado de la pelea (guion) ya no es enemigo de nadie: ni ataca ni le atacan (24 sep 2026)
    if (ja && jb && (ja.retirado || jb.retirado)) return true;
    return !!(ja && jb && ja.equipo != null && ja.equipo === jb.equipo);
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
