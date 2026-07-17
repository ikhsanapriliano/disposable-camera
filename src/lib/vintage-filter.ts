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

function drawVintagePaper(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = "#f0ead6";
  ctx.fillRect(0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise - 5));
  }
  ctx.putImageData(imageData, 0, 0);

  const gradient = ctx.createRadialGradient(w * 0.5, h * 0.4, w * 0.2, w * 0.5, h * 0.5, w * 0.8);
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(0.7, "rgba(180,160,130,0.08)");
  gradient.addColorStop(1, "rgba(120,100,70,0.25)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

function drawPolaroidFrame(
  ctx: CanvasRenderingContext2D,
  imageW: number,
  imageH: number,
  frameW: number,
  frameH: number,
  eventName?: string
): void {
  const padX = (frameW - imageW) / 2;
  const padTop = (frameH - imageH - 6) / 2;

  drawVintagePaper(ctx, frameW, frameH);

  ctx.strokeStyle = "rgba(180,160,130,0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, frameW - 12, frameH - 12);

  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 6;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = "#faf8f2";
  ctx.fillRect(padX, padTop, imageW, imageH);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  ctx.strokeStyle = "#d4c5a9";
  ctx.lineWidth = 1;
  ctx.strokeRect(padX, padTop, imageW, imageH);

  if (eventName) {
    const bottomY = padTop + imageH + imageH * 0.04;
    const fontSize = Math.max(16, Math.round(imageW * 0.03));
    ctx.font = `italic ${fontSize}px Georgia, serif`;
    ctx.fillStyle = "#8b7355";
    ctx.textAlign = "center";
    ctx.fillText(eventName, frameW / 2, bottomY);
  }
}

export function captureFrameWithVintageFilter(
  video: HTMLVideoElement,
  width: number,
  height: number,
  eventName?: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;

    applyVintageFilter(video, tempCanvas);

    const framePadX = Math.round(width * 0.1);
    const framePadTop = Math.round(height * 0.12);
    const framePadBottom = Math.round(height * 0.18);
    const finalWidth = width + framePadX * 2;
    const finalHeight = height + framePadTop + framePadBottom;

    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = finalWidth;
    finalCanvas.height = finalHeight;

    const ctx = finalCanvas.getContext("2d")!;
    const padX = (finalWidth - width) / 2;

    drawPolaroidFrame(ctx, width, height, finalWidth, finalHeight, eventName);
    ctx.drawImage(tempCanvas, padX, framePadTop, width, height);

    finalCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob"));
      },
      "image/jpeg",
      0.85
    );
  });
}