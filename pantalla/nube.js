// La nube: cuentas y ranking online (Supabase). Si no hay red o no carga la librería,
// todo sigue funcionando en local; solo se apagan el ranking online y las cuentas.
window.FWM = window.FWM || {};

FWM.nube = (function () {
  let cliente = null, usuario = null, perfil = null;
  const CLAVE_PENDIENTES = "fwm.pendientes"; // partidas jugadas sin cuenta, por enviar cuando la haya

  function disponible() { return !!cliente; }
  function posible() { return !!(FWM.nubeConfig && FWM.nubeConfig.url); } // hay nube configurada (aunque aún no haya respondido)

  async function iniciar() {
    if (!window.supabase || !FWM.nubeConfig || !FWM.nubeConfig.url) return false;
    try {
      cliente = window.supabase.createClient(FWM.nubeConfig.url, FWM.nubeConfig.clave);
      const { data } = await cliente.auth.getSession();
      usuario = data && data.session ? data.session.user : null;
      if (usuario) await cargarPerfil();
      cliente.auth.onAuthStateChange((ev, sesion) => { usuario = sesion ? sesion.user : null; if (!usuario) perfil = null; });
      return true;
    } catch (e) { cliente = null; return false; }
  }

  async function cargarPerfil() {
    if (!cliente || !usuario) return null;
    let { data } = await cliente.from("perfiles").select("id, nombre, avatar, heroe, nivel, elo, liga_reclamada").eq("id", usuario.id).maybeSingle();
    if (!data) { const r = await cliente.from("perfiles").select("id, nombre, avatar").eq("id", usuario.id).maybeSingle(); data = r.data; } // sin columnas nuevas aún
    perfil = data || null;
    if (perfil && FWM.heroe) { FWM.heroe.fusionar(perfil.heroe); }
    return perfil;
  }

  // Alta: correo, contraseña y nombre visible. Si no exige confirmación, ya queda dentro.
  async function registrar(correo, clave, nombre) {
    const { data, error } = await cliente.auth.signUp({ email: correo, password: clave, options: { data: { nombre } } });
    if (error) throw error;
    usuario = data.user; if (data.session) await cargarPerfil();
    await enviarPendientes();
    return usuario;
  }
  async function entrar(correo, clave) {
    const { data, error } = await cliente.auth.signInWithPassword({ email: correo, password: clave });
    if (error) throw error;
    usuario = data.user; await cargarPerfil();
    await enviarPendientes();
    return usuario;
  }
  async function salir() { if (cliente) await cliente.auth.signOut(); usuario = null; perfil = null; }
  async function recuperar(correo) { const { error } = await cliente.auth.resetPasswordForEmail(correo); if (error) throw error; }
  async function cambiarAvatar(avatar) {
    if (!cliente || !usuario) return;
    const { error } = await cliente.from("perfiles").update({ avatar }).eq("id", usuario.id); if (error) throw error;
    perfil = Object.assign({}, perfil, { avatar });
  }
  // El héroe (clase, mejoras, oro, objetos) y su nivel, para el ranking y para no perderlo al cambiar de aparato.
  async function guardarHeroe(h) {
    if (!cliente || !usuario) return false;
    const nivel = FWM.heroe ? FWM.heroe.nivelJugable() : 1;
    const { error } = await cliente.from("perfiles").update({ heroe: h, nivel, avatar: h.clase }).eq("id", usuario.id);
    if (error) throw error;
    perfil = Object.assign({}, perfil, { heroe: h, nivel, avatar: h.clase });
    return true;
  }
  async function cambiarNombre(nombre) {
    const { error } = await cliente.from("perfiles").update({ nombre }).eq("id", usuario.id); if (error) throw error;
    perfil = Object.assign({}, perfil, { nombre });
  }

  // Envío de una partida. Sin cuenta, se guarda en el aparato y se envía al entrar.
  async function enviarPartida(p) {
    const fila = { puntos: p.puntos | 0, tipo: p.tipo || "rapida", turnos: p.turnos | 0, gano: !!p.gano, semilla: p.semilla | 0, mapa: p.mapa || null };
    if (!cliente || !usuario) { guardarPendiente(Object.assign({ fecha: new Date().toISOString() }, fila)); return false; }
    const { error } = await cliente.from("partidas").insert(Object.assign({ usuario: usuario.id }, fila));
    if (error) { guardarPendiente(fila); throw error; }
    return true;
  }
  function pendientes() { try { return JSON.parse(localStorage.getItem(CLAVE_PENDIENTES) || "[]"); } catch (e) { return []; } }
  function guardarPendiente(fila) { const l = pendientes(); l.push(fila); if (l.length > 50) l.shift(); try { localStorage.setItem(CLAVE_PENDIENTES, JSON.stringify(l)); } catch (e) { /* nada */ } }
  async function enviarPendientes() {
    if (!cliente || !usuario) return 0;
    const l = pendientes(); if (!l.length) return 0;
    const filas = l.map(f => ({ usuario: usuario.id, puntos: f.puntos, tipo: f.tipo, turnos: f.turnos, gano: f.gano, semilla: f.semilla, mapa: f.mapa, fecha: f.fecha || undefined }));
    const { error } = await cliente.from("partidas").insert(filas);
    if (error) return 0;
    try { localStorage.removeItem(CLAVE_PENDIENTES); } catch (e) { /* nada */ }
    return filas.length;
  }

  // Ranking del periodo ('hoy' | 'semana' | 'total') y mi posición.
  async function ranking(periodo, limite, modo, tipo) {
    const { data, error } = await cliente.rpc("ranking", { periodo: periodo || "semana", limite: limite || 50, modo: modo || "suma", tipo_partida: tipo || null });
    if (error) throw error;
    return data || [];
  }
  // ---------- duelos: Elo, liga semanal, historial, retos pendientes ----------
  async function registrarDuelo(d) { // { clave, anfitrion, invitado, ganador, motivo, delta, eloAnfitrion, eloInvitado }
    if (!cliente || !usuario) return false;
    const { error } = await cliente.from("duelos").insert({ clave: d.clave, anfitrion: d.anfitrion, invitado: d.invitado, ganador: d.ganador, motivo: d.motivo || null, delta: d.delta | 0, elo_anfitrion: d.eloAnfitrion | 0, elo_invitado: d.eloInvitado | 0 });
    if (error && error.code !== "23505") throw error; // 23505: ya lo guardó el otro
    return true;
  }
  async function cambiarElo(elo) {
    if (!cliente || !usuario) return;
    const { error } = await cliente.from("perfiles").update({ elo: elo | 0 }).eq("id", usuario.id); if (error) throw error;
    perfil = Object.assign({}, perfil, { elo: elo | 0 });
  }
  async function rankingDuelos(limite) { const { data, error } = await cliente.rpc("ranking_duelos", { limite: limite || 50 }); if (error) throw error; return data || []; }
  async function ligaSemanal(semana, limite) { const { data, error } = await cliente.rpc("liga_semanal", { semana: semana || null, limite: limite || 50 }); if (error) throw error; return data || []; }
  async function misDuelos(limite) {
    if (!cliente || !usuario) return [];
    const { data, error } = await cliente.from("duelos").select("id, anfitrion, invitado, ganador, motivo, delta, fecha, a:perfiles!duelos_anfitrion_fkey(nombre, avatar, nivel), i:perfiles!duelos_invitado_fkey(nombre, avatar, nivel)").or(`anfitrion.eq.${usuario.id},invitado.eq.${usuario.id}`).order("fecha", { ascending: false }).limit(limite || 20);
    if (error) throw error; return data || [];
  }
  async function crearReto(para, codigo) { if (!cliente || !usuario) return false; const { error } = await cliente.from("retos_pendientes").insert({ de: usuario.id, para, codigo }); if (error) throw error; return true; }
  async function retosPendientes() {
    if (!cliente || !usuario) return [];
    const desde = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data, error } = await cliente.from("retos_pendientes").select("id, de, codigo, fecha, p:perfiles!retos_pendientes_de_fkey(nombre, avatar, nivel)").eq("para", usuario.id).gte("fecha", desde).order("fecha", { ascending: false });
    if (error) return []; return data || [];
  }
  async function borrarReto(id) { if (!cliente || !usuario) return; await cliente.from("retos_pendientes").delete().eq("id", id); }
  async function marcarLigaReclamada(semana) { if (!cliente || !usuario) return; await cliente.from("perfiles").update({ liga_reclamada: semana }).eq("id", usuario.id); perfil = Object.assign({}, perfil, { liga_reclamada: semana }); }
  // Medir: cinco momentos, anónimos (id de aparato al azar), para saber dónde se va la gente. Sin bloquear nada.
  function aparato() { try { let a = localStorage.getItem("fwm.aparato"); if (!a) { a = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); localStorage.setItem("fwm.aparato", a); } return a; } catch (e) { return "x"; } }
  function evento(tipo, datos) {
    if (!cliente) return;
    try { cliente.from("eventos").insert({ aparato: aparato(), usuario: usuario ? usuario.id : null, tipo, datos: datos || {} }).then(() => {}, () => {}); } catch (e) { /* nada */ }
  }
  async function miRanking(periodo, modo, tipo) {
    if (!usuario) return null;
    const { data, error } = await cliente.rpc("mi_ranking", { periodo: periodo || "semana", modo: modo || "suma", tipo_partida: tipo || null });
    if (error) return null;
    return data && data[0] ? data[0] : null;
  }

  // Mensajes de error legibles.
  function textoError(e, T) {
    const m = (e && e.message) || String(e);
    if (/already registered|already exists/i.test(m)) return T.errCorreoUsado;
    if (/Invalid login credentials/i.test(m)) return T.errCredenciales;
    if (/Password should be at least/i.test(m)) return T.errClaveCorta;
    if (/valid email|invalid format/i.test(m)) return T.errCorreo;
    if (/rate limit|too many/i.test(m)) return T.errDemasiado;
    if (/fetch|network|Failed/i.test(m)) return T.errRed;
    return m;
  }

  // Héroes de una lista de usuarios (para dibujarlos en el ranking): { id: { heroe, nivel } }
  async function perfilesDe(ids) {
    if (!cliente || !ids || !ids.length) return {};
    const { data, error } = await cliente.from("perfiles").select("id, heroe, nivel").in("id", ids.slice(0, 60)); if (error) throw error;
    const m = {}; for (const p of data || []) m[p.id] = p; return m;
  }
  // Borrar la cuenta y todo lo asociado (función SQL parte 9). Después se cierra la sesión.
  async function borrarCuenta() {
    if (!cliente || !usuario) throw new Error("sin sesion");
    const { error } = await cliente.rpc("borrar_mi_cuenta"); if (error) throw error;
    try { await cliente.auth.signOut(); } catch (e) { /* la cuenta ya no existe */ }
    usuario = null; perfil = null;
    return true;
  }
  return { borrarCuenta, perfilesDe, cliente: () => cliente, iniciar, disponible, posible, registrar, guardarHeroe, evento, registrarDuelo, cambiarElo, rankingDuelos, ligaSemanal, misDuelos, crearReto, retosPendientes, borrarReto, marcarLigaReclamada, entrar, salir, recuperar, cambiarNombre, cambiarAvatar, enviarPartida, enviarPendientes, pendientes, ranking, miRanking, textoError,
    usuario: () => usuario, perfil: () => perfil, nombre: () => (perfil && perfil.nombre) || (usuario && usuario.user_metadata && usuario.user_metadata.nombre) || "" };
})();
