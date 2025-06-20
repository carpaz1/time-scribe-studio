
import React from 'react';
import { Info, Settings2, Video, Clock, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ConfigurationStepProps {
  config: any;
  sourceVideosCount: number;
  onConfigChange: (config: any) => void;
}

const ConfigurationStep: React.FC<ConfigurationStepProps> = ({
  config,
  sourceVideosCount,
  onConfigChange,
}) => {
  const handleConfigUpdate = (key: string, value: any) => {
    onConfigChange({
      ...config,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-blue-200 flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            Configuration Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-blue-200 space-y-3">
          <p className="leading-relaxed">
            Configure how clips are generated from your videos.
          </p>
          
          <div className="bg-blue-500/10 rounded-lg p-3 space-y-2">
            <div className="font-medium text-blue-100 mb-2 text-xs">Current Settings:</div>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-blue-200">Videos available:</span>
                <span className="font-mono text-blue-100 bg-blue-500/20 px-2 py-1 rounded text-xs">
                  {sourceVideosCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-200">Clips per video:</span>
                <span className="font-mono text-blue-100 bg-blue-500/20 px-2 py-1 rounded text-xs">
                  {config.numClips}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-200">Clip duration:</span>
                <span className="font-mono text-blue-100 bg-blue-500/20 px-2 py-1 rounded text-xs">
                  {config.clipDuration}s
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-200">Selection mode:</span>
                <span className="font-mono text-blue-100 bg-blue-500/20 px-2 py-1 rounded text-xs">
                  {config.videoSelectionMode === 'all' ? 'All videos' : `${config.numVideos} videos`}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Controls */}
      <Card className="bg-slate-700/30 border-slate-600">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-slate-200 flex items-center gap-2">
            <Settings2 className="w-4 h-4 flex-shrink-0" />
            Generation Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Video Selection Mode */}
          <div className="space-y-3">
            <Label className="text-xs text-slate-300 flex items-center gap-2 font-medium">
              <Video className="w-3 h-3" />
              Video Selection Mode
            </Label>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant={config.videoSelectionMode === 'all' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs font-medium justify-start"
                onClick={() => handleConfigUpdate('videoSelectionMode', 'all')}
              >
                Use All Videos ({sourceVideosCount})
              </Button>
              <Button
                variant={config.videoSelectionMode === 'specific' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs font-medium justify-start"
                onClick={() => handleConfigUpdate('videoSelectionMode', 'specific')}
              >
                Select Specific Count
              </Button>
            </div>
          </div>

          {/* Number of Videos (if specific mode) */}
          {config.videoSelectionMode === 'specific' && (
            <div className="space-y-3">
              <Label className="text-xs text-slate-300 font-medium">
                Number of Videos to Process
              </Label>
              <div className="space-y-2">
                <Input
                  type="number"
                  min={1}
                  max={sourceVideosCount}
                  value={config.numVideos}
                  onChange={(e) => handleConfigUpdate('numVideos', parseInt(e.target.value) || 1)}
                  className="h-8 text-xs bg-slate-800/50 border-slate-600 text-white"
                  placeholder="Enter number of videos"
                />
                <div className="text-xs text-slate-400 bg-slate-800/30 p-2 rounded">
                  Available: {sourceVideosCount} videos in your library
                </div>
              </div>
            </div>
          )}

          {/* Clips per Video */}
          <div className="space-y-3">
            <Label className="text-xs text-slate-300 flex items-center gap-2 font-medium">
              <Hash className="w-3 h-3" />
              Clips per Video
            </Label>
            <div className="space-y-2">
              <Input
                type="number"
                min={1}
                max={10}
                value={config.numClips}
                onChange={(e) => handleConfigUpdate('numClips', parseInt(e.target.value) || 1)}
                className="h-8 text-xs bg-slate-800/50 border-slate-600 text-white"
                placeholder="Enter number of clips"
              />
              <div className="text-xs text-slate-400 bg-slate-800/30 p-2 rounded">
                Recommended: 1-5 clips per video for optimal performance
              </div>
            </div>
          </div>

          {/* Clip Duration */}
          <div className="space-y-3">
            <Label className="text-xs text-slate-300 flex items-center gap-2 font-medium">
              <Clock className="w-3 h-3" />
              Clip Duration (seconds)
            </Label>
            <div className="space-y-2">
              <Input
                type="number"
                min={1}
                max={30}
                value={config.clipDuration}
                onChange={(e) => handleConfigUpdate('clipDuration', parseInt(e.target.value) || 1)}
                className="h-8 text-xs bg-slate-800/50 border-slate-600 text-white"
                placeholder="Enter duration in seconds"
              />
              <div className="text-xs text-slate-400 bg-slate-800/30 p-2 rounded">
                Recommended: 3-10 seconds for short-form content
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-emerald-500/10 border-emerald-500/30">
        <CardContent className="p-4">
          <div className="text-xs text-emerald-200 space-y-3">
            <div className="font-medium text-emerald-100 mb-3 text-xs flex items-center gap-2">
              <Hash className="w-3 h-3" />
              Generation Summary
            </div>
            
            <div className="bg-emerald-500/10 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-emerald-200">Total clips to generate:</span>
                <span className="font-mono text-emerald-100 bg-emerald-500/20 px-2 py-1 rounded font-bold text-xs">
                  {config.videoSelectionMode === 'all' 
                    ? sourceVideosCount * config.numClips
                    : config.numVideos * config.numClips
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-200">Total estimated duration:</span>
                <span className="font-mono text-emerald-100 bg-emerald-500/20 px-2 py-1 rounded font-bold text-xs">
                  ~{Math.round((config.videoSelectionMode === 'all' 
                    ? sourceVideosCount * config.numClips
                    : config.numVideos * config.numClips
                  ) * config.clipDuration / 60 * 10) / 10} minutes
                </span>
              </div>
            </div>
            
            <div className="text-xs text-emerald-300 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
              💡 <strong>Next step:</strong> Go to the Generate tab to create clips with these settings
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigurationStep;
