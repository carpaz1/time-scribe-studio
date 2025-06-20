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

  // More permissive video format validation
  const SUPPORTED_VIDEO_FORMATS = [
    'video/mp4',
    'video/avi', 
    'video/mov',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo'
  ];

  const SUPPORTED_EXTENSIONS = [
    '.mp4', '.avi', '.mov', '.webm', '.qt'
  ];

  // Only block truly problematic formats
  const BLOCKED_EXTENSIONS = [
    '.wmv', '.flv'
  ];

  const isValidVideoFile = (file: File): boolean => {
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    // Block only known problematic formats
    if (BLOCKED_EXTENSIONS.includes(extension)) {
      console.warn('VideoUploader: Blocked problematic format:', file.name, extension);
      return false;
    }
    
    // Check MIME type first
    if (SUPPORTED_VIDEO_FORMATS.includes(file.type)) {
      return true;
    }

    // More permissive extension check
    if (SUPPORTED_EXTENSIONS.includes(extension)) {
      return true;
    }

    // Allow files that might be videos but have generic MIME types
    if (file.type.startsWith('video/') || extension.match(/\.(mp4|avi|mov|webm|mkv|m4v)$/i)) {
      return true;
    }

    return false;
  };

  const validateVideoFile = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      // Basic format check
      if (!isValidVideoFile(file)) {
        console.warn('VideoUploader: Unsupported format:', file.name, file.type);
        return resolve(false);
      }

      // Size check (max 5GB)
      if (file.size > 5 * 1024 * 1024 * 1024) {
        console.warn('VideoUploader: File too large:', file.name, file.size);
        return resolve(false);
      }

      // Minimum size check (1KB minimum)
      if (file.size < 1024) {
        console.warn('VideoUploader: File too small:', file.name, file.size);
        return resolve(false);
      }

      // Quick video validation with longer timeout for larger files
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;

      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
        video.src = '';
      };

      const timeout = setTimeout(() => {
        console.warn('VideoUploader: Video validation timeout for:', file.name);
        cleanup();
        // Don't reject on timeout, assume it's valid
        resolve(true);
      }, 5000); // Increased timeout

      video.addEventListener('loadedmetadata', () => {
        clearTimeout(timeout);
        
        // More permissive validation
        const isValid = video.duration > 0 && 
                        !isNaN(video.duration) && 
                        video.videoWidth > 0 && 
                        video.videoHeight > 0;
        
        console.log('VideoUploader: Video validation result for:', file.name, {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          isValid
        });
        
        cleanup();
        resolve(isValid);
      }, { once: true });

      video.addEventListener('error', (e) => {
        clearTimeout(timeout);
        console.warn('VideoUploader: Video validation failed for:', file.name, e);
        cleanup();
        // Don't reject immediately, let server handle it
        resolve(true);
      }, { once: true });
    });
  };

  const handleFileUpload = async (files: FileList) => {
    const validFiles: File[] = [];
    const skippedFiles: { name: string; reason: string }[] = [];
    
    console.log('VideoUploader: Processing', files.length, 'files');
    
    for (const file of Array.from(files)) {
      console.log('VideoUploader: Checking file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      // Skip hidden files and system files
      if (file.name.startsWith('.') || file.name.startsWith('~')) {
        skippedFiles.push({ name: file.name, reason: 'Hidden/system file' });
        continue;
      }
      
      const isValid = await validateVideoFile(file);
      
      if (isValid) {
        validFiles.push(file);
        console.log('VideoUploader: Added valid file:', file.name);
      } else {
        const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        const reason = BLOCKED_EXTENSIONS.includes(extension) ? 'Unsupported format' : 'Invalid video file';
        skippedFiles.push({ name: file.name, reason });
        console.log('VideoUploader: Skipped invalid file:', file.name, reason);
      }
    }
    
    if (skippedFiles.length > 0 && validFiles.length > 0) {
      toast({
        title: "Some files were skipped",
        description: `${skippedFiles.length} files skipped. ${validFiles.length} files loaded.`,
        variant: "default",
      });
      console.log('VideoUploader: Skipped files:', skippedFiles);
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
        description: "Please select supported video files",
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
          Most video formats supported
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
