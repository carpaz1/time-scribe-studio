
import { useState, useCallback, useEffect } from 'react';

const SAVE_FOLDER_KEY = 'timeline-editor-save-folder';
const DEFAULT_FOLDER = 'Downloads';

export const useSaveFolder = () => {
  const [saveFolder, setSaveFolder] = useState<string>(DEFAULT_FOLDER);

  useEffect(() => {
    const saved = localStorage.getItem(SAVE_FOLDER_KEY);
    if (saved) {
      setSaveFolder(saved);
    }
  }, []);

  const updateSaveFolder = useCallback((newFolder: string) => {
    setSaveFolder(newFolder);
    localStorage.setItem(SAVE_FOLDER_KEY, newFolder);
  }, []);

  const selectFolder = useCallback(async () => {
    try {
      // Check if the File System Access API is supported
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker();
        const folderPath = dirHandle.name;
        updateSaveFolder(folderPath);
        return folderPath;
      } else {
        // Fallback for browsers that don't support directory picker
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.onchange = (e) => {
          const files = (e.target as HTMLInputElement).files;
          if (files && files.length > 0) {
            const path = files[0].webkitRelativePath.split('/')[0];
            updateSaveFolder(path);
          }
        };
        input.click();
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
    }
  }, [updateSaveFolder]);

  const resetToDefault = useCallback(() => {
    updateSaveFolder(DEFAULT_FOLDER);
  }, [updateSaveFolder]);

  return {
    saveFolder,
    selectFolder,
    resetToDefault,
    updateSaveFolder,
  };
};
