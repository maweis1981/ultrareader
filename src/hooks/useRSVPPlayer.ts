import { useReducer, useRef, useCallback, useEffect } from 'react';
import type { Token, PlayerState, PlayerAction, PlayerStatus } from '../types';
import { tokenize } from '../core/tokenizer';
import { calculateDelay } from '../core/timing';

export interface ProgressiveMode {
  enabled: boolean;
  startWpm: number;
  targetWpm: number;
  rampUpPercent: number; // 在前 X% 的内容中逐渐提速
}

interface ExtendedPlayerState extends PlayerState {
  progressiveMode: ProgressiveMode;
  baseWpm: number; // 用于渐进模式的基础 WPM
}

type ExtendedPlayerAction = PlayerAction | { type: 'SET_PROGRESSIVE_MODE'; mode: ProgressiveMode };

const defaultProgressiveMode: ProgressiveMode = {
  enabled: false,
  startWpm: 200,
  targetWpm: 400,
  rampUpPercent: 50,
};

const initialState: ExtendedPlayerState = {
  tokens: [],
  currentIndex: 0,
  status: 'idle',
  wpm: 300,
  baseWpm: 300,
  progressiveMode: defaultProgressiveMode,
};

function playerReducer(state: ExtendedPlayerState, action: ExtendedPlayerAction): ExtendedPlayerState {
  switch (action.type) {
    case 'LOAD_TEXT':
      return {
        ...state,
        tokens: action.tokens,
        currentIndex: 0,
        status: action.tokens.length > 0 ? 'ready' : 'idle',
      };

    case 'PLAY':
      if (state.tokens.length === 0) return state;
      if (state.status === 'finished') {
        // 重新开始时，如果是渐进模式，重置 WPM
        const newWpm = state.progressiveMode.enabled ? state.progressiveMode.startWpm : state.wpm;
        return { ...state, currentIndex: 0, status: 'playing', wpm: newWpm };
      }
      return { ...state, status: 'playing' };

    case 'PAUSE':
      if (state.status !== 'playing') return state;
      return { ...state, status: 'paused' };

    case 'RESET': {
      const resetWpm = state.progressiveMode.enabled ? state.progressiveMode.startWpm : state.baseWpm;
      return {
        ...state,
        currentIndex: 0,
        status: state.tokens.length > 0 ? 'ready' : 'idle',
        wpm: resetWpm,
      };
    }

    case 'NEXT':
      if (state.currentIndex >= state.tokens.length - 1) {
        return { ...state, status: 'finished' };
      }
      return { ...state, currentIndex: state.currentIndex + 1 };

    case 'SEEK': {
      const newIndex = Math.max(0, Math.min(action.index, state.tokens.length - 1));
      const newStatus: PlayerStatus = state.status === 'finished' && newIndex < state.tokens.length - 1
        ? 'paused'
        : state.status;
      return { ...state, currentIndex: newIndex, status: newStatus };
    }

    case 'SET_WPM':
      return {
        ...state,
        wpm: Math.max(100, Math.min(1000, action.wpm)),
        baseWpm: Math.max(100, Math.min(1000, action.wpm)),
      };

    case 'SET_PROGRESSIVE_MODE': {
      const newWpm = action.mode.enabled ? action.mode.startWpm : state.baseWpm;
      return {
        ...state,
        progressiveMode: action.mode,
        wpm: newWpm,
      };
    }

    default:
      return state;
  }
}

// 计算渐进模式下的当前 WPM
function calculateProgressiveWpm(
  progress: number,
  mode: ProgressiveMode
): number {
  if (!mode.enabled) return mode.targetWpm;

  const rampUpProgress = mode.rampUpPercent / 100;

  if (progress >= rampUpProgress) {
    // 已经达到目标速度
    return mode.targetWpm;
  }

  // 线性插值
  const progressRatio = progress / rampUpProgress;
  const wpmRange = mode.targetWpm - mode.startWpm;
  return Math.round(mode.startWpm + wpmRange * progressRatio);
}

export function useRSVPPlayer() {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  const timerRef = useRef<number | null>(null);

  const currentToken = state.tokens[state.currentIndex] ?? null;
  const progress = state.tokens.length > 0 ? state.currentIndex / state.tokens.length : 0;

  // 计算当前应该使用的 WPM（考虑渐进模式）
  const effectiveWpm = state.progressiveMode.enabled
    ? calculateProgressiveWpm(progress, state.progressiveMode)
    : state.wpm;

  // 清除定时器
  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 播放下一个 token
  const scheduleNext = useCallback(() => {
    if (state.status !== 'playing') return;

    const token = state.tokens[state.currentIndex];
    if (!token) return;

    const delay = calculateDelay(token, effectiveWpm);

    timerRef.current = window.setTimeout(() => {
      dispatch({ type: 'NEXT' });
    }, delay);
  }, [state.status, state.tokens, state.currentIndex, effectiveWpm]);

  // 监听状态变化，调度下一个 token
  useEffect(() => {
    clearTimer();

    if (state.status === 'playing') {
      scheduleNext();
    }

    return clearTimer;
  }, [state.status, state.currentIndex, scheduleNext, clearTimer]);

  // 加载文本
  const loadText = useCallback((text: string) => {
    clearTimer();
    const tokens = tokenize(text);
    dispatch({ type: 'LOAD_TEXT', tokens });
  }, [clearTimer]);

  // 播放/暂停切换
  const togglePlay = useCallback(() => {
    if (state.status === 'playing') {
      dispatch({ type: 'PAUSE' });
    } else {
      dispatch({ type: 'PLAY' });
    }
  }, [state.status]);

  // 播放
  const play = useCallback(() => {
    dispatch({ type: 'PLAY' });
  }, []);

  // 暂停
  const pause = useCallback(() => {
    dispatch({ type: 'PAUSE' });
  }, []);

  // 重置
  const reset = useCallback(() => {
    clearTimer();
    dispatch({ type: 'RESET' });
  }, [clearTimer]);

  // 跳转
  const seek = useCallback((index: number) => {
    dispatch({ type: 'SEEK', index });
  }, []);

  // 相对跳转
  const seekRelative = useCallback((delta: number) => {
    dispatch({ type: 'SEEK', index: state.currentIndex + delta });
  }, [state.currentIndex]);

  // 设置 WPM
  const setWpm = useCallback((wpm: number) => {
    dispatch({ type: 'SET_WPM', wpm });
  }, []);

  // 调整 WPM
  const adjustWpm = useCallback((delta: number) => {
    dispatch({ type: 'SET_WPM', wpm: state.wpm + delta });
  }, [state.wpm]);

  // 设置渐进模式
  const setProgressiveMode = useCallback((mode: ProgressiveMode) => {
    dispatch({ type: 'SET_PROGRESSIVE_MODE', mode });
  }, []);

  return {
    // 状态
    tokens: state.tokens,
    currentIndex: state.currentIndex,
    currentToken,
    status: state.status,
    wpm: state.wpm,
    effectiveWpm,
    totalTokens: state.tokens.length,
    progress: state.tokens.length > 0 ? (state.currentIndex + 1) / state.tokens.length : 0,
    progressiveMode: state.progressiveMode,

    // 操作
    loadText,
    togglePlay,
    play,
    pause,
    reset,
    seek,
    seekRelative,
    setWpm,
    adjustWpm,
    setProgressiveMode,
  };
}
