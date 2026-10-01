# Créditos, licencias y avisos

## Código

El código de GPU Universe (HTML, CSS, JavaScript, pruebas y scripts) se publica con la
[licencia MIT](LICENSE). © 2025-2026 Frxnker.

## Imágenes

Las ilustraciones de GPUs **están generadas con inteligencia artificial**. No son fotografías de
los modelos reales. Así lo indica la propia web junto a cada una («Ilustración generada con IA»)
y en su texto alternativo.

| Archivos | Qué muestra | Dónde se usa | Origen |
|---|---|---|---|
| `assets/gpu_hero-*` | Placa de una tarjeta gráfica de gama alta | Portada | Generada con IA de Google |
| `assets/gaming_gpu-*` | Tarjeta gráfica de gaming | Página Gaming | Generada con IA de Google |
| `assets/geforce_256-*` | Ilustración inspirada en la NVIDIA GeForce 256 | Salón de la Fama (Historia) | Generada con IA de Google |
| `assets/3dfx_voodoo-*` | Ilustración inspirada en la 3dfx Voodoo | Salón de la Fama | Generada con IA de Google |
| `assets/gtx_1080_ti-*` | Ilustración inspirada en la NVIDIA GTX 1080 Ti | Salón de la Fama | Generada con IA de Google |
| `assets/radeon_hd_7970-*` | Ilustración inspirada en la AMD Radeon HD 7970 | Salón de la Fama | Generada con IA de Google |

- **Cómo se ha comprobado el origen.** Los PNG originales, en el historial del repositorio hasta
  el commit `3e278fb`, llevan un manifiesto
  [C2PA](https://c2pa.org/) firmado por Google LLC:
  - acción `c2pa.created` con la descripción *«Created by Google Generative AI»*;
  - tipo de origen `trainedAlgorithmicMedia`;
  - una segunda acción que declara la marca de agua invisible SynthID.
- Las versiones optimizadas (AVIF, WebP y JPG en 480 y 960 px) se generaron a partir de esos PNG
  y ya no conservan el manifiesto.
- **Iconos e imagen para compartir** (`assets/icons/`): dibujados para el proyecto a partir del
  chip del logotipo, bajo la misma licencia MIT que el código.
- **Banderas** (`assets/flags/`):
  - SVG geométricos simplificados de banderas nacionales, cuyo diseño es de dominio público;
  - sustituyen a las imágenes que antes se cargaban de flagcdn.com;
  - no consta quién dibujó cada archivo (llegaron en el commit `60192a2`).

## Fuentes tipográficas

Copias locales en `assets/fonts/`, con la [SIL Open Font License 1.1](https://openfontlicense.org/):

| Familia | Autoría | Licencia |
|---|---|---|
| Exo 2 | © 2013 The Exo 2 Project Authors | `assets/fonts/OFL-exo2.txt` |
| IBM Plex Sans | © 2017 IBM Corp. (nombre reservado «Plex») | `assets/fonts/OFL-ibmplexsans.txt` |
| JetBrains Mono | © 2020 The JetBrains Mono Project Authors | `assets/fonts/OFL-jetbrainsmono.txt` |

## Bibliotecas

- **Three.js** 0.186.1 (visor 3D de la página Aprender).
  - Licencia MIT, © 2010-2026 three.js authors.
  - Ver `vendor/three/LICENSE`.

## Datos

- Las especificaciones, fechas y precios de lanzamiento proceden de las fuentes que cita cada GPU
  en su ficha («Fuentes de los datos»):
  - la jerarquía de GPUs de Tom's Hardware;
  - las fichas oficiales de NVIDIA, AMD, Intel y Apple.
- La lista completa está en `DATA_SOURCES` de `js/data.js`. Son datos orientativos: consulta
  siempre la fuente oficial.

## Noticias

- Los titulares y resúmenes de «Últimas noticias» vienen de los feeds públicos de TechPowerUp,
  Tom's Hardware, Wccftech y PC Gamer. Una GitHub Action los descarga cada 3 horas y guarda en
  `news.json` el título, el enlace, la fuente, la fecha y un extracto corto (no los artículos ni sus
  imágenes).
- Pertenecen a sus autores; la web solo enlaza a la noticia original.

## Marcas registradas

- NVIDIA, GeForce, RTX, Quadro, CUDA y DLSS son marcas de NVIDIA Corporation.
- AMD, Radeon, Instinct y FSR son marcas de Advanced Micro Devices, Inc.
- Intel, Arc, Gaudi y XeSS son marcas de Intel Corporation.
- Apple, Mac y MetalFX son marcas de Apple Inc.
- 3dfx y Voodoo pertenecen a sus respectivos titulares.
- Las demás marcas citadas son de sus propietarios.
- GPU Universe es un proyecto independiente, sin relación con ninguno de ellos ni patrocinado
  por ellos. Los nombres se usan solo para identificar los productos.
