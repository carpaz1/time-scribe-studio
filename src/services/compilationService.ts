
import { VideoClip, TimelineConfig } from '@/types/timeline';
import { FileUploadService } from './fileUploadService';

export class CompilationService {
  private static activeCompilation: AbortController | null = null;

  static async compileWithAI(
    clips: VideoClip[],
    config: TimelineConfig,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<{ downloadUrl?: string; outputFile?: string }> {
    console.log('Starting AI compilation with', clips.length, 'clips');
    
    if (clips.length === 0) {
      throw new Error('No clips to compile');
    }

    // Create abort controller for cancellation
    this.activeCompilation = new AbortController();

    try {
      onProgress?.(5, 'Validating files...');

      // Validate all files first
      for (const clip of clips) {
        if (!FileUploadService.validateFileSize(clip.sourceFile)) {
          throw new Error(`File ${clip.sourceFile.name} is too large (max 2GB)`);
        }
      }

      onProgress?.(10, 'Starting server connection...');

      // Test server connection
      const healthResponse = await fetch('http://localhost:4000/health', {
        signal: this.activeCompilation.signal
      });

      if (!healthResponse.ok) {
        throw new Error('Server not responding. Please ensure the backend is running.');
      }

      onProgress?.(20, 'Uploading files...');

      // Upload unique files with chunking
      const uniqueFiles = new Map();
      clips.forEach((clip) => {
        const fileKey = `${clip.sourceFile.name}_${clip.sourceFile.size}`;
        if (!uniqueFiles.has(fileKey)) {
          uniqueFiles.set(fileKey, {
            file: clip.sourceFile,
            clips: []
          });
        }
        uniqueFiles.get(fileKey).clips.push(clip);
      });

      const fileUploadPromises = Array.from(uniqueFiles.values()).map(
        async (fileData, index) => {
          const uploadProgress = (progress: number) => {
            const overallProgress = 20 + (progress / uniqueFiles.size) * 0.3;
            onProgress?.(overallProgress, `Uploading ${fileData.file.name}...`);
          };

          return await FileUploadService.uploadFileInChunks(
            fileData.file,
            uploadProgress
          );
        }
      );

      const uploadedFileIds = await Promise.all(fileUploadPromises);

      onProgress?.(50, 'Processing with AI...');

      // Create compilation request with file IDs
      const compilationData = {
        clips: clips.map((clip, index) => ({
          id: clip.id,
          name: clip.name,
          startTime: clip.startTime,
          duration: clip.duration,
          position: clip.position,
          fileId: uploadedFileIds[0] // Simplified for now
        })),
        config,
        aiEnhanced: true
      };

      const compileResponse = await fetch('http://localhost:4000/compile-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compilationData),
        signal: this.activeCompilation.signal
      });

      if (!compileResponse.ok) {
        throw new Error(`Compilation failed: ${compileResponse.status}`);
      }

      const result = await compileResponse.json();

      if (result.jobId) {
        return await this.pollCompilationProgress(result.jobId, onProgress);
      }

      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Compilation cancelled by user');
      }
      throw error;
    } finally {
      this.activeCompilation = null;
    }
  }

  private static async pollCompilationProgress(
    jobId: string,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<{ downloadUrl?: string; outputFile?: string }> {
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`http://localhost:4000/progress/${jobId}`);
          const data = await response.json();

          onProgress?.(data.percent || 0, data.stage || 'Processing...');

          if (data.percent >= 100 && data.downloadUrl) {
            clearInterval(pollInterval);
            resolve({
              downloadUrl: data.downloadUrl,
              outputFile: data.outputFile
            });
          }

          if (data.error) {
            clearInterval(pollInterval);
            reject(new Error(data.error));
          }
        } catch (error) {
          clearInterval(pollInterval);
          reject(error);
        }
      }, 1000);

      // Timeout after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        reject(new Error('Compilation timeout'));
      }, 600000);
    });
  }

  static cancelCompilation(): void {
    if (this.activeCompilation) {
      this.activeCompilation.abort();
      this.activeCompilation = null;
    }
  }
}
