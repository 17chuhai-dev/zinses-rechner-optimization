/**
 * 简化的移动端响应式测试
 * 使用Playwright验证移动端功能
 */

const { chromium } = require('playwright');

async function testMobileResponsive() {
  console.log('🚀 开始移动端响应式测试...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 12
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    // 测试1: 首页加载
    console.log('📱 测试1: 首页移动端加载...');
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    
    // 检查页面是否正确加载
    const title = await page.title();
    console.log(`✅ 页面标题: ${title}`);
    
    // 测试2: 计算器页面
    console.log('\n📱 测试2: 复利计算器移动端布局...');
    await page.goto('http://localhost:5173/calculator/compound-interest');
    await page.waitForLoadState('networkidle');
    
    // 检查页面基本元素
    const h1 = await page.locator('h1').first();
    if (await h1.count() > 0) {
      const h1Text = await h1.textContent();
      console.log(`✅ 页面标题: ${h1Text}`);
    }
    
    // 检查表单字段
    const inputs = await page.locator('input').count();
    console.log(`✅ 找到 ${inputs} 个输入字段`);
    
    // 检查按钮
    const buttons = await page.locator('button').count();
    console.log(`✅ 找到 ${buttons} 个按钮`);
    
    // 测试3: 触摸目标大小
    console.log('\n📱 测试3: 触摸目标大小验证...');
    const firstInput = page.locator('input').first();
    if (await firstInput.count() > 0) {
      const box = await firstInput.boundingBox();
      if (box) {
        console.log(`✅ 第一个输入字段尺寸: ${box.width}x${box.height}px`);
        if (box.height >= 40) {
          console.log('✅ 触摸目标大小符合标准 (≥40px)');
        } else {
          console.log('⚠️  触摸目标可能过小');
        }
      }
    }
    
    // 测试4: 表单交互
    console.log('\n📱 测试4: 表单交互测试...');
    if (await firstInput.count() > 0) {
      await firstInput.click();
      await firstInput.fill('10000');
      const value = await firstInput.inputValue();
      console.log(`✅ 输入测试成功: ${value}`);
    }
    
    // 测试5: 响应式布局
    console.log('\n📱 测试5: 响应式布局验证...');
    const viewport = page.viewportSize();
    console.log(`✅ 当前视口: ${viewport.width}x${viewport.height}px`);
    
    // 检查内容是否适应屏幕
    const body = await page.locator('body').boundingBox();
    if (body) {
      console.log(`✅ 页面内容宽度: ${body.width}px`);
      if (body.width <= viewport.width + 50) {
        console.log('✅ 内容宽度适应屏幕');
      } else {
        console.log('⚠️  内容可能超出屏幕宽度');
      }
    }
    
    // 测试6: 移动端导航
    console.log('\n📱 测试6: 移动端导航测试...');
    const mobileNav = page.locator('.mobile-navigation, nav, header');
    if (await mobileNav.count() > 0) {
      console.log('✅ 找到导航元素');
      const navVisible = await mobileNav.first().isVisible();
      console.log(`✅ 导航可见性: ${navVisible}`);
    }
    
    // 截图
    console.log('\n📸 保存移动端截图...');
    await page.screenshot({ path: 'mobile-test-screenshot.png', fullPage: true });
    console.log('✅ 截图已保存: mobile-test-screenshot.png');
    
    console.log('\n🎉 移动端响应式测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
  } finally {
    await browser.close();
  }
}

// 运行测试
testMobileResponsive().catch(console.error);
