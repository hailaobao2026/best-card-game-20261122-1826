// Ember Duel — DOM rendering: the table, the hands, the log, the end screen.
// Reads the game state; owns no rules.
import { MAX_HP, MAX_EMBER, describeCard } from './cards.js';

const $ = (id) => document.getElementById(id);

export function showScreen(name) {
  $('screen-title').classList.toggle('hidden', name !== 'title');
  $('screen-battle').classList.toggle('hidden', name !== 'battle');
  $('screen-end').classList.toggle('hidden', name !== 'end');
}

function hpFill(el, textEl, hp) {
  el.style.width = `${(hp / MAX_HP) * 100}%`;
  el.classList.toggle('low', hp <= 10);
  textEl.textContent = `${hp} / ${MAX_HP}`;
}

function emberPips(el, fighter) {
  el.innerHTML = '';
  for (let i = 0; i < MAX_EMBER; i++) {
    const pip = document.createElement('span');
    pip.className = 'ember-pip' + (i < fighter.ember ? ' full' : '');
    el.appendChild(pip);
  }
  const label = document.createElement('span');
  label.className = 'ember-label';
  label.textContent = `${fighter.ember}/${fighter.maxEmber} EMBER`;
  el.appendChild(label);
}

function blockBadge(badgeEl, numEl, block) {
  badgeEl.classList.toggle('hidden', block <= 0);
  numEl.textContent = String(block);
}

/** One full-size card in the player's hand. */
export function cardElement(card, index, playable, onPlay) {
  const el = document.createElement('div');
  el.className = `card card-${card.kind} ${playable ? 'playable' : 'unaffordable'}`;
  el.dataset.uid = card.uid;
  const big = card.damage ?? card.block ?? card.heal ?? card.draw ?? 0;
  const bigLabel = card.damage ? `<small>DMG</small>` : card.block ? `<small>BLK</small>` : card.heal ? `<small>HEAL</small>` : `<small>DRAW</small>`;
  el.innerHTML = `
    <div class="card-cost">${card.cost}</div>
    <div class="card-kind">${card.kind.toUpperCase()}</div>
    <div class="card-art" aria-hidden="true">${card.art}</div>
    <div class="card-attack">${big} ${bigLabel}</div>
    <div class="card-name">${card.name}</div>
    <div class="card-text">${card.text}</div>
    <div class="card-key">[${index + 1}]</div>`;
  el.title = `${card.name} — cost ${card.cost}. ${describeCard(card)}.`;
  el.addEventListener('click', () => onPlay(card.uid, el));
  return el;
}

/** A small card shown in the center when it is played. */
export function miniCardElement(card) {
  const el = document.createElement('div');
  el.className = 'card-mini';
  const big = card.damage ?? card.block ?? card.heal ?? card.draw ?? 0;
  el.innerHTML = `
    <div class="mini-kind">${card.kind.toUpperCase()} · COST ${card.cost}</div>
    <div class="mini-num">${big}</div>
    <div class="mini-name">${card.name}</div>`;
  return el;
}

export function renderTable(state, onPlayCard) {
  hpFill($('foe-hp-fill'), $('foe-hp-text'), state.foe.hp);
  hpFill($('you-hp-fill'), $('you-hp-text'), state.you.hp);
  blockBadge($('foe-block'), $('foe-block-num'), state.foe.block);
  blockBadge($('you-block'), $('you-block-num'), state.you.block);
  emberPips($('foe-ember'), state.foe);
  emberPips($('you-ember'), state.you);

  const foeHand = $('foe-hand');
  foeHand.innerHTML = '';
  for (let i = 0; i < state.foe.hand.length; i++) {
    const m = document.createElement('div');
    m.className = 'mini-card';
    foeHand.appendChild(m);
  }

  $('deck-count').textContent = String(state.you.deck.length);
  $('discard-count').textContent = String(state.you.discard.length);

  const hand = $('hand');
  hand.innerHTML = '';
  state.you.hand.forEach((card, i) => {
    const playable = state.phase === 'player' && card.cost <= state.you.ember;
    hand.appendChild(cardElement(card, i, playable, onPlayCard));
  });

  $('btn-end-turn').disabled = state.phase !== 'player';
  $('btn-end-turn').textContent = state.phase === 'ai' ? 'FOX IS THINKING…' : 'END TURN ⏎';

  const logEl = $('combat-log');
  logEl.innerHTML = state.log.slice(0, 5).map((line) => `<li>${line}</li>`).join('');
}

export function showPlayedCard(slotId, card) {
  const slot = $(slotId);
  slot.innerHTML = '';
  if (card) slot.appendChild(miniCardElement(card));
}

export function flashFighter(side) {
  const portrait = document.querySelector(side === 'you' ? '.you-portrait' : '.foe-portrait');
  if (!portrait) return;
  portrait.classList.remove('shake');
  void portrait.offsetWidth;
  portrait.classList.add('shake');
}

export function showBanner(text, ms = 900) {
  const banner = $('turn-banner');
  banner.textContent = text;
  banner.classList.remove('hidden');
  window.setTimeout(() => banner.classList.add('hidden'), ms);
}

export function showEnd(state, record) {
  const win = state.winner === 'you';
  const title = $('end-title');
  title.textContent = win ? 'VICTORY!' : 'DEFEAT';
  title.className = win ? 'win' : 'lose';
  $('end-sub').textContent = win
    ? 'The Cinder Fox lays down its cards. The embers are yours.'
    : 'The Fox keeps the table — shuffle up and take it back.';
  $('end-stats').innerHTML = `
    <div class="stat"><b>${state.stats.turns}</b><span>TURNS</span></div>
    <div class="stat"><b>${state.stats.damageDealt}</b><span>DAMAGE DEALT</span></div>
    <div class="stat"><b>${state.stats.cardsPlayed}</b><span>CARDS PLAYED</span></div>
    <div class="stat"><b>${state.you.hp}</b><span>YOUR HP LEFT</span></div>`;
  $('end-record').textContent = record;
  showScreen('end');
}

export function setRecordLine(text) {
  $('title-record').textContent = text;
}
