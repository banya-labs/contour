import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const rootDir = process.cwd();

// Clean orange circle with subtle 2px breathing margin in a 32x32 viewbox
const SVG_CONTENT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#FA3600"/>
</svg>
`;

// Helper to assemble PNGs into an ICO file
function createIco(images) {
  // images: Array<{ width: number, height: number, buffer: Buffer }>
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(images.length, 4); // Number of images

  let offset = 6 + images.length * 16;
  const dirEntries = [];
  const imageBuffers = [];

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

async function run() {
  console.log("Generating favicons and brand icons...");
  const svgBuffer = Buffer.from(SVG_CONTENT, "utf-8");

  // Save SVG icons
  const svgTargets = [
    path.join(rootDir, "public", "icon.svg"),
    path.join(rootDir, "public", "favicon.svg"),
    path.join(rootDir, "src", "app", "icon.svg"),
  ];

  for (const target of svgTargets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, SVG_CONTENT, "utf-8");
    console.log(`Wrote ${path.relative(rootDir, target)}`);
  }

  // Generate PNG buffers for ICO
  const p16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const p32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const p48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();

  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: p16 },
    { width: 32, height: 32, buffer: p32 },
    { width: 48, height: 48, buffer: p48 },
  ]);

  const icoTargets = [
    path.join(rootDir, "public", "favicon.ico"),
    path.join(rootDir, "src", "app", "favicon.ico"),
  ];

  for (const target of icoTargets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, icoBuffer);
    console.log(`Wrote ${path.relative(rootDir, target)}`);
  }

  // Generate Apple Touch Icon (180x180)
  const p180 = await sharp(svgBuffer).resize(180, 180).png().toBuffer();
  const appleTargets = [
    path.join(rootDir, "public", "apple-icon.png"),
    path.join(rootDir, "src", "app", "apple-icon.png"),
  ];
  for (const target of appleTargets) {
    fs.writeFileSync(target, p180);
    console.log(`Wrote ${path.relative(rootDir, target)}`);
  }

  // Generate PWA icons (192 and 512)
  const p192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();
  const p512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();

  fs.writeFileSync(path.join(rootDir, "public", "icon-192.png"), p192);
  console.log("Wrote public/icon-192.png");
  fs.writeFileSync(path.join(rootDir, "public", "icon-512.png"), p512);
  console.log("Wrote public/icon-512.png");

  console.log("All favicon and brand icon assets generated successfully!");
}

run().catch((err) => {
  console.error("Error generating favicons:", err);
  process.exit(1);
});
