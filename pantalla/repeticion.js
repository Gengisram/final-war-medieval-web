// Repetición de la partida turno a turno (6 sep 2026).
// App guarda una foto del estado al empezar cada ronda propia (App.anotarFoto); aquí se pintan una tras otra
// con el mismo dibujante del mapa. Las fotos viven solo en memoria: si se recarga la página se pierden las anteriores.
window.FWM = window.FWM || {};

FWM.repeticion = (function () {
  const VACIO = { mover: {}, atacar: [], asediar: [], reclamar: false, fundar: false, mejorarA: [], atrincherar: false };
  let App = null, L = null, fotos = [], i = 0, timer = null;

  function hay(app) { return !!(app && app.fotos && app.fotos.length >= 2); }

  function abrir(app) {
    App = app; fotos = (app.fotos || []).slice(); i = 0; timer = null;
    const T = App.datos.textos, TR = T.repeticion;
    const cont = document.createElement("div");
    const h2 = document.createElement("h2"); h2.textContent = TR.titulo; cont.appendChild(h2);
    const sub = document.createElement("p"); sub.className = "suave"; sub.style.margin = "0 0 8px";
    sub.textContent = `${App.estado.mapa.nombre || ""} · ${TR.turnos.replace("{n}", fotos.length)}`;
    cont.appendChild(sub);

    const caja = document.createElement("div"); caja.className = "rep-mapa";
    const canvas = document.createElement("canvas"); caja.appendChild(canvas); cont.appendChild(caja);

    const pie = document.createElement("div"); pie.className = "rep-pie"; cont.appendChild(pie);
    const barra = document.createElement("input"); barra.type = "range"; barra.min = "0"; barra.max = String(fotos.length - 1); barra.value = "0"; barra.className = "rep-barra";
    cont.appendChild(barra);

    const botones = document.createElement("div"); botones.className = "modal-botones rep-botones";
    const bAtras = App.boton("◀", () => { parar(); ir(i - 1); }, "btn btn-peq btn-claro");
    const bPlay = App.boton(TR.reproducir, () => (timer ? parar() : reproducir()), "btn btn-peq btn-primario");
    const bAdel = App.boton("▶", () => { parar(); ir(i + 1); }, "btn btn-peq btn-claro");
    botones.appendChild(bAtras); botones.appendChild(bPlay); botones.appendChild(bAdel);
    botones.appendChild(App.boton(T.cerrar, () => { parar(); App.cerrarModal(); }, "btn btn-claro"));
    cont.appendChild(botones);

    barra.addEventListener("input", () => { parar(); ir(Number(barra.value)); });

    function pintar() {
      const e = fotos[i]; if (!e || !L) return;
      L.encuadrar(e);
      L.dibujar(e, App.datos, { sel: {}, posibles: VACIO, humano: App.humano, parpadeo: false, efectos: [], anim: null });
      const marcador = e.jugadores.filter(j => !j.eliminado || FWM.victoria.puntos(e, App.datos, j.id) > 0)
        .map(j => `${j.id === App.humano ? T.tu : (j.apodo || j.nombre)} <b>${FWM.victoria.puntos(e, App.datos, j.id)}</b>`).join(" · ");
      pie.innerHTML = `<span>${T.turno} <b>${e.turno}</b>${e.limiteTurnos ? "/" + e.limiteTurnos : ""}</span><span class="rep-marcador">${marcador}</span>`;
      barra.value = String(i);
      bAtras.disabled = i <= 0; bAdel.disabled = i >= fotos.length - 1;
    }
    function ir(n) { i = Math.max(0, Math.min(fotos.length - 1, n)); pintar(); }
    function reproducir() {
      if (i >= fotos.length - 1) i = 0;
      bPlay.textContent = TR.pausa;
      timer = setInterval(() => { if (i >= fotos.length - 1) { parar(); return; } ir(i + 1); }, 1100);
      pintar();
    }
    function parar() { if (timer) clearInterval(timer); timer = null; bPlay.textContent = TR.reproducir; }

    App.modalNodo(cont);
    // el canvas necesita estar en pantalla para medirse
    requestAnimationFrame(() => { L = FWM.lienzo.crear(canvas); L.redimensionar(); pintar(); });
    document.getElementById("modal").addEventListener("click", function alCerrar(ev) {
      if (ev.target && ev.target.id === "modal") { parar(); document.getElementById("modal").removeEventListener("click", alCerrar); }
    });
  }

  return { hay, abrir };
})();
