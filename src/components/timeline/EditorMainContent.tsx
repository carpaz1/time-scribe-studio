
import React from 'react';
import { VideoClip } from '@/types/timeline';
import VideoPlayerSection from './VideoPlayerSection';
import TimelineMain from './TimelineMain';
import TimelineControls from './TimelineControls';

interface EditorMainContentProps {
  timelineClips: VideoClip[];
  totalDuration: number;
  zoom: number;
  playheadPosition: number;
  isPlaying: boolean;
  isDragging: boolean;
  draggedClip: VideoClip | null;
  isCompiling: boolean;
  compilationProgress: number;
  compilationStage: string;
  lastCompilationResult?: { downloadUrl?: string; outputFile?: string };
  showVideoPreview: boolean;
  onTimeUpdate: (position: number) => void;
  onClipDragStart: (clip: VideoClip) => void;
  onClipDragEnd: () => void;
  onClipRemove: (id: string) => void;
  onPlayheadMove: (position: number) => void;
  onZoomChange: (zoom: number) => void;
  onTogglePlayback: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onClearTimeline: () => void;
  onExportJSON: () => void;
  onCompile: () => void;
  onDownloadClips: () => void;
  onOpenSettings: () => void;
  onCloseVideoPreview: () => void;
}

const EditorMainContent: React.FC<EditorMainContentProps> = ({
  timelineClips,
  totalDuration,
  zoom,
  playheadPosition,
  isPlaying,
  isDragging,
  draggedClip,
  isCompiling,
  compilationProgress,
  compilationStage,
  lastCompilationResult,
  showVideoPreview,
  onTimeUpdate,
  onClipDragStart,
  onClipDragEnd,
  onClipRemove,
  onPlayheadMove,
  onZoomChange,
  onTogglePlayback,
  onZoomIn,
  onZoomOut,
  onReset,
  onClearTimeline,
  onExportJSON,
  onCompile,
  onDownloadClips,
  onOpenSettings,
  onCloseVideoPreview,
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Video Player */}
      <div className="h-1/2 border-b border-slate-700/50">
        <VideoPlayerSection
          timelineClips={timelineClips}
          playheadPosition={playheadPosition}
          isPlaying={isPlaying}
          onTimeUpdate={onTimeUpdate}
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
          onClipDragStart={onClipDragStart}
          onClipDragEnd={onClipDragEnd}
          onClipRemove={onClipRemove}
          onPlayheadMove={onPlayheadMove}
          onZoomChange={onZoomChange}
        />
        
        {/* Controls */}
        <div className="border-t border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-4">
          <TimelineControls
            isPlaying={isPlaying}
            isCompiling={isCompiling}
            compilationProgress={compilationProgress}
            compilationStage={compilationStage}
            timelineClipsLength={timelineClips.length}
            onTogglePlayback={onTogglePlayback}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onReset={onReset}
            onClearTimeline={onClearTimeline}
            onExportJSON={onExportJSON}
            onCompile={onCompile}
            onDownloadClips={onDownloadClips}
            onOpenSettings={onOpenSettings}
            lastCompilationResult={lastCompilationResult}
            showVideoPreview={showVideoPreview}
            onCloseVideoPreview={onCloseVideoPreview}
          />
        </div>
      </div>
    </div>
  );
};

export default EditorMainContent;
