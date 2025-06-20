
import React, { useState } from 'react';
import { Shuffle, Clock, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import OptimizedVideoProcessor from '@/services/optimizedVideoProcessor';

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
  const [isOptimizedProcessing, setIsOptimizedProcessing] = useState(false);
  const [optimizedProgress, setOptimizedProgress] = useState(0);
  const [optimizedStage, setOptimizedStage] = useState('');

  const processor = OptimizedVideoProcessor.getInstance();

  const handleOptimizedRandomizeAndCompile = async (duration: number) => {
    if (sourceVideos.length === 0) {
      console.warn('No source videos available');
      return;
    }

    setIsOptimizedProcessing(true);
    setOptimizedProgress(0);
    setOptimizedStage('Initializing optimized processing...');

    try {
      const targetClipCount = duration * 60; // 1-second clips
      
      // Generate clips with optimized processing
      const randomClips = await processor.generateRandomClips(
        sourceVideos,
        targetClipCount,
        1, // 1-second clips
        (progress, stage) => {
          setOptimizedProgress(progress * 0.7); // 70% for clip generation
          setOptimizedStage(stage);
        }
      );

      setOptimizedStage('Starting optimized compilation...');
      setOptimizedProgress(70);

      // Trigger timeline update
      await onRandomizeTimed(duration);

      // Start optimized compilation
      const compilationResult = await processor.optimizedCompilation(
        randomClips,
        {
          totalDuration: randomClips.length,
          clipOrder: randomClips.map(c => c.id),
          zoom: 100,
          playheadPosition: 0,
          preserveAudio: true,
          audioCodec: 'aac',
          videoCodec: 'h264'
        },
        (progress, stage) => {
          setOptimizedProgress(70 + (progress * 0.3)); // 30% for compilation
          setOptimizedStage(stage);
        }
      );

      setOptimizedProgress(100);
      setOptimizedStage('Complete! Video ready for download.');

      // Trigger final compile
      setTimeout(() => {
        onCompile();
        setTimeout(() => {
          setIsOptimizedProcessing(false);
          setOptimizedProgress(0);
          setOptimizedStage('');
        }, 2000);
      }, 500);

    } catch (error) {
      console.error('Optimized processing failed:', error);
      setIsOptimizedProcessing(false);
      setOptimizedProgress(0);
      setOptimizedStage('');
    }
  };

  const handleGenerateClips = () => {
    const finalConfig = {
      ...config,
      useAllVideos: config.videoSelectionMode === 'all',
      randomSelection: true,
    };
    onGenerateClips(finalConfig);
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Optimized Generation (GPU Accelerated)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleGenerateClips}
              disabled={isGenerating || sourceVideos.length === 0 || isOptimizedProcessing}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Generate Clips
            </Button>
            <Button
              onClick={onRandomizeAll}
              variant="outline"
              className="border-slate-600 text-slate-300"
              disabled={isGenerating || isOptimizedProcessing}
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Randomize
            </Button>
          </div>
        </div>

        {/* Optimized Randomize & Compile */}
        <div className="border-t border-slate-600 pt-4">
          <Label className="text-slate-300 mb-3 block text-sm font-medium">
            Hardware-Accelerated Processing
          </Label>
          <div className="space-y-3">
            <Select 
              value={timedRandomizeDuration.toString()} 
              onValueChange={(value) => setTimedRandomizeDuration(Number(value) as 1 | 2 | 5)}
              disabled={isOptimizedProcessing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 minute (GPU optimized)</SelectItem>
                <SelectItem value="2">2 minutes (GPU optimized)</SelectItem>
                <SelectItem value="5">5 minutes (GPU optimized)</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => handleOptimizedRandomizeAndCompile(timedRandomizeDuration)}
              disabled={isGenerating || sourceVideos.length === 0 || isOptimizedProcessing}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold"
            >
              <Clock className="w-4 h-4 mr-2" />
              {isOptimizedProcessing ? 'Processing...' : `Optimized ${timedRandomizeDuration}min Compile`}
            </Button>
          </div>
        </div>

        {/* Enhanced Progress Display */}
        {(isGenerating || isOptimizedProcessing) && (
          <div className="border-t border-slate-600 pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>{isOptimizedProcessing ? optimizedStage : 'Processing...'}</span>
                <span>{Math.round(isOptimizedProcessing ? optimizedProgress : generationProgress)}%</span>
              </div>
              <Progress 
                value={isOptimizedProcessing ? optimizedProgress : generationProgress} 
                className="h-2 bg-slate-600"
              />
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
