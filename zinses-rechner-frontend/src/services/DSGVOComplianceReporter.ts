/**
 * DSGVO合规性报告生成器
 * 生成详细的DSGVO合规性报告和建议
 * 
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import type { User } from '@/types/user-identity'
import type { 
  DSGVOComplianceResult, 
  DSGVOViolation, 
  DSGVOWarning, 
  DSGVORecommendation 
} from './DSGVOComplianceValidator'
import { DSGVOComplianceValidator } from './DSGVOComplianceValidator'

// 报告格式类型
export type ReportFormat = 'html' | 'markdown' | 'json' | 'pdf'

// 报告配置
export interface ReportConfig {
  format: ReportFormat
  includeAuditTrail: boolean
  includeRecommendations: boolean
  includeViolationDetails: boolean
  language: 'de' | 'en'
}

// 默认报告配置
export const DEFAULT_REPORT_CONFIG: ReportConfig = {
  format: 'html',
  includeAuditTrail: true,
  includeRecommendations: true,
  includeViolationDetails: true,
  language: 'de'
}

/**
 * DSGVO合规性报告生成器
 */
export class DSGVOComplianceReporter {
  private static instance: DSGVOComplianceReporter | null = null
  private validator: DSGVOComplianceValidator

  private constructor() {
    this.validator = DSGVOComplianceValidator.getInstance()
  }

  /**
   * 获取报告生成器单例实例
   */
  static getInstance(): DSGVOComplianceReporter {
    if (!DSGVOComplianceReporter.instance) {
      DSGVOComplianceReporter.instance = new DSGVOComplianceReporter()
    }
    return DSGVOComplianceReporter.instance
  }

  /**
   * 生成用户合规性报告
   */
  generateUserComplianceReport(
    user: User, 
    config: Partial<ReportConfig> = {}
  ): string {
    const finalConfig = { ...DEFAULT_REPORT_CONFIG, ...config }
    const complianceResult = this.validator.validateUserCompliance(user)

    switch (finalConfig.format) {
      case 'html':
        return this.generateHTMLReport(user, complianceResult, finalConfig)
      case 'markdown':
        return this.generateMarkdownReport(user, complianceResult, finalConfig)
      case 'json':
        return this.generateJSONReport(user, complianceResult, finalConfig)
      default:
        throw new Error(`Unsupported report format: ${finalConfig.format}`)
    }
  }

  /**
   * 生成HTML格式报告
   */
  private generateHTMLReport(
    user: User, 
    result: DSGVOComplianceResult, 
    config: ReportConfig
  ): string {
    const title = config.language === 'de' ? 'DSGVO-Konformitätsbericht' : 'GDPR Compliance Report'
    const timestamp = new Date().toLocaleString(config.language === 'de' ? 'de-DE' : 'en-US')

    let html = `
<!DOCTYPE html>
<html lang="${config.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .score { font-size: 2em; font-weight: bold; color: ${result.complianceScore >= 80 ? '#28a745' : result.complianceScore >= 60 ? '#ffc107' : '#dc3545'}; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .violation { background: #f8d7da; border-color: #f5c6cb; padding: 10px; margin: 10px 0; border-radius: 3px; }
        .warning { background: #fff3cd; border-color: #ffeaa7; padding: 10px; margin: 10px 0; border-radius: 3px; }
        .recommendation { background: #d1ecf1; border-color: #bee5eb; padding: 10px; margin: 10px 0; border-radius: 3px; }
        .severity-critical { border-left: 5px solid #dc3545; }
        .severity-high { border-left: 5px solid #fd7e14; }
        .severity-medium { border-left: 5px solid #ffc107; }
        .severity-low { border-left: 5px solid #28a745; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <p><strong>Benutzer-ID:</strong> ${user.id}</p>
        <p><strong>Benutzertyp:</strong> ${user.type === 'anonymous' ? 'Anonym' : 'Registriert'}</p>
        <p><strong>Erstellt am:</strong> ${timestamp}</p>
        <div class="score">Konformitätsbewertung: ${result.complianceScore}/100</div>
        <p><strong>Status:</strong> ${result.isCompliant ? '✅ Konform' : '❌ Nicht konform'}</p>
    </div>
`

    // Verstöße
    if (result.violations.length > 0) {
      html += `
    <div class="section">
        <h2>🚨 DSGVO-Verstöße (${result.violations.length})</h2>
`
      result.violations.forEach(violation => {
        html += `
        <div class="violation severity-${violation.severity}">
            <h3>${violation.article}: ${violation.description}</h3>
            ${violation.field ? `<p><strong>Feld:</strong> ${violation.field}</p>` : ''}
            <p><strong>Schweregrad:</strong> ${violation.severity.toUpperCase()}</p>
            <p><strong>Risikostufe:</strong> ${violation.riskLevel}/10</p>
            <p><strong>Abhilfe:</strong> ${violation.remediation}</p>
        </div>
`
      })
      html += `    </div>`
    }

    // Warnungen
    if (result.warnings.length > 0) {
      html += `
    <div class="section">
        <h2>⚠️ Warnungen (${result.warnings.length})</h2>
`
      result.warnings.forEach(warning => {
        html += `
        <div class="warning">
            <h3>${warning.article}: ${warning.description}</h3>
            <p><strong>Empfehlung:</strong> ${warning.recommendation}</p>
        </div>
`
      })
      html += `    </div>`
    }

    // Empfehlungen
    if (config.includeRecommendations && result.recommendations.length > 0) {
      html += `
    <div class="section">
        <h2>💡 Empfehlungen (${result.recommendations.length})</h2>
`
      result.recommendations.forEach(rec => {
        html += `
        <div class="recommendation">
            <h3>${rec.description}</h3>
            <p><strong>Kategorie:</strong> ${rec.category}</p>
            <p><strong>Priorität:</strong> ${rec.priority.toUpperCase()}</p>
            <p><strong>Umsetzung:</strong> ${rec.implementation}</p>
        </div>
`
      })
      html += `    </div>`
    }

    // Audit-Trail
    if (config.includeAuditTrail && result.auditTrail.length > 0) {
      html += `
    <div class="section">
        <h2>📋 Audit-Protokoll (${result.auditTrail.length} Einträge)</h2>
        <table border="1" style="width: 100%; border-collapse: collapse;">
            <tr>
                <th>Zeitstempel</th>
                <th>Aktion</th>
                <th>Details</th>
                <th>Konform</th>
            </tr>
`
      result.auditTrail.forEach(entry => {
        html += `
            <tr>
                <td>${entry.timestamp.toLocaleString('de-DE')}</td>
                <td>${entry.action}</td>
                <td>${JSON.stringify(entry.details)}</td>
                <td>${entry.compliance ? '✅' : '❌'}</td>
            </tr>
`
      })
      html += `
        </table>
    </div>
`
    }

    html += `
</body>
</html>
`
    return html
  }

