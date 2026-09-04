# Sabbatical-Sachbuch — Schreibfortschritt

Eine minimalistische, statische GitHub-Pages-Seite, um den täglichen
Fortschritt beim Schreiben eines Buchs zu tracken (Wortanzahl, Schreibzeit,
Tageskommentar, Streaks) und nebenbei gelesene Bücher mit Kurzreview zu
sammeln.

Kein Server, keine Datenbank, kein Build-Schritt — reines HTML/CSS/JS, das
Daten aus zwei JSON-Dateien liest.

## GitHub Pages aktivieren

1. Repo auf GitHub öffnen → **Settings → Pages**.
2. Unter **Build and deployment** → **Source**: `Deploy from a branch`.
3. Branch auswählen (z. B. `main`), Ordner `/ (root)`.
4. Speichern — nach kurzer Zeit ist die Seite unter der angezeigten URL live.

## Seitenstruktur

- `index.html` — Schreibfortschritt: Kennzahlen, Kalender-Heatmap (wie der
  GitHub-Contribution-Graph) und ein Tagebuch-Feed mit Trend-Indikator
  (▲/▼ im Vergleich zum gleitenden Durchschnitt der letzten Tage).
- `books.html` — Liste gelesener Bücher mit Kurzreview.
- `new-entry.html` — Formular, das aus deiner Eingabe einen fertigen
  JSON-Eintrag baut, den du in `data/entries.json` einfügst.
- `data/entries.json` — die eigentlichen Schreib-Daten.
- `data/books.json` — die Bücherliste.
- `assets/` — Styles (`style.css`) und Logik (`tracker.js`, `books.js`,
  `new-entry.js`), alles ohne externe Abhängigkeiten.

## Täglich einen Schreib-Eintrag hinzufügen

1. Auf der Seite `+ Neuer Eintrag` (`new-entry.html`) Datum, Start-/
   End-Wortanzahl, Minuten und einen kurzen Kommentar eintragen.
2. Den generierten JSON-Block kopieren.
3. Über den Link auf der Seite `data/entries.json` direkt im
   GitHub-Web-Editor öffnen.
4. Den Block direkt nach der öffnenden `[` einfügen (neuester Eintrag
   zuerst) und committen.
5. Die Seite zeigt den neuen Eintrag automatisch beim nächsten Laden an.

Alternativ kannst du `data/entries.json` auch lokal editieren und pushen.

### Format eines Eintrags

```json
{
  "date": "2026-09-04",
  "startWords": 5000,
  "endWords": 5400,
  "minutes": 30,
  "note": "Fokus vor allem Kapitelstruktur bearbeiten."
}
```

`endWords` kann auch kleiner als `startWords` sein (z. B. an reinen
Kürzungs-/Editier-Tagen) — solche Tage werden in der Heatmap orange statt
grün markiert und zählen trotzdem für die Streak, solange an dem Kalendertag
ein Eintrag existiert.

Die Streak zählt aufeinanderfolgende Kalendertage mit einem Eintrag
(unabhängig vom Vorzeichen der Wortdifferenz) — ein ausgelassener Tag
unterbricht sie.

## Ein Buch hinzufügen

`data/books.json` öffnen und ein Objekt ergänzen:

```json
{
  "title": "Buchtitel",
  "author": "Autor:in",
  "dateFinished": "2026-08-20",
  "review": "Maximal drei Sätze Review."
}
```

## Anpassungen

- **Titel/Buchname:** in jeder HTML-Datei `<title>` und `.brand` anpassen.
- **Farben:** CSS-Variablen in `assets/style.css` (`:root` und die
  `prefers-color-scheme: dark`-Variante).
- **GitHub-Link im Formular:** `GITHUB_REPO` / `GITHUB_BRANCH` oben in
  `assets/new-entry.js`, falls Repo-Name oder Standard-Branch abweichen.
