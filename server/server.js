const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const { Worker } = require('worker_threads');
const os = require('os');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

const app = express();
const PORT = 4000;

// Store active compilation progress
const compilationProgress = new Map();

// Get CPU core count for parallel processing
const CPU_CORES = os.cpus().length;
const MAX_PARALLEL_CLIPS = Math.min(CPU_CORES, 4); // Limit to 4 parallel processes

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
    files: 50 // Allow up to 50 files
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

async function processVideoCompilation(jobId, files, clipsData) {
  try {
    console.log(`\n[PROCESS] Starting async processing for job: ${jobId}`);
    
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
    const validClips = sortedClips.filter(clip => files[clip.fileIndex]);
    console.log(`[PROCESS] Valid clips found: ${validClips.length}/${sortedClips.length} for job: ${jobId}`);
    
    if (validClips.length === 0) {
      const errorMsg = 'No valid clips to process';
      console.error(`[ERROR] ${errorMsg} for job: ${jobId}`);
      compilationProgress.set(jobId, { percent: 0, stage: 'Error: ' + errorMsg });
      return;
    }

    console.log(`[PROCESS] Starting FFmpeg processing for job: ${jobId} with ${validClips.length} clips`);

    compilationProgress.set(jobId, { percent: 15, stage: 'Starting parallel processing...' });
    console.log(`[PROCESS] Progress set to 15% for job: ${jobId}`);

    // Enhanced video settings for better compatibility
    const videoSettings = {
      width: 1920,
      height: 1080,
      fps: 30
    };

    // Safer FFmpeg options for Windows compatibility
    const safeOptions = [
      '-c:v', 'libx264', // Use software encoding for better compatibility
      '-preset', 'ultrafast', // Fastest software preset
      '-crf', '28', // Reasonable quality for speed
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-avoid_negative_ts', 'make_zero',
      '-fflags', '+genpts',
      '-threads', '0', // Use all available CPU threads
      '-strict', '-2'
    ];

    // Process based on clip count with parallel processing
    if (validClips.length === 1) {
      console.log(`[PROCESS] Processing single clip for job: ${jobId}`);
      await processSingleClip(jobId, validClips[0], files, outputPath, videoSettings, safeOptions);
    } else {
      console.log(`[PROCESS] Processing multiple clips with parallel processing for job: ${jobId}`);
      await processMultipleClipsParallel(jobId, validClips, files, outputPath, videoSettings, safeOptions);
    }

    // Mark as complete
    const finalProgress = { 
      percent: 100, 
      stage: 'Complete!',
      downloadUrl: `/download/${outputFilename}`,
      outputFile: outputFilename
    };
    compilationProgress.set(jobId, finalProgress);
    console.log(`[SUCCESS] Compilation completed for job: ${jobId}`, finalProgress);

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

function processSingleClip(jobId, clip, files, outputPath, videoSettings, safeOptions) {
  return new Promise((resolve, reject) => {
    console.log(`[SINGLE] Processing single clip for job: ${jobId}`);
    compilationProgress.set(jobId, { percent: 20, stage: 'Encoding single clip...' });
    
    const file = files[clip.fileIndex];
    
    // Verify file exists
    if (!fs.existsSync(file.path)) {
      reject(new Error(`Source file not found: ${file.path}`));
      return;
    }
    
    ffmpeg(file.path)
      .seekInput(clip.startTime)
      .duration(clip.duration)
      .audioCodec('aac')
      .audioBitrate('128k')
      .size(`${videoSettings.width}x${videoSettings.height}`)
      .fps(videoSettings.fps)
      .aspect('16:9')
      .autopad(true, 'black')
      .outputOptions(safeOptions)
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log(`[SINGLE] FFmpeg started for job ${jobId}:`, commandLine);
        compilationProgress.set(jobId, { percent: 25, stage: 'Encoding in progress...' });
      })
      .on('progress', (progress) => {
        const percent = Math.min(95, 25 + (progress.percent || 0) * 0.7);
        compilationProgress.set(jobId, { 
          percent: percent, 
          stage: `Encoding: ${Math.round(progress.percent || 0)}%` 
        });
        console.log(`[SINGLE] Job ${jobId} progress:`, percent + '%');
      })
      .on('end', () => {
        console.log(`[SINGLE] Video compilation completed for job: ${jobId}`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`[SINGLE] FFmpeg error for job ${jobId}:`, err);
        console.error(`[SINGLE] FFmpeg stderr:`, err.message);
        reject(new Error(`FFmpeg encoding failed: ${err.message}`));
      })
      .run();
  });
}

