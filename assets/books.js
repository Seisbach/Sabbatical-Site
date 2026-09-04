/* Bücherliste aus data/books.json */

const DATE_FMT = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" });

function parseDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

async function init() {
  const res = await fetch("data/books.json");
  const books = await res.json();
  const list = document.getElementById("book-list");

  if (books.length === 0) {
    list.innerHTML = `<div class="empty-state">Noch keine Bücher eingetragen.</div>`;
    return;
  }

  const sorted = [...books].sort((a, b) => parseDate(b.dateFinished) - parseDate(a.dateFinished));

  list.innerHTML = sorted
    .map(
      (b) => `
      <div class="book-card">
        <h3 class="book-title">${b.title}</h3>
        <div class="book-meta">${b.author} · gelesen ${DATE_FMT.format(parseDate(b.dateFinished))}</div>
        <p class="book-review">${b.review}</p>
      </div>`
    )
    .join("");
}

init();
