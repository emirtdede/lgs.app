import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Builds standard ICO file containing 16x16, 32x32, and 48x48 PNG frames.
 */
function buildIco(pngBuffers: { size: number; buffer: Buffer }[]): Buffer {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = ICO
  header.writeUInt16LE(count, 4); // count

  let currentOffset = 6 + count * 16;
  const dirEntries: Buffer[] = [];

  for (const { size, buffer } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buffer.length, 8); // image size
    entry.writeUInt32LE(currentOffset, 12); // image offset
    dirEntries.push(entry);
    currentOffset += buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map((p) => p.buffer)]);
}

async function main() {
  const sourcePath = path.resolve("public/myd.png");
  if (!fs.existsSync(sourcePath)) {
    console.error("Source image not found at:", sourcePath);
    process.exit(1);
  }

  console.log("Found source image at:", sourcePath);

  const iconsDir = path.resolve("public/icons");
  const androidDir = path.resolve("public/icons/android");
  fs.mkdirSync(iconsDir, { recursive: true });
  fs.mkdirSync(androidDir, { recursive: true });

  // Standard sizes to generate
  const standardSizes = [16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 256, 384, 512];

  console.log("Generating standard square icons...");
  for (const size of standardSizes) {
    const outPath = path.join(iconsDir, `icon-${size}.png`);
    await sharp(sourcePath)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        kernel: "lanczos3",
      })
      .png({ compressionLevel: 9, quality: 100 })
      .toFile(outPath);
    console.log(`Generated: ${outPath} (${size}x${size})`);
  }

  // Apple touch icon (180x180)
  const appleTouchPath = path.join(iconsDir, "apple-touch-icon.png");
  await sharp(sourcePath)
    .resize(180, 180, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: "lanczos3",
    })
    .png({ compressionLevel: 9, quality: 100 })
    .toFile(appleTouchPath);
  console.log("Generated:", appleTouchPath);

  // Maskable icons (with 10% safe-zone padding as required by Android / PWA adaptive icon spec)
  console.log("Generating maskable / adaptive icons...");
  for (const size of [192, 512]) {
    const innerSize = Math.round(size * 0.8);
    const innerBuffer = await sharp(sourcePath)
      .resize(innerSize, innerSize, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        kernel: "lanczos3",
      })
      .toBuffer();

    const maskableOutPath = path.join(iconsDir, `icon-maskable-${size}.png`);
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 }, // dark slate theme background for adaptive icon
      },
    })
      .composite([{ input: innerBuffer, gravity: "centre" }])
      .png({ compressionLevel: 9 })
      .toFile(maskableOutPath);
    console.log(`Generated: ${maskableOutPath} (${size}x${size} maskable)`);
  }

  // Android APK density icons (mipmap standards)
  console.log("Generating Android APK launcher densities...");
  const androidDensities = [
    { name: "mipmap-mdpi", size: 48 },
    { name: "mipmap-hdpi", size: 72 },
    { name: "mipmap-xhdpi", size: 96 },
    { name: "mipmap-xxhdpi", size: 144 },
    { name: "mipmap-xxxhdpi", size: 192 },
    { name: "playstore", size: 512 },
  ];

  for (const { name, size } of androidDensities) {
    const apkIconPath = path.join(androidDir, `ic_launcher_${name}.png`);
    await sharp(sourcePath)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        kernel: "lanczos3",
      })
      .png({ compressionLevel: 9 })
      .toFile(apkIconPath);

    // Also round variant for modern Android
    const apkRoundPath = path.join(androidDir, `ic_launcher_round_${name}.png`);
    // Create circular mask
    const circleSvg = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`
    );
    const squareBuffer = await sharp(sourcePath)
      .resize(size, size, {
        fit: "contain",
        background: { r: 15, g: 23, b: 42, alpha: 1 },
        kernel: "lanczos3",
      })
      .png()
      .toBuffer();

    await sharp(squareBuffer)
      .composite([{ input: circleSvg, blend: "dest-in" }])
      .png()
      .toFile(apkRoundPath);

    console.log(`Generated Android icon: ${apkIconPath} & ${apkRoundPath}`);
  }

  // Master logo in public/logo.png and public/icons/logo.png
  await sharp(sourcePath)
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: "lanczos3",
    })
    .png({ compressionLevel: 9 })
    .toFile(path.resolve("public/logo.png"));

  fs.copyFileSync(path.resolve("public/logo.png"), path.join(iconsDir, "logo.png"));
  console.log("Generated: public/logo.png and public/icons/logo.png");

  // Multi-size favicon.ico (16, 32, 48)
  console.log("Generating multi-size favicon.ico...");
  const icoBuffers = [];
  for (const size of [16, 32, 48]) {
    const buf = await sharp(sourcePath)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        kernel: "lanczos3",
      })
      .png()
      .toBuffer();
    icoBuffers.push({ size, buffer: buf });
  }
  const icoFile = buildIco(icoBuffers);
  fs.writeFileSync(path.resolve("public/favicon.ico"), icoFile);
  fs.mkdirSync(path.resolve("src/app"), { recursive: true });
  fs.writeFileSync(path.resolve("src/app/favicon.ico"), icoFile);
  console.log("Generated: public/favicon.ico and src/app/favicon.ico");

  // SVG representation with embedded base64 image
  const b64 = fs.readFileSync(sourcePath).toString("base64");
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="data:image/png;base64,${b64}" width="512" height="512" preserveAspectRatio="xMidYMid meet"/>
</svg>\n`;
  fs.writeFileSync(path.join(iconsDir, "icon.svg"), svgContent);
  console.log("Generated: public/icons/icon.svg");

  console.log("All application icons and logo variants generated successfully!");
}

main().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