  /**
   * 生成Markdown格式报告
   */
  private generateMarkdownReport(
    user: User, 
    result: DSGVOComplianceResult, 
    config: ReportConfig
  ): string {
    const timestamp = new Date().toLocaleString(config.language === 'de' ? 'de-DE' : 'en-US')
    
    let markdown = `# DSGVO-Konformitätsbericht

**Benutzer-ID:** ${user.id}  
**Benutzertyp:** ${user.type === 'anonymous' ? 'Anonym' : 'Registriert'}  
**Erstellt am:** ${timestamp}  

## 📊 Bewertung

**Konformitätsbewertung:** ${result.complianceScore}/100  
**Status:** ${result.isCompliant ? '✅ Konform' : '❌ Nicht konform'}

`

    // Verstöße
    if (result.violations.length > 0) {
      markdown += `## 🚨 DSGVO-Verstöße (${result.violations.length})

`
      result.violations.forEach(violation => {
        markdown += `### ${violation.article}: ${violation.description}

- **Feld:** ${violation.field || 'N/A'}
- **Schweregrad:** ${violation.severity.toUpperCase()}
- **Risikostufe:** ${violation.riskLevel}/10
- **Abhilfe:** ${violation.remediation}

`
      })
    }

    // Warnungen
    if (result.warnings.length > 0) {
      markdown += `## ⚠️ Warnungen (${result.warnings.length})

`
      result.warnings.forEach(warning => {
        markdown += `### ${warning.article}: ${warning.description}

**Empfehlung:** ${warning.recommendation}

`
      })
    }

    // Empfehlungen
    if (config.includeRecommendations && result.recommendations.length > 0) {
      markdown += `## 💡 Empfehlungen (${result.recommendations.length})

`
      result.recommendations.forEach(rec => {
        markdown += `### ${rec.description}

- **Kategorie:** ${rec.category}
- **Priorität:** ${rec.priority.toUpperCase()}
- **Umsetzung:** ${rec.implementation}

`
      })
    }

    return markdown
  }

  /**
   * 生成JSON格式报告
   */
  private generateJSONReport(
    user: User, 
    result: DSGVOComplianceResult, 
    config: ReportConfig
  ): string {
    const report = {
      metadata: {
        userId: user.id,
        userType: user.type,
        generatedAt: new Date().toISOString(),
        reportVersion: '1.0.0',
        language: config.language
      },
      compliance: {
        score: result.complianceScore,
        isCompliant: result.isCompliant,
        violationsCount: result.violations.length,
        warningsCount: result.warnings.length,
        recommendationsCount: result.recommendations.length
      },
      violations: config.includeViolationDetails ? result.violations : result.violations.length,
      warnings: result.warnings,
      recommendations: config.includeRecommendations ? result.recommendations : [],
      auditTrail: config.includeAuditTrail ? result.auditTrail : []
    }

    return JSON.stringify(report, null, 2)
  }

  /**
   * 生成批量用户合规性摘要
   */
  generateBatchComplianceSummary(users: User[]): string {
    const results = users.map(user => ({
      userId: user.id,
      userType: user.type,
      compliance: this.validator.validateUserCompliance(user)
    }))

    const totalUsers = results.length
    const compliantUsers = results.filter(r => r.compliance.isCompliant).length
    const averageScore = results.reduce((sum, r) => sum + r.compliance.complianceScore, 0) / totalUsers
    const totalViolations = results.reduce((sum, r) => sum + r.compliance.violations.length, 0)
    const totalWarnings = results.reduce((sum, r) => sum + r.compliance.warnings.length, 0)

    return `# Batch-Konformitätsbericht

**Gesamtbenutzer:** ${totalUsers}  
**Konforme Benutzer:** ${compliantUsers} (${Math.round(compliantUsers / totalUsers * 100)}%)  
**Durchschnittliche Bewertung:** ${Math.round(averageScore)}/100  
**Gesamtverstöße:** ${totalViolations}  
**Gesamtwarnungen:** ${totalWarnings}  

## Detaillierte Ergebnisse

${results.map(r => `- **${r.userId}** (${r.userType}): ${r.compliance.complianceScore}/100 ${r.compliance.isCompliant ? '✅' : '❌'}`).join('\n')}
`
  }
}

// 导出单例实例
export const dsgvoComplianceReporter = DSGVOComplianceReporter.getInstance()
