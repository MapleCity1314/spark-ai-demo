
import { Question, Dimension, MBTI } from './types';

export const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "当市场大涨时，你的第一反应是？",
    options: [
      { label: "赶紧上车，怕错过大行情", value: "E" },
      { label: "先观察数据，看看是不是陷阱", value: "I" }
    ]
  },
  {
    id: 2,
    text: "你更倾向于哪种分析？",
    options: [
      { label: "相信自己的直觉和盘感", value: "N" },
      { label: "只相信K线和基本面数据", value: "S" }
    ]
  },
  {
    id: 3,
    text: "在亏损时，你的决策依据是？",
    options: [
      { label: "计算盈亏比和风险承受力", value: "T" },
      { label: "根据当时的心态和情绪决定", value: "F" }
    ]
  },
  {
    id: 4,
    text: "你如何管理你的仓位？",
    options: [
      { label: "严格执行预设的交易计划", value: "J" },
      { label: "灵活操作，随时调整", value: "P" }
    ]
  },
  {
    id: 5,
    text: "你喜欢在社交媒体讨论投资吗？",
    options: [
      { label: "喜欢交流，吸取他人意见", value: "E" },
      { label: "独自思考，不受外界干扰", value: "I" }
    ]
  },
  {
    id: 6,
    text: "面对新出的热门币种，你会？",
    options: [
      { label: "研究它的底层逻辑和宏图", value: "N" },
      { label: "看它的实际应用和成交量", value: "S" }
    ]
  },
  {
    id: 7,
    text: "止损对你来说是？",
    options: [
      { label: "理性的必要断舍离", value: "T" },
      { label: "令人痛苦的失败承认", value: "F" }
    ]
  },
  {
    id: 8,
    text: "你的日常交易节奏是？",
    options: [
      { label: "追求秩序，定时复盘", value: "J" },
      { label: "随性而为，有行情就做", value: "P" }
    ]
  }
];

export const DIMENSIONS: { key: Dimension; title: string; desc: string }[] = [
  { key: 'Why', title: 'Why / 入场理由', desc: '为什么买？理由站得住脚吗' },
  { key: 'When', title: 'When / 时机判定', desc: '为什么是现在？时机对吗' },
  { key: 'How Much', title: 'How Much / 仓位管理', desc: '投多少？仓位合理吗' },
  { key: 'What If', title: 'What If / 容错计划', desc: '错了怎么办？有止损吗' },
  { key: 'Exit', title: 'Exit / 退出策略', desc: '什么时候卖？目标明确吗' }
];

export const MBTI_MAP: Record<MBTI, { name: string; style: string }> = {
  'INTJ': { name: '建筑师', style: '冷静数据型：追求逻辑严密，极度理智' },
  'ENTJ': { name: '指挥官', style: '果断领导型：目标导向，高效执行' },
  'INTP': { name: '逻辑学家', style: '理性推演型：喜欢解构系统，发现漏洞' },
  'ENTP': { name: '辩论家', style: '发散挑战型：善于发现反向机会' },
  'INFJ': { name: '倡导者', style: '直觉洞察型：关注宏观愿景与长期价值' },
  'ENFJ': { name: '主人公', style: '情绪驱动型：受共情和群体氛围影响' },
  'INFP': { name: '调解者', style: '理想主义型：注重个人信念而非纯粹利益' },
  'ENFP': { name: '竞选者', style: '热情探索型：极易被新鲜事物吸引' },
  'ISTJ': { name: '物流师', style: '严谨守旧型：遵循历史数据和纪律' },
  'ESTJ': { name: '总经理', style: '务实管理型：注重规则和现实收益' },
  'ISFJ': { name: '守卫者', style: '稳健防御型：风险厌恶，极度保守' },
  'ESFJ': { name: '执政官', style: '顺势而为型：倾向于跟随主流意见' },
  'ISTP': { name: '鉴赏家', style: '灵活操作型：擅长应对突发波动' },
  'ESTP': { name: '企业家', style: '冒险行动型：追求速度与博弈快感' },
  'ISFP': { name: '艺术家', style: '感性体验型：随缘投资，注重当下感觉' },
  'ESFP': { name: '表演者', style: '冲动追涨型：容易被热点情绪裹挟' }
};

export const getMirrorMBTI = (mbti: MBTI): MBTI => {
  const map: Record<string, string> = { 'E': 'I', 'I': 'E', 'S': 'N', 'N': 'S', 'T': 'F', 'F': 'T', 'J': 'P', 'P': 'J' };
  return mbti.split('').map(char => map[char]).join('') as MBTI;
};
