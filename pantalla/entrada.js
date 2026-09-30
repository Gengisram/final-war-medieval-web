// Ratón y táctil: arrastrar, zoom (rueda y pellizco), toque.
window.FWM = window.FWM || {};

FWM.entrada = (function () {
  function conectar(canvas, L, alTocar, alCambiar, alPasar) {
    const punteros = new Map();
    let arrastrando = false, inicio = null, distPellizco = 0, movido = false;

    canvas.addEventListener("pointerdown", (e) => {
      canvas.setPointerCapture(e.pointerId);
      punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (punteros.size === 1) { inicio = { x: e.clientX, y: e.clientY, vx: L.vista.x, vy: L.vista.y }; movido = false; }
      if (punteros.size === 2) { distPellizco = distancia(); }
    });
    canvas.addEventListener("pointermove", (e) => {
      // ratón sin pulsar: aviso de "aquí se puede tocar" (mano y circulito más grande)
      if (!punteros.has(e.pointerId)) { if (alPasar && e.pointerType === "mouse") { const r = canvas.getBoundingClientRect(); alPasar(e.clientX - r.left, e.clientY - r.top); } return; }
      punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (punteros.size === 2) {
        const d = distancia();
        if (distPellizco > 0) {
          const [a, b] = [...punteros.values()];
          const r = canvas.getBoundingClientRect();
          L.zoomEn(d / distPellizco, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
          alCambiar();
        }
        distPellizco = d; movido = true;
        return;
      }
      if (punteros.size === 1 && inicio) {
        const dx = e.clientX - inicio.x, dy = e.clientY - inicio.y;
        if (!movido && Math.hypot(dx, dy) > 6) { movido = true; arrastrando = true; canvas.classList.add("arrastrando"); }
        if (arrastrando) { L.vista.x = inicio.vx + dx; L.vista.y = inicio.vy + dy; L.cenir(); alCambiar(); }
      }
    });
    const soltar = (e) => {
      if (!punteros.has(e.pointerId)) return;
      punteros.delete(e.pointerId);
      if (punteros.size === 0) {
        if (!movido && inicio) {
          const r = canvas.getBoundingClientRect();
          document.dispatchEvent(new CustomEvent("fwm-toque")); // toque limpio en el mapa (sin arrastre)
          alTocar(L.hexEn(e.clientX - r.left, e.clientY - r.top), e.clientX - r.left, e.clientY - r.top);
        }
        arrastrando = false; inicio = null; canvas.classList.remove("arrastrando");
      } else if (punteros.size === 1) {
        const p = [...punteros.values()][0];
        inicio = { x: p.x, y: p.y, vx: L.vista.x, vy: L.vista.y }; movido = true;
      }
    };
    canvas.addEventListener("pointerup", soltar);
    canvas.addEventListener("pointercancel", soltar);
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      L.zoomEn(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top);
      alCambiar();
    }, { passive: false });

    function distancia() {
      const [a, b] = [...punteros.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    }
  }
  return { conectar };
})();
