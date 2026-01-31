import type { Token, PunctuationType } from '../types';

// 标点延迟倍数
const PUNCT_MULTIPLIERS: Record<PunctuationType, number> = {
  light: 1.3,      // , : ;
  heavy: 1.8,      // . ! ?
  paragraph: 2.5,  // \n\n
  quote: 1.2,      // " ' ( ) [ ]
  none: 1.0,
};

// 单词长度补偿倍数
const LENGTH_MULTIPLIERS: { maxLength: number; multiplier: number }[] = [
  { maxLength: 4, multiplier: 1.0 },
  { maxLength: 7, multiplier: 1.1 },
  { maxLength: Infinity, multiplier: 1.3 },
];

/**
 * 识别标点类型
 */
export function getPunctuationType(value: string): PunctuationType {
  if (value === '\n\n' || /\n\n+/.test(value)) {
    return 'paragraph';
  }

  if (/[.!?]/.test(value)) {
    return 'heavy';
  }

  if (/[,:;]/.test(value)) {
    return 'light';
  }

  if (/["'()[\]""''「」『』]/.test(value)) {
    return 'quote';
  }

  return 'none';
}

/**
 * 获取单词长度补偿倍数
 */
export function getLengthMultiplier(wordLength: number): number {
  for (const { maxLength, multiplier } of LENGTH_MULTIPLIERS) {
    if (wordLength <= maxLength) {
      return multiplier;
    }
  }
  return 1.0;
}

/**
 * 计算基础间隔（毫秒）
 */
export function getBaseInterval(wpm: number): number {
  return 60000 / wpm;
}

/**
 * 计算 token 的显示延迟（毫秒）
 */
export function calculateDelay(token: Token, wpm: number): number {
  const baseInterval = getBaseInterval(wpm);

  if (token.type === 'punct') {
    const punctType = getPunctuationType(token.value);
    return baseInterval * PUNCT_MULTIPLIERS[punctType];
  }

  // 单词类型：应用长度补偿
  const lengthMultiplier = getLengthMultiplier(token.value.length);
  return baseInterval * lengthMultiplier;
}
