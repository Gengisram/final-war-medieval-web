# Música

Toda la música es de **Alexander Nakarada (CreatorChords)**, https://creatorchords.com, descargada de
https://www.free-stock-music.com con licencia **Creative Commons Atribución 4.0 (CC BY 4.0)**: uso comercial
permitido a cambio de citar al autor. La cita está en Ajustes → Créditos y hay que mantenerla.

- `inicio.mp3` — "Lively Tavern" (3:39). Suena en la pantalla de inicio, siempre la misma.
- `village-ambiance.m4a` — "Village Ambiance" (6:16, 63 bpm).
- `might-magic.m4a` — "Might & Magic" (5:57, 93 bpm).
- `medieval-chateau.m4a` — "Medieval Chateau" (2:53, 145 bpm).

Las tres últimas suenan **durante la partida**, alternándose al azar: al acabar una entra otra distinta
(elegidas por Rodrigo el 6 sep 2026 entre cinco candidatas).

Los originales venían en MP3 a 320 kbps (14 MB cada uno). Para la web se convirtieron a AAC mono a 80 kbps
con la herramienta de macOS, que ya viene instalada:

    afconvert -f m4af -d aac -b 80000 -c 1 -s 3 pista.mp3 pista.m4a

Así las tres pesan 6,3 MB en total. Si el archivo no existe o no carga, el juego usa la pieza sintetizada
de `pantalla/musica.js` como respaldo.

Ojo al descargar del sitio: rechaza las peticiones sin cabeceras de navegador. Hay que pasar user-agent y
referer (`curl -A "Mozilla/5.0 …" -e "https://www.free-stock-music.com/<pagina>.html"`); si no, devuelve HTML.

`opciones.html` es la página con las candidatas que se le enseñaron a Rodrigo para elegir.
