# Registro de progreso — GPU Universe

Registro vivo del plan de mejora: estado de cada fase, cómo se ha comprobado y decisiones
pendientes. Se actualiza al cerrar cada fase.

**Leyenda:** ✅ HECHO · 🟡 PARCIAL · ⬜ PENDIENTE · ⛔ BLOQUEADO

**Criterio para cerrar una fase:** `npm test` en verde (en menos de 60 s) y sin errores de consola
en ninguna página, revisada en Chrome, Firefox y WebKit, en escritorio y móvil, con tema claro y
oscuro, en español, ruso y alemán (el alemán tiene los textos más largos).

---

## Estado inicial (30/09/2026)

### Punto de partida

- El `main` local iba 2 commits por detrás de `origin/main` (60192a2 y ea3ebc7, del 30/09).
  Se ha hecho *fast-forward* (sin conflictos: el árbol estaba limpio).
- **`npm test` en el `main` antiguo (3e278fb):** 80 pruebas, 14 fallos en data, logic, i18n y
  features (nombres antiguos como `GAMING_GPUS` y `priceToUsd`), y el proceso no terminaba: se cortó
  a los 120 s.
- **`npm test` en `origin/main` (ea3ebc7):** 92 pruebas, 91 correctas, 0 fallos, 1 `todo` (Fase 4).
  Tarda 33 s y termina solo. Los commits del 30/09 ya habían reescrito esas pruebas.

### Referencias guardadas antes de tocar nada

- **Capturas:** `screenshots/referencia/` (carpeta ignorada por git), 126 vistas:
  - Chrome: 9 páginas × escritorio (1440×900) y móvil (390×844) × claro y oscuro, en español.
  - Chrome, alemán: las 9 páginas en oscuro, escritorio y móvil.
  - Firefox 155 y WebKit 26.6: las 9 páginas en oscuro, escritorio y móvil, en español y alemán.
  - Informes de cada vista: `report*.json`.
  - **Resultado:** 0 errores de consola en los tres motores y 0 páginas con scroll horizontal.
  - Avisos solo en Firefox:
    - WebGL, por el filtrado de sombras de Three.js en `learn.html`.
    - `gaming.html` en móvil: ignora el `preload` con `imagesrcset`.
- **Lighthouse móvil:** ver la tabla de la Fase 3.

### Estado de cada fase

| Fase | Estado | Detalle |
|---|---|---|
| 0 — Base y red de seguridad | ✅ | `.gitignore`, node_modules fuera del índice, `npm test` con jsdom y `.claude/launch.json`. |
| 1 — Terminar lo que está a medias | ✅ | Módulos integrados en las 9 páginas con el mismo orden de scripts; `tools.html` y `levels.html`; 6 idiomas; CSS. |
| 2 — Calidad de los datos | ✅ | Precio de lanzamiento en USD + fecha; `DESKTOP_GPUS` sustituye a las listas duplicadas; fuentes y fecha de revisión; noticias sin datos inventados. |
| 3 — Rendimiento | 🟡 | Hecho: AVIF/WebP con `srcset`, Three.js 0.186 local, pausas por visibilidad y movimiento reducido, banderas y fuentes locales. Falta: la medición «después» de Lighthouse. |
| 4 — Accesibilidad | 🟡 | Hecho: `lang` cambia con el idioma; trampa de foco en los modales. Falta: selector de idioma accesible, `aria-label` traducidos (hay un `todo` en las pruebas), trampa de foco en el menú móvil, enlace de salto en todas las páginas (solo lo tiene Gaming), revisión de contraste, encabezados y estados. |
| 5 — SEO y sin conexión | ⬜ | No hay manifest, service worker, sitemap, robots, 404 ni Open Graph. |
| 6 — Mantenibilidad | ⬜ | Barra (86 líneas), pie (36) y modal (15) copiados en las 9 páginas. Faltan además la limpieza de `style.css` (10.765 líneas) y el código muerto. |
| 7 — Documentación | ⬜ | El README sigue citando `gpu-universe`, Google Fonts y la conversión a EUR/RUB. |
| Extra — Seguridad | ⬜ | Hay 65 usos de `innerHTML` sin auditar; no hay CSP; el estado de progreso no tiene versión. |
| Extra — Publicación y legal | 🟡 | Fuentes ya locales (OFL incluida). Falta: GitHub Actions, comprobación de mayúsculas en las rutas, LICENSE, aviso de marcas y origen de las imágenes. |
| Final — Propuestas | ⬜ | — |

