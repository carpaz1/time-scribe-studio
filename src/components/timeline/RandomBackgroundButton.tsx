
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
      
      // If no folder is set, prompt user to select one first
      if (settings.type !== 'folder') {
        toast({
          title: "No folder selected",
          description: "Please configure a background folder in Settings first",
          variant: "destructive",
        });
        setIsChanging(false);
        return;
      }

      // Get stored folder files or prompt to select again
      const savedFolderData = localStorage.getItem('background-folder-files');
      let folderFiles: File[] = [];
      
      if (savedFolderData) {
        // We can't restore File objects from localStorage, so we need to ask user to select folder again
        const files = await BackgroundService.selectImageFolder();
        if (files) {
          folderFiles = files;
        }
      } else {
        const files = await BackgroundService.selectImageFolder();
        if (files) {
          folderFiles = files;
          // Store folder info (though we can't persist actual File objects)
          localStorage.setItem('background-folder-files', JSON.stringify({
            count: files.length,
            timestamp: Date.now()
          }));
        }
      }

      if (folderFiles.length > 0) {
        const randomFile = BackgroundService.randomFromFolder(folderFiles);
        if (randomFile) {
          const processedUrl = await BackgroundService.processImageForBackground(randomFile, settings);
          BackgroundService.applyBackground(processedUrl, settings);
          
          toast({
            title: "Background changed",
            description: `Now using: ${randomFile.name}`,
          });
        }
      } else {
        toast({
          title: "No images found",
          description: "Please select a folder with images in Settings",
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
