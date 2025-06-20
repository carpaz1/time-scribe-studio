
import { useState, useCallback, useRef, useMemo } from 'react';
import { VideoClip } from '@/types/timeline';
import { useProgressTracker } from '@/hooks/useProgressTracker';
import { toast } from "@/hooks/use-toast";

interface TimelineEditorState {
  sourceVideos: File[];
  clips: VideoClip[];
  timelineClips: VideoClip[];
  totalDuration: number;
  zoom: number;
  playheadPosition: number;
  isPlaying: boolean;
  isDragging: boolean;
  draggedClip: VideoClip | null;
  showSettings: boolean;
  showVideoPreview: boolean;
}

interface ProcessingState {
  isGenerating: boolean;
  isCompiling: boolean;
  generationProgress: number;
  compilationProgress: number;
  processingStage: string;
  compilationStage: string;
}

export const useTimelineEditor = () => {
  const [state, setState] = useState<TimelineEditorState>({
    sourceVideos: [],
    clips: [],
    timelineClips: [],
    totalDuration: 60,
    zoom: 1,
    playheadPosition: 0,
    isPlaying: false,
    isDragging: false,
    draggedClip: null,
    showSettings: false,
    showVideoPreview: false,
  });

  const [processing, setProcessing] = useState<ProcessingState>({
    isGenerating: false,
    isCompiling: false,
    generationProgress: 0,
    compilationProgress: 0,
    processingStage: '',
    compilationStage: '',
  });

  const [lastCompilationResult, setLastCompilationResult] = useState<{ downloadUrl?: string; outputFile?: string } | undefined>(undefined);
  const { progress, startProgress, updateProgress, completeProgress, resetProgress } = useProgressTracker();

  // Memoized derived values
  const currentProgress = useMemo(() => 
    processing.isGenerating ? processing.generationProgress : processing.compilationProgress
  , [processing.isGenerating, processing.generationProgress, processing.compilationProgress]);

  const currentStage = useMemo(() => 
    processing.isGenerating ? processing.processingStage : processing.compilationStage
  , [processing.isGenerating, processing.processingStage, processing.compilationStage]);

  const isProcessing = useMemo(() => 
    processing.isGenerating || processing.isCompiling
  , [processing.isGenerating, processing.isCompiling]);

  // State updaters
  const updateState = useCallback((updates: Partial<TimelineEditorState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateProcessing = useCallback((updates: Partial<ProcessingState>) => {
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

  // Timeline actions
  const handleAddToTimeline = useCallback((clip: VideoClip) => {
    const newClip = { ...clip, position: 0 };
    updateState({ timelineClips: [...state.timelineClips, newClip] });
  }, [state.timelineClips, updateState]);

  const handleClipRemove = useCallback((id: string) => {
    updateState({ 
      timelineClips: state.timelineClips.filter(clip => clip.id !== id) 
    });
  }, [state.timelineClips, updateState]);

  const handleClearTimeline = useCallback(() => {
    updateState({ timelineClips: [], playheadPosition: 0 });
  }, [updateState]);

  // AI editing
  const handleAIEdit = useCallback((newClips: VideoClip[]) => {
    let currentPosition = 0;
    const repositionedClips = newClips.map(clip => {
      const newClip = { ...clip, position: currentPosition };
      currentPosition += clip.duration;
      return newClip;
    });
    
    updateState({ timelineClips: repositionedClips });
  }, [updateState]);

  const handleAISuggestion = useCallback((suggestion: string) => {
    console.log('AI Suggestion applied:', suggestion);
  }, []);

  return {
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
  };
};
