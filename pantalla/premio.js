// Premio del día (7 oct 2026, aviso 37 y Rodrigo): entrar cada día tiene premio. Al entrar sale un cartel con los diez
// días de la racha; el de hoy brilla, se pulsa "Reclamar", saltan estrellas y el oro sube. Diez de oro los días normales,
// cincuenta el día 5 y un objeto el día 10. Si fallas un día, la cuenta vuelve al día 1 (la racha es de DÍAS DE ENTRAR,
// no de jugar, que es la de "Racha: n días" del inicio). Tras el día 10 se empieza otra vuelta.
window.FWM = window.FWM || {};

FWM.premio = (function () {
  const PREMIOS = [10, 10, 15, 20, 50, 20, 25, 30, 40, "objeto"];
  const T = () => App.datos.textos.premio;
  const hoyStr = () => new Date().toISOString().slice(0, 10);
  function diaAnterior(s) { const d = new Date(s + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); }
  let abierto = false;

  // { dia: 1..10, racha, reclamado } según lo guardado en ajustes.premio = { racha, ultimo }
  function estado() {
    const p = (FWM.guardado.ajustes().premio) || { racha: 0, ultimo: null }; const hoy = hoyStr();
    if (p.ultimo === hoy) return { dia: ((p.racha - 1) % 10) + 1, racha: p.racha, reclamado: true };
    const racha = p.ultimo === diaAnterior(hoy) ? p.racha : 0;
    return { dia: (racha % 10) + 1, racha, reclamado: false };
  }
  function pendiente() { return !abierto && (FWM.guardado.records().partidas || 0) > 0 && !estado().reclamado; }

  // qué toca: { oro } o { objeto }
  function premioDe(dia) { const p = PREMIOS[dia - 1]; return p === "objeto" ? { objeto: true } : { oro: p }; }
  function elegirObjeto() {
    const O = FWM.datosBase.objetos; const H = FWM.heroe;
    const pool = (rareza) => Object.keys(O).filter(id => O[id].tienda && O[id].rareza === rareza && O[id].tipo !== "consumible" && !H.tieneObjeto(id));
    const ids = pool("raro").length ? pool("raro") : pool("poco_comun").length ? pool("poco_comun") : pool("comun");
    return ids.length ? ids[Math.floor(Math.random() * ids.length)] : null;
  }
  // entrega y apunta el día; devuelve { oro } o { objeto: id } (si no queda objeto que dar, 100 de oro)
  function reclamar() {
    const e = estado(); if (e.reclamado) return null;
    const p = premioDe(e.dia); let dado;
    if (p.objeto) { const id = elegirObjeto(); if (id) { FWM.heroe.darObjeto(id); dado = { objeto: id }; } else { FWM.heroe.darOro(100); dado = { oro: 100 }; } }
    else { FWM.heroe.darOro(p.oro); dado = { oro: p.oro }; }
    FWM.guardado.guardarAjustes({ premio: { racha: e.racha + 1, ultimo: hoyStr() } });
    try { FWM.nube.evento("premioDia", { dia: e.dia }); } catch (x) { /* sin nube */ }
    return dado;
  }

  // ---- dibujos: montón de monedas y cofre ----
  function lienzo(tam) { const c = document.createElement("canvas"); const dpr = window.devicePixelRatio || 1; c.width = tam * dpr; c.height = tam * dpr; c.style.width = c.style.height = tam + "px"; const ctx = c.getContext("2d"); ctx.scale(dpr, dpr); return [c, ctx]; }
  function moneda(ctx, x, y, r) {
    ctx.lineWidth = Math.max(1.5, r * .18); ctx.strokeStyle = "#5a3a08";
    ctx.beginPath(); ctx.ellipse(x, y + r * .35, r, r * .42, 0, 0, Math.PI * 2); ctx.fillStyle = "#c48a12"; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y, r, r * .42, 0, 0, Math.PI * 2); ctx.fillStyle = "#f2c53d"; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y, r * .55, r * .22, 0, 0, Math.PI * 2); ctx.strokeStyle = "#d9a21b"; ctx.lineWidth = Math.max(1, r * .1); ctx.stroke();
  }
  function canvasMonedas(tam, cuantas) {
    const [c, ctx] = lienzo(tam); const r = tam * .22; const cx = tam / 2, base = tam * .68;
    if (cuantas <= 1) moneda(ctx, cx, base - r * .3, r);
    else if (cuantas === 2) { moneda(ctx, cx - r * .5, base, r); moneda(ctx, cx + r * .5, base - r * .55, r); }
    else { moneda(ctx, cx - r * .8, base, r); moneda(ctx, cx + r * .8, base, r); moneda(ctx, cx, base - r * .6, r); if (cuantas >= 4) moneda(ctx, cx, base - r * 1.25, r); }
    return c;
  }
  function canvasCofre(tam, abierto) {
    const [c, ctx] = lienzo(tam); const s = tam * .36; const x = tam / 2, y = tam * .58;
    ctx.lineWidth = Math.max(2, s * .12); ctx.strokeStyle = "#3a2410"; ctx.lineJoin = "round";
    const caja = (yy, h, col) => { ctx.beginPath(); ctx.roundRect(x - s, yy, s * 2, h, s * .12); ctx.fillStyle = col; ctx.fill(); ctx.stroke(); };
    caja(y - s * .2, s * 1.1, "#8a5a2b");
    if (abierto) { ctx.fillStyle = "#f2c53d"; ctx.beginPath(); ctx.ellipse(x, y - s * .15, s * .85, s * .3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); const yt = abierto ? y - s * 1.35 : y - s * .75; ctx.moveTo(x - s, yt + s * .55); ctx.quadraticCurveTo(x - s, yt - s * .1, x - s * .3, yt); ctx.lineTo(x + s * .3, yt); ctx.quadraticCurveTo(x + s, yt - s * .1, x + s, yt + s * .55); ctx.closePath(); ctx.fillStyle = "#a66d36"; ctx.fill(); ctx.stroke();
    for (const dx of [-.55, .55]) { ctx.beginPath(); ctx.rect(x + dx * s - s * .1, y - s * .2, s * .2, s * 1.1); ctx.fillStyle = "#e8b923"; ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.roundRect(x - s * .18, y + s * .05, s * .36, s * .4, s * .06); ctx.fillStyle = "#e8b923"; ctx.fill(); ctx.stroke();
    return c;
  }

  // ---- el cartel ----
  function mostrar() {
    if (abierto) return; const e = estado(); if (e.reclamado) return; abierto = true;
    const Tx = T(); const cap = document.createElement("div"); cap.id = "premio";
    const caja = document.createElement("div"); caja.className = "premio-caja";
    caja.innerHTML = `<div class="premio-cab"><span class="premio-eyebrow">${Tx.titulo}</span><h2>${Tx.dia.replace("{n}", e.dia)}</h2><p class="premio-sub">${e.racha >= 1 ? Tx.racha.replace("{n}", e.racha) : Tx.empieza}</p></div>`;
    const grid = document.createElement("div"); grid.className = "premio-dias";
    for (let d = 1; d <= 10; d++) {
      const p = premioDe(d); const t = document.createElement("div");
      t.className = "premio-dia " + (d < e.dia ? "hecho" : d === e.dia ? "hoy" : "futuro") + (p.objeto ? " cofre" : "");
      t.dataset.dia = d;
      t.innerHTML = `<small>${Tx.diaCorto.replace("{n}", d)}</small>`;
      const fig = document.createElement("div"); fig.className = "premio-fig";
      fig.appendChild(p.objeto ? canvasCofre(d === e.dia ? 64 : 48, false) : canvasMonedas(d === e.dia ? 64 : 48, p.oro >= 50 ? 4 : p.oro >= 20 ? 3 : p.oro >= 15 ? 2 : 1));
      t.appendChild(fig);
      const v = document.createElement("b"); v.className = p.objeto ? "premio-valor objeto" : "premio-valor oro"; v.textContent = p.objeto ? Tx.objeto : `+${p.oro}`; t.appendChild(v);
      if (d < e.dia) { const ok = document.createElement("span"); ok.className = "premio-ok"; ok.textContent = "✓"; t.appendChild(ok); }
      grid.appendChild(t);
    }
    caja.appendChild(grid);
    const pie = document.createElement("div"); pie.className = "premio-pie";
    const btn = App.boton(Tx.reclamar, () => alReclamar(), "btn btn-primario premio-boton"); pie.appendChild(btn);
    const luego = document.createElement("p"); luego.className = "premio-manana"; const sig = premioDe(e.dia === 10 ? 1 : e.dia + 1);
    luego.textContent = Tx.manana.replace("{p}", sig.objeto ? Tx.objetoLargo : Tx.oroN.replace("{n}", sig.oro)); pie.appendChild(luego);
    caja.appendChild(pie); cap.appendChild(caja); document.body.appendChild(cap);
    if (App.escudoToque) App.escudoToque();
    requestAnimationFrame(() => cap.classList.add("visible"));

    function alReclamar() {
      btn.disabled = true; const dado = reclamar(); if (!dado) { cerrar(); return; }
      const t = grid.querySelector(".premio-dia.hoy"); t.classList.add("reclamado");
      // estrellas que salen de la casilla de hoy
      for (let i = 0; i < 16; i++) {
        const s = document.createElement("span"); s.className = "premio-estrella"; s.textContent = i % 3 === 0 ? "✦" : "★";
        const ang = (Math.PI * 2 * i) / 16 + Math.random() * .4, dist = 60 + Math.random() * 70;
        s.style.setProperty("--dx", Math.cos(ang) * dist + "px"); s.style.setProperty("--dy", Math.sin(ang) * dist - 30 + "px");
        s.style.setProperty("--rot", (Math.random() * 360 - 180) + "deg"); s.style.animationDelay = (Math.random() * .12) + "s";
        s.style.fontSize = (12 + Math.random() * 14) + "px"; s.style.color = i % 4 === 0 ? "#fff3b0" : "#f2c53d";
        t.appendChild(s);
      }
      if (dado.objeto) { const fig = t.querySelector(".premio-fig"); fig.innerHTML = ""; fig.appendChild(canvasCofre(64, true)); setTimeout(() => { fig.innerHTML = ""; fig.appendChild(FWM.figuras.canvasObjeto(dado.objeto, 64)); }, 500); }
      try { FWM.sonido.premio(); } catch (x) { /* sin sonido */ }
      // el texto del botón se convierte en lo recibido, y el oro de arriba sube
      const nombre = dado.objeto ? FWM.datosBase.objetos[dado.objeto].nombre : null;
      btn.textContent = dado.objeto ? Tx.recibidoObjeto.replace("{nombre}", nombre) : Tx.recibidoOro.replace("{n}", dado.oro); btn.classList.add("premio-hecho");
      if (dado.oro) contarOro(dado.oro);
      setTimeout(cerrar, dado.objeto ? 2600 : 1800);
    }
    function contarOro(n) {
      const s = document.createElement("div"); s.className = "premio-suma oro"; s.textContent = `+${n}`; caja.appendChild(s);
    }
    function cerrar() {
      cap.classList.remove("visible"); setTimeout(() => { cap.remove(); abierto = false; if (FWM.inicio && FWM.inicio.refrescar) FWM.inicio.refrescar(); }, 300);
    }
  }

  return { PREMIOS, estado, pendiente, reclamar, mostrar, abierto: () => abierto };
})();
