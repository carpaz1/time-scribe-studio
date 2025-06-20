
import { useState, useCallback, useEffect } from 'react';

const SAVE_FOLDER_KEY = 'timeline-editor-save-folder';
const DEFAULT_FOLDER = 'Downloads';

export const useSaveFolder = () => {
  const [saveFolder, setSaveFolder] = useState<string>(DEFAULT_FOLDER);
  const [folderHandle, setFolderHandle] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem(SAVE_FOLDER_KEY);
    if (saved) {
      setSaveFolder(saved);
    }
  }, []);

  const updateSaveFolder = useCallback((newFolder: string, handle?: any) => {
    setSaveFolder(newFolder);
    localStorage.setItem(SAVE_FOLDER_KEY, newFolder);
    if (handle) {
      setFolderHandle(handle);
    }
  }, []);

  const selectFolder = useCallback(async () => {
    try {
      // Check if the File System Access API is supported
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker();
        const folderPath = dirHandle.name;
        updateSaveFolder(folderPath, dirHandle);
        return { folderPath, handle: dirHandle };
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
        return { folderPath: saveFolder, handle: null };
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      return { folderPath: saveFolder, handle: folderHandle };
    }
  }, [updateSaveFolder, saveFolder, folderHandle]);

  const resetToDefault = useCallback(() => {
    updateSaveFolder(DEFAULT_FOLDER);
    setFolderHandle(null);
  }, [updateSaveFolder]);

  const saveToFolder = useCallback(async (fileName: string, blob: Blob) => {
    try {
      if (folderHandle && 'showDirectoryPicker' in window) {
        // Use File System Access API to save directly to selected folder
        const fileHandle = await folderHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      } else {
        // Fallback to regular download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
      }
    } catch (error) {
      console.error('Error saving file:', error);
      // Fallback to regular download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return false;
    }
  }, [folderHandle]);

  return {
    saveFolder,
    selectFolder,
    resetToDefault,
    updateSaveFolder,
    saveToFolder,
    folderHandle,
  };
};
