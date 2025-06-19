
# Timeline Video Editor - Local Installation

## Quick Start (Windows)

1. **Double-click `quick-install.bat`** for the interactive installer
2. Choose option **[1] Install** for first-time setup
3. Choose option **[2] Start Application** to run the editor

## Manual Installation

### Prerequisites
- Windows 10/11
- Node.js 18+ (Download from [nodejs.org](https://nodejs.org/))

### Step-by-Step Installation

1. **Install Node.js** (if not already installed)
   - Download from https://nodejs.org/
   - Install with default settings

2. **Run Installation**
   ```batch
   install.bat
   ```

3. **Start Application**
   ```batch
   start.bat
   ```

## Available Scripts

- `quick-install.bat` - Interactive installer with menu
- `install.bat` - Install all dependencies
- `start.bat` - Start both frontend and backend (with console windows)
- `start-silent.bat` - Start both applications minimized

## Application URLs

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:4000

## Features

✅ **Local Video Processing** - No internet required  
✅ **Drag & Drop Interface** - Easy timeline editing  
✅ **Real-time Preview** - See changes instantly  
✅ **Video Compilation** - Export finished videos  
✅ **JSON Export** - Save timeline configurations  

## Troubleshooting

### Port Already in Use
If you get port errors, make sure no other applications are using ports 5173 or 4000.

### FFmpeg Issues
The backend includes FFmpeg automatically. If you encounter video processing errors, restart the application.

### Node.js Not Found
Make sure Node.js is installed and added to your system PATH.

## File Structure

```
timeline-editor/
├── quick-install.bat    # Interactive installer
├── install.bat         # Install dependencies
├── start.bat           # Start application
├── start-silent.bat    # Start minimized
├── server/             # Backend server
│   ├── server.js       # Main server file
│   └── package.json    # Server dependencies
└── src/                # Frontend application
    └── ...
```

## System Requirements

- **OS**: Windows 10/11
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **CPU**: Any modern processor (video processing is CPU intensive)
