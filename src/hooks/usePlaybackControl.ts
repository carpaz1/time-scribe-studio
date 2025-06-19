
import { useEffect, useRef, useCallback } from 'react';

interface UsePlaybackControlProps {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playheadPosition: number;
  setPlayheadPosition: (position: number) => void;
  totalDuration: number;
}

export const usePlaybackControl = ({
  isPlaying,
  setIsPlaying,
  playheadPosition,
  setPlayheadPosition,
  totalDuration,
}: UsePlaybackControlProps) => {
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance playhead when playing
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setPlayheadPosition(prev => {
          const next = prev + 0.1;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 100);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, totalDuration, setIsPlaying, setPlayheadPosition]);

  const togglePlayback = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayback();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setPlayheadPosition(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setPlayheadPosition(prev => Math.min(totalDuration, prev + 1));
          break;
        case 'Home':
          e.preventDefault();
          setPlayheadPosition(0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayback, totalDuration, setPlayheadPosition]);

  return {
    togglePlayback,
  };
};
