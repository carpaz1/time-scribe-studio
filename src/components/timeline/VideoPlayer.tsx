
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
  const pendingPlayRef = useRef<Promise<void> | null>(null);
  const isUnmountedRef = useRef(false);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced cleanup function with delayed cleanup to prevent premature revocation
  const cleanupBlobUrl = useCallback((immediate: boolean = false) => {
    // Clear any existing cleanup timeout
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    if (currentBlobUrlRef.current) {
      const urlToRevoke = currentBlobUrlRef.current;
      
      if (immediate) {
        console.log('VideoPlayer: Immediate cleanup of blob URL:', urlToRevoke);
        try {
          URL.revokeObjectURL(urlToRevoke);
        } catch (err) {
          console.warn('VideoPlayer: Error revoking blob URL:', err);
        }
        currentBlobUrlRef.current = '';
      } else {
        // Delay cleanup to allow video to finish loading/playing
        console.log('VideoPlayer: Scheduling delayed cleanup of blob URL:', urlToRevoke);
        cleanupTimeoutRef.current = setTimeout(() => {
          try {
            URL.revokeObjectURL(urlToRevoke);
            console.log('VideoPlayer: Delayed cleanup completed for blob URL:', urlToRevoke);
          } catch (err) {
            console.warn('VideoPlayer: Error in delayed cleanup:', err);
          }
          if (currentBlobUrlRef.current === urlToRevoke) {
            currentBlobUrlRef.current = '';
          }
          cleanupTimeoutRef.current = null;
        }, 5000); // 5 second delay to ensure video is done with the URL
      }
    }
  }, []);

  // Cancel any pending play requests
  const cancelPendingPlay = useCallback(() => {
    if (pendingPlayRef.current) {
      console.log('VideoPlayer: Cancelling pending play request');
      pendingPlayRef.current = null;
    }
  }, []);

  // Find the current clip based on playhead position
  useEffect(() => {
    if (clips.length === 0) {
      if (currentClip) {
        console.log('VideoPlayer: No clips available, clearing player');
        cancelPendingPlay();
        setCurrentClip(null);
        cleanupBlobUrl(true); // Immediate cleanup when no clips
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
      
      // Cancel any pending operations before switching clips
      cancelPendingPlay();
      
      // Store previous clip for delayed cleanup
      const previousClip = currentClip;
      setCurrentClip(activeClip);
      
      // Clean up previous URL with delay
      if (previousClip) {
        cleanupBlobUrl(false);
      }
      
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
      cancelPendingPlay();
      setCurrentClip(null);
      cleanupBlobUrl(false); // Delayed cleanup when clip ends
      setVideoSrc('');
      setError('');
    }
  }, [currentTime, clips, currentClip?.id, cleanupBlobUrl, cancelPendingPlay]);

  // Update video time based on clip position
  useEffect(() => {
    if (videoRef.current && currentClip && videoSrc && !isUnmountedRef.current) {
      const timeInClip = Math.max(0, currentTime - currentClip.position);
      const videoTime = Math.max(0, currentClip.startTime + timeInClip);
      
      // Only update if the difference is significant and video is ready
      if (Math.abs(videoRef.current.currentTime - videoTime) > 0.2 && videoRef.current.readyState >= 2) {
        try {
          videoRef.current.currentTime = videoTime;
          console.log('VideoPlayer: Setting video time to:', videoTime.toFixed(2));
        } catch (err) {
          console.error('VideoPlayer: Error setting video time:', err);
        }
      }
    }
  }, [currentTime, currentClip, videoSrc]);

  // Handle play/pause with improved error handling
  useEffect(() => {
    if (!videoRef.current || !videoSrc || !currentClip || isUnmountedRef.current) {
      return;
    }

    const video = videoRef.current;
    
    if (isPlaying) {
      // Cancel any previous play request
      cancelPendingPlay();
      
      // Check if video is ready to play
      if (video.readyState >= 2) {
        console.log('VideoPlayer: Starting playback for clip:', currentClip.name);
        const playPromise = video.play();
        
        if (playPromise) {
          pendingPlayRef.current = playPromise;
          
          playPromise
            .then(() => {
              if (!isUnmountedRef.current && pendingPlayRef.current === playPromise) {
                console.log('VideoPlayer: Playback started successfully');
                pendingPlayRef.current = null;
              }
            })
            .catch(err => {
              if (!isUnmountedRef.current && pendingPlayRef.current === playPromise) {
                // Only log non-abort errors
                if (err.name !== 'AbortError') {
                  console.error('VideoPlayer: Play error:', err);
                  setError('Failed to play video - check file format');
                }
                pendingPlayRef.current = null;
              }
            });
        }
      }
    } else {
      cancelPendingPlay();
      if (!video.paused) {
        video.pause();
        console.log('VideoPlayer: Playback paused');
      }
    }
  }, [isPlaying, currentClip, videoSrc, cancelPendingPlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('VideoPlayer: Component unmounting');
      isUnmountedRef.current = true;
      cancelPendingPlay();
      
      // Clear cleanup timeout
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
        cleanupTimeoutRef.current = null;
      }
      
      // Immediate cleanup on unmount
      cleanupBlobUrl(true);
    };
  }, [cleanupBlobUrl, cancelPendingPlay]);

  const handleTimeUpdate = () => {
    if (videoRef.current && currentClip && isPlaying && !isUnmountedRef.current) {
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
    
    // If we're supposed to be playing and there's no pending play request, start playing
    if (isPlaying && !pendingPlayRef.current && videoRef.current && !isUnmountedRef.current) {
      const playPromise = videoRef.current.play();
      
      if (playPromise) {
        pendingPlayRef.current = playPromise;
        
        playPromise
          .then(() => {
            if (!isUnmountedRef.current && pendingPlayRef.current === playPromise) {
              console.log('VideoPlayer: Auto-play started after canplay');
              pendingPlayRef.current = null;
            }
          })
          .catch(err => {
            if (!isUnmountedRef.current && pendingPlayRef.current === playPromise && err.name !== 'AbortError') {
              console.error('VideoPlayer: Auto-play error:', err);
              pendingPlayRef.current = null;
            }
          });
      }
    }
  };

  const handleLoadStart = () => {
    console.log('VideoPlayer: Load start for clip:', currentClip?.name);
    setError(''); // Clear any previous errors when starting to load
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
          onLoadStart={handleLoadStart}
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