### Hallazgos para la parte legal

- Las 7 imágenes originales (`assets/*.png`, del 01/05 y el 09/05/2026) llevan un manifiesto C2PA
  firmado por Google LLC:
  - Texto del manifiesto: *"Created by Google Generative AI"*.
  - Tipo de origen: `digitalSourceType = trainedAlgorithmicMedia`.
  - Llevan la marca de agua SynthID.
- Son ilustraciones generadas por IA, no fotografías. Esto incluye las del Salón de la Fama, que
  representan modelos reales (GeForce 256, Voodoo, GTX 1080 Ti, HD 7970).
- Las versiones optimizadas (AVIF/WebP/JPG) ya no conservan ese manifiesto.

---

## Decisiones tomadas (30/09/2026)

| Tema | Decisión |
|---|---|
| Barra compartida (Fase 6) | Plantillas en `partials/` + sincronizador sin dependencias (`npm run shell`) + prueba que falla si una página se desincroniza. Los HTML publicados siguen completos. |
| Licencia | MIT (la que ya anunciaba el README). |
| Imágenes generadas con IA | Aviso visible junto a cada imagen + archivo de créditos enlazado desde el pie. |
| Commits | Commit local al cerrar cada fase, sin push. La web publicada y GitHub Actions se revisan cuando se haga push. |

---

## Fase 6 (parte 1) — Bloques compartidos ✅

Se hace antes que las demás fases porque todo el HTML que viene después (selector de idioma
accesible, CSP, metadatos SEO) cae dentro de estos bloques.

**Qué cambia**
- `partials/`: plantillas de 5 bloques compartidos:
  - `head`: charset, viewport, color de tema, fuentes, CSS, icono y script de pre-pintado.
  - `nav`, `footer`, `modal` y `scripts` (los 5 scripts comunes, en su orden).
- Marcadores de las plantillas:
  - `{{root}}` y `{{pages}}` para las rutas relativas.
  - `{{current:x}}` para marcar el enlace activo.
- `scripts/shell.js` (`npm run shell`): copia cada plantilla entre `<!-- shell:x -->` y
  `<!-- /shell:x -->` en las 9 páginas.
  - Respeta el final de línea de cada archivo.
  - `--check` solo comprueba.
- En cada página, la parte común del `<head>` va primero; el título, la descripción y lo
  específico de la página van después.
- Se eliminan comentarios duplicados («DETALLE DE GPU» aparecía dos veces).

**Cómo se ha comprobado**
- `tests/shell.test.js`:
  - Las 9 páginas coinciden con `partials/`.
  - Cada página tiene sus bloques (Aprender no tiene pie).
  - Las rutas relativas y el enlace activo son correctos.
  - Una marca sin cierre da error.
- `npm test`: 96 pruebas, 95 correctas, 0 fallos, 1 `todo` (Fase 4). Tarda 22 s.
- Capturas con aleatoriedad fija (semilla) de la copia original frente a la nueva, en Chrome:
  36 vistas (9 páginas × escritorio/móvil × claro/oscuro).
  - Mismas dimensiones en todas.
  - Diferencias inferiores al 0,6 % de los píxeles, todas por temporización (aviso de XP que
    aparece o no, giro del modelo 3D).
  - 0 errores de consola.

---

## Fase 3 — Rendimiento ✅

Ya estaba hecho (commits del 30/09):
- Imágenes AVIF/WebP con `srcset` y tamaño explícito.
- Three.js 0.186 local en `vendor/three`.
- Pausas del fondo animado y del visor 3D (pestaña oculta, fuera de pantalla, movimiento reducido).
- Banderas SVG locales y fuentes locales.

Faltaban la medición «después» y el objetivo nuevo de rendimiento ≥ 90 en móvil, que no cumplían
tres páginas.

**Causas encontradas y arreglos**

