const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const { Worker } = require('worker_threads');
const os = require('os');

// Set ffmpeg path with better error handling
try {
  ffmpeg.setFfmpegPath(ffmpegStatic);
  console.log(`[SYSTEM] FFmpeg path set to: ${ffmpegStatic}`);
} catch (error) {
  console.error('[SYSTEM] Failed to set FFmpeg path:', error);
  process.exit(1);
}

const app = express();
const PORT = 4000;

// Store active compilation progress and processes
const compilationProgress = new Map();
const activeJobs = new Map(); // Track active FFmpeg processes for cancellation

// Get CPU core count for parallel processing
const CPU_CORES = os.cpus().length;
const MAX_PARALLEL_CLIPS = Math.min(CPU_CORES - 1, 3); // Leave one core free and reduce to 3 max

console.log(`[SYSTEM] Detected ${CPU_CORES} CPU cores, will use ${MAX_PARALLEL_CLIPS} parallel processes`);

// Middleware with increased limits for large files and longer timeouts
app.use(cors());
app.use(express.json({ limit: '50gb' })); 
app.use(express.urlencoded({ limit: '50gb', extended: true })); 

// Increase server timeout to 10 minutes for large uploads
app.use((req, res, next) => {
  req.setTimeout(600000); // 10 minutes
  res.setTimeout(600000); // 10 minutes
  next();
});

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST' && req.url === '/upload') {
    console.log('[REQUEST] Upload request received!');
    console.log('[REQUEST] Headers:', JSON.stringify(req.headers, null, 2));
    console.log('[REQUEST] Content-Length:', req.headers['content-length']);
  }
  next();
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Configure multer for file uploads with increased limits
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('[MULTER] Receiving file:', file.originalname, 'Size:', file.size || 'unknown');
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + '-' + file.originalname;
    console.log('[MULTER] Saving file as:', filename);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024, // 10GB per file
    fieldSize: 10 * 1024 * 1024 * 1024, // 10GB for form fields
    fields: 100, // Allow many form fields
    files: 200 // Increased from 50 to 200 files
  }
});

// Progress endpoint
app.get('/progress/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  console.log(`[PROGRESS] Request for job: ${jobId}`);
  
  const progress = compilationProgress.get(jobId);
  if (!progress) {
    console.log(`[PROGRESS] No progress found for job: ${jobId}, returning default`);
    return res.json({ percent: 0, stage: 'Starting...' });
  }
  
  console.log(`[PROGRESS] Returning for job ${jobId}:`, progress);
  res.json(progress);
});

// Cancel endpoint for stopping active compilations
app.post('/cancel/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  console.log(`[CANCEL] Cancel request for job: ${jobId}`);
  
  const job = activeJobs.get(jobId);
  if (job) {
    console.log(`[CANCEL] Killing active process for job: ${jobId}`);
    if (job.ffmpegProcess) {
      job.ffmpegProcess.kill('SIGKILL');
    }
    activeJobs.delete(jobId);
    compilationProgress.set(jobId, { percent: 0, stage: 'Cancelled by user', cancelled: true });
    res.json({ success: true, message: 'Job cancelled' });
  } else {
    console.log(`[CANCEL] No active job found for: ${jobId}`);
    compilationProgress.set(jobId, { percent: 0, stage: 'Cancelled', cancelled: true });
    res.json({ success: true, message: 'Job marked as cancelled' });
  }
});

