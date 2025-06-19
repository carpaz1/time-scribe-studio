
import JSZip from 'jszip';
import { VideoClip } from '@/types/timeline';

export class ZipDownloaderService {
  static async downloadClipsAsZip(clips: VideoClip[]): Promise<void> {
    console.log('ZipDownloaderService: Starting ZIP download for', clips.length, 'clips');
    
    if (clips.length === 0) {
      throw new Error('No clips to download');
    }

    const zip = new JSZip();
    const processedFiles = new Set<string>();

    // Add unique video files to ZIP
    for (const clip of clips) {
      const fileKey = `${clip.sourceFile.name}_${clip.sourceFile.size}`;
      
      if (!processedFiles.has(fileKey)) {
        console.log('Adding file to ZIP:', clip.sourceFile.name);
        zip.file(clip.sourceFile.name, clip.sourceFile);
        processedFiles.add(fileKey);
      }
    }

    // Create timeline metadata
    const timelineData = {
      clips: clips.map(clip => ({
        id: clip.id,
        name: clip.name,
        fileName: clip.sourceFile.name,
        startTime: clip.startTime,
        duration: clip.duration,
        position: clip.position
      })),
      exportDate: new Date().toISOString(),
      totalClips: clips.length,
      uniqueFiles: processedFiles.size
    };

    zip.file('timeline-metadata.json', JSON.stringify(timelineData, null, 2));

    console.log('Generating ZIP file...');
    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 1 } // Fast compression
    });

    // Download the ZIP
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timeline-clips-${Date.now()}.zip`;
    link.click();
    URL.revokeObjectURL(url);
    
    console.log('ZIP download initiated');
  }
}
