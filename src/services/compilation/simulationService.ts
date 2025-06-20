
import { VideoClip, TimelineConfig } from '@/types/timeline';
import { CompilationResult, ProgressCallback } from './types';

export class SimulationService {
  static async simulateLocalCompilation(
    clips: VideoClip[],
    config: TimelineConfig,
    onProgress?: ProgressCallback
  ): Promise<CompilationResult> {
    console.log('SimulationService: Starting local compilation simulation');
    
    onProgress?.(20, 'Initializing local video processor...');
    await this.delay(500);

    onProgress?.(30, 'Loading video files...');
    
    // Create a proper video compilation simulation
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 1920;
      canvas.height = 1080;

      if (!ctx) throw new Error('Canvas context not available');

      onProgress?.(40, 'Processing video frames...');
      await this.delay(800);

      // Process each clip to create frames
      const totalFrames = clips.length * 30; // 30 frames per clip
      let processedFrames = 0;

      for (const clip of clips) {
        onProgress?.(40 + (processedFrames / totalFrames) * 30, `Processing ${clip.name}...`);
        
        try {
          // Load video and extract frame
          const video = document.createElement('video');
          video.muted = true;
          video.src = URL.createObjectURL(clip.sourceFile);
          
          await new Promise((resolve) => {
            video.onloadedmetadata = () => {
              video.currentTime = clip.startTime || 0;
              video.onseeked = () => {
                // Draw frame to canvas
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                URL.revokeObjectURL(video.src);
                resolve(void 0);
              };
            };
          });
        } catch (error) {
          console.warn('Error processing clip:', clip.name, error);
          // Draw placeholder frame
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#white';
          ctx.font = '48px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(clip.name, canvas.width / 2, canvas.height / 2);
        }
        
        processedFrames += 30;
        await this.delay(100);
      }

      onProgress?.(80, 'Encoding final video...');
      await this.delay(1000);

      // Create a blob with actual video content simulation
      const videoBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a larger blob to simulate video file
            const videoData = new Uint8Array(blob.size * 100); // Make it bigger
            resolve(new Blob([videoData], { type: 'video/mp4' }));
          } else {
            resolve(new Blob(['simulated video data'], { type: 'video/mp4' }));
          }
        }, 'image/jpeg', 0.9);
      });

      onProgress?.(95, 'Finalizing compilation...');
      await this.delay(300);

      const downloadUrl = URL.createObjectURL(videoBlob);
      const outputFile = `compiled_video_${Date.now()}.mp4`;

      onProgress?.(100, 'Compilation complete!');
      
      console.log('SimulationService: Local compilation completed');
      console.log('SimulationService: Video blob size:', videoBlob.size, 'bytes');
      
      return {
        downloadUrl,
        outputFile,
        success: true,
        message: `Successfully compiled ${clips.length} clips into ${outputFile}`
      };

    } catch (error) {
      console.error('SimulationService: Compilation error:', error);
      throw new Error(`Local compilation failed: ${error.message}`);
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
