/**
 * DSGVO合规性验证器
 * 验证用户身份管理系统是否符合德国数据保护法规
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import type {
  User,
  AnonymousUser,
  RegisteredUser,
  ConsentSettings,
  DataProcessingPurpose,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from '@/types/user-identity'

import { DSGVO_CONSTANTS } from '@/types/user-identity'
import { createValidationError, createValidationWarning } from '@/utils/validation-helpers'

// DSGVO合规性检查结果
export interface DSGVOComplianceResult {
  isCompliant: boolean
  complianceScore: number // 0-100分
  violations: DSGVOViolation[]
  warnings: DSGVOWarning[]
  recommendations: DSGVORecommendation[]
  auditTrail: DSGVOAuditEntry[]
}

// DSGVO违规记录
export interface DSGVOViolation {
  article: string // DSGVO条款编号
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  field?: string
  remediation: string
  riskLevel: number // 1-10
}

// DSGVO警告
export interface DSGVOWarning {
  article: string
  description: string
  recommendation: string
}

// DSGVO建议
export interface DSGVORecommendation {
  category: 'data_minimization' | 'consent' | 'security' | 'transparency' | 'rights'
  priority: 'low' | 'medium' | 'high'
  description: string
  implementation: string
}

// DSGVO审计记录
export interface DSGVOAuditEntry {
  timestamp: Date
  action: string
  details: Record<string, any>
  compliance: boolean
}

/**
 * DSGVO合规性验证器
 */
export class DSGVOComplianceValidator {
  private static instance: DSGVOComplianceValidator | null = null
  private auditLog: DSGVOAuditEntry[] = []

  private constructor() {}

  /**
   * 获取验证器单例实例
   */
  static getInstance(): DSGVOComplianceValidator {
    if (!DSGVOComplianceValidator.instance) {
      DSGVOComplianceValidator.instance = new DSGVOComplianceValidator()
    }
    return DSGVOComplianceValidator.instance
  }

  /**
   * 验证用户数据的DSGVO合规性
   */
  validateUserCompliance(user: User): DSGVOComplianceResult {
    const violations: DSGVOViolation[] = []
    const warnings: DSGVOWarning[] = []
    const recommendations: DSGVORecommendation[] = []

    // 记录审计
    this.addAuditEntry('user_compliance_check', { userId: user.id, userType: user.type })

    // 第6条：数据处理的合法性
    this.validateLegalBasis(user, violations, warnings)

    // 第7条：同意条件
    this.validateConsent(user, violations, warnings, recommendations)

    // 第5条：数据处理原则
    this.validateDataProcessingPrinciples(user, violations, warnings, recommendations)

    // 第13条：数据主体信息提供
    this.validateTransparency(user, violations, warnings, recommendations)

    // 第17条：删除权（被遗忘权）
    this.validateRightToErasure(user, violations, warnings, recommendations)

    // 第20条：数据可携带权
    this.validateDataPortability(user, violations, warnings, recommendations)

    // 第25条：数据保护设计和默认
    this.validatePrivacyByDesign(user, violations, warnings, recommendations)

    // 第32条：处理安全
    this.validateProcessingSecurity(user, violations, warnings, recommendations)

    // 计算合规分数
    const complianceScore = this.calculateComplianceScore(violations, warnings)

    return {
      isCompliant: violations.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0,
      complianceScore,
      violations,
      warnings,
      recommendations,
      auditTrail: [...this.auditLog]
    }
  }

  /**
   * 验证数据处理的合法基础（第6条）
   */
  private validateLegalBasis(user: User, violations: DSGVOViolation[], warnings: DSGVOWarning[]): void {
    // 检查功能性数据处理的合法利益基础
    if (user.consentSettings.functional.legalBasis !== 'legitimate_interest') {
      violations.push({
        article: 'Art. 6(1)(f)',
        severity: 'medium',
        description: 'Funktionale Datenverarbeitung sollte auf berechtigtem Interesse basieren',
        field: 'consentSettings.functional.legalBasis',
        remediation: 'Setzen Sie die Rechtsgrundlage für funktionale Verarbeitung auf "legitimate_interest"',
        riskLevel: 5
      })
    }

    // 检查分析和营销数据处理的同意基础
    if (user.consentSettings.analytics.status === 'granted' && 
        user.consentSettings.analytics.legalBasis !== 'consent') {
      violations.push({
        article: 'Art. 6(1)(a)',
        severity: 'high',
        description: 'Analytische Datenverarbeitung erfordert explizite Einwilligung',
        field: 'consentSettings.analytics.legalBasis',
        remediation: 'Setzen Sie die Rechtsgrundlage für Analytik auf "consent"',
        riskLevel: 8
      })
    }

    if (user.consentSettings.marketing.status === 'granted' && 
        user.consentSettings.marketing.legalBasis !== 'consent') {
      violations.push({
        article: 'Art. 6(1)(a)',
        severity: 'high',
        description: 'Marketing-Datenverarbeitung erfordert explizite Einwilligung',
        field: 'consentSettings.marketing.legalBasis',
        remediation: 'Setzen Sie die Rechtsgrundlage für Marketing auf "consent"',
        riskLevel: 8
      })
    }
  }

