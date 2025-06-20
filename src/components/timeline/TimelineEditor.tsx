import React, { useRef, useState } from 'react';
import JSZip from 'jszip';
import { VideoClip, SourceVideo, CompileRequest } from '@/types/timeline';
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
import { ZipDownloaderService } from '@/services/zipDownloader';

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

  const handleVideoUpload = async (files: File[]) => {
    // Convert File[] to SourceVideo[]
    const newSourceVideos: SourceVideo[] = [];
    
    for (const file of files) {
      // Create video element to get duration and thumbnail
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      
      try {
        await new Promise((resolve, reject) => {
          videoElement.onloadedmetadata = () => resolve(null);
          videoElement.onerror = () => reject(new Error(`Failed to load video: ${file.name}`));
          videoElement.src = URL.createObjectURL(file);
        });
        
        const duration = videoElement.duration;
        
        // Create thumbnail
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 160;
        canvas.height = 90;
        videoElement.currentTime = Math.min(1, duration / 2);
        
        await new Promise(resolve => {
          videoElement.onseeked = () => {
            if (ctx) {
              ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            }
            resolve(null);
          };
        });
        
        const thumbnail = canvas.toDataURL();
        URL.revokeObjectURL(videoElement.src);
        
        const sourceVideo: SourceVideo = {
          id: `source-${Date.now()}-${Math.random()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          file,
          duration,
          thumbnail,
        };
        
        newSourceVideos.push(sourceVideo);
      } catch (error) {
        console.error('Error processing video:', error);
        // Create fallback SourceVideo with default values
        const sourceVideo: SourceVideo = {
          id: `source-${Date.now()}-${Math.random()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          file,
          duration: 0,
          thumbnail: '',
        };
        newSourceVideos.push(sourceVideo);
      }
    }
    
    setSourceVideos(prev => [...prev, ...newSourceVideos]);
    toast({
      title: "Videos uploaded",
      description: `${files.length} video(s) added to library`,
    });
  };

  const handleBulkUpload = (files: File[]) => {
    handleVideoUpload(files);
    toast({
      title: "Bulk upload complete",
      description: `${files.length} files imported from directory`,
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
    try {
      console.log('TimelineEditor: Starting ZIP download for', timelineClips.length, 'clips');
      await ZipDownloaderService.downloadClipsAsZip(timelineClips);
      toast({
        title: "Success",
        description: `Downloaded ${timelineClips.length} clips as ZIP file`,
      });
    } catch (error) {
      console.error('ZIP download error:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to create ZIP file",
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

  const handleBulkProcessing = (generatedClips: VideoClip[], newSourceVideos: SourceVideo[]) => {
    setClips(prev => [...prev, ...generatedClips]);
    setSourceVideos(prev => [...prev, ...newSourceVideos]);
    toast({
      title: "Bulk processing complete",
      description: `Generated ${generatedClips.length} clips from selected files`,
    });
  };

  // Create proper handler functions for ClipLibrary props
  const handleSourceVideosUpdate = (videos: SourceVideo[]) => {
    setSourceVideos(videos);
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col overflow-hidden">
      {/* Enhanced Header with Glassmorphism */}
      <div className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50 shadow-2xl shrink-0">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">⚡</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Video Editor Pro
              </h1>
              <p className="text-slate-400 text-sm font-medium">Professional video compilation suite</p>
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
        {/* Enhanced Clip Library Sidebar */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <ClipLibrary
            clips={clips}
            sourceVideos={sourceVideos}
            onClipAdd={handleClipAddWithToast}
            onClipsUpdate={setClips}
            onSourceVideosUpdate={handleSourceVideosUpdate}
            onClipsGenerated={handleClipsGenerated}
            onRandomizeAll={handleRandomizeAllWithToast}
            onVideoUpload={handleVideoUpload}
            onBulkUpload={handleBulkUpload}
            onBulkProcessing={handleBulkProcessing}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Main Content Area */}
        <ResizablePanel defaultSize={75}>
          <ResizablePanelGroup direction="vertical">
            {/* Enhanced Video Player */}
            <ResizablePanel defaultSize={60} minSize={30}>
              <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-sm h-full p-6">
                <div className="w-full h-full bg-slate-900/70 rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl backdrop-blur-md">
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

            {/* Enhanced Timeline Section */}
            <ResizablePanel defaultSize={40} minSize={25}>
              <div className="flex flex-col h-full">
                {/* Enhanced Timeline Info Bar */}
                <div className="bg-slate-800/60 backdrop-blur-md border-b border-slate-700/50 px-6 py-4 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-lg px-4 py-2 border border-emerald-500/30">
                        <span className="text-xs text-emerald-400 font-medium">Clips: </span> 
                        <span className="text-white font-bold">{timelineClips.length}</span>
                      </div>
                      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg px-4 py-2 border border-blue-500/30">
                        <span className="text-xs text-blue-400 font-medium">Duration: </span> 
                        <span className="text-white font-bold">{totalDuration.toFixed(1)}s</span>
                      </div>
                      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg px-4 py-2 border border-purple-500/30">
                        <span className="text-xs text-purple-400 font-medium">Zoom: </span> 
                        <span className="text-white font-bold">{zoom.toFixed(1)}x</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="bg-slate-700/50 rounded-lg px-4 py-2 border border-slate-600/50">
                        <span className="text-xs text-slate-300 font-medium">Playhead: </span> 
                        <span className="text-white font-bold">{playheadPosition.toFixed(1)}s</span>
                      </div>
                      <div className="text-xs text-slate-400 bg-slate-700/30 px-3 py-2 rounded-lg border border-slate-600/30">
                        ⇧ + Scroll to zoom timeline
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Timeline Container */}
                <div className="flex-1 overflow-hidden bg-gradient-to-br from-slate-900/90 to-slate-800/90">
                  <div className="h-full flex flex-col" onWheel={handleTimelineScroll}>
                    <TimelineRuler
                      totalDuration={totalDuration}
                      zoom={zoom}
                      playheadPosition={playheadPosition}
                    />
                    
                    <div
                      ref={timelineRef}
                      className="flex-1 relative bg-gradient-to-r from-slate-800/60 via-slate-700/60 to-slate-800/60 backdrop-blur-sm border-t border-slate-600/50 cursor-pointer shadow-inner"
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
