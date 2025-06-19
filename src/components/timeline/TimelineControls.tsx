import React from 'react';
import { Play, Pause, ZoomIn, ZoomOut, Upload, Download, RotateCcw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimelineControlsProps {
  isPlaying: boolean;
  isCompiling: boolean;
  timelineClipsLength: number;
  onTogglePlayback: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
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
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onTogglePlayback}
        className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        <span className="ml-2">{isPlaying ? 'Pause' : 'Play'}</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onZoomOut}
        className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onZoomIn}
        className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
      >
        <RotateCcw className="w-4 h-4" />
        <span className="ml-2">Reset</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onExportJSON}
        className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
      >
        <Download className="w-4 h-4" />
        <span className="ml-2">Export JSON</span>
      </Button>
      <Button
        onClick={onCompile}
        disabled={isCompiling || timelineClipsLength === 0}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Upload className="w-4 h-4" />
        <span className="ml-2">
          {isCompiling ? 'Compiling...' : 'Compile'}
        </span>
      </Button>
      {lastCompilationResult?.downloadUrl && (
        <Button
          onClick={handleDownload}
          className="bg-green-600 hover:bg-green-700"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="ml-2">Download Video</span>
        </Button>
      )}
    </div>
  );
};

export default TimelineControls;
