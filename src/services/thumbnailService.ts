
export class ThumbnailService {
  private static instance: ThumbnailService;
  private generationQueue: Map<string, Promise<string>> = new Map();

  static getInstance(): ThumbnailService {
    if (!ThumbnailService.instance) {
      ThumbnailService.instance = new ThumbnailService();
    }
    return ThumbnailService.instance;
  }

  async generateThumbnail(file: File, seekTime: number = 1): Promise<string> {
    const cacheKey = `${file.name}-${file.size}-${seekTime}`;
    
    // Return existing promise if already generating
    if (this.generationQueue.has(cacheKey)) {
      return this.generationQueue.get(cacheKey)!;
    }

    const promise = this.createThumbnail(file, seekTime);
    this.generationQueue.set(cacheKey, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      this.generationQueue.delete(cacheKey);
    }
  }

  private async createThumbnail(file: File, seekTime: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const cleanup = () => {
        if (video.src) {
          URL.revokeObjectURL(video.src);
        }
      };

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Thumbnail generation timeout'));
      }, 5000);

      video.addEventListener('loadedmetadata', () => {
        canvas.width = 160;
        canvas.height = 90;
        
        const targetTime = Math.min(seekTime, video.duration - 0.1);
        video.currentTime = Math.max(0, targetTime);
      }, { once: true });

      video.addEventListener('seeked', () => {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          clearTimeout(timeout);
          cleanup();
          resolve(dataUrl);
        } catch (error) {
          clearTimeout(timeout);
          cleanup();
          reject(error);
        }
      }, { once: true });

      video.addEventListener('error', () => {
        clearTimeout(timeout);
        cleanup();
        reject(new Error('Video load failed'));
      }, { once: true });

      video.muted = true;
      video.crossOrigin = 'anonymous';
      video.src = URL.createObjectURL(file);
    });
  }

  generateFallbackThumbnail(name: string, duration: number): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';
    
    canvas.width = 160;
    canvas.height = 90;
    
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#6366F1');
    gradient.addColorStop(1, '#8B5CF6');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎬', canvas.width / 2, canvas.height / 2 - 5);
    
    ctx.font = '10px Arial';
    ctx.fillText(`${duration.toFixed(1)}s`, canvas.width / 2, canvas.height / 2 + 15);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }
}
