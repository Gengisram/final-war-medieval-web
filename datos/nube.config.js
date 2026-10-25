// Conexión con la nube (Supabase): cuentas y ranking online.
// La clave "publishable" es pública por diseño: va dentro del juego. Lo que protege los datos
// son las reglas de la base de datos (RLS), no esta clave.
window.FWM = window.FWM || {};
FWM.nubeConfig = {
  url: "https://phhurmglfmmdjzspsmuk.supabase.co",
  clave: "sb_publishable_SfQfiA-dkkXyeMkdeiqwHA_Q_J2Sjft",
};
