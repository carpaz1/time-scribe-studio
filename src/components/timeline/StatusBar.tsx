
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface StatusBarProps {
  isActive: boolean;
  current: number;
  total: number;
  message: string;
}

const StatusBar: React.FC<StatusBarProps> = ({
  isActive,
  current,
  total,
  message,
}) => {
  if (!isActive) return null;

  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm border-t border-slate-700/50 p-3">
      <div className="flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-slate-200">{message}</span>
            <span className="text-sm text-slate-300">{current}/{total}</span>
          </div>
          <Progress 
            value={percentage} 
            className="h-2 bg-slate-700"
          />
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
