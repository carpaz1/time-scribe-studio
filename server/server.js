
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

    // Create filter complex for video concatenation
    let filterComplex = '';
    let inputs = [];

    // Sort clips by position for proper timeline order
    const sortedClips = clipsData.sort((a, b) => a.position - b.position);

    for (let i = 0; i < sortedClips.length; i++) {
      const clip = sortedClips[i];
      const file = req.files[clip.fileIndex];
      
      if (!file) {
        console.error(`File not found for clip ${clip.id} at index ${clip.fileIndex}`);
        continue;
      }

      inputs.push(file.path);
      
      // Create video segment with trim
      filterComplex += `[${i}:v]trim=start=${clip.startTime}:duration=${clip.duration},setpts=PTS-STARTPTS[v${i}];`;
      filterComplex += `[${i}:a]atrim=start=${clip.startTime}:duration=${clip.duration},asetpts=PTS-STARTPTS[a${i}];`;
    }

    // Concatenate all segments
    const validClips = sortedClips.filter(clip => req.files[clip.fileIndex]);
    if (validClips.length === 0) {
      return res.status(400).json({ error: 'No valid clips to process' });
    }

    filterComplex += validClips.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${validClips.length}:v=1:a=1[outv][outa]`;

    console.log('Starting FFmpeg processing...');
    
    const ffmpegCommand = ffmpeg();
    
    // Add all input files
    inputs.forEach(inputPath => {
      ffmpegCommand.addInput(inputPath);
    });

    ffmpegCommand
      .complexFilter(filterComplex)
      .outputOptions(['-map', '[outv]', '-map', '[outa]'])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg started:', commandLine);
      })
      .on('progress', (progress) => {
        console.log('Processing: ' + progress.percent + '% done');
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
