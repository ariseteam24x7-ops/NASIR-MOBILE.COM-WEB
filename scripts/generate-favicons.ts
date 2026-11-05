import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');

// High-contrast, iconic Nasir Mobile "NM" Vector SVG
// Designed to look ultra-crisp at 16x16, 48x48 (Google Search), 180x180 (Apple), and 512x512
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1f1b27" />
      <stop offset="100%" stop-color="#0e0d11" />
    </linearGradient>
    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b838e4" />
      <stop offset="50%" stop-color="#922cb5" />
      <stop offset="100%" stop-color="#691686" />
    </linearGradient>
    <linearGradient id="limeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d4ff6b" />
      <stop offset="50%" stop-color="#b7f34b" />
      <stop offset="100%" stop-color="#80be14" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Solid rounded background for perfect contrast on any browser tab or search theme -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />

  <!-- Outer Cyber Tech Ring with Gradient Stroke -->
  <circle cx="256" cy="256" r="224" fill="none" stroke="url(#purpleGrad)" stroke-width="14" opacity="0.4" />
  <circle cx="256" cy="256" r="224" fill="none" stroke="url(#limeGrad)" stroke-width="16" stroke-dasharray="140 320" stroke-linecap="round" />
  <circle cx="256" cy="256" r="224" fill="none" stroke="#ffffff" stroke-width="10" stroke-dasharray="24 440" stroke-linecap="round" opacity="0.9" />

  <!-- Inner Dark Stage -->
  <circle cx="256" cy="256" r="196" fill="#151419" stroke="rgba(255,255,255,0.08)" stroke-width="4" />

  <!-- MONOGRAM: Bold, High-Clarity Interlocking "NM" (Nasir Mobile) -->
  <g id="monogram">
    <!-- Letter 'N' (Cyber Lime) -->
    <path d="M 112 144 L 148 144 L 148 210 L 200 144 L 236 144 L 236 368 L 200 368 L 200 302 L 148 368 L 112 368 Z" fill="url(#limeGrad)" />

    <!-- Letter 'M' (Royal Purple) -->
    <path d="M 276 368 L 276 144 L 312 144 L 356 266 L 400 144 L 436 144 L 436 368 L 400 368 L 400 235 L 356 317 L 312 235 L 312 368 Z" fill="url(#purpleGrad)" />

    <!-- Central Tech Precision Core Jewel -->
    <circle cx="256" cy="404" r="16" fill="#b7f34b" filter="url(#glow)" />
    <circle cx="256" cy="404" r="9" fill="#ffffff" />
  </g>
</svg>`;

// Social Share Card Banner (1200x630) for WhatsApp, Facebook, X/Twitter, LinkedIn previews
const ogImageSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="ogBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a1524" />
      <stop offset="50%" stop-color="#121016" />
      <stop offset="100%" stop-color="#0a090c" />
    </linearGradient>
    <linearGradient id="ogPurple" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#c142ed" />
      <stop offset="100%" stop-color="#922cb5" />
    </linearGradient>
    <linearGradient id="ogLime" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d4ff6b" />
      <stop offset="100%" stop-color="#b7f34b" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#ogBg)" />

  <!-- Ambient Light Orbs -->
  <circle cx="220" cy="315" r="320" fill="#922cb5" opacity="0.18" filter="blur(80px)" />
  <circle cx="980" cy="200" r="280" fill="#b7f34b" opacity="0.12" filter="blur(90px)" />

  <!-- Subtle Tech Grid Lines -->
  <path d="M 0 100 L 1200 100 M 0 200 L 1200 200 M 0 300 L 1200 300 M 0 400 L 1200 400 M 0 500 L 1200 500" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
  <path d="M 200 0 L 200 630 M 400 0 L 400 630 M 600 0 L 600 630 M 800 0 L 800 630 M 1000 0 L 1000 630" stroke="rgba(255,255,255,0.03)" stroke-width="1" />

  <!-- Brand Emblem on Left (Scaled 512->310) -->
  <g transform="translate(90, 160) scale(0.60546875)">
    <rect width="512" height="512" rx="112" fill="#151419" stroke="rgba(255,255,255,0.12)" stroke-width="3" />
    <circle cx="256" cy="256" r="224" fill="none" stroke="url(#ogPurple)" stroke-width="14" opacity="0.4" />
    <circle cx="256" cy="256" r="224" fill="none" stroke="url(#ogLime)" stroke-width="16" stroke-dasharray="140 320" stroke-linecap="round" />
    <circle cx="256" cy="256" r="196" fill="#151419" />
    
    <!-- Monogram NM -->
    <path d="M 112 144 L 148 144 L 148 210 L 200 144 L 236 144 L 236 368 L 200 368 L 200 302 L 148 368 L 112 368 Z" fill="url(#ogLime)" />
    <path d="M 276 368 L 276 144 L 312 144 L 356 266 L 400 144 L 436 144 L 436 368 L 400 368 L 400 235 L 356 317 L 312 235 L 312 368 Z" fill="url(#ogPurple)" />
    <circle cx="256" cy="404" r="16" fill="#b7f34b" />
    <circle cx="256" cy="404" r="9" fill="#ffffff" />
  </g>

  <!-- Typography & Text on Right -->
  <!-- Tagline Pill -->
  <g transform="translate(450, 140)">
    <rect width="330" height="38" rx="19" fill="#922cb5" fill-opacity="0.25" stroke="#922cb5" stroke-opacity="0.5" stroke-width="1" />
    <circle cx="20" cy="19" r="5" fill="#b7f34b" />
    <text x="36" y="24" fill="#d4ff6b" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="12" letter-spacing="2">AUTHENTIC TECH CATALOGUE</text>
  </g>

  <!-- Main Headline -->
  <text x="450" y="245" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="56" letter-spacing="1">NASIR MOBILE</text>
  <text x="860" y="245" fill="#b7f34b" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="56" letter-spacing="1">DUBAI</text>

  <!-- Subheadline -->
  <text x="450" y="300" fill="#d1d5db" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="24">Premium Smartphones, Smartwatches, Laptops &amp; Certified Gear</text>

  <!-- Key Badges Row -->
  <g transform="translate(450, 350)">
    <!-- Badge 1: 100% Genuine -->
    <rect x="0" y="0" width="190" height="46" rx="12" fill="#201c27" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <text x="24" y="28" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="14">✓ 100% Genuine</text>

    <!-- Badge 2: Dubai Warranty -->
    <rect x="206" y="0" width="200" height="46" rx="12" fill="#201c27" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <text x="230" y="28" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="14">🛡️ UAE Warranty</text>

    <!-- Badge 3: WhatsApp Instant Order -->
    <rect x="422" y="0" width="220" height="46" rx="12" fill="#201c27" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <text x="446" y="28" fill="#b7f34b" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="14">💬 Direct WhatsApp</text>
  </g>

  <!-- Footer Info Line -->
  <g transform="translate(450, 450)">
    <text x="0" y="0" fill="#9ca3af" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600">📍 Deira, Dubai, United Arab Emirates • Free Same-Day Dispatch Available</text>
    <text x="0" y="32" fill="#6b7280" font-family="system-ui, -apple-system, sans-serif" font-size="14">🌐 www.nasirmobile.com • WhatsApp: +971 52 252 3900</text>
  </g>
</svg>`;

