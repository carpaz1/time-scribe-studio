
export class FileUploadService {
  private static readonly MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB limit
  private static readonly CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

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

    const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);
    const fileId = `${Date.now()}-${file.name}`;
    
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

      try {
        const response = await fetch('http://localhost:4000/upload-chunk', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Chunk upload failed: ${response.status}`);
        }

        const progress = ((chunkIndex + 1) / totalChunks) * 100;
        onProgress?.(progress);
      } catch (error) {
        console.error(`Failed to upload chunk ${chunkIndex}:`, error);
        throw error;
      }
    }

    return fileId;
  }
}
