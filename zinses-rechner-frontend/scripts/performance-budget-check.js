#!/usr/bin/env node

/**
 * 性能预算检查脚本
 * 根据配置的性能预算检查构建产物
 */

const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

// 加载性能预算配置
const loadPerformanceBudget = () => {
  const configPath = path.resolve('config/performance-budget.json')
  if (!fs.existsSync(configPath)) {
    console.error(chalk.red('❌ 性能预算配置文件不存在: config/performance-budget.json'))
    process.exit(1)
  }
  
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch (error) {
    console.error(chalk.red('❌ 无法解析性能预算配置文件:'), error.message)
    process.exit(1)
  }
}

// 解析大小字符串
const parseSize = (sizeStr) => {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 }
  const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/)
  
  if (!match) {
    throw new Error(`无效的大小格式: ${sizeStr}`)
  }
  
  const [, value, unit] = match
  return parseFloat(value) * units[unit]
}

// 格式化大小
const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 分析构建产物
const analyzeBuildOutput = () => {
  const distPath = path.resolve('dist')
  if (!fs.existsSync(distPath)) {
    console.error(chalk.red('❌ 构建目录不存在，请先运行构建命令'))
    process.exit(1)
  }
  
  const analysis = {
    totalSize: 0,
    files: [],
    byType: {
      script: { files: [], totalSize: 0 },
      stylesheet: { files: [], totalSize: 0 },
      image: { files: [], totalSize: 0 },
      font: { files: [], totalSize: 0 },
      other: { files: [], totalSize: 0 }
    }
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
        let type = 'other'
        
        if (['.js', '.mjs', '.ts'].includes(ext)) {
          type = 'script'
        } else if (['.css', '.scss', '.sass'].includes(ext)) {
          type = 'stylesheet'
        } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif'].includes(ext)) {
          type = 'image'
        } else if (['.woff', '.woff2', '.ttf', '.eot', '.otf'].includes(ext)) {
          type = 'font'
        }
        
        analysis.byType[type].files.push(fileInfo)
        analysis.byType[type].totalSize += size
      }
    })
  }
  
  analyzeDirectory(distPath)
  return analysis
}

// 检查预算
const checkBudgets = (analysis, budgetConfig) => {
  const results = {
    passed: [],
    warnings: [],
    errors: [],
    summary: {
      totalChecks: 0,
      passed: 0,
      warnings: 0,
      errors: 0
    }
  }
  
  // 检查bundle预算
  budgetConfig.budgets.forEach(budget => {
    if (budget.type === 'bundle') {
      budget.resourceSizes.forEach(resourceSize => {
        results.summary.totalChecks++
        
        let actualSize = 0
        let description = ''
        
        switch (resourceSize.type) {
          case 'initial':
            // 计算初始bundle大小（主要的JS和CSS文件）
            const mainFiles = analysis.files.filter(file => 
              file.path.includes('index') || 
              file.path.includes('main') || 
              file.path.includes('app')
            )
            actualSize = mainFiles.reduce((sum, file) => sum + file.size, 0)
            description = '初始Bundle大小'
            break
            
          case 'any':
            // 检查单个文件大小
            const largeFiles = analysis.files.filter(file => {
              const maxSize = parseSize(resourceSize.maximumError)
              return file.size > maxSize
            })
            
            largeFiles.forEach(file => {
              results.errors.push({
                type: 'file-size',
                message: `文件过大: ${file.path} (${file.formattedSize})`,
                actual: file.size,
                limit: parseSize(resourceSize.maximumError),
                severity: 'error'
              })
              results.summary.errors++
            })
            
            const warningFiles = analysis.files.filter(file => {
              const maxSize = parseSize(resourceSize.maximumWarning)
              const errorSize = parseSize(resourceSize.maximumError)
              return file.size > maxSize && file.size <= errorSize
            })
            
            warningFiles.forEach(file => {
              results.warnings.push({
                type: 'file-size',
                message: `文件较大: ${file.path} (${file.formattedSize})`,
                actual: file.size,
                limit: parseSize(resourceSize.maximumWarning),
                severity: 'warning'
              })
              results.summary.warnings++
            })
            
            continue
            
          case 'anyComponentStyle':
            actualSize = analysis.byType.stylesheet.totalSize
            description = '样式文件总大小'
            break
        }
        
        if (actualSize > 0) {
          const warningLimit = parseSize(resourceSize.maximumWarning)
          const errorLimit = parseSize(resourceSize.maximumError)
          
          if (actualSize > errorLimit) {
            results.errors.push({
              type: 'budget-exceeded',
              message: `${description}超过错误阈值: ${formatSize(actualSize)} > ${resourceSize.maximumError}`,
              actual: actualSize,
              limit: errorLimit,
              severity: 'error'
            })
            results.summary.errors++
          } else if (actualSize > warningLimit) {
            results.warnings.push({
              type: 'budget-warning',
              message: `${description}超过警告阈值: ${formatSize(actualSize)} > ${resourceSize.maximumWarning}`,
              actual: actualSize,
              limit: warningLimit,
              severity: 'warning'
            })
            results.summary.warnings++
          } else {
            results.passed.push({
              type: 'budget-check',
              message: `${description}在预算范围内: ${formatSize(actualSize)}`,
              actual: actualSize,
              limit: warningLimit
            })
            results.summary.passed++
          }
        }
      })
    }
    
    // 检查资源预算
    if (budget.type === 'asset') {
      budget.resourceSizes.forEach(resourceSize => {
        results.summary.totalChecks++
        
        const typeData = analysis.byType[resourceSize.type]
        if (typeData) {
          const warningLimit = parseSize(resourceSize.maximumWarning)
          const errorLimit = parseSize(resourceSize.maximumError)
          
          if (typeData.totalSize > errorLimit) {
            results.errors.push({
              type: 'asset-budget-exceeded',
              message: `${resourceSize.type}文件总大小超过错误阈值: ${formatSize(typeData.totalSize)} > ${resourceSize.maximumError}`,
              actual: typeData.totalSize,
              limit: errorLimit,
              severity: 'error'
            })
            results.summary.errors++
          } else if (typeData.totalSize > warningLimit) {
            results.warnings.push({
              type: 'asset-budget-warning',
              message: `${resourceSize.type}文件总大小超过警告阈值: ${formatSize(typeData.totalSize)} > ${resourceSize.maximumWarning}`,
              actual: typeData.totalSize,
              limit: warningLimit,
              severity: 'warning'
            })
            results.summary.warnings++
          } else {
            results.passed.push({
              type: 'asset-budget-check',
              message: `${resourceSize.type}文件大小在预算范围内: ${formatSize(typeData.totalSize)}`,
              actual: typeData.totalSize,
              limit: warningLimit
            })
            results.summary.passed++
          }
        }
      })
    }
  })
  
  return results
}

