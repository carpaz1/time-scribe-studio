
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, FileVideo, Sparkles } from 'lucide-react';
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
  const generationAttemptedRef = useRef(false);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${left}%`,
    width: `${Math.max(width, 2)}%`,
    height: '80px',
    top: '10px',
  };

  // Optimized thumbnail generation
  const generateThumbnail = useCallback(async () => {
    if (generationAttemptedRef.current) return;
    generationAttemptedRef.current = true;

    console.log('ClipThumbnail: Starting optimized thumbnail generation for:', clip.name);
    setIsLoading(true);
    setThumbnailError(false);

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');
      
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Canvas context not available');
      
      // Set canvas size
      canvas.width = 120;
      canvas.height = 68;
      
      // Create video element with optimized settings
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.crossOrigin = 'anonymous';
      
      const objectUrl = URL.createObjectURL(clip.sourceFile);
      
      const cleanup = () => {
        try {
          URL.revokeObjectURL(objectUrl);
          video.src = '';
        } catch (e) {
          console.warn('ClipThumbnail: Cleanup error:', e);
        }
      };

      // Enhanced loading with faster timeout
      const loadPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Load timeout'));
        }, 3000); // Reduced timeout

        video.addEventListener('loadedmetadata', () => {
          clearTimeout(timeout);
          
          try {
            // Smart seek position - middle of clip or 1 second
            const seekTime = Math.min(
              Math.max(clip.startTime + (clip.duration / 2), 0.5),
              video.duration - 0.1
            );
            
            const onSeeked = () => {
              try {
                // Enhanced drawing with better quality
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                setThumbnailUrl(dataUrl);
                setIsLoading(false);
                console.log('ClipThumbnail: Enhanced thumbnail generated for:', clip.name);
                resolve();
              } catch (drawError) {
                console.error('ClipThumbnail: Draw error:', drawError);
                reject(drawError);
              }
              cleanup();
            };

            video.addEventListener('seeked', onSeeked, { once: true });
            video.currentTime = seekTime;
            
            // Fallback timer
            setTimeout(() => {
              if (isLoading) onSeeked();
            }, 1000);
            
          } catch (error) {
            reject(error);
          }
        }, { once: true });

        video.addEventListener('error', (e) => {
          clearTimeout(timeout);
          reject(new Error('Video load failed'));
        }, { once: true });
      });

      video.src = objectUrl;
      await loadPromise;
      
    } catch (error) {
      console.error('ClipThumbnail: Generation failed for:', clip.name, error);
      setThumbnailError(true);
      generateFallbackThumbnail();
    }
  }, [clip, isLoading]);

  // Enhanced fallback thumbnail
  const generateFallbackThumbnail = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = 120;
      canvas.height = 68;
      
      // Create attractive gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#6366F1');
      gradient.addColorStop(1, '#8B5CF6');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add sparkle effect
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('✨', canvas.width / 2, canvas.height / 2 - 8);
      
      ctx.font = '8px Arial';
      ctx.fillText(`${clip.duration.toFixed(1)}s`, canvas.width / 2, canvas.height / 2 + 12);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setThumbnailUrl(dataUrl);
      setIsLoading(false);
      setThumbnailError(false);
    } catch (error) {
      console.error('ClipThumbnail: Fallback generation failed:', error);
      setThumbnailError(true);
      setIsLoading(false);
    }
  }, [clip.duration]);

  // Trigger generation on mount
  useEffect(() => {
    const timer = setTimeout(generateThumbnail, Math.random() * 200);
    return () => clearTimeout(timer);
  }, [generateThumbnail]);

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
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div className="relative h-full">
        {/* Enhanced Thumbnail Display */}
        {isLoading ? (
          <div className="w-full h-full bg-gradient-to-r from-slate-600 to-slate-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
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
          <div className="w-full h-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
            <FileVideo className="w-6 h-6 text-white" />
          </div>
        )}

        {/* Enhanced Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-xs text-white font-medium truncate mb-1 px-2 max-w-full flex items-center">
            <Sparkles className="w-3 h-3 mr-1" />
            {clip.name}
          </div>
          <div className="text-xs text-purple-100 bg-purple-600/50 px-2 py-1 rounded">
            {clip.duration.toFixed(1)}s
          </div>
        </div>

        {/* Enhanced Remove Button */}
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
