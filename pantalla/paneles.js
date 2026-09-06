// Barra superior, panel lateral, registro, avisos, pestaña del reino.
window.FWM = window.FWM || {};

FWM.paneles = (function () {
  // Puntos de movimiento -> pasos (2 puntos = 1 paso), con medios.
  function pasos(datos, puntos) {
    const ppp = (datos.reglas && datos.reglas.puntosPorPaso) || 2;
    const v = puntos / ppp;
    return Number.isInteger(v) ? String(v) : v.toFixed(1).replace(".", ",");
  }

  // Chip de experiencia: nombre del nivel, galones y puntos hasta el siguiente.
  function chipExperiencia(datos, tr) {
    const ex = datos.reglas && datos.reglas.experiencia; if (!ex) return "";
    const n = FWM.stats.nivelExperiencia(datos, tr); const niv = ex.niveles[n]; const sig = ex.niveles[n + 1];
    const galones = "★".repeat(n) || "";
    const detalle = sig ? ` ${tr.xp || 0}/${sig.umbral}` : "";
    return `<span class="chip" title="${datos.textos.experiencia}${niv.ataque ? ": +" + niv.ataque + " ataque, +" + niv.defensa + " defensa" : ""}"><span class="galones">${galones}</span> ${niv.nombre}${detalle}</span>`;
  }

  // Nombre del reino (= su bando). html: coloreado y en negrita; texto plano si no.
  function nombreReino(App, j, texto) {
    if (!j) return "?";
    const T = App.datos.textos;
    const enDuelo = App.opciones && App.opciones.duelo;
    const n = j.nombre + (j.humano ? " " + T.tuSufijo : (enDuelo && j.apodo ? " (" + j.apodo + ")" : ""));
    return texto ? n : `<span style="color:${j.color};font-weight:700">${n}</span>`;
  }
  function nombreJugador(App, id) { return nombreReino(App, App.estado.jugadores[id], true); }

  // Texto de "por qué no": convierte el código de error en una frase concreta (qué falta, qué tecnología, a qué distancia).
  function motivo(App, err, ctx) {
    const { estado, datos } = App; const T = datos.textos; ctx = ctx || {};
    const j = estado.jugadores[App.humano];
    if (err === "sin_recursos" && ctx.coste) {
      const hucha = FWM.territorio.huchaDe(estado, datos, j.id, ctx.hex || j.capital) || j.hucha;
      const faltan = Object.entries(ctx.coste).filter(([r, n]) => (hucha[r] || 0) < n).map(([r, n]) => (n - (hucha[r] || 0)) + " " + datos.recursos[r].nombre.toLowerCase());
      if (faltan.length) return T.faltan.replace("{que}", faltan.join(", "));
    }
    if (err === "sin_tecnologia" && ctx.requiere) {
      const falta = ctx.requiere.filter(x => !FWM.stats.tieneTec(j, x)).map(x => datos.tecnologias[x] ? datos.tecnologias[x].nombre : x);
      if (falta.length) return T.requiereTec.replace("{tec}", falta.join(", "));
    }
    if (err === "demasiado_cerca" && ctx.hex) {
      const min = datos.asentamientos.pueblo.distanciaMinima;
      let mejor = null;
      for (const [k, a] of Object.entries(estado.asentamientos)) { const d = FWM.hex.distancia(k, ctx.hex); if (d < min && (!mejor || d < mejor.d)) mejor = { d, nombre: a.nombre }; }
      if (mejor) return T.cercaDe.replace("{nombre}", mejor.nombre).replace("{d}", mejor.d).replace("{min}", min);
    }
    if (err === "sin_hueco") return T.sinHuecoDetalle;
    if (err === "solo_en_ciudad" && ctx.tipoAsent) return T.errores.solo_en_ciudad.replace("{tipo}", ctx.tipoAsent);
    if (err === "no_aqui" && ctx.donde) return T.errores.no_aqui.replace("{donde}", ctx.donde);
    return T.errores[err] || err;
  }

  // Botón de acción que se queda visible en gris con el motivo debajo cuando no se puede.
  // Fila de acción a todo el ancho: nombre y coste a la izquierda; a la derecha el motivo si no se puede.
  // "Fundar pueblo (20 oro)" se muestra como "Fundar pueblo · 20 oro". clase "btn-primario" = acción principal (en color).
  function botonAccion(App, cont, etiqueta, accion, clase, ctx, corto) {
    if (corto && window.innerWidth < 760) etiqueta = corto; // en móvil, etiquetas de una línea
    const err = FWM.acciones.acciones[accion.tipo].validar(App.estado, App.datos, accion);
    const b = document.createElement("button");
    b.className = "fila-accion" + (err ? " no" : (clase || "").includes("btn-primario") ? " principal" : "");
    const nombre = document.createElement("span"); nombre.className = "fa-nombre"; nombre.textContent = etiqueta.replace(/\s*\((.*)\)\s*$/, " · $1");
    b.appendChild(nombre);
    const lado = document.createElement("span"); lado.className = "fa-motivo"; lado.textContent = err ? motivo(App, err, ctx) : "▶";
    b.appendChild(lado);
    if (err) { b.title = motivo(App, err, ctx); b.setAttribute("aria-disabled", "true"); b.addEventListener("click", () => aviso(motivo(App, err, ctx), 2600)); } // en móvil el motivo no cabe: se enseña al tocar
    else b.addEventListener("click", () => App.aplicar(accion));
    cont.appendChild(b);
    return err;
  }

  // Gráfica SVG de una serie por reino a lo largo de los turnos (estado.linea). serie(p) devuelve el array por jugador.
  function graficaLinea(estado, datos, serie, T) {
    const linea = (estado.linea || []).filter(p => serie(p));
    if (linea.length < 2) return "";
    const W = 640, H = 150, ml = 30, mb = 18;
    const maxV = Math.max(1, ...linea.map(p => Math.max(...serie(p))));
    const maxT = linea[linea.length - 1].turno;
    const x = (t) => ml + (t - 1) / Math.max(1, maxT - 1) * (W - ml - 8);
    const y = (v) => H - mb - v / maxV * (H - mb - 8);
    let svg = `<svg viewBox="0 0 ${W} ${H}" class="linea-tiempo" preserveAspectRatio="none">`;
    svg += `<line x1="${ml}" y1="${H - mb}" x2="${W - 8}" y2="${H - mb}" stroke="#8b7f6a" stroke-width="1"/><line x1="${ml}" y1="8" x2="${ml}" y2="${H - mb}" stroke="#8b7f6a" stroke-width="1"/>`;
    svg += `<text x="${ml - 4}" y="12" font-size="10" text-anchor="end" fill="#6b6050">${maxV}</text><text x="${W - 8}" y="${H - 4}" font-size="10" text-anchor="end" fill="#6b6050">${T.turno} ${maxT}</text>`;
    estado.jugadores.forEach((j, i) => {
      const pts = linea.map(p => `${x(p.turno).toFixed(1)},${y(serie(p)[i] || 0).toFixed(1)}`).join(" ");
      svg += `<polyline points="${pts}" fill="none" stroke="${j.color}" stroke-width="${j.humano ? 3 : 2}" stroke-linejoin="round"/>`;
    });
    return svg + `</svg>`;
  }

  function textoDesglose(App, recurso, d) {
    const T = App.datos.textos;
    const lineas = [];
    const ing = d.ingresos[recurso] || [], gas = d.gastos[recurso] || [];
    lineas.push(T.ingresos + ": " + (ing.length ? ing.map(f => "+" + f.cantidad + " " + f.texto + (f.veces > 1 ? " ×" + f.veces : "")).join(", ") : T.sinIngresos));
    if (gas.length) lineas.push(T.gastos + ": " + gas.map(f => "−" + f.cantidad + " " + f.texto + (f.veces > 1 ? " ×" + f.veces : "")).join(", "));
    return lineas.join("\n");
  }

  // Botón de música de la barra: nota si suena, nota tachada si está silenciada.
  const SVG_NOTA = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" stroke="none"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19.5 6a9 9 0 0 1 0 12"/></svg>';
  const SVG_NOTA_OFF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" stroke="none"/><path d="M16 9l6 6M22 9l-6 6"/></svg>';
  function pintarBotonMusica() {
    const b = document.getElementById("btn-musica"); if (!b) return;
    const on = FWM.musica.activa() || FWM.sonido.activo();
    b.innerHTML = on ? SVG_NOTA : SVG_NOTA_OFF;
    b.classList.toggle("apagado", !on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
  }

  const escaparTxt = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  function renderBarra(App) {
    pintarBotonMusica();
    const { estado, datos } = App;
    const T = datos.textos;
    const j = estado.jugadores[App.humano];
    const res = FWM.economia.resumen(estado, datos, App.humano);
    const d = FWM.economia.desglose(estado, datos, App.humano);
    const rec = document.getElementById("barra-recursos");
    rec.innerHTML = "";
    for (const id of Object.keys(datos.recursos).sort((a, b) => datos.recursos[a].orden - datos.recursos[b].orden)) {
      if (estado.soloOro && id !== "oro") continue;
      const el = document.createElement("span"); el.className = "recurso";
      const neto = (res.ingresos[id] || 0) - (id === "oro" ? res.gasto : 0);
      if (neto < 0) el.classList.add("neg");
      el.appendChild(FWM.iconos.canvasIcono(datos.recursos[id].icono, 18));
      el.appendChild(document.createTextNode(" " + (j.hucha[id] || 0) + " "));
      const s = document.createElement("small"); s.textContent = (neto >= 0 ? "+" : "") + neto; el.appendChild(s);
      el.title = datos.recursos[id].nombre + " · " + T.neto + " " + (neto >= 0 ? "+" : "") + neto + " " + T.porTurno + "\n" + textoDesglose(App, id, d);
      el.addEventListener("click", () => App.abrirHoja("reino"));
      rec.appendChild(el);
    }
    const turno = document.getElementById("barra-turno");
    const activo = estado.jugadores[estado.jugadorActivo];
    // modo Bárbaros: la ronda manda, y se avisa de la oleada que viene
    if (estado.barbaros) {
      const sig = FWM.barbaros.siguienteOleada(estado);
      turno.innerHTML = `${T.barbaros.ronda} <b>${FWM.barbaros.rondas(estado)}</b>` +
        (sig ? ` · <span class="suave">${T.barbaros.proxima.replace("{ronda}", sig.ronda).replace("{lados}", sig.lados)}</span>` : "");
      const marc0 = document.getElementById("barra-marcador"); if (marc0) marc0.hidden = true;
      document.getElementById("btn-chat").hidden = true;
      const primera = !!App.primeraPartida;
      for (const [id, ver] of [["btn-deshacer", true], ["btn-siguiente", true], ["btn-fin", true], ["btn-glosario", !primera]]) { const b = document.getElementById(id); if (b) b.hidden = !ver; }
      const desh = document.getElementById("btn-deshacer"); if (desh) desh.disabled = !App.pila.length;
      const sig2 = document.getElementById("btn-siguiente"); const pend = App.tropasPendientes();
      if (sig2) { sig2.disabled = !pend.length; sig2.textContent = T.siguienteTropaCorto + (pend.length ? " (" + pend.length + ")" : ""); }
      const fin = document.getElementById("btn-fin"); if (fin) fin.disabled = !(estado.jugadorActivo === App.humano && !App.ocupado && estado.ganador == null);
      return;
    }
    const enDueloBarra = !!(App.opciones && App.opciones.duelo);
    turno.innerHTML = `${T.turno} <b>${estado.turno}${estado.limiteTurnos ? "/" + estado.limiteTurnos : ""}</b> · ${nombreReino(App, activo)}` +
      (enDueloBarra ? "" : ` · <b>${FWM.victoria.puntos(estado, datos, App.humano)}</b> ${T.puntos.toLowerCase()}`) +
      (j.investigando ? ` · ⏳ ${datos.tecnologias[j.investigando.id].nombre} (${j.investigando.turnosRestantes})` : "") +
      (App.opciones && App.opciones.duelo ? ` <b id="barra-reloj" class="reloj">${FWM.duelo.texto()}</b>` : "");
    // duelo: marcador permanente con los puntos de los dos y quién va primero
    const marc = document.getElementById("barra-marcador");
    if (marc) {
      const enDuelo = !!(App.opciones && App.opciones.duelo);
      marc.hidden = !enDuelo;
      if (enDuelo) {
        const filas = estado.jugadores.map(x => ({ id: x.id, nombre: x.id === App.humano ? T.duelo.yo : (x.apodo || x.nombre), p: FWM.victoria.puntos(estado, datos, x.id), color: x.color, mio: x.id === App.humano }))
          .sort((a, b) => b.p - a.p);
        const voy = filas.findIndex(f => f.mio);
        const empate = filas.length > 1 && filas[0].p === filas[1].p;
        marc.innerHTML = filas.map(f => `<span class="marc${f.mio ? " mio" : ""}"><i style="background:${f.color}"></i>${escaparTxt(f.nombre)} <b>${f.p}</b></span>`).join("")
          + `<span class="marc-pos">${empate ? T.duelo.empate : (T.duelo.vas + " " + (voy === 0 ? T.duelo.primero : T.duelo.segundo))}</span>`;
      }
    }
    const miTurno = estado.jugadorActivo === App.humano && !App.ocupado && estado.ganador == null;
    document.getElementById("btn-chat").hidden = !(FWM.duelo.activo() && FWM.duelo.enLinea());
    // descubrimiento por capas: en la primera partida solo Mover, Atacar y Fin de turno
    const primera = !!App.primeraPartida;
    document.getElementById("btn-glosario").hidden = primera;
    document.getElementById("btn-deshacer").disabled = App.pila.length === 0 || App.ocupado;
    document.getElementById("btn-fin").disabled = !miTurno;

    const pend = App.tropasPendientes().length;
    const bs = document.getElementById("btn-siguiente");
    bs.disabled = !miTurno || pend === 0;
    bs.textContent = (window.innerWidth < 760 ? T.siguienteTropaCorto : T.siguienteTropa) + (pend ? " (" + pend + ")" : "");
  }

  function renderRegistro(App) {
    const cont = document.getElementById("registro");
    cont.innerHTML = "";
    const lineas = App.registro.slice(-6).reverse();
    for (const l of lineas) { const d = document.createElement("div"); d.textContent = l; cont.appendChild(d); }
  }

  function textoEvento(App, e) {
    const T = App.datos.textos;
    const plantilla = T.eventos[e.tipo];
    if (!plantilla) return null;
    const datos = App.datos;
    const nombre = (tipo) => (datos.tropas[tipo] ? datos.tropas[tipo].nombre : tipo);
    const extra = e.ajuste > 0 ? " (" + datos.dados.combate.textoAlto + ")" : e.ajuste < 0 ? " (" + datos.dados.combate.textoBajo + ")" : "";
    return plantilla
      .replace("{jugador}", nombreJugador(App, e.jugador))
      .replace("{tropa}", nombre(e.tropa))
      .replace("{atacante}", nombre(e.atacante))
      .replace("{defensor}", nombre(e.defensor))
      .replace("{nuevo}", nombre(e.nuevo))
      .replace("{asentamiento}", e.asentamiento || "")
      .replace("{tec}", e.tec ? datos.tecnologias[e.tec].nombre : "")
      .replace("{nivel}", e.nivel || "")
      .replace("{dano}", e.dano != null ? e.dano : "")
      .replace("{turno}", e.turno != null ? e.turno : "")
      .replace("{extra}", extra);
  }

  // La burbuja: pegada al hexágono seleccionado, con sus acciones como iconos (y, en una tropa, sus tres números).
  // El nombre y la vida ya están en el mapa; el detalle, en la hoja ("?"). Sin nada seleccionado, no hay burbuja.
  function renderBurbuja(App) {
    const { estado, datos } = App; const T = datos.textos;
    const bur = document.getElementById("burbuja"); bur.innerHTML = ""; bur.hidden = true;
    if (App.ocupado || !estado || App.construirAbierto || App.reclutaAbierto) return; // con una columna abierta, la burbuja estorba
    const sel = App.sel;
    const icono = (emoji, texto, fn, op) => { const b = document.createElement("button"); b.className = "linea-icono" + (op && op.primario ? " primario" : ""); b.innerHTML = `<span class="ico">${emoji}</span><span>${texto}</span>`; if (op && op.titulo) b.title = op.titulo; if (op && op.motivo) { b.addEventListener("click", () => aviso(op.motivo, 2600)); b.style.opacity = ".5"; } else b.addEventListener("click", fn); return b; };
    const acc = document.createElement("div"); acc.className = "burbuja-acciones";
    // tropas: sin burbuja; sus acciones son las insignias en columna a su derecha (escudo, martillos, X, i)
    // asentamientos: sin burbuja; su ficha se abre al tocarlos (las insignias hacen lo suyo)
  }
  // La columna de reclutas: bocadillos redondos con cada tropa y su precio, flotando junto al asentamiento (lado izquierdo).
  function renderRecluta(App) {
    const { estado, datos } = App; const T = datos.textos;
    const col = document.getElementById("recluta"); col.innerHTML = ""; col.hidden = true;
    if (App.construirAbierto && estado && !App.ocupado) { // campesino: Pueblo y Castillo
      const tr = estado.tropas[App.construirAbierto]; if (!tr || tr.dueno !== App.humano || !tr.hex) { App.construirAbierto = null; return; }
      const opciones = [{ id: "pueblo", accion: { tipo: "fundar", tropa: tr.id }, coste: datos.asentamientos.pueblo.coste, err: FWM.acciones.acciones.fundar.validar(estado, datos, { tropa: tr.id }), icono: "pueblo" }];
      for (const [id, def] of Object.entries(datos.asentamientos)) if (def.comoSeConsigue === "construir") opciones.push({ id, accion: { tipo: "construir", hex: tr.hex, que: id }, coste: FWM.stats.costeAsentamiento(estado, datos, tr.dueno, id), err: FWM.acciones.acciones.construir.validar(estado, datos, { hex: tr.hex, que: id }), icono: def.icono, requiere: def.requiere });
      for (const o of opciones) {
        const m = o.err ? motivo(App, o.err, { coste: o.coste, requiere: o.requiere, hex: tr.hex }) : "";
        const b = document.createElement("button"); b.className = "recluta-burbuja" + (o.err ? " no" : ""); b.style.borderColor = estado.jugadores[tr.dueno].color;
        b.appendChild(FWM.iconos.canvasIcono(o.icono, 38));
        const p = document.createElement("span"); p.className = "recluta-precio"; p.textContent = o.coste.oro; b.appendChild(p);
        const et = document.createElement("small"); et.className = "recluta-nombre"; et.textContent = datos.asentamientos[o.id].nombre; b.appendChild(et);
        b.title = `${datos.asentamientos[o.id].nombre} · ${o.coste.oro} oro` + (m ? " · " + m : "");
        b.addEventListener("click", () => { if (o.err) aviso(m, 2600); else App.aplicar(o.accion); });
        col.appendChild(b);
      }
      col.hidden = false; posicionarRecluta(App); return;
    }
    const hex = App.reclutaAbierto; if (!hex || !estado || App.ocupado) return;
    const a = estado.asentamientos[hex]; if (!a || a.dueno !== App.humano) { App.reclutaAbierto = null; return; }
    const def = datos.asentamientos[a.tipo]; const j = estado.jugadores[a.dueno];
    const tipos = Object.keys(datos.tropas).filter(t => !datos.tropas[t].noReclutable && (def.recluta.includes("*") || def.recluta.includes(t)) && (!datos.tropas[t].nivelHeroe || (j.heroe && (j.heroe.nivel || 1) >= datos.tropas[t].nivelHeroe)));
    for (const tipo of tipos) {
      const dt = datos.tropas[tipo];
      const coste = FWM.stats.costeTropa(estado, datos, j.id, tipo);
      const err = FWM.acciones.acciones.reclutar.validar(estado, datos, { asentamiento: hex, que: tipo });
      const m = err ? motivo(App, err, { coste, requiere: dt.requiere, hex }) : "";
      const b = document.createElement("button"); b.className = "recluta-burbuja" + (err ? " no" : ""); b.style.borderColor = j.color;
      b.appendChild(FWM.iconos.canvasTropa(dt.icono, j.color, 40));
      const p = document.createElement("span"); p.className = "recluta-precio"; p.textContent = coste.oro; b.appendChild(p);
      b.title = `${dt.nombre} · ${coste.oro} oro · ⚔${dt.stats.ataque} 🛡${dt.stats.defensa} ❤${dt.stats.vida}` + (m ? " · " + m : "");
      b.addEventListener("click", () => { if (err) aviso(m, 2600); else App.aplicar({ tipo: "reclutar", asentamiento: hex, que: tipo }); });
      col.appendChild(b);
    }
    col.hidden = false; posicionarRecluta(App);
  }
  function posicionarRecluta(App) {
    const col = document.getElementById("recluta"); if (!col || col.hidden || (!App.reclutaAbierto && !App.construirAbierto)) return;
    const trC = App.construirAbierto && App.estado.tropas[App.construirAbierto];
    const hexAncla = trC ? trC.hex : App.reclutaAbierto; if (!hexAncla) { col.hidden = true; return; }
    const c = App.L.centro(hexAncla); const t = App.L.tam(); const cont = document.getElementById("mapa-cont"); const W = cont.clientWidth, H = cont.clientHeight;
    const w = col.offsetWidth || 56, h = col.offsetHeight || 100;
    let x = trC ? c.x + t * .9 : c.x - t * .9 - w; if (x < 4) x = c.x + t * .9; if (x > W - w - 4) x = c.x - t * .9 - w; x = Math.max(4, Math.min(x, W - w - 4));
    let y = c.y - h / 2; y = Math.max(4, Math.min(H - h - 4, y));
    col.style.left = x + "px"; col.style.top = y + "px";
  }
  // Coloca la burbuja bajo el hexágono seleccionado (o encima si no cabe), dentro del mapa.
  function posicionarBurbuja(App) {
    const bur = document.getElementById("burbuja"); if (!bur || bur.hidden || !App.estado) return;
    const sel = App.sel; const tr = sel.tropa && App.estado.tropas[sel.tropa];
    const hex = tr ? FWM.estado.posicionTropa(App.estado, tr) : sel.hex; if (!hex) { bur.hidden = true; return; }
    const c = App.L.centro(hex); const t = App.L.tam(); const cont = document.getElementById("mapa-cont"); const W = cont.clientWidth, H = cont.clientHeight;
    const w = bur.offsetWidth || 160, h = bur.offsetHeight || 60;
    let x = Math.max(w / 2 + 6, Math.min(W - w / 2 - 6, c.x));
    let y = c.y + t * .75 + 8; let arriba = false;
    if (y + h > H - 6) { y = c.y - t * .75 - h - 8; arriba = true; }
    bur.style.left = x + "px"; bur.style.top = Math.max(6, y) + "px"; bur.classList.toggle("arriba", arriba);
  }

  // La hoja: el detalle de lo seleccionado (antes era el panel lateral). que = tropa | asentamiento | reclutar | hex
  function renderPanel(App) {
    const { estado, datos } = App;
    const T = datos.textos;
    const panel = document.getElementById("hoja-caja");
    panel.innerHTML = "";
    const cerrar = document.createElement("button"); cerrar.className = "hoja-cerrar"; cerrar.textContent = "✕"; cerrar.addEventListener("click", () => App.cerrarHoja()); panel.appendChild(cerrar);
    if (App.ocupado) { panel.innerHTML += `<p class="suave">${T.iasJugando}</p>`; return; }
    const sel = App.sel;
    if (App.hoja === "reino") { panel.appendChild(renderReino(App)); return; }
    if (App.hoja === "reclutar" && sel.hex && estado.asentamientos[sel.hex]) { panel.appendChild(FWM.fichaAsentamiento.renderReclutar(App, sel.hex)); return; }
    if (App.hoja === "tropa" && sel.tropa && estado.tropas[sel.tropa]) { panel.appendChild(panelTropa(App, estado.tropas[sel.tropa])); return; }
    if (sel.hex) {
      const h = estado.mapa.hexes[sel.hex];
      if (h && h.construccion === "asentamiento") { panel.appendChild(FWM.fichaAsentamiento.render(App, sel.hex)); return; }
      if (h) { panel.appendChild(panelHex(App, sel.hex)); return; }
    }
    const j = estado.jugadores[App.humano];
    const cap = j.capital ? estado.asentamientos[j.capital].nombre : "—";
    panel.innerHTML = `<h2>${T.titulo}</h2>
      <p><span class="chip" style="background:${FWM.lienzo.conAlpha(j.color, .45)}">${nombreReino(App, j, true)}</span> ${T.tuCapital}: <b>${cap}</b></p>
      ${datos.bandos[j.bando] ? `<p class="suave">${T.rasgo}: ${datos.bandos[j.bando].rasgo}</p>` : ""}
      <p class="suave">Toca una tropa, un asentamiento o un hexágono.</p>
      <h3>${T.ayuda}</h3><ul class="ayuda">${T.ayudaTexto.map(x => `<li>${x}</li>`).join("")}</ul>`;
  }

  // Stats, mantenimiento y terreno de una tropa (fragmento para el panel).
  function statsDe(App, tr) {
    const { estado, datos } = App; const T = datos.textos;
    const dt = datos.tropas[tr.tipo];
    const st = (n) => FWM.stats.statTropa(estado, datos, tr, n);
    const atr = tr.estados && tr.estados.includes("atrincherada");
    const cont = document.createDocumentFragment();
    const max = FWM.stats.vidaMax(estado, datos, tr);
    const atkEf = FWM.stats.ataqueEfectivo(estado, datos, tr);
    const stats = document.createElement("div"); stats.className = "stats";
    // desglose: base + veteranía + terreno + murallas + tecnología/bando (solo si hay algo que sumar)
    const desglose = (stat) => {
      const base = dt.stats[stat] || 0, total = st(stat); const partes = [];
      const ex = datos.reglas && datos.reglas.experiencia; const niv = ex && ex.niveles[FWM.stats.nivelExperiencia(datos, tr)];
      let suma = base;
      if (niv && niv[stat]) { partes.push(`+${niv[stat]} ${T.desgloseVeterania}`); suma += niv[stat]; }
      const mods = tr.hex ? (datos.terrenos[estado.mapa.hexes[tr.hex].terreno].modificadores || {}) : {};
      if (mods[stat]) { partes.push(`+${mods[stat]} ${T.desgloseTerreno}`); suma += mods[stat]; }
      if (stat === "defensa" && atr) { partes.push(`+${datos.reglas.atrincherar.defensa} ${T.desgloseAtrincherada}`); suma += datos.reglas.atrincherar.defensa; }
      if (stat === "defensa" && tr.acuarteladaEn) { const plus = FWM.stats.propAsentamiento(estado, datos, estado.asentamientos[tr.acuarteladaEn], "plusDefensa"); if (plus && estado.asentamientos[tr.acuarteladaEn].integridad > 0) { partes.push(`+${plus} ${T.desgloseMurallas}`); suma += plus; } }
      const resto = total - suma; if (resto) partes.push(`${resto > 0 ? "+" : ""}${resto} ${T.desgloseOtros}`);
      return partes.length ? `<small class="suave desglose">${base} ${partes.join(" ")}</small>` : "";
    };
    // lo que hace falta para jugar: vida, ataque, defensa y movimiento. El resto, detrás del "?"
    stats.innerHTML = `<div>${T.vida}<b>${tr.vida}/${max}</b></div>
      <div>${T.ataque}<b>${atkEf}</b></div>
      <div>${T.defensa}<b>${st("defensa")}</b></div>
      <div>${T.movimiento}<b>${pasos(datos, tr.movRestante)}/${pasos(datos, st("movimiento"))}</b></div>`;
    const mas = document.createElement("button"); mas.className = "btn-ayuda"; mas.textContent = "?"; mas.title = T.verDetalle; stats.appendChild(mas);
    cont.appendChild(stats);
    const detalle = document.createElement("div"); detalle.className = "stats-detalle"; detalle.hidden = !App.detalleTropa;
    detalle.innerHTML = `<div class="stats"><div>${T.asedio}<b>${st("asedio")}</b></div><div>${T.alcance}<b>${st("alcance")}</b></div>${atkEf !== st("ataque") ? `<div>${T.ataque} <small class="suave">${T.sano}</small><b>${st("ataque")}</b></div>` : ""}</div>
      ${["vida", "ataque", "defensa"].map(k => { const d = desglose(k); return d ? `<div><span class="suave">${T[k]}:</span> ${d}</div>` : ""; }).join("")}
      <p><span class="suave">${T.mantenimiento}: ${FWM.economia.mantenimientoDe(datos, tr)} ${T.porTurno}</span></p>`;
    mas.addEventListener("click", () => { App.detalleTropa = !App.detalleTropa; detalle.hidden = !App.detalleTropa; });
    cont.appendChild(detalle);
    if (tr.hex) {
      const hx = estado.mapa.hexes[tr.hex]; const te = datos.terrenos[hx.terreno];
      const mods = (te.modificadores || {});
      const extras = [mods.defensa ? "+" + mods.defensa + " " + T.defensa.toLowerCase() : "", mods.alcanceDistancia && st("alcance") > 0 ? "+" + mods.alcanceDistancia + " " + T.alcance.toLowerCase() : "", hx.carretera ? T.carretera.toLowerCase() : ""].filter(Boolean).join(" · ");
      const pt = document.createElement("p"); pt.className = "sobre";
      pt.appendChild(FWM.iconos.canvasTerreno(hx.terreno, te.color, 20));
      pt.appendChild(document.createTextNode(` ${te.nombre}${extras ? " (" + extras + ")" : ""}`));
      cont.appendChild(pt);
    }
    if (tr.hex && estado.mapa.hexes[tr.hex].yacimiento) {
      const y = datos.yacimientos[estado.mapa.hexes[tr.hex].yacimiento];
      const ps = document.createElement("p"); ps.className = "sobre";
      ps.appendChild(FWM.iconos.canvasIcono(y.icono, 20));
      ps.appendChild(document.createTextNode(` ${T.sobre}: ${y.nombre} (${y.puntos ? T.puntoClaveVale.replace("{n}", y.puntos) : FWM.util.textoCoste(y.produce, datos) + " " + T.porTurno})`));
      cont.appendChild(ps);
    }
    return cont;
  }

  function panelTropa(App, tr) {
    const { estado, datos } = App;
    const T = datos.textos;
    const dt = datos.tropas[tr.tipo];
    const j = estado.jugadores[tr.dueno];
    const mio = tr.dueno === App.humano && estado.jugadorActivo === App.humano;
    const st = (n) => FWM.stats.statTropa(estado, datos, tr, n);
    const cont = document.createElement("div");
    const cab = document.createElement("div"); cab.className = "ficha-cab";
    cab.appendChild(dt.heroe ? FWM.figuras.canvasHeroe(j.heroe, j.color, 52, false, tr.dueno !== App.humano) : FWM.iconos.canvasTropa(dt.icono, j.color, 52, tr.dueno !== App.humano));
    const tit = document.createElement("div");
    const atr = tr.estados && tr.estados.includes("atrincherada");
    const titulo = dt.heroe ? `${j.apodo || (j.humano ? (FWM.nube.nombre() || FWM.guardado.ajustes().nombre) : "") || T.heroe} · ${dt.nombre}` : dt.nombre;
    tit.innerHTML = `<h2 style="margin:0">${titulo} <button class="btn-ayuda" title="${T.verEnGlosario}">?</button></h2><span class="chip" style="background:${FWM.lienzo.conAlpha(j.color, .35)}">${nombreReino(App, j, true)}</span>` +
      (tr.acuarteladaEn ? `<span class="chip">${T.guarnicion}: ${estado.asentamientos[tr.acuarteladaEn].nombre}</span>` : "") +
      (atr ? `<span class="chip" style="background:#cfe0f5">⛨ ${T.atrincherada}</span>` : "") +
      (FWM.acciones.dormida(tr) ? `<span class="chip" style="background:#e3dcf5">💤 ${T.dormida}</span>` : "") +
      chipExperiencia(datos, tr);
    cab.appendChild(tit); cont.appendChild(cab);
    tit.querySelector(".btn-ayuda").addEventListener("click", () => App.abrirGlosario({ pestana: "tropas", id: tr.tipo }));
    if (!mio) { cont.appendChild(statsDe(App, tr)); return cont; }

    const estadoTxt = document.createElement("p"); estadoTxt.className = "estado-chips";
    if (tr.accionUsada) estadoTxt.innerHTML = `<span class="chip">${T.yaActuo}</span>`;
    else estadoTxt.innerHTML = `<span class="chip" style="background:#cfe8cf">${T.puedeActuar}</span> ` +
      (tr.movRestante > 0 ? `<span class="chip" style="background:#cfe8cf">${T.puedeMoverse.replace("{n}", pasos(datos, tr.movRestante) + " " + T.pasos)}</span>` : `<span class="chip">${T.sinMovimiento}</span>`);
    cont.appendChild(estadoTxt);

    const orden = App.ordenDe(tr.id);
    if (orden) {
      const po = document.createElement("p");
      po.innerHTML = `<span class="chip" style="background:#f5e6bf">➜ ${T.destino}: ${orden}</span> `;
      po.appendChild(App.boton(T.cancelarDestino, () => App.quitarOrden(tr.id), "btn btn-peq btn-claro"));
      cont.appendChild(po);
    }

    const pos = App.posibles;
    const acc = document.createElement("div"); acc.className = "acciones";
    const hx = tr.hex ? estado.mapa.hexes[tr.hex] : null;
    // Los botones se quedan visibles en gris con el motivo cuando no se puede (así no hay que adivinar).
    if (dt.puedeFundar && tr.hex) botonAccion(App, acc, `${T.fundarPueblo} (${FWM.util.textoCoste(datos.asentamientos.pueblo.coste, datos)})`, { tipo: "fundar", tropa: tr.id }, "btn btn-peq btn-primario", { coste: datos.asentamientos.pueblo.coste, hex: tr.hex }, `${T.fundarPueblo} · ${datos.asentamientos.pueblo.coste.oro} oro`);
    if (dt.puedeFundar && hx && hx.dueno === tr.dueno && !hx.construccion) { // solo los campesinos construyen
      for (const [id, def] of Object.entries(datos.asentamientos)) {
        if (def.comoSeConsigue !== "construir") continue;
        const coste = FWM.stats.costeAsentamiento(estado, datos, tr.dueno, id);
        botonAccion(App, acc, `${T.construirCastillo} (${FWM.util.textoCoste(coste, datos)})`, { tipo: "construir", hex: tr.hex, que: id }, "btn btn-peq btn-primario", { coste, requiere: def.requiere, hex: tr.hex }, `${T.castillo} · ${coste.oro} oro`);
      }
    }
    if (tr.hex) botonAccion(App, acc, `${T.atrincherar} (+${datos.reglas.atrincherar.defensa} ${T.defensa.toLowerCase()})`, { tipo: "atrincherar", tropa: tr.id }, "btn btn-peq btn-claro", null, T.atrincherar);
    const mejoras = dt.mejoraA || [];
    const filaMejora = (cont2, tipo) => {
      const c = FWM.acciones.costeMejora(dt, datos.tropas[tipo], estado, datos, tr.dueno, tr.tipo, tipo);
      const tipoAsent = tr.acuarteladaEn ? datos.asentamientos[estado.asentamientos[tr.acuarteladaEn].tipo].nombre.toLowerCase() : "";
      return botonAccion(App, cont2, `${T.mejorarA} ${datos.tropas[tipo].nombre.toLowerCase()} (${FWM.util.textoCoste(c, datos)})`, { tipo: "mejorarTropa", tropa: tr.id, que: tipo }, "btn btn-peq btn-claro", { coste: c, requiere: datos.tropas[tipo].requiere, hex: tr.acuarteladaEn, tipoAsent }, `${datos.tropas[tipo].nombre} · ${c.oro} oro`);
    };
    if (mejoras.length === 1) filaMejora(acc, mejoras[0]);
    else if (mejoras.length > 1) {
      // varias mejoras: una fila que se despliega, para no ocupar tres
      const b = document.createElement("button"); b.className = "fila-accion" + (window.innerWidth < 760 ? "" : " desplegable");
      b.innerHTML = `<span class="fa-nombre">${T.mejorarTropa}…${window.innerWidth < 760 ? "" : ` <small class="suave">(${mejoras.map(m => datos.tropas[m].nombre.toLowerCase()).join(", ")})</small>`}</span><span class="fa-motivo">▼</span>`;
      const sub = document.createElement("div"); sub.className = "acciones"; sub.hidden = true; sub.style.gridColumn = "1 / -1"; sub.style.margin = "0";
      for (const tipo of mejoras) filaMejora(sub, tipo);
      b.addEventListener("click", () => { sub.hidden = !sub.hidden; b.querySelector(".fa-motivo").textContent = sub.hidden ? "▼" : "▲"; });
      acc.appendChild(b); acc.appendChild(sub);
    }
    cont.appendChild(acc);

    cont.appendChild(statsDe(App, tr)); // stats y detalles debajo de las acciones: en el móvil lo importante queda arriba

    const pista = document.createElement("p"); pista.className = "pista";
    const nMover = Object.keys(pos.mover).length;
    if (tr.accionUsada) pista.textContent = "Esta tropa ya ha actuado este turno.";
    else if (nMover || pos.atacar.length || pos.asediar.length) pista.textContent = T.fichas.pistaMover;
    else if (tr.movRestante === 0) pista.textContent = "Sin movimiento. Puede fundar o atrincherarse si procede.";
    cont.appendChild(pista);
    if (tr.acuarteladaEn && st("alcance") === 0 && !tr.accionUsada) { const p2 = document.createElement("p"); p2.className = "pista"; p2.textContent = datos.reglas.salidaDesdeGuarnicion ? T.salida : T.errores.no_desde_dentro; cont.appendChild(p2); }
    return cont;
  }

  function panelHex(App, hex) {
    const { estado, datos } = App;
    const T = datos.textos;
    const h = estado.mapa.hexes[hex];
    const cont = document.createElement("div");
    const terr = datos.terrenos[h.terreno];
    const dueno = h.dueno != null ? estado.jugadores[h.dueno] : null;
    const mods = terr.modificadores || {};
    const efectos = [
      terr.costeMovimiento == null ? "intransitable" : "mover: " + pasos(datos, h.carretera ? Math.min(terr.costeMovimiento, datos.reglas.carretera.costeMovimiento) : terr.costeMovimiento) + " " + T.pasos + (h.carretera ? " (" + T.conCarretera + ")" : ""),
      mods.defensa ? "+" + mods.defensa + " " + T.defensa.toLowerCase() : "",
      mods.alcanceDistancia ? "+" + mods.alcanceDistancia + " " + T.alcance.toLowerCase() + " a distancia" : "",
    ].filter(Boolean).join(" · ");
    cont.innerHTML = `<h2>${terr.nombre}${h.carretera ? " · " + T.carretera : ""}</h2>
      <p>${dueno ? `<span class="chip" style="background:${FWM.lienzo.conAlpha(dueno.color, .35)}">${nombreReino(App, dueno, true)}</span>` : `<span class="chip">${T.nadie}</span>`}</p>
      <p class="suave">${efectos}</p>`;
    if (h.yacimiento) {
      const y = datos.yacimientos[h.yacimiento];
      const prod = h.dueno != null ? FWM.stats.produccionYacimiento(estado, datos, h.dueno, h.yacimiento) : y.produce;
      const z = h.dueno != null ? FWM.territorio.zonas(estado, h.dueno) : null;
      const conectado = z && (z.reino.has(hex) || z.aisladas.some(zz => zz.hexes.has(hex)));
      const ocupante = FWM.estado.tropaEn(estado, hex);
      const bloqueado = ocupante && h.dueno != null && ocupante.dueno !== h.dueno;
      if (y.puntos) cont.innerHTML += `<p><b>${y.nombre}</b>: ${T.puntoClaveVale.replace("{n}", y.puntos)}.</p>`;
      else cont.innerHTML += `<p><b>${y.nombre}</b>: ${T.produce.toLowerCase()} ${FWM.util.textoCoste(prod, datos)} ${T.porTurno}</p>` +
        (h.dueno != null && !conectado ? `<p class="error">${T.fichas.noProduce}</p>` : "") +
        (bloqueado ? `<p class="error">No produce: hay una tropa enemiga encima.</p>` : "");
    }
    const tr = FWM.estado.tropaEn(estado, hex);
    if (tr) {
      const dt = datos.tropas[tr.tipo]; const j = estado.jugadores[tr.dueno];
      const st = (n) => FWM.stats.statTropa(estado, datos, tr, n);
      const atr = tr.estados && tr.estados.includes("atrincherada");
      cont.innerHTML += `<h3>${dt.nombre} <span class="chip" style="background:${FWM.lienzo.conAlpha(j.color, .35)}">${nombreReino(App, j, true)}</span>${atr ? ` <span class="chip">⛨ ${T.atrincherada}</span>` : ""} ${chipExperiencia(datos, tr)}</h3>
        <div class="stats"><div>${T.vida}<b>${tr.vida}/${FWM.stats.vidaMax(estado, datos, tr)}</b></div><div>${T.ataque}<b>${FWM.stats.ataqueEfectivo(estado, datos, tr)}</b></div><div>${T.defensa}<b>${st("defensa")}</b></div></div>`;
    }
    if (h.dueno === App.humano && estado.jugadorActivo === App.humano && h.terreno !== "agua") {
      const acc = document.createElement("div"); acc.className = "acciones";
      // carretera a distancia: en cualquier hexágono tuyo transitable sin carretera ni construcción
      if (!estado.sinCarreteras && !h.carretera && !h.construccion && terr.costeMovimiento != null) {
        botonAccion(App, acc, `${T.construirCarretera} (${FWM.util.textoCoste(datos.reglas.carretera.coste, datos)})`, { tipo: "carretera", hex }, "btn btn-peq btn-claro", { coste: datos.reglas.carretera.coste, requiere: datos.reglas.carretera.requiere, hex });
      }
      for (const [id, def] of Object.entries(datos.asentamientos)) {
        if (def.comoSeConsigue !== "construir") continue;
        const coste = FWM.stats.costeAsentamiento(estado, datos, App.humano, id);
        botonAccion(App, acc, `${T.construirCastillo} (${FWM.util.textoCoste(coste, datos)})`, { tipo: "construir", hex, que: id }, "btn btn-peq btn-primario", { coste, requiere: def.requiere, hex });
      }
      cont.appendChild(acc);
    }
    return cont;
  }

  // Pestaña del reino: tesoro con desglose y resumen.
  function renderReino(App) {
    const { estado, datos } = App;
    const T = datos.textos;
    const j = estado.jugadores[App.humano];
    const res = FWM.economia.resumen(estado, datos, App.humano);
    const d = FWM.economia.desglose(estado, datos, App.humano);
    const cont = document.createElement("div"); cont.className = "reino";
    cont.innerHTML = `<h2>${nombreReino(App, j)}</h2>`;

    // --- tesoro ---
    const secT = document.createElement("section"); secT.className = "reino-sec";
    secT.innerHTML = `<h3>${T.tesoro}</h3>`;
    const tabla = document.createElement("table"); tabla.className = "tabla-reino";
    tabla.innerHTML = `<thead><tr><th class="izq">${T.recurso}</th><th>${T.hucha}</th><th>${T.entraPorTurno}</th><th>${T.salePorTurno}</th><th>${T.balance}</th></tr></thead>`;
    const cuerpo = document.createElement("tbody");
    const detalle = (l) => l.length ? l.map(f => f.veces > 1 ? `${f.cantidad} · ${f.veces} ${f.texto.toLowerCase()} ${T.cadaUno.replace("{n}", f.cantidad / f.veces)}` : `${f.cantidad} ${f.texto}`) : [];
    for (const id of Object.keys(datos.recursos).sort((a, b) => datos.recursos[a].orden - datos.recursos[b].orden)) {
      if (estado.soloOro && id !== "oro") continue;
      const ing = d.ingresos[id], gas = d.gastos[id];
      const sumaI = ing.reduce((s, f) => s + f.cantidad, 0), sumaG = gas.reduce((s, f) => s + f.cantidad, 0);
      const neto = sumaI - sumaG;
      const tr = document.createElement("tr");
      tr.innerHTML = `<td class="izq nombre"></td><td class="num grande">${j.hucha[id] || 0}</td>
        <td class="num"><b>+${sumaI}</b>${detalle(ing).map(x => `<div class="det">+${x}</div>`).join("")}</td>
        <td class="num"><b>−${sumaG}</b>${detalle(gas).map(x => `<div class="det">−${x}</div>`).join("")}</td>
        <td class="num ${neto < 0 ? "error" : neto > 0 ? "ok" : ""}"><b>${neto >= 0 ? "+" : ""}${neto}</b></td>`;
      const c0 = tr.querySelector(".nombre"); c0.appendChild(FWM.iconos.canvasIcono(datos.recursos[id].icono, 22)); c0.appendChild(document.createTextNode(" " + datos.recursos[id].nombre));
      cuerpo.appendChild(tr);
    }
    tabla.appendChild(cuerpo); const envT = document.createElement("div"); envT.className = "tabla-scroll"; envT.appendChild(tabla); secT.appendChild(envT);
    if (d.parados.length) secT.innerHTML += `<p class="pista"><b>${T.yacimientosParados}:</b> ${d.parados.map(p => `${p.nombre} (${p.motivo})`).join(", ")}</p>`;
    if (d.aisladas.length) {
      secT.innerHTML += `<p class="pista"><b>${T.zonasAisladas}:</b> ` + d.aisladas.map(z => {
        const a = estado.asentamientos[z.asentamientos[0]];
        return `${z.asentamientos.map(k => estado.asentamientos[k].nombre).join(", ")} · ${T.almacen.toLowerCase()}: ${FWM.util.textoCoste(a.huchaLocal || {}, datos)}`;
      }).join("; ") + `</p>`;
    }
    cont.appendChild(secT);

    // --- tarjetas: asentamientos, tropas, tecnologías ---
    const tarjetas = document.createElement("div"); tarjetas.className = "reino-tarjetas";
    const asents = FWM.estado.asentamientosDe(estado, App.humano);
    const tA = document.createElement("section"); tA.className = "reino-sec";
    tA.innerHTML = `<h3>${T.asentamientos} <span class="suave">· ${asents.length}</span></h3>`;
    const lA = document.createElement("div"); lA.className = "reino-lista";
    for (const { hex, a } of asents) {
      const fila = document.createElement("div"); fila.className = "reino-fila";
      fila.appendChild(FWM.iconos.canvasIcono(datos.asentamientos[a.tipo].icono, 26));
      const sp = document.createElement("span");
      const prodA = FWM.stats.produccionAsentamiento(estado, datos, a);
      sp.innerHTML = `<b>${a.nombre}</b>${j.capital === hex ? " ★" : ""} <span class="ok">+${prodA.oro || 0} oro</span><br><small class="suave">${datos.asentamientos[a.tipo].nombre} · ${T.guarnicion.toLowerCase()} ${a.guarnicion.length}/${FWM.stats.propAsentamiento(estado, datos, a, "huecosGuarnicion")} · ${T.murallas.toLowerCase()} ${a.integridad}/${FWM.stats.propAsentamiento(estado, datos, a, "integridad")}</small>`;
      fila.title = `${T.ingresos}: ${FWM.util.textoCoste(prodA, datos)} ${T.porTurno}`;
      fila.appendChild(sp);
      lA.appendChild(fila);
    }
    if (!asents.length) lA.innerHTML = `<p class="suave">${T.nada}</p>`;
    tA.appendChild(lA); tarjetas.appendChild(tA);

    const tropas = FWM.estado.tropasDe(estado, App.humano);
    const cuentaT = {}; for (const t of tropas) cuentaT[t.tipo] = (cuentaT[t.tipo] || 0) + 1;
    const tT = document.createElement("section"); tT.className = "reino-sec";
    tT.innerHTML = `<h3>${T.tropas} <span class="suave">· ${tropas.length} · ${T.mantenimiento.toLowerCase()} ${res.gasto} oro ${T.porTurno}</span></h3>`;
    const lT = document.createElement("div"); lT.className = "reino-lista";
    for (const k of Object.keys(cuentaT)) {
      const fila = document.createElement("div"); fila.className = "reino-fila";
      fila.appendChild(FWM.iconos.canvasTropa(datos.tropas[k].icono, j.color, 26));
      const sp = document.createElement("span");
      const gastoTipo = tropas.filter(t => t.tipo === k).reduce((s, t) => s + FWM.economia.mantenimientoDe(datos, t), 0);
      sp.innerHTML = `<b>${cuentaT[k]} × ${datos.tropas[k].nombre}</b> <span class="error">−${gastoTipo} oro</span>`;
      fila.title = `${T.mantenimiento} ${datos.tropas[k].mantenimiento} cada una; la mitad si está acuartelada`;
      fila.appendChild(sp);
      lT.appendChild(fila);
    }
    if (!tropas.length) lT.innerHTML = `<p class="suave">${T.nada}</p>`;
    tT.appendChild(lT); tarjetas.appendChild(tT);

    // puntos (para el límite de turnos)
    const tP = document.createElement("section"); tP.className = "reino-sec";
    const orden = estado.jugadores.filter(x => !x.eliminado).map(x => ({ j: x, p: FWM.victoria.puntos(estado, datos, x.id) })).sort((a, b) => b.p - a.p);
    tP.innerHTML = `<h3>${T.puntos}${estado.limiteTurnos ? ` <span class="suave">· ${T.turno.toLowerCase()} ${estado.turno}/${estado.limiteTurnos}</span>` : ""}</h3>`;
    // cada fila lleva el desglose en el tooltip y, al tocarla, desplegado debajo
    for (const x of orden) {
      const des = FWM.victoria.desglose(estado, datos, x.j.id);
      const fila = document.createElement("div"); fila.className = "reino-fila"; fila.style.cursor = "pointer";
      fila.title = des.map(d => d.texto + ": " + d.puntos).join("\n");
      fila.innerHTML = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${x.j.color}"></span><span><b>${x.p}</b> ${nombreReino(App, x.j)}${!x.j.humano && x.j.personalidad ? ` <small class="suave">${T.personalidades[x.j.personalidad] || ""}</small>` : ""}</span>`;
      const det = document.createElement("div"); det.className = "pista"; det.hidden = true; det.style.margin = "0 0 6px 18px";
      det.innerHTML = des.map(d => `${d.texto}: <b>${d.puntos}</b>`).join(" · ");
      fila.addEventListener("click", () => { det.hidden = !det.hidden; });
      tP.appendChild(fila); tP.appendChild(det);
    }
    tarjetas.appendChild(tP);
    if (estado.modoTec !== "todo") { // en Rápida todo está desbloqueado: no hay nada que enseñar
      const tC = document.createElement("section"); tC.className = "reino-sec";
      tC.innerHTML = `<h3>${T.tecnologias} <span class="suave">· ${j.tecnologias.length}/${Object.keys(datos.tecnologias).length} ${T.hechas}</span></h3>
        <p>${j.tecnologias.map(t => `<span class="chip">${datos.tecnologias[t].nombre}</span>`).join(" ") || `<span class="suave">${T.nada}</span>`}</p>
        ${j.investigando ? `<p>⏳ <b>${datos.tecnologias[j.investigando.id].nombre}</b> <span class="suave">${T.enCurso}, ${j.investigando.turnosRestantes} ${T.turnos}</span></p>` : ""}`;
      tarjetas.appendChild(tC);
    }
    cont.appendChild(tarjetas);
    // evolución de los puntos, a todo el ancho como el tesoro
    const svg = graficaLinea(estado, datos, p => p.puntos, T);
    if (svg) { const secG = document.createElement("section"); secG.className = "reino-sec"; secG.innerHTML = `<h3>${T.evolucionPuntos}</h3>` + svg; cont.appendChild(secG); }
    const fila = document.createElement("div"); fila.className = "modal-botones";
    fila.appendChild(App.boton(T.cerrar, () => App.cerrarModal(), "btn btn-claro"));
    cont.appendChild(fila);
    return cont;
  }

  // ms = 0: el aviso se queda hasta que el jugador toca algo.
  function aviso(texto, ms) {
    const a = document.getElementById("aviso");
    a.textContent = texto; a.hidden = false;
    clearTimeout(aviso._t);
    // se cierra con un toque de verdad (clic en botón o hexágono), no al arrastrar o pellizcar el mapa
    if (ms === 0) { const cerrar = () => { a.hidden = true; document.removeEventListener("click", cerrar, true); document.removeEventListener("fwm-toque", cerrar); }; setTimeout(() => { document.addEventListener("click", cerrar, true); document.addEventListener("fwm-toque", cerrar); }, 400); }
    else aviso._t = setTimeout(() => { a.hidden = true; }, ms || 2200);
  }

  return { pintarBotonMusica, renderBurbuja, posicionarBurbuja, renderRecluta, posicionarRecluta, renderBarra, renderPanel, renderRegistro, renderReino, textoEvento, aviso, nombreReino, motivo, botonAccion, graficaLinea };
})();
