
import React, { useRef } from 'react';
import { VideoClip } from '@/types/timeline';
import TimelineTrack from './TimelineTrack';
import Playhead from './Playhead';
import TimelineRuler from './TimelineRuler';
import TimelineInfoBar from './TimelineInfoBar';

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
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newPosition = (x / rect.width) * totalDuration / (zoom / 100);
    onPlayheadMove(Math.max(0, Math.min(totalDuration, newPosition)));
  };

  return (
    <div className="flex flex-col h-full">
      <TimelineInfoBar
        timelineClipsLength={clips.length}
        totalDuration={totalDuration}
        zoom={zoom}
        playheadPosition={playheadPosition}
      />

      <div className="flex-1 overflow-hidden bg-gradient-to-r from-indigo-900/40 via-slate-800/60 to-purple-900/40 backdrop-blur-sm border border-indigo-600/20 rounded-t-2xl shadow-2xl">
        <div className="h-full flex flex-col">
          <TimelineRuler
            totalDuration={totalDuration}
            zoom={zoom}
            playheadPosition={playheadPosition}
          />
          
          <div
            ref={timelineRef}
            className="flex-1 relative bg-gradient-to-r from-slate-800/80 via-indigo-800/40 to-slate-800/80 backdrop-blur-sm border-t border-indigo-600/30 cursor-pointer shadow-inner overflow-x-auto"
            onClick={handleTimelineClick}
            data-timeline-track
            style={{ 
              minWidth: `${Math.max(100, zoom)}%`,
              width: `${Math.max(100, zoom)}%`
            }}
          >
            <TimelineTrack
              clips={clips}
              totalDuration={totalDuration}
              zoom={zoom}
              onClipRemove={onClipRemove}
              onClipReorder={() => {}}
              draggedClip={draggedClip}
              setDraggedClip={() => {}}
              scrollOffset={0}
            />
            
            <Playhead
              position={playheadPosition}
              totalDuration={totalDuration}
              zoom={zoom}
              onPositionChange={onPlayheadMove}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineMain;
