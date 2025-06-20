
import React, { useState } from 'react';
import { Film, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VideoClip, SourceVideo } from '@/types/timeline';
import { useToast } from '@/hooks/use-toast';
import VideoSelectionPanel from './VideoSelectionPanel';
import LibraryClipThumbnail from './LibraryClipThumbnail';
import LibraryStats from './LibraryStats';
import EmptyLibraryState from './EmptyLibraryState';
import ClipLimitManager from './ClipLimitManager';
import { VideoCompilerService } from '@/services/videoCompiler';

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
  const [isRandomEverything, setIsRandomEverything] = useState(false);

  const { toast } = useToast();

  const generateClips = (config: any) => {
    setIsGenerating(true);
    setGenerationProgress(0);

    const generatedClips = [];
    const videosToProcess = config.useAllVideos 
      ? sourceVideos 
      : sourceVideos.slice(0, Math.min(config.numVideos, sourceVideos.length));
    
    const totalClips = config.numClips * videosToProcess.length;
    let clipsGenerated = 0;

    for (let i = 0; i < videosToProcess.length; i++) {
      const video = videosToProcess[i];
      if (!video) continue;

      for (let j = 0; j < config.numClips; j++) {
        const startTime = Math.random() * (video.duration - config.clipDuration);

        const newClip: VideoClip = {
          id: `clip-${Date.now()}-${Math.random()}`,
          name: `Clip ${i}-${j}`,
          sourceFile: video.file,
          startTime,
          duration: config.clipDuration,
          thumbnail: video.thumbnail,
          position: 0,
          originalVideoId: video.id,
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

  const handleRandomEverything = async () => {
    if (sourceVideos.length === 0) {
      toast({
        title: "No videos available",
        description: "Please upload some videos first",
        variant: "destructive",
      });
      return;
    }

    setIsRandomEverything(true);
    
    try {
      // Generate 3 random 1-second clips from every video
      const randomClips: VideoClip[] = [];
      
      sourceVideos.forEach((video, videoIndex) => {
        for (let clipIndex = 0; clipIndex < 3; clipIndex++) {
          const startTime = Math.random() * Math.max(0, video.duration - 1);
          
          const randomClip: VideoClip = {
            id: `random-${Date.now()}-${videoIndex}-${clipIndex}`,
            name: `Random ${videoIndex}-${clipIndex}`,
            sourceFile: video.file,
            startTime,
            duration: 1,
            thumbnail: video.thumbnail,
            position: clipIndex,
            originalVideoId: video.id,
          };
          randomClips.push(randomClip);
        }
      });

      onClipsUpdate(randomClips);
      
      const config = {
        totalDuration: randomClips.length,
        clipOrder: randomClips.map(clip => clip.id),
        zoom: 1,
        playheadPosition: 0,
      };

      toast({
        title: "RANDOM EVERYTHING initiated!",
        description: `Generated ${randomClips.length} random clips and starting compilation...`,
      });

      await VideoCompilerService.compileTimeline(
        randomClips,
        config,
        undefined,
        (progress: number, stage: string) => {
          console.log(`Random compilation progress: ${progress}% - ${stage}`);
        }
      );

      toast({
        title: "RANDOM EVERYTHING complete!",
        description: "Your random video compilation is ready for download!",
      });

    } catch (error) {
      console.error('Random everything error:', error);
      toast({
        title: "Random everything failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsRandomEverything(false);
    }
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
            sourceVideosCount={sourceVideos.length}
            clipsCount={clips.length}
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* FUCK IT RANDOM EVERYTHING Button */}
        <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-red-900/30 to-orange-900/30">
          <Button
            onClick={handleRandomEverything}
            disabled={sourceVideos.length === 0 || isRandomEverything}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold text-sm"
            size="sm"
          >
            <Zap className="w-4 h-4 mr-2" />
            {isRandomEverything ? 'RANDOMIZING...' : 'FUCK IT RANDOM EVERYTHING.'}
          </Button>
        </div>

        {/* NEW: Organized Video Selection Panel (Steps 1-5) */}
        <div className="p-4">
          <VideoSelectionPanel
            sourceVideos={sourceVideos}
            onVideoUpload={onVideoUpload}
            onBulkUpload={onBulkUpload}
            onGenerateClips={generateClips}
            onRandomizeAll={onRandomizeAll}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
          />
        </div>

        {/* Clip Limit Manager */}
        <div className="px-4">
          <ClipLimitManager
            clips={clips}
            timelineClips={timelineClips}
            onClearOldest={handleClearOldestClips}
            onClearUnused={handleClearUnusedClips}
          />
        </div>

        {/* Clip List */}
        <div className="flex-1 overflow-auto">
          {clips.length === 0 ? (
            <EmptyLibraryState onVideoUpload={onVideoUpload} />
          ) : (
            <ScrollArea className="h-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 p-4">
                {clips.map((clip) => (
                  <LibraryClipThumbnail
                    key={clip.id}
                    clip={clip}
                    onAdd={() => onClipAdd(clip)}
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
