#!/usr/bin/env node

/**
 * 安全扫描脚本
 * 自动化安全漏洞检测和合规性检查
 */

const fs = require('fs')
const path = require('path')
const { execSync, spawn } = require('child_process')
const chalk = require('chalk')

// 加载安全审计配置
const loadSecurityConfig = () => {
  const configPath = path.resolve('config/security-audit.json')
  if (!fs.existsSync(configPath)) {
    console.error(chalk.red('❌ 安全审计配置文件不存在'))
    process.exit(1)
  }
  
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch (error) {
    console.error(chalk.red('❌ 无法解析安全审计配置文件:'), error.message)
    process.exit(1)
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

// 执行命令并返回结果
const execCommand = (command, options = {}) => {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      ...options 
    })
    return { success: true, output: result.trim() }
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      output: error.stdout || error.stderr || '' 
    }
  }
}

// 依赖漏洞扫描
const scanDependencies = async (config) => {
  log.title('🔍 依赖漏洞扫描')
  
  const results = {
    npm: null,
    snyk: null,
    retire: null
  }
  
  // NPM Audit
  if (config.vulnerabilityScanning.dependencies.tools.includes('npm-audit')) {
    log.info('运行 npm audit...')
    const npmResult = execCommand('npm audit --json')
    
    if (npmResult.success) {
      try {
        const auditData = JSON.parse(npmResult.output)
        results.npm = {
          vulnerabilities: auditData.metadata?.vulnerabilities || {},
          totalVulnerabilities: Object.values(auditData.metadata?.vulnerabilities || {})
            .reduce((sum, count) => sum + count, 0)
        }
        
        if (results.npm.totalVulnerabilities > 0) {
          log.warning(`发现 ${results.npm.totalVulnerabilities} 个依赖漏洞`)
        } else {
          log.success('未发现依赖漏洞')
        }
      } catch (error) {
        log.error('解析 npm audit 结果失败')
      }
    } else {
      log.error('npm audit 执行失败')
    }
  }
  
  // Snyk扫描
  if (config.vulnerabilityScanning.dependencies.tools.includes('snyk')) {
    log.info('运行 Snyk 扫描...')
    const snykResult = execCommand('npx snyk test --json')
    
    if (snykResult.success) {
      try {
        const snykData = JSON.parse(snykResult.output)
        results.snyk = {
          vulnerabilities: snykData.vulnerabilities || [],
          uniqueCount: snykData.uniqueCount || 0
        }
        
        if (results.snyk.uniqueCount > 0) {
          log.warning(`Snyk 发现 ${results.snyk.uniqueCount} 个漏洞`)
        } else {
          log.success('Snyk 未发现漏洞')
        }
      } catch (error) {
        log.error('解析 Snyk 结果失败')
      }
    } else {
      log.warning('Snyk 扫描失败 (可能需要认证)')
    }
  }
  
  // Retire.js扫描
  if (config.vulnerabilityScanning.dependencies.tools.includes('retire.js')) {
    log.info('运行 Retire.js 扫描...')
    const retireResult = execCommand('npx retire --outputformat json')
    
    if (retireResult.success) {
      try {
        const retireData = JSON.parse(retireResult.output)
        results.retire = {
          vulnerabilities: retireData.data || [],
          count: retireData.data?.length || 0
        }
        
        if (results.retire.count > 0) {
          log.warning(`Retire.js 发现 ${results.retire.count} 个过时组件`)
        } else {
          log.success('Retire.js 未发现过时组件')
        }
      } catch (error) {
        log.error('解析 Retire.js 结果失败')
      }
    } else {
      log.error('Retire.js 扫描失败')
    }
  }
  
  return results
}

