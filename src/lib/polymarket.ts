import type { PolymarketEvent, ProjectData, FdvBracket, TokenLaunchDate } from '@/types';

const GAMMA_API = 'https://gamma-api.polymarket.com';

// ── Auto-discovery ──────────────────────────────────────────────
// Scan active Polymarket events and match two patterns:
//   1. "___ FDV above ___"  → FDV bracket data
//   2. "Will ___ launch a token" → Token launch probability

interface DiscoveredGroup {
  name: string;
  image: string;
  events: PolymarketEvent[];
}

// Extract project name from event title
function extractProjectName(title: string): string | null {
  // "MegaETH market cap (FDV) one day after launch?" → "MegaETH"
  const mcapMatch = title.match(/^(.+?)\s+market\s+cap/i);
  if (mcapMatch) return mcapMatch[1].trim();

  // "Opensea FDV above ___ one day after launch?" → "Opensea"
  const fdvMatch = title.match(/^(.+?)\s+FDV\s+above/i);
  if (fdvMatch) return fdvMatch[1].trim();

  // "Will MetaMask launch a token by ___?" → "MetaMask"
  const launchMatch = title.match(/^Will\s+(.+?)\s+launch\s+a\s+token/i);
  if (launchMatch) return launchMatch[1].trim();

  return null;
}

// Alias map for projects with inconsistent naming across events
const NAME_ALIASES: Record<string, string> = {
  'felix protocol': 'felix',
};

// Normalize name for grouping
function normalizeKey(name: string): string {
  const raw = name.toLowerCase().replace(/[^a-z0-9. ]/g, '').trim();
  return NAME_ALIASES[raw] || raw.replace(/[^a-z0-9]/g, '');
}

// Fetch paginated active events from Gamma API (parallel)
async function fetchActiveEvents(): Promise<PolymarketEvent[]> {
  const PAGE = 100;
  const MAX_PAGES = 15;

  // Fire all page requests in parallel
  const fetches = Array.from({ length: MAX_PAGES }, (_, i) => {
    const url = `${GAMMA_API}/events?limit=${PAGE}&active=true&closed=false&order=volume&ascending=false&offset=${i * PAGE}`;
    return fetch(url, { next: { revalidate: 300 } })
      .then((res) => (res.ok ? (res.json() as Promise<PolymarketEvent[]>) : []))
      .catch(() => [] as PolymarketEvent[]);
  });

  const pages = await Promise.all(fetches);
  return pages.flat();
}

// Discover and group projects from all active events
function discoverProjects(events: PolymarketEvent[]): DiscoveredGroup[] {
  const groups = new Map<string, DiscoveredGroup>();

  for (const event of events) {
    const questions = event.markets.map((m) => m.question.toLowerCase());
    const hasFdv = questions.some((q) => q.includes('fdv'));
    const hasLaunch = questions.some((q) => q.includes('launch a token'));
    if (!hasFdv && !hasLaunch) continue;

    const name = extractProjectName(event.title);
    if (!name) continue;

    const key = normalizeKey(name);
    const existing = groups.get(key);

    if (existing) {
      existing.events.push(event);
      if (!existing.image && event.image) existing.image = event.image;
    } else {
      groups.set(key, {
        name,
        image: event.image || '',
        events: [event],
      });
    }
  }

  return Array.from(groups.values());
}

// ── Parsing helpers ─────────────────────────────────────────────

function parseFdvThreshold(question: string): number | null {
  const match = question.match(/>?\$([0-9.,]+)\s*(M|B|K)?/i);
  if (!match) return null;
  const num = parseFloat(match[1].replace(/,/g, ''));
  const unit = (match[2] || '').toUpperCase();
  if (unit === 'B') return num * 1_000_000_000;
  if (unit === 'M') return num * 1_000_000;
  if (unit === 'K') return num * 1_000;
  if (num >= 1_000_000) return num;
  return num * 1_000_000;
}

