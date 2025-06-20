
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Settings, Zap, Play, Download, Image } from 'lucide-react';

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
  const [activeWorkflow, setActiveWorkflow] = useState<'quick' | 'custom'>('quick');
  const [includePictures, setIncludePictures] = useState(false);

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

  const handleQuickGenerate = () => {
    console.log(`Starting quick generate for ${selectedDuration} minute(s), includePictures: ${includePictures}`);
    onQuickRandomize(selectedDuration, includePictures);
  };

  const handlePicturesToggle = (checked: boolean | "indeterminate") => {
    setIncludePictures(checked === true);
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-200 whitespace-nowrap">Video Workflow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Upload */}
        <div className="space-y-3">
          <Label className="text-slate-300 text-sm font-medium block">
            1. Upload Media ({sourceVideos.length} loaded)
          </Label>
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
                className="w-full border-slate-600 text-slate-300 text-xs px-2 py-1 h-8"
                disabled={isProcessing}
              >
                <label htmlFor="video-files" className="cursor-pointer">
                  <Upload className="w-3 h-3 mr-1" />
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
                className="w-full border-slate-600 text-slate-300 text-xs px-2 py-1 h-8"
                disabled={isProcessing}
              >
                <label htmlFor="video-directory" className="cursor-pointer">
                  <Upload className="w-3 h-3 mr-1" />
                  Select Folder
                </label>
              </Button>
            </div>
          </div>
        </div>

        {/* Step 2: Choose Workflow (only show if videos uploaded) */}
        {sourceVideos.length > 0 && (
          <div className="space-y-3">
            <Label className="text-slate-300 text-sm font-medium block">
              2. Choose Workflow
            </Label>
            
            {/* Include Pictures Checkbox */}
            <div className="flex items-center space-x-2 p-2 bg-slate-700/30 rounded">
              <Checkbox 
                id="include-pictures" 
                checked={includePictures}
                onCheckedChange={handlePicturesToggle}
                disabled={isProcessing}
              />
              <label 
                htmlFor="include-pictures" 
                className="text-xs text-slate-300 cursor-pointer flex items-center"
              >
                <Image className="w-3 h-3 mr-1" />
                Include Pictures
              </label>
            </div>

            <Tabs value={activeWorkflow} onValueChange={(value) => setActiveWorkflow(value as 'quick' | 'custom')}>
              <TabsList className="grid w-full grid-cols-2 bg-slate-700/50 h-8">
                <TabsTrigger value="quick" className="text-xs">Quick Random</TabsTrigger>
                <TabsTrigger value="custom" className="text-xs">Custom</TabsTrigger>
              </TabsList>
              
              <TabsContent value="quick" className="space-y-3 mt-3">
                <Select 
                  value={selectedDuration.toString()} 
                  onValueChange={(value) => setSelectedDuration(Number(value) as 1 | 2 | 5)}
                  disabled={isProcessing}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 min (60 clips)</SelectItem>
                    <SelectItem value="2">2 min (120 clips)</SelectItem>
                    <SelectItem value="5">5 min (300 clips)</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleQuickGenerate}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-xs px-2 py-1 h-8"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  {isProcessing ? `Processing... ${Math.round(processingProgress)}%` : `Generate & Compile ${selectedDuration}min`}
                </Button>
                
                {/* Show detailed progress when processing */}
                {isProcessing && (
                  <div className="space-y-2 p-3 bg-slate-700/30 rounded">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="truncate pr-2 flex-1">{processingStage || 'Processing...'}</span>
                      <span className="whitespace-nowrap">{Math.round(processingProgress)}%</span>
                    </div>
                    <Progress value={processingProgress} className="h-2 bg-slate-600" />
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="custom" className="space-y-3 mt-3">
                <div className="text-xs text-slate-400">
                  Custom workflow allows manual clip selection
                </div>
                <Button
                  onClick={onCompile}
                  disabled={isProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs px-2 py-1 h-8"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Compile Timeline
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Processing Status (Global) */}
        {isProcessing && (
          <div className="space-y-3 border-t border-slate-600 pt-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="truncate pr-2 flex-1">{processingStage}</span>
              <span className="whitespace-nowrap">{Math.round(processingProgress)}%</span>
            </div>
            <Progress value={processingProgress} className="h-2 bg-slate-600" />
            <Button
              onClick={onCancelProcessing}
              variant="destructive"
              size="sm"
              className="w-full text-xs h-6"
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
