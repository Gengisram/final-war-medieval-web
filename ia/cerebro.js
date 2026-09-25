// IA por capas (18 sep 2026). Sustituye a la "normal" y a la "difícil" (ia/normal.js). La "fácil" sigue siendo el
// cerebro sencillo de ia/tonta.js: un rival fácil tiene que jugar como un principiante, no como un experto con las
// manos atadas (el cerebro con sus capacidades recortadas seguía defendiendo demasiado bien: banco, 18 sep).
//
// Rodrigo pidió dejar de ir "a palos de ciego" con parches. La estructura es la de los juegos de estrategia por turnos
// de ahora (IA por utilidad, en pisos):
//   1. PERCIBIR    qué hay: mis cosas, las del enemigo y el peligro alrededor de cada asentamiento.
//   2. PLANIFICAR  el "general": misiones con una nota (utilidad) — defender un pueblo con hueco en la guarnición,
//                  echar al que acampa en la muralla, incursión contra un asentamiento vacío (la capital del humano
//                  que se ha ido con su héroe) y el asalto al mejor objetivo — y reparto de tropas de la más importante
//                  a la menos; el asalto se lleva lo que sobra.
//   3. RECLUTAR    según lo que les falta a las misiones.
//   4. COMBATE     golpe conjunto (ia/comun.js): varias tropas a la vez contra un objetivo cuando entre todas compensa.
//   5. EJECUTAR    las misiones nuevas con su código; el ejército de base (asalto, defensa, reserva) con el soldado de
//                  la IA de antes, que en el banco salió mejor que reescribirlo; los campesinos, su economía de siempre.
// Las PERSONALIDADES son pesos sobre las notas (la guardiana valora más defender, la belicosa atacar), no código
// distinto. La DIFICULTAD es capacidad: la normal coordina ataques junto a casa; la difícil coordina también al atacar,
// va a por el humano y lleva un 25 % más de oro.
// Solo usa FWM.motor.aplicar / accionesPosibles / prever; nunca toca el estado a mano.
// Se mide con el banco de pruebas (pruebas/banco/banco.js) contra "jugadores tipo" que juegan como personas, y contra
// la IA de antes (pruebas/banco/referencia). 18 sep 2026: contra ella gana el 52-64 % cara a cara.
window.FWM = window.FWM || {};

