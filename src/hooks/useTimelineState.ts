
import { useState, useEffect, useRef, useCallback } from 'react';
import { VideoClip, SourceVideo } from '@/types/timeline';

export const useTimelineState = (initialClips: VideoClip[] = []) => {
  const [clips, setClips] = useState<VideoClip[]>(initialClips);
  const [sourceVideos, setSourceVideos] = useState<SourceVideo[]>([]);
  const [timelineClips, setTimelineClips] = useState<VideoClip[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [totalDuration, setTotalDuration] = useState(60);
  const [draggedClip, setDraggedClip] = useState<VideoClip | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [timelineScrollOffset, setTimelineScrollOffset] = useState(0);

  // Calculate total timeline duration
  useEffect(() => {
    if (timelineClips.length > 0) {
      const maxEnd = Math.max(...timelineClips.map(clip => clip.position + clip.duration));
      setTotalDuration(Math.max(maxEnd + 10, 60));
    }
  }, [timelineClips]);

  const handleClipAdd = useCallback((clip: VideoClip) => {
    const newClip = {
      ...clip,
      position: timelineClips.length > 0 
        ? Math.max(...timelineClips.map(c => c.position + c.duration)) 
        : 0
    };
    setTimelineClips(prev => [...prev, newClip]);
  }, [timelineClips]);

  const handleClipRemove = useCallback((clipId: string) => {
    setTimelineClips(prev => prev.filter(clip => clip.id !== clipId));
  }, []);

  const handleClipReorder = useCallback((draggedClipId: string, targetPosition: number) => {
    setTimelineClips(prev => {
      const updated = prev.map(clip => 
        clip.id === draggedClipId 
          ? { ...clip, position: targetPosition }
          : clip
      );
      return updated.sort((a, b) => a.position - b.position);
    });
  }, []);

  const handleReset = useCallback(() => {
    setTimelineClips([]);
    setPlayheadPosition(0);
    setIsPlaying(false);
    setZoom(1);
  }, []);

  const handleRandomizeAll = useCallback(() => {
    if (clips.length === 0) {
      throw new Error('No clips available');
    }

    const shuffledClips = [...clips].sort(() => Math.random() - 0.5);
    const newTimelineClips = shuffledClips.map((clip, index) => ({
      ...clip,
      position: index * clip.duration
    }));

    setTimelineClips(newTimelineClips);
  }, [clips]);

  return {
    // State
    clips,
    sourceVideos,
    timelineClips,
    isPlaying,
    playheadPosition,
    zoom,
    totalDuration,
    draggedClip,
    isCompiling,
    timelineScrollOffset,
    
    // Setters
    setClips,
    setSourceVideos,
    setTimelineClips,
    setIsPlaying,
    setPlayheadPosition,
    setZoom,
    setDraggedClip,
    setIsCompiling,
    setTimelineScrollOffset,
    
    // Handlers
    handleClipAdd,
    handleClipRemove,
    handleClipReorder,
    handleReset,
    handleRandomizeAll,
  };
};
