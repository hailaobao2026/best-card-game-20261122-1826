// Ember Duel — boot, input, the fox's turn clock, sound, and screenshot modes.
// URL modes (?shot=start|play|win|loss, ?seed=N) stage the game for screenshots:
// they are real renders of the same code, with a fixed seed and a fixed table.
import { CARD_DEFS, MAX_HP } from './cards.js';
import { mulberry32 } from './rng.js';
import {
  createGame, startDuel, startPlayerTurn, startAiTurn,
  playPlayerCard, aiStep, checkWinner, endDuel, log,
} from './game.js';
import {
  showScreen, renderTable, showPlayedCard, flashFighter,
  showBanner, showEnd, setRecordLine,
} from './render.js';

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || (Date.now() % 100000));
const random = mulberry32(seed);
const state = createGame(random);

let soundOn = true;
let audioCtx = null;
let record = { wins: 0, losses: 0 };
try {
  const saved = JSON.parse(localStorage.getItem('ember-duel-record') || 'null');
  if (saved) record = saved;
} catch { /* private mode: record stays in memory */ }

function saveRecord() {
  try { localStorage.setItem('ember-duel-record', JSON.stringify(record)); } catch { /* ignore */ }
}

function recordLine() {
  const total = record.wins + record.losses;
  if (total === 0) return 'No duels fought yet — the table is waiting.';
  return `Record: ${record.wins} win${record.wins === 1 ? '' : 's'} · ${record.losses} ${record.losses === 1 ? 'loss' : 'losses'} across ${total} duel${total > 1 ? 's' : ''}.`;
}

/* ---------- tiny synth: no audio files, everything is generated ---------- */
function tone(freq, dur = 0.12, type = 'sine', gain = 0.08) {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(g).connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
  } catch { /* audio unavailable: the game stays silent */ }
}
const sfx = {
  play: () => tone(520, 0.1, 'triangle'),
  hit: () => { tone(180, 0.16, 'sawtooth', 0.06); tone(90, 0.2, 'square', 0.05); },
  heal: () => { tone(660, 0.14, 'sine'); window.setTimeout(() => tone(880, 0.16, 'sine'), 90); },
  turn: () => tone(440, 0.08, 'sine', 0.05),
  win: () => [523, 659, 784, 1047].forEach((f, i) => window.setTimeout(() => tone(f, 0.22, 'triangle', 0.09), i * 130)),
  lose: () => [392, 330, 262, 196].forEach((f, i) => window.setTimeout(() => tone(f, 0.25, 'sawtooth', 0.05), i * 150)),
};

/* ---------- flow ---------- */
function refresh() {
  renderTable(state, onPlayCard);
}

function finishIfWon(winner) {
  if (!winner) return false;
  endDuel(state, winner);
  if (winner === 'you') { record.wins += 1; sfx.win(); } else { record.losses += 1; sfx.lose(); }
  saveRecord();
  refresh();
  window.setTimeout(() => showEnd(state, recordLine()), 650);
  return true;
}

function onPlayCard(uid, el) {
  if (state.phase !== 'player') return;
  const res = playPlayerCard(state, uid);
  if (!res.ok) return;
  if (el) el.classList.add('played-anim');
  showPlayedCard('played-you', res.card);
  if (res.card.damage) { sfx.hit(); flashFighter('foe'); }
  else if (res.card.heal) sfx.heal();
  else sfx.play();
  refresh();
  window.setTimeout(() => showPlayedCard('played-you', null), 1400);
  finishIfWon(res.winner);
}

function endTurn() {
  if (state.phase !== 'player') return;
  showPlayedCard('played-you', null);
  showPlayedCard('played-foe', null);
  startAiTurn(state);
  refresh();
  runAiClock();
}

function runAiClock() {
  window.setTimeout(() => {
    if (state.phase !== 'ai') return;
    const step = aiStep(state);
    if (step.card) {
      showPlayedCard('played-foe', step.card);
      if (step.card.damage) { sfx.hit(); flashFighter('you'); }
      else if (step.card.heal) sfx.heal();
      else sfx.play();
      refresh();
      if (finishIfWon(step.winner)) return;
      window.setTimeout(() => showPlayedCard('played-foe', null), 1300);
      runAiClock();
      return;
    }
    // Fox is done: back to the player.
    showBanner(`TURN ${state.turn + 1}`);
    sfx.turn();
    startPlayerTurn(state);
    refresh();
  }, 800);
}

function newDuel() {
  showPlayedCard('played-you', null);
  showPlayedCard('played-foe', null);
  startDuel(state);
  showScreen('battle');
  showBanner('DUEL!');
  refresh();
}

