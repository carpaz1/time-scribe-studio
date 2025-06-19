
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
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const blobUrlRef = useRef<string>('');

  // Cleanup function
  const cleanup = () => {
    if (blobUrlRef.current) {
      console.log('LibraryClipThumbnail: Cleaning up blob URL for', clip.name);
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = '';
    }
    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current = null;
    }
  };

  // Generate thumbnail from video with better error handling
  useEffect(() => {
    if (isGenerating || thumbnailUrl) return;

    const generateThumbnail = async () => {
      console.log('LibraryClipThumbnail: Starting thumbnail generation for', clip.name);
      setIsGenerating(true);

      try {
        const canvas = canvasRef.current;
        if (!canvas) {
          console.error('LibraryClipThumbnail: Canvas not available for', clip.name);
          return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('LibraryClipThumbnail: Canvas context not available for', clip.name);
          return;
        }
        
        // Create video element
        const video = document.createElement('video');
        videoRef.current = video;
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        
        // Create blob URL
        const blobUrl = URL.createObjectURL(clip.sourceFile);
        blobUrlRef.current = blobUrl;
        
        // Set up video loading
        const loadPromise = new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Video load timeout'));
          }, 5000);

          video.addEventListener('loadeddata', () => {
            clearTimeout(timeout);
            console.log('LibraryClipThumbnail: Video loaded for', clip.name);
            
            // Set canvas dimensions
            canvas.width = 120;
            canvas.height = 68;
            
            // Seek to middle of clip for thumbnail
            const seekTime = Math.max(0, clip.startTime + (clip.duration / 2));
            video.currentTime = seekTime;
            
            video.addEventListener('seeked', () => {
              try {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                setThumbnailUrl(dataUrl);
                console.log('LibraryClipThumbnail: Thumbnail generated for', clip.name);
                resolve();
              } catch (drawError) {
                console.error('LibraryClipThumbnail: Error drawing thumbnail for', clip.name, drawError);
                reject(drawError);
              }
            }, { once: true });

            video.addEventListener('error', () => {
              console.error('LibraryClipThumbnail: Video seek error for', clip.name);
              reject(new Error('Video seek failed'));
            }, { once: true });
          }, { once: true });

          video.addEventListener('error', (e) => {
            clearTimeout(timeout);
            console.error('LibraryClipThumbnail: Video load error for', clip.name, e);
            reject(new Error('Video load failed'));
          }, { once: true });
        });

        video.src = blobUrl;
        await loadPromise;
        
      } catch (error) {
        console.error('LibraryClipThumbnail: Thumbnail generation failed for', clip.name, error);
        // Set a fallback color based on clip name
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = 120;
            canvas.height = 68;
            ctx.fillStyle = '#374151';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#9CA3AF';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Error', canvas.width / 2, canvas.height / 2);
            setThumbnailUrl(canvas.toDataURL());
          }
        }
      } finally {
        setIsGenerating(false);
        cleanup();
      }
    };

    // Delay thumbnail generation to avoid overwhelming the browser
    const timeoutId = setTimeout(generateThumbnail, Math.random() * 1000);
    
    return () => {
      clearTimeout(timeoutId);
      cleanup();
    };
  }, [clip, thumbnailUrl, isGenerating]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

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
        ) : isGenerating ? (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
            <div className="text-white text-xs">Loading...</div>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center">
            <div className="text-white text-xs">📽️</div>
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
