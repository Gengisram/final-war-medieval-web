// Textos legales (6 sep 2026). Se ven en Ajustes → Legal y desde la pantalla de crear cuenta.
//
// OJO: esto es una base honesta y completa para empezar, no asesoramiento jurídico. Antes de publicar en
// las tiendas hay que rellenar TITULAR y CONTACTO y, si se cobra dinero o se pone publicidad, revisarlo con
// alguien que sepa (y añadir las cláusulas de compras y de la tienda correspondiente).
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.legal = {
  titular: "Rodrigo Brm",                    // nombre o empresa que responde del juego
  contacto: "rodrigobrm@yahoo.com",          // correo para privacidad y bajas
  paisDatos: "Irlanda (Unión Europea)",      // dónde están los servidores (Supabase)
  edadMinima: 13,
  actualizado: "6 de septiembre de 2026",

  privacidad: {
    titulo: "Política de privacidad",
    secciones: [
      { h: "Lo más importante", p: "Se puede jugar entero sin cuenta y sin dar ningún dato. La cuenta solo hace falta para salir en el ranking y jugar duelos contra otras personas." },
      { h: "Quién responde", p: "{titular}. Para cualquier cosa relacionada con tus datos, escribe a {contacto}." },
      { h: "Qué se guarda si creas cuenta", p: "Tu correo y tu contraseña (cifrada, nunca la vemos), el nombre que eliges para el ranking, tu héroe y su nivel, la puntuación de las partidas que envías, los duelos jugados y tu Elo. Nada más: no pedimos tu nombre real, ni tu edad, ni tu ubicación, ni tu agenda." },
      { h: "Qué se guarda sin cuenta", p: "Tu partida, tu héroe y tus récords se quedan en el propio dispositivo (almacenamiento del navegador) y no salen de él. Además guardamos unas pocas anotaciones anónimas de uso (que se ha abierto el juego, que ha empezado o acabado una partida) con un identificador aleatorio del dispositivo, para saber si el juego se entiende. No se pueden asociar a ti." },
      { h: "Para qué", p: "Para que funcionen el ranking, los duelos y tu progreso entre dispositivos, y para mejorar el juego. Nada de publicidad ni de perfiles comerciales." },
      { h: "Con quién se comparte", p: "Con nadie, salvo el proveedor que aloja la base de datos (Supabase), que actúa por cuenta nuestra y guarda los datos en {paisDatos}. Tu nombre de jugador, tu héroe y tu puntuación son públicos dentro del juego: eso es el ranking. Tu correo no se enseña nunca." },
      { h: "Cuánto tiempo", p: "Mientras tengas la cuenta. Si la borras, se borra todo lo tuyo enseguida. Las anotaciones anónimas de uso se conservan como mucho un año." },
      { h: "Tus derechos", p: "Puedes ver, corregir o borrar tus datos cuando quieras. Para borrarlo todo tienes el botón «Borrar mi cuenta» en Ajustes; también puedes pedirlo escribiendo a {contacto}. Tienes derecho a reclamar ante la autoridad de protección de datos de tu país." },
      { h: "Edad", p: "El juego no está pensado para menores de {edad} años. Si lo eres, pide a tu madre, padre o tutor que cree la cuenta o juega sin ella." },
      { h: "Cambios", p: "Si esto cambia, se avisa en el juego. Última actualización: {actualizado}." },
    ],
  },

  condiciones: {
    titulo: "Condiciones de uso",
    secciones: [
      { h: "Qué es esto", p: "Final War: Medieval es un juego de estrategia por turnos. Usarlo es gratis. Al jugar aceptas estas condiciones." },
      { h: "Tu cuenta", p: "Eres responsable de lo que se haga con tu cuenta y de guardar tu contraseña. Elige un nombre que no insulte, no suplante a nadie ni haga publicidad; los nombres ofensivos se cambian o se borran." },
      { h: "Juego limpio", p: "No vale trampear: modificar el juego para conseguir puntuaciones falsas, automatizar partidas, abusar de errores o hacerse cuentas de más para inflar el ranking. Si pasa, se corrige la puntuación y, si se repite, se cierra la cuenta." },
      { h: "Duelos", p: "Los duelos son en directo y con reloj. Si abandonas o te quedas sin conexión, la partida puede darse por perdida: es lo justo para quien está esperando al otro lado." },
      { h: "Lo que hay dentro", p: "El juego, sus textos, dibujos y música son de sus autores; la música lleva su propia licencia, citada en Ajustes → Créditos. Puedes hacer capturas y vídeos y publicarlos donde quieras." },
      { h: "Sin garantías", p: "El juego se ofrece tal cual. Puede tener fallos, puede dejar de estar disponible y puedes perder progreso (sobre todo si juegas sin cuenta). No se responde de daños derivados de usarlo." },
      { h: "Cambios y baja", p: "Estas condiciones pueden cambiar; se avisa en el juego. Puedes irte cuando quieras borrando tu cuenta desde Ajustes." },
      { h: "Contacto", p: "{contacto}. Última actualización: {actualizado}." },
    ],
  },
};
