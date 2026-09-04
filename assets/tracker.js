/* Schreibfortschritt: Heatmap, Streaks und Tages-Feed aus data/entries.json */

const DATE_FMT = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" });
const DATE_FMT_SHORT = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short" });

function parseDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfWeek(date) {
  // Woche beginnt Montag
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  return addDays(d, -day);
}

function diffWords(entry) {
  return entry.endWords - entry.startWords;
}

async function loadEntries() {
  const res = await fetch("data/entries.json");
  const raw = await res.json();
  return raw
    .map((e) => ({ ...e, dateObj: parseDate(e.date) }))
    .sort((a, b) => a.dateObj - b.dateObj);
}

function computeStreaks(entries) {
  if (entries.length === 0) return { current: 0, longest: 0 };
  const days = new Set(entries.map((e) => e.date));
  const sortedDates = entries.map((e) => e.dateObj).sort((a, b) => a - b);

  let longest = 0;
  let running = 0;
  let prev = null;
  for (const d of sortedDates) {
    if (prev && toKey(addDays(prev, 1)) === toKey(d)) {
      running += 1;
    } else {
      running = 1;
    }
    longest = Math.max(longest, running);
    prev = d;
  }

  // Aktuelle Streak: von heute (oder gestern) rückwärts zählen
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let cursor = days.has(toKey(today)) ? today : addDays(today, -1);
  let current = 0;
  while (days.has(toKey(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { current, longest };
}

function computeStats(entries) {
  const totalWords = entries.reduce((sum, e) => sum + diffWords(e), 0);
  const totalMinutes = entries.reduce((sum, e) => sum + (e.minutes || 0), 0);
  const avgWords = entries.length ? Math.round(totalWords / entries.length) : 0;
  const { current, longest } = computeStreaks(entries);
  return { totalWords, totalMinutes, avgWords, current, longest };
}

function renderStats(stats) {
  const el = document.getElementById("stats");
  const hours = Math.floor(stats.totalMinutes / 60);
  const mins = stats.totalMinutes % 60;
  const timeStr = hours > 0 ? `${hours} h ${mins} min` : `${mins} min`;

  const cards = [
    { value: `${stats.current} 🔥`, label: "Aktuelle Streak (Tage)" },
    { value: stats.longest, label: "Längste Streak (Tage)" },
    { value: stats.totalWords.toLocaleString("de-DE"), label: "Wörter netto gesamt" },
    { value: stats.avgWords.toLocaleString("de-DE"), label: "Ø Wörter / Eintrag" },
    { value: timeStr, label: "Schreibzeit gesamt" },
  ];

  el.innerHTML = cards
    .map(
      (c) => `
      <div class="stat-card">
        <div class="stat-value">${c.value}</div>
        <div class="stat-label">${c.label}</div>
      </div>`
    )
    .join("");
}

function colorForDiff(diff, maxAbsPositive) {
  if (diff === null || diff === undefined) return "var(--scale-0)";
  if (diff < 0) return "var(--scale-neg)";
  if (diff === 0) return "var(--scale-0)";
  const ratio = maxAbsPositive > 0 ? diff / maxAbsPositive : 0;
  if (ratio > 0.75) return "var(--scale-4)";
  if (ratio > 0.5) return "var(--scale-3)";
  if (ratio > 0.25) return "var(--scale-2)";
  return "var(--scale-1)";
}

function renderHeatmap(entries) {
  const grid = document.getElementById("heatmap-grid");
  const byDate = new Map(entries.map((e) => [e.date, e]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstEntryDate = entries.length ? entries[0].dateObj : today;
  const start = startOfWeek(firstEntryDate);
  const end = addDays(startOfWeek(today), 6);

  const maxDiff = Math.max(0, ...entries.map((e) => diffWords(e)));

  const cells = [];
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    const key = toKey(d);
    const entry = byDate.get(key);
    const diff = entry ? diffWords(entry) : null;
    const color = entry ? colorForDiff(diff, maxDiff) : "var(--scale-0)";
    const isFuture = d > today;
    const title = entry
      ? `${DATE_FMT.format(d)}: ${diff >= 0 ? "+" : ""}${diff} Wörter, ${entry.minutes} min`
      : isFuture
      ? ""
      : `${DATE_FMT.format(d)}: kein Eintrag`;
    cells.push(
      `<div class="heatmap-cell" style="background:${isFuture ? "transparent" : color}" title="${title}"></div>`
    );
  }
  grid.innerHTML = cells.join("");
}

function trendForEntry(entry, index, sortedAsc) {
  // Vergleich mit dem gleitenden Durchschnitt der letzten bis zu 7 vorherigen Einträge
  const windowStart = Math.max(0, index - 7);
  const prior = sortedAsc.slice(windowStart, index);
  if (prior.length === 0) return null;
  const avg = prior.reduce((s, e) => s + diffWords(e), 0) / prior.length;
  const diff = diffWords(entry);
  const delta = diff - avg;
  if (Math.abs(delta) < Math.max(20, avg * 0.1)) return { label: "≈ Durchschnitt", cls: "" };
  return delta > 0
    ? { label: `▲ über Ø (${Math.round(avg)})`, cls: "up" }
    : { label: `▼ unter Ø (${Math.round(avg)})`, cls: "down" };
}

function renderFeed(entries) {
  const feed = document.getElementById("feed");
  if (entries.length === 0) {
    feed.innerHTML = `<div class="empty-state">Noch keine Einträge. Leg mit "+ Neuer Eintrag" los.</div>`;
    return;
  }
  const sortedAsc = entries;
  const sortedDesc = [...entries].reverse();

  feed.innerHTML = sortedDesc
    .map((entry) => {
      const idx = sortedAsc.indexOf(entry);
      const diff = diffWords(entry);
      const trend = trendForEntry(entry, idx, sortedAsc);
      const sign = diff >= 0 ? "+" : "";
      const wordsCls = diff >= 0 ? "up" : "down";
      return `
        <div class="entry">
          <div class="entry-date">${DATE_FMT_SHORT.format(entry.dateObj)}</div>
          <div class="entry-body">
            <div class="entry-metrics">
              <span class="entry-words ${wordsCls}">${sign}${diff.toLocaleString("de-DE")} Wörter</span>
              ${trend ? `<span class="entry-trend ${trend.cls}">${trend.label}</span>` : ""}
              <span class="entry-minutes">· ${entry.minutes} min</span>
            </div>
            ${entry.note ? `<div class="entry-note">${entry.note}</div>` : ""}
          </div>
        </div>`;
    })
    .join("");
}

async function init() {
  const entries = await loadEntries();
  const stats = computeStats(entries);
  renderStats(stats);
  renderHeatmap(entries);
  renderFeed(entries);

  // Heatmap horizontal ganz nach rechts scrollen (aktuellster Tag sichtbar)
  const scrollEl = document.querySelector(".heatmap-scroll");
  if (scrollEl) scrollEl.scrollLeft = scrollEl.scrollWidth;
}

init();
