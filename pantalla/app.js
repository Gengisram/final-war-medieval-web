// Arranque y estado de la interfaz.
window.FWM = window.FWM || {};

const App = (function () {
  // Colores de reino. La paleta "daltonicos" evita el par rojo/verde (es la de Okabe e Ito, pensada para
  // que se distingan con cualquier tipo de daltonismo). Se elige en Ajustes (6 sep 2026).
  // Ocho colores: en los grandes escenarios puede haber ocho reinos y con cinco los tres últimos se
  // quedaban sin color, lo que rompía el dibujo del mapa a media pintada (7 sep 2026).
  const PALETAS = {
    normal: ["#2f6fd6", "#d63b3b", "#2e9e4f", "#d6a92e", "#8e3bd6", "#e2761b", "#17a2a2", "#c2185b"],
    daltonicos: ["#0072b2", "#e69f00", "#56b4e9", "#cc79a7", "#5b3d8a", "#009e73", "#d55e00", "#7f7f7f"],
  };
  const COLORES_POR_DEFECTO = PALETAS.normal;
  const paleta = () => PALETAS[(FWM.guardado.ajustes().paleta)] || PALETAS.normal;
  const TAMANOS = { mini: [11, 9], pequeno: [13, 10], mediano: [15, 12], grande: [19, 15] };

  const App = {
    datos: null, estado: null, pila: [], registro: [], sel: {}, posibles: vacio(),
    humano: 0, ocupado: false, opciones: null, L: null, modo: null, avisoFin: 0,
  };
  function vacio() { return { mover: {}, atacar: [], asediar: [], reclamar: false, fundar: false, mejorarA: [], atrincherar: false }; }

  // Android/Chrome avisan cuando la app se puede instalar; guardamos el aviso para el botón del inicio
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); window.__instalar = e; if (FWM.inicio && FWM.inicio.visible()) FWM.inicio.refrescar(); });

  App.iniciar = function () {
    document.body.style.visibility = "visible"; // ya hay estilos y código: se enseña la página
    App.datos = FWM.cargador.cargar([]);
    const canvas = document.getElementById("mapa");
    App.L = FWM.lienzo.crear(canvas);
    App.L.redimensionar();
    window.addEventListener("resize", () => { App.etiquetasBotones(); if (App.estado) { App.L.encuadrar(App.estado, App.miCapital()); App.dibujar(); } else App.L.redimensionar(); });
    App.etiquetasBotones();
    FWM.entrada.conectar(canvas, App.L, App.tocar, () => App.dibujar(), App.pasar);
    // clic en cualquier botón: tic (los botones de acción ya tienen su propio sonido después)
    document.addEventListener("click", (ev) => { const b = ev.target.closest("button"); if (b && !b.disabled) FWM.sonido.tic(); }, true);
    document.getElementById("btn-fin").addEventListener("click", App.finTurno);
    document.getElementById("btn-deshacer").addEventListener("click", App.deshacer);
    document.getElementById("btn-glosario").addEventListener("click", () => App.abrirGlosario());
    document.getElementById("btn-chat").addEventListener("click", () => FWM.duelo.chatBoton());
    // Botón de música del mapa. Se atiende en "pointerdown" y por coordenadas, no con un simple "click":
    // encima del mapa pasan cosas (el escudo antitoque-fantasma, el canvas que captura el puntero para
    // arrastrar) que se comían el toque en el móvil, y el botón parecía no funcionar (6 sep 2026).
    // El botón del mapa silencia todo el sonido: música y efectos. En Ajustes siguen por separado.
    App.alternarMusica = function () {
      App._musicaTocada = Date.now();
      const habia = FWM.musica.activa() || FWM.sonido.activo();
      FWM.musica.alternar(!habia); FWM.sonido.alternar(!habia);
      FWM.paneles.pintarBotonMusica();
    };
    document.getElementById("btn-musica").addEventListener("click", () => { if (Date.now() - (App._musicaTocada || 0) < 600) return; App.alternarMusica(); });
    document.addEventListener("pointerdown", (ev) => {
      const b = document.getElementById("btn-musica");
      if (!b || b.hidden || FWM.inicio.visible()) return;
      if (!document.getElementById("modal").hidden || document.getElementById("ceremonia")) return; // hay algo delante
      const r = b.getBoundingClientRect(); if (!r.width) return;
      if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) return;
      ev.stopPropagation(); ev.preventDefault();
      App.alternarMusica();
    }, true);
    window.addEventListener("scroll", () => App.colocarSenal(), true);
    document.getElementById("btn-siguiente").addEventListener("click", App.siguienteTropa);
    // Menú = pantalla de inicio (la partida sigue guardada). En un duelo en directo no se sale: ventana con Volver / Rendirse.
    document.getElementById("btn-menu").addEventListener("click", () => {
      if (FWM.duelo.activo()) { const T = App.datos.textos; App.modal(`<h2>${T.duelo.titulo}</h2><p>${T.duelo.enCurso}</p>`, [[T.duelo.volverPartida, () => App.cerrarModal(), "btn btn-primario"], [T.duelo.rendirse, () => { App.cerrarModal(); App.confirmar(T.duelo.confirmarRendirse, () => FWM.duelo.rendirse()); }, "btn btn-claro"]]); return; }
      App.irInicio();
    });
    document.addEventListener("keydown", (e) => {
      if (!App.estado || App.ocupado || document.getElementById("modal").hidden === false) return;
      if (e.key === "Escape") { App.modo = null; App.sel = {}; App.posibles = vacio(); App.refrescar(); }
      if (e.key === "Enter" && e.target === document.body) App.finTurno();
      if ((e.key === "n" || e.key === "N") && e.target === document.body) App.siguienteTropa();
      if ((e.key === "g" || e.key === "G") && e.target === document.body) App.abrirGlosario();
      if ((e.key === "z" || e.key === "Z") && (e.metaKey || e.ctrlKey)) App.deshacer();
    });
    // setTimeout y no requestAnimationFrame: en una pestaña en segundo plano rAF no se ejecuta y el juego no arrancaría
    setTimeout(() => {
      App.L.redimensionar();
      const guardada = FWM.guardado.cargar();
      if (guardada) App.cargarPartida(guardada); // queda cargada por si el jugador pulsa Continuar
      FWM.inicio.mostrar(App);
      FWM.nube.iniciar().then(() => { if (FWM.inicio.visible()) FWM.inicio.refrescar(); FWM.nube.evento("abre", { partidas: FWM.guardado.records().partidas || 0 }); }); // la nube tarda un poco: se refresca el inicio cuando responde
    });
  };

  // Capital del humano (para encuadrar el mapa en el móvil).
  App.miCapital = function () { const e = App.estado; if (!e || App.humano == null) return null; const j = e.jugadores[App.humano]; return j && j.capital && e.asentamientos[j.capital] && e.asentamientos[j.capital].dueno === App.humano ? j.capital : (j && j.capital) || null; };

  App.nuevaPartida = function (op) {
    FWM.sonido.inicio();
    FWM.inicio.ocultar();
    FWM.musica.empezar("partida"); // la música sigue dentro de la partida, más bajita; se silencia con el botón de la barra
    if (FWM.duelo) FWM.duelo.salir(); // si había un duelo a medias, se abandona
    if (App.estado && App.estado.ganador == null && !App.estado.resultadoAnotado && App.estado.turno > 1) FWM.nube.evento("abandona", { turno: App.estado.turno, tipo: App.opciones && App.opciones.tipo });
    if (op && op.tipo === "dia") op = Object.assign({}, PRESETS.dia, { rivales: 3, dificultad: "normal", bando: op.bando || "aleatorio" }, op, { semilla: FWM.guardado.semillaDelDia() });
    if (op && op.tipo === "duelo") op = Object.assign({}, PRESETS.duelo, { dificultad: "normal", bando: "aleatorio" }, op, { semilla: op.duelo.semilla });
    if (App.tutorial && !(op && op.semilla === 4242)) { App.tutorial = false; App.destacar = null; document.getElementById("tutorial").hidden = true; } // una partida normal cierra el tutorial
    App.opciones = op;
    App.fotos = [];
    const n = op.rivales + 1;
    // mapa: uno hecho a mano (campaña, batalla de la semana) o generado; el tamaño generado va con el número de reinos
    const tam = op.tamano || (n <= 2 ? "mini" : "pequeno");
    let mapa = op.mapaHecho && FWM.mapasHechos ? FWM.mapasHechos.parsear(op.mapaHecho) : null;
    if (mapa && mapa.inicios.length < n) mapa = null;
    // si con ese tamaño no sale un mapa válido para tantos reinos, se prueba el siguiente
    const orden = Object.keys(TAMANOS); let i = Math.max(0, orden.indexOf(tam));
    while (!mapa) { const [ancho, alto] = TAMANOS[orden[i]]; try { mapa = FWM.generador.generar({ semilla: op.semilla, ancho, alto, jugadores: n, datos: App.datos, reparto: op.recursos || "equilibrado" }); } catch (e) { if (i >= orden.length - 1) throw e; i++; } }
    // bandos: el humano elige (o azar); las IAs cogen los que queden, sin repetir mientras haya.
    // En los escenarios solo valen los bandos que tienen tierra en ese mapa, y cada uno empieza en la suya.
    const gb = FWM.azar.crear(op.semilla + 7);
    const deEscenario = mapa.porBando && Object.keys(mapa.porBando).length ? Object.keys(mapa.porBando) : null;
    const jugables = Object.keys(App.datos.bandos).filter(b => !App.datos.bandos[b].noJugable);
    let libres = gb.barajar(deEscenario || jugables);
    const bandoHumano = (deEscenario ? (deEscenario.includes(op.bando) ? op.bando : libres[0]) : (jugables.includes(op.bando) ? op.bando : libres[0]));
    libres = libres.filter(b => b !== bandoHumano);
    // el reino se llama como su bando; si se repite un bando (más reinos que bandos), lleva ordinal
    const usados = {};
    const nombreDe = (b) => { usados[b] = (usados[b] || 0) + 1; return App.datos.bandos[b].nombre + (usados[b] > 1 ? " " + ["", "", "II", "III", "IV", "V", "VI"][usados[b]] : ""); };
    // el héroe: el mío (o el del duelo) y, para cada IA, uno de mi nivel con los mismos puntos gastados
    const miHeroe = FWM.heroe.paraPartida(op);
    const gastados = FWM.heroes.puntosGastados(miHeroe);
    const COLORES = paleta();
    const jugadores = [{ nombre: nombreDe(bandoHumano), color: COLORES[0], humano: true, bando: bandoHumano, heroe: miHeroe }];
    const apodos = gb.barajar((App.datos.nombresIA || []).slice());
    for (let i = 1; i < n; i++) {
      if (op.tipo === "barbaros") { jugadores.push({ nombre: App.datos.bandos.barbaros.nombre, color: "#6b6455", humano: false, bando: "barbaros", apodo: App.datos.bandos.barbaros.nombre }); continue; }
      const b = libres.length ? libres.shift() : gb.elegir(jugables); jugadores.push({ nombre: nombreDe(b), color: COLORES[i % COLORES.length], humano: false, bando: b, apodo: apodos[i - 1] || ("IA " + i), heroe: FWM.heroe.paraIA(op.semilla + 1000 * i, miHeroe.nivel, gastados) });
    }
    // duelo: el anfitrión es el jugador 0 y el invitado el 1 en los dos teléfonos (misma semilla, mismos bandos);
    // el rival es "remoto" (juega desde su teléfono) o un bot con nombre de jugador. Anfitrión azul, invitado rojo, en las dos pantallas.
    let miIndice = 0;
    if (op.duelo) {
      const d = op.duelo; miIndice = d.rol === "invitado" ? 1 : 0; const otro = 1 - miIndice;
      const mio = FWM.nube.nombre() || FWM.guardado.ajustes().nombre || App.datos.textos.fichas.tuMayus;
      // en el duelo cada uno lleva su héroe (viene en la sesión); el bot, uno de mi nivel
      let hMio = miHeroe, hRival = d.rival.heroe || FWM.heroe.paraIA(op.semilla + 4242, miHeroe.nivel, gastados);
      if (d.igualar) { [hMio, hRival] = FWM.heroes.igualar(hMio, hRival); } // reto con "igualar héroes": los dos al nivel y puntos del más bajo, sin objetos
      jugadores[miIndice] = Object.assign(jugadores[miIndice], { humano: true, remoto: false, apodo: mio, heroe: hMio });
      jugadores[otro] = Object.assign(jugadores[otro], { humano: false, remoto: d.rol !== "bot", apodo: d.rival.nombre, heroe: hRival });
    }
    // escenario: el mapa manda dónde empieza cada reino, en el orden en que se han creado los jugadores
    if (mapa.porBando && Object.keys(mapa.porBando).length) mapa = Object.assign({}, mapa, { inicios: jugadores.map(j => mapa.porBando[j.bando]).filter(Boolean) });
    const soloOro = op.tipo !== "normal"; // todos los modos actuales son de solo oro y sin carreteras (rápida, día, duelo, campaña, batalla)
    App.estado = FWM.motor.crearPartida({ datos: App.datos, mapa, jugadores, semilla: op.semilla, todasTecnologias: op.tecnologia === "todo", multiplicadorHucha: op.hucha || 1, limiteTurnos: op.limite || 0, sinCarreteras: soloOro, soloOro });
    App.estado.ordenes = {};
    if (op.tipo === "barbaros") FWM.barbaros.preparar(App.estado);
    // personalidad de cada IA, según la semilla; en difícil todas son "implacable" y empiezan con un 25 % más de oro
    const persos = Object.keys(FWM.iaNormal.PERSONALIDADES);
    const g = FWM.azar.crear(op.semilla + 99);
    for (const j of App.estado.jugadores) if (!j.humano && !j.remoto) { j.personalidad = op.dificultad === "dificil" ? "implacable" : g.elegir(persos); if (op.dificultad === "dificil") j.hucha.oro = Math.round((j.hucha.oro || 0) * 1.25); }
    App.humano = miIndice; App.accionesTurno = [];
    App.primeraPartida = !App.tutorial && !(FWM.guardado.records().partidas > 0) && !op.duelo; // antes del primer refrescar: la barra esconde botones
    FWM.nube.evento("empieza", { tipo: op.tipo, rivales: n - 1, nivel: miHeroe.nivel, partidas: FWM.guardado.records().partidas || 0 }); App.pila = []; App.registro = []; App.sel = {}; App.posibles = vacio(); App.modo = null; App.avisoFin = 0; App.avisoTec = 0;
    App.anotar(App.estado.registro);
    App.L.encuadrar(App.estado, App.miCapital());
    App.cerrarModal();
    App.guardar();
    App.refrescar();
    const T = App.datos.textos;
    const cap = App.estado.asentamientos[App.estado.jugadores[App.humano].capital];
    App.sel = { hex: App.estado.jugadores[App.humano].capital }; App.refrescar(); // capital seleccionada al empezar: el perímetro va por fuera y no tapa el azul
    setTimeout(() => { App.L.encuadrar(App.estado, App.miCapital()); App.dibujar(); }, 60);
    FWM.paneles.aviso(T.tuReinoEs.replace("{reino}", App.estado.jugadores[App.humano].nombre).replace("{color}", App.humano === 1 ? T.colorRojo : T.colorAzul).replace("{capital}", cap.nombre), 0); // se queda hasta el primer toque
    if (op.duelo) FWM.duelo.empezar(App, op.duelo, true); // con cara a cara y "preparado" antes de arrancar
    // primera partida de verdad (sin tutorial): tres globos, uno por vez, y menos botones
    if (App.primeraPartida) {
      const g = T.globos; let i = 0;
      const siguiente = () => { if (i >= g.length || !App.estado || FWM.inicio.visible()) return; FWM.paneles.aviso(g[i], 0); i++; if (i < g.length) setTimeout(siguiente, 4500); };
      setTimeout(siguiente, 1200);
    }
  };

  App.cargarPartida = function (g) {
    App.fotos = []; // las fotos de la repetición son de la partida anterior
    App.estado = g.estado; App.opciones = g.opciones; App.humano = g.opciones && g.opciones.duelo && g.opciones.duelo.rol === "invitado" ? 1 : 0; App.accionesTurno = [];
    if (App.opciones && App.opciones.duelo && App.estado.ganador == null) FWM.duelo.empezar(App, App.opciones.duelo);
    if (!App.estado.ordenes) App.estado.ordenes = {};
    App.pila = []; App.registro = []; App.sel = {}; App.posibles = vacio(); App.modo = null;
    App.anotar(App.estado.registro.slice(-10));
    App.L.encuadrar(App.estado, App.miCapital());
    App.refrescar();
    setTimeout(() => { App.L.encuadrar(App.estado, App.miCapital()); App.dibujar(); }, 60);
    if (App.estado.jugadorActivo !== App.humano && App.estado.ganador == null && !FWM.inicio.visible()) App.jugarIAs();
  };

  App.guardar = function () { if (App.estado) FWM.guardado.guardar(App.estado, App.opciones); };

  // Cambiar la paleta en Ajustes repinta también la partida que esté a medias.
  App.aplicarPaleta = function () {
    const c = paleta();
    if (App.estado) { App.estado.jugadores.forEach((j, i) => { j.color = c[i % c.length]; }); App.guardar(); App.refrescar(); }
  };

  // Fotos del mapa para la repetición: una al empezar cada ronda propia y otra al acabar la partida.
  // Solo en memoria (no se guardan): al recargar la página se pierden las anteriores.
  App.fotos = [];
  App.anotarFoto = function (forzar) {
    const e = App.estado; if (!e) return;
    const ultima = App.fotos[App.fotos.length - 1];
    if (!forzar && (e.jugadorActivo !== App.humano || (ultima && ultima.turno === e.turno))) return;
    if (forzar && ultima && ultima.turno === e.turno && ultima.ganador === e.ganador) return;
    const podada = Object.assign({}, e); delete podada.registro; delete podada.linea; delete podada.ordenes;
    try { App.fotos.push(structuredClone(podada)); } catch (x) { return; }
    if (App.fotos.length > 40) App.fotos.shift();
  };

  // ---------- acciones ----------
  App.aplicar = function (accion, silencioso) {
    if (App.ocupado || !App.estado) return false;
    const T = App.datos.textos;
    const reversible = FWM.motor.esReversible(accion);
    const r = FWM.motor.aplicar(App.estado, App.datos, accion);
    if (!r.ok) { if (!silencioso) FWM.paneles.aviso(T.errores[r.error] || r.error); return false; }
    if (reversible) App.pila.push(App.estado); else App.pila = [];
    if (App.pila.length > 60) App.pila.shift();
    App.ascensos(App.estado, r.estado, r.eventos);
    App.animarAccion(App.estado, r.estado, accion, r.eventos);
    if (App.estado.jugadorActivo === App.humano) (App.accionesTurno = App.accionesTurno || []).push(accion);
    App.estado = r.estado;
    // una orden manual sobre una tropa cancela su destino automático
    if (accion.tropa && App.estado.ordenes && App.estado.ordenes[accion.tropa] && !accion._automatica) delete App.estado.ordenes[accion.tropa];
    App.anotar(r.eventos);
    if (App.sel.tropa && !App.estado.tropas[App.sel.tropa]) App.sel = {};
    if (App.sel.tropa) { const t = App.estado.tropas[App.sel.tropa]; App.sel.hex = FWM.estado.posicionTropa(App.estado, t); }
    App.recalcularPosibles();
    if (accion.tipo === "fundar" || accion.tipo === "construir") App.construirAbierto = null;
    if (accion.tipo === "reclutar" && App.reclutaAbierto && App.estado.asentamientos[App.reclutaAbierto] && App.estado.asentamientos[App.reclutaAbierto].reclutadoEsteTurno) App.reclutaAbierto = null;
    if (!silencioso) { App.guardar(); App.refrescar(); App.comprobarFin(r.eventos); }
    return true;
  };

  App.deshacer = function () {
    if (App.ocupado || !App.pila.length) return;
    App.estado = App.pila.pop(); if (App.accionesTurno) App.accionesTurno.pop();
    if (App.sel.tropa && !App.estado.tropas[App.sel.tropa]) App.sel = {};
    // la tropa vuelve a donde estaba: el hexágono seleccionado la sigue (si no, parpadeaba el sitio al que había ido)
    if (App.sel.tropa) App.sel.hex = FWM.estado.posicionTropa(App.estado, App.estado.tropas[App.sel.tropa]);
    App.registro.push("↶ " + App.datos.textos.deshacer);
    App.recalcularPosibles(); App.guardar(); App.refrescar();
  };

  // Tropas propias que aún pueden hacer algo este turno.
  App.tropasPendientes = function () {
    const e = App.estado; if (!e || e.jugadorActivo !== App.humano) return [];
    return FWM.estado.tropasDe(e, App.humano).filter(t => !t.accionUsada && t.movRestante > 0 && !(e.ordenes && e.ordenes[t.id])
      && !(t.estados && (t.estados.includes("atrincherada") || t.estados.includes("dormida"))));
  };

  // Tecnología disponible y pagable si no se investiga nada (para avisar al terminar turno).
  App.tecPendiente = function () {
    const e = App.estado, datos = App.datos; const j = e.jugadores[App.humano];
    if (j.investigando) return null;
    for (const id of Object.keys(datos.tecnologias)) {
      if (FWM.acciones.acciones.investigar.validar(e, datos, { tec: id }) == null) return id;
    }
    return null;
  };

  // ¿El próximo turno faltará oro? Devuelve { falta, tropas } (cuántas desertarían: las más baratas primero) o null.
  App.bancarrotaPrevista = function () {
    const e = App.estado, datos = App.datos; const j = e.jugadores[App.humano];
    const res = FWM.economia.resumen(e, datos, App.humano);
    const disponible = (j.hucha.oro || 0) + (res.ingresos.oro || 0);
    if (res.gasto <= disponible) return null;
    const tropas = FWM.estado.tropasDe(e, App.humano).slice().sort((a, b) => (datos.tropas[a.tipo].coste.oro || 0) - (datos.tropas[b.tipo].coste.oro || 0));
    let total = res.gasto, n = 0;
    for (const t of tropas) { if (total <= disponible) break; total -= datos.tropas[t.tipo].mantenimiento || 0; n++; }
    return { falta: res.gasto - disponible, tropas: n };
  };

  App.siguienteTropa = function () {
    const pend = App.tropasPendientes();
    if (!pend.length) return;
    const actual = pend.findIndex(t => t.id === App.sel.tropa);
    const t = pend[(actual + 1) % pend.length];
    const hex = FWM.estado.posicionTropa(App.estado, t);
    App.modo = null;
    App.seleccionarTropa(t.id, hex);
    App.L.centrarEn(hex); App.dibujar();
  };

  App.finTurno = function (forzado) {
    if (App.ocupado || !App.estado || App.estado.ganador != null || App.estado.jugadorActivo !== App.humano) return;
    const T = App.datos.textos;
    const pend = App.tropasPendientes();
    if (forzado === true) { App.avisoFin = App.estado.turno; App.avisoTec = App.estado.turno; App.avisoBanca = App.estado.turno; FWM.paneles.aviso(T.duelo.tiempoAgotado, 2500); }
    // bancarrota a la vista: el próximo turno no da para pagar el mantenimiento
    const banca = App.bancarrotaPrevista();
    if (banca && App.avisoBanca !== App.estado.turno) {
      App.avisoBanca = App.estado.turno;
      App.modal(`<h2>${T.finTurno}</h2><p class="error">${T.bancarrotaFin.replace("{oro}", banca.falta).replace("{n}", banca.tropas)}</p>`,
        [[T.verReino, () => { App.cerrarModal(); App.abrirHoja("reino"); }, "btn btn-claro"], [T.terminarIgual, () => { App.cerrarModal(); App.finTurno(); }, "btn btn-primario"]]);
      return;
    }
    if (pend.length && App.avisoFin !== App.estado.turno) {
      App.avisoFin = App.estado.turno;
      const t = pend[0]; const hex = FWM.estado.posicionTropa(App.estado, t);
      App.seleccionarTropa(t.id, hex); App.L.centrarEn(hex); App.dibujar();
      App.modal(`<h2>${T.finTurno}</h2><p>${T.tropasPendientes.replace("{n}", pend.length)}</p>`,
        [[T.verTropa, () => App.cerrarModal(), "btn btn-claro"], [T.terminarIgual, () => { App.cerrarModal(); App.finTurno(); }, "btn btn-primario"]]);
      return;
    }
    const tec = App.tecPendiente();
    if (tec && App.avisoTec !== App.estado.turno) {
      App.avisoTec = App.estado.turno;
      const j = App.estado.jugadores[App.humano];
      const txt = T.sinInvestigar.replace("{tec}", App.datos.tecnologias[tec].nombre).replace("{coste}", FWM.util.textoCoste(FWM.stats.costeTec(App.datos, j, tec), App.datos));
      App.modal(`<h2>${T.finTurno}</h2><p>${txt}</p>`,
        [[T.verTecnologias, () => { App.cerrarModal(); App.abrirTecnologia(); }, "btn btn-claro"], [T.terminarIgual, () => { App.cerrarModal(); App.finTurno(); }, "btn btn-primario"]]);
      return;
    }
    const r = FWM.motor.aplicar(App.estado, App.datos, { tipo: "finTurno" });
    if (!r.ok) return;
    FWM.sonido.tambor();
    const acciones = (App.accionesTurno || []).concat([{ tipo: "finTurno" }]); App.accionesTurno = [];
    App.estado = r.estado; App.pila = []; App.sel = {}; App.posibles = vacio(); App.modo = null;
    App.anotar(r.eventos);
    App.refrescar();
    if (App.opciones && App.opciones.duelo) { FWM.duelo.enviarTurno(acciones, App.estado); FWM.duelo.turnoCambia(); }
    App.jugarIAs();
  };

  App.jugarIAs = function () {
    App.ocupado = true; App.refrescar();
    App.ultimosEventos = [];
    const paso = () => {
      const e = App.estado;
      if (e.ganador != null || e.jugadorActivo === App.humano || e.jugadores[e.jugadorActivo].humano || e.jugadores[e.jugadorActivo].remoto) {
        App.ocupado = false; App.pila = [];
        if (e.jugadorActivo === App.humano) App.ejecutarOrdenes();
        App.guardar(); App.refrescar();
        if (App.opciones && App.opciones.duelo) { FWM.duelo.turnoCambia(); if (e.ganador == null && e.jugadorActivo !== App.humano) FWM.paneles.aviso(App.datos.textos.duelo.turnoDe.replace("{nombre}", e.jugadores[e.jugadorActivo].apodo || ""), 2500); }
        App.comprobarFin(App.ultimosEventos || []);
        return;
      }
      // modo Bárbaros: antes de que jueguen las hordas, entra la oleada de esta ronda
      const esHorda = !!e.jugadores[e.jugadorActivo].barbaros;
      if (esHorda) {
        const nuevas = FWM.barbaros.oleada(e, App.datos);
        if (nuevas.length) { FWM.sonido.tambor(); FWM.paneles.aviso(App.datos.textos.barbaros.llegaOleada.replace("{n}", nuevas.length).replace("{ronda}", e.turno), 2600); }
        App.refrescar();
      }
      const ia = esHorda ? FWM.ias.barbaros : (FWM.ias[(App.opciones && App.opciones.dificultad) || "normal"] || FWM.ias.normal);
      // la IA calcula su turno entero de golpe; lo reproducimos acción a acción para verlo
      const pasos = []; let previo = e;
      const r = ia(e, App.datos, { alAplicar: (estado, accion, eventos) => { pasos.push({ antes: previo, despues: estado, accion, eventos }); previo = estado; } });
      App.reproducirPasos(pasos, () => { App.estado = r.estado; setTimeout(paso, 60); });
    };
    setTimeout(paso, 30);
  };

  // Reproduce una lista de pasos {antes, despues, accion, eventos} acción a acción, con animación, y llama a fin().
  // Lo usan la IA y el rival remoto de un duelo.
  App.reproducirPasos = function (pasos, fin) {
    App.ocupado = true; App.ultimosEventos = App.ultimosEventos || [];
    const anotables = ["ataque", "muere", "conquista", "funda", "castillo", "ciudad", "investigado", "bancarrota", "brecha", "eliminado", "victoria", "turno", "asedio", "asciende"];
    const aplicarPaso = (p) => {
      App.ascensos(p.antes, p.despues, p.eventos);
      App.animarAccion(p.antes, p.despues, p.accion, p.eventos);
      App.estado = p.despues;
      App.anotar(p.eventos.filter(ev => anotables.includes(ev.tipo)));
      App.ultimosEventos.push(...p.eventos);
      App.dibujar(); FWM.paneles.renderRegistro(App);
    };
    const reproducir = (i) => {
      // acciones sin animación se aplican de golpe hasta la siguiente visible
      while (i < pasos.length && App.duracionAccion(pasos[i].accion) === 0) { aplicarPaso(pasos[i]); i++; }
      if (i >= pasos.length) { App.dibujar(); FWM.paneles.renderRegistro(App); fin(); return; }
      const p = pasos[i]; aplicarPaso(p);
      setTimeout(() => reproducir(i + 1), App.duracionAccion(p.accion));
    };
    reproducir(0);
  };

  // ---------- destinos automáticos ----------
  App.ordenDe = function (id) { return App.estado.ordenes ? App.estado.ordenes[id] : null; };
  App.ponerOrden = function (id, destino) {
    App.estado = Object.assign({}, App.estado, { ordenes: Object.assign({}, App.estado.ordenes, { [id]: destino }) });
    App.modo = null;
    App.avanzarOrden(id);
    App.guardar(); App.refrescar();
  };
  App.quitarOrden = function (id) {
    const o = Object.assign({}, App.estado.ordenes); delete o[id];
    App.estado = Object.assign({}, App.estado, { ordenes: o });
    App.guardar(); App.refrescar();
  };
  // Distancias a pie desde un destino (ignorando tropas), para elegir el paso.
  // Coste en puntos de movimiento desde cada hexágono hasta el destino (Dijkstra con costes de terreno y carreteras).
  App.distanciasA = function (destino, origen) {
    const e = App.estado, datos = App.datos;
    const dist = { [destino]: 0 }; const pendientes = [destino]; const cerrados = new Set();
    while (pendientes.length) {
      pendientes.sort((a, b) => dist[a] - dist[b]);
      const c = pendientes.shift(); if (cerrados.has(c)) continue; cerrados.add(c);
      const hc = e.mapa.hexes[c];
      // los asentamientos no se atraviesan (salvo el destino y el punto de partida)
      if (hc && hc.construccion === "asentamiento" && c !== destino && c !== origen) continue;
      for (const v of FWM.hex.vecinos(c)) {
        const coste = FWM.acciones.costeTerreno(e, datos, c === destino ? c : c); // coste de entrar en c desde v
        const costeC = FWM.acciones.costeTerreno(e, datos, c);
        if (!e.mapa.hexes[v] || FWM.acciones.costeTerreno(e, datos, v) == null || costeC == null) continue;
        const d = dist[c] + costeC;
        if (dist[v] == null || d < dist[v]) { dist[v] = d; pendientes.push(v); }
        void coste;
      }
    }
    return dist;
  };
  App.avanzarOrden = function (id) {
    const e = App.estado, T = App.datos.textos;
    const t = e.tropas[id]; const destino = App.ordenDe(id);
    if (!t || !destino) { if (e.ordenes && e.ordenes[id]) App.quitarOrden(id); return; }
    const pos = FWM.estado.posicionTropa(e, t);
    if (pos === destino) { App.quitarOrden(id); return; }
    // enemigo al lado: se detiene y avisa
    const enemigoCerca = FWM.hex.vecinos(pos).some(v => { const x = FWM.estado.tropaEn(e, v); return x && x.dueno !== t.dueno; });
    if (enemigoCerca) { App.quitarOrden(id); FWM.paneles.aviso(App.datos.tropas[t.tipo].nombre + " " + T.enemigoCerca, 3000); return; }
    if (t.accionUsada || t.movRestante <= 0) return;
    const dist = App.distanciasA(destino, pos);
    if (dist[pos] == null) { App.quitarOrden(id); return; }
    const p = FWM.motor.accionesPosibles(e, App.datos, id);
    let mejor = null, mejorD = dist[pos];
    for (const h of Object.keys(p.mover)) { if (dist[h] != null && dist[h] < mejorD) { mejorD = dist[h]; mejor = h; } }
    if (!mejor) return;
    App.aplicar({ tipo: "mover", tropa: id, a: mejor, _automatica: true }, true);
    if (mejor === destino) App.quitarOrden(id);
  };
  App.ejecutarOrdenes = function () {
    if (!App.estado.ordenes) return;
    for (const id of Object.keys(App.estado.ordenes)) App.avanzarOrden(id);
    App.pila = [];
  };

  App.comprobarFin = function (eventos) {
    const e = App.estado;
    const acabo = e.ganador != null || (e.jugadores[App.humano].eliminado && eventos.some(ev => ev.tipo === "eliminado" && ev.jugador === App.humano));
    if (!acabo) return;
    // anotar una sola vez por partida
    if (e.ganador === -1) { if (!e.resultadoAnotado) return; } // duelo anulado: no cuenta
    let records = FWM.guardado.records();
    const primeraVez = !e.resultadoAnotado && e.ganador !== -1;
    const heroeAntes = FWM.heroe.progreso();
    if (!e.resultadoAnotado) {
      const stH = (e.estadisticas && e.estadisticas[App.humano]) || {};
      const puntosClave = Object.values(e.mapa.hexes).filter(h => h.dueno === App.humano && h.yacimiento === "punto_clave").length;
      const jH = e.jugadores[App.humano];
      const resultado = { gano: e.ganador === App.humano, turnos: e.turno, tipo: (App.opciones && App.opciones.tipo) || "normal", mapa: e.mapa.nombre, semilla: e.semilla, fecha: new Date().toISOString().slice(0, 10), puntos: FWM.victoria.puntos(e, App.datos, App.humano),
        bando: jH.bando, matadas: stH.matadas || 0, perdidas: stH.perdidas || 0, conquistas: stH.conquistas || 0, puntosClave, heroesMatados: stH.heroesMatados || 0, rivales: e.jugadores.length - 1,
        rivalHumano: !!(App.opciones && App.opciones.duelo && App.opciones.duelo.rol !== "bot"), oroFinal: jH.hucha.oro || 0, fundados: stH.fundados || 0, heroeVivo: !!(jH.heroeTropa && e.tropas[jH.heroeTropa]), bancarrota: stH.bancarrotaTurno != null && stH.bancarrotaTurno >= e.turno - 1,
        abandonoRival: e.finDuelo === "abandono", dificultad: (App.opciones && App.opciones.dificultad) || "normal", capitulo: App.opciones && App.opciones.capitulo, batalla: App.opciones && App.opciones.batalla,
        rondas: e.barbaros ? FWM.barbaros.rondas(e) : 0 };
      // en Bárbaros siempre acabas cayendo: los puntos del héroe salen de las rondas aguantadas, no del reino
      if (e.barbaros) resultado.puntos = resultado.rondas * 20;
      records = FWM.guardado.anotarResultado(resultado, { datos: App.datos, estado: e, humano: App.humano });
      App.nuevasMedallas = records.nuevasMedallas || [];
      // recompensas del héroe: oro, botín, premios de medallas; la pócima usada se gasta
      if (jH.heroe && jH.heroe.pocimaUsada) FWM.heroe.consumir("pocima");
      App.recompensasHeroe = FWM.heroe.recompensas(resultado, App.nuevasMedallas, App.datos);
      FWM.nube.evento("acaba", { tipo: resultado.tipo, gano: resultado.gano, turnos: resultado.turnos, puntos: resultado.puntos, partidas: records.partidas });
      if (App.opciones && App.opciones.duelo) App.recompensasHeroe.elo = FWM.duelo.alAcabar(e);
      try { App.recompensasHeroe.misiones = FWM.misiones.comprobar(resultado, App.datos); App.recompensasHeroe.oro += App.recompensasHeroe.misiones.reduce((s, c) => s + c.oro, 0); } catch (x) { App.recompensasHeroe.misiones = []; }
      // campaña: el capítulo superado da su premio; batalla de la semana: se anota la mejor puntuación local
      if (resultado.tipo === "campana" && resultado.gano && FWM.campana) { const pr = FWM.campana.superar(resultado.capitulo, resultado.turnos); if (pr) { App.recompensasHeroe.campana = Object.assign({ capitulo: resultado.capitulo }, pr); App.recompensasHeroe.oro += pr.oro || 0; } }
      if (resultado.tipo === "batalla" && FWM.batalla) App.recompensasHeroe.batalla = FWM.batalla.anotar(resultado);
      App.estado = Object.assign({}, App.estado, { resultadoAnotado: true }); App.guardar();
      // en Bárbaros la puntuación del ranking son las rondas aguantadas, no los puntos de reino
      const envio = { puntos: e.barbaros ? FWM.barbaros.rondas(e) : FWM.victoria.puntos(e, App.datos, App.humano), tipo: (App.opciones && App.opciones.tipo) || "normal", turnos: e.turno, gano: e.ganador === App.humano, semilla: e.semilla, mapa: e.mapa.nombre };
      App.ultimoEnvio = envio;
      // rivales de esta partida, para el ranking (marcados IA)
      if (!(App.opciones && App.opciones.duelo)) try { localStorage.setItem("fwm.ultimaIA", JSON.stringify(e.jugadores.filter(j => !j.humano).map(j => ({ apodo: j.apodo || "IA", bando: j.nombre, personalidad: j.personalidad, puntos: FWM.victoria.puntos(e, App.datos, j.id), eliminado: !!j.eliminado })))); } catch (x) { /* nada */ }
      if (FWM.nube.disponible() && FWM.nube.usuario()) FWM.nube.enviarPartida(envio).then(() => { App.ultimoEnvio.enviado = true; }).catch(() => {});
      else FWM.nube.enviarPartida(envio).catch(() => {}); // sin cuenta: queda pendiente en el aparato
    }
    App.anotarFoto(true); // última foto: el mapa como queda al acabar
    const abrir = () => App.modalNodo(FWM.resultado.render(App, { records, nuevas: App.nuevasMedallas || [] }));
    if (primeraVez) {
      const heroeDespues = FWM.heroe.progreso();
      const subida = { puntos: Math.max(0, heroeDespues.puntosMejora - heroeAntes.puntosMejora), nivel: heroeDespues.nivel > heroeAntes.nivel ? heroeDespues.nivel : null, disponibles: heroeDespues.disponibles };
      FWM.resultado.ceremonia(App, { records, nuevas: App.nuevasMedallas || [], heroe: subida, recompensas: App.recompensasHeroe }, abrir);
    } else abrir();
  };

  App.revancha = function () { if (App.opciones) App.nuevaPartida(Object.assign({}, App.opciones)); };
  App.otraPartida = function () { if (App.opciones) App.nuevaPartida(Object.assign({}, App.opciones, { semilla: Math.floor(Math.random() * 1e6) + 1 })); else App.abrirMenu(false); };

  // ---------- selección ----------
  // Toque en el circulito de guarnición de un asentamiento propio: selecciona la tropa (o abre burbujas si hay varias).
  // Toque en las insignias de la tropa seleccionada (escudo, martillos, X, i).
  App.tocarInsigniasTropa = function (px, py) {
    const e = App.estado; const T = App.datos.textos;
    if (px == null || e.jugadorActivo !== App.humano || App.ocupado || !App.sel.tropa) return false;
    const tr = e.tropas[App.sel.tropa]; if (!tr || tr.dueno !== App.humano) return false;
    // la insignia más cercana al dedo, con un radio de toque generoso (mínimo 14 px)
    const todas = App.L.insigniasTropa(tr, e, App.datos).map(i => Object.assign({ d: Math.hypot(px - i.x, py - i.y) }, i)).sort((a, b) => a.d - b.d);
    for (const ins of todas.slice(0, 1)) {
      if (ins.d > Math.max(ins.r * 1.5, 14)) continue;
      if (ins.id === "info") { App.abrirHoja("tropa"); return true; }
      if (ins.id === "licenciar") { App.confirmar(T.licenciarConfirmar, () => App.aplicar({ tipo: "licenciar", tropa: tr.id })); return true; }
      if (ins.id === "atrincherar") { const err = FWM.acciones.acciones.atrincherar.validar(e, App.datos, { tropa: tr.id }); if (err) FWM.paneles.aviso(FWM.paneles.motivo(App, err, {}), 2600); else App.aplicar({ tipo: "atrincherar", tropa: tr.id }); return true; }
      if (ins.id === "construir") { if (tr.accionUsada) { FWM.paneles.aviso(T.errores.sin_accion, 2600); return true; } App.construirAbierto = App.construirAbierto === tr.id ? null : tr.id; App.reclutaAbierto = null; App.refrescar(); return true; }
    }
    return false;
  };
  // Toque en la insignia de reclutar (abajo a la izquierda): abre o cierra la columna de tropas junto al asentamiento.
  App.tocarRecluta = function (px, py) {
    const e = App.estado; const L = App.L; const t = L.tam(); const T = App.datos.textos;
    if (px == null || e.jugadorActivo !== App.humano || App.ocupado) return false;
    for (const [k, a] of Object.entries(e.asentamientos)) {
      if (a.dueno !== App.humano) continue;
      const c = L.centro(k); const rx = c.x - t * .6, ry = c.y + t * .55;
      if (Math.hypot(px - rx, py - ry) > t * .34) continue;
      if (a.reclutadoEsteTurno) { FWM.paneles.aviso(T.errores.ya_reclutado, 2600); return true; }
      App.reclutaAbierto = App.reclutaAbierto === k ? null : k;
      App.sel = { hex: k }; App.posibles = vacio(); App.burbujas = null; App.refrescar();
      return true;
    }
    return false;
  };
  // Toque en la flecha azul de un asentamiento propio: mejora a ciudad (o dice por qué no).
  App.tocarMejora = function (px, py) {
    const e = App.estado; const L = App.L; const t = L.tam(); const T = App.datos.textos;
    if (px == null || e.jugadorActivo !== App.humano || App.ocupado) return false;
    for (const [k, a] of Object.entries(e.asentamientos)) {
      if (a.dueno !== App.humano || !App.datos.asentamientos[a.tipo].mejoraA) continue;
      const c = L.centro(k); const fx = c.x + t * .58, fy = c.y - t * .6;
      if (Math.hypot(px - fx, py - fy) > t * .32) continue;
      const err = FWM.acciones.acciones.mejorarAsentamiento.validar(e, App.datos, { asentamiento: k });
      if (err) { const coste = FWM.stats.costeAsentamiento(e, App.datos, App.humano, App.datos.asentamientos[a.tipo].mejoraA); FWM.paneles.aviso(FWM.paneles.motivo(App, err, { coste, hex: k }), 2600); return true; }
      App.confirmar(T.confirmarCiudad.replace("{n}", FWM.stats.costeAsentamiento(e, App.datos, App.humano, App.datos.asentamientos[a.tipo].mejoraA).oro), () => App.aplicar({ tipo: "mejorarAsentamiento", asentamiento: k }));
      return true;
    }
    return false;
  };
  App.tocarGuarnicion = function (px, py) {
    const e = App.estado; const L = App.L; const t = L.tam();
    if (px == null || e.jugadorActivo !== App.humano) return false;
    // burbujas abiertas: ¿toca una?
    const abiertas = App.burbujas ? App.burbujas.hex : null;
    if (App.burbujas) {
      const pos = L.posBurbujas(App.burbujas.hex, App.burbujas.ids.length);
      for (let i = 0; i < pos.length; i++) if (Math.hypot(px - pos[i].x, py - pos[i].y) <= t * .45) { const id = App.burbujas.ids[i]; App.seleccionarTropa(id, App.burbujas.hex); return true; }
      App.burbujas = null;
    }
    for (const [k, a] of Object.entries(e.asentamientos)) {
      if (a.dueno !== App.humano || !a.guarnicion.length) continue;
      const c = L.centro(k); const bx = c.x + t * .6, by = c.y + t * .55;
      if (Math.hypot(px - bx, py - by) > t * .34) continue;
      if (a.guarnicion.length === 1) { if (App.sel.tropa === a.guarnicion[0]) App.deseleccionar(); else App.seleccionarTropa(a.guarnicion[0], k); return true; } // segundo toque: la suelta
      if (abiertas === k) { App.sel = { hex: k }; App.posibles = vacio(); App.refrescar(); return true; } // segundo toque: cierra las burbujas
      App.burbujas = { hex: k, ids: a.guarnicion.slice() }; App.sel = { hex: k }; App.posibles = vacio(); App.refrescar(); return true;
    }
    return false;
  };

  // Ratón encima de un circulito de guarnición tocable: cursor de mano y circulito agrandado.
  App.pasar = function (px, py) {
    if (!App.estado) return;
    const e = App.estado; const L = App.L; const t = L.tam();
    let encima = null;
    if (!App.ocupado && e.jugadorActivo === App.humano) {
      for (const [k, a] of Object.entries(e.asentamientos)) {
        if (a.dueno !== App.humano || !a.guarnicion.length) continue;
        const c = L.centro(k);
        if (Math.hypot(px - (c.x + t * .6), py - (c.y + t * .55)) <= t * .34) { encima = k; break; }
      }
      if (App.burbujas) { const pos = L.posBurbujas(App.burbujas.hex, App.burbujas.ids.length); if (pos.some(p => Math.hypot(px - p.x, py - p.y) <= t * .45)) encima = App.burbujas.hex; }
    }
    if (encima !== App.encima) { App.encima = encima; document.getElementById("mapa").style.cursor = encima ? "pointer" : ""; App.dibujar(); }
  };

  App.tocar = function (hex, px, py) {
    if (App.ocupado || !App.estado) return;
    const e = App.estado;
    if (hex && e.mapa.hexes[hex]) FWM.sonido.tic(); // cualquier toque en el mapa suena: el jugador sabe que ha pasado algo
    if (App.tocarMejora(px, py)) return;
    if (App.tocarRecluta(px, py)) return;
    if (App.tocarInsigniasTropa(px, py)) return;
    App.reclutaAbierto = null; App.construirAbierto = null;
    if (App.modo !== "destino" && App.tocarGuarnicion(px, py)) return;
    App.burbujas = null;
    const h = e.mapa.hexes[hex];
    if (App.modo === "destino" && App.sel.tropa) {
      if (h && h.terreno !== "agua") App.ponerOrden(App.sel.tropa, hex);
      else { App.modo = null; App.refrescar(); }
      return;
    }
    if (!h) { App.sel = {}; App.posibles = vacio(); App.refrescar(); return; }
    const p = App.posibles;
    if (App.sel.tropa && e.jugadorActivo === App.humano) {
      if (p.mover[hex]) { App.aplicar({ tipo: "mover", tropa: App.sel.tropa, a: hex }); return; }
      if (p.atacar.includes(hex) || p.asediar.includes(hex)) { App.confirmarAtaque(App.sel.tropa, hex); return; }
    }
    const tr = FWM.estado.tropaEn(e, hex);
    if (tr && tr.dueno === App.humano && e.jugadorActivo === App.humano) { if (App.sel.tropa === tr.id) App.deseleccionar(); else App.seleccionarTropa(tr.id, hex); return; } // tocar la tropa seleccionada la suelta
    // tocar un asentamiento (fuera de sus insignias) abre su ficha directamente; cualquier otro hexágono la cierra
    App.cerrarHoja();
    App.sel = { hex }; App.posibles = vacio(); App.refrescar();
    if (e.asentamientos[hex]) App.abrirHoja("asentamiento");
  };

  App.deseleccionar = function () { App.burbujas = null; App.cerrarHoja(); App.sel = {}; App.posibles = vacio(); App.modo = null; App.refrescar(); };
  App.seleccionarTropa = function (id, hex) {
    App.burbujas = null; App.cerrarHoja();
    App.sel = { tropa: id, hex: hex || FWM.estado.posicionTropa(App.estado, App.estado.tropas[id]) };
    App.recalcularPosibles(); App.refrescar();
  };

  App.recalcularPosibles = function () {
    App.posibles = App.sel.tropa && App.estado.tropas[App.sel.tropa] ? FWM.motor.accionesPosibles(App.estado, App.datos, App.sel.tropa) : vacio();
  };

  App.confirmarAtaque = function (tropaId, objetivo) {
    const { estado, datos } = App; const T = datos.textos;
    const t = estado.tropas[tropaId]; const dt = datos.tropas[t.tipo];
    const puedeAtacar = App.posibles.atacar.includes(objetivo);
    const puedeAsediar = App.posibles.asediar.includes(objetivo);
    const asent = estado.asentamientos[objetivo];
    const rango = (r) => r ? `<b>${r[0]}${r[1] !== r[0] ? " a " + r[1] : ""}</b>` : "";
    let html = `<h2>${asent ? asent.nombre : T.atacar}</h2><p class="suave">${dt.nombre} · ${T.vida.toLowerCase()} ${t.vida}/${FWM.stats.vidaMax(estado, datos, t)} · ${T.ataque.toLowerCase()} ${FWM.stats.ataqueEfectivo(estado, datos, t)}</p>`;
    const botones = [];
    if (puedeAtacar) {
      const pv = FWM.motor.prever(estado, datos, tropaId, objetivo);
      const dd = datos.tropas[pv.defensor.tipo];
      html += `<div class="opcion"><h3>${asent ? T.contraGuarnicion : T.atacar}</h3>
        <p>${dd.nombre} · ${T.vida.toLowerCase()} <b>${pv.defensor.vida}/${FWM.stats.vidaMax(estado, datos, pv.defensor)}</b> · ${T.defensa.toLowerCase()} ${pv.defensaDefensor}${asent && asent.integridad > 0 ? " (con murallas)" : ""}</p>
        <p>${T.haces}: ${rango(pv.haces)}${pv.bono ? ` <small class="ok">(${T.bonoContra.replace("{n}", pv.bono.valor).replace("{atacante}", dt.nombre.toLowerCase()).replace("{etiqueta}", T.etiquetasNombre[pv.bono.contra] || pv.bono.contra)})</small>` : ""}${pv.bonoDef ? ` <small class="error">(${T.defensaContraTxt.replace("{n}", pv.bonoDef.valor).replace("{defensor}", dd.nombre.toLowerCase()).replace("{etiqueta}", T.etiquetasNombre[pv.bonoDef.contra] || pv.bonoDef.contra)})</small>` : ""} · ${T.recibes}: ${pv.recibes ? rango(pv.recibes) : `<span class="suave">${T.sinContraataque}</span>`}${pv.bonoRecibes ? ` <small class="error">(${T.bonoContra.replace("{n}", pv.bonoRecibes.valor).replace("{atacante}", dd.nombre.toLowerCase()).replace("{etiqueta}", T.etiquetasNombre[pv.bonoRecibes.contra] || pv.bonoRecibes.contra)})</small>` : ""}</p></div>`;
      botones.push([asent ? T.atacarGuarnicion : T.atacar, () => { App.cerrarModal(); App.aplicar({ tipo: "atacar", tropa: tropaId, objetivo }); }, "btn btn-primario"]);
    }
    if (puedeAsediar) {
      const pa = FWM.motor.preverAsedio(estado, datos, tropaId, objetivo);
      html += `<div class="opcion"><h3>${T.contraMurallas}</h3>
        <p>${T.murallas} <b>${pa.integridad}/${pa.max}</b></p>
        <p>${T.quitas}: ${rango(pa.quitas)} · ${T.recibes}: ${pa.recibes ? rango(pa.recibes) : `<span class="suave">${T.sinContraataque}</span>`}</p></div>`;
      botones.push([T.asediar, () => { App.cerrarModal(); App.aplicar({ tipo: "asediar", tropa: tropaId, objetivo }); }, "btn btn-primario"]);
    }
    if (asent) html += `<p class="pista">${T.explicaAtaque}</p>`;
    botones.push([T.cancelar, () => App.cerrarModal(), "btn btn-claro"]);
    App.modal(html, botones);
  };

  // ---------- pantalla ----------
  App.refrescar = function () {
    if (!App.estado) return;
    FWM.paneles.renderBarra(App);
    FWM.paneles.renderBurbuja(App);
    FWM.paneles.renderRecluta(App);
    if (App.hoja) { if ((App.hoja === "tropa" && !App.sel.tropa) || (App.hoja !== "tropa" && App.hoja !== "reino" && !App.sel.hex)) App.cerrarHoja(); else FWM.paneles.renderPanel(App); }
    FWM.paneles.renderRegistro(App);
    App.anotarFoto();
    App.dibujar();
    if (App.tutorial && FWM.tutorial) FWM.tutorial.comprobar(App);
  };
  // La hoja: detalle de lo seleccionado sobre el mapa (tropa | asentamiento | reclutar | hex | reino).
  App.abrirHoja = function (que) { if (!App.estado) return; App.hoja = que; App.hojaAbiertaEn = Date.now(); document.getElementById("hoja").hidden = false; FWM.paneles.renderPanel(App); };
  App.cerrarHoja = function () { App.hoja = null; document.getElementById("hoja").hidden = true; };
  // el toque que abre la hoja dispara después un "click" sobre el fondo de la hoja: se ignora si acaba de abrirse
  document.addEventListener("DOMContentLoaded", () => { const h = document.getElementById("hoja"); if (h) h.addEventListener("click", (e) => { if (e.target === h && Date.now() - (App.hojaAbiertaEn || 0) > 500) App.cerrarHoja(); }); });
  // ---------- flecha que señala (tutorial) ----------
  // objetivo: { hex } | { punto: {x, y} } (píxeles del mapa) | { sel: "#btn-fin" } | null
  App.senal = null;
  App.senalar = function (objetivo) { App.senal = objetivo || null; App.colocarSenal(); if (objetivo) App.arrancarAnimacion(); };
  App.colocarSenal = function () {
    const el = document.getElementById("senal"); if (!el) return;
    const s = App.senal;
    if (!s || FWM.inicio.visible()) { el.hidden = true; return; }
    let x = null, y = null;
    if (s.sel) { const n = document.querySelector(s.sel); if (n && !n.hidden && n.offsetWidth) { const r = n.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; } }
    else if (s.hex || s.punto) {
      const cv = document.getElementById("mapa"); const r = cv.getBoundingClientRect();
      const p = s.punto || App.L.centro(s.hex);
      x = r.left + p.x; y = r.top + p.y;
      if (x < r.left + 10 || x > r.right - 10 || y < r.top + 10 || y > r.bottom - 10) { el.hidden = true; return; } // fuera de la vista
    }
    if (x == null) { el.hidden = true; return; }
    // la flecha va encima del objetivo apuntando hacia abajo; si no cabe, debajo apuntando hacia arriba
    const arriba = y > 120;
    el.hidden = false;
    el.className = "senal" + (arriba ? "" : " abajo");
    el.innerHTML = `<svg viewBox="0 0 24 34" width="30" height="42" aria-hidden="true"><path d="M12 2v22" stroke="#f0c75e" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M12 32l-9-12h18z" fill="#f0c75e"/><path d="M12 2v22" stroke="#8a5a10" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`;
    el.style.left = Math.round(x) + "px";
    el.style.top = Math.round(arriba ? y - 54 : y + 12) + "px";
  };

  App.dibujar = function () { App.colocarSenal(); if (App.estado) { App.L.dibujar(App.estado, App.datos, { sel: App.sel, posibles: App.posibles, humano: App.humano, modo: App.modo, efectos: App.efectos, anim: App.anim, burbujas: App.burbujas, encima: App.encima, destacar: App.destacar, parpadeo: App.parpadeo, reclutaAbierto: App.reclutaAbierto, construirAbierto: App.construirAbierto }); FWM.paneles.posicionarBurbuja(App); FWM.paneles.posicionarRecluta(App); } };
  // La selección parpadea: dos veces por segundo, solo mientras hay algo seleccionado (barato para el móvil).
  App.parpadeo = true;
  setInterval(() => { if (App.estado && App.sel && App.sel.hex && !FWM.inicio.visible()) { App.parpadeo = !App.parpadeo; App.dibujar(); } else App.parpadeo = true; }, 450);

  // ---------- animaciones cortas sobre el mapa ----------
  // efectos: textos flotantes. anim.tropas: desplazamientos por tropa (mover, embestir, temblar).
  // anim.fantasmas: tropas muertas que se encogen. anim.proyectiles: flechas y piedras.
  App.efectos = [];
  App.anim = { tropas: {}, fantasmas: [], proyectiles: [] };
  App.arrancarAnimacion = function () { if (!App._animando) { App._animando = true; requestAnimationFrame(App.animar); } };
  App.efecto = function (ef) {
    App.efectos.push(Object.assign({ t0: performance.now(), dur: 1400 }, ef));
    App.arrancarAnimacion();
  };
  App.tween = function (id, tw) {
    (App.anim.tropas[id] = App.anim.tropas[id] || []).push(Object.assign({ t0: performance.now() }, tw));
    App.arrancarAnimacion();
  };
  App.animar = function () {
    const ahora = performance.now();
    const vivo = (e) => ahora - e.t0 < e.dur;
    App.efectos = App.efectos.filter(vivo);
    for (const id of Object.keys(App.anim.tropas)) { App.anim.tropas[id] = App.anim.tropas[id].filter(vivo); if (!App.anim.tropas[id].length) delete App.anim.tropas[id]; }
    App.anim.fantasmas = App.anim.fantasmas.filter(vivo);
    App.anim.proyectiles = App.anim.proyectiles.filter(vivo);
    App.dibujar();
    const queda = App.efectos.length || Object.keys(App.anim.tropas).length || App.anim.fantasmas.length || App.anim.proyectiles.length || (App.destacar && !FWM.inicio.visible());
    if (queda) requestAnimationFrame(App.animar); else App._animando = false;
  };
  // Cuánto dura (ms) la animación de una acción; el turno de la IA espera este tiempo entre acciones.
  App.duracionAccion = function (accion) {
    if (!accion) return 0;
    // con muchos rivales (grandes escenarios) las animaciones van al doble de rápido: si no, ver una ronda es eterno
    const f = App.estado && App.estado.jugadores.length > 4 ? 0.5 : 1;
    if (accion.tipo === "mover") return 170 * f;
    if (accion.tipo === "atacar" || accion.tipo === "asediar") return 650 * f;
    if (accion.tipo === "fundar" || accion.tipo === "construir" || accion.tipo === "reclutar") return 120 * f;
    return 0;
  };
  // Monta las animaciones y sonidos de una acción ya aplicada (antes → después).
  App.animarAccion = function (antes, despues, accion, eventos) {
    if (!antes || !accion) return;
    const S = FWM.sonido, datos = App.datos, T = datos.textos; const ahora = performance.now();
    const t = antes.tropas[accion.tropa];
    const origen = t ? FWM.estado.posicionTropa(antes, t) : null;
    if (accion.tipo === "mover" && t && origen && accion.a !== origen) {
      App.tween(t.id, { tipo: "mover", desde: origen, hasta: accion.a, dur: 170 });
    }
    if ((accion.tipo === "atacar" || accion.tipo === "asediar") && t && origen) {
      const objetivo = accion.objetivo; const dt = datos.tropas[t.tipo];
      const aDistancia = (dt.stats.alcance || 0) > 0;
      const golpeEn = aDistancia ? 260 : 150; // cuándo llega el golpe
      const posDespues = despues.tropas[t.id] ? FWM.estado.posicionTropa(despues, despues.tropas[t.id]) : null;
      if (aDistancia) {
        App.anim.proyectiles.push({ t0: ahora, dur: 260, desde: origen, hasta: objetivo, tipo: t.tipo === "catapulta" ? "piedra" : "flecha" });
        if (t.tipo === "catapulta") S.piedra(.25); else S.flecha(0);
      } else if (posDespues && posDespues !== origen) {
        // ha matado y avanza: la embestida es el propio desplazamiento
        App.tween(t.id, { tipo: "mover", desde: origen, hasta: posDespues, dur: 380 });
        S.golpe(.15);
      } else {
        App.tween(t.id, { tipo: "embestir", desde: origen, hasta: objetivo, dur: 300 });
        S.golpe(.15);
      }
      App.arrancarAnimacion();
      for (const e of eventos || []) {
        if (e.tipo === "ataque") {
          const d = FWM.estado.tropaEn(despues, objetivo) || (despues.asentamientos[objetivo] && despues.asentamientos[objetivo].guarnicion.map(id => despues.tropas[id]).find(Boolean));
          if (d) App.tween(d.id, { tipo: "temblar", t0: ahora + golpeEn, dur: 320 });
          App.efectos.push({ t0: ahora + golpeEn, dur: 1000, hex: objetivo, texto: "−" + e.dano, color: "#ffb3b3" });
        }
        if (e.tipo === "asedio") App.efectos.push({ t0: ahora + golpeEn, dur: 1000, hex: objetivo, texto: "−" + e.dano + " ⌂", color: "#ffd9a8" });
        if (e.tipo === "contraataque") {
          App.tween(t.id, { tipo: "temblar", t0: ahora + golpeEn + 280, dur: 320 });
          App.efectos.push({ t0: ahora + golpeEn + 280, dur: 1000, hex: origen, texto: "−" + e.dano, color: "#ffb3b3" });
          S.clinc((golpeEn + 280) / 1000);
        }
        if (e.tipo === "muere" && e.hex && e.jugador === App.humano && datos.tropas[e.tropa] && datos.tropas[e.tropa].heroe) setTimeout(() => FWM.paneles.aviso(T.heroeUI.muerto, 4000), 600);
        if (e.tipo === "muere" && e.hex) {
          const esAtacante = e.hex === origen && e.jugador === t.dueno;
          const cuando = esAtacante ? golpeEn + 280 : golpeEn;
          App.anim.fantasmas.push({ t0: ahora + cuando, dur: 500, hex: e.hex, tipo: e.tropa, color: antes.jugadores[e.jugador].color, enemigo: e.jugador !== App.humano, heroe: antes.jugadores[e.jugador].heroe });
          S.muerte(cuando / 1000);
        }
      }
    }
    // bancarrota: la tropa se desvanece con un "deserta" encima; si es mía, aviso grande y temblor de pantalla
    const desertan = (eventos || []).filter(e => e.tipo === "bancarrota" && e.hex);
    desertan.forEach((e, i) => {
      App.anim.fantasmas.push({ t0: ahora + i * 220, dur: 700, hex: e.hex, tipo: e.tropa, color: antes.jugadores[e.jugador].color, enemigo: e.jugador !== App.humano });
      App.efectos.push({ t0: ahora + i * 220, dur: 1400, hex: e.hex, texto: T.deserta, color: "#ffd27a" });
      S.muerte(i * .22);
    });
    const mias = desertan.filter(e => e.jugador === App.humano);
    if (mias.length) {
      FWM.paneles.aviso(mias.length === 1 ? T.bancarrotaAvisoUna.replace("{tropa}", datos.tropas[mias[0].tropa].nombre) : T.bancarrotaAviso.replace("{n}", mias.length), 5000);
      const app = document.getElementById("app"); app.classList.remove("temblor"); void app.offsetWidth; app.classList.add("temblor"); setTimeout(() => app.classList.remove("temblor"), 700);
    }
    App.arrancarAnimacion();
    for (const e of eventos || []) {
      if (e.tipo === "recluta") S.pop();
      if (e.tipo === "funda" || e.tipo === "castillo" || e.tipo === "ciudad") S.moneda();
      if (e.tipo === "asciende") S.fanfarria();
    }
  };
  // Compara dos estados y anota (y anima) las tropas que han subido de nivel de experiencia.
  App.ascensos = function (antes, despues, eventos) {
    if (!antes || !despues) return;
    const ex = App.datos.reglas && App.datos.reglas.experiencia; if (!ex) return;
    for (const t of Object.values(despues.tropas)) {
      const viejo = antes.tropas[t.id]; if (!viejo) continue;
      const n0 = FWM.stats.nivelExperiencia(App.datos, viejo), n1 = FWM.stats.nivelExperiencia(App.datos, t);
      if (n1 <= n0) continue;
      const hex = FWM.estado.posicionTropa(despues, t);
      const nivel = ex.niveles[n1].nombre;
      if (eventos) eventos.push({ tipo: "asciende", jugador: t.dueno, tropa: t.tipo, nivel, hex });
      if (hex) App.efecto({ tipo: "asciende", hex, texto: "★ " + nivel, color: "#f0c75e" });
    }
  };

  App.anotar = function (eventos) {
    for (const e of eventos) {
      const txt = FWM.paneles.textoEvento(App, e);
      if (txt) App.registro.push(txt);
    }
    if (App.registro.length > 200) App.registro.splice(0, App.registro.length - 200);
  };

  // En pantallas estrechas, etiquetas cortas en la barra.
  App.etiquetasBotones = function () {
    const T = App.datos.textos;
    const estrecho = window.innerWidth < 760;
    const poner = (id, largo, corto) => { const b = document.getElementById(id); if (b) { b.textContent = estrecho ? corto : largo; b.title = largo; } };
    poner("btn-deshacer", T.deshacer, T.deshacer); // con la palabra también en el móvil, del tamaño de los otros
    poner("btn-glosario", T.glosario, "Glos.");
    poner("btn-tec", T.tecnologia, "Tec.");
    poner("btn-menu", T.menu, T.menu);
    poner("btn-fin", T.finTurno, T.finTurno);
  };

  App.boton = function (texto, fn, clase) {
    const b = document.createElement("button"); b.className = clase || "btn"; b.textContent = texto;
    b.addEventListener("click", fn); return b;
  };

  // Botón ✕ arriba a la derecha de cualquier modal (en móvil no hay que bajar hasta "Cerrar").
  function ponerCierre(caja) {
    const x = document.createElement("button"); x.className = "modal-cerrar"; x.textContent = "✕"; x.title = App.datos.textos.cerrar;
    x.addEventListener("click", App.cerrarModal); caja.appendChild(x);
  }
  App.modal = function (html, botones) {
    const m = document.getElementById("modal"), caja = document.getElementById("modal-caja");
    caja.innerHTML = html; ponerCierre(caja); caja.scrollTop = 0;
    const fila = document.createElement("div"); fila.className = "modal-botones";
    for (const [txt, fn, clase] of botones) fila.appendChild(App.boton(txt, fn, clase));
    caja.appendChild(fila);
    m.hidden = false;
  };
  App.modalNodo = function (nodo) {
    const m = document.getElementById("modal"), caja = document.getElementById("modal-caja");
    caja.innerHTML = ""; caja.appendChild(nodo); ponerCierre(caja); caja.scrollTop = 0; m.hidden = false;
    App.escudoToque();
  };
  // Escudo invisible que se traga el "click" que el dedo dispara al soltar, justo después de abrir algo debajo de él.
  App.escudoToque = function () {
    const escudo = document.createElement("div"); escudo.style.cssText = "position:fixed;inset:0;z-index:99;background:transparent";
    escudo.addEventListener("click", (ev) => { ev.stopPropagation(); ev.preventDefault(); }, true);
    document.body.appendChild(escudo);
    const soltar = () => { document.removeEventListener("pointerup", soltar, true); document.removeEventListener("touchend", soltar, true); setTimeout(() => escudo.remove(), 350); };
    document.addEventListener("pointerup", soltar, true); document.addEventListener("touchend", soltar, true);
    setTimeout(() => escudo.remove(), 3000);
  };
  App.cerrarModal = function () { document.getElementById("modal").hidden = true; };
  App.confirmar = function (texto, fn) {
    const T = App.datos.textos;
    App.modal(`<p>${texto}</p>`, [[T.confirmar, () => { App.cerrarModal(); fn(); }, "btn btn-primario"], [T.cancelar, () => App.cerrarModal(), "btn btn-claro"]]);
  };

  App.abrirTecnologia = function () { if (App.ocupado || !App.estado) return; App.modalNodo(FWM.arbolTecnologico.render(App)); };
  App.abrirReino = function () { if (App.ocupado || !App.estado) return; App.modalNodo(FWM.paneles.renderReino(App)); };
  // vista: { pestana, id } para abrir una ficha concreta
  App.abrirGlosario = function (vista) { if (!App.datos) return; App.modalNodo(FWM.glosario.render(App, vista || App.glosarioVista || {})); App.glosarioVista = vista || App.glosarioVista || {}; };

  // Presets de partida. "personalizada" usa lo que haya en Avanzado.
  const PRESETS = {
    // 6 sep 2026: 15 turnos y mapa según reinos (mini hasta 3, pequeño con 4 o 5): partidas de 8-10 minutos en el móvil
    rapida: { tecnologia: "todo", hucha: 2, recursos: "equilibrado", limite: 15 },
    dia: { tecnologia: "todo", hucha: 2, recursos: "equilibrado", limite: 15 }, // mapa del día: como la Rápida, con la semilla del día
    normal: { tamano: "mediano", tecnologia: "arbol", hucha: 1, recursos: "equilibrado", limite: 0 },
    duelo: { tamano: "pequeno", tecnologia: "todo", hucha: 2, recursos: "equilibrado", limite: 20, rivales: 1 }, // 1 contra 1 en directo
    escenario: { tecnologia: "todo", hucha: 2, recursos: "equilibrado", limite: 60 },
    barbaros: { mapaHecho: "arena", tecnologia: "todo", hucha: 2, recursos: "equilibrado", limite: 0, rivales: 1 }, // resistir hordas: sin límite de turnos // grandes batallas: el mapa y los turnos los pone el escenario
  };

  // Opciones de una partida Rápida con lo que se puede suponer (para Jugar sin preguntar nada).
  App.opcionesRapida = function () { const aj = FWM.guardado.ajustes(); return Object.assign({ tipo: "rapida", rivales: 2, dificultad: "normal", bando: aj.bando || "aleatorio", semilla: Math.floor(Math.random() * 1e6) + 1 }, PRESETS.rapida); };

  // Formulario de nueva partida (lo usan la pantalla de inicio y el menú de dentro de la partida).
  // Devuelve { nodo, leer } donde leer() da las opciones elegidas.
  App.formularioPartida = function () {
    const T = App.datos.textos;
    const aj = FWM.guardado.ajustes();
    // por defecto, partida Rápida (el producto); "normal" es el id interno de la partida Lenta
    const op = Object.assign({ rivales: 2, dificultad: "normal", tipo: "rapida", tecnologia: "todo", hucha: 2, recursos: "equilibrado", limite: 15, bando: aj.bando || "aleatorio" }, App.opciones || {});
    const bandos = Object.entries(App.datos.bandos).map(([id, b]) => [id, b.nombre]);
    const cont = document.createElement("div");
    const sel = (id, valores, actual) => `<select id="${id}">${valores.map(([v, txt]) => `<option value="${v}" ${v === actual ? "selected" : ""}>${txt}</option>`).join("")}</select>`;
    // un solo juego: la partida Rápida (5 sep 2026: fuera Lenta, Personalizada, tecnologías y recursos). Solo se decide lo que no se puede suponer.
    cont.innerHTML = `
      <div class="campo"><label>${T.tuBando}</label>${sel("op-bando", [["aleatorio", T.bandoAleatorio]].concat(bandos), op.bando)}</div>
      <p class="pista" id="op-rasgo"></p>
      <div class="campo"><label>${T.jugadores}</label>${sel("op-rivales", [1, 2, 3, 4].map(n => [String(n), String(n)]), String(op.rivales))}</div>
      <div class="campo"><label>${T.dificultad}</label>${sel("op-dificultad", [["facil", T.facil], ["normal", T.normal], ["dificil", T.dificil]], op.dificultad)}</div>
      <p class="pista" id="op-dif-pista"></p>
      <div class="campo"><label>${T.finPartida}</label>${sel("op-fin", [["puntos", T.finPuntos], ["eliminacion", T.finEliminacion]], op.limite ? "puntos" : "eliminacion")}</div>
      <div class="campo" id="op-turnos-campo"><label>${T.limiteTurnos}</label>${sel("op-turnos", [10, 15, 20, 25, 30, 40].map(n => [String(n), String(n)]), String(op.limite || 15))}</div>
      <p class="pista" id="op-fin-pista"></p>`;
    const $ = (id) => cont.querySelector("#" + id);
    const pintarRasgo = () => { const b = App.datos.bandos[$("op-bando").value]; $("op-rasgo").textContent = b ? b.rasgo + " " + b.descripcion : T.bandoAleatorioPista; };
    $("op-bando").addEventListener("change", pintarRasgo); pintarRasgo();
    const pintarDif = () => { $("op-dif-pista").textContent = T.dificultadPista[$("op-dificultad").value] || ""; };
    $("op-dificultad").addEventListener("change", pintarDif); pintarDif();
    // fin de partida: por puntos al llegar al límite, o por eliminación (hasta que quede uno)
    const pintarFin = () => {
      const porPuntos = $("op-fin").value === "puntos";
      $("op-turnos-campo").hidden = !porPuntos;
      $("op-fin-pista").textContent = porPuntos ? T.finPuntosPista.replace("{n}", $("op-turnos").value) : T.finEliminacionPista;
    };
    $("op-fin").addEventListener("change", pintarFin); $("op-turnos").addEventListener("change", pintarFin); pintarFin();
    const leer = () => Object.assign({ tipo: "rapida", rivales: parseInt($("op-rivales").value, 10), dificultad: $("op-dificultad").value, bando: $("op-bando").value, semilla: Math.floor(Math.random() * 1e6) + 1 },
      PRESETS.rapida, { limite: $("op-fin").value === "puntos" ? parseInt($("op-turnos").value, 10) : 0 });
    return { nodo: cont, leer };
  };

  // Menú dentro de la partida: nueva partida, volver al inicio, ayuda.
  App.abrirMenu = function (hayPartida) {
    const T = App.datos.textos;
    const cont = document.createElement("div");
    cont.innerHTML = `<h2>${T.inicioPartida}</h2>`;
    const f = App.formularioPartida();
    cont.appendChild(f.nodo);
    const ayuda = document.createElement("div");
    ayuda.innerHTML = `<h3>${T.ayuda}</h3><ul class="ayuda">${T.ayudaTexto.map(x => `<li>${x}</li>`).join("")}</ul>`;
    cont.appendChild(ayuda);
    const fila = document.createElement("div"); fila.className = "modal-botones";
    fila.appendChild(App.boton(T.volverInicio, () => { App.cerrarModal(); App.irInicio(); }, "btn btn-claro"));
    if (hayPartida || App.estado) fila.appendChild(App.boton(T.continuar, () => App.cerrarModal(), "btn btn-claro"));
    fila.appendChild(App.boton(T.empezar, () => App.nuevaPartida(f.leer()), "btn btn-primario"));
    cont.appendChild(fila);
    App.modalNodo(cont);
  };

  // Pantalla de inicio (enrutador mínimo: inicio ↔ partida).
  App.irInicio = function () { App.cerrarModal(); FWM.inicio.mostrar(App); };
  App.irPartida = function () { FWM.inicio.ocultar(); FWM.musica.empezar("partida"); App.L.redimensionar(); if (FWM.duelo) FWM.duelo.reanudar(App); if (App.estado) { App.L.encuadrar(App.estado, App.miCapital()); App.refrescar(); if (App.estado.jugadorActivo !== App.humano && App.estado.ganador == null && !App.ocupado) App.jugarIAs(); } };

  return App;
})();
// La partida en curso, accesible para los módulos que la necesitan sin recibirla por parámetro (duelo, repetición).
window.FWM = window.FWM || {}; FWM.app = App;

window.addEventListener("DOMContentLoaded", App.iniciar);
