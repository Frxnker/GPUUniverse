// ===== GPU DATABASE =====

const GAMING_GPUS = [
  {
    brand: 'nvidia', name: 'RTX 5090', arch: 'Blackwell / GB202',
    tier: 'ultra', vram: '32 GB GDDR7', tflops: '209.8', bandwidth: '1792 GB/s',
    tdp: '575W', price: '~$1999', perf: 100, fillColor: 'fill-gold'
  },
  {
    brand: 'nvidia', name: 'RTX 4090', arch: 'Ada Lovelace / AD102',
    tier: 'ultra', vram: '24 GB GDDR6X', tflops: '82.6', bandwidth: '1008 GB/s',
    tdp: '450W', price: '~$1599', perf: 80, fillColor: 'fill-gold'
  },
  {
    brand: 'amd', name: 'RX 9070 XT', arch: 'RDNA 4 / Navi 48',
    tier: 'high', vram: '16 GB GDDR6', tflops: '73.0', bandwidth: '640 GB/s',
    tdp: '304W', price: '~$599', perf: 68, fillColor: 'fill-purple'
  },
  {
    brand: 'nvidia', name: 'RTX 4070 Ti SUPER', arch: 'Ada Lovelace / AD103',
    tier: 'high', vram: '16 GB GDDR6X', tflops: '40.0', bandwidth: '672 GB/s',
    tdp: '285W', price: '~$799', perf: 60, fillColor: 'fill-purple'
  },
  {
    brand: 'amd', name: 'RX 7900 XTX', arch: 'RDNA 3 / Navi 31',
    tier: 'high', vram: '24 GB GDDR6', tflops: '61.4', bandwidth: '960 GB/s',
    tdp: '355W', price: '~$849', perf: 62, fillColor: 'fill-purple'
  },
  {
    brand: 'nvidia', name: 'RTX 4070 SUPER', arch: 'Ada Lovelace / AD104',
    tier: 'mid', vram: '12 GB GDDR6X', tflops: '35.5', bandwidth: '504 GB/s',
    tdp: '220W', price: '~$599', perf: 50, fillColor: 'fill-blue'
  },
  {
    brand: 'amd', name: 'RX 7800 XT', arch: 'RDNA 3 / Navi 32',
    tier: 'mid', vram: '16 GB GDDR6', tflops: '37.3', bandwidth: '624 GB/s',
    tdp: '263W', price: '~$449', perf: 46, fillColor: 'fill-blue'
  },
  {
    brand: 'intel', name: 'Arc B580', arch: 'Battlemage / BMG-G21',
    tier: 'mid', vram: '12 GB GDDR6', tflops: '24.6', bandwidth: '456 GB/s',
    tdp: '190W', price: '~$249', perf: 38, fillColor: 'fill-blue'
  },
  {
    brand: 'nvidia', name: 'RTX 4060', arch: 'Ada Lovelace / AD107',
    tier: 'entry', vram: '8 GB GDDR6', tflops: '15.1', bandwidth: '272 GB/s',
    tdp: '115W', price: '~$299', perf: 28, fillColor: 'fill-green'
  },
  {
    brand: 'nvidia', name: 'RTX 5060', arch: 'Blackwell / GB207',
    tier: 'mid', vram: '12 GB GDDR7', tflops: '28.5', bandwidth: '384 GB/s',
    tdp: '140W', price: '~$349', perf: 42, fillColor: 'fill-blue'
  },
  {
    brand: 'nvidia', name: 'RTX 5050', arch: 'Blackwell / GB207',
    tier: 'entry', vram: '8 GB GDDR7', tflops: '18.2', bandwidth: '256 GB/s',
    tdp: '100W', price: '~$249', perf: 32, fillColor: 'fill-green'
  },
];

const WORKSTATION_GPUS = [
  {
    brand: 'nvidia', name: 'RTX 6000 Ada', arch: 'Ada Lovelace / AD102',
    tier: 'ultra', vram: '48 GB GDDR6', tflops: '91.1', bandwidth: '960 GB/s',
    tdp: '300W', price: '~$6799', perf: 88, fillColor: 'fill-gold'
  },
  {
    brand: 'nvidia', name: 'RTX 5000 Ada', arch: 'Ada Lovelace / AD104',
    tier: 'high', vram: '32 GB GDDR6', tflops: '65.3', bandwidth: '576 GB/s',
    tdp: '250W', price: '~$3999', perf: 70, fillColor: 'fill-purple'
  },
  {
    brand: 'amd', name: 'Radeon PRO W7900', arch: 'RDNA 3 / Navi 31',
    tier: 'ultra', vram: '48 GB GDDR6', tflops: '61.3', bandwidth: '864 GB/s',
    tdp: '295W', price: '~$3999', perf: 65, fillColor: 'fill-gold'
  },
  {
    brand: 'nvidia', name: 'RTX 4000 Ada SFF', arch: 'Ada Lovelace / AD104',
    tier: 'mid', vram: '20 GB GDDR6', tflops: '26.7', bandwidth: '432 GB/s',
    tdp: '70W', price: '~$1249', perf: 42, fillColor: 'fill-blue'
  },
  {
    brand: 'apple', name: 'M4 Ultra GPU', arch: 'Apple Silicon / 5nm',
    tier: 'ultra', vram: '192 GB UMA', tflops: '21.3', bandwidth: '800 GB/s',
    tdp: '~120W', price: '~$3999+', perf: 55, fillColor: 'fill-gold'
  },
  {
    brand: 'amd', name: 'Radeon PRO W7800', arch: 'RDNA 3 / Navi 32',
    tier: 'high', vram: '32 GB GDDR6', tflops: '45.2', bandwidth: '576 GB/s',
    tdp: '260W', price: '~$2499', perf: 55, fillColor: 'fill-purple'
  },
];

const MOBILE_GPUS = [
  {
    brand: 'nvidia', name: 'RTX 5090 Laptop', arch: 'Blackwell / GB203',
    tier: 'ultra', vram: '16 GB GDDR7', tflops: '52.4', bandwidth: '512 GB/s',
    tdp: '80-175W', price: 'N/A', perf: 85, fillColor: 'fill-gold'
  },
  {
    brand: 'nvidia', name: 'RTX 5080 Laptop', arch: 'Blackwell / GB205',
    tier: 'high', vram: '12 GB GDDR7', tflops: '38.2', bandwidth: '432 GB/s',
    tdp: '60-150W', price: 'N/A', perf: 72, fillColor: 'fill-purple'
  },
  {
    brand: 'nvidia', name: 'RTX 5070 Laptop', arch: 'Blackwell / GB206',
    tier: 'mid', vram: '8 GB GDDR7', tflops: '24.5', bandwidth: '320 GB/s',
    tdp: '35-115W', price: 'N/A', perf: 55, fillColor: 'fill-blue'
  },
  {
    brand: 'nvidia', name: 'RTX 4090 Laptop', arch: 'Ada Lovelace / AD103',
    tier: 'ultra', vram: '16 GB GDDR6', tflops: '39.7', bandwidth: '432 GB/s',
    tdp: '80-150W', price: 'N/A', perf: 65, fillColor: 'fill-gold'
  },
  {
    brand: 'nvidia', name: 'RTX 4080 Laptop', arch: 'Ada Lovelace / AD104',
    tier: 'high', vram: '12 GB GDDR6', tflops: '29.7', bandwidth: '432 GB/s',
    tdp: '60-150W', price: 'N/A', perf: 55, fillColor: 'fill-purple'
  },
  {
    brand: 'amd', name: 'RX 7900M', arch: 'RDNA 3 / Navi 31',
    tier: 'high', vram: '16 GB GDDR6', tflops: '38.5', bandwidth: '576 GB/s',
    tdp: '180W', price: 'N/A', perf: 58, fillColor: 'fill-purple'
  },
  {
    brand: 'nvidia', name: 'RTX 4070 Laptop', arch: 'Ada Lovelace / AD106',
    tier: 'mid', vram: '8 GB GDDR6', tflops: '15.6', bandwidth: '256 GB/s',
    tdp: '35-115W', price: 'N/A', perf: 40, fillColor: 'fill-blue'
  },
  {
    brand: 'intel', name: 'Arc A730M', arch: 'Alchemist',
    tier: 'mid', vram: '12 GB GDDR6', tflops: '10.2', bandwidth: '336 GB/s',
    tdp: '80-120W', price: 'N/A', perf: 25, fillColor: 'fill-blue'
  },
  {
    brand: 'nvidia', name: 'RTX 4050 Laptop', arch: 'Ada Lovelace / AD107',
    tier: 'entry', vram: '6 GB GDDR6', tflops: '9.0', bandwidth: '192 GB/s',
    tdp: '35-115W', price: 'N/A', perf: 20, fillColor: 'fill-green'
  }
];

