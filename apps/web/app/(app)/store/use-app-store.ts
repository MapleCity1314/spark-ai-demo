import { create } from 'zustand';

import { Dimension, MarketData, Message, MBTI, BattleViewState } from '../types';
import { getMirrorMBTI } from '../constants';
import { calculateMbtiFromAnswers } from '../utils/mbti';

export type EffectType = 'objection' | 'takeThat' | 'hammer' | null;
export type DataTab = 'chain' | 'social' | 'whales';

const createInitialBattleState = (): BattleViewState => ({
  userHP: 50,
  currentDimensionIndex: 0,
  history: [],
  displayContent: '',
  isTyping: false,
  speaker: 'system',
  isTakingDamage: false
});

interface AppState {
  answers: string[];
  userMBTI: MBTI;
  mirrorMBTI: MBTI;
  targetSymbol: string;
  selectedDims: Dimension[];
  battleState: BattleViewState;
  marketData: MarketData | null;
  loading: boolean;
  effect: EffectType;
  finalReport: string;
  activeTab: DataTab;
  setAnswers: (answers: string[]) => void;
  addAnswer: (answer: string) => void;
  removeLastAnswer: () => void;
  applyAssessmentResults: (answers: string[]) => void;
  setTargetSymbol: (symbol: string) => void;
  setSelectedDims: (dims: Dimension[]) => void;
  toggleDimension: (dim: Dimension) => void;
  setBattleState: (update: Partial<BattleViewState> | ((prev: BattleViewState) => BattleViewState)) => void;
  resetBattle: () => void;
  setMarketData: (data: MarketData | null) => void;
  setLoading: (loading: boolean) => void;
  setEffect: (effect: EffectType) => void;
  setFinalReport: (report: string) => void;
  setActiveTab: (tab: DataTab) => void;
  resetSession: () => void;
  clearFinalReport: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  answers: [],
  userMBTI: 'ESTJ',
  mirrorMBTI: 'INFP',
  targetSymbol: 'SOL',
  selectedDims: ['Why', 'When', 'How Much', 'What If', 'Exit'],
  battleState: createInitialBattleState(),
  marketData: null,
  loading: false,
  effect: null,
  finalReport: '',
  activeTab: 'chain',
  setAnswers: (answers) => set({ answers }),
  addAnswer: (answer) => set((state) => ({ answers: [...state.answers, answer] })),
  removeLastAnswer: () => set((state) => ({ answers: state.answers.slice(0, -1) })),
  applyAssessmentResults: (answers) => {
    const mbti = calculateMbtiFromAnswers(answers);
    set({
      answers,
      userMBTI: mbti,
      mirrorMBTI: getMirrorMBTI(mbti)
    });
  },
  setTargetSymbol: (symbol) => set({ targetSymbol: symbol }),
  setSelectedDims: (dims) => set({ selectedDims: dims }),
  toggleDimension: (dim) =>
    set((state) => ({
      selectedDims: state.selectedDims.includes(dim)
        ? state.selectedDims.filter((item) => item !== dim)
        : [...state.selectedDims, dim]
    })),
  setBattleState: (update) =>
    set((state) => ({
      battleState:
        typeof update === 'function'
          ? update(state.battleState)
          : { ...state.battleState, ...update }
    })),
  resetBattle: () =>
    set({
      battleState: createInitialBattleState(),
      marketData: null,
      effect: null,
      loading: false
    }),
  setMarketData: (data) => set({ marketData: data }),
  setLoading: (loading) => set({ loading }),
  setEffect: (effect) => set({ effect }),
  setFinalReport: (report) => set({ finalReport: report }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  resetSession: () =>
    set({
      answers: [],
      userMBTI: 'ESTJ',
      mirrorMBTI: 'INFP',
      targetSymbol: 'SOL',
      selectedDims: ['Why', 'When', 'How Much', 'What If', 'Exit'],
      battleState: createInitialBattleState(),
      marketData: null,
      loading: false,
      effect: null,
      finalReport: '',
      activeTab: 'chain'
    }),
  clearFinalReport: () => set({ finalReport: '' })
}));

export const getInitialBattleState = createInitialBattleState;
