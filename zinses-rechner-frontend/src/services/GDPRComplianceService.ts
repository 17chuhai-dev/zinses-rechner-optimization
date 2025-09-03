/**
 * GDPR合规性服务
 * 实现GDPR数据保护法规的合规性功能
 */

import { ref, reactive, computed } from 'vue'
import { logger } from './LoggingService'
import { securityService } from './SecurityService'

// 数据处理目的
export enum ProcessingPurpose {
  NECESSARY = 'necessary', // 合同履行必需
  LEGITIMATE = 'legitimate', // 合法利益
  CONSENT = 'consent', // 用户同意
  LEGAL = 'legal', // 法律义务
  VITAL = 'vital', // 生命利益
  PUBLIC = 'public' // 公共任务
}

// 数据类别
export enum DataCategory {
  PERSONAL = 'personal', // 个人数据
  SENSITIVE = 'sensitive', // 敏感数据
  FINANCIAL = 'financial', // 财务数据
  TECHNICAL = 'technical', // 技术数据
  USAGE = 'usage' // 使用数据
}

// 同意状态
export enum ConsentStatus {
  GIVEN = 'given',
  WITHDRAWN = 'withdrawn',
  PENDING = 'pending',
  EXPIRED = 'expired'
}

// 数据主体权利
export enum DataSubjectRight {
  ACCESS = 'access', // 访问权
  RECTIFICATION = 'rectification', // 更正权
  ERASURE = 'erasure', // 删除权
  RESTRICTION = 'restriction', // 限制处理权
  PORTABILITY = 'portability', // 数据可携权
  OBJECTION = 'objection' // 反对权
}

// 同意记录接口
interface ConsentRecord {
  id: string
  userId: string
  purpose: ProcessingPurpose
  category: DataCategory
  status: ConsentStatus
  timestamp: Date
  expiryDate?: Date
  withdrawnAt?: Date
  ipAddress: string
  userAgent: string
  version: string
}

// 数据处理记录接口
interface ProcessingRecord {
  id: string
  userId: string
  dataType: DataCategory
  purpose: ProcessingPurpose
  legalBasis: string
  timestamp: Date
  retention: number // 保留期限（天）
  location: string // 处理位置
  thirdParties?: string[] // 第三方接收者
}

// 数据主体请求接口
interface DataSubjectRequest {
  id: string
  userId: string
  type: DataSubjectRight
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  requestDate: Date
  completionDate?: Date
  description: string
  response?: string
  documents?: string[]
}

// GDPR配置接口
interface GDPRConfig {
  consentRequired: boolean
  cookieConsent: boolean
  dataRetentionDays: number
  anonymizationDelay: number
  requestResponseDays: number
  dpoContact: string
  privacyPolicyUrl: string
  cookiePolicyUrl: string
}

class GDPRComplianceService {
  private static instance: GDPRComplianceService
  private config: GDPRConfig
  private consentRecords = reactive<Map<string, ConsentRecord>>(new Map())
  private processingRecords = reactive<ProcessingRecord[]>([])
  private dataSubjectRequests = reactive<DataSubjectRequest[]>([])
  private isInitialized = ref(false)

  private constructor() {
    this.config = this.getDefaultConfig()
    this.initialize()
  }

  public static getInstance(): GDPRComplianceService {
    if (!GDPRComplianceService.instance) {
      GDPRComplianceService.instance = new GDPRComplianceService()
    }
    return GDPRComplianceService.instance
  }

  private getDefaultConfig(): GDPRConfig {
    return {
      consentRequired: true,
      cookieConsent: true,
      dataRetentionDays: 365 * 2, // 2年
      anonymizationDelay: 30, // 30天后匿名化
      requestResponseDays: 30, // 30天内响应
      dpoContact: 'dpo@zinses-rechner.de',
      privacyPolicyUrl: '/privacy',
      cookiePolicyUrl: '/cookies'
    }
  }

