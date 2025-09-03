/**
 * DSGVO合规性检查测试
 * 运行完整的DSGVO合规性验证
 */

import { describe, it, expect } from 'vitest'
import { DSGVOComplianceValidator } from '@/services/DSGVOComplianceValidator'
import { createAnonymousUser, upgradeToRegisteredUser } from '@/utils/user-identity-utils'
import type { DSGVOComplianceResult, User } from '@/types/user-identity'

// 颜色输出工具
const colors = {
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
  dim: (text: string) => `\x1b[2m${text}\x1b[0m`
}

interface ComplianceCheckResult {
  testName: string
  user: User
  result: DSGVOComplianceResult
  passed: boolean
}

class DSGVOComplianceChecker {
  private validator: DSGVOComplianceValidator
  private results: ComplianceCheckResult[] = []

  constructor() {
    this.validator = DSGVOComplianceValidator.getInstance()
  }

  /**
   * 运行完整的DSGVO合规性检查
   */
  async runFullComplianceCheck(): Promise<ComplianceCheckResult[]> {
    console.log(colors.bold('\n🔍 DSGVO合规性自动检查开始\n'))
    console.log(colors.dim('检查德国数据保护法规(DSGVO)合规性...\n'))

    // 清除之前的审计日志
    this.validator.clearAuditLog()

    // 测试场景1：标准匿名用户
    await this.checkStandardAnonymousUser()

    // 测试场景2：标准注册用户
    await this.checkStandardRegisteredUser()

    // 测试场景3：有问题的用户数据
    await this.checkProblematicUser()

    // 测试场景4：边界情况
    await this.checkEdgeCases()

    // 生成报告
    this.generateComplianceReport()

    return this.results
  }

  /**
   * 检查标准匿名用户
   */
  private async checkStandardAnonymousUser(): Promise<void> {
    console.log(colors.blue('📋 测试场景1：标准匿名用户'))
    
    const user = createAnonymousUser()
    const result = this.validator.validateUserCompliance(user)
    
    this.results.push({
      testName: '标准匿名用户合规性',
      user,
      result,
      passed: result.isCompliant && result.complianceScore >= 90
    })

    this.printTestResult('标准匿名用户', result)
  }

  /**
   * 检查标准注册用户
   */
  private async checkStandardRegisteredUser(): Promise<void> {
    console.log(colors.blue('📋 测试场景2：标准注册用户'))
    
    const anonymousUser = createAnonymousUser()
    const user = upgradeToRegisteredUser(anonymousUser, 'test@example.de')
    const result = this.validator.validateUserCompliance(user)
    
    this.results.push({
      testName: '标准注册用户合规性',
      user,
      result,
      passed: result.isCompliant && result.complianceScore >= 90
    })

    this.printTestResult('标准注册用户', result)
  }

  /**
   * 检查有问题的用户数据
   */
  private async checkProblematicUser(): Promise<void> {
    console.log(colors.blue('📋 测试场景3：有问题的用户数据'))
    
    // 创建有多个违规的用户
    const user = createAnonymousUser({
      preferences: {
        dataRetentionDays: 2000, // 超过最大保留期限
        language: 'de',
        currency: 'EUR',
        theme: 'auto',
        autoSave: true
      },
      consentSettings: {
        functional: {
          status: 'granted',
          timestamp: new Date(),
          source: 'initial_setup',
          legalBasis: 'legitimate_interest',
          purposes: ['calculation_history'],
          retentionPeriod: 365
        },
        analytics: {
          status: 'granted', // 默认启用分析（违规）
          timestamp: new Date(),
          source: 'initial_setup', // 初始设置（违规）
          legalBasis: 'consent',
          purposes: [], // 没有具体目的（违规）
          retentionPeriod: 365
        },
        marketing: {
          status: 'granted', // 默认启用营销（违规）
          timestamp: new Date(),
          source: 'initial_setup',
          legalBasis: 'consent',
          purposes: ['email_marketing'],
          retentionPeriod: 365
        },
        crossDeviceSync: {
          status: 'denied',
          timestamp: new Date(),
          source: 'user_action',
          legalBasis: 'consent',
          purposes: [],
          retentionPeriod: 365
        },
        consentDate: new Date(),
        consentVersion: '1.0'
      }
    })

    const result = this.validator.validateUserCompliance(user)
    
    this.results.push({
      testName: '有问题的用户数据',
      user,
      result,
      passed: !result.isCompliant && result.violations.length > 0
    })

    this.printTestResult('有问题的用户数据', result)
  }

  /**
   * 检查边界情况
   */
  private async checkEdgeCases(): Promise<void> {
    console.log(colors.blue('📋 测试场景4：边界情况'))
    
    // 创建数据即将过期的用户
    const user = createAnonymousUser()
    // 设置为364天前创建（接近365天限制）
    const oldDate = new Date(Date.now() - 364 * 24 * 60 * 60 * 1000)
    Object.defineProperty(user, 'createdAt', { value: oldDate, writable: false })
    user.lastActiveAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30天未活跃

    const result = this.validator.validateUserCompliance(user)
    
    this.results.push({
      testName: '边界情况：数据即将过期',
      user,
      result,
      passed: result.warnings.length > 0 || result.recommendations.length > 0
    })

    this.printTestResult('边界情况', result)
  }

