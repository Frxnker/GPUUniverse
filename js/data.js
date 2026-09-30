// ===== BASE DE DATOS DE GPUS =====
// Cada GPU indica en `src` de dónde salen sus datos (claves de DATA_SOURCES o una URL).
// Precios: `msrp` es el precio de venta recomendado EN EL LANZAMIENTO, en dólares de EE. UU.,
// y `launch` el mes de lanzamiento (AAAA-MM) cuando se conoce. Es orientativo: no refleja el
// precio actual ni impuestos de otros países. Si no hay precio oficial, `msrp` es null y
// `priceNote` explica por qué ('laptop', 'no-official' o 'pending').
// Los datos que no se han podido verificar quedan a null ("pendiente").

const DATA_META = {
  reviewed: '2026-09-29',
  // Índice gaming de escritorio: rendimiento a 1440p Ultra (rasterización) relativo a la RTX 5090 = 100,
  // según la jerarquía de Tom's Hardware. Las GPUs que no están en la tabla de 2026 se enlazan desde las
  // tablas 2022–2024 y 2020–2021 calibrando con las GPUs más parecidas (de la misma arquitectura si las hay)
  // medidas en ambas. Las GPUs sin análisis comparables publicados quedan sin índice (null).
  perfMethod: 'thw-1440p',
  // Índice de portátiles: estimación previa sin fuente verificable (pendiente de revisar).
  laptopPerf: 'legacy-estimate'
};

const DATA_SOURCES = {
  thw: { name: "Tom's Hardware — GPU Benchmarks Hierarchy 2026", url: 'https://www.tomshardware.com/reviews/gpu-hierarchy,4388.html' },
  thw22: { name: "Tom's Hardware — GPU Benchmarks 2022–2024", url: 'https://www.tomshardware.com/reviews/gpu-hierarchy,4388-2.html' },
  thw20: { name: "Tom's Hardware — GPU Benchmarks 2020–2021", url: 'https://www.tomshardware.com/reviews/gpu-hierarchy,4388-3.html' },
  thwLegacy: { name: "Tom's Hardware — Legacy GPU Hierarchy (lanzamiento, arquitectura y MSRP)", url: 'https://www.tomshardware.com/reviews/gpu-hierarchy,4388-3.html' },
  nvidiaLaptop50: { name: 'NVIDIA — GeForce RTX 50 Series Laptops', url: 'https://www.nvidia.com/en-us/geforce/laptops/50-series/' },
  nvidiaLaptop40: { name: 'NVIDIA — GeForce RTX 40 Series Laptops', url: 'https://www.nvidia.com/en-us/geforce/laptops/40-series/' },
  nvidiaLaptop30: { name: 'NVIDIA — GeForce RTX 30 Series Laptops', url: 'https://www.nvidia.com/en-us/geforce/laptops/30-series/' },
  nvidiaHgx: { name: 'NVIDIA — HGX (especificaciones de HGX B200 y Rubin)', url: 'https://www.nvidia.com/en-us/data-center/hgx/' },
  nvidiaDgxB200: { name: 'NVIDIA — DGX B200', url: 'https://www.nvidia.com/en-us/data-center/dgx-b200/' },
  nvidiaH200: { name: 'NVIDIA — H200', url: 'https://www.nvidia.com/en-us/data-center/h200/' },
  nvidiaH100: { name: 'NVIDIA — H100', url: 'https://www.nvidia.com/en-us/data-center/h100/' },
  nvidiaA100: { name: 'NVIDIA — A100', url: 'https://www.nvidia.com/en-us/data-center/a100/' },
  amdMi355x: { name: 'AMD — Instinct MI355X', url: 'https://www.amd.com/en/products/accelerators/instinct/mi350/mi355x.html' },
  amdMi325x: { name: 'AMD — Instinct MI325X', url: 'https://www.amd.com/en/products/accelerators/instinct/mi300/mi325x.html' },
  amdMi300x: { name: 'AMD — Instinct MI300X', url: 'https://www.amd.com/en/products/accelerators/instinct/mi300/mi300x.html' },
  intelGaudi3: { name: 'Intel — Gaudi 3 AI Accelerator White Paper', url: 'https://cdrdv2-public.intel.com/817486/gaudi-3-ai-accelerator-white-paper.pdf' },
  appleMacStudio: { name: 'Apple — Mac Studio: especificaciones', url: 'https://www.apple.com/mac-studio/specs/' }
};

