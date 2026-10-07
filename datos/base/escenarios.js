// Grandes escenarios (6 sep 2026): mapas históricos grandes donde cada reino empieza en su tierra.
// Mismas reglas que siempre; lo que cambia es el tamaño, el número de reinos y la duración.
// El jugador elige su bando y con él dónde empieza; los rivales cogen los bandos que quedan en ese mapa.
window.FWM = window.FWM || {};
FWM.datosBase = FWM.datosBase || {};

FWM.datosBase.escenarios = [
  { id: "europa", mapa: "europa", nombre: "Europa", turnos: 60, rivalesMin: 3, rivalesMax: 7, rivalesPorDefecto: 6,
    texto: "De Iberia a Constantinopla. Doce coronas posibles y un continente entero para repartirse." },
  { id: "iberia", mapa: "iberia", nombre: "La Península", turnos: 40, rivalesMin: 2, rivalesMax: 4, rivalesPorDefecto: 4,
    texto: "Cinco coronas en una península. Cada frontera es una guerra a medio terminar." },
  { id: "britannia", mapa: "britannia", nombre: "Britannia", turnos: 40, rivalesMin: 2, rivalesMax: 3, rivalesPorDefecto: 3,
    texto: "Escocia, Inglaterra, los nórdicos de Dublín y el continente al otro lado del canal." },
];
