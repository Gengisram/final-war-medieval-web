// Mapas hechos a mano (6 sep 2026). Mismo formato que los del generador:
//   { ancho, alto, hexes: { "q,r": { terreno, yacimiento } }, inicios: ["q,r", ...], nombre }
// Se escriben como dibujo: una fila por línea, las filas impares van medio hexágono a la derecha (igual que en pantalla).
//   ~ agua   . llanura   f bosque   c colina   M montaña   o mina de oro   * punto clave   1-4 capitales
// Los puntos clave a menos de 3 de una capital desaparecen en las partidas de solo oro: se ponen lejos a propósito.
window.FWM = window.FWM || {};

FWM.mapasHechos = (function () {
  const H = () => FWM.hex;

  const MAPAS = {
    hoz: { nombre: "La Hoz", texto: "Un río parte la tierra en dos; solo hay dos vados.", filas: [
      "~~~~~~~~~~~~~",
      "~.f...~..c..~",
      "~.1.o.~.o.3.~",
      "~...c.~~....~",
      "~.......M...~",
      "~.f.M.*.*.f.~",
      "~....~~.c...~",
      "~.4.o.~.o.2.~",
      "~..c..~...f.~",
      "~~~~~~~~~~~~~",
    ] },
    torres: { nombre: "Las Cuatro Torres", texto: "Cuatro reinos en las esquinas y la riqueza en el centro.", filas: [
      "~~~~~~~~~~~~~",
      "~.1.....c.3.~",
      "~..o.f...o..~",
      "~.c...*.....~",
      "~...M.o.M.f.~",
      "~.f.*.....*.~",
      "~...M.o.M...~",
      "~.....*...c.~",
      "~..o...f.o..~",
      "~.4.c.....2.~",
      "~~~~~~~~~~~~~",
    ] },
    isla: { nombre: "La Isla", texto: "Un lago en medio; los puentes de tierra deciden la partida.", filas: [
      "~~~~~~~~~~~~~",
      "~.1.....c.3.~",
      "~..o.f...o..~",
      "~....~~~....~",
      "~.*.~~~~~.*.~",
      "~...~~~~~.f.~",
      "~.*..~~~..*.~",
      "~...f.......~",
      "~..o...f..o.~",
      "~.4.c.....2.~",
      "~~~~~~~~~~~~~",
    ] },
    sierra: { nombre: "Paso de la Sierra", texto: "Una cordillera cruza el mapa; hay que pasar por los puertos.", filas: [
      "~~~~~~~~~~~~~",
      "~.1...f...3.~",
      "~..o.....o..~",
      "~.c...*.....~",
      "~M.MM.o..MM.~",
      "~...M...M...~",
      "~.*...o...*.~",
      "~.....f.c...~",
      "~..o.....o..~",
      "~.4.c.....2.~",
      "~~~~~~~~~~~~~",
    ] },
    costa: { nombre: "Costa Brava", texto: "Una franja de tierra entre el mar y las montañas.", filas: [
      "~~~~~~~~~~~~~~~",
      "~~~.1....f....~",
      "~~..o..c...3..~",
      "~......*.M.o..~",
      "~...*........*~",
      "~......M......~",
      "~.2.....*.....~",
      "~.o.c......4..~",
      "~~..f.....o..~~",
      "~~~~~~~~~~~~~~~",
    ] },
    // ---- Grandes escenarios (rehechos el 7 sep 2026 desde coordenadas reales: cada costa se dibujó
    // proyectando latitud y longitud sobre la rejilla, con la misma escala en los dos ejes: unos 67 km
    // por hexágono en Europa, 35 en la Península y 24 en Britannia. Las cordilleras y los bosques van
    // por donde van de verdad. Única licencia: como no hay barcos, las islas se unen por un paso de
    // tierra donde la historia cruzaba en barca (Calais, y el canal del Norte entre Escocia e Irlanda).
    // Letras = capital de un bando (ver `bandos`), puesta en su ciudad real.
    europa: { nombre: "Europa", grande: true, escenario: true,
      texto: "De Iberia a Constantinopla. Doce reinos posibles, un continente entero y sitio de sobra para equivocarse.",
      bandos: { E: "escocia", I: "inglaterra", N: "noruega", F: "francia", C: "castilla", A: "aragon", S: "sacro_imperio", V: "venecia", L: "polonia", H: "hungria", B: "bizancio", P: "portugal" },
      filas: [
        "~~~~~~~~~~o.......o......*",
        "~~~~~~~~~...oo...........~",
        "~~~~~~~~~~...Nc....~...f.o",
        "~~~~~~~~~~.M.c...*~..ff..~",
        "~~~~~~~~~~.M.c....~~......",
        "~~~~~~~~~~.cc....~~~.....~",
        "~~~~~~~~~~*c.....o~~~~....",
        "~~~~~~~~~~.o~....~~~~...*~",
        "~~~~o~~~~~~~~~...~~~~~....",
        "~~~oE~~~~~~~.~..~~~~~..ff~",
        "~~~~..~~~~~~.~~.~~~~..ffo.",
        "~o...~~~~~~~.~~~~~~.fff..~",
        "~..~~..~~~~~...~~o..ff....",
        "~..~...~~~o..ff..........~",
        "~*.~..oo~~Soffffff.......*",
        "~~~~~.Io~.........oo.....~",
        "~~~~~~~~....cccc...L......",
        "~~~~~.~.oo.c.....MM......~",
        "~~~~.....F.f.......MM.....",
        "~~~~..ff...*.....oo.M...o~",
        "~~~~~~......MMMM..H..M...~",
        "~~~~~~....MM.oo......MM.~~",
        "~~~~~~..ccM...V~..o..M..~~",
        "~~~~~~....o~c.~~c.......~~",
        "~~ccoMMo..~~~cc~~cc.....~~",
        "~....oAM~~~~~.c~~~c....o~~",
        "~~......~~~~~~~c.~~c...oBo",
        "~*.oo..~~~~~~~~c.~~c~....~",
        "~...C..~~~~~~~~~.~~cc~~...",
        "~o....~~~~~~~~~.~~~..~~.*~",
        "~Po.cc~~~~~~~~*.~~~~o~~~~~",
        "~~o..~~~~~~~~~~~~~~~~~~~~~",
        "~~~~~~~~~~~~~~~~~~~~~~~~~~",
      ] },
    iberia: { nombre: "La Península", grande: true, escenario: true,
      texto: "Cinco coronas en una península. Cada frontera es una guerra a medio terminar.",
      bandos: { P: "portugal", C: "castilla", A: "aragon", G: "granada", F: "francia" },
      filas: [
        "~~~~~~~~~~~~~o.....*",
        "~~~~~~~~~~~~..ff...~",
        "~~~~~~~~~~~~....oo.o",
        "~~*....o...M....F..~",
        "~o..ccccccc*MMcM...~",
        "~.fff.......oo.MMM~~",
        "~~........cc.A....~~",
        "~~........cc....*~~~",
        "~~......MM.cco..~~~~",
        "~~f..MMMo..cc..~~~~~",
        "~~.ff.ooC.....~~~~~~",
        "~o.f.........~~~~~~~",
        "~Po.....cc..c.~~~~~~",
        "~~..ccccoo.cc~~~~~~~",
        "~~o......G.c.~~~~~~~",
        "~*.......MM*~~~~~~~~",
        "~~~~~......~~~~~~~~~",
        "~~~~~~o~~~~~~~~~~~~~",
        "~~~~~~~~~~~~~~~~~~~~",
      ] },
    britannia: { nombre: "Britannia", grande: true, escenario: true,
      texto: "Escocia, Inglaterra, los nórdicos de Dublín y el continente al otro lado del canal.",
      bandos: { E: "escocia", I: "inglaterra", N: "noruega", F: "francia" },
      filas: [
        "~~~~~~~~~~~~~~~~~~~~~~~~",
        "~~~~~~~~~~*.o~~~~~~~~~~~",
        "~~~~~~~~~~....~~~~~~~~~~",
        "~~~~~~~~~M....~~~~~~~~~~",
        "~~~~~~~~~.c....~~~~~~~~~",
        "~~~~~~~~.MM...~~~~~~~~~~",
        "~~~~~~~~~.Mcc.~~~~~~~~~~",
        "~~~~~~~~~Mcoo.~~~~~~~~~~",
        "~~~~~~~~~.ccE.~~~~~~~~~~",
        "~~~~~~~~~.....~~~~~~~~~~",
        "~~~~~~~~~.....~~~~~~~~~~",
        "~~~~~~~~..ccc.~~~~~~~~~~",
        "~~~~*..~..~oc..~~~~~~~~~",
        "~~~~....~~~~.c.~~~~~~~~~",
        "~~~~....~~~~..c.~~~~~~~~",
        "~~c.....~~~~*c..o~~~~~~~",
        "~~o.....~~~~~.c..~~~~~~~",
        "~~c...oo~~~~.cc..~~~~~~~",
        "~~~..f.N~~~.......~~~~~~",
        "~~...f.o~~M....f..~~~~~~",
        "~~....f.~~~M...ff...~~~~",
        "~*.....~~~.c........~~~~",
        "~~.....~~~..c.......~~~~",
        "~~~~~~~~~..c..ocoo.~~~~~",
        "~~~~~~~~~~~~.....I..~~~~",
        "~~~~~~~~~~.......f..~.*~",
        "~~~~~~~~~~......ff~~....",
        "~~~~~~~~~o..~~~~~~~....~",
        "~~~~~~~~~*~~~~~~~~~..f..",
        "~~~~~~~~~~~~~~~~~~..f..~",
        "~~~~~~~~~~~~~~~~~~.oo...",
        "~~~~~~~~~~~~~~~~~~~F..o~",
      ] },
    // ---- Modo Bárbaros: una arena. El defensor empieza en el centro y las hordas entran por los bordes.
    // Hay DOS inicios pegados en el medio: el segundo queda listo para el modo cooperativo (dos defensores
    // uno al lado del otro); en la partida de un jugador solo se usa el primero.
    arena: { nombre: "La Empalizada", grande: false, arena: true,
      texto: "Un valle abierto por los cuatro costados. Nadie viene a ayudar.",
      filas: [
        "...............",
        "...c...f...c...",
        "..f..o...o..f..",
        ".....c...c.....",
        "..o....1....o..",
        "...c.......c...",
        "....o..2..o....",
        "...c.......c...",
        "..o....f....o..",
        ".....c...c.....",
        "..f..o...o..f..",
        "...c...f...c...",
        "...............",
      ] },
  };

  // nombres viejos que siguen guardados en partidas y revanchas de antes del 7 sep 2026
  const ALIAS = { islas: "britannia" };

  function parsear(id) {
    const def = MAPAS[id] || MAPAS[ALIAS[id]]; if (!def) return null;
    const hexes = {}; const inicios = []; const porBando = {};
    def.filas.forEach((fila, r) => {
      [...fila].forEach((ch, c) => {
        const k = H().clave(c - Math.floor(r / 2), r);
        let terreno = "llanura", yacimiento = null;
        if (ch === "~") terreno = "agua"; else if (ch === "f") terreno = "bosque"; else if (ch === "c") terreno = "colina"; else if (ch === "M") terreno = "montana";
        else if (ch === "o") yacimiento = "mina_oro"; else if (ch === "*") yacimiento = "punto_clave";
        else if (ch >= "1" && ch <= "4") inicios[Number(ch) - 1] = k;
        else if (def.bandos && def.bandos[ch]) { porBando[def.bandos[ch]] = k; inicios.push(k); } // escenarios: cada bando empieza en su tierra
        hexes[k] = { terreno, yacimiento };
      });
    });
    return { ancho: def.filas[0].length, alto: def.filas.length, hexes, inicios: inicios.filter(Boolean), porBando, nombre: def.nombre, hecho: id, semilla: 0 };
  }

  return { MAPAS, parsear, ids: () => Object.keys(MAPAS) };
})();
