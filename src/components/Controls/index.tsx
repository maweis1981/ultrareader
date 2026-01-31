import { useState } from 'react';
import type { PlayerStatus } from '../../types';
import type { ProgressiveMode } from '../../hooks/useRSVPPlayer';
import './styles.css';

interface ControlsProps {
  status: PlayerStatus;
  wpm: number;
  effectiveWpm: number;
  progress: number;
  currentIndex: number;
  totalTokens: number;
  progressiveMode: ProgressiveMode;
  onTogglePlay: () => void;
  onReset: () => void;
  onSeek: (index: number) => void;
  onSeekRelative: (delta: number) => void;
  onSetWpm: (wpm: number) => void;
  onSetProgressiveMode: (mode: ProgressiveMode) => void;
}

export function Controls({
  status,
  wpm,
  effectiveWpm,
  progress,
  currentIndex,
  totalTokens,
  progressiveMode,
  onTogglePlay,
  onReset,
  onSeek,
  onSeekRelative,
  onSetWpm,
  onSetProgressiveMode,
}: ControlsProps) {
  const [showProgressiveSettings, setShowProgressiveSettings] = useState(false);
  const isPlaying = status === 'playing';
  const canPlay = status !== 'idle' && totalTokens > 0;
  const canSeek = totalTokens > 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newIndex = Math.floor(percentage * totalTokens);
    onSeek(newIndex);
  };

  const handleToggleProgressive = () => {
    onSetProgressiveMode({
      ...progressiveMode,
      enabled: !progressiveMode.enabled,
    });
  };

  return (
    <div className="controls">
      <div className="controls-buttons">
        <button
          className={isPlaying ? 'pause' : 'play'}
          onClick={onTogglePlay}
          disabled={!canPlay}
        >
          {isPlaying ? 'Pause' : status === 'finished' ? 'Replay' : 'Play'}
        </button>
        <button
          className="reset"
          onClick={onReset}
          disabled={status === 'idle'}
        >
          Reset
        </button>
      </div>

      <div className="controls-wpm">
        <label>WPM</label>
        <input
          type="range"
          min={100}
          max={1000}
          step={50}
          value={progressiveMode.enabled ? effectiveWpm : wpm}
          onChange={(e) => onSetWpm(Number(e.target.value))}
          disabled={progressiveMode.enabled}
        />
        <span className="wpm-value">
          {progressiveMode.enabled ? effectiveWpm : wpm}
        </span>
      </div>

      {/* Progressive Mode Toggle */}
      <div className="progressive-toggle">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={progressiveMode.enabled}
            onChange={handleToggleProgressive}
          />
          <span className="toggle-text">Progressive Speed</span>
          {progressiveMode.enabled && (
            <span className="progressive-indicator">
              {progressiveMode.startWpm} → {progressiveMode.targetWpm} WPM
            </span>
          )}
        </label>
        {progressiveMode.enabled && (
          <button
            className="settings-btn"
            onClick={() => setShowProgressiveSettings(!showProgressiveSettings)}
          >
            {showProgressiveSettings ? '▲' : '▼'}
          </button>
        )}
      </div>

      {/* Progressive Mode Settings */}
      {showProgressiveSettings && progressiveMode.enabled && (
        <div className="progressive-settings">
          <div className="progressive-setting">
            <label>Start WPM</label>
            <input
              type="range"
              min={100}
              max={500}
              step={25}
              value={progressiveMode.startWpm}
              onChange={(e) => onSetProgressiveMode({
                ...progressiveMode,
                startWpm: Number(e.target.value),
              })}
            />
            <span>{progressiveMode.startWpm}</span>
          </div>
          <div className="progressive-setting">
            <label>Target WPM</label>
            <input
              type="range"
              min={200}
              max={1000}
              step={25}
              value={progressiveMode.targetWpm}
              onChange={(e) => onSetProgressiveMode({
                ...progressiveMode,
                targetWpm: Number(e.target.value),
              })}
            />
            <span>{progressiveMode.targetWpm}</span>
          </div>
          <div className="progressive-setting">
            <label>Ramp Up</label>
            <input
              type="range"
              min={20}
              max={80}
              step={10}
              value={progressiveMode.rampUpPercent}
              onChange={(e) => onSetProgressiveMode({
                ...progressiveMode,
                rampUpPercent: Number(e.target.value),
              })}
            />
            <span>{progressiveMode.rampUpPercent}%</span>
          </div>
        </div>
      )}

      <div className="controls-progress">
        <div className="controls-progress-bar" onClick={handleProgressClick}>
          <div
            className="controls-progress-fill"
            style={{ width: `${progress * 100}%` }}
          />
          {progressiveMode.enabled && (
            <div
              className="controls-progress-ramp"
              style={{ width: `${progressiveMode.rampUpPercent}%` }}
            />
          )}
        </div>
      </div>

      <div className="controls-seek">
        <button onClick={() => onSeekRelative(-5)} disabled={!canSeek || currentIndex < 5}>
          -5
        </button>
        <button onClick={() => onSeekRelative(-1)} disabled={!canSeek || currentIndex < 1}>
          -1
        </button>
        <button onClick={() => onSeekRelative(1)} disabled={!canSeek || currentIndex >= totalTokens - 1}>
          +1
        </button>
        <button onClick={() => onSeekRelative(5)} disabled={!canSeek || currentIndex >= totalTokens - 5}>
          +5
        </button>
      </div>
    </div>
  );
}
