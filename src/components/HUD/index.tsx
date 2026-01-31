import type { PlayerStatus } from '../../types';
import './styles.css';

interface HUDProps {
  status: PlayerStatus;
  wpm: number;
  currentIndex: number;
  totalTokens: number;
  progress: number;
}

export function HUD({ status, wpm, currentIndex, totalTokens, progress }: HUDProps) {
  const progressPercent = Math.round(progress * 100);

  return (
    <div className="hud">
      <div className="hud-item">
        <span className="hud-label">Status</span>
        <span className={`hud-status ${status}`}>{status}</span>
      </div>

      <div className="hud-item">
        <span className="hud-label">WPM</span>
        <span className="hud-value highlight">{wpm}</span>
      </div>

      <div className="hud-item">
        <span className="hud-label">Progress</span>
        <span className="hud-value">
          {totalTokens > 0 ? `${currentIndex + 1} / ${totalTokens}` : '- / -'}
        </span>
      </div>

      <div className="hud-item">
        <span className="hud-label">Complete</span>
        <span className="hud-value">{progressPercent}%</span>
      </div>
    </div>
  );
}
