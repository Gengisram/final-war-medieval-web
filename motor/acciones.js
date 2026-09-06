// Acciones del juego. Cada una tiene validar(estado, datos, accion) -> null | "error"
// y ejecutar(estado, datos, accion) -> eventos[]. ejecutar asume que validar pasó.
// El motor clona el estado antes de ejecutar; aquí se muta la copia.
window.FWM = window.FWM || {};

FWM.acciones = (function () {
  const H = () => FWM.hex, E = () => FWM.estado, S = () => FWM.stats, T = () => FWM.territorio,
    U = () => FWM.util, C = () => FWM.combate, Ec = () => FWM.economia;

  // ---------- utilidades comunes ----------

  function tropaPropia(estado, accion) {
    const t = estado.tropas[accion.tropa];
    if (!t) return { error: "no_hay_objetivo" };
    if (t.dueno !== estado.jugadorActivo) return { error: "no_es_tuya" };
    if (t.accionUsada) return { error: "sin_accion" };
    return { t };
  }

  function asentPropio(estado, hex) {
    const a = estado.asentamientos[hex];
    if (!a || a.dueno !== estado.jugadorActivo) return null;
    return a;
  }

  function huecosLibres(estado, datos, hex) {
    const a = estado.asentamientos[hex];
    return S().propAsentamiento(estado, datos, a, "huecosGuarnicion") - a.guarnicion.length;
  }

  // Coste de entrar en un hexágono para una tropa (movimiento).
  // Coste en puntos de entrar en un hexágono (terreno, o carretera/asentamiento).
  function costeTerreno(estado, datos, v) {
    const h = estado.mapa.hexes[v];
    if (!h) return null;
    const coste = datos.terrenos[h.terreno].costeMovimiento;
    if (coste == null) return null;
    if ((h.carretera || h.construccion === "asentamiento") && datos.reglas && datos.reglas.carretera) return Math.min(coste, datos.reglas.carretera.costeMovimiento);
    return coste;
  }

  function costeEntrar(estado, datos, tropa, v) {
    const h = estado.mapa.hexes[v];
    if (!h) return null;
    const coste = costeTerreno(estado, datos, v);
    if (coste == null) return null;
    if (E().tropaEn(estado, v)) return null;
    if (h.construccion === "asentamiento") {
      const a = estado.asentamientos[v];
      if (a.dueno === tropa.dueno) return huecosLibres(estado, datos, v) > 0 ? coste : null;
      return a.guarnicion.length === 0 && a.integridad <= 0 ? coste : null; // conquista andando: sin guarnición y con brecha
    }
    return coste;
  }

  function alcanzablesDe(estado, datos, tropa) {
    const origen = E().posicionTropa(estado, tropa);
    const r = H().alcanzables(origen, tropa.movRestante,
      v => costeEntrar(estado, datos, tropa, v),
      v => estado.mapa.hexes[v].construccion === "asentamiento");
    // Regla "un paso más": mientras queden puntos, siempre se puede entrar en un hexágono vecino
    // aunque cueste más de lo que queda (se gasta todo). Vale desde el origen y desde cualquier hexágono alcanzado.
    const desdeDonde = [origen].concat(Object.keys(r).filter(k => estado.mapa.hexes[k].construccion !== "asentamiento"));
    for (const k of desdeDonde) {
      const gastado = k === origen ? 0 : r[k].coste;
      const queda = tropa.movRestante - gastado;
      if (queda <= 0) continue;
      for (const v of H().vecinos(k)) {
        const c = costeEntrar(estado, datos, tropa, v);
        if (c == null || c <= queda) continue; // si cabe, ya lo tiene el cálculo normal
        if (r[v] && r[v].coste <= tropa.movRestante) continue;
        r[v] = { coste: tropa.movRestante, desde: k };
      }
    }
    return r;
  }

  function sacarDeGuarnicion(estado, tropa) {
    if (!tropa.acuarteladaEn) return;
    const a = estado.asentamientos[tropa.acuarteladaEn];
    if (a) a.guarnicion = a.guarnicion.filter(id => id !== tropa.id);
    tropa.acuarteladaEn = null;
  }

  function meterEnGuarnicion(estado, tropa, hex) {
    tropa.hex = null;
    tropa.acuarteladaEn = hex;
    estado.asentamientos[hex].guarnicion.push(tropa.id);
  }

  function conquistar(estado, datos, hex, jugadorId, tropa, eventos) {
    const a = estado.asentamientos[hex];
    const antiguo = a.dueno;
    const botin = a.huchaLocal;
    a.huchaLocal = null;
    a.dueno = jugadorId;
    a.tipo = datos.asentamientos[a.tipo].alConquistar;
    a.guarnicion = [];
    a.reclutadoEsteTurno = true;
    a.integridad = Math.min(a.integridad, S().propAsentamiento(estado, datos, a, "integridad"));
    estado.mapa.hexes[hex].dueno = jugadorId;
    const j = estado.jugadores[jugadorId];
    if (!j.capital || !estado.asentamientos[j.capital] || estado.asentamientos[j.capital].dueno !== jugadorId) j.capital = hex;
    if (botin) U().ingresar(T().huchaDe(estado, datos, jugadorId, hex), botin);
    if (tropa) { sacarDeGuarnicion(estado, tropa); meterEnGuarnicion(estado, tropa, hex); }
    T().revisarCapital(estado, datos, antiguo);
    eventos.push({ tipo: "conquista", jugador: jugadorId, asentamiento: a.nombre, hex, antiguo });
    FWM.ganchos.avisar("alConquistar", estado, { datos, hex, jugadorId, antiguo });
  }

  function distanciaAtaque(estado, tropa, objetivo) {
    return H().distancia(E().posicionTropa(estado, tropa), objetivo);
  }

  // Comprueba alcance y condiciones de disparo. Devuelve error o null.
  function validarAlcance(estado, datos, tropa, objetivo) {
    const def = datos.tropas[tropa.tipo];
    const alcance = S().statTropa(estado, datos, tropa, "alcance");
    const d = distanciaAtaque(estado, tropa, objetivo);
    if (alcance === 0) {
      if (tropa.acuarteladaEn && !(datos.reglas && datos.reglas.salidaDesdeGuarnicion)) return "no_desde_dentro";
      if (d !== 1) return "fuera_de_alcance";
    } else {
      if (d < 1 || d > alcance) return "fuera_de_alcance";
      if (def.disparaSinMover && tropa.movRestante < S().statTropa(estado, datos, tropa, "movimiento")) return "catapulta_movida";
    }
    return null;
  }

  // Objetivo de un ataque en un hexágono: { tropa, asentamiento } o null.
  function objetivoEn(estado, datos, jugadorId, hex) {
    const t = E().tropaEn(estado, hex);
    if (t && t.dueno !== jugadorId) return { tropa: t, asentamiento: null };
    const a = estado.asentamientos[hex];
    if (a && a.dueno !== jugadorId && a.guarnicion.length) {
      let mejor = null, mejorDef = -1;
      for (const id of a.guarnicion) {
        const g = estado.tropas[id];
        const d = S().statTropa(estado, datos, g, "defensa");
        if (d > mejorDef) { mejorDef = d; mejor = g; }
      }
      return { tropa: mejor, asentamiento: a, hex };
    }
    return null;
  }

  function darExperiencia(datos, tropa, puntos, estado) {
    const ex = datos.reglas && datos.reglas.experiencia; if (!ex || !tropa) return;
    if (datos.tropas[tropa.tipo].heroe) return; // el héroe no gana galones dentro de la partida
    const f = estado ? S().factorExperiencia(estado, datos, tropa.dueno) : 1;
    let extra = 0; if (estado) { const aura = S().auraSobre(estado, datos, tropa); if (aura && aura.experiencia) extra = aura.experiencia; } // Inspiración
    tropa.xp = (tropa.xp || 0) + puntos * f + extra;
  }
  // Muere una tropa en combate: cuenta bajas (y héroes) para el que mata y pérdidas para el que la pierde.
  function anotarMuerte(estado, datos, muerta, porJugador) {
    const stM = estado.estadisticas && estado.estadisticas[porJugador], stP = estado.estadisticas && estado.estadisticas[muerta.dueno];
    if (stM && datos.tropas[muerta.tipo].heroe) stM.heroesMatados = (stM.heroesMatados || 0) + 1;
    const j = estado.jugadores[muerta.dueno]; if (j && j.heroeTropa === muerta.id) { j.heroeTropa = null; j.heroeCaido = { turno: estado.turno }; }
  }

  // Un hexágono sin asentamiento pasa al que lo pisa.
  function pisar(estado, hex, jugadorId) { const h = estado.mapa.hexes[hex]; if (h && h.construccion !== "asentamiento") h.dueno = jugadorId; }
  function quitarAtrincherada(tropa) {
    if (tropa.estados && tropa.estados.length) tropa.estados = tropa.estados.filter(x => x !== "atrincherada" && x !== "dormida");
  }
  function dormida(tropa) { return !!(tropa.estados && tropa.estados.includes("dormida")); }

  // ¿Devuelve el golpe esta tropa cuando la atacan cuerpo a cuerpo? (las máquinas, no)
  function contraataca(datos, tropa) {
    const ex = (datos.reglas && datos.reglas.contraataque && datos.reglas.contraataque.excluye) || [];
    const et = datos.tropas[tropa.tipo].etiquetas || [];
    return !ex.some(e => et.includes(e));
  }
  function golpe(estado, datos, atacante, defensor, opcionesDef) {
    const bono = S().bonoContra(datos, atacante, defensor, estado);
    const atk = S().ataqueEfectivo(estado, datos, atacante) + (bono ? bono.valor : 0);
    const bonoDef = S().defensaContra(datos, atacante, defensor, estado);
    const def = S().statTropa(estado, datos, defensor, "defensa", opcionesDef) + (bonoDef ? bonoDef.valor : 0);
    const mult = C().multiplicador(datos, datos.tropas[atacante.tipo].tipoDano, datos.tropas[defensor.tipo].etiquetas);
    const tir = C().tirada(estado, datos);
    let dano = C().calcular(atk, def, tir.ajuste, datos, mult);
    dano += FWM.ganchos.modificador("antesGolpe", estado, { datos, atacante, defensor, dano });
    dano = Math.max(0, dano);
    defensor.vida -= dano;
    return { dano, ajuste: tir.ajuste };
  }

  // ---------- acciones ----------

  const acciones = {};

  acciones.mover = {
    reversible: true,
    validar(estado, datos, a) {
      const r = tropaPropia(estado, a); if (r.error) return r.error;
      const t = r.t;
      if (t.movRestante <= 0) return "sin_movimiento";
      const alc = alcanzablesDe(estado, datos, t);
      if (!alc[a.a]) return "fuera_de_alcance";
      return null;
    },
    ejecutar(estado, datos, a) {
      const eventos = [];
      const t = estado.tropas[a.tropa];
      const alc = alcanzablesDe(estado, datos, t);
      const coste = alc[a.a].coste;
      const desde = E().posicionTropa(estado, t);
      sacarDeGuarnicion(estado, t);
      quitarAtrincherada(t);
      t.movRestante -= coste;
      const h = estado.mapa.hexes[a.a];
      if (h.construccion === "asentamiento") {
        const asent = estado.asentamientos[a.a];
        if (asent.dueno === t.dueno) {
          meterEnGuarnicion(estado, t, a.a);
          t.movRestante = 0; // acuartelarse termina el movimiento
        } else {
          t.hex = null;
          conquistar(estado, datos, a.a, t.dueno, t, eventos);
          t.accionUsada = true; t.movRestante = 0;
        }
      } else {
        t.hex = a.a;
        pisar(estado, a.a, t.dueno); // pisar un hexágono lo hace tuyo (5 sep 2026: fuera el botón Reclamar)
      }
      eventos.push({ tipo: "mover", tropa: t.tipo, jugador: t.dueno, desde, a: a.a });
      FWM.ganchos.avisar("despuesMover", estado, { datos, tropa: t, desde, a: a.a });
      return eventos;
    },
  };

  acciones.reclamar = {
    reversible: true,
    validar(estado, datos, a) {
      const r = tropaPropia(estado, a); if (r.error) return r.error;
      const t = r.t;
      if (!t.hex) return "no_se_puede";
      const h = estado.mapa.hexes[t.hex];
      if (h.dueno === t.dueno) return "ya_es_tuyo";
      if (h.construccion) return "no_se_puede";
      return null;
    },
    ejecutar(estado, datos, a) {
      const t = estado.tropas[a.tropa];
      estado.mapa.hexes[t.hex].dueno = t.dueno;
      t.accionUsada = true; t.movRestante = 0;
      FWM.ganchos.avisar("alReclamar", estado, { datos, tropa: t, hex: t.hex });
      return [{ tipo: "reclamar", jugador: t.dueno, hex: t.hex }];
    },
  };

  acciones.atacar = {
    reversible: false,
    validar(estado, datos, a) {
      const r = tropaPropia(estado, a); if (r.error) return r.error;
      const t = r.t;
      const err = validarAlcance(estado, datos, t, a.objetivo); if (err) return err;
      const obj = objetivoEn(estado, datos, t.dueno, a.objetivo);
      if (!obj) return "no_hay_objetivo";
      return null;
    },
    ejecutar(estado, datos, a) {
      const eventos = [];
      const t = estado.tropas[a.tropa];
      const obj = objetivoEn(estado, datos, t.dueno, a.objetivo);
      const d = obj.tropa;
      const cuerpo = S().statTropa(estado, datos, t, "alcance") === 0;
      const salida = cuerpo && !!t.acuarteladaEn; // ataca desde dentro: se expone
      quitarAtrincherada(t);
      const ex = datos.reglas && datos.reglas.experiencia;
      const g1 = golpe(estado, datos, t, d);
      t.ultimoAtaque = estado.turno;
      eventos.push({ tipo: "ataque", atacante: t.tipo, defensor: d.tipo, dano: g1.dano, ajuste: g1.ajuste, jugador: t.dueno, hex: a.objetivo });
      if (obj.asentamiento) obj.asentamiento.atacadaEsteTurno = true;
      // fuego del alquimista: los enemigos pegados al objetivo (en campo abierto) se chamuscan
      const claseH = datos.tropas[t.tipo].heroe && datos.heroes.clases[datos.tropas[t.tipo].heroe];
      if (claseH && claseH.fuego) {
        for (const v of FWM.hex.vecinos(a.objetivo)) {
          const x = E().tropaEn(estado, v); if (!x || x.dueno === t.dueno) continue;
          x.vida -= claseH.fuego.dano; eventos.push({ tipo: "fuego", hex: v, dano: claseH.fuego.dano, defensor: x.tipo, jugador: x.dueno });
          if (x.vida <= 0) { anotarMuerte(estado, datos, x, t.dueno); Ec().eliminarTropa(estado, x); eventos.push({ tipo: "muere", tropa: x.tipo, jugador: x.dueno, hex: v, por: t.dueno }); if (ex) darExperiencia(datos, t, ex.porMuerte, estado); if (estado.estadisticas[t.dueno]) estado.estadisticas[t.dueno].matadas++; if (estado.estadisticas[x.dueno]) estado.estadisticas[x.dueno].perdidas++; }
        }
      }
      if (d.vida <= 0) {
        const eraGuarnicion = d.acuarteladaEn;
        anotarMuerte(estado, datos, d, t.dueno);
        Ec().eliminarTropa(estado, d);
        eventos.push({ tipo: "muere", tropa: d.tipo, jugador: d.dueno, hex: a.objetivo, por: t.dueno });
        if (ex) darExperiencia(datos, t, ex.porCombate + ex.porMuerte, estado);
        // cuerpo a cuerpo: al matar, avanza al hexágono del muerto y lo reclama (también saliendo de la guarnición)
        if (cuerpo) {
          if (eraGuarnicion) {
            const asent = estado.asentamientos[eraGuarnicion];
            if (asent.guarnicion.length === 0 && asent.integridad <= 0) { // sin brecha, se queda fuera
              t.hex = null;
              conquistar(estado, datos, eraGuarnicion, t.dueno, t, eventos);
            }
          } else {
            sacarDeGuarnicion(estado, t);
            t.hex = a.objetivo; pisar(estado, a.objetivo, t.dueno); // avanza y el hexágono pasa a ser suyo
          }
        }
      } else if (cuerpo && contraataca(datos, d)) {
        const g2 = golpe(estado, datos, d, t, salida ? { sinPlus: true } : null);
        eventos.push({ tipo: "contraataque", defensor: d.tipo, atacante: t.tipo, dano: g2.dano, ajuste: g2.ajuste, jugador: d.dueno });
        if (ex) darExperiencia(datos, d, ex.porCombate, estado);
        if (t.vida <= 0) {
          const hexT = E().posicionTropa(estado, t);
          anotarMuerte(estado, datos, t, d.dueno);
          Ec().eliminarTropa(estado, t);
          eventos.push({ tipo: "muere", tropa: t.tipo, jugador: t.dueno, hex: hexT, por: d.dueno });
          if (ex) darExperiencia(datos, d, ex.porMuerte, estado);
        } else if (ex) darExperiencia(datos, t, ex.porCombate, estado);
      } else if (ex) {
        darExperiencia(datos, t, ex.porCombate, estado);
        darExperiencia(datos, d, ex.porCombate, estado);
      }
      if (estado.tropas[t.id]) { t.accionUsada = true; t.movRestante = 0; }
      FWM.ganchos.avisar("despuesGolpe", estado, { datos, atacante: t, objetivo: a.objetivo });
      return eventos;
    },
  };

  acciones.asediar = {
    reversible: false,
    validar(estado, datos, a) {
      const r = tropaPropia(estado, a); if (r.error) return r.error;
      const t = r.t;
      if (S().statTropa(estado, datos, t, "asedio") <= 0) return "no_se_puede";
      const asent = estado.asentamientos[a.objetivo];
      if (!asent || asent.dueno === t.dueno) return "no_hay_objetivo";
      if (asent.integridad <= 0) return "no_se_puede";
      const err = validarAlcance(estado, datos, t, a.objetivo); if (err) return err;
      return null;
    },
    ejecutar(estado, datos, a) {
      const eventos = [];
      const t = estado.tropas[a.tropa];
      const asent = estado.asentamientos[a.objetivo];
      const tir = C().tirada(estado, datos);
      const dano = Math.max(datos.dados.combate.minimoDano, S().statTropa(estado, datos, t, "asedio") + tir.ajuste);
      quitarAtrincherada(t);
      asent.integridad = Math.max(0, asent.integridad - dano);
      asent.atacadaEsteTurno = true;
      t.accionUsada = true; t.movRestante = 0;
      eventos.push({ tipo: "asedio", atacante: t.tipo, asentamiento: asent.nombre, dano, ajuste: tir.ajuste, jugador: t.dueno, hex: a.objetivo });
      if (asent.integridad === 0) eventos.push({ tipo: "brecha", asentamiento: asent.nombre, hex: a.objetivo });
      const cuerpo = S().statTropa(estado, datos, t, "alcance") === 0;
      // a distancia (catapulta): la pedrada también golpea a la guarnición, sin contraataque
      if (!cuerpo && S().statTropa(estado, datos, t, "ataque") > 0) {
        const obj = objetivoEn(estado, datos, t.dueno, a.objetivo);
        if (obj && obj.tropa) {
          const d = obj.tropa;
          const g1 = golpe(estado, datos, t, d);
          eventos.push({ tipo: "ataque", atacante: t.tipo, defensor: d.tipo, dano: g1.dano, ajuste: g1.ajuste, jugador: t.dueno, hex: a.objetivo });
          if (d.vida <= 0) { Ec().eliminarTropa(estado, d); eventos.push({ tipo: "muere", tropa: d.tipo, jugador: d.dueno, hex: a.objetivo, por: t.dueno }); if (datos.reglas && datos.reglas.experiencia) darExperiencia(datos, t, datos.reglas.experiencia.porMuerte, estado); }
        }
      }
      // asedio cuerpo a cuerpo: la guarnición responde
      if (cuerpo && datos.reglas && datos.reglas.asedioCuerpoACuerpoRecibeContraataque) {
        const obj = objetivoEn(estado, datos, t.dueno, a.objetivo);
        if (obj && obj.tropa && contraataca(datos, obj.tropa)) {
          const g2 = golpe(estado, datos, obj.tropa, t, t.acuarteladaEn ? { sinPlus: true } : null);
          if (datos.reglas && datos.reglas.experiencia) darExperiencia(datos, obj.tropa, datos.reglas.experiencia.porCombate, estado);
          eventos.push({ tipo: "contraataque", defensor: obj.tropa.tipo, atacante: t.tipo, dano: g2.dano, ajuste: g2.ajuste, jugador: obj.tropa.dueno });
          if (t.vida <= 0) {
            const hexT = E().posicionTropa(estado, t);
            Ec().eliminarTropa(estado, t);
            eventos.push({ tipo: "muere", tropa: t.tipo, jugador: t.dueno, hex: hexT, por: obj.tropa.dueno });
          }
        }
      }
      return eventos;
    },
  };

  // En el modo Bárbaros no se puede fundar: el juego es resistir en el centro, no expandirse (7 sep 2026).
  acciones.fundar = {
    reversible: true,
    validar(estado, datos, a) {
      if (estado.barbaros) return "no_se_puede";
      const r = tropaPropia(estado, a); if (r.error) return r.error;
      const t = r.t;
      if (!datos.tropas[t.tipo].puedeFundar) return "no_puede_fundar";
      if (!t.hex) return "no_se_puede";
      const h = estado.mapa.hexes[t.hex];
      if (h.dueno !== t.dueno) return "hex_no_tuyo";
      if (h.construccion) return "hex_ocupado"; // sobre un yacimiento sí se puede: queda dentro de las murallas
      if (!datos.terrenos[h.terreno].construible) return "terreno_no_construible";
      const def = datos.asentamientos.pueblo;
      for (const k of Object.keys(estado.asentamientos)) if (H().distancia(k, t.hex) < def.distanciaMinima) return "demasiado_cerca";
      if (!U().puedePagar(T().huchaDe(estado, datos, t.dueno, t.hex), def.coste)) return "sin_recursos";
      return null;
    },
    ejecutar(estado, datos, a) {
      const t = estado.tropas[a.tropa];
      const def = datos.asentamientos.pueblo;
      U().pagar(T().huchaDe(estado, datos, t.dueno, t.hex), def.coste);
      const hex = t.hex;
      delete estado.tropas[t.id];
      const asent = E().crearAsentamiento(estado, datos, hex, "pueblo", t.dueno);
      const j = estado.jugadores[t.dueno];
      if (!j.capital) j.capital = hex;
      if (estado.estadisticas && estado.estadisticas[t.dueno]) estado.estadisticas[t.dueno].fundados = (estado.estadisticas[t.dueno].fundados || 0) + 1;
      return [{ tipo: "funda", jugador: t.dueno, asentamiento: asent.nombre, hex }];
    },
  };

  acciones.reclutar = {
    reversible: true,
    validar(estado, datos, a) {
      const asent = asentPropio(estado, a.asentamiento); if (!asent) return "no_es_tuya";
      const defA = datos.asentamientos[asent.tipo];
      const defT = datos.tropas[a.que]; if (!defT) return "no_se_puede";
      if (!(defA.recluta.includes("*") || defA.recluta.includes(a.que))) return "no_aqui";
      if (asent.reclutadoEsteTurno) return "ya_reclutado";
      const j = estado.jugadores[estado.jugadorActivo];
      if (defT.noReclutable) return "no_se_puede";
      if (!defT.requiere.every(r => S().tieneTec(j, r))) return "sin_tecnologia";
      if (defT.nivelHeroe && (!j.heroe || (j.heroe.nivel || 1) < defT.nivelHeroe)) return "nivel_heroe";
      if (!U().puedePagar(T().huchaDe(estado, datos, j.id, a.asentamiento), S().costeTropa(estado, datos, j.id, a.que))) return "sin_recursos";
      if (!sitioReclutar(estado, datos, a.asentamiento, a.hex)) return "sin_hueco";
      return null;
    },
    ejecutar(estado, datos, a) {
      const asent = estado.asentamientos[a.asentamiento];
      const j = estado.jugadores[estado.jugadorActivo];
      const defT = datos.tropas[a.que];
      U().pagar(T().huchaDe(estado, datos, j.id, a.asentamiento), S().costeTropa(estado, datos, j.id, a.que));
      const sitio = sitioReclutar(estado, datos, a.asentamiento, a.hex);
      const t = E().crearTropa(estado, datos, a.que, j.id, null);
      if (sitio === "guarnicion") meterEnGuarnicion(estado, t, a.asentamiento);
      else { t.hex = sitio; } // nace fuera sin reclamar el hexágono
      t.accionUsada = true; t.movRestante = 0;
      asent.reclutas = (asent.reclutas || 0) + 1;
      // Maestre: la capital puede reclutar dos veces por turno
      const efH = j.heroe && FWM.heroes ? FWM.heroes.efectosDe(j.heroe) : {};
      const tope = 1 + ((j.capital === a.asentamiento && efH.reclutasCapital) || 0);
      if (asent.reclutas >= tope) asent.reclutadoEsteTurno = true;
      return [{ tipo: "recluta", jugador: j.id, tropa: a.que, asentamiento: asent.nombre, hex: a.asentamiento }];
    },
  };

  // Vecinos donde puede aparecer una tropa reclutada.
  function vecinosLibres(estado, datos, hex) {
    const jugador = estado.asentamientos[hex].dueno;
    return H().vecinos(hex).filter(v => {
      const h = estado.mapa.hexes[v];
      if (!h || datos.terrenos[h.terreno].costeMovimiento == null) return false;
      if (h.construccion || E().tropaEn(estado, v)) return false;
      if (h.dueno != null && h.dueno !== jugador) return false;
      return true;
    });
  }

  // Dónde aparece: en un hueco de guarnición; si no, en el vecino libre pedido,
  // o en el más cercano al yacimiento sin dueño propio más próximo.
  function sitioReclutar(estado, datos, hex, pedido) {
    if (huecosLibres(estado, datos, hex) > 0) return "guarnicion";
    const libres = vecinosLibres(estado, datos, hex);
    if (!libres.length) return null;
    if (pedido && libres.includes(pedido)) return pedido;
    const jugador = estado.asentamientos[hex].dueno;
    let objetivo = null, mejorD = Infinity;
    for (const [k, h] of Object.entries(estado.mapa.hexes)) {
      if (!h.yacimiento || h.dueno === jugador) continue;
      const d = H().distancia(k, hex);
      if (d < mejorD) { mejorD = d; objetivo = k; }
    }
    if (!objetivo) return libres[0];
    return libres.slice().sort((a, b) => H().distancia(a, objetivo) - H().distancia(b, objetivo))[0];
  }

  acciones.mejorarTropa = {
    reversible: true,
    validar(estado, datos, a) {
      const r = tropaPropia(estado, a); if (r.error) return r.error;
      const t = r.t;
      if (!t.acuarteladaEn) return "solo_acuartelada";
      const asent = estado.asentamientos[t.acuarteladaEn];
      if (!datos.asentamientos[asent.tipo].mejoraTropas) return "solo_en_ciudad";
      const defV = datos.tropas[t.tipo], defN = datos.tropas[a.que];
      if (!defN || !defV.mejoraA.includes(a.que)) return "no_se_puede";
      const j = estado.jugadores[t.dueno];
      if (!defN.requiere.every(x => S().tieneTec(j, x))) return "sin_tecnologia";
      if (defN.nivelHeroe && (!j.heroe || (j.heroe.nivel || 1) < defN.nivelHeroe)) return "nivel_heroe";
      if (!U().puedePagar(T().huchaDe(estado, datos, j.id, t.acuarteladaEn), costeMejora(defV, defN, estado, datos, j.id, t.tipo, a.que))) return "sin_recursos";
      return null;
    },
    ejecutar(estado, datos, a) {
      const t = estado.tropas[a.tropa];
      const defV = datos.tropas[t.tipo], defN = datos.tropas[a.que];
      U().pagar(T().huchaDe(estado, datos, t.dueno, t.acuarteladaEn), costeMejora(defV, defN, estado, datos, t.dueno, t.tipo, a.que));
      const vidaAntes = S().vidaMax(estado, datos, t);
      const viejo = t.tipo;
      t.tipo = a.que;
      t.vida += S().vidaMax(estado, datos, t) - vidaAntes;
      t.accionUsada = true; t.movRestante = 0;
      return [{ tipo: "mejoraTropa", jugador: t.dueno, tropa: viejo, nuevo: a.que }];
    },
  };

  function costeMejora(defV, defN, estado, datos, jugadorId, tipoViejo, tipoNuevo) {
    const cN = estado ? S().costeTropa(estado, datos, jugadorId, tipoNuevo) : defN.coste;
    const cV = estado ? S().costeTropa(estado, datos, jugadorId, tipoViejo) : defV.coste;
    const c = Object.assign({}, cN);
    c.oro = Math.max(0, (cN.oro || 0) - (cV.oro || 0));
    return c;
  }

  acciones.mejorarAsentamiento = {
    reversible: true,
    validar(estado, datos, a) {
      const asent = asentPropio(estado, a.asentamiento); if (!asent) return "no_es_tuya";
      const def = datos.asentamientos[asent.tipo];
      if (!def.mejoraA) return "no_se_puede";
      const nuevo = datos.asentamientos[def.mejoraA];
      const j = estado.jugadores[estado.jugadorActivo];
      if (!nuevo.requiere.every(x => S().tieneTec(j, x))) return "sin_tecnologia";
      if (!U().puedePagar(T().huchaDe(estado, datos, j.id, a.asentamiento), S().costeAsentamiento(estado, datos, j.id, def.mejoraA))) return "sin_recursos";
      return null;
    },
    ejecutar(estado, datos, a) {
      const asent = estado.asentamientos[a.asentamiento];
      const def = datos.asentamientos[asent.tipo];
      const nuevo = datos.asentamientos[def.mejoraA];
      const j = estado.jugadores[estado.jugadorActivo];
      U().pagar(T().huchaDe(estado, datos, j.id, a.asentamiento), S().costeAsentamiento(estado, datos, j.id, def.mejoraA));
      const integAntes = S().propAsentamiento(estado, datos, asent, "integridad");
      asent.tipo = def.mejoraA;
      asent.integridad += S().propAsentamiento(estado, datos, asent, "integridad") - integAntes;
      return [{ tipo: "ciudad", jugador: j.id, asentamiento: asent.nombre, hex: a.asentamiento, nuevo: asent.tipo }];
    },
  };

  acciones.construir = {
    reversible: true,
    validar(estado, datos, a) {
      const j = estado.jugadores[estado.jugadorActivo];
      const h = estado.mapa.hexes[a.hex]; if (!h) return "no_se_puede";
      if (h.dueno !== j.id) return "hex_no_tuyo";
      if (h.construccion) return "hex_ocupado";
      const ocupante = E().tropaEn(estado, a.hex);
      if (ocupante && ocupante.dueno !== j.id) return "hex_ocupado";
      if (!ocupante || !datos.tropas[ocupante.tipo].puedeFundar) return "falta_campesino"; // lo construye un campesino, que se queda de guarnición
      if (!datos.terrenos[h.terreno].construible) return "terreno_no_construible";
      const def = datos.asentamientos[a.que];
      if (def.distanciaEnemigo) for (const [k, s] of Object.entries(estado.asentamientos)) if (s.dueno !== j.id && H().distancia(k, a.hex) < def.distanciaEnemigo) return "cerca_de_enemigo";
      if (!def || def.comoSeConsigue !== "construir") return "no_se_puede";
      if (!def.requiere.every(x => S().tieneTec(j, x))) return "sin_tecnologia";
      if (!U().puedePagar(T().huchaDe(estado, datos, j.id, a.hex), S().costeAsentamiento(estado, datos, j.id, a.que))) return "sin_recursos";
      return null;
    },
    ejecutar(estado, datos, a) {
      const j = estado.jugadores[estado.jugadorActivo];
      const def = datos.asentamientos[a.que];
      U().pagar(T().huchaDe(estado, datos, j.id, a.hex), S().costeAsentamiento(estado, datos, j.id, a.que));
      const ocupante = E().tropaEn(estado, a.hex);
      const asent = E().crearAsentamiento(estado, datos, a.hex, a.que, j.id);
      if (ocupante) meterEnGuarnicion(estado, ocupante, a.hex); // la tropa que estaba encima pasa a la guarnición
      if (!j.capital) j.capital = a.hex;
      return [{ tipo: "castillo", jugador: j.id, asentamiento: asent.nombre, hex: a.hex }];
    },
  };

  // Atrincherarse: gasta la acción; +defensa hasta que se mueva o ataque.
  acciones.atrincherar = {
    reversible: true,
    validar(estado, datos, a) {
      const r = tropaPropia(estado, a); if (r.error) return r.error;
      const t = r.t;
      if (!t.hex) return "no_se_puede";
      const excluye = (datos.reglas.atrincherar && datos.reglas.atrincherar.excluye) || [];
      if ((datos.tropas[t.tipo].etiquetas || []).some(e => excluye.includes(e))) return "no_se_atrinchera";
      if (t.estados && t.estados.includes("atrincherada")) return "ya_atrincherada";
      return null;
    },
    ejecutar(estado, datos, a) {
      const t = estado.tropas[a.tropa];
      t.estados = (t.estados || []).concat(["atrincherada"]);
      t.accionUsada = true; t.movRestante = 0;
      return [{ tipo: "atrinchera", jugador: t.dueno, tropa: t.tipo, hex: t.hex }];
    },
  };

  // Carretera: se construye a distancia en un hexágono tuyo transitable ({ hex } o, por comodidad, { tropa } sobre él). No gasta tropa ni acción.
  function hexCarretera(estado, a) {
    if (a.hex) return a.hex;
    const t = a.tropa != null ? estado.tropas[a.tropa] : null;
    return t ? t.hex : null;
  }
  acciones.carretera = {
    reversible: true,
    validar(estado, datos, a) {
      const regla = datos.reglas && datos.reglas.carretera; if (!regla || estado.sinCarreteras) return "no_se_puede";
      const hex = hexCarretera(estado, a); const h = hex && estado.mapa.hexes[hex];
      if (!h) return "no_se_puede";
      const yo = estado.jugadorActivo;
      if (h.dueno !== yo) return "no_es_tuya";
      if (h.carretera || h.construccion) return "ya_hay_carretera";
      if (datos.terrenos[h.terreno].costeMovimiento == null) return "no_se_puede";
      const j = estado.jugadores[yo];
      if (!(regla.requiere || []).every(x => S().tieneTec(j, x))) return "sin_tecnologia";
      if (!U().puedePagar(T().huchaDe(estado, datos, yo, hex), regla.coste)) return "sin_recursos";
      return null;
    },
    ejecutar(estado, datos, a) {
      const hex = hexCarretera(estado, a); const yo = estado.jugadorActivo;
      U().pagar(T().huchaDe(estado, datos, yo, hex), datos.reglas.carretera.coste);
      estado.mapa.hexes[hex].carretera = true;
      return [{ tipo: "carretera", jugador: yo, hex }];
    },
  };

  // Licenciar: disolver una tropa propia (sin reembolso). Válvula de escape
  // para no quedarse atascado pagando mantenimiento.
  // Dormir: la tropa deja de contar como pendiente (dentro o fuera de un asentamiento). No gasta acción. Despierta al moverla, al atacar, si llega un enemigo al lado o al curarse si dormía herida.
  acciones.dormir = {
    reversible: true,
    validar(estado, datos, a) {
      const t = estado.tropas[a.tropa]; if (!t) return "no_hay_objetivo";
      if (t.dueno !== estado.jugadorActivo) return "no_es_tuya";
      if (dormida(t)) return "ya_dormida";
      return null;
    },
    ejecutar(estado, datos, a) {
      const t = estado.tropas[a.tropa];
      t.estados = (t.estados || []).concat(["dormida"]);
      t.dormidaHerida = t.vida < S().vidaMax(estado, datos, t); // si duerme herida, despertará al curarse del todo
      return [];
    },
  };
  acciones.despertar = {
    reversible: true,
    validar(estado, datos, a) {
      const t = estado.tropas[a.tropa]; if (!t) return "no_hay_objetivo";
      if (t.dueno !== estado.jugadorActivo) return "no_es_tuya";
      if (!dormida(t)) return "no_dormida";
      return null;
    },
    ejecutar(estado, datos, a) {
      const t = estado.tropas[a.tropa];
      t.estados = t.estados.filter(x => x !== "dormida");
      return [];
    },
  };

  acciones.licenciar = {
    reversible: true,
    validar(estado, datos, a) {
      const t = estado.tropas[a.tropa];
      if (!t) return "no_hay_objetivo";
      if (t.dueno !== estado.jugadorActivo) return "no_es_tuya";
      if (datos.tropas[t.tipo].heroe) return "no_se_puede";
      return null;
    },
    ejecutar(estado, datos, a) {
      const t = estado.tropas[a.tropa];
      Ec().eliminarTropa(estado, t);
      return [{ tipo: "licencia", jugador: t.dueno, tropa: t.tipo }];
    },
  };

  acciones.investigar = {
    reversible: true,
    validar(estado, datos, a) {
      const j = estado.jugadores[estado.jugadorActivo];
      if (j.investigando) return "ya_investigando";
      if (!S().tecDisponible(estado, datos, j, a.tec)) return "sin_tecnologia";
      if (!U().puedePagar(j.hucha, S().costeTec(datos, j, a.tec))) return "sin_recursos";
      return null;
    },
    ejecutar(estado, datos, a) {
      const j = estado.jugadores[estado.jugadorActivo];
      U().pagar(j.hucha, S().costeTec(datos, j, a.tec));
      j.investigando = { id: a.tec, turnosRestantes: datos.tecnologias[a.tec].turnos };
      return [{ tipo: "investiga", jugador: j.id, tec: a.tec }];
    },
  };

  acciones.finTurno = {
    reversible: false,
    validar(estado) { return estado.ganador != null ? "no_se_puede" : null; },
    ejecutar(estado, datos) {
      const eventos = [];
      FWM.ganchos.avisar("finTurno", estado, { datos, jugadorId: estado.jugadorActivo });
      // monjes: al acabar el turno curan a las tropas propias pegadas
      for (const m of E().tropasDe(estado, estado.jugadorActivo)) {
        const cura = datos.tropas[m.tipo].cura; if (!cura) continue;
        const pos = E().posicionTropa(estado, m); if (!pos) continue;
        for (const x of E().tropasDe(estado, m.dueno)) {
          if (x.id === m.id) continue;
          const px = E().posicionTropa(estado, x); if (!px || FWM.hex.distancia(pos, px) !== 1) continue;
          const max = S().vidaMax(estado, datos, x); if (x.vida >= max) continue;
          const antes = x.vida; x.vida = Math.min(max, x.vida + cura);
          eventos.push({ tipo: "cura", hex: px, cantidad: x.vida - antes, tropa: x.tipo, jugador: x.dueno });
        }
      }
      const n = estado.jugadores.length;
      let i = estado.jugadorActivo, vueltas = 0;
      do {
        i = (i + 1) % n;
        if (i === 0) { estado.turno += 1; eventos.push({ tipo: "turno", turno: estado.turno }); }
        vueltas++;
      } while (estado.jugadores[i].eliminado && vueltas <= n);
      estado.jugadorActivo = i;
      eventos.push(...Ec().inicioTurno(estado, datos, i));
      return eventos;
    },
  };

  return { acciones, contraataca, alcanzablesDe, objetivoEn, validarAlcance, sitioReclutar, vecinosLibres, costeMejora, huecosLibres, conquistar, costeTerreno , dormida };
})();
