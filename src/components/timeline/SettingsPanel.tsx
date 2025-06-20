
import React, { useState, useEffect } from 'react';
import { Settings, Download, FolderOpen, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [downloadPath, setDownloadPath] = useState('');
  const [exportQuality, setExportQuality] = useState('high');
  const [autoSave, setAutoSave] = useState(false);
  const { toast } = useToast();

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('timeline-editor-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setDownloadPath(settings.downloadPath || '');
        setExportQuality(settings.exportQuality || 'high');
        setAutoSave(settings.autoSave || false);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  const saveSettings = () => {
    const settings = {
      downloadPath,
      exportQuality,
      autoSave,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('timeline-editor-settings', JSON.stringify(settings));
    toast({
      title: "Settings saved",
      description: "Your preferences have been saved successfully",
    });
  };

  const selectDownloadFolder = async () => {
    try {
      // For web applications, we can't directly access file system
      // This would require a native app or browser extension
      toast({
        title: "Browser limitation",
        description: "Download location is controlled by your browser settings. Check your browser's download settings to change the default folder.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to select folder",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-900 border-slate-700 text-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Editor Settings</CardTitle>
                <CardDescription className="text-slate-400">
                  Configure your video editor preferences
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Export Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Download className="w-4 h-4 text-blue-400" />
              <h3 className="font-semibold text-lg">Export Settings</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quality" className="text-sm font-medium text-slate-300">
                  Export Quality
                </Label>
                <select
                  id="quality"
                  value={exportQuality}
                  onChange={(e) => setExportQuality(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="low">Low (Fast)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="high">High (Best Quality)</option>
                  <option value="ultra">Ultra (Slowest)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="downloadPath" className="text-sm font-medium text-slate-300">
                  Download Location
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="downloadPath"
                    value={downloadPath}
                    onChange={(e) => setDownloadPath(e.target.value)}
                    placeholder="Browser default downloads folder"
                    className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                    readOnly
                  />
                  <Button
                    onClick={selectDownloadFolder}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Note: Web browsers control download locations. Change this in your browser settings.
                </p>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-700" />

          {/* General Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Save className="w-4 h-4 text-green-400" />
              <h3 className="font-semibold text-lg">General Settings</h3>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-slate-300">Auto-save Timeline</Label>
                <p className="text-xs text-slate-500">Automatically save your timeline progress</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <Separator className="bg-slate-700" />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={saveSettings}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPanel;
