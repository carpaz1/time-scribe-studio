
import { VideoClip } from '@/types/timeline';

export class ThumbnailService {
  private static instance: ThumbnailService;
  private thumbnailCache = new Map<string, string>();

  static getInstance(): ThumbnailService {
    if (!ThumbnailService.instance) {
      ThumbnailService.instance = new ThumbnailService();
    }
    return ThumbnailService.instance;
  }

  async generateThumbnail(clip: VideoClip, width: number = 120, height: number = 68): Promise<string> {
    const cacheKey = `${clip.id}-${width}x${height}`;
    
    if (this.thumbnailCache.has(cacheKey)) {
      return this.thumbnailCache.get(cacheKey)!;
    }

    try {
      const thumbnail = await this.createVideoThumbnail(clip, width, height);
      this.thumbnailCache.set(cacheKey, thumbnail);
      return thumbnail;
    } catch (error) {
      console.warn('Failed to generate thumbnail:', error);
      return this.getPlaceholderThumbnail(width, height);
    }
  }

  private async createVideoThumbnail(clip: VideoClip, width: number, height: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.muted = true;
      video.crossOrigin = 'anonymous';
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = width;
      canvas.height = height;

      video.addEventListener('loadedmetadata', () => {
        video.currentTime = clip.startTime || 0;
      });

      video.addEventListener('seeked', () => {
        try {
          ctx.drawImage(video, 0, 0, width, height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          URL.revokeObjectURL(video.src);
          resolve(thumbnail);
        } catch (error) {
          reject(error);
        }
      });

      video.addEventListener('error', () => {
        reject(new Error('Video load error'));
      });

      video.src = URL.createObjectURL(clip.sourceFile);
    });
  }

  private getPlaceholderThumbnail(width: number, height: number): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = width;
    canvas.height = height;
    
    // Create gradient placeholder
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#4f46e5');
    gradient.addColorStop(1, '#7c3aed');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add play icon
    ctx.fillStyle = 'white';
    ctx.font = `${Math.min(width, height) / 3}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('▶', width / 2, height / 2 + 10);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  clearCache(): void {
    this.thumbnailCache.clear();
  }
}
