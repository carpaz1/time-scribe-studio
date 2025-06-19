
import React, { useState } from 'react';
import { VideoClip } from '@/types/timeline';
import ClipThumbnail from './ClipThumbnail';

interface TimelineTrackProps {
  clips: VideoClip[];
  totalDuration: number;
  zoom: number;
  onClipRemove: (clipId: string) => void;
  onClipReorder: (clipId: string, newPosition: number) => void;
  draggedClip: VideoClip | null;
  setDraggedClip: (clip: VideoClip | null) => void;
  scrollOffset: number;
}

const TimelineTrack: React.FC<TimelineTrackProps> = ({
  clips,
  totalDuration,
  zoom,
  onClipRemove,
  onClipReorder,
  draggedClip,
  setDraggedClip,
  scrollOffset,
}) => {
  const [dragOffset, setDragOffset] = useState(0);

  const getClipWidth = (duration: number) => {
    return Math.max((duration / totalDuration) * 100 * zoom, 2); // Minimum 2% width
  };

  const getClipLeft = (position: number) => {
    return ((position / totalDuration) * 100 * zoom) - scrollOffset;
  };

  const handleDragStart = (e: React.DragEvent, clip: VideoClip) => {
    setDraggedClip(clip);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset(e.clientX - rect.left);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedClip) return;

    const track = e.currentTarget;
    const rect = track.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset + scrollOffset;
    const newPosition = Math.max(0, (x / rect.width) * (totalDuration / zoom));
    
    onClipReorder(draggedClip.id, newPosition);
    setDraggedClip(null);
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      data-timeline-track
    >
      {/* Grid lines for better visual reference */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: Math.ceil(totalDuration) }, (_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px bg-slate-600"
            style={{
              left: `${((i / totalDuration) * 100 * zoom) - scrollOffset}%`,
            }}
          />
        ))}
      </div>

      {/* Drop zone indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {clips.length === 0 && (
          <div className="text-slate-500 text-lg font-medium opacity-60">
            Drop clips here or use "Add All Random"
          </div>
        )}
      </div>

      {/* Clips */}
      {clips.map((clip) => (
        <ClipThumbnail
          key={clip.id}
          clip={clip}
          width={getClipWidth(clip.duration)}
          left={getClipLeft(clip.position)}
          onDragStart={handleDragStart}
          onRemove={() => onClipRemove(clip.id)}
          isDragging={draggedClip?.id === clip.id}
          zoom={zoom}
        />
      ))}
    </div>
  );
};

export default TimelineTrack;