// 代码安全分析
const analyzeCode = async (config) => {
  log.title('🔒 代码安全分析')
  
  const results = {
    eslint: null,
    semgrep: null
  }
  
  // ESLint安全规则
  if (config.vulnerabilityScanning.codeAnalysis.tools.includes('eslint-security')) {
    log.info('运行 ESLint 安全检查...')
    const eslintResult = execCommand('npx eslint . --ext .js,.ts,.vue --format json', { 
      cwd: process.cwd() 
    })
    
    if (eslintResult.success) {
      try {
        const eslintData = JSON.parse(eslintResult.output)
        const securityIssues = eslintData.flatMap(file => 
          file.messages.filter(msg => 
            msg.ruleId && msg.ruleId.includes('security')
          )
        )
        
        results.eslint = {
          totalFiles: eslintData.length,
          securityIssues: securityIssues.length,
          issues: securityIssues
        }
        
        if (securityIssues.length > 0) {
          log.warning(`ESLint 发现 ${securityIssues.length} 个安全问题`)
        } else {
          log.success('ESLint 未发现安全问题')
        }
      } catch (error) {
        log.error('解析 ESLint 结果失败')
      }
    } else {
      log.warning('ESLint 执行失败')
    }
  }
  
  // Semgrep扫描
  if (config.vulnerabilityScanning.codeAnalysis.tools.includes('semgrep')) {
    log.info('运行 Semgrep 扫描...')
    const semgrepResult = execCommand('npx semgrep --config=auto --json .')
    
    if (semgrepResult.success) {
      try {
        const semgrepData = JSON.parse(semgrepResult.output)
        results.semgrep = {
          findings: semgrepData.results || [],
          count: semgrepData.results?.length || 0
        }
        
        if (results.semgrep.count > 0) {
          log.warning(`Semgrep 发现 ${results.semgrep.count} 个安全问题`)
        } else {
          log.success('Semgrep 未发现安全问题')
        }
      } catch (error) {
        log.error('解析 Semgrep 结果失败')
      }
    } else {
      log.warning('Semgrep 扫描失败')
    }
  }
  
  return results
}

