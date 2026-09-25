# Generador de los mapas grandes

Estos scripts **no forman parte del juego** (son de Node, no se cargan en el navegador): son la herramienta
con la que se dibujaron Europa, la Península y Britannia el 7 de septiembre de 2026.

Cada mapa se define con las **costas reales** en latitud y longitud, y el script las proyecta sobre la
rejilla hexagonal cuidando que la escala sea la misma en los dos ejes (el paso horizontal de la rejilla es
√3·t y el vertical 1,5·t, así que contar celdas no basta).

    node herramientas/mapas/iberia.js

Imprime el mapa dibujado, las comprobaciones (una sola masa de tierra, capitales separadas, oro junto a
cada capital, puntos clave lejos) y las filas listas para pegar en `mapa/hechos.js`.

- `mapas.js` — proyección, polígonos de costa, cordilleras y bosques por polilíneas.
- `acabado.js` — capitales en su ciudad real, oro, puntos clave, pasos de tierra entre islas, pasos en
  las cordilleras (el juego exige que toda la tierra sea alcanzable sin pisar montaña) y comprobaciones.
- `europa.js`, `iberia.js`, `britannia.js` — la definición de cada mapa.
