// Azar con semilla. Cada número sale de (semilla, contador) y el contador
// vive en el estado, así que una partida se puede reproducir paso a paso.
window.FWM = window.FWM || {};

FWM.azar = (function () {
  function mezclar(a) {
    // mulberry32
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Devuelve un número en [0,1) y avanza el contador del estado.
  function siguiente(estado) {
    const valor = mezclar((estado.semilla | 0) ^ Math.imul(estado.contadorAzar + 1, 0x9e3779b1));
    estado.contadorAzar += 1;
    return valor;
  }

  // Entero en [min, max].
  function entero(estado, min, max) {
    return min + Math.floor(siguiente(estado) * (max - min + 1));
  }

  // Generador independiente (para el mapa), no toca el estado.
  function crear(semilla) {
    let contador = 0;
    const g = {
      siguiente() {
        contador += 1;
        return mezclar((semilla | 0) ^ Math.imul(contador, 0x9e3779b1));
      },
      entero(min, max) { return min + Math.floor(g.siguiente() * (max - min + 1)); },
      elegir(lista) { return lista[Math.floor(g.siguiente() * lista.length)]; },
      barajar(lista) {
        const copia = lista.slice();
        for (let i = copia.length - 1; i > 0; i--) {
          const j = Math.floor(g.siguiente() * (i + 1));
          [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
      },
    };
    return g;
  }

  return { siguiente, entero, crear };
})();
