
import React, { useState, useEffect, useRef } from 'react';
import { VideoClip } from '@/types/timeline';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface LibraryClipThumbnailProps {
  clip: VideoClip;
  onAdd: () => void;
}

const LibraryClipThumbnail: React.FC<LibraryClipThumbnailProps> = ({
  clip,
  onAdd,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      className={`bg-gray-700 border border-gray-500 rounded cursor-pointer transition-all duration-200 group overflow-hidden aspect-video ${
        isHovered ? 'shadow-lg shadow-blue-500/30 border-blue-400' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onAdd}
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

        {/* Overlay with clip info and add button */}
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-xs text-white font-medium truncate mb-1 px-2 text-center">
            {clip.name}
          </div>
          <div className="text-xs text-blue-100 mb-2">
            {clip.duration.toFixed(1)}s
          </div>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LibraryClipThumbnail;
