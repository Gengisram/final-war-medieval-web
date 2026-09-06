// Imagen para compartir al acabar una partida (6 sep 2026).
// Dibuja una tarjeta cuadrada con el héroe, la posición, los puntos y el mapa, y la pasa al menú de compartir
// del móvil (navigator.share con ficheros). Si el aparato no sabe compartir ficheros, la enseña para guardarla.
window.FWM = window.FWM || {};

FWM.compartir = (function () {
  const LADO = 1080;
  const DIRECCION = "gengisram.github.io/final-war-medieval-web"; // para quien vea la imagen y quiera jugar
  const FONDO = "#f0e6cd", TINTA = "#2a2419", ACENTO = "#8e2a20";

  // Tarjeta: título, héroe, posición, puntos y una línea con el mapa. Devuelve el canvas.
  function tarjeta(App, op) {
    const T = App.datos.textos; const e = App.estado;
    const c = document.createElement("canvas"); c.width = LADO; c.height = LADO;
    const ctx = c.getContext("2d");
    ctx.fillStyle = FONDO; ctx.fillRect(0, 0, LADO, LADO);
    // marco
    ctx.strokeStyle = ACENTO; ctx.lineWidth = 14; ctx.strokeRect(28, 28, LADO - 56, LADO - 56);
    ctx.strokeStyle = "rgba(142,42,32,.35)"; ctx.lineWidth = 4; ctx.strokeRect(52, 52, LADO - 104, LADO - 104);
    ctx.textAlign = "center";
    // título
    ctx.fillStyle = ACENTO; ctx.font = "bold 58px Georgia, serif";
    ctx.fillText("Final War: Medieval", LADO / 2, 140);
    // posición
    const pos = op.posicion != null ? (T.posiciones[op.posicion] || (op.posicion + 1) + ".º") : "";
    ctx.fillStyle = TINTA; ctx.font = "bold 96px Georgia, serif";
    ctx.fillText(pos.toUpperCase(), LADO / 2, 260);
    // héroe grande
    try {
      const fig = FWM.figuras.canvasHeroe(FWM.heroe.paraPartida({}), "#2f6fd6", 440, true);
      ctx.drawImage(fig, LADO / 2 - 220, 268, 440, 440);
    } catch (x) { /* sin figura */ }
    // nombre del jugador y escalón
    ctx.fillStyle = TINTA; ctx.font = "bold 62px Georgia, serif";
    ctx.fillText(op.nombre || "", LADO / 2, 730);
    ctx.fillStyle = ACENTO; ctx.font = "bold 34px Georgia, serif";
    ctx.fillText((FWM.heroes.nombreNivel(FWM.heroe.nivel()) || "").toUpperCase(), LADO / 2, 778);
    // puntos, en grande
    ctx.fillStyle = TINTA; ctx.font = "bold 150px Georgia, serif";
    ctx.fillText(String(op.puntos), LADO / 2, 920);
    ctx.font = "34px Georgia, serif"; ctx.fillStyle = "#6b6455";
    ctx.fillText(T.puntos.toLowerCase(), LADO / 2, 960);
    // pie: mapa, turno y dirección del juego
    ctx.font = "30px Georgia, serif"; ctx.fillStyle = "#6b6455";
    const pie = [e.mapa.nombre, `${T.turno.toLowerCase()} ${e.turno}`, T.tipos[(App.opciones && App.opciones.tipo) || "rapida"]].filter(Boolean).join(" · ");
    ctx.fillText(pie, LADO / 2, 1000);
    ctx.font = "26px Georgia, serif"; ctx.fillStyle = ACENTO;
    ctx.fillText(FWM.compartir.DIRECCION, LADO / 2, 1042);
    return c;
  }

  function aFichero(canvas) {
    return new Promise((res) => canvas.toBlob((b) => res(b ? new File([b], "final-war.png", { type: "image/png" }) : null), "image/png"));
  }

  // Comparte (o enseña) la imagen del resultado. op: { posicion, puntos, nombre }
  async function resultado(App, op) {
    const T = App.datos.textos, TC = T.compartir;
    const c = tarjeta(App, op);
    const texto = TC.texto.replace("{puntos}", op.puntos).replace("{mapa}", App.estado.mapa.nombre || "");
    let fichero = null;
    try { fichero = await aFichero(c); } catch (x) { fichero = null; }
    if (fichero && navigator.share && navigator.canShare && navigator.canShare({ files: [fichero] })) {
      try { await navigator.share({ files: [fichero], text: texto }); return; } catch (x) { if (x && x.name === "AbortError") return; }
    }
    // sin compartir de sistema: se enseña la imagen para guardarla a mano
    const cont = document.createElement("div");
    const h2 = document.createElement("h2"); h2.textContent = TC.titulo; cont.appendChild(h2);
    const img = document.createElement("img"); img.className = "compartir-img"; img.alt = TC.titulo; img.src = c.toDataURL("image/png");
    cont.appendChild(img);
    const p = document.createElement("p"); p.className = "pista"; p.textContent = TC.guardar; cont.appendChild(p);
    const fila = document.createElement("div"); fila.className = "modal-botones";
    const a = document.createElement("a"); a.className = "btn btn-claro"; a.download = "final-war.png"; a.href = img.src; a.textContent = TC.descargar; fila.appendChild(a);
    fila.appendChild(App.boton(T.cerrar, () => App.cerrarModal(), "btn btn-primario"));
    cont.appendChild(fila);
    App.modalNodo(cont);
  }

  return { resultado, tarjeta, DIRECCION };
})();
