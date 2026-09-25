import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

// ============ COURIER SIMULATOR v0.3.0 — GERÇEK ASSETLER ============
// Şehir: City Pack (FBX/OBJ) | Karakter: Adventurer by Quaternius (animasyonlu FBX)
// Kargo: Package by Isa Lousberg (FBX). Modeller yüklenemezse (örn. file://)
// prosedürel yedekler devreye girer, oynanış aynen devam eder.

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

// ---------- MODEL YÜKLEYİCİ ALTYAPISI ----------
const manager = new THREE.LoadingManager();
const loadEl = document.getElementById('loading');
manager.onProgress = (url, loaded, total) => {
  loadEl.textContent = `Şehir kuruluyor... gerçek modeller yükleniyor (${loaded}/${total})`;
};
manager.onError = () => { /* yedek kutular devrede, sessiz geç */ };
const fbxLoader = new FBXLoader(manager);
const objLoader = new OBJLoader(manager);
const mtlLoader = new MTLLoader(manager);
const enc = u => encodeURI(u);
const CITY = 'assets/city/';

function autoFit(obj, fitW, fitD, maxH) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3(); box.getSize(size);
  if (size.x < .01 || size.z < .01) return { h: 2 };
  const s = Math.min(fitW / size.x, fitD / size.z, maxH / Math.max(size.y, .01));
  obj.scale.multiplyScalar(s);
  const b2 = new THREE.Box3().setFromObject(obj);
  return { h: b2.max.y - b2.min.y, minY: b2.min.y };
}
function groundModel(obj, x, z) {
  const b = new THREE.Box3().setFromObject(obj);
  obj.position.x += x - (b.min.x + b.max.x) / 2;
  obj.position.z += z - (b.min.z + b.max.z) / 2;
  const b2 = new THREE.Box3().setFromObject(obj);
  obj.position.y -= b2.min.y;
  obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return new THREE.Box3().setFromObject(obj);
}
function loadOBJ(url, mtlUrl, cb) {
  const dir = url.slice(0, url.lastIndexOf('/') + 1);
  const file = url.slice(url.lastIndexOf('/') + 1);
  mtlLoader.setPath(enc(dir)); mtlLoader.setResourcePath(enc(dir));
  mtlLoader.load(enc(mtlUrl.slice(mtlUrl.lastIndexOf('/') + 1)), mats => {
    mats.preload();
    objLoader.setPath(enc(dir)); objLoader.setMaterials(mats);
    objLoader.load(enc(file), cb, undefined, () => cb(null));
  }, undefined, () => { // mtl yoksa malzemesiz dene
    objLoader.setPath(enc(dir)); objLoader.setMaterials(null);
    objLoader.load(enc(file), cb, undefined, () => cb(null));
  });
}

// ---------- ŞEHİR (önce yedek kutular + çarpışma, sonra gerçek modeller) ----------
const colliders = []; // {minX,maxX,minZ,maxZ,topY,type,cushion,bounce}
function addBox(x, y, z, w, h, d, color, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: .85 }));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  scene.add(m);
  let col = null;
  if (opts.collide !== false) {
    col = {
      minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2,
      topY: y + h / 2, type: opts.type || 'solid',
      cushion: !!opts.cushion, bounce: !!opts.bounce, name: opts.name || ''
    };
    colliders.push(col);
  }
  return { mesh: m, col };
}

