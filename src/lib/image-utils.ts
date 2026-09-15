/**
 * Utility for client-side image compression to .webp format.
 * Preserves high resolution and readability (max-width 1200px)
 * while minimizing file size (~60-120 KB) with 0.82 quality.
 */
export async function compressImageToWebP(
  file: File,
  maxWidth = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not in browser, return error
    if (typeof window === "undefined") {
      reject(new Error("Image compression is only available in browser environment."));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Scale down only if larger than maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context could not be created."));
        return;
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const webpDataUrl = canvas.toDataURL("image/webp", quality);
        resolve(webpDataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image file."));
    };

    img.src = objectUrl;
  });
}
