
import React, { useState } from 'react';
import { Settings, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { VideoClip } from '@/types/timeline';
import VideoUploader from './VideoUploader';
import LibraryClipThumbnail from './LibraryClipThumbnail';
import BulkDirectorySelector from './BulkDirectorySelector';
import SettingsPanel from './SettingsPanel';
import ClipGenerationPanel from './ClipGenerationPanel';
import LibraryStats from './LibraryStats';
import EmptyLibraryState from './EmptyLibraryState';

interface SourceVideo {
  name: string;
  file: File;
  duration: number;
}

interface ClipLibraryProps {
  clips: VideoClip[];
  sourceVideos: SourceVideo[];
  onClipAdd: (clip: VideoClip) => void;
  onClipsUpdate: (clips: VideoClip[]) => void;
  onSourceVideosUpdate: (videos: SourceVideo[]) => void;
  onClipsGenerated: (clips: VideoClip[]) => void;
  onRandomizeAll: () => void;
  onVideoUpload: (files: File[]) => void;
  onBulkUpload: (files: File[]) => void;
}

const ClipLibrary: React.FC<ClipLibraryProps> = ({
  clips,
  sourceVideos,
  onClipAdd,
  onClipsUpdate,
  onSourceVideosUpdate,
  onClipsGenerated,
  onRandomizeAll,
  onVideoUpload,
  onBulkUpload,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  const handleVideoUpload = (files: File[]) => {
    onVideoUpload(files);
  };

  const handleBulkUpload = (files: File[]) => {
    onBulkUpload(files);
  };

  const handleBulkClipsGenerated = (generatedClips: VideoClip[]) => {
    onClipsUpdate([...clips, ...generatedClips]);
    onClipsGenerated(generatedClips);
  };

  const createThumbnail = async (file: File, startTime: number = 0): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        canvas.width = 160;
        canvas.height = 90;
        video.currentTime = Math.min(startTime + 1, video.duration / 2);
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL());
        }
      };

      video.onerror = () => {
        // Fallback thumbnail
        if (ctx) {
          canvas.width = 160;
          canvas.height = 90;
          ctx.fillStyle = '#374151';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#9CA3AF';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('📽️', canvas.width / 2, canvas.height / 2);
          resolve(canvas.toDataURL());
        }
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const generateClips = async (config: { numClips: number; clipDuration: number }) => {
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
        const sourceVideo = sourceVideos[i];
        setGenerationProgress(((i + 1) / sourceVideos.length) * 100);
        
        const duration = sourceVideo.duration;
        
        if (duration > 0) {
          // Generate specified number of clips per video
          const clipsPerVideo = Math.min(config.numClips, Math.max(1, Math.floor(duration / config.clipDuration)));
          
          for (let j = 0; j < clipsPerVideo; j++) {
            const maxStartTime = Math.max(0, duration - config.clipDuration);
            const startTime = maxStartTime > 0 ? (maxStartTime / clipsPerVideo) * j : 0;
            const clipDuration = Math.min(config.clipDuration, duration - startTime);
            
            if (clipDuration > 0.5) {
              // Generate thumbnail for this clip
              const thumbnail = await createThumbnail(sourceVideo.file, startTime);
              
              const clip: VideoClip = {
                id: `${Date.now()}-${i}-${j}`,
                name: `${sourceVideo.name} - Clip ${j + 1}`,
                sourceFile: sourceVideo.file,
                startTime,
                duration: clipDuration,
                position: 0,
                thumbnail,
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
        <LibraryStats 
          sourceVideosCount={sourceVideos.length}
          clipsCount={clips.length}
        />

        {/* Upload Section */}
        <VideoUploader onVideoUpload={handleVideoUpload} />
        
        <div className="mt-3">
          <BulkDirectorySelector 
            onBulkUpload={handleBulkUpload} 
            onClipsGenerated={handleBulkClipsGenerated}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Generation Section with Configuration */}
        <ClipGenerationPanel
          sourceVideosCount={sourceVideos.length}
          isGenerating={isGenerating}
          generationProgress={generationProgress}
          onGenerateClips={generateClips}
          onRandomizeAll={onRandomizeAll}
          clipsCount={clips.length}
        />

        {/* Clips Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {clips.length === 0 ? (
            <EmptyLibraryState onVideoUpload={handleVideoUpload} />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {clips.map((clip) => (
                <LibraryClipThumbnail
                  key={clip.id}
                  clip={clip}
                  onAdd={() => onClipAdd(clip)}
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
