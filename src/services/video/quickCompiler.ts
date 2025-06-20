
import { VideoClip } from '@/types/timeline';
import { ClipGenerator } from './clipGenerator';
import { TimelineCompiler } from './timelineCompiler';

export class QuickCompiler {
  static async quickRandomizeAndCompile(
    sourceVideos: File[],
    duration: number,
    includePictures: boolean = false,
    onExport?: (data: any) => void,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<{ clips: VideoClip[]; compilationResult: { downloadUrl?: string; outputFile?: string } } | null> {
    console.log('QuickCompiler: Starting quick randomize and compile');
    console.log('QuickCompiler: Source videos count:', sourceVideos.length);
    console.log('QuickCompiler: Target duration:', duration);
    
    if (sourceVideos.length === 0) {
      console.error('QuickCompiler: No source videos available');
      throw new Error('No source videos available');
    }

    try {
      onProgress?.(5, 'Analyzing source videos...');

      // Get clip generation settings from global window object
      const settings = (window as any).clipGenerationSettings || {
        clipsPerVideo: 3,
        clipDuration: 5,
        targetDuration: duration
      };

      console.log('QuickCompiler: Using settings:', settings);

      // Generate clips from source videos
      const clips = await ClipGenerator.generateClipsFromVideos(
        sourceVideos, 
        settings.targetDuration,
        settings.clipsPerVideo,
        settings.clipDuration,
        onProgress
      );
      
      if (clips.length === 0) {
        console.error('QuickCompiler: No clips generated');
        throw new Error('No clips could be generated from source videos');
      }

      console.log(`QuickCompiler: Generated ${clips.length} clips successfully`);
      onProgress?.(30, `Generated ${clips.length} clips, starting compilation...`);

      // Compile the generated clips
      const compilationResult = await TimelineCompiler.compileTimeline(
        clips,
        {
          totalDuration: duration,
          zoom: 1,
          playheadPosition: 0,
          clipOrder: clips.map(c => c.id)
        },
        onExport,
        (progress, stage) => {
          const adjustedProgress = 30 + (progress * 0.7);
          console.log(`QuickCompiler: Compilation progress ${adjustedProgress}% - ${stage}`);
          onProgress?.(adjustedProgress, stage);
        }
      );

      console.log('QuickCompiler: Quick randomize completed successfully');
      return { clips, compilationResult };

    } catch (error) {
      console.error('QuickCompiler: Quick randomize failed:', error);
      throw error;
    }
  }
}