function formatFdvLabel(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(value % 1_000_000_000 === 0 ? 0 : 1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  return `$${(value / 1_000).toFixed(0)}K`;
}

function parseDateLabel(question: string): string {
  const byMatch = question.match(/by\s+(\w+\s+\d{1,2},?\s*\d{4})/i);
  if (byMatch) return byMatch[1];
  const inMatch = question.match(/in\s+(\d{4})/);
  if (inMatch) return inMatch[1];
  const shortMatch = question.match(/by\s+(\w+\s+\d{1,2})/i);
  if (shortMatch) return shortMatch[1];
  return question.slice(0, 30);
}

// ── Expected FDV calculation ────────────────────────────────────

function calculateExpectedFdv(brackets: FdvBracket[]): number | null {
  if (brackets.length === 0) return null;
  const sorted = [...brackets].sort((a, b) => a.threshold - b.threshold);
  let expectedFdv = 0;

  // Below lowest bracket: P(FDV < lowest) = 1 - P(FDV >= lowest)
  const pBelow = 1 - sorted[0].probability;
  if (pBelow > 0) {
    expectedFdv += (sorted[0].threshold / 2) * pBelow;
  }

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    const pInBracket = current.probability - (next ? next.probability : 0);
    if (pInBracket <= 0) continue;
    const low = current.threshold;
    const high = next ? next.threshold : current.threshold * 1.5;
    expectedFdv += ((low + high) / 2) * pInBracket;
  }

  return expectedFdv > 0 ? expectedFdv : null;
}

// ── Process a single project ────────────────────────────────────

function processProject(group: DiscoveredGroup): ProjectData {
  const fdvBrackets: FdvBracket[] = [];
  const tokenLaunch: TokenLaunchDate[] = [];
  const airdropDates: TokenLaunchDate[] = [];
  let totalVolume = 0;
  let polymarketSlug = '';
  let fdvSlug = '';
  let launchSlug = '';

  for (const event of group.events) {
    if (!polymarketSlug) polymarketSlug = event.slug;

    for (const market of event.markets) {
      const q = market.question.toLowerCase();
      let prices = market.outcomePrices;
      if (typeof prices === 'string') {
        try { prices = JSON.parse(prices); } catch { prices = []; }
      }
      const yesPrice = parseFloat(prices?.[0] ?? '0');
      totalVolume += parseFloat(String(market.volume)) || 0;

      if (q.includes('fdv') || q.includes('market cap') || q.includes('mcap')) {
        if (!fdvSlug) fdvSlug = event.slug;
        const threshold = parseFdvThreshold(market.question);
        if (threshold) {
          fdvBrackets.push({
            threshold,
            label: formatFdvLabel(threshold),
            probability: yesPrice,
            volume: parseFloat(String(market.volume)) || 0,
          });
        }
      } else if (q.includes('launch a token') || q.includes('launch token')) {
        if (!launchSlug) launchSlug = event.slug;
        tokenLaunch.push({
          date: parseDateLabel(market.question),
          probability: yesPrice,
          volume: parseFloat(String(market.volume)) || 0,
          closed: market.closed,
        });
      } else if (q.includes('airdrop')) {
        airdropDates.push({
          date: parseDateLabel(market.question),
          probability: yesPrice,
          volume: parseFloat(String(market.volume)) || 0,
          closed: market.closed,
        });
      }
    }
  }

  // Deduplicate FDV brackets
  const fdvMap = new Map<number, FdvBracket>();
  for (const b of fdvBrackets) {
    const existing = fdvMap.get(b.threshold);
    if (!existing || b.volume > existing.volume) fdvMap.set(b.threshold, b);
  }
  const dedupedFdv = Array.from(fdvMap.values()).sort((a, b) => a.threshold - b.threshold);

  tokenLaunch.sort((a, b) => {
    if (a.closed !== b.closed) return a.closed ? 1 : -1;
    return b.probability - a.probability;
  });
  airdropDates.sort((a, b) => {
    if (a.closed !== b.closed) return a.closed ? 1 : -1;
    return b.probability - a.probability;
  });

  return {
    name: group.name,
    icon: group.image,
    polymarketSlug,
    fdvSlug: fdvSlug || polymarketSlug,
    launchSlug: launchSlug || polymarketSlug,
    expectedFdv: calculateExpectedFdv(dedupedFdv),
    fdvBrackets: dedupedFdv,
    tokenLaunch,
    airdropDates,
    totalVolume,
  };
}

// ── Main entry point ────────────────────────────────────────────

export async function fetchAllProjects(): Promise<ProjectData[]> {
  const allEvents = await fetchActiveEvents();
  const groups = discoverProjects(allEvents);

  const results = groups.map((group) => processProject(group));

  // Sort by total volume descending (most traded first)
  results.sort((a, b) => b.totalVolume - a.totalVolume);

  return results;
}
