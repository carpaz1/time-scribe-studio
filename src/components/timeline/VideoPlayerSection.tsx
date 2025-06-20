
import React from 'react';
import { VideoClip } from '@/types/timeline';
import VideoPlayer from './VideoPlayer';
import PlaybackControls from './PlaybackControls';

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
    <div className="bg-gradient-to-br from-indigo-900/30 via-slate-800/40 to-purple-900/30 backdrop-blur-sm h-full p-6">
      <div className="w-full h-full bg-slate-900/80 rounded-3xl border border-indigo-600/30 overflow-hidden shadow-2xl backdrop-blur-md ring-1 ring-white/10">
        <VideoPlayer
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
