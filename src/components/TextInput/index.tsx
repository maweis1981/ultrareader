import { useState } from 'react';
import './styles.css';

interface TextInputProps {
  onSubmit: (text: string) => void;
  onBack?: () => void;
  disabled?: boolean;
}

const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog. This is a sample text for testing the RSVP reader.

Reading at high speeds can be challenging, but with practice, you'll find it becomes easier. The key is to focus on the highlighted letter and let your brain process the words naturally.

Don't worry if you miss a word or two at first. That's completely normal! Just keep practicing, and you'll improve over time.`;

export function TextInput({ onSubmit, onBack, disabled }: TextInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const trimmedText = text.trim();
    if (trimmedText) {
      onSubmit(trimmedText);
    }
  };

  const handleLoadSample = () => {
    setText(SAMPLE_TEXT);
  };

  const handleClear = () => {
    setText('');
  };

  return (
    <div className="text-input">
      {onBack && (
        <button className="back-btn" onClick={onBack}>
          ← Back to Articles
        </button>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste or type your text here..."
        disabled={disabled}
      />
      <div className="text-input-actions">
        <button
          className="primary"
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
        >
          Load Text
        </button>
        <button
          className="secondary"
          onClick={handleLoadSample}
          disabled={disabled}
        >
          Sample
        </button>
        <button
          className="secondary"
          onClick={handleClear}
          disabled={disabled || !text}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
