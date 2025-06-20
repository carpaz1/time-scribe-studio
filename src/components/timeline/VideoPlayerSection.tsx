
import React from 'react';
import { VideoClip } from '@/types/timeline';
import CleanVideoPlayer from './CleanVideoPlayer';

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
    <div className="w-full h-full bg-black relative">
      <CleanVideoPlayer
        clips={timelineClips}
        currentTime={playheadPosition}
        isPlaying={isPlaying}
        onTimeUpdate={onTimeUpdate}
      />
    </div>
  );
};

export default VideoPlayerSection;
