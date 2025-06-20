
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
  onCompile: () => void;
  sourceVideos: File[];
}

const RandomizeStep: React.FC<RandomizeStepProps> = ({
  onGenerateClips,
  onRandomizeAll,
  onRandomizeTimed,
  onCancelProcessing,
  isGenerating,
  generationProgress,
  config,
  onCompile,
  sourceVideos,
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

  const handleTimedRandomizeAndCompile = async (duration: number) => {
    if (sourceVideos.length === 0) {
      console.warn('No source videos available for randomize and compile');
      return;
    }

    try {
      // First generate the clips for the specified duration
      await onRandomizeTimed(duration);
      
      // Then automatically trigger compilation
      setTimeout(() => {
        onCompile();
      }, 500); // Small delay to ensure clips are generated first
    } catch (error) {
      console.error('Error in randomize and compile:', error);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Generate & Randomize (1-second clips)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Standard Generation */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleGenerateClips}
              disabled={isGenerating || sourceVideos.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Generate Clips
            </Button>
            <Button
              onClick={onRandomizeAll}
              variant="outline"
              className="border-slate-600 text-slate-300"
              disabled={isGenerating}
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Randomize
            </Button>
          </div>
        </div>

        {/* One-Click Randomize & Compile Section */}
        <div className="border-t border-slate-600 pt-4">
          <Label className="text-slate-300 mb-3 block text-sm font-medium">
            One-Click Randomize & Compile
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
                <SelectItem value="1">1 minute (60 clips)</SelectItem>
                <SelectItem value="2">2 minutes (120 clips)</SelectItem>
                <SelectItem value="5">5 minutes (300 clips)</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => handleTimedRandomizeAndCompile(timedRandomizeDuration)}
              disabled={isGenerating || sourceVideos.length === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold"
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
              <div>Processing... {Math.round(generationProgress)}%</div>
              <Button
                onClick={onCancelProcessing}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel All Processing
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RandomizeStep;
