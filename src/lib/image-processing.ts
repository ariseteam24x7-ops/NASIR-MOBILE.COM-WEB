/**
 * Nasir Mobile Dubai - High-Fidelity Image Processing Service
 * Automatically resizes and optimizes any uploaded product image to 1080 x 1080 square resolution.
 */

export interface ProcessedImageResult {
  fileName: string;
  mimeType: string;
  data: string; // Base64 data URL
  width: number;
  height: number;
}

/**
 * Resizes, formats, and centers an image onto an exact 1080 x 1080 canvas.
 * - Fits any rectangular, horizontal, or vertical photo
 * - Centers the device with clean studio dark padding (#151419)
 * - Applies high-resolution bicubic interpolation
 * - Exports as high-definition JPEG
 */
export const processImageTo1080x1080 = (
  file: File,
  fitMode: 'contain' | 'cover' = 'contain'
): Promise<ProcessedImageResult> => {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return reject(new Error(`"${file.name}" is not a supported image file.`));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () =>
        reject(new Error(`Could not decode image "${file.name}". Please ensure it is a valid PNG, JPG, or WebP.`));
      img.onload = () => {
        try {
          const TARGET_DIMENSION = 1080;
          const canvas = document.createElement('canvas');
          canvas.width = TARGET_DIMENSION;
          canvas.height = TARGET_DIMENSION;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('HTML5 Canvas context is unavailable.'));
          }

          // Enable high quality bicubic interpolation
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Fill canvas with deep studio dark background (#151419) matching the store aesthetic
          ctx.fillStyle = '#151419';
          ctx.fillRect(0, 0, TARGET_DIMENSION, TARGET_DIMENSION);

          const srcW = img.naturalWidth || img.width;
          const srcH = img.naturalHeight || img.height;

          let drawW: number;
          let drawH: number;
          let drawX: number;
          let drawY: number;

          if (fitMode === 'cover') {
            // Fill entire 1080x1080 square
            const scale = Math.max(TARGET_DIMENSION / srcW, TARGET_DIMENSION / srcH);
            drawW = srcW * scale;
            drawH = srcH * scale;
            drawX = (TARGET_DIMENSION - drawW) / 2;
            drawY = (TARGET_DIMENSION - drawH) / 2;
          } else {
            // 'contain' (Recommended: entire hardware device is 100% visible without clipping)
            // Apply slight 95% margin so edges don't touch boundaries
            const marginScale = 0.95;
            const scale = Math.min((TARGET_DIMENSION * marginScale) / srcW, (TARGET_DIMENSION * marginScale) / srcH);
            drawW = srcW * scale;
            drawH = srcH * scale;
            drawX = (TARGET_DIMENSION - drawW) / 2;
            drawY = (TARGET_DIMENSION - drawH) / 2;
          }

          ctx.drawImage(img, drawX, drawY, drawW, drawH);

          // Export as high quality JPEG (92% quality gives crisp detail and optimal loading)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          const safeName = file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[^a-zA-Z0-9_-]/g, '_');
          const outFileName = `nasir_${safeName}_1080x1080_${Date.now()}.jpg`;

          resolve({
            fileName: outFileName,
            mimeType: 'image/jpeg',
            data: dataUrl,
            width: TARGET_DIMENSION,
            height: TARGET_DIMENSION,
          });
        } catch (err: any) {
          reject(new Error(`Failed to process image: ${err?.message || err}`));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
};