  private initialize(): void {
    this.loadStoredConsents()
    this.setupConsentMonitoring()
    this.scheduleDataRetentionCleanup()
    this.isInitialized.value = true
  }

  // 加载存储的同意记录
  private loadStoredConsents(): void {
    try {
      const stored = localStorage.getItem('gdpr_consents')
      if (stored) {
        const consents = JSON.parse(stored)
        Object.entries(consents).forEach(([key, value]) => {
          this.consentRecords.set(key, {
            ...value as ConsentRecord,
            timestamp: new Date(value.timestamp),
            expiryDate: value.expiryDate ? new Date(value.expiryDate) : undefined,
            withdrawnAt: value.withdrawnAt ? new Date(value.withdrawnAt) : undefined
          })
        })
      }
    } catch (error) {
      logger.error('Failed to load stored consents', 'gdpr', { error: error.message })
    }
  }

  // 保存同意记录
  private saveConsents(): void {
    try {
      const consentsObj = Object.fromEntries(this.consentRecords.entries())
      localStorage.setItem('gdpr_consents', JSON.stringify(consentsObj))
    } catch (error) {
      logger.error('Failed to save consents', 'gdpr', { error: error.message })
    }
  }

  // 设置同意监控
  private setupConsentMonitoring(): void {
    // 定期检查过期的同意
    setInterval(() => {
      this.checkExpiredConsents()
    }, 24 * 60 * 60 * 1000) // 每天检查一次
  }

  // 检查过期的同意
  private checkExpiredConsents(): void {
    const now = new Date()
    
    this.consentRecords.forEach((consent, key) => {
      if (consent.expiryDate && consent.expiryDate < now && consent.status === ConsentStatus.GIVEN) {
        consent.status = ConsentStatus.EXPIRED
        
        logger.info('Consent expired', 'gdpr', {
          consentId: consent.id,
          userId: consent.userId,
          purpose: consent.purpose
        })
      }
    })
    
    this.saveConsents()
  }

  // 安排数据保留清理
  private scheduleDataRetentionCleanup(): void {
    // 定期清理过期数据
    setInterval(() => {
      this.cleanupExpiredData()
    }, 24 * 60 * 60 * 1000) // 每天执行一次
  }

  // 清理过期数据
  private cleanupExpiredData(): void {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.config.dataRetentionDays)
    
    // 清理过期的处理记录
    const expiredRecords = this.processingRecords.filter(record => 
      record.timestamp < cutoffDate
    )
    
    expiredRecords.forEach(record => {
      this.anonymizeProcessingRecord(record)
    })
    
