export function applyVintageFilter(
  source: HTMLVideoElement | HTMLImageElement | ImageBitmap,
  targetCanvas: HTMLCanvasElement
): void {
  const ctx = targetCanvas.getContext("2d")!;
  const w = targetCanvas.width;
  const h = targetCanvas.height;

  ctx.drawImage(source, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    data[i] = Math.min(255, r * 0.85 + gray * 0.15 + 20);
    data[i + 1] = Math.min(255, g * 0.78 + gray * 0.1 + 12);
    data[i + 2] = Math.min(255, b * 0.68 + gray * 0.08 + 5);

    const grain = (Math.random() - 0.5) * 30;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));

    data[i] = Math.min(255, data[i] * 0.95);
    data[i + 1] = Math.min(255, data[i + 1] * 0.95);
    data[i + 2] = Math.min(255, data[i + 2] * 0.95);
  }

  ctx.putImageData(imageData, 0, 0);
}

export function captureFrameWithVintageFilter(
  video: HTMLVideoElement,
  width: number,
  height: number,
  frameUrl: string,
): Promise<Blob> {
  return loadImage(frameUrl).then((frame) => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;

    applyVintageFilter(video, tempCanvas);

    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = frame.width;
    finalCanvas.height = frame.height;
    const ctx = finalCanvas.getContext("2d")!;

    // ponytail: fill entire canvas, frame PNG opaque areas cover edges
    ctx.drawImage(tempCanvas, 0, 0, frame.width, frame.height);
    ctx.drawImage(frame, 0, 0);

    return new Promise<Blob>((resolve, reject) => {
      finalCanvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        },
        "image/jpeg",
        0.85,
      );
    });
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}