  /**
   * 验证同意条件（第7条）
   */
  private validateConsent(
    user: User, 
    violations: DSGVOViolation[], 
    warnings: DSGVOWarning[], 
    recommendations: DSGVORecommendation[]
  ): void {
    const consent = user.consentSettings

    // 检查同意的具体性和明确性
    if (consent.analytics.status === 'granted' && consent.analytics.purposes.length === 0) {
      violations.push({
        article: 'Art. 7(2)',
        severity: 'high',
        description: 'Einwilligung muss spezifische Zwecke definieren',
        field: 'consentSettings.analytics.purposes',
        remediation: 'Definieren Sie spezifische Zwecke für die Analytik-Einwilligung',
        riskLevel: 7
      })
    }

    // 检查同意的可撤回性
    if (consent.analytics.status === 'granted' && !consent.lastUpdated) {
      warnings.push({
        article: 'Art. 7(3)',
        description: 'Einwilligung sollte einfach widerrufbar sein',
        recommendation: 'Implementieren Sie einen einfachen Widerrufsmechanismus'
      })
    }

    // 检查同意记录
    if (!consent.consentDate || consent.consentDate > new Date()) {
      violations.push({
        article: 'Art. 7(1)',
        severity: 'medium',
        description: 'Einwilligung muss nachweisbar sein',
        field: 'consentSettings.consentDate',
        remediation: 'Stellen Sie sicher, dass das Einwilligungsdatum korrekt gesetzt ist',
        riskLevel: 6
      })
    }

    // Empfehlung für granulare Einwilligung
    recommendations.push({
      category: 'consent',
      priority: 'high',
      description: 'Implementieren Sie granulare Einwilligungsoptionen',
      implementation: 'Ermöglichen Sie Benutzern, spezifische Datenverarbeitungszwecke einzeln zu kontrollieren'
    })
  }

  /**
   * 验证数据处理原则（第5条）
   */
  private validateDataProcessingPrinciples(
    user: User, 
    violations: DSGVOViolation[], 
    warnings: DSGVOWarning[], 
    recommendations: DSGVORecommendation[]
  ): void {
    // 数据最小化原则
    if (user.type === 'anonymous' && user.deviceFingerprint.length > 100) {
      warnings.push({
        article: 'Art. 5(1)(c)',
        description: 'Geräte-Fingerprint könnte zu detailliert sein',
        recommendation: 'Reduzieren Sie die Detailtiefe des Geräte-Fingerprints'
      })
    }

    // 存储限制原则
    const retentionDays = user.preferences.dataRetentionDays
    if (retentionDays > DSGVO_CONSTANTS.MAX_RETENTION_DAYS) {
      violations.push({
        article: 'Art. 5(1)(e)',
        severity: 'medium',
        description: 'Aufbewahrungsfrist überschreitet zulässige Grenzen',
        field: 'preferences.dataRetentionDays',
        remediation: `Reduzieren Sie die Aufbewahrungsfrist auf maximal ${DSGVO_CONSTANTS.MAX_RETENTION_DAYS} Tage`,
        riskLevel: 6
      })
    }

    // 检查数据是否过期
    const daysSinceLastActive = (Date.now() - user.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceLastActive > retentionDays) {
      violations.push({
        article: 'Art. 5(1)(e)',
        severity: 'high',
        description: 'Daten haben die Aufbewahrungsfrist überschritten',
        remediation: 'Löschen Sie abgelaufene Daten oder verlängern Sie die Aufbewahrungsfrist',
        riskLevel: 8
      })
    }

    // Datenminimierung Empfehlung
    recommendations.push({
      category: 'data_minimization',
      priority: 'medium',
      description: 'Implementieren Sie automatische Datenbereinigung',
      implementation: 'Richten Sie automatische Löschung abgelaufener Daten ein'
    })
  }

  /**
   * 验证透明度要求（第13条）
   */
  private validateTransparency(
    user: User, 
    violations: DSGVOViolation[], 
    warnings: DSGVOWarning[], 
    recommendations: DSGVORecommendation[]
  ): void {
    // 检查数据处理目的的透明度
    const purposes = user.consentSettings.functional.purposes
    if (purposes.length === 0) {
      violations.push({
        article: 'Art. 13(1)(c)',
        severity: 'medium',
        description: 'Zwecke der Datenverarbeitung müssen klar definiert sein',
        field: 'consentSettings.functional.purposes',
        remediation: 'Definieren Sie klare Zwecke für die funktionale Datenverarbeitung',
        riskLevel: 5
      })
    }

    // Transparenz Empfehlung
    recommendations.push({
      category: 'transparency',
      priority: 'high',
      description: 'Erstellen Sie eine umfassende Datenschutzerklärung',
      implementation: 'Dokumentieren Sie alle Datenverarbeitungsaktivitäten transparent'
    })
  }

