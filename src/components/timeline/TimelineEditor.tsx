import React, { useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Toaster } from "@/components/ui/toaster";
import { CompileRequest } from '@/types/timeline';
import { VideoCompilerService } from '@/services/videoCompiler';
import { useTimelineEditor } from '@/hooks/useTimelineEditor';
import { usePlaybackControls } from '@/hooks/usePlaybackControls';
import { VideoCompilationService } from './VideoCompilationService';
import StreamlinedHeader from './StreamlinedHeader';
import EditorSidebar from './EditorSidebar';
import EditorMainContent from './EditorMainContent';
import StatusBar from './StatusBar';
import SettingsPanel from './SettingsPanel';
import VideoPreview from './VideoPreview';
import CleanVideoPlayer from './CleanVideoPlayer';
import TimelineMain from './TimelineMain';

interface TimelineEditorProps {
  onExport?: (data: CompileRequest) => void;
}

const TimelineEditor: React.FC<TimelineEditorProps> = ({ onExport }) => {
  const {
    state,
    processing,
    lastCompilationResult,
    progress,
    currentProgress,
    currentStage,
    isProcessing,
    updateState,
    updateProcessing,
    setLastCompilationResult,
    resetProgress,
    handleFilesSelected,
    handleRemoveFile,
    handleClearAll,
    handleAddToTimeline,
    handleClipRemove,
    handleClearTimeline,
    handleAIEdit,
    handleAISuggestion,
  } = useTimelineEditor();

  const {
    togglePlayback,
    handleZoomIn,
    handleZoomOut,
    handleReset,
  } = usePlaybackControls({
    isPlaying: state.isPlaying,
    zoom: state.zoom,
    onTogglePlayback: () => updateState({ isPlaying: !state.isPlaying }),
    onZoomChange: (zoom) => updateState({ zoom }),
    onReset: () => updateState({ zoom: 1, playheadPosition: 0 }),
  });

  const handleQuickRandomize = useCallback(async (duration: number, includePictures: boolean = false) => {
    console.log('TimelineEditor: Starting quick randomize with duration:', duration);
    updateProcessing({
      isGenerating: true,
      generationProgress: 0,
      processingStage: 'Initializing smart generation...'
    });
    
    try {
      const result = await VideoCompilationService.quickRandomizeAndCompile(
        state.sourceVideos,
        duration,
        includePictures,
        onExport,
        (progress, stage) => {
          console.log(`TimelineEditor: Progress callback received - ${progress}%, ${stage}`);
          if (stage.includes('Generated')) {
            updateProcessing({ generationProgress: progress, processingStage: stage });
          } else {
            updateProcessing({ 
              isCompiling: true,
              compilationProgress: progress,
              compilationStage: stage
            });
          }
        }
      );

      console.log('TimelineEditor: Quick randomize result:', result);
      if (result) {
        updateState({ 
          clips: result.clips, 
          timelineClips: result.clips,
          totalDuration: result.clips.length // Update total duration to match clip count
        });
        setLastCompilationResult(result.compilationResult);
        updateState({ showVideoPreview: true });
        console.log('TimelineEditor: Updated state with compilation result');
      }

    } catch (error) {
      console.error('TimelineEditor: Smart generation error:', error);
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
  }, [state.sourceVideos, updateState, updateProcessing, onExport, setLastCompilationResult]);

  const handleGenerateClips = useCallback(async (duration: number) => {
    console.log('TimelineEditor: Generating clips for EXACT duration:', duration);
    updateProcessing({
      isGenerating: true,
      generationProgress: 0,
      processingStage: 'Generating exact clip count...'
    });
    
    try {
      const clips = await VideoCompilationService.generateClipsFromVideos(
        state.sourceVideos,
        duration,
        3,
        1, // 1 second clips for exact timing
        (progress, stage) => {
          console.log(`TimelineEditor: Clip generation progress - ${progress}%, ${stage}`);
          updateProcessing({ generationProgress: progress, processingStage: stage });
        }
      );

      console.log('TimelineEditor: Generated EXACT clips:', clips.length, 'for duration:', duration);
      
      updateState({ 
        clips, 
        timelineClips: clips,
        totalDuration: duration // Keep original target duration
      });
      
      console.log('TimelineEditor: Updated timeline with EXACT', clips.length, 'clips');

    } catch (error) {
      console.error('TimelineEditor: Clip generation error:', error);
    } finally {
      updateProcessing({
        isGenerating: false,
        generationProgress: 0,
        processingStage: ''
      });
    }
  }, [state.sourceVideos, updateState, updateProcessing]);

  const handleCompile = useCallback(async () => {
    console.log('TimelineEditor: Starting compilation with clips:', state.timelineClips.length);
    updateProcessing({
      isCompiling: true,
      compilationProgress: 0,
      compilationStage: 'Initializing enhanced compilation...'
    });

    try {
      const result = await VideoCompilationService.compileTimeline(
        state.timelineClips,
        {
          totalDuration: state.totalDuration,
          zoom: state.zoom,
          playheadPosition: state.playheadPosition,
        },
        onExport,
        (progress, stage) => {
          console.log(`TimelineEditor: Compilation progress - ${progress}%, ${stage}`);
          updateProcessing({
            compilationProgress: progress,
            compilationStage: stage
          });
        }
      );

      console.log('TimelineEditor: Compilation result:', result);
      if (result) {
        setLastCompilationResult(result);
        updateState({ showVideoPreview: true });
      }
    } catch (error) {
      console.error('TimelineEditor: Compilation error:', error);
    } finally {
      updateProcessing({
        isCompiling: false,
        compilationProgress: 0,
        compilationStage: ''
      });
    }
  }, [state, updateProcessing, onExport, setLastCompilationResult, updateState]);

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
    } catch (error) {
      console.error("Error cancelling processing:", error);
    }
  }, [updateProcessing, resetProgress]);

  const handleClipDragStart = useCallback((clip) => {
    updateState({ isDragging: true, draggedClip: clip });
  }, [updateState]);

  const handleClipDragEnd = useCallback(() => {
    updateState({ isDragging: false, draggedClip: null });
  }, [updateState]);

  const handleExportJSON = useCallback(() => {
    VideoCompilerService.exportTimelineJSON(state.timelineClips, state.totalDuration, state.zoom, state.playheadPosition);
  }, [state]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-transparent">
        <StreamlinedHeader
          isPlaying={state.isPlaying}
          isCompiling={processing.isCompiling}
          compilationProgress={processing.compilationProgress}
          compilationStage={processing.compilationStage}
          timelineClipsLength={state.timelineClips.length}
          onTogglePlayback={togglePlayback}
          onCompile={handleCompile}
          onOpenSettings={() => updateState({ showSettings: true })}
          lastCompilationResult={lastCompilationResult}
          showVideoPreview={state.showVideoPreview}
          onCloseVideoPreview={() => updateState({ showVideoPreview: !state.showVideoPreview })}
          onExportJSON={() => VideoCompilerService.exportTimelineJSON(state.timelineClips, state.totalDuration, state.zoom, state.playheadPosition)}
          onDownloadClips={() => {}}
          onClearTimeline={handleClearTimeline}
        />
        
        <div className="flex flex-1 overflow-hidden bg-slate-900/20 backdrop-blur-sm">
          <EditorSidebar
            sourceVideos={state.sourceVideos}
            clips={state.clips}
            timelineClips={state.timelineClips}
            isProcessing={isProcessing}
            currentProgress={currentProgress}
            currentStage={currentStage}
            onVideoUpload={handleFilesSelected}
            onGenerateClips={handleGenerateClips}
            onQuickRandomize={handleQuickRandomize}
            onCompile={handleCompile}
            onCancelProcessing={async () => {
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
              } catch (error) {
                console.error("Error cancelling processing:", error);
              }
            }}
            onAddToTimeline={handleAddToTimeline}
            onClearTimeline={handleClearTimeline}
            onAISuggestion={handleAISuggestion}
            onAIEdit={handleAIEdit}
          />

          {/* Use simplified main content without duplicate controls */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-1/2 border-b border-slate-700/50">
              <div className="w-full h-full bg-black relative">
                <CleanVideoPlayer
                  clips={state.timelineClips}
                  currentTime={state.playheadPosition}
                  isPlaying={state.isPlaying}
                  onTimeUpdate={(position) => updateState({ playheadPosition: position })}
                />
              </div>
            </div>
            
            <div className="flex-1 flex flex-col min-h-0">
              <TimelineMain
                clips={state.timelineClips}
                totalDuration={state.totalDuration}
                zoom={state.zoom}
                playheadPosition={state.playheadPosition}
                isDragging={state.isDragging}
                draggedClip={state.draggedClip}
                onClipDragStart={(clip) => updateState({ isDragging: true, draggedClip: clip })}
                onClipDragEnd={() => updateState({ isDragging: false, draggedClip: null })}
                onClipRemove={handleClipRemove}
                onPlayheadMove={(position) => updateState({ playheadPosition: position })}
                onZoomChange={(zoom) => updateState({ zoom })}
              />
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
