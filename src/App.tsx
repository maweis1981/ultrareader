import { useEffect, useState, useRef, useCallback } from 'react';
import { useRSVPPlayer } from './hooks/useRSVPPlayer';
import { RSVPDisplay } from './components/RSVPDisplay';
import { TextInput } from './components/TextInput';
import { Controls } from './components/Controls';
import { HUD } from './components/HUD';
import { ArticleSelector } from './components/ArticleSelector';
import { StatsPanel } from './components/StatsPanel';
import type { Article } from './data/articles';
import { DIFFICULTY_WPM } from './data/articles';
import type { UserStats } from './data/stats';
import { loadStats, recordReading } from './data/stats';
import './App.css';

type AppView = 'home' | 'reading' | 'custom-input';

function App() {
  const {
    currentToken,
    status,
    wpm,
    effectiveWpm,
    currentIndex,
    totalTokens,
    progress,
    progressiveMode,
    loadText,
    togglePlay,
    reset,
    seek,
    seekRelative,
    setWpm,
    adjustWpm,
    setProgressiveMode,
  } = useRSVPPlayer();

  const [view, setView] = useState<AppView>('home');
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [stats, setStats] = useState<UserStats>(() => loadStats());
  const [showStats, setShowStats] = useState(false);
  const startTimeRef = useRef<number>(0);
  const wordCountRef = useRef<number>(0);

  // Load stats on mount
  useEffect(() => {
    setStats(loadStats());
  }, []);

  // Track reading start time
  useEffect(() => {
    if (status === 'playing' && startTimeRef.current === 0) {
      startTimeRef.current = Date.now();
    }
  }, [status]);

  // Record reading when finished
  const handleReadingComplete = useCallback(() => {
    if (startTimeRef.current > 0 && wordCountRef.current > 0) {
      const readTime = Math.round((Date.now() - startTimeRef.current) / 1000);
      const newStats = recordReading(
        stats,
        currentArticle?.id || null,
        wordCountRef.current,
        wpm,
        readTime,
        currentArticle?.difficulty
      );
      setStats(newStats);
    }
    startTimeRef.current = 0;
  }, [stats, currentArticle, wpm]);

  // Watch for finished status
  useEffect(() => {
    if (status === 'finished') {
      handleReadingComplete();
    }
  }, [status, handleReadingComplete]);

  // Handle article selection
  const handleSelectArticle = (article: Article) => {
    setCurrentArticle(article);
    setWpm(DIFFICULTY_WPM[article.difficulty]);
    loadText(article.content);
    wordCountRef.current = article.wordCount;
    startTimeRef.current = 0;
    setView('reading');
  };

  // Handle custom text
  const handleCustomText = (text: string) => {
    setCurrentArticle(null);
    loadText(text);
    // Estimate word count
    wordCountRef.current = text.split(/\s+/).filter(w => w.length > 0).length;
    startTimeRef.current = 0;
    setView('reading');
  };

  // Handle back to home
  const handleBackToHome = useCallback(() => {
    if (status === 'playing' || status === 'paused') {
      handleReadingComplete();
    }
    reset();
    setCurrentArticle(null);
    setView('home');
  }, [status, handleReadingComplete, reset]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框中的按键
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }

      // Only handle shortcuts in reading view
      if (view !== 'reading') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekRelative(e.shiftKey ? -5 : -1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekRelative(e.shiftKey ? 5 : 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustWpm(50);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustWpm(-50);
          break;
        case 'KeyR':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            reset();
            startTimeRef.current = 0;
          }
          break;
        case 'Escape':
          e.preventDefault();
          handleBackToHome();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, togglePlay, seekRelative, adjustWpm, reset, handleBackToHome]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 onClick={() => view !== 'home' && handleBackToHome()} style={{ cursor: view !== 'home' ? 'pointer' : 'default' }}>
          UltraReader
        </h1>
        <p className="app-subtitle">RSVP Speed Reading Tool</p>
        {view === 'home' && (
          <button
            className="stats-toggle-btn"
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? 'Hide Stats' : 'My Progress'}
          </button>
        )}
      </header>

      <main className="app-main">
        {view === 'home' && (
          <>
            {showStats && <StatsPanel stats={stats} />}
            <ArticleSelector
              onSelectArticle={handleSelectArticle}
              onCustomText={() => setView('custom-input')}
              records={stats.records}
            />
          </>
        )}

        {view === 'custom-input' && (
          <TextInput
            onSubmit={handleCustomText}
            onBack={() => setView('home')}
          />
        )}

        {view === 'reading' && (
          <>
            {currentArticle && (
              <div className="article-title-bar">
                <span className="article-reading-title">{currentArticle.title}</span>
              </div>
            )}

            <HUD
              status={status}
              wpm={progressiveMode.enabled ? effectiveWpm : wpm}
              currentIndex={currentIndex}
              totalTokens={totalTokens}
              progress={progress}
            />

            <RSVPDisplay token={currentToken} />

            <Controls
              status={status}
              wpm={wpm}
              effectiveWpm={effectiveWpm}
              progress={progress}
              currentIndex={currentIndex}
              totalTokens={totalTokens}
              progressiveMode={progressiveMode}
              onTogglePlay={togglePlay}
              onReset={() => {
                reset();
                startTimeRef.current = 0;
              }}
              onSeek={seek}
              onSeekRelative={seekRelative}
              onSetWpm={setWpm}
              onSetProgressiveMode={setProgressiveMode}
            />

            <button className="new-text-btn" onClick={handleBackToHome}>
              Back to Articles
            </button>
          </>
        )}
      </main>

      {view === 'reading' && (
        <footer className="app-footer">
          <div className="shortcuts">
            <span><kbd>Space</kbd> Play/Pause</span>
            <span><kbd>←</kbd><kbd>→</kbd> Seek ±1</span>
            <span><kbd>Shift</kbd>+<kbd>←</kbd><kbd>→</kbd> Seek ±5</span>
            <span><kbd>↑</kbd><kbd>↓</kbd> WPM ±50</span>
            <span><kbd>Esc</kbd> Back</span>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
