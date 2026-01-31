import { useState, useEffect, useRef } from 'react';
import type { Article } from '../../data/articles';
import { DIFFICULTY_LABELS } from '../../data/articles';
import { getRank, formatTime } from '../../data/stats';
import type { UserStats } from '../../data/stats';
import { convertWebMToMP4, loadFFmpeg } from '../../utils/videoConverter';
import './styles.css';

interface CompletionScreenProps {
  article: Article | null;
  wordCount: number;
  readTime: number; // seconds
  wpm: number;
  stats: UserStats;
  recordedBlob: Blob | null;
  onContinue: () => void;
  onReplay: () => void;
}

const ENCOURAGEMENTS = [
  "Amazing work! Your reading speed is improving!",
  "Fantastic! You're becoming a speed reading master!",
  "Great job! Keep pushing your limits!",
  "Excellent! Your brain is getting faster!",
  "Wonderful! You're on fire today!",
  "Impressive! That was a great reading session!",
];

const ACHIEVEMENTS = [
  { threshold: 300, icon: '🚀', title: 'Speed Demon', desc: 'Read at 300+ WPM' },
  { threshold: 400, icon: '⚡', title: 'Lightning Reader', desc: 'Read at 400+ WPM' },
  { threshold: 500, icon: '🔥', title: 'Blazing Fast', desc: 'Read at 500+ WPM' },
  { threshold: 600, icon: '💫', title: 'Legendary Speed', desc: 'Read at 600+ WPM' },
];

function Confetti() {
  const colors = ['#22c55e', '#646cff', '#a78bfa', '#f59e0b', '#ef4444', '#06b6d4'];
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 10 + 5,
  }));

  return (
    <div className="confetti-container">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            backgroundColor: piece.color,
            width: piece.size,
            height: piece.size,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
          }}
        />
      ))}
    </div>
  );
}

