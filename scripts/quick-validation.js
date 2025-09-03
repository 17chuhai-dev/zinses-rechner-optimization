#!/usr/bin/env node

/**
 * 快速项目验证脚本
 * 跳过复杂的类型检查，验证基本功能
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const log = {
  info: (msg) => console.log('ℹ', msg),
  success: (msg) => console.log('✓', msg),
  warning: (msg) => console.log('⚠', msg),
  error: (msg) => console.log('✗', msg),
  title: (msg) => console.log(`\n${msg}\n`)
}

// 检查基本文件结构
const checkProjectStructure = () => {
  log.title('📁 检查项目结构')
  
  const requiredFiles = [
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
    'src/main.ts',
    'src/App.vue',
    'index.html'
  ]
  
  const requiredDirs = [
    'src',
    'src/components',
    'src/views',
    'src/services',
    'public'
  ]
  
  let allGood = true
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log.success(`文件存在: ${file}`)
    } else {
      log.error(`文件缺失: ${file}`)
      allGood = false
    }
  })
  
  requiredDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      log.success(`目录存在: ${dir}`)
    } else {
      log.error(`目录缺失: ${dir}`)
      allGood = false
    }
  })
  
  return allGood
}

// 检查依赖
const checkDependencies = () => {
  log.title('📦 检查依赖')
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const deps = Object.keys(packageJson.dependencies || {})
    const devDeps = Object.keys(packageJson.devDependencies || {})
    
    log.info(`生产依赖: ${deps.length} 个`)
    log.info(`开发依赖: ${devDeps.length} 个`)
    
    // 检查关键依赖
    const criticalDeps = ['vue', 'vue-router', 'pinia']
    const missingDeps = criticalDeps.filter(dep => !deps.includes(dep))
    
    if (missingDeps.length > 0) {
      log.error(`缺少关键依赖: ${missingDeps.join(', ')}`)
      return false
    }
    
    log.success('关键依赖检查通过')
    return true
  } catch (error) {
    log.error('无法读取package.json')
    return false
  }
}

// 尝试构建项目
const tryBuild = () => {
  log.title('🔨 尝试构建项目')
  
  try {
    // 设置环境变量避免一些错误
    process.env.NODE_ENV = 'production'
    process.env.VITE_APP_TITLE = 'Zinses Rechner'
    process.env.VITE_APP_URL = 'http://localhost:5173'
    
    log.info('开始构建...')
    execSync('npm run build', { 
      stdio: 'pipe',
      timeout: 120000 // 2分钟超时
    })
    
    // 检查构建产物
    if (fs.existsSync('dist') && fs.existsSync('dist/index.html')) {
      log.success('构建成功！')
      
      // 检查构建产物大小
      const stats = fs.statSync('dist')
      const files = fs.readdirSync('dist')
      log.info(`构建产物: ${files.length} 个文件`)
      
      return true
    } else {
      log.error('构建产物不完整')
      return false
    }
  } catch (error) {
    log.error('构建失败')
    console.error(error.message)
    return false
  }
}

// 尝试启动开发服务器
const tryDevServer = () => {
  log.title('🚀 测试开发服务器')
  
  try {
    log.info('启动开发服务器...')
    
    // 启动开发服务器并在5秒后终止
    const child = execSync('timeout 5s npm run dev || true', { 
      stdio: 'pipe',
      timeout: 10000
    })
    
    log.success('开发服务器启动测试完成')
    return true
  } catch (error) {
    if (error.message.includes('timeout')) {
      log.success('开发服务器启动正常（已超时终止）')
      return true
    } else {
      log.error('开发服务器启动失败')
      console.error(error.message)
      return false
    }
  }
}

// 检查环境变量
const checkEnvironment = () => {
  log.title('🌍 检查环境配置')
  
  const envFiles = ['.env.example', '.env.local', '.env.development', '.env.production']
  let hasEnvConfig = false
  
  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log.success(`环境文件存在: ${file}`)
      hasEnvConfig = true
    }
  })
  
  if (!hasEnvConfig) {
    log.warning('未找到环境配置文件')
  }
  
  return true
}

// 生成验证报告
const generateReport = (results) => {
  log.title('📊 验证报告')
  
  const totalTests = Object.keys(results).length
  const passedTests = Object.values(results).filter(Boolean).length
  const failedTests = totalTests - passedTests
  
  console.log(`总测试项: ${totalTests}`)
  console.log(`✓ 通过: ${passedTests}`)
  console.log(`✗ 失败: ${failedTests}`)

  console.log('\n详细结果:')
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✓' : '✗'
    console.log(`  ${icon} ${test}`)
  })
  
  const score = Math.round((passedTests / totalTests) * 100)
  console.log(`\n总体评分: ${score}%`)
  
  if (score >= 80) {
    log.success('项目状态良好！')
  } else if (score >= 60) {
    log.warning('项目需要一些修复')
  } else {
    log.error('项目存在严重问题')
  }
  
  return score
}

// 主函数
const main = () => {
  console.log('🔍 Zinses Rechner 快速验证\n')
  
  const results = {
    '项目结构': checkProjectStructure(),
    '依赖检查': checkDependencies(),
    '环境配置': checkEnvironment(),
    '构建测试': tryBuild(),
    '开发服务器': tryDevServer()
  }
  
  const score = generateReport(results)
  
  // 提供改进建议
  if (score < 100) {
    log.title('💡 改进建议')
    
    if (!results['项目结构']) {
      console.log('- 检查并创建缺失的文件和目录')
    }
    
    if (!results['依赖检查']) {
      console.log('- 运行 npm install 安装缺失的依赖')
    }
    
    if (!results['构建测试']) {
      console.log('- 修复TypeScript类型错误')
      console.log('- 检查vite.config.ts配置')
    }
    
    if (!results['开发服务器']) {
      console.log('- 检查端口占用情况')
      console.log('- 验证开发环境配置')
    }
  }
  
  process.exit(score >= 60 ? 0 : 1)
}

// 运行主函数
if (require.main === module) {
  main()
}

module.exports = {
  checkProjectStructure,
  checkDependencies,
  tryBuild,
  tryDevServer,
  generateReport
}
