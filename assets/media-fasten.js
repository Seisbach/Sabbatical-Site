/* Media-Fasten: Live-Streak, Garten-Visualisierung und Verlauf aus data/media-fast.json */

const CATEGORY_LABELS = {
  skill: "Skill-Lernen",
  freunde: "Mit Freunden",
  sonstiges: "Sonstiges",
};
const BREAKING_CATEGORY = "sonstiges";

const DATE_TIME_FMT = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});
const DATE_FMT = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Berlin",
});

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}T ${hours}Std ${minutes}Min`;
  if (hours > 0) return `${hours}Std ${minutes}Min ${seconds}Sek`;
  return `${minutes}Min ${seconds}Sek`;
}

function formatHours(ms) {
  const hours = ms / 3600000;
  if (hours < 1) return `${Math.round(ms / 60000)} min`;
  return `${hours.toFixed(1)} h`;
}

function breakingEntries(entries) {
  return entries.filter((e) => e.category === BREAKING_CATEGORY).sort((a, b) => new Date(a.end) - new Date(b.end));
}

function currentStreakAnchor(entries, challengeStart) {
  const breaks = breakingEntries(entries);
  if (breaks.length === 0) return { anchor: new Date(challengeStart), lastBreak: null };
  const lastBreak = breaks[breaks.length - 1];
  return { anchor: new Date(lastBreak.end), lastBreak };
}

function longestStreakMs(entries, challengeStart, now) {
  const breaks = breakingEntries(entries);
  const points = [new Date(challengeStart), ...breaks.map((e) => new Date(e.end)), now];
  let longest = 0;
  for (let i = 1; i < points.length; i++) {
    longest = Math.max(longest, points[i] - points[i - 1]);
  }
  return longest;
}

function gardenStage(streakMs) {
  const hours = streakMs / 3600000;
  if (hours < 2) return { key: "0", caption: "Kahler Boden" };
  if (hours < 8) return { key: "1", caption: "Sprössling" };
  if (hours < 24) return { key: "2", caption: "Junge Pflanze" };
  if (hours < 72) return { key: "3", caption: "Kleiner Garten" };
  if (hours < 168) return { key: "4", caption: "Blühender Garten" };
  return { key: "5", caption: "Voller Blütengarten" };
}

function renderGarden(streakMs, lastBreak, now) {
  const stages = document.querySelectorAll(".garden-stage");
  const justBroke = lastBreak && now - new Date(lastBreak.end) < 60 * 60 * 1000;
  const activeKey = justBroke ? "burnt" : gardenStage(streakMs).key;

  stages.forEach((el) => {
    el.style.opacity = el.dataset.stage === activeKey ? "1" : "0";
  });

  const caption = document.getElementById("garden-caption");
  caption.textContent = justBroke ? "Frisch verbrannt 🔥 — wächst wieder von vorne" : gardenStage(streakMs).caption;
}

function renderChallengeInfo(challengeEnd, now) {
  const sub = document.getElementById("challenge-sub");
  const endDate = new Date(challengeEnd);
  const dateStr = DATE_FMT.format(endDate);
  if (now <= endDate) {
    const daysLeft = Math.ceil((endDate - now) / 86400000);
    sub.textContent = `Challenge läuft bis ${dateStr} — noch ${daysLeft} Tag${daysLeft === 1 ? "" : "e"}.`;
  } else {
    sub.textContent = `Challenge-Zeitraum beendet am ${dateStr} — Verlauf bleibt archiviert, der Counter läuft trotzdem weiter.`;
  }
}

function renderCategorySummary(entries) {
  const totals = { skill: 0, freunde: 0, sonstiges: 0 };
  entries.forEach((e) => {
    totals[e.category] += new Date(e.end) - new Date(e.start);
  });
  const el = document.getElementById("category-summary");
  el.innerHTML = Object.entries(CATEGORY_LABELS)
    .map(
      ([key, label]) => `
      <div class="stat-card">
        <div class="stat-value fast-category-total">${formatHours(totals[key])}</div>
        <div class="stat-label">${label}</div>
      </div>`
    )
    .join("");
}

function renderHistory(entries) {
  const el = document.getElementById("fast-history");
  if (entries.length === 0) {
    el.innerHTML = `<div class="empty-state">Noch keine Einträge — bisher ungebrochene Streak seit Challenge-Start.</div>`;
    return;
  }
  const sorted = [...entries].sort((a, b) => new Date(b.start) - new Date(a.start));
  el.innerHTML = sorted
    .map((e) => {
      const start = new Date(e.start);
      const end = new Date(e.end);
      const breaks = e.category === BREAKING_CATEGORY;
      const badge = breaks
        ? `<span class="fast-badge badge-break">bricht Streak</span>`
        : `<span class="fast-badge badge-ok">erlaubt</span>`;
      return `
        <div class="entry">
          <div class="entry-date">${DATE_TIME_FMT.format(start)}</div>
          <div class="entry-body">
            <div class="entry-metrics">
              <span class="entry-words">${CATEGORY_LABELS[e.category]}</span>
              ${badge}
              <span class="entry-minutes">· ${formatHours(end - start)}</span>
            </div>
            ${e.note ? `<div class="entry-note">${e.note}</div>` : ""}
          </div>
        </div>`;
    })
    .join("");
}

async function init() {
  const res = await fetch("data/media-fast.json");
  const data = await res.json();
  const { challengeStart, challengeEnd, entries } = data;

  renderCategorySummary(entries);
  renderHistory(entries);

  function tick() {
    const now = new Date();
    const { anchor, lastBreak } = currentStreakAnchor(entries, challengeStart);
    const streakMs = now - anchor;
    const longestMs = Math.max(streakMs, longestStreakMs(entries, challengeStart, now));

    document.getElementById("live-counter").textContent = formatDuration(streakMs);
    document.getElementById("best-streak").textContent = formatDuration(longestMs);
    renderGarden(streakMs, lastBreak, now);
    renderChallengeInfo(challengeEnd, now);
  }

  tick();
  setInterval(tick, 1000);
}

init();