// Upload and compile endpoint with enhanced error handling
app.post('/upload', (req, res, next) => {
  console.log('\n=== UPLOAD REQUEST RECEIVED ===');
  console.log('[UPLOAD] Starting multer processing...');
  console.log('[UPLOAD] Request size:', req.headers['content-length'], 'bytes');
  
  // Use multer with error handling
  upload.array('videos')(req, res, async (err) => {
    if (err) {
      console.error('[UPLOAD] Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Maximum size is 10GB per file.' });
      }
      if (err.code === 'LIMIT_FIELD_SIZE') {
        return res.status(413).json({ error: 'Form field too large.' });
      }
      return res.status(400).json({ error: 'Upload error: ' + err.message });
    }
    
    // Continue with the original upload logic
    const jobId = Date.now().toString();
    
    try {
      console.log('\n=== NEW COMPILATION REQUEST ===');
      console.log('[UPLOAD] Job ID:', jobId);
      console.log('[UPLOAD] Files received:', req.files?.length || 0);
      console.log('[UPLOAD] Request body keys:', Object.keys(req.body));

      // Initialize progress immediately and log it
      const initialProgress = { percent: 2, stage: 'Processing upload...' };
      compilationProgress.set(jobId, initialProgress);
      console.log('[UPLOAD] Initial progress set for job:', jobId, initialProgress);

      if (!req.files || req.files.length === 0) {
        console.error('[UPLOAD] No files received!');
        return res.status(400).json({ error: 'No video files uploaded' });
      }

      // Log file details
      req.files.forEach((file, index) => {
        console.log(`[UPLOAD] File ${index + 1}: ${file.originalname} (${file.size} bytes) -> ${file.path}`);
      });

      const clipsData = JSON.parse(req.body.clipsData || '[]');
      console.log('[UPLOAD] Clips data parsed:', clipsData.length, 'clips');
      console.log('[UPLOAD] Clips details:', clipsData.map(c => ({ id: c.id, name: c.name, fileIndex: c.fileIndex })));
      
      if (clipsData.length === 0) {
        console.error('[UPLOAD] No clips data provided!');
        return res.status(400).json({ error: 'No clips data provided' });
      }

      // Update progress before sending response
      compilationProgress.set(jobId, { percent: 5, stage: 'Upload complete, starting processing...' });
      console.log('[UPLOAD] Progress updated to 5% for job:', jobId);

      // Send immediate response with jobId
      const response = { 
        success: true,
        message: 'Compilation started',
        jobId: jobId
      };
      res.json(response);
      console.log('[UPLOAD] Response sent to client:', response);

      // Continue processing asynchronously with enhanced error handling
      console.log('[UPLOAD] Starting async processing for job:', jobId);
      processVideoCompilation(jobId, req.files, clipsData).catch(error => {
        console.error('[ERROR] Async processing failed for job:', jobId, error);
        compilationProgress.set(jobId, { percent: 0, stage: 'Error: ' + error.message });
      });

    } catch (error) {
      console.error('[ERROR] Upload endpoint error:', error);
      compilationProgress.set(jobId, { percent: 0, stage: 'Error: ' + error.message });
      if (!res.headersSent) {
        res.status(500).json({ error: 'Server error: ' + error.message });
      }
    }
  });
});