| Página | Antes | Causa | Arreglo |
|---|---|---|---|
| Portada | 83 (LCP 4,7 s) | El subtítulo del hero (el elemento LCP) entraba con `fade-up` desde `opacity: 0` y 0,2 s de retraso, así que no contaba hasta ~1 s después. | El título y el subtítulo entran solo con movimiento (`rise-in`, sin opacidad); el resto del hero conserva `fade-up`. |
| Niveles | 81 (CLS 0,28) | `#profile-card` y `#howto-list` están vacíos hasta que `levels.js` los rellena; en móvil la sección de retos empezaba dentro de la pantalla y bajaba de golpe. | `min-height` solo mientras están vacíos (`:empty`): lo que sigue ya empieza fuera de la pantalla y su desplazamiento no cuenta. |
| Aprender | 89 | La tarjeta de bienvenida de la primera visita aparecía a los 1,2 s y su párrafo pasaba a ser el LCP. | La bienvenida aparece 0,8 s después de la primera interacción (desplazar, tocar o teclear). Cambio de comportamiento pequeño: ya no tapa la página antes de verla. |

**Lighthouse móvil (mediana de 3 pasadas, servidor local con gzip)**

| Página | Antes de la Fase 3 (sesión anterior) | Referencia de hoy | Después |
|---|---|---|---|
| Portada | 68 | 83 | **95** |
| Comparar | 88 | 95 | **95** |
| Gaming | 86 | 95 | **95** |
| Historia | 85 | 95 | **95** |
| Aprender | 89 | 89 | **95** |
| Niveles | — | 81 | **95** |
| Servidor | — | 95 | **95** |
| Herramientas | — | 95 | **95** |
| Workstation | — | 95 | **95** |

- LCP ≤ 2,9 s y TBT ≤ 80 ms en todas las páginas.
- CLS ≤ 0,033 en todas (Niveles pasa de 0,282 a 0).
- Peso de la portada al cargar: 312 KiB.
  - La referencia medía 1.802 KiB, pero la diferencia son sobre todo las imágenes de las noticias
    reales, que ahora no llegaron por el límite de rss2json.
  - Esas imágenes ya son `loading="lazy"`.
- Accesibilidad (93–96) y Buenas prácticas (96–100) se tratan en la Fase 4.
  - Las caídas de Buenas prácticas a 96 se deben a errores 429 de rss2json en la consola: el
    servicio gratuito limitó las peticiones tras cientos de cargas de prueba seguidas.
  - No son un cambio del código. Ver «Riesgos».

**Cómo se ha comprobado**
- `npm test`: 2 pruebas nuevas en `tests/performance.test.js`.
  - El título y el subtítulo del hero no empiezan con opacidad 0.
  - La bienvenida no aparece al cargar, solo tras la primera interacción.
- Revisión en navegador: 324 vistas.
  - Chrome, Firefox 155 y WebKit 26.6 × 9 páginas × escritorio y móvil × claro y oscuro ×
    es, ru y de.
  - **0 errores de consola de la web**, 0 páginas con scroll horizontal.
  - Solo quedan dos avisos de Firefox, ya presentes en la referencia: el filtrado de sombras
    WebGL en Aprender y el `preload` de imagen ignorado en móvil, que es lo esperado porque su
    `media` no coincide.
  - Aparte, 24 errores 429 de rss2json al final de la ráfaga, en WebKit. La web los gestiona: estado
    de error con botón de reintento. A partir de ahora las revisiones masivas sirven un feed de
    prueba local.

### Riesgos detectados

- **rss2json (servicio externo gratuito)** limita las peticiones.
  - Cada visitante nuevo hace 4 peticiones por sesión (una por feed).
  - Si se supera el límite, el navegador anota el fallo en la consola (no se puede evitar desde
    JS) y la web muestra su estado de error.
  - Propuesta para las fases siguientes: guardar la caché en `localStorage` en lugar de
    `sessionStorage`, para reducir peticiones entre pestañas y visitas.

---

## Fase 4 — Accesibilidad y experiencia de uso ✅

**Qué cambia**

*Barra (plantilla única `partials/nav.html`)*
- Enlace «Saltar al contenido» (el primer elemento enfocable) hacia un `<main id="main">`, que
  ahora existe en las 9 páginas. Sustituye al «Saltar al catálogo» que solo tenía Gaming.
- `aria-label` traducidos (`data-i18n-aria`) para la navegación, el logo, el menú y la miga de pan.
  - El logo en móvil (solo el icono) no tenía nombre accesible.
  - La miga de pan decía «Breadcrumb» en todos los idiomas.
- Botón de tema: la etiqueta dice qué hará («Cambiar a tema claro/oscuro») y se traduce.
- **Selector de idioma** con el patrón de botón de menú.
  - `aria-haspopup="menu"`, `aria-expanded` y `aria-controls`; opciones `menuitemradio` con
    `aria-checked`.
  - Teclado: flechas, Inicio/Fin, la inicial del idioma, Intro/Espacio para elegir, Esc (devuelve
    el foco) y Tab (cierra).
  - El nombre accesible del botón es «Idioma ES» (texto oculto + código visible).
  - Se marca visualmente el idioma actual.
