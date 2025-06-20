interface BackgroundSettings {
  type: 'default' | 'single' | 'folder';
  imagePath?: string;
  folderPath?: string;
  opacity: number;
  blur: number;
  aiEnhanced: boolean;
  imagePosition?: 'center' | 'top-right' | 'bottom-left' | 'pattern';
  imageScale?: number;
  randomInterval?: number; // minutes
  lastRandomChange?: number;
}

export class BackgroundService {
  private static settings: BackgroundSettings = {
    type: 'default',
    opacity: 0.3,
    blur: 1.5,
    aiEnhanced: false,
    imagePosition: 'center',
    imageScale: 1,
    randomInterval: 30,
    lastRandomChange: 0
  };

  private static folderFiles: File[] = [];
  private static randomIntervalId: number | null = null;

  static getSettings(): BackgroundSettings {
    const saved = localStorage.getItem('background-settings');
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }
    return this.settings;
  }

  private static saveSettings(): void {
    localStorage.setItem('background-settings', JSON.stringify(this.settings));
  }

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

  static async selectImageFolder(): Promise<File[] | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.multiple = true;
      input.accept = 'image/*';
      input.onchange = (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        this.folderFiles = imageFiles;
        resolve(imageFiles.length > 0 ? imageFiles : null);
      };
      input.click();
    });
  }

  static randomFromFolder(files: File[]): File | null {
    if (!files || files.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * files.length);
    return files[randomIndex];
  }

  static async processImageForBackground(file: File, settings: BackgroundSettings): Promise<string> {
    console.log('BackgroundService: Processing image with AI enhanced:', settings.aiEnhanced);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Set canvas size based on viewport
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        if (settings.aiEnhanced && settings.imagePosition === 'pattern') {
          // Create repeating pattern
          const pattern = ctx.createPattern(img, 'repeat');
          if (pattern) {
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        } else {
          // Position image based on settings
          let x = 0, y = 0;
          let width = img.width * (settings.imageScale || 1);
          let height = img.height * (settings.imageScale || 1);

          if (settings.aiEnhanced) {
            switch (settings.imagePosition) {
              case 'top-right':
                x = canvas.width - width;
                y = 0;
                break;
              case 'bottom-left':
                x = 0;
                y = canvas.height - height;
                break;
              case 'center':
              default:
                x = (canvas.width - width) / 2;
                y = (canvas.height - height) / 2;
                break;
            }
          } else {
            // Center by default
            x = (canvas.width - width) / 2;
            y = (canvas.height - height) / 2;
          }

          ctx.drawImage(img, x, y, width, height);
        }

        // AI color enhancement
        if (settings.aiEnhanced) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          this.applyAIColorEnhancement(imageData);
          ctx.putImageData(imageData, 0, 0);
        }

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/jpeg', 0.8);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  private static applyAIColorEnhancement(imageData: ImageData): void {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // AI-enhanced color adjustments for slate theme compatibility
      data[i] = Math.min(255, data[i] * 0.7 + 30);     // Red - reduce and add blue tint
      data[i + 1] = Math.min(255, data[i + 1] * 0.8 + 20); // Green - slight reduction
      data[i + 2] = Math.min(255, data[i + 2] * 1.1);     // Blue - enhance for slate theme
    }
  }

  static applyBackground(imageUrl: string, settings: BackgroundSettings): void {
    this.settings = { ...this.settings, ...settings };
    this.saveSettings();

    let styleContent = '';
    
    if (settings.aiEnhanced && settings.imagePosition === 'pattern') {
      // Full screen overlay pattern for entire application
      styleContent = `
        body::before {
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
          opacity: ${settings.opacity};
          filter: blur(${settings.blur}px);
          z-index: -2;
          pointer-events: none;
        }
        .video-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url('${imageUrl}');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          opacity: ${settings.opacity * 0.7};
          filter: blur(${settings.blur * 0.8}px);
          z-index: 1;
          pointer-events: none;
        }
        /* Apply to entire app container */
        #root::before {
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
          opacity: ${settings.opacity * 0.3};
          filter: blur(${settings.blur}px);
          z-index: -1;
          pointer-events: none;
        }
      `;
    } else {
      // Single image positioning
      styleContent = `
        body::before {
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
          opacity: ${settings.opacity};
          filter: blur(${settings.blur}px);
          z-index: -1;
          pointer-events: none;
        }
      `;
    }

    let styleElement = document.getElementById('custom-background-style');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'custom-background-style';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = styleContent;
  }

  static removeBackground(): void {
    const styleElement = document.getElementById('custom-background-style');
    if (styleElement) {
      styleElement.remove();
    }
    this.settings = { ...this.settings, type: 'default' };
    this.saveSettings();
    this.stopRandomInterval();
  }

  static startRandomInterval(intervalMinutes: number): void {
    this.stopRandomInterval();
    if (this.folderFiles.length === 0) return;

    this.randomIntervalId = window.setInterval(async () => {
      const randomFile = this.randomFromFolder(this.folderFiles);
      if (randomFile) {
        const processedUrl = await this.processImageForBackground(randomFile, this.settings);
        this.applyBackground(processedUrl, this.settings);
        this.settings.lastRandomChange = Date.now();
        this.saveSettings();
        console.log('BackgroundService: Random background changed to:', randomFile.name);
      }
    }, intervalMinutes * 60 * 1000);
  }

  static stopRandomInterval(): void {
    if (this.randomIntervalId) {
      clearInterval(this.randomIntervalId);
      this.randomIntervalId = null;
    }
  }
}

export type { BackgroundSettings };
