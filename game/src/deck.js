// Deck, hand and discard management for one fighter.
import { buildDeck, HAND_LIMIT } from './cards.js';
import { shuffle } from './rng.js';

export function newFighterState(random) {
  return {
    hp: 30,
    block: 0,
    maxEmber: 0,
    ember: 0,
    deck: shuffle(buildDeck(), random),
    hand: [],
    discard: [],
  };
}

/** Draw n cards; reshuffle the discard pile when the deck runs out. */
export function drawCards(fighter, n, random) {
  for (let i = 0; i < n; i++) {
    if (fighter.hand.length >= HAND_LIMIT) return;
    if (fighter.deck.length === 0) {
      if (fighter.discard.length === 0) return;
      fighter.deck = shuffle(fighter.discard, random);
      fighter.discard = [];
    }
    fighter.hand.push(fighter.deck.pop());
  }
}

/** Move a played card from hand to discard. */
export function discardCard(fighter, uid) {
  const idx = fighter.hand.findIndex((c) => c.uid === uid);
  if (idx < 0) return null;
  const [card] = fighter.hand.splice(idx, 1);
  fighter.discard.push(card);
  return card;
}
