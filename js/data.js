// ✏️ Всё, что можно менять без кода, — здесь.

export const SITE = {
  name: "Надя",
  telegram: { title: "SM daily", handle: "smdailyy", url: "https://t.me/smdailyy" },
  youtube: "https://www.youtube.com/@SMdaily",
};

// id — имя файла в img/ (id.webp и id-sm.webp), w/h — размеры -sm версии
// tilt — наклон карточки в дневнике (градусы)
export const PHOTOS = [
  { id: "leaves",   w: 720, h: 960,  tilt: -3,  caption: "листья краснеют — я тоже",     alt: "Надя под красными осенними листьями" },
  { id: "wardrobe", w: 720, h: 1081, tilt: 2,   caption: "нашла вход в Нарнию",          alt: "Надя в шкафу с шубами" },
  { id: "mirror",   w: 720, h: 960,  tilt: -1.5, caption: "зеркало + подруга = контент", alt: "Селфи в зеркале с подругой" },
  { id: "flowers",  w: 720, h: 1081, tilt: 3,   caption: "цветочное настроение",         alt: "Надя у стены с бумажными цветами" },
  { id: "pond",     w: 720, h: 960,  tilt: -2,  caption: "тыквы, пруд и немного осени",  alt: "Надя на мостике у пруда с тыквами" },
  { id: "outfit",   w: 720, h: 960,  tilt: 1.5, caption: "образ дня ✓",                  alt: "Надя в зеркале: рубашка и серый жилет" },
  { id: "kino",     w: 720, h: 960,  tilt: -2.5, caption: "вечер в кино",                alt: "Надя с подругами в фойе кинотеатра" },
  { id: "summer",   w: 960, h: 720,  tilt: 2,   caption: "лето, наушники и 😗",          alt: "Летнее селфи Нади" },
];

// YouTube: обложки лежат в img/yt/<id>.webp
// views — примерные (YouTube округляет), duration — в секундах
export const YOUTUBE = {
  subscribers: "1,3 тыс.",
  videos: 77,
  quote: "Могу внезапно пропасть, но обязательно вернусь обратно 🤓",
  list: [
    { id: "folN3izf14Q", duration: 2107, views: 586,   title: "Q&A | Поговорим с Миланой ☕️ Корея, учёба и многое другое" },
    { id: "LHt064tz10k", duration: 290,  views: 248,   title: "возвращение блудной НАДИ 😱" },
    { id: "LSYXJvKTXmA", duration: 822,  views: 495,   title: "VLOG: trip во Владивоток 🛤️" },
    { id: "TjmjNW_nCT0", duration: 738,  views: 20000, title: "МИНУСЫ ДВФУ: четко и по фактам 🫡" },
    { id: "KDNlR08Opfk", duration: 1016, views: 15000, title: "Необходимо знать перед приездом во Владивосток // ДВФУ ‼️" },
    { id: "DZ-3-1Li9bY", duration: 506,  views: 3500,  title: "VLOG: 24 часа говорю на корейском 🇰🇷" },
    { id: "9uciPzKem2Y", duration: 362,  views: 2600,  title: "МОЙ ВЫПУСКНОЙ 👩🏻‍🎓 пока ДВФУ" },
    { id: "Pdy5b21BI3g", duration: 877,  views: 1000,  title: "МОЙ ПЕРВЫЙ РАБОЧИЙ МЕСЯЦ 👩🏻‍💻" },
    { id: "qnr7zgGclLU", duration: 817,  views: 8500,  title: "VLOG: заселение 2022 — последний обзор на общагу ДВФУ 😢" },
    { id: "ZjKATeLT5Rk", duration: 870,  views: 230,   title: "GRWM: New Year edition | перевоплощение в Санту" },
  ],
};
