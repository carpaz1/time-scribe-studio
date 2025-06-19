
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
  const [error, setError] = useState<string>('');

  // Find the current clip based on playhead position
  useEffect(() => {
    console.log('Checking for active clip at time:', currentTime, 'from clips:', clips.length);
    
    const activeClip = clips.find(clip => 
      currentTime >= clip.position && currentTime < clip.position + clip.duration
    );
    
    if (activeClip && activeClip !== currentClip) {
      console.log('Switching to clip:', activeClip.name);
      setCurrentClip(activeClip);
      
      // Clean up previous URL
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
      
      try {
        const src = URL.createObjectURL(activeClip.sourceFile);
        setVideoSrc(src);
        setError('');
        console.log('Created video src:', src);
      } catch (err) {
        console.error('Error creating video source:', err);
        setError('Failed to load video');
      }
    } else if (!activeClip && currentClip) {
      console.log('No active clip at current time');
      setCurrentClip(null);
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
      setVideoSrc('');
      setError('');
    }
  }, [currentTime, clips, currentClip]);

  // Update video time based on clip position
  useEffect(() => {
    if (videoRef.current && currentClip && videoSrc) {
      const timeInClip = currentTime - currentClip.position;
      const videoTime = currentClip.startTime + timeInClip;
      
      console.log('Setting video time to:', videoTime, 'for clip time:', timeInClip);
      
      if (Math.abs(videoRef.current.currentTime - videoTime) > 0.1) {
        videoRef.current.currentTime = videoTime;
      }
    }
  }, [currentTime, currentClip, videoSrc]);

  // Handle play/pause
  useEffect(() => {
    if (videoRef.current && videoSrc) {
      if (isPlaying && currentClip) {
        console.log('Playing video');
        videoRef.current.play().catch(err => {
          console.error('Play error:', err);
          setError('Failed to play video');
        });
      } else {
        console.log('Pausing video');
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentClip, videoSrc]);

  const handleTimeUpdate = () => {
    if (videoRef.current && currentClip && isPlaying) {
      const videoTime = videoRef.current.currentTime;
      const timelineTime = currentClip.position + (videoTime - currentClip.startTime);
      onTimeUpdate(timelineTime);
    }
  };

  const handleLoadedMetadata = () => {
    console.log('Video metadata loaded');
    onLoadedMetadata?.();
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video error:', e);
    setError('Video playback error');
  };

  return (
    <div className="bg-black aspect-video flex items-center justify-center">
      {error ? (
        <div className="text-red-400 text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <p>{error}</p>
        </div>
      ) : videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleError}
          muted
          playsInline
        />
      ) : (
        <div className="text-gray-400 text-center">
          <div className="text-6xl mb-4">📽️</div>
          <p>No video at current position</p>
          <p className="text-sm">Add clips to timeline to preview</p>
          {clips.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {clips.length} clips available
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
