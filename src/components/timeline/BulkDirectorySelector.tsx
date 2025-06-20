import React, { useState, useRef } from 'react';
import { Folder, Shuffle, Image, Video, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface BulkDirectorySelectorProps {
  onBulkUpload: (files: File[]) => void;
}

const BulkDirectorySelector: React.FC<BulkDirectorySelectorProps> = ({
  onBulkUpload,
}) => {
  const [config, setConfig] = useState({
    numPictures: 5,
    numVideos: 5,
    clipDuration: 3,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{ pictures: File[], videos: File[] }>({
    pictures: [],
    videos: []
  });
  
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDirectorySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const pictures: File[] = [];
    const videos: File[] = [];

    // Separate files by type
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        pictures.push(file);
      } else if (file.type.startsWith('video/')) {
        videos.push(file);
      }
    });

    setSelectedFiles({ pictures, videos });
    
    toast({
      title: "Directory loaded",
      description: `Found ${pictures.length} pictures and ${videos.length} videos`,
    });
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const createThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        resolve(url);
      } else {
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
      }
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

  const processSelectedFiles = async () => {
    if (selectedFiles.pictures.length === 0 && selectedFiles.videos.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select a directory first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const generatedClips: VideoClip[] = [];
      const sourceVideos: SourceVideo[] = [];

      // Process pictures
      if (config.numPictures > 0 && selectedFiles.pictures.length > 0) {
        const selectedPictures = shuffleArray(selectedFiles.pictures).slice(0, config.numPictures);
        
        for (let i = 0; i < selectedPictures.length; i++) {
          const picture = selectedPictures[i];
          const thumbnail = await createThumbnail(picture);
          
          const clip: VideoClip = {
            id: `picture-clip-${Date.now()}-${i}`,
            name: `${picture.name.replace(/\.[^/.]+$/, '')}-image`,
            startTime: 0,
            duration: config.clipDuration,
            thumbnail,
            sourceFile: picture,
            position: 0,
            originalVideoId: `picture-${i}`,
          };
          
          generatedClips.push(clip);
        }
      }

      // Process videos
      if (config.numVideos > 0 && selectedFiles.videos.length > 0) {
        const selectedVideos = shuffleArray(selectedFiles.videos).slice(0, config.numVideos);
        
        for (let i = 0; i < selectedVideos.length; i++) {
          const video = selectedVideos[i];
          const duration = await getVideoDuration(video);
          const thumbnail = await createThumbnail(video);
          
          // Create source video entry
          const sourceVideo: SourceVideo = {
            id: `bulk-video-${Date.now()}-${i}`,
            name: video.name.replace(/\.[^/.]+$/, ''),
            file: video,
            duration,
            thumbnail,
          };
          
          sourceVideos.push(sourceVideo);

          // Create random clip from video
          if (duration >= config.clipDuration) {
            const maxStartTime = duration - config.clipDuration;
            const randomStartTime = Math.random() * maxStartTime;
            
            const clip: VideoClip = {
              id: `video-clip-${Date.now()}-${i}`,
              name: `${video.name.replace(/\.[^/.]+$/, '')}-clip`,
              startTime: randomStartTime,
              duration: config.clipDuration,
              thumbnail,
              sourceFile: video,
              position: 0,
              originalVideoId: sourceVideo.id,
            };
            
            generatedClips.push(clip);
          }
        }
      }

      // Shuffle all generated clips
      const shuffledClips = shuffleArray(generatedClips);

      onBulkUpload(selectedFiles.pictures.concat(selectedFiles.videos));
      onClipsGenerated(shuffledClips);

      toast({
        title: "Bulk processing complete",
        description: `Generated ${shuffledClips.length} clips from selected files`,
      });
    } catch (error) {
      console.error('Error processing files:', error);
      toast({
        title: "Processing failed",
        description: "Error processing selected files",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDirectoryClick = () => {
    directoryInputRef.current?.click();
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Folder className="w-4 h-4" />
          Bulk Directory Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Directory Selection */}
        <div>
          <Button
            onClick={handleDirectoryClick}
            variant="outline"
            className="w-full justify-start bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600/50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Select Directory
          </Button>
          <input
            ref={directoryInputRef}
            type="file"
            // @ts-ignore - webkitdirectory is a valid HTML attribute
            webkitdirectory=""
            multiple
            onChange={handleDirectorySelect}
            className="hidden"
          />
        </div>

        {/* File Counts Display */}
        {(selectedFiles.pictures.length > 0 || selectedFiles.videos.length > 0) && (
          <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Image className="w-4 h-4" />
              <span>{selectedFiles.pictures.length} pictures found</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Video className="w-4 h-4" />
              <span>{selectedFiles.videos.length} videos found</span>
            </div>
          </div>
        )}

        {/* Configuration */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="numPictures" className="text-xs text-gray-300">
              Number of Pictures
            </Label>
            <Input
              id="numPictures"
              type="number"
              min="0"
              max="50"
              value={config.numPictures}
              onChange={(e) => setConfig(prev => ({ ...prev, numPictures: Number(e.target.value) }))}
              className="h-8 text-sm"
            />
          </div>
          
          <div>
            <Label htmlFor="numVideos" className="text-xs text-gray-300">
              Number of Video Clips
            </Label>
            <Input
              id="numVideos"
              type="number"
              min="0"
              max="50"
              value={config.numVideos}
              onChange={(e) => setConfig(prev => ({ ...prev, numVideos: Number(e.target.value) }))}
              className="h-8 text-sm"
            />
          </div>
          
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
        </div>

        {/* Process Button */}
        <Button
          onClick={processSelectedFiles}
          disabled={isProcessing || (selectedFiles.pictures.length === 0 && selectedFiles.videos.length === 0)}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          <Shuffle className="w-4 h-4 mr-2" />
          {isProcessing ? 'Processing...' : 'Generate Random Clips'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BulkDirectorySelector;
