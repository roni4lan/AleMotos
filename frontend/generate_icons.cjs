const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceFile = 'C:\\Users\\Roni\\.gemini\\antigravity-ide\\brain\\99b193bf-97aa-490c-8b1d-811d7d664b3e\\media__1784661607668.png';
const publicDir = path.join(__dirname, 'public', 'icons');
const assetsDir = path.join(__dirname, 'src', 'assets');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

async function run() {
  // Main logo for assets (to be used in components)
  await fs.promises.copyFile(sourceFile, path.join(assetsDir, 'logo.png'));
  
  // Favicons
  await sharp(sourceFile).resize(16, 16).toFile(path.join(publicDir, 'favicon-16x16.png'));
  await sharp(sourceFile).resize(32, 32).toFile(path.join(publicDir, 'favicon-32x32.png'));
  await sharp(sourceFile).resize(32, 32).toFile(path.join(publicDir, 'favicon.ico')); // fake ico, browsers support png as ico fallback or we just use png
  
  // Apple Touch Icon
  await sharp(sourceFile).resize(180, 180).toFile(path.join(publicDir, 'apple-touch-icon.png'));
  
  // PWA Icons
  await sharp(sourceFile).resize(192, 192).toFile(path.join(publicDir, 'icon-192.png'));
  await sharp(sourceFile).resize(512, 512).toFile(path.join(publicDir, 'icon-512.png'));
  
  // Maskable Icons (adding padding)
  await sharp(sourceFile)
    .resize({ width: 400, height: 400, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .extend({ top: 56, bottom: 56, left: 56, right: 56, background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .resize(192, 192)
    .toFile(path.join(publicDir, 'icon-192-maskable.png'));
    
  await sharp(sourceFile)
    .resize({ width: 400, height: 400, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .extend({ top: 56, bottom: 56, left: 56, right: 56, background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .resize(512, 512)
    .toFile(path.join(publicDir, 'icon-512-maskable.png'));

  console.log('Icons generated successfully.');
}

run().catch(console.error);
