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
    equilibrada:   { nombre: "equilibrada",   defender: 1.0, atacar: 1.0, incursion: 1.0, recursos: 1.0, radioAmenaza: 4, radioYac: 2, factorListo: 1.3, tope: 0.6,  guarnicionMinima: 0, agresividad: 0,   fundarBase: 3, pesoFundar: 1.0, militarPronto: false },
    guardiana:     { nombre: "guardiana",     defender: 1.4, atacar: 0.7, incursion: 0.6, recursos: 1.3, radioAmenaza: 5, radioYac: 3, factorListo: 1.8, tope: 0.55, guarnicionMinima: 1, agresividad: -10, fundarBase: 2, pesoFundar: 0.6, militarPronto: false, intrusos: true },
    expansionista: { nombre: "expansionista", defender: 0.9, atacar: 0.8, incursion: 0.9, recursos: 1.2, radioAmenaza: 3, radioYac: 1, factorListo: 1.4, tope: 0.6,  guarnicionMinima: 0, agresividad: -5,  fundarBase: 5, pesoFundar: 1.6, militarPronto: false },
    belicosa:      { nombre: "belicosa",      defender: 0.9, atacar: 1.4, incursion: 1.4, recursos: 0.8, radioAmenaza: 4, radioYac: 2, factorListo: 1.0, tope: 0.72, guarnicionMinima: 0, agresividad: 15,  fundarBase: 3, pesoFundar: 0.8, militarPronto: true, intrusos: true },
  };
  // la de la difícil (y de los jefes de campaña): fuera del sorteo de las normales. 18 sep 2026: antes gastaba pronto
  // en ejército, fundaba menos y acababa con menos puntos que la normal; ahora lleva la economía de una buena
  // expansionista y su dureza está en la capacidad (golpe también al atacar, incursiones, ir a por el humano) y en
  // el 25 % de oro de más. Banco: contra la máquina gana 57 % (la normal 44 %), contra el jugador tipo 68 % (64 %).
  const DIFICIL = { nombre: "implacable", defender: 1.1, atacar: 1.3, incursion: 1.4, recursos: 1.0, radioAmenaza: 4, radioYac: 2, factorListo: 1.3, tope: 0.6, guarnicionMinima: 1, agresividad: 0, fundarBase: 4, pesoFundar: 1.2, militarPronto: false, intrusos: true };

  // ---------- dificultad: capacidad del cerebro ----------
  //   vision     a cuántas casillas de sus cosas ve tropas enemigas (99: todo)
  //   golpe      coordina ataques de varias tropas; ofensivo: también lejos de casa
  //   incursion  aprovecha asentamientos vacíos del enemigo
  //   despiste   probabilidad de que una tropa (no el héroe) se quede quieta ese turno, como un principiante
  const NIVELES = {
    // fácil (19 sep 2026): el mismo cerebro, pero no coordina ataques, no hace incursiones, solo ve lo que tiene cerca
    // y cobra 1 de oro menos por turno (AYUDAS; con menos oro al empezar no llegaba a hacer ciudad y solo sacaba
  // campesinos). Juega con sentido y se le puede ganar.
    facil:   { nombre: "facil", vision: 4, golpe: false, ofensivo: false, incursion: false, cazaHumano: false, despiste: 0.3 },
    normal:  { nombre: "normal", vision: 99, golpe: true, ofensivo: false, incursion: true, cazaHumano: false },
    dificil: { nombre: "dificil", vision: 99, golpe: true, ofensivo: true, incursion: true, cazaHumano: true },
  };

  const EMPUJE = 25, EMPUJE_LISTO = 1.05, EMPUJE_TOPE = 0.8;

  function jugar(estado, datos, opciones) {
    opciones = opciones || {};
    const jug = estado.jugadores[estado.jugadorActivo];
    const nivel = NIVELES[opciones.nivel || (opciones.dificil || jug.personalidad === "implacable" ? "dificil" : "normal")] || NIVELES.normal;
    let perso = nivel.nombre === "dificil" ? DIFICIL : (PERSONALIDADES[opciones.personalidad || jug.personalidad || "equilibrada"] || PERSONALIDADES.equilibrada);
    // partidas sin límite de turnos (15 sep 2026): desde el turno 25 va a por todas, si no nunca acaban
    const empuje = !estado.limiteTurnos && !estado.barbaros && estado.turno >= EMPUJE;
    if (empuje) perso = Object.assign({}, perso, { factorListo: Math.min(perso.factorListo, EMPUJE_LISTO), tope: Math.max(perso.tope, EMPUJE_TOPE), militarPronto: true, agresividad: perso.agresividad + 10, atacar: perso.atacar * 1.3 });
    const ctx = { estado, datos, yo: estado.jugadorActivo, acciones: 0, eventos: [], perso, nivel, dificil: nivel.nombre === "dificil", empuje, mision: {}, misiones: [] };
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
    if (!ctx.estado.jugadores[ctx.yo].eliminado && ctx.estado.ganador == null) {
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
    // --- defender mis asentamientos
    for (const { hex, a: s } of A.mios) {
      const am = A.amenazas[hex]; if (!am || am.enemigo <= 0) continue;
      const falta = am.enemigo * 1.1 - am.propio;
      // a por todas (sin límite, turno 25+): solo se defiende lo que tiene al enemigo encima
      const encima = a_cerca(ctx, hex, 2);
      const base = (hex === capital ? 150 : 90) + (S().produccionAsentamiento(estado, datos, s).oro || 0) * 5;
      // acampado en la muralla: echarlo es lo primero
      if (am.acosadores.length) misiones.push({ tipo: "expulsar", hex, objetivo: am.acosadores[0], nota: P.defender * (base + 80), necesita: A.poder[am.acosadores[0]] * 1.2, max: 5, radio: 7 });
      // defender es meter tropas dentro: solo si queda hueco en la guarnición (como la IA de antes; con más, las
      // tropas se quedaban paradas alrededor y el ejército no salía nunca: banco, 18 sep)
      const huecos = S().propAsentamiento(estado, datos, s, "huecosGuarnicion") - s.guarnicion.length;
      if (falta > 0 && huecos > 0 && am.peligro && (!ctx.empuje || encima)) misiones.push({ tipo: "defensa", hex, nota: P.defender * base * Math.min(2, am.enemigo / (am.propio + 20)), necesita: falta, max: huecos, radio: 4 });
    }
    // --- asalto: el mejor asentamiento enemigo
    const asalto = elegirAsalto(ctx);
    if (asalto) misiones.push(Object.assign({ tipo: "asalto", nota: P.atacar * (60 + asalto.valor * 0.5), necesita: asalto.listo ? 0 : 1e9, max: 99 }, asalto));
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
        if (!mejor || nota > mejor.nota) mejor = { tipo: "incursion", hex: x.hex, nota, necesita: 1, max: esCapital ? 3 : 2, radio: 5 };
      }
      if (mejor) misiones.push(mejor);
    }
    if (ctx.empuje) for (const m of misiones) if (m.tipo === "defensa") m.nota *= 0.6;
    // el asalto se lleva lo que sobra: va el último en el reparto (si no, se quedaba con todo y no había quien
    // defendiera ni cazara intrusos; banco, 18 sep)
    misiones.sort((p, q) => ((p.tipo === "asalto") - (q.tipo === "asalto")) || (q.nota - p.nota));

    // --- reparto: cada tropa militar libre va a la misión que mejor le cuadra (nota menos lejanía)
    ctx.mision = {}; const asignado = new Map(); // mision -> poder asignado
    const libres = A.militares.filter(t => {
      const def = datos.tropas[t.tipo];
      if (def.cura && !def.heroe) return false; // el monje sigue al ejército (Vesna cura pero es la heroína: pelea)
      if (def.heroe && t.vida < S().vidaMax(estado, datos, t) * (ctx.dificil ? .35 : .45)) { ctx.mision[t.id] = { tipo: "curar" }; return false; }
      return true;
    });
    // guarniciones: las de un asentamiento que se defiende se quedan; la mínima, también
    for (const t of libres.slice()) {
      if (!t.acuarteladaEn) continue;
      const m = misiones.find(x => (x.tipo === "defensa" || x.tipo === "expulsar") && x.hex === t.acuarteladaEn);
      const s = estado.asentamientos[t.acuarteladaEn];
      const minima = ctx.empuje || ctx.dificil ? (t.acuarteladaEn === capital ? 1 : 0) : P.guarnicionMinima;
      const quedan = s.guarnicion.filter(id => ctx.mision[id] && ctx.mision[id].tipo === "guarnicion").length;
      if (m || quedan < minima || (datos.tropas[t.tipo].disparaSinMover)) {
        ctx.mision[t.id] = { tipo: "guarnicion", hex: t.acuarteladaEn, defensa: m || null };
        if (m) asignado.set(m, (asignado.get(m) || 0) + A.poder[t.id]);
        libres.splice(libres.indexOf(t), 1);
      }
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
    if (asalto && ctx.empuje) estado.jugadores[yo].objetivoIA = asalto.hex;
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
    let mejor = null, mejorV = -Infinity;
    for (const x of A.enemigosAsent) {
      const guarn = x.a.guarnicion.map(id => estado.tropas[id]).filter(Boolean);
      // defensa: la guarnición y las tropas suyas que pueden acudir (a 3 o menos)
      const acuden = A.enemigosTropas.filter(t => t.dueno === x.a.dueno && t.hex && estado.tropas[t.id] && !ctx.datos.tropas[t.tipo].puedeFundar && H().distancia(t.hex, x.hex) <= 3).reduce((s, t) => s + (A.poder[t.id] || 0) * 0.7, 0);
      const defensa = acuden + guarn.reduce((s, g) => s + poderTropa(estado, datos, g) + (x.a.integridad > 0 ? S().propAsentamiento(estado, datos, x.a, "plusDefensa") : 0), 0);
      const dist = Math.min(...A.mios.map(m => H().distancia(m.hex, x.hex)), 99);
      const oro = S().produccionAsentamiento(estado, datos, x.a).oro || 0;
      const yacCerca = H().anillo(x.hex, 2).filter(k => estado.mapa.hexes[k] && estado.mapa.hexes[k].yacimiento && estado.mapa.hexes[k].dueno === x.a.dueno).length;
      const humano = estado.jugadores[x.a.dueno] && estado.jugadores[x.a.dueno].humano;
      const valor = 20 + oro * 6 + yacCerca * 8 + (x.a.tipo === "castillo" ? -10 : 0) + (guarn.length === 0 ? 80 : 0) + (ctx.nivel.cazaHumano && humano ? 30 : 0);
      const sigue = ctx.empuje && estado.jugadores[yo].objetivoIA === x.hex ? 35 : 0;
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
    mejor.listo = mejor.guarn === 0 && mejor.defensa < 1 || fuerza >= mejor.defensa * ctx.perso.factorListo;
    if (!cercano) mejor.listo = true;
    return mejor;
  }

  // =====================================================================================================
  // 3. RECLUTAR según lo que falta
  // =====================================================================================================
  const SUSTITUYE = { castilla: ["lancero", "caballero"], vikingos: ["espadachin", "lancero", "caballero"], inglaterra: ["arquero", "ballestero"], mali: ["caballero"], saladino: ["caballero", "caballeria_pesada"], mongoles: ["arquero", "caballero"], eslavos: ["lancero"] };
  const PESADAS = { lancero: "infanteria_pesada", alabardero: "infanteria_pesada", espadachin: "infanteria_pesada", caballero: "caballeria_pesada", catapulta: "trabuco", arquero: "ballestero" };

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
      const quieroFundar = nAsent < ctx.perso.fundarBase + Math.floor(estado.turno / 15);
      const campesinosLibres = tropas.filter(t => t.tipo === "campesino" && !t.acuarteladaEn).length;
      // lo que falta a las misiones que pasan por aquí
      const faltaDefensa = ctx.misiones.some(m => (m.tipo === "defensa" || m.tipo === "expulsar") && m.hex === hex);
      let deseo = null, urgente = false;
      if (faltaDefensa && a.guarnicion.length < S().propAsentamiento(estado, datos, a, "huecosGuarnicion")) {
        deseo = [contraEnemigo(ctx), "lancero", "arquero", "caballero", "campesino"]; urgente = true;
      } else if (ctx.perso.militarPronto && A.militares.length < 2 && campesinos >= 1) {
        deseo = ["lancero", "arquero", "caballero", "campesino"];
      } else if (quieroFundar && campesinosLibres === 0 && campesinos < 3) {
        deseo = ["campesino"];
      } else if (quieroFundar && campesinosLibres > 0 && (j.hucha.oro || 0) < 45) {
        continue; // guardar para fundar
      } else if (A.objetivoAtaque) {
        const o = A.objetivoAtaque;
        const tengoCat = tropas.some(t => t.tipo === "catapulta");
        if (o.a.integridad >= 60 && !tengoCat) deseo = ["catapulta", "lancero", "arquero"];
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
        if (tipo === "campesino" && campesinos >= (ctx.empuje ? 2 + Math.floor(nAsent / 2) : 3 + nAsent)) continue;
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
  function ejecutar(ctx) {
    const { datos } = ctx; const A = ctx.analisis;
    // a distancia primero (disparan sin contraataque), luego caballería, infantería, campesinos y catapultas
    const prioridad = (t) => datos.tropas[t.tipo].disparaSinMover ? 4 : datos.tropas[t.tipo].puedeFundar ? 3 : datos.tropas[t.tipo].stats.alcance > 0 ? 0 : datos.tropas[t.tipo].stats.movimiento > 1 ? 1 : 2;
    const ids = A.tropas.slice().sort((x, y) => prioridad(x) - prioridad(y)).map(t => t.id);
    for (const id of ids) {
      const t = ctx.estado.tropas[id];
      if (!t || t.accionUsada) continue;
      if (datos.tropas[t.tipo].puedeFundar) actuarCampesino(ctx, id);
      else if (ctx.nivel.despiste && !datos.tropas[t.tipo].heroe && ctx.azar.siguiente() < ctx.nivel.despiste) continue;
      else actuarMilitar(ctx, id);
    }
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
    if (!["expulsar", "incursion", "curar"].includes(m.tipo)) return actuarClasico(ctx, id);
    const tras = () => { estado = ctx.estado; t = estado.tropas[id]; return !!(t && !t.accionUsada); };
    if (m.tipo === "curar") {
      if (t.acuarteladaEn) return;
      const casa = A.mios.map(x => x.hex).sort((p, q) => H().distancia(p, pos0) - H().distancia(q, pos0))[0];
      if (casa) moverHacia(ctx, id, casa);
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
    if (def.heroe) {
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

    // 1. acuartelada: defender desde dentro si es a distancia; la última se queda
    if (t.acuarteladaEn) {
      const a = estado.asentamientos[t.acuarteladaEn];
      if (intentarAtaque(ctx, id, false)) return;
      if (mejorarSiSobra(ctx, id)) return;
      const amenaza = A.amenazas[t.acuarteladaEn];
      // se queda solo si hay amenaza cerca, o si la personalidad exige guarnición mínima (las catapultas no cuentan)
      const pegado = ctx.empuje ? distMinEnemigo(ctx, t.acuarteladaEn) <= 2 : true; // a por todas: solo se queda si el enemigo está encima
      if (!esCat && amenaza && pegado && (amenaza.peligro || (amenaza.enemigo > 0 && a.guarnicion.length <= 1))) return;
      const minima = ctx.empuje ? (t.acuarteladaEn === estado.jugadores[yo].capital ? 1 : 0) : ctx.dificil ? (t.acuarteladaEn === estado.jugadores[yo].capital ? 1 : 0) : ctx.perso.guarnicionMinima;
      if (!esCat && a.guarnicion.length <= minima) return;
    }

    // 2. defensa: si un asentamiento mío está en peligro y estoy cerca, ir a él
    const peligrosos = A.mios.filter(m => A.amenazas[m.hex] && A.amenazas[m.hex].peligro && m.a.guarnicion.length < S().propAsentamiento(estado, datos, m.a, "huecosGuarnicion"));
    const pos = E().posicionTropa(estado, t);
    // 2-. acoso: una tropa enemiga pegada a la muralla de un asentamiento mío. Se vuelve desde lejos (hasta 7) y se va
    // a por ella, no a meterse dentro (16 sep 2026: el héroe rival rodeaba la capital y el mío seguía de paseo)
    if (!esCat && !t.acuarteladaEn && !(def.heroe && t.vida < S().vidaMax(estado, datos, t) * 0.6)) {
      const acosos = A.enemigosTropas.map(e => ({ e, p: E().posicionTropa(estado, e) })).filter(x => x.p && estado.tropas[x.e.id] && A.mios.some(m => H().distancia(m.hex, x.p) <= 1));
      const acoso = acosos.map(x => ({ hex: x.p, d: H().distancia(x.p, pos) })).filter(x => x.d <= 7).sort((p, q) => p.d - q.d)[0];
      if (acoso) {
        if (intentarAtaque(ctx, id, true)) return;
        if (moverHacia(ctx, id, acoso.hex, esArquero ? { distanciaMin: 2 } : {})) { estado = ctx.estado; t = estado.tropas[id]; if (!t || t.accionUsada) return; intentarAtaque(ctx, id, true); return; }
      }
    }
    const cerca = peligrosos.filter(m => H().distancia(m.hex, pos) <= (ctx.empuje ? 2 : 4)).sort((p, q) => H().distancia(p.hex, pos) - H().distancia(q.hex, pos))[0];
    if (cerca && !esCat && t.acuarteladaEn !== cerca.hex) {
      if (intentarAtaque(ctx, id, false)) return;
      if (moverHacia(ctx, id, cerca.hex)) { estado = ctx.estado; t = estado.tropas[id]; if (!t || t.accionUsada) return; intentarAtaque(ctx, id, false); return; }
    }

    // 2a. cazar intrusos (guardiana y belicosa): tropa enemiga cerca de mi casa
    if (!esCat && ctx.perso.intrusos && A.intrusos.length) {
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
    if (!esCat && yacDefender.length && !ctx.empuje) {
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
      const opciones = esArquero ? { distanciaMin: 2 } : esCat ? { distanciaMin: 3, escolta: true } : {};
      if (!o.listo && H().distancia(pos, o.reunion) <= 1) {
        // esperando en la reunión: atrincherarse
        const p = M().accionesPosibles(estado, datos, id);
        if (p.atrincherar) ctx.hacer({ tipo: "atrincherar", tropa: id });
        return;
      }
      if (moverHacia(ctx, id, destino, opciones)) {
        estado = ctx.estado; t = estado.tropas[id];
        if (!t || t.accionUsada) return;
        if (intentarAtaque(ctx, id, !!o.listo)) return;
        const p = M().accionesPosibles(estado, datos, id);
        if (p.atrincherar && distMinEnemigo(ctx, E().posicionTropa(estado, t)) <= 2) ctx.hacer({ tipo: "atrincherar", tropa: id });
        return;
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
    for (const h of cand) {
      if (dist[h] == null) continue;
      const hx = estado.mapa.hexes[h];
      if (hx.construccion === "asentamiento" && estado.asentamientos[h].dueno === yo && h !== destino) continue;
      if (opciones.distanciaMin && distMinEnemigo(ctx, h) < opciones.distanciaMin) continue;
      if (opciones.escolta && !H().vecinos(h).some(v => { const x = E().tropaEn(estado, v); return x && x.dueno === yo && !datos.tropas[x.tipo].disparaSinMover; })) continue;
      if (dist[h] < mejorD || (dist[h] === mejorD && opciones.avanzarIgual)) { mejorD = dist[h]; mejor = h; }
    }
    if (!mejor) return false;
    return ctx.hacer({ tipo: "mover", tropa: id, a: mejor });
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
    const quieroFundar = nAsent < ctx.perso.fundarBase + Math.floor(estado.turno / 15);
    if (t.acuarteladaEn) {
      const a = estado.asentamientos[t.acuarteladaEn];
      if (intentarAtaque(ctx, id, false)) return;
      if (!quieroFundar && mejorarSiSobra(ctx, id)) return;
      const amenaza = A.amenazas[t.acuarteladaEn];
      if (amenaza && amenaza.enemigo > 0 && a.guarnicion.length <= 1) return;
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
    if (quieroFundar && oroPronto && !p.fundar && t.hex && sitioValidoParaFundar(ctx, t.hex)) {
      if (p.reclamar) ctx.hacer({ tipo: "reclamar", tropa: id });
      return;
    }
    const objetivo = objetivoCampesino(ctx, t, fundarAhora);
    if (!objetivo) { if (p.reclamar && t.hex) ctx.hacer({ tipo: "reclamar", tropa: id }); return; }
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

  function sitioValidoParaFundar(ctx, hex) {
    const { datos, yo } = ctx; const estado = ctx.estado;
    const h = estado.mapa.hexes[hex];
    if (!h || h.construccion || (h.dueno != null && h.dueno !== yo)) return false;
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
      if (quieroFundar && !h.construccion && (h.dueno == null || h.dueno === yo)) {
        if (!asents.every(a => H().distancia(a, k) >= datos.asentamientos.pueblo.distanciaMinima)) continue;
        if (!asents.some(a => estado.asentamientos[a].dueno === yo && H().distancia(a, k) <= 4)) continue;
        const yac = H().anillo(k, 2).filter(x => estado.mapa.hexes[x] && estado.mapa.hexes[x].yacimiento && estado.mapa.hexes[x].dueno !== yo).length
          + H().anillo(k, 2).filter(x => estado.mapa.hexes[x] && estado.mapa.hexes[x].yacimiento && estado.mapa.hexes[x].dueno === yo).length * 0.5;
        if (yac < 1) continue;
        cand.push({ hex: k, v: (30 + yac * 10) * ctx.perso.pesoFundar });
      }
    }
    let mejor = null, mejorV = -Infinity;
    for (const c of cand) {
      const d = H().distancia(pos, c.hex); if (d === 0) continue;
      const v = c.v - d * 4;
      if (v > mejorV) { mejorV = v; mejor = c.hex; }
    }
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
      if (j.humano || j.remoto || j.barbaros) continue;
      j.personalidad = j.esJefe || dificultad === "dificil" ? "implacable" : g.elegir(persos);
      j.hucha.oro = Math.round((j.hucha.oro || 0) * ay.oro);
      if (ay.porTurno) j.oroPorTurno = ay.porTurno;
    }
  }

  return { jugar, PERSONALIDADES, DIFICIL, NIVELES, SUSTITUYE, AYUDAS, prepararRivales };
})();

// El cerebro juega las tres dificultades; la fácil de antes (ia/tonta.js) queda solo para el tutorial.
// FWM.iaNormal queda como nombre del cerebro para quien lo use (app.js sortea sus PERSONALIDADES).
FWM.ias = FWM.ias || {};
FWM.ias.facil = (e, d, o) => FWM.cerebro.jugar(e, d, Object.assign({}, o || {}, { nivel: "facil" }));
FWM.ias.normal = (e, d, o) => FWM.cerebro.jugar(e, d, Object.assign({}, o || {}, { nivel: (o && o.dificil) ? "dificil" : undefined }));
FWM.ias.dificil = (e, d, o) => FWM.cerebro.jugar(e, d, Object.assign({}, o || {}, { nivel: "dificil" }));
FWM.iaNormal = FWM.cerebro;
