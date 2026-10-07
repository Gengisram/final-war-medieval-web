// Mapas hechos a mano (6 sep 2026). Mismo formato que los del generador:
//   { ancho, alto, hexes: { "q,r": { terreno, yacimiento } }, inicios: ["q,r", ...], nombre }
// Se escriben como dibujo: una fila por línea, las filas impares van medio hexágono a la derecha (igual que en pantalla).
//   ~ agua   . llanura   f bosque   c colina   M montaña   o mina de oro   * punto clave   1-4 capitales
// Los puntos clave a menos de 3 de una capital desaparecen en las partidas de solo oro: se ponen lejos a propósito.
window.FWM = window.FWM || {};

FWM.mapasHechos = (function () {
  const H = () => FWM.hex;

  const MAPAS = {
    hoz: { nombre: "La Hoz", texto: "Un río parte la tierra en dos; solo se cruza por dos pasos.", filas: [
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
    costa: { nombre: "La Costa", texto: "Una franja de tierra entre el mar y las montañas.", filas: [
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
    // ---- Mapas de las campañas de las facciones (13 sep 2026): uno o dos por cultura, con su paisaje.
    // Mismas reglas que los de arriba: cuatro capitales, oro a dos de cada una y los puntos clave lejos.
  fiordo: { nombre: "Los Fiordos", texto: "Brazos de mar que se meten tierra adentro: se pasa por los istmos.", filas: [
      "~~~~~~~~~~~~~",
      "~.1o..~~..3.~",
      "~..c..~~.o..~",
      "~~~~...~..c.~",
      "~.f.*....*.f~",
      "~M~~~.c.~~~M~",
      "~.f.*....*.f~",
      "~.c..~...~~~~",
      "~..o.~~..c..~",
      "~.4..~~.o.2.~",
      "~~~~~~~~~~~~~",
    ] },
    mar_norte: { nombre: "Mar del Norte", texto: "Islas unidas por bancos de arena: quien controla los pasos, controla el mar.", filas: [
      "~~~~~~~~~~~~~",
      "~.1.o~~~.o3.~",
      "~.c..~~~..c.~",
      "~~.........~~",
      "~~~~..*..~~~~",
      "~~f*.~~~.*f~~",
      "~~~~..*..~~~~",
      "~~.........~~",
      "~.c..~~~..c.~",
      "~.4.o~~~.o2.~",
      "~~~~~~~~~~~~~",
    ] },
    marca: { nombre: "La Marca de Gales", texto: "Colinas, bosques cerrados y castillos en cada paso.", filas: [
      "~~~~~~~~~~~~~",
      "~.1..cc..f3.~",
      "~.o.ff..c.o.~",
      "~..c..*...f.~",
      "~.f.cc..M.c.~",
      "~*..f.o.f..*~",
      "~.c.M..cc.f.~",
      "~.f...*..c..~",
      "~.o.c..ff.o.~",
      "~.4f..cc..2.~",
      "~~~~~~~~~~~~~",
    ] },
    evesham: { nombre: "Evesham", texto: "Una curva del río encierra la villa: una sola salida por tierra.", filas: [
      "~~~~~~~~~~~~~",
      "~.1..f...c3.~",
      "~..o...c.o..~",
      "~.c.~~~~~...~",
      "~..~~...~~*.~",
      "~*.~.*o*.~..~",
      "~..~~...~~..~",
      "~.f.~~.~~.c.~",
      "~..o......o.~",
      "~.4..c..f.2.~",
      "~~~~~~~~~~~~~",
    ] },
    niger: { nombre: "El Níger", texto: "El gran río parte la sabana; sus islas son pasos y trampas.", filas: [
      "~~~~~~~~~~~~~",
      "~.1.o...f.3.~",
      "~..f...c..o.~",
      "~....f......~",
      "~~~~.~~~.~~~~",
      "~~~*o.~.*.~~~",
      "~~~~.~~~.~~~~",
      "~.....f.....~",
      "~..o..c..f..~",
      "~.4..f..o.2.~",
      "~~~~~~~~~~~~~",
    ] },
    sabana: { nombre: "La Sabana", texto: "Hierba alta hasta el horizonte y bosquecillos donde esconderse.", filas: [
      "~~~~~~~~~~~~~",
      "~.1.o.....3.~",
      "~.....f..o..~",
      "~.f.*....c..~",
      "~....c..f...~",
      "~.*..f.o..*.~",
      "~...f..c....~",
      "~..c....*.f.~",
      "~..o..f.....~",
      "~.4.....o.2.~",
      "~~~~~~~~~~~~~",
    ] },
    hattin: { nombre: "Los Cuernos de Hattin", texto: "Dos colinas en medio de una llanura seca; el lago queda lejos.", filas: [
      "~~~~~~~~~~~~~",
      "~.1.o....~~~~",
      "~.c....c.~3o~",
      "~...*.....~.~",
      "~.c...cMc...~",
      "~*..o.c.c.*.~",
      "~...cMc...c.~",
      "~.....*.....~",
      "~.o.c....c..~",
      "~.4.....o.2.~",
      "~~~~~~~~~~~~~",
    ] },
    nilo: { nombre: "El Delta del Nilo", texto: "El río se abre en brazos antes de llegar al mar.", filas: [
      "~~~~~~~~~~~~~",
      "~~.1o~~~o3.~~",
      "~~..~~.~~..~~",
      "~~...~.~...~~",
      "~~~...~...~~~",
      "~.f..*o*..f.~",
      "~...~.~.~...~",
      "~.c.~.~.~.c.~",
      "~.o..~.~..o.~",
      "~.4.~...~.2.~",
      "~~~~~~~~~~~~~",
    ] },
    estepa: { nombre: "La Estepa", texto: "Llano sin fin: aquí manda quien llega antes.", filas: [
      "~~~~~~~~~~~~~",
      "~.1.o.....3.~",
      "~........o..~",
      "~...........~",
      "~....*c*....~",
      "~....o......~",
      "~....*c*....~",
      "~...........~",
      "~...o.......~",
      "~.4.....o.2.~",
      "~~~~~~~~~~~~~",
    ] },
    gobi: { nombre: "El Gobi", texto: "Piedra, sierras peladas y oasis donde se juntan todos.", filas: [
      "~~~~~~~~~~~~~",
      "~.1.o..c..3.~",
      "~..c..MM.o..~",
      "~....M......~",
      "~..*c..o.c*.~",
      "~MM..*.*..MM~",
      "~.*c..o..c*.~",
      "~......M....~",
      "~..o.MM..c..~",
      "~.4..c..o.2.~",
      "~~~~~~~~~~~~~",
    ] },
    // ---- Tribus eslavas (15 sep 2026): el bosque viejo y la llanura de los jinetes ávaros
    bosque_viejo: { nombre: "El Bosque Viejo", texto: "Robles y abedules sin fin: quien conoce las sendas, manda.", filas: [
      "~~~~~~~~~~~~~",
      "~.1.ff.f.f3.~",
      "~.o.ff.ff.o.~",
      "~ff..f*.ff..~",
      "~.f.fcf.f.f.~",
      "~*.ff.o.ff.*~",
      "~.f.f.fcf.f.~",
      "~..ff.*.f.ff~",
      "~.o.ff.ff.o.~",
      "~.4.f.f.ff2.~",
      "~~~~~~~~~~~~~",
    ] },
    llanura_avara: { nombre: "La Llanura de los Jinetes", texto: "Hierba abierta hasta el horizonte y el bosque solo en los bordes: aquí mandan los caballos.", filas: [
      "~~~~~~~~~~~~~",
      "~f1.o.....3f~",
      "~ff......off~",
      "~f..........~",
      "~....*c*...f~",
      "~f...o......~",
      "~....*c*...f~",
      "~f..........~",
      "~ff.o.....ff~",
      "~f4.....o.2f~",
      "~~~~~~~~~~~~~",
    ] },
    // ---- Grandes escenarios (rehechos el 7 sep 2026 desde coordenadas reales: cada costa se dibujó
    // proyectando latitud y longitud sobre la rejilla, con la misma escala en los dos ejes: unos 67 km
    // por hexágono en Europa, 35 en la Península y 24 en Britannia. Las cordilleras y los bosques van
    // por donde van de verdad. Única licencia: como no hay barcos, las islas se unen por un paso de
    // tierra donde la historia cruzaba en barca (Calais, y el canal del Norte entre Escocia e Irlanda).
    // Letras = capital de un bando (ver `bandos`), puesta en su ciudad real.
    europa: { nombre: "Europa", grande: true, escenario: true,
      texto: "De Iberia a Constantinopla. Doce reinos posibles, islas de verdad (se cruza en barca) y sitio de sobra para equivocarse.",
      bandos: { E: "escocia", I: "inglaterra", N: "noruega", F: "francia", C: "castilla", A: "aragon", S: "sacro_imperio", V: "venecia", L: "polonia", H: "hungria", B: "bizancio", P: "portugal" },
      filas: [
        "~~~~~~~~~~~~~~~~~~.cM...o.....f.......",
        "~~~~~~~~~~~~~~~~~.Mco.f..~~~~~~~.ff...",
        "~~~~~*.~~~~~~~~~~.McNff.o~~~~~~..f..o.",
        "~~~~~.c.~~~~~~~~~~.Mcof..~~~~~~....*..",
        "~~~~.McE~~~~~~~~~~~.c...~~~.~~~...f...",
        "~~~~~oco.~~~~~~~~~~~..o~~~~~~~~*......",
        "~..~~..c.~~~~~~~~..~~.~~~~~~~~.....f..",
        "~.o.~~.....~~~~~~.o~~~~~~~~~~.........",
        "~.*.~~~.oc..~~~~~...~~~~~.....o.......",
        "~~.~~~~.oI..~~~...f.......f.......o...",
        "~~~~~~~.....~~..o..ff.oS....ff.oL.....",
        "~~~~~~~~~~~~..f......ff......ff.....*.",
        "~~~~~~~~~.o....oo..cc.....MM......f...",
        "~~~~~~~~~~..F..f....MMM..o..oHMM......",
        "~~~~~~~~~~~..off....MMMoV~~...c.MM.~~~",
        "~~~~~~~~~~~~..*..~~...o~~~.c..f.*..~~~",
        "~~~c...cMM.M.~~~.~~~.c.~~~..cc...o.~~~",
        "~~.o.....A..~~~~~~~~~.c.~~~~.c......~~",
        "~...o.cc.o..~~~~.~~~~~.o.~~~..M..oB~~~",
        "~....C...c..~~~.o~~~~~~.c.~~~.c.~~~~.o",
        "~Po..o.M...~~o~~~~~~~~~..~~~.c.~~.....",
        "~o...cc..~~~~~~~~~~~~~~.~~~~.o~~.c..o.",
        "~~..o..~~~~~~~~~~~~~.o.~~~~~.~~~~....*",
        "~~~*..~~~~~~~~~~~~~~~.~~~~~~~~~.o~~~~~",
        "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~o.",
        "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
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
        "~o.f.........~~~o.~~",
        "~Po.....cc..c.~~~~.~",
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
        "~~~~~~~~~~~~.~~~~~~~~~~~",
        "~~~~~~~~~~*.o~~~~~~~~~~~",
        "~~~~~~~~~~....~~~~~~~~~~",
        "~~~~~~~~~M....~~~~~~~~~~",
        "~~~~~~~~~.c....~~~~~~~~~",
        "~~~~~~~~.MM...~~~~~~~~~~",
        "~~~~~~~~~.Mcc.~~~~~~~~~~",
        "~~~~~~.~~Mcoo.~~~~~~~~~~",
        "~~~~~~o~~.ccE.~~~~~~~~~~",
        "~~~~~~~~~.....~~~~~~~~~~",
        "~~~~~~~~~.....~~~~~~~~~~",
        "~~~~~~~~..ccc.~~~~~~~~~~",
        "~~~~*..~..~oc..~~~~~~~~~",
        "~~~~...~~~~~.c.~~~~~~~~~",
        "~~~~....~~~~..c.~~~~~~~~",
        "~~c.....~.~~*c..o~~~~~~~",
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
        "~~~~~~~~~~......ff~~~~..",
        "~~~~~~~~~o..~~.~~~~....~",
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
      // 1 y 2 son los dos defensores (el 2 solo se usa a dobles); 3 es la horda, a la que `oleadas.preparar`
      // le quita el asentamiento nada más empezar: solo está para que el motor tenga un inicio por jugador.
      filas: [
        "..3............",
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

  // Un mapa hecho a mano, más grande (30 sep 2026, Rodrigo: los grandes escenarios en varios tamaños). Cada casilla
  // del dibujo pasa a ser un bloque de `factor` casillas de lado (1.5 o 2): el mismo terreno, las mismas coronas en
  // su sitio, los yacimientos donde estaban y unas minas de más repartidas por la tierra nueva (con `semilla`), para
  // que la economía por casilla sea parecida a la del mapa original. Los puntos clave no se añaden: los pone el diseño.
  function escalar(mapa, factor, semilla) {
    if (!mapa || !factor || factor === 1) return mapa;
    const ancho = Math.round(mapa.ancho * factor), alto = Math.round(mapa.alto * factor);
    const hexes = {};
    const desplazar = (c, r) => H().clave(c - Math.floor(r / 2), r); // del dibujo (columna, fila) a la clave del hexágono
    const original = (c, r) => mapa.hexes[desplazar(c, r)];
    for (let r = 0; r < alto; r++) for (let c = 0; c < ancho; c++) {
      const o = original(Math.min(mapa.ancho - 1, Math.floor(c / factor)), Math.min(mapa.alto - 1, Math.floor(r / factor)));
      hexes[desplazar(c, r)] = { terreno: o ? o.terreno : "agua", yacimiento: null };
    }
    // la casilla del bloque que corresponde al centro de la original
    const centro = (c, r) => desplazar(Math.min(ancho - 1, Math.floor((c + .5) * factor)), Math.min(alto - 1, Math.floor((r + .5) * factor)));
    const claveA = {}; for (let r = 0; r < mapa.alto; r++) for (let c = 0; c < mapa.ancho; c++) claveA[desplazar(c, r)] = [c, r];
    // Al ampliar, dos casillas que se tocaban en diagonal pueden quedar con sus bloques tocándose solo por una esquina:
    // se rellena el camino entre sus centros con el terreno de la primera, para que la tierra que se unía siga unida
    // (y lo mismo con el agua, para las barcas; si chocan, manda la tierra: los caminos importan más).
    const centroDe = (k) => { const [c, r] = claveA[k]; return centro(c, r); };
    const esAgua = (t) => t === "agua";
    const centros = new Set(Object.keys(mapa.hexes).map(centroDe)); // el centro de cada bloque no se toca: es la casilla original
    const unir = (soloAgua) => {
      for (const [k, h] of Object.entries(mapa.hexes)) {
        if (esAgua(h.terreno) !== soloAgua || h.terreno === "montana") continue;
        for (const v of H().vecinos(k)) {
          const hv = mapa.hexes[v]; if (!hv || esAgua(hv.terreno) !== soloAgua || hv.terreno === "montana") continue;
          // el camino más corto entre los dos centros que no pise el centro de otro bloque (esos son sagrados)
          const ini = centroDe(k), fin = centroDe(v);
          // si no hay forma de rodear (un paso de montaña de una casilla), a la segunda se pisa lo que haga falta
          let desde = null;
          for (const respetar of [true, false]) {
            desde = { [ini]: null }; const cola = [ini]; let ok = false;
            while (cola.length && !ok) {
              const p = cola.shift();
              for (const x of H().vecinos(p)) {
                if (!hexes[x] || desde[x] !== undefined || (respetar && centros.has(x) && x !== fin) || H().distancia(x, fin) > 4) continue;
                desde[x] = p; if (x === fin) { ok = true; break; } cola.push(x);
              }
            }
            if (ok) break; desde = null;
          }
          if (!desde) continue;
          for (let p = desde[fin]; p && p !== ini; p = desde[p]) { const t = hexes[p].terreno; if (soloAgua ? t !== "agua" : (t === "agua" || t === "montana")) hexes[p].terreno = soloAgua ? "agua" : h.terreno; }
        }
      }
    };
    unir(true); unir(false);
    const porBando = {}; const inicios = [];
    for (const [bando, k] of Object.entries(mapa.porBando || {})) { const [c, r] = claveA[k]; porBando[bando] = centro(c, r); }
    for (const k of mapa.inicios || []) { const [c, r] = claveA[k]; inicios.push(centro(c, r)); }
    let cuantos = 0;
    for (const [k, h] of Object.entries(mapa.hexes)) if (h.yacimiento) { const [c, r] = claveA[k]; const k2 = centro(c, r); if (!inicios.includes(k2)) { hexes[k2].yacimiento = h.yacimiento; cuantos++; } }
    // minas de más: las que hagan falta para que haya tantas por casilla de tierra como antes
    const g = FWM.azar.crear((semilla || 1) * 13 + Math.round(factor * 10));
    const tierra = Object.keys(hexes).filter(k => hexes[k].terreno !== "agua" && hexes[k].terreno !== "montana");
    const objetivo = Math.round(cuantos * factor * factor) - cuantos;
    const lejosDeTodo = (k) => inicios.every(i => H().distancia(i, k) >= 3) && !H().vecinos(k).some(v => hexes[v] && hexes[v].yacimiento) && !hexes[k].yacimiento;
    let puestas = 0;
    for (const k of g.barajar(tierra)) { if (puestas >= objetivo) break; if (!lejosDeTodo(k)) continue; hexes[k].yacimiento = "mina_oro"; puestas++; }
    return Object.assign({}, mapa, { ancho, alto, hexes, inicios, porBando, escala: factor });
  }

  return { MAPAS, parsear, escalar, ids: () => Object.keys(MAPAS) };
})();
