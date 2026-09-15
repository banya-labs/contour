const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function compressImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const stat = fs.statSync(filePath);
  const originalSize = stat.size;

  if (ext === '.png') {
    const tempPath = filePath + '.tmp';
    try {
      await sharp(filePath)
        .png({ quality: 80, compressionLevel: 9, effort: 7 })
        .toFile(tempPath);

      const newStat = fs.statSync(tempPath);
      if (newStat.size < originalSize) {
        fs.unlinkSync(filePath);
        fs.renameSync(tempPath, filePath);
        console.log(`[COMPRESSED] ${path.basename(filePath)}: ${(originalSize / 1024 / 1024).toFixed(2)} MB -> ${(newStat.size / 1024 / 1024).toFixed(2)} MB (${Math.round((1 - newStat.size / originalSize) * 100)}% reduction)`);
      } else {
        fs.unlinkSync(tempPath);
        console.log(`[SKIPPED] ${path.basename(filePath)}: already optimal`);
      }
    } catch (e) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      console.error(`[ERROR] ${path.basename(filePath)}:`, e.message);
    }
  } else if (ext === '.jpg' || ext === '.jpeg') {
    const tempPath = filePath + '.tmp';
    try {
      await sharp(filePath)
        .jpeg({ quality: 80, mozjpeg: true })
        .toFile(tempPath);

      const newStat = fs.statSync(tempPath);
      if (newStat.size < originalSize) {
        fs.unlinkSync(filePath);
        fs.renameSync(tempPath, filePath);
        console.log(`[COMPRESSED] ${path.basename(filePath)}: ${(originalSize / 1024 / 1024).toFixed(2)} MB -> ${(newStat.size / 1024 / 1024).toFixed(2)} MB (${Math.round((1 - newStat.size / originalSize) * 100)}% reduction)`);
      } else {
        fs.unlinkSync(tempPath);
        console.log(`[SKIPPED] ${path.basename(filePath)}: already optimal`);
      }
    } catch (e) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      console.error(`[ERROR] ${path.basename(filePath)}:`, e.message);
    }
  }
}

async function run() {
  const imagesDir = path.join(__dirname, '..', 'public', 'images');
  const files = [
    path.join(imagesDir, 'HERO.png'),
    path.join(imagesDir, 'HERO-original.png'),
    path.join(imagesDir, 'contour-hero-bg.jpg'),
    path.join(imagesDir, 'contour', '0 - luxury-villa-landscape.png'),
    path.join(imagesDir, 'contour', '1 - luxury-villa-hero-house.png'),
    path.join(imagesDir, 'contour', 'luxury-villa-hero.png'),
    path.join(imagesDir, 'contour', 'mountain-hero.png'),
    path.join(imagesDir, 'contour', 'mountain-bottom.png'),
  ];

  for (const f of files) {
    if (fs.existsSync(f)) {
      await compressImage(f);
    }
  }
}

run();
