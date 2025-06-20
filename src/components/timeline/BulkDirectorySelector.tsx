
import React, { useState, useRef } from 'react';
import { Folder, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface BulkDirectorySelectorProps {
  onBulkUpload: (files: File[]) => void;
}

const BulkDirectorySelector: React.FC<BulkDirectorySelectorProps> = ({
  onBulkUpload,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDirectorySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const videoFiles: File[] = [];

    // Filter only video files
    Array.from(files).forEach(file => {
      if (file.type.startsWith('video/')) {
        videoFiles.push(file);
      }
    });

    setSelectedFiles(videoFiles);
    
    // Automatically call onBulkUpload when directory is selected
    onBulkUpload(videoFiles);
    
    toast({
      title: "Directory loaded",
      description: `Found ${videoFiles.length} video files. You can now use the main randomize buttons.`,
    });
  };

  const handleDirectoryClick = () => {
    directoryInputRef.current?.click();
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Folder className="w-4 h-4" />
          Bulk Directory
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={handleDirectoryClick}
          variant="outline"
          className="w-full justify-start bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600/50"
          size="sm"
        >
          <Upload className="w-4 h-4 mr-2" />
          Select Directory
        </Button>
        <input
          ref={directoryInputRef}
          type="file"
          // @ts-ignore - webkitdirectory is a valid HTML attribute
          webkitdirectory=""
          multiple
          onChange={handleDirectorySelect}
          className="hidden"
        />
        
        {selectedFiles.length > 0 && (
          <div className="text-center text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
            {selectedFiles.length} videos loaded
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkDirectorySelector;
