
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
      console.warn('Failed to generate thumbnail for clip:', clip.name, error);
      const placeholder = this.getPlaceholderThumbnail(width, height);
      this.thumbnailCache.set(cacheKey, placeholder);
      return placeholder;
    }
  }

  private async createVideoThumbnail(clip: VideoClip, width: number, height: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.muted = true;
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = width;
      canvas.height = height;

      let hasResolved = false;

      const cleanup = () => {
        if (video.src) {
          URL.revokeObjectURL(video.src);
        }
      };

      const timeout = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          cleanup();
          reject(new Error('Thumbnail generation timeout'));
        }
      }, 5000);

      video.addEventListener('loadedmetadata', () => {
        if (!hasResolved) {
          video.currentTime = clip.startTime || 0;
        }
      });

      video.addEventListener('seeked', () => {
        if (!hasResolved) {
          try {
            ctx.drawImage(video, 0, 0, width, height);
            const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
            hasResolved = true;
            clearTimeout(timeout);
            cleanup();
            resolve(thumbnail);
          } catch (error) {
            hasResolved = true;
            clearTimeout(timeout);
            cleanup();
            reject(error);
          }
        }
      });

      video.addEventListener('error', (e) => {
        if (!hasResolved) {
          hasResolved = true;
          clearTimeout(timeout);
          cleanup();
          reject(new Error('Video load error'));
        }
      });

      try {
        video.src = URL.createObjectURL(clip.sourceFile);
      } catch (error) {
        hasResolved = true;
        clearTimeout(timeout);
        reject(error);
      }
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
    ctx.font = `${Math.min(width, height) / 4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('▶', width / 2, height / 2);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  clearCache(): void {
    this.thumbnailCache.clear();
  }
}
