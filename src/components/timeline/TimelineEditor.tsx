
import React, { useState, useCallback, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { useProgressTracker } from '@/hooks/useProgressTracker';
import { VideoClip, CompileRequest } from '@/types/timeline';
import { VideoCompilerService } from '@/services/videoCompiler';
import WorkflowPanel from './WorkflowPanel';
import VideoPlayerSection from './VideoPlayerSection';
import TimelineMain from './TimelineMain';
import TimelineControls from './TimelineControls';
import StatusBar from './StatusBar';
import SettingsPanel from './SettingsPanel';
import EditorHeader from './EditorHeader';
import VideoPreview from './VideoPreview';

interface TimelineEditorProps {
  onExport?: (data: CompileRequest) => void;
}

const TimelineEditor: React.FC<TimelineEditorProps> = ({ onExport }) => {
  const [sourceVideos, setSourceVideos] = useState<File[]>([]);
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [timelineClips, setTimelineClips] = useState<VideoClip[]>([]);
  const [totalDuration, setTotalDuration] = useState(60);
  const [zoom, setZoom] = useState(100);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedClip, setDraggedClip] = useState<VideoClip | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [lastCompilationResult, setLastCompilationResult] = useState<{ downloadUrl?: string; outputFile?: string } | undefined>(undefined);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationProgress, setCompilationProgress] = useState(0);
  const [compilationStage, setCompilationStage] = useState('');
  const [processingStage, setProcessingStage] = useState('');

  const { progress, startProgress, updateProgress, completeProgress, resetProgress } = useProgressTracker();
  const nextClipId = useRef(1);

  const handleFilesSelected = (files: File[]) => {
    setSourceVideos(prevFiles => [...prevFiles, ...files]);
  };

  const handleRemoveFile = (name: string) => {
    setSourceVideos(prevFiles => prevFiles.filter(file => file.name !== name));
  };

  const handleClearAll = () => {
    setSourceVideos([]);
    setClips([]);
    setTimelineClips([]);
    resetProgress();
  };

  const togglePlayback = useCallback(() => {
    setIsPlaying(isPlaying => !isPlaying);
  }, []);

  const handleZoomIn = () => {
    setZoom(zoom => Math.min(zoom + 25, 500));
  };

  const handleZoomOut = () => {
    setZoom(zoom => Math.max(zoom - 25, 25));
  };

  const handleReset = () => {
    setZoom(100);
    setPlayheadPosition(0);
  };

  const handleClearTimeline = () => {
    setTimelineClips([]);
    setPlayheadPosition(0);
  };

  const handleExportJSON = () => {
    VideoCompilerService.exportTimelineJSON(timelineClips, totalDuration, zoom, playheadPosition);
  };

  const handleAddToTimeline = (clip: VideoClip) => {
    const newClip = { ...clip, position: 0 };
    setTimelineClips(prevClips => [...prevClips, newClip]);
  };

  const handleClipDragStart = (clip: VideoClip) => {
    setIsDragging(true);
    setDraggedClip(clip);
  };

  const handleClipDragEnd = () => {
    setIsDragging(false);
    setDraggedClip(null);
  };

  const handleClipRemove = (id: string) => {
    setTimelineClips(prevClips => prevClips.filter(clip => clip.id !== id));
  };

  // Optimized batch clip generation
  const generateClipsBatch = async (videos: File[], clipCount: number, clipDuration: number = 1): Promise<VideoClip[]> => {
    const clips: VideoClip[] = [];
    const batchSize = 8; // Process 8 clips at once for better performance
    
    // Pre-create video elements for reuse
    const videoElements = new Map<string, HTMLVideoElement>();
    
    for (let i = 0; i < clipCount; i += batchSize) {
      const batchPromises = [];
      const currentBatchSize = Math.min(batchSize, clipCount - i);
      
      for (let j = 0; j < currentBatchSize; j++) {
        const clipIndex = i + j;
        const randomVideo = videos[Math.floor(Math.random() * videos.length)];
        
        batchPromises.push(
          (async () => {
            try {
              let videoElement = videoElements.get(randomVideo.name);
              
              if (!videoElement) {
                videoElement = document.createElement('video');
                videoElement.muted = true;
                videoElement.preload = 'metadata';
                videoElements.set(randomVideo.name, videoElement);
                
                const objectUrl = URL.createObjectURL(randomVideo);
                videoElement.src = objectUrl;
                
                await new Promise<void>((resolve, reject) => {
                  const timeout = setTimeout(() => reject(new Error('Timeout')), 3000);
                  videoElement!.addEventListener('loadedmetadata', () => {
                    clearTimeout(timeout);
                    resolve();
                  }, { once: true });
                  videoElement!.addEventListener('error', () => {
                    clearTimeout(timeout);
                    reject(new Error('Load failed'));
                  }, { once: true });
                });
              }
              
              const videoDuration = videoElement.duration;
              const startTime = Math.random() * Math.max(0, videoDuration - clipDuration);
              
              return {
                id: `clip-${clipIndex}-${Date.now()}-${Math.random()}`,
                name: `Clip ${clipIndex + 1}`,
                sourceFile: randomVideo,
                startTime,
                duration: clipDuration,
                thumbnail: '',
                position: clipIndex,
              };
            } catch (error) {
              console.warn(`Failed to create clip ${clipIndex}:`, error);
              return null;
            }
          })()
        );
      }
      
      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          clips.push(result.value);
        }
      });
      
      const progress = ((i + currentBatchSize) / clipCount) * 100;
      setGenerationProgress(progress);
      setProcessingStage(`Generated ${clips.length}/${clipCount} clips`);
      
      // Small delay to prevent UI blocking
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Cleanup video elements
    videoElements.forEach(video => {
      URL.revokeObjectURL(video.src);
    });
    videoElements.clear();
    
    return clips;
  };

  const handleQuickRandomize = async (duration: number, includePictures: boolean = false) => {
    if (sourceVideos.length === 0) {
      toast({
        title: "No videos available",
        description: "Please upload some videos first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setProcessingStage('Initializing...');
    
    try {
      const mediaToProcess = includePictures 
        ? sourceVideos 
        : sourceVideos.filter(file => file.type.startsWith('video/'));

      if (mediaToProcess.length === 0) {
        const mediaType = includePictures ? 'media files' : 'videos';
        toast({
          title: `No ${mediaType} available`,
          description: `Please upload some ${mediaType} first`,
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      const targetClipCount = duration * 60;
      setProcessingStage('Generating clips...');
      
      // Use optimized batch generation
      const newClips = await generateClipsBatch(mediaToProcess, targetClipCount, 1);
      
      console.log(`Generated ${newClips.length} clips in optimized batch mode`);
      
      setClips(newClips);
      setTimelineClips(newClips);
      setGenerationProgress(100);
      setProcessingStage('Starting compilation...');
      
      // Start compilation
      setIsCompiling(true);
      setCompilationProgress(0);
      setCompilationStage('Initializing compilation...');
      setLastCompilationResult(undefined);

      const compilationConfig = { 
        totalDuration: newClips.length, 
        clipOrder: newClips.map(c => c.id), 
        zoom, 
        playheadPosition,
        preserveAudio: true,
        audioCodec: 'aac',
        videoCodec: 'h264'
      };

      const result = await VideoCompilerService.compileTimeline(
        newClips,
        compilationConfig,
        onExport,
        (progress, stage) => {
          setCompilationProgress(progress);
          setCompilationStage(stage);
        }
      );

      setLastCompilationResult(result);
      setShowVideoPreview(true);
      
      toast({
        title: `${duration}-minute video complete!`,
        description: `Generated and compiled ${newClips.length} clips into a ${duration}-minute video.`,
        action: result.downloadUrl ? (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowVideoPreview(true)}
          >
            Preview
          </Button>
        ) : undefined,
      });

    } catch (error) {
      console.error('Quick randomize error:', error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setIsCompiling(false);
      setGenerationProgress(0);
      setCompilationProgress(0);
      setCompilationStage('');
      setProcessingStage('');
    }
  };

  const handleCancelProcessing = async () => {
    setIsGenerating(false);
    setIsCompiling(false);
    setGenerationProgress(0);
    setCompilationProgress(0);
    setProcessingStage('');
    setCompilationStage('');
    resetProgress();
    
    try {
      await VideoCompilerService.cancelCurrentJob();
      toast({
        title: "Processing cancelled",
        description: "All ongoing processing has been cancelled.",
      });
    } catch (error) {
      console.error("Error cancelling processing:", error);
    }
  };

  const handleCompile = async () => {
    if (timelineClips.length === 0) {
      toast({
        title: "No clips to compile",
        description: "Add clips to the timeline first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCompiling(true);
      setCompilationProgress(0);
      setCompilationStage('Initializing compilation...');
      setLastCompilationResult(undefined);

      const compilationConfig = { 
        totalDuration, 
        clipOrder: timelineClips.map(c => c.id), 
        zoom, 
        playheadPosition,
        preserveAudio: true,
        audioCodec: 'aac',
        videoCodec: 'h264'
      };

      const result = await VideoCompilerService.compileTimeline(
        timelineClips,
        compilationConfig,
        onExport,
        (progress, stage) => {
          setCompilationProgress(progress);
          setCompilationStage(stage);
        }
      );

      setLastCompilationResult(result);
      setShowVideoPreview(true);
      
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
    } finally {
      setIsCompiling(false);
      setCompilationProgress(0);
      setCompilationStage('');
    }
  };

  const currentProgress = isGenerating ? generationProgress : compilationProgress;
  const currentStage = isGenerating ? processingStage : compilationStage;
  const isProcessing = isGenerating || isCompiling;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
        <EditorHeader
          isPlaying={isPlaying}
          isCompiling={isCompiling}
          compilationProgress={compilationProgress}
          compilationStage={compilationStage}
          timelineClipsLength={timelineClips.length}
          onTogglePlayback={togglePlayback}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
          onClearTimeline={handleClearTimeline}
          onExportJSON={handleExportJSON}
          onCompile={handleCompile}
          onDownloadClips={() => {}}
          onOpenSettings={() => setShowSettings(true)}
          lastCompilationResult={lastCompilationResult}
          showVideoPreview={showVideoPreview}
          onCloseVideoPreview={() => setShowVideoPreview(!showVideoPreview)}
        />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Streamlined Sidebar */}
          <div className="w-80 bg-slate-800/50 backdrop-blur-sm border-r border-slate-700/50 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <WorkflowPanel
                sourceVideos={sourceVideos}
                onVideoUpload={handleFilesSelected}
                onBulkUpload={handleFilesSelected}
                onQuickRandomize={handleQuickRandomize}
                onCompile={handleCompile}
                isProcessing={isProcessing}
                processingProgress={currentProgress}
                processingStage={currentStage}
                onCancelProcessing={handleCancelProcessing}
              />

              {/* Generated Clips Pool */}
              {clips.length > 0 && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-slate-200 mb-3">
                    Generated Clips ({clips.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {clips.slice(0, 12).map((clip) => (
                      <div
                        key={clip.id}
                        className="bg-slate-700/50 rounded p-2 text-xs text-slate-300 hover:bg-slate-600/50 cursor-pointer transition-colors"
                        onClick={() => handleAddToTimeline(clip)}
                      >
                        <div className="truncate mb-1">{clip.name}</div>
                        <div className="text-slate-400">{clip.duration}s</div>
                      </div>
                    ))}
                  </div>
                  {clips.length > 12 && (
                    <div className="text-xs text-slate-400 mt-2 text-center">
                      +{clips.length - 12} more clips
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Video Player */}
            <div className="h-1/2 border-b border-slate-700/50">
              <VideoPlayerSection
                timelineClips={timelineClips}
                playheadPosition={playheadPosition}
                isPlaying={isPlaying}
                onTimeUpdate={setPlayheadPosition}
              />
            </div>
            
            {/* Timeline */}
            <div className="flex-1 flex flex-col min-h-0">
              <TimelineMain
                clips={timelineClips}
                totalDuration={totalDuration}
                zoom={zoom}
                playheadPosition={playheadPosition}
                isDragging={isDragging}
                draggedClip={draggedClip}
                onClipDragStart={handleClipDragStart}
                onClipDragEnd={handleClipDragEnd}
                onClipRemove={handleClipRemove}
                onPlayheadMove={setPlayheadPosition}
                onZoomChange={setZoom}
              />
              
              {/* Controls */}
              <div className="border-t border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-4">
                <TimelineControls
                  isPlaying={isPlaying}
                  isCompiling={isCompiling}
                  compilationProgress={compilationProgress}
                  compilationStage={compilationStage}
                  timelineClipsLength={timelineClips.length}
                  onTogglePlayback={togglePlayback}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onReset={handleReset}
                  onClearTimeline={handleClearTimeline}
                  onExportJSON={handleExportJSON}
                  onCompile={handleCompile}
                  onDownloadClips={() => {}}
                  onOpenSettings={() => setShowSettings(true)}
                  lastCompilationResult={lastCompilationResult}
                  showVideoPreview={showVideoPreview}
                  onCloseVideoPreview={() => setShowVideoPreview(!showVideoPreview)}
                />
              </div>
            </div>
          </div>
        </div>

        <StatusBar
          isActive={progress.isActive || isProcessing}
          current={isProcessing ? Math.round(currentProgress) : progress.current}
          total={isProcessing ? 100 : progress.total}
          message={isProcessing ? currentStage : progress.message}
        />

        {showSettings && (
          <SettingsPanel
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
          />
        )}

        {showVideoPreview && lastCompilationResult && (
          <VideoPreview
            downloadUrl={lastCompilationResult.downloadUrl || ''}
            outputFile={lastCompilationResult.outputFile || ''}
            onClose={() => setShowVideoPreview(false)}
          />
        )}

        <Toaster />
      </div>
    </DndProvider>
  );
};

export default TimelineEditor;
