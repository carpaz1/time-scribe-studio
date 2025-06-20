
import React, { useState, useEffect, useRef } from 'react';
import { VideoClip } from '@/types/timeline';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle } from 'lucide-react';

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
  const [hasError, setHasError] = useState(false);
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
    if (isGenerating || thumbnailUrl || hasError) return;

    const generateThumbnail = async () => {
      console.log('LibraryClipThumbnail: Starting thumbnail generation for', clip.name);
      setIsGenerating(true);
      setHasError(false);

      try {
        const canvas = canvasRef.current;
        if (!canvas) {
          throw new Error('Canvas not available');
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas context not available');
        }
        
        // Create video element
        const video = document.createElement('video');
        videoRef.current = video;
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.crossOrigin = 'anonymous';
        
        // Create blob URL
        const blobUrl = URL.createObjectURL(clip.sourceFile);
        blobUrlRef.current = blobUrl;
        
        // Set up video loading with shorter timeout
        const loadPromise = new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Video load timeout'));
          }, 3000); // Reduced to 3 seconds

          video.addEventListener('loadedmetadata', () => {
            clearTimeout(timeout);
            console.log('LibraryClipThumbnail: Video loaded for', clip.name);
            
            // Validate video has proper dimensions
            if (video.videoWidth === 0 || video.videoHeight === 0) {
              reject(new Error('Invalid video dimensions'));
              return;
            }
            
            // Set canvas dimensions
            canvas.width = 120;
            canvas.height = 68;
            
            // Seek to a safe position
            const seekTime = Math.min(clip.startTime + 1, video.duration - 0.5, 1);
            video.currentTime = Math.max(0, seekTime);
            
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
        setHasError(true);
        
        // Generate fallback thumbnail
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = 120;
            canvas.height = 68;
            ctx.fillStyle = '#DC2626'; // Red background for error
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ERROR', canvas.width / 2, canvas.height / 2 - 5);
            ctx.font = '8px Arial';
            ctx.fillText('Unsupported', canvas.width / 2, canvas.height / 2 + 8);
            setThumbnailUrl(canvas.toDataURL());
          }
        }
      } finally {
        setIsGenerating(false);
        cleanup();
      }
    };

    // Delay thumbnail generation to avoid overwhelming the browser
    const timeoutId = setTimeout(generateThumbnail, Math.random() * 500);
    
    return () => {
      clearTimeout(timeoutId);
      cleanup();
    };
  }, [clip, thumbnailUrl, isGenerating, hasError]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  return (
    <div
      className={`bg-gray-700 border border-gray-500 rounded cursor-pointer transition-all duration-200 group overflow-hidden aspect-video ${
        isHovered ? 'shadow-lg shadow-blue-500/30 border-blue-400' : ''
      } ${hasError ? 'border-red-500' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onAdd}
    >
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div className="relative h-full">
        {/* Thumbnail or Fallback */}
        {isGenerating ? (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
            <div className="text-white text-xs">Loading...</div>
          </div>
        ) : thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={clip.name}
            className="w-full h-full object-cover"
            onError={() => {
              console.warn('LibraryClipThumbnail: Image display error for:', clip.name);
              setHasError(true);
            }}
          />
        ) : hasError ? (
          <div className="w-full h-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-white" />
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
          {!hasError ? (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          ) : (
            <div className="text-xs text-red-200 text-center px-2">
              Unsupported file
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryClipThumbnail;
