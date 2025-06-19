
import React, { useState, useEffect, useRef } from 'react';
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
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${left}%`,
    width: `${Math.max(width, 2)}%`,
    height: '80px',
    top: '10px',
  };

  // Generate thumbnail from video
  useEffect(() => {
    const generateThumbnail = () => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(clip.sourceFile);
      video.muted = true;
      video.playsInline = true;
      
      video.addEventListener('loadeddata', () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Set canvas dimensions
        canvas.width = 120;
        canvas.height = 68;
        
        // Seek to middle of clip for thumbnail
        video.currentTime = clip.startTime + (clip.duration / 2);
        
        video.addEventListener('seeked', () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL();
          setThumbnailUrl(dataUrl);
          URL.revokeObjectURL(video.src);
        }, { once: true });
      });
    };

    generateThumbnail();
  }, [clip]);

  return (
    <div
      style={style}
      className={`bg-gray-700 border border-gray-500 rounded cursor-move transition-all duration-200 group overflow-hidden ${
        isDragging ? 'opacity-50 scale-105' : ''
      } ${isHovered ? 'shadow-lg shadow-blue-500/30 border-blue-400' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, clip)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div className="relative h-full">
        {/* Thumbnail */}
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={clip.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
            <div className="text-white text-xs">Loading...</div>
          </div>
        )}

        {/* Overlay with clip info */}
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-xs text-white font-medium truncate mb-1 px-2">
            {clip.name}
          </div>
          <div className="text-xs text-blue-100">
            {clip.duration.toFixed(1)}s
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
      </div>
    </div>
  );
};

export default ClipThumbnail;
