
import React, { useState, useEffect } from 'react';
import { VideoClip } from '@/types/timeline';
import { ThumbnailService } from '@/services/thumbnailService';

interface SimpleThumbnailProps {
  clip: VideoClip;
  width?: number;
  height?: number;
  seekTime?: number;
  className?: string;
}

const SimpleThumbnail: React.FC<SimpleThumbnailProps> = ({
  clip,
  width = 120,
  height = 68,
  seekTime,
  className = ''
}) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const generateThumbnail = async () => {
      setIsLoading(true);
      setHasError(false);
      
      try {
        const thumbnailService = ThumbnailService.getInstance();
        const effectiveSeekTime = seekTime ?? clip.startTime + (clip.duration / 2);
        const url = await thumbnailService.generateThumbnail(clip.sourceFile, effectiveSeekTime);
        
        if (mounted) {
          setThumbnailUrl(url);
        }
      } catch (error) {
        console.warn('Thumbnail generation failed for', clip.name, error);
        if (mounted) {
          setHasError(true);
          const thumbnailService = ThumbnailService.getInstance();
          const fallback = thumbnailService.generateFallbackThumbnail(clip.name, clip.duration);
          setThumbnailUrl(fallback);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    generateThumbnail();
    
    return () => {
      mounted = false;
    };
  }, [clip.sourceFile, clip.name, clip.duration, seekTime, clip.startTime]);

  if (isLoading) {
    return (
      <div 
        className={`bg-gradient-to-r from-slate-600 to-slate-700 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-white text-xs animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <img
      src={thumbnailUrl}
      alt={clip.name}
      className={`object-cover ${className}`}
      style={{ width, height }}
      onError={() => setHasError(true)}
    />
  );
};

export default SimpleThumbnail;
