// Polymarket raw types
export interface PolymarketMarket {
  id: string;
  question: string;
  slug: string;
  outcomes: string[];
  outcomePrices: string[];
  volume: number;
  liquidity: number;
  endDate: string;
  closed: boolean;
  active: boolean;
}

export interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  image?: string;
  icon?: string;
  markets: PolymarketMarket[];
}

// Processed types
export interface FdvBracket {
  threshold: number; // e.g. 100_000_000
  label: string;     // e.g. "$100M"
  probability: number; // 0-1
  volume: number;
}

export interface TokenLaunchDate {
  date: string;      // e.g. "Jun 30, 2026"
  probability: number;
  volume: number;
  closed: boolean;
}

export interface ProjectData {
  name: string;
  icon: string;
  polymarketSlug: string;
  fdvSlug: string;
  launchSlug: string;
  expectedFdv: number | null;
  fdvBrackets: FdvBracket[];
  tokenLaunch: TokenLaunchDate[];
  airdropDates: TokenLaunchDate[];
  totalVolume: number;
}

export interface ApiResponse {
  projects: ProjectData[];
  updatedAt: string;
}
