
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Settings, Zap, Play, Download } from 'lucide-react';

interface WorkflowPanelProps {
  sourceVideos: File[];
  onVideoUpload: (files: File[]) => void;
  onBulkUpload: (files: File[]) => void;
  onQuickRandomize: (duration: number) => void;
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
  const [activeWorkflow, setActiveWorkflow] = useState<'quick' | 'custom'>('quick');

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onVideoUpload(files);
    }
  };

  const handleDirectoryInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onBulkUpload(files);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-200">Video Workflow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Upload */}
        <div className="space-y-3">
          <Label className="text-slate-300 text-sm font-medium">
            1. Upload Videos ({sourceVideos.length} loaded)
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="file"
                multiple
                accept="video/*"
                onChange={handleFileInput}
                className="hidden"
                id="video-files"
              />
              <Button
                asChild
                variant="outline"
                className="w-full border-slate-600 text-slate-300"
                disabled={isProcessing}
              >
                <label htmlFor="video-files" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Select Files
                </label>
              </Button>
            </div>
            <div>
              <input
                type="file"
                multiple
                accept="video/*"
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
                className="w-full border-slate-600 text-slate-300"
                disabled={isProcessing}
              >
                <label htmlFor="video-directory" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Select Folder
                </label>
              </Button>
            </div>
          </div>
        </div>

        {/* Step 2: Choose Workflow (only show if videos uploaded) */}
        {sourceVideos.length > 0 && (
          <div className="space-y-3">
            <Label className="text-slate-300 text-sm font-medium">
              2. Choose Workflow
            </Label>
            <Tabs value={activeWorkflow} onValueChange={(value) => setActiveWorkflow(value as 'quick' | 'custom')}>
              <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
                <TabsTrigger value="quick">Quick Random</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>
              
              <TabsContent value="quick" className="space-y-3 mt-3">
                <Select 
                  value={selectedDuration.toString()} 
                  onValueChange={(value) => setSelectedDuration(Number(value) as 1 | 2 | 5)}
                  disabled={isProcessing}
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
                  onClick={() => onQuickRandomize(selectedDuration)}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Processing...' : `Generate ${selectedDuration}min Video`}
                </Button>
              </TabsContent>
              
              <TabsContent value="custom" className="space-y-3 mt-3">
                <div className="text-sm text-slate-400">
                  Custom workflow allows manual clip selection and timeline editing
                </div>
                <Button
                  onClick={onCompile}
                  disabled={isProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Compile Timeline
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Processing Status */}
        {isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>{processingStage}</span>
              <span>{Math.round(processingProgress)}%</span>
            </div>
            <Progress value={processingProgress} className="h-2 bg-slate-600" />
            <Button
              onClick={onCancelProcessing}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkflowPanel;
