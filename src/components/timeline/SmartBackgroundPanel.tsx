
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Image, Folder, Sparkles, Trash2, RefreshCw, Timer, Layers } from 'lucide-react';
import { BackgroundService, BackgroundSettings } from '@/services/backgroundService';
import { useToast } from '@/hooks/use-toast';

interface SmartBackgroundPanelProps {
  onSettingsChange?: (settings: BackgroundSettings) => void;
}

const SmartBackgroundPanel: React.FC<SmartBackgroundPanelProps> = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState<BackgroundSettings>(BackgroundService.getSettings());
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentImageName, setCurrentImageName] = useState<string>('');
  const { toast } = useToast();

  const updateSettings = (newSettings: Partial<BackgroundSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    BackgroundService.updateSettings(updated);
    onSettingsChange?.(updated);
    
    if (settings.type !== 'default' && currentImageName) {
      const existingStyle = document.getElementById('custom-background-style');
      if (existingStyle) {
        const match = existingStyle.textContent?.match(/url\('([^']+)'\)/);
        if (match && match[1]) {
          BackgroundService.applyBackground(match[1], updated);
        }
      }
    }
  };

  const handleSingleImage = async () => {
    setIsProcessing(true);
    try {
      const file = await BackgroundService.selectSingleImage();
      if (file) {
        const processedUrl = await BackgroundService.processImageForBackground(file, settings);
        BackgroundService.applyBackground(processedUrl, settings);
        updateSettings({ type: 'single', imagePath: file.name });
        setCurrentImageName(file.name);
        toast({
          title: "Smart background applied",
          description: `Using ${file.name}${settings.aiEnhanced ? ' with AI patterns' : ''}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error applying background",
        description: "Failed to process the selected image",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFolderSelection = async () => {
    setIsProcessing(true);
    try {
      const files = await BackgroundService.selectImageFolder();
      if (files) {
        const randomFile = BackgroundService.randomFromFolder();
        if (randomFile) {
          const processedUrl = await BackgroundService.processImageForBackground(randomFile, settings);
          BackgroundService.applyBackground(processedUrl, settings);
          updateSettings({ type: 'folder', folderPath: randomFile.webkitRelativePath });
          setCurrentImageName(randomFile.name);
          toast({
            title: "Random background applied",
            description: `Using ${randomFile.name} from folder`,
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error applying background",
        description: "Failed to process folder images",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const currentSettings = BackgroundService.getSettings();
    setSettings(currentSettings);
    if (currentSettings.imagePath) {
      setCurrentImageName(currentSettings.imagePath);
    }
  }, []);

  return (
    <Card className="bg-slate-700/50 border-slate-600">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Smart Background
          {settings.type !== 'default' && (
            <Badge variant="secondary" className="ml-auto">
              Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleSingleImage}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-xs"
          >
            <Image className="w-3 h-3 mr-1" />
            Single
          </Button>
          
          <Button
            onClick={handleFolderSelection}
            disabled={isProcessing}
            className="bg-purple-600 hover:bg-purple-700 text-xs"
          >
            <Folder className="w-3 h-3 mr-1" />
            Folder
          </Button>
        </div>

        {/* AI Enhancement */}
        <div className="space-y-3 pt-2 border-t border-slate-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-slate-300">AI Patterns</span>
            </div>
            <Switch
              checked={settings.aiEnhanced}
              onCheckedChange={(checked) => updateSettings({ aiEnhanced: checked })}
            />
          </div>
          
          {settings.aiEnhanced && (
            <div className="space-y-2 ml-6">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Overlay Everywhere</span>
                <Switch
                  checked={settings.overlayEverywhere}
                  onCheckedChange={(checked) => updateSettings({ overlayEverywhere: checked })}
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Pattern Size</span>
                  <span className="text-xs text-slate-500">{((settings.imageScale || 1) * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[settings.imageScale || 1]}
                  onValueChange={(value) => updateSettings({ imageScale: value[0] })}
                  max={1.5}
                  min={0.1}
                  step={0.1}
                  className="w-full h-1"
                />
              </div>
            </div>
          )}
        </div>

        {/* Auto Change */}
        {settings.type === 'folder' && (
          <div className="space-y-2 pt-2 border-t border-slate-600">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-300">Auto Change</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={settings.autoChangeInterval || 5}
                onChange={(e) => updateSettings({ autoChangeInterval: parseInt(e.target.value) })}
                className="w-16 h-8 text-xs bg-slate-600"
                min="1"
                max="60"
              />
              <span className="text-xs text-slate-400">minutes</span>
            </div>
          </div>
        )}

        {/* Visual Settings */}
        <div className="space-y-2 pt-2 border-t border-slate-600">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Opacity</span>
                <span className="text-xs text-slate-500">{Math.round(settings.opacity * 100)}%</span>
              </div>
              <Slider
                value={[settings.opacity]}
                onValueChange={(value) => updateSettings({ opacity: value[0] })}
                max={0.9}
                min={0.1}
                step={0.05}
                className="w-full h-1"
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Blur</span>
                <span className="text-xs text-slate-500">{settings.blur}px</span>
              </div>
              <Slider
                value={[settings.blur]}
                onValueChange={(value) => updateSettings({ blur: value[0] })}
                max={3}
                min={0}
                step={0.1}
                className="w-full h-1"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        {settings.type !== 'default' && (
          <div className="flex gap-2 pt-2 border-t border-slate-600">
            <Button
              onClick={() => {
                BackgroundService.removeBackground();
                updateSettings({ type: 'default' });
                setCurrentImageName('');
              }}
              variant="outline"
              size="sm"
              className="flex-1 text-xs border-slate-600"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Remove
            </Button>
            
            {settings.type === 'folder' && (
              <Button
                onClick={handleFolderSelection}
                variant="outline"
                size="sm"
                className="flex-1 text-xs border-purple-600"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Next
              </Button>
            )}
          </div>
        )}

        {/* Status */}
        <div className="text-xs text-slate-400 bg-slate-800/50 p-2 rounded">
          <strong>Status:</strong> {
            settings.type === 'default' ? 'Default theme' :
            settings.type === 'single' ? `Image: ${currentImageName || 'Unknown'}` :
            `Folder: ${currentImageName || 'Unknown'}`
          }
          {settings.aiEnhanced && settings.type !== 'default' && (
            <div className="mt-1 text-purple-300">AI Pattern Overlay Active</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartBackgroundPanel;
