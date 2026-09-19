'use strict';

(function () {
  const stage = document.getElementById('stage');
  const pickedLabel = document.getElementById('picked');

  if (!window.THREE || !window.THREE.Scene) {
    document.getElementById('fallback').innerHTML =
      '<div class="alert">三维库 Three.js 未能加载（可能处于离线状态或 CDN 被拦截）。页面文字说明仍然可读，列表与图表模块不受影响。</div>';
    return;
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdfeaf1);
  scene.fog = new THREE.Fog(0xdfeaf1, 60, 160);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  stage.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const sun = new THREE.DirectionalLight(0xfff3e0, 0.85);
  sun.position.set(28, 40, 18);
  sun.castShadow = true;
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 160),
    new THREE.MeshLambertMaterial({ color: 0x9ec27a })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const roadMat = new THREE.MeshLambertMaterial({ color: 0xbfbfbf });
  [[0, 0, 120, 6], [-30, -20, 6, 70], [26, 18, 6, 80]].forEach(function (r) {
    const road = new THREE.Mesh(new THREE.BoxGeometry(r[2], 0.2, r[3]), roadMat);
    road.position.set(r[0], 0.11, r[1]);
    road.receiveShadow = true;
    scene.add(road);
  });

  const landmarks = [];
  function addBuilding(name, size, position, color) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size[0], size[1], size[2]),
      new THREE.MeshLambertMaterial({ color: color })
    );
    mesh.position.set(position[0], size[1] / 2, position[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.name = name;
    scene.add(mesh);
    landmarks.push(mesh);
    return mesh;
  }

  addBuilding('图书馆（三层静音区／四层研讨室）', [16, 14, 12], [-16, 0, -22], 0x2f6f8f);
  addBuilding('第一教学楼（A区／C区自习室）', [22, 10, 10], [16, 0, -20], 0x8aa6b5);
  addBuilding('第二教学楼（开放自习区／晚自习室）', [24, 12, 10], [14, 0, 16], 0xc86b3c);
  addBuilding('学生活动中心（考研专区／阅读角）', [12, 8, 12], [-20, 0, 14], 0x6a8f6f);

  const gym = new THREE.Mesh(
    new THREE.CylinderGeometry(7, 7, 6, 24),
    new THREE.MeshLambertMaterial({ color: 0xd9c46a })
  );
  gym.position.set(-2, 3, -2);
  gym.castShadow = true;
  gym.userData.name = '体育馆（可预约场地）';
  scene.add(gym);
  landmarks.push(gym);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(7, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0xf0f3f5 })
  );
  dome.position.set(-2, 6, -2);
  scene.add(dome);

  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x7a5230 });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x3f7a45 });
  for (let i = 0; i < 18; i += 1) {
    const x = -46 + (i % 6) * 18;
    const z = -40 + Math.floor(i / 6) * 32;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 2.4, 8), trunkMat);
    trunk.position.set(x, 1.2, z);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(2.2, 5, 10), leafMat);
    crown.position.set(x, 4.6, z);
    crown.castShadow = true;
    scene.add(trunk, crown);
  }

  const orbit = { radius: 62, theta: Math.PI / 5, phi: Math.PI / 3.4 };
  const target = new THREE.Vector3(0, 5, 0);

  function updateCamera() {
    const sinPhi = Math.sin(orbit.phi);
    camera.position.set(
      target.x + orbit.radius * sinPhi * Math.cos(orbit.theta),
      target.y + orbit.radius * Math.cos(orbit.phi),
      target.z + orbit.radius * sinPhi * Math.sin(orbit.theta)
    );
    camera.lookAt(target);
  }

  function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight || 460;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let selected = null;

  function pick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(landmarks, false);
    if (selected) selected.material.emissive.setHex(0x000000);
    if (hits.length > 0) {
      selected = hits[0].object;
      selected.material.emissive.setHex(0x333300);
      pickedLabel.textContent = selected.userData.name;
    } else {
      selected = null;
      pickedLabel.textContent = '无';
    }
  }

  let dragging = false;
  let moved = 0;
  let lastX = 0;
  let lastY = 0;

  renderer.domElement.addEventListener('pointerdown', function (e) {
    dragging = true;
    moved = 0;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    moved += Math.abs(dx) + Math.abs(dy);
    lastX = e.clientX;
    lastY = e.clientY;
    orbit.theta -= dx * 0.006;
    orbit.phi = Math.min(Math.PI / 2.15, Math.max(0.25, orbit.phi - dy * 0.006));
  });

  window.addEventListener('pointerup', function (e) {
    if (!dragging) return;
    dragging = false;
    if (moved < 6) pick(e);
  });

  renderer.domElement.addEventListener('wheel', function (e) {
    e.preventDefault();
    orbit.radius = Math.min(120, Math.max(26, orbit.radius + e.deltaY * 0.05));
  }, { passive: false });

  window.addEventListener('resize', resize);

  let rafId = 0;
  function loop() {
    updateCamera();
    renderer.render(scene, camera);
    rafId = window.requestAnimationFrame(loop);
  }
  function start() {
    if (!rafId) loop();
  }
  function stop() {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }
  /* 页面隐藏时停掉渲染循环，否则从三维页返回首页后循环仍在跑会造成卡顿 */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });
  window.addEventListener('pagehide', stop);

  resize();
  start();
})();
