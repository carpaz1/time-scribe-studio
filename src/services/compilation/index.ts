
import { VideoClip, TimelineConfig } from '@/types/timeline';
import { ProgressTrackingService } from '../progressTrackingService';
import { ValidationService } from './validationService';
import { UploadService } from './uploadService';
import { SimulationService } from './simulationService';
import { ServerService } from './serverService';
import { CompilationResult, ProgressCallback } from './types';

export class CompilationService {
  private static activeCompilation: AbortController | null = null;

  static async compileWithAI(
    clips: VideoClip[],
    config: TimelineConfig,
    onProgress?: ProgressCallback
  ): Promise<CompilationResult> {
    console.log('CompilationService: Starting AI compilation with', clips.length, 'clips');
    
    // Create abort controller for cancellation
    this.activeCompilation = new AbortController();

    try {
      onProgress?.(5, 'Validating files...');
      ValidationService.validateClips(clips);

      onProgress?.(10, 'Testing server connection...');
      const serverAvailable = await ValidationService.checkServerHealth();

      if (!serverAvailable) {
        onProgress?.(15, 'Server unavailable - using local simulation...');
        return await SimulationService.simulateLocalCompilation(clips, config, onProgress);
      }

      onProgress?.(20, 'Server connected - preparing upload...');

      // Group clips by source file to avoid duplicate uploads
      const fileGroups = UploadService.groupClipsByFile(clips);
      onProgress?.(25, `Uploading ${fileGroups.size} unique files...`);

      // Upload files with better progress tracking
      let uploadResults: Map<string, string>;
      try {
        uploadResults = await UploadService.uploadFiles(fileGroups, onProgress);
      } catch (uploadError) {
        console.error('CompilationService: Upload failed:', uploadError);
        onProgress?.(30, 'Upload failed, using local simulation...');
        return await SimulationService.simulateLocalCompilation(clips, config, onProgress);
      }

      // Compile on server
      try {
        return await ServerService.compileOnServer(
          clips,
          config,
          uploadResults,
          this.activeCompilation.signal,
          onProgress
        );
      } catch (serverError) {
        console.warn('CompilationService: Server compilation failed:', serverError);
        onProgress?.(65, 'Server compilation failed, using local simulation...');
        return await SimulationService.simulateLocalCompilation(clips, config, onProgress);
      }

    } catch (error) {
      console.error('CompilationService: Compilation error:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Compilation cancelled by user');
      }
      
      // If it's a network error, try local simulation
      if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('404')) {
        onProgress?.(20, 'Network error - using local simulation...');
        return await SimulationService.simulateLocalCompilation(clips, config, onProgress);
      }
      
      throw error;
    } finally {
      this.activeCompilation = null;
    }
  }

  static cancelCompilation(): void {
    if (this.activeCompilation) {
      this.activeCompilation.abort();
      this.activeCompilation = null;
    }
    
    // Stop all active progress tracking
    ProgressTrackingService.stopTracking('all');
  }
}
