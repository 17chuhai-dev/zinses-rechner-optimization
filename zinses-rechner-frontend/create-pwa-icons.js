#!/usr/bin/env node

/**
 * 创建PWA图标文件
 * 生成不同尺寸的应用图标
 */

import fs from 'fs';
import path from 'path';

// 创建简单的SVG图标
const createSVGIcon = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 背景圆角矩形 -->
  <rect width="${size}" height="${size}" rx="${size * 0.15}" ry="${size * 0.15}" fill="url(#grad1)"/>
  
  <!-- 计算器图标 -->
  <g transform="translate(${size * 0.2}, ${size * 0.2})">
    <!-- 计算器主体 -->
    <rect x="0" y="0" width="${size * 0.6}" height="${size * 0.6}" rx="${size * 0.05}" fill="white" opacity="0.9"/>
    
    <!-- 显示屏 -->
    <rect x="${size * 0.05}" y="${size * 0.05}" width="${size * 0.5}" height="${size * 0.15}" rx="${size * 0.02}" fill="#1F2937"/>
    
    <!-- 按钮网格 -->
    <g fill="#4F46E5">
      <!-- 第一行 -->
      <circle cx="${size * 0.1}" cy="${size * 0.3}" r="${size * 0.03}"/>
      <circle cx="${size * 0.2}" cy="${size * 0.3}" r="${size * 0.03}"/>
      <circle cx="${size * 0.3}" cy="${size * 0.3}" r="${size * 0.03}"/>
      <circle cx="${size * 0.45}" cy="${size * 0.3}" r="${size * 0.03}"/>
      
      <!-- 第二行 -->
      <circle cx="${size * 0.1}" cy="${size * 0.4}" r="${size * 0.03}"/>
      <circle cx="${size * 0.2}" cy="${size * 0.4}" r="${size * 0.03}"/>
      <circle cx="${size * 0.3}" cy="${size * 0.4}" r="${size * 0.03}"/>
      <circle cx="${size * 0.45}" cy="${size * 0.4}" r="${size * 0.03}"/>
      
      <!-- 第三行 -->
      <circle cx="${size * 0.1}" cy="${size * 0.5}" r="${size * 0.03}"/>
      <circle cx="${size * 0.2}" cy="${size * 0.5}" r="${size * 0.03}"/>
      <circle cx="${size * 0.3}" cy="${size * 0.5}" r="${size * 0.03}"/>
      <rect x="${size * 0.42}" y="${size * 0.47}" width="${size * 0.06}" height="${size * 0.06}" rx="${size * 0.01}" fill="#EF4444"/>
    </g>
    
    <!-- 品牌文字 -->
    <text x="${size * 0.3}" y="${size * 0.13}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.04}" font-weight="bold">ZR</text>
  </g>
  
  <!-- 装饰元素 -->
  <circle cx="${size * 0.85}" cy="${size * 0.15}" r="${size * 0.03}" fill="white" opacity="0.3"/>
  <circle cx="${size * 0.15}" cy="${size * 0.85}" r="${size * 0.02}" fill="white" opacity="0.2"/>
</svg>`;
};

// 创建Canvas并转换为PNG的函数（简化版本，实际需要canvas库）
const createPNGFromSVG = async (svgContent, outputPath, size) => {
  // 这里我们创建一个简单的HTML文件来生成图标
  // 在实际生产中，你可能需要使用sharp或canvas库
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Icon Generator</title>
</head>
<body style="margin: 0; padding: 20px; background: #f0f0f0;">
    <div style="text-align: center;">
        <h2>Zinses Rechner PWA Icon (${size}x${size})</h2>
        ${svgContent}
        <p>Right-click the icon above and save as PNG</p>
        <p>File: ${path.basename(outputPath)}</p>
    </div>
</body>
</html>`;

  // 保存HTML文件用于手动转换
  const htmlPath = outputPath.replace('.png', '.html');
  fs.writeFileSync(htmlPath, htmlContent);
  
  console.log(`✅ Created HTML template: ${htmlPath}`);
  console.log(`   Please open in browser and save as PNG: ${outputPath}`);
};

async function createPWAIcons() {
  console.log('🎨 创建PWA图标...');
  
  const publicDir = path.join(process.cwd(), 'public');
  const iconsDir = path.join(publicDir, 'icons');
  
  // 创建icons目录
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log('📁 创建icons目录');
  }
  
  // 需要的图标尺寸
  const iconSizes = [
    { size: 192, name: 'pwa-192x192.png' },
    { size: 512, name: 'pwa-512x512.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 16, name: 'favicon-16x16.png' }
  ];
  
  // 生成SVG图标
  for (const icon of iconSizes) {
    const svgContent = createSVGIcon(icon.size);
    const svgPath = path.join(iconsDir, icon.name.replace('.png', '.svg'));
    const pngPath = path.join(publicDir, icon.name);
    
    // 保存SVG文件
    fs.writeFileSync(svgPath, svgContent);
    console.log(`✅ 创建SVG: ${icon.name.replace('.png', '.svg')}`);
    
    // 创建HTML模板用于转换为PNG
    await createPNGFromSVG(svgContent, pngPath, icon.size);
  }
  
  // 创建一个简单的PNG占位符（base64编码的1x1像素图片）
  const createSimplePNG = (size, outputPath) => {
    // 创建一个简单的彩色方块作为临时图标
    const canvas = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#4F46E5"/>
  <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="white" font-size="${size/8}" font-family="Arial">ZR</text>
</svg>`;
    
    // 将SVG转换为data URL（临时解决方案）
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(canvas).toString('base64')}`;
    
    // 创建一个简单的HTML文件显示图标
    const htmlContent = `
<!DOCTYPE html>
<html>
<head><title>PWA Icon ${size}x${size}</title></head>
<body style="margin:0;padding:20px;text-align:center;background:#f5f5f5;">
<h3>Zinses Rechner Icon (${size}x${size})</h3>
<img src="${dataUrl}" width="${size}" height="${size}" style="border:1px solid #ccc;"/>
<p>Save this as: ${path.basename(outputPath)}</p>
</body>
</html>`;
    
    fs.writeFileSync(outputPath.replace('.png', '-preview.html'), htmlContent);
  };
  
  // 创建临时PNG预览
  iconSizes.forEach(icon => {
    const outputPath = path.join(publicDir, icon.name);
    createSimplePNG(icon.size, outputPath);
  });
  
  console.log('\n📋 PWA图标创建完成！');
  console.log('📝 下一步操作：');
  console.log('1. 打开生成的HTML文件');
  console.log('2. 右键保存SVG图标为PNG格式');
  console.log('3. 将PNG文件放在public目录下');
  console.log('4. 重新构建和部署应用');
}

// 运行图标创建
createPWAIcons().catch(console.error);
