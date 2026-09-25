import * as THREE from 'three';

// ============ COURIER SIMULATOR MVP (Web / APK / EXE tek taban) ============
// Kodsuz GDD'nin oynanabilir karşılığı: sprint, slide, wall-run, fan, zipline,
// paket tipleri, bronz/gümüş/altın, flow, joystick + mobil butonlar.

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87b5e0);
scene.fog = new THREE.Fog(0x87b5e0, 60, 220);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 500);
const hemi = new THREE.HemisphereLight(0xffffff, 0x334155, 0.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(40, 60, 20);
sun.castShadow = true;
sun.shadow.camera.left = -80; sun.shadow.camera.right = 80;
sun.shadow.camera.top = 80; sun.shadow.camera.bottom = -80;
scene.add(sun);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- ŞEHİR (FBX City Pack'in prosedürel MVP karşılığı) ----------
const colliders = []; // {minX,maxX,minZ,maxZ,topY,type,cushion,bounce}
function addBox(x, y, z, w, h, d, color, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: .85 }));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  scene.add(m);
  if (opts.collide !== false) colliders.push({
    minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2,
    topY: y + h / 2, type: opts.type || 'solid',
    cushion: !!opts.cushion, bounce: !!opts.bounce, name: opts.name || ''
  });
  return m;
}

// zemin + yollar
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400),
  new THREE.MeshStandardMaterial({ color: 0x3f4756 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

// binalar: sokak ızgarası, çatılar parkur alanı
const buildings = [
  [-22, -22, 14, 12], [0, -24, 16, 14], [24, -22, 13, 11],
  [-24, 0, 12, 15], [24, 2, 15, 16], [-23, 24, 14, 10],
  [2, 26, 15, 12], [26, 26, 12, 14], [-45, -5, 12, 12], [46, -6, 12, 12],
];
const palette = [0xd9d4c7, 0xb8c4d4, 0xe0a08a, 0x9db8a0, 0xc9b8e0];
buildings.forEach((b, i) => {
  const [x, z, w, d] = b; const h = 8 + (i % 4) * 3 + (i % 3);
  addBox(x, h / 2, z, w, h, d, palette[i % palette.length], { type: 'building', name: 'b' + i });
  // çatı kenar şeridi (sarı boya dili)
  const rim = new THREE.Mesh(new THREE.BoxGeometry(w + .3, .15, d + .3),
    new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
  rim.position.set(x, h + .08, z); scene.add(rim);
});

// hastane / bar / hotel landmark
addBox(-45, 5, 22, 14, 10, 12, 0xffffff, { type: 'building', name: 'hospital' });
addBox(46, 4, 20, 12, 8, 10, 0x7c2d12, { type: 'building', name: 'bar' });
addBox(0, 6, -46, 18, 12, 12, 0x1e3a8a, { type: 'building', name: 'hotel' });

// fanlar (updraft) — 3 adet
const fans = [];
[[-22, -22, 12], [24, 2, 15], [2, 26, 12]].forEach(f => {
  const [x, z, top] = f;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.4, 1, 16),
    new THREE.MeshStandardMaterial({ color: 0x22d3ee }));
  base.position.set(x, top + .5, z); scene.add(base);
  fans.push({ x, z, top: top + 1, r: 2.6, power: 16 });
});

// yumuşak iniş konteynerleri (mavi)
[[-10, -10], [12, -8], [-8, 12], [14, 14], [0, -12], [-30, 8]].forEach(p => {
  addBox(p[0], .8, p[1], 3, 1.6, 2, 0x2563eb, { type: 'prop', cushion: true, name: 'container' });
});
// sekme panoları (sarı)
[[-14, 0], [10, 22], [30, 10]].forEach(p => {
  addBox(p[0], .5, p[1], 4, 1, 4, 0xfacc15, { type: 'prop', bounce: true, name: 'billboard' });
});

// zipline hatları
const ziplines = [
  { a: new THREE.Vector3(-22, 13, -22), b: new THREE.Vector3(0, 15, -24) },
  { a: new THREE.Vector3(24, 16, 2), b: new THREE.Vector3(2, 13, 26) },
  { a: new THREE.Vector3(0, 13, -46), b: new THREE.Vector3(0, 15, -24) },
];
ziplines.forEach(z => {
  const g = new THREE.BufferGeometry().setFromPoints([z.a, z.b]);
  scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x111111 })));
  [z.a, z.b].forEach(p => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(.4), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    s.position.copy(p); scene.add(s);
  });
});

