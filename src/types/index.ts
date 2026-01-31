// Token 类型
export type TokenType = 'word' | 'punct';

export interface Token {
  type: TokenType;
  value: string;
  index: number;
}

// ORP 结果
export interface ORPResult {
  left: string;      // ORP 左侧字符
  pivot: string;     // ORP 字符（红色高亮）
  right: string;     // ORP 右侧字符
  pivotIndex: number;
}

// 播放器状态
export type PlayerStatus = 'idle' | 'ready' | 'playing' | 'paused' | 'finished';

export interface PlayerState {
  tokens: Token[];
  currentIndex: number;
  status: PlayerStatus;
  wpm: number;
}

// 标点类型
export type PunctuationType = 'light' | 'heavy' | 'paragraph' | 'quote' | 'none';

// 播放器动作
export type PlayerAction =
  | { type: 'LOAD_TEXT'; tokens: Token[] }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'RESET' }
  | { type: 'NEXT' }
  | { type: 'SEEK'; index: number }
  | { type: 'SET_WPM'; wpm: number };
