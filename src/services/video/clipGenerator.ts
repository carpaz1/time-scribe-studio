
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
    console.log('ClipGenerator: Target duration:', targetDuration, 'Clip duration:', clipDuration);
    
    if (sourceVideos.length === 0) {
      throw new Error('No source videos available');
    }

    // Calculate exactly how many clips we need to reach target duration
    const totalClipsNeeded = Math.ceil(targetDuration / clipDuration);
    console.log('ClipGenerator: Total clips needed for target duration:', totalClipsNeeded);
    
    // Calculate clips per video to reach the target
    const actualClipsPerVideo = Math.ceil(totalClipsNeeded / sourceVideos.length);
    console.log('ClipGenerator: Clips per video calculated:', actualClipsPerVideo);

    const clips: VideoClip[] = [];
    
    onProgress?.(10, 'Creating video clips...');

    // Generate clips by cycling through videos until we have enough
    let clipsGenerated = 0;
    let videoIndex = 0;

    while (clipsGenerated < totalClipsNeeded) {
      const file = sourceVideos[videoIndex % sourceVideos.length]; // Cycle through videos
      console.log(`ClipGenerator: Processing file ${videoIndex % sourceVideos.length + 1}/${sourceVideos.length}: ${file.name} (clip ${clipsGenerated + 1}/${totalClipsNeeded})`);
      
      try {
        const videoDuration = await this.getVideoDuration(file);
        const maxStartTime = Math.max(0, videoDuration - clipDuration);
        const actualClipDuration = Math.min(clipDuration, videoDuration);
        
        // Generate a random start time for this clip
        const startTime = Math.random() * maxStartTime;

        const clip: VideoClip = {
          id: `clip_${Date.now()}_${clipsGenerated}_${Math.random()}`,
          name: `${file.name.replace(/\.[^/.]+$/, "")} Clip ${Math.floor(clipsGenerated / sourceVideos.length) + 1}`,
          startTime,
          duration: actualClipDuration,
          thumbnail: '',
          sourceFile: file,
          position: clipsGenerated * clipDuration,
          originalVideoId: `video_${videoIndex % sourceVideos.length}`
        };

        clips.push(clip);
        clipsGenerated++;
        
        console.log(`ClipGenerator: Created clip ${clipsGenerated}/${totalClipsNeeded}:`, clip.name, `Duration: ${clip.duration}s, Position: ${clip.position}s`);

        const progress = 10 + ((clipsGenerated / totalClipsNeeded) * 20);
        onProgress?.(progress, `Generated ${clipsGenerated}/${totalClipsNeeded} clips (${Math.round(clipsGenerated * clipDuration)}s/${targetDuration}s)`);

      } catch (error) {
        console.error(`ClipGenerator: Error generating clip from ${file.name}:`, error);
        // If we can't generate from this video, skip to the next one
      }

      videoIndex++;
      
      // Safety check to prevent infinite loop
      if (videoIndex > totalClipsNeeded * sourceVideos.length) {
        console.warn('ClipGenerator: Safety break - too many attempts');
        break;
      }
    }

    const totalGeneratedDuration = clips.length * clipDuration;
    console.log(`ClipGenerator: Successfully generated ${clips.length} clips from ${sourceVideos.length} videos`);
    console.log(`ClipGenerator: Total duration: ${totalGeneratedDuration}s (target was ${targetDuration}s)`);
    
    onProgress?.(30, `Generated ${clips.length} clips! Total duration: ${totalGeneratedDuration}s`);
    return clips;
  }

  private static async getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        console.log(`ClipGenerator: Video ${file.name} duration: ${video.duration}`);
        resolve(video.duration || 5);
        URL.revokeObjectURL(video.src);
      };
      
      video.onerror = (error) => {
        console.warn(`ClipGenerator: Could not load metadata for ${file.name}:`, error);
        resolve(5);
        if (video.src) {
          URL.revokeObjectURL(video.src);
        }
      };
      
      video.src = URL.createObjectURL(file);
    });
  }
}
