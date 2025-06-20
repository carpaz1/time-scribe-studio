import { VideoClip } from '@/types/timeline';
import { CompilationService } from '@/services/compilationService';

export class VideoCompilationService {
  static async quickRandomizeAndCompile(
    sourceVideos: File[],
    duration: number,
    includePictures: boolean = false,
    onExport?: (data: any) => void,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<{ clips: VideoClip[]; compilationResult: { downloadUrl?: string; outputFile?: string } } | null> {
    console.log('VideoCompilationService: Starting quick randomize and compile');
    
    if (sourceVideos.length === 0) {
      throw new Error('No source videos available');
    }

    try {
      onProgress?.(5, 'Analyzing source videos...');

      // Generate clips from source videos
      const clips = await this.generateClipsFromVideos(sourceVideos, duration, onProgress);
      
      if (clips.length === 0) {
        throw new Error('No clips could be generated from source videos');
      }

      onProgress?.(30, `Generated ${clips.length} clips, starting compilation...`);

      // Compile the generated clips
      const compilationResult = await this.compileTimeline(
        clips,
        {
          totalDuration: duration,
          zoom: 1,
          playheadPosition: 0,
          clipOrder: clips.map(c => c.id)
        },
        onExport,
        (progress, stage) => {
          // Map compilation progress to 30-100 range
          const adjustedProgress = 30 + (progress * 0.7);
          onProgress?.(adjustedProgress, stage);
        }
      );

      console.log('VideoCompilationService: Quick randomize completed successfully');
      return { clips, compilationResult };

    } catch (error) {
      console.error('VideoCompilationService: Quick randomize failed:', error);
      throw error;
    }
  }

  static async generateClipsFromVideos(
    sourceVideos: File[],
    targetDuration: number,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<{ clips: VideoClip[] }> {
    console.log('VideoCompilationService: Generating clips from videos...');
    
    if (sourceVideos.length === 0) {
      throw new Error('No source videos available');
    }

    const clips: VideoClip[] = [];
    const clipDuration = Math.min(5, targetDuration / Math.max(sourceVideos.length, 1));
    
    onProgress?.(10, 'Creating video clips...');

    for (let i = 0; i < sourceVideos.length; i++) {
      const file = sourceVideos[i];
      
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        const duration = await new Promise<number>((resolve) => {
          video.onloadedmetadata = () => {
            resolve(video.duration || clipDuration);
          };
          video.onerror = () => {
            console.warn(`Could not load metadata for ${file.name}, using default duration`);
            resolve(clipDuration);
          };
          video.src = URL.createObjectURL(file);
        });

        URL.revokeObjectURL(video.src);

        const maxStartTime = Math.max(0, duration - clipDuration);
        const startTime = Math.random() * maxStartTime;

        const clip: VideoClip = {
          id: `clip_${Date.now()}_${i}`,
          name: `${file.name.replace(/\.[^/.]+$/, "")} Clip ${i + 1}`,
          startTime,
          duration: Math.min(clipDuration, duration - startTime),
          thumbnail: '',
          sourceFile: file,
          position: i * clipDuration,
          originalVideoId: `video_${i}`
        };

        clips.push(clip);
        
        const progress = 10 + ((i + 1) / sourceVideos.length) * 90;
        onProgress?.(progress, `Generated clip ${i + 1}/${sourceVideos.length}`);

      } catch (error) {
        console.error(`Error generating clip from ${file.name}:`, error);
      }
    }

    onProgress?.(100, `Generated ${clips.length} clips successfully!`);
    console.log(`VideoCompilationService: Generated ${clips.length} clips from ${sourceVideos.length} videos`);
    return { clips };
  }

  static async compileTimeline(
    timelineClips: VideoClip[],
    config: any,
    onExport?: (data: any) => void,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<{ downloadUrl?: string; outputFile?: string }> {
    console.log('VideoCompilationService: Starting timeline compilation');
    
    if (timelineClips.length === 0) {
      throw new Error('No clips to compile');
    }

    try {
      const result = await CompilationService.compileWithAI(
        timelineClips,
        config,
        onProgress
      );

      if (onExport) {
        onExport({ config, clips: timelineClips });
      }

      console.log('VideoCompilationService: Timeline compilation completed');
      return result;
    } catch (error) {
      console.error('VideoCompilationService: Timeline compilation failed:', error);
      throw error;
    }
  }
}
