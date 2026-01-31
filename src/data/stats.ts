import type { Difficulty } from './articles';

export interface ReadingRecord {
  articleId: string;
  bestWpm: number;
  completedAt: number;
  totalReadTime: number; // in seconds
}

export interface UserStats {
  totalWordsRead: number;
  totalReadTime: number; // in seconds
  totalSessions: number;
  averageWpm: number;
  currentStreak: number; // consecutive days
  longestStreak: number;
  lastReadDate: string; // YYYY-MM-DD
  levelProgress: {
    beginner: number; // completed count
    intermediate: number;
    advanced: number;
  };
  records: ReadingRecord[];
}

const STORAGE_KEY = 'ultrareader_stats';

const DEFAULT_STATS: UserStats = {
  totalWordsRead: 0,
  totalReadTime: 0,
  totalSessions: 0,
  averageWpm: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastReadDate: '',
  levelProgress: {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  },
  records: [],
};

export function loadStats(): UserStats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_STATS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
  return { ...DEFAULT_STATS };
}

export function saveStats(stats: UserStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats:', e);
  }
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function isYesterday(dateStr: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === yesterday.toISOString().split('T')[0];
}

export function recordReading(
  stats: UserStats,
  articleId: string | null,
  wordCount: number,
  wpm: number,
  readTime: number, // in seconds
  difficulty?: Difficulty
): UserStats {
  const today = getToday();
  const newStats = { ...stats };

  // Update totals
  newStats.totalWordsRead += wordCount;
  newStats.totalReadTime += readTime;
  newStats.totalSessions += 1;

  // Update average WPM (weighted average)
  const totalWords = newStats.totalWordsRead;
  const prevWords = totalWords - wordCount;
  if (prevWords > 0) {
    newStats.averageWpm = Math.round(
      (newStats.averageWpm * prevWords + wpm * wordCount) / totalWords
    );
  } else {
    newStats.averageWpm = wpm;
  }

  // Update streak
  if (newStats.lastReadDate === today) {
    // Already read today, no change to streak
  } else if (isYesterday(newStats.lastReadDate)) {
    // Consecutive day
    newStats.currentStreak += 1;
    newStats.longestStreak = Math.max(newStats.longestStreak, newStats.currentStreak);
  } else if (newStats.lastReadDate !== today) {
    // Streak broken or first read
    newStats.currentStreak = 1;
    newStats.longestStreak = Math.max(newStats.longestStreak, 1);
  }
  newStats.lastReadDate = today;

  // Update article record if it's a preset article
  if (articleId) {
    const existingIndex = newStats.records.findIndex(r => r.articleId === articleId);
    if (existingIndex >= 0) {
      const existing = newStats.records[existingIndex];
      if (wpm > existing.bestWpm) {
        newStats.records[existingIndex] = {
          ...existing,
          bestWpm: wpm,
          completedAt: Date.now(),
          totalReadTime: existing.totalReadTime + readTime,
        };
      } else {
        newStats.records[existingIndex] = {
          ...existing,
          totalReadTime: existing.totalReadTime + readTime,
        };
      }
    } else {
      newStats.records.push({
        articleId,
        bestWpm: wpm,
        completedAt: Date.now(),
        totalReadTime: readTime,
      });

      // Update level progress for first completion
      if (difficulty) {
        newStats.levelProgress[difficulty] += 1;
      }
    }
  }

  saveStats(newStats);
  return newStats;
}

export function getRank(stats: UserStats): { rank: string; nextRank: string | null; progress: number } {
  const ranks = [
    { name: 'Novice Reader', minWords: 0 },
    { name: 'Apprentice Reader', minWords: 1000 },
    { name: 'Skilled Reader', minWords: 5000 },
    { name: 'Expert Reader', minWords: 15000 },
    { name: 'Master Reader', minWords: 50000 },
    { name: 'Grandmaster Reader', minWords: 100000 },
    { name: 'Legendary Reader', minWords: 250000 },
  ];

  let currentRank = ranks[0];
  let nextRank = ranks[1];

  for (let i = ranks.length - 1; i >= 0; i--) {
    if (stats.totalWordsRead >= ranks[i].minWords) {
      currentRank = ranks[i];
      nextRank = ranks[i + 1] || null;
      break;
    }
  }

  const progress = nextRank
    ? (stats.totalWordsRead - currentRank.minWords) / (nextRank.minWords - currentRank.minWords)
    : 1;

  return {
    rank: currentRank.name,
    nextRank: nextRank?.name || null,
    progress: Math.min(progress, 1),
  };
}

export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