  /**
   * 打印单个测试结果
   */
  private printTestResult(testName: string, result: DSGVOComplianceResult): void {
    const status = result.isCompliant ? colors.green('✅ 合规') : colors.red('❌ 不合规')
    const score = result.complianceScore >= 90 ? colors.green(`${result.complianceScore}分`) : 
                  result.complianceScore >= 70 ? colors.yellow(`${result.complianceScore}分`) : 
                  colors.red(`${result.complianceScore}分`)

    console.log(`   ${status} | 合规分数: ${score}`)
    
    if (result.violations.length > 0) {
      console.log(colors.red(`   违规项 (${result.violations.length}个):`))
      result.violations.forEach(violation => {
        const severity = violation.severity === 'critical' ? colors.red('🔴') :
                        violation.severity === 'high' ? colors.red('🟠') :
                        violation.severity === 'medium' ? colors.yellow('🟡') : '🔵'
        console.log(`     ${severity} ${violation.article}: ${violation.description}`)
      })
    }

    if (result.warnings.length > 0) {
      console.log(colors.yellow(`   警告 (${result.warnings.length}个):`))
      result.warnings.forEach(warning => {
        console.log(`     ⚠️  ${warning.article}: ${warning.description}`)
      })
    }

    console.log() // 空行分隔
  }

  /**
   * 生成合规性报告
   */
  private generateComplianceReport(): void {
    console.log(colors.bold('📊 DSGVO合规性检查报告\n'))
    console.log('=' .repeat(60))

    const totalTests = this.results.length
    const passedTests = this.results.filter(r => r.passed).length
    const failedTests = totalTests - passedTests

    // 总体统计
    console.log(colors.bold('总体统计:'))
    console.log(`   测试总数: ${totalTests}`)
    console.log(`   通过测试: ${colors.green(passedTests.toString())}`)
    console.log(`   失败测试: ${failedTests > 0 ? colors.red(failedTests.toString()) : colors.green('0')}`)
    console.log(`   通过率: ${colors.bold(((passedTests / totalTests) * 100).toFixed(1) + '%')}\n`)

    // 详细结果
    console.log(colors.bold('详细结果:'))
    this.results.forEach((result, index) => {
      const status = result.passed ? colors.green('✅') : colors.red('❌')
      const score = result.result.complianceScore >= 90 ? colors.green(`${result.result.complianceScore}分`) : 
                    result.result.complianceScore >= 70 ? colors.yellow(`${result.result.complianceScore}分`) : 
                    colors.red(`${result.result.complianceScore}分`)
      
      console.log(`   ${index + 1}. ${status} ${result.testName} - ${score}`)
    })

    // 合规性建议
    console.log('\n' + colors.bold('合规性建议:'))
    const allRecommendations = this.results.flatMap(r => r.result.recommendations)
    const uniqueRecommendations = Array.from(new Set(allRecommendations.map(r => r.description)))
    
    if (uniqueRecommendations.length > 0) {
      uniqueRecommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`)
      })
    } else {
      console.log(colors.green('   🎉 没有发现需要改进的地方！'))
    }

    // 审计日志统计
    const auditLog = this.validator.getAuditLog()
    console.log('\n' + colors.bold('审计统计:'))
    console.log(`   审计记录总数: ${auditLog.length}`)
    if (auditLog.length > 0) {
      console.log(`   检查时间范围: ${auditLog[0]?.timestamp.toLocaleString('de-DE')} - ${auditLog[auditLog.length - 1]?.timestamp.toLocaleString('de-DE')}`)
    }

    console.log('\n' + '=' .repeat(60))
    
    // 最终结论
    if (failedTests === 0) {
      console.log(colors.green(colors.bold('🎉 恭喜！系统完全符合DSGVO要求！')))
    } else {
      console.log(colors.red(colors.bold('⚠️  发现合规性问题，请根据上述建议进行改进。')))
    }
  }
}

describe('DSGVO合规性自动检查', () => {
  it('应该运行完整的DSGVO合规性检查', async () => {
    const checker = new DSGVOComplianceChecker()
    const results = await checker.runFullComplianceCheck()
    
    // 验证所有测试都运行了
    expect(results).toHaveLength(4)
    
    // 验证标准用户应该是合规的
    const standardAnonymousResult = results.find(r => r.testName === '标准匿名用户合规性')
    const standardRegisteredResult = results.find(r => r.testName === '标准注册用户合规性')
    
    expect(standardAnonymousResult?.result.isCompliant).toBe(true)
    expect(standardRegisteredResult?.result.isCompliant).toBe(true)
    
    // 验证有问题的用户应该不合规
    const problematicResult = results.find(r => r.testName === '有问题的用户数据')
    expect(problematicResult?.result.isCompliant).toBe(false)
    expect(problematicResult?.result.violations.length).toBeGreaterThan(0)
    
    // 验证边界情况应该有警告或建议
    const edgeCaseResult = results.find(r => r.testName === '边界情况：数据即将过期')
    expect(edgeCaseResult?.result.warnings.length + edgeCaseResult?.result.recommendations.length).toBeGreaterThan(0)
  })
})