- **Menú móvil**:
  - Al abrirse, el foco entra en el panel y Tab da la vuelta dentro (trampa de foco).
  - Una guarda con `focusin` cubre WebKit, que no pasa por los enlaces con Tab.
  - Esc lo cierra y el foco vuelve al botón.
  - Cerrado queda con `visibility: hidden`: antes sus 8 enlaces, fuera de la pantalla, seguían
    recibiendo el foco.

*Encabezados y regiones*
- `<h1>` en Workstation, Servidor e Historia, que empezaban por `<h2>`.
- Pie con `<h2>` (antes `<h4>`) y cronología con `<h2>` (antes `<h4>` bajo el `<h1>`).
- Encabezados ocultos «Categorías» (portada) y «Catálogo de GPUs» (Gaming y Workstation).
- Lienzo decorativo del fondo con `aria-hidden` en todas las páginas.
- `alt` útil y traducible en la imagen del hero (`data-i18n-alt`). Indica que es una
  ilustración generada con IA.

*Contraste AA (tema claro y oscuro, con los 6 colores de LED)*
- En tema claro, el texto pequeño en color de acento sobre fondos teñidos usa `--accent-deep`
  (cada color desbloqueable define el suyo): etiquetas de sección, años del mapa de arquitecturas,
  XP de la lista y mejor valor de la tabla de comparación.
- Verde de éxito (`--green`) y verde NVIDIA más oscuros en tema claro.
- Rojo AMD y verde NVIDIA propios para las marcas del mapa de arquitecturas.
- Ranking de valor: los puestos 4.º a 7.º tenían un contraste de 1,5:1 en ambos temas; ahora
  cumplen el 3:1 de texto grande.
- Plata del 2.º puesto, «pts» y la nota «menos es mejor» (que medía 8,4 px): ahora 11 px y color
  de texto secundario.
- Contador de la pestaña activa: blanco sobre fondo oscurecido (3,35:1 → 6,97:1).
- El resplandor del cuestionario baja de opacidad en tema claro.

*Movimiento reducido*
- La regla global usaba `transition-duration: 0.01ms`. Con eso, la transición por defecto
  (`all`) también animaba la visibilidad heredada, y los menús recién abiertos no podían recibir el
  foco.
- Ahora es `transition: none`.
- Además, los elementos de los menús ya no usan `transition: all`, sino las propiedades concretas.

*Estados vacíos, de carga y de error*
- Componente común `window.stateHtml` / `.state-msg`: icono enmarcado, título, explicación y
  acción, con `role="status"`.
- Lo usan el catálogo sin resultados, las herramientas, la comparación vacía, el panel «Tu
  espacio», el recomendador y el error de noticias (en tono cobre).
- Noticias: la misma sección en las 4 páginas que la tienen, ahora como plantilla compartida
  (`partials/news.html`).
  - Carga con tarjetas esqueleto y `aria-busy` en todas; antes, 3 páginas usaban un spinner.
  - Error con icono y reintento. Sin conexión, lo dice: «Sin conexión: las noticias se cargan
    desde internet».
- Los botones «Restablecer» y «Ver más GPUs» ya no usan `onclick` en línea.

*Fallos encontrados de paso*
- **Recomendador**: proponía GPUs sin precio oficial (p. ej. «M5 Ultra GPU: sin precio oficial»)
  para el presupuesto «menos de 400 $», porque su precio 0 pasaba el filtro. Ahora una GPU sin
  precio no encaja en ningún presupuesto.
- La ordenación ya no da `NaN` cuando falta el dato de TFLOPS.
- **Idioma guardado corrupto**: con `gpu_lang` desconocido, `t()` lanzaba un error y la página
  no se traducía. Ahora se valida el idioma (y el tema) y se usa español/oscuro.

**Cómo se ha comprobado**
- `tests/a11y.test.js`: 8 pruebas nuevas.
  - Cada página tiene un `<h1>`, un `<main id="main">`, el enlace de salto como primer elemento
    enfocable, encabezados sin saltos e imágenes con `alt`.
  - Teclado del selector de idioma.
  - Menú móvil con Esc.
  - Etiqueta del tema traducida.
  - Idioma/tema corruptos.
  - Catálogo vacío con su botón.
  - Noticias con error y sin conexión.
  - Recomendador sin GPUs sin precio.