export function CompletionScreen({
  article,
  wordCount,
  readTime,
  wpm,
  stats,
  recordedBlob,
  onContinue,
  onReplay,
}: CompletionScreenProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [mp4Blob, setMp4Blob] = useState<Blob | null>(null);
  const [mp4Url, setMp4Url] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertProgress, setConvertProgress] = useState(0);
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'loading' | 'converting' | 'done' | 'error'>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);

  const encouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
  const { rank } = getRank(stats);

  // Find achievement based on WPM
  const achievement = ACHIEVEMENTS.filter(a => wpm >= a.threshold).pop();

  useEffect(() => {
    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Create video URL from blob (WebM for preview)
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [recordedBlob]);

  // Clean up MP4 URL
  useEffect(() => {
    return () => {
      if (mp4Url) {
        URL.revokeObjectURL(mp4Url);
      }
    };
  }, [mp4Url]);

  // Convert to MP4 when there's a recorded blob
  const handleConvertToMP4 = async () => {
    if (!recordedBlob || isConverting) return;

    setIsConverting(true);
    setConversionStatus('loading');
    setConvertProgress(0);

    try {
      // Load FFmpeg first
      await loadFFmpeg((progress) => {
        setConvertProgress(progress * 0.3); // 0-30% for loading
      });

      setConversionStatus('converting');

      // Convert video
      const mp4 = await convertWebMToMP4(recordedBlob, (progress) => {
        setConvertProgress(0.3 + progress * 0.7); // 30-100% for converting
      });

      setMp4Blob(mp4);
      const url = URL.createObjectURL(mp4);
      setMp4Url(url);
      setConversionStatus('done');
    } catch (err) {
      console.error('Conversion failed:', err);
      setConversionStatus('error');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadVideo = () => {
    // Prefer MP4 if available, otherwise WebM
    const blob = mp4Blob || recordedBlob;
    const url = mp4Url || videoUrl;
    const ext = mp4Blob ? 'mp4' : 'webm';

    if (!url || !blob) return;

    const a = document.createElement('a');
    a.href = url;
    a.download = `ultrareader-${article?.title || 'reading'}-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareVideo = async () => {
    // Prefer MP4 for sharing (better compatibility)
    const blob = mp4Blob || recordedBlob;
    const mimeType = mp4Blob ? 'video/mp4' : 'video/webm';
    const ext = mp4Blob ? 'mp4' : 'webm';

    if (!blob) return;

    // Check if Web Share API is available
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], `ultrareader-reading.${ext}`, { type: mimeType });

      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'My Speed Reading Session - UltraReader',
            text: `I just read "${article?.title || 'an article'}" at ${wpm} WPM! 🚀`,
            files: [file],
          });
          return;
        } catch (err) {
          console.log('Share cancelled or failed:', err);
        }
      }
    }

    // Fallback to download
    handleDownloadVideo();
  };

  const getConversionButtonText = () => {
    switch (conversionStatus) {
      case 'loading':
        return `Loading converter... ${Math.round(convertProgress * 100)}%`;
      case 'converting':
        return `Converting... ${Math.round(convertProgress * 100)}%`;
      case 'done':
        return 'MP4 Ready!';
      case 'error':
        return 'Conversion failed';
      default:
        return 'Convert to MP4';
    }
  };

  return (
    <>
      {showConfetti && <Confetti />}

      <div className="completion-screen">
        <div className="completion-content">
          <div className="completion-emoji">🎉</div>

          <h1 className="completion-title">
            {article ? 'Article Complete!' : 'Reading Complete!'}
          </h1>

          <p className="completion-message">{encouragement}</p>

          <div className="completion-stats">
            <div className="completion-stat">
              <span className="completion-stat-value highlight">{wpm}</span>
              <span className="completion-stat-label">WPM</span>
            </div>
            <div className="completion-stat">
              <span className="completion-stat-value">{wordCount}</span>
              <span className="completion-stat-label">Words</span>
            </div>
            <div className="completion-stat">
              <span className="completion-stat-value">{formatTime(readTime)}</span>
              <span className="completion-stat-label">Time</span>
            </div>
          </div>

          {achievement && (
            <div className="completion-achievement">
              <span className="achievement-icon">{achievement.icon}</span>
              <div className="achievement-text">
                <span className="achievement-title">{achievement.title}</span>
                <span className="achievement-desc">{achievement.desc}</span>
              </div>
            </div>
          )}

          {article && (
            <p className="completion-message" style={{ fontSize: '14px' }}>
              {DIFFICULTY_LABELS[article.difficulty]} • {article.title}
            </p>
          )}

          {/* Video Preview */}
          {recordedBlob && videoUrl && (
            <video
              ref={videoRef}
              className="video-preview"
              src={mp4Url || videoUrl}
              controls
              playsInline
            />
          )}

          {/* Conversion Progress */}
          {isConverting && (
            <div className="conversion-progress">
              <div className="conversion-progress-bar">
                <div
                  className="conversion-progress-fill"
                  style={{ width: `${convertProgress * 100}%` }}
                />
              </div>
              <span className="conversion-progress-text">
                {conversionStatus === 'loading' ? 'Loading FFmpeg...' : 'Converting to MP4...'}
              </span>
            </div>
          )}

          <div className="completion-actions">
            {/* Convert to MP4 button */}
            {recordedBlob && conversionStatus !== 'done' && (
              <button
                className={`completion-btn convert ${conversionStatus === 'error' ? 'error' : ''}`}
                onClick={handleConvertToMP4}
                disabled={isConverting}
              >
                <span className="btn-icon">
                  {isConverting ? '⏳' : conversionStatus === 'error' ? '❌' : '🎬'}
                </span>
                {getConversionButtonText()}
              </button>
            )}

            {recordedBlob && (
              <button className="completion-btn share" onClick={handleShareVideo}>
                <span className="btn-icon">📤</span>
                Share Video {mp4Blob ? '(MP4)' : '(WebM)'}
              </button>
            )}

            {recordedBlob && (
              <button className="completion-btn secondary" onClick={handleDownloadVideo}>
                <span className="btn-icon">💾</span>
                Download {mp4Blob ? 'MP4' : 'WebM'}
              </button>
            )}

            <button className="completion-btn primary" onClick={onContinue}>
              <span className="btn-icon">📚</span>
              Continue Reading
            </button>

            <button className="completion-btn secondary" onClick={onReplay}>
              <span className="btn-icon">🔄</span>
              Read Again
            </button>
          </div>

          <p className="completion-message" style={{ fontSize: '12px', marginTop: '8px' }}>
            Current Rank: <strong style={{ color: '#f59e0b' }}>{rank}</strong>
          </p>
        </div>
      </div>
    </>
  );
}
