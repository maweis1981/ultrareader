import type { UserStats } from '../../data/stats';
import { getRank, formatTime } from '../../data/stats';
import { articles } from '../../data/articles';
import './styles.css';

interface StatsPanelProps {
  stats: UserStats;
}

export function StatsPanel({ stats }: StatsPanelProps) {
  const { rank, nextRank, progress } = getRank(stats);

  // Count articles per difficulty
  const articleCounts = {
    beginner: articles.filter(a => a.difficulty === 'beginner').length,
    intermediate: articles.filter(a => a.difficulty === 'intermediate').length,
    advanced: articles.filter(a => a.difficulty === 'advanced').length,
  };

  return (
    <div className="stats-panel">
      <div className="stats-header">
        <div className="rank-section">
          <div className="rank-title">{rank}</div>
          {nextRank && (
            <div className="rank-progress">
              <div className="rank-progress-bar">
                <div
                  className="rank-progress-fill"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <span className="rank-next">Next: {nextRank}</span>
            </div>
          )}
        </div>

        <div className="streak-section">
          <div className="streak-value">{stats.currentStreak}</div>
          <div className="streak-label">Day Streak</div>
          {stats.longestStreak > stats.currentStreak && (
            <div className="streak-label">Best: {stats.longestStreak}</div>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-value">{stats.totalWordsRead.toLocaleString()}</span>
          <span className="stat-label">Words Read</span>
        </div>
        <div className="stat-item">
          <span className="stat-value highlight">{stats.averageWpm || '-'}</span>
          <span className="stat-label">Avg WPM</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{formatTime(stats.totalReadTime)}</span>
          <span className="stat-label">Total Time</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.totalSessions}</span>
          <span className="stat-label">Sessions</span>
        </div>
      </div>

      <div className="level-progress">
        <h3>Articles Completed</h3>
        <div className="level-item">
          <span className="level-name">Beginner</span>
          <div className="level-bar">
            <div
              className="level-bar-fill beginner"
              style={{ width: `${(stats.levelProgress.beginner / articleCounts.beginner) * 100}%` }}
            />
          </div>
          <span className="level-count">{stats.levelProgress.beginner} / {articleCounts.beginner}</span>
        </div>
        <div className="level-item">
          <span className="level-name">Intermediate</span>
          <div className="level-bar">
            <div
              className="level-bar-fill intermediate"
              style={{ width: `${(stats.levelProgress.intermediate / articleCounts.intermediate) * 100}%` }}
            />
          </div>
          <span className="level-count">{stats.levelProgress.intermediate} / {articleCounts.intermediate}</span>
        </div>
        <div className="level-item">
          <span className="level-name">Advanced</span>
          <div className="level-bar">
            <div
              className="level-bar-fill advanced"
              style={{ width: `${(stats.levelProgress.advanced / articleCounts.advanced) * 100}%` }}
            />
          </div>
          <span className="level-count">{stats.levelProgress.advanced} / {articleCounts.advanced}</span>
        </div>
      </div>
    </div>
  );
}