// 生成报告
const generateReport = (analysis, budgetResults, budgetConfig) => {
  console.log(chalk.bold.blue('\n🎯 性能预算检查报告\n'))
  
  // 构建概览
  console.log(chalk.bold('📊 构建概览:'))
  console.log(`  总文件数: ${analysis.files.length}`)
  console.log(`  总大小: ${formatSize(analysis.totalSize)}`)
  
  Object.entries(analysis.byType).forEach(([type, data]) => {
    if (data.files.length > 0) {
      console.log(`  ${type}: ${data.files.length} 文件, ${formatSize(data.totalSize)}`)
    }
  })
  
  // 预算检查结果
  console.log(chalk.bold('\n🎯 预算检查结果:'))
  console.log(`  总检查项: ${budgetResults.summary.totalChecks}`)
  console.log(chalk.green(`  ✅ 通过: ${budgetResults.summary.passed}`))
  console.log(chalk.yellow(`  ⚠️  警告: ${budgetResults.summary.warnings}`))
  console.log(chalk.red(`  ❌ 错误: ${budgetResults.summary.errors}`))
  
  // 详细结果
  if (budgetResults.errors.length > 0) {
    console.log(chalk.bold.red('\n❌ 错误:'))
    budgetResults.errors.forEach(error => {
      console.log(chalk.red(`  • ${error.message}`))
    })
  }
  
  if (budgetResults.warnings.length > 0) {
    console.log(chalk.bold.yellow('\n⚠️  警告:'))
    budgetResults.warnings.forEach(warning => {
      console.log(chalk.yellow(`  • ${warning.message}`))
    })
  }
  
  if (budgetResults.passed.length > 0 && process.env.VERBOSE) {
    console.log(chalk.bold.green('\n✅ 通过的检查:'))
    budgetResults.passed.forEach(passed => {
      console.log(chalk.green(`  • ${passed.message}`))
    })
  }
  
  // 优化建议
  if (budgetResults.errors.length > 0 || budgetResults.warnings.length > 0) {
    console.log(chalk.bold.cyan('\n💡 优化建议:'))
    
    if (budgetConfig.recommendations) {
      budgetConfig.recommendations.codeOptimizations.forEach(suggestion => {
        console.log(chalk.cyan(`  • ${suggestion}`))
      })
    }
  }
  
  // 保存详细报告
  const reportData = {
    timestamp: new Date().toISOString(),
    analysis,
    budgetResults,
    summary: budgetResults.summary
  }
  
  const reportPath = path.resolve('analyze/performance-budget-report.json')
  fs.mkdirSync(path.dirname(reportPath), { recursive: true })
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2))
  
  console.log(chalk.gray(`\n📄 详细报告已保存到: ${reportPath}`))
  
  // 返回退出码
  return budgetResults.summary.errors > 0 ? 1 : 0
}

// 主函数
const main = () => {
  try {
    console.log(chalk.bold.blue('🚀 开始性能预算检查...\n'))
    
    // 加载配置
    const budgetConfig = loadPerformanceBudget()
    
    // 分析构建产物
    const analysis = analyzeBuildOutput()
    
    // 检查预算
    const budgetResults = checkBudgets(analysis, budgetConfig)
    
    // 生成报告
    const exitCode = generateReport(analysis, budgetResults, budgetConfig)
    
    if (exitCode === 0) {
      console.log(chalk.bold.green('\n🎉 所有性能预算检查通过！'))
    } else {
      console.log(chalk.bold.red('\n💥 性能预算检查失败！'))
    }
    
    process.exit(exitCode)
    
  } catch (error) {
    console.error(chalk.red('❌ 性能预算检查失败:'), error.message)
    process.exit(1)
  }
}

// 运行主函数
if (require.main === module) {
  main()
}

module.exports = {
  loadPerformanceBudget,
  analyzeBuildOutput,
  checkBudgets,
  generateReport
}
