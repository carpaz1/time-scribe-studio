
import { VideoClip, TimelineConfig, CompileRequest } from '@/types/timeline';
import { CompilationService } from './compilationService';

export class VideoCompilerService {
  static async compileTimeline(
    timelineClips: VideoClip[],
    config: TimelineConfig,
    onExport?: (data: CompileRequest) => void,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<{ downloadUrl?: string; outputFile?: string }> {
    console.log('VideoCompilerService.compileTimeline started');
    
    if (timelineClips.length === 0) {
      throw new Error('No clips to compile');
    }

    // Use the new compilation service
    try {
      const result = await CompilationService.compileWithAI(
        timelineClips,
        config,
        onProgress
      );

      const compileData: CompileRequest = { config, clips: timelineClips };
      onExport?.(compileData);

      return result;
    } catch (error) {
      console.error('Compilation error:', error);
      throw error;
    }
  }

  static async cancelCurrentJob(): Promise<void> {
    CompilationService.cancelCompilation();
  }

  static exportTimelineJSON(
    timelineClips: VideoClip[],
    totalDuration: number,
    zoom: number,
    playheadPosition: number
  ): void {
    console.log('Exporting timeline JSON');
    const config: TimelineConfig = {
      totalDuration,
      clipOrder: timelineClips.map(clip => clip.id),
      zoom,
      playheadPosition,
    };
    
    const exportData: CompileRequest = { config, clips: timelineClips };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'timeline-config.json';
    link.click();
    URL.revokeObjectURL(url);
    console.log('Timeline JSON export complete');
  }
}
