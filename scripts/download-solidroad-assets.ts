import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

async function downloadFile(url: string, dest: string) {
  return new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            return downloadFile(redirectUrl, dest).then(resolve).catch(reject);
          }
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

async function main() {
  const outDir = path.join(process.cwd(), "public", "images", "solidroad");
  fs.mkdirSync(outDir, { recursive: true });

  console.log("Launching browser to inspect solidroad.com assets...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto("https://solidroad.com/", { waitUntil: "networkidle", timeout: 45000 });

  // Extract all <img> src, background-image urls, and svg definitions
  const images = await page.evaluate(() => {
    const imgs: { alt: string; src: string }[] = [];
    document.querySelectorAll("img").forEach((img) => {
      if (img.src) {
        imgs.push({ alt: img.alt || "image", src: img.src });
      }
    });

    // Also look for background images in computed styles
    document.querySelectorAll("*").forEach((el) => {
      const bg = window.getComputedStyle(el).backgroundImage;
      if (bg && bg.startsWith("url(")) {
        const match = bg.match(/url\(["']?([^"']+)["']?\)/);
        if (match && match[1]) {
          imgs.push({ alt: "bg-image", src: match[1] });
        }
      }
    });

    return imgs;
  });

  console.log(`Found ${images.length} image references.`);

  // Save the manifest
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(images, null, 2));

  let count = 0;
  for (const item of images) {
    try {
      if (!item.src.startsWith("http")) continue;
      const urlObj = new URL(item.src);
      const ext = path.extname(urlObj.pathname) || ".png";
      const filename = `asset_${count++}_${path.basename(urlObj.pathname, ext).slice(0, 20)}${ext}`;
      const destPath = path.join(outDir, filename);
      console.log(`Downloading: ${item.src} -> ${filename}`);
      await downloadFile(item.src, destPath);
    } catch (e) {
      console.error(`Error downloading ${item.src}:`, e);
    }
  }

  // Also take high-res section screenshots
  console.log("Capturing high-res component screenshots...");
  await page.screenshot({ path: path.join(outDir, "full_solidroad.png"), fullPage: true });

  await browser.close();
  console.log("Done!");
}

main().catch(console.error);
