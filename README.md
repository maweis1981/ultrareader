# UltraReader

A RSVP (Rapid Serial Visual Presentation) speed reading tool with ORP (Optimal Recognition Point) technology.

## Features

- **RSVP Display**: Words displayed one at a time with fixed ORP position
- **ORP Highlighting**: Red pivot letter for optimal eye focus
- **Adjustable Speed**: 100-1000 WPM with real-time adjustment
- **Progressive Speed Mode**: Gradually increase WPM during reading
- **Punctuation-aware Timing**: Natural pauses at punctuation marks
- **Article Library**: Curated articles at Beginner/Intermediate/Advanced levels
- **Progress Tracking**: Stats, streaks, and ranking system
- **Keyboard Shortcuts**: Full keyboard control for seamless reading

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` / `→` | Seek ±1 token |
| `Shift + ←/→` | Seek ±5 tokens |
| `↑` / `↓` | WPM ±50 |
| `R` | Reset |
| `Esc` | Back to home |

## Tech Stack

- React 19 + TypeScript
- Vite 7
- CSS (no external UI libraries)

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## License

MIT