const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400),
  new THREE.MeshStandardMaterial({ color: 0x3f4756 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

// Bina slotları: [x, z, fitW, fitD] + gerçek model. Yükseklik modelden gelir,
// görev/fan/zipline yükseklikleri modeller inince otomatik snaplenir.
const buildingDefs = [
  { x: -22, z: -22, w: 14, d: 12, kind: 'obj', url: 'Apartment building/Apartment.obj', mtl: 'Apartment building/Apartment.mtl' },
  { x: 0, z: -24, w: 16, d: 14, kind: 'obj', url: 'Large Building/large_buildingA.obj', mtl: 'Large Building/large_buildingA.mtl' },
  { x: 24, z: -22, w: 13, d: 11, kind: 'obj', url: 'Large Building/large_buildingG.obj', mtl: 'Large Building/large_buildingG.mtl' },
  { x: -24, z: 0, w: 12, d: 15, kind: 'fbx', url: 'Town House/Building1_Large.fbx' },
  { x: 24, z: 2, w: 15, d: 16, kind: 'obj', url: 'Skyscraper/Skyscraper.obj', mtl: 'Skyscraper/Skyscraper.mtl' },
  { x: -23, z: 24, w: 14, d: 10, kind: 'obj', url: 'House with driveway/HouseWithDriveway.obj', mtl: 'House with driveway/HouseWithDriveway.mtl' },
  { x: 2, z: 26, w: 15, d: 12, kind: 'fbx', url: 'Building/Building4.fbx' },
  { x: 26, z: 26, w: 12, d: 14, kind: 'obj', url: 'Apartment building/Apartment.obj', mtl: 'Apartment building/Apartment.mtl', rotY: Math.PI / 2 },
  { x: -45, z: -5, w: 12, d: 12, kind: 'fbx', url: 'Town House/Building1_Large.fbx', rotY: Math.PI / 2 },
  { x: 46, z: -6, w: 12, d: 12, kind: 'obj', url: 'Skyscraper/Skyscraper.obj', mtl: 'Skyscraper/Skyscraper.mtl', rotY: Math.PI },
  { x: -45, z: 22, w: 14, d: 12, kind: 'obj', url: 'Hospital/CUPIC_HOSPITAL.obj', mtl: 'Hospital/CUPIC_HOSPITAL.mtl', name: 'hospital' },
  { x: 46, z: 20, w: 12, d: 10, kind: 'obj', url: 'Bar/CUPIC_BAR.obj', mtl: 'Bar/CUPIC_BAR.mtl', name: 'bar' },
  { x: 0, z: -46, w: 18, d: 12, kind: 'obj', url: 'Hotel Building/model.obj', mtl: 'Hotel Building/materials.mtl', name: 'hotel' },
];
const palette = [0xd9d4c7, 0xb8c4d4, 0xe0a08a, 0x9db8a0, 0xc9b8e0];
const modelCache = {}; // url -> Object3D (klonlar için)
buildingDefs.forEach((b, i) => {
  const h = 8 + (i % 4) * 3 + (i % 3);
  const ph = addBox(b.x, h / 2, b.z, b.w, h, b.d, palette[i % palette.length], { type: 'building', name: b.name || ('b' + i) });
  b.col = ph.col; b.mesh = ph.mesh;
  const rim = new THREE.Mesh(new THREE.BoxGeometry(b.w + .3, .15, b.d + .3),
    new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
  rim.position.set(b.x, h + .08, b.z); scene.add(rim); b.rim = rim;
});
function placeBuildingModel(b) {
  const key = b.url;
  const apply = src => {
    const obj = modelCache[key] ? modelCache[key].clone() : src;
    if (!modelCache[key]) modelCache[key] = src;
    if (b.rotY) obj.rotation.y = b.rotY;
    scene.add(obj);
    const { h } = autoFit(obj, b.w, b.d, 17);
    const box = groundModel(obj, b.x, b.z);
    if (b.col) b.col.topY = box.max.y;
    if (b.mesh) b.mesh.visible = false; // yedek kutuyu gizle, çarpışma güncel
    if (b.rim) { b.rim.position.y = box.max.y + .08; }
  };
  if (modelCache[key]) { apply(null); return; }
  const url = enc(CITY + b.url);
  if (b.kind === 'fbx') fbxLoader.load(url, o => o && apply(o), undefined, () => {});
  else loadOBJ(CITY + b.url, CITY + b.mtl, o => o && apply(o));
}
buildingDefs.forEach(placeBuildingModel);

// ufuk çizgisi: yüklenen modellerden klonlar (çarpışmasız)
function skyline() {
  const spots = [[-65, -40], [-65, 10], [-65, 55], [65, -40], [65, 10], [65, 55], [-30, -65], [30, -65], [-30, 65], [30, 65]];
  const keys = Object.keys(modelCache);
  if (!keys.length) return;
  spots.forEach((s, i) => {
    const src = modelCache[keys[i % keys.length]];
    const c = src.clone();
    c.position.set(s[0], 0, s[1]); c.rotation.y = (i * 1.3) % 6.28;
    const { } = autoFit(c, 16, 16, 30); groundModel(c, s[0], s[1]);
    scene.add(c);
  });
}

// fanlar (updraft) — yükseklik snaplenir
const fans = [];
const fanMeshes = [];
[[-22, -22], [24, 2], [2, 26]].forEach(f => {
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.4, 1, 16),
    new THREE.MeshStandardMaterial({ color: 0x22d3ee }));
  base.position.set(f[0], 8.5, f[1]); scene.add(base); fanMeshes.push(base);
  fans.push({ x: f[0], z: f[1], top: 9, r: 2.6, power: 16 });
});

// yumuşak iniş konteynerleri (mavi)
[[-10, -10], [12, -8], [-8, 12], [14, 14], [0, -12], [-30, 8]].forEach(p => {
  addBox(p[0], .8, p[1], 3, 1.6, 2, 0x2563eb, { type: 'prop', cushion: true, name: 'container' });
});
// sekme panoları — gerçek Billboard modeliyle değişir
const bouncePads = [];
[[-14, 0], [10, 22], [30, 10]].forEach(p => {
  const ph = addBox(p[0], .5, p[1], 4, 1, 4, 0xfacc15, { type: 'prop', bounce: true, name: 'billboard' });
  bouncePads.push({ x: p[0], z: p[1], col: ph.col, mesh: ph.mesh });
});
loadOBJ(CITY + 'Billboard/Billboard 2.obj', CITY + 'Billboard/Billboard 2.mtl', tmpl => {
  if (!tmpl) return;
  modelCache['billboard'] = tmpl;
  bouncePads.forEach(bp => {
    const o = tmpl.clone(); scene.add(o);
    autoFit(o, 4.5, 4.5, 4);
    const box = groundModel(o, bp.x, bp.z);
    if (bp.col) bp.col.topY = box.max.y;
    if (bp.mesh) bp.mesh.visible = false;
  });
});

// sokak arabaları — gerçek modeller (vault ile üstünden geçilir)
const carDefs = [
  { f: ['Car/1377 Car.obj', 'Car/1377 Car.mtl'], x: -10, z: -6, r: 0 },
  { f: ['Car/NormalCar2.obj', 'Car/NormalCar2.mtl'], x: 10, z: 6, r: Math.PI },
  { f: ['Mitsubishi L200/l200.obj', 'Mitsubishi L200/l200.mtl'], x: -10, z: 18, r: 0 },
  { f: ['Police Car/Cop.obj', 'Police Car/Cop.mtl'], x: 10, z: -18, r: Math.PI },
  { f: ['Nissan GTR/GTR.obj', 'Nissan GTR/GTR.mtl'], x: 12, z: -34, r: Math.PI / 2 },
  { f: ['Convertible/Convertible.obj', 'Convertible/Convertible.mtl'], x: -12, z: 36, r: -Math.PI / 2 },
  { f: ['SUV/SUV.obj', 'SUV/SUV.mtl'], x: 34, z: -10, r: Math.PI / 2 },
  { f: ['2015 Dodge Challenger/Grzybek/2015-dodge-challanger.fbx', null], x: -34, z: 12, r: 0, fbx: true },
  { f: ['1994 Nissan 180MX/1994-nissan-180mx_2.fbx', null], x: 10, z: 42, r: Math.PI, fbx: true },
  { f: ['CAR Model/Lamborghini_Aventador.obj', 'CAR Model/Lamborghini_Aventador.mtl'], x: -38, z: -30, r: Math.PI / 2 },
];
carDefs.forEach(c => {
  const applyCar = o => {
    o.rotation.y = c.r || 0; scene.add(o);
    autoFit(o, 4.6, 4.6, 2.2);
    const box = groundModel(o, c.x, c.z);
    const w = box.max.x - box.min.x, d = box.max.z - box.min.z;
    colliders.push({
      minX: c.x - w / 2, maxX: c.x + w / 2, minZ: c.z - d / 2, maxZ: c.z + d / 2,
      topY: box.max.y, type: 'prop', name: 'car'
    });
  };
  if (c.fbx) fbxLoader.load(enc(CITY + c.f[0]), o => o && applyCar(o), undefined, () => {});
  else loadOBJ(CITY + c.f[0], CITY + c.f[1], o => o && applyCar(o));
});

// sokak mobilyası: duraklar, trafik ışıkları, tabelalar, yol parçaları (dekor + ince çarpışma)
function decorProp(url, mtl, x, z, fw, fh, rotY, collide) {
  const go = o => {
    if (rotY) o.rotation.y = rotY; scene.add(o);
    autoFit(o, fw, fw, fh);
    const box = groundModel(o, x, z);
    if (collide) {
      const w = box.max.x - box.min.x, d = box.max.z - box.min.z;
      colliders.push({
        minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2,
        topY: box.max.y, type: 'prop', name: 'streetprop'
      });
    }
  };
  if (mtl) loadOBJ(CITY + url, CITY + mtl, o => o && go(o));
  else fbxLoader.load(enc(CITY + url), o => o && go(o), undefined, () => {});
}
decorProp('Bus stop sign/bussy.fbx', null, -8, 14, 4, 4, 0, true);
decorProp('Bus stop sign/bussy.fbx', null, 10, -14, 4, 4, Math.PI, true);
decorProp('Traffic light/trafficlight_A.fbx', null, -8, -8, 1.5, 5, 0, true);
decorProp('Traffic light/trafficlight_C.fbx', null, 8, 8, 1.5, 5, Math.PI, true);
decorProp('Stop sign/1358 Stop Sign.obj', 'Stop sign/1358 Stop Sign.mtl', 8, -8, 1.2, 3, 0, false);
decorProp('Bike Warning Road Sign/bikes.fbx', null, 4, 12, 1.5, 3, 0, false);
decorProp('Path Straight/Path_Straight.fbx', null, 0, -34, 8, 1, 0, false);
decorProp('Path Straight/Path_Straight.fbx', null, 0, 34, 8, 1, 0, false);
decorProp('Road Bits/Road Bits.fbx', null, -34, 0, 8, 1, Math.PI / 2, false);
decorProp('Road Bits/Road Bits.fbx', null, 34, 0, 8, 1, Math.PI / 2, false);

// zipline hatları (yükseklik snaplenir)
const ziplines = [
  { a: new THREE.Vector3(-22, 13, -22), b: new THREE.Vector3(0, 15, -24) },
  { a: new THREE.Vector3(24, 16, 2), b: new THREE.Vector3(2, 13, 26) },
  { a: new THREE.Vector3(0, 13, -46), b: new THREE.Vector3(0, 15, -24) },
];
const zipLines = [], zipNodes = [];
ziplines.forEach(z => {
  const g = new THREE.BufferGeometry().setFromPoints([z.a, z.b]);
  const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x111111 }));
  scene.add(line); zipLines.push(line);
  [z.a, z.b].forEach(p => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(.4), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    s.position.copy(p); scene.add(s); zipNodes.push({ mesh: s, vec: p });
  });
});

