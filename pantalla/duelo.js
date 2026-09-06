// Duelo online: 1 contra 1 en directo, Rápida a 20 turnos, 60 s por turno.
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
  let alEmparejar = null, temporizadorCola = null, turnosVacios = 0;

  const uid = () => (FWM.nube.usuario() && FWM.nube.usuario().id) || null;
  const yo = () => { const h = FWM.heroe.paraPartida({}); return { uid: uid(), nombre: FWM.nube.nombre() || FWM.guardado.ajustes().nombre || "Jugador", avatar: h.clase, heroe: h, nivel: h.nivel, elo: (FWM.nube.perfil() && FWM.nube.perfil().elo) || 1000 }; };
  // Hay duelo vivo mirando la partida en curso, no la referencia interna: si el módulo aún no se ha arrancado
  // (recarga de la página, por ejemplo) el duelo seguía existiendo pero se daba por inactivo y el botón Menú
  // sacaba al inicio sin remedio (6 sep 2026).
  const app = () => App || FWM.app || null;
  const activo = () => { const a = app(); return !!(a && a.opciones && a.opciones.duelo && a.estado && a.estado.ganador == null); };
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
        const ses = { id: anf.uid.slice(0, 8) + "-" + Date.now().toString(36), semilla: Math.floor(Math.random() * 1e6) + 1, rol: "anfitrion", rival: { uid: inv.uid, nombre: inv.nombre, avatar: inv.avatar, heroe: inv.heroe, elo: inv.elo }, miElo: m.elo };
        canalCola.send({ type: "broadcast", event: "empezar", payload: { a: inv.uid, de: anf.uid, id: ses.id, semilla: ses.semilla, nombre: m.nombre, avatar: m.avatar, heroe: m.heroe, elo: m.elo, proto: FWM.PROTOCOLO } });
        setTimeout(() => arrancar(ses), 300);
      }
    });
    cola.on("broadcast", { event: "empezar" }, ({ payload }) => {
      if (emparejado || payload.a !== m.uid) return;
      if ((payload.proto || 0) !== FWM.PROTOCOLO) { alEstado(App.datos.textos.duelo.otraVersion, null); return; }
      arrancar({ id: payload.id, semilla: payload.semilla, rol: "invitado", rival: { uid: payload.de, nombre: payload.nombre, avatar: payload.avatar, heroe: payload.heroe, elo: payload.elo }, miElo: m.elo });
    });
    cola.subscribe(async (estado) => { if (estado === "SUBSCRIBED") await cola.track({ uid: m.uid, nombre: m.nombre, avatar: m.avatar, heroe: m.heroe, nivel: m.nivel, elo: m.elo, desde, proto: FWM.PROTOCOLO }); });
    temporizadorCola = setInterval(() => {
      quedan--; alEstado(App.datos.textos.duelo.buscando, quedan);
      if (ESPERA_COLA - quedan >= segundoBot) { // nadie a tiempo: bot con nombre de jugador, como si acabara de entrar alguien
        const g = FWM.azar.crear(Date.now() % 100000);
        arrancar({ id: "bot-" + Date.now().toString(36), semilla: Math.floor(Math.random() * 1e6) + 1, rol: "bot", rival: { uid: null, nombre: g.elegir(App.datos.nombresIA || ["Rival"]), avatar: g.elegir(["campesino", "lancero", "espadachin", "arquero", "caballero"]) } });
      }
    }, 1000);
    return true;
  }

  // Reto a un amigo: quien crea el código espera; quien lo escribe entra. Sin bot.
  function retar(app, codigo, alEstado, alEmpezar, opciones) {
    App = app; salir(); const igualar = !!(opciones && opciones.igualar);
    const cliente = FWM.nube.cliente(); if (!cliente || !uid()) return null;
    const m = yo(); const creador = !codigo;
    if (!codigo) { const g = FWM.azar.crear(Date.now() % 1000003); codigo = ""; for (let i = 0; i < 4; i++) codigo += LETRAS[g.entero ? g.entero(0, LETRAS.length - 1) : Math.floor(Math.random() * LETRAS.length)]; }
    codigo = codigo.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
    let emparejado = false;
    alEstado(creador ? App.datos.textos.duelo.esperandoAmigo : App.datos.textos.duelo.entrando, null, codigo);
    cola = cliente.channel("reto:" + codigo, { config: { presence: { key: m.uid }, broadcast: { self: false } } });
    const canalReto = cola;
    const arrancar = (ses) => { if (emparejado) return; emparejado = true; const c = cola; cola = null; if (c) c.untrack().then(() => c.unsubscribe()).catch(() => {}); alEmpezar(ses); };
    cola.on("presence", { event: "sync" }, () => {
      if (emparejado || !creador || cola !== canalReto) return;
      const lista = Object.values(canalReto.presenceState()).map(l => l[0]).filter(p => p && p.uid && p.uid !== m.uid);
      if (!lista.length) return;
      const inv = lista[0];
      if ((inv.proto || 0) !== FWM.PROTOCOLO) { alEstado(App.datos.textos.duelo.otraVersion, null, codigo); return; } // reglas distintas: no se empieza
      const ses = { id: "reto-" + codigo + "-" + Date.now().toString(36), semilla: Math.floor(Math.random() * 1e6) + 1, rol: "anfitrion", rival: { uid: inv.uid, nombre: inv.nombre, avatar: inv.avatar, heroe: inv.heroe, elo: inv.elo }, miElo: m.elo, igualar };
      canalReto.send({ type: "broadcast", event: "empezar", payload: { a: inv.uid, de: m.uid, id: ses.id, semilla: ses.semilla, nombre: m.nombre, avatar: m.avatar, heroe: m.heroe, elo: m.elo, igualar, proto: FWM.PROTOCOLO } });
      setTimeout(() => arrancar(ses), 300);
    });
    cola.on("broadcast", { event: "empezar" }, ({ payload }) => {
      if (emparejado || payload.a !== m.uid) return;
      if ((payload.proto || 0) !== FWM.PROTOCOLO) { alEstado(App.datos.textos.duelo.otraVersion, null, codigo); return; }
      arrancar({ id: payload.id, semilla: payload.semilla, rol: "invitado", rival: { uid: payload.de, nombre: payload.nombre, avatar: payload.avatar, heroe: payload.heroe, elo: payload.elo }, miElo: m.elo, igualar: !!payload.igualar });
    });
    cola.subscribe(async (estado) => { if (estado === "SUBSCRIBED") await cola.track({ uid: m.uid, nombre: m.nombre, avatar: m.avatar, heroe: m.heroe, nivel: m.nivel, elo: m.elo, creador, proto: FWM.PROTOCOLO }); });
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
    App.accionesTurno = [];
    if (enLinea()) conectar();
    if (conCaraACara) {
      if (!enLinea()) setTimeout(() => { rivalListo = true; if (alListos) alListos(); }, 1200); // el bot está listo enseguida
      caraACara(App, () => { turnoCambia(); if (App.estado.jugadorActivo !== App.humano) App.jugarIAs(); });
    } else turnoCambia();
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
    canal.on("broadcast", { event: "abandono" }, () => { if (activo()) ganarPor("abandono"); });
    canal.on("broadcast", { event: "listo" }, () => { rivalListo = true; if (alListos) alListos(); });
    canal.on("broadcast", { event: "chat" }, ({ payload }) => chatRecibe(payload));
    canal.on("presence", { event: "sync" }, () => {
      const hay = Object.keys(canal.presenceState()).some(k => k === sesion.rival.uid);
      if (hay && !rivalPresente) { rivalPresente = true; clearTimeout(temporizadorGracia); temporizadorGracia = null; if (App.estado && App.estado.jugadorActivo !== App.humano) pedirTurno(); }
      if (!hay && rivalPresente) { rivalPresente = false; avisar(App.datos.textos.duelo.rivalDesconectado, GRACIA_DESCONEXION); temporizadorGracia = setTimeout(() => { if (activo()) ganarPor("abandono"); }, GRACIA_DESCONEXION * 1000); }
    });
    canal.subscribe(async (estado) => { if (estado === "SUBSCRIBED") { await canal.track({ uid: uid(), desde: Date.now() }); if (yoListo) canal.send({ type: "broadcast", event: "listo", payload: {} }); pedirTurno(); } });
  }
  function pedirTurno() { if (canal && App.estado) canal.send({ type: "broadcast", event: "pide", payload: { turno: App.estado.turno, jugador: App.estado.jugadorActivo } }); }

  // Mi turno acaba: mando todas mis acciones de este turno más el fin de turno, con la firma del estado resultante.
  function enviarTurno(acciones, estadoDespues) {
    if (acciones.length > 1) turnosVacios = 0; // hizo algo: el contador de turnos vacíos vuelve a cero
    if (!enLinea() || !canal) return;
    // "desde" es el estado en el que estaba el rival antes de mi turno; "turno/jugador", en el que debe quedar después
    ultimoEnvio = { de: uid(), desde: { turno: App.estado.turno, jugador: App.humano }, turno: estadoDespues.turno, jugador: estadoDespues.jugadorActivo, acciones: acciones.map(a => { const c = Object.assign({}, a); delete c._automatica; return c; }), firma: firma(estadoDespues) };
    canal.send({ type: "broadcast", event: "turno", payload: ultimoEnvio });
  }

  // Llega el turno del rival: lo reproduzco acción a acción y compruebo la firma.
  let aplicando = false;
  function recibirTurno(p) {
    if (!activo() || aplicando || !App.estado || App.estado.jugadorActivo === App.humano || App.ocupado) return;
    const T = App.datos.textos;
    // ¿es el turno que espero? (el rival manda su turno T; yo estoy en T con jugadorActivo = rival)
    const pasos = []; let e = App.estado;
    for (const a of p.acciones) {
      const r = FWM.motor.aplicar(e, App.datos, a);
      if (!r.ok) { anular(T.duelo.desincronizada); return; }
      pasos.push({ antes: e, despues: r.estado, accion: a, eventos: r.eventos }); e = r.estado;
    }
    if (e.turno !== p.turno || e.jugadorActivo !== p.jugador || firma(e) !== p.firma) { anular(T.duelo.desincronizada); return; }
    aplicando = true; pararReloj();
    App.reproducirPasos(pasos, () => { aplicando = false; App.estado = e; App.pila = []; App.jugarIAs(); });
  }

  // Al cambiar de turno (lo llama App): arranca el cronómetro si me toca; si no, el del rival (informativo).
  let ultimoTurnoAvisado = null;
  function turnoCambia() {
    if (!activo()) { pararReloj(); return; }
    const mio = App.estado.jugadorActivo === App.humano;
    // aviso de "te toca": el rival ha acabado y muchas veces el jugador está mirando otra cosa
    const clave = App.estado.turno + ":" + App.estado.jugadorActivo;
    if (mio && clave !== ultimoTurnoAvisado) {
      ultimoTurnoAvisado = clave;
      FWM.paneles.aviso(App.datos.textos.duelo.tuTurno.replace("{n}", App.estado.turno), 3500);
      FWM.sonido.fanfarria();
      try { if (navigator.vibrate) navigator.vibrate([80, 60, 80]); } catch (e) { /* nada */ }
      try { if (document.hidden && window.Notification && Notification.permission === "granted") new Notification(App.datos.textos.duelo.tuTurno.replace("{n}", App.estado.turno)); } catch (e) { /* nada */ }
    }
    if (mio || enLinea()) arrancarReloj(SEG_TURNO, mio); else pararReloj();
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
    const rival = App.estado.jugadores.find(j => j.id !== App.humano);
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
    e.jugadores.forEach((j, i) => {
      const lado = document.createElement("div"); lado.className = "cara-lado" + (j.id === App.humano ? " yo" : "");
      lado.appendChild(FWM.figuras.canvasHeroe(j.heroe || { clase: "espadachin", nivel: 1 }, j.color, 110, true, j.id !== App.humano));
      const niv = document.createElement("div"); niv.className = "cara-nivel"; niv.textContent = FWM.heroes.nombreNivel((j.heroe && j.heroe.nivel) || 1); lado.appendChild(niv);
      const n = document.createElement("div"); n.className = "cara-nombre"; n.textContent = j.apodo || j.nombre; n.style.color = j.color; lado.appendChild(n);
      const b = document.createElement("div"); b.className = "cara-bando"; b.textContent = j.nombre + (j.id === App.humano ? " " + T.tuSufijo : ""); lado.appendChild(b);
      const ok = document.createElement("div"); ok.className = "cara-listo"; ok.dataset.jugador = j.id; ok.textContent = "✓ " + T.duelo.listo; lado.appendChild(ok);
      fila.appendChild(lado);
      if (i === 0) { const vs = document.createElement("div"); vs.className = "cara-vs"; vs.textContent = "VS"; fila.appendChild(vs); }
    });
    caja.appendChild(fila);
    const reglas = document.createElement("div"); reglas.className = "cara-reglas"; reglas.textContent = T.duelo.reglasLinea.replace("{turnos}", e.limiteTurnos).replace("{s}", SEG_TURNO); caja.appendChild(reglas);
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
  const esAmigo = () => !!(sesion && String(sesion.id).startsWith("reto-"));
  function chatEnviar(tipo, texto) { if (canal) canal.send({ type: "broadcast", event: "chat", payload: { tipo, texto: texto ? String(texto).slice(0, 120) : undefined, t: Date.now() } }); }
  function chatBoton() { // el botón Chat de la barra
    const T = App.datos.textos.duelo.chat;
    if (chat.estado === "si") { chat.abierto = !chat.abierto; chatPintar(); return; }
    if (chat.estado === "invitado") { chatPreguntar(); return; }
    if (chat.estado === "pedido") { FWM.paneles.aviso(T.pedido.replace("{nombre}", nombreRival()), 2500); return; }
    chat.estado = "pedido"; chatEnviar("invitar"); FWM.paneles.aviso(T.pedido.replace("{nombre}", nombreRival()), 3000);
  }
  function chatPreguntar() {
    const T = App.datos.textos.duelo.chat;
    App.modal(`<p>${T.invitar.replace("{nombre}", nombreRival())}</p>`, [[T.aceptar, () => { App.cerrarModal(); chat.estado = "si"; chat.abierto = true; chatEnviar("aceptar"); chatPintar(); }, "btn btn-primario"], [T.no, () => { App.cerrarModal(); chat.estado = "rechazado"; chatEnviar("rechazar"); }, "btn btn-claro"]]);
  }
  function chatRecibe(p) {
    const T = App.datos.textos.duelo.chat;
    if (p.tipo === "invitar") { if (chat.estado === "si") return; if (chat.estado === "pedido") { chat.estado = "si"; chat.abierto = true; chatEnviar("aceptar"); chatPintar(); return; } chat.estado = "invitado"; chatPreguntar(); }
    else if (p.tipo === "aceptar") { chat.estado = "si"; chat.abierto = true; FWM.paneles.aviso(T.aceptado.replace("{nombre}", nombreRival()), 2500); chatPintar(); }
    else if (p.tipo === "rechazar") { chat.estado = "rechazado"; FWM.paneles.aviso(T.rechazado.replace("{nombre}", nombreRival()), 3000); }
    else if (p.tipo === "mensaje" && chat.estado === "si") { chatMensaje(nombreRival(), p.texto, false, p.t); }
  }
  function chatMensaje(quien, texto, mio, t) {
    chat.mensajes.push({ quien, texto, mio, t: t || Date.now() }); chat.mensajes.sort((a, b) => a.t - b.t); if (chat.mensajes.length > 60) chat.mensajes.shift(); // por orden de envío (la red puede desordenar)
    chatPintar();
    if (!mio) { FWM.sonido.pop(); chatBurbuja(quien, texto); }
  }
  function chatDecir(texto) { texto = String(texto || "").trim(); if (!texto || chat.estado !== "si") return; chatEnviar("mensaje", texto); chatMensaje(yo().nombre, texto, true); }
  // burbuja sobre el mapa con el último mensaje del rival, se apaga sola
  function chatBurbuja(quien, texto) {
    let b = document.getElementById("chat-burbuja"); if (!b) { b = document.createElement("div"); b.id = "chat-burbuja"; document.body.appendChild(b); }
    b.textContent = quien + ": " + texto; b.classList.add("ver"); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove("ver"), 6000);
  }
  function chatPintar() {
    const T = App.datos.textos.duelo.chat;
    let c = document.getElementById("chat"); if (!c) { c = document.createElement("div"); c.id = "chat"; document.body.appendChild(c); }
    c.hidden = !(chat.abierto && chat.estado === "si" && activo());
    if (c.hidden) return;
    c.innerHTML = "";
    const cab = document.createElement("div"); cab.className = "chat-cab"; cab.textContent = T.boton + " · " + nombreRival(); const x = document.createElement("button"); x.className = "chat-cerrar"; x.textContent = "✕"; x.addEventListener("click", () => { chat.abierto = false; chatPintar(); }); cab.appendChild(x); c.appendChild(cab);
    const lista = document.createElement("div"); lista.className = "chat-lista";
    for (const m of chat.mensajes) { const d = document.createElement("div"); d.className = "chat-msg" + (m.mio ? " mio" : ""); d.textContent = m.texto; lista.appendChild(d); }
    c.appendChild(lista); lista.scrollTop = lista.scrollHeight;
    const frases = document.createElement("div"); frases.className = "chat-frases";
    for (const f of T.frases) { const b = document.createElement("button"); b.className = "btn btn-peq btn-claro"; b.textContent = f; b.addEventListener("click", () => chatDecir(f)); frases.appendChild(b); }
    c.appendChild(frases);
    if (esAmigo()) { // texto libre solo entre amigos (reto por código)
      const fila = document.createElement("div"); fila.className = "chat-fila";
      const inp = document.createElement("input"); inp.placeholder = T.escribe; inp.maxLength = 120; inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { chatDecir(inp.value); inp.value = ""; } });
      const env = document.createElement("button"); env.className = "btn btn-peq btn-primario"; env.textContent = T.enviar; env.addEventListener("click", () => { chatDecir(inp.value); inp.value = ""; inp.focus(); });
      fila.appendChild(inp); fila.appendChild(env); c.appendChild(fila);
    }
  }
  function chatReiniciar() { chat.estado = "no"; chat.mensajes = []; chat.abierto = false; const c = document.getElementById("chat"); if (c) c.hidden = true; }

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
    pararReloj(); clearTimeout(temporizadorGracia); temporizadorGracia = null;
    if (canal) { const c = canal; canal = null; c.untrack().then(() => c.unsubscribe()).catch(() => {}); }
    cancelarBusqueda();
  }

  return { chatBoton, alAcabar, buscar, retar, cancelarBusqueda, empezar, reanudar, caraACara, enviarTurno, turnoCambia, texto, rendirse, salir, activo, enLinea, sesion: () => sesion, SEG_TURNO, ESPERA_COLA };
})();
