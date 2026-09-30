// ===== VISOR 3D DE UNA GPU (pages/learn.html) =====
// Script clásico: prepara los textos y la lista de piezas, comprueba WebGL y solo entonces carga
// Three.js (módulo ES local en vendor/three). Sin WebGL, las piezas se pueden leer igualmente.
(function () {
  const section = document.getElementById('learn-section');
  const container = document.getElementById('canvas-container');
  if (!section || !container) return;

  const T = key => window.tr(key, '');
  const THREE_URL = new URL('../vendor/three/three-viewer.min.js', document.currentScript.src).href;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Piezas del modelo. Las cifras de ejemplo son de la RTX 5090 (chip GB202), igual que en data.js:
  // 92.200 millones de transistores, 750 mm² y TSMC 4N; 32 GB GDDR7 en 16 chips con bus de 512 bits a 28 Gbps.
  // `v:` es una clave traducible de learn.val; el resto se muestra tal cual.
  const PARTS = {
    pcb: [['material', { v: 'pcb_material' }], ['function', { v: 'pcb_function' }]],
    pcie: [['standard', 'PCIe 5.0 x16'], ['bandwidth', { v: 'pcie_bw' }]],
    backplate: [['material', { v: 'backplate_material' }], ['function', { v: 'backplate_function' }]],
    die: [['chip', 'GB202 (RTX 5090)'], ['transistors', { v: 'transistors' }], ['process', 'TSMC 4N'], ['die_area', { v: 'area_750' }]],
    vram: [['type', 'GDDR7'], ['config', { v: 'vram_config' }], ['speed', { v: 'speed_28' }]],
    vrm: [['input', { v: 'volts_12' }], ['components', { v: 'vrm_components' }]],
    power: [['connector', { v: 'connector' }], ['max_power', { v: 'watts_600' }], ['pcie8', { v: 'watts_150' }]],
    io: [],
    heatsink: [['material', { v: 'hs_material' }], ['heat_transport', { v: 'hs_transport' }]],
    shroud: [['function', { v: 'shroud_function' }]],
    fan: [['idle', { v: 'fan_idle' }]]
  };
  const RTX_5090_EXAMPLES = ['die', 'vram'];
  // Capa en la que se ve cada pieza al elegirla en la lista (las demás son de la placa: 'pcb-only')
  const PART_LAYER = { heatsink: 'pcb-cooler', shroud: 'full', fan: 'full' };

  const els = {
    panel: document.getElementById('part-info-panel'),
    title: document.getElementById('part-title'),
    desc: document.getElementById('part-desc'),
    stats: document.getElementById('part-stats'),
    list: document.getElementById('part-list'),
    layerBtns: [...document.querySelectorAll('.layer-btn')]
  };
  const esc = window.escapeHtml;
  let selectedId = null;
  let viewer = null; // API del visor cuando WebGL está disponible

  function renderPart() {
    if (!selectedId) {
      els.title.textContent = T('learn.panel_title');
      els.desc.textContent = T('learn.part_hint');
      els.stats.innerHTML = '';
      return;
    }
    els.title.textContent = T(`learn.parts.${selectedId}.title`);
    els.desc.textContent = T(`learn.parts.${selectedId}.desc`);
    const rows = PARTS[selectedId].map(([label, value]) => `
      <div class="part-stat">
        <span class="part-stat-label">${esc(T(`learn.stat.${label}`))}</span>
        <span class="part-stat-value">${esc(typeof value === 'object' ? T(`learn.val.${value.v}`) : value)}</span>
      </div>`).join('');
    const note = RTX_5090_EXAMPLES.includes(selectedId) ? `<p class="part-note">${esc(T('learn.example_note'))}</p>` : '';
    els.stats.innerHTML = rows + note;
  }

  function renderList() {
    if (!els.list) return;
    els.list.innerHTML = Object.keys(PARTS).map(id => `
      <li><button type="button" class="part-chip${id === selectedId ? ' active' : ''}" data-part="${id}" aria-pressed="${id === selectedId}">${esc(T(`learn.parts.${id}.title`))}</button></li>`).join('');
  }

  function selectPart(id, fromModel) {
    selectedId = id;
    renderPart();
    renderList();
    els.panel.classList.toggle('visible', !!id);
    if (viewer && !fromModel) viewer.highlight(id);
  }

  function setLayer(mode) {
    els.layerBtns.forEach(b => {
      const active = b.dataset.layer === mode;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    if (viewer) viewer.setLayer(mode);
  }

  els.layerBtns.forEach(btn => btn.addEventListener('click', () => {
    setLayer(btn.dataset.layer);
    // Si la pieza elegida queda oculta en la nueva capa, se deselecciona
    if (selectedId && viewer && !viewer.isVisible(selectedId)) selectPart(null);
  }));

  if (els.list) {
    els.list.addEventListener('click', e => {
      const btn = e.target.closest('[data-part]');
      if (!btn) return;
      const id = btn.dataset.part;
      if (id === selectedId) return selectPart(null);
      // Muestra la capa en la que se ve la pieza: las de la placa quedan tapadas por el disipador
      // y la carcasa, y el disipador por la carcasa
      setLayer(PART_LAYER[id] || 'pcb-only');
      selectPart(id);
    });
  }

  window.addEventListener('i18n:change', () => { renderPart(); renderList(); });

  function showFallback() {
    section.classList.add('no-webgl');
    container.innerHTML = `
      <div class="learn-fallback" role="status">
        <strong>${esc(T('learn.no_webgl_title'))}</strong>
        <p>${esc(T('learn.no_webgl'))}</p>
      </div>`;
  }

  function hasWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch (e) {
      return false;
    }
  }

  renderPart();
  renderList();
  setLayer('full');

  if (!hasWebGL()) {
    showFallback();
    return;
  }
  // El modelo se crea cuando la página ya ha cargado y el navegador está libre, para no retrasar el
  // primer pintado de los paneles
  const whenIdle = cb => (window.requestIdleCallback ? requestIdleCallback(cb, { timeout: 1500 }) : setTimeout(cb, 200));
  const start = () => whenIdle(() => {
    import(THREE_URL)
      .then(THREE => { viewer = createViewer(THREE); })
      .catch(err => {
        console.warn('No se pudo iniciar el visor 3D:', err);
        showFallback();
      });
  });
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });

  // ----- Escena de Three.js -----
  function createViewer(THREE) {
    // Mantiene el aspecto del modelo original (r128): colores sin gestión de color y salida lineal
    THREE.ColorManagement.enabled = false;

    const size = () => ({ w: container.clientWidth || window.innerWidth, h: container.clientHeight || window.innerHeight });
    let { w, h } = size();

    const scene = new THREE.Scene();
    scene.background = null; // transparente: se ve el fondo CSS

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    const CAMERA_HOME = [15, 12, 18];

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !reduceMotion.matches;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 40;
    controls.minDistance = 5;

    // En pantallas verticales la tarjeta (16 × 8) no cabe a la distancia de escritorio: se aleja la cámara
    function fitCamera() {
      camera.aspect = w / h;
      const scale = Math.min(Math.max(1.25 / camera.aspect, 1), 2.4);
      camera.position.set(...CAMERA_HOME).multiplyScalar(scale);
      controls.maxDistance = Math.max(40, camera.position.length() * 1.3);
      camera.updateProjectionMatrix();
    }
    fitCamera();

    // Luces. Desde r155 las intensidades son físicas: se multiplican por π para igualar las de r128.
    const PI = Math.PI;
    const ambientLight = new THREE.AmbientLight(0xffffff);
    const dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    const fillLight = new THREE.DirectionalLight(0x19e6b4);
    fillLight.position.set(-10, 0, -10);
    const accentLight = new THREE.PointLight(0x3cc8ff, 0, 50, 1);
    accentLight.position.set(5, 5, 5);
    scene.add(ambientLight, dirLight, fillLight, accentLight);

    function updateLighting() {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      ambientLight.intensity = (isLight ? 1.2 : 0.4) * PI;
      dirLight.intensity = (isLight ? 1.0 : 0.6) * PI;
      fillLight.intensity = (isLight ? 0.8 : 0.4) * PI;
      accentLight.intensity = (isLight ? 0.8 : 0.5) * PI;
      requestRender();
    }
    new MutationObserver(updateLighting).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Materiales
    const mat = (color, roughness, metalness, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
    const materials = {
      pcb: mat(0x112211, 0.8, 0.2),
      die: mat(0x222222, 0.1, 0.8, { emissive: 0x111111 }),
      vram: mat(0x1a1a1a, 0.7, 0.3),
      vrm: mat(0x333333, 0.5, 0.5),
      heatsink: mat(0xaaaaaa, 0.4, 0.7),
      shroud: mat(0x151515, 0.6, 0.2),
      fan: mat(0x0a0a0a, 0.5, 0.1),
      gold: mat(0xffd700, 0.3, 0.9),
      bracket: mat(0xcccccc, 0.4, 0.8)
    };

    const gpuGroup = new THREE.Group();
    const layers = { pcb: new THREE.Group(), heatsink: new THREE.Group(), shroud: new THREE.Group() };
    gpuGroup.add(layers.pcb, layers.heatsink, layers.shroud);
    gpuGroup.position.y = -1;
    scene.add(gpuGroup);

    const meshesByPart = {};
    const interactable = [];
    function addPart(id, geometry, material, layer, [x, y, z], rotY = 0) {
      const mesh = new THREE.Mesh(geometry, material.clone());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.set(x, y, z);
      mesh.rotation.y = rotY;
      mesh.userData = { part: id, color: mesh.material.color.getHex(), emissive: mesh.material.emissive.getHex() };
      layers[layer].add(mesh);
      interactable.push(mesh);
      (meshesByPart[id] = meshesByPart[id] || []).push(mesh);
      return mesh;
    }
    const box = (x, y, z) => new THREE.BoxGeometry(x, y, z);

    // Capa 1: PCB y lo que va montado en ella
    addPart('pcb', box(16, 0.2, 8), materials.pcb, 'pcb', [0, 0, 0]);
    addPart('pcie', box(8, 0.5, 0.4), materials.gold, 'pcb', [-2, -0.35, 3.8]);
    addPart('backplate', box(16, 0.1, 8), materials.bracket, 'pcb', [0, -0.15, 0]);
    addPart('die', box(2.5, 0.1, 2.5), materials.die, 'pcb', [0, 0.15, 0]);
    const vramGeo = box(0.8, 0.1, 1.2);
    [[-1.8, -1.8], [0, -1.8], [1.8, -1.8], [-1.8, 1.8], [0, 1.8], [1.8, 1.8], [-2.2, 0], [2.2, 0]].forEach(([x, z], i) => {
      addPart('vram', vramGeo, materials.vram, 'pcb', [x, 0.15, z], i >= 6 ? Math.PI / 2 : 0);
    });
    const vrmGeo = box(0.4, 0.3, 0.4);
    for (let i = 0; i < 12; i++) addPart('vrm', vrmGeo, materials.vrm, 'pcb', [-6 + i * 0.5, 0.25, -2.5]);
    addPart('power', box(1.2, 0.8, 0.8), materials.vrm, 'pcb', [7, 0.5, -3.5]);
    addPart('io', box(0.2, 3, 8.5), materials.bracket, 'pcb', [-8.1, 1.4, 0]);

    // Capa 2: disipador
    addPart('heatsink', box(15.5, 1.2, 7.8), materials.heatsink, 'heatsink', [0.1, 0.8, 0]);

    // Capa 3: carcasa y ventiladores
    addPart('shroud', box(15.8, 0.5, 8), materials.shroud, 'shroud', [0.1, 1.65, 0]);
    const fanGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.4, 32);
    const fans = [-4, 0, 4].map(x => addPart('fan', fanGeo, materials.fan, 'shroud', [x + 0.1, 1.9, 0]));

    const isVisible = id => (meshesByPart[id] || []).some(m => {
      for (let o = m; o; o = o.parent) if (!o.visible) return false;
      return true;
    });

    let highlighted = null;
    function highlight(id) {
      if (highlighted) {
        meshesByPart[highlighted].forEach(m => {
          m.material.color.setHex(m.userData.color);
          m.material.emissive.setHex(m.userData.emissive);
        });
      }
      highlighted = id && meshesByPart[id] ? id : null;
      if (highlighted) {
        meshesByPart[highlighted].forEach(m => {
          m.material.color.setHex(0x19e6b4);
          m.material.emissive.setHex(0x04382b);
        });
      }
      requestRender();
    }

    function setLayer(mode) {
      layers.shroud.visible = mode === 'full';
      layers.heatsink.visible = mode !== 'pcb-only';
      if (highlighted && !isVisible(highlighted)) highlight(null);
      requestRender();
    }

    // ----- Bucle de render: solo cuando hace falta -----
    // Se anima (giro suave y ventiladores) mientras el visor está en pantalla, la pestaña visible y sin
    // "reducir movimiento"; si no, se dibuja un único fotograma cuando algo cambia.
    let onScreen = true;
    let dragging = false;
    let frame = 0;
    let last = 0;
    const animating = () => onScreen && !document.hidden && !reduceMotion.matches;

    function draw(now) {
      frame = 0;
      const delta = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      if (animating()) {
        if (layers.shroud.visible) fans.forEach(fan => { fan.rotation.y += delta * 15; });
        if (!dragging) gpuGroup.rotation.y += delta * 0.1;
      }
      const moving = controls.update();
      renderer.render(scene, camera);
      if (animating() || moving || dragging) requestRender();
      else last = 0;
    }
    function requestRender() {
      if (!frame) frame = requestAnimationFrame(draw);
    }

    controls.addEventListener('start', () => { dragging = true; requestRender(); });
    controls.addEventListener('end', () => { dragging = false; });
    controls.addEventListener('change', requestRender);
    document.addEventListener('visibilitychange', () => { last = 0; requestRender(); });
    reduceMotion.addEventListener('change', () => { controls.enableDamping = !reduceMotion.matches; requestRender(); });
    new IntersectionObserver(entries => {
      onScreen = entries.some(e => e.isIntersecting);
      last = 0;
      if (onScreen) requestRender();
    }).observe(container);

    // ----- Selección con el puntero -----
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const canvas = renderer.domElement;
    function pick(event) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(interactable.filter(m => isVisible(m.userData.part)))[0];
      return hit ? hit.object.userData.part : null;
    }
    let downAt = null;
    canvas.addEventListener('pointerdown', e => { downAt = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('pointerup', e => {
      // Si el puntero se ha movido más de 5 px es un arrastre, no un clic
      if (!downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 5) return;
      const id = pick(e);
      highlight(id);
      selectPart(id, true);
    });
    canvas.addEventListener('pointermove', e => {
      if (e.pointerType === 'mouse' && !dragging) canvas.style.cursor = pick(e) ? 'pointer' : '';
    });

    window.addEventListener('resize', () => {
      const prev = w / h;
      ({ w, h } = size());
      renderer.setSize(w, h);
      // Solo se recoloca la cámara si cambia la orientación (no al mostrar/ocultar la barra del móvil)
      if ((prev < 1) !== (w / h < 1)) fitCamera();
      else { camera.aspect = w / h; camera.updateProjectionMatrix(); }
      requestRender();
    });

    section.classList.add('has-webgl');
    updateLighting();
    requestRender();
    return { highlight, setLayer, isVisible };
  }
})();
