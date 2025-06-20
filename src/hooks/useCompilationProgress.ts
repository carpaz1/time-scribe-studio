
import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CompilationProgress {
  isActive: boolean;
  percent: number;
  stage: string;
  jobId?: string;
  error?: string;
}

export const useCompilationProgress = () => {
  const [progress, setProgress] = useState<CompilationProgress>({
    isActive: false,
    percent: 0,
    stage: '',
    jobId: undefined,
    error: undefined,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startCompilation = useCallback((jobId: string) => {
    console.log('Starting compilation progress tracking for job:', jobId);
    
    setProgress({
      isActive: true,
      percent: 0,
      stage: 'Starting compilation...',
      jobId,
      error: undefined,
    });

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Poll for progress updates with enhanced error handling
    intervalRef.current = setInterval(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(`http://localhost:4000/progress/${jobId}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Progress fetch failed: ${response.status}`);
        }

        const data = await response.json();
        
        setProgress(prev => ({
          ...prev,
          percent: Math.min(data.percent || 0, 100),
          stage: data.stage || 'Processing...',
          error: data.error,
        }));

        // Handle errors from server
        if (data.error) {
          console.error('Server reported error:', data.error);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          toast({
            title: "Compilation Error",
            description: data.error,
            variant: "destructive",
          });

          setProgress(prev => ({ ...prev, isActive: false }));
          return;
        }

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

          toast({
            title: "Compilation Complete",
            description: "Your video has been compiled successfully",
          });
        }
      } catch (error) {
        console.error('Error fetching compilation progress:', error);
        
        // Handle network errors gracefully - don't stop immediately
        if (error.name === 'AbortError') {
          setProgress(prev => ({
            ...prev,
            stage: 'Connection timeout... retrying',
            error: 'Network timeout',
          }));
        } else {
          setProgress(prev => ({
            ...prev,
            stage: 'Connection issues... retrying',
            error: error.message,
          }));
        }
      }
    }, 2000); // Increased interval to 2 seconds to reduce load

    // Failsafe timeout after 10 minutes
    setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        
        setProgress(prev => ({ 
          ...prev, 
          isActive: false,
          error: 'Compilation timeout - process may still be running'
        }));

        toast({
          title: "Compilation Timeout",
          description: "The compilation is taking longer than expected",
          variant: "destructive",
        });
      }
    }, 600000);
  }, [toast]);

  const stopCompilation = useCallback(() => {
    console.log('Stopping compilation progress tracking');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setProgress({
      isActive: false,
      percent: 0,
      stage: '',
      jobId: undefined,
      error: undefined,
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({
      isActive: false,
      percent: 0,
      stage: '',
      jobId: undefined,
      error: undefined,
    });
  }, []);

  return {
    progress,
    startCompilation,
    stopCompilation,
    resetProgress,
  };
};
