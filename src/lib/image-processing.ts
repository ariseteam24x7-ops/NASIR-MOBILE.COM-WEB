/**
 * Nasir Mobile Dubai - Natural High-Fidelity Image Processing Service
 * Preserves native photo dimensions, transparent PNG alpha channels, and natural aspect ratios.
 * Restores original image behavior without forcing 1080x1080 square boxes or dark letterboxing.
 */

export interface ProcessedImageResult {
  fileName: string;
  mimeType: string;
  data: string; // Base64 data URL
  width: number;
  height: number;
}

/**
 * Optimizes an uploaded image while preserving its natural aspect ratio, resolution, and transparency.
 * - Retains original dimensions up to max 1920px (downscaled proportionally if massive)
 * - Preserves PNG transparency (no artificial black borders or background fills)
 * - Retains original aspect ratio without distortion
 */
export const processProductImage = (
  file: File,
  _fitMode: 'contain' | 'cover' = 'contain'
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
          const naturalW = img.naturalWidth || img.width;
          const naturalH = img.naturalHeight || img.height;

          // Cap maximum dimension at 1920px for crisp high-resolution without memory blowup
          const MAX_DIMENSION = 1920;
          let targetW = naturalW;
          let targetH = naturalH;

          if (naturalW > MAX_DIMENSION || naturalH > MAX_DIMENSION) {
            if (naturalW > naturalH) {
              targetW = MAX_DIMENSION;
              targetH = Math.round((naturalH * MAX_DIMENSION) / naturalW);
            } else {
              targetH = MAX_DIMENSION;
              targetW = Math.round((naturalW * MAX_DIMENSION) / naturalH);
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('HTML5 Canvas context is unavailable.'));
          }

          // Enable high quality bicubic interpolation
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          const isPng = file.type.includes('png');
          const isWebp = file.type.includes('webp');

          // For PNG and WebP, keep transparent background intact (do NOT fill with dark color)
          // For JPEG, fill transparent areas with clean white or transparent
          if (!isPng && !isWebp) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetW, targetH);
          }

          ctx.drawImage(img, 0, 0, targetW, targetH);

          // Export with appropriate MIME type
          let outMime = isPng ? 'image/png' : isWebp ? 'image/webp' : 'image/jpeg';
          let outExt = isPng ? 'png' : isWebp ? 'webp' : 'jpg';
          const dataUrl = canvas.toDataURL(outMime, isPng ? undefined : 0.92);

          const safeName = file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .slice(0, 40);
          const outFileName = `product_${safeName}_${Date.now()}.${outExt}`;

          resolve({
            fileName: outFileName,
            mimeType: outMime,
            data: dataUrl,
            width: targetW,
            height: targetH,
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

// Backward-compatible alias
export const processImageTo1080x1080 = processProductImage;