// depo + teslim noktaları
const depot = new THREE.Vector3(0, 0, 8);
const depotMesh = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 1, 20),
  new THREE.MeshStandardMaterial({ color: 0x8b5cf6 }));
depotMesh.position.set(0, .5, 8); scene.add(depotMesh);

const destPoints = [
  { p: new THREE.Vector3(-22, 12, -22), label: 'Apartman Çatı' },
  { p: new THREE.Vector3(24, 15, 2), label: 'Kule Teras' },
  { p: new THREE.Vector3(2, 12, 26), label: 'Çarşı Çatı' },
  { p: new THREE.Vector3(-45, 10, 22), label: 'Hastane Heliport' },
  { p: new THREE.Vector3(46, 8, 20), label: 'Bar Arka' },
  { p: new THREE.Vector3(0, 12, -46), label: 'Hotel Teras' },
];
const beaconMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: .55 });
let beacon = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 30, 12), beaconMat);
beacon.position.set(0, 15, 8); scene.add(beacon);

// ---------- OYUNCU ----------
const player = new THREE.Group();
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
const body = new THREE.Mesh(new THREE.BoxGeometry(.7, 1.1, .4), bodyMat);
body.position.y = 1.0; body.castShadow = true; player.add(body);
const head = new THREE.Mesh(new THREE.BoxGeometry(.45, .45, .45),
  new THREE.MeshStandardMaterial({ color: 0xfcd9a0 }));
head.position.y = 1.85; player.add(head);
const pkgMesh = new THREE.Mesh(new THREE.BoxGeometry(.55, .55, .3),
  new THREE.MeshStandardMaterial({ color: 0xb45309 }));
pkgMesh.position.set(0, 1.2, -.4); player.add(pkgMesh); pkgMesh.visible = false;
const bikeMesh = new THREE.Mesh(new THREE.BoxGeometry(.6, .5, 1.8),
  new THREE.MeshStandardMaterial({ color: 0x111827 }));
bikeMesh.position.y = .5; bikeMesh.visible = false; player.add(bikeMesh);
scene.add(player);

const P = {
  pos: new THREE.Vector3(0, 0, 12), vel: new THREE.Vector3(),
  yaw: Math.PI, camYaw: Math.PI, camPitch: -.25,
  grounded: true, coyote: 0, jumpBuf: 0, slideT: 0, wallT: 0, wallN: new THREE.Vector3(),
  flow: 0, onMotor: false, riding: null, rideT: 0, fallStart: 0,
  speed: 0, stepT: 0, hp: 100
};

// ---------- GÖREV / PAKET ----------
const JOBS = [
  { name: 'Standart Zarf', type: 'std', mult: 1, frag: 0, heat: 0, dest: 0, t: [90, 65, 45], pay: 50 },
  { name: 'Cam Vazo (Kırılabilir)', type: 'fragile', mult: 1, frag: 1, heat: 0, dest: 1, t: [110, 85, 65], pay: 90 },
  { name: 'Sıcak Lahmacun', type: 'hot', mult: 1.05, frag: 0, heat: 1, dest: 2, t: [80, 60, 42], pay: 80 },
  { name: 'Su Damacanası (Ağır)', type: 'heavy', mult: .82, frag: 0, heat: 0, dest: 3, t: [130, 100, 80], pay: 110 },
  { name: 'Eczane Acil (Kırılabilir+Süre)', type: 'fragile', mult: 1, frag: 1, heat: 0, dest: 5, t: [100, 75, 55], pay: 130 },
  { name: 'Toplu Sipariş (Ağır)', type: 'heavy', mult: .82, frag: 0, heat: 0, dest: 4, t: [120, 95, 75], pay: 120 },
];
let job = null, jobTime = 0, pkgHp = 100, heat = 100;
let money = +(localStorage.getItem('cs_money') || 0);
let rep = +(localStorage.getItem('cs_rep') || 0);

