import React, { useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Toaster } from "@/components/ui/toaster";
import { CompileRequest } from '@/types/timeline';
import { VideoCompilerService } from '@/services/videoCompiler';
import { useTimelineEditor } from '@/hooks/useTimelineEditor';
import { usePlaybackControls } from '@/hooks/usePlaybackControls';
import { VideoCompilationService } from './VideoCompilationService';
import EditorHeader from './EditorHeader';
import EditorSidebar from './EditorSidebar';
import EditorMainContent from './EditorMainContent';
import StatusBar from './StatusBar';
import SettingsPanel from './SettingsPanel';
import VideoPreview from './VideoPreview';

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

  // Enhanced quick randomize with smart features
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
        updateState({ clips: result.clips, timelineClips: result.clips });
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
    console.log('TimelineEditor: Generating clips for duration:', duration);
    updateProcessing({
      isGenerating: true,
      generationProgress: 0,
      processingStage: 'Generating clips...'
    });
    
    try {
      const clips = await VideoCompilationService.generateClipsFromVideos(
        state.sourceVideos,
        duration,
        3,
        5,
        (progress, stage) => {
          console.log(`TimelineEditor: Clip generation progress - ${progress}%, ${stage}`);
          updateProcessing({ generationProgress: progress, processingStage: stage });
        }
      );

      console.log('TimelineEditor: Generated clips:', clips);
      updateState({ clips, timelineClips: clips });

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

  // Enhanced compilation
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
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 custom-background">
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
            onCancelProcessing={handleCancelProcessing}
            onAddToTimeline={handleAddToTimeline}
            onClearTimeline={handleClearTimeline}
            onAISuggestion={handleAISuggestion}
            onAIEdit={handleAIEdit}
          />

          <EditorMainContent
            timelineClips={state.timelineClips}
            totalDuration={state.totalDuration}
            zoom={state.zoom}
            playheadPosition={state.playheadPosition}
            isPlaying={state.isPlaying}
            isDragging={state.isDragging}
            draggedClip={state.draggedClip}
            isCompiling={processing.isCompiling}
            compilationProgress={processing.compilationProgress}
            compilationStage={processing.compilationStage}
            lastCompilationResult={lastCompilationResult}
            showVideoPreview={state.showVideoPreview}
            onTimeUpdate={(position) => updateState({ playheadPosition: position })}
            onClipDragStart={handleClipDragStart}
            onClipDragEnd={handleClipDragEnd}
            onClipRemove={handleClipRemove}
            onPlayheadMove={(position) => updateState({ playheadPosition: position })}
            onZoomChange={(zoom) => updateState({ zoom })}
            onTogglePlayback={togglePlayback}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleReset}
            onClearTimeline={handleClearTimeline}
            onExportJSON={handleExportJSON}
            onCompile={handleCompile}
            onDownloadClips={() => {}}
            onOpenSettings={() => updateState({ showSettings: true })}
            onCloseVideoPreview={() => updateState({ showVideoPreview: !state.showVideoPreview })}
          />
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
