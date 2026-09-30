# Fuentes

Copias locales (WOFF2 de Google Fonts, subconjuntos latín y cirílico) para no depender de un
servicio externo, cargar antes y funcionar sin conexión. Se declaran al principio de `css/style.css`.

| Familia | Uso | Licencia |
|---|---|---|
| Exo 2 | Títulos | SIL Open Font License 1.1 — `OFL-exo2.txt` |
| IBM Plex Sans | Texto | SIL Open Font License 1.1 — `OFL-ibmplexsans.txt` |
| JetBrains Mono | Datos y etiquetas | SIL Open Font License 1.1 — `OFL-jetbrainsmono.txt` |

Para actualizarlas: descargar la hoja
`https://fonts.googleapis.com/css2?family=Exo+2:wght@600;700;800&family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap`
con un navegador moderno, guardar los `.woff2` de los bloques `latin`, `latin-ext`, `cyrillic` y
`cyrillic-ext` y copiar sus `unicode-range` en `css/style.css`.
