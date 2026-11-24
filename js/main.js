import { SITE, PHOTOS } from "./data.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const transition = (fn) =>
  document.startViewTransition && !reduceMotion ? document.startViewTransition(fn) : (fn(), null);

/* ---------- дневник ---------- */
const grid = $("#grid");
PHOTOS.forEach((p, i) => {
  const fig = document.createElement("figure");
  fig.className = "polaroid";
  fig.style.setProperty("--r", `${p.tilt}deg`);

  const btn = document.createElement("button");
  btn.className = "polaroid-btn";
  btn.setAttribute("aria-label", `Открыть фото: ${p.caption}`);

  const img = new Image(p.w, p.h);
  img.src = `img/${p.id}-sm.webp`;
  img.alt = p.alt;
  img.loading = "lazy";
  img.decoding = "async";
  btn.append(img);

  const cap = document.createElement("figcaption");
  cap.textContent = p.caption;

  btn.addEventListener("click", () => openPhoto(i, img));
  fig.append(btn, cap);
  grid.append(fig);
});

/* ---------- лайтбокс ---------- */
const lb = $("#lightbox");
const lbImg = $("#lbImg");
const lbCap = $("#lbCap");
let current = 0;

function setPhoto(i) {
  current = (i + PHOTOS.length) % PHOTOS.length;
  const p = PHOTOS[current];
  lbImg.width = p.w;
  lbImg.height = p.h;
  lbImg.alt = p.alt;
  lbImg.src = `img/${p.id}-sm.webp`; // уже в кэше — показываем сразу
  lbCap.textContent = p.caption;
  const big = new Image();
  big.src = `img/${p.id}.webp`;
  big.decode().then(() => { if (current === i) lbImg.src = big.src; }).catch(() => {});
}

function openPhoto(i, fromEl) {
  const open = () => { setPhoto(i); if (!lb.open) lb.showModal(); };
  if (!fromEl || !document.startViewTransition || reduceMotion) return open();
  fromEl.style.viewTransitionName = "photo";
  const t = document.startViewTransition(() => {
    fromEl.style.viewTransitionName = "";
    lbImg.style.viewTransitionName = "photo";
    open();
  });
  t.finished.finally(() => (lbImg.style.viewTransitionName = ""));
}

const step = (d) => transition(() => setPhoto(current + d));
$$(".lb-nav").forEach((b) => b.addEventListener("click", () => step(+b.dataset.dir)));
$(".lb-close").addEventListener("click", () => lb.close());
lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
lb.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") step(1);
  if (e.key === "ArrowLeft") step(-1);
});
let swipeX = null;
lb.addEventListener("pointerdown", (e) => (swipeX = e.clientX));
lb.addEventListener("pointerup", (e) => {
  if (swipeX === null) return;
  const dx = e.clientX - swipeX;
  swipeX = null;
  if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
});

/* ---------- Надя / Надежда Вениаминовна ---------- */
const lives = $("#lives");
$$(".switch button", lives).forEach((btn) =>
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;
    if (lives.dataset.mode === mode) return;
    transition(() => {
      lives.dataset.mode = mode;
      $$(".switch button", lives).forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
      $$("[data-panel]", lives).forEach((p) => (p.hidden = p.dataset.panel !== mode));
    });
  })
);

/* ---------- видео: играет только когда видно ---------- */
const video = $("#reel");
if (reduceMotion) {
  video.removeAttribute("autoplay");
  video.controls = true;
} else {
  new IntersectionObserver(([e]) => (e.isIntersecting ? video.play().catch(() => {}) : video.pause()), {
    threshold: 0.25,
  }).observe(video);
}

/* ---------- ссылки ---------- */
$$("[data-tg]").forEach((a) => (a.href = SITE.telegram.url));
if (SITE.youtube) {
  const yt = $("#ytLink");
  yt.href = SITE.youtube;
  yt.hidden = false;
}
$("#year").textContent = new Date().getFullYear();

/* ---------- 3D ---------- */
const hero = $("#hero");
import("./ring.js")
  .then((m) =>
    m.initRing($("#stage"), {
      photos: PHOTOS,
      title: SITE.name,
      reduceMotion,
      onPick: (i) => openPhoto(i),
    })
  )
  .then(() => hero.classList.add("is-3d"))
  .catch((err) => console.warn("3D выключено:", err));