// 安全头检查
const checkSecurityHeaders = async (config) => {
  log.title('🛡️  安全头检查')
  
  const results = {
    headers: {},
    score: 0,
    missing: []
  }
  
  // 模拟检查本地构建的HTML文件
  const indexPath = path.resolve('dist/index.html')
  if (fs.existsSync(indexPath)) {
    const htmlContent = fs.readFileSync(indexPath, 'utf8')
    
    // 检查CSP meta标签
    const cspMatch = htmlContent.match(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    if (cspMatch) {
      results.headers['Content-Security-Policy'] = cspMatch[1]
      log.success('找到 Content-Security-Policy')
    } else {
      results.missing.push('Content-Security-Policy')
      log.warning('缺少 Content-Security-Policy')
    }
    
    // 检查其他安全头的meta标签
    const securityHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Referrer-Policy'
    ]
    
    securityHeaders.forEach(header => {
      const headerMatch = htmlContent.match(new RegExp(`<meta[^>]*http-equiv=["']${header}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i'))
      if (headerMatch) {
        results.headers[header] = headerMatch[1]
        log.success(`找到 ${header}`)
      } else {
        results.missing.push(header)
        log.warning(`缺少 ${header}`)
      }
    })
  } else {
    log.warning('未找到构建文件，跳过安全头检查')
  }
  
  // 计算分数
  const totalHeaders = config.securityHeaders.validation.requiredHeaders.length
  const foundHeaders = totalHeaders - results.missing.length
  results.score = Math.round((foundHeaders / totalHeaders) * 100)
  
  return results
}

// 生成安全报告
const generateSecurityReport = (dependencyResults, codeResults, headerResults, config) => {
  log.title('📊 生成安全报告')
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalIssues: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0
    },
    dependencies: dependencyResults,
    codeAnalysis: codeResults,
    securityHeaders: headerResults,
    recommendations: []
  }
  
  // 统计问题数量
  if (dependencyResults.npm) {
    const vulns = dependencyResults.npm.vulnerabilities
    report.summary.criticalIssues += vulns.critical || 0
    report.summary.highIssues += vulns.high || 0
    report.summary.mediumIssues += vulns.moderate || 0
    report.summary.lowIssues += vulns.low || 0
  }
  
  if (codeResults.eslint) {
    report.summary.totalIssues += codeResults.eslint.securityIssues
  }
  
  report.summary.totalIssues = 
    report.summary.criticalIssues + 
    report.summary.highIssues + 
    report.summary.mediumIssues + 
    report.summary.lowIssues
  
  // 生成建议
  if (report.summary.criticalIssues > 0) {
    report.recommendations.push('立即修复所有严重漏洞')
  }
  
  if (report.summary.highIssues > 0) {
    report.recommendations.push('优先修复高危漏洞')
  }
  
  if (headerResults.missing.length > 0) {
    report.recommendations.push(`配置缺失的安全头: ${headerResults.missing.join(', ')}`)
  }
  
  if (headerResults.score < config.securityHeaders.validation.scoring.minimum) {
    report.recommendations.push(`安全头评分过低 (${headerResults.score}%)，需要改进`)
  }
  
  // 保存报告
  const reportPath = path.resolve(config.auditConfig.outputPath, `security-report-${Date.now()}.json`)
  fs.mkdirSync(path.dirname(reportPath), { recursive: true })
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  log.success(`安全报告已保存到: ${reportPath}`)
  
  // 显示摘要
  console.log(chalk.bold('\n📋 安全扫描摘要:'))
  console.log(`  总问题数: ${report.summary.totalIssues}`)
  console.log(chalk.red(`  严重: ${report.summary.criticalIssues}`))
  console.log(chalk.yellow(`  高危: ${report.summary.highIssues}`))
  console.log(chalk.blue(`  中危: ${report.summary.mediumIssues}`))
  console.log(chalk.gray(`  低危: ${report.summary.lowIssues}`))
  console.log(`  安全头评分: ${headerResults.score}%`)
  
  if (report.recommendations.length > 0) {
    console.log(chalk.bold('\n💡 建议:'))
    report.recommendations.forEach(rec => {
      console.log(chalk.cyan(`  • ${rec}`))
    })
  }
  
  return report
}

// 主函数
const main = async () => {
  const args = process.argv.slice(2)
  const scanType = args[0] || 'all'
  
  console.log(chalk.bold.blue('🔐 安全扫描工具\n'))
  
  try {
    const config = loadSecurityConfig()
    
    let dependencyResults = null
    let codeResults = null
    let headerResults = null
    
    switch (scanType) {
      case 'dependencies':
        dependencyResults = await scanDependencies(config)
        break
        
      case 'code':
        codeResults = await analyzeCode(config)
        break
        
      case 'headers':
        headerResults = await checkSecurityHeaders(config)
        break
        
      case 'all':
      default:
        dependencyResults = await scanDependencies(config)
        codeResults = await analyzeCode(config)
        headerResults = await checkSecurityHeaders(config)
        break
    }
    
    // 生成报告
    if (scanType === 'all') {
      const report = generateSecurityReport(dependencyResults, codeResults, headerResults, config)
      
      // 根据问题严重程度设置退出码
      if (report.summary.criticalIssues > 0) {
        process.exit(2)
      } else if (report.summary.highIssues > 0) {
        process.exit(1)
      }
    }
    
    log.success('\n✅ 安全扫描完成')
    
  } catch (error) {
    log.error(`安全扫描失败: ${error.message}`)
    process.exit(1)
  }
}

// 显示帮助信息
const showHelp = () => {
  console.log(`
用法: node scripts/security-scan.js [command]

命令:
  all           - 运行所有安全检查 (默认)
  dependencies  - 仅扫描依赖漏洞
  code          - 仅进行代码安全分析
  headers       - 仅检查安全头配置

选项:
  --help        - 显示此帮助信息
`)
}

// 运行主函数
if (require.main === module) {
  if (process.argv.includes('--help')) {
    showHelp()
  } else {
    main()
  }
}

module.exports = {
  scanDependencies,
  analyzeCode,
  checkSecurityHeaders,
  generateSecurityReport
}
