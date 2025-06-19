import React, { useRef, useState } from 'react';
import JSZip from 'jszip';
import { VideoClip, CompileRequest } from '@/types/timeline';
import { useTimelineState } from '@/hooks/useTimelineState';
import { usePlaybackControl } from '@/hooks/usePlaybackControl';
import { VideoCompilerService } from '@/services/videoCompiler';
import { useToast } from '@/hooks/use-toast';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
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
  const [compilationProgress, setCompilationProgress] = useState(0);
  const [compilationStage, setCompilationStage] = useState('');

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
    handleClearTimeline,
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

  // Enhanced zoom controls with shift+scroll
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, 10));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, 0.1));

  // Timeline interaction with enhanced scroll support
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
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    } else {
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
      description: "All clips have been removed and settings reset",
    });
  };

  const handleClearTimelineWithToast = () => {
    handleClearTimeline();
    toast({
      title: "Timeline cleared",
      description: "All clips have been removed from timeline",
    });
  };

  // Enhanced download timeline clips functionality with zip
  const handleDownloadClips = async () => {
    if (timelineClips.length === 0) {
      toast({
        title: "No clips to download",
        description: "Add clips to timeline first",
        variant: "destructive",
      });
      return;
    }

    try {
      const zip = new JSZip();
      
      // Add each timeline clip to the zip
      for (let i = 0; i < timelineClips.length; i++) {
        const clip = timelineClips[i];
        const fileName = `timeline_clip_${i + 1}_${clip.name}`;
        
        // Read the file as array buffer
        const arrayBuffer = await clip.sourceFile.arrayBuffer();
        zip.file(fileName, arrayBuffer);
      }

      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `timeline_clips_${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "ZIP download started",
        description: `Downloading ${timelineClips.length} clips as ZIP file`,
      });
    } catch (error) {
      console.error('Error creating zip:', error);
      toast({
        title: "Download failed",
        description: "There was an error creating the ZIP file",
        variant: "destructive",
      });
    }
  };

  // Enhanced compilation with real-time progress
  const handleCompile = async () => {
    try {
      setIsCompiling(true);
      setCompilationProgress(0);
      setCompilationStage('Initializing...');
      
      const config = {
        totalDuration,
        clipOrder: timelineClips.map(clip => clip.id),
        zoom,
        playheadPosition,
      };
      
      const result = await VideoCompilerService.compileTimeline(
        timelineClips, 
        config, 
        onExport,
        (progress: number, stage: string) => {
          setCompilationProgress(progress);
          setCompilationStage(stage);
        }
      );
      
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
      setCompilationProgress(0);
      setCompilationStage('');
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
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 shadow-lg shrink-0">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">⚡</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Video Editor Pro
              </h1>
              <p className="text-slate-400 text-xs">Professional video compilation suite</p>
            </div>
          </div>
          <TimelineControls
            isPlaying={isPlaying}
            isCompiling={isCompiling}
            compilationProgress={compilationProgress}
            compilationStage={compilationStage}
            timelineClipsLength={timelineClips.length}
            onTogglePlayback={togglePlayback}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleResetWithToast}
            onClearTimeline={handleClearTimelineWithToast}
            onExportJSON={handleExportJSON}
            onCompile={handleCompile}
            onDownloadClips={handleDownloadClips}
            lastCompilationResult={lastCompilationResult}
          />
        </div>
      </div>

      {/* Main Content with Resizable Panels */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Clip Library Sidebar */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <ClipLibrary
            clips={clips}
            sourceVideos={sourceVideos}
            onClipAdd={handleClipAddWithToast}
            onClipsUpdate={setClips}
            onSourceVideosUpdate={setSourceVideos}
            onClipsGenerated={handleClipsGenerated}
            onRandomizeAll={handleRandomizeAllWithToast}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Main Content Area */}
        <ResizablePanel defaultSize={75}>
          <ResizablePanelGroup direction="vertical">
            {/* Video Player */}
            <ResizablePanel defaultSize={60} minSize={30}>
              <div className="bg-slate-800/40 backdrop-blur-sm h-full p-4">
                <div className="w-full h-full bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden shadow-xl">
                  <VideoPlayer
                    clips={timelineClips}
                    currentTime={playheadPosition}
                    isPlaying={isPlaying}
                    onTimeUpdate={handleVideoTimeUpdate}
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Timeline Section */}
            <ResizablePanel defaultSize={40} minSize={25}>
              <div className="flex flex-col h-full">
                {/* Timeline Info Bar */}
                <div className="bg-slate-800/40 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-slate-700/50 rounded-lg px-3 py-2">
                        <span className="text-xs text-slate-300">Clips: </span>
                        <span className="text-white font-semibold">{timelineClips.length}</span>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg px-3 py-2">
                        <span className="text-xs text-slate-300">Duration: </span>
                        <span className="text-white font-semibold">{totalDuration.toFixed(1)}s</span>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg px-3 py-2">
                        <span className="text-xs text-slate-300">Zoom: </span>
                        <span className="text-white font-semibold">{zoom.toFixed(1)}x</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="bg-slate-700/50 rounded-lg px-3 py-2">
                        <span className="text-xs text-slate-300">Playhead: </span>
                        <span className="text-white font-semibold">{playheadPosition.toFixed(1)}s</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Shift + Scroll to zoom timeline
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Container */}
                <div className="flex-1 overflow-hidden bg-slate-900">
                  <div className="h-full flex flex-col" onWheel={handleTimelineScroll}>
                    <TimelineRuler
                      totalDuration={totalDuration}
                      zoom={zoom}
                      playheadPosition={playheadPosition}
                    />
                    
                    <div
                      ref={timelineRef}
                      className="flex-1 relative bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-sm border-t border-slate-600/50 cursor-pointer shadow-inner"
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
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default TimelineEditor;
