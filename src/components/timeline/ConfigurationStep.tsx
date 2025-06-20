
import React from 'react';
import { Info, Settings2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  return (
    <div className="p-4 space-y-3">
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-blue-300 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Configuration Info
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-blue-200 space-y-2">
          <p>
            The Configure tab allows you to set up generation parameters for your clips.
          </p>
          <div className="bg-blue-500/10 rounded p-2 space-y-1">
            <div className="font-medium">Current Settings:</div>
            <div>• Videos available: {sourceVideosCount}</div>
            <div>• Clips per video: {config.numClips}</div>
            <div>• Clip duration: {config.clipDuration}s</div>
            <div>• Selection: {config.videoSelectionMode === 'all' ? 'All videos' : `${config.numVideos} videos`}</div>
          </div>
          <p className="text-xs text-blue-300">
            💡 Use the Generate & Randomize section to apply these settings and create clips.
          </p>
        </CardContent>
      </Card>

      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-xs text-slate-400 bg-slate-700/30 rounded px-3 py-2">
          <Settings2 className="w-4 h-4" />
          Advanced configuration coming soon
        </div>
      </div>
    </div>
  );
};

export default ConfigurationStep;