// depo + teslim noktaları (Y snaplenir)
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

function topAt(x, z) {
  let top = 0;
  for (const c of colliders) {
    if (x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ && c.topY > top && c.topY < 60) top = c.topY;
  }
  return top;
}
let finalized = false;
function finalizeLevel() {
  if (finalized) return; finalized = true;
  skyline();
  fans.forEach((f, i) => {
    const roof = topAt(f.x, f.z) || 8;
    f.top = roof + 1;
    if (fanMeshes[i]) fanMeshes[i].position.y = roof + .5;
  });
  ziplines.forEach(z => {
    z.a.y = (topAt(z.a.x, z.a.z) || 10) + 1.5;
    z.b.y = (topAt(z.b.x, z.b.z) || 10) + 1.5;
  });
  zipLines.forEach((line, i) => {
    line.geometry.setFromPoints([ziplines[i].a, ziplines[i].b]);
  });
  zipNodes.forEach(n => n.mesh.position.copy(n.vec));
  destPoints.forEach(d => { d.p.y = (topAt(d.p.x, d.p.z) || 8) + .5; });
  if (job) beacon.position.set(destPoints[job.dest].p.x, destPoints[job.dest].p.y + 12, destPoints[job.dest].p.z);
  loadEl.style.display = 'none';
  document.getElementById('help').classList.remove('hidden');
}
manager.onLoad = finalizeLevel;
setTimeout(finalizeLevel, 25000); // file:// modunda modeller inmezse yedeklerle başla

