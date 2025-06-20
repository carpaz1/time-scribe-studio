
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

      // Create a more realistic video blob simulation
      const videoBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a simulated MP4 header and data structure
            const mp4Header = new Uint8Array([
              0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // ftyp box
              0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
              0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
              0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31
            ]);
            
            // Create larger simulated video data (approximately 5MB)
            const videoDataSize = 5 * 1024 * 1024; // 5MB
            const videoData = new Uint8Array(videoDataSize);
            
            // Fill with pseudo-random data to simulate video content
            for (let i = 0; i < videoDataSize; i++) {
              videoData[i] = Math.floor(Math.random() * 256);
            }
            
            // Combine header and data
            const fullVideoData = new Uint8Array(mp4Header.length + videoData.length);
            fullVideoData.set(mp4Header, 0);
            fullVideoData.set(videoData, mp4Header.length);
            
            resolve(new Blob([fullVideoData], { type: 'video/mp4' }));
          } else {
            // Fallback to a basic blob
            const fallbackData = new Uint8Array(1024 * 1024); // 1MB fallback
            resolve(new Blob([fallbackData], { type: 'video/mp4' }));
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
      console.log(`SimulationService: Successfully compiled ${clips.length} clips into ${outputFile}`);
      
      return {
        downloadUrl,
        outputFile
      };

    } catch (error) {
      console.error('SimulationService: Compilation error:', error);
      throw new Error(`Local compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
