
import { VideoClip, TimelineConfig, CompileRequest } from '@/types/timeline';

export class VideoCompilerService {
  static async compileTimeline(
    timelineClips: VideoClip[],
    config: TimelineConfig,
    onExport?: (data: CompileRequest) => void,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<{ downloadUrl?: string; outputFile?: string }> {
    if (timelineClips.length === 0) {
      throw new Error('No clips to compile');
    }

    const formData = new FormData();
    
    // Group clips by their source file to avoid duplicates
    const uniqueFiles = new Map();
    timelineClips.forEach((clip) => {
      const fileKey = clip.sourceFile.name + clip.sourceFile.size;
      if (!uniqueFiles.has(fileKey)) {
        uniqueFiles.set(fileKey, {
          file: clip.sourceFile,
          clips: []
        });
      }
      uniqueFiles.get(fileKey).clips.push(clip);
    });

    // Add unique video files
    const fileArray = Array.from(uniqueFiles.values());
    fileArray.forEach((fileData) => {
      formData.append('videos', fileData.file);
    });

    // Create clips data with file references
    const clipsData: any[] = [];
    timelineClips.forEach((clip) => {
      const fileKey = clip.sourceFile.name + clip.sourceFile.size;
      const fileIndex = fileArray.findIndex(f => f.file.name === clip.sourceFile.name && f.file.size === clip.sourceFile.size);
      
      clipsData.push({
        id: clip.id,
        name: clip.name,
        startTime: clip.startTime,
        duration: clip.duration,
        position: clip.position,
        fileIndex: fileIndex
      });
    });
    
    formData.append('clipsData', JSON.stringify(clipsData));

    console.log('Sending compilation request with', timelineClips.length, 'clips and', fileArray.length, 'unique files');

    try {
      const response = await fetch('http://localhost:4000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Compilation failed:', response.status, errorText);
        
        if (response.status === 0 || !response.status) {
          throw new Error('Cannot connect to local server. Make sure the backend is running on port 4000.');
        }
        
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // If we have a jobId, poll for progress
      if (result.jobId && onProgress) {
        await this.pollProgress(result.jobId, onProgress);
      }
      
      console.log('Compilation result:', result);

      const compileData: CompileRequest = { config, clips: timelineClips };
      onExport?.(compileData);

      return {
        downloadUrl: result.downloadUrl,
        outputFile: result.outputFile
      };
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to local server. Please make sure the backend server is running (start.bat).');
      }
      throw error;
    }
  }

  private static async pollProgress(jobId: string, onProgress: (progress: number, stage: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`http://localhost:4000/progress/${jobId}`);
          
          if (!response.ok) {
            clearInterval(pollInterval);
            reject(new Error('Failed to get progress'));
            return;
          }

          const progressData = await response.json();
          onProgress(progressData.percent, progressData.stage);

          // If complete or error, stop polling
          if (progressData.percent >= 100 || progressData.stage.startsWith('Error:')) {
            clearInterval(pollInterval);
            resolve();
          }
        } catch (error) {
          console.error('Progress polling error:', error);
          // Continue polling on network errors
        }
      }, 500); // Poll every 500ms for smooth progress

      // Timeout after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        resolve();
      }, 600000);
    });
  }

  static exportTimelineJSON(
    timelineClips: VideoClip[],
    totalDuration: number,
    zoom: number,
    playheadPosition: number
  ): void {
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
  }
}
