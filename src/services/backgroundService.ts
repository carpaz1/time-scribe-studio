
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
    opacity: 0.4,
    blur: 1,
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

    // Apply background with higher specificity
    document.documentElement.classList.add('has-custom-background');
    document.body.classList.add('has-custom-background');

    const style = document.createElement('style');
    style.id = 'custom-background-style';

    const blurValue = settings.blur || 1;
    const opacity = settings.opacity || 0.4;

    style.textContent = `
      /* High specificity background styles */
      html.has-custom-background,
      html.has-custom-background body,
      html.has-custom-background body > div,
      html.has-custom-background #root {
        background: transparent !important;
        position: relative;
      }
      
      /* Main background layer with highest priority */
      html.has-custom-background::before {
        content: '';
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background-image: url('${imageUrl}') !important;
        background-size: cover !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
        background-attachment: fixed !important;
        opacity: ${opacity} !important;
        filter: blur(${blurValue}px) brightness(0.9) contrast(1.1) !important;
        z-index: -1000 !important;
        pointer-events: none !important;
      }
      
      /* Dark overlay for readability */
      html.has-custom-background::after {
        content: '';
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: linear-gradient(
          135deg, 
          rgba(15, 23, 42, 0.7) 0%, 
          rgba(30, 41, 59, 0.6) 25%,
          rgba(51, 65, 85, 0.5) 50%,
          rgba(30, 41, 59, 0.6) 75%,
          rgba(15, 23, 42, 0.7) 100%
        ) !important;
        backdrop-filter: blur(1px) !important;
        z-index: -999 !important;
        pointer-events: none !important;
      }

      /* Override all possible conflicting backgrounds */
      .has-custom-background .bg-slate-900,
      .has-custom-background .bg-slate-800,
      .has-custom-background .bg-slate-700,
      .has-custom-background .bg-gradient-to-br,
      .has-custom-background [class*="bg-slate"],
      .has-custom-background [class*="bg-gradient"] {
        background: rgba(15, 23, 42, 0.3) !important;
        backdrop-filter: blur(2px) !important;
      }

      /* Ensure content visibility */
      .has-custom-background > *,
      .has-custom-background div,
      .has-custom-background section {
        position: relative;
        z-index: 1;
      }

      /* Pattern overlay for visual appeal */
      .pattern-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background-image: 
          radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.04) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.04) 0%, transparent 50%),
          linear-gradient(45deg, transparent 40%, rgba(255, 255, 255, 0.03) 50%, transparent 60%) !important;
        z-index: -998 !important;
        pointer-events: none !important;
      }
    `;

    document.head.appendChild(style);

    // Add pattern overlay div if it doesn't exist
    if (!document.querySelector('.pattern-overlay')) {
      const patternDiv = document.createElement('div');
      patternDiv.className = 'pattern-overlay';
      document.body.appendChild(patternDiv);
    }

    console.log('Background applied with enhanced visibility:', imageUrl);
    console.log('Settings:', settings);
  }

  static removeBackground() {
    this.currentBackground = null;
    document.body.classList.remove('has-custom-background');
    document.documentElement.classList.remove('has-custom-background');
    
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
