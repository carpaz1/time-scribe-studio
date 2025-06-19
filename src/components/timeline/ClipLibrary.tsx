
import React from 'react';
import { VideoClip, SourceVideo } from '@/types/timeline';
import { Separator } from '@/components/ui/separator';
import VideoUploader from './VideoUploader';
import BulkDirectorySelector from './BulkDirectorySelector';
import LibraryClipThumbnail from './LibraryClipThumbnail';
import { Button } from '@/components/ui/button';
import { Shuffle } from 'lucide-react';

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
  return (
    <div className="bg-slate-800/60 backdrop-blur-sm h-full p-4 border-r border-slate-700/50 flex flex-col">
      <div className="mb-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">📁</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Clip Library</h2>
            <p className="text-xs text-slate-400">Manage your video assets</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-4">
        {/* Bulk Directory Selector */}
        <BulkDirectorySelector
          onSourceVideosUpdate={onSourceVideosUpdate}
          onClipsGenerated={onClipsGenerated}
        />

        <Separator className="bg-slate-600/50" />

        {/* Individual Video Uploader */}
        <VideoUploader
          sourceVideos={sourceVideos}
          onSourceVideosUpdate={onSourceVideosUpdate}
          onClipsGenerated={onClipsGenerated}
        />

        {/* Generated Clips */}
        {clips.length > 0 && (
          <>
            <Separator className="bg-slate-600/50" />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">
                  Generated Clips
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded-full">
                    {clips.length}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onRandomizeAll}
                    className="text-xs hover:bg-slate-700/50 text-slate-300 hover:text-white h-7 px-2"
                  >
                    <Shuffle className="w-3 h-3 mr-1" />
                    Add All
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-auto">
                {clips.map((clip) => (
                  <LibraryClipThumbnail
                    key={clip.id}
                    clip={clip}
                    onAdd={() => onClipAdd(clip)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClipLibrary;