// Escritorio (gaming y uso general). Precio, fecha y arquitectura: tabla "Legacy" de Tom's Hardware
// salvo que `src` indique otra fuente. Índice gaming (`perf`): ver DATA_META.perfMethod.
const DESKTOP_GPUS = [
  // 2009
  { brand: 'amd', name: 'Radeon HD 5970', arch: 'TeraScale 2 / Hemlock (2x)', year: 2009, launch: '2009-11', tier: 'ultra', vram: '2 GB GDDR5', tflops: '4.64', bandwidth: '256.0 GB/s', tdp: '297W', msrp: 599, perf: null, src: ['thwLegacy'] },
  { brand: 'amd', name: 'Radeon HD 5870', arch: 'TeraScale 2 / Cypress', year: 2009, launch: '2009-09', tier: 'high', vram: '1 GB GDDR5', tflops: '2.72', bandwidth: '153.6 GB/s', tdp: '188W', msrp: 379, perf: null, src: ['thwLegacy'] },
  { brand: 'amd', name: 'Radeon HD 5850', arch: 'TeraScale 2 / Cypress', year: 2009, launch: '2009-09', tier: 'high', vram: '1 GB GDDR5', tflops: '2.08', bandwidth: '128.0 GB/s', tdp: '151W', msrp: 259, perf: null, src: ['thwLegacy'] },
  { brand: 'amd', name: 'Radeon HD 5770', arch: 'TeraScale 2 / Juniper', year: 2009, launch: '2009-10', tier: 'mid', vram: '1 GB GDDR5', tflops: '1.36', bandwidth: '76.8 GB/s', tdp: '108W', msrp: 159, perf: null, src: ['thwLegacy'] },
  // 2010
  { brand: 'amd', name: 'Radeon HD 6970', arch: 'TeraScale 3 / Cayman', year: 2010, launch: '2010-12', tier: 'high', vram: '2 GB GDDR5', tflops: '2.7', bandwidth: '176.0 GB/s', tdp: '250W', msrp: 369, perf: null, src: ['thwLegacy'] },
  { brand: 'amd', name: 'Radeon HD 6870', arch: 'TeraScale 3 / Barts', year: 2010, launch: '2010-10', tier: 'mid', vram: '1 GB GDDR5', tflops: '2.01', bandwidth: '134.4 GB/s', tdp: '151W', msrp: 239, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX 480', arch: 'Fermi / GF100', year: 2010, launch: '2010-03', tier: 'ultra', vram: '1.5 GB GDDR5', tflops: '1.34', bandwidth: '177.4 GB/s', tdp: '250W', msrp: 499, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX 580', arch: 'Fermi 2.0 / GF110', year: 2010, launch: '2010-11', tier: 'high', vram: '1.5 GB GDDR5', tflops: '1.58', bandwidth: '192.4 GB/s', tdp: '244W', msrp: 499, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX 470', arch: 'Fermi / GF100', year: 2010, launch: '2010-03', tier: 'high', vram: '1.28 GB GDDR5', tflops: '1.08', bandwidth: '133.9 GB/s', tdp: '215W', msrp: 349, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX 570', arch: 'Fermi 2.0 / GF110', year: 2010, launch: '2010-12', tier: 'high', vram: '1.28 GB GDDR5', tflops: '1.4', bandwidth: '152.0 GB/s', tdp: '219W', msrp: 349, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX 465', arch: 'Fermi / GF100', year: 2010, launch: '2010-05', tier: 'high', vram: '1 GB GDDR5', tflops: '0.85', bandwidth: '102.6 GB/s', tdp: '200W', msrp: 279, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX 460', arch: 'Fermi / GF104', year: 2010, launch: '2010-07', tier: 'mid', vram: '1 GB GDDR5', tflops: '0.9', bandwidth: '115.2 GB/s', tdp: '160W', msrp: 229, perf: null, src: ['thwLegacy'] },
  // 2011
  { brand: 'amd', name: 'Radeon HD 6990', arch: 'TeraScale 3 / Antilles (2x)', year: 2011, launch: '2011-03', tier: 'ultra', vram: '4 GB GDDR5', tflops: '5.1', bandwidth: '320.0 GB/s', tdp: '375W', msrp: 699, perf: null, src: ['thwLegacy'] },
  { brand: 'amd', name: 'Radeon HD 7970', arch: 'GCN 1.0', year: 2011, launch: '2011-12', tier: 'high', vram: '3 GB GDDR5', tflops: '3.79', bandwidth: '264.0 GB/s', tdp: '250W', msrp: 549, perf: null, src: ['https://www.techspot.com/specs/gpu/82730-amd-radeon-hd-7970.html'] },
  { brand: 'nvidia', name: 'GTX 590', arch: 'Fermi 2.0 / 2x GF110', year: 2011, launch: '2011-03', tier: 'ultra', vram: '3 GB GDDR5', tflops: '2.48', bandwidth: '327.7 GB/s', tdp: '365W', msrp: 699, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX 560 Ti', arch: 'Fermi 2.0 / GF114', year: 2011, launch: '2011-01', tier: 'mid', vram: '1 GB GDDR5', tflops: '1.26', bandwidth: '128.3 GB/s', tdp: '170W', msrp: 249, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX 560', arch: 'Fermi 2.0 / GF114', year: 2011, launch: '2011-05', tier: 'mid', vram: '1 GB GDDR5', tflops: '1.07', bandwidth: '128.3 GB/s', tdp: '150W', msrp: 199, perf: null, src: ['thwLegacy'] },
  // 2012
  { brand: 'amd', name: 'Radeon HD 7970 GHz Ed.', arch: 'GCN 1.0 / Tahiti', year: 2012, launch: '2012-06', tier: 'high', vram: '3 GB GDDR5', tflops: '4.3', bandwidth: '288.0 GB/s', tdp: '250W', msrp: 499, perf: null, src: ['thwLegacy'] },
  { brand: 'amd', name: 'Radeon HD 7950', arch: 'GCN 1.0 / Tahiti', year: 2012, launch: '2012-01', tier: 'high', vram: '3 GB GDDR5', tflops: '2.86', bandwidth: '240.0 GB/s', tdp: '200W', msrp: 450, perf: null, src: ['thwLegacy'] },
  { brand: 'amd', name: 'Radeon HD 7870', arch: 'GCN 1.0 / Pitcairn', year: 2012, launch: '2012-03', tier: 'mid', vram: '2 GB GDDR5', tflops: '2.56', bandwidth: '153.6 GB/s', tdp: '175W', msrp: 350, perf: null, src: ['thwLegacy'] },
  { brand: 'amd', name: 'Radeon HD 7850', arch: 'GCN 1.0 / Pitcairn', year: 2012, launch: '2012-03', tier: 'mid', vram: '2 GB GDDR5', tflops: '1.76', bandwidth: '153.6 GB/s', tdp: '130W', msrp: 250, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX 690', arch: 'Kepler / 2x GK104', year: 2012, launch: '2012-04', tier: 'ultra', vram: '4 GB GDDR5', tflops: '6.26', bandwidth: '384.4 GB/s', tdp: '300W', msrp: 999, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX 680', arch: 'Kepler / GK104', year: 2012, launch: '2012-03', tier: 'high', vram: '2 GB GDDR5', tflops: '3.25', bandwidth: '192.2 GB/s', tdp: '195W', msrp: 499, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX 670', arch: 'Kepler / GK104', year: 2012, launch: '2012-05', tier: 'high', vram: '2 GB GDDR5', tflops: '2.63', bandwidth: '192.2 GB/s', tdp: '170W', msrp: 399, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX 660 Ti', arch: 'Kepler / GK104', year: 2012, launch: '2012-08', tier: 'mid', vram: '2 GB GDDR5', tflops: '2.63', bandwidth: '144.2 GB/s', tdp: '150W', msrp: 299, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX 660', arch: 'Kepler / GK106', year: 2012, launch: '2012-09', tier: 'mid', vram: '2 GB GDDR5', tflops: '1.98', bandwidth: '144.2 GB/s', tdp: '140W', msrp: 229, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX 650 Ti', arch: 'Kepler / GK106', year: 2012, launch: '2012-10', tier: 'entry', vram: '1 GB GDDR5', tflops: '1.42', bandwidth: '86.4 GB/s', tdp: '110W', msrp: 149, perf: null, src: ['thwLegacy'] },
  // 2013
  { brand: 'amd', name: 'Radeon HD 7990', arch: 'GCN 1.0 / New Zealand (x2)', year: 2013, launch: '2013-04', tier: 'ultra', vram: '6 GB GDDR5', tflops: '8.19', bandwidth: '576.0 GB/s', tdp: '375W', msrp: 999, perf: null, src: ['thwLegacy'] },
  { brand: 'amd', name: 'Radeon R9 290X', arch: 'GCN 2.0 / Hawaii', year: 2013, launch: '2013-10', tier: 'high', vram: '4 GB GDDR5', tflops: '5.63', bandwidth: '320.0 GB/s', tdp: '290W', msrp: 549, perf: null, src: ['thwLegacy'] },
  { brand: 'amd', name: 'Radeon R9 290', arch: 'GCN 2.0 / Hawaii', year: 2013, launch: '2013-11', tier: 'high', vram: '4 GB GDDR5', tflops: '4.84', bandwidth: '320.0 GB/s', tdp: '275W', msrp: 399, perf: null, src: ['thwLegacy'] },
  { brand: 'amd', name: 'Radeon R9 280X', arch: 'GCN 1.0 / Tahiti', year: 2013, launch: '2013-08', tier: 'mid', vram: '3 GB GDDR5', tflops: '4.1', bandwidth: '288.0 GB/s', tdp: '250W', msrp: 299, perf: null, src: ['thwLegacy'] },
  { brand: 'amd', name: 'Radeon R9 270X', arch: 'GCN 1.0 / Pitcairn', year: 2013, launch: '2013-08', tier: 'mid', vram: '2 GB GDDR5', tflops: '2.68', bandwidth: '179.2 GB/s', tdp: '180W', msrp: 199, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX TITAN', arch: 'Kepler / GK110', year: 2013, launch: '2013-02', tier: 'ultra', vram: '6 GB GDDR5', tflops: '4.71', bandwidth: '288.4 GB/s', tdp: '250W', msrp: 999, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX 780 Ti', arch: 'Kepler / GK110', year: 2013, launch: '2013-11', tier: 'high', vram: '3 GB GDDR5', tflops: '5.34', bandwidth: '336.0 GB/s', tdp: '250W', msrp: 699, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX 780', arch: 'Kepler / GK110', year: 2013, launch: '2013-05', tier: 'high', vram: '3 GB GDDR5', tflops: '4.15', bandwidth: '288.4 GB/s', tdp: '250W', msrp: 649, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX 770', arch: 'Kepler / GK104', year: 2013, launch: '2013-05', tier: 'high', vram: '2 GB GDDR5', tflops: '3.33', bandwidth: '224.3 GB/s', tdp: '230W', msrp: 399, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX 760', arch: 'Kepler / GK104', year: 2013, launch: '2013-06', tier: 'mid', vram: '2 GB GDDR5', tflops: '2.38', bandwidth: '192.2 GB/s', tdp: '170W', msrp: 249, perf: null, src: ['thwLegacy'] },
  // 2014
  { brand: 'amd', name: 'Radeon R9 295X2', arch: 'GCN 2.0 / Vesuvius (x2)', year: 2014, launch: '2014-04', tier: 'ultra', vram: '8 GB GDDR5', tflops: '11.46', bandwidth: '640.0 GB/s', tdp: '500W', msrp: 1499, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX TITAN Black', arch: 'Kepler / GK110', year: 2014, launch: '2014-02', tier: 'ultra', vram: '6 GB GDDR5', tflops: '5.64', bandwidth: '336.0 GB/s', tdp: '250W', msrp: 999, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX 980', arch: 'Maxwell / GM204', year: 2014, launch: '2014-09', tier: 'high', vram: '4 GB GDDR5', tflops: '4.98', bandwidth: '224.3 GB/s', tdp: '165W', msrp: 549, perf: 9.9, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'GTX 970', arch: 'Maxwell / GM204', year: 2014, launch: '2014-09', tier: 'high', vram: '3.5 GB GDDR5', tflops: '3.92', bandwidth: '224.3 GB/s', tdp: '145W', msrp: 329, perf: 9.1, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'GTX 750 Ti', arch: 'Maxwell / GK107', year: 2014, launch: '2014-02', tier: 'entry', vram: '2 GB GDDR5', tflops: '1.39', bandwidth: '86.4 GB/s', tdp: '60W', msrp: 149, perf: null, src: ['thwLegacy'] },
  // 2015
  { brand: 'amd', name: 'Radeon R9 Fury X', arch: 'GCN 3.0 / Fiji', year: 2015, launch: '2015-06', tier: 'ultra', vram: '4 GB HBM', tflops: '8.6', bandwidth: '512.0 GB/s', tdp: '275W', msrp: 649, perf: 11.9, src: ['thwLegacy', 'thw22'] },
  { brand: 'amd', name: 'Radeon R9 Nano', arch: 'GCN 3.0 / Fiji', year: 2015, launch: '2015-08', tier: 'high', vram: '4 GB HBM', tflops: '8.19', bandwidth: '512.0 GB/s', tdp: '175W', msrp: 649, perf: null, src: ['thwLegacy'] },
  { brand: 'amd', name: 'Radeon R9 Fury', arch: 'GCN 3.0 / Fiji', year: 2015, launch: '2015-07', tier: 'high', vram: '4 GB HBM', tflops: '7.16', bandwidth: '512.0 GB/s', tdp: '275W', msrp: 549, perf: null, src: ['thwLegacy'] },
  { brand: 'amd', name: 'Radeon R9 390X', arch: 'GCN 2.0 / Grenada', year: 2015, launch: '2015-06', tier: 'high', vram: '8 GB GDDR5', tflops: '5.9', bandwidth: '384.0 GB/s', tdp: '275W', msrp: 429, perf: null, src: ['thwLegacy'] },
  { brand: 'amd', name: 'Radeon R9 390', arch: 'GCN 2.0 / Grenada', year: 2015, launch: '2015-06', tier: 'high', vram: '8 GB GDDR5', tflops: '5.12', bandwidth: '384.0 GB/s', tdp: '275W', msrp: 329, perf: 9.6, src: ['thwLegacy', 'thw22'] },
  { brand: 'amd', name: 'Radeon R9 380X', arch: 'GCN 3.0 / Tonga', year: 2015, launch: '2015-11', tier: 'mid', vram: '4 GB GDDR5', tflops: '3.97', bandwidth: '182.4 GB/s', tdp: '190W', msrp: 229, perf: null, src: ['thwLegacy'] },
  { brand: 'amd', name: 'Radeon R9 380', arch: 'GCN 3.0 / Tonga', year: 2015, launch: '2015-06', tier: 'mid', vram: '4 GB GDDR5', tflops: '3.48', bandwidth: '176.0 GB/s', tdp: '190W', msrp: 199, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX TITAN X', arch: 'Maxwell / GM200', year: 2015, launch: '2015-03', tier: 'ultra', vram: '12 GB GDDR5', tflops: '6.06', bandwidth: '336.5 GB/s', tdp: '250W', msrp: 999, perf: 13.2, src: ['thwLegacy', 'thw20'] },
  { brand: 'nvidia', name: 'GTX 980 Ti', arch: 'Maxwell / GM200', year: 2015, launch: '2015-06', tier: 'ultra', vram: '6 GB GDDR5', tflops: '6.05', bandwidth: '336.5 GB/s', tdp: '250W', msrp: 649, perf: 12.3, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'GTX 960', arch: 'Maxwell / GM206', year: 2015, launch: '2015-01', tier: 'mid', vram: '2 GB GDDR5', tflops: '2.41', bandwidth: '112.1 GB/s', tdp: '120W', msrp: 199, perf: null, src: ['thwLegacy'] },
  { brand: 'nvidia', name: 'GTX 950', arch: 'Maxwell / GM206', year: 2015, launch: '2015-08', tier: 'entry', vram: '2 GB GDDR5', tflops: '1.82', bandwidth: '105.6 GB/s', tdp: '90W', msrp: 159, perf: null, src: ['thwLegacy'] },
  // 2016
  { brand: 'nvidia', name: 'GTX 1080', arch: 'Pascal / GP104', year: 2016, launch: '2016-05', tier: 'high', vram: '8 GB GDDR5X', tflops: '8.87', bandwidth: '320.3 GB/s', tdp: '180W', msrp: 599, perf: 18.2, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'GTX 1070', arch: 'Pascal / GP104', year: 2016, launch: '2016-06', tier: 'high', vram: '8 GB GDDR5', tflops: '6.46', bandwidth: '256.3 GB/s', tdp: '150W', msrp: 379, perf: 15.3, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'GTX 1060 (6GB)', arch: 'Pascal / GP106', year: 2016, launch: '2016-07', tier: 'mid', vram: '6 GB GDDR5', tflops: '4.37', bandwidth: '192.2 GB/s', tdp: '120W', msrp: 249, perf: 10.7, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'GTX 1060 (3GB)', arch: 'Pascal / GP106', year: 2016, launch: '2016-08', tier: 'mid', vram: '3 GB GDDR5', tflops: '3.91', bandwidth: '192.2 GB/s', tdp: '120W', msrp: 199, perf: 9.5, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'GTX 1050 Ti', arch: 'Pascal / GP107', year: 2016, launch: '2016-10', tier: 'entry', vram: '4 GB GDDR5', tflops: '2.14', bandwidth: '112.1 GB/s', tdp: '75W', msrp: 139, perf: 6.7, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'GTX 1050', arch: 'Pascal / GP107', year: 2016, launch: '2016-10', tier: 'entry', vram: '2 GB GDDR5', tflops: '1.86', bandwidth: '112.1 GB/s', tdp: '75W', msrp: 109, perf: 5.4, src: ['thwLegacy', 'thw22'] },
  // 2017
  { brand: 'amd', name: 'Radeon RX Vega 64', arch: 'Vega / Vega 10', year: 2017, launch: '2017-08', tier: 'high', vram: '8 GB HBM2', tflops: '12.58', bandwidth: '483.8 GB/s', tdp: '295W', msrp: 499, perf: 19.3, src: ['thwLegacy', 'thw22'] },
  { brand: 'amd', name: 'Radeon RX Vega 56', arch: 'Vega / Vega 10', year: 2017, launch: '2017-08', tier: 'high', vram: '8 GB HBM2', tflops: '10.54', bandwidth: '410.0 GB/s', tdp: '210W', msrp: 399, perf: 17.1, src: ['thwLegacy', 'thw22'] },
  { brand: 'amd', name: 'Radeon RX 580', arch: 'Polaris / Polaris 20', year: 2017, launch: '2017-04', tier: 'mid', vram: '8 GB GDDR5', tflops: '6.17', bandwidth: '256.0 GB/s', tdp: '185W', msrp: 229, perf: 12, src: ['thwLegacy', 'thw22'] },
  { brand: 'amd', name: 'Radeon RX 570', arch: 'Polaris / Polaris 20', year: 2017, launch: '2017-04', tier: 'mid', vram: '4 GB GDDR5', tflops: '5.1', bandwidth: '224.0 GB/s', tdp: '150W', msrp: 169, perf: 9.2, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'TITAN Xp', arch: 'Pascal / GP102', year: 2017, launch: '2017-04', tier: 'ultra', vram: '12 GB GDDR5X', tflops: '12.15', bandwidth: '547.7 GB/s', tdp: '250W', msrp: 1200, perf: 24, src: ['thwLegacy', 'thw20'] },
  { brand: 'nvidia', name: 'GTX 1080 Ti', arch: 'Pascal / GP102', year: 2017, launch: '2017-03', tier: 'ultra', vram: '11 GB GDDR5X', tflops: '11.34', bandwidth: '484.4 GB/s', tdp: '250W', msrp: 699, perf: 22.1, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'GTX 1070 Ti', arch: 'Pascal / GP104', year: 2017, launch: '2017-11', tier: 'high', vram: '8 GB GDDR5', tflops: '8.19', bandwidth: '256.3 GB/s', tdp: '180W', msrp: 449, perf: 17.6, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'GT 1030', arch: 'Pascal / GP108', year: 2017, launch: '2017-05', tier: 'entry', vram: '2 GB GDDR5', tflops: '1.13', bandwidth: '48 GB/s', tdp: '30W', msrp: 70, perf: 2.7, src: ['thwLegacy', 'thw22'] },
  // 2018
  { brand: 'amd', name: 'Radeon RX 590', arch: 'Polaris / Polaris 30', year: 2018, launch: '2018-11', tier: 'mid', vram: '8 GB GDDR5', tflops: '7.12', bandwidth: '256.0 GB/s', tdp: '225W', msrp: 279, perf: 13.4, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'TITAN RTX', arch: 'Turing / TU102', year: 2018, launch: '2018-12', tier: 'ultra', vram: '24 GB GDDR6', tflops: '16.31', bandwidth: '672 GB/s', tdp: '280W', msrp: 2499, perf: 36.8, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'RTX 2080 Ti', arch: 'Turing / TU102', year: 2018, launch: '2018-09', tier: 'ultra', vram: '11 GB GDDR6', tflops: '13.45', bandwidth: '616.0 GB/s', tdp: '250W', msrp: 999, perf: 34.6, src: ['thw22', 'https://pcper.com/2018/09/the-nvidia-geforce-rtx-2080-and-rtx-2080-ti-review/9/'] },
  { brand: 'nvidia', name: 'RTX 2080', arch: 'Turing / TU104', year: 2018, launch: '2018-09', tier: 'high', vram: '8 GB GDDR6', tflops: '10.07', bandwidth: '448.0 GB/s', tdp: '215W', msrp: 699, perf: 29, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'RTX 2070', arch: 'Turing / TU106', year: 2018, launch: '2018-10', tier: 'high', vram: '8 GB GDDR6', tflops: '7.46', bandwidth: '448.0 GB/s', tdp: '175W', msrp: 499, perf: 24.1, src: ['thwLegacy', 'thw22'] },
  // 2019
  { brand: 'amd', name: 'Radeon VII', arch: 'Vega / Vega 20', year: 2019, launch: '2019-02', tier: 'high', vram: '16 GB HBM2', tflops: '13.44', bandwidth: '1024 GB/s', tdp: '300W', msrp: 699, perf: 24.7, src: ['thwLegacy', 'thw22'] },
  { brand: 'amd', name: 'Radeon RX 5700 XT', arch: 'RDNA 1 / Navi 10', year: 2019, launch: '2019-07', tier: 'high', vram: '8 GB GDDR6', tflops: '9.75', bandwidth: '448.0 GB/s', tdp: '225W', msrp: 399, perf: 24.7, src: ['thwLegacy', 'thw22'] },
  { brand: 'amd', name: 'Radeon RX 5700', arch: 'RDNA 1 / Navi 10', year: 2019, launch: '2019-07', tier: 'high', vram: '8 GB GDDR6', tflops: '7.95', bandwidth: '448.0 GB/s', tdp: '180W', msrp: 349, perf: 20.5, src: ['thw22', 'https://www.engadget.com/2019-07-05-radeon-5700-price-cut.html'] },
  { brand: 'amd', name: 'Radeon RX 5500 XT', arch: 'RDNA 1 / Navi 14', year: 2019, launch: '2019-12', tier: 'entry', vram: '8 GB GDDR6', tflops: '5.2', bandwidth: '224.0 GB/s', tdp: '130W', msrp: 199, perf: 13, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'RTX 2080 SUPER', arch: 'Turing / TU104', year: 2019, launch: '2019-07', tier: 'high', vram: '8 GB GDDR6', tflops: '11.15', bandwidth: '496.0 GB/s', tdp: '250W', msrp: 699, perf: 29.6, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'RTX 2070 SUPER', arch: 'Turing / TU104', year: 2019, launch: '2019-07', tier: 'high', vram: '8 GB GDDR6', tflops: '9.06', bandwidth: '448.0 GB/s', tdp: '215W', msrp: 499, perf: 27.1, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'RTX 2060 SUPER', arch: 'Turing / TU106', year: 2019, launch: '2019-07', tier: 'mid', vram: '8 GB GDDR6', tflops: '7.18', bandwidth: '448.0 GB/s', tdp: '175W', msrp: 399, perf: 21.3, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'RTX 2060', arch: 'Turing / TU106', year: 2019, launch: '2019-01', tier: 'mid', vram: '6 GB GDDR6', tflops: '6.45', bandwidth: '336.0 GB/s', tdp: '160W', msrp: 349, perf: 18.6, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'GTX 1660 Ti', arch: 'Turing / TU116', year: 2019, launch: '2019-02', tier: 'mid', vram: '6 GB GDDR6', tflops: '5.44', bandwidth: '288.0 GB/s', tdp: '120W', msrp: 279, perf: 15.4, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'GTX 1660 SUPER', arch: 'Turing / TU116', year: 2019, launch: '2019-10', tier: 'mid', vram: '6 GB GDDR6', tflops: '5.02', bandwidth: '336.0 GB/s', tdp: '125W', msrp: 229, perf: 15.4, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'GTX 1660', arch: 'Turing / TU116', year: 2019, launch: '2019-03', tier: 'mid', vram: '6 GB GDDR5', tflops: '5.03', bandwidth: '192.1 GB/s', tdp: '120W', msrp: 219, perf: 14.1, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'GTX 1650 SUPER', arch: 'Turing / TU116', year: 2019, launch: '2019-11', tier: 'entry', vram: '4 GB GDDR6', tflops: '4.42', bandwidth: '192.0 GB/s', tdp: '100W', msrp: 159, perf: 9.8, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'GTX 1650', arch: 'Turing / TU117', year: 2019, launch: '2019-04', tier: 'entry', vram: '4 GB GDDR5', tflops: '2.98', bandwidth: '128.1 GB/s', tdp: '75W', msrp: 149, perf: 8.4, src: ['thwLegacy', 'thw22'] },
  // 2020
  { brand: 'amd', name: 'Radeon RX 6900 XT', arch: 'RDNA 2 / Navi 21', year: 2020, launch: '2020-12', tier: 'ultra', vram: '16 GB GDDR6', tflops: '23.04', bandwidth: '512.0 GB/s', tdp: '300W', msrp: 999, perf: 50.2, src: ['thwLegacy', 'thw'] },
  { brand: 'amd', name: 'Radeon RX 6800 XT', arch: 'RDNA 2 / Navi 21', year: 2020, launch: '2020-11', tier: 'high', vram: '16 GB GDDR6', tflops: '20.74', bandwidth: '512.0 GB/s', tdp: '300W', msrp: 649, perf: 47.6, src: ['thwLegacy', 'thw'] },
  { brand: 'amd', name: 'Radeon RX 6800', arch: 'RDNA 2 / Navi 21', year: 2020, launch: '2020-11', tier: 'high', vram: '16 GB GDDR6', tflops: '16.17', bandwidth: '512.0 GB/s', tdp: '250W', msrp: 579, perf: 43.3, src: ['thwLegacy', 'thw22'] },
  { brand: 'amd', name: 'Radeon RX 5600 XT', arch: 'RDNA 1 / Navi 10', year: 2020, launch: '2020-01', tier: 'mid', vram: '6 GB GDDR6', tflops: '8.06', bandwidth: '288.0 GB/s', tdp: '150W', msrp: 279, perf: 19.5, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'RTX 3090', arch: 'Ampere / GA102', year: 2020, launch: '2020-09', tier: 'ultra', vram: '24 GB GDDR6X', tflops: '35.58', bandwidth: '936.2 GB/s', tdp: '350W', msrp: 1499, perf: 54.7, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 3080', arch: 'Ampere / GA102', year: 2020, launch: '2020-09', tier: 'high', vram: '10 GB GDDR6X', tflops: '29.77', bandwidth: '760.3 GB/s', tdp: '320W', msrp: 699, perf: 49, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 3070', arch: 'Ampere / GA104', year: 2020, launch: '2020-10', tier: 'high', vram: '8 GB GDDR6', tflops: '20.31', bandwidth: '448.0 GB/s', tdp: '220W', msrp: 499, perf: 34.8, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 3060 Ti', arch: 'Ampere / GA104', year: 2020, launch: '2020-12', tier: 'mid', vram: '8 GB GDDR6', tflops: '16.2', bandwidth: '448.0 GB/s', tdp: '200W', msrp: 399, perf: 30.5, src: ['thwLegacy', 'thw'] },
  // 2021
  { brand: 'amd', name: 'Radeon RX 6700 XT', arch: 'RDNA 2 / Navi 22', year: 2021, launch: '2021-03', tier: 'high', vram: '12 GB GDDR6', tflops: '13.21', bandwidth: '384.0 GB/s', tdp: '230W', msrp: 479, perf: 32.5, src: ['thwLegacy', 'thw'] },
  { brand: 'amd', name: 'Radeon RX 6600 XT', arch: 'RDNA 2 / Navi 23', year: 2021, launch: '2021-08', tier: 'mid', vram: '8 GB GDDR6', tflops: '10.6', bandwidth: '256.0 GB/s', tdp: '160W', msrp: 379, perf: 24.3, src: ['thwLegacy', 'thw'] },
  { brand: 'amd', name: 'Radeon RX 6600', arch: 'RDNA 2 / Navi 23', year: 2021, launch: '2021-10', tier: 'mid', vram: '8 GB GDDR6', tflops: '8.92', bandwidth: '224.0 GB/s', tdp: '132W', msrp: 329, perf: 14.9, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 3080 Ti', arch: 'Ampere / GA102', year: 2021, launch: '2021-06', tier: 'high', vram: '12 GB GDDR6X', tflops: '34.1', bandwidth: '912.4 GB/s', tdp: '350W', msrp: 1199, perf: 53.3, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 3070 Ti', arch: 'Ampere / GA104', year: 2021, launch: '2021-06', tier: 'high', vram: '8 GB GDDR6X', tflops: '21.75', bandwidth: '608.3 GB/s', tdp: '290W', msrp: 599, perf: 40, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 3060', arch: 'Ampere / GA106', year: 2021, launch: '2021-02', tier: 'mid', vram: '12 GB GDDR6', tflops: '12.74', bandwidth: '360.0 GB/s', tdp: '170W', msrp: 329, perf: 25, src: ['thwLegacy', 'thw'] },
  // 2022
  { brand: 'amd', name: 'Radeon RX 6950 XT', arch: 'RDNA 2 / Navi 21', year: 2022, launch: '2022-05', tier: 'ultra', vram: '16 GB GDDR6', tflops: '23.65', bandwidth: '576.0 GB/s', tdp: '335W', msrp: 1099, perf: 53.5, src: ['thwLegacy', 'thw'] },
  { brand: 'amd', name: 'Radeon RX 7900 XTX', arch: 'RDNA 3 / Navi 31', year: 2022, launch: '2022-12', tier: 'ultra', vram: '24 GB GDDR6', tflops: '61.42', bandwidth: '960 GB/s', tdp: '355W', msrp: 999, perf: 73.1, src: ['thwLegacy', 'thw'] },
  { brand: 'amd', name: 'Radeon RX 7900 XT', arch: 'RDNA 3 / Navi 31', year: 2022, launch: '2022-12', tier: 'ultra', vram: '20 GB GDDR6', tflops: '51.61', bandwidth: '800 GB/s', tdp: '315W', msrp: 899, perf: 64.6, src: ['thwLegacy', 'thw'] },
  { brand: 'amd', name: 'Radeon RX 6750 XT', arch: 'RDNA 2 / Navi 22', year: 2022, launch: '2022-05', tier: 'high', vram: '12 GB GDDR6', tflops: '13.31', bandwidth: '432.0 GB/s', tdp: '250W', msrp: 549, perf: 34.4, src: ['thwLegacy', 'thw'] },
  { brand: 'amd', name: 'Radeon RX 6650 XT', arch: 'RDNA 2 / Navi 23', year: 2022, launch: '2022-05', tier: 'mid', vram: '8 GB GDDR6', tflops: '10.79', bandwidth: '280.0 GB/s', tdp: '180W', msrp: 399, perf: 22.7, src: ['thwLegacy', 'thw'] },
  { brand: 'amd', name: 'Radeon RX 6500 XT', arch: 'RDNA 2 / Navi 24', year: 2022, launch: '2022-01', tier: 'entry', vram: '4 GB GDDR6', tflops: '5.77', bandwidth: '144.0 GB/s', tdp: '107W', msrp: 199, perf: 7.2, src: ['thwLegacy', 'thw22'] },
  { brand: 'amd', name: 'Radeon RX 6400', arch: 'RDNA 2 / Navi 24', year: 2022, launch: '2022-04', tier: 'entry', vram: '4 GB GDDR6', tflops: '3.57', bandwidth: '128 GB/s', tdp: '53W', msrp: 159, perf: 5.6, src: ['thw22', 'https://www.techpowerup.com/294037/amd-radeon-rx-6400-launched-at-usd-159'] },
  { brand: 'amd', name: 'Radeon RX 6700 (10GB)', arch: 'RDNA 2 / Navi 22', year: 2022, launch: null, tier: 'mid', vram: '10 GB GDDR6', tflops: '11.29', bandwidth: '320 GB/s', tdp: '175W', msrp: null, priceNote: 'no-official', perf: 27, src: ['thw22'] },
  { brand: 'intel', name: 'Arc A770', arch: 'Alchemist / ACM-G10', year: 2022, launch: '2022-10', tier: 'mid', vram: '16 GB GDDR6', tflops: '19.66', bandwidth: '560 GB/s', tdp: '225W', msrp: 349, perf: 27.5, src: ['thwLegacy', 'thw22'] },
  { brand: 'intel', name: 'Arc A770 (8GB)', arch: 'Alchemist / ACM-G10', year: 2022, launch: '2022-10', tier: 'mid', vram: '8 GB GDDR6', tflops: '19.66', bandwidth: '512 GB/s', tdp: '225W', msrp: 329, perf: 26.6, src: ['thwLegacy', 'thw22'] },
  { brand: 'intel', name: 'Arc A750', arch: 'Alchemist / ACM-G10', year: 2022, launch: '2022-10', tier: 'mid', vram: '8 GB GDDR6', tflops: '17.2', bandwidth: '512 GB/s', tdp: '225W', msrp: 289, perf: 24.9, src: ['thwLegacy', 'thw22'] },
  { brand: 'intel', name: 'Arc A380', arch: 'Alchemist / ACM-G11', year: 2022, launch: '2022-06', tier: 'entry', vram: '6 GB GDDR6', tflops: '5.02', bandwidth: '186 GB/s', tdp: '75W', msrp: 139, perf: 9, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'RTX 3090 Ti', arch: 'Ampere / GA102', year: 2022, launch: '2022-03', tier: 'ultra', vram: '24 GB GDDR6X', tflops: '40', bandwidth: '1008 GB/s', tdp: '450W', msrp: 1999, perf: 59.7, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 4090', arch: 'Ada Lovelace / AD102', year: 2022, launch: '2022-10', tier: 'ultra', vram: '24 GB GDDR6X', tflops: '82.58', bandwidth: '1008 GB/s', tdp: '450W', msrp: 1599, perf: 85.7, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 4080', arch: 'Ada Lovelace / AD103', year: 2022, launch: '2022-11', tier: 'high', vram: '16 GB GDDR6X', tflops: '48.74', bandwidth: '716.8 GB/s', tdp: '320W', msrp: 1199, perf: 70.3, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 3080 12GB', arch: 'Ampere / GA102', year: 2022, launch: '2022-01', tier: 'high', vram: '12 GB GDDR6X', tflops: '33.06', bandwidth: '912 GB/s', tdp: '400W', msrp: 999, perf: 52.6, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'RTX 3050', arch: 'Ampere / GA106', year: 2022, launch: '2022-01', tier: 'entry', vram: '8 GB GDDR6', tflops: '9.1', bandwidth: '224.0 GB/s', tdp: '130W', msrp: 249, perf: 17.8, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'GTX 1630', arch: 'Turing / TU117', year: 2022, launch: '2022-06', tier: 'entry', vram: '4 GB GDDR6', tflops: '1.83', bandwidth: '96 GB/s', tdp: '75W', msrp: null, priceNote: 'no-official', perf: 5.2, src: ['thw22', 'https://www.techpowerup.com/296268/nvidia-launches-geforce-gtx-1630-graphics-card'] },
  // 2023
  { brand: 'amd', name: 'Radeon RX 7800 XT', arch: 'RDNA 3 / Navi 32', year: 2023, launch: '2023-09', tier: 'high', vram: '16 GB GDDR6', tflops: '37.32', bandwidth: '624 GB/s', tdp: '263W', msrp: 499, perf: 50.7, src: ['thwLegacy', 'thw'] },
  { brand: 'amd', name: 'Radeon RX 7700 XT', arch: 'RDNA 3 / Navi 32', year: 2023, launch: '2023-09', tier: 'mid', vram: '12 GB GDDR6', tflops: '35.17', bandwidth: '432 GB/s', tdp: '245W', msrp: 449, perf: 43.4, src: ['thwLegacy', 'thw'] },
  { brand: 'amd', name: 'Radeon RX 7600', arch: 'RDNA 3 / Navi 33', year: 2023, launch: '2023-05', tier: 'mid', vram: '8 GB GDDR6', tflops: '21.75', bandwidth: '288 GB/s', tdp: '165W', msrp: 269, perf: 27.2, src: ['thwLegacy', 'thw'] },
  { brand: 'intel', name: 'Arc A580', arch: 'Alchemist / ACM-G10', year: 2023, launch: '2023-10', tier: 'entry', vram: '8 GB GDDR6', tflops: '12', bandwidth: '512 GB/s', tdp: '185W', msrp: 179, perf: 21.5, src: ['thwLegacy', 'thw22'] },
  { brand: 'nvidia', name: 'RTX 4070 Ti', arch: 'Ada Lovelace / AD103', year: 2023, launch: '2023-01', tier: 'high', vram: '12 GB GDDR6X', tflops: '40.09', bandwidth: '504 GB/s', tdp: '285W', msrp: 799, perf: 58.6, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 4070', arch: 'Ada Lovelace / AD104', year: 2023, launch: '2023-04', tier: 'high', vram: '12 GB GDDR6X', tflops: '29.15', bandwidth: '504 GB/s', tdp: '200W', msrp: 599, perf: 46.5, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 4060 Ti (16GB)', arch: 'Ada Lovelace / AD106', year: 2023, launch: '2023-06', tier: 'mid', vram: '16 GB GDDR6', tflops: '22.06', bandwidth: '288 GB/s', tdp: '165W', msrp: 499, perf: 36.2, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 4060 Ti', arch: 'Ada Lovelace / AD106', year: 2023, launch: '2023-05', tier: 'mid', vram: '8 GB GDDR6', tflops: '22.06', bandwidth: '288 GB/s', tdp: '160W', msrp: 399, perf: 35.2, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 4060', arch: 'Ada Lovelace / AD107', year: 2023, launch: '2023-06', tier: 'mid', vram: '8 GB GDDR6', tflops: '15.11', bandwidth: '272 GB/s', tdp: '115W', msrp: 299, perf: 28.4, src: ['thwLegacy', 'thw'] },
  // 2024
  { brand: 'amd', name: 'Radeon RX 7900 GRE', arch: 'RDNA 3 / Navi 31', year: 2024, launch: '2024-02', tier: 'high', vram: '16 GB GDDR6', tflops: '45.98', bandwidth: '576 GB/s', tdp: '260W', msrp: 549, perf: 56.6, src: ['thwLegacy', 'thw22'] },
  { brand: 'amd', name: 'Radeon RX 7600 XT', arch: 'RDNA 3 / Navi 33', year: 2024, launch: '2024-01', tier: 'mid', vram: '16 GB GDDR6', tflops: '22.57', bandwidth: '288 GB/s', tdp: '190W', msrp: 329, perf: 30, src: ['thwLegacy', 'thw'] },
  { brand: 'intel', name: 'Arc B580', arch: 'Battlemage / BMG-G21', year: 2024, launch: '2024-12', tier: 'mid', vram: '12 GB GDDR6', tflops: '13.7', bandwidth: '456 GB/s', tdp: '190W', msrp: 249, perf: 30.3, src: ['thw', 'https://www.intel.com/content/www/us/en/newsroom/news/intel-launches-arc-b-series-graphics-cards.html'] },
  { brand: 'nvidia', name: 'RTX 4080 SUPER', arch: 'Ada Lovelace / AD103', year: 2024, launch: '2024-01', tier: 'high', vram: '16 GB GDDR6X', tflops: '52.22', bandwidth: '736 GB/s', tdp: '320W', msrp: 999, perf: 70.9, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 4070 Ti SUPER', arch: 'Ada Lovelace / AD103', year: 2024, launch: '2024-01', tier: 'high', vram: '16 GB GDDR6X', tflops: '44.1', bandwidth: '672 GB/s', tdp: '285W', msrp: 799, perf: 62.1, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 4070 SUPER', arch: 'Ada Lovelace / AD104', year: 2024, launch: '2024-01', tier: 'high', vram: '12 GB GDDR6X', tflops: '35.48', bandwidth: '504 GB/s', tdp: '220W', msrp: 599, perf: 54.5, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 3050 (6GB)', arch: 'Ampere', year: 2024, launch: '2024-02', tier: 'entry', vram: '6 GB GDDR6', tflops: '6.2', bandwidth: '168.0 GB/s', tdp: '70W', msrp: 179, perf: null, src: ['https://www.guru3d.com/story/nvidia-geforce-rtx-3050-6gb-to-be-released-in-february-2024/'] },
  // 2025
  { brand: 'amd', name: 'Radeon RX 9070 XT', arch: 'RDNA 4 / Navi 48', year: 2025, launch: '2025-03', tier: 'high', vram: '16 GB GDDR6', tflops: '48.7', bandwidth: '640 GB/s', tdp: '304W', msrp: 599, perf: 69.7, src: ['thwLegacy', 'thw'] },
  { brand: 'amd', name: 'Radeon RX 9070', arch: 'RDNA 4 / Navi 48', year: 2025, launch: '2025-03', tier: 'high', vram: '16 GB GDDR6', tflops: '36.1', bandwidth: '640 GB/s', tdp: '220W', msrp: 549, perf: 62.1, src: ['thwLegacy', 'thw'] },
  { brand: 'amd', name: 'Radeon RX 9070 GRE', arch: 'RDNA 4 / Navi 48', year: 2025, launch: null, tier: 'high', vram: '12 GB GDDR6', tflops: '34.3', bandwidth: '432 GB/s', tdp: '220W', msrp: 549, perf: 51.8, src: ['thw', 'https://www.amd.com/en/products/graphics/desktops/radeon/9000-series/amd-radeon-rx-9070-gre.html'] },
  { brand: 'amd', name: 'Radeon RX 9060 XT', arch: 'RDNA 4', year: 2025, launch: '2025-06', tier: 'mid', vram: '16 GB GDDR6', tflops: '25.6', bandwidth: '320 GB/s', tdp: '160W', msrp: 349, perf: 40.2, src: ['thw', 'https://www.tomshardware.com/pc-components/gpus/amd-radeon-rx-9060-xt-launches-on-june-5-starting-at-usd299'] },
  { brand: 'amd', name: 'Radeon RX 9060 XT (8GB)', arch: 'RDNA 4 / Navi 44', year: 2025, launch: '2025-06', tier: 'mid', vram: '8 GB GDDR6', tflops: '25.6', bandwidth: '320 GB/s', tdp: null, msrp: 299, perf: 37.3, src: ['thw', 'https://www.amd.com/en/products/graphics/desktops/radeon/9000-series/amd-radeon-rx-9060xt.html', 'https://www.tomshardware.com/pc-components/gpus/amd-radeon-rx-9060-xt-launches-on-june-5-starting-at-usd299'] },
  { brand: 'intel', name: 'Arc B570', arch: 'Battlemage', year: 2025, launch: '2025-01', tier: 'entry', vram: '10 GB GDDR6', tflops: '11.5', bandwidth: '380 GB/s', tdp: '150W', msrp: 219, perf: 26.5, src: ['thw', 'https://www.intel.com/content/www/us/en/newsroom/news/intel-launches-arc-b-series-graphics-cards.html'] },
  { brand: 'nvidia', name: 'RTX 5090', arch: 'Blackwell / GB202', year: 2025, launch: '2025-01', tier: 'ultra', vram: '32 GB GDDR7', tflops: '104.8', bandwidth: '1792 GB/s', tdp: '575W', msrp: 1999, perf: 100, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 5080', arch: 'Blackwell / GB203', year: 2025, launch: '2025-01', tier: 'high', vram: '16 GB GDDR7', tflops: '56.3', bandwidth: '960 GB/s', tdp: '360W', msrp: 999, perf: 76.7, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 5070 Ti', arch: 'Blackwell / GB203', year: 2025, launch: '2025-02', tier: 'high', vram: '16 GB GDDR7', tflops: '43.9', bandwidth: '896 GB/s', tdp: '300W', msrp: 749, perf: 69.8, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 5070', arch: 'Blackwell / GB205', year: 2025, launch: '2025-03', tier: 'high', vram: '12 GB GDDR7', tflops: '30.9', bandwidth: '672 GB/s', tdp: '250W', msrp: 549, perf: 57.6, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 5060 Ti (16GB)', arch: 'Blackwell / GB206', year: 2025, launch: '2025-04', tier: 'mid', vram: '16 GB GDDR7', tflops: '23.7', bandwidth: '448 GB/s', tdp: '180W', msrp: 429, perf: 43.9, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 5060 Ti', arch: 'Blackwell / GB206', year: 2025, launch: '2025-04', tier: 'mid', vram: '8 GB GDDR7', tflops: '23.7', bandwidth: '448 GB/s', tdp: '180W', msrp: 379, perf: 41, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 5060', arch: 'Blackwell / GB206', year: 2025, launch: '2025-05', tier: 'mid', vram: '8 GB GDDR7', tflops: '19.2', bandwidth: '448 GB/s', tdp: '145W', msrp: 299, perf: 35.8, src: ['thwLegacy', 'thw'] },
  { brand: 'nvidia', name: 'RTX 5050', arch: 'Blackwell / GB207', year: 2025, launch: '2025-07', tier: 'entry', vram: '8 GB GDDR6', tflops: '13.2', bandwidth: '320 GB/s', tdp: '130W', msrp: 249, perf: 27.1, src: ['thw', 'https://www.tomshardware.com/pc-components/gpus/nvidia-rtx-5050-puts-blackwell-within-reach-of-more-gamers-at-usd249-entry-level-50-series-launches-in-late-july'] }
];

// Portátiles: no se venden por separado, así que no tienen precio. El TGP (consumo) lo fija cada
// fabricante de portátiles; solo se indica cuando el fabricante de la GPU publica un máximo.
// TFLOPS FP32 = núcleos × reloj boost máximo × 2, con los datos de la ficha oficial.
const MOBILE_GPUS = [
  { brand: 'nvidia', name: 'RTX 5090 Laptop', arch: 'Blackwell', year: 2025, tier: 'ultra', vram: '24 GB GDDR7', tflops: '45.34', bandwidth: '896 GB/s', tdp: null, msrp: null, priceNote: 'laptop', perf: 85, src: ['nvidiaLaptop50'] },
  { brand: 'nvidia', name: 'RTX 5080 Laptop', arch: 'Blackwell', year: 2025, tier: 'high', vram: '16 GB GDDR7', tflops: '35.13', bandwidth: '896 GB/s', tdp: null, msrp: null, priceNote: 'laptop', perf: 72, src: ['nvidiaLaptop50'] },
  { brand: 'nvidia', name: 'RTX 5070 Ti Laptop', arch: 'Blackwell', year: 2025, tier: 'high', vram: '12 GB GDDR7', tflops: '26.14', bandwidth: '672 GB/s', tdp: null, msrp: null, priceNote: 'laptop', perf: null, src: ['nvidiaLaptop50'] },
  { brand: 'nvidia', name: 'RTX 5070 Laptop', arch: 'Blackwell', year: 2025, tier: 'mid', vram: '8 GB GDDR7', tflops: '21.63', bandwidth: '384 GB/s', tdp: null, msrp: null, priceNote: 'laptop', perf: 55, src: ['nvidiaLaptop50'] },
  { brand: 'nvidia', name: 'RTX 5060 Laptop', arch: 'Blackwell', year: 2025, tier: 'mid', vram: '8 GB GDDR7', tflops: '16.62', bandwidth: '384 GB/s', tdp: null, msrp: null, priceNote: 'laptop', perf: 42, src: ['nvidiaLaptop50'] },
  { brand: 'nvidia', name: 'RTX 5050 Laptop', arch: 'Blackwell', year: 2025, tier: 'entry', vram: '8 GB GDDR7', tflops: '13.63', bandwidth: '384 GB/s', tdp: null, msrp: null, priceNote: 'laptop', perf: null, src: ['nvidiaLaptop50'] },
  { brand: 'nvidia', name: 'RTX 4090 Laptop', arch: 'Ada Lovelace', year: 2023, tier: 'ultra', vram: '16 GB GDDR6', tflops: '39.69', bandwidth: null, tdp: null, msrp: null, priceNote: 'laptop', perf: 65, src: ['nvidiaLaptop40'] },
  { brand: 'nvidia', name: 'RTX 4080 Laptop', arch: 'Ada Lovelace', year: 2023, tier: 'high', vram: '12 GB GDDR6', tflops: '33.85', bandwidth: null, tdp: null, msrp: null, priceNote: 'laptop', perf: 55, src: ['nvidiaLaptop40'] },
  { brand: 'nvidia', name: 'RTX 4070 Laptop', arch: 'Ada Lovelace', year: 2023, tier: 'mid', vram: '8 GB GDDR6', tflops: '20.04', bandwidth: null, tdp: null, msrp: null, priceNote: 'laptop', perf: 40, src: ['nvidiaLaptop40'] },
  { brand: 'nvidia', name: 'RTX 4060 Laptop', arch: 'Ada Lovelace', year: 2023, tier: 'mid', vram: '8 GB GDDR6', tflops: '14.56', bandwidth: null, tdp: null, msrp: null, priceNote: 'laptop', perf: 32, src: ['nvidiaLaptop40'] },
  { brand: 'nvidia', name: 'RTX 4050 Laptop', arch: 'Ada Lovelace', year: 2023, tier: 'entry', vram: '6 GB GDDR6', tflops: '12.13', bandwidth: null, tdp: null, msrp: null, priceNote: 'laptop', perf: 22, src: ['nvidiaLaptop40'] },
  { brand: 'nvidia', name: 'RTX 3080 Ti Laptop', arch: 'Ampere', year: 2022, tier: 'high', vram: '16 GB GDDR6', tflops: '23.61', bandwidth: null, tdp: null, msrp: null, priceNote: 'laptop', perf: 45, src: ['nvidiaLaptop30'] },
  { brand: 'nvidia', name: 'RTX 3070 Ti Laptop', arch: 'Ampere', year: 2022, tier: 'mid', vram: '8 GB GDDR6', tflops: '17.49', bandwidth: null, tdp: null, msrp: null, priceNote: 'laptop', perf: 38, src: ['nvidiaLaptop30'] },
  { brand: 'nvidia', name: 'RTX 3060 Laptop', arch: 'Ampere', year: 2021, tier: 'mid', vram: '6 GB GDDR6', tflops: '13.08', bandwidth: null, tdp: null, msrp: null, priceNote: 'laptop', perf: 28, src: ['nvidiaLaptop30'] },
  { brand: 'nvidia', name: 'RTX 2080 Super Mobile', arch: 'Turing', year: 2020, tier: 'high', vram: '8 GB GDDR6', tflops: null, bandwidth: null, tdp: null, msrp: null, priceNote: 'laptop', perf: 35, src: [] },
  { brand: 'amd', name: 'RX 7900M', arch: 'RDNA 3 / Navi 31', year: 2023, tier: 'high', vram: '16 GB GDDR6', tflops: '38.5', bandwidth: '576 GB/s', tdp: '180W', msrp: null, priceNote: 'laptop', perf: 58, src: ['https://www.notebookcheck.net/AMD-Radeon-RX-7900M.771807.0.html'] },
  { brand: 'amd', name: 'RX 7800M', arch: 'RDNA 3 / Navi 32', year: 2024, launch: '2024-09', tier: 'high', vram: '12 GB GDDR6', tflops: '39', bandwidth: null, tdp: null, msrp: null, priceNote: 'laptop', perf: 48, src: ['https://www.amd.com/en/products/graphics/laptops/radeon/7000-series/amd-radeon-rx-7800m.html'] },
  { brand: 'amd', name: 'RX 7600M XT', arch: 'RDNA 3 / Navi 33', year: 2023, tier: 'mid', vram: '8 GB GDDR6', tflops: null, bandwidth: null, tdp: null, msrp: null, priceNote: 'laptop', perf: 30, src: [] },
  { brand: 'amd', name: 'RX 6800M', arch: 'RDNA 2 / Navi 22', year: 2021, tier: 'high', vram: '12 GB GDDR6', tflops: null, bandwidth: null, tdp: null, msrp: null, priceNote: 'laptop', perf: 42, src: [] },
  { brand: 'intel', name: 'Arc A770M', arch: 'Alchemist', year: 2022, tier: 'high', vram: '16 GB GDDR6', tflops: null, bandwidth: null, tdp: null, msrp: null, priceNote: 'laptop', perf: 35, src: [] },
  { brand: 'intel', name: 'Arc A730M', arch: 'Alchemist', year: 2022, tier: 'mid', vram: '12 GB GDDR6', tflops: null, bandwidth: null, tdp: null, msrp: null, priceNote: 'laptop', perf: 25, src: [] },
  { brand: 'intel', name: 'Arc A570M', arch: 'Alchemist', year: 2023, tier: 'mid', vram: '8 GB GDDR6', tflops: null, bandwidth: null, tdp: null, msrp: null, priceNote: 'laptop', perf: 18, src: [] },
  { brand: 'apple', name: 'M3 Max GPU (40-core)', arch: 'Apple M3 Max', year: 2023, tier: 'ultra', vram: '128 GB UMA', tflops: null, bandwidth: '400 GB/s', tdp: null, msrp: null, priceNote: 'laptop', perf: 50, src: [] },
  { brand: 'apple', name: 'M3 Pro GPU (18-core)', arch: 'Apple M3 Pro', year: 2023, tier: 'mid', vram: '36 GB UMA', tflops: null, bandwidth: '150 GB/s', tdp: null, msrp: null, priceNote: 'laptop', perf: 25, src: [] }
];

// Estaciones de trabajo: especificaciones de la ficha oficial; precio de lanzamiento anunciado.
const WORKSTATION_GPUS = [
  { brand: 'nvidia', name: 'RTX PRO 6000 Blackwell', arch: 'Blackwell', year: 2025, tier: 'ultra', vram: '96 GB GDDR7', tflops: '125', bandwidth: '1792 GB/s', tdp: '600W', msrp: 8565,
    src: ['https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-6000/', 'https://www.tomshardware.com/pc-components/gpus/nvidia-raises-rtx-pro-6000-blackwell-gpu-pricing-to-usd13-250-55-percent-increase-over-msrp-in-a-years-time'] },
  { brand: 'nvidia', name: 'RTX 6000 Ada', arch: 'Ada Lovelace / AD102', tier: 'ultra', vram: '48 GB GDDR6', tflops: '91.1', bandwidth: '960 GB/s', tdp: '300W', msrp: 6800,
    src: ['https://www.nvidia.com/en-us/products/workstations/rtx-6000/', 'https://www.tomshardware.com/news/nvidia-rtx-6000-ada-now-available'] },
  { brand: 'nvidia', name: 'RTX 5000 Ada', arch: 'Ada Lovelace', year: 2023, tier: 'high', vram: '32 GB GDDR6', tflops: '65.3', bandwidth: '576 GB/s', tdp: '250W', msrp: 4000,
    src: ['https://www.nvidia.com/en-us/products/workstations/rtx-5000/', 'https://www.cgchannel.com/2023/08/nvidia-unveils-rtx-4000-4500-and-5000-workstation-gpus'] },
  { brand: 'nvidia', name: 'RTX 4500 Ada', arch: 'Ada Lovelace', year: 2023, tier: 'high', vram: '24 GB GDDR6', tflops: '39.6', bandwidth: '432 GB/s', tdp: '210W', msrp: 2250,
    src: ['https://www.nvidia.com/en-us/products/workstations/rtx-4500/', 'https://www.cgchannel.com/2023/08/nvidia-unveils-rtx-4000-4500-and-5000-workstation-gpus'] },
  { brand: 'nvidia', name: 'RTX 4000 Ada', arch: 'Ada Lovelace', year: 2023, tier: 'mid', vram: '20 GB GDDR6', tflops: '26.7', bandwidth: '360 GB/s', tdp: '130W', msrp: 1250,
    src: ['https://www.nvidia.com/content/dam/en-zz/Solutions/products/workstations/nvidia-rtx-4000-datasheet.pdf', 'https://www.cgchannel.com/2023/08/nvidia-unveils-rtx-4000-4500-and-5000-workstation-gpus'] },
  { brand: 'amd', name: 'Radeon AI PRO R9700', arch: 'RDNA 4 / Navi 48', year: 2025, tier: 'high', vram: '32 GB GDDR6', tflops: '47.8', bandwidth: '640 GB/s', tdp: '300W', msrp: 1299,
    src: ['https://www.amd.com/en/products/graphics/workstations/radeon-ai-pro/ai-9000-series/amd-radeon-ai-pro-r9700.html', 'https://www.pcgameshardware.de/Grafikkarten-Grafikkarte-97980/News/AMD-Radeon-AI-Pro-R9700-startet-im-Einzelhandel-1484972/'] },
  { brand: 'amd', name: 'Radeon PRO W7900', arch: 'RDNA 3 / Navi 31', year: 2023, tier: 'ultra', vram: '48 GB GDDR6', tflops: '61.3', bandwidth: '864 GB/s', tdp: '295W', msrp: 3999,
    src: ['https://www.amd.com/en/products/graphics/workstations/radeon-pro/w7900.html', 'https://www.cgchannel.com/2023/04/amd-unveils-radeon-pro-w7900-and-w7800-gpus'] },
  { brand: 'amd', name: 'Radeon PRO W7800', arch: 'RDNA 3', year: 2023, tier: 'high', vram: '32 GB GDDR6', tflops: '45.2', bandwidth: '576 GB/s', tdp: '260W', msrp: 2499,
    src: ['https://www.amd.com/en/products/graphics/workstations/radeon-pro/w7800.html', 'https://www.cgchannel.com/2023/04/amd-unveils-radeon-pro-w7900-and-w7800-gpus'] },
  { brand: 'amd', name: 'Radeon PRO W7700', arch: 'RDNA 3 / Navi 32', year: 2023, launch: '2023-11', tier: 'mid', vram: '16 GB GDDR6', tflops: '28.3', bandwidth: '576 GB/s', tdp: '190W', msrp: 999,
    src: ['https://www.amd.com/en/products/graphics/workstations/radeon-pro/w7700.html', 'https://ir.amd.com/news-events/press-releases/detail/1165/new-amd-radeon-pro-workstation-graphics-card-to-power-next-generation-professional-content-creation-cad-and-ai-applications'] },
  { brand: 'apple', name: 'M5 Ultra GPU (80-core)', arch: 'Apple M5 Ultra', tier: 'ultra', vram: '512 GB UMA', tflops: null, bandwidth: '1200 GB/s', tdp: null, msrp: null, priceNote: 'no-official', src: ['appleMacStudio'] }
];

// Servidor / HPC. `tflops` = FP32 (vectorial) para poder compararlo con el resto;
// `ai` = BF16 denso (sin dispersión), la cifra habitual para IA.
// Las cifras "con dispersión" de los fabricantes se han dividido entre 2, como indican ellos mismos.
const SERVER_GPUS = [
  {
    brand: 'nvidia', name: 'Rubin (HGX)', arch: 'Rubin', year: 2026, vram: '288 GB HBM4', tflops: '130', ai: 4000, bandwidth: '22000 GB/s', tdp: null,
    interconnect: 'NVLink 6: 3,6 TB/s', workloads: ['training', 'inference', 'hpc'], msrp: null, priceNote: 'no-official', preliminary: true, src: ['nvidiaHgx'], cssClass: 'nvidia-card',
    desc: {
      es: 'La siguiente generación de NVIDIA para centros de datos, ya en producción. Estrena memoria HBM4 (288 GB por GPU a 22 TB/s). Datos preliminares del fabricante.',
      en: "NVIDIA's next data center generation, now in production. It debuts HBM4 memory (288 GB per GPU at 22 TB/s). Preliminary manufacturer figures.",
      fr: 'La génération suivante de NVIDIA pour les centres de données, déjà en production. Elle inaugure la mémoire HBM4 (288 Go par GPU à 22 To/s). Données préliminaires du fabricant.',
      de: 'NVIDIAs nächste Rechenzentrumsgeneration, bereits in Produktion. Sie führt HBM4-Speicher ein (288 GB pro GPU mit 22 TB/s). Vorläufige Herstellerangaben.',
      it: 'La prossima generazione NVIDIA per i data center, già in produzione. Debutta la memoria HBM4 (288 GB per GPU a 22 TB/s). Dati preliminari del produttore.',
      ru: 'Следующее поколение NVIDIA для дата-центров, уже в производстве. Впервые использует память HBM4 (288 ГБ на GPU при 22 ТБ/с). Предварительные данные производителя.'
    }
  },
  {
    brand: 'nvidia', name: 'B200 (HGX)', arch: 'Blackwell', year: 2024, vram: '180 GB HBM3e', tflops: '75', ai: 2250, bandwidth: '8000 GB/s', tdp: null,
    interconnect: 'NVLink 5: 1,8 TB/s', workloads: ['training', 'inference'], msrp: null, priceNote: 'no-official', src: ['nvidiaHgx', 'nvidiaDgxB200'], cssClass: 'nvidia-card',
    desc: {
      es: 'GPU Blackwell de doble chip anunciada en marzo de 2024. Cifras por GPU calculadas a partir del sistema HGX/DGX B200 de 8 GPUs publicado por NVIDIA.',
      en: 'Dual-die Blackwell GPU announced in March 2024. Per-GPU figures derived from the 8-GPU HGX/DGX B200 system published by NVIDIA.',
      fr: 'GPU Blackwell à double puce annoncé en mars 2024. Chiffres par GPU calculés à partir du système HGX/DGX B200 à 8 GPU publié par NVIDIA.',
      de: 'Blackwell-GPU mit zwei Chips, angekündigt im März 2024. Werte pro GPU abgeleitet aus dem von NVIDIA veröffentlichten HGX/DGX-B200-System mit 8 GPUs.',
      it: 'GPU Blackwell a doppio chip annunciata a marzo 2024. Valori per GPU ricavati dal sistema HGX/DGX B200 a 8 GPU pubblicato da NVIDIA.',
      ru: 'Двухкристальный GPU Blackwell, анонсированный в марте 2024 года. Значения на один GPU рассчитаны по системе HGX/DGX B200 из 8 GPU, опубликованной NVIDIA.'
    }
  },
  {
    brand: 'nvidia', name: 'H200 SXM', arch: 'Hopper / GH100', year: 2023, vram: '141 GB HBM3e', tflops: '67', ai: 989.5, bandwidth: '4800 GB/s', tdp: '700W',
    interconnect: 'NVLink: 900 GB/s', workloads: ['training', 'inference', 'hpc'], msrp: null, priceNote: 'no-official', src: ['nvidiaH200'], cssClass: 'nvidia-card',
    desc: {
      es: 'La primera GPU con memoria HBM3e: 141 GB a 4,8 TB/s, casi el doble de capacidad que la H100 y 1,4 veces su ancho de banda. Anunciada en noviembre de 2023.',
      en: 'The first GPU with HBM3e memory: 141 GB at 4.8 TB/s, nearly double the capacity of the H100 and 1.4× its bandwidth. Announced in November 2023.',
      fr: 'Le premier GPU doté de mémoire HBM3e : 141 Go à 4,8 To/s, près du double de la capacité du H100 et 1,4 fois sa bande passante. Annoncé en novembre 2023.',
      de: 'Die erste GPU mit HBM3e-Speicher: 141 GB mit 4,8 TB/s, fast die doppelte Kapazität der H100 und die 1,4-fache Bandbreite. Angekündigt im November 2023.',
      it: 'La prima GPU con memoria HBM3e: 141 GB a 4,8 TB/s, quasi il doppio della capacità della H100 e 1,4 volte la sua larghezza di banda. Annunciata a novembre 2023.',
      ru: 'Первый GPU с памятью HBM3e: 141 ГБ при 4,8 ТБ/с — почти вдвое больше объёма H100 и в 1,4 раза выше пропускная способность. Анонсирован в ноябре 2023 года.'
    }
  },
  {
    brand: 'nvidia', name: 'H100 SXM5', arch: 'Hopper / GH100', year: 2022, vram: '80 GB HBM3', tflops: '67', ai: 989.5, bandwidth: '3350 GB/s', tdp: '700W',
    interconnect: 'NVLink: 900 GB/s', workloads: ['training', 'inference', 'hpc'], msrp: null, priceNote: 'no-official', src: ['nvidiaH100'], cssClass: 'nvidia-card',
    desc: {
      es: 'La GPU Hopper, anunciada en marzo de 2022, que impulsó la ola de la IA generativa. Estrenó el Transformer Engine con precisión FP8.',
      en: 'The Hopper GPU, announced in March 2022, that powered the generative AI wave. It introduced the Transformer Engine with FP8 precision.',
      fr: 'Le GPU Hopper, annoncé en mars 2022, qui a porté la vague de l’IA générative. Il a inauguré le Transformer Engine en précision FP8.',
      de: 'Die im März 2022 angekündigte Hopper-GPU, die die Welle der generativen KI antrieb. Sie führte die Transformer Engine mit FP8-Genauigkeit ein.',
      it: 'La GPU Hopper, annunciata a marzo 2022, che ha alimentato l’ondata dell’IA generativa. Ha introdotto il Transformer Engine con precisione FP8.',
      ru: 'GPU Hopper, анонсированный в марте 2022 года и ставший двигателем волны генеративного ИИ. В нём дебютировал Transformer Engine с точностью FP8.'
    }
  },
  {
    brand: 'nvidia', name: 'A100 SXM4', arch: 'Ampere / GA100', year: 2020, vram: '80 GB HBM2e', tflops: '19.5', ai: 312, bandwidth: '2039 GB/s', tdp: '400W',
    interconnect: 'NVLink: 600 GB/s', workloads: ['training', 'inference', 'hpc'], msrp: null, priceNote: 'no-official', src: ['nvidiaA100'], cssClass: 'nvidia-card',
    desc: {
      es: 'La primera GPU Ampere, presentada en mayo de 2020. Puede dividirse en hasta 7 instancias (MIG) y su versión de 80 GB supera los 2 TB/s de ancho de banda.',
      en: 'The first Ampere GPU, unveiled in May 2020. It can be split into up to 7 instances (MIG), and its 80 GB version exceeds 2 TB/s of bandwidth.',
      fr: 'Le premier GPU Ampere, présenté en mai 2020. Il peut être divisé en 7 instances (MIG) et sa version 80 Go dépasse 2 To/s de bande passante.',
      de: 'Die erste Ampere-GPU, vorgestellt im Mai 2020. Sie lässt sich in bis zu 7 Instanzen (MIG) aufteilen, und die 80-GB-Version übertrifft 2 TB/s Bandbreite.',
      it: 'La prima GPU Ampere, presentata a maggio 2020. Può essere divisa in fino a 7 istanze (MIG) e la versione da 80 GB supera i 2 TB/s di larghezza di banda.',
      ru: 'Первый GPU Ampere, представленный в мае 2020 года. Его можно разделить на 7 экземпляров (MIG), а версия на 80 ГБ превышает 2 ТБ/с пропускной способности.'
    }
  },
  {
    brand: 'amd', name: 'Instinct MI355X', arch: 'CDNA 4', year: 2025, launch: '2025-06', vram: '288 GB HBM3e', tflops: '157.3', ai: 2500, bandwidth: '8000 GB/s', tdp: '1400W',
    interconnect: 'Infinity Fabric: 7 × 153 GB/s', workloads: ['training', 'inference', 'hpc'], msrp: null, priceNote: 'no-official', src: ['amdMi355x'], cssClass: 'amd-card',
    desc: {
      es: 'Acelerador CDNA 4 fabricado a 3 nm, con 288 GB de HBM3E a 8 TB/s. Añade formatos de 4 y 6 bits (MXFP4/MXFP6) para inferencia.',
      en: 'CDNA 4 accelerator built on 3 nm, with 288 GB of HBM3E at 8 TB/s. It adds 4- and 6-bit formats (MXFP4/MXFP6) for inference.',
      fr: 'Accélérateur CDNA 4 gravé en 3 nm, avec 288 Go de HBM3E à 8 To/s. Il ajoute des formats 4 et 6 bits (MXFP4/MXFP6) pour l’inférence.',
      de: 'CDNA-4-Beschleuniger in 3 nm mit 288 GB HBM3E bei 8 TB/s. Er ergänzt 4- und 6-Bit-Formate (MXFP4/MXFP6) für Inferenz.',
      it: 'Acceleratore CDNA 4 a 3 nm, con 288 GB di HBM3E a 8 TB/s. Aggiunge formati a 4 e 6 bit (MXFP4/MXFP6) per l’inferenza.',
      ru: 'Ускоритель CDNA 4 по 3-нм техпроцессу с 288 ГБ HBM3E при 8 ТБ/с. Добавляет 4- и 6-битные форматы (MXFP4/MXFP6) для инференса.'
    }
  },
  {
    brand: 'amd', name: 'Instinct MI325X', arch: 'CDNA 3', year: 2024, launch: '2024-10', vram: '256 GB HBM3e', tflops: '163.4', ai: 1307.4, bandwidth: '6000 GB/s', tdp: '1000W',
    interconnect: 'Infinity Fabric: 8 × 128 GB/s', workloads: ['training', 'inference', 'hpc'], msrp: null, priceNote: 'no-official', src: ['amdMi325x'], cssClass: 'amd-card',
    desc: {
      es: 'Evolución del MI300X con la misma potencia de cálculo y más memoria: 256 GB de HBM3E a 6 TB/s.',
      en: 'An evolution of the MI300X with the same compute and more memory: 256 GB of HBM3E at 6 TB/s.',
      fr: 'Évolution du MI300X avec la même puissance de calcul et plus de mémoire : 256 Go de HBM3E à 6 To/s.',
      de: 'Weiterentwicklung der MI300X mit gleicher Rechenleistung und mehr Speicher: 256 GB HBM3E bei 6 TB/s.',
      it: 'Evoluzione della MI300X con la stessa potenza di calcolo e più memoria: 256 GB di HBM3E a 6 TB/s.',
      ru: 'Развитие MI300X с той же вычислительной мощностью и большим объёмом памяти: 256 ГБ HBM3E при 6 ТБ/с.'
    }
  },
  {
    brand: 'amd', name: 'Instinct MI300X', arch: 'CDNA 3', year: 2023, launch: '2023-12', vram: '192 GB HBM3', tflops: '163.4', ai: 1307.4, bandwidth: '5300 GB/s', tdp: '750W',
    interconnect: 'Infinity Fabric: 8 × 128 GB/s', workloads: ['training', 'inference', 'hpc'], msrp: null, priceNote: 'no-official', src: ['amdMi300x'], cssClass: 'amd-card',
    desc: {
      es: 'Con 192 GB de HBM3 permite cargar modelos muy grandes en una sola GPU. Lanzada en diciembre de 2023 con arquitectura de chiplets CDNA 3.',
      en: 'With 192 GB of HBM3 it can hold very large models on a single GPU. Launched in December 2023 with the chiplet-based CDNA 3 architecture.',
      fr: 'Avec 192 Go de HBM3, elle peut charger de très grands modèles sur un seul GPU. Lancée en décembre 2023 avec l’architecture à chiplets CDNA 3.',
      de: 'Mit 192 GB HBM3 passen sehr große Modelle auf eine einzige GPU. Erschienen im Dezember 2023 mit der Chiplet-Architektur CDNA 3.',
      it: 'Con 192 GB di HBM3 può caricare modelli molto grandi su una sola GPU. Lanciata a dicembre 2023 con l’architettura a chiplet CDNA 3.',
      ru: '192 ГБ HBM3 позволяют разместить очень большие модели на одном GPU. Выпущен в декабре 2023 года на чиплетной архитектуре CDNA 3.'
    }
  },
  {
    brand: 'intel', name: 'Gaudi 3', arch: 'Gaudi 3', year: 2024, vram: '128 GB HBM2e', tflops: '14.3', ai: 1678, bandwidth: '3700 GB/s', tdp: '900W',
    interconnect: 'Ethernet: 24 × 200 GbE (RoCE)', workloads: ['training', 'inference'], msrp: null, priceNote: 'no-official', src: ['intelGaudi3'], cssClass: 'intel-card',
    desc: {
      es: 'Acelerador de IA presentado en abril de 2024 que se conecta con Ethernet estándar (24 puertos de 200 GbE). Su cálculo se concentra en los motores de matrices: 1678 TFLOPS en BF16 y FP8.',
      en: 'AI accelerator unveiled in April 2024 that scales over standard Ethernet (24 × 200 GbE ports). Its compute lives in the matrix engines: 1,678 TFLOPS in BF16 and FP8.',
      fr: 'Accélérateur d’IA présenté en avril 2024 qui s’interconnecte en Ethernet standard (24 ports 200 GbE). Sa puissance réside dans les moteurs matriciels : 1 678 TFLOPS en BF16 et FP8.',
      de: 'Im April 2024 vorgestellter KI-Beschleuniger, der über Standard-Ethernet skaliert (24 × 200-GbE-Ports). Die Rechenleistung steckt in den Matrix-Engines: 1.678 TFLOPS in BF16 und FP8.',
      it: 'Acceleratore di IA presentato ad aprile 2024 che si collega tramite Ethernet standard (24 porte da 200 GbE). La potenza è nei motori di matrici: 1.678 TFLOPS in BF16 e FP8.',
      ru: 'Ускоритель ИИ, представленный в апреле 2024 года, масштабируется через стандартный Ethernet (24 порта 200 GbE). Основная мощность — в матричных движках: 1678 TFLOPS в BF16 и FP8.'
    }
  }
];

// ===== LÍNEA TEMPORAL =====
const TIMELINE_DATA = [
  { year: '1981', title: 'IBM CGA', desc: {
    es: 'La primera tarjeta gráfica en color del IBM PC.',
    en: 'The first color graphics card for the IBM PC.',
    fr: 'La première carte graphique couleur de l’IBM PC.',
    de: 'Die erste Farbgrafikkarte für den IBM PC.',
    it: 'La prima scheda grafica a colori per il PC IBM.',
    ru: 'Первая цветная видеокарта для IBM PC.' } },
  { year: '1991', title: 'S3 86C911', desc: {
    es: 'El primer acelerador gráfico en un solo chip: libera a la CPU de dibujar las ventanas de Windows.',
    en: 'The first single-chip graphics accelerator: it takes window drawing in Windows off the CPU.',
    fr: 'Le premier accélérateur graphique sur une seule puce : il décharge le processeur du dessin des fenêtres de Windows.',
    de: 'Der erste Grafikbeschleuniger auf einem einzigen Chip: Er nimmt der CPU das Zeichnen der Windows-Fenster ab.',
    it: 'Il primo acceleratore grafico su un solo chip: libera la CPU dal disegno delle finestre di Windows.',
    ru: 'Первый однокристальный графический ускоритель: он снимает с процессора отрисовку окон Windows.' } },
  { year: '1996', title: '3dfx Voodoo Graphics', desc: {
    es: 'El primer acelerador 3D de éxito masivo; abre la era del 3D en el PC.',
    en: 'The first hugely successful 3D accelerator; it opens the 3D era on the PC.',
    fr: 'Le premier accélérateur 3D à grand succès ; il ouvre l’ère de la 3D sur PC.',
    de: 'Der erste sehr erfolgreiche 3D-Beschleuniger; er eröffnet die 3D-Ära auf dem PC.',
    it: 'Il primo acceleratore 3D di enorme successo; apre l’era del 3D su PC.',
    ru: 'Первый по-настоящему массовый 3D-ускоритель, открывший эпоху 3D на ПК.' } },
  { year: '1999', title: 'NVIDIA GeForce 256', desc: {
    es: 'NVIDIA la presenta como la primera «GPU»: transformación e iluminación por hardware.',
    en: 'NVIDIA introduces it as the first “GPU”: hardware transform and lighting.',
    fr: 'NVIDIA la présente comme le premier « GPU » : transformation et éclairage matériels.',
    de: 'NVIDIA stellt sie als erste „GPU“ vor: Transformation und Beleuchtung in Hardware.',
    it: 'NVIDIA la presenta come la prima «GPU»: trasformazione e illuminazione in hardware.',
    ru: 'NVIDIA представляет её как первый «GPU»: аппаратные трансформация и освещение.' } },
  { year: '2001', title: 'NVIDIA GeForce 3', desc: {
    es: 'Los primeros shaders programables en una tarjeta de consumo.',
    en: 'The first programmable shaders on a consumer card.',
    fr: 'Les premiers shaders programmables sur une carte grand public.',
    de: 'Die ersten programmierbaren Shader auf einer Consumer-Karte.',
    it: 'I primi shader programmabili su una scheda consumer.',
    ru: 'Первые программируемые шейдеры на потребительской видеокарте.' } },
  { year: '2004', title: 'NVIDIA SLI', desc: {
    es: 'Vuelve el multi-GPU al PC doméstico con la serie GeForce 6.',
    en: 'Multi-GPU returns to home PCs with the GeForce 6 series.',
    fr: 'Le multi-GPU revient sur les PC domestiques avec la série GeForce 6.',
    de: 'Multi-GPU kehrt mit der GeForce-6-Serie in Heim-PCs zurück.',
    it: 'Il multi-GPU torna sui PC domestici con la serie GeForce 6.',
    ru: 'С серией GeForce 6 в домашние ПК возвращаются конфигурации из нескольких GPU.' } },
  { year: '2006', title: 'NVIDIA GeForce 8800 GTX (G80)', desc: {
    es: 'Arquitectura de shaders unificados; nace CUDA para programar la GPU como un procesador de propósito general.',
    en: 'Unified shader architecture; CUDA is born to program the GPU as a general-purpose processor.',
    fr: 'Architecture à shaders unifiés ; naissance de CUDA pour programmer le GPU comme un processeur généraliste.',
    de: 'Architektur mit vereinheitlichten Shadern; CUDA entsteht, um die GPU als Universalprozessor zu programmieren.',
    it: 'Architettura a shader unificati; nasce CUDA per programmare la GPU come un processore generico.',
    ru: 'Архитектура с унифицированными шейдерами; появляется CUDA для программирования GPU как универсального процессора.' } },
  { year: '2007', title: 'NVIDIA Tesla C870', desc: {
    es: 'La primera tarjeta de NVIDIA pensada solo para cálculo (GPGPU), sin salidas de vídeo.',
    en: 'NVIDIA’s first card built only for computing (GPGPU), with no video outputs.',
    fr: 'La première carte de NVIDIA conçue uniquement pour le calcul (GPGPU), sans sortie vidéo.',
    de: 'NVIDIAs erste Karte nur für Berechnungen (GPGPU), ohne Videoausgänge.',
    it: 'La prima scheda NVIDIA pensata solo per il calcolo (GPGPU), senza uscite video.',
    ru: 'Первая карта NVIDIA только для вычислений (GPGPU), без видеовыходов.' } },
  { year: '2010', title: 'NVIDIA Fermi', desc: {
    es: 'Una GPU diseñada también para HPC: memoria con ECC y mejor doble precisión.',
    en: 'A GPU also designed for HPC: ECC memory and stronger double precision.',
    fr: 'Un GPU également conçu pour le HPC : mémoire ECC et meilleure double précision.',
    de: 'Eine GPU, die auch für HPC gedacht ist: ECC-Speicher und stärkere doppelte Genauigkeit.',
    it: 'Una GPU progettata anche per l’HPC: memoria ECC e doppia precisione migliorata.',
    ru: 'GPU, созданный и для HPC: память с ECC и более быстрая двойная точность.' } },
  { year: '2012', title: 'AMD GCN / NVIDIA Kepler', desc: {
    es: 'AMD estrena GCN con la Radeon HD 7970 y NVIDIA responde con Kepler (GTX 680), centrada en la eficiencia.',
    en: 'AMD debuts GCN with the Radeon HD 7970 and NVIDIA answers with Kepler (GTX 680), focused on efficiency.',
    fr: 'AMD inaugure GCN avec la Radeon HD 7970 et NVIDIA répond avec Kepler (GTX 680), axée sur l’efficacité.',
    de: 'AMD startet GCN mit der Radeon HD 7970, NVIDIA antwortet mit Kepler (GTX 680) mit Fokus auf Effizienz.',
    it: 'AMD debutta con GCN sulla Radeon HD 7970 e NVIDIA risponde con Kepler (GTX 680), incentrata sull’efficienza.',
    ru: 'AMD представляет GCN в Radeon HD 7970, а NVIDIA отвечает архитектурой Kepler (GTX 680) с упором на эффективность.' } },
  { year: '2014', title: 'NVIDIA Maxwell', desc: {
    es: 'Gran salto en rendimiento por vatio con las GTX 970 y 980.',
    en: 'A big leap in performance per watt with the GTX 970 and 980.',
    fr: 'Un grand bond en performances par watt avec les GTX 970 et 980.',
    de: 'Ein großer Sprung bei der Leistung pro Watt mit GTX 970 und 980.',
    it: 'Un grande salto nelle prestazioni per watt con GTX 970 e 980.',
    ru: 'Большой скачок производительности на ватт с GTX 970 и 980.' } },
  { year: '2016', title: 'NVIDIA Pascal (Tesla P100)', desc: {
    es: 'La primera GPU con memoria HBM2 y enlaces NVLink.',
    en: 'The first GPU with HBM2 memory and NVLink links.',
    fr: 'Le premier GPU doté de mémoire HBM2 et de liens NVLink.',
    de: 'Die erste GPU mit HBM2-Speicher und NVLink-Verbindungen.',
    it: 'La prima GPU con memoria HBM2 e collegamenti NVLink.',
    ru: 'Первый GPU с памятью HBM2 и интерфейсом NVLink.' } },
  { year: '2018', title: 'NVIDIA Turing / RTX 20', desc: {
    es: 'Ray tracing en tiempo real con RT Cores y reescalado DLSS con Tensor Cores.',
    en: 'Real-time ray tracing with RT Cores and DLSS upscaling with Tensor Cores.',
    fr: 'Ray tracing en temps réel avec les RT Cores et mise à l’échelle DLSS avec les Tensor Cores.',
    de: 'Echtzeit-Raytracing mit RT Cores und DLSS-Hochskalierung mit Tensor Cores.',
    it: 'Ray tracing in tempo reale con gli RT Core e upscaling DLSS con i Tensor Core.',
    ru: 'Трассировка лучей в реальном времени на RT-ядрах и масштабирование DLSS на тензорных ядрах.' } },
  { year: '2020', title: 'NVIDIA Ampere / A100', desc: {
    es: 'La A100 se convierte en la referencia para entrenar IA y las RTX 30 duplican el cálculo FP32 por núcleo.',
    en: 'The A100 becomes the reference for AI training and the RTX 30 series doubles FP32 throughput per core.',
    fr: 'L’A100 devient la référence pour l’entraînement de l’IA et les RTX 30 doublent le calcul FP32 par cœur.',
    de: 'Die A100 wird zur Referenz fürs KI-Training, die RTX 30 verdoppeln den FP32-Durchsatz pro Kern.',
    it: 'La A100 diventa il riferimento per l’addestramento dell’IA e le RTX 30 raddoppiano il calcolo FP32 per core.',
    ru: 'A100 становится эталоном для обучения ИИ, а RTX 30 удваивают производительность FP32 на ядро.' } },
  { year: '2022', title: 'NVIDIA Ada / AMD RDNA 3', desc: {
    es: 'RTX 4090 frente a Radeon RX 7900 XTX; AMD estrena los chiplets en una GPU de consumo.',
    en: 'RTX 4090 versus Radeon RX 7900 XTX; AMD brings chiplets to a consumer GPU.',
    fr: 'RTX 4090 contre Radeon RX 7900 XTX ; AMD introduit les chiplets dans un GPU grand public.',
    de: 'RTX 4090 gegen Radeon RX 7900 XTX; AMD bringt Chiplets in eine Consumer-GPU.',
    it: 'RTX 4090 contro Radeon RX 7900 XTX; AMD porta i chiplet in una GPU consumer.',
    ru: 'RTX 4090 против Radeon RX 7900 XTX; AMD впервые применяет чиплеты в потребительском GPU.' } },
  { year: '2023', title: 'NVIDIA H100 / AMD Instinct MI300X', desc: {
    es: 'La IA generativa dispara la demanda de la H100 y AMD responde con la MI300X y sus 192 GB de HBM3.',
    en: 'Generative AI sends H100 demand soaring and AMD answers with the MI300X and its 192 GB of HBM3.',
    fr: 'L’IA générative fait exploser la demande de H100 et AMD répond avec le MI300X et ses 192 Go de HBM3.',
    de: 'Generative KI lässt die Nachfrage nach der H100 explodieren; AMD antwortet mit der MI300X und 192 GB HBM3.',
    it: 'L’IA generativa fa esplodere la domanda di H100 e AMD risponde con la MI300X e i suoi 192 GB di HBM3.',
    ru: 'Генеративный ИИ взвинчивает спрос на H100, а AMD отвечает MI300X со 192 ГБ HBM3.' } },
  { year: '2024', title: 'NVIDIA Blackwell / Intel Gaudi 3', desc: {
    es: 'NVIDIA anuncia Blackwell en marzo e Intel presenta Gaudi 3 en abril, con red Ethernet estándar.',
    en: 'NVIDIA announces Blackwell in March and Intel unveils Gaudi 3 in April, networked over standard Ethernet.',
    fr: 'NVIDIA annonce Blackwell en mars et Intel présente Gaudi 3 en avril, relié en Ethernet standard.',
    de: 'NVIDIA kündigt im März Blackwell an, Intel stellt im April Gaudi 3 mit Standard-Ethernet vor.',
    it: 'NVIDIA annuncia Blackwell a marzo e Intel presenta Gaudi 3 ad aprile, collegato via Ethernet standard.',
    ru: 'NVIDIA анонсирует Blackwell в марте, а Intel в апреле представляет Gaudi 3 со стандартной сетью Ethernet.' } },
  { year: '2025', title: 'RTX 5090 / Radeon RX 9070 XT', desc: {
    es: 'Llega Blackwell al gaming con la RTX 5090 (32 GB GDDR7) y AMD lanza RDNA 4 con la RX 9070 XT.',
    en: 'Blackwell reaches gaming with the RTX 5090 (32 GB GDDR7) and AMD launches RDNA 4 with the RX 9070 XT.',
    fr: 'Blackwell arrive dans le jeu avec la RTX 5090 (32 Go GDDR7) et AMD lance RDNA 4 avec la RX 9070 XT.',
    de: 'Blackwell erreicht mit der RTX 5090 (32 GB GDDR7) das Gaming, AMD bringt RDNA 4 mit der RX 9070 XT.',
    it: 'Blackwell arriva nel gaming con la RTX 5090 (32 GB GDDR7) e AMD lancia RDNA 4 con la RX 9070 XT.',
    ru: 'Blackwell приходит в игры с RTX 5090 (32 ГБ GDDR7), а AMD выпускает RDNA 4 в виде RX 9070 XT.' } },
  { year: '2026', title: 'NVIDIA Vera Rubin', desc: {
    es: 'NVIDIA pone en producción Rubin, la primera de sus GPUs con memoria HBM4.',
    en: 'NVIDIA puts Rubin into production, its first GPU with HBM4 memory.',
    fr: 'NVIDIA lance la production de Rubin, son premier GPU doté de mémoire HBM4.',
    de: 'NVIDIA startet die Produktion von Rubin, der ersten eigenen GPU mit HBM4-Speicher.',
    it: 'NVIDIA avvia la produzione di Rubin, la sua prima GPU con memoria HBM4.',
    ru: 'NVIDIA запускает в производство Rubin — свой первый GPU с памятью HBM4.' } }
];

// ===== MAPA DE ARQUITECTURAS =====
const ARCHITECTURES_DATA = [
  { id: '3dfx-voodoo', brand: '3dfx', name: 'Voodoo Graphics', year: '1996', level: 1, parent: null,
    innovation: { es: 'Aceleración 3D dedicada', en: 'Dedicated 3D acceleration', fr: 'Accélération 3D dédiée', de: 'Dedizierte 3D-Beschleunigung', it: 'Accelerazione 3D dedicata', ru: 'Выделенное 3D-ускорение' },
    desc: { es: 'Inició la era del 3D en PC. Necesitaba una tarjeta 2D aparte, conectada con un cable VGA externo.', en: 'Started the 3D era on the PC. It needed a separate 2D card, linked with an external VGA cable.', fr: 'A lancé l’ère de la 3D sur PC. Il fallait une carte 2D séparée, reliée par un câble VGA externe.', de: 'Startete die 3D-Ära auf dem PC. Sie brauchte eine separate 2D-Karte, verbunden über ein externes VGA-Kabel.', it: 'Ha avviato l’era del 3D su PC. Richiedeva una scheda 2D separata, collegata con un cavo VGA esterno.', ru: 'Открыла эпоху 3D на ПК. Требовала отдельную 2D-карту, подключённую внешним кабелем VGA.' } },
  { id: 'nv-tnt', brand: 'nvidia', name: 'RIVA TNT', year: '1998', level: 1, parent: null,
    innovation: { es: 'TwiN Texel Engine', en: 'TwiN Texel Engine', fr: 'TwiN Texel Engine', de: 'TwiN Texel Engine', it: 'TwiN Texel Engine', ru: 'TwiN Texel Engine' },
    desc: { es: 'Aplicaba dos texturas por píxel en una sola pasada. Rival directo de 3dfx.', en: 'Applied two textures per pixel in a single pass. A direct rival to 3dfx.', fr: 'Appliquait deux textures par pixel en une seule passe. Rival direct de 3dfx.', de: 'Trug zwei Texturen pro Pixel in einem Durchgang auf. Direkter Rivale von 3dfx.', it: 'Applicava due texture per pixel in un solo passaggio. Rivale diretto di 3dfx.', ru: 'Накладывала две текстуры на пиксель за один проход. Прямой конкурент 3dfx.' } },
  { id: 'nv-gf256', brand: 'nvidia', name: 'GeForce 256', year: '1999', level: 2, parent: 'nv-tnt',
    innovation: { es: 'T&L por hardware', en: 'Hardware T&L', fr: 'T&L matériel', de: 'Hardware-T&L', it: 'T&L in hardware', ru: 'Аппаратный T&L' },
    desc: { es: 'Nace el término «GPU»: el motor de transformación e iluminación pasa al chip gráfico.', en: 'The term “GPU” is born: the transform and lighting engine moves onto the graphics chip.', fr: 'Naissance du terme « GPU » : le moteur de transformation et d’éclairage passe dans la puce graphique.', de: 'Der Begriff „GPU“ entsteht: Die Transformations- und Beleuchtungseinheit wandert in den Grafikchip.', it: 'Nasce il termine «GPU»: il motore di trasformazione e illuminazione passa nel chip grafico.', ru: 'Появляется термин «GPU»: блок трансформации и освещения переходит в графический чип.' } },
  { id: 'nv-gf3', brand: 'nvidia', name: 'GeForce 3', year: '2001', level: 3, parent: 'nv-gf256',
    innovation: { es: 'Shaders programables', en: 'Programmable shaders', fr: 'Shaders programmables', de: 'Programmierbare Shader', it: 'Shader programmabili', ru: 'Программируемые шейдеры' },
    desc: { es: 'Su nfiniteFX Engine permitió a los desarrolladores programar efectos visuales complejos.', en: 'Its nfiniteFX Engine let developers program complex visual effects.', fr: 'Son nfiniteFX Engine permettait aux développeurs de programmer des effets visuels complexes.', de: 'Seine nfiniteFX Engine ließ Entwickler komplexe visuelle Effekte programmieren.', it: 'Il suo nfiniteFX Engine permetteva agli sviluppatori di programmare effetti visivi complessi.', ru: 'Движок nfiniteFX позволил разработчикам программировать сложные визуальные эффекты.' } },
  { id: 'nv-tesla', brand: 'nvidia', name: 'Tesla (G80)', year: '2006', level: 4, parent: 'nv-gf3',
    innovation: { es: 'Arquitectura unificada', en: 'Unified architecture', fr: 'Architecture unifiée', de: 'Vereinheitlichte Architektur', it: 'Architettura unificata', ru: 'Унифицированная архитектура' },
    desc: { es: 'Eliminó la separación entre shaders de vértices y de píxeles. Con ella nacen CUDA y el cálculo en GPU.', en: 'Removed the split between vertex and pixel shaders. CUDA and GPU computing were born with it.', fr: 'A supprimé la séparation entre shaders de sommets et de pixels. CUDA et le calcul sur GPU naissent avec elle.', de: 'Hob die Trennung zwischen Vertex- und Pixel-Shadern auf. Mit ihr entstanden CUDA und das GPU-Computing.', it: 'Ha eliminato la separazione tra shader di vertici e di pixel. Con lei nascono CUDA e il calcolo su GPU.', ru: 'Убрала разделение вершинных и пиксельных шейдеров. С ней появились CUDA и вычисления на GPU.' } },
  { id: 'amd-gcn', brand: 'amd', name: 'GCN (Graphics Core Next)', year: '2011', level: 4, parent: null,
    innovation: { es: 'Cálculo de propósito general', en: 'General-purpose compute', fr: 'Calcul généraliste', de: 'Universelles Rechnen', it: 'Calcolo generico', ru: 'Универсальные вычисления' },
    desc: { es: 'Arquitectura muy longeva: de la Radeon HD 7970 a las consolas PS4 y Xbox One.', en: 'A very long-lived architecture: from the Radeon HD 7970 to the PS4 and Xbox One consoles.', fr: 'Une architecture très durable : de la Radeon HD 7970 aux consoles PS4 et Xbox One.', de: 'Eine sehr langlebige Architektur: von der Radeon HD 7970 bis zu den Konsolen PS4 und Xbox One.', it: 'Un’architettura molto longeva: dalla Radeon HD 7970 alle console PS4 e Xbox One.', ru: 'Очень долговечная архитектура: от Radeon HD 7970 до консолей PS4 и Xbox One.' } },
  { id: 'nv-kepler', brand: 'nvidia', name: 'Kepler', year: '2012', level: 5, parent: 'nv-tesla',
    innovation: { es: 'Rendimiento por vatio', en: 'Performance per watt', fr: 'Performances par watt', de: 'Leistung pro Watt', it: 'Prestazioni per watt', ru: 'Производительность на ватт' },
    desc: { es: 'Diseñada para exprimir el rendimiento por vatio; la Tesla K20X movió el superordenador Titan.', en: 'Designed to maximize performance per watt; the Tesla K20X powered the Titan supercomputer.', fr: 'Conçue pour maximiser les performances par watt ; la Tesla K20X animait le supercalculateur Titan.', de: 'Auf maximale Leistung pro Watt ausgelegt; die Tesla K20X trieb den Supercomputer Titan an.', it: 'Progettata per massimizzare le prestazioni per watt; la Tesla K20X alimentava il supercomputer Titan.', ru: 'Создана ради производительности на ватт; Tesla K20X работали в суперкомпьютере Titan.' } },
  { id: 'nv-maxwell', brand: 'nvidia', name: 'Maxwell', year: '2014', level: 6, parent: 'nv-kepler',
    innovation: { es: 'Iluminación global con vóxeles (VXGI)', en: 'Voxel global illumination (VXGI)', fr: 'Illumination globale par voxels (VXGI)', de: 'Voxel-basierte globale Beleuchtung (VXGI)', it: 'Illuminazione globale a voxel (VXGI)', ru: 'Глобальное освещение на вокселях (VXGI)' },
    desc: { es: 'Refinó la eficiencia de Kepler y duplicó el rendimiento por vatio.', en: 'Refined Kepler’s efficiency and doubled performance per watt.', fr: 'A affiné l’efficacité de Kepler et doublé les performances par watt.', de: 'Verfeinerte Keplers Effizienz und verdoppelte die Leistung pro Watt.', it: 'Ha affinato l’efficienza di Kepler e raddoppiato le prestazioni per watt.', ru: 'Доработала эффективность Kepler и удвоила производительность на ватт.' } },
  { id: 'nv-pascal', brand: 'nvidia', name: 'Pascal', year: '2016', level: 7, parent: 'nv-maxwell',
    innovation: { es: 'FinFET de 16 nm y NVLink', en: '16 nm FinFET and NVLink', fr: 'FinFET 16 nm et NVLink', de: '16-nm-FinFET und NVLink', it: 'FinFET a 16 nm e NVLink', ru: '16-нм FinFET и NVLink' },
    desc: { es: 'Un salto generacional enorme; la GTX 1080 Ti se convirtió en leyenda.', en: 'A huge generational leap; the GTX 1080 Ti became a legend.', fr: 'Un bond générationnel énorme ; la GTX 1080 Ti est devenue une légende.', de: 'Ein riesiger Generationssprung; die GTX 1080 Ti wurde zur Legende.', it: 'Un enorme salto generazionale; la GTX 1080 Ti è diventata una leggenda.', ru: 'Огромный скачок поколений; GTX 1080 Ti стала легендой.' } },
  { id: 'amd-rdna1', brand: 'amd', name: 'RDNA', year: '2019', level: 7, parent: 'amd-gcn',
    innovation: { es: 'Jerarquía de caché rediseñada', en: 'Redesigned cache hierarchy', fr: 'Hiérarchie de cache repensée', de: 'Neu gestaltete Cache-Hierarchie', it: 'Gerarchia di cache riprogettata', ru: 'Переработанная иерархия кэша' },
    desc: { es: 'AMD deja atrás GCN con una arquitectura pensada específicamente para juegos.', en: 'AMD leaves GCN behind with an architecture designed specifically for gaming.', fr: 'AMD laisse GCN derrière elle avec une architecture pensée spécifiquement pour le jeu.', de: 'AMD lässt GCN hinter sich – mit einer speziell fürs Gaming entworfenen Architektur.', it: 'AMD si lascia alle spalle GCN con un’architettura pensata specificamente per il gaming.', ru: 'AMD уходит от GCN к архитектуре, созданной специально для игр.' } },
  { id: 'nv-turing', brand: 'nvidia', name: 'Turing', year: '2018', level: 8, parent: 'nv-pascal',
    innovation: { es: 'Ray tracing en tiempo real', en: 'Real-time ray tracing', fr: 'Ray tracing en temps réel', de: 'Echtzeit-Raytracing', it: 'Ray tracing in tempo reale', ru: 'Трассировка лучей в реальном времени' },
    desc: { es: 'Introdujo los RT Cores y los Tensor Cores. Nacen el ray tracing comercial y DLSS.', en: 'Introduced RT Cores and Tensor Cores. Commercial ray tracing and DLSS were born.', fr: 'A introduit les RT Cores et les Tensor Cores. Naissance du ray tracing grand public et du DLSS.', de: 'Führte RT Cores und Tensor Cores ein. Kommerzielles Raytracing und DLSS entstanden.', it: 'Ha introdotto gli RT Core e i Tensor Core. Nascono il ray tracing commerciale e il DLSS.', ru: 'Появились RT-ядра и тензорные ядра, а вместе с ними — массовая трассировка лучей и DLSS.' } },
  { id: 'nv-ampere', brand: 'nvidia', name: 'Ampere', year: '2020', level: 9, parent: 'nv-turing',
    innovation: { es: 'RT Cores de 2.ª y Tensor Cores de 3.ª generación', en: '2nd-gen RT Cores and 3rd-gen Tensor Cores', fr: 'RT Cores de 2e et Tensor Cores de 3e génération', de: 'RT Cores der 2. und Tensor Cores der 3. Generation', it: 'RT Core di 2ª e Tensor Core di 3ª generazione', ru: 'RT-ядра 2-го и тензорные ядра 3-го поколения' },
    desc: { es: 'Duplicó el cálculo FP32 por núcleo y llevó el ray tracing a la madurez.', en: 'Doubled FP32 throughput per core and brought ray tracing to maturity.', fr: 'A doublé le calcul FP32 par cœur et fait mûrir le ray tracing.', de: 'Verdoppelte den FP32-Durchsatz pro Kern und machte Raytracing ausgereift.', it: 'Ha raddoppiato il calcolo FP32 per core e portato il ray tracing alla maturità.', ru: 'Удвоила FP32 на ядро и сделала трассировку лучей зрелой технологией.' } },
  { id: 'amd-rdna2', brand: 'amd', name: 'RDNA 2', year: '2020', level: 9, parent: 'amd-rdna1',
    innovation: { es: 'Infinity Cache', en: 'Infinity Cache', fr: 'Infinity Cache', de: 'Infinity Cache', it: 'Infinity Cache', ru: 'Infinity Cache' },
    desc: { es: 'Añadió ray tracing por hardware; es la base de PS5 y Xbox Series X|S.', en: 'Added hardware ray tracing; it powers the PS5 and Xbox Series X|S.', fr: 'A ajouté le ray tracing matériel ; c’est la base de la PS5 et des Xbox Series X|S.', de: 'Brachte Hardware-Raytracing; sie steckt in PS5 und Xbox Series X|S.', it: 'Ha aggiunto il ray tracing hardware; è la base di PS5 e Xbox Series X|S.', ru: 'Добавила аппаратную трассировку лучей; лежит в основе PS5 и Xbox Series X|S.' } },
  { id: 'nv-ada', brand: 'nvidia', name: 'Ada Lovelace', year: '2022', level: 10, parent: 'nv-ampere',
    innovation: { es: 'Generación de fotogramas (DLSS 3)', en: 'Frame generation (DLSS 3)', fr: 'Génération d’images (DLSS 3)', de: 'Bildgenerierung (DLSS 3)', it: 'Generazione di fotogrammi (DLSS 3)', ru: 'Генерация кадров (DLSS 3)' },
    desc: { es: 'Gran mejora de eficiencia y de rendimiento con IA en juegos.', en: 'A big step in efficiency and AI-assisted gaming performance.', fr: 'Un grand pas en efficacité et en performances de jeu assistées par l’IA.', de: 'Ein großer Schritt bei Effizienz und KI-gestützter Spieleleistung.', it: 'Un grande passo in efficienza e prestazioni di gioco assistite dall’IA.', ru: 'Большой шаг в эффективности и игровой производительности с помощью ИИ.' } },
  { id: 'amd-rdna3', brand: 'amd', name: 'RDNA 3', year: '2022', level: 10, parent: 'amd-rdna2',
    innovation: { es: 'Diseño con chiplets (MCD)', en: 'Chiplet design (MCD)', fr: 'Conception en chiplets (MCD)', de: 'Chiplet-Design (MCD)', it: 'Design a chiplet (MCD)', ru: 'Чиплетная компоновка (MCD)' },
    desc: { es: 'La primera GPU de consumo con chiplets: separa el cálculo de la caché y los controladores de memoria.', en: 'The first consumer GPU with chiplets: compute is split from cache and memory controllers.', fr: 'Le premier GPU grand public en chiplets : le calcul est séparé du cache et des contrôleurs mémoire.', de: 'Die erste Consumer-GPU mit Chiplets: Rechenteil getrennt von Cache und Speichercontrollern.', it: 'La prima GPU consumer a chiplet: il calcolo è separato da cache e controller di memoria.', ru: 'Первый потребительский GPU на чиплетах: вычисления отделены от кэша и контроллеров памяти.' } },
  { id: 'nv-blackwell', brand: 'nvidia', name: 'Blackwell', year: '2024/25', level: 11, parent: 'nv-ada',
    innovation: { es: 'Generación múltiple de fotogramas y FP4', en: 'Multi Frame Generation and FP4', fr: 'Génération multi-images et FP4', de: 'Multi-Bildgenerierung und FP4', it: 'Generazione multipla di fotogrammi e FP4', ru: 'Мультигенерация кадров и FP4' },
    desc: { es: 'Una misma arquitectura para el gaming (RTX 50) y para los grandes centros de IA (B200).', en: 'One architecture for gaming (RTX 50) and for large AI data centers (B200).', fr: 'Une même architecture pour le jeu (RTX 50) et les grands centres d’IA (B200).', de: 'Eine Architektur für Gaming (RTX 50) und große KI-Rechenzentren (B200).', it: 'Una stessa architettura per il gaming (RTX 50) e per i grandi data center di IA (B200).', ru: 'Одна архитектура и для игр (RTX 50), и для крупных дата-центров ИИ (B200).' } },
  { id: 'amd-rdna4', brand: 'amd', name: 'RDNA 4', year: '2025', level: 11, parent: 'amd-rdna3',
    innovation: { es: 'Reescalado FSR 4 con IA', en: 'AI-based FSR 4 upscaling', fr: 'Mise à l’échelle FSR 4 par IA', de: 'KI-basierte FSR-4-Hochskalierung', it: 'Upscaling FSR 4 basato sull’IA', ru: 'Масштабирование FSR 4 на основе ИИ' },
    desc: { es: 'Radeon RX 9070 XT: mejor ray tracing y aceleradores de IA para el reescalado.', en: 'Radeon RX 9070 XT: better ray tracing and AI accelerators for upscaling.', fr: 'Radeon RX 9070 XT : meilleur ray tracing et accélérateurs d’IA pour la mise à l’échelle.', de: 'Radeon RX 9070 XT: besseres Raytracing und KI-Beschleuniger fürs Hochskalieren.', it: 'Radeon RX 9070 XT: ray tracing migliore e acceleratori di IA per l’upscaling.', ru: 'Radeon RX 9070 XT: улучшенная трассировка лучей и ИИ-ускорители для масштабирования.' } }
];

// ===== SALÓN DE LA FAMA =====
const HALL_OF_FAME = [
  { name: '3dfx Voodoo Graphics', year: '1996', img: '3dfx_voodoo',
    desc: { es: 'La tarjeta que inició la revolución del 3D. Antes de ella, casi todos los juegos se dibujaban por software; después llegó la verdadera era tridimensional. Funcionaba como acelerador 3D junto a la tarjeta 2D del equipo.', en: 'The card that started the 3D revolution. Before it, most games were rendered in software; after it, the true 3D era began. It worked as a 3D accelerator alongside the PC’s 2D card.', fr: 'La carte qui a lancé la révolution 3D. Avant elle, la plupart des jeux étaient rendus par logiciel ; après elle, la véritable ère de la 3D a commencé. Elle servait d’accélérateur 3D aux côtés de la carte 2D du PC.', de: 'Die Karte, die die 3D-Revolution auslöste. Davor wurden die meisten Spiele per Software berechnet; danach begann die echte 3D-Ära. Sie arbeitete als 3D-Beschleuniger neben der 2D-Karte des PCs.', it: 'La scheda che ha avviato la rivoluzione 3D. Prima di lei quasi tutti i giochi erano resi via software; dopo è iniziata la vera era tridimensionale. Funzionava come acceleratore 3D accanto alla scheda 2D del PC.', ru: 'Карта, с которой началась 3D-революция. До неё большинство игр отрисовывалось программно, после — наступила настоящая эпоха 3D. Работала как 3D-ускоритель вместе с 2D-картой компьютера.' },
    impact: { es: 'Popularizó la aceleración 3D en el PC.', en: 'Made 3D acceleration mainstream on the PC.', fr: 'A popularisé l’accélération 3D sur PC.', de: 'Machte 3D-Beschleunigung auf dem PC populär.', it: 'Ha reso popolare l’accelerazione 3D su PC.', ru: 'Сделала 3D-ускорение массовым на ПК.' } },
  { name: 'NVIDIA GeForce 256', year: '1999', img: 'geforce_256',
    desc: { es: 'NVIDIA acuñó el término «GPU» con esta tarjeta. Fue pionera al integrar la transformación e iluminación (T&L) en el hardware, lo que liberó al procesador de gran parte del cálculo geométrico.', en: 'NVIDIA coined the term “GPU” with this card. It pioneered hardware transform and lighting (T&L), freeing the CPU from much of the geometry work.', fr: 'NVIDIA a inventé le terme « GPU » avec cette carte. Elle a été pionnière en intégrant la transformation et l’éclairage (T&L) au matériel, libérant le processeur d’une grande partie des calculs géométriques.', de: 'Mit dieser Karte prägte NVIDIA den Begriff „GPU“. Sie integrierte als erste Transformation und Beleuchtung (T&L) in Hardware und nahm der CPU viel Geometriearbeit ab.', it: 'Con questa scheda NVIDIA ha coniato il termine «GPU». È stata pioniera nell’integrare trasformazione e illuminazione (T&L) nell’hardware, liberando il processore da gran parte del calcolo geometrico.', ru: 'Этой картой NVIDIA ввела термин «GPU». Она первой перенесла трансформацию и освещение (T&L) в железо, избавив процессор от большей части геометрических расчётов.' },
    impact: { es: 'Considerada la primera GPU de la historia.', en: 'Considered the first GPU in history.', fr: 'Considérée comme le premier GPU de l’histoire.', de: 'Gilt als erste GPU der Geschichte.', it: 'Considerata la prima GPU della storia.', ru: 'Считается первым GPU в истории.' } },
  { name: 'AMD Radeon HD 7970', year: '2011', img: 'radeon_hd_7970',
    desc: { es: 'La primera tarjeta con arquitectura GCN (Graphics Core Next). Su diseño resultó tan sólido que tuvo una vida larguísima y sirvió de base para las consolas de toda una década.', en: 'The first card with the GCN (Graphics Core Next) architecture. Its design proved so solid that it had a very long life and became the basis for a decade of consoles.', fr: 'La première carte à architecture GCN (Graphics Core Next). Sa conception s’est révélée si solide qu’elle a eu une très longue vie et a servi de base aux consoles de toute une décennie.', de: 'Die erste Karte mit GCN-Architektur (Graphics Core Next). Ihr Design erwies sich als so solide, dass sie sehr lange aktuell blieb und die Basis für eine ganze Konsolengeneration wurde.', it: 'La prima scheda con architettura GCN (Graphics Core Next). Il suo progetto si è rivelato così solido da avere una vita lunghissima e da fare da base alle console di un intero decennio.', ru: 'Первая карта на архитектуре GCN (Graphics Core Next). Её конструкция оказалась настолько удачной, что прожила очень долго и легла в основу консолей целого десятилетия.' },
    impact: { es: 'Una arquitectura de longevidad e influencia excepcionales.', en: 'An architecture of exceptional longevity and influence.', fr: 'Une architecture d’une longévité et d’une influence exceptionnelles.', de: 'Eine Architektur von außergewöhnlicher Langlebigkeit und Wirkung.', it: 'Un’architettura di eccezionale longevità e influenza.', ru: 'Архитектура исключительной долговечности и влияния.' } },
  { name: 'NVIDIA GTX 1080 Ti', year: '2017', img: 'gtx_1080_ti',
    desc: { es: 'Para muchos, la GPU más legendaria de la era moderna. Basada en la eficiente arquitectura Pascal, dio un salto de rendimiento tan grande que siguió siendo competitiva durante años.', en: 'For many, the most legendary GPU of the modern era. Built on the efficient Pascal architecture, it delivered such a big leap that it stayed competitive for years.', fr: 'Pour beaucoup, le GPU le plus légendaire de l’ère moderne. Basée sur l’efficace architecture Pascal, elle a offert un tel bond qu’elle est restée compétitive pendant des années.', de: 'Für viele die legendärste GPU der Neuzeit. Auf der effizienten Pascal-Architektur bot sie einen so großen Sprung, dass sie jahrelang konkurrenzfähig blieb.', it: 'Per molti la GPU più leggendaria dell’era moderna. Basata sull’efficiente architettura Pascal, ha offerto un salto così grande da restare competitiva per anni.', ru: 'Для многих — самый легендарный GPU современной эпохи. На эффективной архитектуре Pascal она дала такой прирост, что оставалась конкурентоспособной много лет.' },
    impact: { es: 'Uno de los mayores saltos entre generaciones.', en: 'One of the biggest generational leaps.', fr: 'L’un des plus grands bonds d’une génération à l’autre.', de: 'Einer der größten Generationssprünge.', it: 'Uno dei maggiori salti generazionali.', ru: 'Один из крупнейших скачков между поколениями.' } }
];

// Clave normalizada de una GPU: detecta el mismo modelo aunque aparezca con nombres
// ligeramente distintos ("RX 7900 XTX" / "Radeon RX 7900 XTX").
function gpuKey(name) {
  return String(name).toLowerCase().replace(/^radeon\s+/, '').replace(/\s+/g, ' ').trim();
}
