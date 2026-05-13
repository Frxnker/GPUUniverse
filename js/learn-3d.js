document.addEventListener('DOMContentLoaded', () => {
  // Configuración de la escena Three.js
  const container = document.getElementById('canvas-container');
  if (!container) return;

  const scene = new THREE.Scene();
  // El fondo se deja transparente para que se vea el CSS
  scene.background = null; 

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(15, 12, 18);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxDistance = 40;
  controls.minDistance = 5;

  // Iluminación
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(10, 20, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0x8b45ff, 0.4);
  fillLight.position.set(-10, 0, -10);
  scene.add(fillLight);

  const accentLight = new THREE.PointLight(0x00e5ff, 0.5, 50);
  accentLight.position.set(5, 5, 5);
  scene.add(accentLight);

  // Materiales
  const matPCB = new THREE.MeshStandardMaterial({ color: 0x112211, roughness: 0.8, metalness: 0.2 });
  const matDie = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.1, metalness: 0.8, emissive: 0x111111 });
  const matVRAM = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7, metalness: 0.3 });
  const matVRM = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.5 });
  const matHeatsink = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.4, metalness: 0.7 });
  const matShroud = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.6, metalness: 0.2 });
  const matFan = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.5, metalness: 0.1 });
  const matGold = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.9 });
  const matBracket = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.4, metalness: 0.8 });

  // Grupos para capas
  const gpuGroup = new THREE.Group();
  scene.add(gpuGroup);

  const layerPCB = new THREE.Group();
  const layerHeatsink = new THREE.Group();
  const layerShroud = new THREE.Group();

  gpuGroup.add(layerPCB);
  gpuGroup.add(layerHeatsink);
  gpuGroup.add(layerShroud);

  // Diccionario de partes para interacciones
  const partsData = {};
  const interactableObjects = [];

  function createPart(mesh, name, group, data) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { name: name };
    group.add(mesh);
    interactableObjects.push(mesh);
    partsData[name] = data;
    return mesh;
  }

  // --- CONSTRUCCIÓN CAPA 1: PCB ---
  
  // Placa Base (PCB)
  const pcbGeo = new THREE.BoxGeometry(16, 0.2, 8);
  createPart(new THREE.Mesh(pcbGeo, matPCB), 'PCB', layerPCB, {
    title: 'Placa de Circuito Impreso (PCB)',
    desc: 'El corazón que conecta todo. Un PCB moderno de GPU tiene entre 10 y 16 capas internas de cobre trenzado para enrutar datos de memoria a alta velocidad y distribuir energía.',
    stats: [
      { label: 'Capas típicas', value: '12-16 layers' },
      { label: 'Material', value: 'FR4 + Cobre' },
      { label: 'Función', value: 'Enrutamiento de señales' }
    ]
  });

  // Conector PCIe
  const pcieGeo = new THREE.BoxGeometry(8, 0.5, 0.4);
  const pcie = createPart(new THREE.Mesh(pcieGeo, matGold), 'PCIe', layerPCB, {
    title: 'Conector PCIe x16',
    desc: 'La interfaz principal entre la GPU y la placa base. Utiliza 16 carriles de datos de altísima velocidad para transferir gigabytes de texturas por segundo.',
    stats: [
      { label: 'Estándar Actual', value: 'PCIe 4.0 / 5.0' },
      { label: 'Ancho de Banda', value: 'Hasta 64 GB/s' },
      { label: 'Contactos', value: 'Oro de 15 micras' }
    ]
  });
  pcie.position.set(-2, -0.35, 3.8);

  // GPU Die (El Chip Principal)
  const dieGeo = new THREE.BoxGeometry(2.5, 0.1, 2.5);
  const die = createPart(new THREE.Mesh(dieGeo, matDie), 'GPU Die', layerPCB, {
    title: 'Chip Gráfico (GPU Die)',
    desc: 'El cerebro de la tarjeta. Un pedazo de silicio extremadamente complejo que contiene miles de núcleos de procesamiento, caché L2, y controladores de memoria.',
    stats: [
      { label: 'Transistores', value: 'Hasta 76 Billones' },
      { label: 'Proceso de fabric.', value: '4nm / 3nm' },
      { label: 'Función', value: 'Cálculo paralelo masivo' }
    ]
  });
  die.position.set(0, 0.15, 0);

  // VRAM Chips (Memoria)
  const vramGeo = new THREE.BoxGeometry(0.8, 0.1, 1.2);
  const vramPositions = [
    [-1.8, 0, -1.8], [0, 0, -1.8], [1.8, 0, -1.8], // Top
    [-1.8, 0, 1.8], [0, 0, 1.8], [1.8, 0, 1.8],    // Bottom
    [-2.2, 0, 0], [2.2, 0, 0]                      // Sides
  ];
  
  vramPositions.forEach((pos, i) => {
    const vram = createPart(new THREE.Mesh(vramGeo, matVRAM), 'VRAM', layerPCB, {
      title: 'Memoria de Video (VRAM)',
      desc: 'Almacena temporalmente los datos que necesita el chip gráfico: texturas, modelos, buffers. Usualmente tecnología GDDR6X o HBM conectada a un bus de 256 a 384 bits.',
      stats: [
        { label: 'Tipo común', value: 'GDDR6X' },
        { label: 'Velocidad', value: '21 Gbps +' },
        { label: 'Capacidad por chip', value: '1GB - 2GB' }
      ]
    });
    vram.position.set(pos[0], 0.15, pos[1]);
    if (i >= 6) vram.rotation.y = Math.PI / 2;
  });

  // VRMs (Fases de Alimentación)
  const vrmGeo = new THREE.BoxGeometry(0.4, 0.3, 0.4);
  for (let i = 0; i < 12; i++) {
    const vrm = createPart(new THREE.Mesh(vrmGeo, matVRM), 'VRM', layerPCB, {
      title: 'Sistema de Alimentación (VRM)',
      desc: 'Los Módulos Reguladores de Voltaje (VRM) convierten la energía bruta de 12V que viene de la fuente de alimentación a voltajes ultra-precisos (aprox 1V) que necesita la GPU.',
      stats: [
        { label: 'Fases típicas', value: '10 a 20+ fases' },
        { label: 'Amperaje máximo', value: 'Cientos de Amperios' },
        { label: 'Componentes', value: 'MOSFETs, Chokes, Caps' }
      ]
    });
    vrm.position.set(-6 + (i * 0.5), 0.25, -2.5);
  }

  // Conectores de poder
  const powerGeo = new THREE.BoxGeometry(1.2, 0.8, 0.8);
  const power = createPart(new THREE.Mesh(powerGeo, matVRM), 'Power', layerPCB, {
    title: 'Conector de Energía',
    desc: 'Los conectores de la fuente de poder (ej: 8-pin o el nuevo 12VHPWR) que entregan el suministro principal de energía a la tarjeta gráfica.',
    stats: [
      { label: 'Conector Moderno', value: '12VHPWR (16 pines)' },
      { label: 'Suministro máx.', value: 'Hasta 600W' }
    ]
  });
  power.position.set(7, 0.5, -3.5);

  // Bracket trasero
  const bracketGeo = new THREE.BoxGeometry(0.2, 3, 8.5);
  const bracket = createPart(new THREE.Mesh(bracketGeo, matBracket), 'IO Bracket', layerPCB, {
    title: 'Bracket I/O & Puertos',
    desc: 'Soporte metálico que ancla la tarjeta al chasis de la PC y aloja los puertos de salida de video.',
    stats: [
      { label: 'DisplayPort', value: 'DP 1.4a / 2.1' },
      { label: 'HDMI', value: 'HDMI 2.1a' }
    ]
  });
  bracket.position.set(-8.1, 1.4, 0);

  // --- CONSTRUCCIÓN CAPA 2: HEATSINK (Disipador) ---

  const hsGeo = new THREE.BoxGeometry(15.5, 1.2, 7.8);
  const heatsink = createPart(new THREE.Mesh(hsGeo, matHeatsink), 'Heatsink', layerHeatsink, {
    title: 'Disipador (Heatsink)',
    desc: 'Un bloque masivo de aletas de aluminio y heatpipes de cobre diseñado para absorber todo el calor generado por el chip gráfico y los VRM, aumentando la superficie de disipación.',
    stats: [
      { label: 'Material', value: 'Aluminio + Cobre' },
      { label: 'Heatpipes', value: '6 a 8 tubos capilares' },
      { label: 'Técnica extra', value: 'Cámara de Vapor (opcional)' }
    ]
  });
  heatsink.position.set(0.1, 0.8, 0);

  // --- CONSTRUCCIÓN CAPA 3: SHROUD y VENTILADORES ---

  const shroudGeo = new THREE.BoxGeometry(15.8, 0.5, 8);
  const shroud = createPart(new THREE.Mesh(shroudGeo, matShroud), 'Shroud', layerShroud, {
    title: 'Carcasa (Shroud)',
    desc: 'La cubierta exterior de plástico o metal que canaliza el flujo de aire de los ventiladores hacia el disipador y le da a la tarjeta su estética característica.',
    stats: [
      { label: 'Material', value: 'Plástico ABS o Aluminio' },
      { label: 'Función', value: 'Direccionar aire y Estética' }
    ]
  });
  shroud.position.set(0.1, 1.65, 0);

  // Ventiladores
  const fanGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.4, 32);
  const fans = [];
  [-4, 0, 4].forEach(x => {
    const fan = createPart(new THREE.Mesh(fanGeo, matFan), 'Fan', layerShroud, {
      title: 'Ventilador Axial',
      desc: 'Fuerza aire fresco del chasis a través de las aletas del disipador para arrastrar el calor. Las GPU modernas apagan los ventiladores cuando la temperatura es baja (0 RPM mode).',
      stats: [
        { label: 'Velocidad máx.', value: '~3000 RPM' },
        { label: 'Tipo de aspas', value: 'Presión estática' },
        { label: 'Rodamientos', value: 'Doble rodamiento o FDB' }
      ]
    });
    fan.position.set(x + 0.1, 1.9, 0);
    fans.push(fan);
  });

  // Centrar la GPU globalmente
  gpuGroup.position.y = -1;

  // Lógica de Capas (Layers)
  const btns = document.querySelectorAll('.layer-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const mode = btn.dataset.layer;
      if (mode === 'full') {
        layerShroud.visible = true;
        layerHeatsink.visible = true;
      } else if (mode === 'pcb-cooler') {
        layerShroud.visible = false;
        layerHeatsink.visible = true;
      } else if (mode === 'pcb-only') {
        layerShroud.visible = false;
        layerHeatsink.visible = false;
      }
      
      // Limpiar selección actual
      if (selectedMesh) unhighlight();
    });
  });

  // Animación del render
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    
    // Rotar ventiladores
    if (layerShroud.visible) {
      fans.forEach(fan => fan.rotation.y += delta * 15);
    }
    
    // Rotación suave global automática si no hay interacción
    if (!isDragging) {
       gpuGroup.rotation.y += delta * 0.1;
    }

    controls.update();
    renderer.render(scene, camera);
  }

  // Interacción (Raycaster)
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let selectedMesh = null;
  const originalColors = new Map();
  let isDragging = false;

  controls.addEventListener('start', () => { isDragging = true; });
  controls.addEventListener('end', () => { setTimeout(() => isDragging = false, 50); });

  window.addEventListener('click', (event) => {
    if (isDragging) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Solo buscar en objetos de capas actualmente visibles
    const visibleInteractables = interactableObjects.filter(obj => {
      let parent = obj.parent;
      while (parent) {
        if (!parent.visible) return false;
        parent = parent.parent;
      }
      return true;
    });

    const intersects = raycaster.intersectObjects(visibleInteractables);

    if (intersects.length > 0) {
      const obj = intersects[0].object;
      selectPart(obj);
    } else {
      unhighlight();
    }
  });

  // Para cambiar el cursor
  window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    
    const visibleInteractables = interactableObjects.filter(obj => {
      let parent = obj.parent;
      while (parent) {
        if (!parent.visible) return false;
        parent = parent.parent;
      }
      return true;
    });

    const intersects = raycaster.intersectObjects(visibleInteractables);
    if (intersects.length > 0) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'default';
    }
  });

  function selectPart(mesh) {
    unhighlight();
    selectedMesh = mesh;

    // Highlight
    if (!originalColors.has(mesh)) {
      originalColors.set(mesh, mesh.material.color.getHex());
    }
    
    // Un poco de glow cian
    mesh.material.color.setHex(0x00e5ff);
    if (mesh.material.emissive) {
        mesh.material.emissive.setHex(0x003344);
    }

    // Actualizar Panel
    const name = mesh.userData.name;
    const data = partsData[name];
    if (data) {
      document.getElementById('part-title').textContent = data.title;
      document.getElementById('part-desc').textContent = data.desc;
      
      const statsHtml = data.stats.map(s => `
        <div class="part-stat">
          <span class="part-stat-label">${s.label}</span>
          <span class="part-stat-value">${s.value}</span>
        </div>
      `).join('');
      
      document.getElementById('part-stats').innerHTML = statsHtml;
      document.getElementById('part-info-panel').classList.add('visible');
    }
  }

  function unhighlight() {
    if (selectedMesh) {
      if (originalColors.has(selectedMesh)) {
        selectedMesh.material.color.setHex(originalColors.get(selectedMesh));
        if (selectedMesh.material.emissive) {
          // Si era el Die que tenía emissive original
          selectedMesh.material.emissive.setHex(selectedMesh.userData.name === 'GPU Die' ? 0x111111 : 0x000000);
        }
      }
      selectedMesh = null;
    }
    document.getElementById('part-info-panel').classList.remove('visible');
  }

  // Responsive resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Iniciar
  animate();
});
