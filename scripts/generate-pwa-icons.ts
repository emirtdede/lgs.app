import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i]!;
    for (let j = 0; j < 8; j++) {
      const bit = (crc ^ byte) & 1;
      crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crcVal]);
}

function generatePng(size: number): Buffer {
  const width = size;
  const height = size;

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  const cx = width / 2;
  const cy = height / 2;
  const r = width * 0.42;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const gradRatio = (x + y) / (width + height);
      let red = Math.round(15 + gradRatio * (29 - 15));
      let green = Math.round(23 + gradRatio * (78 - 23));
      let blue = Math.round(42 + gradRatio * (216 - 42));
      const alpha = 255;

      if (dist <= r) {
        const innerRatio = (y - (cy - r)) / (2 * r);
        red = Math.round(37 + innerRatio * (79 - 37));
        green = Math.round(99 + innerRatio * (70 - 99));
        blue = Math.round(235 + innerRatio * (229 - 235));

        const cDist = Math.sqrt(dx * dx + dy * dy);
        if (cDist < r * 0.25) {
          red = Math.min(255, red + 60);
          green = Math.min(255, green + 60);
          blue = Math.min(255, blue + 60);
        }
      }

      rawData[pxOffset] = red;
      rawData[pxOffset + 1] = green;
      rawData[pxOffset + 2] = blue;
      rawData[pxOffset + 3] = alpha;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = makeChunk("IHDR", ihdr);
  const idatChunk = makeChunk("IDAT", deflated);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.resolve(process.cwd(), "public/icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, "icon-192.png"), generatePng(192));
console.log("Generated public/icons/icon-192.png");

fs.writeFileSync(path.join(iconsDir, "icon-512.png"), generatePng(512));
console.log("Generated public/icons/icon-512.png");

fs.writeFileSync(path.join(iconsDir, "apple-touch-icon.png"), generatePng(180));
console.log("Generated public/icons/apple-touch-icon.png");

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="104" fill="url(#bgGrad)"/>
  <circle cx="256" cy="256" r="180" fill="url(#circleGrad)"/>
  <path d="M256 160 L360 215 L256 270 L152 215 Z" fill="#ffffff"/>
  <path d="M190 238 L190 290 Q256 330 322 290 L322 238 Q256 280 190 238 Z" fill="#ffffff" opacity="0.95"/>
  <circle cx="256" cy="350" r="16" fill="#fbbf24"/>
  <text x="256" y="440" font-family="system-ui, -apple-system, sans-serif" font-size="38" font-weight="800" fill="#f8fafc" text-anchor="middle" letter-spacing="3">LGS 2027</text>
</svg>
`;

fs.writeFileSync(path.join(iconsDir, "icon.svg"), svgContent, "utf8");
console.log("Generated public/icons/icon.svg");
