
import React from 'react';
import { Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ConfigurationStepProps {
  sourceVideosCount: number;
  config: {
    videoSelectionMode: 'all' | 'specific';
    numVideos: number;
    numClips: number;
    clipDuration: number;
  };
  onConfigChange: (config: any) => void;
}

const ConfigurationStep: React.FC<ConfigurationStepProps> = ({
  sourceVideosCount,
  config,
  onConfigChange,
}) => {
  const updateConfig = (updates: Partial<typeof config>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configure Clips
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-slate-300">How many videos to process?</Label>
          <Select 
            value={config.videoSelectionMode} 
            onValueChange={(value: 'all' | 'specific') => 
              updateConfig({ videoSelectionMode: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All videos ({sourceVideosCount})</SelectItem>
              <SelectItem value="specific">Specific number</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {config.videoSelectionMode === 'specific' && (
          <div>
            <Label className="text-slate-300">Number of videos to process</Label>
            <Input
              type="number"
              min="1"
              max={sourceVideosCount}
              value={config.numVideos}
              onChange={(e) => updateConfig({ 
                numVideos: Math.min(Number(e.target.value), sourceVideosCount) 
              })}
            />
          </div>
        )}

        <div>
          <Label className="text-slate-300">Clips per video</Label>
          <Input
            type="number"
            min="1"
            max="10"
            value={config.numClips}
            onChange={(e) => updateConfig({ numClips: Number(e.target.value) })}
          />
        </div>

        <div>
          <Label className="text-slate-300">Clip length (seconds)</Label>
          <Input
            type="number"
            min="1"
            max="60"
            value={config.clipDuration}
            onChange={(e) => updateConfig({ clipDuration: Number(e.target.value) })}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfigurationStep;
