
import { VideoClip } from '@/types/timeline';
import { QuickCompiler } from '@/services/video/quickCompiler';
import { ClipGenerator } from '@/services/video/clipGenerator';
import { TimelineCompiler } from '@/services/video/timelineCompiler';

export class VideoCompilationService {
  static async quickRandomizeAndCompile(
    sourceVideos: File[],
    duration: number,
    includePictures: boolean = false,
    onExport?: (data: any) => void,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<{ clips: VideoClip[]; compilationResult: { downloadUrl?: string; outputFile?: string } } | null> {
    return QuickCompiler.quickRandomizeAndCompile(
      sourceVideos,
      duration,
      includePictures,
      onExport,
      onProgress
    );
  }

  static async generateClipsFromVideos(
    sourceVideos: File[],
    targetDuration: number,
    clipsPerVideo: number = 3,
    clipDuration: number = 5,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<VideoClip[]> {
    return ClipGenerator.generateClipsFromVideos(
      sourceVideos,
      targetDuration,
      clipsPerVideo,
      clipDuration,
      onProgress
    );
  }

  static async compileTimeline(
    timelineClips: VideoClip[],
    config: any,
    onExport?: (data: any) => void,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<{ downloadUrl?: string; outputFile?: string }> {
    return TimelineCompiler.compileTimeline(
      timelineClips,
      config,
      onExport,
      onProgress
    );
  }
}
