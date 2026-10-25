// Reflejos que comparten las IAs (16 sep 2026).
// Rodrigo, en la campaña: "saco mi héroe y un caballo, voy directo al asentamiento enemigo, destruyo sus tropas y me
// quedo rodeándolo, y de ahí no sale". Cada tropa de la máquina decidía sola si atacaba y ninguna se atrevía contra
// un héroe fuerte; su héroe, sano, se quedaba dentro de la muralla. El golpe conjunto suma lo que pueden hacer
// TODAS a una tropa enemiga este turno y, si entre todas la matan (o dejan muy tocado al héroe rival), atacan en
// cadena: primero las de distancia, luego las que menos daño reciben.
// Solo usa FWM.motor.aplicar / accionesPosibles / prever; nunca toca el estado a mano.
window.FWM = window.FWM || {};

FWM.iaComun = (function () {
  const H = () => FWM.hex, E = () => FWM.estado, S = () => FWM.stats, M = () => FWM.motor;

  // Tropas enemigas que merece la pena derribar: las que están a 2 o menos de un asentamiento mío y el héroe rival
  // a 3 o menos de cualquier tropa mía.
  // ofensivo (la difícil): también cualquier tropa enemiga a 2 o menos de una mía.
  function objetivos(estado, datos, yo, ofensivo) {
    const mios = E().asentamientosDe(estado, yo).map(x => x.hex);
    const misTropas = E().tropasDe(estado, yo).map(t => E().posicionTropa(estado, t)).filter(Boolean);
    const lista = [];
    for (const t of Object.values(estado.tropas)) {
      if (!t.hex || !E().enemigos(estado, t.dueno, yo)) continue;
      const heroe = !!datos.tropas[t.tipo].heroe;
      const cercaCasa = mios.some(m => H().distancia(m, t.hex) <= 2);
      const heroeAMano = heroe && misTropas.some(p => H().distancia(p, t.hex) <= 3);
      const aTiro = ofensivo && misTropas.some(p => H().distancia(p, t.hex) <= 2);
      if (cercaCasa || heroeAMano || aTiro) lista.push({ id: t.id, hex: t.hex, heroe, cercaCasa });
    }
    // primero el héroe, luego lo más pegado a casa
    return lista.sort((a, b) => (b.heroe - a.heroe) || (b.cercaCasa - a.cercaCasa));
  }

  // Cómo podría pegarle una tropa mía a `hex` este turno: sin moverse o moviéndose a una casilla libre.
  // Devuelve { desde, haces, recibes } con el daño medio, o null.
  function comoPega(estado, datos, t, hex) {
    const def = datos.tropas[t.tipo];
    if (def.puedeFundar || (def.cura && !def.heroe) || def.disparaSinMover) return null;
    const vmax = S().vidaMax(estado, datos, t);
    const p = M().accionesPosibles(estado, datos, t.id);
    const medio = (r) => r ? (r[0] + r[1]) / 2 : 0;
    const valorar = (pv) => pv && !(pv.recibes && pv.recibes[1] >= t.vida) ? { haces: medio(pv.haces), minimo: pv.haces[0], recibes: pv.recibes ? pv.recibes[1] : 0 } : null;
    if (p.atacar.includes(hex)) { const v = valorar(M().prever(estado, datos, t.id, hex)); if (v) return Object.assign(v, { desde: null }); }
    // la última de la guarnición no sale (dejaría la casa vacía con el enemigo al lado)
    if (!Object.keys(p.mover).length || (t.acuarteladaEn && estado.asentamientos[t.acuarteladaEn] && estado.asentamientos[t.acuarteladaEn].guarnicion.length <= 1)) return null;
    // el héroe herido no sale a buscar pelea
    if (def.heroe && t.vida < vmax * 0.5) return null;
    const alcance = Math.max(1, S().statTropa(estado, datos, t, "alcance"));
    let mejor = null;
    for (const h of Object.keys(p.mover)) {
      if (estado.asentamientos[h] || E().tropaEn(estado, h)) continue;
      const d = H().distancia(h, hex); if (d > alcance) continue;
      // se simula el movimiento para prever desde allí
      const r = M().aplicar(estado, datos, { tipo: "mover", tropa: t.id, a: h }); if (!r.ok) continue;
      const pv = M().prever(r.estado, datos, t.id, hex);
      const v = valorar(pv); if (!v) continue;
      // a distancia, mejor desde lejos; cuerpo a cuerpo, desde donde menos enemigos haya alrededor
      const expuesto = H().vecinos(h).filter(k => { const x = E().tropaEn(estado, k); return x && E().enemigos(estado, x.dueno, t.dueno); }).length;
      const punt = v.haces - v.recibes - expuesto * 5 + (alcance > 1 ? d * 3 : 0);
      if (!mejor || punt > mejor.punt) mejor = Object.assign(v, { desde: h, punt });
    }
    return mejor;
  }

  // ctx: { estado, datos, yo, hacer(accion) }. Devuelve cuántos ataques ha hecho.
  function golpeConjunto(ctx) {
    const { datos, yo } = ctx; let hechos = 0;
    for (const obj of objetivos(ctx.estado, datos, yo, !!ctx.dificil)) {
      const estado = ctx.estado; const victima = estado.tropas[obj.id]; if (!victima || victima.hex !== obj.hex) continue;
      const libres = E().tropasDe(estado, yo).filter(t => !t.accionUsada);
      const planes = [];
      for (const t of libres) { const c = comoPega(estado, datos, t, obj.hex); if (c) planes.push({ id: t.id, c, distancia: S().statTropa(estado, datos, t, "alcance") > 0 }); }
      if (!planes.length) continue;
      const total = planes.reduce((s, x) => s + x.c.haces, 0);
      const vida = victima.vida;
      // matarla; o, si es el héroe rival, dejarlo por debajo de un tercio (se irá a curar y deja de acosar)
      const merece = total >= vida * 1.05 || (obj.heroe && total >= vida * 0.65 && vida - total <= S().vidaMax(estado, datos, victima) * 0.35);
      // desgaste: quien acampa pegado a la muralla se lleva golpes aunque no caiga, de las que no se arriesgan
      // (reciben menos de un tercio de su vida), hasta que tenga que irse a curar
      const acampado = E().asentamientosDe(estado, yo).some(x => H().distancia(x.hex, obj.hex) <= 1);
      const seguras = planes.filter(x => x.c.recibes < estado.tropas[x.id].vida * 0.34 && x.c.haces >= 6);
      const desgaste = !merece && acampado && seguras.reduce((s, x) => s + x.c.haces, 0) >= vida * 0.4;
      if (!merece && !desgaste) continue;
      if (desgaste) planes.splice(0, planes.length, ...seguras);
      // primero las de distancia (no reciben), luego las que menos reciben
      planes.sort((a, b) => (b.distancia - a.distancia) || (a.c.recibes - b.c.recibes));
      for (const pl of planes) {
        const v = ctx.estado.tropas[obj.id]; if (!v || v.hex !== obj.hex) break; // ya ha caído
        const t = ctx.estado.tropas[pl.id]; if (!t || t.accionUsada) continue;
        // se vuelve a mirar: las cosas han cambiado con los golpes anteriores
        const c = comoPega(ctx.estado, datos, t, obj.hex); if (!c) continue;
        if (c.desde && !ctx.hacer({ tipo: "mover", tropa: pl.id, a: c.desde })) continue;
        if (ctx.hacer({ tipo: "atacar", tropa: pl.id, objetivo: obj.hex })) hechos++;
      }
    }
    return hechos;
  }

  return { golpeConjunto, objetivos, comoPega };
})();
