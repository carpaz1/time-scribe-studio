
import { useCallback } from 'react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  zoom: number;
  onTogglePlayback: () => void;
  onZoomChange: (zoom: number) => void;
  onReset: () => void;
}

export const usePlaybackControls = ({
  isPlaying,
  zoom,
  onTogglePlayback,
  onZoomChange,
  onReset
}: PlaybackControlsProps) => {
  const togglePlayback = useCallback(() => {
    onTogglePlayback();
  }, [onTogglePlayback]);

  const handleZoomIn = useCallback(() => {
    onZoomChange(Math.min(zoom * 1.25, 5));
  }, [zoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    onZoomChange(Math.max(zoom / 1.25, 0.25));
  }, [zoom, onZoomChange]);

  const handleReset = useCallback(() => {
    onReset();
  }, [onReset]);

  return {
    togglePlayback,
    handleZoomIn,
    handleZoomOut,
    handleReset,
  };
};
