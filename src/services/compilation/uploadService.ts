
import { VideoClip } from '@/types/timeline';
import { FileUploadService } from '../fileUploadService';
import { FileGroup, ProgressCallback } from './types';

export class UploadService {
  static groupClipsByFile(clips: VideoClip[]): Map<string, FileGroup> {
    const fileGroups = new Map<string, FileGroup>();
    
    clips.forEach((clip) => {
      const fileKey = `${clip.sourceFile.name}_${clip.sourceFile.size}`;
      if (!fileGroups.has(fileKey)) {
        fileGroups.set(fileKey, { file: clip.sourceFile, clips: [] });
      }
      fileGroups.get(fileKey)!.clips.push(clip);
    });

    return fileGroups;
  }

  static async uploadFiles(
    fileGroups: Map<string, FileGroup>,
    onProgress?: ProgressCallback
  ): Promise<Map<string, string>> {
    const uploadResults = new Map<string, string>();
    let uploadedCount = 0;
    
    for (const [fileKey, fileGroup] of fileGroups) {
      try {
        const fileId = await FileUploadService.uploadFileInChunks(
          fileGroup.file,
          (fileProgress) => {
            const overallProgress = 25 + ((uploadedCount + fileProgress / 100) / fileGroups.size) * 35;
            onProgress?.(overallProgress, `Uploading ${fileGroup.file.name}... ${Math.round(fileProgress)}%`);
          }
        );
        
        uploadResults.set(fileKey, fileId);
        uploadedCount++;
        
        onProgress?.(25 + (uploadedCount / fileGroups.size) * 35, `Uploaded ${uploadedCount}/${fileGroups.size} files`);
      } catch (uploadError) {
        console.error(`UploadService: Failed to upload ${fileGroup.file.name}:`, uploadError);
        throw new Error(`Upload failed for ${fileGroup.file.name}`);
      }
    }

    return uploadResults;
  }
}
