'use strict';

(function () {
  const stage = document.getElementById('stage');
  const pickedLabel = document.getElementById('picked');
  const detailLabel = document.getElementById('detail');
  const fallbackBox = document.getElementById('fallback');

  if (!window.THREE || !window.THREE.Scene) {
    fallbackBox.innerHTML = '<div class="alert">三维库 Three.js 未能加载（离线或 CDN 被拦截），场馆列表与预约功能不受影响。</div>';
    return;
  }

  /* 与主看板共用同一份数据：读不到就退回到内置精简列表，保证三维区不白屏 */
  const BACKUP_FACILITIES = [
    { id: 1, name: '北区体育馆羽毛球馆', type: '球类', area: '北区', capacity: 48, occupancy: 0.81 },
    { id: 3, name: '中心游泳馆 25 米池', type: '水上', area: '中心区', capacity: 60, occupancy: 0.93 },
    { id: 5, name: '东区田径场跑道', type: '田径', area: '东区', capacity: 300, occupancy: 0.35 },
    { id: 7, name: '南区风雨操场综合馆', type: '综合', area: '南区', capacity: 120, occupancy: 0.56 },
    { id: 8, name: '南区健身中心力量房', type: '健身', area: '南区', capacity: 35, occupancy: 0.74 },
    { id: 9, name: '学生活动中心瑜伽室', type: '健身', area: '中心区', capacity: 20, occupancy: 0.15 }
  ];

  const TYPE_COLOR = { 球类: 0x2f6f8f, 水上: 0x3f88b0, 田径: 0xc86b3c, 综合: 0x6a8f6f, 健身: 0xd9c46a };

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe3eef0);
  scene.fog = new THREE.Fog(0xe3eef0, 80, 220);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 500);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  stage.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const sun = new THREE.DirectionalLight(0xffffff, 0.8);
  sun.position.set(35, 55, 25);
  sun.castShadow = true;
  sun.shadow.camera.left = -80;
  sun.shadow.camera.right = 80;
  sun.shadow.camera.top = 80;
  sun.shadow.camera.bottom = -80;
  scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshLambertMaterial({ color: 0xbfcdb8 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const meshes = [];

  function buildFacility(facility, index, total) {
    const columns = Math.ceil(Math.sqrt(total));
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = (col - (columns - 1) / 2) * 26;
    const z = (row - (Math.ceil(total / columns) - 1) / 2) * 22;
    const height = 4 + facility.occupancy * 12;
    const size = Math.min(18, 8 + facility.capacity / 25);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(size, height, size * 0.75),
      new THREE.MeshLambertMaterial({ color: TYPE_COLOR[facility.type] || 0x8899aa })
    );
    body.position.set(x, height / 2, z);
    body.castShadow = true;
    body.receiveShadow = true;
    body.userData.info = facility;
    scene.add(body);
    meshes.push(body);

    if (facility.type === '水上') {
      const water = new THREE.Mesh(new THREE.BoxGeometry(size * 0.8, 0.4, size * 0.6), new THREE.MeshLambertMaterial({ color: 0x9fd6e8 }));
      water.position.set(x, height + 0.2, z);
      scene.add(water);
    }
    if (facility.type === '田径') {
      const track = new THREE.Mesh(new THREE.TorusGeometry(size * 0.75, 1.2, 8, 32), new THREE.MeshLambertMaterial({ color: 0xa94f2a }));
      track.rotation.x = -Math.PI / 2;
      track.position.set(x, 0.4, z);
      scene.add(track);
    }
  }

  function render(facilities) {
    facilities.forEach(buildFacility);
    orbit.target.set(0, 6, 0);
    /* 从看板表格“查看三维”过来时带 ?id=，直接高亮对应建筑 */
    const wanted = new URLSearchParams(window.location.search).get('id');
    if (wanted) {
      const hit = meshes.filter(function (m) { return String(m.userData.info.id) === wanted; })[0];
      if (hit) select(hit);
    }
  }

  const orbit = { radius: 88, theta: Math.PI / 4, phi: Math.PI / 3.2, target: new THREE.Vector3(0, 6, 0) };

  function updateCamera() {
    const sinPhi = Math.sin(orbit.phi);
    camera.position.set(
      orbit.target.x + orbit.radius * sinPhi * Math.cos(orbit.theta),
      orbit.target.y + orbit.radius * Math.cos(orbit.phi),
      orbit.target.z + orbit.radius * sinPhi * Math.sin(orbit.theta)
    );
    camera.lookAt(orbit.target);
  }

  function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight || 460;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  let selected = null;
  function select(mesh) {
    if (selected) selected.material.emissive.setHex(0x000000);
    selected = mesh;
    if (mesh) {
      mesh.material.emissive.setHex(0x2a2a00);
      const f = mesh.userData.info;
      pickedLabel.textContent = f.name;
      detailLabel.textContent = f.type + ' · ' + f.area + ' · 容量 ' + f.capacity + ' 人 · 今日占用 ' +
        Math.round(f.occupancy * 100) + '%（' + (f.occupancy >= 0.8 ? '紧张' : f.occupancy >= 0.5 ? '适中' : '宽松') + '）';
    } else {
      pickedLabel.textContent = '无';
      detailLabel.textContent = '未在列表中选中场馆。';
    }
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function pick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(meshes, false);
    select(hits.length ? hits[0].object : null);
  }

  let dragging = false;
  let moved = 0;
  let lastX = 0;
  let lastY = 0;

  renderer.domElement.addEventListener('pointerdown', function (e) {
    dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY;
  });
  window.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    moved += Math.abs(dx) + Math.abs(dy);
    lastX = e.clientX; lastY = e.clientY;
    orbit.theta -= dx * 0.006;
    orbit.phi = Math.min(Math.PI / 2.2, Math.max(0.28, orbit.phi - dy * 0.006));
  });
  window.addEventListener('pointerup', function (e) {
    if (!dragging) return;
    dragging = false;
    if (moved < 6) pick(e);
  });
  renderer.domElement.addEventListener('wheel', function (e) {
    e.preventDefault();
    orbit.radius = Math.min(170, Math.max(30, orbit.radius + e.deltaY * 0.08));
  }, { passive: false });
  window.addEventListener('resize', resize);

  let rafId = 0;
  function loop() {
    updateCamera();
    renderer.render(scene, camera);
    rafId = window.requestAnimationFrame(loop);
  }
  function start() { if (!rafId) loop(); }
  function stop() { if (rafId) { window.cancelAnimationFrame(rafId); rafId = 0; } }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  window.addEventListener('pagehide', stop);

  fetch('../data/facilities.json', { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      if (!data || !Array.isArray(data.facilities) || data.facilities.length === 0) throw new Error('数据为空');
      render(data.facilities);
    })
    .catch(function (error) {
      fallbackBox.innerHTML = '<div class="alert">场馆数据读取失败（' + error.message + '），三维区已改用内置精简数据，仅展示 6 个代表性场馆。</div>';
      render(BACKUP_FACILITIES);
    });

  resize();
  start();
})();
