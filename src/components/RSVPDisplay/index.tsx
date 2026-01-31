import type { Token } from '../../types';
import { splitByORP } from '../../core/orp';
import './styles.css';

interface RSVPDisplayProps {
  token: Token | null;
}

export function RSVPDisplay({ token }: RSVPDisplayProps) {
  if (!token) {
    return (
      <div className="rsvp-display">
        <div className="rsvp-word-container">
          <span className="rsvp-empty">Ready to read</span>
        </div>
        <div className="rsvp-guide">
          <div className="rsvp-guide-line" />
        </div>
      </div>
    );
  }

  // 标点符号直接显示
  if (token.type === 'punct') {
    return (
      <div className="rsvp-display">
        <div className="rsvp-word-container">
          <span className="rsvp-left" />
          <span className="rsvp-pivot rsvp-punct">{token.value === '\n\n' ? '¶' : token.value}</span>
          <span className="rsvp-right" />
        </div>
        <div className="rsvp-guide">
          <div className="rsvp-guide-line" />
        </div>
      </div>
    );
  }

  // 单词：按 ORP 拆分显示
  const { left, pivot, right } = splitByORP(token.value);

  return (
    <div className="rsvp-display">
      <div className="rsvp-word-container">
        <span className="rsvp-left">{left}</span>
        <span className="rsvp-pivot">{pivot}</span>
        <span className="rsvp-right">{right}</span>
      </div>
      <div className="rsvp-guide">
        <div className="rsvp-guide-line" />
      </div>
    </div>
  );
}