const SERVER_GPUS = [
  {
    brand: 'nvidia', name: 'H200 SXM', arch: 'Hopper / GH100',
    vram: '141 GB HBM3e', tflops: '3958 (INT8)', bandwidth: '4800 GB/s',
    tdp: '700W', interconnect: 'NVLink 900 GB/s', use: 'LLM / HPC / IA Generativa',
    desc: {es: 'El acelerador más potente de NVIDIA para centros de datos. Con 141 GB de HBM3e y 4.8 TB/s de ancho de banda, es el estándar de facto para entrenar modelos LLM como GPT-4.', en: 'The most powerful NVIDIA accelerator for data centers. With 141 GB of HBM3e and 4.8 TB/s bandwidth, it is the de facto standard for training LLM models like GPT-4.', fr: 'L\'accélérateur NVIDIA le plus puissant pour les centres de données. Avec 141 Go de HBM3e et 4,8 To/s de bande passante, c\'est la norme de facto pour l\'entraînement de modèles LLM comme GPT-4.', de: 'Der leistungsstärkste NVIDIA-Beschleuniger für Rechenzentren. Mit 141 GB HBM3e und 4,8 TB/s Bandbreite ist er der De-facto-Standard für das Training von LLM-Modellen wie GPT-4.', it: 'L\'acceleratore NVIDIA più potente per i data center. Con 141 GB di HBM3e e 4,8 TB/s di larghezza di banda, è lo standard de facto per l\'addestramento di modelli LLM come GPT-4.', ru: 'Самый мощный ускоритель NVIDIA для дата-центров. С 141 ГБ HBM3e и пропускной способностью 4,8 ТБ/с он является стандартом де-факто для обучения моделей LLM, таких как GPT-4.'},
    cssClass: 'nvidia-card'
  },
  {
    brand: 'amd', name: 'Instinct MI300X', arch: 'CDNA 3 / 5nm + 6nm',
    vram: '192 GB HBM3', tflops: '5220 (INT8)', bandwidth: '5300 GB/s',
    tdp: '750W', interconnect: 'Infinity Fabric 896 GB/s', use: 'IA / Inferencia / HPC',
    desc: {es: 'Con 192 GB de HBM3, el MI300X es el rey en capacidad de memoria. Permite ejecutar modelos enormes sin particionado entre múltiples GPUs, ideal para inferencia a gran escala.', en: 'With 192 GB of HBM3, the MI300X is the king in memory capacity. It allows running massive models without partitioning across multiple GPUs, ideal for large-scale inference.', fr: 'Avec 192 Go de HBM3, le MI300X est le roi de la capacité mémoire. Il permet d\'exécuter des modèles massifs sans partitionnement sur plusieurs GPU, idéal pour l\'inférence à grande échelle.', de: 'Mit 192 GB HBM3 ist der MI300X der König der Speicherkapazität. Er ermöglicht das Ausführen massiver Modelle ohne Partitionierung über mehrere GPUs hinweg, ideal für groß angelegte Inferenz.', it: 'Con 192 GB di HBM3, il MI300X è il re della capacità di memoria. Permette di eseguire modelli enormi senza partizionamento su più GPU, ideale per inferenza su larga scala.', ru: 'С 192 ГБ HBM3 MI300X является королем по объему памяти. Позволяет запускать огромные модели без разделения между несколькими GPU, идеально подходит для масштабного вывода.'},
    cssClass: 'amd-card'
  },
  {
    brand: 'intel', name: 'Gaudi 3', arch: 'Gaudi 3 / 5nm',
    vram: '128 GB HBM2e', tflops: '4835 (INT8)', bandwidth: '3700 GB/s',
    tdp: '900W', interconnect: 'Ethernet 200 GbE', use: 'IA / Entrenamiento / Inferencia',
    desc: {es: 'Intel Gaudi 3 apuesta por la conectividad Ethernet estándar para clusters de IA, reduciendo costes de infraestructura. Competidor directo de H100 con una propuesta de coste-beneficio atractiva.', en: 'Intel Gaudi 3 relies on standard Ethernet connectivity for AI clusters, reducing infrastructure costs. A direct competitor to H100 with an attractive cost-benefit proposition.', fr: 'Intel Gaudi 3 s\'appuie sur la connectivité Ethernet standard pour les clusters d\'IA, réduisant les coûts d\'infrastructure. Un concurrent direct de la H100 avec une proposition coût-bénéfice intéressante.', de: 'Intel Gaudi 3 setzt auf Standard-Ethernet-Konnektivität für KI-Cluster und reduziert so die Infrastrukturkosten. Ein direkter Konkurrent der H100 mit einem attraktiven Kosten-Nutzen-Verhältnis.', it: 'Intel Gaudi 3 punta sulla connettività Ethernet standard per i cluster IA, riducendo i costi infrastrutturali. Un concorrente diretto della H100 con una proposta costo-beneficio interessante.', ru: 'Intel Gaudi 3 делает ставку на стандартное Ethernet-соединение для ИИ-кластеров, снижая затраты на инфраструктуру. Прямой конкурент H100 с привлекательным соотношением цена-качество.'},
    cssClass: 'intel-card'
  },
];

const COMPARE_DATA = [
  { name: 'H200 SXM', cat: 'Server', tflops: 3958, vram: '141 GB', bw: 4800, price: '~$40,000', brand: 'nvidia' },
  { name: 'MI300X', cat: 'Server', tflops: 5220, vram: '192 GB', bw: 5300, price: '~$15,000', brand: 'amd' },
  { name: 'Gaudi 3', cat: 'Server', tflops: 4835, vram: '128 GB', bw: 3700, price: '~$10,000', brand: 'intel' },
  { name: 'RTX 6000 Ada', cat: 'Workstation', tflops: 91.1, vram: '48 GB', bw: 960, price: '~$6,799', brand: 'nvidia' },
  { name: 'RTX 5090', cat: 'Gaming', tflops: 209.8, vram: '32 GB', bw: 1792, price: '~$1,999', brand: 'nvidia' },
  { name: 'RTX 4090', cat: 'Gaming', tflops: 82.6, vram: '24 GB', bw: 1008, price: '~$1,599', brand: 'nvidia' },
  { name: 'MI300X', cat: 'Server', tflops: 5220, vram: '192 GB', bw: 5300, price: '~$15,000', brand: 'amd' },
  { name: 'RX 9070 XT', cat: 'Gaming', tflops: 73.0, vram: '16 GB', bw: 640, price: '~$599', brand: 'amd' },
];

