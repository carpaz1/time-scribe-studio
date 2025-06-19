
import React, { useRef, useEffect, useState } from 'react';
import { VideoClip } from '@/types/timeline';

interface VideoPlayerProps {
  clips: VideoClip[];
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onLoadedMetadata?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  clips,
  currentTime,
  isPlaying,
  onTimeUpdate,
  onLoadedMetadata,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentClip, setCurrentClip] = useState<VideoClip | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');

  // Find the current clip based on playhead position
  useEffect(() => {
    const activeClip = clips.find(clip => 
      currentTime >= clip.position && currentTime < clip.position + clip.duration
    );
    
    if (activeClip && activeClip !== currentClip) {
      setCurrentClip(activeClip);
      const src = URL.createObjectURL(activeClip.sourceFile);
      setVideoSrc(src);
      
      return () => {
        URL.revokeObjectURL(src);
      };
    } else if (!activeClip && currentClip) {
      setCurrentClip(null);
      setVideoSrc('');
    }
  }, [currentTime, clips, currentClip]);

  // Update video time based on clip position
  useEffect(() => {
    if (videoRef.current && currentClip) {
      const timeInClip = currentTime - currentClip.position;
      const videoTime = currentClip.startTime + timeInClip;
      
      if (Math.abs(videoRef.current.currentTime - videoTime) > 0.1) {
        videoRef.current.currentTime = videoTime;
      }
    }
  }, [currentTime, currentClip]);

  // Handle play/pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying && currentClip) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentClip]);

  const handleTimeUpdate = () => {
    if (videoRef.current && currentClip && isPlaying) {
      const videoTime = videoRef.current.currentTime;
      const timelineTime = currentClip.position + (videoTime - currentClip.startTime);
      onTimeUpdate(timelineTime);
    }
  };

  const handleLoadedMetadata = () => {
    onLoadedMetadata?.();
  };

  return (
    <div className="bg-black aspect-video flex items-center justify-center">
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          muted
        />
      ) : (
        <div className="text-gray-400 text-center">
          <div className="text-6xl mb-4">📽️</div>
          <p>No video at current position</p>
          <p className="text-sm">Add clips to timeline to preview</p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
