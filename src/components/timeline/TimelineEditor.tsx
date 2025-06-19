
import React, { useRef, useState } from 'react';
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
  const [lastCompilationResult, setLastCompilationResult] = useState<{ downloadUrl?: string; outputFile?: string }>();

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
      const existingClipIds = new Set(timelineClips.map(clip => clip.id));
      const availableClips = clips.filter(clip => !existingClipIds.has(clip.id));
      
      if (availableClips.length === 0) {
        toast({
          title: "No new clips",
          description: "All available clips are already on the timeline",
          variant: "destructive",
        });
        return;
      }

      handleRandomizeAll();
      toast({
        title: "Clips added",
        description: `${availableClips.length} new clips added to timeline`,
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
      
      const result = await VideoCompilerService.compileTimeline(timelineClips, config, onExport);
      setLastCompilationResult(result);
      
      toast({
        title: "Compilation completed!",
        description: "Your video has been processed successfully. Click 'Download Video' to save it.",
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
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 shadow-lg">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">⚡</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Timeline Editor
              </h1>
              <p className="text-slate-400 text-sm">Create amazing video compilations</p>
            </div>
          </div>
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
            lastCompilationResult={lastCompilationResult}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Clip Library Sidebar */}
        <div className="w-80 bg-slate-800/60 backdrop-blur-sm border-r border-slate-700/50 flex flex-col">
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
          <div className="bg-slate-800/40 backdrop-blur-sm border-b border-slate-700/50">
            <div className="h-80 p-6">
              <div className="w-full h-full bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden shadow-xl">
                <VideoPlayer
                  clips={timelineClips}
                  currentTime={playheadPosition}
                  isPlaying={isPlaying}
                  onTimeUpdate={handleVideoTimeUpdate}
                />
              </div>
            </div>
          </div>

          {/* Timeline Info Bar */}
          <div className="bg-slate-800/40 backdrop-blur-sm border-b border-slate-700/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="bg-slate-700/50 rounded-lg px-3 py-2">
                  <span className="text-sm text-slate-300">Clips: </span>
                  <span className="text-white font-semibold">{timelineClips.length}</span>
                </div>
                <div className="bg-slate-700/50 rounded-lg px-3 py-2">
                  <span className="text-sm text-slate-300">Duration: </span>
                  <span className="text-white font-semibold">{totalDuration.toFixed(1)}s</span>
                </div>
                <div className="bg-slate-700/50 rounded-lg px-3 py-2">
                  <span className="text-sm text-slate-300">Zoom: </span>
                  <span className="text-white font-semibold">{zoom.toFixed(1)}x</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-slate-700/50 rounded-lg px-3 py-2">
                  <span className="text-sm text-slate-300">Playhead: </span>
                  <span className="text-white font-semibold">{playheadPosition.toFixed(1)}s</span>
                </div>
                <div className="text-sm text-slate-400">
                  Hold Shift + Scroll to navigate timeline
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Container */}
          <div className="flex-1 overflow-auto bg-slate-900">
            <div className="relative min-h-full" onWheel={handleTimelineScroll}>
              <TimelineRuler
                totalDuration={totalDuration}
                zoom={zoom}
                playheadPosition={playheadPosition}
              />
              
              <div
                ref={timelineRef}
                className="relative h-40 bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-sm border-t border-slate-600/50 cursor-pointer shadow-inner"
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
