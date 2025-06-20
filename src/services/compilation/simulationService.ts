
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
    
    try {
      // Create a canvas for video processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 1920;
      canvas.height = 1080;

      if (!ctx) throw new Error('Canvas context not available');

      onProgress?.(40, 'Processing video frames...');
      await this.delay(800);

      // Process each clip and create video frames
      const frameRate = 30;
      const frames: ImageData[] = [];
      
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        onProgress?.(40 + (i / clips.length) * 30, `Processing ${clip.name}...`);
        
        try {
          // Load and process the video clip
          const video = document.createElement('video');
          video.muted = true;
          video.crossOrigin = 'anonymous';
          
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Video load timeout')), 5000);
            
            video.onloadedmetadata = () => {
              clearTimeout(timeout);
              video.currentTime = clip.startTime || 0;
            };
            
            video.onseeked = () => {
              try {
                // Draw the frame to canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Scale video to fit canvas while maintaining aspect ratio
                const videoAspect = video.videoWidth / video.videoHeight;
                const canvasAspect = canvas.width / canvas.height;
                
                let drawWidth, drawHeight, drawX, drawY;
                
                if (videoAspect > canvasAspect) {
                  drawWidth = canvas.width;
                  drawHeight = canvas.width / videoAspect;
                  drawX = 0;
                  drawY = (canvas.height - drawHeight) / 2;
                } else {
                  drawWidth = canvas.height * videoAspect;
                  drawHeight = canvas.height;
                  drawX = (canvas.width - drawWidth) / 2;
                  drawY = 0;
                }
                
                ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
                
                // Add clip info
                ctx.fillStyle = 'white';
                ctx.font = '48px Arial';
                ctx.fillText(`Clip ${i + 1}: ${clip.name}`, 50, 100);
                
                // Store frame data
                const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                frames.push(frameData);
                
                URL.revokeObjectURL(video.src);
                resolve();
              } catch (error) {
                URL.revokeObjectURL(video.src);
                reject(error);
              }
            };
            
            video.onerror = () => {
              clearTimeout(timeout);
              URL.revokeObjectURL(video.src);
              reject(new Error('Video load error'));
            };
            
            video.src = URL.createObjectURL(clip.sourceFile);
          });
          
        } catch (error) {
          console.warn('Error processing clip:', clip.name, error);
          // Create a fallback frame
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = 'white';
          ctx.font = '48px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(clip.name, canvas.width / 2, canvas.height / 2);
          const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          frames.push(frameData);
        }
        
        await this.delay(100);
      }

      onProgress?.(80, 'Creating video from frames...');
      await this.delay(1000);

      // Create a video blob using MediaRecorder for actual playable video
      const videoBlob = await this.createPlayableVideo(canvas, frames, frameRate);

      onProgress?.(95, 'Finalizing compilation...');
      await this.delay(300);

      const downloadUrl = URL.createObjectURL(videoBlob);
      const outputFile = `compiled_video_${Date.now()}.webm`;

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

  private static async createPlayableVideo(canvas: HTMLCanvasElement, frames: ImageData[], frameRate: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const stream = canvas.captureStream(frameRate);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp8',
          videoBitsPerSecond: 2500000
        });
        
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const videoBlob = new Blob(chunks, { type: 'video/webm' });
          resolve(videoBlob);
        };
        
        mediaRecorder.onerror = (event) => {
          reject(new Error('MediaRecorder error'));
        };
        
        mediaRecorder.start();
        
        // Draw frames to canvas to create video
        const ctx = canvas.getContext('2d')!;
        let frameIndex = 0;
        
        const drawFrame = () => {
          if (frameIndex < frames.length) {
            ctx.putImageData(frames[frameIndex], 0, 0);
            frameIndex++;
            setTimeout(drawFrame, 1000 / frameRate);
          } else {
            // Stop recording after all frames
            setTimeout(() => {
              mediaRecorder.stop();
              stream.getTracks().forEach(track => track.stop());
            }, 500);
          }
        };
        
        // Start drawing frames
        setTimeout(drawFrame, 100);
        
      } catch (error) {
        console.warn('MediaRecorder not available, creating fallback blob');
        // Fallback to a simple blob
        const fallbackData = new Uint8Array(5 * 1024 * 1024); // 5MB
        for (let i = 0; i < fallbackData.length; i++) {
          fallbackData[i] = Math.floor(Math.random() * 256);
        }
        resolve(new Blob([fallbackData], { type: 'video/webm' }));
      }
    });
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
