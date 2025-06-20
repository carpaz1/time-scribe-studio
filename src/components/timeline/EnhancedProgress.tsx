
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface EnhancedProgressProps {
  value: number;
  stage?: string;
  className?: string;
  showLoader?: boolean;
}

const EnhancedProgress: React.FC<EnhancedProgressProps> = ({
  value,
  stage,
  className = '',
  showLoader = false,
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showLoader && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
          <span className="text-sm font-medium text-slate-200">
            {Math.round(value)}%
          </span>
        </div>
        {stage && (
          <span className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-full">
            {stage}
          </span>
        )}
      </div>
      <Progress 
        value={value} 
        className="h-3 bg-slate-800/50 border border-indigo-600/30 rounded-full overflow-hidden"
      />
    </div>
  );
};

export default EnhancedProgress;
