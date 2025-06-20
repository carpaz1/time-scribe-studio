
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { VideoIcon, Sparkles, Zap, Play, Upload, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImprovedWorkflowPanelProps {
  sourceVideos: File[];
  timelineClips: any[];
  onVideoUpload: (files: File[]) => void;
  onGenerateClips: (duration: number) => Promise<void>;
  onQuickRandomize: (duration: number, includePictures?: boolean) => Promise<void>;
  onCompile: () => Promise<void>;
  isProcessing: boolean;
  processingProgress: number;
  processingStage: string;
  onCancelProcessing: () => void;
}

const ImprovedWorkflowPanel: React.FC<ImprovedWorkflowPanelProps> = ({
  sourceVideos,
  timelineClips,
  onVideoUpload,
  onGenerateClips,
  onQuickRandomize,
  onCompile,
  isProcessing,
  processingProgress,
  processingStage,
  onCancelProcessing,
}) => {
  const [selectedDuration, setSelectedDuration] = useState(60);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onVideoUpload(files);
    }
  };

  const handleGenerateClipsOnly = async () => {
    if (sourceVideos.length === 0) {
      toast({
        title: "No videos uploaded",
        description: "Please upload some videos first",
        variant: "destructive",
      });
      return;
    }

    try {
      await onGenerateClips(selectedDuration);
      toast({
        title: "Clips generated",
        description: "Clips are now available for AI editing on the timeline",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Could not generate clips from videos",
        variant: "destructive",
      });
    }
  };

  const canUseAI = timelineClips.length > 0;
  const canCompile = timelineClips.length > 0;

  return (
    <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white flex items-center">
          <VideoIcon className="w-5 h-5 mr-2 text-blue-400" />
          Smart Workflow
          <Badge variant="default" className="ml-auto text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            Enhanced
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Upload Videos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-200">1. Upload Videos</span>
            <Badge variant={sourceVideos.length > 0 ? "default" : "secondary"} className="text-xs">
              {sourceVideos.length} files
            </Badge>
          </div>
          <div className="relative">
            <input
              type="file"
              multiple
              accept="video/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
            />
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isProcessing}
            >
              <Upload className="w-4 h-4 mr-2" />
              {sourceVideos.length > 0 ? 'Add More Videos' : 'Upload Videos'}
            </Button>
          </div>
        </div>

        {/* Step 2: Generate Clips */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-purple-200">2. Generate Clips</span>
            <Badge variant={timelineClips.length > 0 ? "default" : "secondary"} className="text-xs">
              {timelineClips.length} clips
            </Badge>
          </div>
          
          {/* Duration Selection */}
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300">Duration:</span>
            <select
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(Number(e.target.value))}
              className="text-sm bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
              disabled={isProcessing}
            >
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={120}>2 minutes</option>
              <option value={300}>5 minutes</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={handleGenerateClipsOnly}
              disabled={sourceVideos.length === 0 || isProcessing}
              className="bg-purple-600 hover:bg-purple-700 text-sm"
              size="sm"
            >
              <Zap className="w-4 h-4 mr-2" />
              Generate Clips Only
            </Button>
            
            <Button
              onClick={() => onQuickRandomize(selectedDuration)}
              disabled={sourceVideos.length === 0 || isProcessing}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-sm"
              size="sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate & Compile
            </Button>
          </div>
        </div>

        {/* Step 3: AI Edit (only if clips exist) */}
        {timelineClips.length > 0 && (
          <div className="space-y-2 p-3 bg-green-900/20 border border-green-500/30 rounded">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-green-200">3. AI Editing Available</span>
              <Badge variant="default" className="text-xs bg-green-600">
                Ready
              </Badge>
            </div>
            <p className="text-xs text-green-300">
              Clips are on timeline! Use the AI Assistant panel to edit and enhance your video.
            </p>
          </div>
        )}

        {/* Step 4: Compile */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-orange-200">4. Compile Video</span>
            <Badge variant={canCompile ? "default" : "secondary"} className="text-xs">
              {canCompile ? 'Ready' : 'Needs Clips'}
            </Badge>
          </div>
          <Button
            onClick={onCompile}
            disabled={!canCompile || isProcessing}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            <Play className="w-4 h-4 mr-2" />
            Compile Final Video
          </Button>
        </div>

        {/* Progress */}
        {isProcessing && (
          <div className="space-y-2 p-3 bg-slate-800/50 border border-slate-600 rounded">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{processingStage}</span>
              <span className="text-sm text-slate-300">{Math.round(processingProgress)}%</span>
            </div>
            <Progress value={processingProgress} className="h-2" />
            <Button
              onClick={onCancelProcessing}
              variant="outline"
              size="sm"
              className="w-full text-xs border-slate-600"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Workflow Tips */}
        <div className="text-xs text-slate-400 bg-slate-800/50 p-3 rounded space-y-1">
          <div><strong>Pro Tip:</strong></div>
          <div>• Upload videos → Generate clips → Use AI editor → Compile</div>
          <div>• Generate clips first to enable AI editing features</div>
          <div>• Longer videos provide more clip variety</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImprovedWorkflowPanel;
