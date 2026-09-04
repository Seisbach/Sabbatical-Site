/* Generiert einen JSON-Eintrag zum Einfügen in data/entries.json */

const GITHUB_REPO = "seisbach/sabbatical-site";
const GITHUB_BRANCH = "main"; // Passe das an, falls dein Standard-Branch anders heißt.

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function init() {
  const dateInput = document.getElementById("date");
  dateInput.value = todayStr();

  const editLink = document.getElementById("edit-link");
  editLink.href = `https://github.com/${GITHUB_REPO}/edit/${GITHUB_BRANCH}/data/entries.json`;

  document.getElementById("entry-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const date = dateInput.value;
    const startWords = Number(document.getElementById("startWords").value);
    const endWords = Number(document.getElementById("endWords").value);
    const minutes = Number(document.getElementById("minutes").value);
    const note = document.getElementById("note").value.trim();

    const entry = { date, startWords, endWords, minutes, note };
    const diff = endWords - startWords;

    const json = JSON.stringify(entry, null, 2) + ",";
    const output = document.getElementById("output");
    output.textContent = json;
    document.getElementById("output-block").style.display = "block";

    const summary = document.getElementById("summary");
    const sign = diff >= 0 ? "+" : "";
    summary.textContent = `${sign}${diff} Wörter in ${minutes} min.`;
  });

  document.getElementById("copy-btn").addEventListener("click", async () => {
    const text = document.getElementById("output").textContent;
    await navigator.clipboard.writeText(text);
    const toast = document.getElementById("copy-toast");
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1800);
  });
}

init();
