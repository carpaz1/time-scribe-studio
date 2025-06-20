
export interface VideoClip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  thumbnail: string;
  sourceFile: File;
  position: number; // position on timeline in seconds
  originalVideoId?: string; // reference to source video
}

export interface SourceVideo {
  id: string;
  name: string;
  file: File;
  duration: number;
  thumbnail: string;
}

export interface ClipGenerationConfig {
  clipDuration: number; // duration of each clip in seconds
  totalDuration: number; // total duration to extract from video
  randomOrder: boolean; // whether to randomize clip order
}

export interface TimelineConfig {
  totalDuration: number;
  clipOrder: string[];
  zoom: number;
  playheadPosition: number;
}

export interface CompileRequest {
  config: TimelineConfig;
  clips: VideoClip[];
}

