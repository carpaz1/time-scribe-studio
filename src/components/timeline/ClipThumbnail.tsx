
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { VideoClip } from '@/types/timeline';
import { Button } from '@/components/ui/button';

interface ClipThumbnailProps {
  clip: VideoClip;
  width: number;
  left: number;
  onDragStart: (e: React.DragEvent, clip: VideoClip) => void;
  onRemove: () => void;
  isDragging: boolean;
}

const ClipThumbnail: React.FC<ClipThumbnailProps> = ({
  clip,
  width,
  left,
  onDragStart,
  onRemove,
  isDragging,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${left}%`,
    width: `${Math.max(width, 2)}%`,
    height: '80px',
    top: '10px',
  };

  return (
    <div
      style={style}
      className={`bg-gradient-to-r from-blue-500 to-blue-600 border border-blue-400 rounded cursor-move transition-all duration-200 group ${
        isDragging ? 'opacity-50 scale-105' : ''
      } ${isHovered ? 'shadow-lg shadow-blue-500/30' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, clip)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-full p-2 flex flex-col justify-center">
        {/* Clip Info */}
        <div className="text-center">
          <div className="text-xs text-white font-medium truncate mb-1">
            {clip.name}
          </div>
          <div className="text-xs text-blue-100 opacity-75">
            {clip.duration.toFixed(1)}s
          </div>
          <div className="text-xs text-blue-100 opacity-60">
            @{clip.startTime.toFixed(1)}s
          </div>
        </div>

        {/* Remove Button */}
        <Button
          size="sm"
          variant="destructive"
          className={`absolute -top-1 -right-1 w-5 h-5 p-0 transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="w-3 h-3" />
        </Button>

        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-white bg-opacity-10 rounded pointer-events-none" />
        )}
      </div>
    </div>
  );
};

export default ClipThumbnail;