    logger.info('Data retention cleanup completed', 'gdpr', {
      cleanedRecords: expiredRecords.length
    })
  }

  // 匿名化处理记录
  private anonymizeProcessingRecord(record: ProcessingRecord): void {
    record.userId = 'anonymized'
    record.location = 'anonymized'
    
    logger.info('Processing record anonymized', 'gdpr', {
      recordId: record.id,
      originalTimestamp: record.timestamp
    })
  }

  // 公共API方法

  // 记录同意
  public recordConsent(
    userId: string,
    purpose: ProcessingPurpose,
    category: DataCategory,
    expiryDays?: number
  ): string {
    const consentId = securityService.generateSecureRandom(16)
    const now = new Date()
    
    const consent: ConsentRecord = {
      id: consentId,
      userId,
      purpose,
      category,
      status: ConsentStatus.GIVEN,
      timestamp: now,
      expiryDate: expiryDays ? new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000) : undefined,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      version: '1.0'
    }
    
    this.consentRecords.set(consentId, consent)
    this.saveConsents()
    
    logger.info('Consent recorded', 'gdpr', {
      consentId,
      userId,
      purpose,
      category
    })
    
    return consentId
  }

  // 撤回同意
  public withdrawConsent(consentId: string): boolean {
    const consent = this.consentRecords.get(consentId)
    if (!consent) {
      return false
    }
    
    consent.status = ConsentStatus.WITHDRAWN
    consent.withdrawnAt = new Date()
    
    this.saveConsents()
    
    logger.info('Consent withdrawn', 'gdpr', {
      consentId,
      userId: consent.userId,
      purpose: consent.purpose
    })
    
    return true
  }

  // 检查同意状态
  public hasValidConsent(userId: string, purpose: ProcessingPurpose, category: DataCategory): boolean {
    const consents = Array.from(this.consentRecords.values()).filter(consent =>
      consent.userId === userId &&
      consent.purpose === purpose &&
      consent.category === category &&
      consent.status === ConsentStatus.GIVEN &&
      (!consent.expiryDate || consent.expiryDate > new Date())
    )
    
    return consents.length > 0
  }

  // 记录数据处理
  public recordProcessing(
    userId: string,
    dataType: DataCategory,
    purpose: ProcessingPurpose,
    legalBasis: string,
    retentionDays?: number,
    thirdParties?: string[]
  ): string {
    const recordId = securityService.generateSecureRandom(16)
    
    const record: ProcessingRecord = {
      id: recordId,
      userId,
      dataType,
      purpose,
      legalBasis,
      timestamp: new Date(),
      retention: retentionDays || this.config.dataRetentionDays,
      location: 'EU',
      thirdParties
    }
    
    this.processingRecords.push(record)
    
    logger.info('Data processing recorded', 'gdpr', {
      recordId,
      userId,
      dataType,
      purpose
    })
    
    return recordId
  }

  // 提交数据主体请求
  public submitDataSubjectRequest(
    userId: string,
    type: DataSubjectRight,
    description: string
  ): string {
    const requestId = securityService.generateSecureRandom(16)
    
    const request: DataSubjectRequest = {
      id: requestId,
      userId,
      type,
      status: 'pending',
      requestDate: new Date(),
      description
    }
    
    this.dataSubjectRequests.push(request)
    
    logger.info('Data subject request submitted', 'gdpr', {
      requestId,
      userId,
      type,
      description
    })
    
    // 通知DPO
    this.notifyDPO(request)
    
    return requestId
  }

  // 处理数据主体请求
  public processDataSubjectRequest(requestId: string, response: string, documents?: string[]): boolean {
    const request = this.dataSubjectRequests.find(r => r.id === requestId)
    if (!request) {
      return false
    }
    
    request.status = 'completed'
    request.completionDate = new Date()
    request.response = response
    request.documents = documents
    
    logger.info('Data subject request processed', 'gdpr', {
      requestId,
      userId: request.userId,
      type: request.type
    })
    
    return true
  }

  // 导出用户数据
  public exportUserData(userId: string): any {
    const userData = {
      consents: Array.from(this.consentRecords.values()).filter(c => c.userId === userId),
      processingRecords: this.processingRecords.filter(r => r.userId === userId),
      requests: this.dataSubjectRequests.filter(r => r.userId === userId),
      exportDate: new Date().toISOString()
    }
    
    logger.info('User data exported', 'gdpr', {
      userId,
      recordCount: userData.processingRecords.length
    })
    
    return userData
  }

  // 删除用户数据
  public deleteUserData(userId: string): boolean {
    try {
      // 删除同意记录
      const consentsToDelete = Array.from(this.consentRecords.entries())
        .filter(([_, consent]) => consent.userId === userId)
        .map(([key]) => key)
      
      consentsToDelete.forEach(key => this.consentRecords.delete(key))
      
      // 匿名化处理记录
      this.processingRecords
        .filter(record => record.userId === userId)
        .forEach(record => this.anonymizeProcessingRecord(record))
      
      // 匿名化请求记录
      this.dataSubjectRequests
        .filter(request => request.userId === userId)
        .forEach(request => {
          request.userId = 'anonymized'
          request.description = 'anonymized'
        })
      
      this.saveConsents()
      
      logger.info('User data deleted', 'gdpr', {
        userId,
        deletedConsents: consentsToDelete.length
      })
      
      return true
    } catch (error) {
      logger.error('Failed to delete user data', 'gdpr', {
        userId,
        error: error.message
      })
      return false
    }
  }

  // 生成合规报告
  public generateComplianceReport(): any {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const report = {
      timestamp: now.toISOString(),
      period: '30 days',
      summary: {
        totalConsents: this.consentRecords.size,
        activeConsents: Array.from(this.consentRecords.values())
          .filter(c => c.status === ConsentStatus.GIVEN).length,
        withdrawnConsents: Array.from(this.consentRecords.values())
          .filter(c => c.status === ConsentStatus.WITHDRAWN).length,
        expiredConsents: Array.from(this.consentRecords.values())
          .filter(c => c.status === ConsentStatus.EXPIRED).length,
        totalProcessingRecords: this.processingRecords.length,
        recentProcessingRecords: this.processingRecords
          .filter(r => r.timestamp >= thirtyDaysAgo).length,
        pendingRequests: this.dataSubjectRequests
          .filter(r => r.status === 'pending').length,
        completedRequests: this.dataSubjectRequests
          .filter(r => r.status === 'completed' && r.completionDate && r.completionDate >= thirtyDaysAgo).length
      },
      consentsByPurpose: this.getConsentsByPurpose(),
      processingByCategory: this.getProcessingByCategory(),
      requestsByType: this.getRequestsByType()
    }
    
    logger.info('Compliance report generated', 'gdpr', {
      reportPeriod: report.period,
      totalConsents: report.summary.totalConsents
    })
    
    return report
  }

  // 辅助方法
  private getClientIP(): string {
    // 在实际应用中，这应该从服务器获取
    return '0.0.0.0'
  }

  private notifyDPO(request: DataSubjectRequest): void {
    // 在实际应用中，这里应该发送邮件通知DPO
    logger.info('DPO notified of data subject request', 'gdpr', {
      requestId: request.id,
      type: request.type
    })
  }

  private getConsentsByPurpose(): Record<ProcessingPurpose, number> {
    const result = {} as Record<ProcessingPurpose, number>
    
    Object.values(ProcessingPurpose).forEach(purpose => {
      result[purpose] = Array.from(this.consentRecords.values())
        .filter(c => c.purpose === purpose && c.status === ConsentStatus.GIVEN).length
    })
    
    return result
  }

  private getProcessingByCategory(): Record<DataCategory, number> {
    const result = {} as Record<DataCategory, number>
    
    Object.values(DataCategory).forEach(category => {
      result[category] = this.processingRecords
        .filter(r => r.dataType === category).length
    })
    
    return result
  }

  private getRequestsByType(): Record<DataSubjectRight, number> {
    const result = {} as Record<DataSubjectRight, number>
    
    Object.values(DataSubjectRight).forEach(type => {
      result[type] = this.dataSubjectRequests
        .filter(r => r.type === type).length
    })
    
    return result
  }

  // 计算属性
  public get initialized() {
    return computed(() => this.isInitialized.value)
  }

  public get activeConsents() {
    return computed(() => 
      Array.from(this.consentRecords.values())
        .filter(c => c.status === ConsentStatus.GIVEN)
    )
  }

  public get pendingRequests() {
    return computed(() => 
      this.dataSubjectRequests.filter(r => r.status === 'pending')
    )
  }
}

// 导出单例实例
export const gdprService = GDPRComplianceService.getInstance()

// 导出便捷方法
export const recordConsent = (userId: string, purpose: ProcessingPurpose, category: DataCategory) =>
  gdprService.recordConsent(userId, purpose, category)

export const hasValidConsent = (userId: string, purpose: ProcessingPurpose, category: DataCategory) =>
  gdprService.hasValidConsent(userId, purpose, category)

export const submitDataSubjectRequest = (userId: string, type: DataSubjectRight, description: string) =>
  gdprService.submitDataSubjectRequest(userId, type, description)
