// Medallas: se comprueban al acabar cada partida. Cada una recibe un contexto
// { res: resultado de la partida, r: récords ya actualizados, estado, datos, humano }.
// Dos clases (decisión del 5 sep 2026):
//  - únicas: `cumple(c)` devuelve true y se ganan una vez.
//  - con niveles (bronce / plata / oro): `valor(c)` mide algo y `niveles` son los tres umbrales;
//    `menor: true` cuando menos es mejor (Relámpago: turno de victoria). `descripcion` lleva {n} para el umbral.
// Se guardan en los récords locales (r.medallas = { id: { nivel, fecha } }).
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.medallas = [
  // premio: oro del héroe por nivel (o único) y, si hay, objeto al alcanzar un nivel (objeto: { nivel, id }).
  { id: "primera_victoria", nombre: "Primera victoria", icono: "laurel", descripcion: "Gana tu primera partida.", cumple: (c) => c.res.gano, premio: { oro: [10] } },
  { id: "intacto", nombre: "Ni un rasguño", icono: "escudo", descripcion: "Gana contra 3 rivales (o un duelo) sin perder ninguna tropa.", cumple: (c) => c.res.gano && !c.res.abandonoRival && (c.res.perdidas || 0) === 0 && ((c.res.rivales || 0) >= 3 || c.res.tipo === "duelo"), premio: { oro: [40], objeto: { nivel: 1, id: "escudo_torre" } } },
  { id: "del_dia", nombre: "Rey del día", icono: "sol", descripcion: "Mapas del día ganados: {n}.", niveles: [1, 5, 20], valor: (c) => c.r.diasGanados || 0, premio: { oro: [20, 60, 150], objeto: { nivel: 3, id: "corona_laurel" } } },
  { id: "relampago", nombre: "Relámpago", icono: "rayo", descripcion: "Gana antes del turno {n}.", niveles: [12, 8, 5], menor: true, valor: (c) => c.res.gano && !c.res.abandonoRival ? c.res.turnos : null, premio: { oro: [15, 50, 150], objeto: { nivel: 3, id: "caballo" } } },
  { id: "carnicero", nombre: "Carnicero", icono: "espadas", descripcion: "Mata {n} tropas enemigas en una partida.", niveles: [8, 15, 25], valor: (c) => c.res.matadas || 0, premio: { oro: [15, 50, 150], objeto: { nivel: 3, id: "espada_capitan" } } },
  { id: "estratega", nombre: "Estratega", icono: "estrella", descripcion: "Acaba una partida con {n} puntos clave.", niveles: [3, 5, 7], valor: (c) => c.res.puntosClave || 0, premio: { oro: [15, 50, 150] } },
  { id: "conquistador", nombre: "Conquistador", icono: "castillo", descripcion: "Toma {n} asentamientos en una partida.", niveles: [2, 3, 5], valor: (c) => c.res.conquistas || 0, premio: { oro: [15, 50, 150] } },
  { id: "racha5", nombre: "Imparable", icono: "llama", descripcion: "Gana {n} partidas seguidas.", niveles: [3, 6, 12], valor: (c) => c.r.racha || 0, premio: { oro: [20, 60, 200] } },
  { id: "fuego7", nombre: "Constancia", icono: "siete", descripcion: "Juega {n} días seguidos.", niveles: [5, 15, 45], valor: (c) => c.r.rachaDias || 0, premio: { oro: [20, 60, 200] } },
  { id: "tres_bandos", nombre: "Diplomático", icono: "banderines", descripcion: "Gana con {n} bandos distintos.", niveles: [2, 4, 6], valor: (c) => Object.keys(c.r.ganadasPorBando || {}).length, premio: { oro: [15, 50, 150], objeto: { nivel: 3, id: "capa_embajador" } } },
  { id: "veterano", nombre: "Veterano", icono: "cien", descripcion: "Juega {n} partidas.", niveles: [20, 150, 600], valor: (c) => c.r.partidas || 0, premio: { oro: [15, 60, 250] } },
  { id: "cazador", nombre: "Cazador", icono: "diana", descripcion: "Héroes rivales abatidos: {n}.", niveles: [1, 10, 50], valor: (c) => c.r.heroesMatados || 0, premio: { oro: [15, 50, 150] } },
  { id: "duelista", nombre: "Duelista", icono: "guante", descripcion: "Duelos ganados contra otros jugadores: {n}.", niveles: [1, 10, 50], valor: (c) => c.r.duelosGanados || 0, premio: { oro: [20, 80, 250] } },
  { id: "implacable", nombre: "Domador", icono: "espadas", descripcion: "Partidas ganadas en difícil: {n}.", niveles: [1, 10, 40], valor: (c) => c.r.ganadasDificil || 0, premio: { oro: [20, 80, 250] } },
  { id: "campana", nombre: "Cronista", icono: "laurel", descripcion: "Supera {n} mapas de la campaña.", niveles: [3, 6, 10], valor: (c) => c.r.campana || 0, premio: { oro: [20, 60, 200] } },
];

// Utilidades comunes a la pantalla y a los récords.
FWM.medallas = {
  maxNivel: (m) => (m.niveles ? m.niveles.length : 1),
  // Nivel que alcanza este contexto (0 = nada).
  nivelAlcanzado(m, c) {
    try {
      if (m.cumple) return m.cumple(c) ? 1 : 0;
      const v = m.valor(c); if (v == null) return 0;
      let n = 0; for (const u of m.niveles) if (m.menor ? v <= u : v >= u) n++;
      return n;
    } catch (e) { return 0; }
  },
  // Nivel guardado en los récords (admite el formato viejo: fecha en texto = ganada, nivel 1).
  nivelGuardado(r, id) { const g = r && r.medallas && r.medallas[id]; if (!g) return 0; return typeof g === "string" ? 1 : (g.nivel || 0); },
  nombre(m, nivel, T) { return m.nombre + (m.niveles && nivel > 0 ? " · " + T.nivelesMedalla[nivel - 1] : ""); },
  // Descripción del objetivo: el siguiente umbral (o el último, si ya está al máximo).
  descripcion(m, nivel) { if (!m.niveles) return m.descripcion; const i = Math.min(nivel, m.niveles.length - 1); return m.descripcion.replace("{n}", m.niveles[i]); },
};
