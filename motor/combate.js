// Resolución de daño. daño = ataque − defensa + dado, mínimo 1.
window.FWM = window.FWM || {};

FWM.combate = (function () {
  function tirada(estado, datos) {
    const d = datos.dados.combate;
    if (d.caras <= 1) return { ajuste: 0, cara: 1 };
    const cara = FWM.azar.entero(estado, 1, d.caras);
    return { ajuste: d.ajustes[cara] || 0, cara };
  }

  function multiplicador(datos, tipoDano, etiquetasDefensor) {
    const t = datos.tiposDano[tipoDano];
    if (!t) return 1;
    let m = 1;
    for (const et of etiquetasDefensor) if (t.contra[et] != null) m *= t.contra[et];
    return m;
  }

  function calcular(ataque, defensa, ajuste, datos, mult) {
    const min = datos.dados.combate.minimoDano;
    let base = Math.floor((ataque - defensa) * (mult == null ? 1 : mult));
    base += ajuste;
    return Math.max(min, base);
  }

  // Rango [min, max] para mostrar antes de confirmar.
  function rango(ataque, defensa, datos, mult) {
    const d = datos.dados.combate;
    const ajustes = Object.values(d.ajustes || {});
    const lo = Math.min(0, ...ajustes), hi = Math.max(0, ...ajustes);
    return [calcular(ataque, defensa, lo, datos, mult), calcular(ataque, defensa, hi, datos, mult)];
  }

  function textoExtra(datos, ajuste) {
    const d = datos.dados.combate;
    if (ajuste > 0) return d.textoAlto;
    if (ajuste < 0) return d.textoBajo;
    return "";
  }

  return { tirada, calcular, rango, multiplicador, textoExtra };
})();
