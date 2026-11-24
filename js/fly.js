// Герой «Полёт сквозь дневник»: фото, обложки YouTube и эмодзи висят в 3D,
// скролл двигает камеру сквозь них. Глубину считает CSS (--p от 0 до 1),
// здесь только раскладка карточек, наклон за курсором и запасной вариант скролла.

const EMOJIS = ["🐻", "✿", "🍂", "🎬", "🇰🇷", "☕", "📸", "✨"];

export function initFly({ photos, videos, onPhoto, reduceMotion = false }) {
  const hero = document.getElementById("hero");
  const scene = document.getElementById("flyScene");
  const depth = parseFloat(getComputedStyle(hero).getPropertyValue("--depth")) || 5200;

  // чередуем: фото → видео → эмодзи
  const seq = [];
  const n = Math.max(photos.length, videos.length);
  for (let i = 0; i < n; i++) {
    if (photos[i]) seq.push({ type: "photo", index: i, p: photos[i] });
    if (videos[i]) seq.push({ type: "video", v: videos[i] });
    if (EMOJIS[i] && i % 2 === 0) seq.push({ type: "emoji", e: EMOJIS[i] });
  }

  const zNear = 1500;          // на старте карточки ещё в тумане — имя читается чисто
  const zFar = depth - 900;    // к концу все пролетели — «SM daily» остаётся один
  const golden = Math.PI * (3 - Math.sqrt(5));

  seq.forEach((it, k) => {
    let el;
    if (it.type === "photo") {
      el = document.createElement("button");
      el.className = "fly-item fly-photo";
      const img = new Image(it.p.w, it.p.h);
      img.src = `img/${it.p.id}-sm.webp`;
      img.alt = "";
      img.decoding = "async";
      el.append(img);
      el.addEventListener("click", () => onPhoto?.(it.index, img));
    } else if (it.type === "video") {
      el = document.createElement("a");
      el.className = "fly-item fly-video";
      el.href = `https://www.youtube.com/watch?v=${it.v.id}`;
      el.target = "_blank";
      el.rel = "noopener";
      el.innerHTML = '<img width="640" height="360" alt="" decoding="async"><span class="fly-yt">▶ YouTube</span><span class="fly-video-title"></span>';
      el.querySelector("img").src = `img/yt/${it.v.id}.webp`;
      el.querySelector(".fly-video-title").textContent = it.v.title;
    } else {
      el = document.createElement("span");
      el.className = "fly-item fly-emoji";
      el.textContent = it.e;
    }

    // спираль вокруг центра: середина экрана остаётся свободной под заголовки
    const a = k * golden + 0.6;
    const r = (it.type === "emoji" ? 20 : 27) + (k % 4) * 4.5;
    const x = Math.cos(a) * r * 1.25;     // vw
    const y = Math.sin(a) * r * 0.82;     // svh
    const z = -(zNear + (k / (seq.length - 1)) * (zFar - zNear));
    const rot = (k % 2 ? 1 : -1) * (2 + ((k * 7) % 6));

    el.style.cssText = `--x:${x.toFixed(2)};--y:${y.toFixed(2)};--z:${z.toFixed(0)};--rot:${rot}`;
    // дубли галереи и YouTube-ленты ниже: скринридерам и Tab их не показываем
    el.setAttribute("aria-hidden", "true");
    el.tabIndex = -1;
    scene.append(el);
  });

  // ---------- запасной вариант, если браузер не умеет animation-timeline ----------
  if (!CSS.supports("animation-timeline: view()") && !reduceMotion) {
    let queued = false;
    const update = () => {
      queued = false;
      const r = hero.getBoundingClientRect();
      const max = r.height - innerHeight || 1;
      hero.style.setProperty("--p", Math.min(1, Math.max(0, -r.top / max)).toFixed(4));
    };
    const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    update();
  }

  // ---------- наклон сцены за курсором / телефоном ----------
  if (reduceMotion) return;
  let tx = 0, ty = 0, cx = 0, cy = 0, visible = true, raf = 0;
  const clamp = (v) => Math.max(-1, Math.min(1, v));

  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    tx = (e.clientX / innerWidth) * 2 - 1;
    ty = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  addEventListener("deviceorientation", (e) => {
    if (e.gamma == null) return;
    tx = clamp(e.gamma / 25);
    ty = clamp((e.beta - 50) / 25);
  });

  const loop = () => {
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;
    scene.style.setProperty("--mx", cx.toFixed(4));
    scene.style.setProperty("--my", cy.toFixed(4));
    raf = visible ? requestAnimationFrame(loop) : 0;
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(loop);
  }).observe(hero);
}