app.post('/git-pull', async (req, res) => {
  try {
    console.log('Git pull request received');
    
    const { spawn } = require('child_process');
    const path = require('path');
    
    // Get the correct project root directory
    const projectRoot = path.resolve(__dirname, '..');
    console.log('Project root:', projectRoot);
    
    // Check if git is available
    const gitCheck = spawn('git', ['--version'], { 
      cwd: projectRoot,
      stdio: 'pipe'
    });
    
    gitCheck.on('error', (error) => {
      console.error('Git not found:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Git is not installed or not available in PATH' 
      });
    });
    
    gitCheck.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({ 
          success: false, 
          error: 'Git is not properly configured' 
        });
      }
      
      // Proceed with git pull
      performGitPull();
    });
    
    function performGitPull() {
      const gitProcess = spawn('git', ['pull'], { 
        cwd: projectRoot,
        stdio: 'pipe'
      });
      
      let output = '';
      let errorOutput = '';
      
      gitProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log('Git stdout:', data.toString());
      });
      
      gitProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.log('Git stderr:', data.toString());
      });
      
      gitProcess.on('close', (code) => {
        console.log('Git process closed with code:', code);
        
        if (code === 0) {
          res.json({ 
            success: true, 
            message: output || 'Git pull completed successfully' 
          });
        } else {
          // Check for specific error types
          if (errorOutput.includes('overwritten by merge') || errorOutput.includes('would be overwritten') || output.includes('overwritten by merge')) {
            res.status(409).json({ 
              success: false, 
              error: 'Your local changes would be overwritten by merge. This usually happens with package-lock.json. Use "Stash & Pull" to resolve this conflict.',
              type: 'merge_conflict',
              conflictFiles: ['package-lock.json']
            });
          } else if (errorOutput.includes('not a git repository')) {
            res.status(400).json({ 
              success: false, 
              error: 'This directory is not a git repository'
            });
          } else {
            res.status(500).json({ 
              success: false, 
              error: errorOutput || output || `Git pull failed with exit code ${code}`
            });
          }
        }
      });
      
      gitProcess.on('error', (error) => {
        console.error('Git process error:', error);
        res.status(500).json({ 
          success: false, 
          error: `Git command failed: ${error.message}` 
        });
      });
    }
    
  } catch (error) {
    console.error('Git pull error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/git-pull-stash', async (req, res) => {
  try {
    console.log('Git pull with stash request received');
    
    const { spawn } = require('child_process');
    const path = require('path');
    
    const projectRoot = path.resolve(__dirname, '..');
    console.log('Project root:', projectRoot);
    
    // First stash changes
    const stashProcess = spawn('git', ['stash'], { 
      cwd: projectRoot,
      stdio: 'pipe'
    });
    
    let stashOutput = '';
    let stashError = '';
    
    stashProcess.stdout.on('data', (data) => {
      stashOutput += data.toString();
    });
    
    stashProcess.stderr.on('data', (data) => {
      stashError += data.toString();
    });
    
    stashProcess.on('close', (stashCode) => {
      console.log('Git stash completed with code:', stashCode);
      
      // Now pull
      const pullProcess = spawn('git', ['pull'], { 
        cwd: projectRoot,
        stdio: 'pipe'
      });
      
      let pullOutput = '';
      let pullError = '';
      
      pullProcess.stdout.on('data', (data) => {
        pullOutput += data.toString();
      });
      
      pullProcess.stderr.on('data', (data) => {
        pullError += data.toString();
      });
      
      pullProcess.on('close', (pullCode) => {
        if (pullCode === 0) {
          // Try to restore stash
          const popProcess = spawn('git', ['stash', 'pop'], { 
            cwd: projectRoot,
            stdio: 'pipe'
          });
          
          popProcess.on('close', (popCode) => {
            res.json({ 
              success: true, 
              message: `Git pull with stash completed. ${popCode === 0 ? 'Stashed changes restored.' : 'Note: Could not restore stashed changes automatically.'}` 
            });
          });
          
          popProcess.on('error', () => {
            res.json({ 
              success: true, 
              message: 'Git pull completed, but could not restore stashed changes automatically.' 
            });
          });
        } else {
          res.status(500).json({ 
            success: false, 
            error: pullError || pullOutput || `Git pull failed with exit code ${pullCode}` 
          });
        }
      });
      
      pullProcess.on('error', (error) => {
        res.status(500).json({ 
          success: false, 
          error: `Git pull failed: ${error.message}` 
        });
      });
    });
    
    stashProcess.on('error', (error) => {
      res.status(500).json({ 
        success: false, 
        error: `Git stash failed: ${error.message}` 
      });
    });
    
  } catch (error) {
    console.error('Git pull stash error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/git-pull-force', async (req, res) => {
  try {
    console.log('Git pull force request received');
    
    const { spawn } = require('child_process');
    const path = require('path');
    
    const projectRoot = path.resolve(__dirname, '..');
    console.log('Project root:', projectRoot);
    
    // Reset hard and pull
    const resetProcess = spawn('git', ['reset', '--hard', 'HEAD'], { 
      cwd: projectRoot,
      stdio: 'pipe'
    });
    
    resetProcess.on('close', (resetCode) => {
      if (resetCode === 0) {
        const pullProcess = spawn('git', ['pull'], { 
          cwd: projectRoot,
          stdio: 'pipe'
        });
        
        let output = '';
        let errorOutput = '';
        
        pullProcess.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        pullProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });
        
        pullProcess.on('close', (code) => {
          if (code === 0) {
            res.json({ 
              success: true, 
              message: 'Force git pull completed successfully. Local changes have been discarded.' 
            });
          } else {
            res.status(500).json({ 
              success: false, 
              error: errorOutput || output || `Git pull failed with exit code ${code}` 
            });
          }
        });
        
        pullProcess.on('error', (error) => {
          res.status(500).json({ 
            success: false, 
            error: `Git pull failed: ${error.message}` 
          });
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: 'Failed to reset local changes' 
        });
      }
    });
    
    resetProcess.on('error', (error) => {
      res.status(500).json({ 
        success: false, 
        error: `Git reset failed: ${error.message}` 
      });
    });
    
  } catch (error) {
    console.error('Git pull force error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

async function processVideoCompilation(jobId, files, clipsData) {
  try {
    console.log(`\n[PROCESS] Starting async processing for job: ${jobId}`);
    
    // Check for cancellation before starting
    const currentProgress = compilationProgress.get(jobId);
    if (currentProgress?.cancelled) {
      console.log(`[PROCESS] Job ${jobId} was cancelled before processing`);
      return;
    }
    
    compilationProgress.set(jobId, { percent: 10, stage: 'Preparing clips...' });
    console.log(`[PROCESS] Progress set to 10% for job: ${jobId}`);

    // Generate output filename
    const outputFilename = `compiled-${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);
    console.log(`[PROCESS] Output will be saved to: ${outputPath}`);

    // Sort clips by position for proper timeline order
    const sortedClips = clipsData.sort((a, b) => a.position - b.position);
    console.log(`[PROCESS] Clips sorted by position for job: ${jobId}`);

    // Filter valid clips
    const validClips = sortedClips.filter(clip => {
      const file = files[clip.fileIndex];
      if (!file || !fs.existsSync(file.path)) {
        console.error(`[PROCESS] Invalid file for clip ${clip.id}:`, file?.path || 'undefined');
        return false;
      }
      return true;
    });
    
    console.log(`[PROCESS] Valid clips found: ${validClips.length}/${sortedClips.length} for job: ${jobId}`);
    
    if (validClips.length === 0) {
      const errorMsg = 'No valid clips to process';
      console.error(`[ERROR] ${errorMsg} for job: ${jobId}`);
      compilationProgress.set(jobId, { percent: 0, stage: 'Error: ' + errorMsg });
      return;
    }

    console.log(`[PROCESS] Starting FFmpeg processing for job: ${jobId} with ${validClips.length} clips`);

    compilationProgress.set(jobId, { percent: 15, stage: 'Starting video processing...' });
    console.log(`[PROCESS] Progress set to 15% for job: ${jobId}`);

    // Enhanced video settings for better compatibility and speed
    const videoSettings = {
      width: 1920,
      height: 1080,
      fps: 24 // Reduced from 30 for faster processing
    };

    // Optimized FFmpeg options for speed and Windows compatibility
    const fastOptions = [
      '-c:v', 'libx264',
      '-preset', 'superfast', // Faster than ultrafast but still good quality
      '-crf', '30', // Slightly lower quality for speed
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-avoid_negative_ts', 'make_zero',
      '-fflags', '+genpts',
      '-threads', '2', // Limit threads per process for stability
      '-strict', '-2',
      '-tune', 'fastdecode' // Optimize for fast decoding
    ];

    // Process based on clip count
    if (validClips.length === 1) {
      console.log(`[PROCESS] Processing single clip for job: ${jobId}`);
      await processSingleClipFast(jobId, validClips[0], files, outputPath, videoSettings, fastOptions);
    } else {
      console.log(`[PROCESS] Processing multiple clips for job: ${jobId}`);
      await processMultipleClipsFast(jobId, validClips, files, outputPath, videoSettings, fastOptions);
    }

    // Check for cancellation before completing
    const finalProgress = compilationProgress.get(jobId);
    if (finalProgress?.cancelled) {
      console.log(`[PROCESS] Job ${jobId} was cancelled during processing`);
      return;
    }

    // Mark as complete
    const completeProgress = { 
      percent: 100, 
      stage: 'Complete!',
      downloadUrl: `/download/${outputFilename}`,
      outputFile: outputFilename
    };
    compilationProgress.set(jobId, completeProgress);
    console.log(`[SUCCESS] Compilation completed for job: ${jobId}`, completeProgress);

    // Clean up uploaded files
    files.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log(`[CLEANUP] Deleted uploaded file: ${file.path}`);
      }
    });

    // Clean up progress after 5 minutes
    setTimeout(() => {
      compilationProgress.delete(jobId);
      activeJobs.delete(jobId);
      console.log(`[CLEANUP] Progress data cleaned up for job: ${jobId}`);
    }, 300000);

  } catch (error) {
    console.error(`[ERROR] Processing error for job ${jobId}:`, error);
    console.error(`[ERROR] Stack trace:`, error.stack);
    compilationProgress.set(jobId, { percent: 0, stage: 'Error: ' + error.message });
    
    // Clean up uploaded files
    files.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log(`[CLEANUP] Deleted uploaded file after error: ${file.path}`);
      }
    });
  }
}

function processSingleClipFast(jobId, clip, files, outputPath, videoSettings, fastOptions) {
  return new Promise((resolve, reject) => {
    console.log(`[SINGLE] Processing single clip for job: ${jobId}`);
    
    // Check for cancellation
    const currentProgress = compilationProgress.get(jobId);
    if (currentProgress?.cancelled) {
      console.log(`[SINGLE] Job ${jobId} cancelled before processing`);
      reject(new Error('Job cancelled'));
      return;
    }
    
    compilationProgress.set(jobId, { percent: 20, stage: 'Encoding clip...' });
    
    const file = files[clip.fileIndex];
    
    // Double-check file exists
    if (!fs.existsSync(file.path)) {
      reject(new Error(`Source file not found: ${file.path}`));
      return;
    }
    
    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      reject(new Error('Processing timeout - operation took too long'));
    }, 300000); // 5 minutes timeout
    
    const ffmpegProcess = ffmpeg(file.path)
      .seekInput(Math.max(0, clip.startTime))
      .duration(Math.max(0.1, clip.duration))
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioBitrate('96k')
      .size(`${videoSettings.width}x${videoSettings.height}`)
      .fps(videoSettings.fps)
      .aspect('16:9')
      .outputOptions([
        '-preset', 'superfast',
        '-crf', '30',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-avoid_negative_ts', 'make_zero',
        '-fflags', '+genpts',
        '-threads', '2',
        '-strict', '-2'
      ])
      .videoFilters('scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black')
      .output(outputPath);

    // Store the process for cancellation
    activeJobs.set(jobId, { ffmpegProcess });

    ffmpegProcess
      .on('start', (commandLine) => {
        console.log(`[SINGLE] FFmpeg started for job ${jobId}:`, commandLine);
        compilationProgress.set(jobId, { percent: 25, stage: 'Fast encoding in progress...' });
      })
      .on('progress', (progress) => {
        // Check for cancellation during progress
        const currentProgress = compilationProgress.get(jobId);
        if (currentProgress?.cancelled) {
          ffmpegProcess.kill('SIGKILL');
          return;
        }
        
        const percent = Math.min(95, 25 + (progress.percent || 0) * 0.7);
        compilationProgress.set(jobId, { 
          percent: percent, 
          stage: `Fast encoding: ${Math.round(progress.percent || 0)}%` 
        });
        console.log(`[SINGLE] Job ${jobId} progress:`, percent + '%');
      })
      .on('end', () => {
        clearTimeout(timeout);
        activeJobs.delete(jobId);
        console.log(`[SINGLE] Video compilation completed for job: ${jobId}`);
        resolve();
      })
      .on('error', (err) => {
        clearTimeout(timeout);
        activeJobs.delete(jobId);
        console.error(`[SINGLE] FFmpeg error for job ${jobId}:`, err);
        console.error(`[SINGLE] FFmpeg stderr:`, err.message);
        reject(new Error(`FFmpeg encoding failed: ${err.message}`));
      })
      .run();
  });
}

// Fixed processing for multiple clips - removed conflicting filters
async function processMultipleClipsFast(jobId, validClips, files, outputPath, videoSettings, fastOptions) {
  try {
    // Check for cancellation
    let currentProgress = compilationProgress.get(jobId);
    if (currentProgress?.cancelled) {
      console.log(`[MULTI] Job ${jobId} cancelled before processing`);
      throw new Error('Job cancelled');
    }
    
    compilationProgress.set(jobId, { percent: 20, stage: 'Creating video list...' });
    
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    compilationProgress.set(jobId, { percent: 30, stage: 'Processing clips sequentially...' });

    // Process clips one by one and then concatenate
    const processedClipPaths = [];
    
    for (let i = 0; i < validClips.length; i++) {
      // Check for cancellation before each clip
      currentProgress = compilationProgress.get(jobId);
      if (currentProgress?.cancelled) {
        console.log(`[MULTI] Job ${jobId} cancelled during clip processing`);
        throw new Error('Job cancelled');
      }
      
      const clip = validClips[i];
      const file = files[clip.fileIndex];
      const tempClipPath = path.join(tempDir, `temp_clip_${jobId}_${i}.mp4`);
      
      console.log(`[MULTI] Processing clip ${i + 1}/${validClips.length} for job: ${jobId}`);
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Clip ${i} processing timeout`));
        }, 180000); // 3 minutes per clip
        
        const ffmpegProcess = ffmpeg(file.path)
          .seekInput(Math.max(0, clip.startTime))
          .duration(Math.max(0.1, clip.duration))
          .videoCodec('libx264')
          .audioCodec('aac')
          .audioBitrate('96k')
          .size(`${videoSettings.width}x${videoSettings.height}`)
          .fps(videoSettings.fps)
          .outputOptions([
            '-preset', 'superfast',
            '-crf', '30',
            '-pix_fmt', 'yuv420p',
            '-avoid_negative_ts', 'make_zero',
            '-fflags', '+genpts',
            '-threads', '2',
            '-strict', '-2'
          ])
          .videoFilters('scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black')
          .output(tempClipPath);

        // Store the process for cancellation
        activeJobs.set(jobId, { ffmpegProcess });

        ffmpegProcess
          .on('end', () => {
            clearTimeout(timeout);
            processedClipPaths.push(tempClipPath);
            const progress = 30 + ((i + 1) / validClips.length) * 50;
            compilationProgress.set(jobId, { 
              percent: progress, 
              stage: `Processed clip ${i + 1}/${validClips.length}` 
            });
            resolve();
          })
          .on('error', (err) => {
            clearTimeout(timeout);
            activeJobs.delete(jobId);
            reject(new Error(`Clip ${i} processing failed: ${err.message}`));
          })
          .run();
      });
    }

    // Check for cancellation before concatenation
    currentProgress = compilationProgress.get(jobId);
    if (currentProgress?.cancelled) {
      console.log(`[MULTI] Job ${jobId} cancelled before concatenation`);
      throw new Error('Job cancelled');
    }

    // Create concat file
    const concatListPath = path.join(tempDir, `concat_list_${jobId}.txt`);
    const concatContent = processedClipPaths.map(path => `file '${path.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(concatListPath, concatContent);

    compilationProgress.set(jobId, { percent: 85, stage: 'Concatenating clips...' });

    // Concatenate all processed clips
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Concatenation timeout'));
      }, 300000); // 5 minutes timeout

      const ffmpegProcess = ffmpeg()
        .input(concatListPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .videoCodec('copy')
        .audioCodec('copy')
        .output(outputPath);

      // Store the process for cancellation
      activeJobs.set(jobId, { ffmpegProcess });

      ffmpegProcess
        .on('start', (commandLine) => {
          console.log(`[MULTI] Final concat started for job ${jobId}`);
        })
        .on('progress', (progress) => {
          // Check for cancellation during concatenation
          const currentProgress = compilationProgress.get(jobId);
          if (currentProgress?.cancelled) {
            ffmpegProcess.kill('SIGKILL');
            return;
          }
          
          const percent = Math.min(95, 85 + (progress.percent || 0) * 0.1);
          compilationProgress.set(jobId, { 
            percent: percent, 
            stage: `Finalizing: ${Math.round(progress.percent || 0)}%` 
          });
        })
        .on('end', () => {
          clearTimeout(timeout);
          activeJobs.delete(jobId);
          console.log(`[MULTI] Concatenation completed for job: ${jobId}`);
          resolve();
        })
        .on('error', (err) => {
          clearTimeout(timeout);
          activeJobs.delete(jobId);
          reject(new Error(`Concatenation failed: ${err.message}`));
        })
        .run();
    });

    // Clean up temp files
    processedClipPaths.forEach(path => {
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
    });
    if (fs.existsSync(concatListPath)) {
      fs.unlinkSync(concatListPath);
    }

  } catch (error) {
    console.error(`[MULTI] Job ${jobId}: Error processing clips:`, error);
    compilationProgress.set(jobId, { percent: 0, stage: 'Error: ' + error.message });
    throw error;
  }
}

// Download endpoint
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(outputDir, filename);
  
  if (fs.existsSync(filepath)) {
    res.download(filepath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Health check
app.get('/health', (req, res) => {
  console.log('[HEALTH] Health check requested');
  res.json({ status: 'Server is running', port: PORT, timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n=== Timeline Editor Server Started ===`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`FFmpeg path: ${ffmpegStatic}`);
  console.log(`Uploads directory: ${uploadsDir}`);
  console.log(`Output directory: ${outputDir}`);
  console.log(`Server ready to accept compilation requests!`);
  console.log(`Maximum file size: 10GB per file`);
  console.log(`Maximum total upload: 50GB`);
  console.log(`Request timeout: 10 minutes`);
  console.log('======================================\n');
});
