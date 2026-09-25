#!/bin/bash
# Copia el juego a movil/www (lo que se empaqueta dentro de la app) y sincroniza el proyecto Android.
# El juego va entero en el aparato: se abre sin conexión y no depende de GitHub Pages.
# El service worker se queda: dentro de la app no estorba y mantiene el juego igual que en la web.
set -e
cd "$(dirname "$0")/.."
rm -rf movil/www && mkdir -p movil/www
for x in index.html manifest.json sw.js datos motor mapa ia modo pantalla fuentes iconos musica nube; do
  [ -e "$x" ] && cp -R "$x" movil/www/
done
echo "ficheros: $(find movil/www -type f | wc -l | tr -d ' ') · tamaño: $(du -sh movil/www | cut -f1)"
npx cap sync android
