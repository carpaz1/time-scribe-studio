
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
    opacity: 0.3,
    blur: 2,
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
      
      // Create canvas for processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Draw the image
      ctx.drawImage(img, 0, 0);

      return canvas.toDataURL('image/jpeg', 0.9);
    } catch (error) {
      console.error('Error processing background image:', error);
      // Fallback: create object URL directly from file
      return URL.createObjectURL(file);
    }
  }

  static applyBackground(imageUrl: string, settings: BackgroundSettings) {
    this.currentBackground = imageUrl;
    this.settings = { ...this.settings, ...settings };

    // Remove existing background
    this.removeBackground();

    // Apply background to document body
    document.body.classList.add('custom-background');

    const style = document.createElement('style');
    style.id = 'custom-background-style';

    const blurValue = settings.blur || 2;
    const opacity = settings.opacity || 0.3;

    style.textContent = `
      body.custom-background {
        position: relative;
      }
      
      body.custom-background::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-image: url('${imageUrl}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        background-attachment: fixed;
        opacity: ${opacity};
        filter: blur(${blurValue}px) brightness(0.7) contrast(1.1);
        z-index: -2;
        pointer-events: none;
      }
      
      body.custom-background::after {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(
          135deg, 
          rgba(15, 23, 42, 0.85) 0%, 
          rgba(30, 41, 59, 0.75) 25%,
          rgba(51, 65, 85, 0.7) 50%,
          rgba(30, 41, 59, 0.75) 75%,
          rgba(15, 23, 42, 0.85) 100%
        );
        backdrop-filter: blur(1px);
        z-index: -1;
        pointer-events: none;
      }

      /* Pattern overlay for visual appeal */
      body.custom-background .pattern-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-image: 
          radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
          linear-gradient(45deg, transparent 40%, rgba(255, 255, 255, 0.01) 50%, transparent 60%);
        z-index: -1;
        pointer-events: none;
      }
    `;

    document.head.appendChild(style);

    // Add pattern overlay div if it doesn't exist
    if (!document.querySelector('.pattern-overlay')) {
      const patternDiv = document.createElement('div');
      patternDiv.className = 'pattern-overlay';
      document.body.appendChild(patternDiv);
    }
  }

  static removeBackground() {
    this.currentBackground = null;
    document.body.classList.remove('custom-background');
    
    const existing = document.getElementById('custom-background-style');
    if (existing) existing.remove();

    const patternOverlay = document.querySelector('.pattern-overlay');
    if (patternOverlay) patternOverlay.remove();
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
