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
    console.log('VideoCompilationService: Source videos count:', sourceVideos.length);
    console.log('VideoCompilationService: Target duration:', duration);
    console.log('VideoCompilationService: Source video details:', sourceVideos.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    if (sourceVideos.length === 0) {
      console.error('VideoCompilationService: No source videos available');
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

      console.log('VideoCompilationService: Using settings:', settings);

      // Generate clips from source videos with new logic
      const clips = await this.generateClipsFromVideos(
        sourceVideos, 
        settings.targetDuration,
        settings.clipsPerVideo,
        settings.clipDuration,
        onProgress
      );
      
      if (clips.length === 0) {
        console.error('VideoCompilationService: No clips generated');
        throw new Error('No clips could be generated from source videos');
      }

      console.log(`VideoCompilationService: Generated ${clips.length} clips successfully`);
      console.log('VideoCompilationService: Clip details:', clips.map(c => ({ 
        id: c.id, 
        name: c.name, 
        duration: c.duration, 
        position: c.position,
        startTime: c.startTime,
        sourceFileSize: c.sourceFile?.size 
      })));
      
      onProgress?.(30, `Generated ${clips.length} clips, starting compilation...`);

      // Compile the generated clips
      console.log('VideoCompilationService: Starting compilation...');
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
          console.log(`VideoCompilationService: Compilation progress ${adjustedProgress}% - ${stage}`);
          onProgress?.(adjustedProgress, stage);
        }
      );

      console.log('VideoCompilationService: Compilation result:', compilationResult);
      console.log('VideoCompilationService: Download URL length:', compilationResult.downloadUrl?.length || 0);
      console.log('VideoCompilationService: Output file:', compilationResult.outputFile);
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
    clipsPerVideo: number = 3,
    clipDuration: number = 5,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<VideoClip[]> {
    console.log('VideoCompilationService: Generating clips from videos...');
    console.log('VideoCompilationService: Source videos:', sourceVideos.map(f => f.name));
    console.log('VideoCompilationService: Target duration:', targetDuration);
    console.log('VideoCompilationService: Clips per video:', clipsPerVideo);
    console.log('VideoCompilationService: Clip duration:', clipDuration);
    
    if (sourceVideos.length === 0) {
      throw new Error('No source videos available');
    }

    const clips: VideoClip[] = [];
    const clipsNeeded = Math.ceil(targetDuration / clipDuration);
    
    console.log('VideoCompilationService: Clips needed for target duration:', clipsNeeded);
    onProgress?.(10, 'Creating video clips...');

    // Generate clips until we have enough to fill the target duration
    let clipsGenerated = 0;
    let videoIndex = 0;
    let clipsFromCurrentVideo = 0;

    while (clipsGenerated < clipsNeeded && videoIndex < sourceVideos.length) {
      const file = sourceVideos[videoIndex];
      console.log(`VideoCompilationService: Processing file ${videoIndex + 1}/${sourceVideos.length}: ${file.name}`);
      
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        const videoDuration = await new Promise<number>((resolve) => {
          video.onloadedmetadata = () => {
            console.log(`VideoCompilationService: Video ${file.name} duration: ${video.duration}`);
            resolve(video.duration || clipDuration);
          };
          video.onerror = (error) => {
            console.warn(`VideoCompilationService: Could not load metadata for ${file.name}:`, error);
            resolve(clipDuration);
          };
          video.src = URL.createObjectURL(file);
        });

        URL.revokeObjectURL(video.src);

        // Generate random clips from this video
        const maxStartTime = Math.max(0, videoDuration - clipDuration);
        const actualClipDuration = Math.min(clipDuration, videoDuration);
        
        for (let i = 0; i < clipsPerVideo && clipsGenerated < clipsNeeded; i++) {
          const startTime = Math.random() * maxStartTime;

          const clip: VideoClip = {
            id: `clip_${Date.now()}_${videoIndex}_${i}`,
            name: `${file.name.replace(/\.[^/.]+$/, "")} Clip ${i + 1}`,
            startTime,
            duration: actualClipDuration,
            thumbnail: '',
            sourceFile: file,
            position: clipsGenerated * clipDuration, // Sequential positioning
            originalVideoId: `video_${videoIndex}`
          };

          clips.push(clip);
          clipsGenerated++;
          clipsFromCurrentVideo++;
          
          console.log(`VideoCompilationService: Created clip ${clipsGenerated}:`, clip.name, `Duration: ${clip.duration}s, Position: ${clip.position}s`);
        }

        const progress = 10 + ((clipsGenerated / clipsNeeded) * 20);
        onProgress?.(progress, `Generated ${clipsGenerated}/${clipsNeeded} clips`);

      } catch (error) {
        console.error(`VideoCompilationService: Error generating clip from ${file.name}:`, error);
      }

      // Move to next video if we've generated enough clips from current video or reached the limit
      if (clipsFromCurrentVideo >= clipsPerVideo) {
        videoIndex++;
        clipsFromCurrentVideo = 0;
      }
    }

    // If we still need more clips and have gone through all videos, start over with different random positions
    while (clipsGenerated < clipsNeeded && sourceVideos.length > 0) {
      const randomVideo = sourceVideos[Math.floor(Math.random() * sourceVideos.length)];
      
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        const videoDuration = await new Promise<number>((resolve) => {
          video.onloadedmetadata = () => resolve(video.duration || clipDuration);
          video.onerror = () => resolve(clipDuration);
          video.src = URL.createObjectURL(randomVideo);
        });

        URL.revokeObjectURL(video.src);

        const maxStartTime = Math.max(0, videoDuration - clipDuration);
        const startTime = Math.random() * maxStartTime;
        const actualClipDuration = Math.min(clipDuration, videoDuration);

        const clip: VideoClip = {
          id: `clip_extra_${Date.now()}_${clipsGenerated}`,
          name: `${randomVideo.name.replace(/\.[^/.]+$/, "")} Extra Clip`,
          startTime,
          duration: actualClipDuration,
          thumbnail: '',
          sourceFile: randomVideo,
          position: clipsGenerated * clipDuration,
          originalVideoId: `video_extra_${clipsGenerated}`
        };

        clips.push(clip);
        clipsGenerated++;
        
        console.log(`VideoCompilationService: Created extra clip ${clipsGenerated}:`, clip.name);
        
        const progress = 10 + ((clipsGenerated / clipsNeeded) * 20);
        onProgress?.(progress, `Generated ${clipsGenerated}/${clipsNeeded} clips (filling duration)`);

      } catch (error) {
        console.error(`VideoCompilationService: Error generating extra clip:`, error);
        break; // Avoid infinite loop
      }
    }

    console.log(`VideoCompilationService: Generated ${clips.length} clips from ${sourceVideos.length} videos`);
    console.log(`VideoCompilationService: Total estimated duration: ${clips.length * clipDuration}s`);
    onProgress?.(30, `Generated ${clips.length} clips successfully!`);
    return clips;
  }

  static async compileTimeline(
    timelineClips: VideoClip[],
    config: any,
    onExport?: (data: any) => void,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<{ downloadUrl?: string; outputFile?: string }> {
    console.log('VideoCompilationService: Starting timeline compilation');
    console.log('VideoCompilationService: Timeline clips count:', timelineClips.length);
    console.log('VideoCompilationService: Config:', config);
    console.log('VideoCompilationService: Clips for compilation:', timelineClips.map(c => ({
      id: c.id,
      name: c.name,
      duration: c.duration,
      position: c.position,
      sourceFileSize: c.sourceFile?.size,
      sourceFileName: c.sourceFile?.name
    })));
    
    if (timelineClips.length === 0) {
      throw new Error('No clips to compile');
    }

    try {
      console.log('VideoCompilationService: Calling CompilationService.compileWithAI...');
      const result = await CompilationService.compileWithAI(
        timelineClips,
        config,
        onProgress
      );

      console.log('VideoCompilationService: Compilation service result:', result);
      console.log('VideoCompilationService: Result type:', typeof result);
      console.log('VideoCompilationService: Result keys:', Object.keys(result || {}));

      if (onExport) {
        console.log('VideoCompilationService: Calling onExport callback');
        onExport({ config, clips: timelineClips });
      }

      console.log('VideoCompilationService: Timeline compilation completed');
      return result;
    } catch (error) {
      console.error('VideoCompilationService: Timeline compilation failed:', error);
      console.error('VideoCompilationService: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }
}
