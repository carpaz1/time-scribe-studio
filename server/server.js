
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

// Upload and compile endpoint
app.post('/upload', upload.array('videos'), async (req, res) => {
  try {
    console.log('Received compilation request');
    console.log('Files:', req.files?.length || 0);
    console.log('Clips data:', req.body.clipsData);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No video files uploaded' });
    }

    const clipsData = JSON.parse(req.body.clipsData || '[]');
    
    if (clipsData.length === 0) {
      return res.status(400).json({ error: 'No clips data provided' });
    }

    // Generate output filename
    const outputFilename = `compiled-${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    // Sort clips by position for proper timeline order
    const sortedClips = clipsData.sort((a, b) => a.position - b.position);

    // Filter valid clips
    const validClips = sortedClips.filter(clip => req.files[clip.fileIndex]);
    if (validClips.length === 0) {
      return res.status(400).json({ error: 'No valid clips to process' });
    }

    console.log('Starting FFmpeg processing with', validClips.length, 'clips...');

    // Standard video settings for uniform output
    const videoSettings = {
      width: 1920,
      height: 1080,
      fps: 30
    };

    // If only one clip, use simpler approach
    if (validClips.length === 1) {
      const clip = validClips[0];
      const file = req.files[clip.fileIndex];
      
      ffmpeg(file.path)
        .seekInput(clip.startTime)
        .duration(clip.duration)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size(`${videoSettings.width}x${videoSettings.height}`)
        .fps(videoSettings.fps)
        .aspect('16:9')
        .autopad(true, 'black')
        .outputOptions([
          '-preset', 'fast',
          '-movflags', '+faststart',
          '-pix_fmt', 'yuv420p'
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg started:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('Processing: ' + (progress.percent || 0) + '% done');
        })
        .on('end', () => {
          console.log('Video compilation completed!');
          
          // Clean up uploaded files
          req.files.forEach(file => {
            fs.unlinkSync(file.path);
          });

          res.json({ 
            success: true, 
            message: 'Video compiled successfully',
            outputFile: outputFilename,
            downloadUrl: `/download/${outputFilename}`
          });
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          
          // Clean up uploaded files
          req.files.forEach(file => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });

          res.status(500).json({ error: 'Video compilation failed: ' + err.message });
        })
        .run();
    } else {
      // Multiple clips - use concat protocol with uniform scaling
      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Create temporary processed clips with uniform dimensions
      const tempClips = [];
      let processedCount = 0;

      const processClip = (clip, index) => {
        return new Promise((resolve, reject) => {
          const file = req.files[clip.fileIndex];
          const tempClipPath = path.join(tempDir, `temp_clip_${index}.mp4`);
          tempClips.push(tempClipPath);

          ffmpeg(file.path)
            .seekInput(clip.startTime)
            .duration(clip.duration)
            .videoCodec('libx264')
            .audioCodec('aac')
            .size(`${videoSettings.width}x${videoSettings.height}`)
            .fps(videoSettings.fps)
            .aspect('16:9')
            .autopad(true, 'black')
            .outputOptions([
              '-preset', 'fast',
              '-f', 'mp4',
              '-pix_fmt', 'yuv420p'
            ])
            .output(tempClipPath)
            .on('end', () => {
              processedCount++;
              console.log(`Processed clip ${processedCount}/${validClips.length}`);
              resolve();
            })
            .on('error', reject)
            .run();
        });
      };

      // Process all clips sequentially
      try {
        for (let i = 0; i < validClips.length; i++) {
          await processClip(validClips[i], i);
        }

        // Create concat file list
        const concatListPath = path.join(tempDir, 'concat_list.txt');
        const concatContent = tempClips.map(clip => `file '${clip}'`).join('\n');
        fs.writeFileSync(concatListPath, concatContent);

        // Concatenate all clips
        ffmpeg()
          .input(concatListPath)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions([
            '-preset', 'fast',
            '-movflags', '+faststart',
            '-pix_fmt', 'yuv420p'
          ])
          .output(outputPath)
          .on('start', (commandLine) => {
            console.log('FFmpeg concat started:', commandLine);
          })
          .on('progress', (progress) => {
            console.log('Concatenating: ' + (progress.percent || 0) + '% done');
          })
          .on('end', () => {
            console.log('Video compilation completed!');
            
            // Clean up temp files
            tempClips.forEach(tempClip => {
              if (fs.existsSync(tempClip)) {
                fs.unlinkSync(tempClip);
              }
            });
            if (fs.existsSync(concatListPath)) {
              fs.unlinkSync(concatListPath);
            }
            
            // Clean up uploaded files
            req.files.forEach(file => {
              fs.unlinkSync(file.path);
            });

            res.json({ 
              success: true, 
              message: 'Video compiled successfully',
              outputFile: outputFilename,
              downloadUrl: `/download/${outputFilename}`
            });
          })
          .on('error', (err) => {
            console.error('FFmpeg concat error:', err);
            
            // Clean up temp files
            tempClips.forEach(tempClip => {
              if (fs.existsSync(tempClip)) {
                fs.unlinkSync(tempClip);
              }
            });
            if (fs.existsSync(concatListPath)) {
              fs.unlinkSync(concatListPath);
            }
            
            // Clean up uploaded files
            req.files.forEach(file => {
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
              }
            });

            res.status(500).json({ error: 'Video compilation failed: ' + err.message });
          })
          .run();

      } catch (error) {
        console.error('Error processing clips:', error);
        
        // Clean up temp files
        tempClips.forEach(tempClip => {
          if (fs.existsSync(tempClip)) {
            fs.unlinkSync(tempClip);
          }
        });
        
        // Clean up uploaded files
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });

        res.status(500).json({ error: 'Video processing failed: ' + error.message });
      }
    }

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

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
