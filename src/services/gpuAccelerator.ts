
// WebGPU type definitions (since they're not in the standard lib yet)
interface GPUDevice {
  createBuffer(descriptor: any): any;
  createTexture(descriptor: any): any;
  queue: {
    submit(commandBuffers: any[]): void;
    writeBuffer(buffer: any, bufferOffset: number, data: any): void;
  };
}

interface GPUAdapter {
  requestDevice(): Promise<GPUDevice>;
}

interface GPU {
  requestAdapter(options?: { powerPreference?: string }): Promise<GPUAdapter | null>;
}

// Extend Navigator interface
declare global {
  interface Navigator {
    gpu?: GPU;
  }
}

class GPUAccelerator {
  private static instance: GPUAccelerator;
  private device: GPUDevice | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGL2RenderingContext | null = null;

  private constructor() {}

  static getInstance(): GPUAccelerator {
    if (!GPUAccelerator.instance) {
      GPUAccelerator.instance = new GPUAccelerator();
    }
    return GPUAccelerator.instance;
  }

  async initialize(): Promise<boolean> {
    console.log('GPUAccelerator: Initializing GPU acceleration...');
    
    try {
      // Try WebGPU first (most modern)
      if (navigator.gpu) {
        const adapter = await navigator.gpu.requestAdapter({
          powerPreference: 'high-performance'
        });
        
        if (adapter) {
          this.device = await adapter.requestDevice();
          console.log('GPUAccelerator: WebGPU initialized successfully');
          return true;
        }
      }

      // Fallback to WebGL2 for GPU compute
      this.canvas = document.createElement('canvas');
      this.gl = this.canvas.getContext('webgl2', {
        powerPreference: 'high-performance',
        antialias: false,
        alpha: false
      });

      if (this.gl) {
        console.log('GPUAccelerator: WebGL2 initialized for GPU compute');
        console.log('GPU Info:', {
          vendor: this.gl.getParameter(this.gl.VENDOR),
          renderer: this.gl.getParameter(this.gl.RENDERER),
          version: this.gl.getParameter(this.gl.VERSION)
        });
        return true;
      }

      console.warn('GPUAccelerator: No GPU acceleration available');
      return false;
    } catch (error) {
      console.error('GPUAccelerator: Failed to initialize:', error);
      return false;
    }
  }

  async processVideoFrameGPU(videoElement: HTMLVideoElement, width: number, height: number): Promise<ImageData> {
    if (!this.gl || !this.canvas) {
      throw new Error('GPU not initialized');
    }

    // Set canvas size
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);

    // Create texture from video
    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, videoElement);
    
    // GPU-accelerated processing can be added here
    // For now, just copy to canvas for fast thumbnail generation
    const framebuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);

    const pixels = new Uint8Array(width * height * 4);
    this.gl.readPixels(0, 0, width, height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);

    // Cleanup
    this.gl.deleteTexture(texture);
    this.gl.deleteFramebuffer(framebuffer);

    return new ImageData(new Uint8ClampedArray(pixels), width, height);
  }

  getGPUInfo(): string {
    if (this.device) {
      return 'WebGPU (High Performance)';
    } else if (this.gl) {
      const renderer = this.gl.getParameter(this.gl.RENDERER);
      return `WebGL2: ${renderer}`;
    }
    return 'CPU Only';
  }

  isGPUAvailable(): boolean {
    return this.device !== null || this.gl !== null;
  }
}

export default GPUAccelerator;
