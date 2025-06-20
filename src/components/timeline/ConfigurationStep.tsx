
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
    <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
      {/* Info Card */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-blue-300 flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            Configuration Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-blue-200 space-y-3">
          <p className="leading-relaxed">
            Configure clip generation parameters. These settings determine how many clips are created and their duration.
          </p>
          
          <div className="bg-blue-500/10 rounded-lg p-3 space-y-2">
            <div className="font-medium text-blue-100 mb-2">Current Settings:</div>
            <div className="grid grid-cols-1 gap-1 text-xs">
              <div className="flex justify-between">
                <span>Videos available:</span>
                <span className="font-mono text-blue-100">{sourceVideosCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Clips per video:</span>
                <span className="font-mono text-blue-100">{config.numClips}</span>
              </div>
              <div className="flex justify-between">
                <span>Clip duration:</span>
                <span className="font-mono text-blue-100">{config.clipDuration}s</span>
              </div>
              <div className="flex justify-between">
                <span>Selection mode:</span>
                <span className="font-mono text-blue-100">
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
        <CardContent className="space-y-4">
          {/* Video Selection Mode */}
          <div className="space-y-2">
            <Label className="text-xs text-slate-300 flex items-center gap-2">
              <Video className="w-3 h-3" />
              Video Selection
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={config.videoSelectionMode === 'all' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8"
                onClick={() => handleConfigUpdate('videoSelectionMode', 'all')}
              >
                All Videos
              </Button>
              <Button
                variant={config.videoSelectionMode === 'specific' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8"
                onClick={() => handleConfigUpdate('videoSelectionMode', 'specific')}
              >
                Specific Count
              </Button>
            </div>
          </div>

          {/* Number of Videos (if specific mode) */}
          {config.videoSelectionMode === 'specific' && (
            <div className="space-y-2">
              <Label className="text-xs text-slate-300">
                Number of Videos to Process
              </Label>
              <Input
                type="number"
                min={1}
                max={sourceVideosCount}
                value={config.numVideos}
                onChange={(e) => handleConfigUpdate('numVideos', parseInt(e.target.value) || 1)}
                className="h-8 text-xs bg-slate-800/50 border-slate-600"
              />
              <div className="text-xs text-slate-400">
                Max: {sourceVideosCount} available videos
              </div>
            </div>
          )}

          {/* Clips per Video */}
          <div className="space-y-2">
            <Label className="text-xs text-slate-300 flex items-center gap-2">
              <Hash className="w-3 h-3" />
              Clips per Video
            </Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={config.numClips}
              onChange={(e) => handleConfigUpdate('numClips', parseInt(e.target.value) || 1)}
              className="h-8 text-xs bg-slate-800/50 border-slate-600"
            />
            <div className="text-xs text-slate-400">
              Recommended: 1-5 clips per video
            </div>
          </div>

          {/* Clip Duration */}
          <div className="space-y-2">
            <Label className="text-xs text-slate-300 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Clip Duration (seconds)
            </Label>
            <Input
              type="number"
              min={1}
              max={30}
              value={config.clipDuration}
              onChange={(e) => handleConfigUpdate('clipDuration', parseInt(e.target.value) || 1)}
              className="h-8 text-xs bg-slate-800/50 border-slate-600"
            />
            <div className="text-xs text-slate-400">
              Recommended: 3-10 seconds for short clips
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-emerald-500/10 border-emerald-500/30">
        <CardContent className="p-3">
          <div className="text-xs text-emerald-200 space-y-1">
            <div className="font-medium text-emerald-100 mb-2">Generation Summary:</div>
            <div className="bg-emerald-500/10 rounded p-2 space-y-1">
              <div>
                Total clips to generate: 
                <span className="font-mono ml-1 text-emerald-100">
                  {config.videoSelectionMode === 'all' 
                    ? sourceVideosCount * config.numClips
                    : config.numVideos * config.numClips
                  }
                </span>
              </div>
              <div>
                Total duration: 
                <span className="font-mono ml-1 text-emerald-100">
                  ~{Math.round((config.videoSelectionMode === 'all' 
                    ? sourceVideosCount * config.numClips
                    : config.numVideos * config.numClips
                  ) * config.clipDuration / 60 * 10) / 10} minutes
                </span>
              </div>
            </div>
            <div className="text-xs text-emerald-300 mt-2">
              💡 Go to the Generate tab to create clips with these settings
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigurationStep;
