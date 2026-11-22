// Cinder Fox — the AI opponent. A readable heuristic, not a random player:
// it defends when hurt, spends ember on the best damage-per-cost it can afford,
// and saves a cheap card for next turn only when nothing useful is left.
import { describeCard } from './cards.js';

/** Score a card for the AI: damage is worth most, survival second. */
function scoreCard(card, me, foe) {
  let score = 0;
  if (card.damage) score += card.damage * 2;
  if (card.heal) score += me.hp <= 14 ? card.heal * 2.4 : card.heal * 0.6;
  if (card.block) score += me.hp <= 12 ? card.block * 1.6 : card.block * 0.7;
  if (card.draw) score += 3.5;
  if (card.selfDamage) score -= card.selfDamage * 1.5;
  // Prefer finishing the player over padding the score.
  if (card.damage && card.damage >= foe.hp + foe.block) score += 50;
  return score / Math.max(1, card.cost);
}

/**
 * Pick the AI's next card, or null when it should end its turn.
 * Returns the card object from the AI's hand.
 */
export function pickAiCard(me, foe) {
  const affordable = me.hand.filter((c) => c.cost <= me.ember);
  if (affordable.length === 0) return null;
  let best = null;
  let bestScore = 0;
  for (const card of affordable) {
    const s = scoreCard(card, me, foe);
    if (s > bestScore) { bestScore = s; best = card; }
  }
  // Never play a 0-cost spark when a better card is affordable next turn? No:
  // a free card is always worth playing.
  if (best && best.cost === 0) return best;
  // Stop early sometimes when only weak plays remain and ember is nearly spent,
  // so the fox does not dump its whole hand every turn.
  if (best && bestScore < 3 && me.ember <= 1) return null;
  return best;
}

export function aiCardSummary(card) {
  return `${card.name} (${describeCard(card)})`;
}
