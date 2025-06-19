
import React, { useState, useRef } from 'react';
import { Upload, Scissors, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { SourceVideo, VideoClip, ClipGenerationConfig } from '@/types/timeline';
import { useToast } from '@/hooks/use-toast';

interface VideoUploaderProps {
  sourceVideos: SourceVideo[];
  onSourceVideosUpdate: (videos: SourceVideo[]) => void;
  onClipsGenerated: (clips: VideoClip[]) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({
  sourceVideos,
  onSourceVideosUpdate,
  onClipsGenerated,
}) => {
  const [config, setConfig] = useState<ClipGenerationConfig>({
    clipDuration: 3,
    totalDuration: 30,
    randomOrder: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (files: FileList) => {
    const newVideos: SourceVideo[] = [];
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a video file`,
          variant: "destructive",
        });
        continue;
      }

      const duration = await getVideoDuration(file);
      const thumbnail = await createThumbnail(file);
      
      const video: SourceVideo = {
        id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        file,
        duration,
        thumbnail,
      };
      
      newVideos.push(video);
    }
    
    onSourceVideosUpdate([...sourceVideos, ...newVideos]);
    
    toast({
      title: "Videos uploaded",
      description: `${newVideos.length} video(s) ready for clip generation`,
    });
  };

  const createThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        canvas.width = 160;
        canvas.height = 90;
        video.currentTime = Math.min(1, video.duration / 2);
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL());
        }
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const generateRandomClips = async () => {
    if (sourceVideos.length === 0) {
      toast({
        title: "No videos uploaded",
        description: "Please upload videos first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const clipsPerVideo = Math.floor(config.totalDuration / config.clipDuration / sourceVideos.length);
      const generatedClips: VideoClip[] = [];

      for (const video of sourceVideos) {
        if (video.duration < config.clipDuration) {
          toast({
            title: "Video too short",
            description: `${video.name} is shorter than clip duration`,
            variant: "destructive",
          });
          continue;
        }

        for (let i = 0; i < clipsPerVideo; i++) {
          const maxStartTime = video.duration - config.clipDuration;
          const randomStartTime = Math.random() * maxStartTime;
          
          const clip: VideoClip = {
            id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: `${video.name}-clip-${i + 1}`,
            startTime: randomStartTime,
            duration: config.clipDuration,
            thumbnail: video.thumbnail,
            sourceFile: video.file,
            position: 0, // Will be set when added to timeline
            originalVideoId: video.id,
          };
          
          generatedClips.push(clip);
        }
      }

      if (config.randomOrder) {
        generatedClips.sort(() => Math.random() - 0.5);
      }

      onClipsGenerated(generatedClips);
      
      toast({
        title: "Clips generated",
        description: `Created ${generatedClips.length} random clips`,
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Error generating clips",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Button
          onClick={handleUploadClick}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Videos
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {sourceVideos.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white">Generate Clips</h3>
          
          <div className="space-y-2">
            <div>
              <Label htmlFor="clipDuration" className="text-xs text-gray-300">
                Clip Duration (seconds)
              </Label>
              <Input
                id="clipDuration"
                type="number"
                min="1"
                max="60"
                value={config.clipDuration}
                onChange={(e) => setConfig(prev => ({ ...prev, clipDuration: Number(e.target.value) }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="totalDuration" className="text-xs text-gray-300">
                Total Duration (seconds)
              </Label>
              <Input
                id="totalDuration"
                type="number"
                min="1"
                value={config.totalDuration}
                onChange={(e) => setConfig(prev => ({ ...prev, totalDuration: Number(e.target.value) }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="randomOrder"
                checked={config.randomOrder}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, randomOrder: !!checked }))}
              />
              <Label htmlFor="randomOrder" className="text-xs text-gray-300">
                Random order
              </Label>
            </div>
          </div>
          
          <Button
            onClick={generateRandomClips}
            disabled={isGenerating}
            className="w-full bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Scissors className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Clips'}
          </Button>
        </div>
      )}

      {sourceVideos.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-white">Source Videos</h3>
          <div className="space-y-1">
            {sourceVideos.map((video) => (
              <div key={video.id} className="text-xs text-gray-300 p-2 bg-gray-700 rounded">
                <div className="truncate">{video.name}</div>
                <div className="text-gray-400">{video.duration.toFixed(1)}s</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
