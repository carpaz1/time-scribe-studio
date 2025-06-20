
/// <reference types="vite/client" />

// WebGPU type definitions for better browser support
interface GPUDevice {
  createBuffer(descriptor: any): any;
  createTexture(descriptor: any): any;
  createShaderModule(descriptor: any): any;
  createRenderPipeline(descriptor: any): any;
  createComputePipeline(descriptor: any): any;
  queue: {
    submit(commandBuffers: any[]): void;
    writeBuffer(buffer: any, bufferOffset: number, data: any): void;
  };
}

interface GPUAdapter {
  requestDevice(): Promise<GPUDevice>;
  features: Set<string>;
  limits: Record<string, number>;
}

interface GPU {
  requestAdapter(options?: { 
    powerPreference?: 'low-power' | 'high-performance';
    forceFallbackAdapter?: boolean;
  }): Promise<GPUAdapter | null>;
}

declare global {
  interface Navigator {
    gpu?: GPU;
  }
  
  interface Window {
    webkitRequestAnimationFrame?: (callback: FrameRequestCallback) => number;
    mozRequestAnimationFrame?: (callback: FrameRequestCallback) => number;
  }
}
