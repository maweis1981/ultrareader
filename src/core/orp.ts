import type { ORPResult } from '../types';

/**
 * 计算 ORP 索引
 * | 单词长度 | ORP 索引 (0-based) |
 * |---------|-------------------|
 * | ≤ 1     | 0                 |
 * | 2–5     | 1                 |
 * | 6–9     | 2                 |
 * | ≥ 10    | 3                 |
 */
export function calculateORPIndex(word: string): number {
  const len = word.length;

  let orpIndex: number;
  if (len <= 1) {
    orpIndex = 0;
  } else if (len <= 5) {
    orpIndex = 1;
  } else if (len <= 9) {
    orpIndex = 2;
  } else {
    orpIndex = 3;
  }

  // 确保不超出边界
  return Math.min(orpIndex, len - 1);
}

/**
 * 将单词按 ORP 拆分为三部分
 */
export function splitByORP(word: string): ORPResult {
  if (!word || word.length === 0) {
    return {
      left: '',
      pivot: '',
      right: '',
      pivotIndex: 0,
    };
  }

  const pivotIndex = calculateORPIndex(word);

  return {
    left: word.slice(0, pivotIndex),
    pivot: word[pivotIndex],
    right: word.slice(pivotIndex + 1),
    pivotIndex,
  };
}
