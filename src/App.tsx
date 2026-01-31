import { useEffect, useState, useRef, useCallback } from 'react';
import { useRSVPPlayer } from './hooks/useRSVPPlayer';
import { useCanvasRecorder } from './hooks/useCanvasRecorder';
import { RSVPDisplay } from './components/RSVPDisplay';
import { TextInput } from './components/TextInput';
import { Controls } from './components/Controls';
import { HUD } from './components/HUD';
import { ArticleSelector } from './components/ArticleSelector';
import { StatsPanel } from './components/StatsPanel';
import { CompletionScreen } from './components/CompletionScreen';
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

  const {
    isRecording,
    recordedBlob,
    recordedMimeType,
    orientation,
    setOrientation,
    startRecording,
    stopRecording,
    recordFrame,
    clearRecording,
  } = useCanvasRecorder();

  const [view, setView] = useState<AppView>('home');
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [stats, setStats] = useState<UserStats>(() => loadStats());
  const [showStats, setShowStats] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionData, setCompletionData] = useState<{
    wordCount: number;
    readTime: number;
    wpm: number;
  } | null>(null);

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

  // Record frame when token changes (during recording)
  useEffect(() => {
    if (isRecording && status === 'playing') {
      const currentWpm = progressiveMode.enabled ? effectiveWpm : wpm;
      recordFrame(currentToken, currentWpm, progress, {
        articleTitle: currentArticle?.title,
        currentIndex,
        totalTokens,
      });
    }
  }, [isRecording, status, currentToken, wpm, effectiveWpm, progressiveMode.enabled, progress, recordFrame, currentArticle, currentIndex, totalTokens]);

  // Record reading when finished
  const handleReadingComplete = useCallback(async () => {
    if (startTimeRef.current > 0 && wordCountRef.current > 0) {
      const readTime = Math.round((Date.now() - startTimeRef.current) / 1000);
      const finalWpm = progressiveMode.enabled ? effectiveWpm : wpm;

      // Save completion data for the completion screen
      setCompletionData({
        wordCount: wordCountRef.current,
        readTime,
        wpm: finalWpm,
      });

      const newStats = recordReading(
        stats,
        currentArticle?.id || null,
        wordCountRef.current,
        finalWpm,
        readTime,
        currentArticle?.difficulty
      );
      setStats(newStats);

      // Stop recording if active
      if (isRecording) {
        await stopRecording();
      }

      // Show completion screen
      setShowCompletion(true);
    }
    startTimeRef.current = 0;
  }, [stats, currentArticle, wpm, effectiveWpm, progressiveMode.enabled, isRecording, stopRecording]);

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
    setShowCompletion(false);
    clearRecording();
    setView('reading');
  };

  // Handle custom text
  const handleCustomText = (text: string) => {
    setCurrentArticle(null);
    loadText(text);
    wordCountRef.current = text.split(/\s+/).filter(w => w.length > 0).length;
    startTimeRef.current = 0;
    setShowCompletion(false);
    clearRecording();
    setView('reading');
  };

  // Handle back to home
  const handleBackToHome = useCallback(async () => {
    if (status === 'playing' || status === 'paused') {
      // Don't show completion screen when manually going back
      startTimeRef.current = 0;
    }
    if (isRecording) {
      await stopRecording();
    }
    reset();
    setCurrentArticle(null);
    setShowCompletion(false);
    clearRecording();
    setView('home');
  }, [status, reset, isRecording, stopRecording, clearRecording]);

  // Handle replay from completion screen
  const handleReplay = useCallback(() => {
    setShowCompletion(false);
    clearRecording();
    reset();
    startTimeRef.current = 0;
  }, [reset, clearRecording]);

  // Handle continue from completion screen
  const handleContinue = useCallback(() => {
    setShowCompletion(false);
    clearRecording();
    reset();
    setCurrentArticle(null);
    setView('home');
  }, [reset, clearRecording]);

  // Handle start recording - now just starts, no permission needed
  const handleStartRecording = () => {
    startRecording({
      articleTitle: currentArticle?.title,
      currentIndex,
      totalTokens,
    });
  };

  // Toggle video orientation
  const handleToggleOrientation = () => {
    setOrientation(orientation === 'landscape' ? 'portrait' : 'landscape');
  };

  // Handle stop recording
  const handleStopRecording = async () => {
    await stopRecording();
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框中的按键
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }

      // Don't handle shortcuts when completion screen is shown
      if (showCompletion) return;

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
  }, [view, showCompletion, togglePlay, seekRelative, adjustWpm, reset, handleBackToHome]);

  return (
    <div className="app">
      {/* Recording indicator */}
      {isRecording && (
        <div className="recording-indicator">
          <div className="recording-dot" />
          <span className="recording-text">Recording</span>
        </div>
      )}

      {/* Completion Screen */}
      {showCompletion && completionData && (
        <CompletionScreen
          article={currentArticle}
          wordCount={completionData.wordCount}
          readTime={completionData.readTime}
          wpm={completionData.wpm}
          stats={stats}
          recordedBlob={recordedBlob}
          recordedMimeType={recordedMimeType}
          onContinue={handleContinue}
          onReplay={handleReplay}
        />
      )}

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

            <div className="reading-actions">
              {!isRecording && status !== 'finished' && (
                <div className="record-controls">
                  <button
                    className="orientation-btn"
                    onClick={handleToggleOrientation}
                    title={orientation === 'landscape' ? 'Switch to Portrait (9:16)' : 'Switch to Landscape (16:9)'}
                  >
                    {orientation === 'landscape' ? '📺' : '📱'}
                    {orientation === 'landscape' ? '16:9' : '9:16'}
                  </button>
                  <button className="record-btn" onClick={handleStartRecording}>
                    <span className="btn-icon">🎬</span>
                    Record
                  </button>
                </div>
              )}
              {isRecording && (
                <button className="record-btn recording" onClick={handleStopRecording}>
                  <span className="btn-icon">⏹</span>
                  Stop Recording
                </button>
              )}
              <button className="new-text-btn" onClick={handleBackToHome}>
                Back to Articles
              </button>
            </div>
          </>
        )}
      </main>

      {view === 'reading' && !showCompletion && (
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
