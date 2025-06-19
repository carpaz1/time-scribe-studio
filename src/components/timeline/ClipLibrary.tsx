
import React from 'react';
import { Plus, FileVideo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoClip, SourceVideo } from '@/types/timeline';
import { useToast } from '@/hooks/use-toast';
import VideoUploader from './VideoUploader';

interface ClipLibraryProps {
  clips: VideoClip[];
  sourceVideos: SourceVideo[];
  onClipAdd: (clip: VideoClip) => void;
  onClipsUpdate: (clips: VideoClip[]) => void;
  onSourceVideosUpdate: (videos: SourceVideo[]) => void;
  onClipsGenerated: (clips: VideoClip[]) => void;
}

const ClipLibrary: React.FC<ClipLibraryProps> = ({
  clips,
  sourceVideos,
  onClipAdd,
  onClipsUpdate,
  onSourceVideosUpdate,
  onClipsGenerated,
}) => {
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // Handle file drops if needed
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-3">Video Library</h2>
        
        <VideoUploader
          sourceVideos={sourceVideos}
          onSourceVideosUpdate={onSourceVideosUpdate}
          onClipsGenerated={onClipsGenerated}
        />
      </div>

      <div
        className="flex-1 p-4 overflow-auto"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {clips.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <FileVideo className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Generate clips from your videos</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white">Generated Clips</h3>
            {clips.map((clip) => (
              <div
                key={clip.id}
                className="bg-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-600 transition-colors duration-200 group"
                onClick={() => onClipAdd(clip)}
              >
                <div className="flex items-center space-x-3">
                  {clip.thumbnail ? (
                    <img
                      src={clip.thumbnail}
                      alt={clip.name}
                      className="w-16 h-9 object-cover rounded bg-gray-600"
                    />
                  ) : (
                    <div className="w-16 h-9 bg-gray-600 rounded flex items-center justify-center">
                      <FileVideo className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {clip.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {clip.duration.toFixed(1)}s @ {clip.startTime.toFixed(1)}s
                    </p>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClipLibrary;
