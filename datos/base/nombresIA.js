// Nombres de los jugadores IA. Cada IA es un jugador con nombre propio que juega con un bando
// (no es el bando en sí). Se reparten al azar con la semilla de la partida, sin repetir.
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.nombresIA = [
  "Sancho", "Urraca", "Beltrán", "Mencía", "Nuño", "Aldonza", "Rodrigo", "Elvira", "Gonzalo", "Jimena",
  "Fadrique", "Leonor", "Ordoño", "Teresa", "Ramiro", "Berenguela", "Íñigo", "Constanza", "Lope", "Sol",
  "Edmund", "Matilda", "Godfrey", "Aveline", "Roland", "Adela", "Thibault", "Isolde", "Wei", "Lian",
  "Harun", "Zaynab", "Tariq", "Layla", "Itzel", "Cuauhtli", "Xóchitl", "Tlaloc", "Bertrand", "Ermesinda",
];

// Nombres de los jefes rivales según su cultura (14 sep 2026): antes un rey noruego podía llamarse Teresa y
// un señor cruzado, Tlaloc. La clave es la facción o el bando del rival; si no hay lista, se usa la general.
FWM.datosBase.nombresPorCultura = {
  castilla: ["Sancho", "Urraca", "Beltrán", "Mencía", "Nuño", "Aldonza", "Rodrigo", "Elvira", "Gonzalo", "Jimena", "Fadrique", "Leonor", "Ordoño", "Teresa", "Ramiro", "Berenguela"],
  aragon: ["Jaume", "Peronella", "Pere", "Elisenda", "Ramon", "Dolça", "Berenguer", "Sibil·la"],
  portugal: ["Afonso", "Mafalda", "Dinis", "Beatriz", "Fernão", "Inês", "Sancho", "Urraca"],
  granada: ["Yusuf", "Aixa", "Muhammad", "Zoraida", "Abu Said", "Maryam", "Ismail", "Fátima"],
  vikingos: ["Ragnar", "Sigrid", "Björn", "Astrid", "Leif", "Ingrid", "Halfdan", "Gunnhild", "Erik", "Thyra", "Sven", "Freydis", "Ivar", "Ragnhild"],
  noruega: ["Ragnar", "Sigrid", "Björn", "Astrid", "Leif", "Ingrid", "Halfdan", "Gunnhild", "Erik", "Thyra", "Sven", "Freydis", "Ivar", "Ragnhild"],
  inglaterra: ["Edmund", "Matilda", "Godfrey", "Aveline", "Roger", "Adela", "Hugh", "Isabel", "Walter", "Joan", "Geoffrey", "Alice"],
  francia: ["Roland", "Blanche", "Thibault", "Ermengarde", "Bertrand", "Béatrice", "Raymond", "Sibylle", "Amaury", "Aliénor", "Guy", "Mahaut"],
  escocia: ["Malcolm", "Margaret", "Duncan", "Isobel", "Angus", "Mairi", "Donald", "Ethna"],
  sacro_imperio: ["Konrad", "Gertrud", "Otto", "Adelheid", "Heinrich", "Mechthild", "Lothar", "Kunigunde"],
  polonia: ["Bolesław", "Dobrawa", "Mieszko", "Rycheza", "Kazimierz", "Jadwiga", "Władysław", "Salomea"],
  hungria: ["Béla", "Gizella", "Géza", "Ilona", "László", "Erzsébet", "Kálmán", "Piroska"],
  bizancio: ["Alexios", "Anna", "Isaakios", "Zoe", "Nikephoros", "Theodora", "Manuel", "Eudokia"],
  venecia: ["Enrico", "Chiara", "Marco", "Lucia", "Pietro", "Beatrice", "Domenico", "Agnese"],
  mali: ["Fakoli", "Kankou", "Tiramakan", "Nana", "Siriman", "Assétou", "Bakary", "Djénéba", "Kandia", "Aminata", "Faran", "Fanta"],
  saladino: ["Harun", "Zaynab", "Tariq", "Layla", "Karim", "Fátima", "Omar", "Aisha", "Hasan", "Samira", "Nur", "Yasmin"],
  abasi: ["Harun", "Zaynab", "Tariq", "Layla", "Karim", "Fátima", "Omar", "Aisha", "Hasan", "Samira"],
  eslavos: ["Dobroslav", "Milena", "Radomir", "Ljuba", "Bogdan", "Zora", "Stojan", "Mira", "Velimir", "Dragana", "Svetozar", "Snežana", "Dobrava", "Radim"],
  avaros: ["Targitio", "Kandik", "Apsij", "Solaj", "Bokolabra", "Kutriguro", "Uarjón", "Baján", "Kunimon", "Zabergán"],
  mongoles: ["Jebe", "Khulan", "Batu", "Alaqai", "Arslan", "Oyuun", "Bataar", "Sarnai", "Temür", "Altani", "Mönke", "Checheg"],
  ming: ["Wei", "Lian", "Zhao", "Mei", "Jun", "Xiu", "Hong", "Ying"],
  azteca: ["Itzel", "Cuauhtli", "Xóchitl", "Tlaloc", "Citlali", "Tenoch", "Yaretzi", "Ahuizotl"],
};
