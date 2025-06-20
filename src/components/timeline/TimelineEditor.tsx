
import React, { useState, useCallback, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { useProgressTracker } from '@/hooks/useProgressTracker';
import { VideoClip, CompileRequest } from '@/types/timeline';
import { VideoCompilerService } from '@/services/videoCompiler';
import WorkflowPanel from './WorkflowPanel';
import ClipLibrary from './ClipLibrary';
import VideoPlayerSection from './VideoPlayerSection';
import TimelineMain from './TimelineMain';
import TimelineControls from './TimelineControls';
import StatusBar from './StatusBar';
import SettingsPanel from './SettingsPanel';
import EditorHeader from './EditorHeader';
import VideoPreview from './VideoPreview';

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
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationProgress, setCompilationProgress] = useState(0);
  const [compilationStage, setCompilationStage] = useState('');

  // Configuration state
  const [config, setConfig] = useState({
    numClips: 3,
    clipDuration: 5,
    randomSelection: true,
    videoSelectionMode: 'all' as const,
    numVideos: Math.min(20, sourceVideos.length),
  });

  const { progress, startProgress, updateProgress, completeProgress, resetProgress } = useProgressTracker();

  const nextClipId = useRef(1);

  const handleFilesSelected = (files: File[]) => {
    setSourceVideos(prevFiles => {
      const newFiles = [...prevFiles, ...files];
      // Update config when videos change
      setConfig(prev => ({
        ...prev,
        numVideos: Math.min(prev.numVideos, newFiles.length)
      }));
      return newFiles;
    });
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

  const handleConfigChange = (newConfig: any) => {
    setConfig(newConfig);
  };

  const togglePlayback = useCallback(() => {
    setIsPlaying(isPlaying => !isPlaying);
  }, []);

  const handleZoomIn = () => {
    setZoom(zoom => Math.min(zoom + 25, 500));
  };

  const handleZoomOut = () => {
    setZoom(zoom => Math.max(zoom - 25, 25));
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

  const handleRemoveClip = (id: string) => {
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

  const handleClipRemove = (id: string) => {
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

  const handleGenerateClips = async (generationConfig?: any) => {
    const configToUse = generationConfig || config;
    
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

    const videosToProcess = configToUse.videoSelectionMode === 'all' ? sourceVideos : sourceVideos.slice(0, configToUse.numVideos);
    const totalClips = videosToProcess.length * configToUse.numClips;

    startProgress(totalClips, 'Generating clips...');

    try {
      let currentClipCount = 0;
      const newClips: VideoClip[] = [];
      
      for (const video of videosToProcess) {
        for (let i = 0; i < configToUse.numClips; i++) {
          const videoElement = document.createElement('video');
          const objectUrl = URL.createObjectURL(video);
          videoElement.src = objectUrl;
          
          await new Promise((resolve) => {
            videoElement.addEventListener('loadedmetadata', () => {
              const videoDuration = videoElement.duration;
              const startTime = Math.random() * Math.max(0, videoDuration - configToUse.clipDuration);
              
              const clip: VideoClip = {
                id: nextClipId.current.toString(),
                name: `Clip ${nextClipId.current} from ${video.name}`,
                sourceFile: video,
                startTime: startTime,
                duration: configToUse.clipDuration,
                position: 0,
                thumbnail: '',
              };
              
              nextClipId.current++;
              newClips.push(clip);
              currentClipCount++;
              const progressValue = (currentClipCount / totalClips) * 100;
              setGenerationProgress(progressValue);
              updateProgress(currentClipCount, `Generating clip ${currentClipCount}/${totalClips}`);
              
              URL.revokeObjectURL(objectUrl);
              resolve(null);
            });
          });
          
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      setClips(prevClips => [...prevClips, ...newClips]);
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
    if (clips.length === 0) {
      toast({
        title: "No clips available",
        description: "Generate clips first",
        variant: "destructive",
      });
      return;
    }

    // Get clips that aren't already on the timeline
    const existingClipIds = new Set(timelineClips.map(clip => clip.id));
    const availableClips = clips.filter(clip => !existingClipIds.has(clip.id));
    
    if (availableClips.length === 0) {
      toast({
        title: "All clips are already on timeline",
        description: "Generate more clips or clear the timeline",
        variant: "destructive",
      });
      return;
    }

    console.log('Adding', availableClips.length, 'clips to timeline');
    const shuffledClips = [...availableClips].sort(() => Math.random() - 0.5);
    
    // Calculate starting position (end of current timeline)
    const currentEndPosition = timelineClips.length > 0 
      ? Math.max(...timelineClips.map(c => c.position + c.duration))
      : 0;

    const newTimelineClips = shuffledClips.slice(0, 20).map((clip, index) => ({
      ...clip,
      position: currentEndPosition + (index > 0 ? shuffledClips.slice(0, index).reduce((acc, c) => acc + c.duration, 0) : 0)
    }));

    setTimelineClips(prev => [...prev, ...newTimelineClips]);
    
    toast({
      title: "Timeline randomized",
      description: `Added ${newTimelineClips.length} clips to timeline`,
    });
  };

  const handleRandomizeTimed = async (duration: number) => {
    if (sourceVideos.length === 0) {
      toast({
        title: "No videos available",
        description: "Please upload some videos first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const targetDurationSeconds = duration * 60;
      const newClips: VideoClip[] = [];
      
      console.log(`Creating ${targetDurationSeconds} random 1-second clips from ${sourceVideos.length} videos`);
      
      // Create truly random selection by shuffling and repeating videos as needed
      const expandedVideoPool = [];
      const maxClipsPerVideo = Math.ceil(targetDurationSeconds / sourceVideos.length) + 5; // Extra buffer
      
      for (let i = 0; i < maxClipsPerVideo; i++) {
        expandedVideoPool.push(...sourceVideos);
      }
      
      // Shuffle the expanded pool for true randomness
      const shuffledPool = expandedVideoPool.sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < targetDurationSeconds && i < shuffledPool.length; i++) {
        const video = shuffledPool[i];
        
        // Create a video element to get duration and ensure audio tracks
        const videoElement = document.createElement('video');
        const objectUrl = URL.createObjectURL(video);
        videoElement.src = objectUrl;
        videoElement.preload = 'metadata';
        
        await new Promise((resolve) => {
          videoElement.addEventListener('loadedmetadata', () => {
            const videoDuration = videoElement.duration;
            const startTime = Math.random() * Math.max(0, videoDuration - 1);
            
            const randomClip: VideoClip = {
              id: `timed-${Date.now()}-${i}-${Math.random()}`,
              name: `Random ${i + 1}`,
              sourceFile: video,
              startTime,
              duration: 1, // Always use 1-second clips
              thumbnail: '',
              position: i, // Sequential positioning for timeline
            };
            
            newClips.push(randomClip);
            URL.revokeObjectURL(objectUrl);
            resolve(null);
          });
        });
        
        // Small delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      console.log(`Generated ${newClips.length} truly random clips`);
      
      // Set both clips and timeline clips
      setClips(newClips);
      setTimelineClips(newClips);
      
      toast({
        title: `${duration}-minute randomization complete!`,
        description: `Generated ${newClips.length} random 1-second clips from ${sourceVideos.length} videos, ready for compilation`,
      });

    } catch (error) {
      console.error('Timed randomize error:', error);
      toast({
        title: "Timed randomization failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
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
      setCompilationStage('Initializing compilation with audio...');
      setLastCompilationResult(undefined);

      console.log('Starting compilation of', timelineClips.length, 'clips with audio preservation');

      // Enhanced config to ensure audio is preserved
      const compilationConfig = { 
        totalDuration, 
        clipOrder: timelineClips.map(c => c.id), 
        zoom, 
        playheadPosition,
        preserveAudio: true, // Explicitly preserve audio
        audioCodec: 'aac', // Use AAC for better compatibility
        videoCodec: 'h264' // Use H.264 for better compatibility
      };

      const result = await VideoCompilerService.compileTimeline(
        timelineClips,
        compilationConfig,
        onExport,
        (progress, stage) => {
          console.log('Compilation progress:', progress, stage);
          setCompilationProgress(progress);
          setCompilationStage(stage);
        }
      );

      console.log('Compilation completed successfully with audio:', result);
      setLastCompilationResult(result);
      setShowVideoPreview(true);
      
      toast({
        title: "Compilation Complete!",
        description: `Video compiled successfully with audio. File ready for download.`,
      });
    } catch (error) {
      console.error('Compilation failed:', error);
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

  const handleQuickRandomize = async (duration: number, includePictures: boolean = false) => {
    console.log('=== QUICK RANDOMIZE START ===');
    console.log('Duration:', duration, 'Include Pictures:', includePictures);
    
    if (sourceVideos.length === 0) {
      toast({
        title: "No videos available",
        description: "Please upload some videos first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      // Filter media based on includePictures setting
      const mediaToProcess = includePictures 
        ? sourceVideos 
        : sourceVideos.filter(file => file.type.startsWith('video/'));

      if (mediaToProcess.length === 0) {
        const mediaType = includePictures ? 'media files' : 'videos';
        toast({
          title: `No ${mediaType} available`,
          description: `Please upload some ${mediaType} first`,
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      const targetClipCount = duration * 60;
      const newClips: VideoClip[] = [];
      
      console.log(`Creating ${targetClipCount} random 1-second clips from ${mediaToProcess.length} files (pictures: ${includePictures})`);
      
      // Create truly random selection by shuffling and repeating files as needed
      const expandedFilePool = [];
      const maxClipsPerFile = Math.ceil(targetClipCount / mediaToProcess.length) + 5;
      
      for (let i = 0; i < maxClipsPerFile; i++) {
        expandedFilePool.push(...mediaToProcess);
      }
      
      // Shuffle the expanded pool for true randomness
      const shuffledPool = expandedFilePool.sort(() => Math.random() - 0.5);
      
      // Update progress for clip generation phase
      setGenerationProgress(5);
      
      for (let i = 0; i < targetClipCount && i < shuffledPool.length; i++) {
        const file = shuffledPool[i];
        
        if (file.type.startsWith('image/')) {
          // Handle images - create a 1-second clip
          const imageClip: VideoClip = {
            id: `img-${Date.now()}-${i}-${Math.random()}`,
            name: `Image ${i + 1}`,
            sourceFile: file,
            startTime: 0,
            duration: 1, // Always 1-second for images
            thumbnail: '',
            position: i,
          };
          newClips.push(imageClip);
        } else {
          // Handle videos - same as before
          const videoElement = document.createElement('video');
          const objectUrl = URL.createObjectURL(file);
          videoElement.src = objectUrl;
          videoElement.preload = 'metadata';
          
          await new Promise((resolve) => {
            videoElement.addEventListener('loadedmetadata', () => {
              const videoDuration = videoElement.duration;
              const startTime = Math.random() * Math.max(0, videoDuration - 1);
              
              const randomClip: VideoClip = {
                id: `vid-${Date.now()}-${i}-${Math.random()}`,
                name: `Clip ${i + 1}`,
                sourceFile: file,
                startTime,
                duration: 1, // Always use 1-second clips
                thumbnail: '',
                position: i,
              };
              
              newClips.push(randomClip);
              URL.revokeObjectURL(objectUrl);
              resolve(null);
            });
          });
        }
        
        // Update progress during generation (5% to 30%)
        const progress = 5 + ((i + 1) / targetClipCount) * 25;
        setGenerationProgress(progress);
        
        // Small delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      console.log(`Generated ${newClips.length} clips (including images: ${includePictures})`);
      
      // Set both clips and timeline clips
      setClips(newClips);
      setTimelineClips(newClips);
      
      // Update progress before compilation
      setGenerationProgress(35);
      console.log('Starting automatic compilation...');
      
      // Small delay before compilation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Start compilation process
      setIsCompiling(true);
      setCompilationProgress(0);
      setCompilationStage('Starting compilation...');
      setLastCompilationResult(undefined);

      console.log('Starting compilation of', newClips.length, 'clips with audio preservation');

      // Enhanced config to ensure audio is preserved
      const compilationConfig = { 
        totalDuration: newClips.length, 
        clipOrder: newClips.map(c => c.id), 
        zoom, 
        playheadPosition,
        preserveAudio: true,
        audioCodec: 'aac',
        videoCodec: 'h264'
      };

      const result = await VideoCompilerService.compileTimeline(
        newClips,
        compilationConfig,
        onExport,
        (progress, stage) => {
          console.log('Compilation progress:', progress, stage);
          setCompilationProgress(progress);
          setCompilationStage(stage);
          // Also update generation progress for unified display
          setGenerationProgress(35 + (progress * 0.65)); // 35% + 65% for compilation
        }
      );

      console.log('Compilation completed successfully:', result);
      setLastCompilationResult(result);
      setShowVideoPreview(true);
      
      toast({
        title: `${duration}-minute video complete!`,
        description: `Generated and compiled ${newClips.length} clips${includePictures ? ' (including images)' : ''} into a ${duration}-minute video. Click to preview!`,
        action: result.downloadUrl ? (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowVideoPreview(true)}
          >
            Preview
          </Button>
        ) : undefined,
      });

    } catch (error) {
      console.error('Quick randomize error:', error);
      toast({
        title: "Quick randomization failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setIsCompiling(false);
      setGenerationProgress(0);
      setCompilationProgress(0);
      setCompilationStage('');
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
        {/* Header */}
        <EditorHeader
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
        
        <div className="flex flex-1 overflow-hidden">
          {/* Streamlined Sidebar */}
          <div className="w-80 bg-slate-800/50 backdrop-blur-sm border-r border-slate-700/50 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* New Workflow Panel */}
              <WorkflowPanel
                sourceVideos={sourceVideos}
                onVideoUpload={handleFilesSelected}
                onBulkUpload={handleFilesSelected}
                onQuickRandomize={handleQuickRandomize}
                onCompile={handleCompile}
                isProcessing={isGenerating || isCompiling}
                processingProgress={isGenerating ? generationProgress : compilationProgress}
                processingStage={isGenerating ? 'Generating clips...' : compilationStage}
                onCancelProcessing={handleCancelProcessing}
              />

              {/* Simplified Clip Library */}
              <ClipLibrary
                clips={clips}
                sourceVideos={[]}
                timelineClips={timelineClips}
                onClipAdd={handleAddToTimeline}
                onClipsUpdate={setClips}
                onSourceVideosUpdate={() => {}}
                onClipsGenerated={setClips}
                onRandomizeAll={handleRandomizeAll}
                onVideoUpload={handleFilesSelected}
                onBulkUpload={handleFilesSelected}
                progressTracker={progress}
              />
            </div>
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
                onZoomChange={setZoom}
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
          <SettingsPanel
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Video Preview */}
        {showVideoPreview && lastCompilationResult && (
          <VideoPreview
            downloadUrl={lastCompilationResult.downloadUrl || ''}
            outputFile={lastCompilationResult.outputFile || ''}
            onClose={() => setShowVideoPreview(false)}
          />
        )}

        <Toaster />
      </div>
    </DndProvider>
  );
};

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

export default TimelineEditor;
