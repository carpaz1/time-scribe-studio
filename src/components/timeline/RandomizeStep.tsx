
import React, { useState } from 'react';
import { Shuffle, Clock, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

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
  const [isRandomizeCompiling, setIsRandomizeCompiling] = useState(false);
  const [randomizeProgress, setRandomizeProgress] = useState(0);
  const [randomizeStage, setRandomizeStage] = useState('');

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

    setIsRandomizeCompiling(true);
    setRandomizeProgress(0);
    setRandomizeStage('Generating random clips...');

    try {
      const targetDurationSeconds = duration * 60;
      const clipDuration = 1; // Always use 1-second clips
      const clipsNeeded = Math.min(targetDurationSeconds, sourceVideos.length * 10); // Max 10 clips per video
      
      console.log(`Generating ${clipsNeeded} random 1-second clips from ${sourceVideos.length} videos`);
      
      // Create truly random clips by shuffling video selection
      const randomClips = [];
      const shuffledVideos = [...sourceVideos].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < clipsNeeded; i++) {
        setRandomizeProgress((i / clipsNeeded) * 50); // First 50% for clip generation
        setRandomizeStage(`Generating clip ${i + 1}/${clipsNeeded}...`);
        
        // Pick a random video (with replacement to ensure true randomness)
        const randomVideoIndex = Math.floor(Math.random() * sourceVideos.length);
        const video = sourceVideos[randomVideoIndex];
        
        // Create a video element to get duration
        const videoElement = document.createElement('video');
        const objectUrl = URL.createObjectURL(video);
        videoElement.src = objectUrl;
        
        await new Promise((resolve) => {
          videoElement.addEventListener('loadedmetadata', () => {
            const videoDuration = videoElement.duration;
            const startTime = Math.random() * Math.max(0, videoDuration - clipDuration);
            
            const randomClip = {
              id: `random-compile-${Date.now()}-${i}-${Math.random()}`,
              name: `Random ${i}`,
              sourceFile: video,
              startTime,
              duration: clipDuration,
              thumbnail: '',
              position: i * clipDuration,
              originalVideoId: video.name,
            };
            
            randomClips.push(randomClip);
            URL.revokeObjectURL(objectUrl);
            resolve(null);
          });
        });
        
        // Small delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      setRandomizeStage('Starting compilation...');
      setRandomizeProgress(60);
      
      // Trigger the compilation with progress tracking
      console.log(`Starting compilation of ${randomClips.length} random clips`);
      
      // Call the parent's randomize function to set the clips
      await onRandomizeTimed(duration);
      
      // Then trigger compilation
      setRandomizeStage('Compiling video...');
      setRandomizeProgress(75);
      
      setTimeout(() => {
        onCompile();
        setRandomizeProgress(100);
        setRandomizeStage('Complete!');
        
        setTimeout(() => {
          setIsRandomizeCompiling(false);
          setRandomizeProgress(0);
          setRandomizeStage('');
        }, 2000);
      }, 500);

    } catch (error) {
      console.error('Error in randomize and compile:', error);
      setIsRandomizeCompiling(false);
      setRandomizeProgress(0);
      setRandomizeStage('');
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
              disabled={isGenerating || sourceVideos.length === 0 || isRandomizeCompiling}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Generate Clips
            </Button>
            <Button
              onClick={onRandomizeAll}
              variant="outline"
              className="border-slate-600 text-slate-300"
              disabled={isGenerating || isRandomizeCompiling}
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
              disabled={isRandomizeCompiling}
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
              disabled={isGenerating || sourceVideos.length === 0 || isRandomizeCompiling}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold"
            >
              <Clock className="w-4 h-4 mr-2" />
              {isRandomizeCompiling ? 'Processing...' : `Randomize & Compile (${timedRandomizeDuration} min)`}
            </Button>
          </div>
        </div>

        {/* Enhanced Progress Display */}
        {(isGenerating || isRandomizeCompiling) && (
          <div className="border-t border-slate-600 pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>{isRandomizeCompiling ? randomizeStage : 'Processing...'}</span>
                <span>{Math.round(isRandomizeCompiling ? randomizeProgress : generationProgress)}%</span>
              </div>
              <Progress 
                value={isRandomizeCompiling ? randomizeProgress : generationProgress} 
                className="h-2 bg-slate-600"
              />
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
