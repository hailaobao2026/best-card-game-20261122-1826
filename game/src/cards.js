// Card definitions for Ember Duel. Ten original cards, three copies each = a 30-card deck.
// kind: attack | block | heal | draw | mixed. Numbers are tuned so a duel lasts 5-9 turns.
export const CARD_DEFS = [
  { id: 'spark',   name: 'Ember Spark',  kind: 'attack', cost: 0, damage: 2,  art: '✦', text: 'Deal 2 damage. Free as a dying coal.' },
  { id: 'lash',    name: 'Flame Lash',   kind: 'attack', cost: 1, damage: 4,  art: '🔥', text: 'Deal 4 damage.' },
  { id: 'bolt',    name: 'Cinder Bolt',  kind: 'attack', cost: 2, damage: 7,  art: '☄', text: 'Deal 7 damage.' },
  { id: 'inferno', name: 'Inferno',      kind: 'attack', cost: 4, damage: 12, art: '🌋', text: 'Deal 12 damage. The table goes quiet.' },
  { id: 'shell',   name: 'Guard Shell',  kind: 'block',  cost: 1, block: 6,   art: '🛡', text: 'Gain 6 block.' },
  { id: 'wall',    name: 'Stone Wall',   kind: 'block',  cost: 2, block: 11,  art: '🧱', text: 'Gain 11 block.' },
  { id: 'mend',    name: 'Mend Wound',   kind: 'heal',   cost: 2, heal: 7,    art: '✚', text: 'Restore 7 health.' },
  { id: 'draw',    name: 'Quick Draw',   kind: 'draw',   cost: 1, draw: 2,   art: '🂠', text: 'Draw 2 cards.' },
  { id: 'edge',    name: 'Double Edge',  kind: 'mixed',  cost: 2, damage: 8, selfDamage: 2, art: '⚔', text: 'Deal 8 damage. Take 2 damage.' },
  { id: 'feast',   name: 'Phoenix Feast', kind: 'mixed', cost: 3, damage: 6, heal: 5, art: '🐦', text: 'Deal 6 damage. Restore 5 health.' },
];

export const DECK_SIZE = 30;
export const MAX_HP = 30;
export const MAX_EMBER = 10;
export const HAND_LIMIT = 7;
export const START_HAND = 4;

/** Build a fresh 30-card deck: 3 copies of each definition. */
export function buildDeck() {
  const deck = [];
  for (const def of CARD_DEFS) {
    for (let i = 0; i < 3; i++) deck.push({ ...def, uid: `${def.id}-${i}` });
  }
  return deck;
}

/** One-line summary of what a card does, for the combat log. */
export function describeCard(card) {
  const parts = [];
  if (card.damage) parts.push(`${card.damage} damage`);
  if (card.block) parts.push(`${card.block} block`);
  if (card.heal) parts.push(`heal ${card.heal}`);
  if (card.draw) parts.push(`draw ${card.draw}`);
  if (card.selfDamage) parts.push(`take ${card.selfDamage}`);
  return parts.join(' · ');
}
