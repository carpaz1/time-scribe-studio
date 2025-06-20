
import React, { useState, useEffect, useRef } from 'react';
import { X, FileVideo } from 'lucide-react';
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
  const [thumbnailError, setThumbnailError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${left}%`,
    width: `${Math.max(width, 2)}%`,
    height: '80px',
    top: '10px',
  };

  // Enhanced thumbnail generation with better error handling
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    console.log('ClipThumbnail: Starting thumbnail generation for clip:', clip.name);
    setIsLoading(true);
    setThumbnailError(false);

    const generateThumbnail = async () => {
      try {
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.crossOrigin = 'anonymous';
        
        const objectUrl = URL.createObjectURL(clip.sourceFile);
        console.log('ClipThumbnail: Created object URL for:', clip.name);

        const cleanup = () => {
          try {
            URL.revokeObjectURL(objectUrl);
            video.remove();
          } catch (e) {
            console.warn('ClipThumbnail: Cleanup error:', e);
          }
        };

        // Set timeout for the entire process
        timeoutId = setTimeout(() => {
          console.warn('ClipThumbnail: Thumbnail generation timeout for:', clip.name);
          if (mounted) {
            setThumbnailError(true);
            setIsLoading(false);
          }
          cleanup();
        }, 10000);

        video.addEventListener('error', (e) => {
          console.error('ClipThumbnail: Video load error for:', clip.name, e);
          if (mounted) {
            setThumbnailError(true);
            setIsLoading(false);
          }
          cleanup();
        });

        video.addEventListener('loadedmetadata', () => {
          if (!mounted) {
            cleanup();
            return;
          }

          console.log('ClipThumbnail: Video metadata loaded for:', clip.name, 'duration:', video.duration);

          try {
            const canvas = canvasRef.current;
            if (!canvas) {
              console.error('ClipThumbnail: Canvas not available');
              setThumbnailError(true);
              setIsLoading(false);
              cleanup();
              return;
            }
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              console.error('ClipThumbnail: Canvas context not available');
              setThumbnailError(true);
              setIsLoading(false);
              cleanup();
              return;
            }
            
            canvas.width = 120;
            canvas.height = 68;
            
            // Seek to a safe position for thumbnail (middle of clip)
            const seekTime = Math.min(
              Math.max(clip.startTime + (clip.duration / 2), 0),
              video.duration - 0.1
            );
            
            console.log('ClipThumbnail: Seeking to time:', seekTime, 'for clip:', clip.name);
            video.currentTime = seekTime;
            
            const onSeeked = () => {
              if (!mounted) {
                cleanup();
                return;
              }

              try {
                console.log('ClipThumbnail: Drawing thumbnail for:', clip.name);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setThumbnailUrl(dataUrl);
                setIsLoading(false);
                console.log('ClipThumbnail: Thumbnail generated successfully for:', clip.name);
              } catch (drawError) {
                console.error('ClipThumbnail: Canvas draw error for:', clip.name, drawError);
                setThumbnailError(true);
                setIsLoading(false);
              }
              cleanup();
            };

            video.addEventListener('seeked', onSeeked, { once: true });
            
            // Fallback if seeked doesn't fire
            setTimeout(() => {
              if (mounted && isLoading && !thumbnailUrl) {
                console.log('ClipThumbnail: Seeked event timeout, trying to draw anyway for:', clip.name);
                onSeeked();
              }
            }, 3000);
            
          } catch (error) {
            console.error('ClipThumbnail: Thumbnail process error for:', clip.name, error);
            setThumbnailError(true);
            setIsLoading(false);
            cleanup();
          }
        });

        video.src = objectUrl;
        video.load();

      } catch (err) {
        console.error('ClipThumbnail: Setup error for:', clip.name, err);
        if (mounted) {
          setThumbnailError(true);
          setIsLoading(false);
        }
      }
    };

    generateThumbnail();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [clip.sourceFile, clip.name, clip.startTime, clip.duration]);

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
        {/* Thumbnail or Fallback */}
        {isLoading ? (
          <div className="w-full h-full bg-gradient-to-r from-slate-600 to-slate-700 flex items-center justify-center">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : thumbnailError || !thumbnailUrl ? (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
            <FileVideo className="w-6 h-6 text-white" />
          </div>
        ) : (
          <img 
            src={thumbnailUrl} 
            alt={clip.name}
            className="w-full h-full object-cover"
            onError={() => {
              console.warn('ClipThumbnail: Image display error for:', clip.name);
              setThumbnailError(true);
            }}
          />
        )}

        {/* Overlay with clip info */}
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-xs text-white font-medium truncate mb-1 px-2 max-w-full">
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
