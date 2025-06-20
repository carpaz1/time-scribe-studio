
import React, { useState } from 'react';
import { FolderOpen, FileVideo, Shuffle, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VideoUploader from './VideoUploader';
import BulkDirectorySelector from './BulkDirectorySelector';

interface VideoSelectionPanelProps {
  sourceVideos: any[];
  onVideoUpload: (files: File[]) => void;
  onBulkUpload: (files: File[]) => void;
  onGenerateClips: (config: any) => void;
  onRandomizeAll: () => void;
  onRandomizeTimed: (duration: number) => void;
  onDirectRandomize: () => void;
  onCancelProcessing: () => void;
  isGenerating: boolean;
  generationProgress: number;
}

const VideoSelectionPanel: React.FC<VideoSelectionPanelProps> = ({
  sourceVideos,
  onVideoUpload,
  onBulkUpload,
  onGenerateClips,
  onRandomizeAll,
  onRandomizeTimed,
  onDirectRandomize,
  onCancelProcessing,
  isGenerating,
  generationProgress,
}) => {
  const [config, setConfig] = useState({
    videoSelectionMode: 'all' as 'all' | 'specific',
    numVideos: Math.min(20, sourceVideos.length),
    numClips: 3,
    clipDuration: 5,
  });
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
    <div className="space-y-4">
      {/* Step 1: Video Selection */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
            <FileVideo className="w-5 h-5" />
            1. Select Videos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <VideoUploader onVideoUpload={onVideoUpload} />
            <BulkDirectorySelector onBulkUpload={onBulkUpload} />
          </div>
          {sourceVideos.length > 0 && (
            <>
              <div className="text-center text-sm text-emerald-400 bg-emerald-400/10 px-3 py-2 rounded">
                {sourceVideos.length} videos loaded (max 199 clips for compilation)
              </div>
              <Button
                onClick={onDirectRandomize}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="sm"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Direct Randomize from Directory
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Step 2-4: Configuration */}
      {sourceVideos.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-200">2-4. Configure Clips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Video Selection Mode */}
            <div>
              <Label className="text-slate-300">How many videos to process?</Label>
              <Select 
                value={config.videoSelectionMode} 
                onValueChange={(value: 'all' | 'specific') => 
                  setConfig(prev => ({ ...prev, videoSelectionMode: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All videos ({sourceVideos.length})</SelectItem>
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
                  max={sourceVideos.length}
                  value={config.numVideos}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    numVideos: Math.min(Number(e.target.value), sourceVideos.length) 
                  }))}
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
                onChange={(e) => setConfig(prev => ({ ...prev, numClips: Number(e.target.value) }))}
              />
            </div>

            <div>
              <Label className="text-slate-300">Clip length (seconds)</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={config.clipDuration}
                onChange={(e) => setConfig(prev => ({ ...prev, clipDuration: Number(e.target.value) }))}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Actions */}
      {sourceVideos.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-200">5. Generate & Randomize</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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

            {/* NEW: Timed Randomize Section */}
            <div className="border-t border-slate-600 pt-3">
              <Label className="text-slate-300 mb-2 block">Timed Randomize (auto-compile)</Label>
              <div className="space-y-2">
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
            
            {isGenerating && (
              <div className="text-center text-sm text-slate-300 space-y-2">
                <div>Generating... {Math.round(generationProgress)}%</div>
                <Button
                  onClick={onCancelProcessing}
                  variant="destructive"
                  size="sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel Processing
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VideoSelectionPanel;
