
import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { VideoClip } from '@/types/timeline';
import { Button } from '@/components/ui/button';
import SimpleThumbnail from './SimpleThumbnail';

interface ClipThumbnailProps {
  clip: VideoClip;
  width: number;
  left: number;
  onDragStart: (e: React.DragEvent, clip: VideoClip) => void;
  onRemove: () => void;
  isDragging: boolean;
  zoom: number;
}

const ClipThumbnail: React.FC<ClipThumbnailProps> = ({
  clip,
  width,
  left,
  onDragStart,
  onRemove,
  isDragging,
  zoom,
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
      className={`bg-gray-700 border border-gray-500 rounded cursor-move transition-all duration-200 group overflow-hidden ${
        isDragging ? 'opacity-50 scale-105 shadow-lg' : ''
      } ${isHovered ? 'shadow-lg shadow-purple-500/30 border-purple-400' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, clip)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-full">
        <SimpleThumbnail
          clip={clip}
          width={120}
          height={68}
          className="w-full h-full"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-xs text-white font-medium truncate mb-1 px-2 max-w-full flex items-center">
            <Sparkles className="w-3 h-3 mr-1" />
            {clip.name}
          </div>
          <div className="text-xs text-purple-100 bg-purple-600/50 px-2 py-1 rounded">
            {clip.duration.toFixed(1)}s
          </div>
        </div>

        {/* Remove Button */}
        <Button
          size="sm"
          variant="destructive"
          className={`absolute -top-1 -right-1 w-5 h-5 p-0 transition-all duration-200 ${
            isHovered ? 'opacity-100 scale-110' : 'opacity-0'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default ClipThumbnail;
