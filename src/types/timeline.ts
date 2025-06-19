
export interface VideoClip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  thumbnail: string;
  sourceFile: File;
  position: number; // position on timeline in seconds
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
