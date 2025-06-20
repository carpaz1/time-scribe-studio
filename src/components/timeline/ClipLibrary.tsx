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
  progressTracker?: {
    current: number;
    total: number;
    message: string;
    isActive: boolean;
  };
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
  progressTracker,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isRandomEverything, setIsRandomEverything] = useState(false);
  const [processingCancelled, setProcessingCancelled] = useState(false);

  const { toast } = useToast();

  const generateClips = (config: any) => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setProcessingCancelled(false);

    const generatedClips = [];
    const videosToProcess = config.useAllVideos 
      ? sourceVideos 
      : sourceVideos.slice(0, Math.min(config.numVideos, sourceVideos.length));
    
    const totalClips = config.numClips * videosToProcess.length;
    let clipsGenerated = 0;

    const processClips = () => {
      if (processingCancelled) {
        setIsGenerating(false);
        return;
      }

      for (let i = 0; i < videosToProcess.length && !processingCancelled; i++) {
        const video = videosToProcess[i];
        if (!video) continue;

        for (let j = 0; j < config.numClips && !processingCancelled; j++) {
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

      if (!processingCancelled) {
        onClipsGenerated(generatedClips);
      }
      setIsGenerating(false);
    };

    // Use setTimeout to allow for cancellation
    setTimeout(processClips, 100);
  };

  const handleCancelProcessing = async () => {
    console.log('Cancel processing clicked');
    setProcessingCancelled(true);
    setIsGenerating(false);
    setIsRandomEverything(false);
    
    // Cancel any active compilation job
    try {
      await VideoCompilerService.cancelCurrentJob();
    } catch (error) {
      console.error('Error cancelling compilation:', error);
    }
    
    toast({
      title: "Processing cancelled",
      description: "All operations have been cancelled",
    });
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
    setProcessingCancelled(false);
    
    try {
      console.log(`RANDOM EVERYTHING: Generating clips from ${sourceVideos.length} videos`);
      
      // Generate truly random clips from all videos
      const randomClips: VideoClip[] = [];
      const maxClipsPerVideo = 5;
      const totalPossibleClips = sourceVideos.length * maxClipsPerVideo;
      
      // Create an expanded and shuffled pool for true randomness
      const videoPool = [];
      for (let i = 0; i < maxClipsPerVideo; i++) {
        videoPool.push(...sourceVideos);
      }
      
      // Shuffle the entire pool
      const shuffledPool = videoPool.sort(() => Math.random() - 0.5);
      
      // Take clips from the shuffled pool (limit to 199 for compilation)
      const clipsToGenerate = Math.min(199, shuffledPool.length);
      
      for (let i = 0; i < clipsToGenerate; i++) {
        if (processingCancelled) return;
        
        const video = shuffledPool[i];
        const startTime = Math.random() * Math.max(0, video.duration - 1);
        
        const randomClip: VideoClip = {
          id: `random-everything-${Date.now()}-${i}-${Math.random()}`,
          name: `Random ${i}`,
          sourceFile: video.file,
          startTime,
          duration: 1, // Always use 1-second clips
          thumbnail: video.thumbnail,
          position: i,
          originalVideoId: video.id,
        };
        randomClips.push(randomClip);
      }

      if (processingCancelled) return;

      console.log(`Generated ${randomClips.length} truly random clips`);
      onClipsUpdate(randomClips);
      
      const config = {
        totalDuration: randomClips.length,
        clipOrder: randomClips.map(clip => clip.id),
        zoom: 1,
        playheadPosition: 0,
        preserveAudio: true, // Ensure audio is preserved
        audioCodec: 'aac',
        videoCodec: 'h264'
      };

      toast({
        title: "RANDOM EVERYTHING initiated!",
        description: `Generated ${randomClips.length} truly random 1-second clips and starting compilation...`,
      });

      if (!processingCancelled) {
        await VideoCompilerService.compileTimeline(
          randomClips,
          config,
          undefined,
          (progress: number, stage: string) => {
            if (!processingCancelled) {
              console.log(`Random compilation progress: ${progress}% - ${stage}`);
            }
          }
        );

        if (!processingCancelled) {
          toast({
            title: "RANDOM EVERYTHING complete!",
            description: "Your random video compilation with audio is ready for download!",
          });
        }
      }

    } catch (error) {
      if (!processingCancelled) {
        console.error('Random everything error:', error);
        toast({
          title: "Random everything failed",
          description: error instanceof Error ? error.message : "Something went wrong",
          variant: "destructive",
        });
      }
    } finally {
      setIsRandomEverything(false);
    }
  };

  const handleRandomizeTimed = async (targetDurationMinutes: number) => {
    if (sourceVideos.length === 0) {
      toast({
        title: "No videos available",
        description: "Please upload some videos first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProcessingCancelled(false);

    try {
      const targetDurationSeconds = targetDurationMinutes * 60;
      const randomClips: VideoClip[] = [];
      
      // Calculate number of 1-second clips needed for target duration
      const availableVideos = sourceVideos.filter(video => video.duration >= 1);
      if (availableVideos.length === 0) {
        throw new Error("No videos long enough to create clips from");
      }
      
      // Generate exactly the number of 1-second clips needed
      const clipDuration = 1; // Always use 1-second clips
      const clipsNeeded = Math.min(targetDurationSeconds, availableVideos.length * 5); // Max 5 clips per video
      
      for (let i = 0; i < clipsNeeded; i++) {
        if (processingCancelled) return;
        
        const videoIndex = i % availableVideos.length;
        const video = availableVideos[videoIndex];
        const startTime = Math.random() * Math.max(0, video.duration - clipDuration);
        
        const randomClip: VideoClip = {
          id: `timed-${Date.now()}-${i}`,
          name: `Timed ${i}`,
          sourceFile: video.file,
          startTime,
          duration: clipDuration,
          thumbnail: video.thumbnail,
          position: i,
          originalVideoId: video.id,
        };
        randomClips.push(randomClip);
      }

      if (processingCancelled) return;

      const actualDuration = randomClips.reduce((sum, clip) => sum + clip.duration, 0);
      onClipsUpdate(randomClips);
      
      const config = {
        totalDuration: actualDuration,
        clipOrder: randomClips.map(clip => clip.id),
        zoom: 1,
        playheadPosition: 0,
      };

      toast({
        title: `${targetDurationMinutes}-minute compilation started!`,
        description: `Generated ${randomClips.length} 1-second clips (~${Math.round(actualDuration)}s total), starting compilation...`,
      });

      if (!processingCancelled) {
        await VideoCompilerService.compileTimeline(
          randomClips,
          config,
          undefined,
          (progress: number, stage: string) => {
            if (!processingCancelled) {
              console.log(`Timed compilation progress: ${progress}% - ${stage}`);
            }
          }
        );

        if (!processingCancelled) {
          toast({
            title: `${targetDurationMinutes}-minute compilation complete!`,
            description: "Your timed video compilation is ready for download!",
          });
        }
      }

    } catch (error) {
      if (!processingCancelled) {
        console.error('Timed randomize error:', error);
        toast({
          title: "Timed compilation failed",
          description: error instanceof Error ? error.message : "Something went wrong",
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDirectRandomize = async () => {
    if (sourceVideos.length === 0) {
      toast({
        title: "No videos available",
        description: "Please upload some videos first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProcessingCancelled(false);
    
    try {
      // Generate 1 random 1-second clip from each video
      const randomClips: VideoClip[] = [];
      
      sourceVideos.forEach((video, videoIndex) => {
        if (processingCancelled) return;
        
        const startTime = Math.random() * Math.max(0, video.duration - 1);
        
        const randomClip: VideoClip = {
          id: `direct-${Date.now()}-${videoIndex}`,
          name: `Direct ${videoIndex}`,
          sourceFile: video.file,
          startTime,
          duration: 1, // Always use 1-second clips
          thumbnail: video.thumbnail,
          position: 0,
          originalVideoId: video.id,
        };
        randomClips.push(randomClip);
      });

      if (processingCancelled) return;

      // Limit to 199 clips
      const limitedClips = randomClips.slice(0, 199);
      onClipsUpdate(limitedClips);
      
      toast({
        title: "Direct randomization complete!",
        description: `Generated ${limitedClips.length} 1-second clips directly from your directory`,
      });

    } catch (error) {
      if (!processingCancelled) {
        console.error('Direct randomize error:', error);
        toast({
          title: "Direct randomization failed",
          description: error instanceof Error ? error.message : "Something went wrong",
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
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

  const handleCompile = async () => {
    if (clips.length === 0) {
      toast({
        title: "No clips to compile",
        description: "Generate clips first",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Starting compilation of', clips.length, 'clips');

      const result = await VideoCompilerService.compileTimeline(
        clips,
        { 
          totalDuration: clips.reduce((sum, clip) => sum + clip.duration, 0), 
          clipOrder: clips.map(c => c.id), 
          zoom: 100, 
          playheadPosition: 0 
        },
        undefined,
        (progress: number, stage: string) => {
          console.log('Compilation progress:', progress, stage);
        }
      );

      console.log('Compilation completed successfully:', result);
      
      toast({
        title: "Compilation Complete!",
        description: `Video compiled successfully. File ready for download.`,
      });
    } catch (error) {
      console.error('Compilation failed:', error);
      toast({
        title: "Compilation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
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
            onRandomizeTimed={handleRandomizeTimed}
            onDirectRandomize={handleDirectRandomize}
            onCancelProcessing={handleCancelProcessing}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
            onCompile={handleCompile}
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
