
import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface VideoUploaderProps {
  onVideoUpload: (files: File[]) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({
  onVideoUpload,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Enhanced video format validation
  const SUPPORTED_VIDEO_FORMATS = [
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv',
    'video/webm',
    'video/mkv',
    'video/m4v',
    'video/3gp'
  ];

  const SUPPORTED_EXTENSIONS = [
    '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp'
  ];

  const isValidVideoFile = (file: File): boolean => {
    // Check MIME type first
    if (SUPPORTED_VIDEO_FORMATS.includes(file.type)) {
      return true;
    }

    // Fallback to extension check for files with missing/incorrect MIME types
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    return SUPPORTED_EXTENSIONS.includes(extension);
  };

  const validateVideoFile = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      // Basic format check
      if (!isValidVideoFile(file)) {
        console.warn('VideoUploader: Unsupported format:', file.name, file.type);
        return resolve(false);
      }

      // Size check (max 10GB)
      if (file.size > 10 * 1024 * 1024 * 1024) {
        console.warn('VideoUploader: File too large:', file.name, file.size);
        return resolve(false);
      }

      // Quick video validation using video element
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;

      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
        video.src = '';
      };

      const timeout = setTimeout(() => {
        console.warn('VideoUploader: Video validation timeout for:', file.name);
        cleanup();
        resolve(false);
      }, 3000);

      video.addEventListener('loadedmetadata', () => {
        clearTimeout(timeout);
        const isValid = video.duration > 0 && !isNaN(video.duration);
        console.log('VideoUploader: Video validation result for:', file.name, isValid);
        cleanup();
        resolve(isValid);
      }, { once: true });

      video.addEventListener('error', (e) => {
        clearTimeout(timeout);
        console.warn('VideoUploader: Video validation failed for:', file.name, e);
        cleanup();
        resolve(false);
      }, { once: true });
    });
  };

  const handleFileUpload = async (files: FileList) => {
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    console.log('VideoUploader: Processing', files.length, 'files');
    
    for (const file of Array.from(files)) {
      console.log('VideoUploader: Checking file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      const isValid = await validateVideoFile(file);
      
      if (isValid) {
        validFiles.push(file);
        console.log('VideoUploader: Added valid file:', file.name);
      } else {
        invalidFiles.push(file.name);
        console.log('VideoUploader: Skipped invalid file:', file.name);
      }
    }
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Some files were skipped",
        description: `${invalidFiles.length} unsupported or corrupted files were skipped. Supported formats: MP4, AVI, MOV, WMV, FLV, WebM, MKV, M4V, 3GP`,
        variant: "destructive",
      });
    }
    
    if (validFiles.length > 0) {
      console.log('VideoUploader: Successfully validated', validFiles.length, 'files');
      toast({
        title: "Files loaded",
        description: `${validFiles.length} video files loaded successfully`,
        variant: "default",
      });
      onVideoUpload(validFiles);
    } else if (files.length > 0) {
      toast({
        title: "No valid videos found",
        description: "Please select supported video files (MP4, AVI, MOV, etc.)",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
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
    <div
      className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 cursor-pointer ${
        isDragOver 
          ? 'border-blue-400 bg-blue-500/10 scale-[1.02]' 
          : 'border-slate-600/50 hover:border-slate-500/70'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleUploadClick}
    >
      <div className="text-center">
        <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center transition-colors ${
          isDragOver ? 'bg-blue-500' : 'bg-slate-700'
        }`}>
          <Upload className="w-6 h-6 text-white" />
        </div>
        <p className="text-white font-medium mb-1">
          {isDragOver ? 'Drop videos here' : 'Upload Videos'}
        </p>
        <p className="text-xs text-slate-400">
          Drag & drop or click to browse
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Supports: MP4, AVI, MOV, WMV, FLV, WebM, MKV, M4V, 3GP
        </p>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
};

export default VideoUploader;
