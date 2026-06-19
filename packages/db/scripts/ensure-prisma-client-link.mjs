import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.resolve(scriptDir, '..', 'node_modules', '@prisma', 'client');
const linkPath = path.join(clientDir, '.prisma');
const realClientDir = fs.realpathSync(clientDir);
const target = path.join(realClientDir, '..', '..', '.prisma');
const generatedDefault = path.join(target, 'client', 'default.js');

if (!fs.existsSync(generatedDefault)) {
  throw new Error(`Expected generated Prisma client at ${generatedDefault}`);
}

let currentTarget = null;
if (fs.existsSync(linkPath)) {
  try {
    currentTarget = fs.readlinkSync(linkPath);
  } catch {
    currentTarget = null;
  }
}

if (currentTarget !== target) {
  fs.rmSync(linkPath, { recursive: true, force: true });
  fs.symlinkSync(target, linkPath, 'junction');
}

console.log(`Prisma client link ready: ${linkPath} -> ${target}`);
