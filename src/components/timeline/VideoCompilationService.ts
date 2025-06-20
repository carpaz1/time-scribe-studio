
import { VideoClip, CompileRequest } from '@/types/timeline';
import { VideoCompilerService } from '@/services/videoCompiler';
import { toast } from "@/hooks/use-toast";

export class VideoCompilationService {
  static async compileTimeline(
    clips: VideoClip[],
    config: any,
    onExport?: (data: CompileRequest) => void,
    onProgress?: (progress: number, stage: string) => void
  ) {
    if (clips.length === 0) {
      toast({
        title: "No clips to compile",
        description: "Add clips to the timeline first",
        variant: "destructive",
      });
      return;
    }

    try {
      const compilationConfig = { 
        totalDuration: config.totalDuration, 
        clipOrder: clips.map(c => c.id), 
        zoom: config.zoom, 
        playheadPosition: config.playheadPosition,
        preserveAudio: true,
        audioCodec: 'aac',
        videoCodec: 'h264',
        smartTransitions: true,
        autoColorCorrection: true,
      };

      const result = await VideoCompilerService.compileTimeline(
        clips,
        compilationConfig,
        onExport,
        onProgress
      );

      toast({
        title: "Enhanced Compilation Complete!",
        description: `Video compiled with smart optimization features.`,
      });

      return result;
    } catch (error) {
      console.error('Compilation failed:', error);
      toast({
        title: "Compilation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      throw error;
    }
  }

  static async quickRandomizeAndCompile(
    videos: File[],
    duration: number,
    includePictures: boolean = false,
    onExport?: (data: CompileRequest) => void,
    onProgress?: (progress: number, stage: string) => void
  ) {
    if (videos.length === 0) {
      toast({
        title: "No videos available",
        description: "Please upload some videos first",
        variant: "destructive",
      });
      return;
    }

    const mediaToProcess = includePictures 
      ? videos 
      : videos.filter(file => file.type.startsWith('video/'));

    if (mediaToProcess.length === 0) {
      toast({
        title: `No ${includePictures ? 'media files' : 'videos'} available`,
        description: `Please upload some ${includePictures ? 'media files' : 'videos'} first`,
        variant: "destructive",
      });
      return;
    }

    const targetClipCount = duration * 60;
    
    // Import ClipGenerationService dynamically to avoid circular imports
    const { ClipGenerationService } = await import('./ClipGenerationService');
    
    const newClips = await ClipGenerationService.generateClipsBatch(
      mediaToProcess, 
      targetClipCount, 
      1,
      onProgress
    );
    
    const compilationResult = await this.compileTimeline(
      newClips,
      { 
        totalDuration: newClips.length, 
        zoom: 1, 
        playheadPosition: 0 
      },
      onExport,
      onProgress
    );

    toast({
      title: `${duration}-minute video complete!`,
      description: `Generated and compiled ${newClips.length} clips with smart optimization.`,
    });

    return { clips: newClips, compilationResult };
  }
}
