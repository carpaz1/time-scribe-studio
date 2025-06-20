
import React from 'react';
import { VideoClip, SourceVideo } from '@/types/timeline';
import ClipLibrary from './ClipLibrary';

interface SidebarSectionProps {
  clips: VideoClip[];
  sourceVideos: SourceVideo[];
  timelineClips: VideoClip[];
  onClipAdd: (clip: VideoClip) => void;
  onClipsUpdate: (clips: VideoClip[]) => void;
  onSourceVideosUpdate: (videos: SourceVideo[]) => void;
  onClipsGenerated: (clips: VideoClip[]) => void;
  onRandomizeAll: () => void;
  onVideoUpload: (files: File[]) => void;
  onBulkUpload: (files: File[]) => void;
}

const SidebarSection: React.FC<SidebarSectionProps> = (props) => {
  return (
    <div className="h-full bg-gradient-to-b from-slate-800/90 via-indigo-900/40 to-slate-800/90 backdrop-blur-sm border-r border-indigo-700/30 shadow-xl">
      <ClipLibrary {...props} />
    </div>
  );
};

export default SidebarSection;
