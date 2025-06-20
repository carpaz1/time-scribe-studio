
import { removeBackground, loadImage } from '@/services/imageProcessor';

export interface BackgroundSettings {
  type: 'default' | 'single' | 'folder';
  imagePath?: string;
  folderPath?: string;
  opacity: number;
  blur: number;
  aiEnhanced: boolean;
  overlayColor: string;
}

export class BackgroundService {
  private static currentBackground: string | null = null;
  private static settings: BackgroundSettings = {
    type: 'default',
    opacity: 0.15,
    blur: 3,
    aiEnhanced: false,
    overlayColor: 'slate-900'
  };

  static async selectSingleImage(): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        resolve(file || null);
      };
      input.click();
    });
  }

  static async selectImageFolder(): Promise<FileList | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.webkitdirectory = true;
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        resolve(files);
      };
      input.click();
    });
  }

  static async processImageForBackground(file: File, settings: Partial<BackgroundSettings> = {}): Promise<string> {
    try {
      const img = await loadImage(file);
      let processedBlob = file;

      // Apply AI enhancement if requested
      if (settings.aiEnhanced) {
        processedBlob = await removeBackground(img);
      }

      // Create canvas for further processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Draw the image
      ctx.drawImage(img, 0, 0);

      // Apply theme-fitting filters
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = `rgba(30, 41, 59, 0.4)`; // slate-800 overlay
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Reset composite operation and apply final adjustments
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = settings.opacity || 0.15;

      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('Error processing background image:', error);
      throw error;
    }
  }

  static applyBackground(imageUrl: string, settings: BackgroundSettings) {
    this.currentBackground = imageUrl;
    this.settings = { ...this.settings, ...settings };

    const style = document.createElement('style');
    style.id = 'custom-background-style';
    
    // Remove existing style if present
    const existing = document.getElementById('custom-background-style');
    if (existing) existing.remove();

    const blurValue = settings.blur || 3;
    const opacity = settings.opacity || 0.15;

    style.textContent = `
      .custom-background::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url('${imageUrl}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        opacity: ${opacity};
        filter: blur(${blurValue}px);
        z-index: -1;
        pointer-events: none;
      }
      
      .custom-background::after {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, 
          rgba(15, 23, 42, 0.8) 0%, 
          rgba(30, 41, 59, 0.7) 50%, 
          rgba(15, 23, 42, 0.8) 100%);
        z-index: -1;
        pointer-events: none;
      }
    `;

    document.head.appendChild(style);
  }

  static removeBackground() {
    this.currentBackground = null;
    const existing = document.getElementById('custom-background-style');
    if (existing) existing.remove();
  }

  static getSettings(): BackgroundSettings {
    return { ...this.settings };
  }

  static randomFromFolder(files: FileList): File | null {
    if (files.length === 0) return null;
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return null;
    return imageFiles[Math.floor(Math.random() * imageFiles.length)];
  }
}
