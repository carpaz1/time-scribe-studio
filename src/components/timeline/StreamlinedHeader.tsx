
import React from 'react';
import { Play, Pause, Upload, Download, Settings, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface StreamlinedHeaderProps {
  isPlaying: boolean;
  isCompiling: boolean;
  compilationProgress: number;
  compilationStage: string;
  timelineClipsLength: number;
  onTogglePlayback: () => void;
  onCompile: () => void;
  onOpenSettings: () => void;
  lastCompilationResult?: { downloadUrl?: string; outputFile?: string };
  showVideoPreview: boolean;
  onCloseVideoPreview: () => void;
  onExportJSON: () => void;
  onDownloadClips: () => void;
  onClearTimeline: () => void;
}

const StreamlinedHeader: React.FC<StreamlinedHeaderProps> = ({
  isPlaying,
  isCompiling,
  compilationProgress,
  compilationStage,
  timelineClipsLength,
  onTogglePlayback,
  onCompile,
  onOpenSettings,
  lastCompilationResult,
  showVideoPreview,
  onCloseVideoPreview,
  onExportJSON,
  onDownloadClips,
  onClearTimeline,
}) => {
  const handleDownload = () => {
    if (lastCompilationResult?.downloadUrl) {
      const link = document.createElement('a');
      link.href = `http://localhost:4000${lastCompilationResult.downloadUrl}`;
      link.download = lastCompilationResult.outputFile || 'compiled-video.webm';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-slate-800/90 backdrop-blur-md border-b border-slate-700/50 shadow-xl shrink-0">
      <div className="flex items-center justify-between p-4">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Video Editor Pro
            </h1>
            <p className="text-slate-400 text-xs">AI-Powered Compilation Suite</p>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center gap-4">
          {/* Playback Control */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onTogglePlayback}
            className="bg-slate-700/50 hover:bg-slate-600/50 text-white h-10 px-4"
          >
            {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>

          {/* Tools Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="bg-slate-700/50 hover:bg-slate-600/50 text-white h-10 px-4"
              >
                <Settings className="w-4 h-4 mr-2" />
                Tools
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
              <DropdownMenuItem onClick={onExportJSON} className="hover:bg-slate-700">
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDownloadClips} disabled={timelineClipsLength === 0} className="hover:bg-slate-700">
                <Download className="w-4 h-4 mr-2" />
                Download ZIP
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem onClick={onClearTimeline} disabled={timelineClipsLength === 0} className="hover:bg-slate-700 text-red-400">
                Clear Timeline
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenSettings} className="hover:bg-slate-700">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Compile Button */}
          <Button
            onClick={onCompile}
            disabled={isCompiling || timelineClipsLength === 0}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg h-10 px-6 font-semibold"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isCompiling ? 'Compiling...' : 'Compile'}
          </Button>

          {/* Download Result */}
          {lastCompilationResult?.downloadUrl && !isCompiling && (
            <div className="flex gap-2">
              <Button
                onClick={() => onCloseVideoPreview()}
                className="bg-purple-600 hover:bg-purple-700 text-white h-10 px-4 font-semibold"
              >
                Preview
              </Button>
              <Button
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700 text-white h-10 px-4 font-semibold animate-pulse"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isCompiling && compilationProgress > 0 && (
        <div className="px-4 pb-3">
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300 font-medium">
                {compilationStage || 'Processing...'}
              </span>
              <span className="text-sm text-slate-300 font-semibold">{Math.round(compilationProgress)}%</span>
            </div>
            <Progress 
              value={compilationProgress} 
              className="h-2 bg-slate-600"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamlinedHeader;