  /**
   * 验证删除权（第17条）
   */
  private validateRightToErasure(
    user: User, 
    violations: DSGVOViolation[], 
    warnings: DSGVOWarning[], 
    recommendations: DSGVORecommendation[]
  ): void {
    // 检查是否有删除机制
    if (user.type === 'registered') {
      recommendations.push({
        category: 'rights',
        priority: 'high',
        description: 'Implementieren Sie Löschfunktionalität',
        implementation: 'Ermöglichen Sie Benutzern, ihre Daten vollständig zu löschen'
      })
    }
  }

  /**
   * 验证数据可携带权（第20条）
   */
  private validateDataPortability(
    user: User, 
    violations: DSGVOViolation[], 
    warnings: DSGVOWarning[], 
    recommendations: DSGVORecommendation[]
  ): void {
    if (user.type === 'registered') {
      recommendations.push({
        category: 'rights',
        priority: 'medium',
        description: 'Implementieren Sie Datenexport-Funktionalität',
        implementation: 'Ermöglichen Sie Benutzern, ihre Daten in einem strukturierten Format zu exportieren'
      })
    }
  }

  /**
   * 验证隐私设计和默认（第25条）
   */
  private validatePrivacyByDesign(
    user: User, 
    violations: DSGVOViolation[], 
    warnings: DSGVOWarning[], 
    recommendations: DSGVORecommendation[]
  ): void {
    // 检查默认隐私设置
    if (user.consentSettings.analytics.status === 'granted' && 
        user.consentSettings.analytics.source === 'initial_setup') {
      violations.push({
        article: 'Art. 25(2)',
        severity: 'high',
        description: 'Analytik sollte nicht standardmäßig aktiviert sein',
        field: 'consentSettings.analytics.status',
        remediation: 'Setzen Sie Analytik standardmäßig auf "denied"',
        riskLevel: 7
      })
    }

    if (user.consentSettings.marketing.status === 'granted' && 
        user.consentSettings.marketing.source === 'initial_setup') {
      violations.push({
        article: 'Art. 25(2)',
        severity: 'high',
        description: 'Marketing sollte nicht standardmäßig aktiviert sein',
        field: 'consentSettings.marketing.status',
        remediation: 'Setzen Sie Marketing standardmäßig auf "denied"',
        riskLevel: 7
      })
    }
  }

  /**
   * 验证处理安全（第32条）
   */
  private validateProcessingSecurity(
    user: User, 
    violations: DSGVOViolation[], 
    warnings: DSGVOWarning[], 
    recommendations: DSGVORecommendation[]
  ): void {
    // 检查设备指纹的安全性
    if (user.deviceFingerprint.length < 10) {
      warnings.push({
        article: 'Art. 32(1)',
        description: 'Geräte-Fingerprint könnte zu schwach sein',
        recommendation: 'Verwenden Sie einen stärkeren Geräte-Fingerprint-Algorithmus'
      })
    }

    // Sicherheits Empfehlung
    recommendations.push({
      category: 'security',
      priority: 'high',
      description: 'Implementieren Sie Datenverschlüsselung',
      implementation: 'Verschlüsseln Sie alle gespeicherten Benutzerdaten'
    })
  }

  /**
   * 计算合规分数
   */
  private calculateComplianceScore(violations: DSGVOViolation[], warnings: DSGVOWarning[]): number {
    let score = 100

    // 根据违规严重程度扣分
    violations.forEach(violation => {
      switch (violation.severity) {
        case 'critical':
          score -= 25
          break
        case 'high':
          score -= 15
          break
        case 'medium':
          score -= 10
          break
        case 'low':
          score -= 5
          break
      }
    })

    // 根据警告扣分
    warnings.forEach(() => {
      score -= 2
    })

    return Math.max(0, score)
  }

  /**
   * 添加审计记录
   */
  private addAuditEntry(action: string, details: Record<string, any>): void {
    this.auditLog.push({
      timestamp: new Date(),
      action,
      details,
      compliance: true
    })
  }

  /**
   * 获取审计日志
   */
  getAuditLog(): DSGVOAuditEntry[] {
    return [...this.auditLog]
  }

  /**
   * 清除审计日志
   */
  clearAuditLog(): void {
    this.auditLog = []
  }
}

// 导出单例实例
export const dsgvoComplianceValidator = DSGVOComplianceValidator.getInstance()
