# Seguridad — GPU Universe

Auditoría de la fase de seguridad (30/09/2026). La web es estática: no hay servidor propio, cuentas,
cookies ni formularios que envíen datos. El riesgo principal es que un texto que no controlamos
acabe interpretado como HTML o como script (XSS).

## De dónde vienen los datos

| Origen | ¿De fiar? | Dónde se usa | Defensa | Prueba |
|---|---|---|---|---|
| `js/data.js`, `js/i18n.js`, iconos | Sí (están en el repositorio) | Tarjetas, detalle, textos | Aun así, nombres, arquitecturas y descripciones pasan por `escapeHtml` | — |
| URL: `?gpu`, `?gpus`, `?a`, `?b` | No | Detalle y comparador | Solo se aceptan GPUs que existen (`findGpu` / búsqueda en los datos) | `tests/security.test.js` |
| URL: `?q`, filtros, `?tab`, `?dir` | No | Catálogo de Gaming | El filtro solo se aplica si existe su botón (`CSS.escape`); la búsqueda solo filtra, no se pinta como HTML | ídem |
| URL: `?play`, `#psu`… | No | Retos y herramientas | Lista cerrada de retos y pestañas | ídem |
| `localStorage` | **No** | Tema, color, idioma, progreso, listas, «mi GPU» | Validación de cada clave (ver abajo) | ídem |
| Feeds RSS/Atom de los medios (los lee la GitHub Action, no el navegador) | **No** | `news.json` | `scripts/news.js`: título y extracto a texto plano (sin etiquetas, scripts ni caracteres de control), con tope de longitud; enlaces solo `https` y sin usuario ni contraseña; nada de imágenes ni artículos completos; `validateNews` comprueba la forma antes de publicar | `tests/news.test.js` |
| `news.json` (del propio sitio, o su copia sin conexión en la caché del service worker) | No del todo | Noticias | La web lo vuelve a validar al pintar: solo textos, enlaces `https` (`httpsUrl`) y todo con `escapeHtml` | `tests/security.test.js`, `tests/news.test.js` |
| Lo que escribe el usuario (buscador, selector de GPU) | No | Resultados | Se escapa (`escapeHtml`, `highlightMatch`) | `features.test.js` |

### `localStorage`: por qué no se confía en él

En GitHub Pages, **todos los proyectos de `frxnker.github.io` comparten el mismo origen** y, con
él, el mismo `localStorage`. Cualquier otra web publicada en ese dominio (o una extensión del
navegador) puede escribir en estas claves. Por eso se valida todo al leerlo:

| Clave | Validación |
|---|---|
| `gpu-universe-theme` | Solo `light` o `dark` (script de pre-pintado y `app.js`) |
| `gpu-universe-accent` | Letras minúsculas en el pre-pintado; `progress.js` solo aplica colores existentes y desbloqueados |
| `gpu_lang` | Solo los 6 idiomas (pre-pintado e `i18n.js`) |
| `gpu-universe-progress` | Versión, migración y saneado por tipos (`progress.js`: `VERSION`, `MIGRATIONS`, `sanitize`) |
| `gpu-universe-favorites` / `-compare` / `-recent` | Solo nombres de GPUs que existen, con tope por lista (`features.js`) |
| `gpu-universe-mygpu` | Solo una GPU que existe (`tools.js`) |
| `gpu-universe-welcome`, `gpu-universe-drawer-seen` | Solo se comparan con `'1'` |

**Fallo corregido en esta fase:** la página de Niveles pintaba la experiencia (`xp`) y el número
de partidas (`games.played`) del estado guardado sin escapar, porque se daba por hecho que eran
números. Un estado manipulado con `xp: "<img src=x onerror=…>"` se ejecutaba. Ahora
`progress.js` convierte cada campo a su tipo (números enteros ≥ 0, fechas `AAAA-MM-DD`, listas de
textos con tope) y descarta el resto; la prueba «localStorage hostil» lo cubre.

**Migración del estado de progreso:**
- Un estado sin versión, anterior a la v1, se migra.
- Uno de una versión futura se sanea sin borrarse.
- Un JSON roto vuelve al estado inicial.

Para cambiar la forma del estado: subir `VERSION` y añadir la conversión en `MIGRATIONS`.

## `innerHTML`

Hay 63 asignaciones de `innerHTML` en `js/`. Todas pintan una de estas cosas:
- constantes del repositorio (traducciones, iconos, `data.js`);
- texto externo pasado por `escapeHtml`;
- URL pasadas por `safeUrl`;
- números ya saneados.

Reglas para quien toque el código:
- Todo texto que no sea una constante del repositorio pasa por `window.escapeHtml` (o se asigna con
  `textContent`).
- Toda URL externa pasa por `safeUrl` (solo `http:`/`https:`).
- Nada de manejadores en línea (`onclick="…"`) ni URL `javascript:`: la CSP los bloquearía y
  una prueba lo comprueba.

## Política de seguridad de contenido (CSP)

Va en una etiqueta `<meta>` al principio de la cabecera común (`partials/head.html`), ya que
GitHub Pages no permite cabeceras HTTP propias:

```
default-src 'self'; script-src 'self' 'sha256-…'; style-src 'self' 'unsafe-inline';
img-src 'self' data:; font-src 'self'; connect-src 'self';
manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'
```

- **Scripts:**
  - Solo del propio sitio.
  - El único script en línea (el de pre-pintado de tema e idioma) se permite por su hash.
    `npm run shell` lo calcula, así que no hay que tocar la política si cambia el script.
- **Estilos:** `'unsafe-inline'` hace falta por los atributos `style` (anchos de barras y
  gráficas). Es mucho menos peligroso que permitir scripts en línea.
- **Imágenes y datos:** solo del propio sitio. Desde que las noticias salen de `news.json` (Fase B,
  01/10/2026) ya no hace falta permitir `https://api.rss2json.com` ni imágenes `https:` de los medios;
  una prueba exige que `connect-src` sea `'self'` y que `img-src` no admita otros dominios.
- **Límites de una CSP en `<meta>`:**
  - No admite `frame-ancestors`, así que no protege contra que otra web meta la página en un
    `<iframe>` (clickjacking).
  - Hace falta una cabecera HTTP, posible con un dominio propio detrás de un CDN.
  - La web no tiene acciones sensibles que se puedan secuestrar así.

Comprobado en Chrome, Firefox y WebKit: 0 violaciones en las 10 páginas, con el visor 3D, las
noticias, el detalle de GPU, el buscador y el service worker funcionando (de nuevo el 01/10/2026,
con la política sin otros dominios).

## Enlaces externos

Todos los `target="_blank"` llevan `rel="noopener noreferrer"`, y hay una prueba que lo exige.

## Servicios de terceros

- **Ninguno al visitar la web.** Las noticias las descarga la GitHub Action de publicación
  directamente de los medios (sin servicios intermedios) y se sirven desde el propio sitio; el
  navegador del visitante no contacta con nadie más. Hasta el 01/10/2026 se usaba rss2json, que
  sabía qué visitas había y limitaba las peticiones.
- No hay analítica, rastreadores ni CDN: fuentes, Three.js, banderas e iconos se sirven desde el
  propio sitio.
