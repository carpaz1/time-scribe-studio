
import { VideoClip, TimelineConfig } from '@/types/timeline';

export interface CompilationProgress {
  progress: number;
  stage: string;
}

export interface CompilationResult {
  downloadUrl?: string;
  outputFile?: string;
}

export interface CompilationData {
  clips: Array<{
    id: string;
    name: string;
    startTime: number;
    duration: number;
    position: number;
    fileId: string;
  }>;
  config: TimelineConfig & {
    aiEnhanced: boolean;
    smartTransitions: boolean;
    autoColorCorrection: boolean;
  };
}

export interface ProgressCallback {
  (progress: number, stage: string): void;
}

export interface FileGroup {
  file: File;
  clips: VideoClip[];
}