// ---------- OYUNCU: Adventurer (animasyonlu) + yedek kukla ----------
const player = new THREE.Group();
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
const body = new THREE.Mesh(new THREE.BoxGeometry(.7, 1.1, .4), bodyMat);
body.position.y = 1.0; body.castShadow = true; player.add(body);
const head = new THREE.Mesh(new THREE.BoxGeometry(.45, .45, .45),
  new THREE.MeshStandardMaterial({ color: 0xfcd9a0 }));
head.position.y = 1.85; player.add(head);
// Kargo: gerçek Package FBX (Isa Lousberg) bu gruba biner
const pkgMesh = new THREE.Group();
pkgMesh.position.set(0, 1.25, -.42); pkgMesh.visible = false; player.add(pkgMesh);
fbxLoader.load(enc('assets/package/package.fbx'), o => {
  if (!o) return;
  const box = new THREE.Box3().setFromObject(o);
  const size = new THREE.Vector3(); box.getSize(size);
  o.scale.multiplyScalar(.55 / Math.max(size.x, size.y, size.z));
  const b2 = new THREE.Box3().setFromObject(o);
  o.position.sub(b2.getCenter(new THREE.Vector3()));
  o.traverse(m => { if (m.isMesh) m.castShadow = true; });
  pkgMesh.add(o);
}, undefined, () => {});
const bikeMesh = new THREE.Mesh(new THREE.BoxGeometry(.6, .5, 1.8),
  new THREE.MeshStandardMaterial({ color: 0x111827 }));
