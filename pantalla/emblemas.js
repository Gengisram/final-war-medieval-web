// Escudos de las facciones (13 sep 2026): un blasón sencillo por facción, dibujado aquí mismo en SVG (sin
// imágenes de fuera). Se usan en la elección de facción, la tienda, el ranking y el menú.
//   castillo (Castilla) · barco largo (vikingos) · león (Inglaterra) · sol (Malí) · águila (Saladino) · arco (mongoles)
window.FWM = window.FWM || {};

FWM.emblemas = (function () {
  const ORO = "#f2c230", TINTA = "#2a2419";
  const ESCUDO = "M10 8 H90 V46 C90 72 72 87 50 95 C28 87 10 72 10 46 Z";
  const SIMBOLOS = {
    castillo: `<path d="M30 70 V44 H26 V34 H33 V39 H38 V34 H45 V39 H55 V34 H62 V39 H67 V34 H74 V44 H70 V70 Z" fill="${ORO}" stroke="${TINTA}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M44 70 V58 a6 6 0 0 1 12 0 V70 Z" fill="${TINTA}"/><rect x="34" y="48" width="5" height="7" fill="${TINTA}"/><rect x="61" y="48" width="5" height="7" fill="${TINTA}"/>`,
    // drakkar (14 sep 2026): antes se leía como una sonrisa con rayas. Ahora casco de madera grueso con cabeza
    // de dragón y cola enroscada, escudos redondos en la borda, vela cuadrada hinchada a rayas y olas debajo.
    barco: `<path d="M29 77 Q36 73 43 77 T57 77 T71 77" fill="none" stroke="#9fd3ff" stroke-width="3" stroke-linecap="round"/>
      <path d="M50 58 V20" stroke="${TINTA}" stroke-width="3"/>
      <path d="M31 24 H69 Q73 38 69 52 H31 Q27 38 31 24 Z" fill="#f4efe2" stroke="${TINTA}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M40.5 24.5 Q38 38 40.5 51.5 H49 V24.5 Z M59.5 24.5 Q62 38 59.5 51.5 H51 V24.5 Z" fill="#b3261e"/>
      <path d="M31 24 H69 Q73 38 69 52 H31 Q27 38 31 24 Z" fill="none" stroke="${TINTA}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M18 56 H82 Q78 70 64 71 H36 Q22 70 18 56 Z" fill="#8a5a2a" stroke="${TINTA}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M18 56 Q12 46 16 36 Q20 30 25 33 Q22 36 24 38 L20 40 Q18 48 22 56 Z" fill="#8a5a2a" stroke="${TINTA}" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="21" cy="35" r="1.4" fill="${ORO}"/>
      <path d="M82 56 Q90 48 86 40 Q82 36 79 40 Q83 42 82 47 Q81 51 78 56 Z" fill="#8a5a2a" stroke="${TINTA}" stroke-width="2" stroke-linejoin="round"/>
      ${[30, 42, 54, 66].map((cx, k) => `<circle cx="${cx + 2}" cy="61" r="5" fill="${k % 2 ? ORO : "#f4efe2"}" stroke="${TINTA}" stroke-width="1.5"/><circle cx="${cx + 2}" cy="61" r="1.3" fill="${TINTA}"/>`).join("")}`,
    leon: `<circle cx="50" cy="48" r="20" fill="${ORO}" stroke="${TINTA}" stroke-width="2"/>
      <path d="M50 22 l4 8 8-4 -1 9 9 1 -5 7 7 6 -9 2 2 9 -9-3 -3 8 -3-8 -9 3 2-9 -9-2 7-6 -5-7 9-1 -1-9 8 4 Z" fill="${ORO}" stroke="${TINTA}" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="50" cy="50" r="12" fill="#e7b84a" stroke="${TINTA}" stroke-width="1.5"/>
      <circle cx="45.5" cy="47" r="1.8" fill="${TINTA}"/><circle cx="54.5" cy="47" r="1.8" fill="${TINTA}"/>
      <path d="M47 53 Q50 56 53 53 M50 51 V53" fill="none" stroke="${TINTA}" stroke-width="1.6" stroke-linecap="round"/>`,
    sol: `<g stroke="#fff1b8" stroke-width="4" stroke-linecap="round">${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<path d="M${(50 + Math.cos(a) * 17).toFixed(1)} ${(48 + Math.sin(a) * 17).toFixed(1)} L${(50 + Math.cos(a) * 27).toFixed(1)} ${(48 + Math.sin(a) * 27).toFixed(1)}"/>`; }).join("")}</g>
      <circle cx="50" cy="48" r="13" fill="#fff1b8" stroke="${TINTA}" stroke-width="2"/><circle cx="50" cy="48" r="6" fill="none" stroke="${TINTA}" stroke-width="1.5"/>`,
    media_luna: `<path d="M50 24 L56 34 H44 Z" fill="${ORO}" stroke="${TINTA}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M50 34 C44 38 42 44 44 50 C38 46 28 40 20 42 C24 50 34 56 44 56 C40 62 40 70 46 74 L50 66 L54 74 C60 70 60 62 56 56 C66 56 76 50 80 42 C72 40 62 46 56 50 C58 44 56 38 50 34 Z" fill="${ORO}" stroke="${TINTA}" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="50" cy="40" r="2" fill="${TINTA}"/>`,
    // roble con bellotas (15 sep 2026, tribus eslavas): el árbol sagrado del trueno en todas sus tierras
    roble: `<path d="M50 80 V56 M50 64 L40 56 M50 60 L60 52" stroke="#5a3a1e" stroke-width="6" stroke-linecap="round"/>
      <path d="M50 20 C62 18 72 26 72 36 C80 38 82 50 74 55 C74 64 64 66 58 61 C54 66 46 66 42 61 C36 66 26 64 26 55 C18 50 20 38 28 36 C28 26 38 18 50 20 Z" fill="#6fa84a" stroke="${TINTA}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M40 34 Q44 40 38 46 M58 30 Q54 38 60 44 M50 46 Q46 52 52 56" fill="none" stroke="#3f7a2a" stroke-width="2" stroke-linecap="round"/>
      ${[[34, 52], [66, 50], [50, 36]].map(([ax, ay]) => `<ellipse cx="${ax}" cy="${ay + 2}" rx="3.6" ry="4.4" fill="${ORO}" stroke="${TINTA}" stroke-width="1.3"/><path d="M${ax - 4} ${ay - 1} h8" stroke="#6b4a2b" stroke-width="3" stroke-linecap="round"/>`).join("")}
      <path d="M36 82 H64" stroke="#5a3a1e" stroke-width="4" stroke-linecap="round"/>`,
    arco: `<path d="M36 22 C22 34 26 44 34 48 C26 52 22 62 36 74" fill="none" stroke="${ORO}" stroke-width="5" stroke-linecap="round"/>
      <path d="M36 22 L46 48 L36 74" fill="none" stroke="#f4efe2" stroke-width="1.8"/>
      <path d="M40 48 H78" stroke="#f4efe2" stroke-width="2.5"/><path d="M80 48 L72 43 V53 Z" fill="#f4efe2" stroke="${TINTA}" stroke-width="1"/>
      <path d="M42 48 L36 44 M42 48 L36 52" stroke="#b3261e" stroke-width="2.5" stroke-linecap="round"/>`,
  };

  // SVG del escudo de una facción. gris: apagado (facción que no tienes).
  function svg(faccion, tam, gris) {
    const f = FWM.datosBase.facciones[faccion]; if (!f) return "";
    const color = gris ? "#8f887c" : f.color;
    return `<svg class="emblema${gris ? " gris" : ""}" viewBox="0 0 100 100" width="${tam}" height="${tam}" role="img" aria-label="${f.nombre}">
      <path d="${ESCUDO}" fill="${color}" stroke="${TINTA}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M17 14 H83 V46 C83 67 68 80 50 87 C32 80 17 67 17 46 Z" fill="none" stroke="${gris ? "#bdb5a6" : ORO}" stroke-width="1.5" opacity=".7"/>
      <g${gris ? ' opacity=".55" style="filter:grayscale(1)"' : ""}>${SIMBOLOS[f.emblema] || ""}</g></svg>`;
  }
  function nodo(faccion, tam, gris) { const d = document.createElement("span"); d.className = "emblema-caja"; d.innerHTML = svg(faccion, tam, gris); return d; }
  return { svg, nodo };
})();
