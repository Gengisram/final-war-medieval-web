// Duelo online: 1 contra 1 en directo, Rápida a 20 turnos, 60 s por turno.
// El mismo módulo lleva el modo Bárbaros a dobles (9 sep 2026): dos jugadores humanos contra las hordas,
// que llevan la IA. Cambia poco: no hay Elo y, si el compañero se cae, su reino
// lo sigue jugando la máquina en vez de acabar la partida. Todo lo demás (canal, envío de turnos con
// firma, reconexión al volver de otra aplicación) es lo mismo, que ya estaba probado.
// Sin servidor de juego: los dos teléfonos ejecutan el mismo motor con la misma semilla y se mandan
// las acciones de cada turno por Supabase Realtime (canal "duelo:<id>"). La cola de rivales es un canal
// con presencia ("cola"); si en 20 s no aparece nadie, entra un bot con nombre de jugador. Retar a un
// amigo usa un canal por código ("reto:<CODIGO>").
window.FWM = window.FWM || {};

FWM.duelo = (function () {
  const ESPERA_COLA = 20;      // segundos de cola
  const BUSQUEDA_REAL = 15;    // hasta aquí se busca gente de verdad; después el bot entra en un segundo al azar (16-19)
  const SEG_TURNO = 60;        // segundos por turno
  const GRACIA_DESCONEXION = 30; // segundos para volver antes de perder por abandono
  const TURNOS_SIN_TOCAR = 3;    // turnos seguidos agotados sin hacer nada = abandono
  const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

  let App = null;
  let canal = null;            // canal de la partida
  let cola = null;             // canal de la cola o del reto
  let sesion = null;           // { id, rol: "anfitrion"|"invitado"|"bot", rival: {uid,nombre,avatar}, semilla }
  let reloj = null, segundos = 0, finEn = 0, temporizadorGracia = null, ultimoEnvio = null, rivalPresente = false;
  let latido = null, esperandoDesde = 0, aplicando = false; // reintento: si el turno del rival no llega, se le vuelve a pedir
  let alEmparejar = null, temporizadorCola = null, turnosVacios = 0;
  // dobles: puesta al día con la partida entera cuando las dos copias se separan (ver más abajo)
  let llevoCompanero = false, seFueDelTodo = false, debeEnviarEstado = false, pendienteEstado = null, ultimoEstadoEnviado = 0, ultimaPeticion = 0;

  const uid = () => (FWM.nube.usuario() && FWM.nube.usuario().id) || null;
  // cada uno lleva su facción y su héroe con su nivel (el de la facción con la que juega)
  const yo = () => { const h = FWM.heroe.paraPartida({}); return { uid: uid(), nombre: FWM.nube.nombre() || FWM.guardado.ajustes().nombre || "Jugador", avatar: h.clase, faccion: FWM.heroe.faccion(), heroe: h, nivel: h.nivel, elo: (FWM.nube.perfil() && FWM.nube.perfil().elo) || 1000 }; };
  // Hay duelo vivo mirando la partida en curso, no la referencia interna: si el módulo aún no se ha arrancado
  // (recarga de la página, por ejemplo) el duelo seguía existiendo pero se daba por inactivo y el botón Menú
  // sacaba al inicio sin remedio (6 sep 2026).
  const app = () => App || FWM.app || null;
  const activo = () => { const a = app(); return !!(a && a.opciones && (a.opciones.duelo || a.opciones.coop) && a.estado && a.estado.ganador == null); };
  const esCoop = () => !!(sesion && sesion.coop);
  const enLinea = () => !!(sesion && sesion.rol !== "bot");

  // ---------- firma del estado: para detectar que los dos tableros siguen iguales ----------
  function firma(e) {
    const tropas = Object.values(e.tropas).map(t => [t.id, t.tipo, t.hex, t.acuarteladaEn, t.vida, t.dueno, t.exp | 0]).sort((a, b) => a[0] - b[0]);
    const asent = Object.keys(e.asentamientos).sort().map(h => { const a = e.asentamientos[h]; return [h, a.tipo, a.dueno, a.integridad, a.guarnicion.length]; });
    const jug = e.jugadores.map(j => [j.id, j.hucha.oro | 0, !!j.eliminado]);
    const s = JSON.stringify([e.turno, e.jugadorActivo, tropas, asent, jug]);
    let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return h;
  }

  // ---------- cola de rivales ----------
  // alEstado(texto, segundos) informa a la pantalla; alEmpezar(sesion) arranca la partida.
  function buscar(app, alEstado, alEmpezar) {
    App = app; salir();
    const cliente = FWM.nube.cliente(); if (!cliente || !uid()) return false;
    const m = yo(); const desde = Date.now();
    let quedan = ESPERA_COLA, emparejado = false;
    const segundoBot = BUSQUEDA_REAL + 1 + Math.floor(Math.random() * (ESPERA_COLA - BUSQUEDA_REAL - 1)); // 16..19
    alEstado(App.datos.textos.duelo.buscando, quedan);
    cola = cliente.channel("cola", { config: { presence: { key: m.uid }, broadcast: { self: false } } });
    const canalCola = cola;
    const arrancar = (ses) => { if (emparejado) return; emparejado = true; clearInterval(temporizadorCola); const c = cola; cola = null; if (c) c.untrack().then(() => c.unsubscribe()).catch(() => {}); alEmpezar(ses); };
    cola.on("presence", { event: "sync" }, () => {
      if (emparejado || cola !== canalCola) return;
      // solo se empareja con gente de mi nivel ±1; el primero que llegó (de los compatibles) hace de anfitrión
      const todos = Object.values(canalCola.presenceState()).map(l => l[0]).filter(p => p && p.uid).sort((a, b) => (a.desde - b.desde) || (a.uid < b.uid ? -1 : 1));
      // mismo nivel ±1 y, sobre todo, las mismas reglas: con protocolos distintos la partida se anularía a mitad
      const lista = todos.filter(p => Math.abs((p.nivel || 1) - (m.nivel || 1)) <= 1 && (p.proto || 0) === FWM.PROTOCOLO);
      if (todos.length > 1 && lista.length < 2 && todos.some(p => p.uid !== m.uid && (p.proto || 0) !== FWM.PROTOCOLO)) alEstado(App.datos.textos.duelo.otraVersionCola, null);
      const i = lista.findIndex(p => p.uid === m.uid);
      if (lista.length < 2 || i > 1) return;
      const anf = lista[0], inv = lista[1];
      if (i === 0) { // soy el anfitrión: propongo semilla e id
        const ses = { id: anf.uid.slice(0, 8) + "-" + Date.now().toString(36), semilla: Math.floor(Math.random() * 1e6) + 1, rol: "anfitrion", rival: { uid: inv.uid, nombre: inv.nombre, avatar: inv.avatar, faccion: inv.faccion, heroe: inv.heroe, elo: inv.elo }, miElo: m.elo };
        canalCola.send({ type: "broadcast", event: "empezar", payload: { a: inv.uid, de: anf.uid, id: ses.id, semilla: ses.semilla, nombre: m.nombre, avatar: m.avatar, faccion: m.faccion, heroe: m.heroe, elo: m.elo, proto: FWM.PROTOCOLO } });
        setTimeout(() => arrancar(ses), 300);
      }
    });
    cola.on("broadcast", { event: "empezar" }, ({ payload }) => {
      if (emparejado || payload.a !== m.uid) return;
      if ((payload.proto || 0) !== FWM.PROTOCOLO) { alEstado(App.datos.textos.duelo.otraVersion, null); return; }
      arrancar({ id: payload.id, semilla: payload.semilla, rol: "invitado", rival: { uid: payload.de, nombre: payload.nombre, avatar: payload.avatar, faccion: payload.faccion, heroe: payload.heroe, elo: payload.elo }, miElo: m.elo });
    });
    cola.subscribe(async (estado) => { if (estado === "SUBSCRIBED") await cola.track({ uid: m.uid, nombre: m.nombre, avatar: m.avatar, heroe: m.heroe, faccion: m.faccion, nivel: m.nivel, elo: m.elo, desde, proto: FWM.PROTOCOLO }); });
    temporizadorCola = setInterval(() => {
      quedan--; alEstado(App.datos.textos.duelo.buscando, quedan);
      if (ESPERA_COLA - quedan >= segundoBot) { // nadie a tiempo: bot con nombre de jugador, como si acabara de entrar alguien
        const g = FWM.azar.crear(Date.now() % 100000);
        arrancar({ id: "bot-" + Date.now().toString(36), semilla: Math.floor(Math.random() * 1e6) + 1, rol: "bot", rival: { uid: null, nombre: g.elegir(App.datos.nombresIA || ["Rival"]), avatar: g.elegir(["campesino", "lancero", "espadachin", "arquero", "caballero"]), faccion: g.elegir(FWM.facciones.lista()) } });
      }
    }, 1000);
    return true;
  }

  // Reto a un amigo: quien crea el código espera; quien lo escribe entra. Sin bot.
  function retar(app, codigo, alEstado, alEmpezar, opciones) {
    App = app; salir(); const igualar = !!(opciones && opciones.igualar);
    // Un solo canal por código, venga de donde venga (14 sep 2026): el código de Bárbaros a dobles se metía en
    // "Duelo online" (o al revés), cada uno esperaba en un canal distinto y los dos se quedaban colgados. Ahora
    // quien lo crea decide el modo, y quien lo escribe entra en ese modo aunque lo haya escrito en otra pantalla.
    const coop = !!(opciones && opciones.coop); const prefijo = "reto:";
    const cliente = FWM.nube.cliente(); if (!cliente || !uid()) return null;
    const m = yo(); const creador = !codigo;
    if (!codigo) { const g = FWM.azar.crear(Date.now() % 1000003); codigo = ""; for (let i = 0; i < 4; i++) codigo += LETRAS[g.entero ? g.entero(0, LETRAS.length - 1) : Math.floor(Math.random() * LETRAS.length)]; }
    codigo = codigo.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
    let emparejado = false;
    alEstado(creador ? App.datos.textos.duelo.esperandoAmigo : App.datos.textos.duelo.entrando, null, codigo, creador);
    // quien escribe el código y no encuentra a nadie en 12 s: se le dice (antes se quedaba en "Entrando…" para siempre)
    if (!creador) setTimeout(() => { if (!emparejado && cola && cola === canalReto) alEstado(App.datos.textos.duelo.codigoSinNadie, null, codigo, creador); }, 12000);
    cola = cliente.channel(prefijo + codigo, { config: { presence: { key: m.uid }, broadcast: { self: false } } });
    const canalReto = cola;
    const arrancar = (ses) => { if (emparejado) return; emparejado = true; const c = cola; cola = null; if (c) c.untrack().then(() => c.unsubscribe()).catch(() => {}); alEmpezar(ses); };
    cola.on("presence", { event: "sync" }, () => {
      if (emparejado || !creador || cola !== canalReto) return;
      const lista = Object.values(canalReto.presenceState()).map(l => l[0]).filter(p => p && p.uid && p.uid !== m.uid);
      if (!lista.length) return;
      const inv = lista[0];
      if ((inv.proto || 0) !== FWM.PROTOCOLO) { alEstado(App.datos.textos.duelo.otraVersion, null, codigo, creador); return; } // reglas distintas: no se empieza
      const ses = { id: (coop ? "coop-" : "reto-") + codigo + "-" + Date.now().toString(36), semilla: Math.floor(Math.random() * 1e6) + 1, rol: "anfitrion", rival: { uid: inv.uid, nombre: inv.nombre, avatar: inv.avatar, faccion: inv.faccion, heroe: inv.heroe, elo: inv.elo }, miElo: m.elo, igualar, coop };
      canalReto.send({ type: "broadcast", event: "empezar", payload: { a: inv.uid, de: m.uid, id: ses.id, semilla: ses.semilla, nombre: m.nombre, avatar: m.avatar, faccion: m.faccion, heroe: m.heroe, elo: m.elo, igualar, coop, proto: FWM.PROTOCOLO } });
      setTimeout(() => arrancar(ses), 300);
    });
    cola.on("broadcast", { event: "empezar" }, ({ payload }) => {
      if (emparejado || payload.a !== m.uid) return;
      if ((payload.proto || 0) !== FWM.PROTOCOLO) { alEstado(App.datos.textos.duelo.otraVersion, null, codigo, creador); return; }
      arrancar({ id: payload.id, semilla: payload.semilla, rol: "invitado", rival: { uid: payload.de, nombre: payload.nombre, avatar: payload.avatar, faccion: payload.faccion, heroe: payload.heroe, elo: payload.elo }, miElo: m.elo, igualar: !!payload.igualar, coop: !!payload.coop });
    });
    const presencia = { uid: m.uid, nombre: m.nombre, avatar: m.avatar, heroe: m.heroe, faccion: m.faccion, nivel: m.nivel, elo: m.elo, creador, proto: FWM.PROTOCOLO };
    cola.subscribe(async (estado) => { if (estado === "SUBSCRIBED") await cola.track(presencia); });
    // al volver de WhatsApp (el móvil deja la página en segundo plano) se vuelve a anunciar que se sigue esperando
    const alVolver = () => { if (document.hidden) return; if (emparejado || cola !== canalReto) { document.removeEventListener("visibilitychange", alVolver); return; } try { canalReto.track(presencia); } catch (e) { /* nada */ } };
    document.addEventListener("visibilitychange", alVolver);
    return codigo;
  }

  function cancelarBusqueda() {
    clearInterval(temporizadorCola);
    if (cola) { const c = cola; cola = null; c.untrack().then(() => c.unsubscribe()).catch(() => {}); }
  }

  // ---------- partida ----------
  // Se llama desde App.nuevaPartida cuando op.duelo existe (y desde cargarPartida para reanudar).
  let yoListo = false, rivalListo = false, alListos = null;
  function empezar(app, ses, conCaraACara) {
    App = app; sesion = ses; ultimoEnvio = null; rivalPresente = false; turnosVacios = 0; yoListo = false; rivalListo = false; alListos = null; chatReiniciar();
    llevoCompanero = false; seFueDelTodo = false; debeEnviarEstado = false; pendienteEstado = null; ultimoEstadoEnviado = 0;
    chatRecuperar(); // si ya se hablaba en esta partida (se salió y se volvió), el chat sigue abierto
    App.accionesTurno = [];
    if (enLinea()) conectar();
    if (conCaraACara) {
      if (!enLinea()) setTimeout(() => { rivalListo = true; if (alListos) alListos(); }, 1200); // el bot está listo enseguida
      caraACara(App, () => { turnoCambia(); if (App.estado.jugadorActivo !== App.humano) App.jugarIAs(); });
    } else turnoCambia();
    App.refrescar(); // la barra ya sabe que hay partida en red: botón de chat y reloj desde el principio
  }
  // Volver a la partida desde la pantalla de inicio: reconecta el canal si hiciera falta y vuelve a arrancar el reloj.
  // (6 sep 2026: salir al inicio sin querer dejaba el duelo inalcanzable y el reloj corriendo.)
  function reanudar(app, forzar) {
    if (app) App = app;
    if (!activo()) return false;
    if (enLinea() && sesion && (forzar || !canal)) conectar(); // reconecta: al volver de otra aplicación el canal puede estar muerto
    if (App.estado && App.estado.jugadorActivo !== App.humano) setTimeout(pedirTurno, 400); // por si su turno llegó mientras no estábamos
    turnoCambia();
    return true;
  }
  // Al volver a la aplicación (venías de WhatsApp, por ejemplo): reconectar y ponerse al día.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden || !activo()) return;
    reanudar(null, true);
  });
  function marcarListo() {
    yoListo = true;
    if (canal) canal.send({ type: "broadcast", event: "listo", payload: {} });
    if (alListos) alListos();
  }
  function conectar() {
    const cliente = FWM.nube.cliente(); if (!cliente) return;
    if (canal) { try { canal.unsubscribe(); } catch (e) { /* nada */ } }
    canal = cliente.channel("duelo:" + sesion.id, { config: { presence: { key: uid() }, broadcast: { self: false } } });
    canal.on("broadcast", { event: "turno" }, ({ payload }) => recibirTurno(payload));
    canal.on("broadcast", { event: "pide" }, ({ payload }) => { if (ultimoEnvio && ultimoEnvio.desde.turno === payload.turno && ultimoEnvio.desde.jugador === payload.jugador) canal.send({ type: "broadcast", event: "turno", payload: ultimoEnvio }); });
    canal.on("broadcast", { event: "abandono" }, () => { if (!activo()) return; if (esCoop()) seguirSinCompanero(true); else ganarPor("abandono"); });
    canal.on("broadcast", { event: "estado" }, ({ payload }) => recibirEstado(payload));
    canal.on("broadcast", { event: "pideEstado" }, () => { if (!esCoop() || !activo()) return; debeEnviarEstado = true; enviarEstadoSiPuedo(); });
    canal.on("broadcast", { event: "listo" }, () => { rivalListo = true; if (alListos) alListos(); });
    canal.on("broadcast", { event: "chat" }, ({ payload }) => chatRecibe(payload));
    canal.on("presence", { event: "sync" }, () => {
      const hay = Object.keys(canal.presenceState()).some(k => k === sesion.rival.uid);
      if (hay && !rivalPresente) {
        rivalPresente = true; clearTimeout(temporizadorGracia); temporizadorGracia = null; if (App.estado && App.estado.jugadorActivo !== App.humano) pedirTurno();
        chatAlVolverElOtro();
        // dobles: vuelve el compañero al que le llevaba el reino la máquina. Su copia se ha quedado atrás: le mando la mía y recupera su reino.
        if (esCoop() && llevoCompanero && !seFueDelTodo) { debeEnviarEstado = true; enviarEstadoSiPuedo(); }
      }
      if (!hay && rivalPresente) {
        rivalPresente = false; avisar(App.datos.textos.duelo.rivalDesconectado, GRACIA_DESCONEXION);
        temporizadorGracia = setTimeout(() => { if (!activo()) return; if (esCoop()) seguirSinCompanero(); else ganarPor("abandono"); }, GRACIA_DESCONEXION * 1000);
      }
    });
    canal.subscribe(async (estado) => { if (estado === "SUBSCRIBED") { await canal.track({ uid: uid(), desde: Date.now() }); if (yoListo) canal.send({ type: "broadcast", event: "listo", payload: {} }); pedirTurno(); } });
    arrancarLatido();
  }
  function pedirTurno() { if (canal && App.estado) canal.send({ type: "broadcast", event: "pide", payload: { turno: App.estado.turno, jugador: App.estado.jugadorActivo } }); }

  // El mensaje con el turno del rival se puede perder (la red va y viene, el móvil suspende la pestaña):
  // sin esto la partida se quedaba parada para siempre esperando un turno que ya se había jugado, que es
  // justo lo que le pasó a Rodrigo el 8 sep por la noche. Mientras espero, se lo pido cada 6 segundos y,
  // si tarda mucho, se avisa en pantalla con un botón para pedirlo a mano (9 sep 2026).
  const REINTENTO = 6000, AVISO_ESPERA = 25000;
  function arrancarLatido() {
    pararLatido(); esperandoDesde = 0;
    latido = setInterval(() => {
      if (!activo() || !enLinea() || !App.estado) return;
      if (esCoop()) { adoptarPendiente(); enviarEstadoSiPuedo(); }
      if (App.estado.jugadorActivo === App.humano || aplicando || App.ocupado) { esperandoDesde = 0; return; }
      if (!esperandoDesde) esperandoDesde = Date.now();
      pedirTurno();
      // también reenvío lo último que mandé: puede que fuera MI turno el que no le llegó a él
      if (ultimoEnvio && canal) canal.send({ type: "broadcast", event: "turno", payload: ultimoEnvio });
      if (Date.now() - esperandoDesde > AVISO_ESPERA) {
        esperandoDesde = Date.now(); // vuelve a avisar cada 25 s, no en cada intento
        const nombre = (App.estado.jugadores[App.estado.jugadorActivo] || {}).apodo || "";
        FWM.paneles.aviso(App.datos.textos.duelo.esperandoRival.replace("{nombre}", nombre), 4000);
      }
    }, REINTENTO);
  }
  function pararLatido() { clearInterval(latido); latido = null; }

  // Mi turno acaba: mando todas mis acciones de este turno más el fin de turno, con la firma del estado resultante.
  function enviarTurno(acciones, estadoDespues) {
    if (acciones.length > 1) turnosVacios = 0; // hizo algo: el contador de turnos vacíos vuelve a cero
    if (!enLinea() || !canal) return;
    // "desde" es el estado en el que estaba el rival antes de mi turno; "turno/jugador", en el que debe quedar después
    ultimoEnvio = { de: uid(), desde: { turno: App.estado.turno, jugador: App.humano }, turno: estadoDespues.turno, jugador: estadoDespues.jugadorActivo, acciones: acciones.map(a => { const c = Object.assign({}, a); delete c._automatica; return c; }), firma: firma(estadoDespues) };
    canal.send({ type: "broadcast", event: "turno", payload: ultimoEnvio });
  }

  // Llega el turno del rival: lo reproduzco acción a acción y compruebo la firma.
  function recibirTurno(p) {
    if (!activo() || aplicando || !App.estado || App.estado.jugadorActivo === App.humano || App.ocupado) return;
    const T = App.datos.textos;
    // ¿es el turno que espero? (el rival manda su turno T; yo estoy en T con jugadorActivo = rival)
    // un reenvío de un turno viejo (el latido reenvía el último) no se aplica: no es el que toca ahora
    if (p.desde && (p.desde.turno !== App.estado.turno || p.desde.jugador !== App.estado.jugadorActivo)) return;
    // dobles: si las copias no cuadran, no se anula la partida; se pide la del compañero y se sigue con ella
    const roto = () => { if (esCoop()) pedirEstado(); else anular(T.duelo.desincronizada); };
    const pasos = []; let e = App.estado;
    for (const a of p.acciones) {
      const r = FWM.motor.aplicar(e, App.datos, a);
      if (!r.ok) { roto(); return; }
      pasos.push({ antes: e, despues: r.estado, accion: a, eventos: r.eventos }); e = r.estado;
    }
    if (e.turno !== p.turno || e.jugadorActivo !== p.jugador || firma(e) !== p.firma) { roto(); return; }
    aplicando = true; pararReloj();
    App.reproducirPasos(pasos, () => { aplicando = false; App.estado = e; App.pila = []; App.jugarIAs(); });
  }

  // Al cambiar de turno (lo llama App): arranca el cronómetro si me toca; si no, el del rival (informativo).
  let ultimoTurnoAvisado = null;
  function turnoCambia() {
    if (!activo()) { pararReloj(); return; }
    if (document.getElementById("cara-a-cara")) return; // aún en la presentación: al cerrarla ya se llama (volver de otra app la tapaba con "¡Te toca!")
    const mio = App.estado.jugadorActivo === App.humano;
    // aviso de "te toca": el rival ha acabado y muchas veces el jugador está mirando otra cosa
    const clave = App.estado.turno + ":" + App.estado.jugadorActivo;
    if (mio && clave !== ultimoTurnoAvisado) {
      ultimoTurnoAvisado = clave;
      carteltuTurno();
      FWM.sonido.fanfarria();
      try { if (navigator.vibrate) navigator.vibrate([80, 60, 80]); } catch (e) { /* nada */ }
      try { if (document.hidden && window.Notification && Notification.permission === "granted") new Notification(App.datos.textos.duelo.tuTurno.replace("{n}", App.estado.turno)); } catch (e) { /* nada */ }
    }
    if (mio || enLinea()) arrancarReloj(SEG_TURNO, mio); else pararReloj();
  }
  // Cartel de "¡Te toca!" al empezar tu turno: un aviso pequeño se pierde si estás mirando otra cosa.
  // El turno corre igual desde el primer segundo (el reloj se ve bajando dentro del cartel); el botón
  // solo lo quita de en medio, y a los 6 s se va solo (9 sep 2026).
  function carteltuTurno() {
    const T = App.datos.textos;
    const viejo = document.getElementById("tu-turno"); if (viejo) viejo.remove();
    const capa = document.createElement("div"); capa.id = "tu-turno";
    const caja = document.createElement("div"); caja.className = "tu-turno-caja"; capa.appendChild(caja);
    const h = document.createElement("div"); h.className = "tu-turno-tit"; h.textContent = T.duelo.teToca; caja.appendChild(h);
    const sub = document.createElement("div"); sub.className = "tu-turno-sub"; sub.textContent = T.turno + " " + App.estado.turno; caja.appendChild(sub);
    const cuenta = document.createElement("div"); cuenta.className = "tu-turno-reloj"; caja.appendChild(cuenta);
    const pintar = () => { cuenta.textContent = "⏱ " + Math.max(0, segundos) + " s"; };
    pintar();
    const tic = setInterval(pintar, 250);
    const quitar = () => { clearInterval(tic); clearTimeout(solo); capa.classList.add("fuera"); setTimeout(() => capa.remove(), 220); };
    caja.appendChild(App.boton(T.duelo.vamos, quitar, "btn btn-primario"));
    capa.addEventListener("click", (e) => { if (!e.target.closest("button")) quitar(); });
    const solo = setTimeout(quitar, 6000);
    document.body.appendChild(capa);
  }

  function arrancarReloj(seg, mio) {
    pararReloj(); segundos = seg;
    // el reloj se calcula con la hora, no contando tics: si el móvil suspende la pestaña (al salir a otra
    // aplicación) los tics se paran y al volver el tiempo estaba mal (6 sep 2026)
    finEn = Date.now() + seg * 1000;
    reloj = setInterval(() => {
      const quedan = Math.ceil((finEn - Date.now()) / 1000);
      const cambio = quedan !== segundos; segundos = quedan;
      if (cambio) pintarReloj();
      if (segundos <= 10 && segundos > 0 && mio) FWM.sonido.tic();
      if (segundos <= 0) {
        pararReloj();
        if (mio && activo() && App.estado.jugadorActivo === App.humano && !App.ocupado) {
          // en la pantalla de inicio no se cuenta como turno abandonado: pierdes el turno, no la partida
          const enInicio = !!(FWM.inicio && FWM.inicio.visible());
          const vacio = !(App.accionesTurno && App.accionesTurno.length);
          turnosVacios = vacio ? (enInicio ? turnosVacios : turnosVacios + 1) : 0;
          App.cerrarModal();
          if (turnosVacios >= TURNOS_SIN_TOCAR) { FWM.paneles.aviso(App.datos.textos.duelo.abandonoPropio, 5000); rendirse("abandono"); return; }
          if (vacio && turnosVacios === TURNOS_SIN_TOCAR - 1) FWM.paneles.aviso(App.datos.textos.duelo.ultimoAviso, 5000);
          App.finTurno(true);
        }
      }
    }, 1000);
    pintarReloj();
  }
  function pararReloj() { clearInterval(reloj); reloj = null; }
  function pintarReloj() { const el = document.getElementById("barra-reloj"); if (!el) return; el.textContent = texto(); el.classList.toggle("urgente", segundos <= 10); }
  function texto() { if (!activo() || !reloj) return ""; return "⏱ " + segundos + " s"; }

  function avisar(t, seg) { FWM.paneles.aviso(t.replace("{s}", seg), 4000); }
  function ganarPor(motivo) {
    pararReloj();
    const e = Object.assign({}, App.estado, { ganador: App.humano, finDuelo: motivo });
    App.estado = e; App.ocupado = false; App.pila = [];
    App.guardar(); App.refrescar(); App.comprobarFin([{ tipo: "victoria", jugador: App.humano }]);
    salir();
  }
  // Dobles: si el compañero se cae y no vuelve, la partida sigue y su reino lo lleva la máquina.
  // Si vuelve (14 sep 2026), recupera su reino con la partida puesta al día. delTodo: se ha rendido, no vuelve.
  function seguirSinCompanero(delTodo) {
    const e = App.estado; if (!e) return;
    if (delTodo) seFueDelTodo = true;
    const otro = e.jugadores.find(j => j.remoto);
    if (!otro) return;
    llevoCompanero = true;
    otro.remoto = false; otro.humano = false; otro.personalidad = otro.personalidad || "guardiana";
    FWM.paneles.aviso(App.datos.textos.coop.companeroSeFue.replace("{nombre}", otro.apodo || ""), 5000);
    App.guardar(); App.refrescar();
    if (e.jugadorActivo === otro.id) App.jugarIAs();
  }

  // ---------- dobles: puesta al día ----------
  // Los dos teléfonos llevan cada uno su copia de la partida. Si se separan (el compañero estuvo fuera y
  // la máquina le llevó el reino, o un turno no cuadra), antes se acababan jugando dos partidas distintas:
  // el compañero te atacaba y cada uno veía un mapa diferente (14 sep 2026). Ahora uno manda su partida
  // entera (unos 40 KB) y el otro sigue con ella. Si las dos llegan a la vez, manda la del anfitrión.
  function pedirEstado() {
    if (!canal || Date.now() - ultimaPeticion < 5000) return;
    ultimaPeticion = Date.now();
    canal.send({ type: "broadcast", event: "pideEstado", payload: {} });
    FWM.paneles.aviso(App.datos.textos.coop.poniendoAlDia, 3000);
  }
  function enviarEstadoSiPuedo() {
    if (!debeEnviarEstado || !canal || !activo() || App.ocupado || aplicando || pendienteEstado) return;
    // a mitad de mi turno no: las acciones que ya hice irían dos veces. Se manda al acabarlo.
    if (App.estado.jugadorActivo === App.humano && App.accionesTurno && App.accionesTurno.length) return;
    const e = App.estado;
    const otro = e.jugadores[1 - App.humano];
    if (otro && !otro.remoto && !seFueDelTodo) { otro.remoto = true; otro.humano = false; llevoCompanero = false; }
    debeEnviarEstado = false; ultimoEstadoEnviado = Date.now();
    canal.send({ type: "broadcast", event: "estado", payload: { estado: Object.assign({}, e, { registro: [], ordenes: {} }) } });
    App.guardar(); App.refrescar(); turnoCambia();
  }
  function recibirEstado(p) {
    if (!esCoop() || !activo() || !p || !p.estado) return;
    if (sesion.rol === "anfitrion" && Date.now() - ultimoEstadoEnviado < 15000) return; // se cruzaron: vale la mía
    pendienteEstado = p.estado;
    adoptarPendiente();
  }
  function adoptarPendiente() {
    if (!pendienteEstado || aplicando || App.ocupado) return;
    const e = pendienteEstado; pendienteEstado = null;
    debeEnviarEstado = false; llevoCompanero = false;
    e.registro = App.estado.registro || []; e.ordenes = App.estado.ordenes || {};
    const mio = e.jugadores[App.humano]; mio.humano = true; mio.remoto = false;
    const otro = e.jugadores[1 - App.humano]; if (otro && !seFueDelTodo) { otro.humano = false; otro.remoto = true; }
    App.estado = e; App.pila = []; App.accionesTurno = []; App.modo = null;
    if (App.deseleccionar) App.deseleccionar();
    App.guardar(); App.refrescar(); App.dibujar();
    FWM.paneles.aviso(App.datos.textos.coop.puestaAlDia, 3000);
    turnoCambia();
    if (e.ganador != null) { App.comprobarFin([]); return; }
    const activoJ = e.jugadores[e.jugadorActivo];
    if (e.jugadorActivo !== App.humano && !activoJ.remoto) App.jugarIAs();
  }

  function anular(texto) {
    pararReloj();
    const e = Object.assign({}, App.estado, { ganador: -1, finDuelo: "anulada", resultadoAnotado: true });
    App.estado = e; App.ocupado = false; App.pila = [];
    App.guardar(); App.refrescar(); FWM.paneles.aviso(texto, 6000);
    salir();
  }
  // Me rindo / me voy: el rival gana.
  function rendirse(motivo) {
    if (canal) canal.send({ type: "broadcast", event: "abandono", payload: {} });
    pararReloj();
    // dobles: el que se va pierde su partida (ganan las hordas); el compañero sigue y la máquina lleva su reino
    const rival = esCoop() ? App.estado.jugadores.find(j => j.barbaros) : App.estado.jugadores.find(j => j.id !== App.humano);
    const e = Object.assign({}, App.estado, { ganador: rival ? rival.id : null, finDuelo: motivo === "abandono" ? "abandonoPropio" : "rendicion" });
    App.estado = e; App.ocupado = false; App.pila = [];
    App.guardar(); App.refrescar(); App.comprobarFin([{ tipo: "victoria", jugador: e.ganador }]);
    salir();
  }
  // Cara a cara: figuras, nombres y bandos de los dos, con las reglas. Cuenta atrás de 10 s y botón "¡Preparado!":
  // si los dos lo pulsan antes, se empieza ya.
  const ESPERA_CARA = 10;
  function caraACara(app, alAcabar) {
    App = app; const T = App.datos.textos; const e = App.estado;
    const capa = document.createElement("div"); capa.id = "cara-a-cara";
    const caja = document.createElement("div"); caja.className = "cara-caja"; capa.appendChild(caja);
    const fila = document.createElement("div"); fila.className = "cara-fila";
    // dobles: los dos compañeros juntos, VS y las hordas (antes las hordas salían como "Recluta" y el VS entre los compañeros)
    const coop = esCoop(); if (coop) fila.classList.add("tres");
    e.jugadores.filter(j => !j.barbaros).forEach((j, i) => {
      const lado = document.createElement("div"); lado.className = "cara-lado" + (j.id === App.humano ? " yo" : "");
      lado.appendChild(FWM.figuras.canvasHeroe(j.heroe || { clase: "espadachin", nivel: 1 }, j.color, 110, true, j.id !== App.humano));
      const fj = j.faccion && App.datos.facciones[j.faccion];
      const niv = document.createElement("div"); niv.className = "cara-nivel"; niv.textContent = fj ? fj.lider : FWM.heroes.nombreNivel(j.heroe && j.heroe.leyenda ? 11 : ((j.heroe && j.heroe.nivel) || 1)); lado.appendChild(niv);
      const n = document.createElement("div"); n.className = "cara-nombre"; n.textContent = j.apodo || j.nombre; n.style.color = j.color; lado.appendChild(n);
      const b = document.createElement("div"); b.className = "cara-bando"; b.textContent = j.nombre + (j.id === App.humano ? " " + T.tuSufijo : ""); lado.appendChild(b);
      const ok = document.createElement("div"); ok.className = "cara-listo"; ok.dataset.jugador = j.id; ok.textContent = "✓ " + T.duelo.listo; lado.appendChild(ok);
      fila.appendChild(lado);
      if (i === 0 && !coop) { const vs = document.createElement("div"); vs.className = "cara-vs"; vs.textContent = "VS"; fila.appendChild(vs); }
    });
    const horda = coop && e.jugadores.find(j => j.barbaros);
    if (horda) {
      const vs = document.createElement("div"); vs.className = "cara-vs"; vs.textContent = "VS"; fila.appendChild(vs);
      const lado = document.createElement("div"); lado.className = "cara-lado horda";
      lado.appendChild(FWM.figuras.canvasTropa("berserker", horda.color, 110, true, "vikingos"));
      const niv = document.createElement("div"); niv.className = "cara-nivel"; niv.textContent = T.barbaros.boton; lado.appendChild(niv);
      const n = document.createElement("div"); n.className = "cara-nombre"; n.textContent = horda.nombre; lado.appendChild(n);
      fila.appendChild(lado);
    }
    caja.appendChild(fila);
    const reglas = document.createElement("div"); reglas.className = "cara-reglas"; reglas.textContent = (coop ? T.coop.reglasLinea : T.duelo.reglasLinea).replace("{turnos}", e.limiteTurnos).replace("{s}", SEG_TURNO); caja.appendChild(reglas);
    const cuenta = document.createElement("div"); cuenta.className = "cara-cuenta"; caja.appendChild(cuenta);
    const btn = App.boton(T.duelo.preparado, () => { btn.disabled = true; marcarListo(); pintar(); }, "btn btn-primario cara-boton"); caja.appendChild(btn);
    document.body.appendChild(capa);
    let seg = ESPERA_CARA, hecho = false;
    const rivalId = App.estado.jugadores.find(j => j.id !== App.humano).id;
    const nombreRival = (sesion && sesion.rival && sesion.rival.nombre) || "";
    const pintar = () => {
      cuenta.textContent = T.duelo.empiezaEn.replace("{s}", seg);
      capa.querySelectorAll(".cara-listo").forEach(el => { const id = Number(el.dataset.jugador); el.classList.toggle("ver", id === App.humano ? yoListo : rivalListo); });
      if (yoListo && !rivalListo) btn.textContent = T.duelo.esperandoRival.replace("{nombre}", nombreRival);
    };
    const fin = () => { if (hecho) return; hecho = true; clearInterval(tic); alListos = null; capa.classList.add("fuera"); setTimeout(() => { capa.remove(); alAcabar && alAcabar(); }, 300); };
    alListos = () => { pintar(); if (yoListo && rivalListo) { FWM.sonido.fanfarria(); setTimeout(fin, 500); } };
    const tic = setInterval(() => { seg--; pintar(); if (seg <= 0) fin(); }, 1000);
    pintar(); FWM.sonido.fanfarria();
  }

  // ---------- chat: solo si los dos aceptan; frases hechas con desconocidos, texto libre entre amigos ----------
  const chat = { estado: "no", mensajes: [], abierto: false }; // estado: no | pedido | invitado | si | rechazado
  const nombreRival = () => (sesion && sesion.rival && sesion.rival.nombre) || "";
  const esAmigo = () => !!(sesion && /^(reto|coop)-/.test(String(sesion.id))); // dobles también es por código, entre amigos
  // El chat se guarda por partida (15 sep 2026): quien salía del juego y volvía lo encontraba cerrado y el otro ya
  // no le podía escribir. Se guardan el estado y los textos (las notas de voz no, pesan demasiado).
  const CLAVE_CHAT = "fwm.chat.";
  function chatGuardar() {
    if (!sesion || !sesion.id) return;
    try { localStorage.setItem(CLAVE_CHAT + sesion.id, JSON.stringify({ estado: chat.estado, mensajes: chat.mensajes.slice(-30).map(m => ({ quien: m.quien, texto: m.texto, mio: m.mio, t: m.t })) })); } catch (e) { /* nada */ }
  }
  function chatRecuperar() {
    if (!sesion || !sesion.id) return;
    try {
      for (let k = localStorage.length - 1; k >= 0; k--) { const clave = localStorage.key(k); if (clave && clave.startsWith(CLAVE_CHAT) && clave !== CLAVE_CHAT + sesion.id && clave !== "fwm.chat.sinAudios") localStorage.removeItem(clave); }
      const g = JSON.parse(localStorage.getItem(CLAVE_CHAT + sesion.id) || "null");
      if (g && g.estado === "si") { chat.estado = "si"; chat.mensajes = (g.mensajes || []).map(m => Object.assign({ audio: null }, m)); }
    } catch (e) { /* nada */ }
  }
  function chatEnviar(tipo, texto) { if (canal) canal.send({ type: "broadcast", event: "chat", payload: { tipo, texto: texto ? String(texto).slice(0, 120) : undefined, t: Date.now() } }); }
  function chatBoton() { // el botón Chat de la barra
    const T = App.datos.textos.duelo.chat;
    if (chat.estado === "si") { chat.abierto = !chat.abierto; chatPintar(); return; }
    if (chat.estado === "invitado") { chatPreguntar(); return; }
    if (chat.estado === "pedido") { chatEnviar("invitar"); FWM.paneles.aviso(T.pedido.replace("{nombre}", nombreRival()), 2500); return; }
    chat.estado = "pedido"; chatEnviar("invitar"); FWM.paneles.aviso(T.pedido.replace("{nombre}", nombreRival()), 3000);
  }
  function chatPreguntar() {
    const T = App.datos.textos.duelo.chat;
    App.modal(`<p>${T.invitar.replace("{nombre}", nombreRival())}</p>`, [[T.aceptar, () => { App.cerrarModal(); chat.estado = "si"; chat.abierto = true; chatEnviar("aceptar"); chatGuardar(); chatPintar(); }, "btn btn-primario"], [T.no, () => { App.cerrarModal(); chat.estado = "rechazado"; chatEnviar("rechazar"); chatGuardar(); }, "btn btn-claro"]]);
  }
  function chatRecibe(p) {
    const T = App.datos.textos.duelo.chat;
    // ya estábamos hablando y el otro vuelve sin su chat: se le contesta que sí, sin volver a preguntar
    if (p.tipo === "invitar") { if (chat.estado === "si") { chatEnviar("aceptar"); return; } if (chat.estado === "pedido") { chat.estado = "si"; chat.abierto = true; chatEnviar("aceptar"); chatGuardar(); chatPintar(); return; } chat.estado = "invitado"; chatPreguntar(); }
    else if (p.tipo === "aceptar") { const antes = chat.estado; chat.estado = "si"; chatGuardar(); if (antes !== "si") { chat.abierto = true; FWM.paneles.aviso(T.aceptado.replace("{nombre}", nombreRival()), 2500); } chatPintar(); }
    else if (p.tipo === "sigo") { if (chat.estado !== "si" && chat.estado !== "rechazado") { chat.estado = "si"; chatGuardar(); FWM.paneles.aviso(T.aceptado.replace("{nombre}", nombreRival()), 2500); chatPintar(); } }
    else if (p.tipo === "rechazar") { chat.estado = "rechazado"; chatGuardar(); FWM.paneles.aviso(T.rechazado.replace("{nombre}", nombreRival()), 3000); }
    else if (p.tipo === "mensaje" && chat.estado === "si") { chatMensaje(nombreRival(), p.texto, false, p.t); }
    else if (p.tipo === "audioTrozo" && chat.estado === "si" && esAmigo()) audioTrozo(p);
    else if (p.tipo === "audio" && chat.estado === "si" && esAmigo() && typeof p.audio === "string" && p.audio.startsWith("data:audio/")) {
      if (audiosSilenciados()) chatMensaje(nombreRival(), "🎤 " + T.audioSilenciada, false, p.t);
      else chatMensaje(nombreRival(), "🎤 " + T.audioNota, false, p.t, { src: p.audio, dur: Math.min(AUDIO_MAX, Number(p.dur) || 0) });
    }
  }
  // cuando el otro vuelve a la partida, se le recuerda que el chat seguía abierto
  function chatAlVolverElOtro() { if (chat.estado === "si") chatEnviar("sigo"); }
  function chatMensaje(quien, texto, mio, t, audio) {
    chat.mensajes.push({ quien, texto, mio, t: t || Date.now(), audio: audio || null }); chat.mensajes.sort((a, b) => a.t - b.t); if (chat.mensajes.length > 60) chat.mensajes.shift(); // por orden de envío (la red puede desordenar)
    // las notas de voz pesan: solo se guardan las 10 últimas para volver a escucharlas
    const conAudio = chat.mensajes.filter(m => m.audio); for (const m of conAudio.slice(0, Math.max(0, conAudio.length - 10))) m.audio = null;
    chatGuardar(); chatPintar();
    if (!mio) { FWM.sonido.pop(); chatBurbuja(quien, texto); }
  }

  // ---------- notas de voz: solo entre amigos, hasta 15 s, por el mismo canal y sin guardarse ----------
  // 15 sep 2026: se toca el micro para empezar a grabar y otra vez para parar (mantenerlo pulsado no funcionaba
  // bien); la nota queda lista para escucharla, borrarla o enviarla. Mientras se graba, la caja del chat se pone
  // roja con un punto que late y el tiempo, y la música se aparta.
  // Se graba en AAC (mp4) si el aparato sabe, que suena en iPhone y en Android; si no, en Opus. Viaja como texto
  // (base64) en trozos de 90 KB, porque un mensaje de Supabase no puede ser muy grande, y el otro los junta.
  const AUDIO_MAX = 15, AUDIO_MIN_MS = 600, AUDIO_TOPE_KB = 700, TROZO = 90 * 1024;
  let grabacion = null, borrador = null, reproduciendo = null;
  const llegando = {}; // id → { trozos: [], n, dur, t, desde }
  const puedeGrabar = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  const audiosSilenciados = () => { try { return localStorage.getItem("fwm.chat.sinAudios") === "1"; } catch (e) { return false; } };
  const musica = (si) => { try { if (FWM.musica && FWM.musica.apartar) FWM.musica.apartar(si); } catch (e) { /* nada */ } };
  function formatoAudio() {
    for (const m of ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/aac", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"]) { try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (e) { /* nada */ } }
    return "";
  }
  async function grabarEmpezar() {
    const T = App.datos.textos.duelo.chat;
    if (grabacion || chat.estado !== "si" || !esAmigo()) return;
    if (!puedeGrabar()) { FWM.paneles.aviso(T.audioNoVa, 3000); return; }
    pararReproduccion(); borrador = null;
    const g = grabacion = { trozos: [], inicio: Date.now(), parado: false, flujo: null, rec: null, tic: null, preparando: true };
    musica(true); chatPintar();
    try {
      g.flujo = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) { if (grabacion === g) grabacion = null; musica(false); FWM.paneles.aviso(T.audioSinPermiso, 3500); chatPintar(); return; }
    if (g.parado || grabacion !== g) { g.flujo.getTracks().forEach(x => x.stop()); if (grabacion === g) grabacion = null; musica(false); chatPintar(); return; }
    const mime = formatoAudio();
    try { g.rec = new MediaRecorder(g.flujo, Object.assign({ audioBitsPerSecond: 32000 }, mime ? { mimeType: mime } : {})); }
    catch (e) { g.flujo.getTracks().forEach(x => x.stop()); grabacion = null; musica(false); FWM.paneles.aviso(T.audioNoVa, 3000); chatPintar(); return; }
    g.rec.ondataavailable = (ev) => { if (ev.data && ev.data.size) g.trozos.push(ev.data); };
    g.rec.onstop = () => audioListo(g);
    try { g.rec.start(); } catch (e) { g.flujo.getTracks().forEach(x => x.stop()); grabacion = null; musica(false); FWM.paneles.aviso(T.audioNoVa, 3000); chatPintar(); return; }
    g.inicio = Date.now(); g.preparando = false;
    g.tic = setInterval(() => { pintarGrabando(); if (Date.now() - g.inicio >= AUDIO_MAX * 1000) grabarParar(g); }, 250);
    FWM.sonido.pop && FWM.sonido.pop();
    chatPintar();
  }
  function grabarParar(g) {
    if (!g || g.parado) return;
    g.parado = true; clearInterval(g.tic);
    if (g.rec && g.rec.state !== "inactive") g.rec.stop(); // al parar llega audioListo
    else { if (grabacion === g) grabacion = null; musica(false); chatPintar(); }
  }
  function grabarCancelar() { const g = grabacion; if (!g) return; g.descartar = true; grabarParar(g); }
  // la nota queda como borrador: se puede escuchar, borrar o enviar
  function audioListo(g) {
    const T = App.datos.textos.duelo.chat;
    if (g.flujo) g.flujo.getTracks().forEach(x => x.stop());
    if (grabacion === g) grabacion = null;
    musica(false);
    const ms = Date.now() - g.inicio;
    if (g.descartar) { chatPintar(); return; }
    if (ms < AUDIO_MIN_MS || !g.trozos.length) { FWM.paneles.aviso(T.audioCorta, 2000); chatPintar(); return; }
    const blob = new Blob(g.trozos, { type: (g.rec && g.rec.mimeType) || g.trozos[0].type || "audio/webm" });
    const lector = new FileReader();
    lector.onload = () => {
      const src = String(lector.result || "");
      if (!src.startsWith("data:audio/")) { FWM.paneles.aviso(T.audioNoVa, 3000); chatPintar(); return; }
      if (src.length / 1024 > AUDIO_TOPE_KB) { FWM.paneles.aviso(T.audioLargo, 3000); chatPintar(); return; }
      borrador = { src, dur: Math.max(1, Math.min(AUDIO_MAX, Math.round(ms / 1000))) };
      chatPintar();
    };
    lector.readAsDataURL(blob);
  }
  function enviarBorrador() {
    if (!borrador || chat.estado !== "si" || !canal) return;
    const { src, dur } = borrador; borrador = null; pararReproduccion();
    const t = Date.now(), id = t.toString(36) + Math.random().toString(36).slice(2, 6), n = Math.ceil(src.length / TROZO);
    for (let i = 0; i < n; i++) canal.send({ type: "broadcast", event: "chat", payload: { tipo: "audioTrozo", id, i, n, trozo: src.slice(i * TROZO, (i + 1) * TROZO), dur, t } });
    chatMensaje(yo().nombre, "🎤 " + App.datos.textos.duelo.chat.audioNota, true, t, { src, dur });
  }
  function audioTrozo(p) {
    if (!p.id || typeof p.trozo !== "string" || !(p.n > 0 && p.n <= 10) || !(p.i >= 0 && p.i < p.n)) return;
    for (const [k, v] of Object.entries(llegando)) if (Date.now() - v.desde > 60000) delete llegando[k]; // los que se quedaron a medias
    const a = llegando[p.id] = llegando[p.id] || { trozos: [], n: p.n, dur: p.dur, t: p.t, desde: Date.now() };
    a.trozos[p.i] = p.trozo;
    if (a.trozos.filter(x => typeof x === "string").length < a.n) return;
    delete llegando[p.id];
    chatRecibe({ tipo: "audio", audio: a.trozos.join(""), dur: a.dur, t: a.t });
  }
  const mmss = (s) => "0:" + String(Math.max(0, Math.min(59, s | 0))).padStart(2, "0");
  function pintarGrabando() {
    const el = document.querySelector("#chat .chat-rec-tiempo"); if (!el || !grabacion) return;
    el.textContent = grabacion.preparando ? "" : mmss(Math.min(AUDIO_MAX, Math.floor((Date.now() - grabacion.inicio) / 1000)));
  }
  function pararReproduccion() { if (reproduciendo) { reproduciendo.audio.pause(); reproduciendo = null; musica(false); } }
  // m: un mensaje con audio, o el borrador
  function reproducir(m) {
    if (reproduciendo) { const era = reproduciendo.m; pararReproduccion(); chatPintar(); if (era === m) return; }
    const src = m.audio ? m.audio.src : m.src;
    const a = new Audio(src);
    reproduciendo = { audio: a, m };
    musica(true);
    a.onended = a.onerror = () => { if (reproduciendo && reproduciendo.audio === a) { reproduciendo = null; musica(false); chatPintar(); } };
    a.play().catch(() => { reproduciendo = null; musica(false); FWM.paneles.aviso(App.datos.textos.duelo.chat.audioNoSuena, 3000); chatPintar(); });
    chatPintar();
  }
  function chatDecir(texto) { texto = String(texto || "").trim(); if (!texto || chat.estado !== "si") return; chatEnviar("mensaje", texto); chatMensaje(yo().nombre, texto, true); }
  // burbuja sobre el mapa con el último mensaje del rival, se apaga sola
  function chatBurbuja(quien, texto) {
    let b = document.getElementById("chat-burbuja"); if (!b) { b = document.createElement("div"); b.id = "chat-burbuja"; document.body.appendChild(b); }
    b.textContent = quien + ": " + texto; b.classList.add("ver"); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove("ver"), 6000);
  }
  function boton(clase, texto, alTocar, titulo) { const b = document.createElement("button"); b.className = clase; b.textContent = texto; if (titulo) b.title = b.ariaLabel = titulo; b.addEventListener("click", alTocar); return b; }
  function chatPintar() {
    const T = App.datos.textos.duelo.chat;
    let c = document.getElementById("chat"); if (!c) { c = document.createElement("div"); c.id = "chat"; document.body.appendChild(c); }
    c.hidden = !(chat.abierto && chat.estado === "si" && activo());
    c.classList.toggle("grabando", !!grabacion);
    if (c.hidden) return;
    // en el móvil va arriba: justo debajo de la barra, que es más alta a dobles (marcador) y tapaba sus botones
    const barra = document.getElementById("barra");
    if (window.innerWidth <= 760 && barra) c.style.top = Math.round(barra.getBoundingClientRect().bottom + 6) + "px"; else c.style.top = "";
    c.innerHTML = "";
    const cab = document.createElement("div"); cab.className = "chat-cab"; const tit = document.createElement("span"); tit.textContent = T.boton + " · " + nombreRival(); cab.appendChild(tit);
    const botonesCab = document.createElement("span");
    if (esAmigo()) { // silenciar las notas de voz del otro
      const sinAudios = audiosSilenciados();
      botonesCab.appendChild(boton("chat-cerrar", sinAudios ? "🔇" : "🔊", () => { try { localStorage.setItem("fwm.chat.sinAudios", sinAudios ? "0" : "1"); } catch (e) { /* nada */ } if (!sinAudios) pararReproduccion(); FWM.paneles.aviso(sinAudios ? T.audioActivados : T.audioSilenciados, 2000); chatPintar(); }, sinAudios ? T.audioActivar : T.audioSilenciar));
    }
    botonesCab.appendChild(boton("chat-cerrar", "✕", () => { chat.abierto = false; chatPintar(); }));
    cab.appendChild(botonesCab); c.appendChild(cab);
    const lista = document.createElement("div"); lista.className = "chat-lista";
    for (const m of chat.mensajes) {
      const d = document.createElement("div"); d.className = "chat-msg" + (m.mio ? " mio" : "");
      if (m.audio) {
        d.classList.add("chat-audio");
        d.appendChild(boton("chat-play", reproduciendo && reproduciendo.m === m ? "⏸" : "▶", () => reproducir(m), T.audioNota));
        const dur = document.createElement("span"); dur.textContent = "🎤 " + mmss(m.audio.dur || 0); d.appendChild(dur);
      } else d.textContent = m.texto;
      lista.appendChild(d);
    }
    c.appendChild(lista); lista.scrollTop = lista.scrollHeight;
    // grabando: la fila entera es el aviso, con el tiempo y los botones de parar o cancelar
    if (grabacion) {
      const rec = document.createElement("div"); rec.className = "chat-rec";
      rec.innerHTML = `<i class="chat-rec-punto"></i><b>${grabacion.preparando ? T.audioPreparando : T.audioGrabandoCorto}</b><span class="chat-rec-tiempo"></span>`;
      rec.appendChild(boton("btn btn-peq chat-rec-cancelar", "✕", grabarCancelar, T.audioBorrar));
      rec.appendChild(boton("btn btn-peq chat-rec-parar", "■ " + T.audioParar, () => grabarParar(grabacion)));
      c.appendChild(rec); pintarGrabando(); return;
    }
    // nota grabada y aún sin enviar
    if (borrador) {
      const fila = document.createElement("div"); fila.className = "chat-borrador";
      fila.appendChild(boton("chat-play", reproduciendo && reproduciendo.m === borrador ? "⏸" : "▶", () => reproducir(borrador), T.audioEscuchar));
      const dur = document.createElement("span"); dur.className = "chat-borrador-dur"; dur.textContent = "🎤 " + mmss(borrador.dur); fila.appendChild(dur);
      fila.appendChild(boton("btn btn-peq btn-claro", "🗑", () => { pararReproduccion(); borrador = null; chatPintar(); }, T.audioBorrar));
      fila.appendChild(boton("btn btn-peq btn-primario", T.enviar, enviarBorrador));
      c.appendChild(fila); return;
    }
    const frases = document.createElement("div"); frases.className = "chat-frases";
    for (const f of T.frases) frases.appendChild(boton("btn btn-peq btn-claro", f, () => chatDecir(f)));
    c.appendChild(frases);
    if (esAmigo()) { // texto libre y notas de voz solo entre amigos (reto por código)
      const fila = document.createElement("div"); fila.className = "chat-fila";
      const inp = document.createElement("input"); inp.placeholder = T.escribe; inp.maxLength = 120; inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { chatDecir(inp.value); inp.value = ""; } });
      fila.appendChild(inp);
      fila.appendChild(boton("btn btn-peq btn-primario", T.enviar, () => { chatDecir(inp.value); inp.value = ""; inp.focus(); }));
      if (puedeGrabar()) fila.appendChild(boton("btn btn-peq chat-micro", "🎤", grabarEmpezar, T.audioTocar));
      c.appendChild(fila);
    }
  }
  function chatReiniciar() {
    if (grabacion) grabarCancelar();
    pararReproduccion(); borrador = null;
    chat.estado = "no"; chat.mensajes = []; chat.abierto = false; const c = document.getElementById("chat"); if (c) c.hidden = true; }

  // Elo sencillo (K = 32) al acabar un duelo contra humano. Lo llama App.comprobarFin la primera vez que anota.
  // Cada teléfono escribe su propio Elo; el duelo se guarda una vez (clave = id de sesión).
  const K = 32;
  function elo(miElo, suElo, gane) { const esperado = 1 / (1 + Math.pow(10, (suElo - miElo) / 400)); return Math.round(K * ((gane ? 1 : 0) - esperado)); }
  function alAcabar(estadoFinal) {
    if (!sesion || sesion.rol === "bot" || !sesion.rival || !sesion.rival.uid || !uid()) return null;
    if (estadoFinal.ganador == null || estadoFinal.ganador === -1) return null;
    const gane = estadoFinal.ganador === App.humano;
    const miElo = sesion.miElo || 1000, suElo = sesion.rival.elo || 1000;
    const cambio = elo(miElo, suElo, gane); const delta = Math.abs(cambio);
    const nuevo = miElo + cambio;
    const anfitrion = sesion.rol === "anfitrion" ? uid() : sesion.rival.uid, invitado = sesion.rol === "anfitrion" ? sesion.rival.uid : uid();
    FWM.nube.registrarDuelo({ clave: sesion.id, anfitrion, invitado, ganador: gane ? uid() : sesion.rival.uid, motivo: estadoFinal.finDuelo || null, delta, eloAnfitrion: sesion.rol === "anfitrion" ? miElo : suElo, eloInvitado: sesion.rol === "anfitrion" ? suElo : miElo }).catch(() => {});
    FWM.nube.cambiarElo(nuevo).catch(() => {});
    return { antes: miElo, despues: nuevo, cambio };
  }

  function salir() {
    chatReiniciar();
    pararReloj(); pararLatido(); clearTimeout(temporizadorGracia); temporizadorGracia = null;
    if (canal) { const c = canal; canal = null; c.untrack().then(() => c.unsubscribe()).catch(() => {}); }
    cancelarBusqueda();
  }

  return { chatBoton, alAcabar, buscar, retar, esCoop, seguirSinCompanero, cancelarBusqueda, empezar, reanudar, caraACara, enviarTurno, turnoCambia, texto, rendirse, salir, activo, enLinea, sesion: () => sesion, SEG_TURNO, ESPERA_COLA };
})();
