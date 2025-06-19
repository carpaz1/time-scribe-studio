
import { VideoClip, TimelineConfig, CompileRequest } from '@/types/timeline';

export class VideoCompilerService {
  static async compileTimeline(
    timelineClips: VideoClip[],
    config: TimelineConfig,
    onExport?: (data: CompileRequest) => void,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<{ downloadUrl?: string; outputFile?: string }> {
    console.log('=== COMPILATION DEBUG START ===');
    console.log('VideoCompilerService.compileTimeline started');
    console.log('Timeline clips:', timelineClips.length);
    console.log('Server URL being used: http://localhost:4000/upload');
    
    if (timelineClips.length === 0) {
      console.error('No clips to compile');
      throw new Error('No clips to compile');
    }

    // Test server connectivity first with detailed logging
    console.log('Testing server connectivity...');
    try {
      console.log('Making health check request to: http://localhost:4000/health');
      const healthResponse = await fetch('http://localhost:4000/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Health check response received:', {
        status: healthResponse.status,
        statusText: healthResponse.statusText,
        ok: healthResponse.ok
      });
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('Server health check passed:', healthData);
      } else {
        console.error('Server health check failed:', healthResponse.status);
        throw new Error('Backend server is not responding. Please make sure start.bat is running.');
      }
    } catch (connectError) {
      console.error('Cannot connect to server - detailed error:', connectError);
      console.error('Error name:', connectError.name);
      console.error('Error message:', connectError.message);
      throw new Error('Cannot connect to backend server. Please make sure start.bat is running and the server is on port 4000.');
    }

    // Initialize progress callback immediately
    if (onProgress) {
      console.log('Calling initial progress callback');
      onProgress(0, 'Initializing...');
    }

    const formData = new FormData();
    
    // Group clips by their source file to avoid duplicates
    const uniqueFiles = new Map();
    timelineClips.forEach((clip) => {
      const fileKey = clip.sourceFile.name + clip.sourceFile.size;
      if (!uniqueFiles.has(fileKey)) {
        uniqueFiles.set(fileKey, {
          file: clip.sourceFile,
          clips: []
        });
      }
      uniqueFiles.get(fileKey).clips.push(clip);
    });

    console.log('Unique files found:', uniqueFiles.size);

    // Add unique video files
    const fileArray = Array.from(uniqueFiles.values());
    fileArray.forEach((fileData, index) => {
      console.log(`Adding file ${index + 1}:`, fileData.file.name, 'Size:', fileData.file.size);
      formData.append('videos', fileData.file);
    });

    // Create clips data with file references
    const clipsData: any[] = [];
    timelineClips.forEach((clip) => {
      const fileKey = clip.sourceFile.name + clip.sourceFile.size;
      const fileIndex = fileArray.findIndex(f => f.file.name === clip.sourceFile.name && f.file.size === clip.sourceFile.size);
      
      clipsData.push({
        id: clip.id,
        name: clip.name,
        startTime: clip.startTime,
        duration: clip.duration,
        position: clip.position,
        fileIndex: fileIndex
      });
    });
    
    console.log('Clips data prepared:', clipsData);
    formData.append('clipsData', JSON.stringify(clipsData));

    console.log('Sending compilation request with', timelineClips.length, 'clips and', fileArray.length, 'unique files');

    // Update progress before making request
    if (onProgress) {
      onProgress(2, 'Connecting to server...');
    }

    try {
      console.log('Making fetch request to server...');
      console.log('Request URL: http://localhost:4000/upload');
      console.log('Request method: POST');
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`- ${key}: File "${value.name}" (${value.size} bytes)`);
        } else {
          console.log(`- ${key}:`, value);
        }
      }

      console.log('About to send fetch request...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('Request timeout after 30 seconds');
        controller.abort();
      }, 30000);

      const response = await fetch('http://localhost:4000/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('Fetch request completed!');
      console.log('Response received from server:');
      console.log('- Status:', response.status);
      console.log('- Status Text:', response.statusText);
      console.log('- OK:', response.ok);
      console.log('- Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        
        if (response.status === 0 || !response.status) {
          throw new Error('Cannot connect to local server. Make sure the backend is running on port 4000.');
        }
        
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      console.log('Parsing response JSON...');
      const result = await response.json();
      console.log('Server response parsed successfully:', result);
      
      // Check if server is processing (no jobId means immediate response)
      if (result.jobId && onProgress) {
        console.log('Starting progress polling for job:', result.jobId);
        onProgress(5, 'Server processing started...');
        
        // Poll for progress with improved error handling
        try {
          await this.pollProgress(result.jobId, onProgress);
        } catch (pollError) {
          console.error('Progress polling failed:', pollError);
          // Don't fail the entire compilation if polling fails
          onProgress(95, 'Finalizing...');
        }
      } else if (result.success) {
        // Immediate success response
        console.log('Immediate compilation success');
        if (onProgress) {
          onProgress(100, 'Complete!');
        }
      }
      
      console.log('Final compilation result:', result);
      console.log('=== COMPILATION DEBUG END ===');

      const compileData: CompileRequest = { config, clips: timelineClips };
      onExport?.(compileData);

      return {
        downloadUrl: result.downloadUrl,
        outputFile: result.outputFile
      };
    } catch (error) {
      console.error('=== COMPILATION ERROR ===');
      console.error('Error details:', error);
      console.error('Error type:', typeof error);
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Cannot connect to local server. Please make sure the backend server is running (start.bat).');
      }
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: Server took too long to respond.');
      }
      
      throw error;
    }
  }

  private static async pollProgress(jobId: string, onProgress: (progress: number, stage: string) => void): Promise<void> {
    console.log('Starting progress polling for job:', jobId);
    
    return new Promise((resolve, reject) => {
      let pollCount = 0;
      let consecutiveErrors = 0;
      const maxPolls = 600; // 5 minutes at 500ms intervals
      const maxConsecutiveErrors = 10;
      
      const pollInterval = setInterval(async () => {
        pollCount++;
        console.log(`Progress poll #${pollCount} for job ${jobId}`);
        
        try {
          const progressResponse = await fetch(`http://localhost:4000/progress/${jobId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!progressResponse.ok) {
            console.error('Progress poll failed:', progressResponse.status, progressResponse.statusText);
            consecutiveErrors++;
            
            if (consecutiveErrors >= maxConsecutiveErrors) {
              console.error('Too many consecutive progress poll failures');
              clearInterval(pollInterval);
              reject(new Error('Progress polling failed repeatedly'));
              return;
            }
            
            // Continue polling on single failures
            return;
          }

          const progressData = await progressResponse.json();
          console.log('Progress data received:', progressData);
          
          // Reset error counter on successful response
          consecutiveErrors = 0;
          
          // Update progress
          onProgress(progressData.percent || 0, progressData.stage || 'Processing...');

          // Check for completion
          if (progressData.percent >= 100) {
            console.log('Progress polling complete - 100% reached');
            clearInterval(pollInterval);
            resolve();
            return;
          }
          
          // Check for error states
          if (progressData.stage && progressData.stage.toLowerCase().includes('error')) {
            console.error('Server reported error:', progressData.stage);
            clearInterval(pollInterval);
            reject(new Error(progressData.stage));
            return;
          }
          
          // Timeout protection
          if (pollCount >= maxPolls) {
            console.warn('Progress polling timeout reached');
            clearInterval(pollInterval);
            resolve(); // Don't fail, just stop polling
          }
        } catch (error) {
          console.error('Progress polling network error:', error);
          consecutiveErrors++;
          
          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.error('Too many consecutive network errors in progress polling');
            clearInterval(pollInterval);
            reject(new Error('Network error during progress polling'));
            return;
          }
          
          // Log periodic warnings but continue
          if (pollCount % 20 === 0) {
            console.warn(`Progress polling has failed ${consecutiveErrors} times recently`);
          }
        }
      }, 500);

      // Cleanup timeout - ensure we don't poll forever
      setTimeout(() => {
        console.log('Progress polling cleanup timeout reached');
        clearInterval(pollInterval);
        resolve();
      }, 300000); // 5 minutes total timeout
    });
  }

  static exportTimelineJSON(
    timelineClips: VideoClip[],
    totalDuration: number,
    zoom: number,
    playheadPosition: number
  ): void {
    console.log('Exporting timeline JSON');
    const config: TimelineConfig = {
      totalDuration,
      clipOrder: timelineClips.map(clip => clip.id),
      zoom,
      playheadPosition,
    };
    
    const exportData: CompileRequest = { config, clips: timelineClips };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'timeline-config.json';
    link.click();
    URL.revokeObjectURL(url);
    console.log('Timeline JSON export complete');
  }
}
