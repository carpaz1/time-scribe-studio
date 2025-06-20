import React, { useRef, useState } from 'react';
import { VideoClip, SourceVideo, CompileRequest } from '@/types/timeline';
import { useTimelineState } from '@/hooks/useTimelineState';
import { usePlaybackControl } from '@/hooks/usePlaybackControl';
import { VideoCompilerService } from '@/services/videoCompiler';
import { useToast } from '@/hooks/use-toast';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ZipDownloaderService } from '@/services/zipDownloader';
import TimelineMain from './TimelineMain';
import VideoPlayerSection from './VideoPlayerSection';
import SidebarSection from './SidebarSection';
import EditorHeader from './EditorHeader';
import SettingsPanel from './SettingsPanel';
import { useProgressTracker } from '@/hooks/useProgressTracker';
import StatusBar from './StatusBar';

interface TimelineEditorProps {
  initialClips?: VideoClip[];
  onExport?: (data: CompileRequest) => void;
}

const TimelineEditor: React.FC<TimelineEditorProps> = ({ 
  initialClips = [], 
  onExport 
}) => {
  const { toast } = useToast();
  const [lastCompilationResult, setLastCompilationResult] = useState<{ downloadUrl?: string; outputFile?: string }>();
  const [compilationProgress, setCompilationProgress] = useState(0);
  const [compilationStage, setCompilationStage] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const progressTracker = useProgressTracker();

  // State management
  const timelineState = useTimelineState(initialClips);
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
  } = timelineState;

  // Playback control
  const { togglePlayback } = usePlaybackControl({
    isPlaying,
    setIsPlaying,
    playheadPosition,
    setPlayheadPosition,
    totalDuration,
  });

  // Enhanced zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, 10));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, 0.1));

  // Video upload handler
  const handleVideoUpload = async (files: File[]) => {
    const videoFiles = files.filter(file => {
      const isVideo = file.type.startsWith('video/') || 
                     file.name.toLowerCase().match(/\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v)$/);
      return isVideo;
    });

    if (videoFiles.length === 0) {
      toast({
        title: "No video files found",
        description: "Please select video files (mp4, avi, mov, etc.)",
        variant: "destructive",
      });
      return;
    }

    progressTracker.startProgress(videoFiles.length, "Processing videos");
    const newSourceVideos: SourceVideo[] = [];
    
    for (let i = 0; i < videoFiles.length; i++) {
      const file = videoFiles[i];
      progressTracker.updateProgress(i + 1, `Processing ${file.name}`);
      
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      
      try {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Timeout loading video: ${file.name}`));
          }, 10000);
          
          videoElement.onloadedmetadata = () => {
            clearTimeout(timeout);
            resolve(null);
          };
          videoElement.onerror = () => {
            clearTimeout(timeout);
            reject(new Error(`Failed to load video: ${file.name}`));
          };
          videoElement.src = URL.createObjectURL(file);
        });
        
        const duration = videoElement.duration;
        
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
        toast({
          title: "Video processing failed",
          description: `Could not process ${file.name}`,
          variant: "destructive",
        });
      }
    }
    
    progressTracker.completeProgress();
    
    if (newSourceVideos.length > 0) {
      setSourceVideos(prev => [...prev, ...newSourceVideos]);
      toast({
        title: "Videos uploaded",
        description: `${newSourceVideos.length} video(s) added to library`,
      });
    }
  };

  // Event handlers with toast notifications
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

  const handleDownloadClips = async () => {
    try {
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
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col overflow-hidden">
      <EditorHeader
        isPlaying={isPlaying}
        isCompiling={isCompiling}
        compilationProgress={compilationProgress}
        compilationStage={compilationStage}
        timelineClipsLength={timelineClips.length}
        onTogglePlayback={togglePlayback}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={() => {
          handleReset();
          toast({ title: "Timeline reset", description: "All clips have been removed and settings reset" });
        }}
        onClearTimeline={() => {
          handleClearTimeline();
          toast({ title: "Timeline cleared", description: "All clips have been removed from timeline" });
        }}
        onExportJSON={handleExportJSON}
        onCompile={handleCompile}
        onDownloadClips={handleDownloadClips}
        onOpenSettings={() => setIsSettingsOpen(true)}
        lastCompilationResult={lastCompilationResult}
      />

      <StatusBar
        isActive={progressTracker.progress.isActive}
        current={progressTracker.progress.current}
        total={progressTracker.progress.total}
        message={progressTracker.progress.message}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <SidebarSection
            clips={clips}
            sourceVideos={sourceVideos}
            timelineClips={timelineClips}
            onClipAdd={handleClipAddWithToast}
            onClipsUpdate={setClips}
            onSourceVideosUpdate={setSourceVideos}
            onClipsGenerated={handleClipsGenerated}
            onRandomizeAll={() => {
              try {
                handleRandomizeAll();
                toast({
                  title: "Clips added",
                  description: "New clips added to timeline",
                });
              } catch (error) {
                toast({
                  title: "No clips available",
                  description: "Generate clips first before adding to timeline",
                  variant: "destructive",
                });
              }
            }}
            onVideoUpload={handleVideoUpload}
            onBulkUpload={(files) => {
              handleVideoUpload(files);
              toast({
                title: "Bulk upload complete",
                description: `${files.length} files imported from directory`,
              });
            }}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={75}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={60} minSize={30}>
              <VideoPlayerSection
                timelineClips={timelineClips}
                playheadPosition={playheadPosition}
                isPlaying={isPlaying}
                onTimeUpdate={setPlayheadPosition}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={40} minSize={25}>
              <TimelineMain
                timelineState={timelineState}
                onClipRemove={(clipId) => {
                  handleClipRemove(clipId);
                  toast({ title: "Clip removed", description: "Clip has been removed from timeline" });
                }}
                onTogglePlayback={togglePlayback}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default TimelineEditor;
