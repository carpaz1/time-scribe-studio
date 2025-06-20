
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, Sparkles, FileVideo, Cpu, Brain, AlertTriangle, Image, Settings, Clock, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImprovedWorkflowPanelProps {
  sourceVideos: File[];
  timelineClips: any[];
  onVideoUpload: (files: File[]) => void;
  onGenerateClips: (duration: number) => void;
  onQuickRandomize: (duration: number, includePictures?: boolean) => Promise<void>;
  onCompile: () => void;
  isProcessing: boolean;
  processingProgress: number;
  processingStage: string;
  onCancelProcessing: () => Promise<void>;
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
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [clipsPerVideo, setClipsPerVideo] = useState<number>(3);
  const [clipDuration, setClipDuration] = useState<number>(5);
  const [includePictures, setIncludePictures] = useState(false);
  const [useGPUAcceleration, setUseGPUAcceleration] = useState(true);
  const [aiEnhancement, setAiEnhancement] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fileSizeWarning, setFileSizeWarning] = useState<string[]>([]);
  const { toast } = useToast();

  const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      validateAndProcessFiles(files, onVideoUpload);
    }
  };

  const validateAndProcessFiles = (files: File[], callback: (files: File[]) => void) => {
    const validFiles: File[] = [];
    const warnings: string[] = [];

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        warnings.push(`${file.name} (${(file.size / (1024 * 1024 * 1024)).toFixed(2)}GB) exceeds 2GB limit`);
      } else {
        validFiles.push(file);
      }
    });

    setFileSizeWarning(warnings);
    
    if (warnings.length > 0) {
      toast({
        title: "File Size Warning",
        description: `${warnings.length} files exceed 2GB limit and were skipped`,
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      callback(validFiles);
    }
  };

  const handleQuickGenerate = () => {
    if (sourceVideos.length === 0) {
      toast({
        title: "No videos",
        description: "Please upload some videos first",
        variant: "destructive",
      });
      return;
    }

    // Store clip generation settings globally for VideoCompilationService to use
    (window as any).clipGenerationSettings = {
      clipsPerVideo,
      clipDuration,
      targetDuration: selectedDuration
    };

    onQuickRandomize(selectedDuration, includePictures);
  };

  const handleGenerateClips = () => {
    if (sourceVideos.length === 0) {
      toast({
        title: "No videos",
        description: "Please upload some videos first",
        variant: "destructive",
      });
      return;
    }

    // Store clip generation settings globally for VideoCompilationService to use
    (window as any).clipGenerationSettings = {
      clipsPerVideo,
      clipDuration,
      targetDuration: selectedDuration
    };

    onGenerateClips(selectedDuration);
  };

  // Calculate estimated total clips
  const estimatedClips = sourceVideos.length * clipsPerVideo;
  const estimatedTotalDuration = estimatedClips * clipDuration;
  const clipsNeededForDuration = Math.ceil(selectedDuration / clipDuration);

  return (
    <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-600/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-200 whitespace-nowrap flex items-center">
          <Brain className="w-5 h-5 mr-2 text-purple-400" />
          AI Video Workflow
          <div className="ml-auto flex space-x-1">
            {useGPUAcceleration && <Cpu className="w-4 h-4 text-green-400" />}
            {aiEnhancement && <Sparkles className="w-4 h-4 text-purple-400" />}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Size Warnings */}
        {fileSizeWarning.length > 0 && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-200 text-sm">
              <div className="font-medium mb-1">Large files skipped:</div>
              <ul className="text-xs space-y-1">
                {fileSizeWarning.slice(0, 3).map((warning, i) => (
                  <li key={i}>• {warning}</li>
                ))}
                {fileSizeWarning.length > 3 && (
                  <li>• ...and {fileSizeWarning.length - 3} more</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Section */}
        <div className="space-y-3">
          <Label className="text-slate-300 text-sm font-medium block flex items-center">
            <Upload className="w-4 h-4 mr-2" />
            1. Upload Videos ({sourceVideos.length} loaded)
          </Label>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-4 p-2 bg-slate-700/30 rounded">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="gpu-accel" 
                  checked={useGPUAcceleration}
                  onCheckedChange={(checked) => setUseGPUAcceleration(checked === true)}
                  disabled={isProcessing}
                />
                <label htmlFor="gpu-accel" className="text-xs text-slate-300 flex items-center">
                  <Cpu className="w-3 h-3 mr-1" />
                  GPU
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="ai-enhance" 
                  checked={aiEnhancement}
                  onCheckedChange={(checked) => setAiEnhancement(checked === true)}
                  disabled={isProcessing}
                />
                <label htmlFor="ai-enhance" className="text-xs text-slate-300 flex items-center">
                  <Brain className="w-3 h-3 mr-1" />
                  AI
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-pictures" 
                  checked={includePictures}
                  onCheckedChange={(checked) => setIncludePictures(checked === true)}
                  disabled={isProcessing}
                />
                <label htmlFor="include-pictures" className="text-xs text-slate-300 flex items-center">
                  <Image className="w-3 h-3 mr-1" />
                  Images
                </label>
              </div>
            </div>
          </div>

          <div>
            <input
              type="file"
              multiple
              accept="video/*,image/*"
              onChange={handleFileInput}
              className="hidden"
              id="video-files"
            />
            <Button
              asChild
              variant="outline"
              className="w-full border-slate-600 text-slate-300 text-xs px-2 py-1 h-8 hover:bg-slate-700/50"
              disabled={isProcessing}
            >
              <label htmlFor="video-files" className="cursor-pointer flex items-center justify-center">
                <FileVideo className="w-3 h-3 mr-1" />
                Select Videos/Images
              </label>
            </Button>
          </div>
        </div>

        {/* Configuration Section */}
        {sourceVideos.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300 text-sm font-medium flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                2. Generation Settings
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                {showAdvanced ? 'Basic' : 'Advanced'}
              </Button>
            </div>

            {/* Target Duration */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Target Duration (seconds)</Label>
              <Input
                type="number"
                min={10}
                max={600}
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(Number(e.target.value))}
                className="h-8 text-sm bg-slate-700/50 border-slate-600"
                disabled={isProcessing}
              />
            </div>

            {/* Advanced Settings */}
            {showAdvanced && (
              <div className="space-y-3 border-t border-slate-600/50 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-400 flex items-center">
                      <Hash className="w-3 h-3 mr-1" />
                      Clips/Video
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={clipsPerVideo}
                      onChange={(e) => setClipsPerVideo(Number(e.target.value))}
                      className="h-8 text-sm bg-slate-700/50 border-slate-600"
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Clip Length (s)
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={clipDuration}
                      onChange={(e) => setClipDuration(Number(e.target.value))}
                      className="h-8 text-sm bg-slate-700/50 border-slate-600"
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                {/* Statistics */}
                <div className="bg-slate-700/20 rounded p-3 space-y-1">
                  <div className="text-xs text-slate-400 grid grid-cols-2 gap-2">
                    <div>Est. clips: {estimatedClips}</div>
                    <div>Est. duration: {Math.round(estimatedTotalDuration)}s</div>
                    <div>Clips needed: {clipsNeededForDuration}</div>
                    <div>Will use: {Math.min(estimatedClips, clipsNeededForDuration)} clips</div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleGenerateClips}
                  disabled={isProcessing}
                  variant="outline"
                  size="sm"
                  className="border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10"
                >
                  Generate Clips
                </Button>
                <Button
                  onClick={handleQuickGenerate}
                  disabled={isProcessing}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Quick Generate
                </Button>
              </div>
              
              {timelineClips.length > 0 && (
                <Button
                  onClick={onCompile}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  size="sm"
                >
                  Compile Video ({timelineClips.length} clips)
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Progress Display */}
        {isProcessing && (
          <div className="space-y-3 border-t border-slate-600 pt-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="truncate pr-2 flex-1 flex items-center">
                {useGPUAcceleration && <Cpu className="w-3 h-3 mr-1 text-green-400 animate-pulse" />}
                {aiEnhancement && <Brain className="w-3 h-3 mr-1 text-purple-400 animate-pulse" />}
                {processingStage || 'Processing...'}
              </span>
              <span className="whitespace-nowrap font-mono bg-slate-700/50 px-2 py-1 rounded">
                {Math.round(processingProgress)}%
              </span>
            </div>
            <Progress 
              value={processingProgress} 
              className="h-3 bg-slate-600"
            />
            <Button
              onClick={onCancelProcessing}
              variant="destructive"
              size="sm"
              className="w-full h-6 text-xs px-2"
            >
              <X className="w-3 h-3 mr-1" />
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImprovedWorkflowPanel;
