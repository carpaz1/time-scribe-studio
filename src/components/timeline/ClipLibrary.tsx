
import React from 'react';
import { Plus, FileVideo, Shuffle, Sparkles } from 'lucide-react';
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
  onRandomizeAll: () => void;
}

const ClipLibrary: React.FC<ClipLibraryProps> = ({
  clips,
  sourceVideos,
  onClipAdd,
  onClipsUpdate,
  onSourceVideosUpdate,
  onClipsGenerated,
  onRandomizeAll,
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
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <FileVideo className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Video Library</h2>
        </div>
        
        <VideoUploader
          sourceVideos={sourceVideos}
          onSourceVideosUpdate={onSourceVideosUpdate}
          onClipsGenerated={onClipsGenerated}
        />
      </div>

      <div
        className="flex-1 p-6 overflow-auto"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {clips.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-400 text-sm mb-2">No clips generated yet</p>
            <p className="text-slate-500 text-xs">Upload videos and generate clips to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <span>Generated Clips</span>
                <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded-full">
                  {clips.length}
                </span>
              </h3>
              <Button
                size="sm"
                onClick={onRandomizeAll}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Add All Random
              </Button>
            </div>
            
            <div className="grid gap-3">
              {clips.map((clip) => (
                <div
                  key={clip.id}
                  className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-xl p-4 cursor-pointer hover:from-slate-700/80 hover:to-slate-600/80 transition-all duration-300 group border border-slate-600/30 hover:border-slate-500/50 shadow-lg hover:shadow-xl"
                  onClick={() => onClipAdd(clip)}
                >
                  <div className="flex items-center space-x-4">
                    {clip.thumbnail ? (
                      <div className="relative">
                        <img
                          src={clip.thumbnail}
                          alt={clip.name}
                          className="w-20 h-12 object-cover rounded-lg bg-slate-600 shadow-md"
                        />
                        <div className="absolute inset-0 bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                    ) : (
                      <div className="w-20 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center shadow-md">
                        <FileVideo className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate mb-1">
                        {clip.name}
                      </p>
                      <div className="flex items-center space-x-3 text-xs text-slate-400">
                        <span>{clip.duration.toFixed(1)}s</span>
                        <span>•</span>
                        <span>@{clip.startTime.toFixed(1)}s</span>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-600/50 hover:bg-slate-500/50 text-white border-0 shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClipLibrary;
