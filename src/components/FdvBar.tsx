'use client';

import type { FdvBracket } from '@/types';
import { findTopFdvBracket } from '@/lib/highlights';
import { useLang } from '@/lib/i18n';
import { InfoTip } from './InfoTip';

interface FdvBarProps {
  brackets: FdvBracket[];
  slug?: string;
}

const COLORS = [
  'bg-emerald-500',
  'bg-emerald-400',
  'bg-teal-400',
  'bg-cyan-400',
  'bg-sky-400',
  'bg-blue-400',
  'bg-violet-400',
  'bg-purple-400',
];

export function FdvBar({ brackets, slug }: FdvBarProps) {
  const { t } = useLang();
  const topThreshold = findTopFdvBracket(brackets)?.threshold ?? null;

  return (
    <div className="relative space-y-1.5">
      <div className="flex items-center gap-1">
        {slug ? (
          <a
            href={`https://polymarket.com/event/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide hover:text-blue-400 transition-colors"
          >
            {t('fdvProbability')} ↗
          </a>
        ) : (
          <h3 className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">
            {t('fdvProbability')}
          </h3>
        )}
        <div className="relative group">
          <div className="w-3.5 h-3.5 rounded-full bg-zinc-700/80 flex items-center justify-center cursor-help text-[8px] font-bold text-zinc-400 group-hover:bg-zinc-600 group-hover:text-zinc-200 transition-colors">
            !
          </div>
          <div className="hidden group-hover:block absolute left-0 top-5 w-52 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-[10px] text-zinc-300 leading-relaxed shadow-xl z-20">
            {t('tipFdvProb')}
          </div>
        </div>
      </div>
      {brackets.length === 0 ? (
        <div className="px-2 py-1.5 text-xs text-zinc-600">{t('noData')}</div>
      ) : (
        <div className="space-y-1">
          {brackets.map((b, i) => {
            const isFloor = b.threshold === topThreshold;
            return (
              <div
                key={b.threshold}
                className={`flex items-center gap-2 ${
                  isFloor ? 'border-l-2 border-red-500 pl-1' : ''
                }`}
              >
                <span className={`text-[10px] w-12 text-right font-mono ${isFloor ? 'text-red-400 font-semibold' : 'text-zinc-400'}`}>
                  {b.label}+
                </span>
                <div className="flex-1 h-4 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${COLORS[i % COLORS.length]}`}
                    style={{ width: `${Math.max(2, b.probability * 100)}%` }}
                  />
                </div>
                <span className={`text-[10px] font-medium w-10 text-right ${isFloor ? 'text-red-400' : 'text-zinc-200'}`}>
                  {(b.probability * 100).toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
