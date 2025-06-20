
import React, { useRef } from 'react';
import { VideoClip } from '@/types/timeline';
import TimelineTrack from './TimelineTrack';
import Playhead from './Playhead';
import TimelineRuler from './TimelineRuler';
import TimelineInfoBar from './TimelineInfoBar';
import PlaybackControls from './PlaybackControls';

interface TimelineMainProps {
  timelineState: any;
  onClipRemove: (clipId: string) => void;
  onTogglePlayback: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const TimelineMain: React.FC<TimelineMainProps> = ({
  timelineState,
  onClipRemove,
  onTogglePlayback,
  onZoomIn,
  onZoomOut,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const {
    timelineClips,
    isPlaying,
    playheadPosition,
    zoom,
    totalDuration,
    draggedClip,
    timelineScrollOffset,
    setPlayheadPosition,
    setZoom,
    setDraggedClip,
    setTimelineScrollOffset,
    handleClipReorder,
    handleReset,
    handleClearTimeline,
  } = timelineState;

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newPosition = (x / rect.width) * (totalDuration / zoom);
    setPlayheadPosition(Math.max(0, Math.min(totalDuration, newPosition)));
  };

  const handleTimelineScroll = (e: React.WheelEvent) => {
    if (e.shiftKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        onZoomIn();
      } else {
        onZoomOut();
      }
    } else {
      const scrollAmount = e.deltaY * 0.5;
      setTimelineScrollOffset(prev => Math.max(0, prev + scrollAmount));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PlaybackControls
        isPlaying={isPlaying}
        zoom={zoom}
        timelineClipsLength={timelineClips.length}
        totalDuration={totalDuration}
        playheadPosition={playheadPosition}
        onTogglePlayback={onTogglePlayback}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onReset={handleReset}
        onClearTimeline={handleClearTimeline}
      />

      <TimelineInfoBar
        timelineClipsLength={timelineClips.length}
        totalDuration={totalDuration}
        zoom={zoom}
        playheadPosition={playheadPosition}
      />

      <div className="flex-1 overflow-hidden bg-gradient-to-r from-indigo-900/40 via-slate-800/60 to-purple-900/40 backdrop-blur-sm border border-indigo-600/20 rounded-t-2xl shadow-2xl">
        <div className="h-full flex flex-col" onWheel={handleTimelineScroll}>
          <TimelineRuler
            totalDuration={totalDuration}
            zoom={zoom}
            playheadPosition={playheadPosition}
          />
          
          <div
            ref={timelineRef}
            className="flex-1 relative bg-gradient-to-r from-slate-800/80 via-indigo-800/40 to-slate-800/80 backdrop-blur-sm border-t border-indigo-600/30 cursor-pointer shadow-inner"
            onClick={handleTimelineClick}
          >
            <TimelineTrack
              clips={timelineClips}
              totalDuration={totalDuration}
              zoom={zoom}
              onClipRemove={onClipRemove}
              onClipReorder={handleClipReorder}
              draggedClip={draggedClip}
              setDraggedClip={setDraggedClip}
              scrollOffset={timelineScrollOffset}
            />
            
            <Playhead
              position={playheadPosition}
              totalDuration={totalDuration}
              zoom={zoom}
              onPositionChange={setPlayheadPosition}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineMain;
