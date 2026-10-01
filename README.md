# GPU Universe

[![Pruebas](https://github.com/Frxnker/GPUUniverse/actions/workflows/pruebas.yml/badge.svg)](https://github.com/Frxnker/GPUUniverse/actions/workflows/pruebas.yml)
![Versión](https://img.shields.io/badge/versión-2.0.0-19e6b4)
[![Licencia: MIT](https://img.shields.io/badge/licencia-MIT-blue)](LICENSE)

Portal sobre tarjetas gráficas: catálogo, comparador, historia, un visor 3D de las piezas de una GPU
y calculadoras. Está en 6 idiomas, funciona sin conexión y no necesita compilar nada.

**Web publicada:** <https://frxnker.github.io/GPUUniverse/>

![GPU Universe](assets/icons/og-image.png)

## Qué tiene

- **Catálogo**:
  - 147 GPUs de escritorio (2009-2025) y 24 de portátil en *Gaming*;
  - 10 profesionales en *Workstation*;
  - 9 aceleradores de IA en *Servidor*.
  - Filtros, ordenación y buscador; el estado se guarda en la URL para compartirlo.
  - Cada GPU tiene su ficha con las fuentes de sus datos.
- **Comparador** de hasta 4 GPUs: veredicto, gráfica por métrica, tabla con el mejor valor
  marcado y enlace para compartir (`?gpus=`).
- **Historia**: cronología, mapa de arquitecturas de NVIDIA y AMD y Salón de la Fama.
- **Aprender**: modelo 3D de una tarjeta gráfica con sus piezas explicadas. Si el equipo no tiene
  WebGL, las piezas se pueden leer igual.
- **Herramientas**: qué GPU mejora la tuya, qué fuente de alimentación necesitas y cuánta VRAM
  hace falta para jugar o para IA local.
- **Niveles**: experiencia, logros, retos diarios y colores de LED desbloqueables. El progreso se
  guarda en el navegador.
- **Buscador rápido** (Ctrl+K), favoritas, recientes y bandeja de comparación.
- **Recomendador** en la portada (tres preguntas).
- **Noticias** de TechPowerUp, Tom's Hardware, Wccftech y PC Gamer, con «Actualizado hace…». Las
  recoge cada 3 horas una GitHub Action y se sirven desde el propio sitio (`news.json`): el
  navegador no contacta con ningún servicio externo y, sin conexión, se ve la última copia guardada.
- **Idiomas**: español, inglés, francés, alemán, italiano y ruso, con plurales rusos correctos.
- **Aspecto**: tema claro y oscuro con estética de placa de circuito («Silicio / PCB»).
- **Sin conexión**: se puede instalar como app y, tras la primera visita, funciona sin red.

### Sobre los datos

- **Precios:** son el PVP de lanzamiento en EE. UU., en dólares y sin impuestos. Son orientativos:
  no es el precio actual ni hay conversión de moneda.
- **Índice gaming:** rendimiento a 1440p Ultra respecto a la RTX 5090 (= 100), según la jerarquía
  de Tom's Hardware.
- **Datos pendientes:** lo que no se ha podido verificar con una fuente aparece como «pendiente»,
  nunca inventado.
- **Revisión:** fecha y fuentes en `DATA_META` y `DATA_SOURCES` de `js/data.js`.

## Tecnología

- HTML, CSS y JavaScript sin frameworks ni compilación: lo que hay en el repositorio es lo que se
  publica.
- Nada se carga de otros dominios, tampoco las noticias:
  - noticias en `news.json`, del mismo origen (las genera `scripts/news.js`);
  - fuentes locales (Exo 2, IBM Plex Sans y JetBrains Mono);
  - Three.js 0.186 local para el visor 3D;
  - banderas e iconos propios.
- `sw.js` (service worker) y `manifest.webmanifest` para el uso sin conexión.
- Política de seguridad de contenido (CSP) en todas las páginas. Ver
  [`docs/SEGURIDAD.md`](docs/SEGURIDAD.md).
- Accesibilidad:
  - teclado completo;
  - enlace para saltar al contenido;
  - contraste AA en los dos temas;
  - respeta «reducir movimiento».

## Estructura

```text
├── index.html, 404.html        Portada y página de error
├── pages/                      Gaming, Workstation, Servidor, Comparar, Historia, Aprender,
│                               Herramientas y Niveles
├── partials/                   Bloques comunes (cabecera, barra, pie, modal, noticias, metadatos)
├── css/style.css               Estilos (índice de secciones al principio)
├── js/                         i18n, datos, lógica común y un script por página
├── assets/                     Imágenes, fuentes, banderas e iconos
├── vendor/three/               Three.js (copia local)
├── sw.js, manifest.webmanifest Uso sin conexión e instalación
├── sitemap.xml, robots.txt     Buscadores
├── scripts/                    serve.js (servidor local), shell.js (bloques comunes),
│                               news.js (noticias) y site.js (lo que se publica)
├── tests/                      Pruebas automáticas
└── docs/                       Registro de progreso y auditoría de seguridad
```

## Cómo usarlo en local

Hace falta [Node.js](https://nodejs.org/) 22.13 o posterior, solo para el servidor local y las
pruebas; la web no lo necesita. GitHub Actions usa Node 24.

```bash
git clone https://github.com/Frxnker/GPUUniverse.git
cd GPUUniverse
npm install        # solo instala jsdom, que usan las pruebas
npm start          # http://localhost:8080/  (también responde en /GPUUniverse/, como GitHub Pages)
npm run news       # opcional: descarga los feeds y genera news.json (no se guarda en git)
```

- Ábrela a través del servidor, no con doble clic en `index.html`: el service worker y las
  noticias necesitan `http://`.
- Sin `npm run news`, la sección de noticias muestra su aviso de error con el botón de reintentar.
- El servidor local distingue mayúsculas y minúsculas igual que GitHub Pages.

## Pruebas

```bash
npm test                   # unos 20 s
npm run shell -- --check   # que las páginas coinciden con partials/ y sitemap.xml está al día
```

Las pruebas (jsdom con el test runner de Node) cubren:
- las páginas: sin errores y traducidas en los 6 idiomas;
- las traducciones (mismas claves, plurales);
- la coherencia de los datos;
- los filtros y precios;
- las reglas de niveles y logros;
- los flujos principales (comparar, favoritos, Ctrl+K, herramientas y retos);
- la accesibilidad (encabezados, teclado, etiquetas);
- los metadatos y el uso sin conexión;
- las noticias: el generador con feeds de ejemplo (válidos, rotos, con HTML hostil y sin fechas) y
  su sección en la web (estados, idiomas, copia sin conexión);
- lo que se publica (ni pruebas, ni scripts, ni documentación);
- que un efecto decorativo que falla (o una ventana de 0 px) no rompa la página;
- la seguridad (entradas hostiles, CSP);
- que no haya CSS muerto;
- las mayúsculas en las rutas.

GitHub Actions las ejecuta en cada push y pull request, y antes de cada publicación.

## Cómo cambiar cosas

- **Barra, pie, modal, cabecera o noticias:**
  - se editan en `partials/` y luego se ejecuta `npm run shell`, que los copia en todas las
    páginas;
  - una prueba falla si alguna página se queda desincronizada.
- **Textos:** en `js/i18n.js`, siempre en los 6 idiomas con las mismas claves.
  - El título y la descripción de cada página están en `meta.*`.
  - `npm run shell` los usa también para el HTML y los metadatos para compartir.
- **Datos de GPUs:** en `js/data.js`, con su fuente (`src`). Si no se puede verificar un dato, se
  deja en `null` (se muestra como pendiente).
- **Estilos:** `css/style.css` está en capas y el orden importa (ver su índice).
- **Service worker:** si cambia la lista de archivos que guarda, sube `VERSION` en `sw.js`.
- **Noticias:** los feeds y el filtro de GPUs están en `scripts/news.js`; la forma de `news.json`
  la comprueba `validateNews` (y las pruebas).
- **Progreso guardado:** si cambia la forma del estado, sube `VERSION` en `js/progress.js` y añade
  la migración.

## Publicación

- La publica la GitHub Action «Noticias y publicación» (`.github/workflows/noticias.yml`): cada 3
  horas, en cada push a `main` y a mano desde la pestaña Actions.
  - Genera `news.json`, pasa `npm run shell -- --check` y `npm test`, monta el sitio con
    `scripts/site.js` y lo despliega en GitHub Pages. No hace commits.
  - Solo publica la web y su licencia: nada de `partials/`, `tests/`, `scripts/`, `docs/`,
    `package*.json`, `README.md` ni `CREDITOS.md`.
  - Si fallan todos los feeds, se conserva el `news.json` publicado; nunca se publica vacío.
  - Requisito en GitHub: Settings → Pages → Source: «GitHub Actions».
- `_config.yml` solo cuenta si se vuelve a publicar desde la rama; una prueba comprueba que coincide
  con lo que publica la acción.
- La URL pública está en `"homepage"` de `package.json`: de ahí salen el `canonical`, la sitemap y
  la ruta de la 404.

## Licencia y créditos

- Código con [licencia MIT](LICENSE).
- Las ilustraciones de GPUs están **generadas con IA** y la web lo indica junto a cada una.
- El origen de cada imagen, fuente y biblioteca, y el aviso de marcas registradas, están en
  [CREDITOS.md](CREDITOS.md).
- GPU Universe es un proyecto independiente, sin relación con NVIDIA, AMD, Intel ni Apple.
