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
    tipLaunch: 'Highest probability among active (non-closed) launch dates. Volume used as tiebreaker.',
    tipFdvFloor: 'Most meaningful FDV threshold: first ≥50% bracket → highest probability ≥20% (excl. lowest) → fallback.',
    tipExpFdv: 'Weighted average FDV from cumulative bracket probabilities × midpoint of each range.',
    tipFdvProb: 'Cumulative probability of FDV being above each threshold. Red highlight = FDV Floor.',
    chatTitle: 'Chat',
    chatMessages: 'msgs',
    chatEnterName: 'Enter your nickname',
    chatJoin: 'Join',
    chatEmpty: 'No messages yet. Say hi!',
    chatPlaceholder: 'Type a message...',
    chatSend: 'Send',
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
    tipLaunch: '활성(미종료) 런칭 날짜 중 가장 높은 확률. 동률 시 거래량으로 결정.',
    tipFdvFloor: '의미 있는 FDV 기준: ≥50% 구간 우선 → ≥20% 중 최고 확률(최저 구간 제외) → 폴백.',
    tipExpFdv: '누적 구간 확률 × 각 범위 중간값의 가중 평균 FDV.',
    tipFdvProb: '각 구간 이상의 FDV 누적 확률. 빨간 강조 = FDV 바닥.',
    chatTitle: '채팅',
    chatMessages: '개',
    chatEnterName: '닉네임을 입력하세요',
    chatJoin: '입장',
    chatEmpty: '아직 메시지가 없습니다. 인사해보세요!',
    chatPlaceholder: '메시지 입력...',
    chatSend: '전송',
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
