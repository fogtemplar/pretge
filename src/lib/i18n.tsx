'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

const translations = {
  en: {
    title: 'Pre-TGE Oracle',
    subtitle: 'Polymarket prediction data',
    searchPlaceholder: 'Search projects...',
    allProjects: 'All Projects',
    sortedByVolume: 'sorted by volume',
    loading: 'Loading market data...',
    error: 'Failed to load market data. Please try again later.',
    noResults: 'No projects matching',
    dataFrom: 'Data from',
    notFinancialAdvice: 'Not financial advice.',
    madeBy: 'made by',
    vol: 'Vol',
    launch: 'Launch',
    fdvFloor: 'FDV Floor',
    expFdv: 'Exp. FDV',
    weightedAvg: 'weighted avg',
    noData: 'No data',
    fdvProbability: 'FDV Probability',
    tokenLaunchProbability: 'Token Launch Probability',
    airdropProbability: 'Airdrop Probability',
    closed: 'Closed',
  },
  ko: {
    title: 'Pre-TGE Oracle',
    subtitle: 'Polymarket 예측 데이터',
    searchPlaceholder: '프로젝트 검색...',
    allProjects: '전체 프로젝트',
    sortedByVolume: '거래량 순',
    loading: '마켓 데이터 로딩 중...',
    error: '마켓 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    noResults: '검색 결과 없음',
    dataFrom: '데이터 출처',
    notFinancialAdvice: '투자 조언이 아닙니다.',
    madeBy: 'made by',
    vol: '거래량',
    launch: '런칭',
    fdvFloor: 'FDV 바닥',
    expFdv: '예상 FDV',
    weightedAvg: '가중 평균',
    noData: '데이터 없음',
    fdvProbability: 'FDV 확률',
    tokenLaunchProbability: '토큰 런칭 확률',
    airdropProbability: '에어드롭 확률',
    closed: '종료',
  },
} as const;

type Lang = keyof typeof translations;
type TranslationKey = keyof (typeof translations)['en'];

interface LangContextValue {
  lang: Lang;
  t: (key: TranslationKey) => string;
  toggle: () => void;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  const toggle = useCallback(() => {
    setLang((prev) => (prev === 'en' ? 'ko' : 'en'));
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[lang][key],
    [lang],
  );

  return (
    <LangContext.Provider value={{ lang, t, toggle }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
