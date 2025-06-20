
import { useState, useCallback } from 'react';

interface ProgressState {
  current: number;
  total: number;
  message: string;
  isActive: boolean;
}

export const useProgressTracker = () => {
  const [progress, setProgress] = useState<ProgressState>({
    current: 0,
    total: 0,
    message: '',
    isActive: false,
  });

  const startProgress = useCallback((total: number, message: string) => {
    setProgress({
      current: 0,
      total,
      message,
      isActive: true,
    });
  }, []);

  const updateProgress = useCallback((current: number, message?: string) => {
    setProgress(prev => ({
      ...prev,
      current,
      message: message || prev.message,
    }));
  }, []);

  const completeProgress = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      isActive: false,
    }));
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({
      current: 0,
      total: 0,
      message: '',
      isActive: false,
    });
  }, []);

  return {
    progress,
    startProgress,
    updateProgress,
    completeProgress,
    resetProgress,
  };
};
