
import React from 'react';
import { VideoClip } from '@/types/timeline';
import EnhancedVideoPlayer from './EnhancedVideoPlayer';

interface VideoPlayerSectionProps {
  timelineClips: VideoClip[];
  playheadPosition: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
}

const VideoPlayerSection: React.FC<VideoPlayerSectionProps> = ({
  timelineClips,
  playheadPosition,
  isPlaying,
  onTimeUpdate,
}) => {
  return (
    <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-purple-950/40 backdrop-blur-sm h-full p-6">
      <div className="w-full h-full bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-3xl border border-indigo-500/40 overflow-hidden shadow-2xl backdrop-blur-md ring-1 ring-white/10">
        <EnhancedVideoPlayer
          clips={timelineClips}
          currentTime={playheadPosition}
          isPlaying={isPlaying}
          onTimeUpdate={onTimeUpdate}
        />
      </div>
    </div>
  );
};

export default VideoPlayerSection;
