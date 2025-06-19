
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
  const [showPreview, setShowPreview] = useState(false);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${left}%`,
    width: `${Math.max(width, 2)}%`,
    height: '80px',
    top: '10px',
  };

  return (
    <>
      <div
        style={style}
        className={`bg-gradient-to-r from-blue-500 to-blue-600 border border-blue-400 rounded cursor-move transition-all duration-200 group ${
          isDragging ? 'opacity-50 scale-105' : ''
        } ${isHovered ? 'shadow-lg shadow-blue-500/30' : ''}`}
        draggable
        onDragStart={(e) => onDragStart(e, clip)}
        onMouseEnter={() => {
          setIsHovered(true);
          setShowPreview(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowPreview(false);
        }}
      >
        <div className="relative h-full p-1 flex">
          {/* Thumbnail Image */}
          <div className="flex-shrink-0 w-16 h-full">
            {clip.thumbnail ? (
              <img
                src={clip.thumbnail}
                alt={clip.name}
                className="w-full h-full object-cover rounded-sm"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full bg-gray-600 rounded-sm flex items-center justify-center">
                <span className="text-xs text-gray-300">No thumb</span>
              </div>
            )}
          </div>
          
          {/* Clip Info */}
          <div className="flex-1 ml-2 flex flex-col justify-center min-w-0">
            <div className="text-xs text-white font-medium truncate">
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

      {/* Preview on Hover */}
      {showPreview && clip.thumbnail && (
        <div className="fixed z-50 pointer-events-none"
             style={{
               left: `${left + width/2}%`,
               top: '100px',
               transform: 'translateX(-50%)',
             }}>
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 shadow-xl">
            <img
              src={clip.thumbnail}
              alt={clip.name}
              className="w-32 h-18 object-cover rounded"
            />
            <div className="mt-1 text-xs text-white text-center">
              {clip.name}
            </div>
            <div className="text-xs text-gray-400 text-center">
              {clip.startTime.toFixed(1)}s - {(clip.startTime + clip.duration).toFixed(1)}s
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClipThumbnail;
