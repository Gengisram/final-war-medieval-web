// API pública del motor.
//   FWM.motor.crearPartida({ datos, mapa, jugadores, semilla })
//   FWM.motor.aplicar(estado, datos, accion) -> { ok, estado, eventos } | { ok: false, error }
//   FWM.motor.accionesPosibles(estado, datos, tropaId)
//   FWM.motor.esReversible(accion)
window.FWM = window.FWM || {};

FWM.motor = (function () {
  const REGISTRO_MAX = 80;

  function crearPartida(opciones) {
    const estado = FWM.estado.crearPartida(opciones);
    const eventos = FWM.economia.inicioTurno(estado, opciones.datos, 0);
    anotar(estado, eventos);
    return estado;
  }

  function aplicar(estado, datos, accion) {
    const def = FWM.acciones.acciones[accion.tipo];
    if (!def) return { ok: false, error: "no_se_puede" };
    if (estado.ganador != null && accion.tipo !== "finTurno") return { ok: false, error: "no_se_puede" };
    const error = def.validar(estado, datos, accion);
    if (error) return { ok: false, error };
    const nuevo = FWM.util.clonar(estado);
    const eventos = def.ejecutar(nuevo, datos, accion) || [];
    eventos.push(...FWM.victoria.comprobar(nuevo, datos));
    contar(nuevo, datos, eventos);
    anotar(nuevo, eventos);
    return { ok: true, estado: nuevo, eventos };
  }

  // Estadísticas de la partida a partir de los eventos.
  function contar(estado, datos, eventos) {
    const st = estado.estadisticas; if (!st) return;
    for (const e of eventos) {
      if (e.tipo === "muere") { if (st[e.jugador]) st[e.jugador].perdidas++; if (e.por != null && st[e.por]) st[e.por].matadas++; }
      if (e.tipo === "conquista" && st[e.jugador]) st[e.jugador].conquistas++;
      if (e.tipo === "eliminado" && st[e.jugador]) st[e.jugador].eliminadoEn = estado.turno;
      if (e.tipo === "turno") {
        estado.linea = estado.linea || [];
        estado.linea.push({ turno: estado.turno, asentamientos: estado.jugadores.map(j => FWM.estado.asentamientosDe(estado, j.id).length), puntos: estado.jugadores.map(j => FWM.victoria.puntos(estado, datos, j.id)) });
        if (estado.linea.length > 300) estado.linea.shift();
      }
    }
  }

  function anotar(estado, eventos) {
    for (const e of eventos) estado.registro.push(Object.assign({ turno: estado.turno }, e));
    if (estado.registro.length > REGISTRO_MAX) estado.registro.splice(0, estado.registro.length - REGISTRO_MAX);
  }

  function esReversible(accion) {
    const def = FWM.acciones.acciones[accion.tipo];
    return !!(def && def.reversible);
  }

  // Para la interfaz y la IA: qué puede hacer una tropa ahora mismo.
  function accionesPosibles(estado, datos, tropaId) {
    const t = estado.tropas[tropaId];
    const r = { mover: {}, atacar: [], asediar: [], reclamar: false, fundar: false, mejorarA: [], atrincherar: false, carretera: false };
    if (!t || t.dueno !== estado.jugadorActivo || t.accionUsada || estado.ganador != null) return r;
    if (t.movRestante > 0) r.mover = FWM.acciones.alcanzablesDe(estado, datos, t);
    const alcance = FWM.stats.statTropa(estado, datos, t, "alcance");
    const origen = FWM.estado.posicionTropa(estado, t);
    const radio = Math.max(1, alcance);
    for (const h of FWM.hex.anillo(origen, radio)) {
      if (h === origen || !estado.mapa.hexes[h]) continue;
      if (FWM.acciones.acciones.atacar.validar(estado, datos, { tropa: tropaId, objetivo: h }) == null) r.atacar.push(h);
      if (FWM.acciones.acciones.asediar.validar(estado, datos, { tropa: tropaId, objetivo: h }) == null) r.asediar.push(h);
    }
    r.reclamar = FWM.acciones.acciones.reclamar.validar(estado, datos, { tropa: tropaId }) == null;
    r.fundar = FWM.acciones.acciones.fundar.validar(estado, datos, { tropa: tropaId }) == null;
    r.atrincherar = FWM.acciones.acciones.atrincherar.validar(estado, datos, { tropa: tropaId }) == null;
    r.carretera = FWM.acciones.acciones.carretera.validar(estado, datos, { tropa: tropaId }) == null;
    for (const tipo of datos.tropas[t.tipo].mejoraA) {
      if (FWM.acciones.acciones.mejorarTropa.validar(estado, datos, { tropa: tropaId, que: tipo }) == null) r.mejorarA.push(tipo);
    }
    return r;
  }

  // Previsión de un ataque para mostrar "haces X a Y, recibes Z a W".
  function prever(estado, datos, tropaId, objetivo) {
    const t = estado.tropas[tropaId];
    const obj = FWM.acciones.objetivoEn(estado, datos, t.dueno, objetivo);
    if (!obj) return null;
    const d = obj.tropa;
    const bono = FWM.stats.bonoContra(datos, t, d, estado);
    const atk = FWM.stats.ataqueEfectivo(estado, datos, t) + (bono ? bono.valor : 0);
    const bonoDef = FWM.stats.defensaContra(datos, t, d, estado);
    const def = FWM.stats.statTropa(estado, datos, d, "defensa") + (bonoDef ? bonoDef.valor : 0);
    const mult = FWM.combate.multiplicador(datos, datos.tropas[t.tipo].tipoDano, datos.tropas[d.tipo].etiquetas);
    const haces = FWM.combate.rango(atk, def, datos, mult);
    const recibes = contraataquePrevisto(estado, datos, t, d);
    return { haces, recibes, defensor: d, asentamiento: obj.asentamiento, vidaDefensor: d.vida, defensaDefensor: def, bono, bonoDef, bonoRecibes: FWM.stats.statTropa(estado, datos, t, "alcance") === 0 ? FWM.stats.bonoContra(datos, d, t) : null };
  }

  // Lo que devolvería el defensor si el atacante es cuerpo a cuerpo (si sobrevive).
  function contraataquePrevisto(estado, datos, t, d) {
    if (FWM.stats.statTropa(estado, datos, t, "alcance") !== 0) return null;
    if (!FWM.acciones.contraataca(datos, d)) return null;
    const bono2 = FWM.stats.bonoContra(datos, d, t, estado);
    const atk2 = FWM.stats.ataqueEfectivo(estado, datos, d) + (bono2 ? bono2.valor : 0);
    const bonoDef2 = FWM.stats.defensaContra(datos, d, t, estado);
    const def2 = FWM.stats.statTropa(estado, datos, t, "defensa", t.acuarteladaEn ? { sinPlus: true } : null) + (bonoDef2 ? bonoDef2.valor : 0);
    return FWM.combate.rango(atk2, def2, datos, 1);
  }

  // Previsión de un asedio: cuánto quitas a las murallas y qué recibes.
  function preverAsedio(estado, datos, tropaId, objetivo) {
    // (la catapulta también golpea a la guarnición: se enseña con prever() en el diálogo)
    const t = estado.tropas[tropaId];
    const asent = estado.asentamientos[objetivo];
    if (!asent) return null;
    const asd = FWM.stats.statTropa(estado, datos, t, "asedio");
    const aj = Object.values(datos.dados.combate.ajustes || {});
    const min = datos.dados.combate.minimoDano;
    const quitas = [Math.max(min, asd + Math.min(0, ...aj)), Math.max(min, asd + Math.max(0, ...aj))];
    let recibes = null;
    const cuerpo = FWM.stats.statTropa(estado, datos, t, "alcance") === 0;
    if (cuerpo && datos.reglas && datos.reglas.asedioCuerpoACuerpoRecibeContraataque) {
      const obj = FWM.acciones.objetivoEn(estado, datos, t.dueno, objetivo);
      if (obj && obj.tropa) recibes = contraataquePrevisto(estado, datos, t, obj.tropa);
    }
    return { quitas, recibes, integridad: asent.integridad, max: FWM.stats.propAsentamiento(estado, datos, asent, "integridad") };
  }

  return { crearPartida, aplicar, accionesPosibles, esReversible, prever, preverAsedio };
})();
