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

## Decisiones pendientes

_Ninguna por ahora._