/* ---------- input ---------- */
document.getElementById('btn-duel').addEventListener('click', newDuel);
document.getElementById('btn-again').addEventListener('click', newDuel);
document.getElementById('btn-title').addEventListener('click', () => {
  state.phase = 'title';
  setRecordLine(recordLine());
  showScreen('title');
});
document.getElementById('btn-end-turn').addEventListener('click', endTurn);
document.getElementById('btn-restart').addEventListener('click', () => { if (state.phase !== 'title') newDuel(); });
document.getElementById('btn-sound').addEventListener('click', (e) => {
  soundOn = !soundOn;
  e.currentTarget.textContent = `♪ Sound: ${soundOn ? 'on' : 'off'}`;
});

document.addEventListener('keydown', (e) => {
  if (state.phase === 'title' && (e.key === 'Enter' || e.key === ' ')) { newDuel(); return; }
  if (state.phase === 'over' && e.key.toLowerCase() === 'r') { newDuel(); return; }
  if (state.phase !== 'player') return;
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); endTurn(); return; }
  if (e.key.toLowerCase() === 'r') { newDuel(); return; }
  const n = Number(e.key);
  if (n >= 1 && n <= state.you.hand.length) {
    const card = state.you.hand[n - 1];
    if (card) onPlayCard(card.uid, document.querySelector(`[data-uid="${card.uid}"]`));
  }
  if (e.key.toLowerCase() === 'm') {
    soundOn = !soundOn;
    document.getElementById('btn-sound').textContent = `♪ Sound: ${soundOn ? 'on' : 'off'}`;
  }
});

/* ---------- screenshot staging: fixed table, real code ---------- */
function cardById(id, n = 0) {
  const def = CARD_DEFS.find((d) => d.id === id);
  return { ...def, uid: `${def.id}-shot-${n}` };
}

function stageShot(mode) {
  startDuel(state);
  showScreen('battle');
  if (mode === 'play') {
    state.turn = 4;
    state.stats.turns = 4;
    state.you.hp = 24; state.you.block = 5; state.you.maxEmber = 6; state.you.ember = 4;
    state.foe.hp = 17; state.foe.block = 3; state.foe.maxEmber = 5; state.foe.ember = 2;
    state.you.hand = [cardById('bolt'), cardById('shell'), cardById('mend'), cardById('lash', 1), cardById('inferno')];
    state.foe.hand = [cardById('spark'), cardById('lash'), cardById('wall'), cardById('draw')];
    state.you.deck = state.you.deck.slice(0, 18);
    state.you.discard = [cardById('spark', 9), cardById('lash', 8)];
    state.log = [
      'You play <b>Flame Lash</b> — deals <b>4</b> damage (3 blocked).',
      'The Fox plays <b>Guard Shell</b> — gains <b>6</b> block.',
      '<b>Turn 4</b> — you gain 6 ember and draw 2 cards.',
    ];
    state.phase = 'player';
    showPlayedCard('played-you', cardById('lash', 1));
    showPlayedCard('played-foe', cardById('shell'));
    refresh();
    return;
  }
  if (mode === 'win' || mode === 'loss') {
    state.turn = 7;
    state.stats = { damageDealt: 34, damageTaken: 21, cardsPlayed: 16, turns: 7 };
    state.you.hp = mode === 'win' ? 11 : 0;
    state.foe.hp = mode === 'win' ? 0 : 9;
    state.you.ember = 2; state.you.maxEmber = 7;
    state.foe.ember = 0; state.foe.maxEmber = 7;
    state.you.hand = [cardById('spark'), cardById('mend')];
    state.foe.hand = [cardById('lash')];
    state.log = mode === 'win'
      ? ['<b>VICTORY!</b> The Cinder Fox bows out — the embers are yours.', 'You play <b>Inferno</b> — deals <b>12</b> damage.']
      : ['<b>DEFEAT.</b> The Fox keeps the table — for now.', 'The Fox plays <b>Cinder Bolt</b> — deals <b>7</b> damage.'];
    endDuel(state, mode === 'win' ? 'you' : 'foe');
    refresh();
    showEnd(state, 'Record: 3 wins · 2 losses across 5 duels.');
    return;
  }
  refresh();
}

/* ---------- boot ---------- */
setRecordLine(recordLine());
const shot = params.get('shot');
if (shot === 'start' || !shot) {
  showScreen('title');
} else {
  stageShot(shot);
}

/* Test hook for Playwright: state snapshots and scripted actions. */
window.__game = {
  state: () => ({
    phase: state.phase,
    turn: state.turn,
    youHp: state.you.hp,
    foeHp: state.foe.hp,
    youEmber: state.you.ember,
    youMaxEmber: state.you.maxEmber,
    youHand: state.you.hand.map((c) => ({ uid: c.uid, id: c.id, cost: c.cost })),
    foeHand: state.foe.hand.length,
    youDeck: state.you.deck.length,
    winner: state.winner,
    log: state.log.slice(0, 3),
  }),
  newDuel,
  endTurn,
  playFirstAffordable: () => {
    const card = state.you.hand.find((c) => c.cost <= state.you.ember);
    if (card) onPlayCard(card.uid, document.querySelector(`[data-uid="${card.uid}"]`));
    return card ? card.id : null;
  },
};
