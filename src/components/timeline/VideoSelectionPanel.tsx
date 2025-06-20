
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VideoUploadStep from './VideoUploadStep';
import ConfigurationStep from './ConfigurationStep';
import RandomizeStep from './RandomizeStep';

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

  return (
    <div className="space-y-4">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-700/50 border-slate-600">
          <TabsTrigger value="upload" className="data-[state=active]:bg-slate-600">
            1. Upload
          </TabsTrigger>
          <TabsTrigger value="configure" className="data-[state=active]:bg-slate-600">
            2. Configure
          </TabsTrigger>
          <TabsTrigger value="generate" className="data-[state=active]:bg-slate-600">
            3. Generate
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <VideoUploadStep
            sourceVideos={sourceVideos}
            onVideoUpload={onVideoUpload}
            onBulkUpload={onBulkUpload}
            onDirectRandomize={onDirectRandomize}
          />
        </TabsContent>

        <TabsContent value="configure" className="space-y-4">
          <ConfigurationStep
            sourceVideosCount={sourceVideos.length}
            config={config}
            onConfigChange={setConfig}
          />
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <RandomizeStep
            onGenerateClips={onGenerateClips}
            onRandomizeAll={onRandomizeAll}
            onRandomizeTimed={onRandomizeTimed}
            onCancelProcessing={onCancelProcessing}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
            config={config}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VideoSelectionPanel;
