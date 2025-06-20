
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
  const [isLoading, setIsLoading] = useState(false);

  // Real-time preview - Find and load current clip
  useEffect(() => {
    console.log('CleanVideoPlayer: Looking for clip at time:', currentTime);
    console.log('CleanVideoPlayer: Available clips:', clips.map(c => ({ id: c.id, position: c.position, duration: c.duration })));
    
    const activeClip = clips.find(clip => 
      currentTime >= clip.position && currentTime < clip.position + clip.duration
    );

    console.log('CleanVideoPlayer: Found active clip:', activeClip?.name);

    if (activeClip && activeClip.id !== currentClip?.id) {
      console.log('CleanVideoPlayer: Loading new clip for REAL-TIME preview:', activeClip.name);
      setCurrentClip(activeClip);
      setIsLoading(true);
      
      try {
        if (videoSrc) {
          URL.revokeObjectURL(videoSrc);
        }
        
        const newSrc = URL.createObjectURL(activeClip.sourceFile);
        setVideoSrc(newSrc);
        setError('');
        console.log('CleanVideoPlayer: Created video src for REAL-TIME preview:', activeClip.name);
      } catch (err) {
        console.error('CleanVideoPlayer: Error loading video for preview:', err);
        setError('Failed to load video file');
        setIsLoading(false);
      }
    } else if (!activeClip && currentClip) {
      console.log('CleanVideoPlayer: No active clip, clearing preview');
      setCurrentClip(null);
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
      setVideoSrc('');
    }
  }, [currentTime, clips, currentClip?.id, videoSrc]);

  // Video time synchronization
  useEffect(() => {
    if (videoRef.current && currentClip && videoSrc && !isLoading) {
      const video = videoRef.current;
      const timeInClip = currentTime - currentClip.position;
      const targetTime = (currentClip.startTime || 0) + timeInClip;
      
      if (
        isFinite(targetTime) && 
        isFinite(video.duration) && 
        video.readyState >= 2 &&
        targetTime >= 0 &&
        targetTime <= video.duration
      ) {
        if (Math.abs(video.currentTime - targetTime) > 0.1) {
          console.log('CleanVideoPlayer: Setting video time to:', targetTime.toFixed(2));
          video.currentTime = targetTime;
        }
      }
    }
  }, [currentTime, currentClip, videoSrc, isLoading]);

  // Play/pause handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc || !currentClip || isLoading) return;

    if (isPlaying && video.paused && video.readyState >= 2) {
      video.play().catch(console.error);
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
  }, [isPlaying, videoSrc, currentClip, isLoading]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && currentClip && isPlaying && !isLoading) {
      const video = videoRef.current;
      const startTime = currentClip.startTime || 0;
      
      if (isFinite(video.currentTime) && isFinite(startTime)) {
        const timelineTime = currentClip.position + (video.currentTime - startTime);
        
        if (isFinite(timelineTime) && timelineTime >= 0) {
          onTimeUpdate(timelineTime);
        }
      }
    }
  }, [currentClip, isPlaying, onTimeUpdate, isLoading]);

  const handleLoadedMetadata = useCallback(() => {
    console.log('CleanVideoPlayer: Video metadata loaded');
    setIsLoading(false);
  }, []);

  const handleCanPlay = useCallback(() => {
    console.log('CleanVideoPlayer: Video can play');
    setIsLoading(false);
  }, []);

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
        <>
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="text-white">Loading preview...</div>
            </div>
          )}
          <video
            ref={videoRef}
            src={videoSrc}
            className="max-w-full max-h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={handleCanPlay}
            onError={() => {
              setError('Video playback error');
              setIsLoading(false);
            }}
            muted
            playsInline
            preload="metadata"
          />
        </>
      ) : (
        <div className="text-gray-400 text-center">
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-xl mb-2">Real-Time Video Preview</p>
          <p className="text-sm">Add clips to timeline for instant preview</p>
          {clips.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">{clips.length} clips ready for preview</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CleanVideoPlayer;
