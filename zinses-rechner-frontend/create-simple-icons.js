#!/usr/bin/env node

/**
 * 创建简单的PWA图标文件
 * 使用Canvas API生成PNG图标
 */

import fs from 'fs';
import path from 'path';

// 创建一个简单的PNG图标（使用base64编码）
function createPNGIcon(size) {
  // 创建一个简单的SVG图标
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#4F46E5"/>
        <stop offset="100%" style="stop-color:#7C3AED"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
    <rect x="${size * 0.2}" y="${size * 0.2}" width="${size * 0.6}" height="${size * 0.6}" rx="${size * 0.05}" fill="white" opacity="0.9"/>
    <rect x="${size * 0.25}" y="${size * 0.25}" width="${size * 0.5}" height="${size * 0.15}" rx="${size * 0.02}" fill="#1F2937"/>
    <text x="50%" y="60%" text-anchor="middle" fill="#4F46E5" font-family="Arial" font-size="${size * 0.12}" font-weight="bold">ZR</text>
  </svg>`;
  
  return svg;
}

// 创建HTML文件用于生成PNG
function createIconHTML(size, filename) {
  const svg = createPNGIcon(size);
  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Generate ${filename}</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f5f5f5; }
        .icon { border: 2px solid #ddd; margin: 20px; display: inline-block; }
        .instructions { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px; }
        button { background: #4F46E5; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 10px; }
        button:hover { background: #3730A3; }
    </style>
</head>
<body>
    <h2>Zinses Rechner PWA Icon Generator</h2>
    <div class="instructions">
        <h3>生成 ${filename} (${size}x${size})</h3>
        <p>1. 右键点击下面的图标</p>
        <p>2. 选择"另存为图片"或"Save image as"</p>
        <p>3. 保存为: <strong>${filename}</strong></p>
        <p>4. 将文件移动到 public/ 目录</p>
    </div>
    
    <div class="icon">
        ${svg}
    </div>
    
    <div>
        <button onclick="downloadSVG()">下载SVG</button>
        <button onclick="copyToClipboard()">复制SVG代码</button>
    </div>
    
    <script>
        function downloadSVG() {
            const svgData = \`${svg}\`;
            const blob = new Blob([svgData], {type: 'image/svg+xml'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '${filename.replace('.png', '.svg')}';
            a.click();
            URL.revokeObjectURL(url);
        }
        
        function copyToClipboard() {
            const svgData = \`${svg}\`;
            navigator.clipboard.writeText(svgData).then(() => {
                alert('SVG代码已复制到剪贴板！');
            });
        }
        
        // 自动转换为PNG的尝试
        window.onload = function() {
            const svg = document.querySelector('svg');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            canvas.width = ${size};
            canvas.height = ${size};
            
            const svgBlob = new Blob([\`${svg}\`], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(svgBlob);
            
            img.onload = function() {
                ctx.drawImage(img, 0, 0);
                
                // 创建下载链接
                canvas.toBlob(function(blob) {
                    const pngUrl = URL.createObjectURL(blob);
                    const downloadBtn = document.createElement('button');
                    downloadBtn.textContent = '下载PNG';
                    downloadBtn.onclick = function() {
                        const a = document.createElement('a');
                        a.href = pngUrl;
                        a.download = '${filename}';
                        a.click();
                    };
                    document.body.appendChild(downloadBtn);
                }, 'image/png');
                
                URL.revokeObjectURL(url);
            };
            
            img.src = url;
        };
    </script>
</body>
</html>`;
  
  return html;
}

async function createAllIcons() {
  console.log('🎨 创建PWA图标生成器...');
  
  const publicDir = path.join(process.cwd(), 'public');
  
  // 需要的图标
  const icons = [
    { size: 192, filename: 'pwa-192x192.png' },
    { size: 512, filename: 'pwa-512x512.png' },
    { size: 180, filename: 'apple-touch-icon.png' },
    { size: 32, filename: 'favicon-32x32.png' },
    { size: 16, filename: 'favicon-16x16.png' }
  ];
  
  // 为每个图标创建生成器HTML
  icons.forEach(icon => {
    const html = createIconHTML(icon.size, icon.filename);
    const htmlPath = path.join(publicDir, `generate-${icon.filename.replace('.png', '')}.html`);
    
    fs.writeFileSync(htmlPath, html);
    console.log(`✅ 创建图标生成器: generate-${icon.filename.replace('.png', '')}.html`);
  });
  
  // 创建一个主页面
  const indexHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Zinses Rechner Icon Generator</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .icon-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .icon-item { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        a { color: #4F46E5; text-decoration: none; font-weight: bold; }
        a:hover { text-decoration: underline; }
        .preview { width: 64px; height: 64px; margin: 10px auto; }
    </style>
</head>
<body>
    <div class="card">
        <h1>🎨 Zinses Rechner PWA 图标生成器</h1>
        <p>点击下面的链接生成对应尺寸的PWA图标：</p>
    </div>
    
    <div class="card">
        <div class="icon-grid">
            ${icons.map(icon => `
                <div class="icon-item">
                    <div class="preview">${createPNGIcon(64)}</div>
                    <h3>${icon.filename}</h3>
                    <p>${icon.size}x${icon.size} pixels</p>
                    <a href="generate-${icon.filename.replace('.png', '')}.html" target="_blank">生成图标</a>
                </div>
            `).join('')}
        </div>
    </div>
    
    <div class="card">
        <h3>📋 使用说明</h3>
        <ol>
            <li>点击上面的"生成图标"链接</li>
            <li>在新页面中右键点击图标，选择"另存为图片"</li>
            <li>保存为对应的文件名（如 pwa-192x192.png）</li>
            <li>将生成的PNG文件放在 public/ 目录下</li>
            <li>重新构建应用: <code>npm run build</code></li>
            <li>重新部署: <code>npm run deploy</code></li>
        </ol>
    </div>
</body>
</html>`;
  
  const indexPath = path.join(publicDir, 'icon-generator.html');
  fs.writeFileSync(indexPath, indexHTML);
  console.log('✅ 创建主生成器页面: icon-generator.html');
  
  console.log('\n🎉 图标生成器创建完成！');
  console.log('📝 下一步：');
  console.log('1. 在浏览器中打开: public/icon-generator.html');
  console.log('2. 按照页面说明生成所需的PNG图标');
  console.log('3. 将生成的图标文件放在public目录下');
  console.log('4. 重新构建和部署应用');
}

createAllIcons().catch(console.error);
