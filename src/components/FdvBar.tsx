'use client';

import type { FdvBracket } from '@/types';
import { findTopFdvBracket } from '@/lib/highlights';
import { useLang } from '@/lib/i18n';

interface FdvBarProps {
  brackets: FdvBracket[];
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

export function FdvBar({ brackets }: FdvBarProps) {
  const { t } = useLang();
  const topThreshold = findTopFdvBracket(brackets)?.threshold ?? null;

  return (
    <div className="space-y-1.5">
      <h3 className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">
        {t('fdvProbability')}
      </h3>
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
