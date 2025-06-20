
// Re-export from existing background removal functionality
export { removeBackground, loadImage } from '@/services/compilation/uploadService';

export const enhanceImageForTheme = async (imageFile: File): Promise<Blob> => {
  const img = await loadImage(imageFile);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  // Draw original image
  ctx.drawImage(img, 0, 0);

  // Apply theme-fitting color adjustments
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Enhance contrast and apply slight blue tint to match slate theme
  for (let i = 0; i < data.length; i += 4) {
    // Increase contrast
    data[i] = Math.min(255, data[i] * 1.2);     // Red
    data[i + 1] = Math.min(255, data[i + 1] * 1.2); // Green
    data[i + 2] = Math.min(255, data[i + 2] * 1.3); // Blue (slight enhancement)
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create enhanced blob'));
    }, 'image/jpeg', 0.9);
  });
};
