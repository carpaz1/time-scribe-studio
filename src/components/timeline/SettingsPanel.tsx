
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import SmartBackgroundPanel from './SmartBackgroundPanel';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-6xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <SmartBackgroundPanel />
            
            {/* Video Settings */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-lg text-white">Video Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Output Format</label>
                  <select className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white">
                    <option value="mp4">MP4 (H.264)</option>
                    <option value="webm">WebM (VP8)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Quality</label>
                  <select className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white">
                    <option value="high">High (5 Mbps)</option>
                    <option value="medium">Medium (2.5 Mbps)</option>
                    <option value="low">Low (1 Mbps)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Frame Rate</label>
                  <select className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white">
                    <option value="30">30 FPS</option>
                    <option value="24">24 FPS</option>
                    <option value="60">60 FPS</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Performance Settings */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-lg text-white">Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">GPU Acceleration</span>
                  <input type="checkbox" defaultChecked className="toggle" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Hardware Encoding</span>
                  <input type="checkbox" defaultChecked className="toggle" />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Worker Threads</label>
                  <select className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white">
                    <option value="auto">Auto</option>
                    <option value="2">2 Threads</option>
                    <option value="4">4 Threads</option>
                    <option value="8">8 Threads</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* AI Settings */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-lg text-white">AI Assistant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">AI Provider</label>
                  <select className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white">
                    <option value="openai">OpenAI GPT-4</option>
                    <option value="local">Local LLM</option>
                    <option value="ollama">Ollama</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Auto Suggestions</span>
                  <input type="checkbox" defaultChecked className="toggle" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Smart Editing</span>
                  <input type="checkbox" defaultChecked className="toggle" />
                </div>
              </CardContent>
            </Card>

            {/* Export Settings */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-lg text-white">Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Default Save Location</label>
                  <button className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-left text-slate-300 hover:bg-slate-600">
                    Choose Folder...
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Auto-open after export</span>
                  <input type="checkbox" className="toggle" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Save project file</span>
                  <input type="checkbox" defaultChecked className="toggle" />
                </div>
              </CardContent>
            </Card>

            {/* Audio Settings */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-lg text-white">Audio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Sample Rate</label>
                  <select className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white">
                    <option value="48000">48 kHz</option>
                    <option value="44100">44.1 kHz</option>
                    <option value="22050">22 kHz</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Bitrate</label>
                  <select className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white">
                    <option value="320">320 kbps</option>
                    <option value="192">192 kbps</option>
                    <option value="128">128 kbps</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Normalize Audio</span>
                  <input type="checkbox" defaultChecked className="toggle" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