async function main() {
  console.log('Generating crisp SEO favicon and app icon assets...');

  // 1. Write the SVG
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), logoSvg.trim());
  console.log('✓ Wrote favicon.svg');

  // 2. Generate PNGs at required dimensions:
  // - 16x16: standard favicon
  // - 32x32: standard retina favicon
  // - 48x48: CRITICAL FOR GOOGLE SEARCH FAVICON (Google requires multiple of 48px square!)
  // - 96x96: Google high-DPI
  // - 144x144: Windows tile & Android
  // - 180x180: Apple touch icon
  // - 192x192: Android Chrome PWA standard
  // - 512x512: Android Chrome PWA splash & Google Organization Logo
  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 }, // Google Search standard!
    { name: 'favicon-96x96.png', size: 96 },
    { name: 'apple-touch-icon.png', size: 180 }, // Apple iOS home screen
    { name: 'android-chrome-192x192.png', size: 192 }, // Android PWA
    { name: 'android-chrome-512x512.png', size: 512 }, // Android PWA & Google Schema
    { name: 'logo-512x512.png', size: 512 }, // Google Search Organization Logo
  ];

  const svgBuffer = Buffer.from(logoSvg);

  for (const item of sizes) {
    const dest = path.join(publicDir, item.name);
    await sharp(svgBuffer)
      .resize(item.size, item.size)
      .png({ compressionLevel: 9 })
      .toFile(dest);
    console.log(`✓ Generated ${item.name} (${item.size}x${item.size})`);
  }

  // 3. Generate favicon.ico
  // A standard multi-image or 48x48/32x32 ICO
  // Sharp can output PNG-in-ICO or standard 48x48 ico
  const ico48Buffer = await sharp(svgBuffer)
    .resize(48, 48)
    .png()
    .toBuffer();

  // Create standard ICO file structure containing a 48x48 PNG image (standard modern ICO format supported by all modern browsers & Googlebot)
  // ICO Header: 6 bytes (Reserved 2 bytes = 0, Type 2 bytes = 1 for icon, Count 2 bytes = 1)
  // Directory Entry: 16 bytes (Width 1B, Height 1B, ColorCount 1B, Reserved 1B, Planes 2B, BitCount 2B, BytesInRes 4B, ImageOffset 4B)
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // Type 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // 1 Image

  const icoEntry = Buffer.alloc(16);
  icoEntry.writeUInt8(48, 0); // Width 48
  icoEntry.writeUInt8(48, 1); // Height 48
  icoEntry.writeUInt8(0, 2); // Colors 0 (no palette)
  icoEntry.writeUInt8(0, 3); // Reserved
  icoEntry.writeUInt16LE(1, 4); // Color planes
  icoEntry.writeUInt16LE(32, 6); // Bits per pixel
  icoEntry.writeUInt32LE(ico48Buffer.length, 8); // Size of image data
  icoEntry.writeUInt32LE(6 + 16, 12); // Offset = 22

  const icoFile = Buffer.concat([icoHeader, icoEntry, ico48Buffer]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoFile);
  console.log('✓ Generated root favicon.ico (48x48 Googlebot-compatible ICO)');

  // 4. Generate og-image.png (1200x630) for OpenGraph social cards
  const ogDest = path.join(publicDir, 'og-image.png');
  await sharp(Buffer.from(ogImageSvg))
    .resize(1200, 630)
    .png({ quality: 90, compressionLevel: 8 })
    .toFile(ogDest);
  console.log('✓ Generated og-image.png (1200x630 OpenGraph / Twitter Card)');

  console.log('All favicon and SEO graphic assets generated successfully!');
}

main().catch(console.error);
