
import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  const currentBlobUrlRef = useRef<string>('');

  // Enhanced cleanup function for blob URLs
  const cleanupBlobUrl = useCallback(() => {
    if (currentBlobUrlRef.current) {
      console.log('VideoPlayer: Cleaning up blob URL:', currentBlobUrlRef.current);
      try {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      } catch (err) {
        console.warn('VideoPlayer: Error revoking blob URL:', err);
      }
      currentBlobUrlRef.current = '';
    }
  }, []);

  // Find the current clip based on playhead position with improved logging
  useEffect(() => {
    if (clips.length === 0) {
      if (currentClip) {
        console.log('VideoPlayer: No clips available, clearing player');
        setCurrentClip(null);
        cleanupBlobUrl();
        setVideoSrc('');
        setError('');
      }
      return;
    }

    const activeClip = clips.find(clip => 
      currentTime >= clip.position && currentTime < clip.position + clip.duration
    );
    
    if (activeClip && activeClip.id !== currentClip?.id) {
      console.log('VideoPlayer: Switching to clip:', activeClip.name, 'at position:', activeClip.position);
      setCurrentClip(activeClip);
      
      // Clean up previous URL
      cleanupBlobUrl();
      
      try {
        const src = URL.createObjectURL(activeClip.sourceFile);
        currentBlobUrlRef.current = src;
        setVideoSrc(src);
        setError('');
        console.log('VideoPlayer: Created new video src for clip:', activeClip.name);
      } catch (err) {
        console.error('VideoPlayer: Error creating video source:', err);
        setError('Failed to load video - file may be corrupted');
      }
    } else if (!activeClip && currentClip) {
      console.log('VideoPlayer: No active clip at current time, clearing player');
      setCurrentClip(null);
      cleanupBlobUrl();
      setVideoSrc('');
      setError('');
    }
  }, [currentTime, clips, currentClip?.id, cleanupBlobUrl]);

  // Update video time based on clip position with better error handling
  useEffect(() => {
    if (videoRef.current && currentClip && videoSrc) {
      const timeInClip = Math.max(0, currentTime - currentClip.position);
      const videoTime = Math.max(0, currentClip.startTime + timeInClip);
      
      // Only update if the difference is significant and video is ready
      if (Math.abs(videoRef.current.currentTime - videoTime) > 0.2 && videoRef.current.readyState >= 2) {
        try {
          videoRef.current.currentTime = videoTime;
          console.log('VideoPlayer: Setting video time to:', videoTime.toFixed(2), 
                      'for clip time:', timeInClip.toFixed(2), 
                      'clip start:', currentClip.startTime);
        } catch (err) {
          console.error('VideoPlayer: Error setting video time:', err);
        }
      }
    }
  }, [currentTime, currentClip, videoSrc]);

  // Handle play/pause with better error handling
  useEffect(() => {
    if (videoRef.current && videoSrc && currentClip) {
      if (isPlaying) {
        videoRef.current.play().catch(err => {
          console.error('VideoPlayer: Play error:', err);
          setError('Failed to play video - check file format');
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentClip, videoSrc]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupBlobUrl();
    };
  }, [cleanupBlobUrl]);

  const handleTimeUpdate = () => {
    if (videoRef.current && currentClip && isPlaying) {
      const videoTime = videoRef.current.currentTime;
      const timelineTime = currentClip.position + (videoTime - currentClip.startTime);
      onTimeUpdate(timelineTime);
    }
  };

  const handleLoadedMetadata = () => {
    console.log('VideoPlayer: Video metadata loaded for clip:', currentClip?.name);
    onLoadedMetadata?.();
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('VideoPlayer: Video playback error:', e);
    setError('Video playback error - file may be corrupted or unsupported format');
  };

  const handleCanPlay = () => {
    console.log('VideoPlayer: Video can play for clip:', currentClip?.name);
  };

  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      {error ? (
        <div className="text-red-400 text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <p>{error}</p>
          <p className="text-sm text-gray-500 mt-2">Check console for details</p>
        </div>
      ) : videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          className="max-w-full max-h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onError={handleError}
          muted
          playsInline
          preload="metadata"
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
