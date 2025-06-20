
import { VideoClip } from '@/types/timeline';
import { FileUploadService } from '../fileUploadService';

export class ValidationService {
  static validateClips(clips: VideoClip[]): void {
    if (clips.length === 0) {
      throw new Error('No clips to compile');
    }

    for (const clip of clips) {
      if (!FileUploadService.validateFileSize(clip.sourceFile)) {
        throw new Error(`File ${clip.sourceFile.name} is too large (max 2GB)`);
      }
    }
  }

  static async checkServerHealth(): Promise<boolean> {
    try {
      const healthResponse = await fetch('http://localhost:4000/health', {
        method: 'GET'
      });

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('ValidationService: Server health check passed:', healthData);
        return true;
      }
    } catch (serverError) {
      console.warn('ValidationService: Server connection failed:', serverError);
    }
    
    return false;
  }
}
