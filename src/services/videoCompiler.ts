
import { VideoClip, TimelineConfig, CompileRequest } from '@/types/timeline';

export class VideoCompilerService {
  static async compileTimeline(
    timelineClips: VideoClip[],
    config: TimelineConfig,
    onExport?: (data: CompileRequest) => void
  ): Promise<void> {
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

    const response = await fetch('http://localhost:4000/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Compilation failed:', response.status, errorText);
      throw new Error(`Server error: ${response.status}`);
    }

    const compileData: CompileRequest = { config, clips: timelineClips };
    onExport?.(compileData);
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
