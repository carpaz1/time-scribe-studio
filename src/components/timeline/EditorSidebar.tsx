
import React from 'react';
import { VideoClip } from '@/types/timeline';
import ImprovedWorkflowPanel from './ImprovedWorkflowPanel';
import AIAssistant from './AIAssistant';
import ClipsLibrary from './ClipsLibrary';
import RandomBackgroundButton from './RandomBackgroundButton';

interface EditorSidebarProps {
  sourceVideos: File[];
  clips: VideoClip[];
  timelineClips: VideoClip[];
  isProcessing: boolean;
  currentProgress: number;
  currentStage: string;
  onVideoUpload: (files: File[]) => void;
  onGenerateClips: (duration: number) => void;
  onQuickRandomize: (duration: number, includePictures?: boolean) => void;
  onCompile: () => void;
  onCancelProcessing: () => void;
  onAddToTimeline: (clip: VideoClip) => void;
  onClearTimeline: () => void;
  onAISuggestion: (suggestion: string) => void;
  onAIEdit: (clips: VideoClip[]) => void;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({
  sourceVideos,
  clips,
  timelineClips,
  isProcessing,
  currentProgress,
  currentStage,
  onVideoUpload,
  onGenerateClips,
  onQuickRandomize,
  onCompile,
  onCancelProcessing,
  onAddToTimeline,
  onClearTimeline,
  onAISuggestion,
  onAIEdit,
}) => {
  const handleQuickRandomize = async (duration: number, includePictures?: boolean) => {
    onQuickRandomize(duration, includePictures);
  };

  const handleCancelProcessing = async () => {
    onCancelProcessing();
  };

  return (
    <div className="w-80 bg-slate-800/50 backdrop-blur-sm border-r border-slate-700/50 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <ImprovedWorkflowPanel
          sourceVideos={sourceVideos}
          timelineClips={timelineClips}
          onVideoUpload={onVideoUpload}
          onGenerateClips={onGenerateClips}
          onQuickRandomize={handleQuickRandomize}
          onCompile={onCompile}
          isProcessing={isProcessing}
          processingProgress={currentProgress}
          processingStage={currentStage}
          onCancelProcessing={handleCancelProcessing}
        />

        {/* Simple Random Background Control */}
        <div className="flex justify-center">
          <RandomBackgroundButton />
        </div>

        <AIAssistant
          clips={clips}
          onApplySuggestion={onAISuggestion}
          onApplyEdit={onAIEdit}
        />

        <ClipsLibrary
          clips={clips}
          onAddToTimeline={onAddToTimeline}
          onClearTimeline={onClearTimeline}
        />
      </div>
    </div>
  );
};

export default EditorSidebar;
