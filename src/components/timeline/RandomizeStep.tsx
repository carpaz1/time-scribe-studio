
import React, { useState } from 'react';
import { Shuffle, Clock, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RandomizeStepProps {
  onGenerateClips: (config: any) => void;
  onRandomizeAll: () => void;
  onRandomizeTimed: (duration: number) => void;
  onCancelProcessing: () => void;
  isGenerating: boolean;
  generationProgress: number;
  config: any;
}

const RandomizeStep: React.FC<RandomizeStepProps> = ({
  onGenerateClips,
  onRandomizeAll,
  onRandomizeTimed,
  onCancelProcessing,
  isGenerating,
  generationProgress,
  config,
}) => {
  const [timedRandomizeDuration, setTimedRandomizeDuration] = useState<1 | 2 | 5>(1);

  const handleGenerateClips = () => {
    const finalConfig = {
      ...config,
      useAllVideos: config.videoSelectionMode === 'all',
      randomSelection: true,
    };
    onGenerateClips(finalConfig);
  };

  const handleTimedRandomize = () => {
    onRandomizeTimed(timedRandomizeDuration);
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Generate & Randomize
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Standard Generation */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleGenerateClips}
              disabled={isGenerating}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Generate Clips
            </Button>
            <Button
              onClick={onRandomizeAll}
              variant="outline"
              className="border-slate-600 text-slate-300"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Randomize
            </Button>
          </div>
        </div>

        {/* Timed Randomize Section */}
        <div className="border-t border-slate-600 pt-4">
          <Label className="text-slate-300 mb-3 block text-sm font-medium">
            Timed Randomize (auto-compile)
          </Label>
          <div className="space-y-3">
            <Select 
              value={timedRandomizeDuration.toString()} 
              onValueChange={(value) => setTimedRandomizeDuration(Number(value) as 1 | 2 | 5)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 minute compilation</SelectItem>
                <SelectItem value="2">2 minute compilation</SelectItem>
                <SelectItem value="5">5 minute compilation</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleTimedRandomize}
              disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              <Clock className="w-4 h-4 mr-2" />
              Randomize & Compile ({timedRandomizeDuration} min)
            </Button>
          </div>
        </div>
        
        {/* Progress and Cancel */}
        {isGenerating && (
          <div className="border-t border-slate-600 pt-4">
            <div className="text-center text-sm text-slate-300 space-y-3">
              <div>Generating... {Math.round(generationProgress)}%</div>
              <Button
                onClick={onCancelProcessing}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel Processing
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RandomizeStep;