FWM.cerebro = (function () {
  const H = () => FWM.hex, E = () => FWM.estado, S = () => FWM.stats, M = () => FWM.motor;
  const MAX_ACCIONES = 400;
  const ORDEN_TEC = ["agricultura", "milicia", "arqueria", "canteria", "fortificacion", "maquinaria", "catapulta", "caballeria"];

  // ---------- personalidades: pesos sobre las notas de las misiones y umbrales ----------
  // radioAmenaza: a qué distancia de un asentamiento un enemigo cuenta como amenaza. fundarBase/pesoFundar: expansión.
  // factorListo: cuánta ventaja pide para asaltar. tope: mantenimiento / ingresos. guarnicionMinima: en todos los pueblos.
  // intrusos: sale a cazar tropas enemigas que se meten en su tierra (da territorio y bajas).
  const PERSONALIDADES = {
    equilibrada:   { nombre: "equilibrada",   defender: 1.0, atacar: 1.0, incursion: 1.0, recursos: 1.0, radioAmenaza: 4, radioYac: 2, factorListo: 1.0, tope: 0.6,  guarnicionMinima: 0, agresividad: 0,   fundarBase: 3, pesoFundar: 1.0, militarPronto: false },
    guardiana:     { nombre: "guardiana",     defender: 1.4, atacar: 0.7, incursion: 0.6, recursos: 1.3, radioAmenaza: 5, radioYac: 3, factorListo: 1.4, tope: 0.55, guarnicionMinima: 1, agresividad: -10, fundarBase: 2, pesoFundar: 0.6, militarPronto: false, intrusos: true },
    expansionista: { nombre: "expansionista", defender: 0.9, atacar: 0.8, incursion: 0.9, recursos: 1.2, radioAmenaza: 3, radioYac: 1, factorListo: 1.1, tope: 0.6,  guarnicionMinima: 0, agresividad: -5,  fundarBase: 5, pesoFundar: 1.6, militarPronto: false },
    belicosa:      { nombre: "belicosa",      defender: 0.9, atacar: 1.4, incursion: 1.4, recursos: 0.8, radioAmenaza: 4, radioYac: 2, factorListo: 1.0, tope: 0.72, guarnicionMinima: 0, agresividad: 15,  fundarBase: 3, pesoFundar: 0.8, militarPronto: true, intrusos: true },
  };
  // la de la difícil (y de los jefes de campaña): fuera del sorteo de las normales. 18 sep 2026: antes gastaba pronto
  // en ejército, fundaba menos y acababa con menos puntos que la normal; ahora lleva la economía de una buena
  // expansionista y su dureza está en la capacidad (golpe también al atacar, incursiones, ir a por el humano) y en
  // el 25 % de oro de más. Banco: contra la máquina gana 57 % (la normal 44 %), contra el jugador tipo 68 % (64 %).
  const DIFICIL = { nombre: "implacable", defender: 1.1, atacar: 1.3, incursion: 1.4, recursos: 1.0, radioAmenaza: 4, radioYac: 2, factorListo: 1.0, tope: 0.6, guarnicionMinima: 1, agresividad: 0, fundarBase: 4, pesoFundar: 1.2, militarPronto: false, intrusos: true };

  // ---------- dificultad: capacidad del cerebro ----------
  //   vision     a cuántas casillas de sus cosas ve tropas enemigas (99: todo)
  //   golpe      coordina ataques de varias tropas; ofensivo: también lejos de casa
  //   incursion  aprovecha asentamientos vacíos del enemigo
  //   despiste   probabilidad de que una tropa (no el héroe) se quede quieta ese turno, como un principiante
  const NIVELES = {
    // fácil (19 sep 2026): el mismo cerebro, pero no coordina ataques, no hace incursiones, solo ve lo que tiene cerca
    // y cobra 1 de oro menos por turno (AYUDAS; con menos oro al empezar no llegaba a hacer ciudad y solo sacaba
  // campesinos). Juega con sentido y se le puede ganar.
    facil:   { nombre: "facil", vision: 4, golpe: false, ofensivo: false, incursion: false, cazaHumano: false, despiste: 0.3, segundaVuelta: false, listoExtra: 1.5 },
    normal:  { nombre: "normal", vision: 99, golpe: true, ofensivo: false, incursion: true, cazaHumano: false, segundaVuelta: true },
    dificil: { nombre: "dificil", vision: 99, golpe: true, ofensivo: true, incursion: true, cazaHumano: true, segundaVuelta: true },
  };

  const EMPUJE = 25, EMPUJE_LISTO = 1.05, EMPUJE_TOPE = 0.8;

  // Perillas que se miden en el banco (AJ="FWM.cerebro.AJUSTES.campesinosBase = 3"). No son gustos: cada una
  // tiene su número medido en NOTAS.md.
  const AJUSTES = {
    campesinosBase: 3,   // cuántos campesinos quiere, más medio por asentamiento (medido: 2 → 59 %, 3 → 63 %, 4 → 63 %)
    yacParaFundar: true, // ¿solo funda donde haya yacimientos cerca?
    aVidaOMuerte: true,     // con 'toma ese pueblo', al final (o con tropas ya pegadas) se lanza aunque no sea fuerte
    tomarSinMinas: true,    // con 'toma ese pueblo' de objetivo, no se para a defender minas
    abrirAnillo: true,      // sin camino al objetivo, ir a por los que lo rodean
    escolta: 1,             // a cuántas casillas tiene que ir un soldado mío para que la catapulta avance con enemigos cerca
    alPaso: true,           // la infantería espera a las catapultas antes de llegar a una muralla
    murallaParaMaquina: 60, // a partir de qué muralla quiere una catapulta
    campesinoHuye: 1,       // a qué distancia de una tropa de combate el campesino se va a casa. Medido: con 2 y 3
                            //   mueren menos campesinos pero la máquina gana bastante menos (64 % y 55 % contra
                            //   el 67 % con 1): el trabajo del campesino vale más que su pellejo.
  };

  function jugar(estado, datos, opciones) {
    opciones = opciones || {};
    const jug = estado.jugadores[estado.jugadorActivo];
    const nivel = NIVELES[opciones.nivel || (opciones.dificil || jug.personalidad === "implacable" ? "dificil" : "normal")] || NIVELES.normal;
    let perso = nivel.nombre === "dificil" ? DIFICIL : (PERSONALIDADES[opciones.personalidad || jug.personalidad || "equilibrada"] || PERSONALIDADES.equilibrada);
    // partidas sin límite de turnos (15 sep 2026): desde el turno 25 va a por todas, si no nunca acaban
    const empuje = !estado.limiteTurnos && !estado.oleadas && estado.turno >= EMPUJE;
    if (empuje) perso = Object.assign({}, perso, { factorListo: Math.min(perso.factorListo, EMPUJE_LISTO), tope: Math.max(perso.tope, EMPUJE_TOPE), militarPronto: true, agresividad: perso.agresividad + 10, atacar: perso.atacar * 1.3 });
    const ctx = { estado, datos, yo: estado.jugadorActivo, acciones: 0, eventos: [], perso, nivel, dificil: nivel.nombre === "dificil", empuje, mision: {}, misiones: [] };
    ctx.obj = leerObjetivo(estado, ctx.yo);
    ctx.azar = FWM.azar.crear((estado.semilla || 1) * 31 + estado.turno * 7 + ctx.yo);
    ctx.hacer = (accion) => {
      if (ctx.acciones >= MAX_ACCIONES) return false;
      const r = M().aplicar(ctx.estado, datos, accion);
      if (!r.ok) return false;
      ctx.estado = r.estado; ctx.acciones++;
      ctx.eventos.push(...r.eventos);
      if (opciones.alAplicar) opciones.alAplicar(ctx.estado, accion, r.eventos);
      return true;
    };
    if (!ctx.estado.jugadores[ctx.yo].eliminado && !ctx.estado.jugadores[ctx.yo].retirado && ctx.estado.ganador == null) {
      percibir(ctx);
      investigar(ctx);
      economia(ctx);
      planificar(ctx);
      reclutar(ctx);
      percibir(ctx); planificar(ctx); // lo recién reclutado también cuenta
      if (opciones.alObjetivo) opciones.alObjetivo(ctx.analisis, ctx.estado);
      usarPoder(ctx);
      if (nivel.golpe && FWM.iaComun && FWM.iaComun.golpeConjunto(ctx)) { percibir(ctx); planificar(ctx); }
      ejecutar(ctx);
      retirarTrasAtacar(ctx);
    }
    ctx.hacer({ tipo: "finTurno" });
    return { estado: ctx.estado, eventos: ctx.eventos };
  }

  // ---------- el objetivo de la partida (21 sep 2026) ----------
  // La IA no "adivina" el modo de juego: lee el objetivo de la partida, igual que el jugador lo lee en la barra, y
  // eso cambia LOS PESOS de sus misiones (y añade dos o tres misiones propias), no su forma de pensar. Un modo de
  // juego nuevo no lleva una IA nueva: lleva una fila más en esta tabla.
  function leerObjetivo(estado, yo) {
    const ob = estado.objetivo; const miEquipo = FWM.victoria.equipoDe(estado.jugadores[yo]);
    const o = { tipo: ob ? ob.tipo : "conquista", mio: false, datos: ob || null, miEquipo };
    if (!ob) return o;
    if (ob.tipo === "aguantar" || ob.tipo === "escapar") o.mio = ob.equipo === miEquipo;   // yo soy el que aguanta / huye
    if (ob.tipo === "tomar") o.mio = ob.equipoSalida != null && ob.equipoSalida !== miEquipo; // yo soy el que tiene que tomarlo
    return o;
  }
  // Cuánto vale cada cosa según el objetivo. 1 = como siempre.
  function pesosObjetivo(ctx) {
    const o = ctx.obj; const p = { defender: 1, atacar: 1, incursion: 1, cazarHeroe: 0, controlar: 0, huir: 0 };
    if (o.tipo === "aguantar") {
      if (o.mio) { p.defender = 2.2; p.atacar = 0.35; p.incursion = 0.3; }
      else { p.atacar = 1.6; p.defender = 0.7; p.incursion = 1.3; }
    } else if (o.tipo === "heroe") { p.cazarHeroe = 1; p.atacar = 0.8; }
    else if (o.tipo === "clave") { p.controlar = 1; p.atacar = 0.7; p.defender = 0.9; }
    else if (o.tipo === "escapar") { if (o.mio) { p.huir = 1; p.atacar = 0.3; p.defender = 0.8; } else { p.cazarHeroe = 1.2; p.atacar = 0.6; } }
    else if (o.tipo === "tomar") { if (o.mio) p.atacar = 1.8; else p.defender = 1.8; }
    return p;
  }

  // =====================================================================================================
  // 1. PERCIBIR
  // =====================================================================================================
  function poderTropa(estado, datos, t) {
    const vmax = S().vidaMax(estado, datos, t);
    return S().statTropa(estado, datos, t, "ataque") * Math.max(0.2, t.vida / vmax) + S().statTropa(estado, datos, t, "defensa") * 0.5 + t.vida * 0.3;
  }

  function percibir(ctx) {
    const { datos, yo } = ctx; const estado = ctx.estado;
    const a = ctx.analisis = {};
    a.mios = E().asentamientosDe(estado, yo);
    a.tropas = E().tropasDe(estado, yo);
    a.enemigosAsent = Object.entries(estado.asentamientos).filter(([, s]) => E().enemigos(estado, s.dueno, yo) && !estado.jugadores[s.dueno].eliminado).map(([hex, s]) => ({ hex, a: s }));
    // visión: la fácil solo ve lo que tiene cerca
    const mis = a.mios.map(m => m.hex).concat(a.tropas.map(t => E().posicionTropa(estado, t)).filter(Boolean));
    const veo = (p) => ctx.nivel.vision >= 99 || mis.some(m => H().distancia(m, p) <= ctx.nivel.vision);
    a.enemigosTropas = Object.values(estado.tropas).filter(t => E().enemigos(estado, t.dueno, yo) && veo(E().posicionTropa(estado, t)));
    a.resumen = FWM.economia.resumen(estado, datos, yo);
    a.ingresoOro = a.resumen.ingresos.oro || 0;
    a.gasto = a.resumen.gasto;
    a.poder = {}; for (const t of a.enemigosTropas.concat(a.tropas)) a.poder[t.id] = poderTropa(estado, datos, t);
    // peligro alrededor de cada asentamiento mío
    a.amenazas = {};
    const radio = ctx.perso.radioAmenaza;
    for (const { hex, a: s } of a.mios) {
      let enemigo = 0; const acosadores = [];
      for (const t of a.enemigosTropas) {
        const p = E().posicionTropa(estado, t); if (!p) continue;
        const d = H().distancia(p, hex);
        if (d <= radio) enemigo += a.poder[t.id] / (1 + d * 0.3);
        if (d <= 1 && t.hex) acosadores.push(t.id);
      }
      let propio = 0;
      for (const id of s.guarnicion) { const g = estado.tropas[id]; if (g) propio += a.poder[id] + S().propAsentamiento(estado, datos, s, "plusDefensa"); }
      a.amenazas[hex] = { enemigo, propio, peligro: enemigo > 0 && enemigo > propio * 0.8, acosadores };
    }
    a.fase = estado.turno < 12 ? "apertura" : estado.turno < 40 ? "medio" : "tarde";
    a.militares = a.tropas.filter(t => !datos.tropas[t.tipo].puedeFundar);
    a.yacMios = []; a.yacAmenazados = []; a.yacEnemigos = []; a.yacLibres = [];
    for (const [k, h] of Object.entries(estado.mapa.hexes)) {
      if (!h.yacimiento) continue;
      if (h.dueno === yo) {
        a.yacMios.push(k);
        let enemigo = 0;
        for (const t of a.enemigosTropas) { const p = E().posicionTropa(estado, t); if (p && H().distancia(p, k) <= ctx.perso.radioYac) enemigo += a.poder[t.id]; }
        if (enemigo > 0) a.yacAmenazados.push({ hex: k, enemigo });
      } else if (h.dueno == null) a.yacLibres.push(k);
      else if (!estado.jugadores[h.dueno].eliminado) a.yacEnemigos.push(k);
    }
    a.yacRobados = a.yacEnemigos.filter(k => a.mios.some(m => H().distancia(m.hex, k) <= 2));
    a.intrusos = a.enemigosTropas.filter(t => {
      const p = E().posicionTropa(estado, t); if (!p) return false;
      return a.mios.some(m => H().distancia(m.hex, p) <= ctx.perso.radioAmenaza) || a.yacMios.some(k => H().distancia(k, p) <= ctx.perso.radioYac);
    }).map(t => ({ tropa: t, hex: E().posicionTropa(estado, t) }));
    // dónde está el ejército de cada enemigo: sirve para saber si ha dejado su casa vacía
    a.ejercitoCerca = (hex, r) => a.enemigosTropas.some(t => { const p = E().posicionTropa(estado, t); return p && !datos.tropas[t.tipo].puedeFundar && estado.tropas[t.id] && t.dueno === (estado.asentamientos[hex] || {}).dueno && H().distancia(p, hex) <= r; });
  }

  // =====================================================================================================
  // 2. PLANIFICAR: misiones con nota y reparto de tropas
  // =====================================================================================================
  // Misión: { tipo, hex, nota, necesita (poder), max (tropas), objetivo?, listo?, reunion? }
  function planificar(ctx) {
    const { datos, yo } = ctx; const A = ctx.analisis; const estado = ctx.estado; const P = ctx.perso;
    const misiones = [];
    const capital = estado.jugadores[yo].capital;
    const W = pesosObjetivo(ctx); const ob = (ctx.obj && ctx.obj.datos) || null;
    // --- defender mis asentamientos
    for (const { hex, a: s } of A.mios) {
      const am = A.amenazas[hex]; if (!am || am.enemigo <= 0) continue;
      const falta = am.enemigo * 1.1 - am.propio;
      // a por todas (sin límite, turno 25+): solo se defiende lo que tiene al enemigo encima
      const encima = a_cerca(ctx, hex, 2);
      const base = (hex === capital ? 150 : 90) + (S().produccionAsentamiento(estado, datos, s).oro || 0) * 5;
      // acampado en la muralla: echarlo es lo primero
      if (am.acosadores.length) misiones.push({ tipo: "expulsar", hex, objetivo: am.acosadores[0], nota: W.defender * P.defender * (base + 80), necesita: A.poder[am.acosadores[0]] * 1.2, max: 5, radio: 7 });
      // defender es meter tropas dentro: solo si queda hueco en la guarnición (como la IA de antes; con más, las
      // tropas se quedaban paradas alrededor y el ejército no salía nunca: banco, 18 sep)
      const huecos = S().propAsentamiento(estado, datos, s, "huecosGuarnicion") - s.guarnicion.length;
      if (falta > 0 && huecos > 0 && am.peligro && (!ctx.empuje || encima)) misiones.push({ tipo: "defensa", hex, nota: W.defender * P.defender * base * Math.min(2, am.enemigo / (am.propio + 20)) * (ob && ob.tipo === "tomar" && ob.hex === hex ? 3 : 1), necesita: falta, max: huecos, radio: 4 });
    }
    // --- asalto: el mejor asentamiento enemigo
    const asalto = elegirAsalto(ctx);
    // si la partida se gana tomando ese sitio, el asalto deja de ser "lo que sobra" y pasa a ser lo primero
    const obTomar = ctx.obj && ctx.obj.tipo === "tomar" && ctx.obj.mio && ctx.obj.datos ? ctx.obj.datos.hex
      : ctx.obj && ctx.obj.tipo === "aguantar" && !ctx.obj.mio && ctx.obj.datos && ctx.obj.datos.capital ? (ctx.obj.datos.hexCapital || null) : null;
    // todo o nada: tomar ese pueblo decide la partida y quedan pocos turnos. Nadie se queda defendiendo casa
    // (25 sep 2026: el ejército "defendía" sus pueblos del acoso mientras se acababa el tiempo y perdía igual)
    ctx.todoONada = !!(AJUSTES.aVidaOMuerte && asalto && obTomar && asalto.hex === obTomar && estado.limiteTurnos && estado.limiteTurnos - estado.turno <= Math.max(6, asalto.dist + 3));
    if (asalto) misiones.push(Object.assign({ tipo: "asalto", prioritario: asalto.hex === obTomar, nota: W.atacar * P.atacar * (60 + asalto.valor * 0.5) + (asalto.hex === obTomar ? 500 : 0), necesita: asalto.listo ? 0 : 1e9, max: 99 }, asalto));
    // --- incursión: asentamiento enemigo sin guarnición y con su ejército lejos (la casa que el humano deja vacía)
    // solo una a la vez, y solo donde compensa: muralla rota o casi, o la capital de un humano (el castigo a irse
    // con el héroe dejando la casa vacía); con murallas enteras se perdía el tiempo asediando (banco, 18 sep)
    if (ctx.nivel.incursion) {
      let mejor = null;
      for (const x of A.enemigosAsent) {
        if (x.a.guarnicion.length > 0) continue;
        if (A.ejercitoCerca(x.hex, 2)) continue;
        const j = estado.jugadores[x.a.dueno]; const esCapital = j && j.capital === x.hex; const humano = !!(j && j.humano);
        if (!(humano && esCapital) && (x.a.integridad || 0) > 20) continue;
        const nota = P.incursion * ((esCapital ? 170 : 80) + (humano ? 40 : 0) - (x.a.integridad || 0) * 0.5);
        if (!mejor || nota > mejor.nota) mejor = { tipo: "incursion", hex: x.hex, nota: nota * W.incursion, necesita: 1, max: esCapital ? 3 : 2, radio: 5 };
      }
      if (mejor) misiones.push(mejor);
    }
    // batalla campal (21 sep 2026): si el enemigo no tiene asentamientos, lo que hay que barrer es su ejército.
    // Sin esto la máquina se quedaba quieta en los modos sin pueblos: no tenía nada que asaltar.
    if (!A.enemigosAsent.length && A.enemigosTropas.length) {
      const mias = A.militares.map(t => E().posicionTropa(estado, t)).filter(Boolean);
      const cand = A.enemigosTropas.map(t => ({ t, p: E().posicionTropa(estado, t) })).filter(x => x.p && estado.tropas[x.t.id])
        .map(x => ({ x, d: mias.length ? Math.min(...mias.map(m => H().distancia(m, x.p))) : 0 }))
        .sort((a, b) => (a.d - b.d) || ((A.poder[a.x.t.id] || 0) - (A.poder[b.x.t.id] || 0)));
      for (const { x, d } of cand.slice(0, 2)) {
        misiones.push({ tipo: "cazarHeroe", hex: x.p, objetivo: x.t.id, nota: 200 * P.atacar - d * 4 + (datos.tropas[x.t.tipo].heroe ? 30 : 0), necesita: (A.poder[x.t.id] || 100) * 1.3, max: 4, radio: 99 });
      }
    }
    // misiones que solo existen con ciertos objetivos: cazar al héroe rival, controlar puntos clave y huir del mapa
    if (W.cazarHeroe) {
      for (const j of estado.jugadores) {
        if (E().aliados(estado, j.id, yo) || j.eliminado || !j.heroeTropa) continue;
        const h = estado.tropas[j.heroeTropa]; const p = h && E().posicionTropa(estado, h); if (!p) continue;
        misiones.push({ tipo: "cazarHeroe", hex: p, objetivo: h.id, nota: 220 * W.cazarHeroe, necesita: (A.poder[h.id] || 100) * 1.4, max: 5, radio: 99 });
      }
    }
    if (W.controlar) {
      const n = (ob && ob.n) || 2;
      const tengo = FWM.victoria.clavePorEquipo(estado, ctx.obj.miEquipo);
      for (const [k, h] of Object.entries(estado.mapa.hexes)) {
        if (h.yacimiento !== "punto_clave") continue;
        const mio = h.dueno != null && E().aliados(estado, h.dueno, yo);
        if (mio && tengo <= n) misiones.push({ tipo: "controlar", hex: k, nota: 120 * W.controlar, necesita: 1, max: 1, radio: 6 });
        if (!mio) misiones.push({ tipo: "controlar", hex: k, nota: (tengo < n ? 190 : 90) * W.controlar, necesita: 1, max: 2, radio: 8 });
      }
    }
    if (W.huir) {
      const j = estado.jugadores[yo];
      const h = j.heroeTropa && estado.tropas[j.heroeTropa];
      if (h) misiones.push({ tipo: "huir", hex: (ob && ob.hex) || salidaDe(ctx, h, ob && ob.lado), objetivo: h.id, nota: 400, necesita: 1, max: 1, radio: 99 });
    }
    if (ctx.empuje) for (const m of misiones) if (m.tipo === "defensa") m.nota *= 0.6;
    // el asalto se lleva lo que sobra: va el último en el reparto (si no, se quedaba con todo y no había quien
    // defendiera ni cazara intrusos; banco, 18 sep)
    misiones.sort((p, q) => ((p.tipo === "asalto" && !p.prioritario) - (q.tipo === "asalto" && !q.prioritario)) || (q.nota - p.nota));

    // --- reparto: cada tropa militar libre va a la misión que mejor le cuadra (nota menos lejanía)
    ctx.mision = {}; const asignado = new Map(); // mision -> poder asignado
    const libres = A.militares.filter(t => {
      const def = datos.tropas[t.tipo];
      if (def.cura && !def.heroe) return false; // el monje sigue al ejército (Vesna cura pero es la heroína: pelea)
      // herido, a curarse a casa… salvo que haya que escapar por el otro lado: volver a casa es ir al revés
      // (23 sep 2026: en el capítulo 9 el héroe se daba la vuelta al primer golpe y no llegaba nunca)
      const escapando = ctx.obj && ctx.obj.tipo === "escapar" && ctx.obj.mio;
      if (def.heroe && A.mios.length && !escapando && t.vida < S().vidaMax(estado, datos, t) * (ctx.dificil ? .35 : .45)) { ctx.mision[t.id] = { tipo: "curar" }; return false; }
      return true;
    });
    // guarniciones: las de un asentamiento que se defiende se quedan; la mínima, también
    for (const t of libres.slice()) {
      if (!t.acuarteladaEn) continue;
      const m = misiones.find(x => (x.tipo === "defensa" || x.tipo === "expulsar") && x.hex === t.acuarteladaEn);
      const s = estado.asentamientos[t.acuarteladaEn];
      const minima = ctx.empuje || ctx.dificil ? (t.acuarteladaEn === capital ? 1 : 0) : P.guarnicionMinima;
      const quedan = s.guarnicion.filter(id => ctx.mision[id] && ctx.mision[id].tipo === "guarnicion").length;
      // se queda la que HACE FALTA para defender, no toda la guarnición: con una amenaza cerca se quedaba el
      // ejército entero dentro del pueblo y nadie salía a atacar nunca (22 sep 2026)
      const necesaria = m && (asignado.get(m) || 0) < m.necesita;
      if (necesaria || quedan < minima || (datos.tropas[t.tipo].disparaSinMover)) {
        ctx.mision[t.id] = { tipo: "guarnicion", hex: t.acuarteladaEn, defensa: m || null };
        if (m) asignado.set(m, (asignado.get(m) || 0) + A.poder[t.id]);
        libres.splice(libres.indexOf(t), 1);
      }
    }
    // huir: la misión es del héroe y de nadie más. Antes se la llevaba la tropa más cercana a la salida (un jinete,
    // por ejemplo) y el héroe se quedaba en casa (23 sep 2026, capítulo 9 de Castilla).
    for (const m of misiones) {
      if (m.tipo !== "huir" || !m.objetivo) continue;
      const h = libres.find(t => t.id === m.objetivo) || (ctx.mision[m.objetivo] && ctx.mision[m.objetivo].tipo === "curar" ? null : A.militares.find(t => t.id === m.objetivo));
      if (!h) continue;
      ctx.mision[h.id] = m; asignado.set(m, m.necesita);
      const i = libres.indexOf(h); if (i >= 0) libres.splice(i, 1);
    }
    for (const m of misiones) {
      if ((asignado.get(m) || 0) >= m.necesita && m.tipo !== "asalto") continue;
      const cand = libres.filter(t => !ctx.mision[t.id]).map(t => ({ t, eta: eta(ctx, t, m.hex) }))
        .filter(x => x.eta <= (m.radio || 99))
        .filter(x => !(m.tipo === "incursion" && datos.tropas[x.t.tipo].disparaSinMover))
        .sort((p, q) => p.eta - q.eta);
      let n = 0;
      for (const { t } of cand) {
        if (n >= m.max) break;
        if (m.tipo !== "asalto" && (asignado.get(m) || 0) >= m.necesita) break;
        // el héroe no se va de incursión lejos: es el que más defiende
        if (m.tipo === "incursion" && datos.tropas[t.tipo].heroe && eta(ctx, t, m.hex) > 2) continue;
        ctx.mision[t.id] = m; asignado.set(m, (asignado.get(m) || 0) + A.poder[t.id]); n++;
      }
    }
    for (const t of libres) if (!ctx.mision[t.id]) ctx.mision[t.id] = { tipo: "reserva" };
    ctx.misiones = misiones; A.objetivoAtaque = asalto || null;
    if (asalto) estado.jugadores[yo].objetivoIA = asalto.hex;
  }

  // La salida del héroe que tiene que escapar, con memoria: se elige una vez por el camino más corto de verdad (las
  // montañas engañan en línea recta) y se mantiene mientras siga valiendo. Antes se recalculaba cada turno, cambiaba,
  // y el héroe iba y venía sin llegar (23 sep 2026, capítulo 9 de Castilla).
  function salidaDe(ctx, h, lado) {
    const e = ctx.estado; const j = e.jugadores[ctx.yo]; j.destinos = j.destinos || {};
    const clave = "salida" + h.id; const antes = j.destinos[clave];
    const inicio = j.inicio; const desde = E().posicionTropa(e, h);
    if (antes && FWM.victoria.enBorde(e, antes, lado, inicio)) return antes;
    const dist = distancias(ctx, desde, desde);
    let mejor = null, md = Infinity;
    for (const k of Object.keys(e.mapa.hexes)) {
      if (e.mapa.hexes[k].terreno === "agua" || !FWM.victoria.enBorde(e, k, lado, inicio)) continue;
      if (dist[k] != null && dist[k] < md) { md = dist[k]; mejor = k; }
    }
    return (j.destinos[clave] = mejor || bordeCercano(ctx, desde, lado));
  }

  // El borde transitable más cercano (para escapar del mapa)
  function bordeCercano(ctx, desde, lado) {
    const e = ctx.estado; let mejor = null, mejorD = 1e9;
    const inicio = (e.jugadores[ctx.yo] || {}).inicio;
    for (const [k, h] of Object.entries(e.mapa.hexes)) {
      if (h.terreno === "agua" || !FWM.victoria.enBorde(e, k, lado, inicio)) continue;
      const d = H().distancia(k, desde); if (d < mejorD) { mejorD = d; mejor = k; }
    }
    return mejor;
  }

  // ¿hay alguna tropa enemiga a `r` o menos de `hex`?
  function a_cerca(ctx, hex, r) {
    return ctx.analisis.enemigosTropas.some(t => { const p = ctx.estado.tropas[t.id] && E().posicionTropa(ctx.estado, ctx.estado.tropas[t.id]); return p && H().distancia(p, hex) <= r; });
  }

  // turnos que tarda una tropa en llegar (aprox.: distancia / movimiento)
  function eta(ctx, t, hex) {
    const p = E().posicionTropa(ctx.estado, t); if (!p || !hex) return 99;
    return H().distancia(p, hex) / Math.max(1, S().statTropa(ctx.estado, ctx.datos, t, "movimiento"));
  }

  function elegirAsalto(ctx) {
    const { datos, yo } = ctx; const A = ctx.analisis; const estado = ctx.estado;
    if (!A.enemigosAsent.length) return null;
    // si la partida se gana tomando un sitio concreto, ese sitio ES el objetivo: no se va a saquear a otro lado
    const ob = ctx.obj; const forzado = ob && ob.tipo === "tomar" && ob.mio && ob.datos ? ob.datos.hex : null;
    let mejor = null, mejorV = -Infinity;
    for (const x of A.enemigosAsent) {
      if (forzado && x.hex !== forzado && A.enemigosAsent.some(y => y.hex === forzado)) continue;
      const guarn = x.a.guarnicion.map(id => estado.tropas[id]).filter(Boolean);
      // defensa: la guarnición y las tropas suyas que pueden acudir (a 3 o menos)
      const acuden = A.enemigosTropas.filter(t => t.dueno === x.a.dueno && t.hex && estado.tropas[t.id] && !ctx.datos.tropas[t.tipo].puedeFundar && H().distancia(t.hex, x.hex) <= 3).reduce((s, t) => s + (A.poder[t.id] || 0) * 0.7, 0);
      const defensa = acuden + guarn.reduce((s, g) => s + poderTropa(estado, datos, g) + (x.a.integridad > 0 ? S().propAsentamiento(estado, datos, x.a, "plusDefensa") : 0), 0);
      const dist = Math.min(...A.mios.map(m => H().distancia(m.hex, x.hex)), 99);
      const oro = S().produccionAsentamiento(estado, datos, x.a).oro || 0;
      const yacCerca = H().anillo(x.hex, 2).filter(k => estado.mapa.hexes[k] && estado.mapa.hexes[k].yacimiento && estado.mapa.hexes[k].dueno === x.a.dueno).length;
      const humano = estado.jugadores[x.a.dueno] && estado.jugadores[x.a.dueno].humano;
      const valor = 20 + oro * 6 + yacCerca * 8 + (x.a.tipo === "castillo" ? -10 : 0) + (guarn.length === 0 ? 80 : 0) + (ctx.nivel.cazaHumano && humano ? 30 : 0);
      const sigue = estado.jugadores[yo].objetivoIA === x.hex ? 35 : 0; // lo empezado se acaba: no se cambia de objetivo cada turno
      const v = valor + sigue - defensa * 0.6 - dist * 6 - (x.a.integridad > 60 && !A.tropas.some(t => t.tipo === "catapulta") ? 40 : 0);
      if (v > mejorV) { mejorV = v; mejor = { hex: x.hex, a: x.a, defensa, guarn: guarn.length, dist, valor: v }; }
    }
    if (!mejor) return null;
    // la fuerza que no está ocupada defendiendo
    const cercano = A.mios.slice().sort((p, q) => H().distancia(p.hex, mejor.hex) - H().distancia(q.hex, mejor.hex))[0];
    mejor.reunion = cercano ? cercano.hex : (A.tropas.length ? E().posicionTropa(estado, A.tropas[0]) : mejor.hex);
    // solo cuenta la fuerza reunida: a 2 turnos o menos del objetivo o de la reunión (antes se lanzaba con tropas
    // desperdigadas y las perdía una a una)
    const libre = (t) => !(ctx.mision[t.id] && (ctx.mision[t.id].tipo === "guarnicion" || ctx.mision[t.id].tipo === "defensa" || ctx.mision[t.id].tipo === "expulsar"));
    const fuerza = A.militares.filter(t => libre(t) && Math.min(eta(ctx, t, mejor.hex), eta(ctx, t, mejor.reunion)) <= 2).reduce((s, t) => s + (A.poder[t.id] || 0), 0);
    mejor.fuerza = fuerza;
    // el listón para lanzarse: la fácil pide mucha más ventaja antes de atacar (listoExtra), que para eso es la fácil
    mejor.listo = mejor.guarn === 0 && mejor.defensa < 1 || fuerza >= mejor.defensa * ctx.perso.factorListo * (ctx.nivel.listoExtra || 1);
    // brecha abierta y como mucho un defensor dentro: ahora o nunca (24 sep 2026: con la muralla a cero y ocho
    // tropas pegadas, no entraba porque contaba como defensa a las tropas del vecino que rondaban cerca)
    const pegadas = A.militares.filter(t => estado.tropas[t.id] && E().posicionTropa(estado, estado.tropas[t.id]) && H().distancia(E().posicionTropa(estado, estado.tropas[t.id]), mejor.hex) <= 2).length;
    if (!mejor.listo && mejor.a.integridad <= 0 && mejor.guarn <= 1 && pegadas >= 1) mejor.listo = true;
    if (!cercano) mejor.listo = true;
    // "toma ese pueblo o pierdes": con tropas ya pegadas a él, o con pocos turnos por delante, a por todas
    // (25 sep 2026: la ayuda llegaba junto a la muralla y el resto esperaba en casa hasta que se acababa el tiempo)
    if (AJUSTES.aVidaOMuerte && forzado === mejor.hex && (pegadas >= 3 || (estado.limiteTurnos && estado.limiteTurnos - estado.turno <= Math.max(6, mejor.dist + 3)))) mejor.listo = true;
    return mejor;
  }

  // =====================================================================================================
  // 3. RECLUTAR según lo que falta
  // =====================================================================================================
  const SUSTITUYE = { castilla: ["lancero", "caballero"], vikingos: ["espadachin", "lancero", "caballero"], inglaterra: ["arquero", "ballestero"], mali: ["caballero"], saladino: ["caballero", "caballeria_pesada"], mongoles: ["arquero", "caballero"], eslavos: ["lancero"] };
  const PESADAS = { lancero: "infanteria_pesada", alabardero: "infanteria_pesada", espadachin: "infanteria_pesada", caballero: "caballeria_pesada", catapulta: "trabuquete", arquero: "ballestero" };

  function reclutar(ctx) {
    const { datos, yo } = ctx;
    for (const { hex, a } of ctx.analisis.mios) {
      const estado = ctx.estado; const A = ctx.analisis;
      const j = estado.jugadores[yo];
      const tropas = E().tropasDe(estado, yo);
      const campesinos = tropas.filter(t => t.tipo === "campesino").length;
      const nAsent = A.mios.length;
      const res = FWM.economia.resumen(estado, datos, yo);
      const ingreso = res.ingresos.oro || 0, gasto = res.gasto;
      const def = datos.asentamientos[a.tipo];
      const opciones = Object.keys(datos.tropas).filter(t => !datos.tropas[t].noReclutable && (def.recluta.includes("*") || def.recluta.includes(t)) && datos.tropas[t].requiere.every(r => S().tieneTec(j, r)) && FWM.facciones.puedeTener(datos, j, t) == null);
      const cabe = (tipo, tope) => (gasto + datos.tropas[tipo].mantenimiento) <= Math.max(2, ingreso * (tope || 0.6)) && (j.hucha.oro || 0) - (datos.tropas[tipo].coste.oro || 0) >= 5 && FWM.util.puedePagar(j.hucha, datos.tropas[tipo].coste);
      const quieroFundar = nAsent < ctx.perso.fundarBase + Math.floor(estado.turno / 15) && hayDondeFundar(ctx);
      const campesinosLibres = tropas.filter(t => t.tipo === "campesino" && !t.acuarteladaEn).length;
      // lo que falta a las misiones que pasan por aquí
      const faltaDefensa = ctx.misiones.some(m => (m.tipo === "defensa" || m.tipo === "expulsar") && m.hex === hex);
      let deseo = null, urgente = false;
      if (faltaDefensa && a.guarnicion.length < S().propAsentamiento(estado, datos, a, "huecosGuarnicion")) {
        deseo = [contraEnemigo(ctx), "lancero", "arquero", "caballero", "campesino"]; urgente = true;
      } else if (ctx.perso.militarPronto && A.militares.length < 2 && campesinos >= 1) {
        deseo = ["lancero", "arquero", "caballero", "campesino"];
      } else if (quieroFundar && campesinos < AJUSTES.campesinosBase + Math.floor(nAsent / 2)) {
        // se cuentan TODOS los campesinos, no solo los que están fuera: los de dentro del pueblo salen en cuanto
        // pasa el peligro. Contando solo los de fuera, la máquina compraba un campesino cada turno y no hacía
        // ejército ni fundaba nada (22 sep 2026).
        deseo = ["campesino"];
      } else if (quieroFundar && campesinos > 0 && (j.hucha.oro || 0) < 45) {
        continue; // guardar para fundar
      } else if (A.objetivoAtaque) {
        const o = A.objetivoAtaque;
        // con murallas en pie hace falta máquina: una tropa normal hace 10 de asedio y la muralla repara 10
        const tengoCat = tropas.some(t => (datos.tropas[t.tipo].stats.asedio || 0) >= 20);
        if (o.a.integridad >= AJUSTES.murallaParaMaquina && !tengoCat) deseo = ["catapulta", "lancero", "arquero"];
        else if (A.militares.filter(t => t.tipo === "arquero").length < A.militares.length / (ctx.dificil ? 2 : 3)) deseo = ["arquero", "lancero", "caballero"];
        else deseo = ctx.empuje ? ["caballero", "espadachin", contraEnemigo(ctx), "arquero", "lancero"] : [contraEnemigo(ctx), "lancero", "caballero", "arquero"];
        // con una incursión posible, jinetes: llegan antes
        if (ctx.misiones.some(m => m.tipo === "incursion")) deseo.unshift("caballero");
        deseo.push("campesino");
      } else {
        deseo = ["lancero", "arquero", "campesino"];
      }
      deseo = deseo.reduce((lista, t) => { if (PESADAS[t] && !lista.includes(PESADAS[t])) lista.push(PESADAS[t]); lista.push(t); return lista; }, []);
      const fac = j.faccion && datos.facciones[j.faccion];
      if (fac) {
        const SUST = SUSTITUYE[j.faccion] || []; deseo = deseo.reduce((lista, t) => { if (SUST.includes(t) && !lista.includes(fac.unidad)) lista.push(fac.unidad); lista.push(t); return lista; }, []);
        const propias = A.militares.filter(t => t.tipo === fac.unidad).length;
        if (deseo[0] !== "campesino" && propias * 2 < A.militares.length + 1) deseo = [fac.unidad].concat(deseo.filter(t => t !== fac.unidad));
      }
      const topeBase = urgente ? 0.9 : (j.hucha.oro || 0) > 150 ? 0.85 : (j.hucha.oro || 0) > 80 ? ctx.perso.tope + 0.12 : ctx.perso.tope;
      for (const tipo of deseo) {
        const necesaria = tipo === "catapulta" && deseo[0] === "catapulta";
        if (!opciones.includes(tipo) || !cabe(tipo, necesaria ? 0.9 : topeBase)) continue;
        if (tipo === "campesino" && campesinos >= AJUSTES.campesinosBase + Math.floor(nAsent / 2)) continue;
        if (ctx.hacer({ tipo: "reclutar", asentamiento: hex, que: tipo })) break;
      }
    }
  }

  function contraEnemigo(ctx) {
    const cuenta = {};
    for (const t of ctx.analisis.enemigosTropas) cuenta[t.tipo] = (cuenta[t.tipo] || 0) + 1;
    const mas = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0];
    if (!mas) return "lancero";
    const def = ctx.datos.tropas[mas[0]];
    if (def && (def.etiquetas || []).includes("montada")) return "lancero";
    return { lancero: "espadachin", espadachin: "caballero", caballero: "lancero", arquero: "caballero", campesino: "espadachin", catapulta: "caballero" }[mas[0]] || "lancero";
  }

  // =====================================================================================================
  // economía e investigación (de la IA normal, sin cambios)
  // =====================================================================================================
  function investigar(ctx) {
    const j = ctx.estado.jugadores[ctx.yo];
    if (j.investigando) return;
    let orden = ORDEN_TEC.slice();
    const murallasFuertes = ctx.analisis.enemigosAsent.some(x => x.a.tipo !== "pueblo");
    if (murallasFuertes && !S().tieneTec(j, "catapulta")) orden = ["agricultura", "milicia", "maquinaria", "catapulta"].concat(orden);
    for (const id of orden) {
      if (!S().tecDisponible(ctx.estado, ctx.datos, j, id)) continue;
      if (ctx.hacer({ tipo: "investigar", tec: id })) return;
    }
  }

  function economia(ctx) {
    const { datos, yo } = ctx; const A = ctx.analisis;
    const j = () => ctx.estado.jugadores[yo];
    const orden = A.mios.slice().sort((x, y) => (y.hex === j().capital) - (x.hex === j().capital));
    for (const { hex, a } of orden) {
      if (a.tipo !== "pueblo") continue;
      const coste = datos.asentamientos.ciudad.coste;
      if ((j().hucha.oro || 0) < (coste.oro || 0) + 15) continue;
      ctx.hacer({ tipo: "mejorarAsentamiento", asentamiento: hex });
    }
    const castillos = A.mios.filter(x => x.a.tipo === "castillo").length;
    const quiero = A.fase === "apertura" ? 0 : ctx.empuje ? 0 : Math.max(1, Math.floor((A.mios.length - castillos) / 2));
    const costeCastillo = S().costeAsentamiento(ctx.estado, datos, yo, "castillo");
    if (castillos < quiero && FWM.util.puedePagar(j().hucha, Object.assign({}, costeCastillo, { oro: (costeCastillo.oro || 0) + 20 }))) {
      const candidato = A.mios.filter(x => x.a.tipo !== "castillo").sort((x, y) => (A.amenazas[y.hex].enemigo - A.amenazas[x.hex].enemigo) || (distEnemigo(ctx, x.hex) - distEnemigo(ctx, y.hex)))[0];
      if (candidato) {
        const campesinos = E().tropasDe(ctx.estado, yo).filter(t => datos.tropas[t.tipo].puedeFundar && t.hex && H().distancia(t.hex, candidato.hex) <= 2);
        for (const c of campesinos) if (ctx.hacer({ tipo: "construir", hex: c.hex, que: "castillo" })) break;
      }
    }
  }

  function distEnemigo(ctx, hex) {
    let d = 99;
    for (const x of ctx.analisis.enemigosAsent) d = Math.min(d, H().distancia(hex, x.hex));
    return d;
  }

  function usarPoder(ctx) {
    const { datos, yo } = ctx; const estado = ctx.estado; const j = estado.jugadores[yo];
    if (!j.faccion || FWM.facciones.usosPoder(j) <= 0 || j.poderActivo) return;
    const id = datos.facciones[j.faccion].poder.id; const A = ctx.analisis;
    const militares = A.militares.map(t => ({ t, p: E().posicionTropa(estado, t) })).filter(x => x.p);
    const enemigos = A.enemigosTropas.map(t => E().posicionTropa(estado, t)).filter(Boolean);
    const cerca = (r) => militares.filter(x => enemigos.some(e => H().distancia(e, x.p) <= r)).length;
    let usar = false;
    if (id === "navas" || id === "furia_norte") usar = cerca(1) >= 2 || (A.objetivoAtaque && A.objetivoAtaque.listo && cerca(2) >= 2);
    else if (id === "lluvia") usar = militares.filter(x => (datos.tropas[x.t.tipo].stats.alcance || 0) > 0 && enemigos.some(e => H().distancia(e, x.p) <= 3)).length >= 1;
    else if (id === "hattin") usar = Object.values(estado.tropas).filter(x => E().enemigos(estado, x.dueno, yo) && x.hex && militares.some(m => H().distancia(m.p, x.hex) === 1)).length >= 2;
    else if (id === "yam") usar = !!(A.objetivoAtaque && A.objetivoAtaque.listo && militares.length >= 2) || ctx.misiones.some(m => m.tipo === "incursion");
    else if (id === "invierno") usar = cerca(3) >= 2 || !!(A.objetivoAtaque && A.objetivoAtaque.listo);
    else if (id === "griots") usar = E().tropasDe(estado, yo).reduce((s, t) => s + Math.min(15, S().vidaMax(estado, datos, t) - t.vida), 0) >= 45;
    if (!usar && estado.limiteTurnos && estado.turno >= estado.limiteTurnos - 1) usar = cerca(2) >= 1 || id === "yam";
    if (usar) ctx.hacer({ tipo: "poder" });
  }

  function retirarTrasAtacar(ctx) {
    const { datos, yo } = ctx;
    for (const t0 of E().tropasDe(ctx.estado, yo)) {
      const estado = ctx.estado; const t = estado.tropas[t0.id];
      if (!t || !t.trasAtaque || t.movRestante <= 0) continue;
      const pos = E().posicionTropa(estado, t); const aqui = distMinEnemigo(ctx, pos);
      if (aqui >= 3) continue;
      const p = M().accionesPosibles(estado, datos, t.id);
      let mejor = null, mejorD = aqui;
      const casa = estado.jugadores[yo].capital;
      for (const h of Object.keys(p.mover)) {
        if (estado.asentamientos[h]) continue;
        const d = distMinEnemigo(ctx, h);
        if (d > mejorD || (d === mejorD && mejor && casa && H().distancia(h, casa) < H().distancia(mejor, casa))) { mejorD = d; mejor = h; }
      }
      if (mejor && mejorD > aqui) ctx.hacer({ tipo: "mover", tropa: t.id, a: mejor });
    }
  }

  // =====================================================================================================
  // 5. EJECUTAR
  // =====================================================================================================
  // A dónde va esta tropa: el sitio de su misión o el objetivo de ataque. Sirve para mover primero a los de delante.
  function destinoDe(ctx, t) {
    const m = ctx.mision[t.id];
    if (m && m.hex) return m.hex;
    return ctx.analisis.objetivoAtaque ? ctx.analisis.objetivoAtaque.hex : null;
  }

  function ejecutar(ctx) {
    const { datos } = ctx; const A = ctx.analisis;
    // a distancia primero (disparan sin contraataque), luego caballería, infantería, campesinos y catapultas
    const prioridad = (t) => datos.tropas[t.tipo].disparaSinMover ? 4 : datos.tropas[t.tipo].puedeFundar ? 3 : datos.tropas[t.tipo].stats.alcance > 0 ? 0 : datos.tropas[t.tipo].stats.movimiento > 1 ? 1 : 2;
    // …y dentro de cada clase, el que está más cerca de su destino primero: en un puente o un paso, si mueve antes
    // el de atrás no cabe nadie y la columna entera se queda parada (21 sep 2026, medido en el banco).
    const dDestino = (t) => { const d = destinoDe(ctx, t); const p = E().posicionTropa(ctx.estado, t); return d && p ? H().distancia(p, d) : 99; };
    const orden = new Map(A.tropas.map(t => [t.id, dDestino(t)]));
    const ids = A.tropas.slice().sort((x, y) => (prioridad(x) - prioridad(y)) || (orden.get(x.id) - orden.get(y.id))).map(t => t.id);
    const actuar = (id) => {
      const t = ctx.estado.tropas[id];
      if (!t || t.accionUsada) return;
      // el despiste de la fácil vale también para los campesinos: un principiante se lía con todo, no solo con
      // los soldados (22 sep 2026: con la economía arreglada, la fácil expandía igual que la normal)
      if (ctx.nivel.despiste && !datos.tropas[t.tipo].heroe && ctx.azar.siguiente() < ctx.nivel.despiste) return;
      if (datos.tropas[t.tipo].puedeFundar) actuarCampesino(ctx, id);
      else actuarMilitar(ctx, id);
    };
    for (const id of ids) actuar(id);
    // Herramienta de diagnóstico (FWM.DEPURA = true en el banco): cuenta las tropas que acaban el turno sin hacer
    // nada, por misión y sitio. Es lo que destapó que media IA se pasaba la partida quieta (22 sep 2026).
    if (FWM.DEPURA) { FWM.PARADAS = FWM.PARADAS || {}; for (const id of ids) { const t = ctx.estado.tropas[id]; if (t && !t.accionUsada && t.movRestante > 0) { const k = (ctx.mision[id] ? ctx.mision[id].tipo : "-") + "/" + (t.acuarteladaEn ? "dentro" : "fuera") + "/" + (datos.tropas[t.tipo].puedeFundar ? "campesino" : "militar"); FWM.PARADAS[k] = (FWM.PARADAS[k] || 0) + 1;
 } } }
    // segunda vuelta para los que se quedaron sin hacer nada: los de delante ya han movido y ahora hay hueco.
    // La fácil no la hace: un principiante deja tropas paradas sin darse cuenta.
    if (ctx.nivel.segundaVuelta !== false) for (const id of ids) { const t = ctx.estado.tropas[id]; if (t && !t.accionUsada && t.movRestante > 0) actuar(id); }
  }

  // Las misiones nuevas tienen su código; el resto del ejército (asalto, defensa, reserva) juega como el soldado de
  // la IA de antes, que el banco demostró mejor que un código nuevo para lo mismo (18 sep 2026).
  function actuarMilitar(ctx, id) {
    const { datos, yo } = ctx; const A = ctx.analisis;
    let estado = ctx.estado; let t = estado.tropas[id];
    const def = datos.tropas[t.tipo];
    const esArquero = def.stats.alcance > 0 && !def.disparaSinMover;
    const pos0 = E().posicionTropa(estado, t);
    const m = ctx.mision[id] || { tipo: "reserva" };
    if (def.cura && !def.heroe) { // el monje sigue al ejército, nunca ataca (Vesna, que también cura, pelea)
      const aliados = E().tropasDe(estado, yo).filter(x => x.id !== id && x.hex && !(datos.tropas[x.tipo].cura && !datos.tropas[x.tipo].heroe) && !datos.tropas[x.tipo].puedeFundar);
      const obj = aliados.map(x => ({ hex: x.hex, d: H().distancia(x.hex, pos0), herido: x.vida < S().vidaMax(estado, datos, x) ? 1 : 0 })).sort((p, q) => (q.herido - p.herido) || (p.d - q.d))[0];
      if (obj && obj.d > 1) moverHacia(ctx, id, obj.hex, { distanciaMin: 1 });
      return;
    }
    if (!["expulsar", "incursion", "curar", "cazarHeroe", "controlar", "huir"].includes(m.tipo)) return actuarClasico(ctx, id);
    const tras = () => { estado = ctx.estado; t = estado.tropas[id]; return !!(t && !t.accionUsada); };
    if (m.tipo === "curar") {
      if (t.acuarteladaEn) return;
      const casa = A.mios.map(x => x.hex).sort((p, q) => H().distancia(p, pos0) - H().distancia(q, pos0))[0];
      if (casa) moverHacia(ctx, id, casa);
      return;
    }
    if (m.tipo === "cazarHeroe") { // el objetivo es el héroe rival (o el ejército enemigo): ir a por él donde esté
      const obj = estado.tropas[m.objetivo]; const dest = obj ? E().posicionTropa(estado, obj) : null;
      // a muerte: en una batalla de ejércitos, pasados unos turnos los últimos supervivientes heridos se esquivaban
      // para siempre y la partida no acababa (21 sep 2026). Si no hay nada que defender, se pelea igual.
      if (!A.mios.length && !A.enemigosAsent.length && (estado.turno >= 12 || A.militares.length <= 3) && ataqueAMuerte(ctx, id)) return;
      if (intentarAtaque(ctx, id, true)) return;
      // en una batalla de ejércitos el arquero no se queda a dos casillas: si no, nadie llega a pegarse nunca
      const campal = !A.mios.length && !A.enemigosAsent.length;
      if (dest && moverHacia(ctx, id, dest, esArquero && !campal ? { distanciaMin: 2 } : {}) && tras()) {
        if (intentarAtaque(ctx, id, true)) return;
        if (campal && ataqueAMuerte(ctx, id)) return;
        rematar(ctx, id, 99);
      }
      return;
    }
    if (m.tipo === "controlar") { // punto clave: pisarlo y quedarse encima
      if (pos0 === m.hex) { const p = M().accionesPosibles(estado, datos, id); if (p.reclamar) { ctx.hacer({ tipo: "reclamar", tropa: id }); return; } if (intentarAtaque(ctx, id, false)) return; rematar(ctx, id, 2); return; }
      if (intentarAtaque(ctx, id, false)) return;
      if (moverHacia(ctx, id, m.hex) && tras()) { const p = M().accionesPosibles(estado, datos, id); if (E().posicionTropa(estado, estado.tropas[id]) === m.hex && p.reclamar) ctx.hacer({ tipo: "reclamar", tropa: id }); else rematar(ctx, id, 2); }
      return;
    }
    if (m.tipo === "huir") { // sacar al héroe por el borde: correr, y pelear solo para abrirse paso
      if (!datos.tropas[t.tipo].heroe) return actuarClasico(ctx, id);
      if (m.hex && moverHacia(ctx, id, m.hex)) return;
      // cortado el paso: se quitaba de en medio y no llegaba nunca; ahora golpea al que estorba
      intentarAtaque(ctx, id, true);
      return;
    }
    if (m.tipo === "expulsar") {
      const obj = estado.tropas[m.objetivo]; const dest = obj ? E().posicionTropa(estado, obj) : m.hex;
      if (intentarAtaque(ctx, id, true)) return;
      if (dest && moverHacia(ctx, id, dest, esArquero ? { distanciaMin: 2 } : {}) && tras()) { if (intentarAtaque(ctx, id, true)) return; rematar(ctx, id, 2); }
      return;
    }
    // incursión: brecha hecha y vacío, entrar; con murallas, asediar; con alguien dentro, atacar si compensa
    const s0 = estado.asentamientos[m.hex];
    if (!s0 || s0.dueno === yo) return;
    const p = M().accionesPosibles(estado, datos, id);
    if (p.mover[m.hex] != null) { ctx.hacer({ tipo: "mover", tropa: id, a: m.hex }); return; }
    if (p.asediar.includes(m.hex) && s0.integridad > 0 && s0.guarnicion.length === 0) { ctx.hacer({ tipo: "asediar", tropa: id, objetivo: m.hex }); return; }
    if (intentarAtaque(ctx, id, true)) return;
    if (moverHacia(ctx, id, m.hex) && tras()) {
      const p2 = M().accionesPosibles(estado, datos, id); const s1 = estado.asentamientos[m.hex];
      if (p2.asediar.includes(m.hex) && s1.integridad > 0 && s1.guarnicion.length === 0) ctx.hacer({ tipo: "asediar", tropa: id, objetivo: m.hex });
      else intentarAtaque(ctx, id, true);
    }
  }

  // El soldado de la IA de antes (ia/normal.js, probado en miles de partidas): defender lo que está en peligro,
  // cazar intrusos, recuperar yacimientos, ataque de oportunidad, robar minas y marchar al objetivo. Lo usan las
  // tropas del ejército "de base" (asalto y reserva); las misiones nuevas tienen su propio código.
  function actuarClasico(ctx, id) {
    const { datos, yo } = ctx; const A = ctx.analisis;
    let estado = ctx.estado; let t = estado.tropas[id];
    const def = datos.tropas[t.tipo];
    const esArquero = def.stats.alcance > 0 && !def.disparaSinMover;
    const esCat = !!def.disparaSinMover;
    const pos0 = E().posicionTropa(estado, t);

    // 0. héroe herido (menos del 45 %): vuelve a casa y no se arriesga. Monje: sigue al ejército, nunca ataca.
    // Sin asentamientos (batallas de ejércitos) no hay adónde volver: pelea igual, si no la partida se atasca.
    if (def.heroe && A.mios.length) {
      const max = S().vidaMax(estado, datos, t);
      if (t.vida < max * (ctx.dificil ? .35 : .45)) {
        if (t.acuarteladaEn) return;
        const casa = A.mios.map(m => m.hex).sort((p, q) => H().distancia(p, pos0) - H().distancia(q, pos0))[0];
        if (casa) moverHacia(ctx, id, casa);
        return;
      }
    }
    if (def.cura && !def.heroe) {
      const aliados = E().tropasDe(estado, yo).filter(x => x.id !== id && x.hex && !(datos.tropas[x.tipo].cura && !datos.tropas[x.tipo].heroe) && !datos.tropas[x.tipo].puedeFundar);
      const obj = aliados.map(x => ({ hex: x.hex, d: H().distancia(x.hex, pos0), herido: x.vida < S().vidaMax(estado, datos, x) ? 1 : 0 })).sort((p, q) => (q.herido - p.herido) || (p.d - q.d))[0];
      if (obj && obj.d > 1) moverHacia(ctx, id, obj.hex, { distanciaMin: 1 });
      return;
    }

    // 1. acuartelada: defender desde dentro si es a distancia; la última se queda.
    // Si tiene misión de atacar, NO se queda: el reparto de misiones ya decidió que hace falta fuera
    // (22 sep 2026: media docena de tropas con misión de asalto se pasaban la partida dentro del pueblo).
    const mi = ctx.mision[id];
    const misionFuera = mi && (mi.tipo === "asalto" || mi.tipo === "incursion" || mi.tipo === "cazarHeroe" || mi.tipo === "controlar" || mi.tipo === "huir" || mi.tipo === "expulsar");
    if (t.acuarteladaEn && !misionFuera) {
      const a = estado.asentamientos[t.acuarteladaEn];
      if (intentarAtaque(ctx, id, false)) return;
      if (mejorarSiSobra(ctx, id)) return;
      const amenaza = A.amenazas[t.acuarteladaEn];
      // se queda solo si hay amenaza cerca, o si la personalidad exige guarnición mínima (las catapultas no cuentan)
      // Se queda si hay peligro de verdad. Antes bastaba con que hubiera UN enemigo en el radio de amenaza (4-5
      // casillas) para que el último de la guarnición no saliera nunca: como toda tropa nace acuartelada, el
      // ejército entero se quedaba en casa y la máquina no atacaba jamás (22 sep 2026, visto en la radiografía).
      const cercaDeCasa = distMinEnemigo(ctx, t.acuarteladaEn) <= (ctx.empuje ? 2 : 3);
      if (!esCat && amenaza && (amenaza.peligro || (amenaza.enemigo > 0 && a.guarnicion.length <= 1 && cercaDeCasa))) return;
      const minima = ctx.empuje ? (t.acuarteladaEn === estado.jugadores[yo].capital ? 1 : 0) : ctx.dificil ? (t.acuarteladaEn === estado.jugadores[yo].capital ? 1 : 0) : ctx.perso.guarnicionMinima;
      if (!esCat && a.guarnicion.length <= minima) return;
    }

    // 1b. Brecha abierta en el pueblo que decide la partida: a por él, sin distraerse persiguiendo campesinos
    // (24 sep 2026: con la muralla a cero y un campesino dentro, dos espadachines a dos casillas se iban de lado).
    const miA = ctx.mision[id];
    if (miA && miA.tipo === "asalto" && miA.prioritario && !esCat) {
      const aObj = estado.asentamientos[miA.hex];
      if (aObj && aObj.dueno !== yo && aObj.integridad <= 0) {
        const p0 = M().accionesPosibles(estado, datos, id);
        if (p0.mover[miA.hex] != null) { ctx.hacer({ tipo: "mover", tropa: id, a: miA.hex }); return; } // vacío: se entra
        if (p0.atacar.includes(miA.hex)) { ctx.hacer({ tipo: "atacar", tropa: id, objetivo: miA.hex }); return; }
        if (moverHacia(ctx, id, miA.hex)) {
          estado = ctx.estado; t = estado.tropas[id]; if (!t || t.accionUsada) return;
          const p1 = M().accionesPosibles(estado, datos, id);
          if (p1.atacar.includes(miA.hex)) ctx.hacer({ tipo: "atacar", tropa: id, objetivo: miA.hex });
          return;
        }
      }
    }

    // 2. defensa: si un asentamiento mío está en peligro y estoy cerca, ir a él
    const peligrosos = A.mios.filter(m => A.amenazas[m.hex] && A.amenazas[m.hex].peligro && m.a.guarnicion.length < S().propAsentamiento(estado, datos, m.a, "huecosGuarnicion"));
    const pos = E().posicionTropa(estado, t);
    // 2-. acoso: una tropa enemiga pegada a la muralla de un asentamiento mío. Se vuelve desde lejos (hasta 7) y se va
    // a por ella, no a meterse dentro (16 sep 2026: el héroe rival rodeaba la capital y el mío seguía de paseo)
    if (!esCat && !ctx.todoONada && !t.acuarteladaEn && !(def.heroe && t.vida < S().vidaMax(estado, datos, t) * 0.6)) {
      const acosos = A.enemigosTropas.map(e => ({ e, p: E().posicionTropa(estado, e) })).filter(x => x.p && estado.tropas[x.e.id] && A.mios.some(m => H().distancia(m.hex, x.p) <= 1));
      const acoso = acosos.map(x => ({ hex: x.p, d: H().distancia(x.p, pos) })).filter(x => x.d <= 7).sort((p, q) => p.d - q.d)[0];
      if (acoso) {
        if (intentarAtaque(ctx, id, true)) return;
        if (moverHacia(ctx, id, acoso.hex, esArquero ? { distanciaMin: 2 } : {})) { estado = ctx.estado; t = estado.tropas[id]; if (!t || t.accionUsada) return; intentarAtaque(ctx, id, true); return; }
      }
    }
    const cerca = peligrosos.filter(m => H().distancia(m.hex, pos) <= (ctx.empuje ? 2 : 4)).sort((p, q) => H().distancia(p.hex, pos) - H().distancia(q.hex, pos))[0];
    if (cerca && !esCat && !ctx.todoONada && t.acuarteladaEn !== cerca.hex) {
      if (intentarAtaque(ctx, id, false)) return;
      if (moverHacia(ctx, id, cerca.hex)) { estado = ctx.estado; t = estado.tropas[id]; if (!t || t.accionUsada) return; intentarAtaque(ctx, id, false); return; }
    }

    // 2a. cazar intrusos (guardiana y belicosa): tropa enemiga cerca de mi casa
    if (!esCat && !ctx.todoONada && ctx.perso.intrusos && A.intrusos.length) {
      const cerca = A.intrusos.map(x => ({ hex: x.hex, d: H().distancia(x.hex, pos) })).filter(x => x.d <= 5).sort((p, q) => p.d - q.d)[0];
      if (cerca) {
        if (intentarAtaque(ctx, id, true)) return;
        if (moverHacia(ctx, id, cerca.hex, esArquero ? { distanciaMin: 2 } : {})) {
          estado = ctx.estado; t = estado.tropas[id]; if (!t || t.accionUsada) return;
          if (intentarAtaque(ctx, id, true)) return;
          const p = M().accionesPosibles(estado, datos, id);
          if (p.atrincherar) ctx.hacer({ tipo: "atrincherar", tropa: id });
          return;
        }
      }
    }
    // 2b. defender recursos: yacimiento mío con enemigo encima o al lado, o robado pegado a casa
    const yacDefender = A.yacAmenazados.map(x => x.hex).concat(A.yacRobados);
    // si la partida se gana tomando un pueblo, las minas no frenan el asalto: el ejército entero se quedaba
    // "cuidando minas" a cuatro casillas de la capital enemiga (24 sep 2026, capítulo 3)
    const tomarYa = ctx.obj && ctx.obj.tipo === "tomar" && ctx.obj.mio && A.objetivoAtaque && A.objetivoAtaque.listo && AJUSTES.tomarSinMinas;
    if (!esCat && yacDefender.length && !ctx.empuje && !tomarYa && !ctx.todoONada) {
      const y = yacDefender.map(h => ({ hex: h, d: H().distancia(h, pos) })).filter(x => x.d <= 4).sort((p, q) => p.d - q.d)[0];
      if (y) {
        if (intentarAtaque(ctx, id, true)) return;
        if (moverHacia(ctx, id, y.hex, esArquero ? { distanciaMin: 2 } : {})) {
          estado = ctx.estado; t = estado.tropas[id]; if (!t || t.accionUsada) return;
          if (intentarAtaque(ctx, id, true)) return;
          const p = M().accionesPosibles(estado, datos, id);
          if (p.reclamar) { ctx.hacer({ tipo: "reclamar", tropa: id }); return; }
          if (p.atrincherar) ctx.hacer({ tipo: "atrincherar", tropa: id });
          return;
        }
      }
    }

    // 3. ataque de oportunidad
    if (intentarAtaque(ctx, id, !!(A.objetivoAtaque && A.objetivoAtaque.listo))) return;

    // 3b. incursión: robar un yacimiento enemigo cercano mientras el grupo no está listo
    const o = A.objetivoAtaque;
    const yacIncursion = ctx.dificil ? A.yacEnemigos.concat(A.yacLibres) : A.yacEnemigos; // difícil: pisa también las minas y puntos clave libres (10 puntos cada uno)
    if (!esCat && !esArquero && (!o || !o.listo) && yacIncursion.length) {
      const cand = yacIncursion.map(k => ({ hex: k, d: H().distancia(k, pos) })).filter(x => x.d <= 5 && !E().tropaEn(estado, x.hex)).sort((p, q) => p.d - q.d)[0];
      if (cand) {
        if (pos === cand.hex) { const p = M().accionesPosibles(estado, datos, id); if (p.reclamar) { ctx.hacer({ tipo: "reclamar", tropa: id }); return; } }
        if (moverHacia(ctx, id, cand.hex)) {
          estado = ctx.estado; t = estado.tropas[id]; if (!t || t.accionUsada) return;
          const p = M().accionesPosibles(estado, datos, id);
          if (E().posicionTropa(estado, t) === cand.hex && p.reclamar) { ctx.hacer({ tipo: "reclamar", tropa: id }); return; }
          if (intentarAtaque(ctx, id, false)) return;
          if (p.atrincherar && distMinEnemigo(ctx, E().posicionTropa(estado, t)) <= 2) ctx.hacer({ tipo: "atrincherar", tropa: id });
          return;
        }
      }
    }

    // 4. objetivo de ataque
    if (o) {
      const destino = o.listo ? o.hex : o.reunion;
      // la máquina se acerca hasta SU alcance (antes se quedaba a 3 y la catapulta, que tira a 2, no disparaba nunca)
      const opciones = esArquero ? { distanciaMin: 2 } : esCat ? { distanciaMin: Math.max(1, S().statTropa(estado, datos, t, "alcance")), escolta: true } : {};
      if (!o.listo && H().distancia(pos, o.reunion) <= 1) {
        // esperando en la reunión: atrincherarse
        const p = M().accionesPosibles(estado, datos, id);
        if (p.atrincherar) ctx.hacer({ tipo: "atrincherar", tropa: id });
        return;
      }
      // Al paso de las máquinas (24 sep 2026): con murallas delante, sin catapultas no se entra. Si mis máquinas
      // van más de dos casillas por detrás, la tropa espera a que lleguen en vez de llegar sola y caer; antes la
      // infantería llegaba en el turno 5, la echaban, y las catapultas se ponían a tiro en el 13.
      if (!esCat && AJUSTES.alPaso && o.a && o.a.integridad > 0) {
        const miDist = H().distancia(pos, o.hex);
        const maquinas = A.tropas.filter(x => datos.tropas[x.tipo].disparaSinMover && (datos.tropas[x.tipo].stats.asedio || 0) > 0 && estado.tropas[x.id]);
        const masCerca = maquinas.map(x => E().posicionTropa(estado, estado.tropas[x.id])).filter(Boolean).map(p => H().distancia(p, o.hex));
        if (masCerca.length && miDist <= Math.min(...masCerca) - 2 && miDist <= 4) {
          if (intentarAtaque(ctx, id, false)) return;
          // y si la máquina está lejos, vuelve a escoltarla: la máquina no avanza sin nadie al lado con enemigos
          // cerca, así que esperarla parado era un atasco (24 sep 2026, capítulo 3: quince tropas quietas 15 turnos)
          const maq = maquinas.map(x => E().posicionTropa(estado, estado.tropas[x.id])).filter(Boolean).sort((p, q) => H().distancia(p, pos) - H().distancia(q, pos))[0];
          if (maq && H().distancia(maq, pos) > 2 && moverHacia(ctx, id, maq, { distanciaMin: 1 })) { estado = ctx.estado; t = estado.tropas[id]; if (t && !t.accionUsada) intentarAtaque(ctx, id, false); return; }
          const p = M().accionesPosibles(estado, datos, id);
          if (p.atrincherar) ctx.hacer({ tipo: "atrincherar", tropa: id });
          return;
        }
      }
      if (moverHacia(ctx, id, destino, opciones)) {
        estado = ctx.estado; t = estado.tropas[id];
        if (!t || t.accionUsada) return;
        if (intentarAtaque(ctx, id, !!o.listo)) return;
        const p = M().accionesPosibles(estado, datos, id);
        if (p.atrincherar && distMinEnemigo(ctx, E().posicionTropa(estado, t)) <= 2) ctx.hacer({ tipo: "atrincherar", tropa: id });
        return;
      }
      // no hay camino (el anillo de alrededor está lleno): a por los que lo cierran, en vez de atrincherarse a cuatro
      // casillas y esperar (24 sep 2026, capítulo 10: veinte tropas paradas doce turnos delante de la torre)
      if (o.listo && !esCat && AJUSTES.abrirAnillo) {
        const cierra = A.enemigosTropas.map(e => E().posicionTropa(estado, e)).filter(p => p && H().distancia(p, o.hex) <= 3).sort((p, q) => H().distancia(p, pos) - H().distancia(q, pos))[0];
        if (cierra && moverHacia(ctx, id, cierra, esArquero ? { distanciaMin: 2 } : {})) {
          estado = ctx.estado; t = estado.tropas[id]; if (!t || t.accionUsada) return;
          if (intentarAtaque(ctx, id, true)) return;
          const p = M().accionesPosibles(estado, datos, id); if (p.atrincherar) ctx.hacer({ tipo: "atrincherar", tropa: id });
          return;
        }
      }
    }

    // 5. sin objetivo: guarnecer un asentamiento sin guarnición, o atrincherarse
    const vacio = A.mios.filter(m => m.a.guarnicion.length === 0).sort((p, q) => H().distancia(p.hex, pos) - H().distancia(q.hex, pos))[0];
    if (vacio && !esCat && moverHacia(ctx, id, vacio.hex)) return;
    const p = M().accionesPosibles(estado, datos, id);
    if (p.reclamar && !t.acuarteladaEn) { ctx.hacer({ tipo: "reclamar", tropa: id }); return; }
    if (p.atrincherar && distMinEnemigo(ctx, pos) <= 3) ctx.hacer({ tipo: "atrincherar", tropa: id });
  }


  // con la acción sin usar: reclamar la casilla si no es mía (territorio = puntos) o, con enemigos cerca, atrincherarse
  // Ataque sin remilgos: el que más daño hace de los que tenga al lado. Solo en batallas de ejércitos atascadas.
  function ataqueAMuerte(ctx, id) {
    const estado = ctx.estado; const p = M().accionesPosibles(estado, ctx.datos, id);
    let mejor = null, mv = -1;
    for (const o of p.atacar) { const pv = M().prever(estado, ctx.datos, id, o); if (!pv) continue; const v = pv.haces[1] + (pv.haces[0] >= pv.vidaDefensor ? 100 : 0); if (v > mv) { mv = v; mejor = o; } }
    return mejor ? ctx.hacer({ tipo: "atacar", tropa: id, objetivo: mejor }) : false;
  }

  function rematar(ctx, id, radio) {
    const t = ctx.estado.tropas[id]; if (!t || t.accionUsada) return;
    const p = M().accionesPosibles(ctx.estado, ctx.datos, id);
    if (p.reclamar && t.hex && ctx.estado.mapa.hexes[t.hex].dueno !== ctx.yo && distMinEnemigo(ctx, t.hex) > 1) { ctx.hacer({ tipo: "reclamar", tropa: id }); return; }
    if (p.atrincherar && distMinEnemigo(ctx, E().posicionTropa(ctx.estado, t)) <= radio) ctx.hacer({ tipo: "atrincherar", tropa: id });
  }

  // ---------- combate de una tropa (de la IA normal) ----------
  function intentarAtaque(ctx, id, agresivo) {
    const { datos } = ctx; const estado = ctx.estado; const t = estado.tropas[id];
    const p = M().accionesPosibles(estado, datos, id);
    const def = datos.tropas[t.tipo];
    if (def.disparaSinMover) {
      const obj = p.asediar.find(h => estado.asentamientos[h].integridad > 0) || null;
      if (obj) return ctx.hacer({ tipo: "asediar", tropa: id, objetivo: obj });
    }
    const o = ctx.analisis.objetivoAtaque;
    if (agresivo && o && o.listo) {
      const asent = estado.asentamientos[o.hex];
      if (p.atacar.includes(o.hex)) {
        const pv = M().prever(estado, datos, id, o.hex);
        const suicidio = pv && pv.recibes && pv.recibes[1] >= t.vida;
        if (pv && !suicidio && (def.stats.alcance > 0 || asent.integridad === 0 || pv.haces[0] >= pv.vidaDefensor)) return ctx.hacer({ tipo: "atacar", tropa: id, objetivo: o.hex });
      }
      if (asent && p.asediar.includes(o.hex) && asent.integridad > 0 && def.stats.asedio > 0) {
        const pa = M().preverAsedio(estado, datos, id, o.hex);
        const suicidio = pa && pa.recibes && pa.recibes[1] >= t.vida;
        if (!suicidio) return ctx.hacer({ tipo: "asediar", tropa: id, objetivo: o.hex });
      }
      if (p.atacar.includes(o.hex)) {
        const pv = M().prever(estado, datos, id, o.hex);
        if (pv && !(pv.recibes && pv.recibes[1] >= t.vida)) return ctx.hacer({ tipo: "atacar", tropa: id, objetivo: o.hex });
      }
    }
    let mejor = null, mejorPunt = -Infinity;
    for (const ob of p.atacar) {
      const pv = M().prever(estado, datos, id, ob);
      if (!pv) continue;
      const haces = (pv.haces[0] + pv.haces[1]) / 2, recibes = pv.recibes ? (pv.recibes[0] + pv.recibes[1]) / 2 : 0;
      const esHeroe = !!(pv.defensor && datos.tropas[pv.defensor.tipo] && datos.tropas[pv.defensor.tipo].heroe);
      const mata = pv.haces[0] >= pv.vidaDefensor ? (ctx.dificil ? 80 : 60) + (esHeroe ? 80 : 0) : (ctx.dificil && esHeroe ? 20 : 0);
      const muero = pv.recibes && pv.recibes[1] >= t.vida ? -120 : 0;
      const guarn = pv.asentamiento ? (pv.asentamiento.integridad > 0 && def.stats.alcance === 0 ? -15 : 10) : 0;
      const punt = haces - recibes * (agresivo ? 0.7 : 1.1) + mata + muero + guarn + ctx.perso.agresividad;
      if (punt > mejorPunt) { mejorPunt = punt; mejor = ob; }
    }
    if (mejor && mejorPunt > (agresivo ? -20 : 0)) return ctx.hacer({ tipo: "atacar", tropa: id, objetivo: mejor });
    if (p.asediar.length && def.stats.asedio >= 30) return ctx.hacer({ tipo: "asediar", tropa: id, objetivo: p.asediar[0] });
    if (p.asediar.length && agresivo) {
      const ob = p.asediar[0]; const asent = estado.asentamientos[ob];
      const aliados = H().vecinos(ob).filter(v => { const x = E().tropaEn(estado, v); return x && x.dueno === t.dueno; }).length;
      if (asent.guarnicion.length === 0 || asent.integridad <= 20 || (aliados >= 2 && t.vida >= S().vidaMax(estado, datos, t) * 0.5)) return ctx.hacer({ tipo: "asediar", tropa: id, objetivo: ob });
    }
    return false;
  }

  function distancias(ctx, destino, origen) {
    const e = ctx.estado, datos = ctx.datos;
    const dist = { [destino]: 0 }; const pendientes = [destino]; const cerrados = new Set();
    while (pendientes.length) {
      pendientes.sort((a, b) => dist[a] - dist[b]);
      const c = pendientes.shift(); if (cerrados.has(c)) continue; cerrados.add(c);
      const hc = e.mapa.hexes[c];
      if (hc && hc.construccion === "asentamiento" && c !== destino && c !== origen) continue;
      const costeC = FWM.acciones.costeTerreno(e, datos, c);
      if (costeC == null) continue;
      for (const v of H().vecinos(c)) {
        if (!e.mapa.hexes[v] || FWM.acciones.costeTerreno(e, datos, v) == null) continue;
        const d = dist[c] + costeC;
        if (dist[v] == null || d < dist[v]) { dist[v] = d; pendientes.push(v); }
      }
    }
    return dist;
  }

  function moverHacia(ctx, id, destino, opciones) {
    opciones = opciones || {};
    const { datos, yo } = ctx; const estado = ctx.estado; const t = estado.tropas[id];
    const pos = E().posicionTropa(estado, t);
    if (pos === destino) return false;
    const p = M().accionesPosibles(estado, datos, id);
    const cand = Object.keys(p.mover); if (!cand.length) return false;
    const dist = distancias(ctx, destino, pos);
    if (dist[pos] == null) return false;
    let mejor = null, mejorD = dist[pos];
    if (t.acuarteladaEn) opciones.avanzarIgual = true;
    const vale = (h) => {
      if (dist[h] == null) return false;
      const hx = estado.mapa.hexes[h];
      if (hx.construccion === "asentamiento" && estado.asentamientos[h].dueno === yo && h !== destino) return false;
      if (opciones.distanciaMin && distMinEnemigo(ctx, h) < opciones.distanciaMin) return false;
      // escolta: la máquina avanza pegada a los suyos… o por donde no hay nadie cerca (si no, se quedaba atrás para siempre)
      if (opciones.escolta && distMinEnemigo(ctx, h) < 3 && !(AJUSTES.escolta > 1 ? H().anillo(h, 2).concat(H().vecinos(h)) : H().vecinos(h)).some(v => { const x = E().tropaEn(estado, v); return x && x.dueno === yo && !datos.tropas[x.tipo].disparaSinMover; })) return false;
      return true;
    };
    for (const h of cand) {
      if (!vale(h)) continue;
      if (dist[h] < mejorD || (dist[h] === mejorD && opciones.avanzarIgual)) { mejorD = dist[h]; mejor = h; }
    }
    // atasco: el camino bueno lo tapa uno de los tuyos. En vez de quedarse parada (en un paso estrecho se paraba la
    // columna entera), la tropa se abre de lado: se queda igual de cerca pero por otro hueco (21 sep 2026).
    if (!mejor && !opciones.avanzarIgual) {
      const tapado = H().vecinos(pos).some(v => dist[v] != null && dist[v] < dist[pos] && (x => x && x.dueno === yo)(E().tropaEn(estado, v)));
      if (tapado) {
        let alt = null, altD = 1e9;
        for (const h of cand) {
          if (!vale(h) || dist[h] > dist[pos]) continue;
          const d = H().distancia(h, destino);
          if (d < altD) { altD = d; alt = h; }
        }
        if (alt && alt !== pos) mejor = alt;
      }
    }
    if (!mejor) return false;
    return ctx.hacer({ tipo: "mover", tropa: id, a: mejor });
  }

  // Solo tropas de combate: al campesino no le da miedo otro campesino, y con miedo de todo no trabajaba (22 sep 2026)
  function distMinMilitarEnemigo(ctx, hex) {
    let d = 99;
    for (const t of ctx.analisis.enemigosTropas) {
      if (!ctx.estado.tropas[t.id] || ctx.datos.tropas[t.tipo].puedeFundar) continue;
      const p = E().posicionTropa(ctx.estado, ctx.estado.tropas[t.id]); if (p) d = Math.min(d, H().distancia(p, hex));
    }
    return d;
  }

  function distMinEnemigo(ctx, hex) {
    let d = 99;
    for (const t of ctx.analisis.enemigosTropas) { if (!ctx.estado.tropas[t.id]) continue; const p = E().posicionTropa(ctx.estado, ctx.estado.tropas[t.id]); if (p) d = Math.min(d, H().distancia(p, hex)); }
    for (const x of ctx.analisis.enemigosAsent) if (x.a.guarnicion.length) d = Math.min(d, H().distancia(x.hex, hex));
    return d;
  }

  function enemigoAdyacente(estado, t, yo) {
    const pos = E().posicionTropa(estado, t);
    return H().vecinos(pos).some(v => { const x = E().tropaEn(estado, v); return x && E().enemigos(estado, x.dueno, yo); });
  }

  // ---------- campesinos (de la IA normal) ----------
  function actuarCampesino(ctx, id) {
    const { datos, yo } = ctx; const A = ctx.analisis;
    let estado = ctx.estado; let t = estado.tropas[id];
    const nAsent = A.mios.length;
    const quieroFundar = nAsent < ctx.perso.fundarBase + Math.floor(estado.turno / 15) && hayDondeFundar(ctx);
    if (t.acuarteladaEn) {
      const a = estado.asentamientos[t.acuarteladaEn];
      if (intentarAtaque(ctx, id, false)) return;
      if (!quieroFundar && mejorarSiSobra(ctx, id)) return;
      const amenaza = A.amenazas[t.acuarteladaEn];
      // solo se queda si el enemigo está encima: un enemigo a cinco casillas dejaba al campesino dentro del pueblo
      // para siempre, y la máquina compraba otro campesino… y nunca fundaba nada (22 sep 2026)
      if (amenaza && amenaza.enemigo > 0 && a.guarnicion.length <= 1 && distMinEnemigo(ctx, t.acuarteladaEn) <= 3) return;
      if (estado.turno > 8 && a.guarnicion.length <= ctx.perso.guarnicionMinima) return;
    }
    const sinSoldados = A.militares.length === 0 || ctx.perso.nombre === "guardiana";
    if (sinSoldados) {
      const pos0 = E().posicionTropa(estado, t);
      const yacDefender = A.yacAmenazados.map(x => x.hex).concat(A.yacRobados);
      const y = yacDefender.map(h => ({ hex: h, d: H().distancia(h, pos0) })).filter(x => x.d <= 4).sort((p, q) => p.d - q.d)[0];
      if (y) {
        if (intentarAtaque(ctx, id, true)) return;
        if (pos0 === y.hex) { const p0 = M().accionesPosibles(estado, datos, id); if (p0.reclamar) { ctx.hacer({ tipo: "reclamar", tropa: id }); return; } if (p0.atrincherar) { ctx.hacer({ tipo: "atrincherar", tropa: id }); return; } }
        if (moverHacia(ctx, id, y.hex, { avanzarIgual: true })) {
          estado = ctx.estado; t = estado.tropas[id]; if (!t || t.accionUsada) return;
          if (intentarAtaque(ctx, id, true)) return;
          const p1 = M().accionesPosibles(estado, datos, id);
          if (p1.reclamar) { ctx.hacer({ tipo: "reclamar", tropa: id }); return; }
          if (p1.atrincherar) ctx.hacer({ tipo: "atrincherar", tropa: id });
          return;
        }
      }
    }
    // Huir: un campesino no pelea. Si tiene un enemigo a tres o menos, se mete en el pueblo más cercano.
    // (22 sep 2026: el 64 % de las bajas de la máquina eran campesinos paseando delante de la caballería.)
    const posH = E().posicionTropa(estado, t);
    if (!t.acuarteladaEn && posH && distMinMilitarEnemigo(ctx, posH) <= AJUSTES.campesinoHuye) {
      const refugio = A.mios.map(x => ({ hex: x.hex, d: H().distancia(x.hex, posH) })).sort((x, y) => x.d - y.d)[0];
      if (refugio) {
        if (refugio.d === 0) { const pr = M().accionesPosibles(estado, datos, id); if (pr.atrincherar) ctx.hacer({ tipo: "atrincherar", tropa: id }); return; }
        if (moverHacia(ctx, id, refugio.hex, { avanzarIgual: true })) return;
      }
    }
    const vacioEnPeligro = A.mios.filter(m => A.amenazas[m.hex] && A.amenazas[m.hex].peligro && m.a.guarnicion.length === 0)
      .map(m => ({ hex: m.hex, d: H().distancia(m.hex, E().posicionTropa(estado, t)) })).filter(x => x.d <= 3).sort((p, q) => p.d - q.d)[0];
    if (vacioEnPeligro && moverHacia(ctx, id, vacioEnPeligro.hex)) return;
    const p = M().accionesPosibles(estado, datos, id);
    if (p.fundar && quieroFundar) { ctx.hacer({ tipo: "fundar", tropa: id }); return; }
    if (p.reclamar && t.hex && estado.mapa.hexes[t.hex].yacimiento) { ctx.hacer({ tipo: "reclamar", tropa: id }); return; }
    if (enemigoAdyacente(estado, t, yo) && intentarAtaque(ctx, id, false)) return;
    const j = estado.jugadores[yo];
    const neto = A.ingresoOro - A.gasto;
    const oroPronto = (j.hucha.oro || 0) + Math.max(0, neto) * 2 >= (datos.asentamientos.pueblo.coste.oro || 0);
    const fundarAhora = quieroFundar && oroPronto;
    // Esperar en el sitio elegido solo si el oro está de verdad a la vuelta de la esquina. Si no, el campesino se
    // pasaba la partida entera plantado en su casilla mientras el oro se iba en tropas (22 sep 2026).
    const costePueblo = (datos.asentamientos.pueblo.coste.oro || 0);
    const oroCerca = (j.hucha.oro || 0) >= costePueblo * 0.6;
    if (quieroFundar && oroPronto && oroCerca && !p.fundar && t.hex && sitioValidoParaFundar(ctx, t.hex)) {
      if (p.reclamar) ctx.hacer({ tipo: "reclamar", tropa: id });
      return;
    }
    // el sitio se busca con querer fundar, no con tener ya el oro: mientras camina (3-5 turnos) el oro llega
    let objetivo = objetivoCampesino(ctx, t, quieroFundar);
    // sin nada mejor, a reclamar territorio: cada casilla es un punto y el campesino parado no vale nada
    if (!objetivo) {
      if (p.reclamar && t.hex) { ctx.hacer({ tipo: "reclamar", tropa: id }); return; }
      objetivo = casillaQueReclamar(ctx, t);
      // y si tampoco hay nada que reclamar cerca, a casa: dentro de un pueblo al menos defiende y está listo
      // para fundar cuando se abra un hueco (22 sep 2026: se quedaban parados en mitad del campo).
      if (!objetivo) {
        const casa = A.mios.map(x => ({ hex: x.hex, d: H().distancia(x.hex, E().posicionTropa(estado, t)) })).sort((x, y) => x.d - y.d)[0];
        if (!casa || casa.d === 0) return;
        objetivo = casa.hex;
      }
    }
    const movio = moverHacia(ctx, id, objetivo, { avanzarIgual: true });
    if (movio) {
      estado = ctx.estado; t = estado.tropas[id];
      if (!t || t.accionUsada) return;
      const p2 = M().accionesPosibles(estado, datos, id);
      if (p2.fundar && fundarAhora) { ctx.hacer({ tipo: "fundar", tropa: id }); return; }
      if (p2.reclamar && t.hex && !enemigoAdyacente(estado, t, yo)) ctx.hacer({ tipo: "reclamar", tropa: id });
    } else if (p.reclamar && t.hex) {
      ctx.hacer({ tipo: "reclamar", tropa: id });
    }
  }

  // ¿Queda algún sitio donde fundar de verdad? (mismas reglas que el campesino: a distancia mínima de todo
  // asentamiento, a 4 o menos de uno mío y sin enemigos encima). Sin esto la máquina se pasaba la partida
  // ahorrando 45 de oro para un pueblo que no podía poner en ninguna parte (22 sep 2026, visto en la radiografía).
  function hayDondeFundar(ctx) {
    if (ctx.hayHueco != null) return ctx.hayHueco;
    const { datos, yo } = ctx; const estado = ctx.estado;
    const asents = Object.keys(estado.asentamientos);
    const mios = asents.filter(a => estado.asentamientos[a].dueno === yo);
    const minima = datos.asentamientos.pueblo.distanciaMinima;
    let hay = false;
    for (const m of mios) {
      for (let r = minima; r <= 4 && !hay; r++) {
        for (const k of H().anillo(m, r)) {
          const h = estado.mapa.hexes[k];
          if (!h || h.construccion || (h.dueno != null && h.dueno !== yo)) continue;
          if (!datos.terrenos[h.terreno].construible) continue; // en un bosque o una montaña no se puede poner un pueblo
          if (distMinEnemigo(ctx, k) <= 1) continue;
          if (!asents.every(a => H().distancia(a, k) >= minima)) continue;
          // mismo listón que el campesino al elegir sitio: un pueblo sin yacimientos cerca no lo pone nadie
          if (AJUSTES.yacParaFundar && !H().anillo(k, 2).some(x => estado.mapa.hexes[x] && estado.mapa.hexes[x].yacimiento)) continue;
          hay = true; break;
        }
      }
      if (hay) break;
    }
    return (ctx.hayHueco = hay);
  }

  function sitioValidoParaFundar(ctx, hex) {
    const { datos, yo } = ctx; const estado = ctx.estado;
    const h = estado.mapa.hexes[hex];
    if (!h || h.construccion || (h.dueno != null && h.dueno !== yo)) return false;
    if (!datos.terrenos[h.terreno].construible) return false;
    return Object.keys(estado.asentamientos).every(a => H().distancia(a, hex) >= datos.asentamientos.pueblo.distanciaMinima);
  }

  function mejorarSiSobra(ctx, id) {
    const { datos, yo } = ctx; const estado = ctx.estado; const t = estado.tropas[id];
    const j = estado.jugadores[yo];
    if ((j.hucha.oro || 0) < 60) return false;
    const p = M().accionesPosibles(estado, datos, id);
    if (!p.mejorarA.length) return false;
    const res = FWM.economia.resumen(estado, datos, yo);
    const mejor = p.mejorarA.slice().sort((x, y) => (datos.tropas[y].coste.oro || 0) - (datos.tropas[x].coste.oro || 0))[0];
    const extra = datos.tropas[mejor].mantenimiento - datos.tropas[t.tipo].mantenimiento;
    if (res.gasto + extra > (res.ingresos.oro || 0) * 0.7) return false;
    return ctx.hacer({ tipo: "mejorarTropa", tropa: id, que: mejor });
  }

  // La casilla sin dueño más cercana a la que se puede llegar sin meterse en la boca del lobo.
  function casillaQueReclamar(ctx, t) {
    const { datos, yo } = ctx; const estado = ctx.estado;
    const pos = E().posicionTropa(estado, t); if (!pos) return null;
    let mejor = null, mejorD = 1e9;
    for (const [k, h] of Object.entries(estado.mapa.hexes)) {
      if (h.terreno === "agua" || h.dueno === yo || h.construccion) continue;
      if (FWM.acciones.costeTerreno(estado, datos, k) == null) continue;
      if (distMinMilitarEnemigo(ctx, k) <= 2 || E().tropaEn(estado, k)) continue;
      const d = H().distancia(pos, k);
      if (d > 6 || d >= mejorD) continue;
      mejorD = d; mejor = k;
    }
    return mejor;
  }

  function objetivoCampesino(ctx, t, quieroFundar) {
    const { datos, yo } = ctx; const estado = ctx.estado;
    const pos = E().posicionTropa(estado, t);
    const asents = Object.keys(estado.asentamientos);
    const cand = [];
    for (const [k, h] of Object.entries(estado.mapa.hexes)) {
      if (h.terreno === "agua" || E().tropaEn(estado, k)) continue;
      if (distMinEnemigo(ctx, k) <= 1) continue;
      if (h.yacimiento && h.dueno !== yo) {
        const esOro = (datos.yacimientos[h.yacimiento].produce.oro || 0) > 0;
        cand.push({ hex: k, v: (esOro ? 60 : 40) - (h.dueno == null ? 0 : 15) });
      }
      if (quieroFundar && !h.construccion && (h.dueno == null || h.dueno === yo) && datos.terrenos[h.terreno].construible) {
        if (!asents.every(a => H().distancia(a, k) >= datos.asentamientos.pueblo.distanciaMinima)) continue;
        if (!asents.some(a => estado.asentamientos[a].dueno === yo && H().distancia(a, k) <= 4)) continue;
        const yac = H().anillo(k, 2).filter(x => estado.mapa.hexes[x] && estado.mapa.hexes[x].yacimiento && estado.mapa.hexes[x].dueno !== yo).length
          + H().anillo(k, 2).filter(x => estado.mapa.hexes[x] && estado.mapa.hexes[x].yacimiento && estado.mapa.hexes[x].dueno === yo).length * 0.5;
        if (yac < 1) continue;
        cand.push({ hex: k, v: (30 + yac * 10) * ctx.perso.pesoFundar });
      }
    }
    // Memoria: lo empezado se acaba. Sin esto el campesino elegía el mejor sitio cada turno, y como al andar
    // cambiaba cuál era el mejor, iba y venía sin fundar nunca (22 sep 2026: diez turnos para el segundo pueblo).
    const j = estado.jugadores[yo]; j.destinos = j.destinos || {};
    const anterior = j.destinos[t.id];
    let mejor = null, mejorV = -Infinity;
    for (const c of cand) {
      const d = H().distancia(pos, c.hex); if (d === 0) continue;
      const v = c.v - d * 4 + (c.hex === anterior ? 30 : 0);
      if (v > mejorV) { mejorV = v; mejor = c.hex; }
    }
    if (mejor) j.destinos[t.id] = mejor; else delete j.destinos[t.id];
    return mejor;
  }

  // Ayudas de cada dificultad a la máquina (19 sep 2026, Rodrigo: "la difícil, la normal con ayudas: dinero extra").
  // oro: multiplica el oro con que empieza; porTurno: oro fijo de más cada turno. Medido en el banco de pruebas.
  const AYUDAS = { facil: { oro: 1, porTurno: -1 }, normal: { oro: 1, porTurno: 0 }, dificil: { oro: 1.4, porTurno: 2 } };
  // Deja a las máquinas de una partida listas para su dificultad: personalidad (sorteada con la semilla; en difícil
  // "implacable"; el jefe de campaña siempre lo es) y ayudas. Lo usan app.js y el banco de pruebas, para que midan lo mismo.
  function prepararRivales(estado, dificultad, semilla) {
    const persos = Object.keys(PERSONALIDADES); const g = FWM.azar.crear((semilla || 0) + 99);
    const ay = AYUDAS[dificultad] || AYUDAS.normal;
    for (const j of estado.jugadores) {
      if (j.humano || j.remoto || j.horda) continue;
      j.personalidad = j.esJefe || dificultad === "dificil" ? "implacable" : g.elegir(persos);
      j.hucha.oro = Math.round((j.hucha.oro || 0) * ay.oro);
      if (ay.porTurno) j.oroPorTurno = ay.porTurno;
    }
  }

  return { jugar, PERSONALIDADES, DIFICIL, NIVELES, SUSTITUYE, AYUDAS, AJUSTES, prepararRivales };
})();

// El cerebro juega las tres dificultades; la fácil de antes (ia/tonta.js) queda solo para el tutorial.
// FWM.iaNormal queda como nombre del cerebro para quien lo use (app.js sortea sus PERSONALIDADES).
FWM.ias = FWM.ias || {};
FWM.ias.facil = (e, d, o) => FWM.cerebro.jugar(e, d, Object.assign({}, o || {}, { nivel: "facil" }));
FWM.ias.normal = (e, d, o) => FWM.cerebro.jugar(e, d, Object.assign({}, o || {}, { nivel: (o && o.dificil) ? "dificil" : undefined }));
FWM.ias.dificil = (e, d, o) => FWM.cerebro.jugar(e, d, Object.assign({}, o || {}, { nivel: "dificil" }));
FWM.iaNormal = FWM.cerebro;
