import { NextResponse } from 'next/server';
import { fetchAllProjects } from '@/lib/polymarket';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

// In-memory cache
let cache: { data: ApiResponse; ts: number } | null = null;
const CACHE_TTL = 120_000; // 2 minutes

export async function GET() {
  try {
    const now = Date.now();
    if (cache && now - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data, {
        headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
      });
    }

    const projects = await fetchAllProjects();

    const response: ApiResponse = {
      projects,
      updatedAt: new Date().toISOString(),
    };

    cache = { data: response, ts: now };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('Failed to fetch market data:', error);
    // Return stale cache on error
    if (cache) {
      return NextResponse.json(cache.data);
    }
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 },
    );
  }
}
