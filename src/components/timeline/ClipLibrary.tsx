
import React, { useState, useRef } from 'react';
import { Upload, Video, Settings, Shuffle, Plus, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { VideoClip } from '@/types/timeline';
import VideoUploader from './VideoUploader';
import LibraryClipThumbnail from './LibraryClipThumbnail';
import BulkDirectorySelector from './BulkDirectorySelector';
import SettingsPanel from './SettingsPanel';

interface ClipLibraryProps {
  clips: VideoClip[];
  sourceVideos: File[];
  onClipAdd: (clip: VideoClip) => void;
  onClipsUpdate: (clips: VideoClip[]) => void;
  onSourceVideosUpdate: (videos: File[]) => void;
  onClipsGenerated: (clips: VideoClip[]) => void;
  onRandomizeAll: () => void;
}

const ClipLibrary: React.FC<ClipLibraryProps> = ({
  clips,
  sourceVideos,
  onClipAdd,
  onClipsUpdate,
  onSourceVideosUpdate,
  onClipsGenerated,
  onRandomizeAll,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  const handleVideoUpload = (files: File[]) => {
    onSourceVideosUpdate([...sourceVideos, ...files]);
    toast({
      title: "Videos uploaded",
      description: `${files.length} video(s) added to library`,
    });
  };

  const handleBulkUpload = (files: File[]) => {
    handleVideoUpload(files);
    toast({
      title: "Bulk upload complete",
      description: `${files.length} videos imported from directory`,
    });
  };

  const generateClips = async () => {
    if (sourceVideos.length === 0) {
      toast({
        title: "No videos uploaded",
        description: "Please upload some videos first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      const newClips: VideoClip[] = [];
      
      for (let i = 0; i < sourceVideos.length; i++) {
        const video = sourceVideos[i];
        setGenerationProgress(((i + 1) / sourceVideos.length) * 100);
        
        // Create video element to get duration
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        
        await new Promise((resolve, reject) => {
          videoElement.onloadedmetadata = () => resolve(null);
          videoElement.onerror = () => reject(new Error(`Failed to load video: ${video.name}`));
          videoElement.src = URL.createObjectURL(video);
        });
        
        const duration = videoElement.duration;
        URL.revokeObjectURL(videoElement.src);
        
        if (duration > 0) {
          // Generate multiple clips per video
          const clipsPerVideo = Math.min(3, Math.max(1, Math.floor(duration / 10)));
          
          for (let j = 0; j < clipsPerVideo; j++) {
            const maxStartTime = Math.max(0, duration - 5);
            const startTime = (maxStartTime / clipsPerVideo) * j;
            const clipDuration = Math.min(5, duration - startTime);
            
            if (clipDuration > 0.5) {
              const clip: VideoClip = {
                id: `${Date.now()}-${i}-${j}`,
                name: `${video.name.replace(/\.[^/.]+$/, "")} - Clip ${j + 1}`,
                sourceFile: video,
                startTime,
                duration: clipDuration,
                position: 0,
              };
              newClips.push(clip);
            }
          }
        }
      }
      
      onClipsUpdate([...clips, ...newClips]);
      onClipsGenerated(newClips);
      
      toast({
        title: "Clips generated successfully!",
        description: `Created ${newClips.length} clips from ${sourceVideos.length} videos`,
      });
    } catch (error) {
      console.error('Error generating clips:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate clips",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  return (
    <div className="h-full bg-gradient-to-b from-slate-800/90 to-slate-900/95 backdrop-blur-sm border-r border-slate-700/50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Clip Library</h2>
              <p className="text-xs text-slate-400">Manage your video clips</p>
            </div>
          </div>
          <Button
            onClick={() => setShowSettings(true)}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-slate-700/50"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Card className="bg-slate-700/30 border-slate-600/50">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <Video className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-xs text-slate-400">Videos</p>
                  <p className="text-sm font-semibold text-white">{sourceVideos.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-700/30 border-slate-600/50">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <Film className="w-4 h-4 text-green-400" />
                <div>
                  <p className="text-xs text-slate-400">Clips</p>
                  <p className="text-sm font-semibold text-white">{clips.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <VideoUploader onVideoUpload={handleVideoUpload} />
        
        <div className="mt-3">
          <BulkDirectorySelector onBulkUpload={handleBulkUpload} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Generation Section */}
        <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Generate Clips</h3>
              {sourceVideos.length > 0 && (
                <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                  {sourceVideos.length} videos ready
                </span>
              )}
            </div>
            
            {isGenerating && (
              <div className="space-y-2">
                <Progress 
                  value={generationProgress} 
                  className="h-2 bg-slate-700/50"
                />
                <p className="text-xs text-slate-400 text-center">
                  Generating clips... {Math.round(generationProgress)}%
                </p>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button
                onClick={generateClips}
                disabled={sourceVideos.length === 0 || isGenerating}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate Clips
              </Button>
              <Button
                onClick={onRandomizeAll}
                disabled={clips.length === 0}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
              >
                <Shuffle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Clips Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {clips.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Film className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300 mb-2">No clips yet</h3>
              <p className="text-sm text-slate-500 mb-4">
                Upload videos and generate clips to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {clips.map((clip) => (
                <LibraryClipThumbnail
                  key={clip.id}
                  clip={clip}
                  onAddToTimeline={() => onClipAdd(clip)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
};

export default ClipLibrary;
