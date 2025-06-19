
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

  // Calculate total timeline duration with memoization
  const calculatedDuration = useMemo(() => {
    if (timelineClips.length > 0) {
      const maxEnd = Math.max(...timelineClips.map(clip => clip.position + clip.duration));
      return Math.max(maxEnd + 10, 60);
    }
    return 60;
  }, [timelineClips]);

  useEffect(() => {
    if (calculatedDuration !== totalDuration) {
      console.log('useTimelineState: Updating total duration from', totalDuration, 'to', calculatedDuration);
      setTotalDuration(calculatedDuration);
    }
  }, [calculatedDuration, totalDuration]);

  const handleClipAdd = useCallback((clip: VideoClip) => {
    console.log('useTimelineState: Adding clip to timeline:', clip.name);
    const newClip = {
      ...clip,
      position: timelineClips.length > 0 
        ? Math.max(...timelineClips.map(c => c.position + c.duration)) 
        : 0
    };
    setTimelineClips(prev => [...prev, newClip]);
  }, [timelineClips]);

  const handleClipRemove = useCallback((clipId: string) => {
    console.log('useTimelineState: Removing clip from timeline:', clipId);
    setTimelineClips(prev => prev.filter(clip => clip.id !== clipId));
  }, []);

  const handleClipReorder = useCallback((draggedClipId: string, targetPosition: number) => {
    console.log('useTimelineState: Reordering clip:', draggedClipId, 'to position:', targetPosition);
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
    console.log('useTimelineState: Resetting timeline');
    setTimelineClips([]);
    setPlayheadPosition(0);
    setIsPlaying(false);
    setZoom(1);
  }, []);

  const handleClearTimeline = useCallback(() => {
    console.log('useTimelineState: Clearing timeline');
    setTimelineClips([]);
    setPlayheadPosition(0);
    setIsPlaying(false);
  }, []);

  const handleRandomizeAll = useCallback(() => {
    if (clips.length === 0) {
      throw new Error('No clips available');
    }

    // Get clips that aren't already on the timeline
    const existingClipIds = new Set(timelineClips.map(clip => clip.id));
    const availableClips = clips.filter(clip => !existingClipIds.has(clip.id));
    
    if (availableClips.length === 0) {
      throw new Error('All clips are already on the timeline');
    }

    console.log('useTimelineState: Adding', availableClips.length, 'clips to timeline');
    const shuffledClips = [...availableClips].sort(() => Math.random() - 0.5);
    
    // Calculate starting position (end of current timeline)
    const currentEndPosition = timelineClips.length > 0 
      ? Math.max(...timelineClips.map(c => c.position + c.duration))
      : 0;

    const newTimelineClips = shuffledClips.map((clip, index) => ({
      ...clip,
      position: currentEndPosition + (index > 0 ? shuffledClips.slice(0, index).reduce((acc, c) => acc + c.duration, 0) : 0)
    }));

    setTimelineClips(prev => [...prev, ...newTimelineClips]);
  }, [clips, timelineClips]);

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
  };
};
