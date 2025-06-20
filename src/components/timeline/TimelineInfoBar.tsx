
import React from 'react';

interface TimelineInfoBarProps {
  timelineClipsLength: number;
  totalDuration: number;
  zoom: number;
  playheadPosition: number;
}

const TimelineInfoBar: React.FC<TimelineInfoBarProps> = ({
  timelineClipsLength,
  totalDuration,
  zoom,
  playheadPosition,
}) => {
  return (
    <div className="bg-slate-800/60 backdrop-blur-md border-b border-slate-700/50 px-6 py-4 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-lg px-4 py-2 border border-emerald-500/30">
            <span className="text-xs text-emerald-400 font-medium">Clips: </span> 
            <span className="text-white font-bold">{timelineClipsLength}</span>
          </div>
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg px-4 py-2 border border-blue-500/30">
            <span className="text-xs text-blue-400 font-medium">Duration: </span> 
            <span className="text-white font-bold">{totalDuration.toFixed(1)}s</span>
          </div>
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg px-4 py-2 border border-purple-500/30">
            <span className="text-xs text-purple-400 font-medium">Zoom: </span> 
            <span className="text-white font-bold">{zoom.toFixed(1)}x</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-slate-700/50 rounded-lg px-4 py-2 border border-slate-600/50">
            <span className="text-xs text-slate-300 font-medium">Playhead: </span> 
            <span className="text-white font-bold">{playheadPosition.toFixed(1)}s</span>
          </div>
          <div className="text-xs text-slate-400 bg-slate-700/30 px-3 py-2 rounded-lg border border-slate-600/30">
            ⇧ + Scroll to zoom timeline
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineInfoBar;
