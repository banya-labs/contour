import fs from "fs";
import path from "path";
import sharp from "sharp";

async function generateIcons() {
  const publicDir = path.resolve(process.cwd(), "public");
  const heroPath = path.join(publicDir, "images/HERO.png");

  console.log("Reading HERO.png from:", heroPath);

  // We want to generate:
  // 1. icon-512.png (512x512) - High-res PWA icon & splash icon
  // 2. icon-192.png (192x192) - Standard PWA icon
  // 3. apple-icon.png (180x180) - iOS touch icon
  // 4. icon-maskable-512.png (512x512 with safe padding)

  const size = 512;
  const sunRadius = 78;
  const sunX = 350; // positioned towards upper right behind roofline
  const sunY = 165;

  // Let's create an SVG overlay for the background, sun, and Contour typography
  const svgOverlay = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FA3600" stop-opacity="0.4" />
          <stop offset="60%" stop-color="#FA3600" stop-opacity="0.1" />
          <stop offset="100%" stop-color="#1C1C1A" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#141413" />
          <stop offset="50%" stop-color="#1C1C1A" />
          <stop offset="100%" stop-color="#232320" />
        </linearGradient>
      </defs>

      <!-- Background with subtle luxury rounded border -->
      <rect width="${size}" height="${size}" rx="100" fill="url(#bgGrad)" />
      <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="98" fill="none" stroke="#333330" stroke-width="3" opacity="0.6" />

      <!-- Dawn Glow behind the sun -->
      <circle cx="${sunX}" cy="${sunY}" r="${sunRadius * 1.8}" fill="url(#sunGlow)" />

      <!-- The Zambian Red Sun -->
      <circle cx="${sunX}" cy="${sunY}" r="${sunRadius}" fill="#FA3600" />

      <!-- Subtitle badge: REAL ESTATE OS -->
      <g transform="translate(${size / 2}, 462)">
        <text text-anchor="middle" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="700" letter-spacing="4" fill="#999990">REAL ESTATE OS</text>
      </g>
    </svg>
  `;

  // Crop and resize the luxury villa from HERO.png to sit across the mid-bottom
  const villaResized = await sharp(heroPath)
    .resize(470, 264, {
      fit: "cover",
      position: "center",
    })
    .toBuffer();

  // Create SVG for the CONTOUR logo text with the signature red dot
  const logoTextSvg = `
    <svg width="${size}" height="60" viewBox="0 0 ${size} 60" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(${size / 2 - 110}, 42)">
        <!-- "C" -->
        <text x="0" y="0" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="44" font-weight="900" letter-spacing="-1" fill="#FFFFFF">C</text>
        <!-- Red circle "O" -->
        <circle cx="48" cy="-14" r="16" fill="#FA3600" />
        <!-- "NTOUR" -->
        <text x="74" y="0" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="44" font-weight="900" letter-spacing="-1" fill="#FFFFFF">NTOUR</text>
      </g>
    </svg>
  `;

  // Composite the master 512x512 icon
  const masterIconBuffer = await sharp(Buffer.from(svgOverlay))
    .composite([
      {
        input: villaResized,
        top: 155,
        left: 21,
      },
      {
        input: Buffer.from(logoTextSvg),
        top: 395,
        left: 0,
      },
    ])
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  // Save icon-512.png
  await sharp(masterIconBuffer)
    .resize(512, 512)
    .toFile(path.join(publicDir, "icon-512.png"));
  console.log("Created public/icon-512.png");

  // Save icon-192.png
  await sharp(masterIconBuffer)
    .resize(192, 192)
    .toFile(path.join(publicDir, "icon-192.png"));
  console.log("Created public/icon-192.png");

  // Save apple-icon.png (180x180)
  await sharp(masterIconBuffer)
    .resize(180, 180)
    .toFile(path.join(publicDir, "apple-icon.png"));
  console.log("Created public/apple-icon.png");

  // Also update src/app/apple-icon.png
  const appAppleIcon = path.resolve(process.cwd(), "src/app/apple-icon.png");
  if (fs.existsSync(appAppleIcon)) {
    await sharp(masterIconBuffer).resize(180, 180).toFile(appAppleIcon);
    console.log("Updated src/app/apple-icon.png");
  }

  // Create an un-cropped maskable version for Android launcher with safe 10% margins
  const maskableSvg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradMaskable" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#141413" />
          <stop offset="100%" stop-color="#1C1C1A" />
        </linearGradient>
      </defs>
      <!-- Edge-to-edge square for Android maskable background -->
      <rect width="${size}" height="${size}" fill="url(#bgGradMaskable)" />
    </svg>
  `;

  // Scale down the master icon slightly so it sits safely inside the Android circle safe zone
  const safeInner = await sharp(masterIconBuffer)
    .resize(410, 410)
    .toBuffer();

  await sharp(Buffer.from(maskableSvg))
    .composite([
      {
        input: safeInner,
        top: 51,
        left: 51,
      },
    ])
    .png({ quality: 100 })
    .toFile(path.join(publicDir, "icon-maskable-512.png"));
  console.log("Created public/icon-maskable-512.png");

  // Also update public/brand/contour-mark.svg
  const svgMark = `
    <svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="100" fill="#1C1C1A"/>
      <circle cx="350" cy="180" r="90" fill="#FA3600"/>
      <g transform="translate(146, 420)">
        <text x="0" y="0" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="46" font-weight="900" letter-spacing="-1" fill="#FFFFFF">C</text>
        <circle cx="50" cy="-15" r="17" fill="#FA3600" />
        <text x="78" y="0" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="46" font-weight="900" letter-spacing="-1" fill="#FFFFFF">NTOUR</text>
      </g>
      <text x="256" y="465" text-anchor="middle" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="700" letter-spacing="4" fill="#888880">REAL ESTATE OS</text>
    </svg>
  `;
  fs.writeFileSync(path.join(publicDir, "brand/contour-mark.svg"), svgMark.trim());
  console.log("Updated public/brand/contour-mark.svg");

  console.log("All PWA icons generated successfully!");
}

generateIcons().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
