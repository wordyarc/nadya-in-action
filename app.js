(() => {
  const $ = (s) => document.querySelector(s);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const chat = $("#chat");
  const answers = $("#answers");
  const statusEl = $("#status");
  const meter = $("#meter");

  let suspicion = 0;
  let qi = 0;
  let run = 0; // id текущего прохода: при рестарте старые таймеры молча выходят
  let timer = null;
  let locked = false;

  // ---------- общие ----------
  function show(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
    window.scrollTo(0, 0);
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function vibrate(ms) {
    try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {}
  }

  document.querySelectorAll("[data-agent]").forEach((el) => (el.textContent = LEGEND.agent));

  // ---------- брифинг ----------
  const dl = $("#legendList");
  BRIEFING.facts.forEach(([k, v]) => {
    const row = document.createElement("div");
    row.innerHTML = "<dt></dt><dd></dd>";
    row.querySelector("dt").textContent = k;
    row.querySelector("dd").textContent = v;
    dl.appendChild(row);
  });
  const ul = $("#rulesList");
  BRIEFING.rules.forEach((r) => {
    const li = document.createElement("li");
    li.textContent = r;
    ul.appendChild(li);
  });

  // ---------- чат ----------
  function scrollDown() {
    chat.scrollTo({ top: chat.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function bubble(who, text) {
    const b = document.createElement("div");
    b.className = `msg ${who}`;
    b.textContent = text;
    chat.appendChild(b);
    scrollDown();
  }

  async function ira(lines, r) {
    for (const line of lines) {
      if (r !== run) return false;
      statusEl.textContent = "говорит…";
      const t = document.createElement("div");
      t.className = "msg ira typing";
      t.innerHTML = "<i></i><i></i><i></i>";
      chat.appendChild(t);
      scrollDown();
      await sleep(450 + Math.min(line.length * 28, 1300));
      t.remove();
      if (r !== run) return false;
      bubble("ira", line);
      statusEl.textContent = "сидит напротив";
      await sleep(250);
    }
    return r === run;
  }

  function setSuspicion(v) {
    suspicion = Math.max(0, Math.min(100, v));
    $("#meterFill").style.width = suspicion + "%";
    $("#meterPct").textContent = suspicion + "%";
    meter.dataset.level = suspicion >= 70 ? "hot" : suspicion >= 35 ? "warm" : "cool";
    $("#meterHint").textContent = HINTS.find(([max]) => suspicion <= max)[1];
  }

  function bump() {
    meter.classList.remove("bump");
    void meter.offsetWidth;
    meter.classList.add("bump");
  }

  function renderAnswers(q, r) {
    answers.innerHTML = "";
    locked = false;

    shuffle(q.answers.slice()).forEach((a) => {
      const btn = document.createElement("button");
      btn.className = "answer";
      btn.textContent = a.text;
      btn.addEventListener("click", () => choose(a, r));
      answers.appendChild(btn);
    });

    if (q.timer) {
      const bar = document.createElement("div");
      bar.className = "timer";
      bar.innerHTML = '<div class="timer-fill"></div><span>Ира ждёт ответа…</span>';
      bar.querySelector(".timer-fill").style.animationDuration = q.timer + "s";
      answers.prepend(bar);
      timer = setTimeout(
        () => choose({ text: q.timeoutText, delta: q.timeoutDelta, reaction: q.timeoutReaction }, r),
        q.timer * 1000
      );
    }
    scrollDown();
  }

  async function choose(a, r) {
    if (r !== run || locked) return;
    locked = true;
    clearTimeout(timer);
    answers.innerHTML = "";

    bubble("me", a.text);
    await sleep(350);
    if (r !== run) return;

    if (a.delta > 0) {
      setSuspicion(suspicion + a.delta);
      bump();
      vibrate(a.delta >= 30 ? [60, 40, 60] : 40);
    }

    if (!(await ira(a.reaction, r))) return;

    if (suspicion >= 100) {
      await sleep(900);
      if (r === run) fail(a.text);
      return;
    }

    qi++;
    next(r);
  }

  async function next(r) {
    if (qi >= QUESTIONS.length) {
      $("#qcount").textContent = "";
      if (!(await ira(FINALE, r))) return;
      await sleep(1200);
      if (r === run) win();
      return;
    }
    $("#qcount").textContent = `${qi + 1}/${QUESTIONS.length}`;
    if (!(await ira(QUESTIONS[qi].ira, r))) return;
    renderAnswers(QUESTIONS[qi], r);
  }

  async function start() {
    run++;
    clearTimeout(timer);
    const r = run;
    qi = 0;
    chat.innerHTML = "";
    answers.innerHTML = "";
    setSuspicion(0);
    statusEl.textContent = "сидит напротив";
    show("interrogation");
    await sleep(500);
    next(r);
  }

  // ---------- финалы ----------
  function fail(text) {
    run++;
    vibrate([120, 60, 120, 60, 200]);
    $("#failQuote").textContent = `«${text}»`;
    show("fail");
  }

  function win() {
    run++;
    const [, level, note] = LEVELS.find(([max]) => suspicion <= max);
    const tomorrow = new Date(Date.now() + 864e5);
    $("#certNo").textContent = String(Math.floor(1000 + Math.random() * 9000));
    $("#certLevel").textContent = level;
    $("#certPct").textContent = suspicion + "%";
    $("#certDate").textContent = tomorrow.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
    $("#certNote").textContent = note;
    show("win");
  }

  // ---------- кнопки ----------
  $("#toBriefing").addEventListener("click", () => show("briefing"));
  $("#toInterrogation").addEventListener("click", start);
  $("#retryFromFail").addEventListener("click", start);
  $("#reviewLegend").addEventListener("click", () => show("briefing"));
  $("#retryFromWin").addEventListener("click", start);
})();
