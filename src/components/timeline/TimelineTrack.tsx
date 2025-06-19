
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
}

const TimelineTrack: React.FC<TimelineTrackProps> = ({
  clips,
  totalDuration,
  zoom,
  onClipRemove,
  onClipReorder,
  draggedClip,
  setDraggedClip,
}) => {
  const [dragOffset, setDragOffset] = useState(0);

  const getClipWidth = (duration: number) => {
    return (duration / totalDuration) * 100 * zoom;
  };

  const getClipLeft = (position: number) => {
    return (position / totalDuration) * 100 * zoom;
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
    const x = e.clientX - rect.left - dragOffset;
    const newPosition = Math.max(0, (x / rect.width) * (totalDuration / zoom));
    
    onClipReorder(draggedClip.id, newPosition);
    setDraggedClip(null);
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-gray-800"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ height: '100px' }}
      data-timeline-track
    >
      {clips.map((clip) => (
        <ClipThumbnail
          key={clip.id}
          clip={clip}
          width={getClipWidth(clip.duration)}
          left={getClipLeft(clip.position)}
          onDragStart={handleDragStart}
          onRemove={() => onClipRemove(clip.id)}
          isDragging={draggedClip?.id === clip.id}
        />
      ))}
    </div>
  );
};

export default TimelineTrack;
