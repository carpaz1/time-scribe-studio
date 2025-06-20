
import { VideoClip, TimelineConfig } from '@/types/timeline';
import { CompilationResult, ProgressCallback } from './types';

export class SimulationService {
  static async simulateLocalCompilation(
    clips: VideoClip[],
    config: TimelineConfig,
    onProgress?: ProgressCallback
  ): Promise<CompilationResult> {
    console.log('SimulationService: Running local compilation simulation...');
    
    const stages = [
      { progress: 20, stage: 'Analyzing video clips...', delay: 500 },
      { progress: 35, stage: 'Applying AI enhancements...', delay: 800 },
      { progress: 50, stage: 'Processing transitions...', delay: 600 },
      { progress: 70, stage: 'Optimizing output quality...', delay: 700 },
      { progress: 85, stage: 'Rendering final video...', delay: 1000 },
      { progress: 95, stage: 'Finalizing compilation...', delay: 400 },
      { progress: 100, stage: 'Local simulation complete!', delay: 200 }
    ];
    
    for (const { progress, stage, delay } of stages) {
      onProgress?.(progress, stage);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Create a more realistic mock video blob
    const mockVideoData = new Uint8Array(1024 * 1024); // 1MB of mock data
    const mockVideoBlob = new Blob([mockVideoData], { type: 'video/mp4' });
    const mockUrl = URL.createObjectURL(mockVideoBlob);
    
    console.log('SimulationService: Created mock video blob URL:', mockUrl);
    
    return {
      downloadUrl: mockUrl,
      outputFile: `ai_generated_video_${Date.now()}.mp4`
    };
  }
}
