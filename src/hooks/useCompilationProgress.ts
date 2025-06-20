import { useState, useCallback, useRef } from 'react';

interface CompilationProgress {
  isActive: boolean;
  percent: number;
  stage: string;
  jobId?: string;
}

export const useCompilationProgress = () => {
  const [progress, setProgress] = useState<CompilationProgress>({
    isActive: false,
    percent: 0,
    stage: '',
    jobId: undefined,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCompilation = useCallback((jobId: string) => {
    setProgress({
      isActive: true,
      percent: 0,
      stage: 'Starting compilation...',
      jobId,
    });

    // Poll for progress updates
    intervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:4000/progress/${jobId}`);
        const data = await response.json();
        
        setProgress(prev => ({
          ...prev,
          percent: data.percent || 0,
          stage: data.stage || 'Processing...',
        }));

        // Stop polling when complete
        if (data.percent >= 100) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          // Keep showing complete state briefly
          setTimeout(() => {
            setProgress(prev => ({ ...prev, isActive: false }));
          }, 2000);
        }
      } catch (error) {
        console.error('Error fetching compilation progress:', error);
      }
    }, 1000);
  }, []);

  const stopCompilation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setProgress({
      isActive: false,
      percent: 0,
      stage: '',
      jobId: undefined,
    });
  }, []);

  return {
    progress,
    startCompilation,
    stopCompilation,
  };
};
