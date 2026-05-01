# 🌌 GPU Universe — Portal de Hardware Gráfico

[![Project Version](https://img.shields.io/badge/version-1.3.0-blueviolet)](https://github.com/Frxnker/gpu-universe)
[![Status](https://img.shields.io/badge/status-active-success)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

**GPU Universe** es una plataforma interactiva de última generación diseñada para entusiastas y profesionales del hardware. Ofrece una base de datos exhaustiva y visualmente impactante que abarca desde las tarjetas gráficas domésticas más icónicas hasta los aceleradores de IA y centros de datos más potentes del planeta, incluyendo la nueva serie **Blackwell** de NVIDIA.

![Preview](https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=1000)

## ✨ Características Principales

- 🌍 **Internacionalización (i18n)**: Soporte nativo para 6 idiomas (Español, Inglés, Francés, Alemán, Italiano y Ruso) con cambio dinámico de idioma sin recarga de página.
- 🔍 **Buscador Inteligente**: Sistema de búsqueda global con autocompletado que localiza instantáneamente cualquier GPU en las categorías Desktop, Laptop, Workstation o Server.
- ⚖️ **Comparador Dinámico**: Herramienta de comparación técnica (referencia actual: **RTX 5090**) que visualiza diferencias en TFLOPS, VRAM, Ancho de Banda y TDP con gráficos dinámicos.
- 📱 **Diseño Ultra-Premium**: Interfaz *Glassmorphism* con efectos de partículas interactivos, fondos dinámicos y transiciones suaves optimizadas para 60 FPS.
- 📈 **Base de Datos Blackwell 2025**: Datos actualizados de la serie **RTX 5090 / 5080**, así como aceleradores de IA de vanguardia como el **NVIDIA H200** y **AMD Instinct MI300X**.
- 💹 **Localización de Precios**: Sistema de conversión automática de moneda que muestra precios estimados en EUR, USD o RUB según el idioma seleccionado.
- 🛡️ **Integridad de Datos**: Base de datos optimizada y código refactorizado para máxima estabilidad y rendimiento.

## 🚀 Tecnologías Utilizadas

- **Frontend Core**: HTML5 Semántico y CSS3 Moderno (Custom Properties, Grid, Flexbox).
- **JS Engine**: JavaScript ES6+ Vanilla (Sin frameworks pesados, garantizando tiempos de carga ínfimos).
- **Visuales**: Canvas API (Partículas), Google Fonts (*Outfit* y *JetBrains Mono*).
- **SEO & UX**: Estructura optimizada para motores de búsqueda y accesibilidad móvil completa.

## 📁 Estructura del Proyecto

```text
├── index.html          # Dashboard principal y línea de tiempo histórica
├── css/
│   └── style.css       # Sistema de diseño, temas y media queries
├── js/
│   ├── app.js          # Cerebro del portal: búsqueda, modales y lógica
│   ├── data.js         # Núcleo de datos: base de datos centralizada
│   └── i18n.js         # Motor de traducción multilingüe
├── pages/
│   ├── gaming.html     # Catálogo de GPUs domésticas y portátiles
│   ├── workstation.html# Hardware profesional y estaciones de trabajo
│   ├── server.html      # Aceleradores Enterprise e IA
│   └── compare.html    # Laboratorio de comparación técnica
└── assets/             # Recursos multimedia (imágenes, iconos)
```

## 🛠️ Instalación y Uso

El proyecto es totalmente portable y no requiere dependencias de servidor:

1. **Clonar**:
   ```bash
   git clone https://github.com/Frxnker/gpu-universe.git
   ```
2. **Ejecutar**: Abre `index.html` en tu navegador favorito.
3. **Desarrollo**: Se recomienda usar *Live Server* o cualquier servidor estático ligero para apreciar las transiciones i18n.

## 🤝 Contribuciones

Este es un proyecto abierto. Si deseas añadir nuevas GPUs o corregir especificaciones, por favor abre un *Pull Request*. La base de datos en `data.js` sigue una estructura JSON estricta y sencilla de ampliar.

---

Desarrollado con precisión técnica para la comunidad de hardware.  
**© 2025-2026 GPU Universe**
