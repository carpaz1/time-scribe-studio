
import React, { useRef, useEffect, useCallback } from 'react';
import { VideoClip } from '@/types/timeline';
import ClipThumbnail from './ClipThumbnail';

interface TimelineMainProps {
  clips: VideoClip[];
  totalDuration: number;
  zoom: number;
  playheadPosition: number;
  isDragging: boolean;
  draggedClip: VideoClip | null;
  onClipDragStart: (clip: VideoClip) => void;
  onClipDragEnd: () => void;
  onClipRemove: (id: string) => void;
  onPlayheadMove: (position: number) => void;
  onZoomChange: (zoom: number) => void;
}

const TimelineMain: React.FC<TimelineMainProps> = ({
  clips,
  totalDuration,
  zoom,
  playheadPosition,
  isDragging,
  draggedClip,
  onClipDragStart,
  onClipDragEnd,
  onClipRemove,
  onPlayheadMove,
  onZoomChange,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);

  // Calculate timeline width based on zoom and duration
  const timelineWidth = Math.max(800, totalDuration * zoom * 10);
  const pixelsPerSecond = timelineWidth / totalDuration;

  useEffect(() => {
    if (playheadRef.current) {
      const playheadLeft = (playheadPosition / totalDuration) * 100;
      playheadRef.current.style.left = `${Math.min(Math.max(playheadLeft, 0), 100)}%`;
    }
  }, [playheadPosition, totalDuration]);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (timelineRef.current && !isDragging) {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const timelineProgress = clickX / rect.width;
      const newPosition = Math.max(0, Math.min(timelineProgress * totalDuration, totalDuration));
      onPlayheadMove(newPosition);
    }
  }, [totalDuration, onPlayheadMove, isDragging]);

  const handleClipDragStart = useCallback((e: React.DragEvent, clip: VideoClip) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', clip.id);
    onClipDragStart(clip);
  }, [onClipDragStart]);

  // Calculate total timeline duration from clips
  const actualDuration = clips.length > 0 
    ? Math.max(...clips.map(clip => clip.position + clip.duration), totalDuration)
    : totalDuration;

  const totalClipDuration = clips.reduce((sum, clip) => sum + clip.duration, 0);

  return (
    <div className="flex-1 overflow-auto bg-slate-800/50 backdrop-blur-sm">
      {/* Timeline Info */}
      <div className="p-3 border-b border-slate-700/50 bg-slate-900/30">
        <div className="flex items-center justify-between text-sm text-slate-300">
          <div className="flex items-center gap-4">
            <span>Clips: {clips.length}</span>
            <span>Total Duration: {totalClipDuration.toFixed(1)}s</span>
            <span>Timeline: {actualDuration.toFixed(1)}s</span>
            <span>Zoom: {zoom.toFixed(1)}x</span>
          </div>
          <div className="text-purple-400">
            Playhead: {playheadPosition.toFixed(1)}s
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div 
        ref={timelineRef}
        className="relative h-32 bg-slate-900/20 border-b border-slate-700/50 cursor-pointer select-none overflow-x-auto"
        onClick={handleTimelineClick}
        style={{ minWidth: `${timelineWidth}px` }}
      >
        {/* Time Markers */}
        <div className="absolute inset-0">
          {Array.from({ length: Math.ceil(actualDuration / 5) + 1 }, (_, i) => {
            const time = i * 5;
            const left = (time / actualDuration) * 100;
            return (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-slate-600/50"
                style={{ left: `${left}%` }}
              >
                <span className="absolute -top-5 left-1 text-xs text-slate-400 bg-slate-900/80 px-1 rounded">
                  {time}s
                </span>
              </div>
            );
          })}
        </div>

        {/* Clips */}
        {clips.map((clip) => {
          const left = (clip.position / actualDuration) * 100;
          const width = (clip.duration / actualDuration) * 100;
          
          return (
            <ClipThumbnail
              key={clip.id}
              clip={clip}
              width={width}
              left={left}
              onDragStart={handleClipDragStart}
              onRemove={() => onClipRemove(clip.id)}
              isDragging={isDragging && draggedClip?.id === clip.id}
              zoom={zoom}
            />
          );
        })}

        {/* Playhead */}
        <div
          ref={playheadRef}
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
          style={{ left: '0%' }}
        >
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
          <div className="absolute top-0 left-0.5 w-px h-full bg-red-400 opacity-80"></div>
        </div>
      </div>

      {/* Drop Zone */}
      {isDragging && (
        <div className="absolute inset-0 bg-purple-500/20 border-2 border-dashed border-purple-400 flex items-center justify-center z-30">
          <div className="text-purple-200 text-lg font-medium">
            Drop clip on timeline
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineMain;
