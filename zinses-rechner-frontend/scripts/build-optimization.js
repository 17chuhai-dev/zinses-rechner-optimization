#!/usr/bin/env node

/**
 * 构建优化脚本
 * 自动化性能优化和构建分析
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const chalk = require('chalk')

// 配置
const config = {
  distDir: 'dist',
  analyzeDir: 'analyze',
  thresholds: {
    bundleSize: 500 * 1024, // 500KB
    chunkSize: 200 * 1024,  // 200KB
    assetSize: 100 * 1024,  // 100KB
    totalSize: 2 * 1024 * 1024 // 2MB
  }
}

// 日志工具
const log = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✓'), msg),
  warning: (msg) => console.log(chalk.yellow('⚠'), msg),
  error: (msg) => console.log(chalk.red('✗'), msg),
  title: (msg) => console.log(chalk.bold.cyan(`\n${msg}\n`))
}

// 文件大小格式化
const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 分析构建产物
const analyzeBuildOutput = () => {
  log.title('📊 分析构建产物')
  
  const distPath = path.resolve(config.distDir)
  if (!fs.existsSync(distPath)) {
    log.error('构建目录不存在，请先运行构建命令')
    process.exit(1)
  }
  
  const analysis = {
    totalSize: 0,
    files: [],
    chunks: {
      js: [],
      css: [],
      assets: []
    },
    warnings: [],
    errors: []
  }
  
  // 递归分析文件
  const analyzeDirectory = (dir, relativePath = '') => {
    const files = fs.readdirSync(dir)
    
    files.forEach(file => {
      const filePath = path.join(dir, file)
      const relativeFilePath = path.join(relativePath, file)
      const stats = fs.statSync(filePath)
      
      if (stats.isDirectory()) {
        analyzeDirectory(filePath, relativeFilePath)
      } else {
        const size = stats.size
        analysis.totalSize += size
        
        const fileInfo = {
          path: relativeFilePath,
          size,
          formattedSize: formatSize(size)
        }
        
        analysis.files.push(fileInfo)
        
        // 分类文件
        const ext = path.extname(file).toLowerCase()
        if (ext === '.js') {
          analysis.chunks.js.push(fileInfo)
          if (size > config.thresholds.chunkSize) {
            analysis.warnings.push(`大型JS块: ${relativeFilePath} (${formatSize(size)})`)
          }
        } else if (ext === '.css') {
          analysis.chunks.css.push(fileInfo)
        } else {
          analysis.chunks.assets.push(fileInfo)
          if (size > config.thresholds.assetSize) {
            analysis.warnings.push(`大型资源文件: ${relativeFilePath} (${formatSize(size)})`)
          }
        }
      }
    })
  }
  
  analyzeDirectory(distPath)
  
  // 检查总大小
  if (analysis.totalSize > config.thresholds.totalSize) {
    analysis.errors.push(`总构建大小超过阈值: ${formatSize(analysis.totalSize)} > ${formatSize(config.thresholds.totalSize)}`)
  }
  
  return analysis
}

// 生成优化建议
const generateOptimizationSuggestions = (analysis) => {
  const suggestions = []
  
  // JS块优化建议
  const largeJsChunks = analysis.chunks.js.filter(chunk => chunk.size > config.thresholds.chunkSize)
  if (largeJsChunks.length > 0) {
    suggestions.push({
      type: 'code-splitting',
      message: '考虑进一步拆分大型JS块',
      files: largeJsChunks.map(chunk => chunk.path),
      priority: 'high'
    })
  }
  
  // 资源优化建议
  const largeAssets = analysis.chunks.assets.filter(asset => asset.size > config.thresholds.assetSize)
  if (largeAssets.length > 0) {
    suggestions.push({
      type: 'asset-optimization',
      message: '优化大型资源文件',
      files: largeAssets.map(asset => asset.path),
      priority: 'medium'
    })
  }
  
  // 重复依赖检查
  const jsFiles = analysis.chunks.js.map(chunk => chunk.path)
  const vendorFiles = jsFiles.filter(file => file.includes('vendor'))
  if (vendorFiles.length > 3) {
    suggestions.push({
      type: 'vendor-optimization',
      message: '考虑合并vendor块以减少HTTP请求',
      files: vendorFiles,
      priority: 'medium'
    })
  }
  
  return suggestions
}

// 生成构建报告
const generateBuildReport = (analysis, suggestions) => {
  log.title('📋 构建报告')
  
  // 基本信息
  log.info(`总文件数: ${analysis.files.length}`)
  log.info(`总大小: ${formatSize(analysis.totalSize)}`)
  log.info(`JS文件: ${analysis.chunks.js.length} (${formatSize(analysis.chunks.js.reduce((sum, chunk) => sum + chunk.size, 0))})`)
  log.info(`CSS文件: ${analysis.chunks.css.length} (${formatSize(analysis.chunks.css.reduce((sum, chunk) => sum + chunk.size, 0))})`)
  log.info(`资源文件: ${analysis.chunks.assets.length} (${formatSize(analysis.chunks.assets.reduce((sum, asset) => sum + asset.size, 0))})`)
  
  // 最大的文件
  const largestFiles = analysis.files
    .sort((a, b) => b.size - a.size)
    .slice(0, 5)
  
  console.log('\n📦 最大的文件:')
  largestFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file.path} - ${file.formattedSize}`)
  })
  
  // 警告
  if (analysis.warnings.length > 0) {
    console.log('\n⚠️  警告:')
    analysis.warnings.forEach(warning => {
      log.warning(warning)
    })
  }
  
  // 错误
  if (analysis.errors.length > 0) {
    console.log('\n❌ 错误:')
    analysis.errors.forEach(error => {
      log.error(error)
    })
  }
  
  // 优化建议
  if (suggestions.length > 0) {
    console.log('\n💡 优化建议:')
    suggestions.forEach((suggestion, index) => {
      const priority = suggestion.priority === 'high' ? chalk.red('高') : 
                      suggestion.priority === 'medium' ? chalk.yellow('中') : 
                      chalk.green('低')
      console.log(`  ${index + 1}. [${priority}] ${suggestion.message}`)
      if (suggestion.files.length > 0) {
        console.log(`     文件: ${suggestion.files.slice(0, 3).join(', ')}${suggestion.files.length > 3 ? '...' : ''}`)
      }
    })
  }
  
  // 保存详细报告
  const reportPath = path.join(config.analyzeDir, 'build-report.json')
  fs.mkdirSync(config.analyzeDir, { recursive: true })
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    analysis,
    suggestions,
    summary: {
      totalFiles: analysis.files.length,
      totalSize: analysis.totalSize,
      formattedTotalSize: formatSize(analysis.totalSize),
      warningCount: analysis.warnings.length,
      errorCount: analysis.errors.length,
      suggestionCount: suggestions.length
    }
  }, null, 2))
  
  log.success(`详细报告已保存到: ${reportPath}`)
}

// 运行bundle分析器
const runBundleAnalyzer = () => {
  log.title('🔍 运行Bundle分析器')
  
  try {
    // 设置环境变量启用分析器
    process.env.ANALYZE = 'true'
    
    // 运行构建命令
    execSync('npm run build', { stdio: 'inherit' })
    
    log.success('Bundle分析器已生成，请查看 dist/stats.html')
  } catch (error) {
    log.error('Bundle分析器运行失败')
    console.error(error.message)
  }
}

// 优化图片资源
const optimizeImages = () => {
  log.title('🖼️  优化图片资源')
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp']
  const imagePaths = []
  
  // 查找图片文件
  const findImages = (dir) => {
    const files = fs.readdirSync(dir)
    
    files.forEach(file => {
      const filePath = path.join(dir, file)
      const stats = fs.statSync(filePath)
      
      if (stats.isDirectory()) {
        findImages(filePath)
      } else {
        const ext = path.extname(file).toLowerCase()
        if (imageExtensions.includes(ext)) {
          imagePaths.push(filePath)
        }
      }
    })
  }
  
  const srcImagesDir = path.join('src', 'assets', 'images')
  if (fs.existsSync(srcImagesDir)) {
    findImages(srcImagesDir)
  }
  
  const publicImagesDir = path.join('public', 'images')
  if (fs.existsSync(publicImagesDir)) {
    findImages(publicImagesDir)
  }
  
  if (imagePaths.length === 0) {
    log.info('未找到需要优化的图片')
    return
  }
  
  log.info(`找到 ${imagePaths.length} 个图片文件`)
  
  // 检查大型图片
  const largeImages = []
  imagePaths.forEach(imagePath => {
    const stats = fs.statSync(imagePath)
    if (stats.size > 100 * 1024) { // 100KB
      largeImages.push({
        path: imagePath,
        size: stats.size,
        formattedSize: formatSize(stats.size)
      })
    }
  })
  
  if (largeImages.length > 0) {
    console.log('\n📸 大型图片文件:')
    largeImages.forEach(image => {
      log.warning(`${image.path} - ${image.formattedSize}`)
    })
    
    console.log('\n💡 建议:')
    console.log('  - 使用 WebP 格式以获得更好的压缩率')
    console.log('  - 考虑使用响应式图片 (srcset)')
    console.log('  - 实现图片懒加载')
    console.log('  - 使用图片压缩工具 (如 imagemin)')
  } else {
    log.success('所有图片文件大小都在合理范围内')
  }
}

// 检查依赖项
const checkDependencies = () => {
  log.title('📦 检查依赖项')
  
  const packageJsonPath = path.resolve('package.json')
  if (!fs.existsSync(packageJsonPath)) {
    log.error('package.json 不存在')
    return
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
  
  // 检查大型依赖
  const largeDependencies = [
    'lodash', 'moment', 'jquery', 'bootstrap', 'antd'
  ]
  
  const foundLargeDeps = []
  Object.keys(dependencies).forEach(dep => {
    if (largeDependencies.some(largeDep => dep.includes(largeDep))) {
      foundLargeDeps.push(dep)
    }
  })
  
  if (foundLargeDeps.length > 0) {
    console.log('\n⚠️  发现大型依赖:')
    foundLargeDeps.forEach(dep => {
      log.warning(`${dep} - 考虑使用更轻量的替代方案`)
    })
  }
  
  // 检查未使用的依赖
  try {
    execSync('npx depcheck --json > depcheck-report.json', { stdio: 'pipe' })
    const depcheckReport = JSON.parse(fs.readFileSync('depcheck-report.json', 'utf8'))
    
    if (depcheckReport.dependencies.length > 0) {
      console.log('\n📦 未使用的依赖:')
      depcheckReport.dependencies.forEach(dep => {
        log.warning(`${dep} - 可以考虑移除`)
      })
    }
    
    // 清理临时文件
    fs.unlinkSync('depcheck-report.json')
  } catch (error) {
    log.info('跳过未使用依赖检查 (需要安装 depcheck)')
  }
}

// 主函数
const main = () => {
  const args = process.argv.slice(2)
  const command = args[0] || 'analyze'
  
  console.log(chalk.bold.blue('🚀 构建优化工具\n'))
  
  switch (command) {
    case 'analyze':
      const analysis = analyzeBuildOutput()
      const suggestions = generateOptimizationSuggestions(analysis)
      generateBuildReport(analysis, suggestions)
      break
      
    case 'bundle':
      runBundleAnalyzer()
      break
      
    case 'images':
      optimizeImages()
      break
      
    case 'deps':
      checkDependencies()
      break
      
    case 'all':
      const fullAnalysis = analyzeBuildOutput()
      const fullSuggestions = generateOptimizationSuggestions(fullAnalysis)
      generateBuildReport(fullAnalysis, fullSuggestions)
      optimizeImages()
      checkDependencies()
      break
      
    default:
      console.log('用法:')
      console.log('  node scripts/build-optimization.js [command]')
      console.log('')
      console.log('命令:')
      console.log('  analyze  - 分析构建产物 (默认)')
      console.log('  bundle   - 运行bundle分析器')
      console.log('  images   - 检查图片优化')
      console.log('  deps     - 检查依赖项')
      console.log('  all      - 运行所有检查')
      break
  }
}

// 运行主函数
if (require.main === module) {
  main()
}

module.exports = {
  analyzeBuildOutput,
  generateOptimizationSuggestions,
  generateBuildReport,
  optimizeImages,
  checkDependencies
}
