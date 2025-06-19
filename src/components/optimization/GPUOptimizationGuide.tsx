
import React, { useState } from 'react';
import { Zap, Cpu, HardDrive, Settings, ChevronDown, ChevronUp, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface GPUOptimizationGuideProps {
  onClose?: () => void;
}

const GPUOptimizationGuide: React.FC<GPUOptimizationGuideProps> = ({ onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg text-white">GPU Acceleration Tips</CardTitle>
              <CardDescription className="text-slate-400">
                Optimize your RTX 4070 Ti Super for faster video processing (NVENC enabled)
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-300 hover:text-white"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {/* FFmpeg GPU Settings */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Cpu className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">FFmpeg GPU Encoding</h3>
              </div>
              <p className="text-sm text-slate-300 mb-3">
                Your RTX 4070 Ti Super supports NVENC hardware encoding for dramatically faster processing:
              </p>
              <div className="bg-slate-900/50 rounded p-3 text-xs font-mono text-green-400">
                <div>-c:v h264_nvenc -preset fast -cq 23</div>
                <div>-c:v hevc_nvenc -preset fast -cq 28</div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                These settings can reduce processing time by 5-10x compared to CPU encoding
              </p>
            </div>

            {/* System Optimization */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Settings className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-white">System Optimization</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start space-x-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Enable GPU scheduling in Windows Graphics Settings</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Set NVIDIA Control Panel to "Prefer maximum performance"</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Close unnecessary applications to free up VRAM</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Use fast SSD storage for source videos and output</span>
                </li>
              </ul>
            </div>

            {/* Storage Tips */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <HardDrive className="w-5 h-5 text-orange-400" />
                <h3 className="font-semibold text-white">Storage Optimization</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start space-x-2">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>Use NVMe SSD for source files and output directory</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>Avoid network drives for video processing</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>Keep 20-30GB free space on working drive</span>
                </li>
              </ul>
            </div>

            {/* Links */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-slate-300 border-slate-600 hover:bg-slate-700"
                onClick={() => window.open('https://developer.nvidia.com/ffmpeg', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                NVIDIA FFmpeg Guide
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-slate-300 border-slate-600 hover:bg-slate-700"
                onClick={() => window.open('https://trac.ffmpeg.org/wiki/HWAccelIntro', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Hardware Acceleration
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default GPUOptimizationGuide;
