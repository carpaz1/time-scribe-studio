
import React from 'react';
import { Video, Film } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface LibraryStatsProps {
  sourceVideosCount: number;
  clipsCount: number;
}

const LibraryStats: React.FC<LibraryStatsProps> = ({
  sourceVideosCount,
  clipsCount,
}) => {
  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      <Card className="bg-slate-700/30 border-slate-600/50">
        <CardContent className="p-3">
          <div className="flex items-center space-x-2">
            <Video className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-xs text-slate-400">Videos</p>
              <p className="text-sm font-semibold text-white">{sourceVideosCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-slate-700/30 border-slate-600/50">
        <CardContent className="p-3">
          <div className="flex items-center space-x-2">
            <Film className="w-4 h-4 text-green-400" />
            <div>
              <p className="text-xs text-slate-400">Clips</p>
              <p className="text-sm font-semibold text-white">{clipsCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LibraryStats;
