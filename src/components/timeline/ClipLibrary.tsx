import React, { useState } from 'react';
import { Settings, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VideoClip, SourceVideo } from '@/types/timeline';
import { useToast } from '@/hooks/use-toast';
import VideoUploader from './VideoUploader';
import BulkDirectorySelector from './BulkDirectorySelector';
import LibraryClipThumbnail from './LibraryClipThumbnail';
import LibraryStats from './LibraryStats';
import EmptyLibraryState from './EmptyLibraryState';
import ClipGenerationPanel from './ClipGenerationPanel';
import ClipLimitManager from './ClipLimitManager';

interface ClipLibraryProps {
  clips: VideoClip[];
  sourceVideos: SourceVideo[];
  timelineClips: VideoClip[];
  onClipAdd: (clip: VideoClip) => void;
  onClipsUpdate: (clips: VideoClip[]) => void;
  onSourceVideosUpdate: (videos: SourceVideo[]) => void;
  onClipsGenerated: (clips: VideoClip[]) => void;
  onRandomizeAll: () => void;
  onVideoUpload: (files: File[]) => void;
  onBulkUpload: (files: File[]) => void;
}

const ClipLibrary: React.FC<ClipLibraryProps> = ({
  clips,
  sourceVideos,
  timelineClips,
  onClipAdd,
  onClipsUpdate,
  onSourceVideosUpdate,
  onClipsGenerated,
  onRandomizeAll,
  onVideoUpload,
  onBulkUpload,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const { toast } = useToast();

  const generateClips = (config: any) => {
    setIsGenerating(true);
    setGenerationProgress(0);

    const generatedClips = [];
    const totalClips = config.numClips * config.numVideos;
    let clipsGenerated = 0;

    for (let i = 0; i < config.numVideos; i++) {
      const video = sourceVideos[i % sourceVideos.length];
      if (!video) continue;

      for (let j = 0; j < config.numClips; j++) {
        const startTime = Math.random() * (video.duration - config.clipDuration);
        const endTime = startTime + config.clipDuration;

        const newClip: VideoClip = {
          id: `clip-${Date.now()}-${Math.random()}`,
          name: `Clip ${i}-${j}`,
          source: video.file,
          startTime,
          endTime,
          duration: config.clipDuration,
          sourceVideoId: video.id,
          thumbnail: video.thumbnail,
        };
        generatedClips.push(newClip);
        clipsGenerated++;

        const progress = (clipsGenerated / totalClips) * 100;
        setGenerationProgress(progress);
      }
    }

    onClipsGenerated(generatedClips);
    setIsGenerating(false);
  };

  const handleClearOldestClips = () => {
    const sortedClips = [...clips].sort((a, b) => {
      const aTime = a.id.includes('-') ? parseInt(a.id.split('-')[1]) : 0;
      const bTime = b.id.includes('-') ? parseInt(b.id.split('-')[1]) : 0;
      return aTime - bTime;
    });
    
    const clipsToClear = Math.min(50, Math.floor(clips.length * 0.3));
    const remainingClips = sortedClips.slice(clipsToClear);
    
    onClipsUpdate(remainingClips);
    toast({
      title: "Clips cleared",
      description: `Removed ${clipsToClear} oldest clips to improve performance`,
    });
  };

  const handleClearUnusedClips = () => {
    const timelineClipIds = new Set(timelineClips.map(clip => clip.id));
    const usedClips = clips.filter(clip => timelineClipIds.has(clip.id));
    
    const clearedCount = clips.length - usedClips.length;
    onClipsUpdate(usedClips);
    toast({
      title: "Unused clips cleared",
      description: `Removed ${clearedCount} unused clips`,
    });
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-800/60 to-slate-900/80 backdrop-blur-sm border-r border-slate-700/50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Film className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-200">Clip Library</h2>
          </div>
          <LibraryStats
            clips={clips}
            sourceVideos={sourceVideos}
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Clip Generation Panel */}
        <ClipGenerationPanel
          sourceVideosCount={sourceVideos.length}
          isGenerating={isGenerating}
          generationProgress={generationProgress}
          onGenerateClips={generateClips}
          onRandomizeAll={onRandomizeAll}
          clipsCount={clips.length}
        />

        {/* Add Clip Limit Manager */}
        <div className="px-4">
          <ClipLimitManager
            clips={clips}
            timelineClips={timelineClips}
            onClearOldest={handleClearOldestClips}
            onClearUnused={handleClearUnusedClips}
          />
        </div>

        {/* Uploader Section */}
        <div className="p-4 border-b border-slate-700/50 shrink-0">
          <h3 className="text-sm font-semibold text-slate-200 mb-2">Add Media</h3>
          <div className="flex space-x-2">
            <VideoUploader onVideoUpload={onVideoUpload} />
            <BulkDirectorySelector onBulkUpload={onBulkUpload} />
          </div>
        </div>

        {/* Clip List */}
        <div className="flex-1 overflow-auto">
          {clips.length === 0 ? (
            <EmptyLibraryState sourceVideos={sourceVideos} />
          ) : (
            <ScrollArea className="h-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 p-4">
                {clips.map((clip) => (
                  <LibraryClipThumbnail
                    key={clip.id}
                    clip={clip}
                    onClipAdd={() => onClipAdd(clip)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClipLibrary;
