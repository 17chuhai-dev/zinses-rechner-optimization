#!/usr/bin/env node

/**
 * 使用Sharp创建PWA图标
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// 创建SVG图标内容
function createSVGIcon(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#4F46E5"/>
        <stop offset="100%" style="stop-color:#7C3AED"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
    <rect x="${size * 0.2}" y="${size * 0.2}" width="${size * 0.6}" height="${size * 0.6}" rx="${size * 0.05}" fill="white" opacity="0.9"/>
    <rect x="${size * 0.25}" y="${size * 0.25}" width="${size * 0.5}" height="${size * 0.15}" rx="${size * 0.02}" fill="#1F2937"/>
    <text x="50%" y="60%" text-anchor="middle" fill="#4F46E5" font-family="Arial, sans-serif" font-size="${size * 0.12}" font-weight="bold">ZR</text>
  </svg>`;
}

async function createPNGIcons() {
  console.log('🎨 使用Sharp创建PNG图标...');

  const publicDir = path.join(process.cwd(), 'public');

  // 需要创建的图标
  const icons = [
    { size: 192, filename: 'pwa-192x192.png' },
    { size: 512, filename: 'pwa-512x512.png' },
    { size: 180, filename: 'apple-touch-icon.png' },
    { size: 32, filename: 'favicon-32x32.png' },
    { size: 16, filename: 'favicon-16x16.png' }
  ];

  for (const icon of icons) {
    try {
      const svgContent = createSVGIcon(icon.size);
      const outputPath = path.join(publicDir, icon.filename);

      // 使用Sharp将SVG转换为PNG
      await sharp(Buffer.from(svgContent))
        .png()
        .toFile(outputPath);

      console.log(`✅ 创建PNG图标: ${icon.filename} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`❌ 创建 ${icon.filename} 失败:`, error.message);
    }
  }

  console.log('\n🎉 PNG图标创建完成！');
  console.log('📝 下一步：重新构建和部署应用');
}

createPNGIcons().catch(console.error);
