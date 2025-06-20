
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Image, Folder, Sparkles, Trash2, Eye, EyeOff } from 'lucide-react';
import { BackgroundService, BackgroundSettings as BgSettings } from '@/services/backgroundService';
import { useToast } from '@/hooks/use-toast';

interface BackgroundSettingsProps {
  onSettingsChange?: (settings: BgSettings) => void;
}

const BackgroundSettings: React.FC<BackgroundSettingsProps> = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState<BgSettings>(BackgroundService.getSettings());
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState(false);
  const { toast } = useToast();

  const updateSettings = (newSettings: Partial<BgSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    onSettingsChange?.(updated);
  };

  const handleSingleImage = async () => {
    setIsProcessing(true);
    try {
      const file = await BackgroundService.selectSingleImage();
      if (file) {
        const processedUrl = await BackgroundService.processImageForBackground(file, settings);
        BackgroundService.applyBackground(processedUrl, settings);
        updateSettings({ type: 'single', imagePath: file.name });
        toast({
          title: "Background applied",
          description: `Using ${file.name} as background`,
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
          toast({
            title: "Random background applied",
            description: `Using ${randomFile.name} from selected folder`,
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

  const removeBackground = () => {
    BackgroundService.removeBackground();
    updateSettings({ type: 'default' });
    toast({
      title: "Background removed",
      description: "Reverted to default theme",
    });
  };

  return (
    <Card className="bg-slate-700/50 border-slate-600">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <Image className="w-5 h-5" />
          Custom Background
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
            Select Single Image
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

        {/* Settings */}
        <div className="space-y-4 pt-4 border-t border-slate-600">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Opacity</span>
              <span className="text-xs text-slate-400">{Math.round(settings.opacity * 100)}%</span>
            </div>
            <Slider
              value={[settings.opacity]}
              onValueChange={(value) => updateSettings({ opacity: value[0] })}
              max={0.5}
              min={0.05}
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
              max={10}
              min={0}
              step={1}
              className="w-full"
            />
          </div>

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
        </div>

        {/* Actions */}
        {settings.type !== 'default' && (
          <div className="flex gap-2 pt-4 border-t border-slate-600">
            <Button
              onClick={removeBackground}
              variant="outline"
              size="sm"
              className="flex-1 border-slate-600 text-slate-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove
            </Button>
          </div>
        )}

        {/* Current Status */}
        <div className="text-xs text-slate-400 bg-slate-800/50 p-3 rounded">
          <strong>Current:</strong> {
            settings.type === 'default' ? 'Default theme' :
            settings.type === 'single' ? `Single image: ${settings.imagePath}` :
            `Folder: ${settings.folderPath}`
          }
        </div>
      </CardContent>
    </Card>
  );
};

export default BackgroundSettings;
