
import React from 'react';
import { Play, Pause, Square, ZoomIn, ZoomOut, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlaybackControlsProps {
  isPlaying: boolean;
  zoom: number;
  timelineClipsLength: number;
  totalDuration: number;
  playheadPosition: number;
  onTogglePlayback: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onClearTimeline: () => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  zoom,
  timelineClipsLength,
  totalDuration,
  playheadPosition,
  onTogglePlayback,
  onZoomIn,
  onZoomOut,
  onReset,
  onClearTimeline,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-800/60 border-y border-slate-700/50 p-4">
      <div className="flex items-center justify-between">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onTogglePlayback}
            className="bg-slate-700 hover:bg-slate-600 text-white"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (isPlaying) onTogglePlayback();
            }}
            className="hover:bg-slate-700 text-slate-300"
          >
            <Square className="w-4 h-4" />
          </Button>
        </div>

        {/* Time Display */}
        <div className="text-slate-300 text-sm">
          {formatTime(playheadPosition)} / {formatTime(totalDuration)}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            className="hover:bg-slate-700 text-slate-300"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-slate-400 text-sm min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            className="hover:bg-slate-700 text-slate-300"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Timeline Management */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearTimeline}
            disabled={timelineClipsLength === 0}
            className="hover:bg-slate-700 text-slate-300"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="hover:bg-slate-700 text-slate-300"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlaybackControls;
