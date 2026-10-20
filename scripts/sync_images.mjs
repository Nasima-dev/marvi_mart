import fs from 'fs';
import path from 'path';

const root = process.cwd();
const srcImagesDir = path.join(root, 'src/assets/images');
const publicImagesDir = path.join(root, 'public/images');
const publicSrcAssetsImagesDir = path.join(root, 'public/src/assets/images');

fs.mkdirSync(publicImagesDir, { recursive: true });
fs.mkdirSync(publicSrcAssetsImagesDir, { recursive: true });

if (fs.existsSync(srcImagesDir)) {
  const files = fs.readdirSync(srcImagesDir);
  let copiedCount = 0;
  for (const file of files) {
    const srcFile = path.join(srcImagesDir, file);
    const dest1 = path.join(publicImagesDir, file);
    const dest2 = path.join(publicSrcAssetsImagesDir, file);

    // Copy to public/images
    if (!fs.existsSync(dest1) || fs.statSync(srcFile).mtime > fs.statSync(dest1).mtime) {
      fs.copyFileSync(srcFile, dest1);
    }
    // Copy to public/src/assets/images for full backwards compatibility
    if (!fs.existsSync(dest2) || fs.statSync(srcFile).mtime > fs.statSync(dest2).mtime) {
      fs.copyFileSync(srcFile, dest2);
    }
    copiedCount++;
  }
  console.log(`[sync_images] Verified and synchronized ${copiedCount} product assets to public/images and public/src/assets/images.`);
}

if (fs.existsSync(path.join(root, 'netlify.toml'))) {
  fs.copyFileSync(path.join(root, 'netlify.toml'), path.join(root, 'public/netlify.toml'));
}

