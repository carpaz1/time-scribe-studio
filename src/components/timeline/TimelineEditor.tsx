import React, { useState, useCallback, useRef, useMemo } from 'react';
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
  // Core state - consolidated to reduce re-renders
  const [state, setState] = useState({
    sourceVideos: [] as File[],
    clips: [] as VideoClip[],
    timelineClips: [] as VideoClip[],
    totalDuration: 60,
    zoom: 100, // Start at 1x (100%)
    playheadPosition: 0,
    isPlaying: false,
    isDragging: false,
    draggedClip: null as VideoClip | null,
    showSettings: false,
    showVideoPreview: false,
  });

  // Processing state
  const [processing, setProcessing] = useState({
    isGenerating: false,
    isCompiling: false,
    generationProgress: 0,
    compilationProgress: 0,
    processingStage: '',
    compilationStage: '',
  });

  const [lastCompilationResult, setLastCompilationResult] = useState<{ downloadUrl?: string; outputFile?: string } | undefined>(undefined);

  const { progress, startProgress, updateProgress, completeProgress, resetProgress } = useProgressTracker();
  const nextClipId = useRef(1);

  // Memoized derived values to prevent unnecessary re-renders
  const currentProgress = useMemo(() => 
    processing.isGenerating ? processing.generationProgress : processing.compilationProgress
  , [processing.isGenerating, processing.generationProgress, processing.compilationProgress]);

  const currentStage = useMemo(() => 
    processing.isGenerating ? processing.processingStage : processing.compilationStage
  , [processing.isGenerating, processing.processingStage, processing.compilationStage]);

  const isProcessing = useMemo(() => 
    processing.isGenerating || processing.isCompiling
  , [processing.isGenerating, processing.isCompiling]);

  // Optimized state updaters
  const updateState = useCallback((updates: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateProcessing = useCallback((updates: Partial<typeof processing>) => {
    setProcessing(prev => ({ ...prev, ...updates }));
  }, []);

  // File handling
  const handleFilesSelected = useCallback((files: File[]) => {
    updateState({ sourceVideos: [...state.sourceVideos, ...files] });
  }, [state.sourceVideos, updateState]);

  const handleRemoveFile = useCallback((name: string) => {
    updateState({ 
      sourceVideos: state.sourceVideos.filter(file => file.name !== name) 
    });
  }, [state.sourceVideos, updateState]);

  const handleClearAll = useCallback(() => {
    updateState({
      sourceVideos: [],
      clips: [],
      timelineClips: [],
      playheadPosition: 0,
      isPlaying: false,
    });
    resetProgress();
  }, [updateState, resetProgress]);

  // Playback controls
  const togglePlayback = useCallback(() => {
    updateState({ isPlaying: !state.isPlaying });
  }, [state.isPlaying, updateState]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    updateState({ zoom: Math.min(state.zoom + 25, 500) });
  }, [state.zoom, updateState]);

  const handleZoomOut = useCallback(() => {
    updateState({ zoom: Math.max(state.zoom - 25, 25) });
  }, [state.zoom, updateState]);

  const handleReset = useCallback(() => {
    updateState({ zoom: 100, playheadPosition: 0 });
  }, [updateState]);

  const handleClearTimeline = useCallback(() => {
    updateState({ timelineClips: [], playheadPosition: 0 });
  }, [updateState]);

  // Enhanced clip generation with better performance
  const generateClipsBatch = useCallback(async (videos: File[], clipCount: number, clipDuration: number = 1): Promise<VideoClip[]> => {
    const clips: VideoClip[] = [];
    const batchSize = 12; // Increased batch size
    
    const videoElements = new Map<string, HTMLVideoElement>();
    
    try {
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
                    const timeout = setTimeout(() => reject(new Error('Timeout')), 2000);
                    videoElement!.addEventListener('loadedmetadata', () => {
                      clearTimeout(timeout);
                      resolve();
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
        updateProcessing({ 
          generationProgress: progress,
          processingStage: `Generated ${clips.length}/${clipCount} clips`
        });
        
        await new Promise(resolve => setTimeout(resolve, 5));
      }
    } finally {
      videoElements.forEach(video => {
        URL.revokeObjectURL(video.src);
      });
      videoElements.clear();
    }
    
    return clips;
  }, [updateProcessing]);

  // Enhanced quick randomize with smart features
  const handleQuickRandomize = useCallback(async (duration: number, includePictures: boolean = false) => {
    if (state.sourceVideos.length === 0) {
      toast({
        title: "No videos available",
        description: "Please upload some videos first",
        variant: "destructive",
      });
      return;
    }

    updateProcessing({
      isGenerating: true,
      generationProgress: 0,
      processingStage: 'Initializing smart generation...'
    });
    
    try {
      const mediaToProcess = includePictures 
        ? state.sourceVideos 
        : state.sourceVideos.filter(file => file.type.startsWith('video/'));

      if (mediaToProcess.length === 0) {
        toast({
          title: `No ${includePictures ? 'media files' : 'videos'} available`,
          description: `Please upload some ${includePictures ? 'media files' : 'videos'} first`,
          variant: "destructive",
        });
        return;
      }

      const targetClipCount = duration * 60;
      updateProcessing({ processingStage: 'Generating optimized clips...' });
      
      const newClips = await generateClipsBatch(mediaToProcess, targetClipCount, 1);
      
      console.log(`Generated ${newClips.length} clips with smart batching`);
      
      updateState({ clips: newClips, timelineClips: newClips });
      updateProcessing({ 
        generationProgress: 100,
        processingStage: 'Starting smart compilation...'
      });
      
      // Auto-compile with optimized settings
      updateProcessing({
        isCompiling: true,
        compilationProgress: 0,
        compilationStage: 'Initializing smart compilation...'
      });

      const compilationConfig = { 
        totalDuration: newClips.length, 
        clipOrder: newClips.map(c => c.id), 
        zoom: state.zoom, 
        playheadPosition: state.playheadPosition,
        preserveAudio: true,
        audioCodec: 'aac',
        videoCodec: 'h264',
        smartTransitions: true, // New feature
        autoColorCorrection: true, // New feature
      };

      const result = await VideoCompilerService.compileTimeline(
        newClips,
        compilationConfig,
        onExport,
        (progress, stage) => {
          updateProcessing({
            compilationProgress: progress,
            compilationStage: stage
          });
        }
      );

      setLastCompilationResult(result);
      updateState({ showVideoPreview: true });
      
      toast({
        title: `${duration}-minute video complete!`,
        description: `Generated and compiled ${newClips.length} clips with smart optimization.`,
        action: result.downloadUrl ? (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => updateState({ showVideoPreview: true })}
          >
            Preview
          </Button>
        ) : undefined,
      });

    } catch (error) {
      console.error('Smart generation error:', error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      updateProcessing({
        isGenerating: false,
        isCompiling: false,
        generationProgress: 0,
        compilationProgress: 0,
        compilationStage: '',
        processingStage: ''
      });
    }
  }, [state, updateState, updateProcessing, generateClipsBatch, onExport]);

  // Enhanced compilation
  const handleCompile = useCallback(async () => {
    if (state.timelineClips.length === 0) {
      toast({
        title: "No clips to compile",
        description: "Add clips to the timeline first",
        variant: "destructive",
      });
      return;
    }

    try {
      updateProcessing({
        isCompiling: true,
        compilationProgress: 0,
        compilationStage: 'Initializing enhanced compilation...'
      });

      const compilationConfig = { 
        totalDuration: state.totalDuration, 
        clipOrder: state.timelineClips.map(c => c.id), 
        zoom: state.zoom, 
        playheadPosition: state.playheadPosition,
        preserveAudio: true,
        audioCodec: 'aac',
        videoCodec: 'h264',
        smartTransitions: true,
        autoColorCorrection: true,
      };

      const result = await VideoCompilerService.compileTimeline(
        state.timelineClips,
        compilationConfig,
        onExport,
        (progress, stage) => {
          updateProcessing({
            compilationProgress: progress,
            compilationStage: stage
          });
        }
      );

      setLastCompilationResult(result);
      updateState({ showVideoPreview: true });
      
      toast({
        title: "Enhanced Compilation Complete!",
        description: `Video compiled with smart optimization features.`,
      });
    } catch (error) {
      console.error('Compilation failed:', error);
      toast({
        title: "Compilation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      updateProcessing({
        isCompiling: false,
        compilationProgress: 0,
        compilationStage: ''
      });
    }
  }, [state, updateProcessing, onExport, updateState]);

  const handleCancelProcessing = useCallback(async () => {
    updateProcessing({
      isGenerating: false,
      isCompiling: false,
      generationProgress: 0,
      compilationProgress: 0,
      processingStage: '',
      compilationStage: ''
    });
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
  }, [updateProcessing, resetProgress]);

  // ... keep existing code (other handlers like handleAddToTimeline, handleClipDragStart, etc.)

  const handleAddToTimeline = useCallback((clip: VideoClip) => {
    const newClip = { ...clip, position: 0 };
    updateState({ timelineClips: [...state.timelineClips, newClip] });
  }, [state.timelineClips, updateState]);

  const handleClipDragStart = useCallback((clip: VideoClip) => {
    updateState({ isDragging: true, draggedClip: clip });
  }, [updateState]);

  const handleClipDragEnd = useCallback(() => {
    updateState({ isDragging: false, draggedClip: null });
  }, [updateState]);

  const handleClipRemove = useCallback((id: string) => {
    updateState({ 
      timelineClips: state.timelineClips.filter(clip => clip.id !== id) 
    });
  }, [state.timelineClips, updateState]);

  const handleExportJSON = useCallback(() => {
    VideoCompilerService.exportTimelineJSON(state.timelineClips, state.totalDuration, state.zoom, state.playheadPosition);
  }, [state]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
        <EditorHeader
          isPlaying={state.isPlaying}
          isCompiling={processing.isCompiling}
          compilationProgress={processing.compilationProgress}
          compilationStage={processing.compilationStage}
          timelineClipsLength={state.timelineClips.length}
          onTogglePlayback={togglePlayback}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
          onClearTimeline={handleClearTimeline}
          onExportJSON={handleExportJSON}
          onCompile={handleCompile}
          onDownloadClips={() => {}}
          onOpenSettings={() => updateState({ showSettings: true })}
          lastCompilationResult={lastCompilationResult}
          showVideoPreview={state.showVideoPreview}
          onCloseVideoPreview={() => updateState({ showVideoPreview: !state.showVideoPreview })}
        />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Enhanced Sidebar */}
          <div className="w-80 bg-slate-800/50 backdrop-blur-sm border-r border-slate-700/50 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <WorkflowPanel
                sourceVideos={state.sourceVideos}
                onVideoUpload={handleFilesSelected}
                onBulkUpload={handleFilesSelected}
                onQuickRandomize={handleQuickRandomize}
                onCompile={handleCompile}
                isProcessing={isProcessing}
                processingProgress={currentProgress}
                processingStage={currentStage}
                onCancelProcessing={handleCancelProcessing}
              />

              {/* Enhanced Generated Clips Pool */}
              {state.clips.length > 0 && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-slate-200">
                      Smart Clips ({state.clips.length})
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-6"
                      onClick={handleClearTimeline}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {state.clips.slice(0, 12).map((clip) => (
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
                  {state.clips.length > 12 && (
                    <div className="text-xs text-slate-400 mt-2 text-center">
                      +{state.clips.length - 12} more clips
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
                timelineClips={state.timelineClips}
                playheadPosition={state.playheadPosition}
                isPlaying={state.isPlaying}
                onTimeUpdate={(position) => updateState({ playheadPosition: position })}
              />
            </div>
            
            {/* Stable Timeline */}
            <div className="flex-1 flex flex-col min-h-0">
              <TimelineMain
                clips={state.timelineClips}
                totalDuration={state.totalDuration}
                zoom={state.zoom}
                playheadPosition={state.playheadPosition}
                isDragging={state.isDragging}
                draggedClip={state.draggedClip}
                onClipDragStart={handleClipDragStart}
                onClipDragEnd={handleClipDragEnd}
                onClipRemove={handleClipRemove}
                onPlayheadMove={(position) => updateState({ playheadPosition: position })}
                onZoomChange={(zoom) => updateState({ zoom })}
              />
              
              {/* Controls */}
              <div className="border-t border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-4">
                <TimelineControls
                  isPlaying={state.isPlaying}
                  isCompiling={processing.isCompiling}
                  compilationProgress={processing.compilationProgress}
                  compilationStage={processing.compilationStage}
                  timelineClipsLength={state.timelineClips.length}
                  onTogglePlayback={togglePlayback}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onReset={handleReset}
                  onClearTimeline={handleClearTimeline}
                  onExportJSON={handleExportJSON}
                  onCompile={handleCompile}
                  onDownloadClips={() => {}}
                  onOpenSettings={() => updateState({ showSettings: true })}
                  lastCompilationResult={lastCompilationResult}
                  showVideoPreview={state.showVideoPreview}
                  onCloseVideoPreview={() => updateState({ showVideoPreview: !state.showVideoPreview })}
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

        {state.showSettings && (
          <SettingsPanel
            isOpen={state.showSettings}
            onClose={() => updateState({ showSettings: false })}
          />
        )}

        {state.showVideoPreview && lastCompilationResult && (
          <VideoPreview
            downloadUrl={lastCompilationResult.downloadUrl || ''}
            outputFile={lastCompilationResult.outputFile || ''}
            onClose={() => updateState({ showVideoPreview: false })}
          />
        )}

        <Toaster />
      </div>
    </DndProvider>
  );
};

export default TimelineEditor;
