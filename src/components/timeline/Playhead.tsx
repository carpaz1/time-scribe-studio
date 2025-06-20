
import React, { useState } from 'react';

interface PlayheadProps {
  position: number;
  totalDuration: number;
  zoom: number;
  onPositionChange: (position: number) => void;
}

const Playhead: React.FC<PlayheadProps> = ({
  position,
  totalDuration,
  zoom,
  onPositionChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  // Calculate position as percentage based on zoom
  const leftPercentage = (position / totalDuration) * 100;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const handleMouseMove = (e: MouseEvent) => {
      const timelineElement = document.querySelector('[data-timeline-track]') as HTMLElement;
      if (!timelineElement) return;
      
      const rect = timelineElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const timelineWidth = rect.width;
      const percentage = Math.max(0, Math.min(100, (x / timelineWidth) * 100));
      const newPosition = (percentage / 100) * totalDuration;
      onPositionChange(newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`absolute top-0 bottom-0 w-0.5 bg-red-500 cursor-ew-resize z-10 transition-opacity duration-200 ${
        isDragging ? 'opacity-100' : 'opacity-80 hover:opacity-100'
      }`}
      style={{ left: `${leftPercentage}%` }}
      onMouseDown={handleMouseDown}
    >
      {/* Playhead Handle */}
      <div className="absolute -top-1 -left-2 w-4 h-3 bg-red-500 rounded-sm cursor-ew-resize">
        <div className="absolute inset-1 bg-red-600 rounded-sm" />
      </div>
      
      {/* Drop Shadow */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-black opacity-30 translate-x-0.5" />
    </div>
  );
};

export default Playhead;
