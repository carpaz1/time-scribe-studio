
import React, { useState } from 'react';
import { VideoClip } from '@/types/timeline';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import SimpleThumbnail from './SimpleThumbnail';

interface LibraryClipThumbnailProps {
  clip: VideoClip;
  onAdd: () => void;
}

const LibraryClipThumbnail: React.FC<LibraryClipThumbnailProps> = ({
  clip,
  onAdd,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`bg-gray-700 border border-gray-500 rounded cursor-pointer transition-all duration-200 group overflow-hidden aspect-video ${
        isHovered ? 'shadow-lg shadow-blue-500/30 border-blue-400' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onAdd}
    >
      <div className="relative h-full">
        <SimpleThumbnail
          clip={clip}
          className="w-full h-full"
        />

        {/* Overlay */}
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
