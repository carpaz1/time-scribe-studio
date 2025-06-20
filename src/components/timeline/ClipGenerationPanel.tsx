
import React, { useState } from 'react';
import { Plus, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ClipGenerationConfig {
  numClips: number;
  clipDuration: number;
  randomSelection: boolean;
  videoSelectionMode: 'all' | 'specific';
  numVideos: number;
  compilationDuration?: number;
}

interface ClipGenerationPanelProps {
  sourceVideosCount: number;
  isGenerating: boolean;
  generationProgress: number;
  onGenerateClips: (config: ClipGenerationConfig) => void;
  onRandomizeAll: () => void;
  clipsCount: number;
  compilationDuration?: number;
}

const ClipGenerationPanel: React.FC<ClipGenerationPanelProps> = ({
  sourceVideosCount,
  isGenerating,
  generationProgress,
  onGenerateClips,
  onRandomizeAll,
  clipsCount,
  compilationDuration = 60,
}) => {
  const [config, setConfig] = useState<ClipGenerationConfig>({
    numClips: 3,
    clipDuration: 5,
    randomSelection: true,
    videoSelectionMode: 'all',
    numVideos: Math.min(20, sourceVideosCount),
  });

  // Calculate optimal number of clips based on compilation duration
  const maxClipsForDuration = Math.floor(compilationDuration / config.clipDuration);
  const totalClipsGenerated = config.numClips * (config.videoSelectionMode === 'all' ? sourceVideosCount : config.numVideos);
  const isExceedingDuration = totalClipsGenerated > maxClipsForDuration;

  const handleGenerateClips = () => {
    const optimizedConfig = {
      ...config,
      compilationDuration,
    };
    
    // Warn if generating more clips than needed
    if (isExceedingDuration) {
      console.warn(`Generating ${totalClipsGenerated} clips but only ${maxClipsForDuration} needed for ${compilationDuration}s compilation`);
    }
    
    onGenerateClips(optimizedConfig);
  };

  return (
    <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Generate Clips</h3>
          {sourceVideosCount > 0 && (
            <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
              {sourceVideosCount} videos ready
            </span>
          )}
        </div>

        {/* Compilation Duration Info */}
        {compilationDuration && (
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded p-3">
            <div className="text-xs text-indigo-300 mb-1">Target compilation: {compilationDuration}s</div>
            <div className="text-xs text-slate-400">
              Max clips needed: {maxClipsForDuration} ({config.clipDuration}s each)
            </div>
            {isExceedingDuration && (
              <div className="text-xs text-amber-400 mt-1">
                ⚠️ Will generate {totalClipsGenerated} clips (only {maxClipsForDuration} will be used)
              </div>
            )}
          </div>
        )}

        {/* Configuration Options */}
        <Card className="bg-slate-700/30 border-slate-600/50">
          <CardContent className="p-3 space-y-3">
            <div>
              <Label htmlFor="videoSelection" className="text-xs text-gray-300">
                Video Selection
              </Label>
              <Select 
                value={config.videoSelectionMode} 
                onValueChange={(value: 'all' | 'specific') => 
                  setConfig(prev => ({ ...prev, videoSelectionMode: value }))
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All videos ({sourceVideosCount})</SelectItem>
                  <SelectItem value="specific">Specific number of videos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.videoSelectionMode === 'specific' && (
              <div>
                <Label htmlFor="numVideos" className="text-xs text-gray-300">
                  Number of Videos to Process
                </Label>
                <Input
                  id="numVideos"
                  type="number"
                  min="1"
                  max={sourceVideosCount}
                  value={config.numVideos}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    numVideos: Math.min(Number(e.target.value), sourceVideosCount) 
                  }))}
                  className="h-8 text-sm"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="numClips" className="text-xs text-gray-300">
                Clips per Video
              </Label>
              <Input
                id="numClips"
                type="number"
                min="1"
                max="10"
                value={config.numClips}
                onChange={(e) => setConfig(prev => ({ ...prev, numClips: Number(e.target.value) }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="clipDuration" className="text-xs text-gray-300">
                Clip Duration (seconds)
              </Label>
              <Input
                id="clipDuration"
                type="number"
                min="1"
                max="60"
                value={config.clipDuration}
                onChange={(e) => setConfig(prev => ({ ...prev, clipDuration: Number(e.target.value) }))}
                className="h-8 text-sm"
              />
            </div>
          </CardContent>
        </Card>
        
        {isGenerating && (
          <div className="space-y-2">
            <Progress 
              value={generationProgress} 
              className="h-2 bg-slate-700/50"
            />
            <p className="text-xs text-slate-200 text-center">
              Generating clips... {Math.round(generationProgress)}%
            </p>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button
            onClick={handleGenerateClips}
            disabled={sourceVideosCount === 0 || isGenerating}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Clips
          </Button>
          <Button
            onClick={onRandomizeAll}
            disabled={clipsCount === 0}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
          >
            <Shuffle className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClipGenerationPanel;
