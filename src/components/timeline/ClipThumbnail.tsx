
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

  // Simplified thumbnail generation
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setThumbnailError(false);

    const generateThumbnail = async () => {
      try {
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        
        const objectUrl = URL.createObjectURL(clip.sourceFile);
        video.src = objectUrl;

        const cleanup = () => {
          URL.revokeObjectURL(objectUrl);
          video.remove();
        };

        video.addEventListener('error', (e) => {
          console.warn('Video load error for thumbnail:', clip.name, e);
          if (mounted) {
            setThumbnailError(true);
            setIsLoading(false);
          }
          cleanup();
        });

        video.addEventListener('loadeddata', () => {
          if (!mounted) {
            cleanup();
            return;
          }

          try {
            const canvas = canvasRef.current;
            if (!canvas) {
              cleanup();
              return;
            }
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              cleanup();
              return;
            }
            
            canvas.width = 120;
            canvas.height = 68;
            
            // Seek to a safe position for thumbnail
            const seekTime = Math.min(clip.startTime + 0.5, video.duration - 0.1);
            video.currentTime = Math.max(0, seekTime);
            
            const onSeeked = () => {
              if (!mounted) {
                cleanup();
                return;
              }

              try {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                setThumbnailUrl(dataUrl);
                setIsLoading(false);
              } catch (drawError) {
                console.warn('Canvas draw error:', clip.name, drawError);
                setThumbnailError(true);
                setIsLoading(false);
              }
              cleanup();
            };

            video.addEventListener('seeked', onSeeked, { once: true });
          } catch (error) {
            console.warn('Thumbnail process error:', clip.name, error);
            setThumbnailError(true);
            setIsLoading(false);
            cleanup();
          }
        });

        // Timeout fallback
        setTimeout(() => {
          if (mounted && isLoading) {
            console.warn('Thumbnail timeout:', clip.name);
            setThumbnailError(true);
            setIsLoading(false);
            cleanup();
          }
        }, 5000);

        video.load();
      } catch (err) {
        console.warn('Thumbnail setup error:', clip.name, err);
        if (mounted) {
          setThumbnailError(true);
          setIsLoading(false);
        }
      }
    };

    generateThumbnail();

    return () => {
      mounted = false;
    };
  }, [clip.sourceFile, clip.name, clip.startTime]);

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
              console.warn('Thumbnail display error for:', clip.name);
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
