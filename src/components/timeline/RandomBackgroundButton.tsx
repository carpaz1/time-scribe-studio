
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image, RefreshCw } from 'lucide-react';
import { BackgroundService } from '@/services/backgroundService';
import { useToast } from '@/hooks/use-toast';

const RandomBackgroundButton: React.FC = () => {
  const [isChanging, setIsChanging] = useState(false);
  const { toast } = useToast();

  const handleRandomBackground = async () => {
    setIsChanging(true);
    try {
      const settings = BackgroundService.getSettings();
      
      // Check if folder settings exist
      if (settings.type !== 'folder' && !settings.folderPath) {
        toast({
          title: "No folder configured",
          description: "Please select a background folder in Settings first",
          variant: "destructive",
        });
        setIsChanging(false);
        return;
      }

      // For persistent folder usage, ask user to select again (browser limitation)
      const files = await BackgroundService.selectImageFolder();
      if (files && files.length > 0) {
        const randomFile = BackgroundService.randomFromFolder(files);
        if (randomFile) {
          const processedUrl = await BackgroundService.processImageForBackground(randomFile, {
            ...settings,
            aiEnhanced: true, // Force AI enhancement for full screen
            imagePosition: 'pattern' // Full screen pattern
          });
          BackgroundService.applyBackground(processedUrl, {
            ...settings,
            aiEnhanced: true,
            imagePosition: 'pattern'
          });
          
          toast({
            title: "Random background applied",
            description: `Now using: ${randomFile.name}`,
          });
        }
      } else {
        toast({
          title: "No images found",
          description: "Selected folder contains no image files",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Random background error:', error);
      toast({
        title: "Error changing background",
        description: "Failed to apply random background",
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Button
      onClick={handleRandomBackground}
      disabled={isChanging}
      variant="outline"
      size="sm"
      className="bg-purple-600/20 border-purple-500 text-purple-300 hover:bg-purple-600/30"
    >
      {isChanging ? (
        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Image className="w-4 h-4 mr-2" />
      )}
      Random Background
    </Button>
  );
};

export default RandomBackgroundButton;
