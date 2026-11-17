# Italian Game Trainer

An interactive chess trainer for the Italian Game (1.e4 e5 2.Nf3 Nc6 3.Bc4), aimed at getting from about 400 to 800 Elo.

- **Learn**: short lessons for White and Black. Wrong moves are punished on the board so you see why.
- **Drill**: random positions from the lessons, one try each.
- **Spar**: play the opening out against a sloppy opponent, with a Guide that names the principle for each move.
- **Rules**: checklists and the repertoire on one card.

## Use it

Open `index.html` through a web server. It will not fully work opened as a local file, because the engine runs in a web worker.

To host it free on GitHub Pages: repository **Settings → Pages → Deploy from a branch → main, / (root)**. The trainer then lives at `https://twoshilling.github.io/chess/`.

Progress is saved in the browser you use.

After the first visit it works offline: `sw.js` keeps a copy of the page and the engine on the device. On an iPhone, Share → Add to Home Screen opens it full screen like an app.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole trainer (built file) |
| `chess.js` | Chess rules library (chess.js 0.10.3, BSD licence) |
| `stockfish-19-lite-single.js`, `.wasm` | Stockfish 19 lite engine (WebAssembly), used for "Show the move", the Tactic priority and the mistake checks |
| `stockfish.js` | Stockfish 10, the fallback if the newer engine cannot start |
| `stockfish-19-licence.txt`, `stockfish-licence.txt` | Stockfish's GPL-3.0 licence |
| `sw.js`, `manifest.webmanifest`, `icon-*.png` | Offline support and the home-screen icon (built from `src/static/`) |
| `src/` | Sources: lessons, app code, page template, build and validation scripts; `src/vendor/` holds the Stockfish 19 files |

## Rebuild

```
cd src
npm install
npm run check   # validates every lesson line against the chess rules
npm run build   # writes index.html and the libraries to the repository root
```
