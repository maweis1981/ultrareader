import type { Token } from '../types';

// 单词匹配正则：支持缩写(can't)、连字符(e-mail)、数字(3.14, 1,000)
const WORD_PATTERN = /[a-zA-Z0-9]+(?:[''-][a-zA-Z0-9]+)*/g;

// 段落标点（两个及以上换行）
const PARAGRAPH_PATTERN = /\n\n+/g;

/**
 * 将文本分词为 Token 数组
 */
export function tokenize(text: string): Token[] {
  // 预处理：统一换行符
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const tokens: Token[] = [];
  let lastIndex = 0;
  let tokenIndex = 0;

  // 先处理段落标点，将其替换为特殊标记
  const paragraphMarker = '\u0000PARA\u0000';
  const textWithMarkers = normalizedText.replace(PARAGRAPH_PATTERN, paragraphMarker);

  // 匹配所有单词
  const matches = [...textWithMarkers.matchAll(WORD_PATTERN)];

  for (const match of matches) {
    const wordStart = match.index!;

    // 处理单词之前的非单词字符（标点符号）
    if (wordStart > lastIndex) {
      const between = textWithMarkers.slice(lastIndex, wordStart);
      const punctTokens = extractPunctuation(between, paragraphMarker);
      for (const punct of punctTokens) {
        if (punct.trim() || punct === paragraphMarker) {
          tokens.push({
            type: 'punct',
            value: punct === paragraphMarker ? '\n\n' : punct,
            index: tokenIndex++,
          });
        }
      }
    }

    // 添加单词 token
    tokens.push({
      type: 'word',
      value: match[0],
      index: tokenIndex++,
    });

    lastIndex = wordStart + match[0].length;
  }

  // 处理最后剩余的标点
  if (lastIndex < textWithMarkers.length) {
    const remaining = textWithMarkers.slice(lastIndex);
    const punctTokens = extractPunctuation(remaining, paragraphMarker);
    for (const punct of punctTokens) {
      if (punct.trim() || punct === paragraphMarker) {
        tokens.push({
          type: 'punct',
          value: punct === paragraphMarker ? '\n\n' : punct,
          index: tokenIndex++,
        });
      }
    }
  }

  return tokens;
}

/**
 * 从字符串中提取标点符号
 */
function extractPunctuation(str: string, paragraphMarker: string): string[] {
  const result: string[] = [];
  let current = '';

  for (let i = 0; i < str.length; i++) {
    // 检查是否是段落标记
    if (str.slice(i).startsWith(paragraphMarker)) {
      if (current.trim()) {
        result.push(...current.split('').filter(c => c.trim()));
      }
      result.push(paragraphMarker);
      current = '';
      i += paragraphMarker.length - 1;
      continue;
    }

    const char = str[i];
    // 跳过空白字符（除了段落标记）
    if (/\s/.test(char)) {
      if (current.trim()) {
        result.push(...current.split('').filter(c => c.trim()));
      }
      current = '';
      continue;
    }

    // 每个标点单独成 token
    result.push(char);
  }

  if (current.trim()) {
    result.push(...current.split('').filter(c => c.trim()));
  }

  return result;
}
