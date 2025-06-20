
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

  // Stable duration calculation
  const calculatedDuration = useMemo(() => {
    if (timelineClips.length > 0) {
      const maxEnd = Math.max(...timelineClips.map(clip => clip.position + clip.duration));
      return Math.max(maxEnd + 10, 60);
    }
    return 60;
  }, [timelineClips]);

  // Update duration when needed
  useEffect(() => {
    if (Math.abs(calculatedDuration - totalDuration) > 1) {
      setTotalDuration(calculatedDuration);
    }
  }, [calculatedDuration, totalDuration]);

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
          ? { ...clip, position: Math.max(0, targetPosition) }
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

  const handleClearTimeline = useCallback(() => {
    setTimelineClips([]);
    setPlayheadPosition(0);
    setIsPlaying(false);
  }, []);

  const handleRandomizeAll = useCallback(() => {
    if (clips.length === 0) {
      throw new Error('No clips available');
    }

    const existingClipIds = new Set(timelineClips.map(clip => clip.id));
    const availableClips = clips.filter(clip => !existingClipIds.has(clip.id));
    
    if (availableClips.length === 0) {
      throw new Error('All clips are already on the timeline');
    }

    const shuffledClips = [...availableClips]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(availableClips.length, 50));

    const currentEndPosition = timelineClips.length > 0 
      ? Math.max(...timelineClips.map(c => c.position + c.duration))
      : 0;

    const newTimelineClips = shuffledClips.map((clip, index) => ({
      ...clip,
      position: currentEndPosition + (index > 0 ? shuffledClips.slice(0, index).reduce((acc, c) => acc + c.duration, 0) : 0)
    }));

    setTimelineClips(prev => [...prev, ...newTimelineClips]);
  }, [clips, timelineClips]);

  // New method for AI editing
  const handleAIEdit = useCallback((newClips: VideoClip[]) => {
    // Recalculate positions to maintain timeline flow
    let currentPosition = 0;
    const repositionedClips = newClips.map(clip => {
      const newClip = { ...clip, position: currentPosition };
      currentPosition += clip.duration;
      return newClip;
    });
    
    setTimelineClips(repositionedClips);
  }, []);

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
    handleClearTimeline,
    handleRandomizeAll,
    handleAIEdit,
  };
};
