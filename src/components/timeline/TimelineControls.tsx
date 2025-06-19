
import React from 'react';
import { Play, Pause, ZoomIn, ZoomOut, Upload, Download, RotateCcw, ExternalLink, Trash2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimelineControlsProps {
  isPlaying: boolean;
  isCompiling: boolean;
  timelineClipsLength: number;
  onTogglePlayback: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onClearTimeline: () => void;
  onExportJSON: () => void;
  onCompile: () => void;
  lastCompilationResult?: { downloadUrl?: string; outputFile?: string };
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
  isPlaying,
  isCompiling,
  timelineClipsLength,
  onTogglePlayback,
  onZoomIn,
  onZoomOut,
  onReset,
  onClearTimeline,
  onExportJSON,
  onCompile,
  lastCompilationResult,
}) => {
  const handleDownload = () => {
    if (lastCompilationResult?.downloadUrl) {
      window.open(`http://localhost:4000${lastCompilationResult.downloadUrl}`, '_blank');
    }
  };

  return (
    <div className="flex items-center gap-3">
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

      {/* Timeline Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearTimeline}
          disabled={timelineClipsLength === 0}
          className="bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white border-0 h-9"
        >
          <Trash2 className="w-4 h-4" />
          <span className="ml-2">Clear</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white border-0 h-9"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="ml-2">Reset All</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onExportJSON}
          className="bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white border-0 h-9"
        >
          <Download className="w-4 h-4" />
          <span className="ml-2">Export JSON</span>
        </Button>
      </div>

      {/* Primary Actions */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onCompile}
          disabled={isCompiling || timelineClipsLength === 0}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 h-9"
        >
          <Upload className="w-4 h-4" />
          <span className="ml-2">
            {isCompiling ? 'Compiling...' : 'Export Video'}
          </span>
        </Button>
        
        {lastCompilationResult?.downloadUrl && (
          <Button
            onClick={handleDownload}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 h-9"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="ml-2">Download Video</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default TimelineControls;
