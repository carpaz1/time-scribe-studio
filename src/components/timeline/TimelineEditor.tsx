import React, { useState, useCallback, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from "@/hooks/use-toast";
import { useProgressTracker } from '@/hooks/useProgressTracker';
import { VideoClip, CompileRequest } from '@/types/timeline';
import { VideoCompilerService } from '@/services/videoCompiler';
import VideoUploadStep from './VideoUploadStep';
import ConfigurationStep from './ConfigurationStep';
import RandomizeStep from './RandomizeStep';
import ClipLibrary from './ClipLibrary';
import VideoPlayerSection from './VideoPlayerSection';
import TimelineMain from './TimelineMain';
import TimelineControls from './TimelineControls';
import StatusBar from './StatusBar';
import SettingsPanel from './SettingsPanel';
import EditorHeader from './EditorHeader';

interface TimelineEditorProps {
  onExport?: (data: CompileRequest) => void;
}

const TimelineEditor: React.FC<TimelineEditorProps> = ({ onExport }) => {
  const [sourceVideos, setSourceVideos] = useState<File[]>([]);
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [timelineClips, setTimelineClips] = useState<VideoClip[]>([]);
  const [totalDuration, setTotalDuration] = useState(60);
  const [zoom, setZoom] = useState(100);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedClip, setDraggedClip] = useState<VideoClip | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [lastCompilationResult, setLastCompilationResult] = useState<{ downloadUrl?: string; outputFile?: string } | undefined>(undefined);
  const [showVideoPreview, setShowVideoPreview] = useState(false);

  const { progress, startProgress, updateProgress, completeProgress, resetProgress } = useProgressTracker();

  const nextClipId = useRef(1);

  const handleFilesSelected = (files: File[]) => {
    setSourceVideos(prevFiles => [...prevFiles, ...files]);
  };

  const handleRemoveFile = (name: string) => {
    setSourceVideos(prevFiles => prevFiles.filter(file => file.name !== name));
  };

  const handleClearAll = () => {
    setSourceVideos([]);
    setClips([]);
    setTimelineClips([]);
    resetProgress();
  };

  const togglePlayback = useCallback(() => {
    setIsPlaying(isPlaying => !isPlaying);
  }, []);

  const handleZoomIn = () => {
    setZoom(zoom => Math.min(zoom + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(zoom => Math.max(zoom - 10, 10));
  };

  const handleReset = () => {
    setZoom(100);
    setPlayheadPosition(0);
  };

  const handleClearTimeline = () => {
    setTimelineClips([]);
    setPlayheadPosition(0);
  };

  const handleExportJSON = () => {
    VideoCompilerService.exportTimelineJSON(timelineClips, totalDuration, zoom, playheadPosition);
  };

  const handleAddToTimeline = (clip: VideoClip) => {
    const newClip = { ...clip, position: 0 };
    setTimelineClips(prevClips => [...prevClips, newClip]);
  };

  const handleRemoveClip = (id: number) => {
    setClips(prevClips => prevClips.filter(clip => clip.id !== id));
  };

  const handleClearLibrary = () => {
    setClips([]);
  };

  const handleClipDragStart = (clip: VideoClip) => {
    setIsDragging(true);
    setDraggedClip(clip);
  };

  const handleClipDragEnd = () => {
    setIsDragging(false);
    setDraggedClip(null);
  };

  const handleClipRemove = (id: number) => {
    setTimelineClips(prevClips => prevClips.filter(clip => clip.id !== id));
  };

  const handleDownloadClips = async () => {
    if (clips.length === 0) {
      toast({
        title: "No clips to download",
        description: "Generate clips first",
        variant: "destructive",
      });
      return;
    }

    startProgress(clips.length, 'Preparing clips for download...');

    const zip = new (window as any).JSZip();
    clips.forEach((clip, index) => {
      zip.file(clip.name, clip.sourceFile.slice(clip.startTime * 1000, clip.duration * 1000, clip.sourceFile.type));
      updateProgress(index + 1, `Adding ${clip.name} to ZIP...`);
    });

    completeProgress();

    try {
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'video-clips.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: "Your clips are being downloaded as a ZIP file",
      });
    } catch (error) {
      console.error("Error generating ZIP file:", error);
      toast({
        title: "Download failed",
        description: "Failed to create ZIP file. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateClips = async (config: any) => {
    if (sourceVideos.length === 0) {
      toast({
        title: "No videos uploaded",
        description: "Please upload videos first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    const videosToProcess = config.videoSelectionMode === 'all' ? sourceVideos : sourceVideos.slice(0, config.numVideos);
    const totalClips = videosToProcess.length * config.numClips;

    startProgress(totalClips, 'Generating clips...');

    try {
      let currentClipCount = 0;
      for (const video of videosToProcess) {
        for (let i = 0; i < config.numClips; i++) {
          const startTime = Math.random() * (video.duration - config.clipDuration);
          const clip: VideoClip = {
            id: nextClipId.current++,
            name: `Clip ${nextClipId.current - 1} from ${video.name}`,
            sourceFile: video,
            startTime: startTime,
            duration: config.clipDuration,
            position: 0,
          };
          setClips(prevClips => [...prevClips, clip]);
          currentClipCount++;
          const progressValue = (currentClipCount / totalClips) * 100;
          setGenerationProgress(progressValue);
          updateProgress(currentClipCount, `Generating clip ${currentClipCount}/${totalClips}`);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      completeProgress();
      toast({
        title: "Clips generated",
        description: `Successfully generated ${totalClips} clips`,
      });
    } catch (error) {
      console.error("Error generating clips:", error);
      toast({
        title: "Clip generation failed",
        description: "An error occurred while generating clips.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRandomizeAll = () => {
    setTimelineClips(prevClips => {
      const newClips = [...prevClips];
      for (let i = newClips.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newClips[i], newClips[j]] = [newClips[j], newClips[i]];
      }
      return newClips.map((clip, index) => ({ ...clip, position: index * clip.duration }));
    });
  };

  const handleRandomizeTimed = (duration: number) => {
    const numClips = duration * 60;
    const availableClips = [...clips];
    const selectedClips: VideoClip[] = [];

    for (let i = 0; i < numClips && availableClips.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableClips.length);
      selectedClips.push(availableClips[randomIndex]);
      availableClips.splice(randomIndex, 1);
    }

    setTimelineClips(selectedClips.map((clip, index) => ({ ...clip, position: index })));
  };

  const handleCancelProcessing = async () => {
    setIsGenerating(false);
    resetProgress();
    try {
      await VideoCompilerService.cancelCurrentJob();
      toast({
        title: "Processing cancelled",
        description: "All ongoing processing has been cancelled.",
      });
    } catch (error) {
      console.error("Error cancelling processing:", error);
      toast({
        title: "Cancellation failed",
        description: "Failed to cancel processing. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const handleCompile = async () => {
    if (timelineClips.length === 0) {
      toast({
        title: "No clips to compile",
        description: "Add clips to the timeline first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCompiling(true);
      setCompilationProgress(0);
      setCompilationStage('Initializing compilation...');
      setLastCompilationResult(undefined);

      console.log('TimelineEditor: Starting compilation of', timelineClips.length, 'clips');

      const result = await VideoCompilerService.compileTimeline(
        timelineClips,
        { totalDuration, clipOrder: timelineClips.map(c => c.id), zoom, playheadPosition },
        onExport,
        (progress, stage) => {
          console.log('TimelineEditor: Compilation progress:', progress, stage);
          setCompilationProgress(progress);
          setCompilationStage(stage);
        }
      );

      console.log('TimelineEditor: Compilation completed successfully:', result);
      setLastCompilationResult(result);
      setShowVideoPreview(true); // Auto-show preview when compilation completes
      
      toast({
        title: "Compilation Complete!",
        description: `Video saved successfully. Click Preview to view or Download to save locally.`,
      });
    } catch (error) {
      console.error('TimelineEditor: Compilation failed:', error);
      toast({
        title: "Compilation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCompiling(false);
      setCompilationProgress(0);
      setCompilationStage('');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Header */}
      <EditorHeader />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-slate-800/50 backdrop-blur-sm border-r border-slate-700/50 flex flex-col overflow-hidden">
          <SidebarSection
            title="1. Upload Videos"
            isActive={activeStep === 'upload'}
            onToggle={() => setActiveStep(activeStep === 'upload' ? null : 'upload')}
          >
            <VideoUploadStep
              onFilesSelected={handleFilesSelected}
              selectedFiles={sourceVideos}
              onRemoveFile={handleRemoveFile}
              onClearAll={handleClearAll}
            />
          </SidebarSection>

          <SidebarSection
            title="2. Configure"
            isActive={activeStep === 'configure'}
            onToggle={() => setActiveStep(activeStep === 'configure' ? null : 'configure')}
          >
            <ConfigurationStep
              config={{
                numClips: 3,
                clipDuration: 5,
                randomSelection: true,
                videoSelectionMode: 'all' as const,
                numVideos: Math.min(20, sourceVideos.length),
              }}
              sourceVideosCount={sourceVideos.length}
              onConfigChange={() => {}}
            />
          </SidebarSection>

          <SidebarSection
            title="3. Generate & Randomize"
            isActive={activeStep === 'randomize'}
            onToggle={() => setActiveStep(activeStep === 'randomize' ? null : 'randomize')}
          >
            <RandomizeStep
              onGenerateClips={handleGenerateClips}
              onRandomizeAll={handleRandomizeAll}
              onRandomizeTimed={handleRandomizeTimed}
              onCancelProcessing={handleCancelProcessing}
              isGenerating={isGenerating}
              generationProgress={generationProgress}
              config={{
                numClips: 3,
                clipDuration: 5,
                randomSelection: true,
                videoSelectionMode: 'all' as const,
                numVideos: Math.min(20, sourceVideos.length),
              }}
            />
          </SidebarSection>

          <ClipLibrary
            clips={clips}
            onAddToTimeline={handleAddToTimeline}
            onRemoveClip={handleRemoveClip}
            onClearLibrary={handleClearLibrary}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
            onCancelProcessing={handleCancelProcessing}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video Player */}
          <div className="h-1/2 border-b border-slate-700/50">
            <VideoPlayerSection
              timelineClips={timelineClips}
              playheadPosition={playheadPosition}
              isPlaying={isPlaying}
              onTimeUpdate={setPlayheadPosition}
            />
          </div>
          
          {/* Timeline */}
          <div className="flex-1 flex flex-col min-h-0">
            <TimelineMain
              clips={timelineClips}
              totalDuration={totalDuration}
              zoom={zoom}
              playheadPosition={playheadPosition}
              isDragging={isDragging}
              draggedClip={draggedClip}
              onClipDragStart={handleClipDragStart}
              onClipDragEnd={handleClipDragEnd}
              onClipRemove={handleClipRemove}
              onPlayheadMove={setPlayheadPosition}
            />
            
            {/* Controls */}
            <div className="border-t border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-4">
              <TimelineControls
                isPlaying={isPlaying}
                isCompiling={isCompiling}
                compilationProgress={compilationProgress}
                compilationStage={compilationStage}
                timelineClipsLength={timelineClips.length}
                onTogglePlayback={togglePlayback}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onReset={handleReset}
                onClearTimeline={handleClearTimeline}
                onExportJSON={handleExportJSON}
                onCompile={handleCompile}
                onDownloadClips={handleDownloadClips}
                onOpenSettings={() => setShowSettings(true)}
                lastCompilationResult={lastCompilationResult}
                showVideoPreview={showVideoPreview}
                onCloseVideoPreview={() => setShowVideoPreview(!showVideoPreview)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        isActive={progress.isActive}
        current={progress.current}
        total={progress.total}
        message={progress.message}
      />

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}

      <Toaster />
    </div>
  );
};

export default TimelineEditor;

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  isActive: boolean;
  onToggle: () => void;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ title, children, isActive, onToggle }) => {
  return (
    <div className="border-b border-slate-700/50">
      <button
        className="flex items-center justify-between w-full p-4 text-sm font-semibold text-slate-200 hover:bg-slate-700/50 transition-colors"
        onClick={onToggle}
      >
        {title}
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${isActive ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isActive ? 'visible' : 'hidden'}`}>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};
