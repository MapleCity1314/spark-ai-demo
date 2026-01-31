import { MBTI } from '../types';

export const calculateMbtiFromAnswers = (answers: string[]): MBTI => {
  const counts: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  answers.forEach((answer) => {
    if (answer in counts) counts[answer] += 1;
  });

  return [
    counts.E >= counts.I ? 'E' : 'I',
    counts.S >= counts.N ? 'S' : 'N',
    counts.T >= counts.F ? 'T' : 'F',
    counts.J >= counts.P ? 'J' : 'P'
  ].join('') as MBTI;
};