const TIMELINE_DATA = [
  { year: '1981', title: 'IBM CGA', desc: {es: 'El inicio de los gráficos en color para el PC de IBM.', en: 'The beginning of color graphics for the IBM PC.', fr: 'Le début des graphismes couleur pour le PC IBM.', de: 'Der Beginn der Farbgrafik für den IBM PC.', it: 'L\'inizio della grafica a colori per il PC IBM.', ru: 'Начало цветной графики для IBM PC.'} },
  { year: '1992', title: 'S3 Graphics 86C911', desc: {es: 'Primer acelerador de interfaz gráfica (GUI) para Windows.', en: 'First GUI accelerator for Windows.', fr: 'Premier accélérateur d\'interface graphique (GUI) pour Windows.', de: 'Erster GUI-Beschleuniger für Windows.', it: 'Primo acceleratore di interfaccia grafica (GUI) per Windows.', ru: 'Первый графический ускоритель (GUI) для Windows.'} },
  { year: '1996', title: '3dfx Voodoo', desc: {es: 'El primer acelerador 3D de gran éxito comercial. Inicia la era del gaming en 3D para PC.', en: 'The first commercially successful 3D accelerator. Starts the 3D PC gaming era.', fr: 'Le premier accélérateur 3D à succès commercial. Lance l\'ère du jeu 3D sur PC.', de: 'Der erste kommerziell erfolgreiche 3D-Beschleuniger. Startet das Zeitalter der 3D-PC-Spiele.', it: 'Il primo acceleratore 3D di grande successo commerciale. Inizia l\'era del gaming 3D per PC.', ru: 'Первый коммерчески успешный 3D-ускоритель. Начинает эру 3D ПК-гейминга.'} },
  { year: '1999', title: 'NVIDIA GeForce 256', desc: {es: 'Primera GPU del mundo con T&L hardware. Revolución gráfica.', en: 'First GPU in the world with hardware T&L. Graphic revolution.', fr: 'Premier GPU au monde avec T&L matériel. Révolution graphique.', de: 'Erste GPU der Welt mit Hardware-T&L. Grafische Revolution.', it: 'Prima GPU al mondo con hardware T&L. Rivoluzione grafica.', ru: 'Первый в мире GPU с аппаратным T&L. Графическая революция.'} },
  { year: '2001', title: 'NVIDIA GeForce 3', desc: {es: 'Primeros shaders programables. Nace el realismo cinematográfico.', en: 'First programmable shaders. Cinematic realism is born.', fr: 'Premiers shaders programmables. Le réalisme cinématographique est né.', de: 'Erste programmierbare Shader. Filmischer Realismus wird geboren.', it: 'Primi shader programmabili. Nasce il realismo cinematografico.', ru: 'Первые программируемые шейдеры. Рождение кинематографического реализма.'} },
  { year: '2004', title: 'NVIDIA SLI', desc: {es: 'Nace el soporte para múltiples GPUs en un mismo PC doméstico.', en: 'Multi-GPU support for home PCs is born.', fr: 'Le support multi-GPU pour les PC domestiques est né.', de: 'Multi-GPU-Unterstützung für Heim-PCs wird geboren.', it: 'Nasce il supporto multi-GPU per i PC domestici.', ru: 'Рождение поддержки нескольких GPU в домашних ПК.'} },
  { year: '2006', title: 'NVIDIA G80 / GeForce 8800 GTX', desc: {es: 'Arquitectura unificada. Nace CUDA y la computación en GPU.', en: 'Unified architecture. CUDA and GPU computing are born.', fr: 'Architecture unifiée. Naissance de CUDA et du calcul sur GPU.', de: 'Einheitliche Architektur. CUDA und GPU-Computing werden geboren.', it: 'Architettura unificata. Nasce CUDA e il calcolo su GPU.', ru: 'Унифицированная архитектура. Рождение CUDA и GPU-вычислений.'} },
  { year: '2008', title: 'NVIDIA Tesla C870', desc: {es: 'Primer procesador dedicado exclusivamente al cálculo (GPGPU).', en: 'First processor dedicated exclusively to computing (GPGPU).', fr: 'Premier processeur dédié exclusivement au calcul (GPGPU).', de: 'Erster exklusiv für Berechnungen dedizierter Prozessor (GPGPU).', it: 'Primo processore dedicato esclusivamente al calcolo (GPGPU).', ru: 'Первый процессор, предназначенный исключительно для вычислений (GPGPU).'} },
  { year: '2010', title: 'NVIDIA Fermi', desc: {es: 'Primera GPU diseñada para HPC con ECC y doble precisión.', en: 'First GPU designed for HPC with ECC and double precision.', fr: 'Premier GPU conçu pour le HPC avec ECC et double précision.', de: 'Erste für HPC konzipierte GPU mit ECC und doppelter Genauigkeit.', it: 'Prima GPU progettata per HPC con ECC e doppia precisione.', ru: 'Первый GPU, разработанный для HPC с ECC и двойной точностью.'} },
  { year: '2012', title: 'AMD GCN / NVIDIA Kepler', desc: {es: 'La era del cómputo general. Primeros aceleradores Tesla.', en: 'The era of general computing. First Tesla accelerators.', fr: 'L\'ère du calcul généraliste. Premiers accélérateurs Tesla.', de: 'Die Ära des allgemeinen Rechnens. Erste Tesla-Beschleuniger.', it: 'L\'era del calcolo generale. Primi acceleratori Tesla.', ru: 'Эра общих вычислений. Первые ускорители Tesla.'} },
  { year: '2014', title: 'NVIDIA Maxwell', desc: {es: 'Revolución en eficiencia energética y rendimiento por vatio.', en: 'Revolution in power efficiency and performance per watt.', fr: 'Révolution dans l\'efficacité énergétique et la performance par watt.', de: 'Revolution bei der Energieeffizienz und Leistung pro Watt.', it: 'Rivoluzione nell\'efficienza energetica e prestazioni per watt.', ru: 'Революция в энергоэффективности и производительности на ватт.'} },
  { year: '2016', title: 'NVIDIA Pascal GP100', desc: {es: 'NVLink y 3D-HBM. Nace el Tesla P100, la GPU de IA moderna.', en: 'NVLink and 3D-HBM. The Tesla P100 is born, the modern AI GPU.', fr: 'NVLink et 3D-HBM. Naissance du Tesla P100, le GPU d\'IA moderne.', de: 'NVLink und 3D-HBM. Die Tesla P100 wird geboren, die moderne KI-GPU.', it: 'NVLink e 3D-HBM. Nasce la Tesla P100, la GPU per IA moderna.', ru: 'NVLink и 3D-HBM. Рождается Tesla P100, современный ИИ-GPU.'} },
  { year: '2018', title: 'NVIDIA Turing / RTX 20', desc: {es: 'Ray Tracing en tiempo real y Tensor Cores para IA.', en: 'Real-time Ray Tracing and Tensor Cores for AI.', fr: 'Ray Tracing en temps réel et Tensor Cores pour l\'IA.', de: 'Echtzeit-Raytracing und Tensor Cores für KI.', it: 'Ray Tracing in tempo reale e Tensor Cores per IA.', ru: 'Трассировка лучей в реальном времени и Tensor Cores для ИИ.'} },
  { year: '2020', title: 'NVIDIA Ampere / A100', desc: {es: 'A100 80GB HBM2e. Domina el entrenamiento de IA a escala.', en: 'A100 80GB HBM2e. Dominates AI training at scale.', fr: 'A100 80 Go HBM2e. Domine l\'entraînement de l\'IA à grande échelle.', de: 'A100 80GB HBM2e. Dominiert das KI-Training in großem Maßstab.', it: 'A100 80GB HBM2e. Domina l\'addestramento dell\'IA su scala.', ru: 'A100 80GB HBM2e. Доминирует в обучении ИИ в больших масштабах.'} },
  { year: '2022', title: 'AMD RDNA 3 / NVIDIA Ada', desc: {es: 'RTX 4090 y RX 7900 XTX. Batalla épica en el gaming high-end.', en: 'RTX 4090 and RX 7900 XTX. Epic battle in high-end gaming.', fr: 'RTX 4090 et RX 7900 XTX. Bataille épique dans le jeu haut de gamme.', de: 'RTX 4090 und RX 7900 XTX. Epischer Kampf im High-End-Gaming.', it: 'RTX 4090 e RX 7900 XTX. Battaglia epica nel gaming high-end.', ru: 'RTX 4090 и RX 7900 XTX. Эпическая битва в high-end гейминге.'} },
  { year: '2023', title: 'NVIDIA Hopper H100 / AMD MI300X', desc: {es: 'La carrera de la IA. H100 se convierte en el chip más demandado del planeta.', en: 'The AI race. H100 becomes the most demanded chip on the planet.', fr: 'La course à l\'IA. H100 devient la puce la plus demandée au monde.', de: 'Das KI-Rennen. H100 wird zum gefragtesten Chip des Planeten.', it: 'La corsa all\'IA. H100 diventa il chip più richiesto del pianeta.', ru: 'Гонка ИИ. H100 становится самым востребованным чипом на планете.'} },
  { year: '2024', title: 'NVIDIA Blackwell B200 / Intel Gaudi 3', desc: {es: 'Arquitecturas de próxima generación. 1000+ TFLOPS para LLMs.', en: 'Next-generation architectures. 1000+ TFLOPS for LLMs.', fr: 'Architectures de nouvelle génération. 1000+ TFLOPS pour les LLM.', de: 'Architekturen der nächsten Generation. 1000+ TFLOPS für LLMs.', it: 'Architetture di prossima generazione. 1000+ TFLOPS per LLM.', ru: 'Архитектуры нового поколения. 1000+ TFLOPS для LLM.'} },
  { year: '2025', title: 'RTX 5090 / NVIDIA H200', desc: {es: 'Consumer Blackwell llega. H200 con HBM3e marca el nuevo estándar.', en: 'Consumer Blackwell arrives. H200 with HBM3e sets the new standard.', fr: 'Arrivée de Blackwell pour le grand public. H200 avec HBM3e fixe la nouvelle norme.', de: 'Consumer Blackwell kommt. H200 mit HBM3e setzt den neuen Standard.', it: 'Arriva Blackwell consumer. H200 con HBM3e stabilisce il nuovo standard.', ru: 'Потребительский Blackwell прибывает. H200 с HBM3e устанавливает новый стандарт.'} }
];