const $ = id => document.getElementById(id);
const toastEl = $('toast');
let toastT = null;
function toast(msg, ms = 2200) {
  toastEl.textContent = msg; toastEl.style.opacity = 1;
  clearTimeout(toastT); toastT = setTimeout(() => toastEl.style.opacity = 0, ms);
}

// ---------- GİRİŞ (klavye + dokunmatik) ----------
const keys = {};
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space') P.jumpBuf = .15;
  if (['Space', 'ArrowUp'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyE') doAction();
  if (e.code === 'KeyM') toggleMotor();
  if (e.code === 'KeyR') respawn();
  initAudio();
});
addEventListener('keyup', e => keys[e.code] = false);

// fare kamera
let dragging = false, lx = 0, ly = 0;
canvas.addEventListener('pointerdown', e => { dragging = true; lx = e.clientX; ly = e.clientY; initAudio(); });
addEventListener('pointermove', e => {
  if (!dragging || isTouchCam) return;
  P.camYaw -= (e.clientX - lx) * .004; P.camPitch -= (e.clientY - ly) * .003;
  P.camPitch = Math.max(-1.1, Math.min(.25, P.camPitch)); lx = e.clientX; ly = e.clientY;
});
addEventListener('pointerup', () => dragging = false);

// mobil joystick + butonlar
const joy = { x: 0, y: 0, id: null };
const joyEl = $('joystick'), stickEl = $('stick');
let isTouchCam = false, camTouchId = null, clx = 0, cly = 0;
joyEl.addEventListener('touchstart', e => { joy.id = e.changedTouches[0].identifier; }, { passive: true });
addEventListener('touchmove', e => {
  for (const t of e.changedTouches) {
    if (t.identifier === joy.id) {
      const r = joyEl.getBoundingClientRect();
      let dx = t.clientX - (r.left + 60), dy = t.clientY - (r.top + 60);
      const l = Math.hypot(dx, dy) || 1, m = Math.min(l, 45);
      dx = dx / l * m; dy = dy / l * m;
      stickEl.style.transform = `translate(${dx}px,${dy}px)`;
      joy.x = dx / 45; joy.y = dy / 45;
    } else if (t.identifier === camTouchId) {
      P.camYaw -= (t.clientX - clx) * .006; P.camPitch -= (t.clientY - cly) * .004;
      P.camPitch = Math.max(-1.1, Math.min(.25, P.camPitch)); clx = t.clientX; cly = t.clientY;
    }
  }
}, { passive: true });
addEventListener('touchstart', e => {
  for (const t of e.changedTouches) {
    if (t.clientX > innerWidth * .45 && t.target === canvas && camTouchId === null) {
      camTouchId = t.identifier; clx = t.clientX; cly = t.clientY; isTouchCam = true;
    }
  }
}, { passive: true });
addEventListener('touchend', e => {
  for (const t of e.changedTouches) {
    if (t.identifier === joy.id) { joy.id = null; joy.x = joy.y = 0; stickEl.style.transform = ''; }
    if (t.identifier === camTouchId) { camTouchId = null; isTouchCam = false; }
  }
});
function bindBtn(id, down, up) {
  const el = $(id);
  el.addEventListener('touchstart', e => { e.preventDefault(); down(); }, { passive: false });
  el.addEventListener('touchend', e => { e.preventDefault(); up && up(); }, { passive: false });
}
bindBtn('btn-jump', () => P.jumpBuf = .15);
bindBtn('btn-slide', () => { keys['KeyC'] = true; setTimeout(() => keys['KeyC'] = false, 300); });
bindBtn('btn-sprint', () => keys['ShiftLeft'] = !keys['ShiftLeft']);
bindBtn('btn-act', () => doAction());

