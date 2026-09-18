import fs from "fs";
import path from "path";
import sharp from "sharp";

const rootDir = process.cwd();
const publicDir = path.resolve(rootDir, "public");

// Strictly just the crisp orange circle (#FA3600)
// 512x512 viewBox with radius 230 leaves a clean ~5% breathing margin so the anti-aliased edge never clips
const SVG_MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <circle cx="256" cy="256" r="230" fill="#FA3600"/>
</svg>`;

const SVG_FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#FA3600"/>
</svg>`;

// Maskable icon with safe zone padding (80% circle) on Near Black #1C1C1A background
const SVG_MASKABLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#1C1C1A"/>
  <circle cx="256" cy="256" r="190" fill="#FA3600"/>
</svg>`;

function createIco(images: Array<{ width: number; height: number; buffer: Buffer }>) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(images.length, 4); // Number of images

  let offset = 6 + images.length * 16;
  const dirEntries: Buffer[] = [];
  const imageBuffers: Buffer[] = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Image size
    entry.writeUInt32LE(offset, 12); // Offset

    dirEntries.push(entry);
    imageBuffers.push(img.buffer);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...imageBuffers]);
}

async function generateIcons() {
  console.log("Generating crisp orange circle icon assets across all apps...");

  const svgBuffer = Buffer.from(SVG_MARK, "utf-8");

  // 1. Write SVG icons
  const svgTargets = [
    path.join(publicDir, "brand/contour-mark.svg"),
    path.join(publicDir, "icon.svg"),
    path.join(publicDir, "favicon.svg"),
    path.join(rootDir, "src/app/icon.svg"),
    path.join(rootDir, "img/logo.svg"),
  ];

  for (const target of svgTargets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (target.endsWith("contour-mark.svg") || target.endsWith("img/logo.svg")) {
      fs.writeFileSync(target, SVG_MARK.trim(), "utf-8");
    } else {
      fs.writeFileSync(target, SVG_FAVICON.trim(), "utf-8");
    }
    console.log(`Wrote ${path.relative(rootDir, target)}`);
  }

  // 2. High-res PWA icon & splash icon (512x512)
  const p512 = await sharp(svgBuffer)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, "icon-512.png"), p512);
  console.log("Wrote public/icon-512.png");

  // 3. Standard PWA icon (192x192)
  const p192 = await sharp(svgBuffer)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, "icon-192.png"), p192);
  console.log("Wrote public/icon-192.png");

  // 4. iOS touch icon (180x180)
  const p180 = await sharp(svgBuffer)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, "apple-icon.png"), p180);
  console.log("Wrote public/apple-icon.png");

  const appAppleIcon = path.join(rootDir, "src/app/apple-icon.png");
  fs.writeFileSync(appAppleIcon, p180);
  console.log("Wrote src/app/apple-icon.png");

  // 5. Maskable icon for Android launcher (512x512) - strictly safe-zoned circle on theme background
  const pMaskable = await sharp(Buffer.from(SVG_MASKABLE, "utf-8"))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, "icon-maskable-512.png"), pMaskable);
  console.log("Wrote public/icon-maskable-512.png");

  // 6. img/logo.png
  fs.mkdirSync(path.join(rootDir, "img"), { recursive: true });
  fs.writeFileSync(path.join(rootDir, "img/logo.png"), p512);
  console.log("Wrote img/logo.png");

  // 7. ICO files (16, 32, 48)
  const p16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const p32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const p48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();

  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: p16 },
    { width: 32, height: 32, buffer: p32 },
    { width: 48, height: 48, buffer: p48 },
  ]);

  const icoTargets = [
    path.join(publicDir, "favicon.ico"),
    path.join(rootDir, "src/app/favicon.ico"),
    path.join(rootDir, "img/logo.ico"),
  ];

  for (const target of icoTargets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, icoBuffer);
    console.log(`Wrote ${path.relative(rootDir, target)}`);
  }

  console.log("All brand icons generated strictly with the crisp orange circle!");
}

generateIcons().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
