
import React, { useState } from 'react';
import { X, Download, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VideoPreviewProps {
  downloadUrl: string;
  outputFile: string;
  onClose: () => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  downloadUrl,
  outputFile,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Determine if this is a blob URL or server URL
  const isBlob = downloadUrl.startsWith('blob:');
  const fullVideoUrl = isBlob ? downloadUrl : `http://localhost:4000${downloadUrl}`;

  console.log('VideoPreview: URL type:', isBlob ? 'blob' : 'server', 'URL:', fullVideoUrl);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (!isPlaying) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleDownload = () => {
    if (isBlob) {
      // For blob URLs, create a download link directly
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = outputFile || 'compiled-video.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For server URLs, use the full server path
      const link = document.createElement('a');
      link.href = fullVideoUrl;
      link.download = outputFile || 'compiled-video.mp4';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error('VideoPreview: Video error:', e, 'URL:', fullVideoUrl);
    setVideoError(true);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-slate-800 border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-slate-200">
              Compilation Complete
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Video Player */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            {videoError ? (
              <div className="aspect-video flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p>Failed to load video preview</p>
                  <p className="text-sm text-slate-500">Video type: {isBlob ? 'Local simulation' : 'Server generated'}</p>
                  <p className="text-xs text-slate-600 mt-1">You can still try to download the file</p>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                src={fullVideoUrl}
                className="w-full aspect-video"
                onEnded={handleVideoEnd}
                onError={handleVideoError}
                onLoadStart={() => console.log('VideoPreview: Video load started')}
                onCanPlay={() => console.log('VideoPreview: Video can play')}
                controls={false}
                playsInline
              />
            )}
            
            {/* Video Controls Overlay */}
            {!videoError && (
              <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={handlePlayPause}
                    className="bg-black/50 hover:bg-black/70 text-white"
                  >
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={handleRestart}
                    className="bg-black/50 hover:bg-black/70 text-white"
                  >
                    <RotateCcw className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              File: {outputFile}
              <br />
              <span className="text-xs text-slate-500">
                Type: {isBlob ? 'Local simulation' : 'Server compilation'}
              </span>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Video
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="border-slate-600 text-slate-300"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoPreview;
