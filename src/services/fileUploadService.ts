
export class FileUploadService {
  private static readonly MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB limit
  private static readonly CHUNK_SIZE = 5 * 1024 * 1024; // Reduced to 5MB chunks for better reliability

  static validateFileSize(file: File): boolean {
    if (file.size > this.MAX_FILE_SIZE) {
      console.error(`File ${file.name} is too large: ${file.size} bytes (max: ${this.MAX_FILE_SIZE})`);
      return false;
    }
    return true;
  }

  static async uploadFileInChunks(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    if (!this.validateFileSize(file)) {
      throw new Error(`File ${file.name} exceeds 2GB size limit`);
    }

    // First check if server supports chunked upload
    try {
      const healthResponse = await fetch('http://localhost:4000/health', {
        method: 'GET',
        timeout: 3000
      } as RequestInit);

      if (!healthResponse.ok) {
        throw new Error('Server not available');
      }
    } catch (error) {
      console.warn('Server health check failed, falling back to direct upload');
      return await this.uploadFileDirect(file, onProgress);
    }

    const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);
    const fileId = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    console.log(`Uploading ${file.name} in ${totalChunks} chunks`);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * this.CHUNK_SIZE;
      const end = Math.min(start + this.CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunkIndex', chunkIndex.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('fileId', fileId);
      formData.append('fileName', file.name);

      let retries = 3;
      while (retries > 0) {
        try {
          const response = await fetch('http://localhost:4000/upload-chunk', {
            method: 'POST',
            body: formData,
            timeout: 30000
          } as RequestInit);

          if (!response.ok) {
            if (response.status === 404) {
              console.warn('Chunked upload not supported, falling back to direct upload');
              return await this.uploadFileDirect(file, onProgress);
            }
            throw new Error(`Chunk upload failed: ${response.status}`);
          }

          const progress = ((chunkIndex + 1) / totalChunks) * 100;
          onProgress?.(progress);
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            console.error(`Failed to upload chunk ${chunkIndex} after retries:`, error);
            // Fall back to direct upload
            return await this.uploadFileDirect(file, onProgress);
          }
          console.warn(`Chunk ${chunkIndex} failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    return fileId;
  }

  private static async uploadFileDirect(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    console.log('Using direct file upload for', file.name);
    
    const formData = new FormData();
    formData.append('videos', file);
    formData.append('clipsData', JSON.stringify([{
      id: `clip_${Date.now()}`,
      name: file.name,
      startTime: 0,
      duration: 1,
      position: 0,
      fileIndex: 0
    }]));

    try {
      const response = await fetch('http://localhost:4000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      onProgress?.(100);
      const result = await response.json();
      return result.jobId || `direct_${Date.now()}`;
    } catch (error) {
      console.error('Direct upload failed:', error);
      throw error;
    }
  }
}
