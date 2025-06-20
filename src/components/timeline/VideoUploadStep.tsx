
import React from 'react';
import { FileVideo, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VideoUploader from './VideoUploader';
import BulkDirectorySelector from './BulkDirectorySelector';

interface VideoUploadStepProps {
  sourceVideos: any[];
  onVideoUpload: (files: File[]) => void;
  onBulkUpload: (files: File[]) => void;
  onDirectRandomize: () => void;
}

const VideoUploadStep: React.FC<VideoUploadStepProps> = ({
  sourceVideos,
  onVideoUpload,
  onBulkUpload,
  onDirectRandomize,
}) => {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
          <FileVideo className="w-5 h-5" />
          Select Videos
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
  );
};

export default VideoUploadStep;
