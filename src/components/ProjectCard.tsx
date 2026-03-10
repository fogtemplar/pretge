'use client';

import { useRef, useCallback, useState } from 'react';
import type { ProjectData } from '@/types';
import { FdvBar } from './FdvBar';
import { findTopFdvBracket, findTopLaunch } from '@/lib/highlights';
import { useLang } from '@/lib/i18n';
import { InfoTip } from './InfoTip';

interface ProjectCardProps {
  project: ProjectData;
}

function formatUsd(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatVolume(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useLang();
  const cardRef = useRef<HTMLDivElement>(null);
  const nextLaunch = findTopLaunch(project.tokenLaunch);

  const [captured, setCaptured] = useState(false);

  const handleCapture = useCallback(async () => {
    const card = cardRef.current;
    if (!card) return;

    const { default: html2canvas } = await import('html2canvas-pro');

    // Clone the card and expand it fully (no scroll, no fixed height)
    const clone = card.cloneNode(true) as HTMLElement;
    clone.style.height = 'auto';
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.width = `${card.offsetWidth}px`;

    // Remove fixed height and overflow from scrollable area in clone
    const scrollArea = clone.querySelector('.scrollbar-thin') as HTMLElement | null;
    if (scrollArea) {
      scrollArea.style.overflow = 'visible';
      scrollArea.style.maxHeight = 'none';
      scrollArea.style.flex = 'none';
    }

    // Hide capture button in clone
    const btn = clone.querySelector('[data-capture-btn]') as HTMLElement | null;
    if (btn) btn.style.display = 'none';

    // Convert external images to base64 via server proxy to avoid CORS
    const imgs = clone.querySelectorAll('img');
    await Promise.all(
      Array.from(imgs).map(async (img) => {
        try {
          const src = img.getAttribute('src') || '';
          const url = src.startsWith('http')
            ? `/api/img?url=${encodeURIComponent(src)}`
            : src;
          const res = await fetch(url);
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          img.src = dataUrl;
        } catch {
          // ignore failed images
        }
      }),
    );

    document.body.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, {
        backgroundColor: '#18181b',
        scale: 2,
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCaptured(true);
          setTimeout(() => setCaptured(false), 1500);
        } catch {
          // Fallback: download if clipboard fails
          const link = document.createElement('a');
          link.download = `${project.name}-pretge.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
      }, 'image/png');
    } finally {
      document.body.removeChild(clone);
    }
  }, [project.name]);

  return (
    <div ref={cardRef} className="relative bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors h-[420px] flex flex-col">
      {/* Capture button */}
      <button
        data-capture-btn
        onClick={handleCapture}
        className={`absolute top-2 right-2 p-1.5 rounded-md border transition-colors z-10 ${
          captured
            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
            : 'bg-zinc-800/80 border-zinc-700/50 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/80'
        }`}
        title="Copy card image"
      >
        {captured ? (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        )}
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
          {project.icon ? (
            <img src={project.icon} alt={project.name} className="w-8 h-8 object-cover" />
          ) : (
            <span className="text-sm font-bold text-zinc-500">{project.name[0]}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-zinc-100 truncate">
            {project.name}
          </h2>
          <span className="text-[11px] text-zinc-500">{t('vol')}: {formatVolume(project.totalVolume)}</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        <div className="relative p-2 bg-zinc-800/50 rounded-lg">
          <InfoTip text={t('tipLaunch')} />
          <div className="text-[10px] text-zinc-500 mb-0.5 uppercase tracking-wide">{t('launch')}</div>
          {nextLaunch ? (
            <>
              <div className="text-[11px] font-bold text-amber-400 leading-tight">{nextLaunch.date}</div>
              <div className="text-[10px] text-zinc-500">{(nextLaunch.probability * 100).toFixed(1)}%</div>
            </>
          ) : (
            <div className="text-[11px] text-zinc-600 mt-0.5">{t('noData')}</div>
          )}
        </div>
        <div className="relative p-2 bg-zinc-800/50 rounded-lg">
          <InfoTip text={t('tipFdvFloor')} />
          <div className="text-[10px] text-zinc-500 mb-0.5 uppercase tracking-wide">{t('fdvFloor')}</div>
          {(() => {
            const floor = findTopFdvBracket(project.fdvBrackets);
            return floor ? (
              <>
                <div className="text-xs font-bold text-blue-400">{floor.label}+</div>
                <div className="text-[10px] text-zinc-500">{(floor.probability * 100).toFixed(1)}%</div>
              </>
            ) : (
              <div className="text-[11px] text-zinc-600 mt-0.5">{t('noData')}</div>
            );
          })()}
        </div>
        <div className="relative p-2 bg-zinc-800/50 rounded-lg">
          <InfoTip text={t('tipExpFdv')} />
          <div className="text-[10px] text-zinc-500 mb-0.5 uppercase tracking-wide">{t('expFdv')}</div>
          {project.expectedFdv ? (
            <>
              <div className="text-xs font-bold text-emerald-400">{formatUsd(project.expectedFdv)}</div>
              <div className="text-[10px] text-zinc-500">{t('weightedAvg')}</div>
            </>
          ) : (
            <div className="text-[11px] text-zinc-600 mt-0.5">{t('noData')}</div>
          )}
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1 scrollbar-thin">
      {/* FDV Brackets */}
      <div>
        <FdvBar brackets={project.fdvBrackets} slug={project.fdvSlug} />
      </div>

      {/* Token Launch Probability */}
      <div>
        <a
          href={`https://polymarket.com/event/${project.launchSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide mb-1.5 block hover:text-blue-400 transition-colors"
        >
          {t('tokenLaunchProbability')} ↗
        </a>
        {project.tokenLaunch.length > 0 ? (() => {
          const topDate = findTopLaunch(project.tokenLaunch)?.date ?? null;
          return (
          <div className="space-y-1">
            {project.tokenLaunch.map((tl) => {
              const isTop = !tl.closed && tl.date === topDate;
              return (
              <div
                key={tl.date}
                className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xs ${
                  tl.closed ? 'bg-zinc-800/30 opacity-50' : 'bg-zinc-800/50'
                } ${isTop ? 'border-l-2 border-red-500' : ''}`}
              >
                <span className={`truncate ${isTop ? 'text-red-400 font-semibold' : 'text-zinc-300'}`}>
                  {tl.date}
                  {tl.closed && <span className="ml-1 text-[9px] text-zinc-500 uppercase">{t('closed')}</span>}
                </span>
                <span
                  className={`font-medium shrink-0 ml-1 ${
                    isTop
                      ? 'text-red-400'
                      : tl.probability >= 0.5
                        ? 'text-emerald-400'
                        : tl.probability >= 0.2
                          ? 'text-amber-400'
                          : 'text-zinc-400'
                  }`}
                >
                  {(tl.probability * 100).toFixed(1)}%
                </span>
              </div>
              );
            })}
          </div>
          );
        })() : (
          <div className="px-2 py-1.5 text-xs text-zinc-600">{t('noData')}</div>
        )}
      </div>

      {/* Airdrop */}
      {project.airdropDates.length > 0 && (
        <div>
          <h3 className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide mb-1.5">
            {t('airdropProbability')}
          </h3>
          <div className="space-y-1">
            {project.airdropDates.map((ad) => (
              <div
                key={ad.date}
                className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xs ${
                  ad.closed ? 'bg-zinc-800/30 opacity-50' : 'bg-zinc-800/50'
                }`}
              >
                <span className="text-zinc-300 truncate">
                  {ad.date}
                  {ad.closed && <span className="ml-1 text-[9px] text-zinc-500 uppercase">{t('closed')}</span>}
                </span>
                <span
                  className={`font-medium shrink-0 ml-1 ${
                    ad.probability >= 0.5
                      ? 'text-emerald-400'
                      : ad.probability >= 0.2
                        ? 'text-amber-400'
                        : 'text-zinc-400'
                  }`}
                >
                  {(ad.probability * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>{/* end scrollable */}
    </div>
  );
}
