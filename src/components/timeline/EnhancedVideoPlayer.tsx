
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VideoClip } from '@/types/timeline';
import GPUAccelerator from '@/services/gpuAccelerator';

interface EnhancedVideoPlayerProps {
  clips: VideoClip[];
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onLoadedMetadata?: () => void;
}

const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({
  clips,
  currentTime,
  isPlaying,
  onTimeUpdate,
  onLoadedMetadata,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentClip, setCurrentClip] = useState<VideoClip | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isGPUEnabled, setIsGPUEnabled] = useState(false);
  const gpuRef = useRef<GPUAccelerator>();

  useEffect(() => {
    // Initialize GPU acceleration
    const initGPU = async () => {
      gpuRef.current = GPUAccelerator.getInstance();
      const available = await gpuRef.current.initialize();
      setIsGPUEnabled(available);
      console.log('EnhancedVideoPlayer: GPU acceleration', available ? 'enabled' : 'disabled');
    };
    initGPU();
  }, []);

  // Find and load current clip
  useEffect(() => {
    const activeClip = clips.find(clip => 
      currentTime >= clip.position && currentTime < clip.position + clip.duration
    );

    if (activeClip && activeClip.id !== currentClip?.id) {
      console.log('EnhancedVideoPlayer: Loading clip:', activeClip.name);
      setCurrentClip(activeClip);
      
      try {
        if (videoSrc) {
          URL.revokeObjectURL(videoSrc);
        }
        
        const newSrc = URL.createObjectURL(activeClip.sourceFile);
        setVideoSrc(newSrc);
        setError('');
      } catch (err) {
        console.error('EnhancedVideoPlayer: Error loading video:', err);
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

  // Enhanced video time synchronization
  useEffect(() => {
    if (videoRef.current && currentClip && videoSrc) {
      const video = videoRef.current;
      const timeInClip = currentTime - currentClip.position;
      const targetTime = currentClip.startTime + timeInClip;
      
      // More precise time sync
      if (Math.abs(video.currentTime - targetTime) > 0.1) {
        video.currentTime = Math.max(0, Math.min(targetTime, video.duration));
      }
    }
  }, [currentTime, currentClip, videoSrc]);

  // Enhanced play/pause handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc || !currentClip) return;

    const handlePlayback = async () => {
      try {
        if (isPlaying) {
          if (video.paused && video.readyState >= 2) {
            await video.play();
            console.log('EnhancedVideoPlayer: Playback started');
          }
        } else {
          if (!video.paused) {
            video.pause();
            console.log('EnhancedVideoPlayer: Playback paused');
          }
        }
      } catch (error) {
        console.error('EnhancedVideoPlayer: Playback error:', error);
        setError('Playback failed - check video format');
      }
    };

    handlePlayback();
  }, [isPlaying, videoSrc, currentClip]);

  // GPU-accelerated frame processing
  const processFrame = useCallback(async () => {
    if (!isGPUEnabled || !videoRef.current || !canvasRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.readyState >= 2) {
        const imageData = await gpuRef.current!.processVideoFrameGPU(video, canvas.width, canvas.height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.putImageData(imageData, 0, 0);
        }
      }
    } catch (error) {
      console.warn('EnhancedVideoPlayer: GPU frame processing failed:', error);
    }
  }, [isGPUEnabled]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && currentClip && isPlaying) {
      const video = videoRef.current;
      const timelineTime = currentClip.position + (video.currentTime - currentClip.startTime);
      onTimeUpdate(timelineTime);
      
      // Process frame for GPU effects
      if (isGPUEnabled) {
        processFrame();
      }
    }
  }, [currentClip, isPlaying, onTimeUpdate, processFrame, isGPUEnabled]);

  const handleLoadedMetadata = useCallback(() => {
    console.log('EnhancedVideoPlayer: Metadata loaded for:', currentClip?.name);
    onLoadedMetadata?.();
  }, [currentClip?.name, onLoadedMetadata]);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error('EnhancedVideoPlayer: Video error:', e);
    setError('Video playback error - unsupported format or corrupted file');
  }, []);

  const handleCanPlay = useCallback(() => {
    console.log('EnhancedVideoPlayer: Video ready to play:', currentClip?.name);
    if (isPlaying && videoRef.current?.paused) {
      videoRef.current.play().catch(console.error);
    }
  }, [currentClip?.name, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {/* GPU Status Indicator */}
      {isGPUEnabled && (
        <div className="absolute top-2 right-2 z-10 bg-green-600/80 text-white text-xs px-2 py-1 rounded">
          GPU Accelerated
        </div>
      )}

      {error ? (
        <div className="text-red-400 text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-lg mb-2">{error}</p>
          <p className="text-sm text-gray-400">Check console for details</p>
        </div>
      ) : videoSrc ? (
        <>
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
          
          {/* GPU-processed canvas overlay (hidden by default) */}
          {isGPUEnabled && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 max-w-full max-h-full object-contain opacity-0 pointer-events-none"
              width={640}
              height={360}
            />
          )}
        </>
      ) : (
        <div className="text-gray-400 text-center">
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-xl mb-2">Enhanced Video Player Ready</p>
          <p className="text-sm mb-4">Add clips to timeline to start preview</p>
          {clips.length > 0 && (
            <div className="text-xs text-gray-500">
              <p>{clips.length} clips loaded</p>
              <p>GPU: {isGPUEnabled ? 'Enabled' : 'CPU Fallback'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedVideoPlayer;
