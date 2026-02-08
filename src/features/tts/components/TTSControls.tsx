import React from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { useTTS } from '../useTTS';
import { cn } from '@/lib/utils';

export const TTSControls: React.FC = () => {
  const { isSpeaking, isPaused, stop, pause, resume, settings } = useTTS();

  if (!settings.enabled) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "bg-card border border-border rounded-xl shadow-lg",
        "p-3 flex items-center gap-2",
        "transition-all duration-200"
      )}
      role="toolbar"
      aria-label="Text-to-Speech Playback Controls"
    >
      {/* Pause/Resume Button */}
      {isSpeaking && (
        <button
          className="h-9 w-9 rounded-lg hover:bg-secondary/80 transition-colors flex items-center justify-center"
          onClick={isPaused ? resume : pause}
          title={isPaused ? "Resume" : "Pause"}
          aria-label={isPaused ? "Resume speech" : "Pause speech"}
        >
          {isPaused ? (
            <Play className="h-4 w-4" />
          ) : (
            <Pause className="h-4 w-4" />
          )}
        </button>
      )}

      {/* Stop Button */}
      {isSpeaking && (
        <button
          className="h-9 w-9 rounded-lg hover:bg-secondary/80 transition-colors flex items-center justify-center"
          onClick={stop}
          title="Stop"
          aria-label="Stop speech"
        >
          <Square className="h-4 w-4" />
        </button>
      )}

      {/* Status Indicator */}
      {isSpeaking && (
        <div className="flex items-center gap-2 ml-2 px-2 py-1 bg-primary/10 rounded-md">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-3 bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-0.5 h-3 bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-0.5 h-3 bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs text-muted-foreground">
            {isPaused ? 'Paused' : 'Speaking'}
          </span>
        </div>
      )}
    </div>
  );
};
