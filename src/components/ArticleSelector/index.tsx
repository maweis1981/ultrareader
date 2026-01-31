import { useState, useMemo } from 'react';
import type { Article, ArticleCategory, Difficulty } from '../../data/articles';
import {
  articles,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
} from '../../data/articles';
import type { ReadingRecord } from '../../data/stats';
import './styles.css';

interface ArticleSelectorProps {
  onSelectArticle: (article: Article) => void;
  onCustomText: () => void;
  records: ReadingRecord[];
}

export function ArticleSelector({ onSelectArticle, onCustomText, records }: ArticleSelectorProps) {
  const [categoryFilter, setCategoryFilter] = useState<ArticleCategory | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      if (categoryFilter !== 'all' && article.category !== categoryFilter) return false;
      if (difficultyFilter !== 'all' && article.difficulty !== difficultyFilter) return false;
      return true;
    });
  }, [categoryFilter, difficultyFilter]);

  const getArticleRecord = (articleId: string): ReadingRecord | undefined => {
    return records.find(r => r.articleId === articleId);
  };

  return (
    <div className="article-selector">
      <div className="article-selector-header">
        <h2>Choose an Article</h2>
        <button className="custom-text-btn" onClick={onCustomText}>
          Custom Text
        </button>
      </div>

      <div className="article-filters">
        <div className="filter-group">
          <label>Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ArticleCategory | 'all')}
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Difficulty:</label>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as Difficulty | 'all')}
          >
            <option value="all">All Levels</option>
            {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="article-list">
        {filteredArticles.length === 0 ? (
          <div className="no-articles">No articles match your filters</div>
        ) : (
          filteredArticles.map(article => {
            const record = getArticleRecord(article.id);
            return (
              <div
                key={article.id}
                className={`article-card ${record ? 'completed' : ''}`}
                onClick={() => onSelectArticle(article)}
              >
                <div className="article-info">
                  <span className="article-title">{article.title}</span>
                  <div className="article-meta">
                    <span className={`article-badge ${article.difficulty}`}>
                      {DIFFICULTY_LABELS[article.difficulty]}
                    </span>
                    <span>{CATEGORY_LABELS[article.category]}</span>
                    <span>{article.wordCount} words</span>
                  </div>
                </div>
                <div className="article-stats">
                  {record && (
                    <>
                      <span className="article-best-wpm">Best: {record.bestWpm} WPM</span>
                      <span className="article-completed-icon">✓</span>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
