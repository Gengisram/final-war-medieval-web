// Compras de facciones (13 sep 2026). Un solo sitio para las tres formas de estar:
//   "tienda"   app del móvil con claves de RevenueCat: cobra de verdad con Google Play o la App Store
//   "prueba"   app del móvil sin claves, o probando en el ordenador (localhost o ?prueba=1): todo igual, pero
//              "comprar" desbloquea sin cobrar y lo dice en pantalla
//   "web"      el juego en el navegador: escaparate, solo las facciones gratis; las de pago, "Consíguelas en la app"
// Lo comprado se guarda también en el aparato para jugar sin conexión; la tienda manda cuando responde.
// Hablamos con el plugin de RevenueCat por el puente nativo de Capacitor (Capacitor.nativePromise), sin
// empaquetador: así no hace falta cambiar cómo se carga el juego.
window.FWM = window.FWM || {};

FWM.cobro = (function () {
  const CLAVE = "fwm.compras";
  const C = () => FWM.cobroConfig || { claves: {}, productos: {}, derechos: {}, preciosReferencia: {} };
  let listo = false, precios = {}, productosTienda = {}, oyentes = [];

  function nativo() { return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); }
  function plataforma() { return nativo() && window.Capacitor.getPlatform ? window.Capacitor.getPlatform() : "web"; }
  function clave() { return (C().claves || {})[plataforma()] || ""; }
  function probandoEnOrdenador() {
    try { return /^(localhost|127\.0\.0\.1|192\.168\.)/.test(location.hostname) || new URLSearchParams(location.search).has("prueba"); } catch (e) { return false; }
  }
  function modo() {
    if (nativo()) return clave() ? "tienda" : "prueba";
    return probandoEnOrdenador() ? "prueba" : "web";
  }
  function sePuedeComprar() { return modo() !== "web"; }

  function leer() { try { return Object.assign({ derechos: [], prueba: [] }, JSON.parse(localStorage.getItem(CLAVE) || "{}")); } catch (e) { return { derechos: [], prueba: [] }; } }
  function guardar(x) { try { localStorage.setItem(CLAVE, JSON.stringify(x)); } catch (e) { /* nada */ } avisar(); }
  function avisar() { for (const fn of oyentes) try { fn(); } catch (e) { /* nada */ } }
  function alCambiar(fn) { oyentes.push(fn); }

  function tieneFaccion(f) {
    const x = leer(); const d = (C().derechos || {})[f];
    if (modo() === "tienda") return !!d && x.derechos.includes(d);
    if (modo() === "prueba") return x.prueba.includes(f) || (!!d && x.derechos.includes(d));
    return false; // web: escaparate
  }

  // ---------- puente con RevenueCat ----------
  const rc = (metodo, op) => window.Capacitor.nativePromise("Purchases", metodo, op || {});
  function anotarCliente(info) {
    const activos = Object.keys((info && info.entitlements && info.entitlements.active) || {});
    const x = leer(); x.derechos = activos; x.revisado = Date.now(); guardar(x);
  }
  async function iniciar() {
    if (listo) return true;
    if (modo() !== "tienda") { listo = true; return true; }
    try {
      const usuario = FWM.nube && FWM.nube.usuario && FWM.nube.usuario();
      await rc("configure", { apiKey: clave(), appUserID: usuario ? usuario.id : null });
      const r = await rc("getCustomerInfo"); anotarCliente(r.customerInfo || r);
      const ids = Object.values(C().productos || {});
      const p = await rc("getProducts", { productIdentifiers: ids, type: "NON_SUBSCRIPTION" });
      for (const prod of (p && p.products) || []) { productosTienda[prod.identifier] = prod; precios[prod.identifier] = prod.priceString; }
      listo = true; avisar(); return true;
    } catch (e) { console.warn("[cobro]", e); return false; }
  }
  // Al entrar o salir de la cuenta: las compras se atan a la cuenta para no perderlas al cambiar de móvil.
  async function cambiarUsuario(id) {
    if (modo() !== "tienda" || !listo) return;
    try { const r = id ? await rc("logIn", { appUserID: id }) : await rc("logOut"); anotarCliente((r && r.customerInfo) || r); } catch (e) { /* nada */ }
  }

  function precio(que) {
    const id = (C().productos || {})[que];
    return (id && precios[id]) || (que === "pack" ? C().preciosReferencia.pack : C().preciosReferencia.faccion) || "";
  }

  // Compra una facción ("mali") o el pack ("pack"). Devuelve { ok } o { ok: false, cancelada, error }.
  async function comprar(que) {
    const m = modo();
    if (m === "web") return { ok: false, error: "web" };
    if (m === "prueba") {
      const x = leer(); const lista = que === "pack" ? Object.keys(C().derechos) : [que];
      x.prueba = Array.from(new Set(x.prueba.concat(lista))); guardar(x);
      return { ok: true, prueba: true };
    }
    try {
      await iniciar();
      const prod = productosTienda[(C().productos || {})[que]];
      if (!prod) return { ok: false, error: "sin_producto" };
      const r = await rc("purchaseStoreProduct", { product: prod });
      anotarCliente(r.customerInfo);
      return { ok: true };
    } catch (e) {
      const cancelada = !!(e && (e.userCancelled || (e.data && e.data.userCancelled) || /cancel/i.test(String(e.message || e.code || ""))));
      return { ok: false, cancelada, error: cancelada ? "cancelada" : String((e && (e.message || e.code)) || e) };
    }
  }
  // Recuperar compras (obligatorio en la App Store): vuelve a pedir a la tienda lo que ya es tuyo.
  async function restaurar() {
    const m = modo();
    if (m !== "tienda") return { ok: m === "prueba", n: leer().prueba.length };
    try { await iniciar(); const r = await rc("restorePurchases"); anotarCliente(r.customerInfo || r); return { ok: true, n: leer().derechos.length }; }
    catch (e) { return { ok: false, error: String((e && e.message) || e) }; }
  }
  // Solo en modo prueba: deja la tienda como nueva.
  function olvidarPrueba() { const x = leer(); x.prueba = []; guardar(x); }

  return { modo, plataforma, sePuedeComprar, iniciar, cambiarUsuario, tieneFaccion, precio, comprar, restaurar, olvidarPrueba, alCambiar };
})();
