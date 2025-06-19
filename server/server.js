
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

const app = express();
const PORT = 4000;

// Store active compilation progress
const compilationProgress = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Progress endpoint
app.get('/progress/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  console.log(`Progress request for job: ${jobId}`);
  
  const progress = compilationProgress.get(jobId);
  if (!progress) {
    console.log(`No progress found for job: ${jobId}`);
    return res.json({ percent: 0, stage: 'Starting...' });
  }
  
  console.log(`Returning progress for job ${jobId}:`, progress);
  res.json(progress);
});

// Upload and compile endpoint
app.post('/upload', upload.array('videos'), async (req, res) => {
  const jobId = Date.now().toString();
  
  try {
    console.log('=== NEW COMPILATION REQUEST ===');
    console.log('Job ID:', jobId);
    console.log('Files received:', req.files?.length || 0);

    // Initialize progress immediately
    compilationProgress.set(jobId, { percent: 5, stage: 'Processing files...' });
    console.log('Initial progress set for job:', jobId);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No video files uploaded' });
    }

    const clipsData = JSON.parse(req.body.clipsData || '[]');
    console.log('Clips data parsed:', clipsData.length, 'clips');
    
    if (clipsData.length === 0) {
      return res.status(400).json({ error: 'No clips data provided' });
    }

    // Send immediate response with jobId
    res.json({ 
      success: true,
      message: 'Compilation started',
      jobId: jobId
    });
    console.log('Response sent to client with jobId:', jobId);

    // Continue processing asynchronously
    processVideoCompilation(jobId, req.files, clipsData);

  } catch (error) {
    console.error('Upload endpoint error:', error);
    compilationProgress.set(jobId, { percent: 0, stage: 'Error: ' + error.message });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error: ' + error.message });
    }
  }
});

