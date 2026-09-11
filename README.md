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
- `media-fasten.html` — Media-Fasten-Challenge: Live-Streak-Counter,
  wachsender/verbrennender Garten, Bestwert und Verlauf mit
  Kategorie-Auswertung.
- `data/entries.json` — die eigentlichen Schreib-Daten.
- `data/books.json` — die Bücherliste.
- `data/media-fast.json` — Challenge-Zeitraum und Medienkonsum-Einträge.
- `assets/` — Styles (`style.css`) und Logik (`tracker.js`, `books.js`,
  `media-fasten.js`), alles ohne externe Abhängigkeiten.

## Täglich einen Schreib-Eintrag hinzufügen

Es gibt kein Formular auf der Seite — Einträge werden per Chat mit Claude
hinzugefügt: einfach abends eine Nachricht schreiben, z. B.

> "Heute: 5000 zu 5400 Wörter, 30 Minuten, Fokus war Kapitelstruktur."

Claude ergänzt daraus einen Eintrag in `data/entries.json`, committet und
pusht ihn direkt. Eine tägliche Erinnerung dazu ist eingerichtet.

Alternativ kannst du `data/entries.json` auch selbst lokal editieren und
pushen.

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

## Media-Fasten-Challenge

Läuft von `challengeStart` bis `challengeEnd` in `data/media-fast.json`
(Zeitzone Europe/Berlin). Der Live-Counter zeigt die Zeit seit dem letzten
Eintrag mit Kategorie `sonstiges` (bricht die Streak) — alle anderen
Kategorien (`musik`, `skill`, `freunde`) werden nur zur Transparenz
katalogisiert und beeinflussen die Streak nicht. Nach Challenge-Ende bleibt
die Seite unverändert live und der Counter läuft weiter, nur der Hinweistext
wechselt auf "beendet".

Neue Einträge werden genauso wie Schreib-Updates per Chat mit Claude
hinzugefügt (kein Formular, kein Passwort im Code — Schutz kommt allein
über Git-Schreibrechte am Repo):

```json
{
  "start": "2026-09-11T20:00:00+02:00",
  "end": "2026-09-11T21:00:00+02:00",
  "category": "sonstiges",
  "note": "YouTube-Video über Z"
}
```

`category` ist eine von `musik`, `skill`, `freunde`, `sonstiges`.

Der Garten hat sechs Stufen (kahler Boden → Sprössling → junge Pflanze →
kleiner Garten → blühender Garten → voller Blütengarten), abhängig von der
Dauer der aktuellen Streak. Bricht die Streak, zeigt der Garten für die
erste Stunde einen verbrannten Zustand, bevor er wieder ganz von vorne
wächst.

## Anpassungen

- **Titel/Buchname:** in jeder HTML-Datei `<title>` und `.brand` anpassen.
- **Farben:** CSS-Variablen in `assets/style.css` (`:root` und die
  `prefers-color-scheme: dark`-Variante).
