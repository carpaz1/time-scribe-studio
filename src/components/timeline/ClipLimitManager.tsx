
import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { VideoClip } from '@/types/timeline';

interface ClipLimitManagerProps {
  clips: VideoClip[];
  timelineClips: VideoClip[];
  onClearOldest: () => void;
  onClearUnused: () => void;
}

const ClipLimitManager: React.FC<ClipLimitManagerProps> = ({
  clips,
  timelineClips,
  onClearOldest,
  onClearUnused,
}) => {
  const totalClips = clips.length;
  const timelineClipIds = new Set(timelineClips.map(clip => clip.id));
  const unusedClips = clips.filter(clip => !timelineClipIds.has(clip.id));
  
  const getWarningLevel = () => {
    if (totalClips > 500) return 'critical';
    if (totalClips > 300) return 'high';
    if (totalClips > 150) return 'medium';
    return 'low';
  };

  const warningLevel = getWarningLevel();
  
  if (warningLevel === 'low') return null;

  const getWarningConfig = () => {
    switch (warningLevel) {
      case 'critical':
        return {
          color: 'border-red-500 bg-red-500/10',
          textColor: 'text-red-400',
          message: 'Critical: Too many clips may cause browser crashes'
        };
      case 'high':
        return {
          color: 'border-orange-500 bg-orange-500/10',
          textColor: 'text-orange-400',
          message: 'High: Performance may be significantly impacted'
        };
      default:
        return {
          color: 'border-yellow-500 bg-yellow-500/10',
          textColor: 'text-yellow-400',
          message: 'Medium: Consider cleaning up clips'
        };
    }
  };

  const config = getWarningConfig();

  return (
    <Card className={`${config.color} border mb-4`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${config.textColor}`} />
            <div>
              <p className={`font-medium ${config.textColor}`}>
                Clip Limit Warning ({totalClips} clips)
              </p>
              <p className="text-sm text-slate-300">{config.message}</p>
              <p className="text-xs text-slate-400 mt-1">
                {unusedClips.length} unused clips • {timelineClips.length} in timeline
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 flex-shrink-0">
            {unusedClips.length > 0 && (
              <Button
                onClick={onClearUnused}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-600"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear Unused ({unusedClips.length})
              </Button>
            )}
            
            <Button
              onClick={onClearOldest}
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-600"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear Oldest
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClipLimitManager;