bikeMesh.position.y = .5; bikeMesh.visible = false; player.add(bikeMesh);
scene.add(player);

// Adventurer FBX + animasyonlar (Idle / Run / Walk / Wave / Death)
let heroModel = null, mixer = null, anims = {}, animState = '', waveT = 0, heroBaseY = 1;
function setAnim(name) {
  if (animState === name || !anims[name]) return;
  const prev = anims[animState];
  animState = name;
  const next = anims[name];
  next.reset();
  if (prev) next.crossFadeFrom(prev, .22, false);
  next.play();
}
fbxLoader.load(enc('assets/character/Adventurer.fbx'), o => {
  if (!o) return;
  heroModel = o;
  const box = new THREE.Box3().setFromObject(o);
  const size = new THREE.Vector3(); box.getSize(size);
  const s = 1.8 / Math.max(size.y, .01);
  o.scale.multiplyScalar(s);
  const b2 = new THREE.Box3().setFromObject(o);
  o.position.y -= b2.min.y;
  heroBaseY = o.scale.y;
  o.traverse(m => { if (m.isMesh) { m.castShadow = true; } });
  player.add(o);
  body.visible = false; head.visible = false;
  mixer = new THREE.AnimationMixer(o);
  const clips = o.animations || [];
  const pick = re => clips.find(c => re.test(c.name));
  [['idle', /idle/i], ['run', /run/i], ['walk', /walk/i], ['wave', /wave/i]].forEach(([k, re]) => {
    const c = pick(re);
    if (c) anims[k] = mixer.clipAction(c);
  });
  if (anims.idle) { anims.idle.play(); animState = 'idle'; }
  else if (clips.length) { anims.idle = mixer.clipAction(clips[0]); anims.idle.play(); animState = 'idle'; }
}, undefined, () => {});

// tembel yayalar: Casual + Punk (ilk klipleriyle yürür)
const walkers = [];
function spawnWalkers() {
  [['Casual Character/Casual_2.fbx', -6, -14], ['Punk/Punk.fbx', 8, 30]].forEach(([f, x, z]) => {
    fbxLoader.load(enc(CITY + f), o => {
      if (!o) return;
      const box = new THREE.Box3().setFromObject(o);
      const size = new THREE.Vector3(); box.getSize(size);
      o.scale.multiplyScalar(1.75 / Math.max(size.y, .01));
      o.traverse(m => { if (m.isMesh) m.castShadow = true; });
      scene.add(o);
      const w = { obj: o, t: Math.random() * 10, cx: x, cz: z, r: 6 + Math.random() * 4 };
      if (o.animations && o.animations.length) {
        w.mixer = new THREE.AnimationMixer(o);
        const a = w.mixer.clipAction(o.animations[0]); a.play();
      }
      walkers.push(w);
    }, undefined, () => {});
  });
}
setTimeout(spawnWalkers, 6000);

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
  if (anims.wave) { setAnim('wave'); waveT = 1.6; }
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
let shake = 0;
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
      $('mission-title').textContent = `${job.name} → ${destPoints[job.dest].label} (${P.pos.distanceTo(tgt).toFixed(0)}m)`;
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
  // animasyon durumu
  if (mixer) {
    mixer.update(dt);
    waveT -= dt;
    if (waveT <= 0) {
      const want = (!P.grounded || P.riding) ? 'run' : (P.speed > .6 ? 'run' : (P.speed > .1 && anims.walk ? 'walk' : 'idle'));
      setAnim(want);
      if (anims.run && animState === 'run') {
        const a = anims.run; a.timeScale = Math.max(.6, Math.min(1.7, P.speed / 8));
      }
    }
  }
  if (heroModel) heroModel.scale.y = heroBaseY * (P.slideT > 0 ? .6 : 1);
  else body.scale.y = P.slideT > 0 ? .55 : 1;
  // yayalar
  for (const w of walkers) {
    w.t += dt * .25;
    const wx = w.cx + Math.cos(w.t) * w.r, wz = w.cz + Math.sin(w.t) * w.r * .6;
    w.obj.position.set(wx, topAt(wx, wz), wz);
    w.obj.rotation.y = Math.atan2(-Math.sin(w.t) * w.r, Math.cos(w.t) * w.r * .6) + Math.PI / 2;
    if (w.mixer) w.mixer.update(dt);
  }

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
  renderer.render(scene, camera);
}
$('help-close').onclick = () => { $('help').classList.add('hidden'); initAudio(); };
$('job-close').onclick = () => $('job-menu').classList.add('hidden');
tick();
