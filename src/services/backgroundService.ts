import { removeBackground, loadImage, enhanceImageForTheme } from '@/services/imageProcessor';

export interface BackgroundSettings {
  type: 'default' | 'single' | 'folder';
  imagePath?: string;
  folderPath?: string;
  opacity: number;
  blur: number;
  aiEnhanced: boolean;
  overlayColor: string;
  imagePosition: 'center' | 'top-right' | 'bottom-left' | 'pattern';
  imageScale: number;
}

export class BackgroundService {
  private static currentBackground: string | null = null;
  private static settings: BackgroundSettings = {
    type: 'default',
    opacity: 0.8,
    blur: 0.3,
    aiEnhanced: false,
    overlayColor: 'slate-900',
    imagePosition: 'center',
    imageScale: 1.0
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
      console.log('BackgroundService: Processing image for background, AI Enhanced:', settings.aiEnhanced);
      
      if (settings.aiEnhanced) {
        console.log('BackgroundService: Applying AI enhancement to image');
        const enhancedBlob = await enhanceImageForTheme(file);
        const enhancedFile = new File([enhancedBlob], file.name, { type: enhancedBlob.type });
        file = enhancedFile;
      }

      const img = await loadImage(file);
      
      // Create canvas for AI-enhanced positioning
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // Set canvas to screen dimensions
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Apply AI positioning logic
      if (settings.aiEnhanced && settings.imagePosition) {
        this.applyAIPositioning(ctx, img, canvas, settings);
      } else {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
      }

      return canvas.toDataURL('image/jpeg', 0.9);
    } catch (error) {
      console.error('Error processing background image:', error);
      return URL.createObjectURL(file);
    }
  }

  private static applyAIPositioning(
    ctx: CanvasRenderingContext2D, 
    img: HTMLImageElement, 
    canvas: HTMLCanvasElement, 
    settings: Partial<BackgroundSettings>
  ) {
    const scale = settings.imageScale || 1.0;
    const position = settings.imagePosition || 'center';
    
    // Create subtle background pattern
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const scaledWidth = img.naturalWidth * scale * 0.4; // Make images smaller for better integration
    const scaledHeight = img.naturalHeight * scale * 0.4;
    
    let x, y;
    
    switch (position) {
      case 'top-right':
        x = canvas.width - scaledWidth - 50;
        y = 50;
        break;
      case 'bottom-left':
        x = 50;
        y = canvas.height - scaledHeight - 50;
        break;
      case 'pattern':
        // Create a tiled pattern
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 2; j++) {
            const patternX = (canvas.width / 3) * i + 20;
            const patternY = (canvas.height / 2) * j + 20;
            ctx.globalAlpha = 0.3;
            ctx.drawImage(img, patternX, patternY, scaledWidth * 0.6, scaledHeight * 0.6);
          }
        }
        ctx.globalAlpha = 1.0;
        return;
      default: // center
        x = (canvas.width - scaledWidth) / 2;
        y = (canvas.height - scaledHeight) / 2;
    }
    
    // Add subtle shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 10;
    ctx.shadowOffsetY = 10;
    
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
  }

  static applyBackground(imageUrl: string, settings: BackgroundSettings) {
    this.currentBackground = imageUrl;
    this.settings = { ...this.settings, ...settings };

    this.removeBackground();

    document.documentElement.classList.add('has-custom-background');
    document.body.classList.add('has-custom-background');

    const style = document.createElement('style');
    style.id = 'custom-background-style';

    const blurValue = settings.blur || 0.3;
    const opacity = settings.opacity || 0.8;

    style.textContent = `
      html.has-custom-background,
      html.has-custom-background body,
      html.has-custom-background body > div,
      html.has-custom-background #root {
        background: transparent !important;
        position: relative;
      }
      
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
        background-size: ${settings.aiEnhanced ? 'contain' : 'cover'} !important;
        background-position: center !important;
        background-repeat: ${settings.imagePosition === 'pattern' ? 'repeat' : 'no-repeat'} !important;
        background-attachment: fixed !important;
        opacity: ${opacity} !important;
        filter: blur(${blurValue}px) brightness(1.1) contrast(1.1) !important;
        z-index: -1000 !important;
        pointer-events: none !important;
      }
      
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
          rgba(15, 23, 42, 0.2) 0%, 
          rgba(30, 41, 59, 0.1) 25%,
          rgba(51, 65, 85, 0.05) 50%,
          rgba(30, 41, 59, 0.1) 75%,
          rgba(15, 23, 42, 0.2) 100%
        ) !important;
        backdrop-filter: blur(0.5px) !important;
        z-index: -999 !important;
        pointer-events: none !important;
      }

      .has-custom-background .bg-slate-900,
      .has-custom-background .bg-slate-800,
      .has-custom-background .bg-slate-700,
      .has-custom-background .bg-gradient-to-br,
      .has-custom-background [class*="bg-slate"],
      .has-custom-background [class*="bg-gradient"] {
        background: rgba(15, 23, 42, 0.05) !important;
        backdrop-filter: blur(1px) !important;
      }

      .has-custom-background > *,
      .has-custom-background div,
      .has-custom-background section {
        position: relative;
        z-index: 1;
      }
    `;

    document.head.appendChild(style);
    console.log('Background applied with AI positioning:', settings);
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
