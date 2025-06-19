
import React from 'react';

interface TimelineRulerProps {
  totalDuration: number;
  zoom: number;
  playheadPosition: number;
}

const TimelineRuler: React.FC<TimelineRulerProps> = ({
  totalDuration,
  zoom,
  playheadPosition,
}) => {
  const tickInterval = Math.max(1, Math.floor(10 / zoom));
  const ticks = [];
  
  for (let i = 0; i <= totalDuration; i += tickInterval) {
    const leftPercentage = (i / totalDuration) * 100 * zoom;
    if (leftPercentage <= 100) {
      ticks.push(
        <div
          key={i}
          className="absolute top-0 bottom-0 border-l border-gray-600"
          style={{ left: `${leftPercentage}%` }}
        >
          <div className="absolute -top-5 -translate-x-1/2 text-xs text-gray-400 font-mono">
            {i}s
          </div>
        </div>
      );
    }
  }

  return (
    <div className="relative h-8 bg-gray-700 border-b border-gray-600 overflow-hidden">
      {ticks}
      
      {/* Current Time Display */}
      <div className="absolute top-1 right-2 text-xs text-gray-300 font-mono bg-gray-800 px-2 py-0.5 rounded">
        {playheadPosition.toFixed(1)}s / {totalDuration.toFixed(1)}s
      </div>
    </div>
  );
};

export default TimelineRuler;
