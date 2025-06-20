import { VideoClip } from '@/types/timeline';

export class ClipGenerator {
  static async generateClipsFromVideos(
    sourceVideos: File[],
    targetDuration: number,
    clipsPerVideo: number = 3,
    clipDuration: number = 1, // Changed to 1 second for accurate calculation
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

    const clips: VideoClip[] = [];
    
    onProgress?.(10, 'Creating video clips...');

    // Generate clips by cycling through videos until we have enough
    let clipsGenerated = 0;
    let videoIndex = 0;
    let attempts = 0;
    const maxAttempts = totalClipsNeeded * 2; // Safety limit

    while (clipsGenerated < totalClipsNeeded && attempts < maxAttempts) {
      const file = sourceVideos[videoIndex % sourceVideos.length];
      console.log(`ClipGenerator: Processing file ${videoIndex % sourceVideos.length + 1}/${sourceVideos.length}: ${file.name} (clip ${clipsGenerated + 1}/${totalClipsNeeded})`);
      
      try {
        const videoDuration = await this.getVideoDuration(file);
        const maxStartTime = Math.max(0, videoDuration - clipDuration);
        const actualClipDuration = Math.min(clipDuration, videoDuration);
        
        // Generate a random start time for this clip
        const startTime = Math.random() * maxStartTime;

        const clip: VideoClip = {
          id: `clip_${Date.now()}_${clipsGenerated}_${Math.random().toString(36).substr(2, 9)}`,
          name: `${file.name.replace(/\.[^/.]+$/, "")} Clip ${clipsGenerated + 1}`,
          startTime,
          duration: actualClipDuration,
          thumbnail: '',
          sourceFile: file,
          position: clipsGenerated * clipDuration, // Sequential positioning
          originalVideoId: `video_${videoIndex % sourceVideos.length}`
        };

        clips.push(clip);
        clipsGenerated++;
        
        console.log(`ClipGenerator: Created clip ${clipsGenerated}/${totalClipsNeeded}:`, clip.name, `Duration: ${clip.duration}s, Position: ${clip.position}s`);

        const progress = 10 + ((clipsGenerated / totalClipsNeeded) * 20);
        onProgress?.(progress, `Generated ${clipsGenerated}/${totalClipsNeeded} clips (${Math.round(clipsGenerated * clipDuration)}s/${targetDuration}s)`);

      } catch (error) {
        console.error(`ClipGenerator: Error generating clip from ${file.name}:`, error);
        // Create a fallback clip to maintain count accuracy
        const fallbackClip: VideoClip = {
          id: `fallback_clip_${Date.now()}_${clipsGenerated}_${Math.random().toString(36).substr(2, 9)}`,
          name: `${file.name.replace(/\.[^/.]+$/, "")} Clip ${clipsGenerated + 1}`,
          startTime: 0,
          duration: clipDuration,
          thumbnail: '',
          sourceFile: file,
          position: clipsGenerated * clipDuration,
          originalVideoId: `video_${videoIndex % sourceVideos.length}`
        };
        clips.push(fallbackClip);
        clipsGenerated++;
      }

      videoIndex++;
      attempts++;
    }

    const totalGeneratedDuration = clips.length * clipDuration;
    console.log(`ClipGenerator: Successfully generated ${clips.length} clips from ${sourceVideos.length} videos`);
    console.log(`ClipGenerator: Total duration: ${totalGeneratedDuration}s (target was ${targetDuration}s)`);
    
    onProgress?.(30, `Generated ${clips.length} clips! Total duration: ${totalGeneratedDuration}s`);
    return clips;
  }

  private static async getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout loading ${file.name}`));
      }, 10000);
      
      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        console.log(`ClipGenerator: Video ${file.name} duration: ${video.duration}`);
        resolve(video.duration || 5);
        URL.revokeObjectURL(video.src);
      };
      
      video.onerror = (error) => {
        clearTimeout(timeout);
        console.warn(`ClipGenerator: Could not load metadata for ${file.name}:`, error);
        resolve(5); // Default fallback duration
        if (video.src) {
          URL.revokeObjectURL(video.src);
        }
      };
      
      try {
        video.src = URL.createObjectURL(file);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }
}
