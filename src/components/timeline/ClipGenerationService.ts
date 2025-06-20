
import { VideoClip } from '@/types/timeline';

export class ClipGenerationService {
  static async generateClipsBatch(
    videos: File[], 
    clipCount: number, 
    clipDuration: number = 1,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<VideoClip[]> {
    const clips: VideoClip[] = [];
    const batchSize = 12;
    const videoElements = new Map<string, HTMLVideoElement>();
    
    try {
      for (let i = 0; i < clipCount; i += batchSize) {
        const batchPromises = [];
        const currentBatchSize = Math.min(batchSize, clipCount - i);
        
        for (let j = 0; j < currentBatchSize; j++) {
          const clipIndex = i + j;
          const randomVideo = videos[Math.floor(Math.random() * videos.length)];
          
          batchPromises.push(
            this.createSingleClip(randomVideo, clipIndex, clipDuration, videoElements)
          );
        }
        
        const batchResults = await Promise.allSettled(batchPromises);
        batchResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            clips.push(result.value);
          }
        });
        
        const progress = ((i + currentBatchSize) / clipCount) * 100;
        onProgress?.(progress, `Generated ${clips.length}/${clipCount} clips`);
        
        await new Promise(resolve => setTimeout(resolve, 5));
      }
    } finally {
      videoElements.forEach(video => {
        URL.revokeObjectURL(video.src);
      });
      videoElements.clear();
    }
    
    return clips;
  }

  private static async createSingleClip(
    video: File,
    index: number,
    duration: number,
    videoElements: Map<string, HTMLVideoElement>
  ): Promise<VideoClip | null> {
    try {
      let videoElement = videoElements.get(video.name);
      
      if (!videoElement) {
        videoElement = document.createElement('video');
        videoElement.muted = true;
        videoElement.preload = 'metadata';
        videoElements.set(video.name, videoElement);
        
        const objectUrl = URL.createObjectURL(video);
        videoElement.src = objectUrl;
        
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timeout')), 2000);
          videoElement!.addEventListener('loadedmetadata', () => {
            clearTimeout(timeout);
            resolve();
          }, { once: true });
        });
      }
      
      const videoDuration = videoElement.duration;
      const startTime = Math.random() * Math.max(0, videoDuration - duration);
      
      return {
        id: `clip-${index}-${Date.now()}-${Math.random()}`,
        name: `Clip ${index + 1}`,
        sourceFile: video,
        startTime,
        duration,
        thumbnail: '',
        position: index,
      };
    } catch (error) {
      console.warn(`Failed to create clip ${index}:`, error);
      return null;
    }
  }
}
