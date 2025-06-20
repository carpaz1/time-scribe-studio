
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
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${left}%`,
    width: `${Math.max(width, 2)}%`,
    height: '80px',
    top: '10px',
  };

  // Enhanced thumbnail generation with better error handling and fallbacks
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    console.log('ClipThumbnail: Starting thumbnail generation for clip:', clip.name);
    setIsLoading(true);
    setThumbnailError(false);

    const generateThumbnail = async () => {
      try {
        const video = document.createElement('video');
        videoRef.current = video;
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.crossOrigin = 'anonymous';
        
        const objectUrl = URL.createObjectURL(clip.sourceFile);
        console.log('ClipThumbnail: Created object URL for:', clip.name);

        const cleanup = () => {
          try {
            URL.revokeObjectURL(objectUrl);
            if (videoRef.current) {
              videoRef.current.src = '';
              videoRef.current = null;
            }
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
            // Generate fallback thumbnail
            generateFallbackThumbnail();
          }
          cleanup();
        }, 8000);

        video.addEventListener('error', (e) => {
          console.error('ClipThumbnail: Video load error for:', clip.name, e);
          if (mounted) {
            generateFallbackThumbnail();
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
              generateFallbackThumbnail();
              cleanup();
              return;
            }
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              console.error('ClipThumbnail: Canvas context not available');
              generateFallbackThumbnail();
              cleanup();
              return;
            }
            
            canvas.width = 120;
            canvas.height = 68;
            
            // Seek to a safe position for thumbnail (middle of clip or 1 second)
            const seekTime = Math.min(
              Math.max(clip.startTime + (clip.duration / 2), 1),
              video.duration - 0.5
            );
            
            console.log('ClipThumbnail: Seeking to time:', seekTime, 'for clip:', clip.name);
            
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
                setThumbnailError(false);
                console.log('ClipThumbnail: Thumbnail generated successfully for:', clip.name);
              } catch (drawError) {
                console.error('ClipThumbnail: Canvas draw error for:', clip.name, drawError);
                generateFallbackThumbnail();
              }
              cleanup();
            };

            video.addEventListener('seeked', onSeeked, { once: true });
            video.currentTime = seekTime;
            
            // Fallback if seeked doesn't fire within 2 seconds
            setTimeout(() => {
              if (mounted && isLoading && !thumbnailUrl && !thumbnailError) {
                console.log('ClipThumbnail: Seeked event timeout, trying to draw anyway for:', clip.name);
                onSeeked();
              }
            }, 2000);
            
          } catch (error) {
            console.error('ClipThumbnail: Thumbnail process error for:', clip.name, error);
            generateFallbackThumbnail();
            cleanup();
          }
        });

        video.src = objectUrl;
        video.load();

      } catch (err) {
        console.error('ClipThumbnail: Setup error for:', clip.name, err);
        if (mounted) {
          generateFallbackThumbnail();
        }
      }
    };

    const generateFallbackThumbnail = () => {
      try {
        const canvas = canvasRef.current;
        if (canvas && mounted) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = 120;
            canvas.height = 68;
            
            // Create a gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#3B82F6');
            gradient.addColorStop(1, '#1E40AF');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add text
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('VIDEO', canvas.width / 2, canvas.height / 2 - 5);
            ctx.font = '8px Arial';
            ctx.fillText(clip.duration.toFixed(1) + 's', canvas.width / 2, canvas.height / 2 + 8);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setThumbnailUrl(dataUrl);
            setIsLoading(false);
            setThumbnailError(false);
          }
        }
      } catch (error) {
        console.error('ClipThumbnail: Fallback thumbnail generation failed:', error);
        setThumbnailError(true);
        setIsLoading(false);
      }
    };

    generateThumbnail();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [clip.sourceFile, clip.name, clip.startTime, clip.duration, isLoading, thumbnailUrl, thumbnailError]);

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
        ) : thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={clip.name}
            className="w-full h-full object-cover"
            onError={() => {
              console.warn('ClipThumbnail: Image display error for:', clip.name);
              setThumbnailError(true);
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
            <FileVideo className="w-6 h-6 text-white" />
          </div>
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