// ---------- SES (prosedürel) ----------
let AC = null, windGain = null, musicT = 0;
function initAudio() {
  if (AC) { AC.resume && AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    const len = AC.sampleRate * 2, buf = AC.createBuffer(1, len, AC.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = AC.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
    windGain = AC.createGain(); windGain.gain.value = 0;
    src.connect(f); f.connect(windGain); windGain.connect(AC.destination); src.start();
  } catch (e) { /* sessiz mod */ }
}
function blip(freq, dur = .12, type = 'square', vol = .08) {
  if (!AC) return;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.value = freq; g.gain.value = vol;
  o.connect(g); g.connect(AC.destination); o.start();
  g.gain.exponentialRampToValueAtTime(.001, AC.currentTime + dur); o.stop(AC.currentTime + dur);
}

// ---------- OYUN MANTIĞI ----------
function openJobs() {
  const list = $('job-list'); list.innerHTML = '';
  JOBS.forEach((j, i) => {
    const el = document.createElement('div'); el.className = 'job-card';
    el.innerHTML = `<b>${j.name}</b> → ${destPoints[j.dest].label}<br>⏱️ ${j.t[2]}s altın / ${j.t[1]}s gümüş / ${j.t[0]}s bronz — 💰${j.pay}`;
    el.onclick = () => takeJob(i);
    list.appendChild(el);
  });
  $('job-menu').classList.remove('hidden');
}
function takeJob(i) {
  job = JOBS[i]; jobTime = 0; pkgHp = 100; heat = 100;
  pkgMesh.visible = true;
  pkgMesh.material.color.set(job.type === 'fragile' ? 0x38bdf8 : job.type === 'hot' ? 0xf97316 : job.type === 'heavy' ? 0x52525b : 0xb45309);
  $('job-menu').classList.add('hidden');
  $('pkg-label').textContent = job.name.toUpperCase().slice(0, 14);
  $('heat-wrap').style.display = job.type === 'hot' ? 'block' : 'none';
  beacon.position.set(destPoints[job.dest].p.x, destPoints[job.dest].p.y + 12, destPoints[job.dest].p.z);
  toast(`Paket alındı: ${job.name} → ${destPoints[job.dest].label}`);
  blip(660);
}
function doAction() {
  initAudio();
  if (!$('job-menu').classList.contains('hidden')) { $('job-menu').classList.add('hidden'); return; }
  // zipline'a bin
  if (!P.riding) {
    for (const z of ziplines) {
      if (P.pos.distanceTo(z.a) < 3) { P.riding = z; P.rideT = 0; toast('Zipline!'); blip(880); return; }
    }
  }
  const target = job ? destPoints[job.dest].p : depot;
  if (P.pos.distanceTo(target) < 4 || (!job && P.pos.distanceTo(depot) < 4)) {
    if (!job) openJobs();
    else deliver();
  }
}
function deliver() {
  const grade = jobTime <= job.t[2] && pkgHp >= 90 ? 'ALTIN' :
    jobTime <= job.t[1] && pkgHp >= 70 ? 'GÜMÜŞ' :
    jobTime <= job.t[0] ? 'BRONZ' : 'GEÇ TESLİM';
  const mult = grade === 'ALTIN' ? 2.2 : grade === 'GÜMÜŞ' ? 1.5 : grade === 'BRONZ' ? 1 : .4;
  const gain = Math.round(job.pay * mult);
  money += gain; if (grade === 'ALTIN' || grade === 'GÜMÜŞ') rep++;
  localStorage.setItem('cs_money', money); localStorage.setItem('cs_rep', rep);
  toast(`${grade}! +💰${gain} (${jobTime.toFixed(1)}s, paket %${Math.round(pkgHp)})`, 3200);
  blip(grade === 'ALTIN' ? 990 : 520, .25);
  job = null; pkgMesh.visible = false;
  $('pkg-label').textContent = 'BOŞ';
  beacon.position.set(depot.x, 15, depot.z);
  $('mission-title').textContent = 'Depoya dön ve yeni iş al (E)';
}
function toggleMotor() {
  if (P.pos.y > 1.5 || P.riding) return;
  P.onMotor = !P.onMotor; bikeMesh.visible = P.onMotor;
  toast(P.onMotor ? 'Motor modu: hızlı transfer, parkur yok' : 'Yaya modu: parkur aktif');
}
function respawn() {
  P.pos.set(0, 0, 12); P.vel.set(0, 0, 0); P.riding = null;
  if (job) jobTime += 5;
  toast('Yeniden doğdun (+5s ceza)');
}
function groundHeight(x, z, curY) {
  let g = 0, hit = null;
  for (const c of colliders) {
    if (x > c.minX - .3 && x < c.maxX + .3 && z > c.minZ - .3 && z < c.maxZ + .3) {
      if (c.topY <= curY + .6 && c.topY > g) { g = c.topY; hit = c; }
    }
  }
  return { g, hit };
}

// ana döngü
const clock = new THREE.Clock();
let firstFrame = true;
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), .05);

  // giriş vektörü
  let ix = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0) + joy.x;
  let iz = (keys['KeyS'] ? 1 : 0) - (keys['KeyW'] ? 1 : 0) + joy.y;
  ix = Math.max(-1, Math.min(1, ix)); iz = Math.max(-1, Math.min(1, iz));
  const sprint = keys['ShiftLeft'] || keys['ShiftRight'];
  const wantSlide = !!keys['KeyC'];

  // zipline sürüşü
  if (P.riding) {
    P.rideT += dt * 14 / P.riding.a.distanceTo(P.riding.b);
    P.pos.lerpVectors(P.riding.a, P.riding.b, Math.min(P.rideT, 1));
    P.flow = Math.min(100, P.flow + 40 * dt);
    if (P.rideT >= 1) { P.riding = null; P.vel.set(0, 4, 0); toast('Zipline çıkışı — zıpla ve ak!'); }
  } else {
    // kamera bazlı yön
    const sin = Math.sin(P.camYaw), cos = Math.cos(P.camYaw);
    const wx = ix * cos - iz * sin, wz = -ix * sin - iz * cos;
    const moving = Math.hypot(ix, iz) > .15;

    let maxSp = P.onMotor ? 18 : sprint ? 12 : 8;
    if (job && job.mult) maxSp *= job.mult;
    if (P.flow > 60) maxSp *= 1.1;
    if (P.slideT > 0) maxSp *= 1.25;
    if (P.wallT > 0) maxSp = Math.max(maxSp, 10);

    const accel = P.grounded ? 40 : (P.flow > 60 ? 22 : 14);
    P.vel.x += (wx * maxSp - P.vel.x) * Math.min(1, accel * dt / Math.max(maxSp, 1) * 3);
    P.vel.z += (wz * maxSp - P.vel.z) * Math.min(1, accel * dt / Math.max(maxSp, 1) * 3);

    // zıplama
    P.coyote -= dt; P.jumpBuf -= dt;
    if (P.jumpBuf > 0) {
      if (P.grounded || P.coyote > 0) {
        const jp = (job && job.type === 'heavy') ? 7.5 : 9;
        P.vel.y = jp; P.grounded = false; P.coyote = 0; P.jumpBuf = 0;
        if (P.slideT > 0) { P.vel.x *= 1.15; P.vel.z *= 1.15; } // slide-hop
        blip(300, .08);
      } else if (P.wallT > 0) { // wall-jump
        P.vel.y = 8.5;
        P.vel.x += P.wallN.x * 9; P.vel.z += P.wallN.z * 9;
        P.wallT = 0; P.jumpBuf = 0; blip(420, .1);
        toast('Wall-Jump!');
      }
    }
    // kayma
    if (wantSlide && P.grounded && Math.hypot(P.vel.x, P.vel.z) > 5 && P.slideT <= 0 && !P.onMotor) {
      P.slideT = .7; blip(200, .1, 'sawtooth', .05);
    }
    P.slideT -= dt;

    // yerçekimi (wall-run'da hafif)
    const grav = P.wallT > 0 ? -4 : -25;
    P.vel.y += grav * dt;
    if (P.vel.y < -30) P.vel.y = -30;

    // fanlar
    for (const f of fans) {
      const d = Math.hypot(P.pos.x - f.x, P.pos.z - f.z);
      if (d < f.r && Math.abs(P.pos.y - f.top) < 3) {
        P.vel.y = (job && job.type === 'heavy') ? 10 : f.power;
        P.flow = Math.min(100, P.flow + 30 * dt);
      }
    }

    // entegrasyon + çarpışma
    P.pos.x += P.vel.x * dt; P.pos.z += P.vel.z * dt; P.pos.y += P.vel.y * dt;
    let sideHit = null;
    for (const c of colliders) {
      if (P.pos.y < c.topY - .4 && P.pos.x > c.minX - .4 && P.pos.x < c.maxX + .4 &&
        P.pos.z > c.minZ - .4 && P.pos.z < c.maxZ + .4) {
        // yandan it
        const dxl = P.pos.x - c.minX, dxr = c.maxX - P.pos.x;
        const dzl = P.pos.z - c.minZ, dzr = c.maxZ - P.pos.z;
        const m = Math.min(dxl, dxr, dzl, dzr);
        if (m === dxl) { P.pos.x = c.minX - .4; P.wallN.set(-1, 0, 0); }
        else if (m === dxr) { P.pos.x = c.maxX + .4; P.wallN.set(1, 0, 0); }
        else if (m === dzl) { P.pos.z = c.minZ - .4; P.wallN.set(0, 0, -1); }
        else { P.pos.z = c.maxZ + .4; P.wallN.set(0, 0, 1); }
        sideHit = c;
        if (P.grounded) { P.vel.x *= .3; P.vel.z *= .3; }
      }
    }
    // wall-run tetikle
    P.wallT -= dt;
    const hSpeed = Math.hypot(P.vel.x, P.vel.z);
    if (!P.grounded && sideHit && sideHit.type === 'building' && hSpeed > 7 && moving && !P.onMotor) {
      if (P.wallT <= 0) { toast('WALL-RUN! Çıkışta SPACE', 1200); blip(700, .08); }
      P.wallT = 1.2;
    }

    // zemin
    const gh = groundHeight(P.pos.x, P.pos.z, P.pos.y);
    if (P.pos.y <= gh.g + .02 && P.vel.y <= 0) {
      const fall = P.vel.y;
      P.pos.y = gh.g; P.vel.y = 0;
      if (!P.grounded && fall < -6) { // iniş
        const hard = fall < -12;
        if (gh.hit && gh.hit.bounce) { P.vel.y = 12; toast('Pano sekmesi!'); blip(880, .12); }
        else if (gh.hit && gh.hit.cushion) { toast('Yumuşak iniş 📦✓'); blip(500, .1); }
        else if (hard) {
          if (job && job.frag) { pkgHp -= 34; toast('⚠️ Kırılabilir hasar aldı!'); }
          else if (hard && fall < -18) { pkgHp -= 15; }
          P.flow = Math.max(0, P.flow - 40);
          shake = .4;
        }
        pkgHp = Math.max(0, pkgHp);
      }
      P.grounded = true; P.coyote = .12;
    } else if (P.pos.y > gh.g + .05) {
      if (P.grounded) P.fallStart = P.pos.y;
      P.grounded = false;
    }
    if (P.pos.y < -10) respawn();

    // flow
    P.speed = Math.hypot(P.vel.x, P.vel.z);
    if (P.speed > 9 && (!P.grounded || P.slideT > 0 || P.wallT > 0)) P.flow += 25 * dt;
    else if (P.speed > 6) P.flow += 8 * dt;
    else P.flow -= 30 * dt;
    P.flow = Math.max(0, Math.min(100, P.flow));

    // görev süresi + ısı
    if (job) {
      jobTime += dt;
      if (job.type === 'hot') heat = Math.max(0, heat - dt * 100 / job.t[0]);
      const tgt = destPoints[job.dest].p;
      $('mission-title').textContent = `${job.name} → ${destPoints[tgt === undefined ? 0 : job.dest].label} (${P.pos.distanceTo(tgt).toFixed(0)}m)`;
      const remain = Math.max(0, job.t[0] - jobTime);
      $('timer-bar').style.width = (remain / job.t[0] * 100) + '%';
      let grade = jobTime <= job.t[2] ? 'ALTIN tempo' : jobTime <= job.t[1] ? 'GÜMÜŞ tempo' : 'BRONZ tempo';
      $('timer-text').textContent = `${jobTime.toFixed(1)}s — ${grade}`;
      if (jobTime > job.t[0] + 30) { toast('Görev zaman aşımı, depoya dön'); job = null; pkgMesh.visible = false; }
    } else {
      $('mission-title').textContent = 'Depoya git ve iş al (E)';
      $('timer-bar').style.width = '100%'; $('timer-text').textContent = 'SERBEST SÜRÜŞ';
    }
  }

  // oyuncu görseli + kamera
  player.position.copy(P.pos);
  if (Math.hypot(P.vel.x, P.vel.z) > .5) {
    const ty = Math.atan2(P.vel.x, P.vel.z);
    let d = ty - P.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    P.yaw += d * Math.min(1, 12 * dt);
  }
  player.rotation.y = P.yaw;
  body.scale.y = P.slideT > 0 ? .55 : 1;

  const camDist = P.onMotor ? 7 : 5.5;
  const cx = P.pos.x - Math.sin(P.camYaw) * Math.cos(P.camPitch) * camDist;
  const cz = P.pos.z - Math.cos(P.camYaw) * Math.cos(P.camPitch) * camDist;
  const cy = P.pos.y + 2.2 - Math.sin(P.camPitch) * camDist;
  camera.position.lerp(new THREE.Vector3(cx, cy, cz), Math.min(1, 10 * dt));
  camera.lookAt(P.pos.x, P.pos.y + 1.5, P.pos.z);
  const targetFov = 70 + Math.min(20, P.speed * 1.1) + (P.flow > 60 ? 4 : 0);
  camera.fov += (targetFov - camera.fov) * Math.min(1, 5 * dt);
  camera.updateProjectionMatrix();
  if (shake > 0) {
    camera.position.x += (Math.random() - .5) * shake;
    camera.position.y += (Math.random() - .5) * shake;
    shake -= dt;
  }

  // HUD
  $('flow-fill').style.width = P.flow + '%';
  $('pkg-hp-fill').style.width = (job ? pkgHp : 100) + '%';
  $('pkg-hp-fill').style.background = pkgHp > 70 ? '#4ade80' : pkgHp > 35 ? '#facc15' : '#ef4444';
  if (job && job.type === 'hot') $('heat-fill').style.width = heat + '%';
  $('stats').textContent = `${P.speed.toFixed(1)} m/s${P.wallT > 0 ? ' | WALL-RUN' : ''}${P.flow > 60 ? ' | FLOW!' : ''} | 💰${money} | ⭐${rep}`;
  $('speed-lines').style.opacity = P.speed > 10 ? Math.min(.8, (P.speed - 10) / 8) : 0;
  $('vignette').style.boxShadow = P.flow > 60 ? 'inset 0 0 140px rgba(139,92,246,.55)' : 'inset 0 0 120px rgba(0,0,0,0)';
  // rota oku
  const tgt = job ? destPoints[job.dest].p : depot;
  const ang = Math.atan2(tgt.x - P.pos.x, tgt.z - P.pos.z);
  let rel = ang - P.camYaw + Math.PI;
  $('route-arrow').style.transform = `translateX(-50%) rotate(${rel}rad)`;

  // ses: rüzgar + müzik nabzı
  if (AC && windGain) windGain.gain.value = Math.min(.4, P.speed / 40);
  musicT -= dt;
  if (musicT <= 0 && AC) {
    musicT = P.flow > 60 ? .22 : P.speed > 8 ? .32 : .5;
    blip(P.flow > 60 ? 440 : 220, .1, 'triangle', .04);
  }
  // adım
  if (P.grounded && P.speed > 2) {
    P.stepT -= dt * P.speed;
    if (P.stepT <= 0) { P.stepT = 6; blip(150 + Math.random() * 40, .05, 'sine', .03); }
  }

  beacon.rotation.y += dt;
  if (firstFrame) { firstFrame = false; $('loading').style.display = 'none'; $('help').classList.remove('hidden'); }
  renderer.render(scene, camera);
}
let shake = 0;
$('help-close').onclick = () => { $('help').classList.add('hidden'); initAudio(); };
$('job-close').onclick = () => $('job-menu').classList.add('hidden');
tick();
