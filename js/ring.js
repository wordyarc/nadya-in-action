// 3D-карусель из фото: полароиды по кругу, имя — в центре кольца.
import * as THREE from "three";

const BG = 0xf5ede1;          // = --bg в CSS, туман растворяет дальние карточки в фоне
const PAPER = 0xfffaf2;
const INK = "#2b2320";
const R = 3;                  // радиус кольца
const CARD = 1.55;            // длинная сторона фото
const PAD = 0.07;             // рамка полароида
const PAD_BOTTOM = 0.26;      // нижнее поле полароида
const TITLE_Y = 1.6;          // имя висит над кольцом, чтобы карточки его не закрывали

// Изгибаем плоскость по цилиндру радиуса R (лицом наружу)
function bend(geo, lift = 0) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const a = pos.getX(i) / R;
    pos.setX(i, Math.sin(a) * (R + lift));
    pos.setZ(i, Math.cos(a) * (R + lift) - R);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

async function titleTexture(text) {
  try { await document.fonts.load('italic 700 200px "Playfair Display"'); } catch {}
  const W = 2048, H = 800;
  const c = Object.assign(document.createElement("canvas"), { width: W, height: H });
  const g = c.getContext("2d");
  let size = 600;
  const font = (s) => `italic 700 ${s}px "Playfair Display", Georgia, serif`;
  g.font = font(size);
  const maxW = W * 0.9;
  const m = g.measureText(text).width;
  if (m > maxW) { size = Math.floor((size * maxW) / m); g.font = font(size); }
  g.fillStyle = INK;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, W / 2, H * 0.52);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { tex, aspect: W / H };
}