// New parallel processing function
async function processMultipleClipsParallel(jobId, validClips, files, outputPath, videoSettings, safeOptions) {
  try {
    compilationProgress.set(jobId, { percent: 20, stage: 'Starting parallel clip processing...' });
    
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempClips = [];
    const processedClips = [];

    // Process clips in parallel batches
    const batchSize = MAX_PARALLEL_CLIPS;
    const totalBatches = Math.ceil(validClips.length / batchSize);
    
    console.log(`[PARALLEL] Processing ${validClips.length} clips in ${totalBatches} batches of ${batchSize}`);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, validClips.length);
      const batchClips = validClips.slice(batchStart, batchEnd);
      
      console.log(`[PARALLEL] Processing batch ${batchIndex + 1}/${totalBatches} (clips ${batchStart + 1}-${batchEnd})`);
      
      const batchProgress = 20 + (batchIndex / totalBatches) * 50;
      compilationProgress.set(jobId, { 
        percent: batchProgress, 
        stage: `Processing batch ${batchIndex + 1}/${totalBatches}...` 
      });

      // Process batch clips in parallel
      const batchPromises = batchClips.map((clip, index) => {
        const globalIndex = batchStart + index;
        return processClipParallel(clip, globalIndex, files, tempDir, videoSettings, safeOptions, jobId);
      });

      const batchResults = await Promise.all(batchPromises);
      processedClips.push(...batchResults);
      tempClips.push(...batchResults);
    }

    compilationProgress.set(jobId, { percent: 75, stage: 'Concatenating clips...' });
    console.log(`[PARALLEL] Job ${jobId}: Starting concatenation of ${tempClips.length} clips`);

    // Create concat file list
    const concatListPath = path.join(tempDir, `concat_list_${jobId}.txt`);
    const concatContent = tempClips.map(clip => `file '${clip}'`).join('\n');
    fs.writeFileSync(concatListPath, concatContent);
    console.log(`[PARALLEL] Job ${jobId}: Concat list created at ${concatListPath}`);

    // Concatenate all clips with improved options
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatListPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .audioCodec('aac')
        .audioBitrate('128k')
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-crf', '28',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',
          '-avoid_negative_ts', 'make_zero',
          '-fflags', '+genpts',
          '-threads', '0'
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log(`[PARALLEL] Job ${jobId}: FFmpeg concat started:`, commandLine);
          compilationProgress.set(jobId, { percent: 80, stage: 'Final encoding...' });
        })
        .on('progress', (progress) => {
          const percent = Math.min(95, 80 + (progress.percent || 0) * 0.15);
          compilationProgress.set(jobId, { 
            percent: percent, 
            stage: `Final encoding: ${Math.round(progress.percent || 0)}%` 
          });
          console.log(`[PARALLEL] Job ${jobId} final encoding progress:`, Math.round(progress.percent || 0) + '%');
        })
        .on('end', () => {
          console.log(`[PARALLEL] Job ${jobId}: Video compilation completed!`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`[PARALLEL] Job ${jobId}: FFmpeg concat error:`, err);
          reject(new Error(`Concatenation failed: ${err.message}`));
        })
        .run();
    });

    // Clean up temp files
    tempClips.forEach(tempClip => {
      if (fs.existsSync(tempClip)) {
        fs.unlinkSync(tempClip);
      }
    });
    if (fs.existsSync(concatListPath)) {
      fs.unlinkSync(concatListPath);
    }
    console.log(`[PARALLEL] Job ${jobId}: Temp files cleaned up`);

  } catch (error) {
    console.error(`[PARALLEL] Job ${jobId}: Error processing clips:`, error);
    compilationProgress.set(jobId, { percent: 0, stage: 'Error: ' + error.message });
    throw error;
  }
}

function processClipParallel(clip, index, files, tempDir, videoSettings, safeOptions, jobId) {
  return new Promise((resolve, reject) => {
    const file = files[clip.fileIndex];
    const tempClipPath = path.join(tempDir, `temp_clip_${index}.mp4`);

    // Verify file exists
    if (!fs.existsSync(file.path)) {
      reject(new Error(`Source file not found: ${file.path}`));
      return;
    }

    console.log(`[PARALLEL] Starting clip ${index + 1} processing: ${clip.name}`);

    ffmpeg(file.path)
      .seekInput(clip.startTime)
      .duration(clip.duration)
      .audioCodec('aac')
      .audioBitrate('128k')
      .size(`${videoSettings.width}x${videoSettings.height}`)
      .fps(videoSettings.fps)
      .aspect('16:9')
      .autopad(true, 'black')
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '28',
        '-f', 'mp4',
        '-pix_fmt', 'yuv420p',
        '-avoid_negative_ts', 'make_zero',
        '-fflags', '+genpts',
        '-threads', '1' // Use single thread per clip for parallel processing
      ])
      .output(tempClipPath)
      .on('start', (commandLine) => {
        console.log(`[PARALLEL] Clip ${index + 1} FFmpeg started`);
      })
      .on('progress', (progress) => {
        console.log(`[PARALLEL] Clip ${index + 1} progress: ${Math.round(progress.percent || 0)}%`);
      })
      .on('end', () => {
        console.log(`[PARALLEL] Clip ${index + 1} completed: ${tempClipPath}`);
        resolve(tempClipPath);
      })
      .on('error', (err) => {
        console.error(`[PARALLEL] Clip ${index + 1} error:`, err);
        reject(new Error(`Clip ${index + 1} processing failed: ${err.message}`));
      })
      .run();
  });
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
