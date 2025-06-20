
import React from 'react';
import TimelineControls from './TimelineControls';

interface EditorHeaderProps {
  isPlaying: boolean;
  isCompiling: boolean;
  compilationProgress: number;
  compilationStage: string;
  timelineClipsLength: number;
  onTogglePlayback: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onClearTimeline: () => void;
  onExportJSON: () => void;
  onCompile: () => void;
  onDownloadClips: () => void;
  onOpenSettings: () => void;
  lastCompilationResult?: { downloadUrl?: string; outputFile?: string };
  showVideoPreview: boolean;
  onCloseVideoPreview: () => void;
}

const EditorHeader: React.FC<EditorHeaderProps> = (props) => {
  return (
    <div className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50 shadow-2xl shrink-0">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">⚡</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Video Editor Pro
            </h1>
            <p className="text-slate-400 text-sm font-medium">Professional video compilation suite</p>
          </div>
        </div>
        <TimelineControls {...props} />
      </div>
    </div>
  );
};

export default EditorHeader;
