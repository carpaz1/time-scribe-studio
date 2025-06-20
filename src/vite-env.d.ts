
/// <reference types="vite/client" />

// Enhanced WebGPU type definitions for better browser support
interface GPUDevice {
  createBuffer(descriptor: any): any;
  createTexture(descriptor: any): any;
  createShaderModule(descriptor: { code: string }): any;
  createRenderPipeline(descriptor: any): any;
  createComputePipeline(descriptor: any): any;
  createCommandEncoder(): any;
  createBindGroup(descriptor: any): any;
  createBindGroupLayout(descriptor: any): any;
  createPipelineLayout(descriptor: any): any;
  queue: {
    submit(commandBuffers: any[]): void;
    writeBuffer(buffer: any, bufferOffset: number, data: any): void;
  };
}

interface GPUAdapter {
  requestDevice(descriptor?: { requiredFeatures?: string[] }): Promise<GPUDevice>;
  features: Set<string>;
  limits: Record<string, number>;
}

interface GPU {
  requestAdapter(options?: { 
    powerPreference?: 'low-power' | 'high-performance';
    forceFallbackAdapter?: boolean;
  }): Promise<GPUAdapter | null>;
}

// WebGPU constants
declare const GPUTextureUsage: {
  COPY_SRC: number;
  COPY_DST: number;
  TEXTURE_BINDING: number;
  STORAGE_BINDING: number;
  RENDER_ATTACHMENT: number;
};

declare global {
  interface Navigator {
    gpu?: GPU;
  }
  
  interface Window {
    webkitRequestAnimationFrame?: (callback: FrameRequestCallback) => number;
    mozRequestAnimationFrame?: (callback: FrameRequestCallback) => number;
  }
}
