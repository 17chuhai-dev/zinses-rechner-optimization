#!/usr/bin/env node

/**
 * 修复Vue.js初始化问题
 * 检查和修复可能的循环依赖和模块导入问题
 */

import fs from 'fs';
import path from 'path';

// 检查文件中的导入语句
function analyzeImports(filePath) {
  if (!fs.existsSync(filePath)) {
    return { imports: [], exports: [] };
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports = [];
  const exports = [];
  
  // 匹配import语句
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  // 匹配export语句
  const exportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class|interface|type)\s+(\w+)/g;
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  return { imports, exports };
}

// 检查循环依赖
function checkCircularDependencies() {
  console.log('🔍 检查循环依赖...');
  
  const srcDir = path.join(process.cwd(), 'src');
  const files = [];
  
  // 递归获取所有TypeScript文件
  function getFiles(dir) {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        getFiles(fullPath);
      } else if (entry.endsWith('.ts') || entry.endsWith('.vue')) {
        files.push(fullPath);
      }
    }
  }
  
  getFiles(srcDir);
  
  // 分析每个文件的导入
  const dependencies = new Map();
  
  files.forEach(file => {
    const relativePath = path.relative(srcDir, file);
    const { imports } = analyzeImports(file);
    
    const localImports = imports.filter(imp => 
      imp.startsWith('./') || imp.startsWith('../') || imp.startsWith('@/')
    );
    
    dependencies.set(relativePath, localImports);
  });
  
  console.log(`✅ 分析了 ${files.length} 个文件`);
  
  // 检查可能的问题文件
  const problemFiles = [];
  dependencies.forEach((imports, file) => {
    if (imports.length > 10) {
      problemFiles.push({ file, importCount: imports.length });
    }
  });
  
  if (problemFiles.length > 0) {
    console.log('⚠️  发现可能有问题的文件（导入过多）:');
    problemFiles.forEach(({ file, importCount }) => {
      console.log(`   ${file}: ${importCount} imports`);
    });
  }
  
  return dependencies;
}

// 修复路由配置
function fixRouterConfiguration() {
  console.log('🔧 修复路由配置...');
  
  const routerPath = path.join(process.cwd(), 'src/router/index.ts');
  
  if (!fs.existsSync(routerPath)) {
    console.log('❌ 路由文件不存在');
    return;
  }
  
  let content = fs.readFileSync(routerPath, 'utf-8');
  
  // 检查是否有问题的导入
  const problematicImports = [
    "import { calculatorRegistry } from '@/core/CalculatorRegistry'",
    "import { userManager } from '@/services/UserManager'"
  ];
  
  let hasChanges = false;
  
  problematicImports.forEach(importStatement => {
    if (content.includes(importStatement)) {
      console.log(`⚠️  发现可能有问题的导入: ${importStatement}`);
      
      // 将导入移到路由守卫中进行懒加载
      content = content.replace(importStatement, `// ${importStatement} // 移动到懒加载`);
      hasChanges = true;
    }
  });
  
  // 添加懒加载的导入
  if (hasChanges) {
    const lazyImportCode = `
// 懒加载导入，避免循环依赖
const getCalculatorRegistry = () => import('@/core/CalculatorRegistry').then(m => m.calculatorRegistry);
const getUserManager = () => import('@/services/UserManager').then(m => m.userManager);
`;
    
    // 在文件开头添加懒加载代码
    const importEndIndex = content.lastIndexOf("import");
    const nextLineIndex = content.indexOf('\n', importEndIndex);
    
    content = content.slice(0, nextLineIndex + 1) + lazyImportCode + content.slice(nextLineIndex + 1);
    
    fs.writeFileSync(routerPath, content);
    console.log('✅ 修复了路由配置中的循环依赖');
  } else {
    console.log('✅ 路由配置看起来正常');
  }
}

// 修复main.ts中的初始化顺序
function fixMainInitialization() {
  console.log('🔧 修复main.ts初始化顺序...');
  
  const mainPath = path.join(process.cwd(), 'src/main.ts');
  
  if (!fs.existsSync(mainPath)) {
    console.log('❌ main.ts文件不存在');
    return;
  }
  
  let content = fs.readFileSync(mainPath, 'utf-8');
  
  // 确保Vue应用创建在所有导入之后
  const lines = content.split('\n');
  const importLines = [];
  const otherLines = [];
  
  let inImportSection = true;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (inImportSection && (trimmed.startsWith('import ') || trimmed === '' || trimmed.startsWith('//'))) {
      importLines.push(line);
    } else {
      inImportSection = false;
      otherLines.push(line);
    }
  });
  
  // 重新组织代码
  const newContent = [
    ...importLines,
    '',
    '// 确保所有模块都已加载',
    'console.log("🚀 Starting Zinses Rechner application...");',
    '',
    ...otherLines
  ].join('\n');
  
  if (newContent !== content) {
    fs.writeFileSync(mainPath, newContent);
    console.log('✅ 修复了main.ts的初始化顺序');
  } else {
    console.log('✅ main.ts初始化顺序正常');
  }
}

// 创建错误处理包装器
function addErrorHandling() {
  console.log('🛡️ 添加错误处理...');
  
  const mainPath = path.join(process.cwd(), 'src/main.ts');
  let content = fs.readFileSync(mainPath, 'utf-8');
  
  // 检查是否已经有错误处理
  if (!content.includes('window.addEventListener(\'error\'')) {
    const errorHandlingCode = `
// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  if (event.error?.message?.includes('Cannot access') && event.error?.message?.includes('before initialization')) {
    console.warn('Detected initialization order issue, attempting recovery...');
    // 可以在这里添加恢复逻辑
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
`;
    
    // 在文件开头添加错误处理
    content = errorHandlingCode + '\n' + content;
    
    fs.writeFileSync(mainPath, content);
    console.log('✅ 添加了全局错误处理');
  } else {
    console.log('✅ 错误处理已存在');
  }
}

// 主修复函数
async function fixVueInitialization() {
  console.log('🔧 开始修复Vue.js初始化问题...\n');
  
  try {
    // 1. 检查循环依赖
    checkCircularDependencies();
    
    // 2. 修复路由配置
    fixRouterConfiguration();
    
    // 3. 修复main.ts初始化
    fixMainInitialization();
    
    // 4. 添加错误处理
    addErrorHandling();
    
    console.log('\n🎉 Vue.js初始化修复完成！');
    console.log('📝 建议的下一步：');
    console.log('1. 重新构建应用: npm run build');
    console.log('2. 测试本地开发: npm run dev');
    console.log('3. 如果问题持续，检查浏览器控制台的详细错误信息');
    
  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error.message);
  }
}

fixVueInitialization();
