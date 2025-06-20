
import { VideoClip } from '@/types/timeline';
import { CompilationService } from '@/services/compilationService';

export class TimelineCompiler {
  static async compileTimeline(
    timelineClips: VideoClip[],
    config: any,
    onExport?: (data: any) => void,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<{ downloadUrl?: string; outputFile?: string }> {
    console.log('TimelineCompiler: Starting timeline compilation');
    console.log('TimelineCompiler: Timeline clips count:', timelineClips.length);
    console.log('TimelineCompiler: Config:', config);
    
    if (timelineClips.length === 0) {
      throw new Error('No clips to compile');
    }

    try {
      console.log('TimelineCompiler: Calling CompilationService.compileWithAI...');
      const result = await CompilationService.compileWithAI(
        timelineClips,
        config,
        onProgress
      );

      console.log('TimelineCompiler: Compilation service result:', result);

      if (onExport) {
        console.log('TimelineCompiler: Calling onExport callback');
        onExport({ config, clips: timelineClips });
      }

      console.log('TimelineCompiler: Timeline compilation completed');
      return result;
    } catch (error) {
      console.error('TimelineCompiler: Timeline compilation failed:', error);
      throw error;
    }
  }
}
