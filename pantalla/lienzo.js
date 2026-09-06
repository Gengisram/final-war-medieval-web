// Dibujo del mapa en canvas.
window.FWM = window.FWM || {};

FWM.lienzo = (function () {
  const H = () => FWM.hex;
  const TAM_BASE = 30;

  function crear(canvas) {
    const ctx = canvas.getContext("2d");
    const L = { canvas, ctx, vista: { x: 0, y: 0, zoom: 1 }, ancho: 0, alto: 0, dpr: 1 };

    L.redimensionar = function () {
      const r = canvas.getBoundingClientRect();
      L.dpr = window.devicePixelRatio || 1;
      L.ancho = r.width; L.alto = r.height;
      canvas.width = Math.round(r.width * L.dpr); canvas.height = Math.round(r.height * L.dpr);
    };

    L.tam = () => TAM_BASE * L.vista.zoom;

    // pantalla -> hex
    L.hexEn = function (px, py) {
      const t = L.tam();
      return H().desdePixel(px - L.vista.x, py - L.vista.y, t);
    };
    L.centro = function (clave) {
      const p = H().aPixel(clave, L.tam());
      return { x: p.x + L.vista.x, y: p.y + L.vista.y };
    };

    // Encuadrar todo el mapa. En pantallas estrechas el mapa entero deja los hexágonos diminutos:
    // si viene `centro` (la capital), se acerca hasta un tamaño legible y se centra ahí (6 sep 2026).
    // 34 px en un móvil; en tablet crece con el ancho (hasta 48) para que el mapa no quede pequeño en medio de la pantalla
    const tamMinimo = () => Math.max(34, Math.min(48, L.ancho / 12));
    // Límites del mapa en píxeles a zoom 1, guardados para poder ceñir la cámara y limitar el alejar.
    L.limites = function (estado) {
      const claves = Object.keys(estado.mapa.hexes);
      if (L._lim && L._lim.n === claves.length && L._lim.mapa === estado.mapa.nombre) return L._lim;
      let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
      for (const k of claves) { const p = H().aPixel(k, TAM_BASE); minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x); miny = Math.min(miny, p.y); maxy = Math.max(maxy, p.y); }
      L._lim = { minx, maxx, miny, maxy, n: claves.length, mapa: estado.mapa.nombre };
      return L._lim;
    };
    // Zoom mínimo: el que hace que el mapa entero quepa en pantalla. Alejar más solo deja el mapa
    // diminuto en una esquina, que era el fallo que se veía en los mapas grandes (7 sep 2026).
    L.zoomMinimo = function () {
      const l = L._lim; if (!l || !L.ancho) return 0.35;
      const w = l.maxx - l.minx + TAM_BASE * 2, h = l.maxy - l.miny + TAM_BASE * 2;
      return Math.max(0.12, Math.min(1, Math.min(L.ancho / w, L.alto / h)));
    };
    // Ceñir la cámara al mapa: si cabe entero, centrado; si no, sin dejar hueco por los lados.
    L.cenir = function () {
      const l = L._lim; if (!l) return;
      const z = L.vista.zoom;
      const x0 = (l.minx - TAM_BASE) * z, x1 = (l.maxx + TAM_BASE) * z;
      const y0 = (l.miny - TAM_BASE) * z, y1 = (l.maxy + TAM_BASE) * z;
      if (x1 - x0 > L.ancho) L.vista.x = Math.max(L.ancho - x1, Math.min(-x0, L.vista.x)); else L.vista.x = (L.ancho - (x0 + x1)) / 2;
      if (y1 - y0 > L.alto) L.vista.y = Math.max(L.alto - y1, Math.min(-y0, L.vista.y)); else L.vista.y = (L.alto - (y0 + y1)) / 2;
    };

    L.encuadrar = function (estado, centro) {
      L.redimensionar();
      const lim = L.limites(estado);
      const { minx, maxx, miny, maxy } = lim;
      const w = maxx - minx + TAM_BASE * 2, h = maxy - miny + TAM_BASE * 2;
      const zoom = Math.max(0.35, Math.min(2.5, Math.min(L.ancho / w, L.alto / h)));
      L.vista.zoom = zoom;
      L.vista.x = (L.ancho - (minx + maxx) * zoom) / 2;
      L.vista.y = (L.alto - (miny + maxy) * zoom) / 2;
      if (centro && estado.mapa.hexes[centro] && TAM_BASE * zoom < tamMinimo()) {
        L.vista.zoom = Math.min(2.5, tamMinimo() / TAM_BASE); L.centrarEn(centro);
        // si la capital está en una esquina, no dejar media pantalla vacía
        L.cenir();
      }
    };

    // Centros de las burbujas de guarnición alrededor de un asentamiento (n tropas).
    L.posBurbujas = function (clave, n) {
      const c = L.centro(clave); const t = L.tam(); const out = [];
      for (let i = 0; i < n; i++) { const ang = -Math.PI / 2 + (i - (n - 1) / 2) * (Math.PI / 2.6); out.push({ x: c.x + Math.cos(ang) * t * 1.25, y: c.y + Math.sin(ang) * t * 1.25 }); }
      return out;
    };

    L.centrarEn = function (clave) {
      const p = H().aPixel(clave, L.tam());
      L.vista.x = L.ancho / 2 - p.x; L.vista.y = L.alto / 2 - p.y;
    };

    L.zoomEn = function (factor, px, py) {
      const antes = L.vista.zoom;
      const nuevo = Math.max(L.zoomMinimo(), Math.min(3, antes * factor));
      const f = nuevo / antes;
      L.vista.x = px - (px - L.vista.x) * f;
      L.vista.y = py - (py - L.vista.y) * f;
      L.vista.zoom = nuevo;
      L.cenir();
    };

    L.dibujar = function (estado, datos, vista) {
      vista_construirAbierto = vista.construirAbierto || null;
      const r = canvas.getBoundingClientRect();
      if (Math.abs(r.width - L.ancho) > 1 || Math.abs(r.height - L.alto) > 1) L.redimensionar();
      const t = L.tam();
      ctx.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
      ctx.clearRect(0, 0, L.ancho, L.alto);
      ctx.fillStyle = "#6f97b8"; ctx.fillRect(0, 0, L.ancho, L.alto);
      const sel = vista.sel || {}, pos = vista.posibles || { mover: {}, atacar: [], asediar: [] };
      const hexes = estado.mapa.hexes;
      const margen = t * 2;
      const visible = (c) => c.x > -margen && c.x < L.ancho + margen && c.y > -margen && c.y < L.alto + margen;

      // 1. terreno
      for (const [k, h] of Object.entries(hexes)) {
        const c = L.centro(k); if (!visible(c)) continue;
        const terr = datos.terrenos[h.terreno];
        trazarHex(c.x, c.y, t + 0.6);
        ctx.fillStyle = terr.color; ctx.fill();
        if (h.dueno != null) {
          ctx.fillStyle = conAlpha(estado.jugadores[h.dueno].color, 0.5); ctx.fill();
        }
        if (h.terreno !== "agua") { ctx.strokeStyle = "rgba(0,0,0,.12)"; ctx.lineWidth = 1; ctx.stroke(); }
        // relieve del terreno
        if (h.terreno === "colina") FWM.iconos.I.colina(ctx, c.x, c.y - t * .15, t * .55);
        else if (h.terreno === "montana") FWM.iconos.I.montana(ctx, c.x, c.y, t * .6);
        else if (h.terreno === "bosque") FWM.iconos.I.bosqueTerreno(ctx, c.x, c.y + t * .05, t * .45);
      }
      // 1b. carreteras: un camino entre cada hexágono con carretera y sus vecinos con carretera o asentamiento
      ctx.lineCap = "round";
      for (const [k, h] of Object.entries(hexes)) {
        if (!h.carretera && h.construccion !== "asentamiento") continue;
        const c = L.centro(k); if (!visible(c)) continue;
        let alguno = false;
        for (const v of H().vecinos(k)) {
          const hv = hexes[v]; if (!hv || !(hv.carretera || hv.construccion === "asentamiento")) continue;
          if (!h.carretera && !hv.carretera) continue; // entre dos asentamientos sin carretera no hay camino
          const cv = L.centro(v);
          const mx = (c.x + cv.x) / 2, my = (c.y + cv.y) / 2;
          ctx.strokeStyle = "#8a6a3a"; ctx.lineWidth = Math.max(3, t * .22); ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(mx, my); ctx.stroke();
          ctx.strokeStyle = "#f0e2c0"; ctx.lineWidth = Math.max(1, t * .05); ctx.setLineDash([t * .18, t * .14]); ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(mx, my); ctx.stroke(); ctx.setLineDash([]);
          alguno = true;
        }
        if (h.carretera && !alguno) { ctx.fillStyle = "#8a6a3a"; ctx.beginPath(); ctx.arc(c.x, c.y, t * .14, 0, Math.PI * 2); ctx.fill(); }
      }
      // 2. bordes de territorio
      ctx.lineWidth = Math.max(2, t * .12);
      for (const [k, h] of Object.entries(hexes)) {
        if (h.dueno == null) continue;
        const c = L.centro(k); if (!visible(c)) continue;
        const esq = H().esquinas(c.x, c.y, t);
        const vec = H().vecinos(k);
        ctx.strokeStyle = estado.jugadores[h.dueno].color;
        ctx.beginPath();
        // vecino i está entre esquina i y i+1 (orientación punta arriba, vecinos en orden [1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1])
        const orden = [0, 5, 4, 3, 2, 1];
        for (let i = 0; i < 6; i++) {
          const v = hexes[vec[i]];
          if (v && v.dueno === h.dueno) continue;
          const a = esq[orden[i]], b = esq[(orden[i] + 1) % 6];
          ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
        }
        ctx.stroke();
      }
      // 3. resaltados
      for (const k of Object.keys(pos.mover)) {
        const c = L.centro(k); trazarHex(c.x, c.y, t * .92); ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 2; ctx.stroke();
      }
      for (const k of pos.asediar) {
        const c = L.centro(k); trazarHex(c.x, c.y, t * .92); ctx.strokeStyle = "#ff9800"; ctx.lineWidth = 3; ctx.stroke();
      }
      for (const k of pos.atacar) {
        const c = L.centro(k); trazarHex(c.x, c.y, t * .92); ctx.strokeStyle = "#e53935"; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = "rgba(229,57,53,.18)"; ctx.fill();
      }
      // selección: perímetro exterior (por fuera del borde del reino) que parpadea; no tapa el color del territorio
      if (sel.hex) {
        const c = L.centro(sel.hex); const on = vista.parpadeo !== false;
        trazarHex(c.x, c.y, t * 1.12); ctx.strokeStyle = on ? "#ffeb3b" : "rgba(255,235,59,.35)"; ctx.lineWidth = on ? 4 : 3; ctx.stroke();
        ctx.strokeStyle = "rgba(0,0,0,.4)"; ctx.lineWidth = 1; trazarHex(c.x, c.y, t * 1.16); ctx.stroke();
      }

      // 4. yacimientos y asentamientos
      for (const [k, h] of Object.entries(hexes)) {
        const c = L.centro(k); if (!visible(c)) continue;
        if (h.yacimiento) {
          // insignia del recurso en la esquina superior izquierda; la esquina derecha queda para construcciones
          const ic = datos.yacimientos[h.yacimiento].icono;
          ctx.fillStyle = "rgba(255,255,255,.88)"; ctx.beginPath(); ctx.arc(c.x - t * .5, c.y - t * .45, t * .3, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 1; ctx.stroke();
          (FWM.iconos.I[ic] || FWM.iconos.I.oro)(ctx, c.x - t * .5, c.y - t * .45, t * .2);
        }
        if (h.construccion === "asentamiento") {
          const a = estado.asentamientos[k];
          dibujarAsentamiento(ctx, c, t, a, estado, datos, vista);
        }
      }
      // 5. tropas (con su animación en curso, si la hay)
      const ahora = performance.now();
      const anim = vista.anim || { tropas: {}, fantasmas: [], proyectiles: [] };
      for (const tr of Object.values(estado.tropas)) {
        if (!tr.hex) continue;
        const c = L.centro(tr.hex); if (!visible(c)) continue;
        const an = animTropa(anim.tropas[tr.id], c, t, ahora);
        ctx.save(); ctx.translate(an.x, an.y);
        dibujarTropa(ctx, { x: 0, y: 0 }, t, tr, estado, datos, sel.tropa === tr.id, vista.humano);
        if (an.tinte > 0) { ctx.beginPath(); ctx.arc(0, 0, t * .55, 0, Math.PI * 2); ctx.fillStyle = "rgba(229,57,53," + an.tinte + ")"; ctx.fill(); }
        ctx.restore();
      }
      // 5a. fantasmas: tropas que acaban de morir se encogen y desaparecen
      for (const f of anim.fantasmas) {
        const p = (ahora - f.t0) / f.dur; if (p < 0 || p > 1) continue;
        const c = L.centro(f.hex); const s = t * .5;
        ctx.save(); ctx.translate(c.x, c.y - s * .05); ctx.globalAlpha = 1 - p; ctx.scale(1 - p * .7, 1 - p * .7); ctx.rotate(p * .6);
        (FWM.figuras[f.tipo] || FWM.figuras.campesino)(ctx, 0, 0, s, { color: f.color, enemigo: f.enemigo, heroe: f.heroe });
        ctx.restore();
      }
      // 5a'. proyectiles: flecha recta, piedra en arco
      for (const pr of anim.proyectiles) {
        const p = (ahora - pr.t0) / pr.dur; if (p < 0 || p > 1) continue;
        const a = L.centro(pr.desde), b = L.centro(pr.hasta);
        const x = a.x + (b.x - a.x) * p, y = a.y + (b.y - a.y) * p - Math.sin(Math.PI * p) * t * (pr.tipo === "piedra" ? 1.2 : .25);
        if (pr.tipo === "piedra") { ctx.beginPath(); ctx.arc(x, y, t * .16, 0, Math.PI * 2); ctx.fillStyle = "#6f6b64"; ctx.fill(); ctx.strokeStyle = "#2a2419"; ctx.lineWidth = 1.5; ctx.stroke(); }
        else { const ang = Math.atan2(b.y - a.y, b.x - a.x); ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.strokeStyle = "#2a2419"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-t * .3, 0); ctx.lineTo(t * .2, 0); ctx.stroke(); ctx.fillStyle = "#c9cdd3"; ctx.beginPath(); ctx.moveTo(t * .3, 0); ctx.lineTo(t * .15, -t * .07); ctx.lineTo(t * .15, t * .07); ctx.closePath(); ctx.fill(); ctx.restore(); }
      }
      // 5b. destinos automáticos
      for (const [id, destino] of Object.entries(estado.ordenes || {})) {
        const tr = estado.tropas[id]; if (!tr || !estado.mapa.hexes[destino]) continue;
        const a = L.centro(FWM.estado.posicionTropa(estado, tr)), b = L.centro(destino);
        ctx.setLineDash([4, 4]); ctx.strokeStyle = sel.tropa === id ? "#ffeb3b" : "rgba(255,255,255,.7)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = estado.jugadores[tr.dueno].color; ctx.beginPath(); ctx.arc(b.x, b.y, t * .18, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
      }
      if (vista.modo === "destino" && sel.tropa) {
        ctx.fillStyle = "rgba(255,235,59,.12)"; ctx.fillRect(0, 0, L.ancho, L.alto);
      }
      // 5c. efectos: texto que sube y se desvanece (ascensos, daño)
      for (const ef of vista.efectos || []) {
        const c = L.centro(ef.hex); const p = Math.min(1, (ahora - ef.t0) / ef.dur); if (p < 0) continue;
        const y = c.y - t * .9 - p * t * .9;
        ctx.globalAlpha = p < .7 ? 1 : 1 - (p - .7) / .3;
        // destello dorado alrededor de la figura al principio
        if (p < .5) { ctx.beginPath(); ctx.arc(c.x, c.y, t * (.5 + p * .5), 0, Math.PI * 2); ctx.strokeStyle = ef.color || "#f0c75e"; ctx.lineWidth = 3 * (1 - p * 2); ctx.stroke(); }
        ctx.font = "bold " + Math.round(t * .38) + "px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,.75)"; ctx.strokeText(ef.texto, c.x, y);
        ctx.fillStyle = ef.color || "#fff"; ctx.fillText(ef.texto, c.x, y);
        ctx.globalAlpha = 1;
      }
      // 5d. burbujas de guarnición: una por tropa, alrededor del asentamiento
      if (vista.burbujas && estado.asentamientos[vista.burbujas.hex]) {
        const pos = L.posBurbujas(vista.burbujas.hex, vista.burbujas.ids.length);
        vista.burbujas.ids.forEach((id, i) => {
          const tr = estado.tropas[id]; if (!tr) return;
          const p = pos[i]; const col = estado.jugadores[tr.dueno].color;
          ctx.beginPath(); ctx.arc(p.x, p.y, t * .45, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,.95)"; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
          (FWM.figuras[tr.tipo] || FWM.figuras.campesino)(ctx, p.x, p.y - t * .04, t * .28, { color: col, enemigo: false, heroe: estado.jugadores[tr.dueno].heroe });
          const max = FWM.stats.vidaMax(estado, datos, tr); const w = t * .5, hgt = Math.max(3, t * .07);
          ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(p.x - w / 2, p.y + t * .3, w, hgt);
          ctx.fillStyle = tr.vida / max > .5 ? "#43a047" : tr.vida / max > .25 ? "#fb8c00" : "#e53935"; ctx.fillRect(p.x - w / 2, p.y + t * .3, w * tr.vida / max, hgt);
          if (tr.dueno === vista.humano) { ctx.beginPath(); ctx.arc(p.x - t * .32, p.y - t * .32, Math.max(3, t * .08), 0, Math.PI * 2); ctx.fillStyle = tr.accionUsada ? "#e53935" : "#43a047"; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke(); }
        });
      }
      // 5e. resaltado del tutorial: aro dorado que late
      if (vista.destacar && hexes[vista.destacar]) {
        const c = L.centro(vista.destacar); const lat = 1 + Math.sin(performance.now() / 250) * .06;
        trazarHex(c.x, c.y, t * 1.08 * lat); ctx.strokeStyle = "#f0c75e"; ctx.lineWidth = 4; ctx.setLineDash([8, 6]); ctx.stroke(); ctx.setLineDash([]);
      }
      // 6. marcas de objetivo
      for (const k of pos.atacar) { const c = L.centro(k); FWM.iconos.I.espada(ctx, c.x + t * .55, c.y - t * .55, t * .28, "#fff"); }
      for (const k of pos.asediar) { const c = L.centro(k); if (pos.atacar.includes(k)) continue; FWM.iconos.I.catapulta(ctx, c.x + t * .55, c.y - t * .55, t * .22, "#ff9800"); }
    };

    // Desplazamiento, escala y tinte de una tropa según sus animaciones en curso.
    function animTropa(tweens, c, t, ahora) {
      const r = { x: c.x, y: c.y, tinte: 0 };
      if (!tweens) return r;
      const suave = (p) => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      for (const tw of tweens) {
        let p = (ahora - tw.t0) / tw.dur; if (p > 1) continue;
        if (p < 0) { if (tw.tipo === "mover") p = 0; else continue; } // un "mover" futuro mantiene la figura en el origen
        if (tw.tipo === "mover") { const a = L.centro(tw.desde), b = L.centro(tw.hasta); const q = 1 - suave(p); r.x += (a.x - b.x) * q; r.y += (a.y - b.y) * q; }
        else if (tw.tipo === "embestir") { const a = L.centro(tw.desde), b = L.centro(tw.hasta); const q = Math.sin(Math.PI * p) * .45; r.x += (b.x - a.x) * q; r.y += (b.y - a.y) * q; }
        else if (tw.tipo === "temblar") { r.x += Math.sin(p * 40) * t * .09 * (1 - p); r.tinte = .55 * (1 - p); }
      }
      return r;
    }

    function trazarHex(x, y, r) {
      const e = H().esquinas(x, y, r);
      ctx.beginPath(); ctx.moveTo(e[0][0], e[0][1]);
      for (let i = 1; i < 6; i++) ctx.lineTo(e[i][0], e[i][1]);
      ctx.closePath();
    }

    function dibujarAsentamiento(ctx, c, t, a, estado, datos, vista) {
      const col = estado.jugadores[a.dueno].color;
      // anillo de integridad (las murallas)
      const max = FWM.stats.propAsentamiento(estado, datos, a, "integridad");
      const frac = max ? a.integridad / max : 0;
      ctx.beginPath(); ctx.arc(c.x, c.y, t * .78, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.fill();
      ctx.lineWidth = Math.max(2, t * .1);
      ctx.strokeStyle = "rgba(0,0,0,.15)"; ctx.beginPath(); ctx.arc(c.x, c.y, t * .78, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = frac > 0 ? "#6d5a3c" : "#e53935";
      ctx.beginPath(); ctx.arc(c.x, c.y, t * .78, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(frac, 0.02)); ctx.stroke();
      const selT = vista.sel && vista.sel.tropa ? estado.tropas[vista.sel.tropa] : null;
      const claveA0 = Object.keys(estado.asentamientos).find(k => estado.asentamientos[k] === a);
      if (selT && selT.acuarteladaEn === claveA0) {
        // tropa de la guarnición seleccionada: se asoma dentro del asentamiento, lista para salir
        ctx.beginPath(); ctx.arc(c.x, c.y, t * .6, 0, Math.PI * 2); ctx.strokeStyle = "#ffeb3b"; ctx.lineWidth = 3; ctx.stroke();
        (FWM.figuras[selT.tipo] || FWM.figuras.campesino)(ctx, c.x, c.y - t * .05, t * .36, { color: col, enemigo: false, heroe: estado.jugadores[selT.dueno].heroe });
      } else {
        FWM.figuras[a.tipo === "castillo" ? "castillo" : a.tipo === "ciudad" ? "ciudad" : "pueblo"](ctx, c.x, c.y - t * .1, t * .34);
      }
      // capital
      const claveA = Object.keys(estado.asentamientos).find(k => estado.asentamientos[k] === a);
      const esCapital = estado.jugadores[a.dueno].capital === claveA;
      // estrella de capital arriba, centrada (la esquina izquierda es de la insignia del yacimiento)
      if (esCapital) { FWM.iconos.I.estrella(ctx, c.x, c.y - t * .82, t * .3, "#2a2419"); FWM.iconos.I.estrella(ctx, c.x, c.y - t * .82, t * .24, "#f0c75e"); }
      // mejora a ciudad: flecha arriba a la derecha en los asentamientos propios que pueden crecer
      const defA = datos.asentamientos[a.tipo];
      if (defA.mejoraA && vista.humano != null && a.dueno === vista.humano) {
        const puede = !FWM.acciones.acciones.mejorarAsentamiento.validar(estado, datos, { asentamiento: claveA }) && estado.jugadorActivo === vista.humano;
        const fx = c.x + t * .58, fy = c.y - t * .6, r = t * .26;
        ctx.globalAlpha = puede ? 1 : .35;
        ctx.fillStyle = "#2f6fd6"; ctx.beginPath(); ctx.arc(fx, fy, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(1.5, t * .06); ctx.stroke();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(2, t * .09); ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.beginPath(); ctx.moveTo(fx, fy + r * .5); ctx.lineTo(fx, fy - r * .5); ctx.moveTo(fx - r * .45, fy - r * .05); ctx.lineTo(fx, fy - r * .5); ctx.lineTo(fx + r * .45, fy - r * .05); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // reclutar: insignia abajo a la izquierda, espejo de la guarnición, con dos martillos cruzados
      if (vista.humano != null && a.dueno === vista.humano) {
        const puede = !a.reclutadoEsteTurno && estado.jugadorActivo === vista.humano;
        const rx = c.x - t * .6, ry = c.y + t * .55; const abierto = vista.reclutaAbierto === claveA;
        ctx.globalAlpha = puede ? 1 : .4;
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(rx, ry, t * (abierto ? .38 : .3), 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = abierto ? "#ffeb3b" : "#fff"; ctx.lineWidth = Math.max(1.5, t * .06); ctx.stroke();
        // martillos cruzados
        ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(2, t * .07); ctx.lineCap = "round";
        for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(rx - d * t * .14, ry + t * .15); ctx.lineTo(rx + d * t * .13, ry - t * .12); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.save(); ctx.translate(rx + d * t * .13, ry - t * .13); ctx.rotate(d * Math.PI / 4); ctx.fillRect(-t * .1, -t * .05, t * .2, t * .1); ctx.restore(); }
        ctx.globalAlpha = 1;
      }
      // guarnición: número y mini barras de vida
      const n = a.guarnicion.length, max2 = FWM.stats.propAsentamiento(estado, datos, a, "huecosGuarnicion");
      const encima = vista.encima === claveA && n > 0; // ratón encima: se agranda
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(c.x + t * .6, c.y + t * .55, t * (encima ? .38 : .3), 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = encima ? "#ffeb3b" : "#fff"; ctx.lineWidth = Math.max(1.5, t * .06); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "bold " + Math.round(t * .32) + "px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(n + "/" + max2, c.x + t * .6, c.y + t * .56);
      if (n === 0) { ctx.strokeStyle = "#e53935"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c.x + t * .6, c.y + t * .55, t * .3, 0, Math.PI * 2); ctx.stroke(); }
      if (n > 0) {
        // barras de vida dentro del círculo blanco, bajo el icono, con contorno oscuro
        const w = t * .7, hgt = Math.max(3, t * .08);
        a.guarnicion.forEach((id, i) => {
          const g = estado.tropas[id]; if (!g) return;
          const vmax = FWM.stats.vidaMax(estado, datos, g);
          const y = c.y + t * .42 + i * (hgt + 2);
          ctx.fillStyle = "#fff"; ctx.fillRect(c.x - w / 2 - 1, y - 1, w + 2, hgt + 2);
          ctx.fillStyle = "#3a322a"; ctx.fillRect(c.x - w / 2, y, w, hgt);
          ctx.fillStyle = g.vida / vmax > .5 ? "#43a047" : g.vida / vmax > .25 ? "#fb8c00" : "#e53935";
          ctx.fillRect(c.x - w / 2, y, w * Math.max(0, g.vida / vmax), hgt);
        });
      }
      // murallas en texto
      if (t >= 22 && (a.integridad < max || vista.sel.hex === claveA)) {
        ctx.font = "bold " + Math.round(t * .26) + "px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = a.integridad > 0 ? "#fff" : "#ffb3b3"; ctx.strokeStyle = "rgba(0,0,0,.7)"; ctx.lineWidth = 3;
        const txt = "⌂ " + a.integridad + "/" + max;
        const ty = c.y - t * .78 + (esCapital ? t * .32 : 0);
        ctx.strokeText(txt, c.x - t * .55, ty); ctx.fillText(txt, c.x - t * .55, ty);
      }
      // nombre
      if (t >= 22) {
        ctx.font = Math.round(t * .3) + "px sans-serif"; ctx.fillStyle = "#fff"; ctx.strokeStyle = "rgba(0,0,0,.7)"; ctx.lineWidth = 3; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        const nombre = a.nombre + (esCapital && a.dueno === vista.humano ? " " + (datos.textos.tuSufijo || "") : "");
        const y = c.y + t * 1.05;
        ctx.strokeText(nombre, c.x, y); ctx.fillText(nombre, c.x, y);
      }
    }

    let vista_construirAbierto = null;
    // Insignias de una tropa (columna a su derecha): [{ id, x, y, r, apagada }]. Las usa el dibujo y el toque.
    L.insigniasTropa = function (tr, estado, datos) {
      if (!tr || !tr.hex && !tr.acuarteladaEn) return [];
      const c = L.centro(FWM.estado.posicionTropa(estado, tr)); const t = L.tam(); const r = t * .42; const rb = Math.max(r * .47, 11); // nunca por debajo de 11 px: con el mapa alejado seguían siendo tocables (6 sep 2026)
      const lista = [];
      const def = datos.tropas[tr.tipo];
      if (tr.hex) lista.push({ id: "atrincherar", apagada: !!(tr.accionUsada || (tr.estados && tr.estados.includes("atrincherada"))) });
      if (def.puedeFundar && tr.hex) lista.push({ id: "construir", apagada: !!tr.accionUsada });
      lista.push({ id: "info", apagada: false });
      const paso = Math.max(r * 1.04, rb * 2.3); const y0 = c.y - paso * (lista.length - 1) / 2 + r * .1; // pueden asomar por arriba y por abajo de la figura
      lista.forEach((ins, i) => { ins.x = c.x + Math.max(r * 1.15, rb * 1.6); ins.y = y0 + i * paso; ins.r = rb; });
      // la X (licenciar) va sola a la izquierda, abajo, a la altura de la i: fuera del camino
      if (!def.heroe) lista.push({ id: "licenciar", apagada: false, x: c.x - Math.max(r * 1.15, rb * 1.6), y: lista[lista.length - 1].y, r: rb });
      return lista;
    };
    const vista_humanoActivo = (estado, humano) => estado.jugadorActivo === humano;
    function dibujarTropa(ctx, c, t, tr, estado, datos, seleccionada, humano) {
      const col = estado.jugadores[tr.dueno].color;
      const r = t * .42;           // radio de referencia (barras, galones)
      const s = t * .5;            // tamaño de la figura: ocupa el hexágono de arriba abajo
      const F = FWM.figuras;
      const cy = c.y - s * .05;
      // sin peana en el mapa: el color va en la túnica; la selección se ve en el borde del hexágono
      (F[tr.tipo] || F.campesino)(ctx, c.x, cy, s, { color: col, enemigo: humano != null && tr.dueno !== humano, heroe: estado.jugadores[tr.dueno].heroe });
      // punto de estado en tus tropas: verde = puede actuar, rojo = ya ha actuado
      if (tr.dueno === humano) {
        ctx.beginPath(); ctx.arc(c.x - r * 1.0, c.y - r * 1.0, Math.max(3.5, r * .2), 0, Math.PI * 2);
        ctx.fillStyle = tr.accionUsada ? "#e53935" : "#43a047"; ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(1.5, r * .07); ctx.stroke();
      }
      // insignias de la tropa seleccionada (tuya, en tu turno): escudo (atrincherar), martillos (construir, campesinos), X (licenciar), i (detalle)
      if (seleccionada && tr.dueno === humano && vista_humanoActivo(estado, humano)) {
        // la tropa se dibuja con el contexto trasladado a su centro: las insignias vienen en coordenadas del mapa
        const cAbs = L.centro(FWM.estado.posicionTropa(estado, tr));
        for (const ins0 of L.insigniasTropa(tr, estado, datos)) {
          const ins = Object.assign({}, ins0, { x: c.x + (ins0.x - cAbs.x), y: c.y + (ins0.y - cAbs.y) });
          const abierto = ins.id === "construir" && vista_construirAbierto === tr.id;
          const rb = ins.r * (abierto ? 1.2 : 1);
          ctx.globalAlpha = ins.apagada ? .4 : 1;
          ctx.fillStyle = ins.id === "licenciar" ? "#c62828" : ins.id === "info" ? "#f2e3c2" : col;
          ctx.beginPath(); ctx.arc(ins.x, ins.y, rb, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = abierto ? "#ffeb3b" : (ins.id === "info" ? "#2a2419" : "#fff"); ctx.lineWidth = Math.max(1.5, r * .08); ctx.stroke();
          ctx.lineCap = "round"; ctx.lineJoin = "round";
          if (ins.id === "atrincherar") { ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(1.5, r * .08); ctx.beginPath(); ctx.moveTo(ins.x - rb * .5, ins.y - rb * .45); ctx.lineTo(ins.x + rb * .5, ins.y - rb * .45); ctx.lineTo(ins.x + rb * .5, ins.y + rb * .05); ctx.quadraticCurveTo(ins.x + rb * .5, ins.y + rb * .45, ins.x, ins.y + rb * .6); ctx.quadraticCurveTo(ins.x - rb * .5, ins.y + rb * .45, ins.x - rb * .5, ins.y + rb * .05); ctx.closePath(); ctx.fillStyle = "#fff"; ctx.fill(); }
          else if (ins.id === "construir") { ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(1.5, r * .09); for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(ins.x - d * rb * .5, ins.y + rb * .5); ctx.lineTo(ins.x + d * rb * .45, ins.y - rb * .4); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.save(); ctx.translate(ins.x + d * rb * .45, ins.y - rb * .45); ctx.rotate(d * Math.PI / 4); ctx.fillRect(-rb * .32, -rb * .16, rb * .64, rb * .32); ctx.restore(); } }
          else if (ins.id === "licenciar") { ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(2, r * .12); ctx.beginPath(); ctx.moveTo(ins.x - rb * .45, ins.y - rb * .45); ctx.lineTo(ins.x + rb * .45, ins.y + rb * .45); ctx.moveTo(ins.x + rb * .45, ins.y - rb * .45); ctx.lineTo(ins.x - rb * .45, ins.y + rb * .45); ctx.stroke(); }
          else if (ins.id === "info") { ctx.fillStyle = "#2a2419"; ctx.font = "bold italic " + Math.round(rb * 1.4) + "px Georgia, serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("i", ins.x, ins.y + rb * .05); }
          ctx.globalAlpha = 1;
        }
      }
      // galones de experiencia: chevrones dorados apilados en el lateral derecho
      const nivel = FWM.stats.nivelExperiencia(datos, tr);
      if (nivel > 0) {
        const gx = c.x + r * 1.05, gw = r * .3, gh = r * .18, paso = r * .26;
        const gy0 = c.y + r * .2 - (nivel - 1) * paso / 2;
        ctx.lineJoin = "round"; ctx.lineCap = "round";
        for (let i = 0; i < nivel; i++) {
          const gy = gy0 + i * paso;
          for (const [col, ancho] of [["#2a2419", Math.max(3, r * .22)], ["#f0c75e", Math.max(1.5, r * .1)]]) {
            ctx.strokeStyle = col; ctx.lineWidth = ancho;
            ctx.beginPath(); ctx.moveTo(gx - gw / 2, gy + gh / 2); ctx.lineTo(gx, gy - gh / 2); ctx.lineTo(gx + gw / 2, gy + gh / 2); ctx.stroke();
          }
        }
      }
      if (tr.estados && tr.estados.includes("atrincherada")) {
        // escudo pequeño arriba a la derecha
        ctx.fillStyle = "#fff"; ctx.strokeStyle = "#333"; ctx.lineWidth = 1.5;
        const sx = c.x + r * 1.0, sy = c.y - r * 1.0, s = r * .38;
        ctx.beginPath(); ctx.moveTo(sx - s, sy - s); ctx.lineTo(sx + s, sy - s); ctx.lineTo(sx + s, sy + s * .2); ctx.lineTo(sx, sy + s); ctx.lineTo(sx - s, sy + s * .2); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      // vida
      const max = FWM.stats.vidaMax(estado, datos, tr);
      const w = r * 1.6, hgt = Math.max(3, t * .1);
      const by = c.y + r * 1.25;
      ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(c.x - w / 2 - 1, by - 1, w + 2, hgt + 2);
      ctx.fillStyle = tr.vida / max > .5 ? "#43a047" : tr.vida / max > .25 ? "#fb8c00" : "#e53935";
      ctx.fillRect(c.x - w / 2, by, w * Math.max(0, tr.vida / max), hgt);
    }

    return L;
  }

  function conAlpha(hex, a) {
    if (!hex || hex[0] !== "#") return "rgba(120,120,120," + a + ")"; // reino sin color (partida vieja): gris, pero nunca romper el dibujo
    const n = parseInt(hex.slice(1), 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  return { crear, conAlpha };
})();
