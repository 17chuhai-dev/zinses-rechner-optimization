#!/usr/bin/env node

/**
 * 预加载提示生成脚本
 * 自动生成关键资源的预加载提示
 */

const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

// 配置
const config = {
  distDir: 'dist',
  outputFile: 'dist/preload-hints.json',
  criticalResources: {
    // 关键CSS文件
    css: {
      patterns: ['index*.css', 'main*.css', 'app*.css'],
      priority: 'high'
    },
    // 关键JS文件
    js: {
      patterns: ['index*.js', 'main*.js', 'app*.js', 'vendor*.js'],
      priority: 'high'
    },
    // 关键字体文件
    fonts: {
      patterns: ['*.woff2'],
      priority: 'high'
    },
    // 重要图片
    images: {
      patterns: ['logo*.png', 'hero*.jpg', 'favicon*.ico'],
      priority: 'medium'
    }
  },
  // 预连接的外部域名
  preconnectDomains: [
    'https://api.ecb.europa.eu',
    'https://api.bundesbank.de',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://cdn.jsdelivr.net'
  ]
}

// 文件匹配工具
const matchPattern = (filename, pattern) => {
  const regex = new RegExp(pattern.replace(/\*/g, '.*'))
  return regex.test(filename)
}

// 获取文件MIME类型
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase()
  const mimeTypes = {
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'font/eot',
    '.otf': 'font/otf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.ico': 'image/x-icon'
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

// 获取资源类型
const getResourceType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase()
  
  if (['.js', '.mjs'].includes(ext)) return 'script'
  if (['.css'].includes(ext)) return 'style'
  if (['.woff', '.woff2', '.ttf', '.eot', '.otf'].includes(ext)) return 'font'
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif'].includes(ext)) return 'image'
  
  return 'fetch'
}

// 分析构建产物
const analyzeBuildOutput = () => {
  const distPath = path.resolve(config.distDir)
  if (!fs.existsSync(distPath)) {
    console.error(chalk.red('❌ 构建目录不存在，请先运行构建命令'))
    process.exit(1)
  }
  
  const files = []
  
  // 递归扫描文件
  const scanDirectory = (dir, relativePath = '') => {
    const entries = fs.readdirSync(dir)
    
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry)
      const relativeFilePath = path.join(relativePath, entry)
      const stats = fs.statSync(fullPath)
      
      if (stats.isDirectory()) {
        scanDirectory(fullPath, relativeFilePath)
      } else {
        files.push({
          path: relativeFilePath,
          fullPath,
          size: stats.size,
          mtime: stats.mtime
        })
      }
    })
  }
  
  scanDirectory(distPath)
  return files
}

// 识别关键资源
const identifyCriticalResources = (files) => {
  const criticalResources = []
  
  Object.entries(config.criticalResources).forEach(([category, categoryConfig]) => {
    categoryConfig.patterns.forEach(pattern => {
      const matchingFiles = files.filter(file => matchPattern(file.path, pattern))
      
      matchingFiles.forEach(file => {
        criticalResources.push({
          path: file.path,
          category,
          priority: categoryConfig.priority,
          size: file.size,
          mimeType: getMimeType(file.path),
          resourceType: getResourceType(file.path)
        })
      })
    })
  })
  
  // 按优先级和大小排序
  criticalResources.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const aPriority = priorityOrder[a.priority] || 0
    const bPriority = priorityOrder[b.priority] || 0
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority // 高优先级在前
    }
    
    return b.size - a.size // 大文件在前
  })
  
  return criticalResources
}

// 生成预加载提示
const generatePreloadHints = (criticalResources) => {
  const hints = {
    preload: [],
    prefetch: [],
    preconnect: config.preconnectDomains.map(domain => ({
      href: domain,
      crossorigin: 'anonymous'
    })),
    modulePreload: []
  }
  
  criticalResources.forEach(resource => {
    const hint = {
      href: `/${resource.path}`,
      as: resource.resourceType,
      type: resource.mimeType,
      priority: resource.priority
    }
    
    // 字体需要crossorigin
    if (resource.resourceType === 'font') {
      hint.crossorigin = 'anonymous'
    }
    
    // 根据优先级分类
    if (resource.priority === 'high') {
      hints.preload.push(hint)
    } else {
      hints.prefetch.push(hint)
    }
    
    // ES模块预加载
    if (resource.resourceType === 'script' && resource.path.includes('.mjs')) {
      hints.modulePreload.push({
        href: `/${resource.path}`
      })
    }
  })
  
  return hints
}

