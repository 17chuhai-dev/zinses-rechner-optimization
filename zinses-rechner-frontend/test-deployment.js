#!/usr/bin/env node

/**
 * 测试部署的网站
 */

import https from 'https';

const deploymentUrl = 'https://ed87d457.zinses-rechner.pages.dev';

function testWebsite(url) {
  return new Promise((resolve) => {
    console.log(`🌐 测试网站: ${url}`);
    
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DeploymentTester/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`📊 HTTP状态: ${res.statusCode}`);
        console.log(`📏 响应大小: ${body.length} bytes`);
        console.log(`📋 Content-Type: ${res.headers['content-type'] || 'unknown'}`);
        
        if (res.statusCode === 200) {
          // 检查HTML内容
          if (body.includes('<html')) {
            console.log('✅ 返回了HTML内容');
            
            // 检查标题
            const titleMatch = body.match(/<title>(.*?)<\/title>/i);
            if (titleMatch) {
              console.log(`📄 页面标题: ${titleMatch[1]}`);
            }
            
            // 检查是否包含Vue.js应用
            if (body.includes('id="app"') || body.includes('data-v-')) {
              console.log('✅ 检测到Vue.js应用');
            }
            
            // 检查是否包含项目相关内容
            if (body.includes('Zinses') || body.includes('zinses') || body.includes('rechner')) {
              console.log('✅ 包含项目相关内容');
            } else {
              console.log('⚠️  未检测到项目特定内容');
            }
            
            // 检查是否有JavaScript错误
            if (body.includes('script')) {
              console.log('✅ 包含JavaScript代码');
            }
            
            // 显示HTML的开头部分
            console.log('\n📝 HTML内容预览:');
            console.log(body.substring(0, 500) + '...');
            
          } else {
            console.log('❌ 未返回有效的HTML内容');
            console.log('📝 响应内容:', body.substring(0, 200));
          }
        } else {
          console.log(`❌ HTTP错误: ${res.statusCode}`);
          console.log('📝 错误内容:', body.substring(0, 200));
        }
        
        resolve({ status: res.statusCode, size: body.length, content: body });
      });
    });

    req.on('error', (error) => {
      console.error('❌ 请求失败:', error.message);
      resolve({ status: 0, size: 0, content: '' });
    });

    req.setTimeout(15000, () => {
      console.log('⏰ 请求超时');
      req.destroy();
      resolve({ status: 0, size: 0, content: '' });
    });

    req.end();
  });
}

async function main() {
  console.log('🚀 开始测试部署的网站...\n');
  
  const result = await testWebsite(deploymentUrl);
  
  console.log('\n📋 测试总结:');
  if (result.status === 200) {
    console.log('🎉 网站部署成功！');
    console.log(`✅ 访问地址: ${deploymentUrl}`);
    console.log(`✅ 响应正常: HTTP ${result.status}`);
    console.log(`✅ 内容大小: ${result.size} bytes`);
  } else {
    console.log('❌ 网站访问异常');
    console.log(`❌ HTTP状态: ${result.status}`);
  }
}

main().catch(console.error);
