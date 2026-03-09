import type { FdvBracket, TokenLaunchDate } from '@/types';

// Sort by probability desc, tiebreak by volume desc
function byProbThenVol<T extends { probability: number; volume: number }>(a: T, b: T): number {
  return b.probability - a.probability || b.volume - a.volume;
}

/**
 * Find the most meaningful FDV bracket to highlight.
 * Tier 1: highest threshold with ≥50% probability (strong floor)
 * Tier 2: among ≥20% (excluding trivial lowest bracket), best by probability → volume
 * Tier 3: fallback to best by probability → volume
 */
export function findTopFdvBracket(brackets: FdvBracket[]): FdvBracket | null {
  if (brackets.length === 0) return null;

  const desc = [...brackets].sort((a, b) => b.threshold - a.threshold);
  const lowestThreshold = desc[desc.length - 1].threshold;

  // Tier 1: highest threshold ≥50%
  const tier1 = desc.find((b) => b.probability >= 0.5);
  if (tier1) return tier1;

  // Tier 2: ≥20%, skip trivial lowest bracket, best by prob→vol
  const tier2 = desc
    .filter((b) => b.probability >= 0.2 && b.threshold !== lowestThreshold)
    .sort(byProbThenVol);
  if (tier2.length > 0) return tier2[0];

  // Tier 3: overall best by prob→vol
  return [...brackets].sort(byProbThenVol)[0];
}

/**
 * Find the most significant active token launch date.
 * Among non-closed entries, best by probability → volume.
 */
export function findTopLaunch(launches: TokenLaunchDate[]): TokenLaunchDate | null {
  const active = launches.filter((t) => !t.closed);
  if (active.length === 0) return null;
  return [...active].sort(byProbThenVol)[0];
}
