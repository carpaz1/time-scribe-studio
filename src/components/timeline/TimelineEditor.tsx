
import React, { useRef } from 'react';
import { VideoClip, CompileRequest } from '@/types/timeline';
import { useTimelineState } from '@/hooks/useTimelineState';
import { usePlaybackControl } from '@/hooks/usePlaybackControl';
import { VideoCompilerService } from '@/services/videoCompiler';
import { useToast } from '@/hooks/use-toast';
import TimelineTrack from './TimelineTrack';
import Playhead from './Playhead';
import TimelineRuler from './TimelineRuler';
import ClipLibrary from './ClipLibrary';
import VideoPlayer from './VideoPlayer';
import TimelineControls from './TimelineControls';

interface TimelineEditorProps {
  initialClips?: VideoClip[];
  onExport?: (data: CompileRequest) => void;
}

const TimelineEditor: React.FC<TimelineEditorProps> = ({ 
  initialClips = [], 
  onExport 
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // State management
  const {
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
    setClips,
    setSourceVideos,
    setIsPlaying,
    setPlayheadPosition,
    setZoom,
    setDraggedClip,
    setIsCompiling,
    setTimelineScrollOffset,
    handleClipAdd,
    handleClipRemove,
    handleClipReorder,
    handleReset,
    handleRandomizeAll,
  } = useTimelineState(initialClips);

  // Playback control
  const { togglePlayback } = usePlaybackControl({
    isPlaying,
    setIsPlaying,
    playheadPosition,
    setPlayheadPosition,
    totalDuration,
  });

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, 10));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, 0.1));

  // Timeline interaction
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newPosition = (x / rect.width) * (totalDuration / zoom);
    setPlayheadPosition(Math.max(0, Math.min(totalDuration, newPosition)));
  };

  const handleTimelineScroll = (e: React.WheelEvent) => {
    if (e.shiftKey) {
      e.preventDefault();
      const scrollAmount = e.deltaY * 0.5;
      setTimelineScrollOffset(prev => Math.max(0, prev + scrollAmount));
    }
  };

  // Video player events
  const handleVideoTimeUpdate = (time: number) => {
    setPlayheadPosition(time);
  };

  // Clip library events
  const handleClipsGenerated = (generatedClips: VideoClip[]) => {
    setClips(generatedClips);
    toast({
      title: "Clips ready",
      description: `${generatedClips.length} clips generated and ready to add to timeline`,
    });
  };

  const handleClipAddWithToast = (clip: VideoClip) => {
    handleClipAdd(clip);
    toast({
      title: "Clip added",
      description: `${clip.name} has been added to the timeline`,
    });
  };

  const handleClipRemoveWithToast = (clipId: string) => {
    handleClipRemove(clipId);
    toast({
      title: "Clip removed",
      description: "Clip has been removed from timeline",
    });
  };

  const handleRandomizeAllWithToast = () => {
    try {
      handleRandomizeAll();
      toast({
        title: "All clips added",
        description: `${clips.length} clips added to timeline in random order`,
      });
    } catch (error) {
      toast({
        title: "No clips available",
        description: "Generate clips first before adding to timeline",
        variant: "destructive",
      });
    }
  };

  const handleResetWithToast = () => {
    handleReset();
    toast({
      title: "Timeline reset",
      description: "All clips have been removed",
    });
  };

  // Compilation
  const handleCompile = async () => {
    try {
      setIsCompiling(true);
      const config = {
        totalDuration,
        clipOrder: timelineClips.map(clip => clip.id),
        zoom,
        playheadPosition,
      };
      
      await VideoCompilerService.compileTimeline(timelineClips, config, onExport);
      
      toast({
        title: "Compilation started",
        description: "Your video is being processed",
      });
    } catch (error) {
      console.error('Compilation error:', error);
      toast({
        title: "Compilation failed",
        description: error instanceof Error ? error.message : "There was an error processing your video",
        variant: "destructive",
      });
    } finally {
      setIsCompiling(false);
    }
  };

  const handleExportJSON = () => {
    VideoCompilerService.exportTimelineJSON(timelineClips, totalDuration, zoom, playheadPosition);
    toast({
      title: "Timeline exported",
      description: "Timeline configuration saved as JSON",
    });
  };

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Timeline Editor</h1>
          <TimelineControls
            isPlaying={isPlaying}
            isCompiling={isCompiling}
            timelineClipsLength={timelineClips.length}
            onTogglePlayback={togglePlayback}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleResetWithToast}
            onExportJSON={handleExportJSON}
            onCompile={handleCompile}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Clip Library Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <ClipLibrary
            clips={clips}
            sourceVideos={sourceVideos}
            onClipAdd={handleClipAddWithToast}
            onClipsUpdate={setClips}
            onSourceVideosUpdate={setSourceVideos}
            onClipsGenerated={handleClipsGenerated}
            onRandomizeAll={handleRandomizeAllWithToast}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Player */}
          <div className="bg-gray-800 border-b border-gray-700">
            <div className="h-80 p-4">
              <VideoPlayer
                clips={timelineClips}
                currentTime={playheadPosition}
                isPlaying={isPlaying}
                onTimeUpdate={handleVideoTimeUpdate}
              />
            </div>
          </div>

          {/* Timeline Info */}
          <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between">
            <div className="text-sm text-gray-300">
              Clips: {timelineClips.length} | Duration: {totalDuration.toFixed(1)}s | Zoom: {zoom.toFixed(1)}x
            </div>
            <div className="text-sm text-gray-300">
              Playhead: {playheadPosition.toFixed(1)}s | Hold Shift + Scroll to navigate timeline
            </div>
          </div>

          {/* Timeline Container */}
          <div className="flex-1 overflow-auto bg-gray-900">
            <div className="relative" onWheel={handleTimelineScroll}>
              <TimelineRuler
                totalDuration={totalDuration}
                zoom={zoom}
                playheadPosition={playheadPosition}
              />
              
              <div
                ref={timelineRef}
                className="relative h-32 bg-gray-800 border-t border-gray-700 cursor-pointer"
                onClick={handleTimelineClick}
              >
                <TimelineTrack
                  clips={timelineClips}
                  totalDuration={totalDuration}
                  zoom={zoom}
                  onClipRemove={handleClipRemoveWithToast}
                  onClipReorder={handleClipReorder}
                  draggedClip={draggedClip}
                  setDraggedClip={setDraggedClip}
                  scrollOffset={timelineScrollOffset}
                />
                
                <Playhead
                  position={playheadPosition}
                  totalDuration={totalDuration}
                  zoom={zoom}
                  onPositionChange={setPlayheadPosition}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineEditor;
