
import React, { useRef } from 'react';
import { Plus, Upload, FileVideo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoClip } from '@/types/timeline';
import { useToast } from '@/hooks/use-toast';

interface ClipLibraryProps {
  clips: VideoClip[];
  onClipAdd: (clip: VideoClip) => void;
  onClipsUpdate: (clips: VideoClip[]) => void;
}

const ClipLibrary: React.FC<ClipLibraryProps> = ({
  clips,
  onClipAdd,
  onClipsUpdate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (files: FileList) => {
    Array.from(files).forEach(async (file) => {
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a video file`,
          variant: "destructive",
        });
        return;
      }

      // Create thumbnail
      const thumbnail = await createThumbnail(file);
      
      // Get video duration
      const duration = await getVideoDuration(file);

      const newClip: VideoClip = {
        id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        startTime: 0,
        duration: duration,
        thumbnail: thumbnail,
        sourceFile: file,
        position: 0,
      };

      onClipsUpdate([...clips, newClip]);
      
      toast({
        title: "Clip uploaded",
        description: `${newClip.name} is ready to use`,
      });
    });
  };

  const createThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        canvas.width = 160;
        canvas.height = 90;
        video.currentTime = Math.min(1, video.duration / 2);
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL());
        }
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-3">Clip Library</h2>
        
        <Button
          onClick={handleUploadClick}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Videos
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
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
            <p className="text-sm">Drop video files here or click upload</p>
          </div>
        ) : (
          <div className="space-y-3">
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
                      {clip.duration.toFixed(1)}s
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
