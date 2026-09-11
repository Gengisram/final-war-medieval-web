// Pantalla de inicio: bienvenida (elige tu héroe), inicio limpio (héroe + Jugar + lo de hoy), héroe con pestañas,
// ranking, duelo, cuenta y ajustes. Es una capa encima del juego (#inicio). mostrar() la enseña; ocultar() la quita.
// Regla: cada pantalla responde a una pregunta; lo que no la responde va detrás de un toque.
window.FWM = window.FWM || {};

FWM.inicio = (function () {
  let App = null, animando = false, figuras = [];
  // Iconos del menú: dibujos de game-icons.net (Lorc y Delapouite, licencia CC BY 3.0), todos del mismo
  // estilo y teñidos del granate del juego. Antes eran trazos de línea genéricos y no pegaban con un
  // juego medieval (8 sep 2026). Créditos en Ajustes.
  const JUEGO = (d) => `<span class="medallon"><svg viewBox="0 0 512 512" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg></span>`;
  const SVG = (d) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const MEDALLON = (color, d) => `<span class="medallon">${SVG(d)}</span>`;
  const ICONOS = {
    campana: JUEGO("m256 23.57-16.1 48.86h32.2zM73 90.43v15.97h366V90.43zm48 33.97V479l135-105 135 105V124.4zm87 37h96l-32 80 80-32v96l-80-32 32 80h-96l32-80-80 32v-96l80 32zm48 235.4-23 17.9v73.7h46v-73.7z"),
    barbaros: JUEGO("M69.313 18.75c-1.574 2.353-3.376 4.513-4.813 7C29.19 86.9 50.184 165.194 111.344 200.5c.822.475 1.64.92 2.47 1.375 6.942-20.223 16.297-38.746 27.592-54.844-46.972-27.407-73.09-77.42-72.094-128.28zm366.218 0c1 51.074-25.34 101.293-72.686 128.625-.06.035-.128.06-.188.094 11.25 16.126 20.54 34.673 27.438 54.905 1.143-.615 2.275-1.222 3.406-1.875 61.16-35.306 82.154-113.6 46.844-174.75-1.437-2.487-3.24-4.647-4.813-7zm-183.655 83.063c-49.747 0-94.34 38.94-117.188 97.687 34.868-8.738 76.5-12.77 118.282-12.78 40.775-.013 81.443 3.814 115.843 12.124-22.932-58.378-67.38-97.03-116.938-97.03zm1.094 103.593c-61.1.017-122.17 10.173-156.44 27.875v59.69c38.836-8.845 89.384-13.424 140.626-14.158L219.28 395h59.97l-17.875-116.22c55.228.506 109.26 5.38 148.25 14.158V233.28c-34.38-17.77-95.545-27.89-156.656-27.874zm-61.064 94.78c-11.582.002-20.094 8.333-20.094 18.002 0 9.668 8.512 18 20.094 18 11.583 0 20.125-8.332 20.125-18 0-9.67-8.54-18-20.124-18zm114.688.002c-11.583 0-20.094 8.33-20.094 18 0 9.668 8.51 18 20.094 18 11.582 0 20.125-8.332 20.125-18 0-9.67-8.544-18-20.126-18zm44.625 2.625L300.06 493.938l81.844-21.25V306.75c-9.6-1.504-19.885-2.81-30.687-3.938zm-203.25.593c-10.817 1.254-21.174 2.733-30.845 4.438v164.844l81.844 21.25-51-190.532z"),
    escenarios: JUEGO("m255.95 27.11-75.35 80.504 150.7 1.168-75.35-81.674h-.003zM25 109.895v68.01l19.412 25.99h71.06l19.528-26v-68h-14v15.995h-18v-15.994H89v15.995H71v-15.994H57v15.995H39v-15.994H25zm352 0v68l19.527 26h71.06L487 177.906v-68.01h-14v15.995h-18v-15.994h-14v15.995h-18v-15.994h-14v15.995h-18v-15.994h-14zm-176 15.877V260.89h110V126.63l-110-.857zm55 20.118c8 0 16 4 16 12v32h-32v-32c0-8 8-12 16-12zM41 221.897V484.89h78V221.897H41zm352 0V484.89h78V221.897h-78zM56 241.89c4 0 8 4 8 12v32H48v-32c0-8 4-12 8-12zm400 0c4 0 8 4 8 12v32h-16v-32c0-8 4-12 8-12zm-303 37v23h-16v183h87v-55c0-24 16-36 32-36s32 12 32 36v55h87v-183h-16v-23h-14v23h-18v-23h-14v23h-18v-23h-14v23h-18v-23h-14v23h-18v-23h-14v23h-18v-23h-14v23h-18v-23h-14zm-49 43c4 0 8 4 8 12v32H96v-32c0-8 4-12 8-12zm72 0c8 0 16 4 16 12v32h-32v-32c0-8 8-12 16-12zm80 0c8 0 16 4 16 12v32h-32v-32c0-8 8-12 16-12zm80 0c8 0 16 4 16 12v32h-32v-32c0-8 8-12 16-12zm72 0c4 0 8 4 8 12v32h-16v-32c0-8 4-12 8-12zm-352 64c4 0 8 4 8 12v32H48v-32c0-8 4-12 8-12zm400 0c4 0 8 4 8 12v32h-16v-32c0-8 4-12 8-12z"),
    duelo: JUEGO("M19.75 14.438c59.538 112.29 142.51 202.35 232.28 292.718l3.626 3.75.063-.062c21.827 21.93 44.04 43.923 66.405 66.25-18.856 14.813-38.974 28.2-59.938 40.312l28.532 28.53 68.717-68.717c42.337 27.636 76.286 63.646 104.094 105.81l28.064-28.06c-42.47-27.493-79.74-60.206-106.03-103.876l68.936-68.938-28.53-28.53c-11.115 21.853-24.413 42.015-39.47 60.593-43.852-43.8-86.462-85.842-130.125-125.47-.224-.203-.432-.422-.656-.625C183.624 122.75 108.515 63.91 19.75 14.437zm471.875 0c-83.038 46.28-154.122 100.78-221.97 161.156l22.814 21.562 56.81-56.812 13.22 13.187-56.438 56.44 24.594 23.186c61.802-66.92 117.6-136.92 160.97-218.72zm-329.53 125.906 200.56 200.53a402.965 402.965 0 0 1-13.405 13.032L148.875 153.53l13.22-13.186zm-76.69 113.28-28.5 28.532 68.907 68.906c-26.29 43.673-63.53 76.414-106 103.907l28.063 28.06c27.807-42.164 61.758-78.174 104.094-105.81l68.718 68.717 28.53-28.53c-20.962-12.113-41.08-25.5-59.937-40.313 17.865-17.83 35.61-35.433 53.157-52.97l-24.843-25.655-55.47 55.467c-4.565-4.238-9.014-8.62-13.374-13.062l55.844-55.844-24.53-25.374c-18.28 17.856-36.602 36.06-55.158 54.594-15.068-18.587-28.38-38.758-39.5-60.625z"),
    dia: JUEGO("M227.4 34.7c-10.1 0-20.2.2-30.2.5l6.1 65.6-61.1-62.5c-31.3 2.5-62.5 6.6-93.8 12.5l34.2 28.4-48-.6c35.1 100.2 6.9 182.6-.3 292.1L130 476.5c10-1.3 19.9-2.4 29.6-3.3l21.5-42.2 18.6 28.8 41.5-33.5.8 43c82.9-.2 157.7 9.1 235.7 7.9-28.2-73-31.2-143.6-31.9-209.2l-33.3-19.1 32.7-33.9c-.4-21.3-1.3-42-3.6-61.9l-57.4.7 50.2-41.7c-3.8-15.5-9-30.4-16.1-44.7l-29.5-23.9C335 38 281.2 34.6 227.4 34.7zm58.7 37c10.6 24.75 21.1 49.5 31.7 74.3 7.5-10.5 14.9-21 22.4-31.5 16 27.2 32 54.3 48 81.5l-16.2 9.5-33.3-56.7-42.5 59.4-15.2-10.9 24-33.5-21.9-51.5-24.6 40.1 12 22.6-16.5 8.8-18.3-34.5-24.8 58.2-17.2-7.4 32.5-76.2 7.7-18c4.8 9.2 9.6 18.3 14.5 27.4 12.5-20.6 25.1-41.11 37.7-61.6zM91.2 128c6.72 1.6 13.4 3.4 19.2 5.3-2.1 5.9-4.1 11.8-6.2 17.6-5.79-1.6-11.72-3.4-16.9-4.7 1.39-6 2.62-12.1 3.9-18.2zm37.9 13.4c6.3 3.8 12 7.2 17 12.8L132.6 167c-4-3.7-8.6-7-12.8-9.4zm28.7 32.3c2.1 7.4 2.1 15.7 1.6 22.5l-18.5-2.4c.1-5.1.3-10-1-14.5zm-21.2 35.7 17.2 7.1c-3.3 6.6-5.1 12.7-8.6 17.8l-16.3-9c2.6-5.4 5.6-10.8 7.7-15.9zm-16.5 34.1 17.7 6.1c-1.5 5.4-3 11.2-3.6 16.2l-18.6-2c1.3-7.5 2.1-14 4.5-20.3zm207.8 17.4c8.5 1 14.6 3 21.7 7.1l-9.8 16c-4.1-2.8-9.4-3.8-13.5-4.5zm-21.2 1.5c1.1 6.1 2.5 12.2 3.9 18.3-5.9 1.3-11.7 3.3-16.5 5.1l-6.8-17.4c6.7-2.4 13.5-4.7 19.4-6zm-37.9 15.9 11 15.1c-5.6 4-11.8 7.8-16.8 10.6l-8.9-16.4c5.1-2.9 10.6-6.3 14.7-9.3zM135.3 281c1.5 4.7 4.2 9.2 6.9 12.1l-13.8 12.6c-5.5-5.7-9.5-13.5-11.2-20.1zm230.3 3.3c3.5 6.4 6.8 12.7 8.7 19.1l-17.8 5.6c-2-5.4-4.3-10.8-6.8-14.8zm-127.4 10.9 6.9 17.3c-6.4 2.7-12.9 4.8-18.6 6.5l-5-18c5.9-1.6 11.3-3.8 16.7-5.8zm-83.8 6.2c5.3 1.7 10.8 3.4 15.7 4.2-1.2 6.1-2 12.3-2.8 18.5-7-1-14.5-3.3-20.5-5.7zm50 3.5 2.8 18.5c-7.2 1.3-13.4 1.6-19.8 1.9l-.4-18.7c5.9-.2 11.6-.8 17.4-1.7zm174.5 18c1 6.4 1.6 12.9 2.2 19.3l-18.7 1.5c-.4-6-.9-11.9-2-17.8zm-67.6 30.8c18.9 3.5 44.9 16.2 68.9 33.9 7.4-9.9 14.4-20.4 21.3-31.1l30.1 12.9c-4.7 12.3-15 25.6-28.6 37.2 17 16.2 30.9 34.5 37 53-13.8-18.1-31.1-31.8-50.3-42.8-23.4 15.8-52.7 25.9-79.6 20.4 22.9-4.4 40.6-16.6 55.8-32.6-16.5-7.5-33.8-13.9-51.3-20.1z"),
    batalla: JUEGO("M234.7 18.05c-21 .2-38.8 2.5-62 10.2-4.1 2-8.2 4.1-12.2 6.2.8 5.26 3.2 10.77 5.5 14.7-4.9 4.2-9.6 8.4-14.1 12.8-3.7-5.5-6.6-11.4-8.3-17.4-14.2 9.2-27.7 19.6-40.1 31.4 1.9 9.5 9.2 18.21 15.2 24.15-3.7 5.2-7.2 10.4-10.5 15.7-8.22-7.2-15.12-15.5-19.32-24.65C74.97 108.1 61.92 126 53.08 142.3c5.29 13 19.01 22.7 29.8 28.4-2 6.1-3.7 12.2-5.1 18.4-13.5-6.4-26.3-15.7-34.5-26.6-8.7 20.1-14.7 40.7-18.2 61.4 9.63 15.5 30.57 22.9 46 25.9.1 6.4.4 12.8.9 19.2-17.79-2.7-37.26-9.6-49.9-20.4-1.6 22.3-.5 44.5 3.4 66.2 15.25 13.7 41.14 15.3 58.6 13.7 2 6.1 4.1 12.2 6.5 18.1-18.61 4.5-43.29 1.1-59.3-6.2 6.6 23.7 16.4 46.4 29.2 67.4 19.33 8.6 44.52 3.6 61.72-2.5 3.7 5.3 7.6 10.5 11.6 15.5-17.8 9.5-39.9 11.5-57.52 10.1 12.3 16.3 26.62 31.2 42.72 44.4 4.9 1.1 10.5 1.1 16.7.3 11.7-1.7 25.2-7 37.9-14.7 16.7 13.5 34.9 24.7 54.1 33.1l7.5-17.2c-16-6.9-31.3-16.2-45.6-27.3 13.3-10.9 24.3-24 30.2-36.5 4.7-9.7 6.3-18.4 4.5-26.3-10.7-5.7-20.6-12.5-29.5-20.3-7.8 20.8-26.4 36.1-43.5 46-4-4.9-7.9-9.9-11.6-15 16.8-9.8 39.9-27.5 39.1-47.1-8.9-10.3-16.6-21.8-22.9-34.1-12 14-30.7 22.5-46.5 26.7-2.4-5.8-4.6-11.6-6.6-17.6 16.8-5.2 37.9-13 44.1-29.7-4.3-11.5-7.5-23.6-9.7-36-13.8 8.4-32 11.1-46.32 10.9-.6-6.2-1-12.4-1.2-18.7 15.52-.6 33.92-2.5 44.92-14.3-.8-12.6-.5-25.5.9-38.5-13.4 2.8-29 .3-40.42-3.2 1.3-6 2.9-12.1 4.8-18.1 12.82 3.2 27.12 6.7 38.82.8 2.7-13.6 6.7-27.3 12-40.8-9.9-1.8-20.2-6.3-27.7-10.7 3.3-5.3 6.8-10.5 10.5-15.7 8.1 4.2 16.3 8.8 25.2 8.4 5.7-11.6 12.3-22.65 19.5-32.75-5.1-2.7-10-6.4-14.4-10.6 4.4-4.3 9.1-8.5 13.9-12.7 3.8 3.54 8 6.18 12.3 8.2 15.9-18.6 35.9-36.23 49-53.8zm38.4 0c15.4 20.75 33.8 35.63 48.9 53.7 4.6-1.76 9.1-5.23 12.3-8.1 4.9 4.2 9.5 8.4 13.9 12.7-4.4 4.2-9.2 7.9-14.4 10.6 7.3 10.1 13.9 21.05 19.6 32.65 9-.1 18.4-4.4 25.2-8.4 3.7 5.2 7.2 10.4 10.4 15.7-8.8 5.9-18.2 9.6-27.6 10.7 5.3 13.5 9.3 27.2 12 40.8 12.3 5.4 27.3 2.7 38.7-.8 1.9 6 3.5 12.1 4.9 18.1-14.2 3.4-27.3 6.2-40.4 3.3 1.4 12.9 1.6 25.8.8 38.5 11.4 12.3 30.2 14.4 44.9 14.2-.2 6.3-.5 12.5-1.2 18.7-17.1-.5-32.8-2.5-46.3-10.9-2.1 12.4-5.3 24.5-9.6 36.1 8.2 17.4 27.8 25.3 44.1 29.6-2 6-4.2 11.8-6.6 17.6-18.5-5.6-34.9-13-46.6-26.7-6.3 12.4-13.9 23.8-22.9 34.1 1.5 22.4 22.4 37.8 39.2 47.1-3.7 5.1-7.6 10.1-11.6 15-19-11.8-36.6-25.8-43.5-46-9 7.8-18.8 14.6-29.6 20.3-1.8 7.9-.1 16.6 4.5 26.3 6 12.5 17 25.6 30.3 36.5-14.3 11.1-29.6 20.4-45.6 27.3l7.4 17.2c19.3-8.4 37.4-19.6 54.1-33.2 12.7 7.8 26.2 13.1 38 14.8 6.2.8 11.8.8 16.7-.3 16.1-13.2 30.4-28.1 42.7-44.4-18 1.7-37.9-2.3-56.5-9.7-.3-.1-.7-.3-1.1-.4 4.1-5 7.9-10.2 11.7-15.5 18.2 7.8 43.7 11.7 61.6 2.5 12.8-21 22.6-43.7 29.2-67.4-.4.2-.8.4-1.2.5-20.5 6.4-40.1 7.6-58.1 5.7 2.4-5.9 4.5-12 6.5-18 19.1 1.7 45.2.1 58.6-13.8 3.9-21.7 5.1-43.9 3.4-66.2-14.4 10.7-34.9 17.9-49.9 20.4.5-6.4.9-12.8 1-19.2 16.8-4.8 37.9-10 45.9-25.9-3.5-20.7-9.5-41.3-18.2-61.4-9.4 11.6-23.1 21-34.4 26.5-1.5-6.1-3.2-12.2-5.2-18.3 12-7.4 25.1-15.3 29.9-28.4-10.1-18.7-22.2-35.8-35.9-51.05-4.2 9.05-11.1 17.45-19.2 24.65-3.3-5.3-6.8-10.5-10.6-15.7 6.2-7.17 14.2-14.71 15.2-24.15-12.4-11.8-25.8-22.2-40-31.4-1.8 6-4.7 11.9-8.3 17.4-4.5-4.4-9.2-8.6-14.1-12.8 2.7-4.82 4.7-9.62 5.4-14.7-4-2.1-8.1-4.2-12.2-6.2-24.7-8.2-43.3-10.3-66.2-10.2z"),
    heroe: JUEGO("M258.094 18.5c-74.34 0-138.073 62.498-156.188 148.438 52.758-7.697 102.23-22.044 153.938-45.094l4.125-1.813 3.967 2.064c49.424 25.667 97.648 41.026 150.657 46.406-17.66-86.744-81.71-150-156.5-150zm1.28 122.156c-57.41 25.148-112.883 39.993-172.53 47 6.724 32.847 6.91 65.935-.5 98.938 89.29 41.602 231.648 43.154 340.594-.125-10.762-32.516-11.727-65.66-1.188-98.408-59.03-4.235-112.628-20.06-166.375-47.406zm-13.5 33.125h18.72v127.75h-18.72V173.78zm-58.78 11.19h18.687v101.655h-18.686V184.97zm115.72 0H321.5v101.655h-18.688V184.97zm-171.72 14.905h18.687v79.28h-18.686v-79.28zm227.72 0H377.5v79.28h-18.688v-79.28zm38.748 116.75c-14.302 4.282-28.96 7.873-43.78 10.844l-19.22 64.06c26.114-17.337 48.002-43.31 63-74.905zm-277.53 2.875c13.95 28.257 33.448 51.85 56.562 68.53l-17.688-58.905c-13.397-2.61-26.387-5.826-38.875-9.625zm213.156 11.656c-51.63 8.175-104.745 8.588-153.72 1.438l20.845 69.5c18 8.52 37.49 13.187 57.78 13.187 18.588 0 36.507-3.92 53.22-11.124l21.875-73zm-195.5 47.156c-19.436 21.562-36.416 44.367-48.594 72.157 70.233-8.736 133.743 14.684 168.03 50.75 39.684-35.607 103.71-55.685 170.876-44.25-15.08-29.372-33.32-51.982-53.938-74-31.187 31.75-71.53 51-115.968 51-46.568 0-88.65-21.142-120.406-55.658z"),
    ranking: JUEGO("M256.156 21.625c-45.605 0-86.876 2.852-117.22 7.563-15.17 2.355-27.554 5.11-36.874 8.53-4.66 1.71-8.568 3.515-11.968 6.094-3.238 2.457-6.65 6.36-6.97 11.75h-.75c0 10.08.362 20.022 1.064 29.813H57.53c-.12-7.952.003-15.922.376-23.875l-26.812-6.28C22.55 161.892 64.1 265.716 140.564 339.655l15.655-29.594a250.817 250.817 0 0 1-12.157-10.75 143.483 143.483 0 0 1 19.28-16.843c13.468 13.172 28.182 23.565 43.813 30.655 22.114 17.744 8.053 29.368-23.5 36.25 58.863 10.6 38.948 62.267-14.125 92.313-2.14.27-4.256.523-6.28.812-12.047 1.718-21.876 3.71-29.406 6.25-3.765 1.27-6.958 2.6-9.906 4.656-2.95 2.055-6.626 5.705-6.626 11.406 0 5.702 3.677 9.32 6.626 11.375 2.948 2.055 6.14 3.387 9.906 4.657 7.53 2.54 17.36 4.532 29.406 6.25 24.094 3.436 56.784 5.53 92.906 5.53 36.123 0 68.812-2.094 92.906-5.53 12.048-1.718 21.877-3.71 29.407-6.25 3.764-1.27 6.957-2.602 9.905-4.656 2.948-2.055 6.625-5.674 6.625-11.375 0-5.702-3.677-9.352-6.625-11.407-2.948-2.055-6.14-3.387-9.906-4.656-7.53-2.54-17.36-4.532-29.408-6.25-2.013-.287-4.12-.544-6.25-.813-53.076-30.045-72.99-81.71-14.125-92.312-31.568-6.886-45.63-18.522-23.468-36.28 15.74-7.15 30.547-17.655 44.092-30.97 6.648 4.773 12.84 10.038 18.47 15.72a300.791 300.791 0 0 1-12.72 12.217l16.188 29.594c79.118-71.955 116.195-179.53 110.03-285l-27.342 7.97c.45 7.61.64 15.19.562 22.75h-25.594a416.913 416.913 0 0 0 1.063-29.814h-.75c-.323-5.39-3.763-9.293-7-11.75-3.402-2.58-7.31-4.383-11.97-6.093-9.32-3.422-21.704-6.177-36.875-8.532-30.342-4.71-71.613-7.563-117.22-7.563zm0 18.688c44.822 0 85.426 2.854 114.344 7.343 14.46 2.245 26.06 4.932 33.313 7.594 1.04.382 1.775.75 2.625 1.125-.85.375-1.58.742-2.625 1.125-7.252 2.662-18.854 5.38-33.313 7.625-28.918 4.49-69.522 7.344-114.344 7.344-44.82 0-85.425-2.855-114.344-7.345-14.46-2.245-26.06-4.963-33.312-7.625-1.05-.386-1.77-.748-2.625-1.125.853-.376 1.577-.74 2.625-1.125 7.252-2.662 18.853-5.35 33.313-7.594 28.918-4.49 69.522-7.343 114.343-7.343zm-197.25 71.874H86.25c8.057 57.878 28.23 108.83 56.188 146.25-6.974 5.74-13.407 11.968-19.188 18.688-38.648-46.456-59.042-104.647-64.344-164.938zm367.188 0h27C447.51 171.82 425.336 228.34 388.03 275a158.506 158.506 0 0 0-17.842-16.97c27.81-37.38 47.873-88.175 55.906-145.842z"),
    libro: JUEGO("m102.53 26.063 90 345.75 289.22 23.25-90.03-345.72-289.19-23.28zm-18.968 1.406c-30.44 11.894-55.62 53.07-49.687 75.28l3.25 11.813c.654-1.722 1.345-3.44 2.063-5.157C49.102 85.688 65.734 62.636 89.56 50.5l-6-23.03zM94.44 69.187c-16.66 10.016-29.916 28.1-38 47.437-5.2 12.44-8 25.417-8.75 36.25v.03L112.56 388.5c.305-.572.593-1.148.907-1.72 10.585-19.223 27.804-37.623 51.06-48.405L94.438 69.187zM154 107.968l239.78 16.188-1.28 18.625-239.75-16.155L154 107.97zm46.03 34.407 5.657 8.875 14.188 22.313 39.03-15.25 7.595-2.938 3.97 7.094 16.28 29.124 4.313 7.72-7.438 4.717c-10.267 6.524-17.392 12.284-21.75 16.782-3.03 3.13-4.247 5.232-4.906 6.594 1.38.303 3.433.577 6.624.28 18.268-1.69 56.285-19.964 79-61.592l5.47-10.03 8.748 7.374 46 38.812 11.532 9.72-13.844 6-33.28 14.374c5.447 4.925 11.436 5.916 18.436 5.406 9.95-.724 21.427-6.07 29.125-11.063l10.158 15.657c-9.41 6.1-22.867 12.934-37.938 14.03-15.07 1.098-32.27-5.296-42.594-23.155l-5.25-9.095 9.625-4.156 30.44-13.157-26.033-22c-25.716 40.294-62.68 59.168-87.843 61.5-6.78.628-12.945.26-18.594-2.688-5.65-2.95-9.984-10.6-9-17.406.984-6.806 4.838-12.4 10.688-18.44 4.385-4.526 10.612-9.367 17.875-14.436l-8.188-14.656L219.5 193.75l-7.156 2.78-4.125-6.468L196 170.875c-6.308 7.158-9.485 14.528-9 21.406.654 9.28 7.854 21.054 30.594 33.69l-9.094 16.343c-25.688-14.273-38.877-31.016-40.125-48.72-1.248-17.703 9.393-33.013 23.5-44.562l8.156-6.655zm-5.968 118.188 239.782 16.156-1.25 18.655-239.78-16.188 1.25-18.625zm-24.75 96.25c-17.637 9.072-31.065 23.708-39.468 38.968-4.49 8.153-7.307 16.452-8.72 23.876l11.626 42.156 1.688.157c-3.824-27.514 11.358-60.383 41.187-80.97l-6.313-24.188zm26.22 34c-32.403 17.28-46.273 52.303-41.657 72.78l289.78 24.532c-5.298-7.743-8.625-17.827-8.592-28.313l-22.47-9.03 46.626-7.313-13.69-13.064c5.552-6.838 13.54-12.915 24.47-17.53l-274.47-22.063z"),
    tutorial: JUEGO("M256 89.61 22.486 177.18 256 293.937l111.22-55.61-104.337-31.9A16 16 0 0 1 256 208a16 16 0 0 1-16-16 16 16 0 0 1 16-16l-2.646 8.602 18.537 5.703a16 16 0 0 1 .008.056l27.354 8.365L455 246.645v12.146a16 16 0 0 0-7 13.21 16 16 0 0 0 7.293 13.406C448.01 312.932 448 375.383 448 400c16 10.395 16 10.775 32 0 0-24.614-.008-87.053-7.29-114.584A16 16 0 0 0 480 272a16 16 0 0 0-7-13.227v-25.42L413.676 215.1l75.838-37.92L256 89.61zM119.623 249 106.5 327.74c26.175 3.423 57.486 18.637 86.27 36.627 16.37 10.232 31.703 21.463 44.156 32.36 7.612 6.66 13.977 13.05 19.074 19.337 5.097-6.288 11.462-12.677 19.074-19.337 12.453-10.897 27.785-22.128 44.156-32.36 28.784-17.99 60.095-33.204 86.27-36.627L392.375 249h-6.25L256 314.063 125.873 249h-6.25z"),
    ajustes: MEDALLON("#5f5e5a", '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'),
    cuenta: MEDALLON("#1d9e75", '<path d="M8 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>'),
  };
  let entrado = false; // ya hubo un toque: el audio está desbloqueado
  let pestanaHeroe = "mejoras";

  function visible() { const n = document.getElementById("inicio"); return !!n && !n.hidden; }

  function mostrar(app) {
    App = app;
    document.getElementById("inicio").hidden = false;
    document.getElementById("inicio-sub").textContent = "";
    if (entrado) { vistaPrincipal(); FWM.musica.empezar("inicio"); }
    else vistaPortada();
    arrancarDesfile();
  }
  // Portada: un toque en cualquier sitio entra y, de paso, desbloquea el sonido (el navegador lo exige).
  function vistaPortada() {
    const T = App.datos.textos;
    const cont = document.createElement("div"); cont.className = "inicio-botones";
    cont.appendChild(App.boton(T.tocaParaEntrar, entrar, "btn btn-primario"));
    vista(cont);
    const capa = document.getElementById("inicio");
    const alTocar = () => { capa.removeEventListener("pointerdown", alTocar, true); entrar(); };
    setTimeout(() => capa.addEventListener("pointerdown", alTocar, true), 50);
    function entrar() {
      if (entrado) return; entrado = true; FWM.sonido.desbloquear(); FWM.musica.empezar("inicio"); vistaPrincipal();
      FWM.nube.evento("entra", { nuevo: !(FWM.guardado.records().partidas > 0) }); // primer gesto de verdad: separa al que abre del que rebota
      // el mismo toque que entra dispara después un "click" sobre lo que haya debajo (el botón Jugar): un escudo invisible se lo traga
      const escudo = document.createElement("div"); escudo.style.cssText = "position:fixed;inset:0;z-index:99;background:transparent";
      escudo.addEventListener("click", (ev) => { ev.stopPropagation(); ev.preventDefault(); }, true);
      // se quita medio segundo después de soltar el dedo (si se mantiene pulsado, el click llega al soltar)
      document.body.appendChild(escudo);
      const soltar = () => { document.removeEventListener("pointerup", soltar, true); document.removeEventListener("touchend", soltar, true); setTimeout(() => escudo.remove(), 500); };
      document.addEventListener("pointerup", soltar, true); document.addEventListener("touchend", soltar, true);
      setTimeout(() => escudo.remove(), 4000);
    }
  }
  function refrescar() { if (visible() && entrado) vistaPrincipal(); }
  function ocultar() {
    document.getElementById("inicio").hidden = true;
    animando = false;
    // la música no se para al salir del inicio: la partida tiene su propia pieza (la pone App.irPartida / nuevaPartida)
  }

  // ---------- utilidades ----------
  function vista(nodo, mantenerScroll) { const capa = document.getElementById("inicio"); const y = capa.scrollTop; const v = document.getElementById("inicio-vista"); v.innerHTML = ""; v.appendChild(nodo); if (mantenerScroll) capa.scrollTop = y; else { v.scrollTop = 0; capa.scrollTop = 0; } }
  function cabecera(titulo, atras) {
    const T = App.datos.textos;
    const c = document.createElement("div"); c.className = "inicio-vista-titulo";
    c.appendChild(App.boton("← " + T.volver, atras || vistaPrincipal, "btn btn-peq btn-claro"));
    const h = document.createElement("h2"); h.textContent = titulo; c.appendChild(h);
    return c;
  }
  function escapar(s) { return String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c])); }
  function nombreJugador() { return (FWM.nube.usuario() && FWM.nube.nombre()) || FWM.guardado.ajustes().nombre || ""; }
  function heroeConNivel() { const h = FWM.heroe.paraPartida({}); h.nivel = FWM.heroe.nivel(); return h; }
  function figuraHeroe(tam, detalle) { return FWM.figuras.canvasHeroe(heroeConNivel(), "#2f6fd6", tam, detalle); }

  // ---------- bienvenida: elige tu héroe → nombre → primer punto → cuenta ----------
  function vistaBienvenida(paso) {
    const T = App.datos.textos, TB = T.bienvenida; const D = FWM.datosBase.heroes;
    const cont = document.createElement("div"); cont.className = "bienvenida";
    paso = paso || 1;
    if (paso === 1) { // elige tu héroe
      cont.innerHTML = `<h2>${TB.elige}</h2><p class="suave">${TB.eligePista}</p>`;
      const fila = document.createElement("div"); fila.className = "heroe-clases";
      let elegido = FWM.heroe.leer().clase;
      const desc = document.createElement("p"); desc.className = "suave"; desc.style.margin = "0";
      const pintarGrande = () => { const c = D.clases[elegido]; desc.textContent = c.descripcion; fila.querySelectorAll(".heroe-clase").forEach(b => b.classList.toggle("sel", b.dataset.clase === elegido)); };
      for (const [id, c] of Object.entries(D.clases)) {
        const b = document.createElement("button"); b.className = "heroe-clase"; b.dataset.clase = id;
        b.appendChild(FWM.figuras.canvasHeroe({ clase: id, nivel: 1 }, "#2f6fd6", 84, true));
        const n = document.createElement("div"); n.className = "medalla-nombre"; n.textContent = c.nombre; b.appendChild(n);
        const l = document.createElement("small"); l.textContent = TB.lemas[id] || ""; b.appendChild(l);
        b.addEventListener("click", () => { elegido = id; pintarGrande(); FWM.sonido.tic(); });
        fila.appendChild(b);
      }
      cont.appendChild(fila); cont.appendChild(desc); pintarGrande();
      cont.appendChild(App.boton(TB.esteEsElMio, () => { FWM.heroe.cambiarClase(elegido); FWM.sonido.fanfarria(); vistaBienvenida(2); }, "btn btn-primario bienvenida-boton"));
      vista(cont); return;
    }
    if (paso === 2) { // nombre
      cont.innerHTML = `<h2>${TB.nombre}</h2>`;
      cont.appendChild(figuraHeroe(110, true));
      const inp = document.createElement("input"); inp.className = "bienvenida-input"; inp.maxLength = 20; inp.placeholder = TB.nombreEjemplo; inp.value = FWM.guardado.ajustes().nombre || ""; inp.autocomplete = "off"; cont.appendChild(inp);
      const b = App.boton(TB.seguir, () => { const n = inp.value.trim(); if (n.length < 2) { inp.focus(); FWM.paneles.aviso(T.errNombre, 2500); return; } FWM.guardado.guardarAjustes({ nombre: n }); vistaBienvenida(3); }, "btn btn-primario bienvenida-boton");
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") b.click(); });
      cont.appendChild(b); vista(cont); setTimeout(() => inp.focus(), 100); return;
    }
    if (paso === 3) { // primer punto de mejora: tres opciones
      FWM.heroe.darPuntoExtra(1);
      cont.innerHTML = `<h2>${TB.primerPunto}</h2><p class="suave">${TB.primerPuntoPista}</p>`;
      const fig = document.createElement("div"); fig.className = "bienvenida-grande"; fig.appendChild(figuraHeroe(130, true)); cont.appendChild(fig);
      const fila = document.createElement("div"); fila.className = "bienvenida-opciones";
      let elegida = null;
      const bConf = App.boton(T.confirmar, () => { if (!elegida) return; const err = FWM.heroe.mejorar(elegida); if (err) { FWM.paneles.aviso(T.errores[err] || err, 2500); return; } FWM.sonido.moneda(); fig.innerHTML = ""; fig.appendChild(figuraHeroe(130, true)); fig.firstChild.classList.add("brilla"); bConf.disabled = true; setTimeout(() => vistaBienvenida(4), 900); }, "btn btn-primario bienvenida-boton"); bConf.disabled = true;
      for (const id of ["vigor", "filo", "temple"]) {
        const m = D.mejoras[id];
        const b = document.createElement("button"); b.className = "bienvenida-opcion"; b.innerHTML = `<b>${m.nombre}</b><br><small>${m.texto.replace(T.fichas.delHeroe, "")}</small>`;
        b.addEventListener("click", () => { elegida = id; fila.querySelectorAll("button").forEach(x => x.classList.toggle("sel", x === b)); bConf.disabled = false; FWM.sonido.tic(); });
        fila.appendChild(b);
      }
      cont.appendChild(fila); cont.appendChild(bConf); vista(cont); return;
    }
    if (paso === 4) { // cuenta
      cont.innerHTML = `<h2>${TB.cuenta}</h2>`;
      cont.appendChild(figuraHeroe(100, true));
      const p = document.createElement("p"); p.textContent = TB.cuentaPista; cont.appendChild(p);
      const acabar = () => { FWM.guardado.guardarAjustes({ heroeElegido: true }); vistaBienvenida(5); };
      if (FWM.nube.posible() && !FWM.nube.usuario()) {
        cont.appendChild(App.boton(T.crearCuenta, () => { FWM.guardado.guardarAjustes({ heroeElegido: true }); vistaCuenta("alta", () => vistaBienvenida(5)); }, "btn btn-primario bienvenida-boton"));
        cont.appendChild(App.boton(T.yaTengoCuenta, () => { FWM.guardado.guardarAjustes({ heroeElegido: true }); vistaCuenta("entrar", () => vistaBienvenida(5)); }, "btn btn-claro bienvenida-boton"));
        cont.appendChild(App.boton(T.seguirSinCuenta, acabar, "btn btn-claro bienvenida-boton"));
      } else cont.appendChild(App.boton(TB.seguir, acabar, "btn btn-primario bienvenida-boton"));
      vista(cont); return;
    }
    // 5: tutorial o jugar
    cont.innerHTML = `<h2>${TB.listo.replace("{nombre}", escapar(nombreJugador()))}</h2>`;
    cont.appendChild(figuraHeroe(100, true));
    const p = document.createElement("p"); p.className = "suave"; p.textContent = T.primeraVez; cont.appendChild(p);
    cont.appendChild(App.boton(T.tutorial + " · 3 min", () => FWM.tutorial.empezar(App), "btn btn-primario bienvenida-boton"));
    // el segundo botón lleva al menú, no a una partida: con siete modos, soltar al jugador dentro de una
    // partida rápida sin haber visto el menú desorienta (y no sabe que existen campaña, bárbaros o duelos)
    cont.appendChild(App.boton(TB.alMenu, () => { FWM.guardado.guardarAjustes({ tutorialHecho: true }); vistaPrincipal(); }, "btn btn-claro bienvenida-boton"));
    vista(cont);
  }

  // ---------- inicio: tu héroe, Jugar y lo de hoy; el resto en iconos ----------
  function vistaPrincipal() {
    const T = App.datos.textos;
    const aj = FWM.guardado.ajustes();
    if (!aj.heroeElegido) { vistaBienvenida(1); return; }
    const cont = document.createElement("div"); cont.className = "inicio-botones";
    // duelo en curso: lo primero y lo más visible; salir al inicio no debe dejarlo inalcanzable (6 sep 2026)
    if (FWM.duelo && FWM.duelo.activo()) {
      const d = document.createElement("div"); d.className = "duelo-vivo";
      d.innerHTML = `<div class="duelo-vivo-txt"><b>⚔ ${T.dueloEnCurso}</b><small>${T.dueloRelojSigue}</small></div>`;
      d.appendChild(App.boton(T.dueloVolver, () => App.irPartida(), "btn btn-primario late"));
      cont.appendChild(d);
    }
    // tarjeta del héroe
    const card = document.createElement("button"); card.className = "inicio-heroe"; card.addEventListener("click", () => vistaHeroe());
    card.appendChild(figuraHeroe(125, true));
    const pr = FWM.heroe.progreso(); const disp = FWM.heroe.puntosMejoraDisponibles();
    const info = document.createElement("div"); info.className = "inicio-heroe-info";
    const pct = pr.siguienteNivel ? Math.min(100, Math.round(100 * (pr.puntos - pr.desdeNivel) / (pr.siguienteNivel.puntos - pr.desdeNivel))) : 100;
    const hh = FWM.heroe.leer();
    // El nombre se recorta a 14 letras y los números van en DOS líneas (nivel + puntos arriba, oro
    // abajo): con muchos puntos o mucho oro no cabían en una sola y la tarjeta se descuadraba (10 sep 2026).
    const nombreCorto = (n) => { n = String(n || ""); return n.length > 14 ? n.slice(0, 13) + "…" : n; };
    info.innerHTML = `<div class="perfil-nombre">${escapar(nombreCorto(nombreJugador()) || T.heroeUI.titulo)}</div>`
      + `<div class="perfil-escalon">${FWM.heroes.nombreNivel(FWM.heroe.nivel())}</div>`
      + `<div class="suave lineas"><span>${T.heroeUI.nivel} ${Math.min(8, FWM.heroe.nivel())} · ${pr.puntos} ${T.puntos.toLowerCase()}</span></div>`
      + `<div class="suave lineas"><span>${hh.oro || 0} ${T.heroeUI.oroCorto}</span></div>`
      + `<div class="heroe-barra"><i style="width:${pct}%"></i></div>`;
    if (disp > 0) { const b = document.createElement("span"); b.className = "btn btn-peq btn-primario late"; b.textContent = `${T.heroeUI.gastar} (${disp})`; info.appendChild(b); }
    card.appendChild(info); cont.appendChild(card);
    if (FWM.nube.usuario()) FWM.nube.miRanking("total", "suma").then(m => { if (m) { const antes = FWM.heroe.nivel(); FWM.heroe.anotarPuntosNube(m.puntos); if (FWM.heroe.nivel() !== antes && visible()) vistaPrincipal(); } }).catch(() => {});
    // Leyenda: quien más puntos tiene de todos
    if (FWM.nube.disponible() && FWM.nube.usuario()) FWM.nube.ranking("total", 1, "suma").then(f => { const yo = FWM.nube.usuario(); const soy = !!(f && f[0] && yo && f[0].usuario === yo.id && FWM.heroes.nivelPorPuntos(Number(f[0].puntos)) >= 7); const antes = FWM.heroe.leer().leyenda; FWM.heroe.ponerLeyenda(soy); if (soy !== antes) refrescar(); }).catch(() => {});
    // jugar / continuar
    if (App.estado && App.estado.ganador == null) cont.appendChild(App.boton(T.continuar, () => App.irPartida(), "btn btn-primario"));
    cont.appendChild(App.boton(T.jugar, vistaJugar, "btn " + (App.estado && App.estado.ganador == null ? "btn-claro" : "btn-primario")));
    // lo de hoy: misiones (plegadas), retos pendientes, racha
    try {
      const act = FWM.misiones.activas(App.datos); const hechas = act.dia.filter(x => x.hecha).length;
      const caja = document.createElement("div"); caja.className = "misiones";
      const tit = document.createElement("button"); tit.className = "misiones-tit";
      const pintarTit = (abierto) => { tit.innerHTML = `<span>${T.misiones.deHoy} · ${T.misiones.hechas.replace("{n}", hechas)}</span><span class="misiones-flecha">${abierto ? "▲" : "▼"}</span>`; };
      const lista = document.createElement("div"); lista.hidden = !aj.misionesAbiertas; pintarTit(!lista.hidden);
      const cab = document.createElement("div"); cab.className = "mision cabecera"; cab.innerHTML = `<span>${T.misiones.mision}</span><b>${T.misiones.premio}</b>`; lista.appendChild(cab);
      for (const x of act.dia.concat(act.semana)) { const d = document.createElement("div"); d.className = "mision" + (x.hecha ? " hecha" : "") + (x.ambito === "semana" ? " semana" : ""); d.innerHTML = `<span>${x.hecha ? "✓" : "○"} ${x.texto}${x.meta ? ` <small class="suave">${Math.min(x.progreso, x.meta)}/${x.meta}</small>` : ""}${x.ambito === "semana" ? ` <small class="suave">${T.misiones.semanal}</small>` : ""}</span><b>+${x.oro}</b>`; lista.appendChild(d); }
      tit.addEventListener("click", () => { lista.hidden = !lista.hidden; pintarTit(!lista.hidden); FWM.guardado.guardarAjustes({ misionesAbiertas: !lista.hidden }); });
      caja.appendChild(tit); caja.appendChild(lista); cont.appendChild(caja);
    } catch (e) { /* sin misiones */ }
    if (FWM.nube.disponible() && FWM.nube.usuario()) {
      const caja = document.createElement("div"); cont.appendChild(caja);
      FWM.nube.retosPendientes().then(retos => {
        for (const r of retos.slice(0, 3)) {
          const d = document.createElement("div"); d.className = "reto-pendiente";
          d.appendChild(FWM.iconos.canvasTropa((r.p && r.p.avatar) || "espadachin", "#d63b3b", 30));
          const sp = document.createElement("span"); sp.textContent = T.duelo.teReta.replace("{nombre}", (r.p && r.p.nombre) || "?"); d.appendChild(sp);
          d.appendChild(App.boton(T.duelo.aceptarReto, () => { FWM.nube.borrarReto(r.id).catch(() => {}); vistaDuelo({ codigo: r.codigo }); }, "btn btn-peq btn-primario"));
          caja.appendChild(d);
        }
      }).catch(() => {});
      reclamarLiga();
    }
    // racha de días y aviso de día nuevo (una vez al día): motivo para volver mañana
    try {
      const rec = FWM.guardado.records(); const racha = FWM.guardado.rachaViva(rec); const hoyStr = new Date().toISOString().slice(0, 10);
      const nuevoDia = aj.ultimaVisita !== hoyStr && (rec.partidas || 0) > 0;
      if (aj.ultimaVisita !== hoyStr) FWM.guardado.guardarAjustes({ ultimaVisita: hoyStr });
      const banda = document.createElement("div"); banda.className = "inicio-hoy" + (nuevoDia ? " nuevo" : "");
      const partes = [];
      if (nuevoDia) partes.push(`<span>${T.rachaDias.nuevoDia}</span>`);
      if (racha >= 1) partes.push(`<span>🔥 <b>${racha === 1 ? T.rachaDias.uno : T.rachaDias.dias.replace("{n}", racha)}</b> · ${rec.ultimoDia === hoyStr ? T.rachaDias.hecha : T.rachaDias.hoy}</span>`);
      else partes.push(`<span>${T.rachaDias.empieza}</span>`);
      banda.innerHTML = partes.join(""); cont.appendChild(banda);
    } catch (e) { /* sin racha */ }
    // ---- el menú, por secciones (8 sep 2026) ----
    // Antes eran doce cuadrados iguales y todo parecía lo mismo. Ahora: los modos de juego en azulejos
    // grandes con una línea de qué son y su dato (progreso, récord); los retos que cambian con el tiempo
    // aparte; lo tuyo (héroe y ranking) en medianos; y lo de administrar, pequeño al pie.
    const seccion = (titulo) => { const h = document.createElement("h3"); h.className = "inicio-seccion"; h.textContent = titulo; cont.appendChild(h); };
    const rejilla = (clase) => { const d = document.createElement("div"); d.className = clase; cont.appendChild(d); return d; };
    // azulejo grande: icono, nombre, una línea de texto y un pie con el dato vivo
    const azulejo = (donde, nombre, texto, pista, fn, dato) => {
      const b = document.createElement("button"); b.className = "inicio-modo";
      b.innerHTML = `<span class="ico">${ICONOS[nombre] || ""}</span><span class="nombre">${escapar(texto)}</span><span class="que">${escapar(pista || "")}</span>`;
      if (dato) { const s = document.createElement("span"); s.className = "dato"; s.textContent = dato; b.appendChild(s); }
      b.addEventListener("click", fn); donde.appendChild(b); return b;
    };
    const icono = (donde, nombre, texto, fn, aviso) => { const b = document.createElement("button"); b.className = "inicio-icono"; b.innerHTML = `<span class="ico">${ICONOS[nombre] || ""}</span><span class="rotulo">${escapar(texto)}</span>`; if (aviso) { const s = document.createElement("span"); s.className = "punto-aviso"; s.textContent = aviso; b.appendChild(s); } b.addEventListener("click", fn); donde.appendChild(b); };

    const campSig = FWM.campana && FWM.campana.siguiente();
    const prog = FWM.campana && FWM.campana.progreso();
    const recB = FWM.guardado.records().barbarosRecord || 0;

    seccion(T.secciones.modos);
    const modos = rejilla("inicio-modos");
    azulejo(modos, "campana", T.campana.boton, T.secciones.queCampana, vistaCampana, prog ? T.secciones.deMapas.replace("{n}", prog.hechos).replace("{t}", prog.total || 10) : null);
    azulejo(modos, "barbaros", T.barbaros.boton, T.secciones.queBarbaros, vistaBarbaros, recB ? T.barbaros.record.replace("{n}", recB) : T.secciones.sinRecord);
    azulejo(modos, "escenarios", T.escenarios.boton, T.secciones.queEscenarios, vistaEscenarios, T.secciones.tresMapas);
    if (FWM.nube.posible()) azulejo(modos, "duelo", T.duelo.boton, T.secciones.queDuelo, vistaDuelo, T.secciones.enDirecto);

    seccion(T.secciones.estaSemana);
    const retos = rejilla("inicio-modos inicio-retos"); // los retos van en pergamino: se distinguen de los modos
    azulejo(retos, "dia", T.mapaDelDia, T.secciones.queDia, () => App.nuevaPartida({ tipo: "dia", bando: FWM.guardado.ajustes().bando || "aleatorio" }), T.secciones.mismoParaTodos);
    let piede = null;
    try { const d = FWM.batalla.diasRestantes(); piede = d === 1 ? T.batalla.cambiaManana : T.batalla.cambia.replace("{n}", d); } catch (e) { /* nada */ }
    azulejo(retos, "batalla", T.batalla.boton, T.secciones.queBatalla, vistaBatalla, piede);

    seccion(T.secciones.tuProgreso);
    const tuyo = rejilla("inicio-iconos");
    icono(tuyo, "heroe", T.heroeUI.boton, vistaHeroe, disp > 0 ? disp : null);
    icono(tuyo, "ranking", T.ranking, vistaRanking);
    icono(tuyo, "libro", T.comoSeJuega, () => App.abrirGlosario({ pestana: "reglas" }));
    icono(tuyo, "tutorial", T.tutorial, () => FWM.tutorial.empezar(App));

    const pie = document.createElement("div"); pie.className = "inicio-pie";
    pie.appendChild(App.boton(T.ajustes, vistaAjustes, "btn btn-peq btn-claro"));
    if (FWM.nube.posible()) pie.appendChild(App.boton(FWM.nube.usuario() ? T.cuenta : T.crearCuenta, () => vistaCuenta(FWM.nube.usuario() ? "dentro" : "alta"), "btn btn-peq btn-claro"));
    cont.appendChild(pie);
    // instalar (Android) / pista (iPhone)
    const yaInstalada = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    if (!yaInstalada && window.__instalar) cont.appendChild(App.boton("📲 " + T.instalar, async () => { const ev = window.__instalar; window.__instalar = null; ev.prompt(); await ev.userChoice; vistaPrincipal(); }, "btn btn-peq btn-claro"));
    vista(cont);
  }

  function vistaJugar() {
    const T = App.datos.textos;
    const cont = document.createElement("div");
    cont.appendChild(cabecera(T.jugar));
    const f = App.formularioPartida();
    cont.appendChild(f.nodo);
    const fila = document.createElement("div"); fila.className = "modal-botones";
    fila.appendChild(App.boton(T.empezar, () => App.nuevaPartida(f.leer()), "btn btn-primario"));
    cont.appendChild(fila);
    vista(cont);
  }

  // ---------- textos legales ----------
  function textoLegal(txt) {
    const L = App.datos.legal || FWM.datosBase.legal;
    return String(txt).replace("{titular}", L.titular).replace("{contacto}", L.contacto).replace("{paisDatos}", L.paisDatos)
      .replace("{edad}", L.edadMinima).replace("{actualizado}", L.actualizado);
  }
  function vistaLegal(cual, atras) {
    const T = App.datos.textos; const L = App.datos.legal || FWM.datosBase.legal;
    const doc = L[cual] || L.privacidad;
    const cont = document.createElement("div"); cont.appendChild(cabecera(doc.titulo, atras || vistaAjustes));
    const sec = document.createElement("section"); sec.className = "reino-sec legal";
    for (const s of doc.secciones) {
      const h = document.createElement("h3"); h.textContent = s.h; sec.appendChild(h);
      const p = document.createElement("p"); p.textContent = textoLegal(s.p); sec.appendChild(p);
    }
    const pie = document.createElement("p"); pie.className = "pista"; pie.textContent = `${T.version} ${FWM.VERSION}`; sec.appendChild(pie);
    cont.appendChild(sec); vista(cont);
  }

  // ---------- bárbaros: resistir hordas y contar rondas ----------
  function vistaBarbaros() {
    const T = App.datos.textos, TB = T.barbaros; const aj = FWM.guardado.ajustes(); const r = FWM.guardado.records();
    const cont = document.createElement("div"); cont.appendChild(cabecera(TB.titulo));
    const p = document.createElement("p"); p.className = "pista"; p.textContent = TB.pista; cont.appendChild(p);
    const card = document.createElement("div"); card.className = "batalla-card";
    const rec = r.barbarosRecord || 0;
    card.innerHTML = `<h3>${escapar(FWM.mapasHechos.MAPAS.arena.nombre)}</h3><p class="batalla-historia">${escapar(FWM.mapasHechos.MAPAS.arena.texto)}</p>
      <p class="barbaros-record">${rec ? TB.record.replace("{n}", rec) : TB.sinRecord}</p>`;
    // el bando decide tu rasgo, como siempre
    const selBando = document.createElement("select");
    for (const [id, b] of Object.entries(App.datos.bandos)) { if (b.noJugable) continue; const o = document.createElement("option"); o.value = id; o.textContent = b.nombre; if (id === aj.bando) o.selected = true; selBando.appendChild(o); }
    const campo = document.createElement("div"); campo.className = "campo"; const lab = document.createElement("label"); lab.textContent = T.tuBando; campo.appendChild(lab); campo.appendChild(selBando); card.appendChild(campo);
    const rasgo = document.createElement("p"); rasgo.className = "pista"; card.appendChild(rasgo);
    const pintar = () => { const b = App.datos.bandos[selBando.value]; rasgo.textContent = b ? b.rasgo : ""; };
    selBando.addEventListener("change", pintar); pintar();
    const consejo = document.createElement("p"); consejo.className = "pista"; consejo.textContent = TB.consejo; card.appendChild(consejo);
    const fila = document.createElement("div"); fila.className = "modal-botones"; fila.style.marginTop = "10px";
    fila.appendChild(App.boton(TB.jugar, () => {
      FWM.guardado.guardarAjustes({ bando: selBando.value });
      App.nuevaPartida({ tipo: "barbaros", mapaHecho: "arena", bando: selBando.value, rivales: 1, dificultad: "normal", tecnologia: "todo", hucha: 2, recursos: "equilibrado", limite: 0, semilla: Math.floor(Math.random() * 1e6) + 1 });
    }, "btn btn-primario"));
    // ---- a dobles: dos personas contra las hordas (9 sep 2026) ----
    const estadoCoop = document.createElement("div"); estadoCoop.className = "duelo-estado"; estadoCoop.hidden = true;
    const empezarCoop = (ses) => {
      FWM.guardado.guardarAjustes({ bando: selBando.value });
      App.nuevaPartida({ tipo: "barbaros", coop: ses, mapaHecho: "arena", bando: selBando.value, rivales: 2, dificultad: "normal", tecnologia: "todo", hucha: 2, recursos: "equilibrado", limite: 0, semilla: ses.semilla });
    };
    const mostrarCoop = (texto, seg, codigo) => {
      estadoCoop.hidden = false; estadoCoop.innerHTML = "";
      if (codigo) { const c = document.createElement("div"); c.className = "duelo-codigo"; c.textContent = codigo; estadoCoop.appendChild(c); }
      const t = document.createElement("p"); t.textContent = texto.replace("{s}", seg == null ? "" : seg); estadoCoop.appendChild(t);
      if (codigo) estadoCoop.appendChild(botonesCodigo(codigo, T.coop.mensajeCoop));
      estadoCoop.appendChild(App.boton(T.cancelar, () => { FWM.duelo.cancelarBusqueda(); estadoCoop.hidden = true; }, "btn btn-peq btn-claro"));
    };
    if (FWM.nube.posible()) {
      fila.appendChild(App.boton(T.coop.boton, () => {
        if (!FWM.nube.usuario()) { FWM.paneles.aviso(T.duelo.necesitaCuenta, 4000); return; }
        if (!FWM.duelo.retar(App, null, mostrarCoop, empezarCoop, { coop: true })) FWM.paneles.aviso(T.duelo.sinRed, 3000);
      }, "btn btn-claro"));
    }
    // el segundo botón lleva al ranking: ponía "Bárbaros" (el nombre de la pestaña) y no se entendía
    if (FWM.nube.disponible()) fila.appendChild(App.boton(T.batalla.verRanking, () => vistaRanking("barbaros"), "btn btn-claro"));
    card.appendChild(fila); card.appendChild(estadoCoop);
    // entrar con el código que te han mandado
    if (FWM.nube.posible()) {
      const filaC = document.createElement("div"); filaC.className = "duelo-codigo-fila";
      const inp = document.createElement("input"); inp.placeholder = T.duelo.codigo; inp.maxLength = 4; inp.autocapitalize = "characters"; inp.className = "duelo-input"; filaC.appendChild(inp);
      filaC.appendChild(App.boton(T.duelo.entrar, () => {
        const c = inp.value.trim(); if (c.length < 4) return;
        if (!FWM.nube.usuario()) { FWM.paneles.aviso(T.duelo.necesitaCuenta, 4000); return; }
        if (!FWM.duelo.retar(App, c, mostrarCoop, empezarCoop, { coop: true })) FWM.paneles.aviso(T.duelo.sinRed, 3000);
      }, "btn btn-claro"));
      const lab = document.createElement("p"); lab.className = "suave"; lab.style.margin = "10px 0 0"; lab.textContent = T.coop.tengoCodigo;
      card.appendChild(lab); card.appendChild(filaC);
    }
    cont.appendChild(card);
    vista(cont);
  }

  // ---------- grandes batallas: mapas históricos con cada reino en su tierra ----------
  function vistaEscenarios(elegido) {
    const T = App.datos.textos, TE = T.escenarios; const aj = FWM.guardado.ajustes();
    const lista = FWM.datosBase.escenarios || [];
    const esc = lista.find(e => e.id === elegido) || lista[0];
    const cont = document.createElement("div"); cont.appendChild(cabecera(TE.titulo));
    const p = document.createElement("p"); p.className = "pista"; p.textContent = TE.pista; cont.appendChild(p);
    // elegir escenario
    const tabs = document.createElement("div"); tabs.className = "glosario-tabs";
    for (const e of lista) tabs.appendChild(App.boton(e.nombre, () => vistaEscenarios(e.id), "btn btn-peq " + (e.id === esc.id ? "btn-primario" : "btn-claro")));
    cont.appendChild(tabs);
    if (!esc) { vista(cont); return; }
    const mapa = FWM.mapasHechos.parsear(esc.mapa);
    const bandosMapa = Object.keys(mapa.porBando || {});
    const card = document.createElement("div"); card.className = "batalla-card";
    card.innerHTML = `<h3>${escapar(esc.nombre)}</h3><p class="batalla-historia">${escapar(esc.texto)}</p>`;
    // bando (dónde empiezas), rivales, turnos y fin
    const selBando = document.createElement("select");
    for (const b of bandosMapa) { const o = document.createElement("option"); o.value = b; o.textContent = App.datos.bandos[b].nombre; if (b === aj.bando) o.selected = true; selBando.appendChild(o); }
    const campo = (etiqueta, nodo) => { const d = document.createElement("div"); d.className = "campo"; const l = document.createElement("label"); l.textContent = etiqueta; d.appendChild(l); d.appendChild(nodo); return d; };
    card.appendChild(campo(TE.tuBando, selBando));
    const selRivales = document.createElement("select");
    for (let n = esc.rivalesMin; n <= Math.min(esc.rivalesMax, bandosMapa.length - 1); n++) { const o = document.createElement("option"); o.value = String(n); o.textContent = String(n); if (n === esc.rivalesPorDefecto) o.selected = true; selRivales.appendChild(o); }
    card.appendChild(campo(T.jugadores, selRivales));
    const selFin = document.createElement("select");
    for (const [v, txt] of [["puntos", T.finPuntos], ["eliminacion", T.finEliminacion]]) { const o = document.createElement("option"); o.value = v; o.textContent = txt; selFin.appendChild(o); }
    card.appendChild(campo(T.finPartida, selFin));
    const selTurnos = document.createElement("select");
    for (const n of [30, 40, 60, 80, 120]) { const o = document.createElement("option"); o.value = String(n); o.textContent = String(n); if (n === esc.turnos) o.selected = true; selTurnos.appendChild(o); }
    const campoTurnos = campo(T.limiteTurnos, selTurnos); card.appendChild(campoTurnos);
    const rasgo = document.createElement("p"); rasgo.className = "pista"; card.appendChild(rasgo);
    const pintar = () => { const b = App.datos.bandos[selBando.value]; rasgo.textContent = (b ? b.rasgo + " " : "") + TE.bandoPista; campoTurnos.hidden = selFin.value !== "puntos"; };
    selBando.addEventListener("change", pintar); selFin.addEventListener("change", pintar); pintar();
    const av = document.createElement("p"); av.className = "pista"; av.textContent = TE.aviso; card.appendChild(av);
    const fila = document.createElement("div"); fila.className = "modal-botones"; fila.style.marginTop = "10px";
    fila.appendChild(App.boton(TE.jugar, () => {
      FWM.guardado.guardarAjustes({ bando: selBando.value });
      App.nuevaPartida(Object.assign({ tipo: "escenario", escenario: esc.id, mapaHecho: esc.mapa, bando: selBando.value,
        rivales: parseInt(selRivales.value, 10), dificultad: "normal", tecnologia: "todo", hucha: 2, recursos: "equilibrado",
        semilla: Math.floor(Math.random() * 1e6) + 1, limite: selFin.value === "puntos" ? parseInt(selTurnos.value, 10) : 0 }));
    }, "btn btn-primario"));
    card.appendChild(fila); cont.appendChild(card);
    vista(cont);
  }

  // ---------- campaña: diez mapas hechos a mano, uno tras otro ----------
  // ---------- campaña: el camino hasta la Torre del Cuervo ----------
  // Un mapa de ruta, no una lista: se ve por dónde vas y hacia dónde. No se puede saltar de punto: el
  // siguiente se abre al ganar el anterior (9 sep 2026, pedido por Rodrigo).
  function vistaCampana() {
    const T = App.datos.textos, TC = T.campana; const C = FWM.campana; const aj = FWM.guardado.ajustes();
    const cont = document.createElement("div"); cont.appendChild(cabecera(TC.titulo));
    const pr = C.progreso(); const sig = C.siguiente();
    const p = document.createElement("p"); p.className = "pista"; p.textContent = TC.pista; cont.appendChild(p);
    const prog = document.createElement("p"); prog.innerHTML = `<b>${sig ? TC.progreso.replace("{n}", pr.hechos).replace("{t}", pr.total) : TC.completa}</b>`; cont.appendChild(prog);
    const ruta = FWM.rutaCampana.crear(App, C, (cap) => abrirCapitulo(cap, C, aj));
    cont.appendChild(ruta);
    vista(cont);
    // el mapa se lee de abajo arriba: se abre por donde vas (al empezar, el primer sello, abajo del todo)
    setTimeout(() => { const aqui = ruta.querySelector(".rc-parada.sig") || ruta.querySelector(".rc-parada"); if (aqui && aqui.scrollIntoView) aqui.scrollIntoView({ block: "center" }); }, 60);
  }

  // Ficha del capítulo: la historia primero (el diálogo) y luego el botón de jugar.
  function abrirCapitulo(cap, C, aj) {
    const TX = App.datos.textos, TC = TX.campana;
    const hecha = C.superado(cap.id);
    const caja = document.createElement("div"); caja.className = "campana-ficha";
    const mapa = FWM.mapasHechos.MAPAS[cap.mapa];
    const dif = cap.dificultad === "dificil" ? TX.dificil : cap.dificultad === "facil" ? TX.facil : TX.normal;
    const premio = `${TC.premio}: +${cap.premio.oro} ${TX.heroeUI.oroCorto}${cap.premio.objeto && App.datos.objetos[cap.premio.objeto] ? " · " + App.datos.objetos[cap.premio.objeto].nombre : ""}`;
    caja.innerHTML = `<h2>${escapar(cap.nombre)}</h2>
      ${cap.historia ? `<div class="campana-dialogo"><div class="cd-voz">${escapar(cap.voz || "")}</div><p>${escapar(cap.historia)}</p></div>` : ""}
      <p class="campana-que">${escapar(cap.texto)}</p>
      <p class="campana-datos">${mapa ? escapar(mapa.nombre) + " · " : ""}${TC.rivales.replace("{n}", cap.rivales).replace("{d}", dif).replace("{t}", cap.limite)}</p>
      <p class="campana-premio">${premio}</p>
      <p class="campana-datos">${TC.comoGanar.replace("{t}", cap.limite)}</p>`;
    const fila = document.createElement("div"); fila.className = "modal-botones";
    fila.appendChild(App.boton(hecha ? TC.repetir : TC.jugar, () => { App.cerrarModal(); App.nuevaPartida(C.opciones(cap.id, aj.bando || "aleatorio")); }, "btn btn-primario"));
    fila.appendChild(App.boton(TX.cancelar, () => App.cerrarModal(), "btn btn-claro"));
    caja.appendChild(fila);
    App.modalNodo(caja);
  }

  // ---------- batalla de la semana: un mapa hecho a mano con reglas propias ----------
  function vistaBatalla() {
    const T = App.datos.textos, TB = T.batalla; const B = FWM.batalla; const aj = FWM.guardado.ajustes();
    const cont = document.createElement("div"); cont.appendChild(cabecera(TB.titulo));
    const b = B.actual(); if (!b) { vista(cont); return; }
    const p = document.createElement("p"); p.className = "pista"; p.textContent = TB.pista; cont.appendChild(p);
    const mapa = FWM.mapasHechos.MAPAS[b.mapa]; const dif = b.dificultad === "dificil" ? T.dificil : b.dificultad === "facil" ? T.facil : T.normal;
    const card = document.createElement("div"); card.className = "batalla-card";
    card.innerHTML = `<h3>${escapar(b.nombre)}${b.anio ? ` <small class="batalla-anio">${b.anio}</small>` : ""}</h3>
      <p class="batalla-historia">${escapar(b.historia || "")}</p>
      <p class="suave" style="margin:0 0 6px"><b>${escapar(b.regla || "")}</b></p>
      <div>${[mapa ? mapa.nombre : "", `${b.rivales} ${T.jugadores.toLowerCase()}`, dif, `${b.limite} ${T.turnos}`, b.hucha === 3 ? "oro ×3" : b.hucha === 1 ? "mitad de oro" : ""].filter(Boolean).map(x => `<span class="batalla-regla">${x}</span>`).join("")}</div>
      <p class="pista" style="margin:8px 0 0">${TB.noEsSimulacion} ${B.diasRestantes() <= 1 ? TB.cambiaManana : TB.cambia.replace("{n}", B.diasRestantes())}</p>`;
    const mio = B.leer(); const est = document.createElement("p"); est.style.margin = "6px 0 0"; est.textContent = mio.partidas ? TB.tuSemana.replace("{n}", mio.partidas).replace("{m}", mio.mejor) : TB.sinJugar; card.appendChild(est);
    const fila = document.createElement("div"); fila.className = "modal-botones"; fila.style.marginTop = "10px";
    fila.appendChild(App.boton(TB.jugar, () => App.nuevaPartida(B.opciones(aj.bando || "aleatorio")), "btn btn-primario"));
    if (FWM.nube.disponible()) fila.appendChild(App.boton(TB.verRanking, () => vistaRanking("batalla"), "btn btn-claro"));
    card.appendChild(fila); cont.appendChild(card);
    vista(cont);
  }

  // ---------- el héroe: cabecera limpia y pestañas ----------
  function vistaHeroe(op) {
    const T = App.datos.textos, TH = T.heroeUI; const D = FWM.datosBase.heroes; const H = FWM.heroe;
    if (op && op.pestana) pestanaHeroe = op.pestana;
    const h = H.leer(); const pr = H.progreso(); const clase = D.clases[h.clase];
    const cont = document.createElement("div"); cont.appendChild(cabecera(TH.titulo));
    const card = document.createElement("section"); card.className = "reino-sec heroe-card";
    const fig = figuraHeroe(150, true); card.appendChild(fig);
    const info = document.createElement("div"); info.className = "heroe-info";
    let barra = pr.siguienteNivel ? `<div class="heroe-barra"><i style="width:${Math.min(100, Math.round(100 * (pr.puntos - pr.desdeNivel) / (pr.siguienteNivel.puntos - pr.desdeNivel)))}%"></i></div><small class="suave">${TH.siguienteNivel.replace("{nombre}", pr.siguienteNivel.nombre).replace("{n}", pr.siguienteNivel.puntos)} · ${pr.puntos} ${T.puntos.toLowerCase()}</small>` : `<small class="suave">${TH.cima} · ${pr.puntos} ${T.puntos.toLowerCase()}</small>`;
    info.innerHTML = `<div class="perfil-escalon">${FWM.heroes.nombreNivel(H.nivel())}</div><div class="perfil-nombre">${escapar(nombreJugador() || TH.titulo)}</div><div class="suave lineas"><span>${TH.nivel} ${Math.min(8, H.nivel())}</span><span>${pr.puntos} ${T.puntos.toLowerCase()}</span><span>${h.oro || 0} ${TH.oroCorto}</span></div><div><b>${clase.nombre}</b> <small class="suave">${clase.rasgo}</small></div>${barra}`;
    if (pr.disponibles > 0) { const b = App.boton(`${TH.gastar} (${pr.disponibles})`, () => vistaHeroe({ pestana: "mejoras" }), "btn btn-peq btn-primario late"); info.appendChild(b); }
    else if (pr.umbralSiguiente) { const s = document.createElement("small"); s.className = "suave"; s.textContent = TH.siguientePunto.replace("{n}", pr.umbralSiguiente); info.appendChild(s); }
    card.appendChild(info); cont.appendChild(card);
    if (!FWM.nube.usuario() && FWM.nube.posible()) { const av = document.createElement("div"); av.className = "aviso-cuenta"; const t = document.createElement("span"); t.textContent = TH.sinCuenta; av.appendChild(t); av.appendChild(App.boton(T.crearCuentaOEntrar, () => vistaCuenta("alta", () => vistaHeroe()), "btn btn-peq btn-primario")); cont.appendChild(av); }
    // pestañas
    const tabs = document.createElement("div"); tabs.className = "glosario-tabs";
    for (const [id, txt] of [["mejoras", TH.mejoras], ["objetos", TH.objetos], ["tienda", TH.tienda], ["niveles", TH.niveles], ["logros", TH.logros]]) tabs.appendChild(App.boton(txt, () => vistaHeroe({ pestana: id }), "btn btn-peq " + (id === pestanaHeroe ? "btn-primario" : "btn-claro")));
    cont.appendChild(tabs);
    const sec = document.createElement("section"); sec.className = "reino-sec";
    if (pestanaHeroe === "mejoras") pintarMejoras(sec, h, pr);
    else if (pestanaHeroe === "objetos") pintarObjetos(sec, h);
    else if (pestanaHeroe === "tienda") pintarTienda(sec, h);
    else if (pestanaHeroe === "niveles") sec.innerHTML = `<h3>${TH.niveles}</h3>` + D.niveles.map(n => `<div class="heroe-nivel${n.nivel <= H.nivel() ? " tiene" : ""}"><span>${n.nivel}. <b>${n.nombre}</b> <small class="suave">${n.puntos == null ? TH.leyenda : n.puntos + " " + T.puntos.toLowerCase()}</small></span><span class="suave">${n.unidad ? TH.desbloquea + ": " + (App.datos.tropas[n.unidad] ? App.datos.tropas[n.unidad].nombre : (TH.unidadFutura[n.unidad] || TH.unidadPronto)) : TH.nada}</span></div>`).join("");
    else { sec.className = ""; sec.appendChild(seccionMedallas(FWM.guardado.records())); }
    cont.appendChild(sec);
    vista(cont, !!(op && (op.pestana || op.subida || op.quieto)));
    if (op && op.subida) fig.classList.add("brilla");
  }
  // Mejoras: primero las que puedes tocar ahora; las demás, en gris debajo.
  function pintarMejoras(sec, h, pr) {
    const T = App.datos.textos, TH = T.heroeUI; const D = FWM.datosBase.heroes; const H = FWM.heroe;
    const hn = Object.assign({}, h, { nivel: H.nivelJugable() });
    const filas = Object.entries(D.mejoras).map(([id, m]) => ({ id, m, tengo: h.mejoras[id] || 0, motivo: FWM.heroes.puedeMejorar(hn, id) }));
    // las completas ("tope") se quedan en su sitio, marcadas al máximo; a "Más adelante" solo van las aún bloqueadas
    const ahora = filas.filter(f => !f.motivo || f.motivo === "tope"), luego = filas.filter(f => f.motivo && f.motivo !== "tope");
    const p = document.createElement("p"); p.className = "suave"; p.style.margin = "0 0 6px"; p.textContent = pr.disponibles > 0 ? TH.sinGastar.replace("{n}", pr.disponibles) : (pr.umbralSiguiente ? TH.siguientePunto.replace("{n}", pr.umbralSiguiente) : TH.cima); sec.appendChild(p);
    // elegir una mejora la marca; el punto solo se gasta al pulsar Confirmar
    let elegida = null; const confirmar = document.createElement("div"); confirmar.className = "heroe-confirmar"; confirmar.hidden = true;
    const pintarConfirmar = () => {
      confirmar.innerHTML = ""; confirmar.hidden = !elegida; sec.querySelectorAll(".heroe-mejora").forEach(x => x.classList.toggle("elegida", x.dataset.id === elegida));
      if (!elegida) return;
      const m = D.mejoras[elegida]; const t = document.createElement("span"); t.innerHTML = `<b>${m.nombre}</b> · ${m.texto}`; confirmar.appendChild(t);
      const fila = document.createElement("div"); fila.className = "modal-botones";
      fila.appendChild(App.boton(T.cancelar, () => { elegida = null; pintarConfirmar(); }, "btn btn-peq btn-claro"));
      fila.appendChild(App.boton(T.confirmar, () => { const err = H.mejorar(elegida); if (err) FWM.paneles.aviso(T.errores[err] || err, 2500); else { FWM.sonido.moneda(); vistaHeroe({ subida: elegida }); } }, "btn btn-peq btn-primario"));
      confirmar.appendChild(fila);
    };
    const fila = (f, activa) => {
      const completa = f.motivo === "tope";
      const d = document.createElement("div"); d.className = "heroe-mejora" + (f.tengo ? " tiene" : "") + (activa ? "" : " apagada") + (completa ? " completa" : ""); d.dataset.id = f.id;
      const req = f.motivo === "requiere" ? Object.entries(f.m.requiere).map(([r, n]) => D.mejoras[r].nombre + " " + n).join(", ") : "";
      d.innerHTML = `<div class="hm-txt"><b>${f.m.nombre}</b> <span class="hm-puntos">${"●".repeat(f.tengo)}${"○".repeat(Math.max(0, f.m.peldanos - f.tengo))}</span><br><small class="suave">${f.m.texto}${req ? " · " + TH.requiere.replace("{que}", req) : ""}</small></div>`;
      if (completa) { const b = document.createElement("span"); b.className = "hm-completa"; b.textContent = TH.tope; d.appendChild(b); }
      else if (activa) { const b = App.boton(TH.elegir, () => { elegida = f.id; pintarConfirmar(); confirmar.scrollIntoView({ block: "nearest" }); }, "btn btn-peq " + (pr.disponibles > 0 ? "btn-primario" : "btn-claro")); b.disabled = pr.disponibles <= 0; d.appendChild(b); }
      return d;
    };
    sec.appendChild(confirmar);
    for (const fam of ["heroe", "aura", "reino", "aspecto"]) {
      const mias = ahora.filter(f => f.m.familia === fam); if (!mias.length) continue;
      const h3 = document.createElement("h3"); h3.textContent = TH.familia[fam]; sec.appendChild(h3);
      for (const f of mias) sec.appendChild(fila(f, true));
    }
    if (luego.length) { const h3 = document.createElement("h3"); h3.textContent = TH.masAdelante; h3.className = "suave"; sec.appendChild(h3); for (const f of luego) sec.appendChild(fila(f, false)); }
  }
  // Objetos: cuatro huecos; tocar uno enseña lo que tienes para él.
  function pintarObjetos(sec, h) {
    const T = App.datos.textos, TH = T.heroeUI; const O = App.datos.objetos || {}; const H = FWM.heroe;
    sec.innerHTML = `<h3>${TH.objetos} <span class="suave">· ${TH.oro}: <b>${h.oro || 0}</b></span></h3>`;
    const slots = document.createElement("div"); slots.className = "heroe-slots"; sec.appendChild(slots);
    const detalle = document.createElement("div"); sec.appendChild(detalle);
    const tipos = ["arma", "escudo", "montura", "cabeza", "consumible", "aspecto"];
    const inv = (h.inventario || []).filter(id => O[id]);
    let abierto = null;
    const pintar = () => {
      slots.innerHTML = ""; detalle.innerHTML = "";
      for (const tipo of tipos) {
        const id = h.objetos && h.objetos[tipo]; const o = id && O[id];
        const cuantos = inv.filter(x => O[x].tipo === tipo).length;
        const d = document.createElement("button"); d.className = "heroe-slot" + (o ? " lleno" : "") + (abierto === tipo ? " sel" : "");
        d.innerHTML = `<small class="suave">${TH.tipos[tipo]}</small><div class="medalla-nombre">${o ? o.nombre : TH.vacio}</div><small>${o ? o.texto : (cuantos ? cuantos + " " + TH.disponibles : "")}</small>`;
        d.addEventListener("click", () => { abierto = abierto === tipo ? null : tipo; pintar(); });
        slots.appendChild(d);
      }
      if (!abierto) { if (!inv.length) { const p = document.createElement("p"); p.className = "suave"; p.textContent = TH.nadaInventario + " "; p.appendChild(App.boton(T.jugar, vistaJugar, "btn btn-peq btn-primario")); detalle.appendChild(p); } return; }
      const equipado = h.objetos && h.objetos[abierto];
      if (equipado) detalle.appendChild(App.boton(TH.quitar + ": " + O[equipado].nombre, () => { H.desequipar(abierto); vistaHeroe({ quieto: true }); }, "btn btn-peq btn-claro"));
      const candidatos = inv.filter(id => O[id].tipo === abierto && id !== equipado);
      if (!candidatos.length && !equipado) { const p = document.createElement("p"); p.className = "suave"; p.textContent = TH.nadaDeEsteTipo; detalle.appendChild(p); }
      for (const id of candidatos) {
        const o = O[id]; const fila = document.createElement("div"); fila.className = "heroe-mejora tiene rareza-" + o.rareza;
        fila.innerHTML = `<div class="hm-txt"><b>${o.nombre}</b> <small class="suave">${App.datos.objetosReglas.rarezas[o.rareza]}</small><br><small class="suave">${o.texto}</small></div>`;
        fila.appendChild(App.boton(TH.equipar, () => { const err = H.equipar(id); if (err) FWM.paneles.aviso(T.errores[err] || err, 2500); else { FWM.sonido.pop(); vistaHeroe({ quieto: true }); } }, "btn btn-peq btn-primario"));
        detalle.appendChild(fila);
      }
    };
    pintar();
  }
  function pintarTienda(sec, h) {
    const T = App.datos.textos, TH = T.heroeUI; const O = App.datos.objetos || {}; const H = FWM.heroe;
    sec.innerHTML = `<h3>${TH.tienda} <span class="suave">· ${TH.oro}: <b>${h.oro || 0}</b></span></h3><p class="suave" style="margin:0 0 6px">${TH.tiendaPista}</p>`;
    for (const [id, o] of Object.entries(O)) {
      if (!o.tienda) continue;
      const ya = H.tiene(id); const fila = document.createElement("div"); fila.className = "heroe-mejora rareza-" + o.rareza + (ya ? " tiene" : "");
      fila.innerHTML = `<div class="hm-txt"><b>${o.nombre}</b> <small class="suave">${TH.tipos[o.tipo]}</small><br><small class="suave">${o.texto}</small></div>`;
      const b = App.boton(ya ? TH.equipado : TH.precio.replace("{n}", o.tienda), () => { const err = H.comprar(id); if (err) FWM.paneles.aviso(T.errores[err] || err, 2500); else { FWM.sonido.moneda(); vistaHeroe({ quieto: true }); } }, "btn btn-peq " + (!ya && (h.oro || 0) >= o.tienda ? "btn-primario" : "btn-claro"));
      b.disabled = ya || (h.oro || 0) < o.tienda; fila.appendChild(b); sec.appendChild(fila);
    }
    const otros = Object.entries(O).filter(([, o]) => !o.tienda);
    if (otros.length) { const h3 = document.createElement("h3"); h3.className = "suave"; h3.textContent = TH.noSeVenden; sec.appendChild(h3); const p2 = document.createElement("p"); p2.className = "suave"; p2.style.margin = "0"; p2.innerHTML = otros.map(([id, o]) => { const como = o.medalla ? TH.comoSale.medalla.replace("{nombre}", (App.datos.medallas.find(m => m.id === o.medalla.split(":")[0]) || {}).nombre || "").replace("{nivel}", T.nivelesMedalla[Number(o.medalla.split(":")[1]) - 1] || "") : o.campana ? TH.comoSale.campana.replace("{n}", o.campana) : o.liga ? TH.comoSale.liga.replace("{n}", o.liga) : TH.comoSale.botin; return `<b>${o.nombre}</b>: ${como}${H.tiene(id) ? " ✓" : ""}`; }).join("<br>"); sec.appendChild(p2); }
  }
  // Logros: medallas, las ganadas a color.
  function seccionMedallas(r) {
    const T = App.datos.textos; const lista = App.datos.medallas || []; const M = FWM.medallas;
    const sec = document.createElement("section"); sec.className = "reino-sec";
    const n = lista.reduce((s, m) => s + M.nivelGuardado(r, m.id), 0), total = lista.reduce((s, m) => s + M.maxNivel(m), 0);
    sec.innerHTML = `<h3>${T.medallas} <span class="suave">· ${T.medallasPista.replace("{n}", n).replace("{total}", total)}</span></h3>`;
    const g = document.createElement("div"); g.className = "medallas";
    for (const m of lista) {
      const nivel = M.nivelGuardado(r, m.id), ok = nivel > 0, max = nivel >= M.maxNivel(m);
      const d = document.createElement("div"); d.className = "medalla" + (ok ? " ganada" : "") + (m.niveles && ok ? " nivel-" + nivel : "");
      const ic = document.createElement("div"); ic.className = "medalla-icono"; ic.appendChild(FWM.figuras.canvasMedalla(m.icono, 56, !ok)); d.appendChild(ic);
      const nm = document.createElement("div"); nm.className = "medalla-nombre"; nm.textContent = M.nombre(m, nivel, T); d.appendChild(nm);
      if (m.niveles) { const es = document.createElement("div"); es.className = "medalla-estrellas"; es.textContent = "★".repeat(nivel) + "☆".repeat(M.maxNivel(m) - nivel); d.appendChild(es); }
      const ds = document.createElement("small"); ds.textContent = max ? (m.niveles ? T.nivelMaximo + " · " : "") + M.descripcion(m, nivel - 1) : (ok ? T.siguienteObjetivo + ": " : "") + M.descripcion(m, nivel); d.appendChild(ds);
      if (m.premio) { const pr = document.createElement("small"); pr.className = "medalla-premio"; const sig = Math.min(nivel, (m.premio.oro || []).length - 1); pr.textContent = "+" + ((m.premio.oro || [])[max ? sig : nivel] || 0) + " " + T.heroeUI.oroCorto + (m.premio.objeto && App.datos.objetos[m.premio.objeto.id] ? " · " + App.datos.objetos[m.premio.objeto.id].nombre : ""); d.appendChild(pr); }
      g.appendChild(d);
    }
    sec.appendChild(g); return sec;
  }

  // ---------- ranking: tu tarjeta arriba, una lista y un selector ----------
  async function vistaRanking(pestana) {
    const T = App.datos.textos;
    pestana = pestana || "semana";
    const periodo = (pestana === "semana" || pestana === "batalla") ? "semana" : pestana === "dia" ? "hoy" : "total", modo = (pestana === "mejor" || pestana === "dia" || pestana === "batalla" || pestana === "barbaros") ? "mejor" : "suma", tipoFiltro = pestana === "dia" ? "dia" : pestana === "batalla" ? "batalla" : pestana === "barbaros" ? "barbaros" : null;
    const r = FWM.guardado.records();
    const cont = document.createElement("div");
    cont.appendChild(cabecera(T.ranking));
    if (!FWM.nube.disponible()) { const aviso = document.createElement("p"); aviso.className = "pista"; aviso.textContent = T.sinConexion; cont.appendChild(aviso); cont.appendChild(marcadorLocal(r)); vista(cont); return; }
    // tu tarjeta (o invitación pequeña)
    const cta = document.createElement("section"); cta.className = "reino-sec perfil-card";
    if (FWM.nube.usuario()) {
      const izq = document.createElement("div"); izq.className = "perfil-izq";
      izq.innerHTML = `<div class="perfil-escalon">${FWM.heroes.nombreNivel(FWM.heroe.nivel())}</div><div class="perfil-nombre">${escapar(FWM.nube.nombre())}</div><div class="suave" id="rk-mio">…</div>`;
      cta.appendChild(izq);
      const der = document.createElement("div"); der.className = "perfil-der"; const fig = figuraHeroe(72, true); fig.style.cursor = "pointer"; fig.addEventListener("click", () => vistaHeroe()); der.appendChild(fig); cta.appendChild(der);
    } else {
      cta.innerHTML = `<p style="margin:0">${T.paraRanking}</p>`;
      const fila = document.createElement("div"); fila.className = "acciones-gestion"; fila.style.border = "0"; fila.style.margin = "4px 0 0";
      fila.appendChild(App.boton(T.crearCuenta, () => vistaCuenta("alta", () => vistaRanking(pestana)), "btn btn-peq btn-primario"));
      fila.appendChild(App.boton(T.entrar, () => vistaCuenta("entrar", () => vistaRanking(pestana)), "btn btn-peq btn-claro"));
      cta.appendChild(fila);
    }
    cont.appendChild(cta);
    // selector
    const sel = document.createElement("div"); sel.className = "glosario-tabs";
    for (const [id, txt] of [["semana", T.rankingSemana], ["total", T.rankingTotal], ["dia", T.rankingDia], ["batalla", T.batalla.ranking], ["barbaros", T.barbaros.ranking], ["mejor", T.rankingMejor], ["duelos", T.duelo.rankingDuelos]]) sel.appendChild(App.boton(txt, () => vistaRanking(id), "btn btn-peq " + (id === pestana ? "btn-primario" : "btn-claro")));
    cont.appendChild(sel);
    if (pestana === "duelos") { vista(cont); seccionDuelos(cont); return; }
    const online = document.createElement("section"); online.className = "reino-sec";
    const pista = document.createElement("p"); pista.className = "pista"; pista.style.margin = "0 0 6px"; pista.textContent = pestana === "dia" ? T.rankingDiaPista : pestana === "batalla" ? T.batalla.rankingPista : pestana === "barbaros" ? T.barbaros.rankingPista : modo === "mejor" ? T.rankingMejorPista : T.rankingSumaPista; online.appendChild(pista);
    const lista = document.createElement("div"); lista.className = "historial"; lista.innerHTML = `<p class="suave">…</p>`; online.appendChild(lista);
    cont.appendChild(online);
    vista(cont);
    try {
      const [filas, mio] = await Promise.all([FWM.nube.ranking(periodo, 50, modo, tipoFiltro), FWM.nube.miRanking(periodo, modo, tipoFiltro)]);
      // el héroe de cada uno (clase, nivel, mejoras, aspecto), para dibujarlo en vez de un soldado genérico
      let perfiles = {}; try { perfiles = await FWM.nube.perfilesDe(filas.map(f => f.usuario)); } catch (e) { perfiles = {}; }
      lista.innerHTML = "";
      let ia = []; try { ia = JSON.parse(localStorage.getItem("fwm.ultimaIA") || "[]"); } catch (e) { /* nada */ }
      const yoId = FWM.nube.usuario() && FWM.nube.usuario().id;
      const miTotal = mio ? Number(mio.puntos) : (filas.find(f => f.usuario === yoId) || {}).puntos;
      const mezcla = filas.map(f => ({ tipo: "jugador", nombre: f.nombre, avatar: f.avatar, perfil: perfiles[f.usuario], puntos: Number(f.puntos), partidas: Number(f.partidas), posicion: Number(f.posicion), yo: f.usuario === yoId }))
        .concat(pestana === "mejor" ? ia.map(j => ({ tipo: "ia", nombre: j.apodo || "IA", bando: j.bando || j.nombre, puntos: j.puntos, personalidad: j.personalidad })) : [])
        .concat(modo === "suma" && pestana === "total" ? FWM.datosBase.heroes.niveles.filter(n => n.puntos).map(n => ({ tipo: "escalon", nombre: n.nombre, puntos: n.puntos })) : [])
        .sort((a, b) => b.puntos - a.puntos || (a.tipo === "jugador" ? -1 : 1));
      if (!filas.length) { const p = document.createElement("p"); p.className = "suave"; p.textContent = T.sinRanking; lista.appendChild(p); }
      for (const m of mezcla) {
        const d = document.createElement("div"); d.className = "rk-" + m.tipo;
        if (m.tipo === "jugador") { d.innerHTML = `<span class="rk-nombre">${m.posicion}. ${m.yo ? "<b>" : ""}${escapar(m.nombre)}${m.yo ? "</b>" : ""} <small class="suave">${m.partidas} ${T.partidas}</small></span><span><b>${m.puntos}</b></span>`; const hp = m.perfil && m.perfil.heroe && typeof m.perfil.heroe === "object" ? Object.assign({ clase: m.avatar || "espadachin" }, m.perfil.heroe, { nivel: m.perfil.nivel || 1 }) : null; const av = hp && FWM.figuras.canvasHeroe ? FWM.figuras.canvasHeroe(hp, m.yo ? "#2f6fd6" : "#8c7a5a", 30, false) : FWM.iconos.canvasTropa(m.avatar || "espadachin", m.yo ? "#2f6fd6" : "#8c7a5a", 26); av.className = "rk-avatar"; d.insertBefore(av, d.firstChild); }
        else if (m.tipo === "ia") d.innerHTML = `<span class="suave">${escapar(m.nombre)} <span class="chip">${T.iaEtiqueta}</span> <small>${escapar(m.bando)} · ${T.personalidades[m.personalidad] || ""}</small></span><span class="suave">${m.puntos}</span>`;
        else d.innerHTML = `<span>★ ${T.escalon}: <b>${m.nombre}</b></span><span>${m.puntos}</span>`;
        if (m.yo) d.style.background = "#e9f3e3";
        lista.appendChild(d);
      }
      const mioEl = cont.querySelector("#rk-mio");
      if (mioEl) mioEl.textContent = mio ? `${T.tuPosicion}: ${mio.posicion} · ${mio.puntos} ${T.puntos.toLowerCase()} · ${mio.partidas} ${T.partidas}` : T.sinPartidas;
      if (mio) FWM.heroe.anotarPuntosNube(periodo === "total" && modo === "suma" ? mio.puntos : 0);
      if (pestana === "mejor" && ia.length) { const n = document.createElement("p"); n.className = "pista"; n.textContent = T.iaUltimaPartida; lista.appendChild(n); }
    } catch (e) { lista.innerHTML = `<p class="error">${FWM.nube.textoError(e, T)}</p>`; }
  }
  function marcadorLocal(r) {
    const T = App.datos.textos; const sec = document.createElement("section"); sec.className = "reino-sec";
    if (!r.partidas) { sec.innerHTML = `<p class="suave">${T.sinPartidas}</p>`; return sec; }
    const mejor = Object.entries(r.mejorVictoria || {}).map(([k, v]) => `${T.tipos[k] || k}: ${v} ${T.turnos}`).join(" · ");
    sec.innerHTML = `<h3>${T.marcador}</h3><p><b>${T.puntos}</b>: ${FWM.guardado.textoPuntos(r, T)}</p><p><b>${T.records}</b>: ${T.partidas} ${r.partidas} · ${T.ganadas} ${r.ganadas} · ${T.racha} ${r.racha} (${T.mejorRacha} ${r.mejorRacha})${mejor ? " · " + T.mejorVictoria + " " + mejor : ""}</p>`;
    return sec;
  }

  // ---------- duelo: Buscar rival grande; jugar con un amigo, pequeño ----------
  // Mandar el código del reto a un amigo. Sin esto había que dictárselo por teléfono (8 sep 2026).
  function botonesCodigo(codigo, plantilla) {
    const T = App.datos.textos;
    const fila = document.createElement("div"); fila.className = "modal-botones duelo-mandar";
    const url = location.origin + location.pathname;
    const texto = (plantilla || T.duelo.mensajeReto).replace("{codigo}", codigo).replace("{url}", url);
    fila.appendChild(App.boton(T.duelo.porWhatsApp, () => {
      window.open("https://wa.me/?text=" + encodeURIComponent(texto), "_blank", "noopener");
    }, "btn btn-primario"));
    // en el móvil, el menú de compartir del sistema (WhatsApp, Telegram, mensajes…)
    if (navigator.share) fila.appendChild(App.boton(T.compartir.boton, () => {
      navigator.share({ text: texto }).catch(() => {});
    }, "btn btn-claro"));
    const bCopiar = App.boton(T.duelo.copiar, () => {
      const escribir = navigator.clipboard ? navigator.clipboard.writeText(texto) : Promise.reject();
      escribir.then(() => FWM.paneles.aviso(T.duelo.copiado, 2000)).catch(() => FWM.paneles.aviso(codigo, 4000));
    }, "btn btn-claro");
    fila.appendChild(bCopiar);
    return fila;
  }

  function vistaDuelo(op) {
    const T = App.datos.textos;
    const cont = document.createElement("div"); cont.appendChild(cabecera(T.duelo.titulo));
    if (!FWM.nube.usuario()) {
      const p = document.createElement("p"); p.textContent = T.duelo.necesitaCuenta; cont.appendChild(p);
      cont.appendChild(App.boton(T.crearCuentaOEntrar, () => vistaCuenta("alta", vistaDuelo), "btn btn-primario"));
      vista(cont); return;
    }
    const p = document.createElement("p"); p.className = "suave"; p.textContent = T.duelo.explicacion; cont.appendChild(p);
    const estadoP = document.createElement("div"); estadoP.className = "duelo-estado"; estadoP.hidden = true; cont.appendChild(estadoP);
    const botones = document.createElement("div"); botones.className = "inicio-botones"; cont.appendChild(botones);
    const mostrarEstado = (texto, seg, codigo) => {
      estadoP.hidden = false; botones.hidden = true; estadoP.innerHTML = "";
      if (codigo) { const c = document.createElement("div"); c.className = "duelo-codigo"; c.textContent = codigo; estadoP.appendChild(c); }
      const t = document.createElement("p"); t.textContent = texto.replace("{s}", seg == null ? "" : seg); estadoP.appendChild(t);
      // mandarlo por WhatsApp o copiarlo: si no, hay que dictar el código por teléfono (8 sep 2026)
      if (codigo) estadoP.appendChild(botonesCodigo(codigo));
      if (seg != null) { const g = document.createElement("div"); g.className = "duelo-girando"; estadoP.appendChild(g); }
      estadoP.appendChild(App.boton(T.cancelar, () => { FWM.duelo.cancelarBusqueda(); estadoP.hidden = true; botones.hidden = false; }, "btn btn-peq btn-claro"));
    };
    const empezar = (ses) => {
      estadoP.innerHTML = `<p><b>${T.duelo.rivalEncontrado.replace("{nombre}", escapar(ses.rival.nombre))}</b></p>`;
      estadoP.appendChild(FWM.figuras.canvasHeroe((ses.rival.heroe) || { clase: ses.rival.avatar || "espadachin", nivel: 1 }, "#d63b3b", 64, false));
      setTimeout(() => App.nuevaPartida({ tipo: "duelo", duelo: ses }), 1200);
    };
    botones.appendChild(App.boton(T.duelo.buscarRival, () => { if (!FWM.duelo.buscar(App, mostrarEstado, empezar)) FWM.paneles.aviso(T.duelo.sinRed, 3000); }, "btn btn-primario"));
    // con un amigo: plegado
    const amigo = document.createElement("div"); amigo.className = "duelo-amigo"; amigo.hidden = !(op && op.codigo);
    let igualar = true;
    const chk = document.createElement("label"); chk.className = "duelo-check"; const cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = true; cb.addEventListener("change", () => { igualar = cb.checked; }); chk.appendChild(cb); chk.appendChild(document.createTextNode(" " + T.duelo.igualar)); const chkP = document.createElement("small"); chkP.className = "suave"; chkP.textContent = T.duelo.igualarPista; chk.appendChild(chkP);
    amigo.appendChild(chk); // la opción se ve ANTES de crear el código: si va después, nadie la lee
    amigo.appendChild(App.boton(T.duelo.retar, () => { if (!FWM.duelo.retar(App, null, mostrarEstado, empezar, { igualar })) FWM.paneles.aviso(T.duelo.sinRed, 3000); }, "btn btn-primario"));
    const fila = document.createElement("div"); fila.className = "duelo-codigo-fila";
    const inp = document.createElement("input"); inp.placeholder = T.duelo.codigo; inp.maxLength = 4; inp.autocapitalize = "characters"; inp.className = "duelo-input"; fila.appendChild(inp);
    fila.appendChild(App.boton(T.duelo.entrar, () => { const c = inp.value.trim(); if (c.length < 4) return; if (!FWM.duelo.retar(App, c, mostrarEstado, empezar)) FWM.paneles.aviso(T.duelo.sinRed, 3000); }, "btn btn-claro"));
    const lab = document.createElement("p"); lab.className = "suave"; lab.style.margin = "8px 0 0"; lab.textContent = T.duelo.tengoCodigo; amigo.appendChild(lab); amigo.appendChild(fila);
    const enlace = App.boton(T.duelo.conAmigo + " ▾", () => { amigo.hidden = !amigo.hidden; }, "btn btn-peq btn-claro");
    botones.appendChild(enlace); botones.appendChild(amigo);
    vista(cont);
    if (op && op.codigo) { inp.value = op.codigo; if (!FWM.duelo.retar(App, op.codigo, mostrarEstado, empezar)) FWM.paneles.aviso(T.duelo.sinRed, 3000); }
  }

  // Liga de la semana pasada: si quedé entre los 3 primeros y no lo he reclamado, premio.
  async function reclamarLiga() {
    try {
      const T = App.datos.textos; const perfil = FWM.nube.perfil(); if (!perfil) return;
      const hoy = new Date(); const lunes = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() - ((hoy.getUTCDay() + 6) % 7)));
      const pasada = new Date(lunes.getTime() - 7 * 86400000); const clave = pasada.toISOString().slice(0, 10);
      if (perfil.liga_reclamada === clave) return;
      const filas = await FWM.nube.ligaSemanal(clave, 3);
      const mia = filas.find(f => f.usuario === FWM.nube.usuario().id);
      await FWM.nube.marcarLigaReclamada(clave);
      if (!mia || Number(mia.posicion) > 3 || Number(mia.ganado) <= 0) return;
      const pos = Number(mia.posicion); let premio = "";
      if (pos === 1 && FWM.heroe.darObjeto("mandoble")) premio = App.datos.objetos.mandoble.nombre; else if (pos === 2 && FWM.heroe.darObjeto("egida")) premio = App.datos.objetos.egida.nombre; else { FWM.heroe.darOro(150); premio = "150 " + T.heroeUI.oroCorto; }
      FWM.paneles.aviso(T.duelo.ligaPremio.replace("{pos}", pos).replace("{premio}", premio), 6000); FWM.sonido.fanfarria();
    } catch (e) { /* sin red o sin tabla */ }
  }

  // Pestaña Duelos del ranking: Elo, liga de la semana y mis últimos duelos con revancha.
  async function seccionDuelos(cont) {
    const T = App.datos.textos; const yoId = FWM.nube.usuario() && FWM.nube.usuario().id;
    const sec = document.createElement("section"); sec.className = "reino-sec";
    sec.innerHTML = `<h3>${T.duelo.rankingDuelos} · ${T.duelo.elo}</h3>`;
    const lista = document.createElement("div"); lista.className = "historial"; lista.innerHTML = `<p class="suave">…</p>`; sec.appendChild(lista);
    const secL = document.createElement("section"); secL.className = "reino-sec"; secL.innerHTML = `<h3>${T.duelo.liga}</h3><p class="pista" style="margin:0 0 6px">${T.duelo.ligaPista}</p>`;
    const listaL = document.createElement("div"); listaL.className = "historial"; listaL.innerHTML = `<p class="suave">…</p>`; secL.appendChild(listaL);
    const secH = document.createElement("section"); secH.className = "reino-sec"; secH.innerHTML = `<h3>${T.duelo.historial}</h3>`;
    const listaH = document.createElement("div"); listaH.className = "historial"; listaH.innerHTML = `<p class="suave">…</p>`; secH.appendChild(listaH);
    cont.appendChild(sec); cont.appendChild(secL); if (yoId) cont.appendChild(secH);
    const fila = (m, derecha) => { const d = document.createElement("div"); d.className = "rk-jugador"; if (m.usuario === yoId) d.style.background = "#e9f3e3"; d.innerHTML = `<span class="rk-nombre">${m.posicion}. ${m.usuario === yoId ? "<b>" : ""}${escapar(m.nombre)}${m.usuario === yoId ? "</b>" : ""} <small class="suave">${FWM.heroes.nombreNivel(Number(m.nivel) || 1)}</small></span><span>${derecha}</span>`; const av = FWM.iconos.canvasTropa(m.avatar || "espadachin", m.usuario === yoId ? "#2f6fd6" : "#8c7a5a", 26); av.className = "rk-avatar"; d.insertBefore(av, d.firstChild); return d; };
    try {
      const [rk, liga] = await Promise.all([FWM.nube.rankingDuelos(50), FWM.nube.ligaSemanal(null, 50)]);
      lista.innerHTML = ""; if (!rk.length) lista.innerHTML = `<p class="suave">${T.duelo.sinDuelos}</p>`;
      for (const m of rk) lista.appendChild(fila(m, `<b>${m.elo}</b> <small class="suave">${m.ganados}-${m.perdidos}</small>`));
      listaL.innerHTML = ""; if (!liga.length) listaL.innerHTML = `<p class="suave">${T.duelo.sinDuelos}</p>`;
      for (const m of liga) listaL.appendChild(fila(m, `<b>${Number(m.ganado) > 0 ? "+" : ""}${m.ganado}</b> <small class="suave">${m.duelos}</small>`));
    } catch (e) { lista.innerHTML = `<p class="error">${FWM.nube.textoError(e, T)}</p>`; listaL.innerHTML = ""; }
    if (!yoId) return;
    try {
      const mios = await FWM.nube.misDuelos(20); listaH.innerHTML = ""; if (!mios.length) listaH.innerHTML = `<p class="suave">${T.duelo.sinDuelos}</p>`;
      const marca = {};
      for (const d of mios) { const rivalId = d.anfitrion === yoId ? d.invitado : d.anfitrion; marca[rivalId] = marca[rivalId] || { g: 0, p: 0 }; if (d.ganador === yoId) marca[rivalId].g++; else marca[rivalId].p++; }
      for (const d of mios) {
        const soyAnf = d.anfitrion === yoId; const rival = soyAnf ? d.i : d.a; const rivalId = soyAnf ? d.invitado : d.anfitrion; const gane = d.ganador === yoId;
        const el = document.createElement("div"); el.className = "rk-jugador";
        el.innerHTML = `<span class="rk-nombre"><b class="${gane ? "ok" : "error"}">${gane ? T.duelo.ganaste : T.duelo.perdiste}</b> · ${escapar((rival && rival.nombre) || "?")} <small class="suave">${gane ? "+" : "−"}${d.delta} · ${T.duelo.marca.replace("{nombre}", escapar((rival && rival.nombre) || "?")).replace("{g}", marca[rivalId].g).replace("{p}", marca[rivalId].p)}</small></span>`;
        el.appendChild(App.boton(T.duelo.revancha, async () => {
          vistaDuelo();
          const est = document.querySelector(".duelo-estado"); const bots = document.querySelector(".duelo-estado + .inicio-botones");
          const codigo = FWM.duelo.retar(App, null, (texto, seg, cod) => { if (est) { est.hidden = false; est.innerHTML = `<div class="duelo-codigo">${cod}</div><p>${T.duelo.retoEnviado.replace("{nombre}", escapar((rival && rival.nombre) || ""))}</p>`; est.appendChild(App.boton(T.cancelar, () => { FWM.duelo.cancelarBusqueda(); vistaDuelo(); }, "btn btn-peq btn-claro")); if (bots) bots.hidden = true; } }, (ses) => App.nuevaPartida({ tipo: "duelo", duelo: ses }), { igualar: true });
          if (codigo) { try { await FWM.nube.crearReto(rivalId, codigo); } catch (e) { /* nada */ } }
        }, "btn btn-peq btn-claro"));
        listaH.appendChild(el);
      }
    } catch (e) { listaH.innerHTML = `<p class="error">${FWM.nube.textoError(e, T)}</p>`; }
  }

  // ---------- cuenta ----------
  function vistaCuenta(modo, despues) {
    const T = App.datos.textos;
    modo = modo || (FWM.nube.usuario() ? "dentro" : "alta");
    const aj = FWM.guardado.ajustes();
    const cont = document.createElement("div");
    cont.appendChild(cabecera(T.cuenta, despues || vistaPrincipal));
    if (!FWM.nube.disponible()) { const p = document.createElement("p"); p.className = "pista"; p.textContent = FWM.nube.posible() ? T.nubeCargando : T.sinConexion; cont.appendChild(p); if (FWM.nube.posible()) setTimeout(() => { if (FWM.nube.disponible()) vistaCuenta(modo, despues); }, 1500); vista(cont); return; }
    if (FWM.nube.usuario()) {
      cont.innerHTML += `<p>${T.conectadoComo} <b>${escapar(FWM.nube.nombre())}</b></p>`;
      cont.appendChild(App.boton(T.salir, async () => { await FWM.nube.salir(); vistaPrincipal(); }, "btn btn-peq btn-claro"));
      vista(cont); return;
    }
    const f = document.createElement("div");
    f.innerHTML = `<p class="suave">${T.paraRanking}</p>
      ${modo === "alta" ? `<div class="campo"><label>${T.nombreJugador}</label><input id="cu-nombre" maxlength="20" value="${escapar(aj.nombre)}"></div>` : ""}
      <div class="campo"><label>${T.correo}</label><input id="cu-correo" type="email" autocomplete="email"></div>
      <div class="campo"><label>${T.clave}</label><input id="cu-clave" type="password" autocomplete="${modo === "alta" ? "new-password" : "current-password"}"></div>
      <p class="error" id="cu-error"></p>`;
    cont.appendChild(f);
    const $ = (id) => f.querySelector("#" + id);
    const fila = document.createElement("div"); fila.className = "modal-botones";
    const principal = App.boton(modo === "alta" ? T.crearCuenta : T.entrar, async () => {
      $("cu-error").textContent = ""; principal.disabled = true; principal.textContent = "…";
      try {
        const correo = $("cu-correo").value.trim(), clave = $("cu-clave").value;
        if (modo === "alta") {
          const nombre = $("cu-nombre").value.trim();
          if (nombre.length < 2 || nombre.length > 20) throw new Error(T.errNombre);
          FWM.guardado.guardarAjustes({ nombre });
          await FWM.nube.registrar(correo, clave, nombre);
          FWM.nube.evento && FWM.nube.evento("cuenta");
        } else await FWM.nube.entrar(correo, clave);
        try { await FWM.nube.guardarHeroe(FWM.heroe.leer()); } catch (e) { /* nada */ }
        FWM.sonido.fanfarria();
        (despues || vistaPrincipal)();
      } catch (e) { $("cu-error").textContent = FWM.nube.textoError(e, T); principal.disabled = false; principal.textContent = modo === "alta" ? T.crearCuenta : T.entrar; }
    }, "btn btn-primario");
    fila.appendChild(App.boton(T.seguirSinCuenta, despues || vistaPrincipal, "btn btn-claro"));
    fila.appendChild(principal);
    cont.appendChild(fila);
    if (modo === "alta") { // aceptar condiciones y privacidad al crear la cuenta
      const L = App.datos.legal || FWM.datosBase.legal;
      const av = document.createElement("p"); av.className = "pista";
      const partes = T.aceptasAlCrear.split(/\{condiciones\}|\{privacidad\}/);
      av.appendChild(document.createTextNode(partes[0]));
      const a1 = document.createElement("a"); a1.href = "#"; a1.textContent = L.condiciones.titulo.toLowerCase(); a1.addEventListener("click", (e) => { e.preventDefault(); vistaLegal("condiciones", () => vistaCuenta(modo, despues)); }); av.appendChild(a1);
      av.appendChild(document.createTextNode(partes[1] || " y la "));
      const a2 = document.createElement("a"); a2.href = "#"; a2.textContent = L.privacidad.titulo.toLowerCase(); a2.addEventListener("click", (e) => { e.preventDefault(); vistaLegal("privacidad", () => vistaCuenta(modo, despues)); }); av.appendChild(a2);
      av.appendChild(document.createTextNode(partes[2] || "."));
      cont.appendChild(av);
    }
    const alt = document.createElement("p"); alt.style.textAlign = "center";
    alt.appendChild(App.boton(modo === "alta" ? T.yaTengoCuenta : T.noTengoCuenta, () => vistaCuenta(modo === "alta" ? "entrar" : "alta", despues), "btn btn-peq btn-claro"));
    if (modo === "entrar") alt.appendChild(App.boton(T.olvideClave, async () => { try { await FWM.nube.recuperar($("cu-correo").value.trim()); $("cu-error").textContent = T.claveEnviada; } catch (e) { $("cu-error").textContent = FWM.nube.textoError(e, T); } }, "btn btn-peq btn-claro"));
    cont.appendChild(alt);
    vista(cont);
  }

  // ---------- ajustes (con la cuenta dentro) ----------
  function vistaAjustes() {
    const T = App.datos.textos;
    const aj = FWM.guardado.ajustes();
    const cont = document.createElement("div");
    cont.appendChild(cabecera(T.ajustes));
    const bandos = Object.entries(App.datos.bandos).map(([id, b]) => `<option value="${id}" ${aj.bando === id ? "selected" : ""}>${b.nombre}</option>`).join("");
    const f = document.createElement("div");
    f.innerHTML = `
      <div class="campo"><label>${T.nombreJugador}</label><input id="aj-nombre" maxlength="20" value="${(aj.nombre || "").replace(/"/g, "&quot;")}" placeholder="…"></div>
      <div class="campo"><label>${T.bandoFavorito}</label><select id="aj-bando"><option value="aleatorio" ${aj.bando === "aleatorio" ? "selected" : ""}>${T.bandoAleatorio}</option>${bandos}</select></div>
      <div class="campo"><label>${T.musica}</label><select id="aj-musica"><option value="on" ${FWM.musica.activa() ? "selected" : ""}>${T.sonidoOn}</option><option value="off" ${FWM.musica.activa() ? "" : "selected"}>${T.sonidoOff}</option></select></div>
      <div class="campo"><label>${T.idioma}</label><select id="aj-idioma">${FWM.idioma.disponibles().map(i => `<option value="${i}" ${FWM.idioma.actual() === i ? "selected" : ""}>${FWM.idioma.nombre(i)}</option>`).join("")}</select></div>
      <div class="campo"><label>${T.paleta}</label><select id="aj-paleta"><option value="normal" ${aj.paleta !== "daltonicos" ? "selected" : ""}>${T.paletaNormal}</option><option value="daltonicos" ${aj.paleta === "daltonicos" ? "selected" : ""}>${T.paletaDaltonicos}</option></select></div>
      <p class="pista">${T.paletaPista}</p>
      <div class="campo"><label>${T.sonido}</label><select id="aj-sonido"><option value="on" ${FWM.sonido.activo() ? "selected" : ""}>${T.sonidoOn}</option><option value="off" ${FWM.sonido.activo() ? "" : "selected"}>${T.sonidoOff}</option></select></div>`;
    cont.appendChild(f);
    const $ = (id) => f.querySelector("#" + id);
    $("aj-nombre").addEventListener("input", () => FWM.guardado.guardarAjustes({ nombre: $("aj-nombre").value.trim() }));
    $("aj-nombre").addEventListener("change", () => { const n = $("aj-nombre").value.trim(); if (FWM.nube.usuario() && n.length >= 2) FWM.nube.cambiarNombre(n).catch(() => {}); });
    $("aj-bando").addEventListener("change", () => FWM.guardado.guardarAjustes({ bando: $("aj-bando").value }));
    $("aj-sonido").addEventListener("change", () => { FWM.sonido.alternar($("aj-sonido").value === "on"); if (FWM.sonido.activo()) FWM.sonido.pop(); });
    $("aj-musica").addEventListener("change", () => { FWM.musica.alternar($("aj-musica").value === "on"); pintarEstadoMusica(); });
    // Estado del sonido a la vista: sin esto, para saber por qué no suena hay que abrir la consola del
    // navegador. Se toca y se refresca (8 sep 2026).
    const estado = document.createElement("p"); estado.className = "pista"; estado.style.cursor = "pointer";
    function pintarEstadoMusica() {
      const d = FWM.musica.diagnostico();
      const p = d.pistas[d.escena];
      const que = !d.activa ? T.musicaEstado.silenciada
        : d.dormida ? T.musicaEstado.dormida
        : p && !p.pausada ? T.musicaEstado.sonando
        : p ? T.musicaEstado.pausada : T.musicaEstado.nada;
      estado.textContent = T.musicaEstado.linea
        .replace("{estado}", que)
        .replace("{escena}", d.escena === "partida" ? T.musicaEstado.enPartida : T.musicaEstado.enMenu)
        .replace("{fichero}", (d.fichero || "—").replace("musica/", ""))
        .replace("{segundo}", p ? Math.round(p.segundo) : 0);
    }
    estado.addEventListener("click", pintarEstadoMusica);
    pintarEstadoMusica();
    f.appendChild(estado);
    $("aj-paleta").addEventListener("change", () => { FWM.guardado.guardarAjustes({ paleta: $("aj-paleta").value }); App.aplicarPaleta(); });
    // cambiar de idioma recarga la página: es lo más seguro (los textos están repartidos por todas las pantallas)
    $("aj-idioma").addEventListener("change", () => { if (FWM.idioma.poner($("aj-idioma").value)) { App.guardar(); location.reload(); } });
    // legal y versión
    {
      const L = App.datos.legal || FWM.datosBase.legal;
      const sec = document.createElement("section"); sec.className = "reino-sec"; sec.innerHTML = `<h3>${T.legal}</h3>`;
      const fl = document.createElement("div"); fl.className = "acciones-gestion"; fl.style.border = "0"; fl.style.margin = "0";
      fl.appendChild(App.boton(T.verPrivacidad, () => vistaLegal("privacidad"), "btn btn-peq btn-claro"));
      fl.appendChild(App.boton(T.verCondiciones, () => vistaLegal("condiciones"), "btn btn-peq btn-claro"));
      sec.appendChild(fl);
      const v = document.createElement("p"); v.className = "pista"; v.style.margin = "6px 0 0"; v.textContent = `${T.version} ${FWM.VERSION} · ${L.titular}`; sec.appendChild(v);
      cont.appendChild(sec);
    }
    // cuenta
    if (FWM.nube.posible()) {
      const sec = document.createElement("section"); sec.className = "reino-sec"; sec.innerHTML = `<h3>${T.cuenta}</h3>`;
      if (FWM.nube.usuario()) {
        const p = document.createElement("p"); p.innerHTML = `${T.conectadoComo} <b>${escapar(FWM.nube.nombre())}</b> `;
        p.appendChild(App.boton(T.salir, async () => { await FWM.nube.salir(); vistaAjustes(); }, "btn btn-peq btn-claro")); sec.appendChild(p);
        // baja de la cuenta: obligatorio para las tiendas y para el reglamento de datos
        const av = document.createElement("p"); av.className = "pista"; av.textContent = T.borrarCuentaAviso; sec.appendChild(av);
        const bBorrar = App.boton(T.borrarCuenta, () => {
          App.confirmar(T.borrarCuentaConfirmar, async () => {
            bBorrar.disabled = true; bBorrar.textContent = "…";
            try { await FWM.nube.borrarCuenta(); FWM.paneles.aviso(T.borrarCuentaHecho, 5000); vistaPrincipal(); }
            catch (e) { const L = App.datos.legal || FWM.datosBase.legal; FWM.paneles.aviso(T.borrarCuentaError.replace("{contacto}", L.contacto), 8000); bBorrar.disabled = false; bBorrar.textContent = T.borrarCuenta; }
          });
        }, "btn btn-peq btn-peligro");
        sec.appendChild(bBorrar);
      }
      else { const p = document.createElement("p"); p.className = "suave"; p.textContent = T.paraRanking + " "; p.appendChild(App.boton(T.crearCuentaOEntrar, () => vistaCuenta("alta", vistaAjustes), "btn btn-peq btn-primario")); sec.appendChild(p); }
      cont.appendChild(sec);
    }
    const yaInstalada = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    if (!yaInstalada && /iPhone|iPad/.test(navigator.userAgent) && !window.__instalar) { const p = document.createElement("p"); p.className = "pista"; p.textContent = T.instalarIos; cont.appendChild(p); }
    const cr = document.createElement("p"); cr.className = "pista"; cr.innerHTML = `<b>${T.creditos}</b>: ${T.creditoMusica} ${T.creditoIconos || ""}`; cont.appendChild(cr);
    vista(cont);
  }

  // ---------- desfile de figuras bajo el título ----------
  function arrancarDesfile() {
    const canvas = document.getElementById("inicio-desfile");
    const tipos = ["campesino", "lancero", "espadachin", "arquero", "caballero", "catapulta"];
    const colores = ["#2f6fd6", "#d63b3b", "#2e9e4f", "#d6a92e", "#8e3bd6"];
    const ancho = canvas.getBoundingClientRect().width || 500;
    figuras = tipos.map((tipo, i) => ({ tipo, x: 30 + i * (ancho / tipos.length), v: 22 + (i % 3) * 5, color: colores[i % colores.length], fase: Math.random() * 6 }));
    animando = true;
    let ultimo = performance.now();
    const paso = (ahora) => {
      if (!animando) return;
      const dt = Math.min(0.05, (ahora - ultimo) / 1000); ultimo = ahora;
      const r = canvas.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(r.width * dpr)) { canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); }
      const ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, r.width, r.height);
      const suelo = r.height * .62;
      for (const f of figuras) {
        f.x += f.v * dt; f.fase += dt * 8;
        if (f.x > r.width + 60) f.x = -70;
        const bote = Math.abs(Math.sin(f.fase)) * 3;
        (FWM.figuras[f.tipo] || FWM.figuras.campesino)(ctx, f.x, suelo - 6 - bote, 26, { color: f.color, enemigo: false });
      }
      requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }

  return { mostrar, ocultar, visible, refrescar, vistaCuenta, vistaRanking, vistaHeroe, vistaDuelo, vistaBienvenida, vistaCampana, vistaBatalla, vistaEscenarios, vistaBarbaros };
})();
