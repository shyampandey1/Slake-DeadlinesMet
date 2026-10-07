const sharp = require('sharp');
const path = 'android/android/app/src/main/res';
const sizes = [
  { dir: 'mipmap-mdpi', size: 48, fg: 108 },
  { dir: 'mipmap-hdpi', size: 72, fg: 162 },
  { dir: 'mipmap-xhdpi', size: 96, fg: 216 },
  { dir: 'mipmap-xxhdpi', size: 144, fg: 324 },
  { dir: 'mipmap-xxxhdpi', size: 192, fg: 432 }
];

async function generate() {
  for (const s of sizes) {
    await sharp('public/icon.svg').resize(s.size, s.size).webp().toFile(`${path}/${s.dir}/ic_launcher.webp`);
    await sharp('public/icon.svg').resize(s.size, s.size).webp().toFile(`${path}/${s.dir}/ic_launcher_round.webp`);
    await sharp('public/icon.svg').resize(s.fg, s.fg).webp().toFile(`${path}/${s.dir}/ic_launcher_foreground.webp`);
  }
  console.log('All mipmap launcher icons generated successfully from icon.svg!');
}

generate().catch(console.error);
