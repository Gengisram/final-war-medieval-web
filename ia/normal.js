// IA "Normal": objetivos de reino, plan económico, defensa reactiva, asedio con escolta.
// Solo usa FWM.motor.aplicar / accionesPosibles / prever; nunca toca el estado a mano.
window.FWM = window.FWM || {};

FWM.iaNormal = (function () {
  const H = () => FWM.hex, E = () => FWM.estado, S = () => FWM.stats, M = () => FWM.motor;
  const MAX_ACCIONES = 400;
  const ORDEN_TEC = ["agricultura", "milicia", "arqueria", "canteria", "fortificacion", "maquinaria", "catapulta", "caballeria"];

  // Personalidades: mismos reflejos, distintos umbrales.
  // radioAmenaza: a qué distancia de un asentamiento un enemigo cuenta como amenaza.
  // radioYac: lo mismo alrededor de los yacimientos propios.
  // factorListo: cuánta ventaja necesita para lanzar un asalto. tope: mantenimiento / ingresos.
  // fundarBase: cuántos asentamientos quiere al principio (crece con los turnos).
  // pesoFundar: cuánto pesa fundar frente a reclamar yacimientos. intrusos: si sale a cazar tropas que se acercan.
  const PERSONALIDADES = {
    equilibrada:   { nombre: "equilibrada",   radioAmenaza: 4, radioYac: 2, factorListo: 1.3, tope: 0.6,  guarnicionMinima: 0, agresividad: 0,   fundarBase: 3, pesoFundar: 1.0, intrusos: false, militarPronto: false },
    guardiana:     { nombre: "guardiana",     radioAmenaza: 5, radioYac: 3, factorListo: 1.8, tope: 0.55, guarnicionMinima: 1, agresividad: -10, fundarBase: 2, pesoFundar: 0.6, intrusos: true,  militarPronto: false },
    expansionista: { nombre: "expansionista", radioAmenaza: 3, radioYac: 1, factorListo: 1.4, tope: 0.6,  guarnicionMinima: 0, agresividad: -5,  fundarBase: 5, pesoFundar: 1.6, intrusos: false, militarPronto: false },
    belicosa:      { nombre: "belicosa",      radioAmenaza: 4, radioYac: 2, factorListo: 1.0, tope: 0.72, guarnicionMinima: 0, agresividad: 15,  fundarBase: 3, pesoFundar: 0.8, intrusos: true,  militarPronto: true },
  };

  // Difícil (6 sep 2026): una sola personalidad, "implacable", fuera del sorteo de las normales. Además de los umbrales,
  // ctx.dificil activa reflejos extra: va a por el humano, caza al héroe rival herido, pisa los puntos clave y minas libres,
  // recluta hasta un tope más alto y solo deja guarnición mínima en la capital.
  const DIFICIL = { nombre: "implacable", radioAmenaza: 4, radioYac: 2, factorListo: 1.15, tope: 0.78, guarnicionMinima: 1, agresividad: 8, fundarBase: 3, pesoFundar: 1.0, intrusos: true, militarPronto: true };

  function jugar(estado, datos, opciones) {
    opciones = opciones || {};
    const jug = estado.jugadores[estado.jugadorActivo];
    const dificil = !!opciones.dificil || jug.personalidad === "implacable";
    const perso = dificil ? DIFICIL : (PERSONALIDADES[(opciones.personalidad || jug.personalidad || "equilibrada")] || PERSONALIDADES.equilibrada);
    const ctx = { estado, datos, yo: estado.jugadorActivo, acciones: 0, eventos: [], asignaciones: {}, perso, dificil };
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
      analizar(ctx);
      investigar(ctx);
      economia(ctx);
      elegirObjetivos(ctx);
      reclutar(ctx);
      analizar(ctx);
      elegirObjetivos(ctx);
      if (opciones.alObjetivo) opciones.alObjetivo(ctx.analisis, ctx.estado);
      moverTropas(ctx);
    }
    ctx.hacer({ tipo: "finTurno" });
    return { estado: ctx.estado, eventos: ctx.eventos };
  }

  // ---------- análisis ----------

  function poderTropa(estado, datos, t) {
    const vmax = S().vidaMax(estado, datos, t);
    return S().statTropa(estado, datos, t, "ataque") * Math.max(0.2, t.vida / vmax) + S().statTropa(estado, datos, t, "defensa") * 0.5 + t.vida * 0.3;
  }

  function analizar(ctx) {
    const { datos, yo } = ctx; const estado = ctx.estado;
    const a = ctx.analisis = {};
    a.mios = E().asentamientosDe(estado, yo);
    a.tropas = E().tropasDe(estado, yo);
    a.enemigosAsent = Object.entries(estado.asentamientos).filter(([, s]) => s.dueno !== yo && !estado.jugadores[s.dueno].eliminado).map(([hex, s]) => ({ hex, a: s }));
    a.enemigosTropas = Object.values(estado.tropas).filter(t => t.dueno !== yo);
    a.resumen = FWM.economia.resumen(estado, datos, yo);
    a.ingresoOro = a.resumen.ingresos.oro || 0;
    a.gasto = a.resumen.gasto;
    // amenaza por asentamiento propio (radio según personalidad)
    a.amenazas = {};
    const radio = ctx.perso.radioAmenaza;
    for (const { hex, s } of a.mios.map(x => ({ hex: x.hex, s: x.a }))) {
      let enemigo = 0;
      for (const t of a.enemigosTropas) {
        const p = E().posicionTropa(estado, t);
        if (p && H().distancia(p, hex) <= radio) enemigo += poderTropa(estado, datos, t) / (1 + H().distancia(p, hex) * 0.3);
      }
      let propio = 0;
      for (const id of s.guarnicion) { const g = estado.tropas[id]; if (g) propio += poderTropa(estado, datos, g) + S().propAsentamiento(estado, datos, s, "plusDefensa"); }
      // peligro: hay enemigo cerca y la guarnición no lo cubre; sin enemigo cerca, la guarnición puede estar vacía
      a.amenazas[hex] = { enemigo, propio, peligro: enemigo > 0 && enemigo > propio * 0.8 };
    }
    a.fase = estado.turno < 12 ? "apertura" : estado.turno < 40 ? "medio" : "tarde";
    a.militares = a.tropas.filter(t => !datos.tropas[t.tipo].puedeFundar);
    // recursos: los míos (y si están amenazados), los del enemigo, los libres
    a.yacMios = []; a.yacAmenazados = []; a.yacEnemigos = []; a.yacLibres = [];
    for (const [k, h] of Object.entries(estado.mapa.hexes)) {
      if (!h.yacimiento) continue;
      if (h.dueno === yo) {
        a.yacMios.push(k);
        let enemigo = 0;
        for (const t of a.enemigosTropas) { const p = E().posicionTropa(estado, t); if (p && H().distancia(p, k) <= ctx.perso.radioYac) enemigo += poderTropa(estado, datos, t); }
        if (enemigo > 0) a.yacAmenazados.push({ hex: k, enemigo });
      } else if (h.dueno == null) a.yacLibres.push(k);
      else if (!estado.jugadores[h.dueno].eliminado) a.yacEnemigos.push(k);
    }
    // yacimientos robados: del enemigo pero pegados a mi casa (a 2 o menos de un asentamiento mío)
    a.yacRobados = a.yacEnemigos.filter(k => a.mios.some(m => H().distancia(m.hex, k) <= 2));
    // intrusos: tropas enemigas cerca de mis asentamientos o yacimientos
    a.intrusos = a.enemigosTropas.filter(t => {
      const p = E().posicionTropa(estado, t); if (!p) return false;
      return a.mios.some(m => H().distancia(m.hex, p) <= ctx.perso.radioAmenaza) || a.yacMios.some(k => H().distancia(k, p) <= ctx.perso.radioYac);
    }).map(t => ({ tropa: t, hex: E().posicionTropa(estado, t) }));
  }

  // ---------- investigación ----------

  function investigar(ctx) {
    const j = ctx.estado.jugadores[ctx.yo];
    if (j.investigando) return;
    let orden = ORDEN_TEC.slice();
    // si el enemigo tiene castillos o ciudades cerca, priorizar asedio
    const murallasFuertes = ctx.analisis.enemigosAsent.some(x => x.a.tipo !== "pueblo");
    if (murallasFuertes && !S().tieneTec(j, "catapulta")) orden = ["agricultura", "milicia", "maquinaria", "catapulta"].concat(orden);
    for (const id of orden) {
      if (!S().tecDisponible(ctx.estado, ctx.datos, j, id)) continue;
      if (ctx.hacer({ tipo: "investigar", tec: id })) return;
    }
  }

  // ---------- economía ----------

  function economia(ctx) {
    const { datos, yo } = ctx; const A = ctx.analisis;
    const j = () => ctx.estado.jugadores[yo];
    // mejorar pueblo -> ciudad (la capital primero) si queda colchón
    const orden = A.mios.slice().sort((x, y) => (y.hex === j().capital) - (x.hex === j().capital));
    for (const { hex, a } of orden) {
      if (a.tipo !== "pueblo") continue;
      const coste = datos.asentamientos.ciudad.coste;
      if ((j().hucha.oro || 0) < (coste.oro || 0) + 15) continue;
      ctx.hacer({ tipo: "mejorarAsentamiento", asentamiento: hex });
    }
    // castillo: junto al asentamiento más amenazado o más cercano al enemigo
    const castillos = A.mios.filter(x => x.a.tipo === "castillo").length;
    const quiero = A.fase === "apertura" ? 0 : Math.max(1, Math.floor((A.mios.length - castillos) / 2));
    const costeCastillo = S().costeAsentamiento(ctx.estado, datos, yo, "castillo");
    if (castillos < quiero && FWM.util.puedePagar(j().hucha, Object.assign({}, costeCastillo, { oro: (costeCastillo.oro || 0) + 20 }))) {
      // lo construye un campesino: el que esté (o pueda ponerse) junto al asentamiento más amenazado
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

  // ---------- objetivos ----------

  function elegirObjetivos(ctx) {
    const { datos, yo } = ctx; const A = ctx.analisis; const estado = ctx.estado;
    A.objetivoAtaque = null;
    if (!A.enemigosAsent.length) return;
    // fuerza total militar disponible (no acuartelada en sitio amenazado)
    let mejor = null, mejorV = -Infinity;
    for (const x of A.enemigosAsent) {
      const guarn = x.a.guarnicion.map(id => estado.tropas[id]).filter(Boolean);
      const defensa = guarn.reduce((s, g) => s + poderTropa(estado, datos, g) + (x.a.integridad > 0 ? S().propAsentamiento(estado, datos, x.a, "plusDefensa") : 0), 0);
      const dist = Math.min(...A.mios.map(m => H().distancia(m.hex, x.hex)), 99);
      // lo que vale: su oro por turno y los yacimientos enemigos que tiene alrededor
      const oro = S().produccionAsentamiento(estado, datos, x.a).oro || 0;
      const yacCerca = H().anillo(x.hex, 2).filter(k => estado.mapa.hexes[k] && estado.mapa.hexes[k].yacimiento && estado.mapa.hexes[k].dueno === x.a.dueno).length;
      const humano = estado.jugadores[x.a.dueno] && estado.jugadores[x.a.dueno].humano;
      const valor = 20 + oro * 6 + yacCerca * 8 + (x.a.tipo === "castillo" ? -10 : 0) + (guarn.length === 0 ? 80 : 0) + (ctx.dificil && humano ? 30 : 0);
      const v = valor - defensa * 0.6 - dist * 6 - (x.a.integridad > 60 && !A.tropas.some(t => t.tipo === "catapulta") ? 40 : 0);
      if (v > mejorV) { mejorV = v; mejor = { hex: x.hex, a: x.a, defensa, guarn: guarn.length, dist }; }
    }
    if (!mejor) return;
    const fuerza = A.militares.reduce((s, t) => s + poderTropa(estado, datos, t), 0);
    // necesita superar la defensa con margen; sin guarnición basta con llegar
    mejor.necesita = mejor.guarn === 0 ? 1 : Math.max(2, Math.ceil(mejor.defensa / 40) + (mejor.a.integridad > 0 ? 1 : 0));
    mejor.listo = mejor.guarn === 0 || fuerza >= mejor.defensa * ctx.perso.factorListo;
    // punto de reunión: mi asentamiento más cercano al objetivo
    const cercano = A.mios.slice().sort((p, q) => H().distancia(p.hex, mejor.hex) - H().distancia(q.hex, mejor.hex))[0];
    mejor.reunion = cercano ? cercano.hex : (A.tropas.length ? E().posicionTropa(estado, A.tropas[0]) : mejor.hex);
    if (!cercano) mejor.listo = true; // sin asentamientos: a por todas
    A.objetivoAtaque = mejor;
  }

  // ---------- reclutar ----------

  function reclutar(ctx) {
    const { datos, yo } = ctx;
    for (const { hex, a } of ctx.analisis.mios) {
      // varias tropas por asentamiento no se puede: una por turno
      const estado = ctx.estado; const A = ctx.analisis;
      const j = estado.jugadores[yo];
      const tropas = E().tropasDe(estado, yo);
      const campesinos = tropas.filter(t => t.tipo === "campesino").length;
      const nAsent = A.mios.length;
      const res = FWM.economia.resumen(estado, datos, yo);
      const ingreso = res.ingresos.oro || 0, gasto = res.gasto;
      const def = datos.asentamientos[a.tipo];
      const opciones = Object.keys(datos.tropas).filter(t => !datos.tropas[t].noReclutable && (def.recluta.includes("*") || def.recluta.includes(t)) && datos.tropas[t].requiere.every(r => S().tieneTec(j, r)) && (!datos.tropas[t].nivelHeroe || (j.heroe && (j.heroe.nivel || 1) >= datos.tropas[t].nivelHeroe)));
      // tope de mantenimiento: 60% de los ingresos; las catapultas necesarias pueden llegar al 85%
      const cabe = (tipo, tope) => (gasto + datos.tropas[tipo].mantenimiento) <= Math.max(2, ingreso * (tope || 0.6)) && (j.hucha.oro || 0) - (datos.tropas[tipo].coste.oro || 0) >= 5 && FWM.util.puedePagar(j.hucha, datos.tropas[tipo].coste);
      let deseo = null;
      const amenaza = A.amenazas[hex];
      const quieroFundar = nAsent < ctx.perso.fundarBase + Math.floor(estado.turno / 15);
      const campesinosLibres = tropas.filter(t => t.tipo === "campesino" && !t.acuarteladaEn).length;
      if (amenaza && amenaza.peligro && a.guarnicion.length < S().propAsentamiento(estado, datos, a, "huecosGuarnicion")) {
        deseo = ["lancero", "arquero", "caballero", "campesino"];
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
        else deseo = [contraEnemigo(ctx), "lancero", "caballero", "arquero"];
        deseo.push("campesino");
      } else {
        deseo = ["lancero", "arquero", "campesino"];
      }
      // con el héroe de nivel alto, primero la versión pesada de cada unidad; si no cabe, la básica de siempre
      const PESADAS = { lancero: "infanteria_pesada", alabardero: "infanteria_pesada", espadachin: "infanteria_pesada", caballero: "caballeria_pesada", catapulta: "trabuco", arquero: "ballestero" };
      deseo = deseo.reduce((lista, t) => { if (PESADAS[t] && !lista.includes(PESADAS[t])) lista.push(PESADAS[t]); lista.push(t); return lista; }, []);
      // con mucho oro parado, gastar más en ejército
      const topeBase = (j.hucha.oro || 0) > 150 ? 0.85 : (j.hucha.oro || 0) > 80 ? ctx.perso.tope + 0.12 : ctx.perso.tope;
      for (const tipo of deseo) {
        const necesaria = tipo === "catapulta" && deseo[0] === "catapulta";
        if (!opciones.includes(tipo) || !cabe(tipo, necesaria ? 0.9 : topeBase)) continue;
        if (tipo === "campesino" && campesinos >= 3 + nAsent) continue;
        if (ctx.hacer({ tipo: "reclutar", asentamiento: hex, que: tipo })) break;
      }
    }
  }

  // ---------- movimiento ----------

  // Coste en puntos desde cada hexágono hasta el destino (Dijkstra con terreno y carreteras).
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

  // La tropa que mejor responde a lo que más tiene el enemigo (espada > lanza > caballo > espada).
  function contraEnemigo(ctx) {
    const cuenta = {};
    for (const t of ctx.analisis.enemigosTropas) cuenta[t.tipo] = (cuenta[t.tipo] || 0) + 1;
    const mas = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0];
    if (!mas) return "lancero";
    return { lancero: "espadachin", espadachin: "caballero", caballero: "lancero", arquero: "caballero", campesino: "espadachin", catapulta: "caballero" }[mas[0]] || "lancero";
  }

  function moverTropas(ctx) {
    const { datos, yo } = ctx;
    const A = ctx.analisis;
    // orden: arqueros (disparan sin contraataque), luego cuerpo a cuerpo, campesinos, catapultas al final
    // arqueros primero (matan sin contraataque), luego caballería (llega y entra), infantería, campesinos, catapultas
    const prioridad = (t) => datos.tropas[t.tipo].disparaSinMover ? 4 : datos.tropas[t.tipo].puedeFundar ? 3 : datos.tropas[t.tipo].stats.alcance > 0 ? 0 : datos.tropas[t.tipo].stats.movimiento > 1 ? 1 : 2;
    const ids = A.tropas.slice().sort((x, y) => prioridad(x) - prioridad(y)).map(t => t.id);
    for (const id of ids) {
      const t = ctx.estado.tropas[id];
      if (!t || t.accionUsada) continue;
      if (datos.tropas[t.tipo].puedeFundar) actuarCampesino(ctx, id);
      else actuarMilitar(ctx, id);
    }
  }

  function enemigoAdyacente(estado, t, yo) {
    const pos = E().posicionTropa(estado, t);
    return H().vecinos(pos).some(v => { const x = E().tropaEn(estado, v); return x && x.dueno !== yo; });
  }

  function intentarAtaque(ctx, id, agresivo) {
    const { datos } = ctx; const estado = ctx.estado; const t = estado.tropas[id];
    const p = M().accionesPosibles(estado, datos, id);
    const def = datos.tropas[t.tipo];
    // catapulta: asediar murallas si hay; si no, disparar a tropas
    if (def.disparaSinMover) {
      const obj = p.asediar.find(h => estado.asentamientos[h].integridad > 0) || null;
      if (obj) return ctx.hacer({ tipo: "asediar", tropa: id, objetivo: obj });
    }
    // al pie del objetivo con el grupo listo: golpear siempre, sin remilgos (salvo suicidio)
    const o = ctx.analisis.objetivoAtaque;
    if (agresivo && o && o.listo) {
      const asent = estado.asentamientos[o.hex];
      if (p.atacar.includes(o.hex)) {
        const pv = M().prever(estado, datos, id, o.hex);
        const suicidio = pv && pv.recibes && pv.recibes[1] >= t.vida;
        if (pv && !suicidio && (def.stats.alcance > 0 || asent.integridad === 0 || pv.haces[0] >= pv.vidaDefensor)) return ctx.hacer({ tipo: "atacar", tropa: id, objetivo: o.hex });
      }
      if (p.asediar.includes(o.hex) && asent.integridad > 0 && def.stats.asedio > 0) {
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
    for (const o of p.atacar) {
      const pv = M().prever(estado, datos, id, o);
      if (!pv) continue;
      const haces = (pv.haces[0] + pv.haces[1]) / 2, recibes = pv.recibes ? (pv.recibes[0] + pv.recibes[1]) / 2 : 0;
      const esHeroe = !!(pv.defensor && datos.tropas[pv.defensor.tipo] && datos.tropas[pv.defensor.tipo].heroe);
      const mata = pv.haces[0] >= pv.vidaDefensor ? (ctx.dificil ? 80 : 60) + (esHeroe ? 80 : 0) : (ctx.dificil && esHeroe ? 20 : 0); // el héroe rival vale 10 puntos: a por él
      const muero = pv.recibes && pv.recibes[1] >= t.vida ? -120 : 0;
      const guarn = pv.asentamiento ? (pv.asentamiento.integridad > 0 && def.stats.alcance === 0 ? -15 : 10) : 0;
      const punt = haces - recibes * (agresivo ? 0.7 : 1.1) + mata + muero + guarn + ctx.perso.agresividad;
      if (punt > mejorPunt) { mejorPunt = punt; mejor = o; }
    }
    if (mejor && mejorPunt > (agresivo ? -20 : 0)) return ctx.hacer({ tipo: "atacar", tropa: id, objetivo: mejor });
    // asedio cuerpo a cuerpo solo si no hay guarnición que responda o es el objetivo y hay brecha cercana
    if (p.asediar.length && def.stats.asedio >= 30) return ctx.hacer({ tipo: "asediar", tropa: id, objetivo: p.asediar[0] });
    if (p.asediar.length && agresivo) {
      const o = p.asediar[0]; const asent = estado.asentamientos[o];
      // con escaleras: si hay brecha cercana, o si somos varios al pie de la muralla (asalto en grupo)
      const aliados = H().vecinos(o).filter(v => { const x = E().tropaEn(estado, v); return x && x.dueno === t.dueno; }).length;
      if (asent.guarnicion.length === 0 || asent.integridad <= 20 || (aliados >= 2 && t.vida >= S().vidaMax(estado, datos, t) * 0.5)) return ctx.hacer({ tipo: "asediar", tropa: id, objetivo: o });
    }
    return false;
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
    if (t.acuarteladaEn) opciones.avanzarIgual = true; // salir de la guarnición siempre es progreso
    for (const h of cand) {
      if (dist[h] == null) continue;
      const hx = estado.mapa.hexes[h];
      if (hx.construccion === "asentamiento" && estado.asentamientos[h].dueno === yo && h !== destino) continue;
      // mantener distancia mínima (arqueros, catapultas)
      if (opciones.distanciaMin && distMinEnemigo(ctx, h) < opciones.distanciaMin) continue;
      // catapulta: solo a hexágonos con escolta propia al lado
      if (opciones.escolta && !H().vecinos(h).some(v => { const x = E().tropaEn(estado, v); return x && x.dueno === yo && !datos.tropas[x.tipo].disparaSinMover; })) continue;
      if (dist[h] < mejorD || (dist[h] === mejorD && opciones.avanzarIgual)) { mejorD = dist[h]; mejor = h; }
    }
    if (!mejor) return false;
    return ctx.hacer({ tipo: "mover", tropa: id, a: mejor });
  }

  function distMinEnemigo(ctx, hex) {
    let d = 99;
    for (const t of ctx.analisis.enemigosTropas) { const p = E().posicionTropa(ctx.estado, t); if (p) d = Math.min(d, H().distancia(p, hex)); }
    for (const x of ctx.analisis.enemigosAsent) if (x.a.guarnicion.length) d = Math.min(d, H().distancia(x.hex, hex));
    return d;
  }

  function actuarMilitar(ctx, id) {
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
    if (def.cura) {
      const aliados = E().tropasDe(estado, yo).filter(x => x.id !== id && x.hex && !datos.tropas[x.tipo].cura && !datos.tropas[x.tipo].puedeFundar);
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
      if (!esCat && amenaza && (amenaza.peligro || (amenaza.enemigo > 0 && a.guarnicion.length <= 1))) return;
      const minima = ctx.dificil ? (t.acuarteladaEn === estado.jugadores[yo].capital ? 1 : 0) : ctx.perso.guarnicionMinima;
      if (!esCat && a.guarnicion.length <= minima) return;
    }

    // 2. defensa: si un asentamiento mío está en peligro y estoy cerca, ir a él
    const peligrosos = A.mios.filter(m => A.amenazas[m.hex] && A.amenazas[m.hex].peligro && m.a.guarnicion.length < S().propAsentamiento(estado, datos, m.a, "huecosGuarnicion"));
    const pos = E().posicionTropa(estado, t);
    const cerca = peligrosos.filter(m => H().distancia(m.hex, pos) <= 4).sort((p, q) => H().distancia(p.hex, pos) - H().distancia(q.hex, pos))[0];
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
    if (!esCat && yacDefender.length) {
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

  const dbg = (...a) => { if (FWM.iaNormal && FWM.iaNormal.depurar) console.log("[ia]", ...a); };

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
      // sin enemigo cerca, el campesino sale a explorar y reclamar desde el turno 1
      if (amenaza && amenaza.enemigo > 0 && a.guarnicion.length <= 1) return;
      // la guarnición mínima de la personalidad defensiva no vale en la apertura: el primer campesino sale siempre
      if (estado.turno > 8 && a.guarnicion.length <= ctx.perso.guarnicionMinima) return;
    }
    // defender o recuperar un yacimiento cercano si no hay soldados que lo hagan (la guardiana siempre)
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
    // asentamiento mío en peligro y vacío cerca: entrar a guarnecerlo
    const vacioEnPeligro = A.mios.filter(m => A.amenazas[m.hex] && A.amenazas[m.hex].peligro && m.a.guarnicion.length === 0)
      .map(m => ({ hex: m.hex, d: H().distancia(m.hex, E().posicionTropa(estado, t)) })).filter(x => x.d <= 3).sort((p, q) => p.d - q.d)[0];
    if (vacioEnPeligro && moverHacia(ctx, id, vacioEnPeligro.hex)) return;
    const p = M().accionesPosibles(estado, datos, id);
    if (p.fundar && quieroFundar) { ctx.hacer({ tipo: "fundar", tropa: id }); return; }
    if (p.reclamar && t.hex && estado.mapa.hexes[t.hex].yacimiento) { ctx.hacer({ tipo: "reclamar", tropa: id }); return; }
    // enemigo al lado: no vagar; atacar si conviene o retirarse hacia casa
    if (enemigoAdyacente(estado, t, yo) && intentarAtaque(ctx, id, false)) return;
    // ¿puedo pagar una fundación pronto? Si no, no esperar parado: ir a por recursos
    const j = estado.jugadores[yo];
    const neto = A.ingresoOro - A.gasto;
    const oroPronto = (j.hucha.oro || 0) + Math.max(0, neto) * 2 >= (datos.asentamientos.pueblo.coste.oro || 0);
    const fundarAhora = quieroFundar && oroPronto;
    // si estoy en un sitio válido para fundar y el oro llega en un par de turnos, esperar reclamando
    if (quieroFundar && oroPronto && !p.fundar && t.hex && sitioValidoParaFundar(ctx, t.hex)) {
      if (p.reclamar) ctx.hacer({ tipo: "reclamar", tropa: id });
      return;
    }
    const objetivo = objetivoCampesino(ctx, t, fundarAhora);
    dbg("campesino", id, "pos", E().posicionTropa(estado, t), "objetivo", objetivo, "fundarAhora", fundarAhora, "mover", Object.keys(p.mover).length);
    if (!objetivo) { if (p.reclamar && t.hex) ctx.hacer({ tipo: "reclamar", tropa: id }); return; }
    // si el camino directo lo tapa una tropa propia, vale un paso lateral (avanzarIgual)
    const movio = moverHacia(ctx, id, objetivo, { avanzarIgual: true });
    dbg("  moverHacia ->", movio);
    if (movio) {
      estado = ctx.estado; t = estado.tropas[id];
      if (!t || t.accionUsada) return;
      const p2 = M().accionesPosibles(estado, datos, id);
      if (p2.fundar && fundarAhora) { ctx.hacer({ tipo: "fundar", tropa: id }); return; }
      // reclamar siempre por donde pasa (pasillos enteros), salvo con enemigo al lado
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

  // Con oro de sobra, mejorar la tropa acuartelada en una ciudad.
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
        // el oro primero; lo libre antes que lo enemigo
        const esOro = (datos.yacimientos[h.yacimiento].produce.oro || 0) > 0;
        cand.push({ hex: k, v: (esOro ? 60 : 40) - (h.dueno == null ? 0 : 15) });
      }
      if (quieroFundar && !h.construccion && (h.dueno == null || h.dueno === yo)) {
        if (!asents.every(a => H().distancia(a, k) >= datos.asentamientos.pueblo.distanciaMinima)) continue;
        if (!asents.some(a => estado.asentamientos[a].dueno === yo && H().distancia(a, k) <= 4)) continue;
        // fundar pegado a yacimientos, no en cualquier sitio
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

  return { jugar, PERSONALIDADES, DIFICIL, depurar: false };
})();

// Registro de IAs por dificultad.
FWM.ias = FWM.ias || {};
FWM.ias.facil = (e, d, o) => FWM.ia.jugar(e, d, o);
FWM.ias.normal = (e, d, o) => FWM.iaNormal.jugar(e, d, o);
FWM.ias.dificil = (e, d, o) => FWM.iaNormal.jugar(e, d, Object.assign({}, o || {}, { dificil: true }));
