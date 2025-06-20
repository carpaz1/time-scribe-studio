
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VideoClip } from '@/types/timeline';

interface CleanVideoPlayerProps {
  clips: VideoClip[];
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
}

const CleanVideoPlayer: React.FC<CleanVideoPlayerProps> = ({
  clips,
  currentTime,
  isPlaying,
  onTimeUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentClip, setCurrentClip] = useState<VideoClip | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Find and load current clip
  useEffect(() => {
    const activeClip = clips.find(clip => 
      currentTime >= clip.position && currentTime < clip.position + clip.duration
    );

    if (activeClip && activeClip.id !== currentClip?.id) {
      setCurrentClip(activeClip);
      
      try {
        if (videoSrc) {
          URL.revokeObjectURL(videoSrc);
        }
        
        const newSrc = URL.createObjectURL(activeClip.sourceFile);
        setVideoSrc(newSrc);
        setError('');
      } catch (err) {
        console.error('Error loading video:', err);
        setError('Failed to load video file');
      }
    } else if (!activeClip && currentClip) {
      setCurrentClip(null);
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
      setVideoSrc('');
    }
  }, [currentTime, clips, currentClip?.id, videoSrc]);

  // Video time synchronization
  useEffect(() => {
    if (videoRef.current && currentClip && videoSrc) {
      const video = videoRef.current;
      const timeInClip = currentTime - currentClip.position;
      const targetTime = currentClip.startTime + timeInClip;
      
      if (isFinite(targetTime) && isFinite(video.duration) && video.readyState >= 2) {
        const clampedTime = Math.max(0, Math.min(targetTime, video.duration));
        
        if (Math.abs(video.currentTime - clampedTime) > 0.1) {
          video.currentTime = clampedTime;
        }
      }
    }
  }, [currentTime, currentClip, videoSrc]);

  // Play/pause handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc || !currentClip) return;

    if (isPlaying && video.paused && video.readyState >= 2) {
      video.play().catch(console.error);
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
  }, [isPlaying, videoSrc, currentClip]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && currentClip && isPlaying) {
      const video = videoRef.current;
      
      if (isFinite(video.currentTime) && isFinite(currentClip.startTime)) {
        const timelineTime = currentClip.position + (video.currentTime - currentClip.startTime);
        
        if (isFinite(timelineTime)) {
          onTimeUpdate(timelineTime);
        }
      }
    }
  }, [currentClip, isPlaying, onTimeUpdate]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden rounded-lg">
      {error ? (
        <div className="text-red-400 text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-lg">{error}</p>
        </div>
      ) : videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          className="max-w-full max-h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onError={() => setError('Video playback error')}
          muted
          playsInline
          preload="metadata"
        />
      ) : (
        <div className="text-gray-400 text-center">
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-xl mb-2">Video Player Ready</p>
          <p className="text-sm">Add clips to timeline to start preview</p>
          {clips.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">{clips.length} clips loaded</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CleanVideoPlayer;
