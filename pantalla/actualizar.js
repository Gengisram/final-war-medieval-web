// Aviso de versión nueva (30 sep 2026, Rodrigo: como en Caloriday). El juego se guarda en el móvil para funcionar sin
// conexión (sw.js). Si publicamos una versión nueva mientras alguien lo tiene abierto, el navegador la baja por detrás
// y aquí, en cuanto está lista, sale una barra abajo: "Final War se ha actualizado. Toca para actualizar". Un toque
// recarga y ya va con la nueva; sin cerrar la aplicación. Además se pregunta por novedades al volver a la aplicación
// y cada diez minutos, para que no haga falta cerrarla.
window.FWM = window.FWM || {};

FWM.actualizar = (function () {
  const T = () => (typeof App !== "undefined" && App.datos && App.datos.textos && App.datos.textos.actualizar) || { hay: "Final War se ha actualizado.", toca: "Toca aquí para actualizar" };
  let barra = null, registro = null;

  function mostrarBarra() {
    if (barra) return;
    barra = document.createElement("button"); barra.type = "button"; barra.id = "barra-actualizar";
    barra.innerHTML = `<b>${T().hay}</b> ${T().toca}`;
    barra.addEventListener("click", () => { barra.disabled = true; location.reload(); });
    document.body.appendChild(barra);
  }

  function iniciar() {
    if (!("serviceWorker" in navigator) || !(location.protocol === "https:" || location.hostname === "localhost")) return;
    const habiaControlador = !!navigator.serviceWorker.controller;
    // cuando el nuevo service worker toma el mando (sw.js hace skipWaiting + claim) es que la versión nueva ya está lista
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (habiaControlador) mostrarBarra(); });
    window.addEventListener("load", async () => {
      try { registro = await navigator.serviceWorker.register("sw.js"); } catch (e) { return; }
      // por si el nuevo ya estaba instalado esperando (poco probable con skipWaiting, pero no cuesta nada)
      if (registro.waiting && navigator.serviceWorker.controller) mostrarBarra();
      const comprobar = () => { if (registro && navigator.onLine !== false) registro.update().catch(() => {}); };
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") comprobar(); });
      setInterval(comprobar, 10 * 60 * 1000);
    });
  }

  iniciar();
  return { mostrarBarra };
})();
