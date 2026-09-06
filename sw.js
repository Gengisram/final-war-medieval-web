// Service worker: el juego funciona sin conexión. Guarda los ficheros del juego la primera vez
// y después va primero a la red (para ver los cambios a la primera) y a la caché solo si no hay conexión.
// Los ficheros llevan ?v=<fecha> para saltarse la caché del navegador: aquí se ignora la query.
const VERSION = "fwm-v66";
const BASE = [
  "./", "./index.html", "./manifest.json", "./pantalla/estilos.css",
  "./datos/base/version.js", "./datos/base/recursos.js", "./datos/base/terrenos.js", "./datos/base/yacimientos.js", "./datos/base/tropas.js", "./datos/base/asentamientos.js",
  "./datos/base/construcciones.js", "./datos/base/tecnologias.js", "./datos/base/bandos.js", "./datos/base/nombresIA.js", "./datos/base/medallas.js", "./datos/base/heroes.js", "./datos/base/objetos.js", "./datos/base/misiones.js", "./datos/base/campana.js", "./datos/base/escenarios.js", "./datos/base/dados.js",
  "./datos/base/reglas.js", "./datos/base/legal.js", "./datos/base/glosario.js", "./datos/base/textos.es.js", "./datos/base/textos.en.js", "./datos/base/traduccion.en.js", "./datos/idioma.js", "./datos/cargador.js", "./datos/nube.config.js",
  "./motor/azar.js", "./motor/hex.js", "./motor/estado.js", "./motor/stats.js", "./motor/territorio.js", "./motor/combate.js", "./motor/economia.js",
  "./motor/victoria.js", "./motor/acciones.js", "./motor/motor.js", "./mapa/generador.js", "./mapa/hechos.js", "./ia/tonta.js", "./ia/normal.js", "./modo/barbaros.js",
  "./pantalla/iconos.js", "./pantalla/figuras.js", "./pantalla/sonido.js", "./pantalla/musica.js", "./pantalla/lienzo.js", "./pantalla/entrada.js", "./pantalla/guardado.js", "./pantalla/heroe.js", "./pantalla/campana.js", "./pantalla/duelo.js",
  "./pantalla/fichaAsentamiento.js", "./pantalla/arbolTecnologico.js", "./pantalla/glosario.js", "./pantalla/resultado.js", "./pantalla/repeticion.js", "./pantalla/compartir.js", "./pantalla/nube.js",
  "./pantalla/inicio.js", "./pantalla/tutorial.js", "./pantalla/paneles.js", "./pantalla/app.js",
  "./iconos/icono-192.png", "./iconos/icono-512.png", "./iconos/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // la nube (Supabase) siempre va a la red
  if (url.hostname.endsWith("supabase.co")) return;
  const propio = url.origin === self.location.origin;
  const libreria = url.hostname === "cdn.jsdelivr.net";
  if (!propio && !libreria) return;
  // Ficheros propios: primero la red (así cada cambio se ve a la primera), y si no hay red, la caché.
  // Librería externa: primero la caché (no cambia).
  e.respondWith(caches.open(VERSION).then(async (c) => {
    const deCache = () => c.match(e.request, { ignoreSearch: propio });
    if (libreria) { const l = await deCache(); if (l) return l; }
    try {
      const r = await fetch(e.request);
      if (r && (r.ok || r.type === "opaque")) c.put(e.request, r.clone());
      return r;
    } catch (err) {
      const l = await deCache();
      return l || new Response("Sin conexión", { status: 503, headers: { "Content-Type": "text/plain" } });
    }
  }));
});
