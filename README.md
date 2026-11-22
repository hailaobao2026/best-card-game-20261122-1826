# Ember Duel — a card battler for make.fun

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)

An original turn-based card battler, built fresh for the
[best-card-game-20261122-1826](https://make.fun/c/best-card-game-20261122-1826)
bounty on [make.fun](https://make.fun). No libraries, no network: static files
only, all art drawn in CSS, all sound synthesized in WebAudio.

## The game

You are the Emberkeeper. Across the table sits the **Cinder Fox**. Each of you
has 30 health and a 30-card deck of ten original cards — attacks, blocks,
heals, card draw, and two double-edged gambles. Every turn you gain +1 max
ember (up to 10), refill, and draw 2 cards. Block absorbs damage first and
fades at the start of your next turn. Reduce the Fox to 0 health to win.

- **Play:** click a card, or press `1–7`. `Space` ends your turn. `R` restarts.
- **The Fox** plays a readable heuristic: it defends when hurt, spends ember
  on the best damage-per-cost it can afford, and never dumps its hand blindly.

## Play it

```sh
node serve.ts   # http://localhost:8080
```

Or open `game/index.html` from any static server. Screenshot staging modes
(real renders of the same code, fixed seed): `?shot=start`, `?shot=play`,
`?shot=win`, `?shot=loss`.

## Layout

- `game/index.html`, `game/style.css` — table and cards
- `game/src/cards.js` — the ten card definitions
- `game/src/rng.js` — seeded shuffle
- `game/src/deck.js` — deck / hand / discard
- `game/src/ai.js` — the Cinder Fox heuristic
- `game/src/game.js` — turns, ember, combat, win/loss
- `game/src/render.js` — DOM rendering
- `game/src/main.js` — boot, input, AI clock, sound, screenshot modes
- `main.ts` — hands the game in (copies `game/` + `screenshots/`, writes `dossier.json`)
- `vendor/makefun-game.ts` — the kit's library, unchanged

## License

MIT — see `LICENSE`.
