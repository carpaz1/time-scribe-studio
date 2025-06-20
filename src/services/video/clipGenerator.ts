
import { VideoClip } from '@/types/timeline';

export class ClipGenerator {
  static async generateClipsFromVideos(
    sourceVideos: File[],
    targetDuration: number,
    clipsPerVideo: number = 3,
    clipDuration: number = 5,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<VideoClip[]> {
    console.log('ClipGenerator: Generating clips from videos...');
    console.log('ClipGenerator: Source videos:', sourceVideos.map(f => f.name));
    console.log('ClipGenerator: Target duration:', targetDuration);
    console.log('ClipGenerator: Clips per video:', clipsPerVideo);
    console.log('ClipGenerator: Clip duration:', clipDuration);
    
    if (sourceVideos.length === 0) {
      throw new Error('No source videos available');
    }

    const clips: VideoClip[] = [];
    const clipsNeeded = Math.ceil(targetDuration / clipDuration);
    
    console.log('ClipGenerator: Clips needed for target duration:', clipsNeeded);
    onProgress?.(10, 'Creating video clips...');

    // Generate clips until we have enough to fill the target duration
    let clipsGenerated = 0;
    let videoIndex = 0;
    let clipsFromCurrentVideo = 0;

    while (clipsGenerated < clipsNeeded && videoIndex < sourceVideos.length) {
      const file = sourceVideos[videoIndex];
      console.log(`ClipGenerator: Processing file ${videoIndex + 1}/${sourceVideos.length}: ${file.name}`);
      
      try {
        const videoDuration = await this.getVideoDuration(file);
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
            position: clipsGenerated * clipDuration,
            originalVideoId: `video_${videoIndex}`
          };

          clips.push(clip);
          clipsGenerated++;
          clipsFromCurrentVideo++;
          
          console.log(`ClipGenerator: Created clip ${clipsGenerated}:`, clip.name, `Duration: ${clip.duration}s, Position: ${clip.position}s`);
        }

        const progress = 10 + ((clipsGenerated / clipsNeeded) * 20);
        onProgress?.(progress, `Generated ${clipsGenerated}/${clipsNeeded} clips`);

      } catch (error) {
        console.error(`ClipGenerator: Error generating clip from ${file.name}:`, error);
      }

      if (clipsFromCurrentVideo >= clipsPerVideo) {
        videoIndex++;
        clipsFromCurrentVideo = 0;
      }
    }

    // If we still need more clips, generate extras with random positions
    while (clipsGenerated < clipsNeeded && sourceVideos.length > 0) {
      const randomVideo = sourceVideos[Math.floor(Math.random() * sourceVideos.length)];
      
      try {
        const videoDuration = await this.getVideoDuration(randomVideo);
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
        
        console.log(`ClipGenerator: Created extra clip ${clipsGenerated}:`, clip.name);
        
        const progress = 10 + ((clipsGenerated / clipsNeeded) * 20);
        onProgress?.(progress, `Generated ${clipsGenerated}/${clipsNeeded} clips (filling duration)`);

      } catch (error) {
        console.error(`ClipGenerator: Error generating extra clip:`, error);
        break;
      }
    }

    console.log(`ClipGenerator: Generated ${clips.length} clips from ${sourceVideos.length} videos`);
    onProgress?.(30, `Generated ${clips.length} clips successfully!`);
    return clips;
  }

  private static async getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        console.log(`ClipGenerator: Video ${file.name} duration: ${video.duration}`);
        resolve(video.duration || 5);
      };
      
      video.onerror = (error) => {
        console.warn(`ClipGenerator: Could not load metadata for ${file.name}:`, error);
        resolve(5);
      };
      
      video.src = URL.createObjectURL(file);
    });
  }
}
