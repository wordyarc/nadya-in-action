import { SITE, PHOTOS, YOUTUBE } from "./data.js";
import { initFly } from "./fly.js";

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

/* ---------- YouTube ---------- */
const plural = (n, one, few, many) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
};
const fmtViews = (n) =>
  n >= 1000 ? `${String(+(n / 1000).toFixed(1)).replace(".", ",")} тыс. просмотров` : `${n} ${plural(n, "просмотр", "просмотра", "просмотров")}`;
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

$("#ytQuote").textContent = YOUTUBE.quote;
[`▶ ${YOUTUBE.videos} видео`, `♥ ${YOUTUBE.subscribers} подписчиков`].forEach((t) => {
  const li = document.createElement("li");
  li.textContent = t;
  $("#ytStats").append(li);
});

const rail = $("#ytRail");
YOUTUBE.list.forEach((v) => {
  const li = document.createElement("li");
  li.className = "yt-card";
  li.innerHTML = `
    <a target="_blank" rel="noopener">
      <span class="yt-cover"><img width="640" height="360" loading="lazy" decoding="async" alt=""><span class="yt-time"></span><span class="yt-play" aria-hidden="true"></span></span>
      <span class="yt-title"></span>
      <span class="yt-views"></span>
    </a>`;
  li.querySelector("a").href = `https://www.youtube.com/watch?v=${v.id}`;
  li.querySelector("img").src = `img/yt/${v.id}.webp`;
  li.querySelector(".yt-time").textContent = fmtTime(v.duration);
  li.querySelector(".yt-title").textContent = v.title;
  li.querySelector(".yt-views").textContent = fmtViews(v.views);
  rail.append(li);
});
$$(".yt-arrow").forEach((b) =>
  b.addEventListener("click", () => {
    const card = rail.querySelector(".yt-card");
    rail.scrollBy({ left: +b.dataset.dir * (card.offsetWidth + 20) * 2, behavior: reduceMotion ? "auto" : "smooth" });
  })
);

/* ---------- ссылки ---------- */
$$("[data-tg]").forEach((a) => (a.href = SITE.telegram.url));
$$("[data-yt]").forEach((a) => (a.href = SITE.youtube));
if (SITE.youtube) {
  const yt = $("#ytLink");
  yt.href = SITE.youtube;
  yt.hidden = false;
}
$("#year").textContent = new Date().getFullYear();

/* ---------- герой ---------- */
initFly({ photos: PHOTOS, videos: YOUTUBE.list, reduceMotion, onPhoto: openPhoto });
