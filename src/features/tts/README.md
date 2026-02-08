# Text-to-Speech (TTS) Feature

WCAG 2.1/2.2 compliant Text-to-Speech implementation using the Web Speech API.

## Features

### ✅ Core Features
- **Read Selection**: Read any selected text (Ctrl+Shift+S)
- **Read Page**: Read entire page content (Ctrl+Shift+P)
- **Play/Pause/Stop Controls**: Full playback control
- **Voice Selection**: Choose from available system voices
- **Speed Control**: 0.5x to 2x playback speed
- **Pitch Control**: Adjust voice pitch (0.5 to 2)
- **Volume Control**: 0% to 100%
- **Keyboard Shortcuts**: Full keyboard accessibility

### 🔑 Keyboard Shortcuts
- `Ctrl+Shift+S`: Read selected text
- `Ctrl+Shift+P`: Read entire page
- `Ctrl+Shift+Space`: Pause/Resume
- `Ctrl+Shift+X`: Stop

### ♿ WCAG Compliance
- **SC 1.3.1** (Level A): Info and Relationships
- **SC 1.4.2** (Level A): Audio Control
- **SC 2.1.1** (Level A): Keyboard accessible
- **SC 3.1.1** (Level A): Language of Page
- **SC 3.1.2** (Level AA): Language of Parts
- **SC 2.4.11** (Level AA): Focus Appearance
- **SC 2.5.8** (Level AA): Target Size Minimum

## Architecture

### Components
1. **TTSContext.tsx**: React Context Provider with Web Speech API logic
2. **useTTS.ts**: Hook to access TTS functionality
3. **TTSControls.tsx**: Floating control panel UI
4. **AccessibilityPanel.tsx**: Settings section (integrated)

### Data Flow
```
TTSProvider (Context)
    ↓
useTTS (Hook)
    ↓
TTSControls (UI) + AccessibilityPanel (Settings)
```

## Usage

### Basic Integration
Already integrated in AppLayout - wrap your app with `TTSProvider`:

```tsx
import { TTSProvider } from '@/features/tts';

<TTSProvider>
  <YourApp />
</TTSProvider>
```

### Using the Hook
```tsx
import { useTTS } from '@/features/tts';

const MyComponent = () => {
  const { speak, stop, isSpeaking } = useTTS();
  
  return (
    <button onClick={() => speak('Hello world')}>
      {isSpeaking ? 'Speaking...' : 'Speak'}
    </button>
  );
};
```

## Settings Storage

Settings are persisted to `localStorage` with key `tts-settings`:

```typescript
{
  enabled: boolean,
  voice: string | null,
  rate: number,      // 0.1 to 10
  pitch: number,     // 0 to 2
  volume: number,    // 0 to 1
  keyboardShortcuts: boolean
}
```

## Browser Support

Uses native Web Speech API:
- ✅ Chrome/Edge (excellent)
- ✅ Safari (good)
- ✅ Firefox (limited voices)

No external dependencies or API keys required!

## Implementation Details

### Smart Content Reading
The `readPage()` function:
- Targets `<main>` content area
- Skips navigation, buttons, inputs
- Filters hidden elements
- Natural reading order

### State Management
- Speaking state tracked with 100ms polling
- Utterance lifecycle handled properly
- Cleanup on unmount prevents memory leaks

### Accessibility
- All controls keyboard accessible
- ARIA labels on all interactive elements
- Focus visible (WCAG 2.4.11)
- Target size meets 24x24px minimum (WCAG 2.5.8)

## Future Enhancements (Not Implemented)
- Text highlighting during speech
- Auto-scroll to current paragraph
- Reading speed presets
- Pronunciation dictionary
- Multi-language support improvements
