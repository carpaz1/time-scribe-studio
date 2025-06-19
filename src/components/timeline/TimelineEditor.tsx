
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, ZoomIn, ZoomOut, Upload, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoClip, TimelineConfig, CompileRequest } from '@/types/timeline';
import TimelineTrack from './TimelineTrack';
import Playhead from './Playhead';
import TimelineRuler from './TimelineRuler';
import ClipLibrary from './ClipLibrary';
import { useToast } from '@/hooks/use-toast';

interface TimelineEditorProps {
  initialClips?: VideoClip[];
  onExport?: (data: CompileRequest) => void;
}

const TimelineEditor: React.FC<TimelineEditorProps> = ({ 
  initialClips = [], 
  onExport 
}) => {
  const [clips, setClips] = useState<VideoClip[]>(initialClips);
  const [timelineClips, setTimelineClips] = useState<VideoClip[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [totalDuration, setTotalDuration] = useState(60);
  const [draggedClip, setDraggedClip] = useState<VideoClip | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Calculate total timeline duration
  useEffect(() => {
    if (timelineClips.length > 0) {
      const maxEnd = Math.max(...timelineClips.map(clip => clip.position + clip.duration));
      setTotalDuration(Math.max(maxEnd + 10, 60));
    }
  }, [timelineClips]);

  // Play/pause functionality
  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playIntervalRef.current = setInterval(() => {
        setPlayheadPosition(prev => {
          const next = prev + 0.1;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 100);
    }
  }, [isPlaying, totalDuration]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayback();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setPlayheadPosition(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setPlayheadPosition(prev => Math.min(totalDuration, prev + 1));
          break;
        case 'Home':
          e.preventDefault();
          setPlayheadPosition(0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayback, totalDuration]);

  // Cleanup intervals
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, 10));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, 0.1));

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newPosition = (x / rect.width) * (totalDuration / zoom);
    setPlayheadPosition(Math.max(0, Math.min(totalDuration, newPosition)));
  };

  const handleClipAdd = (clip: VideoClip) => {
    const newClip = {
      ...clip,
      position: timelineClips.length > 0 
        ? Math.max(...timelineClips.map(c => c.position + c.duration)) 
        : 0
    };
    setTimelineClips(prev => [...prev, newClip]);
    toast({
      title: "Clip added",
      description: `${clip.name} has been added to the timeline`,
    });
  };

  const handleClipRemove = (clipId: string) => {
    setTimelineClips(prev => prev.filter(clip => clip.id !== clipId));
    toast({
      title: "Clip removed",
      description: "Clip has been removed from timeline",
    });
  };

  const handleClipReorder = (draggedClipId: string, targetPosition: number) => {
    setTimelineClips(prev => {
      const updated = prev.map(clip => 
        clip.id === draggedClipId 
          ? { ...clip, position: targetPosition }
          : clip
      );
      return updated.sort((a, b) => a.position - b.position);
    });
  };

  const handleReset = () => {
    setTimelineClips([]);
    setPlayheadPosition(0);
    setIsPlaying(false);
    setZoom(1);
    toast({
      title: "Timeline reset",
      description: "All clips have been removed",
    });
  };

  const handleCompile = async () => {
    if (timelineClips.length === 0) {
      toast({
        title: "No clips to compile",
        description: "Please add clips to the timeline first",
        variant: "destructive",
      });
      return;
    }

    setIsCompiling(true);
    
    try {
      const formData = new FormData();
      
      // Add video files
      timelineClips.forEach((clip, index) => {
        formData.append(`video_${index}`, clip.sourceFile);
      });

      // Add config
      const config: TimelineConfig = {
        totalDuration,
        clipOrder: timelineClips.map(clip => clip.id),
        zoom,
        playheadPosition,
      };

      const compileData: CompileRequest = { config, clips: timelineClips };
      formData.append('config', JSON.stringify(config));

      // Send to backend
      const response = await fetch('http://localhost:4000/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Compilation started",
          description: "Your video is being processed",
        });
        onExport?.(compileData);
      } else {
        throw new Error('Failed to compile video');
      }
    } catch (error) {
      console.error('Compilation error:', error);
      toast({
        title: "Compilation failed",
        description: "There was an error processing your video",
        variant: "destructive",
      });
    } finally {
      setIsCompiling(false);
    }
  };

  const handleExportJSON = () => {
    const config: TimelineConfig = {
      totalDuration,
      clipOrder: timelineClips.map(clip => clip.id),
      zoom,
      playheadPosition,
    };
    
    const exportData: CompileRequest = { config, clips: timelineClips };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'timeline-config.json';
    link.click();
    URL.revokeObjectURL(url);
    
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlayback}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="ml-2">{isPlaying ? 'Pause' : 'Play'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="ml-2">Reset</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJSON}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              <Download className="w-4 h-4" />
              <span className="ml-2">Export JSON</span>
            </Button>
            <Button
              onClick={handleCompile}
              disabled={isCompiling || timelineClips.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4" />
              <span className="ml-2">
                {isCompiling ? 'Compiling...' : 'Compile'}
              </span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Clip Library Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <ClipLibrary
            clips={clips}
            onClipAdd={handleClipAdd}
            onClipsUpdate={setClips}
          />
        </div>

        {/* Timeline Area */}
        <div className="flex-1 flex flex-col">
          {/* Timeline Info */}
          <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between">
            <div className="text-sm text-gray-300">
              Clips: {timelineClips.length} | Duration: {totalDuration.toFixed(1)}s | Zoom: {zoom.toFixed(1)}x
            </div>
            <div className="text-sm text-gray-300">
              Playhead: {playheadPosition.toFixed(1)}s
            </div>
          </div>

          {/* Timeline Container */}
          <div className="flex-1 overflow-auto bg-gray-900">
            <div className="relative">
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
                  onClipRemove={handleClipRemove}
                  onClipReorder={handleClipReorder}
                  draggedClip={draggedClip}
                  setDraggedClip={setDraggedClip}
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
