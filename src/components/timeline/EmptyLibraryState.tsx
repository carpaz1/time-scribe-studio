
import React from 'react';
import { Film } from 'lucide-react';
import VideoUploader from './VideoUploader';

interface EmptyLibraryStateProps {
  onVideoUpload: (files: File[]) => void;
}

const EmptyLibraryState: React.FC<EmptyLibraryStateProps> = ({
  onVideoUpload,
}) => {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Film className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-300 mb-2">No clips yet</h3>
      <p className="text-sm text-slate-500 mb-4">
        Upload videos and generate clips to get started
      </p>
      <div className="space-y-3">
        <VideoUploader onVideoUpload={onVideoUpload} />
      </div>
    </div>
  );
};

export default EmptyLibraryState;
