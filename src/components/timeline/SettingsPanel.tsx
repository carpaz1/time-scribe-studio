import React, { useState } from 'react';
import { X, Download, Trash2, AlertTriangle, Folder, FolderOpen, GitPull, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useSaveFolder } from '@/hooks/useSaveFolder';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStage, setUpdateStage] = useState('');
  const [gitError, setGitError] = useState<string>('');
  const { toast } = useToast();
  const { saveFolder, selectFolder, resetToDefault, saveToFolder } = useSaveFolder();

  if (!isOpen) return null;

  const handleGitPull = async (force = false) => {
    setIsUpdating(true);
    setUpdateProgress(0);
    setGitError('');
    setUpdateStage('Starting git pull...');
    
    try {
      const endpoint = force ? 'http://localhost:4000/git-pull-force' : 'http://localhost:4000/git-pull';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error && result.error.includes('overwritten by merge')) {
          setGitError('Git merge conflict detected. Local changes would be overwritten.');
          setUpdateStage('Merge conflict detected');
          return;
        }
        throw new Error(result.error || `Git pull failed: ${response.statusText}`);
      }
      
      // Simulate progress for visual feedback
      const stages = [
        { stage: 'Connecting to remote repository...', progress: 20 },
        { stage: 'Fetching latest changes...', progress: 40 },
        { stage: 'Merging changes...', progress: 60 },
        { stage: 'Updating working directory...', progress: 80 },
        { stage: 'Update complete!', progress: 100 }
      ];
      
      for (const { stage, progress } of stages) {
        setUpdateStage(stage);
        setUpdateProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      toast({
        title: "Git pull completed!",
        description: result.message || "Repository has been updated to the latest version.",
      });
      
    } catch (error) {
      console.error('Git pull error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to pull latest changes from repository.";
      setGitError(errorMessage);
      toast({
        title: "Git pull failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      setUpdateProgress(0);
      if (!gitError) {
        setUpdateStage('');
      }
    }
  };

  const handleFolderSelect = async () => {
    try {
      const result = await selectFolder();
      if (result.folderPath) {
        toast({
          title: "Folder selected",
          description: `Downloads will be saved to: ${result.folderPath}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error selecting folder",
        description: "Failed to select folder. Using default Downloads folder.",
        variant: "destructive",
      });
    }
  };

  const handleClearLocalStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast({
      title: "Storage cleared",
      description: "Local storage and session storage have been cleared.",
    });
  };

  const handleClearBrowserCache = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    toast({
      title: "Cache cleared",
      description: "Browser cache has been cleared. Consider refreshing the page.",
    });
  };

  const getFileLimitWarning = () => {
    const clipCount = localStorage.getItem('clipCount') || '0';
    const count = parseInt(clipCount);
    
    if (count > 200) {
      return {
        level: 'error',
        message: `High clip count (${count}). Consider clearing some clips to avoid performance issues.`
      };
    } else if (count > 100) {
      return {
        level: 'warning',
        message: `Medium clip count (${count}). Monitor for performance issues.`
      };
    }
    return null;
  };

  const fileLimitWarning = getFileLimitWarning();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-800 border-slate-700 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl text-white">Settings & Maintenance</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* File Limit Warning */}
          {fileLimitWarning && (
            <Card className={`border ${fileLimitWarning.level === 'error' ? 'border-red-500 bg-red-500/10' : 'border-yellow-500 bg-yellow-500/10'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-5 h-5 ${fileLimitWarning.level === 'error' ? 'text-red-400' : 'text-yellow-400'}`} />
                  <span className="text-sm text-slate-200">{fileLimitWarning.message}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Folder Section */}
          <Card className="bg-slate-700/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Folder className="w-5 h-5" />
                Download Folder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-300">
                Set the default folder for downloads and auto-saves.
              </p>
              
              <div className="bg-slate-800/50 p-3 rounded border border-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Current folder:</span>
                  <span className="text-sm text-emerald-400 font-mono">{saveFolder}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={handleFolderSelect}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Browse Folder
                </Button>
                
                <Button
                  onClick={resetToDefault}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-600"
                >
                  Reset to Downloads
                </Button>
              </div>
              
              <div className="text-xs text-slate-400 bg-slate-800/50 p-3 rounded">
                <strong>Note:</strong> Randomized clips and compiled videos will automatically save to this folder.
              </div>
            </CardContent>
          </Card>

          {/* Git Update Section */}
          <Card className="bg-slate-700/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Download className="w-5 h-5" />
                Git Repository Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-300">
                Pull the latest changes from the git repository.
              </p>
              
              {gitError && (
                <Card className="border-red-500 bg-red-500/10">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="space-y-2">
                        <span className="text-sm text-red-300">{gitError}</span>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleGitPull(true)}
                            disabled={isUpdating}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-xs"
                          >
                            Force Update (Discard Local Changes)
                          </Button>
                          <Button
                            onClick={() => setGitError('')}
                            variant="outline"
                            size="sm"
                            className="text-xs border-slate-600"
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {isUpdating && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{updateStage}</span>
                    <span className="text-sm text-slate-300">{updateProgress}%</span>
                  </div>
                  <Progress value={updateProgress} className="h-2" />
                </div>
              )}
              
              <Button
                onClick={() => handleGitPull(false)}
                disabled={isUpdating}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                {isUpdating ? 'Pulling...' : 'Git Pull'}
              </Button>
            </CardContent>
          </Card>

          {/* Performance & Storage Section */}
          <Card className="bg-slate-700/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Performance & Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-300">
                Clear storage and cache to resolve performance issues and file limits.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={handleClearLocalStorage}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Storage
                </Button>
                
                <Button
                  onClick={handleClearBrowserCache}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Clear Cache
                </Button>
              </div>
              
              <div className="text-xs text-slate-400 bg-slate-800/50 p-3 rounded">
                <strong>Tip:</strong> If you're experiencing file limit errors or performance issues, 
                try clearing storage first. This will remove cached clips and free up space.
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card className="bg-slate-700/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-lg text-white">System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">User Agent:</span>
                  <p className="text-slate-200 text-xs break-all">{navigator.userAgent}</p>
                </div>
                <div>
                  <span className="text-slate-400">Storage Used:</span>
                  <p className="text-slate-200">{Math.round(JSON.stringify(localStorage).length / 1024)} KB</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPanel;