function shadowTexture() {
  const c = Object.assign(document.createElement("canvas"), { width: 256, height: 256 });
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(128, 128, 40, 128, 128, 128);
  grd.addColorStop(0, "rgba(80,50,30,0.22)");
  grd.addColorStop(1, "rgba(80,50,30,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export async function initRing(container, { photos, title, onPick, reduceMotion = false }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 10, 20);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

  const ring = new THREE.Group();
  ring.rotation.z = -0.06;
  scene.add(ring);

  // ---------- карточки ----------
  const loader = new THREE.TextureLoader();
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const cards = [];
  const photoMeshes = [];
  const frameMat = new THREE.MeshBasicMaterial({ color: PAPER, side: THREE.DoubleSide });

  const loads = photos.map((p, i) => {
    const aspect = p.w / p.h;
    const pw = aspect >= 1 ? CARD : CARD * aspect;
    const ph = pw / aspect;
    const fw = pw + PAD * 2;
    const fh = ph + PAD + PAD_BOTTOM;

    const card = new THREE.Group();
    const angle = (i / photos.length) * Math.PI * 2;
    card.position.set(Math.sin(angle) * R, 0, Math.cos(angle) * R);
    card.rotation.y = angle;
    card.userData = { index: i, phase: i * 1.37 };

    const frame = new THREE.Mesh(bend(new THREE.PlaneGeometry(fw, fh, 24, 1)), frameMat);
    const photoGeo = new THREE.PlaneGeometry(pw, ph, 24, 1);
    photoGeo.translate(0, (PAD_BOTTOM - PAD) / 2, 0);
    const photoMat = new THREE.MeshBasicMaterial({ color: 0xe9dccb });
    const photo = new THREE.Mesh(bend(photoGeo, 0.006), photoMat);
    photo.userData.index = i;

    // обратная сторона: то же фото, но не зеркальное — видно у дальних карточек
    const backMat = new THREE.MeshBasicMaterial({ color: 0xe9dccb, side: THREE.BackSide });
    const back = new THREE.Mesh(bend(photoGeo.clone(), -0.006), backMat);

    card.add(frame, photo, back);
    ring.add(card);
    cards.push(card);
    photoMeshes.push(photo);

    return loader.loadAsync(`img/${p.id}-sm.webp`).then((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      photoMat.map = tex;
      photoMat.color.set(0xffffff);
      photoMat.needsUpdate = true;
      const mirrored = tex.clone();
      mirrored.repeat.set(-1, 1);
      mirrored.offset.set(1, 0);
      mirrored.needsUpdate = true;
      backMat.map = mirrored;
      backMat.color.set(0xffffff);
      backMat.needsUpdate = true;
    });
  });

  // ---------- имя в центре ----------
  const { tex: titleTex, aspect: titleAspect } = await titleTexture(title);
  const titleMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1 / titleAspect),
    new THREE.MeshBasicMaterial({ map: titleTex, transparent: true, depthWrite: false, fog: false })
  );
  titleMesh.position.y = TITLE_Y;
  scene.add(titleMesh);

  // ---------- мягкая тень под кольцом ----------
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(R * 2.8, R * 2.8),
    new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, fog: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -CARD * 0.78;
  scene.add(shadow);

  await Promise.all(loads);

  // ---------- раскладка под экран ----------
  let dist = 10, elev = 0.16, lookY = 0.45;
  function layout() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const portrait = camera.aspect < 0.85;
    const k = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const fitW = portrait ? R * 2 * 0.62 : R * 2 + 2.4;
    const fitH = portrait ? 4.2 : 6.2;
    dist = Math.max(fitW / (k * camera.aspect), fitH / k);
    elev = portrait ? 0.3 : 0.16;
    lookY = portrait ? 0 : 0.45;

    const visibleW = k * dist * camera.aspect;
    const tw = Math.min(R * 1.7, visibleW * 0.9);
    titleMesh.scale.setScalar(tw);

    scene.fog.near = dist - R * 0.3;
    scene.fog.far = dist + R * 2.2;
    camera.updateProjectionMatrix();
  }
  layout();
  new ResizeObserver(layout).observe(container);

  // ---------- взаимодействие ----------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let rot = 0, vel = 0, hovered = -1;
  let dragging = false, lastX = 0, downX = 0, downY = 0, moved = false, pointerId = null;
  const auto = reduceMotion ? 0 : 0.0016;

  function pick(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(photoMeshes, false)[0];
    return hit ? hit.object.userData.index : -1;
  }

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true; moved = false; pointerId = e.pointerId;
    lastX = downX = e.clientX; downY = e.clientY;
    vel = 0;
  });
  window.addEventListener("pointermove", (e) => {
    if (dragging && e.pointerId === pointerId) {
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) moved = true;
      rot += dx * 0.006;
      vel = dx * 0.006;
      canvas.style.cursor = "grabbing";
    } else if (e.target === canvas && e.pointerType === "mouse") {
      hovered = pick(e);
      canvas.style.cursor = hovered >= 0 ? "pointer" : "grab";
    }
  });
  const end = (e, cancelled) => {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    canvas.style.cursor = "grab";
    if (!cancelled && !moved) {
      const i = pick(e);
      if (i >= 0) onPick?.(i);
    }
  };
  window.addEventListener("pointerup", (e) => end(e, false));
  window.addEventListener("pointercancel", (e) => end(e, true));
  canvas.addEventListener("pointerleave", () => { if (!dragging) hovered = -1; });

  // скролл страницы тоже раскручивает кольцо
  let lastScroll = window.scrollY;
  window.addEventListener("scroll", () => {
    const dy = window.scrollY - lastScroll;
    lastScroll = window.scrollY;
    if (!reduceMotion) vel = THREE.MathUtils.clamp(vel + dy * 0.00022, -0.05, 0.05);
  }, { passive: true });

  // ---------- кадр ----------
  const clock = new THREE.Clock();
  const target = new THREE.Vector3();
  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05) * 60;
    const t = clock.elapsedTime;
    if (!dragging) {
      vel *= Math.pow(0.95, dt);
      rot += (auto + vel) * dt;
    }
    ring.rotation.y = rot;

    for (const c of cards) {
      c.position.y = reduceMotion ? 0 : Math.sin(t * 0.8 + c.userData.phase) * 0.06;
      const s = c.userData.index === hovered ? 1.06 : 1;
      c.scale.setScalar(THREE.MathUtils.lerp(c.scale.x, s, 0.15));
    }

    // уезжаем камерой вверх по мере скролла героя
    const rect = container.getBoundingClientRect();
    const p = THREE.MathUtils.clamp(-rect.top / (rect.height || 1), 0, 1);
    camera.position.set(0, dist * (elev + p * 0.35), dist * (1 + p * 0.15));
    target.set(0, lookY + p * 0.6, 0);
    camera.lookAt(target);
    titleMesh.quaternion.copy(camera.quaternion);

    renderer.render(scene, camera);
  }

  // рисуем только когда герой на экране
  let running = false;
  const setRunning = (v) => {
    if (v === running) return;
    running = v;
    if (v) clock.getDelta();
    renderer.setAnimationLoop(v ? tick : null);
  };
  new IntersectionObserver(([en]) => setRunning(en.isIntersecting)).observe(container);

  container.appendChild(canvas);
  canvas.style.cursor = "grab";
  tick();
  setRunning(true);
}