async function processVideoCompilation(jobId, files, clipsData) {
  try {
    console.log(`Starting async processing for job: ${jobId}`);
    
    compilationProgress.set(jobId, { percent: 10, stage: 'Preparing clips...' });

    // Generate output filename
    const outputFilename = `compiled-${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    // Sort clips by position for proper timeline order
    const sortedClips = clipsData.sort((a, b) => a.position - b.position);

    // Filter valid clips
    const validClips = sortedClips.filter(clip => files[clip.fileIndex]);
    if (validClips.length === 0) {
      compilationProgress.set(jobId, { percent: 0, stage: 'Error: No valid clips to process' });
      return;
    }

    console.log('Starting FFmpeg processing with', validClips.length, 'clips...');

    compilationProgress.set(jobId, { percent: 15, stage: 'Starting GPU encoding...' });

    // Optimized video settings
    const videoSettings = {
      width: 1920,
      height: 1080,
      fps: 30
    };

    // Optimized NVENC settings for faster encoding
    const nvencOptions = [
      '-c:v', 'h264_nvenc',
      '-preset', 'p1', // Fastest preset
      '-tune', 'hq',
      '-rc', 'vbr',
      '-cq', '28', // Slightly higher for speed
      '-b:v', '6M', // Lower bitrate for speed
      '-maxrate', '8M',
      '-bufsize', '12M',
      '-gpu', 'any',
      '-movflags', '+faststart',
      '-pix_fmt', 'yuv420p'
    ];

    // Process based on clip count
    if (validClips.length === 1) {
      await processSingleClip(jobId, validClips[0], files, outputPath, videoSettings, nvencOptions);
    } else {
      await processMultipleClips(jobId, validClips, files, outputPath, videoSettings, nvencOptions);
    }

    // Mark as complete
    compilationProgress.set(jobId, { 
      percent: 100, 
      stage: 'Complete!',
      downloadUrl: `/download/${outputFilename}`,
      outputFile: outputFilename
    });

    console.log(`Compilation completed for job: ${jobId}`);

    // Clean up uploaded files
    files.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });

    // Clean up progress after 5 minutes
    setTimeout(() => {
      compilationProgress.delete(jobId);
      console.log(`Progress data cleaned up for job: ${jobId}`);
    }, 300000);

  } catch (error) {
    console.error(`Processing error for job ${jobId}:`, error);
    compilationProgress.set(jobId, { percent: 0, stage: 'Error: ' + error.message });
    
    // Clean up uploaded files
    files.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
  }
}

function processSingleClip(jobId, clip, files, outputPath, videoSettings, nvencOptions) {
  return new Promise((resolve, reject) => {
    console.log(`Processing single clip for job: ${jobId}`);
    compilationProgress.set(jobId, { percent: 20, stage: 'Encoding single clip...' });
    
    const file = files[clip.fileIndex];
    
    ffmpeg(file.path)
      .seekInput(clip.startTime)
      .duration(clip.duration)
      .audioCodec('aac')
      .audioBitrate('128k')
      .size(`${videoSettings.width}x${videoSettings.height}`)
      .fps(videoSettings.fps)
      .aspect('16:9')
      .autopad(true, 'black')
      .outputOptions(nvencOptions)
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log(`FFmpeg started for job ${jobId}:`, commandLine);
        compilationProgress.set(jobId, { percent: 25, stage: 'GPU encoding in progress...' });
      })
      .on('progress', (progress) => {
        const percent = Math.min(95, 25 + (progress.percent || 0) * 0.7);
        compilationProgress.set(jobId, { 
          percent: percent, 
          stage: `Encoding: ${Math.round(progress.percent || 0)}%` 
        });
        console.log(`Job ${jobId} progress:`, percent + '%');
      })
      .on('end', () => {
        console.log(`Video compilation completed for job: ${jobId}`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`FFmpeg error for job ${jobId}:`, err);
        reject(err);
      })
      .run();
  });
}

// Multiple clips - optimized concat approach
async function processMultipleClips(jobId, validClips, files, outputPath, videoSettings, nvencOptions) {
  try {
    compilationProgress.set(jobId, { percent: 20, stage: 'Processing multiple clips...' });
    
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempClips = [];
    let processedCount = 0;

    const processClip = (clip, index) => {
      return new Promise((resolve, reject) => {
        const file = files[clip.fileIndex];
        const tempClipPath = path.join(tempDir, `temp_clip_${index}.mp4`);
        tempClips.push(tempClipPath);

        const clipProgress = 20 + (index / validClips.length) * 50;
        compilationProgress.set(jobId, { 
          percent: clipProgress, 
          stage: `Processing clip ${index + 1}/${validClips.length}...` 
        });

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
            '-c:v', 'h264_nvenc',
            '-preset', 'p1',
            '-cq', '28',
            '-f', 'mp4',
            '-pix_fmt', 'yuv420p'
          ])
          .output(tempClipPath)
          .on('progress', (progress) => {
            const subProgress = clipProgress + ((progress.percent || 0) / 100) * (50 / validClips.length);
            compilationProgress.set(jobId, { 
              percent: subProgress, 
              stage: `Processing clip ${index + 1}/${validClips.length}: ${Math.round(progress.percent || 0)}%` 
            });
          })
          .on('end', () => {
            processedCount++;
            console.log(`Processed clip ${processedCount}/${validClips.length}`);
            resolve();
          })
          .on('error', reject)
          .run();
      });
    };

    // Process all clips sequentially for better progress tracking
    for (let i = 0; i < validClips.length; i++) {
      await processClip(validClips[i], i);
    }

    compilationProgress.set(jobId, { percent: 75, stage: 'Concatenating clips...' });

    // Create concat file list
    const concatListPath = path.join(tempDir, 'concat_list.txt');
    const concatContent = tempClips.map(clip => `file '${clip}'`).join('\n');
    fs.writeFileSync(concatListPath, concatContent);

    // Concatenate all clips
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatListPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .audioCodec('aac')
        .outputOptions(nvencOptions)
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg concat started:', commandLine);
          compilationProgress.set(jobId, { percent: 80, stage: 'Final encoding...' });
        })
        .on('progress', (progress) => {
          const percent = Math.min(95, 80 + (progress.percent || 0) * 0.15);
          compilationProgress.set(jobId, { 
            percent: percent, 
            stage: `Final encoding: ${Math.round(progress.percent || 0)}%` 
          });
        })
        .on('end', () => {
          console.log('Video compilation completed!');
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg concat error:', err);
          reject(err);
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

  } catch (error) {
    console.error('Error processing clips:', error);
    compilationProgress.set(jobId, { percent: 0, stage: 'Error: ' + error.message });
    
    // Clean up temp files
    tempClips.forEach(tempClip => {
      if (fs.existsSync(tempClip)) {
        fs.unlinkSync(tempClip);
      }
    });
    
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
  res.json({ status: 'Server is running', port: PORT });
});

app.listen(PORT, () => {
  console.log(`Timeline Editor Server running on http://localhost:${PORT}`);
  console.log('FFmpeg path:', ffmpegStatic);
});
