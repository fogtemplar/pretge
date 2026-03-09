'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import type { ApiResponse } from '@/types';
import { ProjectCard } from '@/components/ProjectCard';
import { MiniChat } from '@/components/MiniChat';
import { LangProvider, useLang } from '@/lib/i18n';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatVol(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function formatFdv(v: number | null): string {
  if (!v) return '-';
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M`;
  return `$${(v / 1_000).toFixed(0)}K`;
}

function Dashboard() {
  const { data, error, isLoading } = useSWR<ApiResponse>('/api/markets', fetcher, {
    refreshInterval: 60_000,
  });
  const { lang, t, toggle } = useLang();

  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!data?.projects) return [];
    const q = search.toLowerCase().trim();
    if (!q) return data.projects;
    return data.projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [data?.projects, search]);

  const scrollToProject = (name: string) => {
    setSelectedProject('');
    requestAnimationFrame(() => {
      setSelectedProject(name);
      setSearch('');
      const el = document.getElementById(`project-${name}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <main className="max-w-[1800px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{t('title')}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {t('subtitle')}
            {data?.projects && (
              <span className="ml-1 text-zinc-600">
                ({filtered.length}/{data.projects.length})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data?.updatedAt && (
            <span className="text-[11px] text-zinc-600 hidden md:inline">
              {new Date(data.updatedAt).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={toggle}
            className="px-2.5 py-1.5 bg-zinc-800/80 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-700/80 hover:text-zinc-100 transition-colors"
          >
            {lang === 'en' ? '한국어' : 'EN'}
          </button>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-800/80 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 w-48"
          />
        </div>
      </div>

      {/* Compact Project List */}
      {data?.projects && data.projects.length > 0 && (
        <div className="mb-6 bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 overflow-x-auto">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">{t('allProjects')}</h2>
            <span className="text-[10px] text-zinc-600">{t('sortedByVolume')}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.projects.map((p, i) => (
              <button
                key={p.name}
                onClick={() => scrollToProject(p.name)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors ${
                  selectedProject === p.name
                    ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                    : 'bg-zinc-800/60 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                }`}
              >
                <span className="text-zinc-600 font-mono">{i + 1}</span>
                {p.icon && (
                  <img src={p.icon} alt="" className="w-3.5 h-3.5 rounded-sm" />
                )}
                <span className="font-medium text-zinc-200">{p.name}</span>
                <span className="text-zinc-500">{formatVol(p.totalVolume)}</span>
                {p.expectedFdv && (
                  <span className="text-emerald-500/70">{formatFdv(p.expectedFdv)}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-zinc-500">{t('loading')}</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {t('error')}
        </div>
      )}

      {/* No results */}
      {!isLoading && filtered.length === 0 && search && (
        <div className="text-center py-12 text-zinc-500 text-sm">
          {t('noResults')} &quot;{search}&quot;
        </div>
      )}

      {/* Project Grid — 5 columns */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((project) => (
            <div
              key={project.name}
              id={`project-${project.name}`}
              className={selectedProject === project.name ? 'animate-highlight rounded-xl' : ''}
            >
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <footer className="mt-10 pt-4 border-t border-zinc-800 text-center text-[11px] text-zinc-600 space-y-1">
        <div>
          {t('dataFrom')}{' '}
          <a
            href="https://polymarket.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-400"
          >
            Polymarket
          </a>
          . {t('notFinancialAdvice')}
        </div>
        <div>
          {t('madeBy')}{' '}
          <a
            href="https://x.com/oldman_cek"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            @cek
          </a>
        </div>
      </footer>

      {/* Mini Chat */}
      <MiniChat />

      {/* Floating badge */}
      <a
        href="https://x.com/oldman_cek"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 flex items-center gap-2 px-4 py-2 bg-zinc-900/95 border border-zinc-600/50 rounded-full text-xs text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-colors backdrop-blur-sm shadow-lg"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span>{t('madeBy')} <span className="text-zinc-200 font-medium">@cek</span></span>
      </a>
    </main>
  );
}

export default function Home() {
  return (
    <LangProvider>
      <Dashboard />
    </LangProvider>
  );
}
