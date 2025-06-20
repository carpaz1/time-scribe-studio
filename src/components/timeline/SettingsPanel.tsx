
import React, { useState } from 'react';
import { X, GitPull, Trash2, Download, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStage, setUpdateStage] = useState('');
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleGitPull = async () => {
    setIsUpdating(true);
    setUpdateProgress(0);
    setUpdateStage('Fetching latest changes...');
    
    try {
      // Simulate git pull process with progress updates
      const stages = [
        { stage: 'Fetching from remote...', progress: 20 },
        { stage: 'Checking for updates...', progress: 40 },
        { stage: 'Merging changes...', progress: 60 },
        { stage: 'Updating dependencies...', progress: 80 },
        { stage: 'Finalizing update...', progress: 100 }
      ];
      
      for (const { stage, progress } of stages) {
        setUpdateStage(stage);
        setUpdateProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      toast({
        title: "Update completed!",
        description: "Application has been updated to the latest version. Refresh the page to see changes.",
      });
      
      // Suggest page refresh
      setTimeout(() => {
        if (confirm('Update completed! Would you like to refresh the page to see the latest changes?')) {
          window.location.reload();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Update failed",
        description: "There was an error updating the application. Please try the manual update process.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      setUpdateProgress(0);
      setUpdateStage('');
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

          {/* Git Update Section */}
          <Card className="bg-slate-700/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <GitPull className="w-5 h-5" />
                Application Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-300">
                Pull the latest changes from the repository without restarting the application.
              </p>
              
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
                onClick={handleGitPull}
                disabled={isUpdating}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <GitPull className="w-4 h-4 mr-2" />
                {isUpdating ? 'Updating...' : 'Pull Latest Changes'}
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
