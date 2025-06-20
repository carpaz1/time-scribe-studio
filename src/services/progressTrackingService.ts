
export class ProgressTrackingService {
  private static progressCallbacks = new Map<string, (progress: number, stage: string) => void>();
  private static activeIntervals = new Map<string, NodeJS.Timeout>();

  static trackProgress(
    jobId: string,
    onProgress: (progress: number, stage: string) => void,
    stages: { [key: string]: { min: number; max: number } } = {}
  ) {
    console.log('Starting progress tracking for job:', jobId);
    
    this.progressCallbacks.set(jobId, onProgress);
    
    // Clear any existing interval
    const existingInterval = this.activeIntervals.get(jobId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Default stages for video processing
    const defaultStages = {
      'upload': { min: 0, max: 20 },
      'validation': { min: 20, max: 30 },
      'processing': { min: 30, max: 80 },
      'compilation': { min: 80, max: 95 },
      'finalization': { min: 95, max: 100 }
    };

    const stageConfig = { ...defaultStages, ...stages };
    let currentStage = 'upload';
    let stageProgress = 0;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:4000/progress/${jobId}`, {
          timeout: 5000
        } as RequestInit);

        if (!response.ok) {
          if (response.status === 404) {
            // Job might not be started yet
            onProgress(5, 'Initializing...');
            return;
          }
          throw new Error(`Progress fetch failed: ${response.status}`);
        }

        const data = await response.json();
        
        // Map server progress to more accurate client progress
        let adjustedProgress = data.percent || 0;
        let stage = data.stage || 'Processing...';

        // Detect stage changes and adjust progress accordingly
        if (stage.toLowerCase().includes('upload')) {
          currentStage = 'upload';
        } else if (stage.toLowerCase().includes('validat')) {
          currentStage = 'validation';
        } else if (stage.toLowerCase().includes('process') || stage.toLowerCase().includes('encoding')) {
          currentStage = 'processing';
        } else if (stage.toLowerCase().includes('compil') || stage.toLowerCase().includes('concat')) {
          currentStage = 'compilation';
        } else if (stage.toLowerCase().includes('final') || stage.toLowerCase().includes('complete')) {
          currentStage = 'finalization';
        }

        // Map progress to stage range
        const stageRange = stageConfig[currentStage];
        if (stageRange) {
          adjustedProgress = stageRange.min + (adjustedProgress / 100) * (stageRange.max - stageRange.min);
        }

        onProgress(Math.min(adjustedProgress, 100), stage);

        // Handle completion
        if (data.percent >= 100 || data.downloadUrl) {
          this.stopTracking(jobId);
          onProgress(100, 'Complete!');
        }

        // Handle errors
        if (data.error) {
          console.error('Server reported error:', data.error);
          this.stopTracking(jobId);
          onProgress(0, `Error: ${data.error}`);
        }

      } catch (error) {
        console.warn('Progress polling error:', error);
        // Don't stop immediately, just show connection issues
        onProgress(stageProgress, 'Connection issues... retrying');
      }
    }, 1500);

    this.activeIntervals.set(jobId, pollInterval);

    // Safety timeout after 10 minutes
    setTimeout(() => {
      this.stopTracking(jobId);
      onProgress(0, 'Timeout - process may still be running');
    }, 600000);
  }

  static stopTracking(jobId: string) {
    const interval = this.activeIntervals.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.activeIntervals.delete(jobId);
    }
    this.progressCallbacks.delete(jobId);
    console.log('Stopped progress tracking for job:', jobId);
  }

  static updateProgress(jobId: string, progress: number, stage: string) {
    const callback = this.progressCallbacks.get(jobId);
    if (callback) {
      callback(progress, stage);
    }
  }
}
