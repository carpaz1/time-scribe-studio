
import React from 'react';
import { CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  message,
  className = '',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          icon: Clock,
          color: 'text-indigo-400',
          bgColor: 'bg-indigo-500/10',
          borderColor: 'border-indigo-500/30',
        };
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
        };
      default:
        return {
          icon: Zap,
          color: 'text-slate-400',
          bgColor: 'bg-slate-500/10',
          borderColor: 'border-slate-500/30',
        };
    }
  };

  const { icon: Icon, color, bgColor, borderColor } = getStatusConfig();

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${bgColor} ${borderColor} ${className}`}>
      <Icon className={`w-4 h-4 ${color}`} />
      {message && (
        <span className={`text-sm font-medium ${color}`}>
          {message}
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;
