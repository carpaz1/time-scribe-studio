
import React from 'react';
import { Button } from '@/components/ui/button';
import { VideoClip } from '@/types/timeline';

interface ClipsLibraryProps {
  clips: VideoClip[];
  onAddToTimeline: (clip: VideoClip) => void;
  onClearTimeline: () => void;
}

const ClipsLibrary: React.FC<ClipsLibraryProps> = ({
  clips,
  onAddToTimeline,
  onClearTimeline,
}) => {
  if (clips.length === 0) return null;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-200">
          Smart Clips ({clips.length})
        </h3>
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-6"
          onClick={onClearTimeline}
        >
          Clear
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
        {clips.slice(0, 12).map((clip) => (
          <div
            key={clip.id}
            className="bg-slate-700/50 rounded p-2 text-xs text-slate-300 hover:bg-slate-600/50 cursor-pointer transition-colors"
            onClick={() => onAddToTimeline(clip)}
          >
            <div className="truncate mb-1">{clip.name}</div>
            <div className="text-slate-400">{clip.duration}s</div>
          </div>
        ))}
      </div>
      {clips.length > 12 && (
        <div className="text-xs text-slate-400 mt-2 text-center">
          +{clips.length - 12} more clips
        </div>
      )}
    </div>
  );
};

export default ClipsLibrary;
