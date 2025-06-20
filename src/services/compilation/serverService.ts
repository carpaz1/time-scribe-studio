
import { VideoClip, TimelineConfig } from '@/types/timeline';
import { ProgressTrackingService } from '../progressTrackingService';
import { CompilationData, CompilationResult, ProgressCallback } from './types';

export class ServerService {
  static async compileOnServer(
    clips: VideoClip[],
    config: TimelineConfig,
    uploadResults: Map<string, string>,
    signal: AbortSignal,
    onProgress?: ProgressCallback
  ): Promise<CompilationResult> {
    onProgress?.(60, 'Starting AI-enhanced compilation...');

    // Create compilation request with uploaded file IDs
    const compilationData: CompilationData = {
      clips: clips.map((clip) => {
        const fileKey = `${clip.sourceFile.name}_${clip.sourceFile.size}`;
        return {
          id: clip.id,
          name: clip.name,
          startTime: clip.startTime,
          duration: clip.duration,
          position: clip.position,
          fileId: uploadResults.get(fileKey) || 'unknown'
        };
      }),
      config: {
        ...config,
        aiEnhanced: true,
        smartTransitions: true,
        autoColorCorrection: true
      }
    };

    const compileResponse = await fetch('http://localhost:4000/compile-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(compilationData),
      signal
    });

    if (!compileResponse.ok) {
      throw new Error('AI compilation endpoint not available');
    }

    const result = await compileResponse.json();

    if (result.jobId) {
      return await this.trackCompilationProgress(result.jobId, onProgress);
    }

    return result;
  }

  private static async trackCompilationProgress(
    jobId: string,
    onProgress?: ProgressCallback
  ): Promise<CompilationResult> {
    return new Promise((resolve, reject) => {
      ProgressTrackingService.trackProgress(
        jobId,
        (progress, stage) => {
          onProgress?.(progress, stage);
          
          // Check for completion
          if (progress >= 100 && stage.toLowerCase().includes('complete')) {
            ProgressTrackingService.stopTracking(jobId);
            
            // Fetch final result
            fetch(`http://localhost:4000/progress/${jobId}`)
              .then(res => res.json())
              .then(data => {
                if (data.downloadUrl) {
                  resolve({
                    downloadUrl: data.downloadUrl,
                    outputFile: data.outputFile
                  });
                } else {
                  resolve({ outputFile: `compiled_${jobId}.mp4` });
                }
              })
              .catch(() => {
                resolve({ outputFile: `compiled_${jobId}.mp4` });
              });
          }
          
          // Check for errors
          if (stage.toLowerCase().includes('error')) {
            ProgressTrackingService.stopTracking(jobId);
            reject(new Error(stage));
          }
        },
        {
          'upload': { min: 60, max: 70 },
          'processing': { min: 70, max: 90 },
          'compilation': { min: 90, max: 98 },
          'finalization': { min: 98, max: 100 }
        }
      );
    });
  }
}