const ALL_DOMESTIC_GPUS = [
  // Generación 2010 (Fermi / TeraScale 2)
  { brand: 'nvidia', name: 'GTX 480', arch: 'Fermi', year: 2010, tier: 'ultra', vram: '1.5 GB GDDR5', tflops: '1.34', bandwidth: '177.4 GB/s', tdp: '250W' },
  { brand: 'nvidia', name: 'GTX 470', arch: 'Fermi', year: 2010, tier: 'high', vram: '1.28 GB GDDR5', tflops: '1.08', bandwidth: '133.9 GB/s', tdp: '215W' },
  { brand: 'nvidia', name: 'GTX 465', arch: 'Fermi', year: 2010, tier: 'high', vram: '1 GB GDDR5', tflops: '0.85', bandwidth: '102.6 GB/s', tdp: '200W' },
  { brand: 'nvidia', name: 'GTX 460', arch: 'Fermi', year: 2010, tier: 'mid', vram: '1 GB GDDR5', tflops: '0.90', bandwidth: '115.2 GB/s', tdp: '160W' },
  { brand: 'amd', name: 'Radeon HD 5970', arch: 'TeraScale 2', year: 2009, tier: 'ultra', vram: '2 GB GDDR5', tflops: '4.64', bandwidth: '256.0 GB/s', tdp: '297W' },
  { brand: 'amd', name: 'Radeon HD 5870', arch: 'TeraScale 2', year: 2009, tier: 'high', vram: '1 GB GDDR5', tflops: '2.72', bandwidth: '153.6 GB/s', tdp: '188W' },
  { brand: 'amd', name: 'Radeon HD 5850', arch: 'TeraScale 2', year: 2009, tier: 'high', vram: '1 GB GDDR5', tflops: '2.08', bandwidth: '128.0 GB/s', tdp: '151W' },
  { brand: 'amd', name: 'Radeon HD 5770', arch: 'TeraScale 2', year: 2009, tier: 'mid', vram: '1 GB GDDR5', tflops: '1.36', bandwidth: '76.8 GB/s', tdp: '108W' },

  // Generación 2010-2011 (Fermi Refresh / TeraScale 3)
  { brand: 'nvidia', name: 'GTX 590', arch: 'Fermi 2.0', year: 2011, tier: 'ultra', vram: '3 GB GDDR5', tflops: '2.48', bandwidth: '327.7 GB/s', tdp: '365W' },
  { brand: 'nvidia', name: 'GTX 580', arch: 'Fermi 2.0', year: 2010, tier: 'high', vram: '1.5 GB GDDR5', tflops: '1.58', bandwidth: '192.4 GB/s', tdp: '244W' },
  { brand: 'nvidia', name: 'GTX 570', arch: 'Fermi 2.0', year: 2010, tier: 'high', vram: '1.28 GB GDDR5', tflops: '1.40', bandwidth: '152.0 GB/s', tdp: '219W' },
  { brand: 'nvidia', name: 'GTX 560 Ti', arch: 'Fermi 2.0', year: 2011, tier: 'mid', vram: '1 GB GDDR5', tflops: '1.26', bandwidth: '128.3 GB/s', tdp: '170W' },
  { brand: 'nvidia', name: 'GTX 560', arch: 'Fermi 2.0', year: 2011, tier: 'mid', vram: '1 GB GDDR5', tflops: '1.07', bandwidth: '128.3 GB/s', tdp: '150W' },
  { brand: 'amd', name: 'Radeon HD 6990', arch: 'TeraScale 3', year: 2011, tier: 'ultra', vram: '4 GB GDDR5', tflops: '5.10', bandwidth: '320.0 GB/s', tdp: '375W' },
  { brand: 'amd', name: 'Radeon HD 6970', arch: 'TeraScale 3', year: 2010, tier: 'high', vram: '2 GB GDDR5', tflops: '2.70', bandwidth: '176.0 GB/s', tdp: '250W' },
  { brand: 'amd', name: 'Radeon HD 6870', arch: 'TeraScale 3', year: 2010, tier: 'mid', vram: '1 GB GDDR5', tflops: '2.01', bandwidth: '134.4 GB/s', tdp: '151W' },

  // Generación 2012-2013 (Kepler / GCN 1.0)
  { brand: 'nvidia', name: 'GTX 690', arch: 'Kepler', year: 2012, tier: 'ultra', vram: '4 GB GDDR5', tflops: '5.62', bandwidth: '384.4 GB/s', tdp: '300W' },
  { brand: 'nvidia', name: 'GTX 680', arch: 'Kepler', year: 2012, tier: 'high', vram: '2 GB GDDR5', tflops: '3.09', bandwidth: '192.2 GB/s', tdp: '195W' },
  { brand: 'nvidia', name: 'GTX 670', arch: 'Kepler', year: 2012, tier: 'high', vram: '2 GB GDDR5', tflops: '2.46', bandwidth: '192.2 GB/s', tdp: '170W' },
  { brand: 'nvidia', name: 'GTX 660 Ti', arch: 'Kepler', year: 2012, tier: 'mid', vram: '2 GB GDDR5', tflops: '2.46', bandwidth: '144.2 GB/s', tdp: '150W' },
  { brand: 'nvidia', name: 'GTX 660', arch: 'Kepler', year: 2012, tier: 'mid', vram: '2 GB GDDR5', tflops: '1.88', bandwidth: '144.2 GB/s', tdp: '140W' },
  { brand: 'nvidia', name: 'GTX 650 Ti', arch: 'Kepler', year: 2012, tier: 'entry', vram: '1 GB GDDR5', tflops: '1.42', bandwidth: '86.4 GB/s', tdp: '110W' },
  { brand: 'amd', name: 'Radeon HD 7990', arch: 'GCN 1.0', year: 2013, tier: 'ultra', vram: '6 GB GDDR5', tflops: '8.19', bandwidth: '576.0 GB/s', tdp: '375W' },
  { brand: 'amd', name: 'Radeon HD 7970 GHz Ed.', arch: 'GCN 1.0', year: 2012, tier: 'high', vram: '3 GB GDDR5', tflops: '4.30', bandwidth: '288.0 GB/s', tdp: '250W' },
  { brand: 'amd', name: 'Radeon HD 7970', arch: 'GCN 1.0', year: 2011, tier: 'high', vram: '3 GB GDDR5', tflops: '3.79', bandwidth: '264.0 GB/s', tdp: '250W' },
  { brand: 'amd', name: 'Radeon HD 7950', arch: 'GCN 1.0', year: 2012, tier: 'high', vram: '3 GB GDDR5', tflops: '2.86', bandwidth: '240.0 GB/s', tdp: '200W' },
  { brand: 'amd', name: 'Radeon HD 7870', arch: 'GCN 1.0', year: 2012, tier: 'mid', vram: '2 GB GDDR5', tflops: '2.56', bandwidth: '153.6 GB/s', tdp: '175W' },
  { brand: 'amd', name: 'Radeon HD 7850', arch: 'GCN 1.0', year: 2012, tier: 'mid', vram: '2 GB GDDR5', tflops: '1.76', bandwidth: '153.6 GB/s', tdp: '130W' },

  // Generación 2013-2014 (Kepler Refresh / GCN 2.0)
  { brand: 'nvidia', name: 'GTX TITAN Black', arch: 'Kepler', year: 2014, tier: 'ultra', vram: '6 GB GDDR5', tflops: '5.12', bandwidth: '336.0 GB/s', tdp: '250W' },
  { brand: 'nvidia', name: 'GTX TITAN', arch: 'Kepler', year: 2013, tier: 'ultra', vram: '6 GB GDDR5', tflops: '4.50', bandwidth: '288.4 GB/s', tdp: '250W' },
  { brand: 'nvidia', name: 'GTX 780 Ti', arch: 'Kepler', year: 2013, tier: 'high', vram: '3 GB GDDR5', tflops: '5.04', bandwidth: '336.0 GB/s', tdp: '250W' },
  { brand: 'nvidia', name: 'GTX 780', arch: 'Kepler', year: 2013, tier: 'high', vram: '3 GB GDDR5', tflops: '3.97', bandwidth: '288.4 GB/s', tdp: '250W' },
  { brand: 'nvidia', name: 'GTX 770', arch: 'Kepler', year: 2013, tier: 'high', vram: '2 GB GDDR5', tflops: '3.21', bandwidth: '224.3 GB/s', tdp: '230W' },
  { brand: 'nvidia', name: 'GTX 760', arch: 'Kepler', year: 2013, tier: 'mid', vram: '2 GB GDDR5', tflops: '2.25', bandwidth: '192.2 GB/s', tdp: '170W' },
  { brand: 'amd', name: 'Radeon R9 295X2', arch: 'GCN 2.0', year: 2014, tier: 'ultra', vram: '8 GB GDDR5', tflops: '11.46', bandwidth: '640.0 GB/s', tdp: '500W' },
  { brand: 'amd', name: 'Radeon R9 290X', arch: 'GCN 2.0', year: 2013, tier: 'high', vram: '4 GB GDDR5', tflops: '5.63', bandwidth: '320.0 GB/s', tdp: '290W' },
  { brand: 'amd', name: 'Radeon R9 290', arch: 'GCN 2.0', year: 2013, tier: 'high', vram: '4 GB GDDR5', tflops: '4.84', bandwidth: '320.0 GB/s', tdp: '275W' },
  { brand: 'amd', name: 'Radeon R9 280X', arch: 'GCN 1.0', year: 2013, tier: 'mid', vram: '3 GB GDDR5', tflops: '3.48', bandwidth: '288.0 GB/s', tdp: '250W' },
  { brand: 'amd', name: 'Radeon R9 270X', arch: 'GCN 1.0', year: 2013, tier: 'mid', vram: '2 GB GDDR5', tflops: '2.68', bandwidth: '179.2 GB/s', tdp: '180W' },

  // Generación 2014-2015 (Maxwell / GCN 3.0)
  { brand: 'nvidia', name: 'GTX TITAN X', arch: 'Maxwell', year: 2015, tier: 'ultra', vram: '12 GB GDDR5', tflops: '6.06', bandwidth: '336.5 GB/s', tdp: '250W' },
  { brand: 'nvidia', name: 'GTX 980 Ti', arch: 'Maxwell', year: 2015, tier: 'ultra', vram: '6 GB GDDR5', tflops: '5.63', bandwidth: '336.5 GB/s', tdp: '250W' },
  { brand: 'nvidia', name: 'GTX 980', arch: 'Maxwell', year: 2014, tier: 'high', vram: '4 GB GDDR5', tflops: '4.61', bandwidth: '224.3 GB/s', tdp: '165W' },
  { brand: 'nvidia', name: 'GTX 970', arch: 'Maxwell', year: 2014, tier: 'high', vram: '3.5 GB GDDR5', tflops: '3.49', bandwidth: '224.3 GB/s', tdp: '145W' },
  { brand: 'nvidia', name: 'GTX 960', arch: 'Maxwell', year: 2015, tier: 'mid', vram: '2 GB GDDR5', tflops: '2.30', bandwidth: '112.1 GB/s', tdp: '120W' },
  { brand: 'nvidia', name: 'GTX 950', arch: 'Maxwell', year: 2015, tier: 'entry', vram: '2 GB GDDR5', tflops: '1.57', bandwidth: '105.6 GB/s', tdp: '90W' },
  { brand: 'nvidia', name: 'GTX 750 Ti', arch: 'Maxwell', year: 2014, tier: 'entry', vram: '2 GB GDDR5', tflops: '1.30', bandwidth: '86.4 GB/s', tdp: '60W' },
  { brand: 'amd', name: 'Radeon R9 Fury X', arch: 'GCN 3.0', year: 2015, tier: 'ultra', vram: '4 GB HBM', tflops: '8.60', bandwidth: '512.0 GB/s', tdp: '275W' },
  { brand: 'amd', name: 'Radeon R9 Fury', arch: 'GCN 3.0', year: 2015, tier: 'high', vram: '4 GB HBM', tflops: '7.16', bandwidth: '512.0 GB/s', tdp: '275W' },
  { brand: 'amd', name: 'Radeon R9 Nano', arch: 'GCN 3.0', year: 2015, tier: 'high', vram: '4 GB HBM', tflops: '8.19', bandwidth: '512.0 GB/s', tdp: '175W' },
  { brand: 'amd', name: 'Radeon R9 390X', arch: 'GCN 2.0', year: 2015, tier: 'high', vram: '8 GB GDDR5', tflops: '5.90', bandwidth: '384.0 GB/s', tdp: '275W' },
  { brand: 'amd', name: 'Radeon R9 390', arch: 'GCN 2.0', year: 2015, tier: 'high', vram: '8 GB GDDR5', tflops: '5.12', bandwidth: '384.0 GB/s', tdp: '275W' },
  { brand: 'amd', name: 'Radeon R9 380X', arch: 'GCN 3.0', year: 2015, tier: 'mid', vram: '4 GB GDDR5', tflops: '3.97', bandwidth: '182.4 GB/s', tdp: '190W' },
  { brand: 'amd', name: 'Radeon R9 380', arch: 'GCN 3.0', year: 2015, tier: 'mid', vram: '4 GB GDDR5', tflops: '3.48', bandwidth: '176.0 GB/s', tdp: '190W' },

  // Generación 2016-2017 (Pascal / Polaris / Vega)
  { brand: 'nvidia', name: 'TITAN Xp', arch: 'Pascal', year: 2017, tier: 'ultra', vram: '12 GB GDDR5X', tflops: '12.15', bandwidth: '547.7 GB/s', tdp: '250W' },
  { brand: 'nvidia', name: 'GTX 1080 Ti', arch: 'Pascal', year: 2017, tier: 'ultra', vram: '11 GB GDDR5X', tflops: '11.34', bandwidth: '484.4 GB/s', tdp: '250W' },
  { brand: 'nvidia', name: 'GTX 1080', arch: 'Pascal', year: 2016, tier: 'high', vram: '8 GB GDDR5X', tflops: '8.87', bandwidth: '320.3 GB/s', tdp: '180W' },
  { brand: 'nvidia', name: 'GTX 1070 Ti', arch: 'Pascal', year: 2017, tier: 'high', vram: '8 GB GDDR5', tflops: '8.19', bandwidth: '256.3 GB/s', tdp: '180W' },
  { brand: 'nvidia', name: 'GTX 1070', arch: 'Pascal', year: 2016, tier: 'high', vram: '8 GB GDDR5', tflops: '6.46', bandwidth: '256.3 GB/s', tdp: '150W' },
  { brand: 'nvidia', name: 'GTX 1060 (6GB)', arch: 'Pascal', year: 2016, tier: 'mid', vram: '6 GB GDDR5', tflops: '4.37', bandwidth: '192.2 GB/s', tdp: '120W' },
  { brand: 'nvidia', name: 'GTX 1050 Ti', arch: 'Pascal', year: 2016, tier: 'entry', vram: '4 GB GDDR5', tflops: '2.14', bandwidth: '112.1 GB/s', tdp: '75W' },
  { brand: 'amd', name: 'Radeon RX 590', arch: 'Polaris', year: 2018, tier: 'mid', vram: '8 GB GDDR5', tflops: '7.12', bandwidth: '256.0 GB/s', tdp: '225W' },
  { brand: 'amd', name: 'Radeon RX 580', arch: 'Polaris', year: 2017, tier: 'mid', vram: '8 GB GDDR5', tflops: '6.17', bandwidth: '256.0 GB/s', tdp: '185W' },
  { brand: 'amd', name: 'Radeon RX 570', arch: 'Polaris', year: 2017, tier: 'mid', vram: '4 GB GDDR5', tflops: '5.10', bandwidth: '224.0 GB/s', tdp: '150W' },
  { brand: 'amd', name: 'Radeon RX Vega 64', arch: 'Vega', year: 2017, tier: 'high', vram: '8 GB HBM2', tflops: '12.58', bandwidth: '483.8 GB/s', tdp: '295W' },
  { brand: 'amd', name: 'Radeon RX Vega 56', arch: 'Vega', year: 2017, tier: 'high', vram: '8 GB HBM2', tflops: '10.54', bandwidth: '410.0 GB/s', tdp: '210W' },

  // Generación 2018-2019 (Turing / RDNA 1)
  { brand: 'nvidia', name: 'RTX 2080 Ti', arch: 'Turing', year: 2018, tier: 'ultra', vram: '11 GB GDDR6', tflops: '13.45', bandwidth: '616.0 GB/s', tdp: '250W' },
  { brand: 'nvidia', name: 'RTX 2080 SUPER', arch: 'Turing', year: 2019, tier: 'high', vram: '8 GB GDDR6', tflops: '11.15', bandwidth: '496.0 GB/s', tdp: '250W' },
  { brand: 'nvidia', name: 'RTX 2080', arch: 'Turing', year: 2018, tier: 'high', vram: '8 GB GDDR6', tflops: '10.07', bandwidth: '448.0 GB/s', tdp: '215W' },
  { brand: 'nvidia', name: 'RTX 2070 SUPER', arch: 'Turing', year: 2019, tier: 'high', vram: '8 GB GDDR6', tflops: '9.06', bandwidth: '448.0 GB/s', tdp: '215W' },
  { brand: 'nvidia', name: 'RTX 2070', arch: 'Turing', year: 2018, tier: 'high', vram: '8 GB GDDR6', tflops: '7.46', bandwidth: '448.0 GB/s', tdp: '175W' },
  { brand: 'nvidia', name: 'RTX 2060 SUPER', arch: 'Turing', year: 2019, tier: 'mid', vram: '8 GB GDDR6', tflops: '7.18', bandwidth: '448.0 GB/s', tdp: '175W' },
  { brand: 'nvidia', name: 'RTX 2060', arch: 'Turing', year: 2019, tier: 'mid', vram: '6 GB GDDR6', tflops: '6.45', bandwidth: '336.0 GB/s', tdp: '160W' },
  { brand: 'nvidia', name: 'GTX 1660 Ti', arch: 'Turing', year: 2019, tier: 'mid', vram: '6 GB GDDR6', tflops: '5.44', bandwidth: '288.0 GB/s', tdp: '120W' },
  { brand: 'nvidia', name: 'GTX 1660 SUPER', arch: 'Turing', year: 2019, tier: 'mid', vram: '6 GB GDDR6', tflops: '5.02', bandwidth: '336.0 GB/s', tdp: '125W' },
  { brand: 'nvidia', name: 'GTX 1660', arch: 'Turing', year: 2019, tier: 'mid', vram: '6 GB GDDR5', tflops: '5.03', bandwidth: '192.1 GB/s', tdp: '120W' },
  { brand: 'nvidia', name: 'GTX 1650 SUPER', arch: 'Turing', year: 2019, tier: 'entry', vram: '4 GB GDDR6', tflops: '4.42', bandwidth: '192.0 GB/s', tdp: '100W' },
  { brand: 'amd', name: 'Radeon RX 5700 XT', arch: 'RDNA 1', year: 2019, tier: 'high', vram: '8 GB GDDR6', tflops: '9.75', bandwidth: '448.0 GB/s', tdp: '225W' },
  { brand: 'amd', name: 'Radeon RX 5700', arch: 'RDNA 1', year: 2019, tier: 'high', vram: '8 GB GDDR6', tflops: '7.95', bandwidth: '448.0 GB/s', tdp: '180W' },
  { brand: 'amd', name: 'Radeon RX 5600 XT', arch: 'RDNA 1', year: 2020, tier: 'mid', vram: '6 GB GDDR6', tflops: '7.19', bandwidth: '288.0 GB/s', tdp: '150W' },
  { brand: 'amd', name: 'Radeon RX 5500 XT', arch: 'RDNA 1', year: 2019, tier: 'entry', vram: '8 GB GDDR6', tflops: '5.20', bandwidth: '224.0 GB/s', tdp: '130W' },

  // Generación 2020-2021 (Ampere / RDNA 2)
  { brand: 'nvidia', name: 'RTX 3090 Ti', arch: 'Ampere', year: 2022, tier: 'ultra', vram: '24 GB GDDR6X', tflops: '40.0', bandwidth: '1008 GB/s', tdp: '450W' },
  { brand: 'nvidia', name: 'RTX 3090', arch: 'Ampere', year: 2020, tier: 'ultra', vram: '24 GB GDDR6X', tflops: '35.58', bandwidth: '936.2 GB/s', tdp: '350W' },
  { brand: 'nvidia', name: 'RTX 3080 Ti', arch: 'Ampere', year: 2021, tier: 'high', vram: '12 GB GDDR6X', tflops: '34.10', bandwidth: '912.4 GB/s', tdp: '350W' },
  { brand: 'nvidia', name: 'RTX 3080', arch: 'Ampere', year: 2020, tier: 'high', vram: '10 GB GDDR6X', tflops: '29.77', bandwidth: '760.3 GB/s', tdp: '320W' },
  { brand: 'nvidia', name: 'RTX 3070 Ti', arch: 'Ampere', year: 2021, tier: 'high', vram: '8 GB GDDR6X', tflops: '21.75', bandwidth: '608.3 GB/s', tdp: '290W' },
  { brand: 'nvidia', name: 'RTX 3070', arch: 'Ampere', year: 2020, tier: 'high', vram: '8 GB GDDR6', tflops: '20.31', bandwidth: '448.0 GB/s', tdp: '220W' },
  { brand: 'nvidia', name: 'RTX 3060 Ti', arch: 'Ampere', year: 2020, tier: 'mid', vram: '8 GB GDDR6', tflops: '16.20', bandwidth: '448.0 GB/s', tdp: '200W' },
  { brand: 'nvidia', name: 'RTX 3060', arch: 'Ampere', year: 2021, tier: 'mid', vram: '12 GB GDDR6', tflops: '12.74', bandwidth: '360.0 GB/s', tdp: '170W' },
  { brand: 'nvidia', name: 'RTX 3050', arch: 'Ampere', year: 2022, tier: 'entry', vram: '8 GB GDDR6', tflops: '9.10', bandwidth: '224.0 GB/s', tdp: '130W' },
  { brand: 'amd', name: 'Radeon RX 6950 XT', arch: 'RDNA 2', year: 2022, tier: 'ultra', vram: '16 GB GDDR6', tflops: '23.65', bandwidth: '576.0 GB/s', tdp: '335W' },
  { brand: 'amd', name: 'Radeon RX 6900 XT', arch: 'RDNA 2', year: 2020, tier: 'ultra', vram: '16 GB GDDR6', tflops: '23.04', bandwidth: '512.0 GB/s', tdp: '300W' },
  { brand: 'amd', name: 'Radeon RX 6800 XT', arch: 'RDNA 2', year: 2020, tier: 'high', vram: '16 GB GDDR6', tflops: '20.74', bandwidth: '512.0 GB/s', tdp: '300W' },
  { brand: 'amd', name: 'Radeon RX 6800', arch: 'RDNA 2', year: 2020, tier: 'high', vram: '16 GB GDDR6', tflops: '16.17', bandwidth: '512.0 GB/s', tdp: '250W' },
  { brand: 'amd', name: 'Radeon RX 6750 XT', arch: 'RDNA 2', year: 2022, tier: 'high', vram: '12 GB GDDR6', tflops: '13.31', bandwidth: '432.0 GB/s', tdp: '250W' },
  { brand: 'amd', name: 'Radeon RX 6700 XT', arch: 'RDNA 2', year: 2021, tier: 'high', vram: '12 GB GDDR6', tflops: '13.21', bandwidth: '384.0 GB/s', tdp: '230W' },
  { brand: 'amd', name: 'Radeon RX 6650 XT', arch: 'RDNA 2', year: 2022, tier: 'mid', vram: '8 GB GDDR6', tflops: '10.79', bandwidth: '280.0 GB/s', tdp: '180W' },
  { brand: 'amd', name: 'Radeon RX 6600 XT', arch: 'RDNA 2', year: 2021, tier: 'mid', vram: '8 GB GDDR6', tflops: '10.60', bandwidth: '256.0 GB/s', tdp: '160W' },
  { brand: 'amd', name: 'Radeon RX 6600', arch: 'RDNA 2', year: 2021, tier: 'mid', vram: '8 GB GDDR6', tflops: '8.92', bandwidth: '224.0 GB/s', tdp: '132W' },
  { brand: 'amd', name: 'Radeon RX 6500 XT', arch: 'RDNA 2', year: 2022, tier: 'entry', vram: '4 GB GDDR6', tflops: '5.77', bandwidth: '144.0 GB/s', tdp: '107W' },

  // Generación 2022-2023 (Ada Lovelace / RDNA 3 / Alchemist)
  { brand: 'nvidia', name: 'RTX 4090', arch: 'Ada Lovelace', year: 2022, tier: 'ultra', vram: '24 GB GDDR6X', tflops: '82.58', bandwidth: '1008 GB/s', tdp: '450W' },
  { brand: 'nvidia', name: 'RTX 4080 SUPER', arch: 'Ada Lovelace', year: 2024, tier: 'high', vram: '16 GB GDDR6X', tflops: '52.22', bandwidth: '736 GB/s', tdp: '320W' },
  { brand: 'nvidia', name: 'RTX 4080', arch: 'Ada Lovelace', year: 2022, tier: 'high', vram: '16 GB GDDR6X', tflops: '48.74', bandwidth: '716.8 GB/s', tdp: '320W' },
  { brand: 'nvidia', name: 'RTX 4070 Ti SUPER', arch: 'Ada Lovelace', year: 2024, tier: 'high', vram: '16 GB GDDR6X', tflops: '40.0', bandwidth: '672 GB/s', tdp: '285W' },
  { brand: 'nvidia', name: 'RTX 4070 Ti', arch: 'Ada Lovelace', year: 2023, tier: 'high', vram: '12 GB GDDR6X', tflops: '40.09', bandwidth: '504 GB/s', tdp: '285W' },
  { brand: 'nvidia', name: 'RTX 4070 SUPER', arch: 'Ada Lovelace', year: 2024, tier: 'high', vram: '12 GB GDDR6X', tflops: '35.48', bandwidth: '504 GB/s', tdp: '220W' },
  { brand: 'nvidia', name: 'RTX 4070', arch: 'Ada Lovelace', year: 2023, tier: 'high', vram: '12 GB GDDR6X', tflops: '29.15', bandwidth: '504 GB/s', tdp: '200W' },
  { brand: 'nvidia', name: 'RTX 4060 Ti (16GB)', arch: 'Ada Lovelace', year: 2023, tier: 'mid', vram: '16 GB GDDR6', tflops: '22.06', bandwidth: '288 GB/s', tdp: '165W' },
  { brand: 'nvidia', name: 'RTX 4060 Ti', arch: 'Ada Lovelace', year: 2023, tier: 'mid', vram: '8 GB GDDR6', tflops: '22.06', bandwidth: '288 GB/s', tdp: '160W' },
  { brand: 'nvidia', name: 'RTX 4060', arch: 'Ada Lovelace', year: 2023, tier: 'mid', vram: '8 GB GDDR6', tflops: '15.11', bandwidth: '272 GB/s', tdp: '115W' },
  { brand: 'amd', name: 'Radeon RX 7900 XTX', arch: 'RDNA 3', year: 2022, tier: 'ultra', vram: '24 GB GDDR6', tflops: '61.42', bandwidth: '960 GB/s', tdp: '355W' },
  { brand: 'amd', name: 'Radeon RX 7900 XT', arch: 'RDNA 3', year: 2022, tier: 'ultra', vram: '20 GB GDDR6', tflops: '51.61', bandwidth: '800 GB/s', tdp: '315W' },
  { brand: 'amd', name: 'Radeon RX 7900 GRE', arch: 'RDNA 3', year: 2024, tier: 'high', vram: '16 GB GDDR6', tflops: '45.98', bandwidth: '576 GB/s', tdp: '260W' },
  { brand: 'amd', name: 'Radeon RX 7800 XT', arch: 'RDNA 3', year: 2023, tier: 'high', vram: '16 GB GDDR6', tflops: '37.32', bandwidth: '624 GB/s', tdp: '263W' },
  { brand: 'amd', name: 'Radeon RX 7700 XT', arch: 'RDNA 3', year: 2023, tier: 'mid', vram: '12 GB GDDR6', tflops: '35.17', bandwidth: '432 GB/s', tdp: '245W' },
  { brand: 'amd', name: 'Radeon RX 7600 XT', arch: 'RDNA 3', year: 2024, tier: 'mid', vram: '16 GB GDDR6', tflops: '22.57', bandwidth: '288 GB/s', tdp: '190W' },
  { brand: 'amd', name: 'Radeon RX 7600', arch: 'RDNA 3', year: 2023, tier: 'mid', vram: '8 GB GDDR6', tflops: '21.75', bandwidth: '288 GB/s', tdp: '165W' },
  { brand: 'intel', name: 'Arc A770', arch: 'Alchemist', year: 2022, tier: 'mid', vram: '16 GB GDDR6', tflops: '19.66', bandwidth: '560 GB/s', tdp: '225W' },
  { brand: 'intel', name: 'Arc A750', arch: 'Alchemist', year: 2022, tier: 'mid', vram: '8 GB GDDR6', tflops: '17.20', bandwidth: '512 GB/s', tdp: '225W' },
  { brand: 'intel', name: 'Arc A580', arch: 'Alchemist', year: 2023, tier: 'entry', vram: '8 GB GDDR6', tflops: '12.0', bandwidth: '512 GB/s', tdp: '185W' },

  // Generación 2024-2025 (Blackwell / RDNA 4 / Battlemage)
  { brand: 'nvidia', name: 'RTX 5090', arch: 'Blackwell', year: 2025, tier: 'ultra', vram: '32 GB GDDR7', tflops: '209.8', bandwidth: '1792 GB/s', tdp: '575W' },
  { brand: 'nvidia', name: 'RTX 5090 Laptop', arch: 'Blackwell', year: 2025, tier: 'ultra', vram: '16 GB GDDR7', tflops: '52.4', bandwidth: '512 GB/s', tdp: '175W' },
  { brand: 'nvidia', name: 'RTX 5080', arch: 'Blackwell', year: 2025, tier: 'high', vram: '16 GB GDDR7', tflops: '102.5', bandwidth: '1024 GB/s', tdp: '350W' },
  { brand: 'nvidia', name: 'RTX 5080 Laptop', arch: 'Blackwell', year: 2025, tier: 'high', vram: '12 GB GDDR7', tflops: '38.2', bandwidth: '432 GB/s', tdp: '150W' },
  { brand: 'nvidia', name: 'RTX 5070 Ti', arch: 'Blackwell', year: 2025, tier: 'high', vram: '16 GB GDDR7', tflops: '65.5', bandwidth: '640 GB/s', tdp: '275W' },
  { brand: 'nvidia', name: 'RTX 5070', arch: 'Blackwell', year: 2025, tier: 'high', vram: '12 GB GDDR7', tflops: '50.2', bandwidth: '576 GB/s', tdp: '220W' },
  { brand: 'nvidia', name: 'RTX 5070 Laptop', arch: 'Blackwell', year: 2025, tier: 'mid', vram: '8 GB GDDR7', tflops: '24.5', bandwidth: '320 GB/s', tdp: '115W' },
  { brand: 'nvidia', name: 'RTX 5060 Ti', arch: 'Blackwell', year: 2025, tier: 'mid', vram: '8 GB GDDR7', tflops: '32.1', bandwidth: '448 GB/s', tdp: '170W' },
  { brand: 'amd', name: 'Radeon RX 9070 XT', arch: 'RDNA 4', year: 2025, tier: 'high', vram: '16 GB GDDR6', tflops: '73.0', bandwidth: '640 GB/s', tdp: '304W' },
  { brand: 'amd', name: 'Radeon RX 9070', arch: 'RDNA 4', year: 2025, tier: 'high', vram: '16 GB GDDR6', tflops: '58.4', bandwidth: '576 GB/s', tdp: '250W' },
  { brand: 'intel', name: 'Arc B580', arch: 'Battlemage', year: 2024, tier: 'mid', vram: '12 GB GDDR6', tflops: '24.6', bandwidth: '456 GB/s', tdp: '190W' }
];
