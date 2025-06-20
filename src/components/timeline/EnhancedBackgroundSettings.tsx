
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Image, Folder, Sparkles, Trash2, RefreshCw, Info, Layout } from 'lucide-react';
import { BackgroundService, BackgroundSettings as BgSettings } from '@/services/backgroundService';
import { useToast } from '@/hooks/use-toast';

interface EnhancedBackgroundSettingsProps {
  onSettingsChange?: (settings: BgSettings) => void;
}

const EnhancedBackgroundSettings: React.FC<EnhancedBackgroundSettingsProps> = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState<BgSettings>(BackgroundService.getSettings());
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentImageName, setCurrentImageName] = useState<string>('');
  const { toast } = useToast();

  const updateSettings = (newSettings: Partial<BgSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
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
          title: "Background applied",
          description: `Using ${file.name}${settings.aiEnhanced ? ' with AI positioning' : ''}`,
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
        const randomFile = BackgroundService.randomFromFolder(files);
        if (randomFile) {
          const processedUrl = await BackgroundService.processImageForBackground(randomFile, settings);
          BackgroundService.applyBackground(processedUrl, settings);
          updateSettings({ type: 'folder', folderPath: randomFile.webkitRelativePath });
          setCurrentImageName(randomFile.name);
          toast({
            title: "Random background applied",
            description: `Using ${randomFile.name}${settings.aiEnhanced ? ' with AI positioning' : ''}`,
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
          <Image className="w-5 h-5" />
          Smart Background
          {settings.type !== 'default' && (
            <Badge variant="secondary" className="ml-auto">
              Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Background Selection */}
        <div className="grid grid-cols-1 gap-3">
          <Button
            onClick={handleSingleImage}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700 justify-start"
          >
            <Image className="w-4 h-4 mr-2" />
            Select Image
          </Button>
          
          <Button
            onClick={handleFolderSelection}
            disabled={isProcessing}
            className="bg-purple-600 hover:bg-purple-700 justify-start"
          >
            <Folder className="w-4 h-4 mr-2" />
            Random from Folder
          </Button>
        </div>

        {/* AI Enhancement Toggle */}
        <div className="space-y-3 pt-4 border-t border-slate-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-slate-300">AI Enhanced</span>
            </div>
            <Switch
              checked={settings.aiEnhanced}
              onCheckedChange={(checked) => updateSettings({ aiEnhanced: checked })}
            />
          </div>
          
          {settings.aiEnhanced && (
            <div className="space-y-3 ml-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Layout className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-slate-300">Position</span>
                </div>
                <Select
                  value={settings.imagePosition || 'center'}
                  onValueChange={(value: any) => updateSettings({ imagePosition: value })}
                >
                  <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="center" className="text-white hover:bg-slate-600">Center</SelectItem>
                    <SelectItem value="top-right" className="text-white hover:bg-slate-600">Top Right</SelectItem>
                    <SelectItem value="bottom-left" className="text-white hover:bg-slate-600">Bottom Left</SelectItem>
                    <SelectItem value="pattern" className="text-white hover:bg-slate-600">Pattern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Scale</span>
                  <span className="text-xs text-slate-400">{((settings.imageScale || 1) * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[settings.imageScale || 1]}
                  onValueChange={(value) => updateSettings({ imageScale: value[0] })}
                  max={2}
                  min={0.3}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          )}
          
          <div className="flex items-start gap-2 p-2 bg-purple-900/20 rounded border border-purple-500/30">
            <Info className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-purple-200">
              <strong>AI Enhanced:</strong> Intelligently positions and scales images for optimal visual integration with the interface theme.
            </div>
          </div>
        </div>

        {/* Traditional Settings */}
        <div className="space-y-4 pt-4 border-t border-slate-600">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Opacity</span>
              <span className="text-xs text-slate-400">{Math.round(settings.opacity * 100)}%</span>
            </div>
            <Slider
              value={[settings.opacity]}
              onValueChange={(value) => updateSettings({ opacity: value[0] })}
              max={0.9}
              min={0.2}
              step={0.05}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Blur</span>
              <span className="text-xs text-slate-400">{settings.blur}px</span>
            </div>
            <Slider
              value={[settings.blur]}
              onValueChange={(value) => updateSettings({ blur: value[0] })}
              max={5}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        {/* Actions */}
        {settings.type !== 'default' && (
          <div className="flex gap-2 pt-4 border-t border-slate-600">
            <Button
              onClick={() => {
                BackgroundService.removeBackground();
                updateSettings({ type: 'default' });
                setCurrentImageName('');
              }}
              variant="outline"
              size="sm"
              className="flex-1 border-slate-600 text-slate-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove
            </Button>
            
            {settings.type === 'folder' && (
              <Button
                onClick={handleFolderSelection}
                variant="outline"
                size="sm"
                className="flex-1 border-purple-600 text-purple-300"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                New Random
              </Button>
            )}
          </div>
        )}

        {/* Status */}
        <div className="text-xs text-slate-400 bg-slate-800/50 p-3 rounded">
          <strong>Status:</strong> {
            settings.type === 'default' ? 'Default theme' :
            settings.type === 'single' ? `Image: ${currentImageName || 'Unknown'}` :
            `Folder: ${currentImageName || 'Unknown'}`
          }
          {settings.type !== 'default' && (
            <div className="mt-1 text-emerald-400">
              Active - opacity: {Math.round(settings.opacity * 100)}%, blur: {settings.blur}px
              {settings.aiEnhanced && <span className="text-purple-300"> • AI Enhanced</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedBackgroundSettings;
