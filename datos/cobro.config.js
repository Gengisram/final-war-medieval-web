// Cobro en las tiendas (13 sep 2026): RevenueCat hace de puente con Google Play y la App Store.
//
// PARA ACTIVAR EL COBRO DE VERDAD (lo hace Rodrigo, con sus cuentas):
//   1. Crear el proyecto en RevenueCat y pegar aquí sus dos claves públicas (empiezan por "goog_" y "appl_").
//   2. En Google Play Console y App Store Connect, crear estos productos como "compra única" (no suscripción),
//      con los mismos identificadores de `productos`.
//   3. En RevenueCat, crear un "entitlement" por facción con el id de `derechos` y darle su producto; el pack da
//      las cinco.
// Mientras las claves estén vacías, el juego en el móvil funciona en MODO PRUEBA: la tienda se ve entera y
// "comprar" desbloquea sin cobrar (lo avisa en pantalla). En la web no se vende nada: es escaparate.
window.FWM = window.FWM || {};

FWM.cobroConfig = {
  claves: { android: "", ios: "" },
  // identificadores de producto en las tiendas (iguales en Google y Apple)
  productos: {
    inglaterra: "fwm_faccion_inglaterra",
    mali: "fwm_faccion_mali",
    saladino: "fwm_faccion_saladino",
    mongoles: "fwm_faccion_mongoles",
    eslavos: "fwm_faccion_eslavos",
    pack: "fwm_pack_cinco_facciones",
  },
  // qué desbloquea cada derecho de RevenueCat
  derechos: { inglaterra: "inglaterra", mali: "mali", saladino: "saladino", mongoles: "mongoles", eslavos: "eslavos" },
  // precios de referencia (los de verdad los da la tienda en la moneda de cada país)
  preciosReferencia: { faccion: "2,99 €", pack: "10,99 €" },
  // dónde está el juego en las tiendas (para el botón "Consíguelas en la app" de la web)
  enlaces: {
    android: "https://play.google.com/store/apps/details?id=com.techyield.finalwar",
    ios: "https://apps.apple.com/app/final-war-medieval/id0000000000",
  },
};
