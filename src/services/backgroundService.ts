
import { removeBackground, loadImage, enhanceImageForTheme } from '@/services/imageProcessor';

export interface BackgroundSettings {
  type: 'default' | 'single' | 'folder' | 'random';
  imagePath?: string;
  folderPath?: string;
  opacity: number;
  blur: number;
  aiEnhanced: boolean;
  overlayColor: string;
  imagePosition: 'center' | 'top-right' | 'bottom-left' | 'pattern' | 'overlay';
  imageScale: number;
  autoChangeInterval?: number; // minutes
  patternRepeat: 'repeat' | 'space' | 'round';
  overlayEverywhere: boolean;
}

export class BackgroundService {
  private static currentBackground: string | null = null;
  private static autoChangeTimer: NodeJS.Timeout | null = null;
  private static folderImages: File[] = [];
  private static settings: BackgroundSettings = {
    type: 'default',
    opacity: 0.7,
    blur: 0.2,
    aiEnhanced: false,
    overlayColor: 'slate-900',
    imagePosition: 'pattern',
    imageScale: 1.0,
    patternRepeat: 'repeat',
    overlayEverywhere: true
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
        if (files) {
          this.folderImages = Array.from(files).filter(f => f.type.startsWith('image/'));
        }
        resolve(files);
      };
      input.click();
    });
  }

  static async processImageForBackground(file: File, settings: Partial<BackgroundSettings> = {}): Promise<string> {
    try {
      console.log('BackgroundService: Processing image, AI Enhanced:', settings.aiEnhanced);
      
      if (settings.aiEnhanced) {
        const enhancedBlob = await enhanceImageForTheme(file);
        file = new File([enhancedBlob], file.name, { type: enhancedBlob.type });
      }

      const img = await loadImage(file);
      
      if (settings.aiEnhanced && (settings.imagePosition === 'pattern' || settings.overlayEverywhere)) {
        return this.createPatternOverlay(img, settings);
      }

      return URL.createObjectURL(file);
    } catch (error) {
      console.error('Error processing background image:', error);
      return URL.createObjectURL(file);
    }
  }

  private static createPatternOverlay(img: HTMLImageElement, settings: Partial<BackgroundSettings>): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const scale = settings.imageScale || 0.3;
    const patternSize = Math.min(img.naturalWidth, img.naturalHeight) * scale;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create subtle background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Create pattern overlay
    const spacing = patternSize * 1.5;
    const cols = Math.ceil(canvas.width / spacing);
    const rows = Math.ceil(canvas.height / spacing);

    ctx.globalAlpha = 0.15; // Very subtle
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * spacing + (row % 2) * spacing * 0.5; // Offset every other row
        const y = row * spacing;
        
        ctx.save();
        ctx.translate(x + patternSize / 2, y + patternSize / 2);
        ctx.rotate((Math.PI / 180) * (row * col * 15)); // Slight rotation variation
        ctx.drawImage(img, -patternSize / 2, -patternSize / 2, patternSize, patternSize);
        ctx.restore();
      }
    }

    ctx.globalAlpha = 1.0;
    return canvas.toDataURL('image/png', 0.8);
  }

  static applyBackground(imageUrl: string, settings: BackgroundSettings) {
    this.currentBackground = imageUrl;
    this.settings = { ...this.settings, ...settings };

    this.removeBackground();

    const style = document.createElement('style');
    style.id = 'custom-background-style';

    const blurValue = settings.blur || 0.2;
    const opacity = settings.opacity || 0.7;

    if (settings.overlayEverywhere) {
      // Apply overlay to everything including video player
      style.textContent = `
        html, body, #root {
          position: relative;
        }
        
        html::before {
          content: '';
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background-image: url('${imageUrl}') !important;
          background-size: ${settings.imagePosition === 'pattern' ? 'auto' : 'cover'} !important;
          background-position: center !important;
          background-repeat: ${settings.imagePosition === 'pattern' ? 'repeat' : 'no-repeat'} !important;
          opacity: ${opacity} !important;
          filter: blur(${blurValue}px) !important;
          z-index: -2000 !important;
          pointer-events: none !important;
        }
        
        /* Video player overlay */
        .video-container::before {
          content: '';
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background-image: url('${imageUrl}') !important;
          background-size: ${settings.imagePosition === 'pattern' ? 'auto' : 'cover'} !important;
          background-repeat: ${settings.imagePosition === 'pattern' ? 'repeat' : 'no-repeat'} !important;
          opacity: 0.1 !important;
          filter: blur(1px) !important;
          z-index: 1 !important;
          pointer-events: none !important;
        }
      `;
    } else {
      style.textContent = `
        html::before {
          content: '';
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background-image: url('${imageUrl}') !important;
          background-size: cover !important;
          background-position: center !important;
          opacity: ${opacity} !important;
          filter: blur(${blurValue}px) !important;
          z-index: -1000 !important;
          pointer-events: none !important;
        }
      `;
    }

    document.head.appendChild(style);
    this.startAutoChange();
    console.log('Background applied with overlay everywhere:', settings.overlayEverywhere);
  }

  static startAutoChange() {
    if (this.autoChangeTimer) {
      clearInterval(this.autoChangeTimer);
    }

    if (this.settings.autoChangeInterval && this.settings.type === 'folder' && this.folderImages.length > 1) {
      this.autoChangeTimer = setInterval(async () => {
        const randomFile = this.randomFromFolder();
        if (randomFile) {
          const processedUrl = await this.processImageForBackground(randomFile, this.settings);
          this.applyBackground(processedUrl, this.settings);
        }
      }, this.settings.autoChangeInterval * 60 * 1000);
    }
  }

  static removeBackground() {
    this.currentBackground = null;
    if (this.autoChangeTimer) {
      clearInterval(this.autoChangeTimer);
      this.autoChangeTimer = null;
    }
    
    const existing = document.getElementById('custom-background-style');
    if (existing) existing.remove();
  }

  static getSettings(): BackgroundSettings {
    return { ...this.settings };
  }

  static randomFromFolder(): File | null {
    if (this.folderImages.length === 0) return null;
    return this.folderImages[Math.floor(Math.random() * this.folderImages.length)];
  }

  static updateSettings(newSettings: Partial<BackgroundSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }
}