// 生成HTML标签
const generateHtmlTags = (hints) => {
  const tags = []
  
  // Preconnect标签
  hints.preconnect.forEach(hint => {
    tags.push(`<link rel="preconnect" href="${hint.href}"${hint.crossorigin ? ` crossorigin="${hint.crossorigin}"` : ''}>`)
  })
  
  // Preload标签
  hints.preload.forEach(hint => {
    let tag = `<link rel="preload" href="${hint.href}" as="${hint.as}"`
    if (hint.type) tag += ` type="${hint.type}"`
    if (hint.crossorigin) tag += ` crossorigin="${hint.crossorigin}"`
    tag += '>'
    tags.push(tag)
  })
  
  // Module preload标签
  hints.modulePreload.forEach(hint => {
    tags.push(`<link rel="modulepreload" href="${hint.href}">`)
  })
  
  // Prefetch标签
  hints.prefetch.forEach(hint => {
    let tag = `<link rel="prefetch" href="${hint.href}" as="${hint.as}"`
    if (hint.type) tag += ` type="${hint.type}"`
    tag += '>'
    tags.push(tag)
  })
  
  return tags
}

// 更新HTML文件
const updateHtmlFiles = (tags) => {
  const htmlFiles = ['dist/index.html']
  
  htmlFiles.forEach(htmlFile => {
    if (!fs.existsSync(htmlFile)) {
      console.warn(chalk.yellow(`⚠️  HTML文件不存在: ${htmlFile}`))
      return
    }
    
    let content = fs.readFileSync(htmlFile, 'utf8')
    
    // 移除现有的预加载标签
    content = content.replace(/\s*<link rel="(preload|prefetch|preconnect|modulepreload)"[^>]*>\s*/g, '')
    
    // 在head标签中插入新的预加载标签
    const headEndIndex = content.indexOf('</head>')
    if (headEndIndex !== -1) {
      const preloadSection = `
  <!-- Generated preload hints -->
${tags.map(tag => `  ${tag}`).join('\n')}
  <!-- End preload hints -->
`
      content = content.slice(0, headEndIndex) + preloadSection + content.slice(headEndIndex)
      
      fs.writeFileSync(htmlFile, content)
      console.log(chalk.green(`✅ 已更新 ${htmlFile} 的预加载提示`))
    }
  })
}

// 生成报告
const generateReport = (criticalResources, hints) => {
  console.log(chalk.bold.blue('\n🔗 预加载提示生成报告\n'))
  
  console.log(chalk.bold('📊 关键资源统计:'))
  console.log(`  总数: ${criticalResources.length}`)
  
  const byCategory = criticalResources.reduce((acc, resource) => {
    acc[resource.category] = (acc[resource.category] || 0) + 1
    return acc
  }, {})
  
  Object.entries(byCategory).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`)
  })
  
  console.log(chalk.bold('\n🎯 生成的提示:'))
  console.log(`  Preconnect: ${hints.preconnect.length}`)
  console.log(`  Preload: ${hints.preload.length}`)
  console.log(`  Prefetch: ${hints.prefetch.length}`)
  console.log(`  Module Preload: ${hints.modulePreload.length}`)
  
  // 显示关键资源列表
  if (process.env.VERBOSE) {
    console.log(chalk.bold('\n📋 关键资源列表:'))
    criticalResources.forEach(resource => {
      const sizeKB = (resource.size / 1024).toFixed(1)
      console.log(`  ${resource.priority === 'high' ? '🔥' : '📦'} ${resource.path} (${sizeKB}KB)`)
    })
  }
  
  // 保存详细报告
  const reportData = {
    timestamp: new Date().toISOString(),
    criticalResources,
    hints,
    summary: {
      totalResources: criticalResources.length,
      byCategory,
      hintCounts: {
        preconnect: hints.preconnect.length,
        preload: hints.preload.length,
        prefetch: hints.prefetch.length,
        modulePreload: hints.modulePreload.length
      }
    }
  }
  
  const reportPath = path.resolve('analyze/preload-hints-report.json')
  fs.mkdirSync(path.dirname(reportPath), { recursive: true })
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2))
  
  console.log(chalk.gray(`\n📄 详细报告已保存到: ${reportPath}`))
}

// 主函数
const main = () => {
  try {
    console.log(chalk.bold.blue('🚀 开始生成预加载提示...\n'))
    
    // 分析构建产物
    const files = analyzeBuildOutput()
    console.log(chalk.gray(`📁 扫描到 ${files.length} 个文件`))
    
    // 识别关键资源
    const criticalResources = identifyCriticalResources(files)
    console.log(chalk.gray(`🎯 识别到 ${criticalResources.length} 个关键资源`))
    
    // 生成预加载提示
    const hints = generatePreloadHints(criticalResources)
    
    // 生成HTML标签
    const htmlTags = generateHtmlTags(hints)
    
    // 更新HTML文件
    updateHtmlFiles(htmlTags)
    
    // 保存提示数据
    fs.writeFileSync(config.outputFile, JSON.stringify(hints, null, 2))
    console.log(chalk.green(`✅ 预加载提示已保存到: ${config.outputFile}`))
    
    // 生成报告
    generateReport(criticalResources, hints)
    
    console.log(chalk.bold.green('\n🎉 预加载提示生成完成！'))
    
  } catch (error) {
    console.error(chalk.red('❌ 预加载提示生成失败:'), error.message)
    process.exit(1)
  }
}

// 运行主函数
if (require.main === module) {
  main()
}

module.exports = {
  analyzeBuildOutput,
  identifyCriticalResources,
  generatePreloadHints,
  generateHtmlTags,
  updateHtmlFiles
}
