// Ember Duel — the duel state machine: turns, ember, combat, win/loss.
// No DOM here; render.js reads this state and main.js drives the AI clock.
import { MAX_HP, MAX_EMBER, START_HAND } from './cards.js';
import { newFighterState, drawCards, discardCard } from './deck.js';
import { pickAiCard } from './ai.js';

export function createGame(random) {
  const state = {
    phase: 'title', // title | player | ai | over
    turn: 0,
    you: newFighterState(random),
    foe: newFighterState(random),
    winner: null,
    log: [],
    stats: { damageDealt: 0, damageTaken: 0, cardsPlayed: 0, turns: 0 },
    random,
  };
  return state;
}

export function log(state, html) {
  state.log.unshift(html);
  if (state.log.length > 30) state.log.length = 30;
}

/** Begin a fresh duel: deal opening hands and start turn 1. */
export function startDuel(state) {
  state.you = newFighterState(state.random);
  state.foe = newFighterState(state.random);
  state.turn = 0;
  state.winner = null;
  state.log = [];
  state.stats = { damageDealt: 0, damageTaken: 0, cardsPlayed: 0, turns: 0 };
  drawCards(state.you, START_HAND, state.random);
  drawCards(state.foe, START_HAND, state.random);
  state.phase = 'player';
  startPlayerTurn(state);
  log(state, '<b>The duel begins.</b> You move first — make it count.');
}

/** Start of the player's turn: +1 max ember, refill, fresh block, draw 2. */
export function startPlayerTurn(state) {
  state.turn += 1;
  state.stats.turns = state.turn;
  const you = state.you;
  you.maxEmber = Math.min(MAX_EMBER, you.maxEmber + 1);
  you.ember = you.maxEmber;
  you.block = 0;
  drawCards(you, 2, state.random);
  state.phase = 'player';
  log(state, `<b>Turn ${state.turn}</b> — you gain ${you.maxEmber} ember and draw 2 cards.`);
}

/** Start of the fox's turn: same upkeep, then the AI clock takes over. */
export function startAiTurn(state) {
  const foe = state.foe;
  foe.maxEmber = Math.min(MAX_EMBER, foe.maxEmber + 1);
  foe.ember = foe.maxEmber;
  foe.block = 0;
  drawCards(foe, 2, state.random);
  state.phase = 'ai';
  log(state, `The <b>Cinder Fox</b> stirs — ${foe.maxEmber} ember, ${foe.hand.length} cards in hand.`);
}

/** Damage after block. Returns the health actually lost. */
export function dealDamage(target, amount) {
  let remaining = amount;
  if (target.block > 0) {
    const absorbed = Math.min(target.block, remaining);
    target.block -= absorbed;
    remaining -= absorbed;
  }
  target.hp = Math.max(0, target.hp - remaining);
  return remaining;
}

/** Apply one card's effects. `side` is 'you' or 'foe'. Returns a log line. */
export function applyCard(state, side, card) {
  const attacker = side === 'you' ? state.you : state.foe;
  const defender = side === 'you' ? state.foe : state.you;
  attacker.ember -= card.cost;
  discardCard(attacker, card.uid);
  state.stats.cardsPlayed += 1;
  const bits = [];
  if (card.damage) {
    const lost = dealDamage(defender, card.damage);
    bits.push(`deals <b>${card.damage}</b> damage${lost < card.damage ? ` (${card.damage - lost} blocked)` : ''}`);
    if (side === 'you') state.stats.damageDealt += card.damage;
    else state.stats.damageTaken += card.damage;
  }
  if (card.block) {
    attacker.block += card.block;
    bits.push(`gains <b>${card.block}</b> block`);
  }
  if (card.heal) {
    const healed = Math.min(card.heal, MAX_HP - attacker.hp);
    attacker.hp += healed;
    bits.push(`restores <b>${healed}</b> health`);
  }
  if (card.draw) {
    drawCards(attacker, card.draw, state.random);
    bits.push(`draws <b>${card.draw}</b> cards`);
  }
  if (card.selfDamage) {
    const lost = dealDamage(attacker, card.selfDamage);
    bits.push(`takes <b>${lost}</b> backlash`);
  }
  const who = side === 'you' ? 'You play' : 'The Fox plays';
  return `${who} <b>${card.name}</b> — ${bits.join(', ')}.`;
}

/** The player plays a card from hand. Returns { ok, reason?, line? }. */
export function playPlayerCard(state, uid) {
  if (state.phase !== 'player') return { ok: false, reason: 'not your turn' };
  const card = state.you.hand.find((c) => c.uid === uid);
  if (!card) return { ok: false, reason: 'no such card' };
  if (card.cost > state.you.ember) return { ok: false, reason: 'not enough ember' };
  const line = applyCard(state, 'you', card);
  log(state, line);
  return { ok: true, card, line, winner: checkWinner(state) };
}

/** One AI step: play a single card, or signal the turn is done. */
export function aiStep(state) {
  if (state.phase !== 'ai') return { done: true };
  const card = pickAiCard(state.foe, state.you);
  if (!card) return { done: true };
  const line = applyCard(state, 'foe', card);
  log(state, line);
  return { done: false, card, line, winner: checkWinner(state) };
}

export function checkWinner(state) {
  if (state.foe.hp <= 0) return 'you';
  if (state.you.hp <= 0) return 'foe';
  return null;
}

/** Finish the duel and record the winner. */
export function endDuel(state, winner) {
  state.winner = winner;
  state.phase = 'over';
  if (winner === 'you') {
    log(state, '<b>VICTORY!</b> The Cinder Fox bows out — the embers are yours.');
  } else {
    log(state, '<b>DEFEAT.</b> The Fox keeps the table — for now.');
  }
}
