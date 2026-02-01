
export type MBTI = 'INTJ' | 'ENTJ' | 'INTP' | 'ENTP' | 'INFJ' | 'ENFJ' | 'INFP' | 'ENFP' | 'ISTJ' | 'ESTJ' | 'ISFJ' | 'ESFJ' | 'ISTP' | 'ESTP' | 'ISFP' | 'ESFP';

export interface Persona {
  mbti: MBTI;
  name: string;
  description: string;
  investmentStyle: string;
}

export type Dimension = 'Why' | 'When' | 'How Much' | 'What If' | 'Exit';

export interface BattleViewState {
  userHP: number;
  currentDimensionIndex: number;
  history: Message[];
  displayContent: string;
  isTyping: boolean;
  speaker: 'user' | 'mirror' | 'judge' | 'system';
  isTakingDamage: boolean;
}

export interface Message {
  role: 'user' | 'mirror' | 'judge' | 'system';
  content: string;
  judgeTag?: 'note' | 'report';
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

export interface AssessmentQuestionOption {
  id: string;
  text: string;
}

export interface AssessmentQuestion {
  id: string;
  dimension?: string;
  prompt: string;
  options: AssessmentQuestionOption[];
}

export interface AssessmentQuestionnaire {
  title: string;
  version: string;
  questions: AssessmentQuestion[];
}

export interface AssessmentAnswer {
  questionId: string;
  choiceId: string;
  choiceText: string;
}
