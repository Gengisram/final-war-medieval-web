// Sala: jugar con un amigo por código, en cualquier tipo de batalla (22 sep 2026).
//
// No hay servidor de juego: los dos teléfonos ejecutan el mismo motor con la misma semilla y se mandan las
// acciones de cada turno (pantalla/duelo.js). Para que las dos copias sean IGUALES, todo lo que decide cómo
// es la partida tiene que viajar en la invitación. Y ahí estaba el problema: las máquinas se montaban con MI
// facción y con el nivel de MI héroe, así que en el teléfono del anfitrión y en el del invitado salían
// distintas y la partida se rompía en el primer combate. Aquí se cierran esos cabos:
//
//   configurar(op, yo, listaF)   lo que manda el anfitrión: su configuración + las facciones, el nivel y los
//                                puntos con los que se montan las máquinas (los suyos), ya resueltos.
//   paraInvitado(partida, ...)   lo que monta el invitado: lo mismo, pero con SU facción y su héroe.
//
// El invitado es siempre el jugador 1; el anfitrión, el 0. Los equipos vienen de la ficha (op.equipos), así
// que "los dos juntos contra tres máquinas" o "uno contra uno con público" son la misma sala con otros equipos.
window.FWM = window.FWM || {};

FWM.sala = (function () {
  // Lo que el anfitrión manda por el canal. `yo` es { faccion, nivel, gastados }.
  function configurar(op, yo, listaF) {
    const resistir = op.batalla === "resistir" || op.tipo === "resistir";
    const n = resistir ? 3 : Math.max(2, (op.rivales || 1) + 1);
    const g = FWM.azar.crear((op.semilla || 1) + 7);
    const libres = g.barajar((listaF || []).filter(f => f !== yo.faccion));
    // enemigos[i-1] es el jugador i: el 1 es el amigo (hueco, lo rellena la sesión) y del 2 en adelante, máquinas
    const enemigos = [{}];
    // en Resistir el último jugador es la horda y lo pone el motor: aquí solo se sortean las máquinas de verdad
    const hasta = resistir ? n - 1 : n;
    for (let i = 2; i < hasta; i++) enemigos.push({ faccion: libres.length ? libres.shift() : (listaF[0] || "castilla") });
    // Resistir a dobles: la horda es siempre el último jugador, así que con un amigo hacen falta dos "rivales"
    // (el 1 es el amigo y el 2 la horda). Es la misma sala, con el mapa y las reglas de la arena.
    const extra = (op.batalla === "resistir" || op.tipo === "resistir") ? { tipo: "resistir", rivales: 2, mapaHecho: "arena", limite: 0 } : {};
    return Object.assign({}, op, extra, {
      sala: true,
      enemigos,                         // facción de cada máquina, ya sorteada por el anfitrión
      nivelIA: yo.nivel || 1,           // las máquinas van al nivel del anfitrión, no al de cada uno
      gastadosIA: yo.gastados || 0,
      faccionAnfitrion: yo.faccion,
    });
  }

  // Las opciones con las que cada teléfono monta la partida. `rol` es "anfitrion" o "invitado".
  function opciones(partida, ses, miFaccion) {
    return Object.assign({}, partida, { coop: ses, semilla: ses.semilla, faccion: miFaccion });
  }

  // Cuántos juegan de verdad y cuántas máquinas hay (para contarlo en la pantalla de espera).
  function reparto(partida) {
    const n = Math.max(2, (partida.rivales || 1) + 1);
    const hordas = partida.tipo === "resistir" || partida.batalla === "resistir";
    return { humanos: 2, maquinas: Math.max(0, n - 2 - (hordas ? 1 : 0)), hordas };
  }

  // Una línea que cuenta la partida que ha montado el anfitrión: "Campo de batalla · 2 máquinas · 15 turnos".
  function resumen(partida, datos) {
    const T = datos.textos; const B = T.batallas || {};
    const tipo = (B.tipos && B.tipos[partida.batalla || "conquista"] || {}).nombre || "";
    const r = reparto(partida);
    if (r.hordas) return tipo; // "Resistir" ya lo dice todo: la arena, las hordas y sin límite de turnos
    const trozos = [tipo];
    if (r.maquinas) trozos.push((B.maquinas || "{n} máquinas").replace("{n}", r.maquinas));
    trozos.push(partida.limite ? (B.turnosN || "{n} turnos").replace("{n}", partida.limite) : (T.finEliminacion || ""));
    return trozos.filter(Boolean).join(" · ");
  }

  return { configurar, opciones, reparto, resumen };
})();