- La prueba «en ruso no quedan etiquetas accesibles en español» deja de ser `todo` y pasa.
- **axe-core 4 (WCAG 2.1 A/AA + buenas prácticas)**:
  - Antes: 1.080 nodos con infracciones (820 fuera de regiones, 194 de contraste en tema claro,
    24 de orden de encabezados, 18 enlaces sin nombre, 12 sin `main` y 12 sin `h1`).
  - Después: **0 infracciones** en 108 vistas (9 páginas × es/ru/de × claro/oscuro ×
    escritorio/móvil).
  - Contraste: 0 infracciones además con los 5 colores de LED desbloqueables, en ambos temas.
- **Teclado en navegador real** (Chrome, Firefox 155 y WebKit 26.6, con y sin movimiento
  reducido): 69/69 comprobaciones.
  - Enlace de salto; Tab dentro de `<main>`.
  - Menú de idioma: flechas, Fin, Esc, inicial e Intro, que cambia a alemán y traduce las
    etiquetas.
  - Menú móvil: foco inicial, 14 × Tab sin salir, Mayús+Tab y Esc.
  - axe sin infracciones con el menú de idioma, el menú móvil, el detalle de GPU, el buscador
    Ctrl+K y el panel «Tu espacio» abiertos.
  - Sin errores de consola.
- **Revisión completa**: 324 vistas (Chrome, Firefox y WebKit × 9 páginas × escritorio y móvil
  × claro y oscuro × es, ru y de), con noticias de prueba para no depender de rss2json.
  - 0 errores de consola y 0 páginas con scroll horizontal.
  - Solo quedan los dos avisos de Firefox que ya estaban en la referencia.
- **Comparación visual** con la copia original (aleatoriedad fija, Chrome, 36 vistas).
  - Cambian solo:
    - los colores de contraste del tema claro;
    - el aspecto unificado de los estados vacíos;
    - la temporización (avisos de XP, giro del modelo 3D).
  - El resto de cada página no cambia.
- **Lighthouse móvil**:

  | Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO |
  |---|---|---|---|---|
  | Portada | 95 | **100** (antes 94) | 96* | 100 |
  | Comparar | 95 | **100** (95) | 100 | 100 |
  | Gaming | 95 | **100** (96) | 96* | 100 |
  | Historia | 95 | **100** (93) | 100 | 100 |
  | Aprender | 95 | **100** (96) | 100 | 100 |
  | Niveles | 95 | **100** (95) | 100 | 100 |
  | Servidor | 95 | **100** (93) | 96* | 100 |
  | Herramientas | 95 | **100** (95) | 100 | 100 |
  | Workstation | 95 | **100** (93) | 96* | 100 |

  \* Buenas prácticas baja a 96 en las 4 páginas con noticias por los errores 429 de rss2json.
  - El servicio gratuito sigue limitando las peticiones desde esta IP tras las pruebas: ahora
    mismo responde 429 también a `curl`.
  - La web muestra su estado de error con reintento.
  - Ver «Riesgos» y la propuesta final de quitar esta dependencia.

---

## Fase 5 — SEO, compartir y uso sin conexión ✅

**Qué cambia**
- **Metadatos por página** (plantilla `partials/meta.html`, rellenada por `npm run shell`):
  - título, descripción, `canonical`, Open Graph y tarjeta de Twitter con la URL publicada;
  - la URL pública sale de `"homepage"` en `package.json`;
  - el título y la descripción en español se toman de `js/i18n.js` (`meta.*`), así que hay una
    sola fuente;
  - al cambiar de idioma se traducen el título y la descripción (`data-i18n-content`).
- Antes, Workstation, Servidor y Comparar tenían el mismo título y la misma descripción que la
  portada.
- Imagen para compartir `assets/icons/og-image.png` (1200×630) e iconos de la app (SVG, 192, 512,
  adaptable y Apple) generados a partir del chip del favicon. El favicon deja de ser un `data:`.
- `manifest.webmanifest`: la web se puede instalar como app.
- **`sw.js` (service worker)**:
  - guarda las 10 páginas, el CSS, los 11 scripts, Three.js, las fuentes, las banderas y los
    iconos (46 archivos);
  - páginas, CSS y JS van primero a la red (siempre lo último publicado) y, sin conexión, usan la
    copia guardada;
  - fuentes, imágenes e iconos van primero a la copia;
  - las noticias no pasan por él: sin conexión muestran «Sin conexión: las noticias se cargan desde
    internet».
