
import React from 'react';
import { Play, Pause, ZoomIn, ZoomOut, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
  return (
    <div className="h-16 bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-sm border-y border-slate-700/50 px-6 flex items-center justify-between shrink-0">
      {/* Playback Controls */}
      <div className="flex items-center space-x-3">
        <Button
          onClick={onTogglePlayback}
          disabled={timelineClipsLength === 0}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          size="sm"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
      </div>

      {/* Timeline Info */}
      <div className="flex items-center space-x-6 text-sm text-slate-300">
        <span>Clips: {timelineClipsLength}</span>
        <span>Duration: {totalDuration.toFixed(1)}s</span>
        <span>Position: {playheadPosition.toFixed(1)}s</span>
        <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
      </div>

      {/* Zoom & Actions */}
      <div className="flex items-center space-x-2">
        <Button onClick={onZoomOut} variant="outline" size="sm" className="border-slate-600 text-slate-300">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button onClick={onZoomIn} variant="outline" size="sm" className="border-slate-600 text-slate-300">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button onClick={onClearTimeline} variant="outline" size="sm" className="border-slate-600 text-slate-300">
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button onClick={onReset} variant="outline" size="sm" className="border-slate-600 text-slate-300">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default PlaybackControls;
