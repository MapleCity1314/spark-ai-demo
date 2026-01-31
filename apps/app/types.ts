
export type MBTI = 'INTJ' | 'ENTJ' | 'INTP' | 'ENTP' | 'INFJ' | 'ENFJ' | 'INFP' | 'ENFP' | 'ISTJ' | 'ESTJ' | 'ISFJ' | 'ESFJ' | 'ISTP' | 'ESTP' | 'ISFP' | 'ESFP';

export interface Persona {
  mbti: MBTI;
  name: string;
  description: string;
  investmentStyle: string;
}

export type Dimension = 'Why' | 'When' | 'How Much' | 'What If' | 'Exit';

export interface BattleState {
  userHP: number;
  mirrorHP: number;
  currentDimensionIndex: number;
  selectedDimensions: Dimension[];
  history: Message[];
  status: 'assessment' | 'setup' | 'battle' | 'report';
}

export interface Message {
  role: 'user' | 'mirror' | 'judge' | 'system';
  content: string;
  dimension?: Dimension;
  scoreDelta?: number;
  marketData?: MarketData;
}

export interface MarketData {
  symbol: string;
  price: string;
  change24h: string;
  sentiment: string;
  risk: string;
  sources?: { title?: string; uri?: string }[];
}

export interface Question {
  id: number;
  text: string;
  options: {
    label: string;
    value: string; // Part of MBTI E/I, S/N, T/F, J/P
  }[];
}
