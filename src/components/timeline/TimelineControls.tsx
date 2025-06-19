
import React from 'react';
import { Play, Pause, ZoomIn, ZoomOut, Upload, Download, RotateCcw, ExternalLink, Trash2, Square, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface TimelineControlsProps {
  isPlaying: boolean;
  isCompiling: boolean;
  compilationProgress?: number;
  compilationStage?: string;
  timelineClipsLength: number;
  onTogglePlayback: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onClearTimeline: () => void;
  onExportJSON: () => void;
  onCompile: () => void;
  onDownloadClips: () => void;
  lastCompilationResult?: { downloadUrl?: string; outputFile?: string };
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
  isPlaying,
  isCompiling,
  compilationProgress = 0,
  compilationStage = '',
  timelineClipsLength,
  onTogglePlayback,
  onZoomIn,
  onZoomOut,
  onReset,
  onClearTimeline,
  onExportJSON,
  onCompile,
  onDownloadClips,
  lastCompilationResult,
}) => {
  const handleDownload = () => {
    if (lastCompilationResult?.downloadUrl) {
      window.open(`http://localhost:4000${lastCompilationResult.downloadUrl}`, '_blank');
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Playback Controls */}
      <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onTogglePlayback}
          className="bg-slate-600/50 hover:bg-slate-500/50 text-white border-0 h-9 px-4"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span className="ml-2">{isPlaying ? 'Pause' : 'Play'}</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (isPlaying) onTogglePlayback();
          }}
          className="hover:bg-slate-600/50 text-slate-300 hover:text-white border-0 h-9 w-9"
        >
          <Square className="w-4 h-4" />
        </Button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomOut}
          className="hover:bg-slate-600/50 text-slate-300 hover:text-white border-0 h-9 w-9"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomIn}
          className="hover:bg-slate-600/50 text-slate-300 hover:text-white border-0 h-9 w-9"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>

      {/* Timeline Management */}
      <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearTimeline}
          disabled={timelineClipsLength === 0}
          className="hover:bg-slate-600/50 text-slate-300 hover:text-white border-0 h-9 px-3"
        >
          <Trash2 className="w-4 h-4" />
          <span className="ml-2">Clear</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="hover:bg-slate-600/50 text-slate-300 hover:text-white border-0 h-9 px-3"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="ml-2">Reset</span>
        </Button>
      </div>

      {/* Download Options */}
      <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownloadClips}
          disabled={timelineClipsLength === 0}
          className="hover:bg-slate-600/50 text-slate-300 hover:text-white border-0 h-9 px-3"
        >
          <Archive className="w-4 h-4" />
          <span className="ml-2">Download ZIP</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onExportJSON}
          className="hover:bg-slate-600/50 text-slate-300 hover:text-white border-0 h-9 px-3"
        >
          <Download className="w-4 h-4" />
          <span className="ml-2">Export JSON</span>
        </Button>
      </div>

      {/* COMPILE BUTTON - Made more prominent */}
      <Button
        onClick={onCompile}
        disabled={isCompiling || timelineClipsLength === 0}
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 h-10 px-6 text-base font-semibold"
      >
        <Upload className="w-5 h-5 mr-2" />
        {isCompiling ? 'Compiling...' : 'Compile Video'}
      </Button>

      {/* Download Compiled Video Button */}
      {lastCompilationResult?.downloadUrl && (
        <Button
          onClick={handleDownload}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 h-10 px-6 text-base font-semibold"
        >
          <ExternalLink className="w-5 h-5 mr-2" />
          Download Video
        </Button>
      )}

      {/* Enhanced Progress Indicator */}
      {isCompiling && (
        <div className="flex items-center gap-3 bg-slate-700/50 rounded-lg p-3 min-w-[300px]">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-300 font-medium">
                {compilationStage || 'Processing...'}
              </span>
              <span className="text-sm text-slate-300 font-semibold">{Math.round(compilationProgress)}%</span>
            </div>
            <Progress 
              value={compilationProgress} 
              className="h-3 bg-slate-600"
            />
            <div className="text-xs text-slate-400 mt-1">
              Optimized GPU acceleration • Real-time progress
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineControls;
