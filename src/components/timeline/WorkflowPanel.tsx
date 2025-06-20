
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, Sparkles, FileVideo, Cpu, Brain, AlertTriangle, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import WorkflowControls from './WorkflowControls';

interface WorkflowPanelProps {
  sourceVideos: File[];
  onVideoUpload: (files: File[]) => void;
  onBulkUpload: (files: File[]) => void;
  onQuickRandomize: (duration: number, includePictures?: boolean) => void;
  onCompile: () => void;
  isProcessing: boolean;
  processingProgress: number;
  processingStage: string;
  onCancelProcessing: () => void;
}

const WorkflowPanel: React.FC<WorkflowPanelProps> = ({
  sourceVideos,
  onVideoUpload,
  onBulkUpload,
  onQuickRandomize,
  onCompile,
  isProcessing,
  processingProgress,
  processingStage,
  onCancelProcessing,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<1 | 2 | 5>(1);
  const [activeWorkflow, setActiveWorkflow] = useState<'quick' | 'ai' | 'custom'>('ai');
  const [includePictures, setIncludePictures] = useState(false);
  const [useGPUAcceleration, setUseGPUAcceleration] = useState(true);
  const [aiEnhancement, setAiEnhancement] = useState(true);
  const [fileSizeWarning, setFileSizeWarning] = useState<string[]>([]);
  const { toast } = useToast();

  const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      validateAndProcessFiles(files, onVideoUpload);
    }
  };

  const handleDirectoryInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      validateAndProcessFiles(files, onBulkUpload);
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

    const largeFiles = sourceVideos.filter(file => file.size > MAX_FILE_SIZE);
    if (largeFiles.length > 0) {
      toast({
        title: "Large files detected",
        description: "Some files are too large and may cause issues",
        variant: "destructive",
      });
      return;
    }

    onQuickRandomize(selectedDuration, includePictures);
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-600/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-200 whitespace-nowrap flex items-center">
          <Brain className="w-5 h-5 mr-2 text-purple-400" />
          AI-Powered Video Workflow
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
            1. Upload Media ({sourceVideos.length} loaded, max 2GB each)
          </Label>
          
          {/* Enhanced Options */}
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
                  GPU Acceleration
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
                  AI Enhancement
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
                  Pictures
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
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
                  Select Files
                </label>
              </Button>
            </div>
            <div>
              <input
                type="file"
                multiple
                accept="video/*,image/*"
                onChange={handleDirectoryInput}
                className="hidden"
                id="video-directory"
                {...({
                  webkitdirectory: '',
                  directory: ''
                } as any)}
              />
              <Button
                asChild
                variant="outline"
                className="w-full border-slate-600 text-slate-300 text-xs px-2 py-1 h-8 hover:bg-slate-700/50"
                disabled={isProcessing}
              >
                <label htmlFor="video-directory" className="cursor-pointer flex items-center justify-center">
                  <Upload className="w-3 h-3 mr-1" />
                  Select Folder
                </label>
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Generation & Compilation */}
        {sourceVideos.length > 0 && (
          <div className="space-y-3">
            <Label className="text-slate-300 text-sm font-medium block flex items-center">
              <Brain className="w-4 h-4 mr-2 text-purple-400" />
              2. AI-Powered Generation & Compilation
            </Label>

            <WorkflowControls
              selectedDuration={selectedDuration}
              onDurationChange={setSelectedDuration}
              onQuickGenerate={handleQuickGenerate}
              onCompile={onCompile}
              isProcessing={isProcessing}
              sourceVideosLength={sourceVideos.length}
              activeWorkflow={activeWorkflow}
              onWorkflowChange={setActiveWorkflow}
            />
          </div>
        )}

        {/* Enhanced Progress Display */}
        {isProcessing && (
          <div className="space-y-3 border-t border-slate-600 pt-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="truncate pr-2 flex-1 flex items-center">
                {useGPUAcceleration && <Cpu className="w-3 h-3 mr-1 text-green-400 animate-pulse" />}
                {aiEnhancement && <Brain className="w-3 h-3 mr-1 text-purple-400 animate-pulse" />}
                {processingStage || 'GPU + AI Processing...'}
              </span>
              <span className="whitespace-nowrap font-mono bg-slate-700/50 px-2 py-1 rounded">
                {Math.round(processingProgress)}%
              </span>
            </div>
            <Progress 
              value={processingProgress} 
              className="h-3 bg-slate-600"
            />
            <div className="flex items-center justify-between text-xs">
              <div className="text-slate-400 flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                {processingProgress < 30 ? 'Validating files...' : 
                 processingProgress < 60 ? 'AI analyzing content...' : 
                 'Final compilation...'}
              </div>
              <Button
                onClick={onCancelProcessing}
                variant="destructive"
                size="sm"
                className="h-6 text-xs px-2"
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkflowPanel;