- `sitemap.xml`, generado por `npm run shell`, y `robots.txt`.
  - GitHub Pages solo lee el `robots.txt` de la raíz del dominio (`frxnker.github.io`), así que
    este no tendrá efecto hasta que haya un dominio propio.
  - La sitemap sí vale: se puede enviar a Search Console.
- **`404.html`**:
  - GitHub Pages la sirve en cualquier ruta que no existe; lleva `<base href="/GPUUniverse/">`
    (generado desde `homepage`) para que funcionen sus estilos y enlaces a cualquier profundidad;
  - lleva `noindex`, está traducida y tiene botones «Ir al inicio» y «Buscar una GPU»;
  - no da XP de «sección nueva» (no se tocan las reglas de progreso: solo no se registra como
    sección).
- Las rutas relativas se calculan con `window.rootPath()` (lo marca el enlace al manifest) en vez
  de mirar si la URL contiene `/pages/`, que fallaba en la 404.
- `scripts/serve.js` responde también bajo `/GPUUniverse/` y redirige `/GPUUniverse` a
  `/GPUUniverse/`, como GitHub Pages.
- **Cambio en el entorno de pruebas** (`tests/helpers/env.js`): las peticiones a `/GPUUniverse/…`
  se sirven desde la raíz del proyecto, como en GitHub Pages. Es necesario porque la 404 usa
  `<base>`; no cambia lo que comprueba ninguna prueba existente.

**Cómo se ha comprobado**
- `tests/seo.test.js`: 6 pruebas nuevas.
  - Metadatos únicos por página, con longitudes razonables, `canonical` = `og:url` = URL
    publicada y `og:image` existente.
  - Título y descripción traducidos en los 6 idiomas.
  - La sitemap lista exactamente las páginas públicas y `robots.txt` la enlaza.
  - El manifest tiene iconos que existen.
  - La precaché del service worker incluye todas las páginas y scripts, y todo lo que guarda
    existe.
  - La 404 lleva `noindex`, su `<base>` es correcto y no da XP.
- La 404 entra además en todas las pruebas genéricas de página (sin errores, traducida, `h1`,
  `main`, enlace de salto…).
- **Navegador real** (Chrome, Firefox y WebKit): 20/21 comprobaciones.
  - 404 en `/GPUUniverse/pages/no-existe.html`: código 404, con estilos, enlaces a la raíz y
    buscador.
  - El service worker se instala y guarda 46-47 archivos.
  - Sin conexión se abren Gaming, Comparar con `?gpus=`, Aprender y Herramientas `#psu` con sus
    estilos.
  - Las noticias muestran su aviso y una ruta inexistente muestra la 404 guardada.
  - La que falla: en WebKit, con el service worker activo, la herramienta de pruebas ya no
    intercepta la petición a rss2json, y el servicio real respondió 429 (su límite).
  - Firefox y WebKit se prueban sin conexión apagando el servidor, porque el modo sin conexión
    de Playwright corta la navegación antes de que actúe el service worker.

- **Revisión completa**: 360 vistas (3 motores × 10 páginas, ya con la 404, × escritorio y móvil
  × claro y oscuro × es, ru y de).
  - Chrome y Firefox: 0 errores; solo los dos avisos de Firefox de siempre.
  - WebKit se repitió con el service worker bloqueado, porque con él activo Playwright ya no
    intercepta la petición a rss2json y salían sus 429 reales: 0 incidencias.
- **Lighthouse móvil**:
  - Rendimiento 94 en las 9 páginas (antes 95): el LCP sube ~0,1 s por las peticiones nuevas de
    la cabecera (manifest e iconos). Sigue por encima del objetivo de 90.
  - Accesibilidad 100 y SEO 100 en todas.
  - Buenas prácticas: 100, y 96 en las páginas con noticias por los 429 de rss2json.

**Limitación del entorno de pruebas detectada**
- En el WebKit de Playwright para Windows los títulos se ven con trazo fino.
- Las fuentes son variables (peso 100-900 con valor por defecto 400) y ese WebKit no aplica el eje
  de peso, así que pinta la instancia de 400.
- Safari real (macOS e iOS) admite fuentes variables desde la versión 11. Ya ocurría en las
  capturas de referencia.

---

## Decisiones pendientes

_Ninguna por ahora._
