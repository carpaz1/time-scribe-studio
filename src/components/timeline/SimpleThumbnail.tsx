
import React, { useState, useEffect } from 'react';
import { VideoClip } from '@/types/timeline';
import { ThumbnailService } from '@/services/thumbnailService';

interface SimpleThumbnailProps {
  clip: VideoClip;
  width?: number;
  height?: number;
  className?: string;
}

const SimpleThumbnail: React.FC<SimpleThumbnailProps> = ({
  clip,
  width = 120,
  height = 68,
  className = '',
}) => {
  const [thumbnail, setThumbnail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateThumbnail = async () => {
      setIsLoading(true);
      try {
        const thumbnailService = ThumbnailService.getInstance();
        const thumb = await thumbnailService.generateThumbnail(clip, width, height);
        setThumbnail(thumb);
      } catch (error) {
        console.error('Thumbnail generation failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateThumbnail();
  }, [clip.id, width, height]);

  if (isLoading) {
    return (
      <div 
        className={`bg-gradient-to-br from-slate-600 to-slate-700 animate-pulse flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-white text-xs">Loading...</div>
      </div>
    );
  }

  return (
    <img
      src={thumbnail}
      alt={clip.name}
      className={`object-cover ${className}`}
      style={{ width, height }}
      loading="lazy"
    />
  );
};

export default SimpleThumbnail;
