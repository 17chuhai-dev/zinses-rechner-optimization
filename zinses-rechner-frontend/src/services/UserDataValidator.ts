/**
 * 用户数据验证器
 * 实现DSGVO合规的数据验证逻辑和业务约束
 *
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import type {
  BaseUser,
  AnonymousUser,
  RegisteredUser,
  User,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ConsentSettings,
  UserPreferences,
  SyncSettings
} from '@/types/user-identity'

import {
  DSGVO_CONSTANTS,
  VALIDATION_ERROR_CODES,
  ERROR_MESSAGES_DE
} from '@/types/user-identity'

import {
  createValidationError,
  createValidationWarning
} from '@/utils/user-identity-utils'

/**
 * 用户数据验证器类
 * 提供全面的数据验证和业务约束检查
 */
export class UserDataValidator {

  // ============================================================================
  // 基础验证方法
  // ============================================================================

  /**
   * 验证UUID v4格式
   * @param id - 用户ID
   * @returns 验证结果
   */
  validateUserId(id: string): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (!id) {
      errors.push(createValidationError('id', 'USER_ID_REQUIRED'))
      return { isValid: false, errors, warnings }
    }

    // UUID v4格式验证
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      errors.push(createValidationError('id', 'USER_ID_FORMAT_INVALID', {
        providedId: id,
        expectedFormat: 'UUID v4'
      }))
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证邮箱格式
   * @param email - 邮箱地址
   * @returns 验证结果
   */
  validateEmail(email: string): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (!email) {
      // 邮箱是可选的，不是错误
      return { isValid: true, errors, warnings }
    }

    // 长度检查
    if (email.length > DSGVO_CONSTANTS.MAX_EMAIL_LENGTH) {
      errors.push(createValidationError('email', 'EMAIL_TOO_LONG', {
        maxLength: DSGVO_CONSTANTS.MAX_EMAIL_LENGTH,
        actualLength: email.length
      }))
    }

    // RFC 5322简化版邮箱格式验证
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!emailRegex.test(email)) {
      errors.push(createValidationError('email', 'INVALID_EMAIL', {
        providedEmail: email
      }))
    }

    // 德国常见邮箱域名检查（警告）
    const germanDomains = ['.de', '.com', '.org', '.net']
    const hasGermanDomain = germanDomains.some(domain => email.toLowerCase().endsWith(domain))
    if (!hasGermanDomain) {
      warnings.push(createValidationWarning(
        'email',
        'UNCOMMON_EMAIL_DOMAIN',
        'Ungewöhnliche E-Mail-Domain erkannt',
        'Stellen Sie sicher, dass die E-Mail-Adresse korrekt ist'
      ))
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证设备指纹
   * @param fingerprint - 设备指纹
   * @returns 验证结果
   */
  validateDeviceFingerprint(fingerprint: string): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (!fingerprint) {
      errors.push(createValidationError('deviceFingerprint', 'INVALID_DEVICE_FINGERPRINT', {
        reason: 'Device fingerprint is required'
      }))
      return { isValid: false, errors, warnings }
    }

    // 长度检查
    if (fingerprint.length > DSGVO_CONSTANTS.MAX_DEVICE_FINGERPRINT_LENGTH) {
      errors.push(createValidationError('deviceFingerprint', 'DEVICE_FINGERPRINT_TOO_LONG', {
        maxLength: DSGVO_CONSTANTS.MAX_DEVICE_FINGERPRINT_LENGTH,
        actualLength: fingerprint.length
      }))
    }

    // 基本格式检查（应该是字母数字字符）
    const fingerprintRegex = /^[a-zA-Z0-9]+$/
    if (!fingerprintRegex.test(fingerprint)) {
      warnings.push(createValidationWarning(
        'deviceFingerprint',
        'UNUSUAL_FINGERPRINT_FORMAT',
        'Ungewöhnliches Format des Geräte-Fingerabdrucks',
        'Fingerabdruck sollte nur alphanumerische Zeichen enthalten'
      ))
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证数据保留期限
   * @param user - 用户对象
   * @returns 验证结果
   */
  validateDataRetention(user: BaseUser): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    const retentionDays = user.preferences.dataRetentionDays

    // 保留期限范围检查
    if (retentionDays < DSGVO_CONSTANTS.MIN_RETENTION_DAYS) {
      errors.push(createValidationError('preferences.dataRetentionDays', 'RETENTION_PERIOD_TOO_SHORT', {
        minDays: DSGVO_CONSTANTS.MIN_RETENTION_DAYS,
        actualDays: retentionDays
      }))
    }

    if (retentionDays > DSGVO_CONSTANTS.MAX_RETENTION_DAYS) {
      errors.push(createValidationError('preferences.dataRetentionDays', 'RETENTION_PERIOD_TOO_LONG', {
        maxDays: DSGVO_CONSTANTS.MAX_RETENTION_DAYS,
        actualDays: retentionDays
      }))
    }

    // 检查数据是否已过期
    const daysSinceCreation = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceCreation > retentionDays) {
      warnings.push(createValidationWarning(
        'dataRetention',
        'DATA_RETENTION_EXCEEDED',
        'Daten haben die Aufbewahrungsfrist überschritten',
        `Daten sollten gelöscht oder Aufbewahrungsfrist verlängert werden. Erstellt vor ${Math.floor(daysSinceCreation)} Tagen.`
      ))
    }

    // 即将过期警告（30天内）
    const daysUntilExpiration = retentionDays - daysSinceCreation
    if (daysUntilExpiration > 0 && daysUntilExpiration <= 30) {
      warnings.push(createValidationWarning(
        'dataRetention',
        'DATA_RETENTION_EXPIRING_SOON',
        'Daten laufen bald ab',
        `Daten laufen in ${Math.floor(daysUntilExpiration)} Tagen ab`
      ))
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // ============================================================================
  // 复合验证方法
  // ============================================================================

  /**
   * 验证用户偏好设置
   * @param preferences - 用户偏好设置
   * @returns 验证结果
   */
  validateUserPreferences(preferences: UserPreferences): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 语言检查（必须是德语）
    if (preferences.language !== 'de') {
      errors.push(createValidationError('preferences.language', 'INVALID_USER_ID', {
        message: 'Sprache muss Deutsch sein',
        expected: 'de',
        actual: preferences.language
      }))
    }

    // 货币检查（必须是欧元）
    if (preferences.currency !== 'EUR') {
      errors.push(createValidationError('preferences.currency', 'INVALID_USER_ID', {
        message: 'Währung muss Euro sein',
        expected: 'EUR',
        actual: preferences.currency
      }))
    }

    // 主题检查
    const validThemes = ['light', 'dark', 'auto']
    if (!validThemes.includes(preferences.theme)) {
      errors.push(createValidationError('preferences.theme', 'INVALID_USER_ID', {
        message: 'Ungültiges Theme',
        validOptions: validThemes,
        actual: preferences.theme
      }))
    }

    // 数据保留期限检查
    const retentionValidation = this.validateDataRetention({
      preferences,
      createdAt: new Date(Date.now() - (preferences.dataRetentionDays * 24 * 60 * 60 * 1000))
    } as BaseUser)
    errors.push(...retentionValidation.errors)
    warnings.push(...retentionValidation.warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证同意设置
   * @param consentSettings - 同意设置
   * @returns 验证结果
   */
  validateConsentSettings(consentSettings: ConsentSettings): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 版本检查
    if (consentSettings.version !== DSGVO_CONSTANTS.CONSENT_VERSION) {
      warnings.push(createValidationWarning(
        'consentSettings.version',
        'OUTDATED_CONSENT_VERSION',
        'Veraltete Einverständnisversion',
        'Einverständniseinstellungen sollten aktualisiert werden'
      ))
    }

    // 时间戳检查
    const now = new Date()
    if (consentSettings.consentDate > now) {
      errors.push(createValidationError('consentSettings.consentDate', 'INVALID_USER_ID', {
        message: 'Einverständnisdatum kann nicht in der Zukunft liegen'
      }))
    }

    if (consentSettings.lastUpdated > now) {
      errors.push(createValidationError('consentSettings.lastUpdated', 'INVALID_USER_ID', {
        message: 'Letzte Aktualisierung kann nicht in der Zukunft liegen'
      }))
    }

    // 功能性同意检查（必须同意）
    if (consentSettings.functional.status !== 'granted') {
      errors.push(createValidationError('consentSettings.functional', 'CONSENT_REQUIRED', {
        message: 'Funktionale Einverständnis ist erforderlich für die Grundfunktionen'
      }))
    }

    // 检查同意记录的完整性
    const consentRecords = [
      consentSettings.functional,
      consentSettings.analytics,
      consentSettings.marketing
    ]

    if (consentSettings.crossDeviceSync) {
      consentRecords.push(consentSettings.crossDeviceSync)
    }

    for (const record of consentRecords) {
      if (!record.timestamp || !(record.timestamp instanceof Date)) {
        errors.push(createValidationError('consentSettings', 'INVALID_USER_ID', {
          message: 'Ungültiger Zeitstempel in Einverständnisaufzeichnung'
        }))
      }

      if (!record.purposes || record.purposes.length === 0) {
        warnings.push(createValidationWarning(
          'consentSettings',
          'EMPTY_CONSENT_PURPOSES',
          'Leere Zweckliste in Einverständnisaufzeichnung',
          'Einverständnisaufzeichnung sollte mindestens einen Zweck haben'
        ))
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证同步设置
   * @param syncSettings - 同步设置
   * @returns 验证结果
   */
  validateSyncSettings(syncSettings: SyncSettings): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 设备数量限制检查
    if (syncSettings.maxDevices > DSGVO_CONSTANTS.MAX_SYNC_DEVICES) {
      errors.push(createValidationError('syncSettings.maxDevices', 'SYNC_DEVICE_LIMIT_EXCEEDED', {
        maxDevices: DSGVO_CONSTANTS.MAX_SYNC_DEVICES,
        requestedDevices: syncSettings.maxDevices
      }))
    }

    // 同步频率检查
    const validFrequencies = ['manual', 'hourly', 'daily', 'weekly']
    if (!validFrequencies.includes(syncSettings.frequency)) {
      errors.push(createValidationError('syncSettings.frequency', 'INVALID_USER_ID', {
        message: 'Ungültige Synchronisationsfrequenz',
        validOptions: validFrequencies,
        actual: syncSettings.frequency
      }))
    }

    // 冲突解决策略检查
    const validStrategies = ['local_wins', 'remote_wins', 'latest_wins', 'manual']
    if (!validStrategies.includes(syncSettings.conflictResolution)) {
      errors.push(createValidationError('syncSettings.conflictResolution', 'INVALID_USER_ID', {
        message: 'Ungültige Konfliktlösungsstrategie',
        validOptions: validStrategies,
        actual: syncSettings.conflictResolution
      }))
    }

    // 最后同步时间检查
    if (syncSettings.lastSyncAt && syncSettings.lastSyncAt > new Date()) {
      errors.push(createValidationError('syncSettings.lastSyncAt', 'INVALID_USER_ID', {
        message: 'Letzte Synchronisationszeit kann nicht in der Zukunft liegen'
      }))
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // ============================================================================
  // 完整用户验证方法
  // ============================================================================

  /**
   * 验证基础用户数据
   * @param user - 基础用户对象
   * @returns 验证结果
   */
  validateBaseUser(user: BaseUser): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 验证用户ID
    const idValidation = this.validateUserId(user.id)
    errors.push(...idValidation.errors)
    warnings.push(...idValidation.warnings)

    // 验证时间戳
    if (!user.createdAt || !(user.createdAt instanceof Date)) {
      errors.push(createValidationError('createdAt', 'INVALID_USER_ID', {
        message: 'Ungültiges Erstellungsdatum'
      }))
    }

    if (!user.lastActiveAt || !(user.lastActiveAt instanceof Date)) {
      errors.push(createValidationError('lastActiveAt', 'INVALID_USER_ID', {
        message: 'Ungültige letzte Aktivitätszeit'
      }))
    }

    // 时间逻辑检查
    if (user.createdAt && user.lastActiveAt && user.lastActiveAt < user.createdAt) {
      errors.push(createValidationError('lastActiveAt', 'INVALID_USER_ID', {
        message: 'Letzte Aktivitätszeit kann nicht vor Erstellungszeit liegen'
      }))
    }

    // 验证数据版本
    if (!DSGVO_CONSTANTS.SUPPORTED_VERSIONS.includes(user.dataVersion as any)) {
      errors.push(createValidationError('dataVersion', 'UNSUPPORTED_VERSION', {
        supportedVersions: DSGVO_CONSTANTS.SUPPORTED_VERSIONS,
        actualVersion: user.dataVersion
      }))
    }

    // 验证用户偏好
    const preferencesValidation = this.validateUserPreferences(user.preferences)
    errors.push(...preferencesValidation.errors)
    warnings.push(...preferencesValidation.warnings)

    // 验证同意设置
    const consentValidation = this.validateConsentSettings(user.consentSettings)
    errors.push(...consentValidation.errors)
    warnings.push(...consentValidation.warnings)

    // 验证数据保留期限
    const retentionValidation = this.validateDataRetention(user)
    errors.push(...retentionValidation.errors)
    warnings.push(...retentionValidation.warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证匿名用户数据
   * @param user - 匿名用户对象
   * @returns 验证结果
   */
  validateAnonymousUser(user: AnonymousUser): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 基础验证
    const baseValidation = this.validateBaseUser(user)
    errors.push(...baseValidation.errors)
    warnings.push(...baseValidation.warnings)

    // 验证用户类型
    if (user.type !== 'anonymous') {
      errors.push(createValidationError('type', 'INVALID_USER_ID', {
        message: 'Ungültiger Benutzertyp für anonymen Benutzer',
        expected: 'anonymous',
        actual: user.type
      }))
    }

    // 验证设备指纹
    const fingerprintValidation = this.validateDeviceFingerprint(user.deviceFingerprint)
    errors.push(...fingerprintValidation.errors)
    warnings.push(...fingerprintValidation.warnings)

    // 验证设备信息
    if (!user.deviceInfo || typeof user.deviceInfo !== 'object') {
      errors.push(createValidationError('deviceInfo', 'INVALID_USER_ID', {
        message: 'Ungültige Geräteinformationen'
      }))
    } else {
      // 验证设备信息字段
      const requiredDeviceFields = ['type', 'os', 'browser', 'screenSize', 'timezone', 'locale']
      for (const field of requiredDeviceFields) {
        if (!user.deviceInfo[field as keyof typeof user.deviceInfo]) {
          warnings.push(createValidationWarning(
            `deviceInfo.${field}`,
            'MISSING_DEVICE_INFO',
            `Fehlende Geräteinformation: ${field}`,
            'Geräteinformationen sollten vollständig sein'
          ))
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证注册用户数据
   * @param user - 注册用户对象
   * @returns 验证结果
   */
  validateRegisteredUser(user: RegisteredUser): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 基础验证（包含匿名用户的所有验证）
    const baseValidation = this.validateBaseUser(user)
    errors.push(...baseValidation.errors)
    warnings.push(...baseValidation.warnings)

    // 验证设备指纹（注册用户也需要）
    const fingerprintValidation = this.validateDeviceFingerprint(user.deviceFingerprint)
    errors.push(...fingerprintValidation.errors)
    warnings.push(...fingerprintValidation.warnings)

    // 验证用户类型
    if (user.type !== 'registered') {
      errors.push(createValidationError('type', 'INVALID_USER_ID', {
        message: 'Ungültiger Benutzertyp für registrierten Benutzer',
        expected: 'registered',
        actual: user.type
      }))
    }

    // 验证邮箱
    if (user.email) {
      const emailValidation = this.validateEmail(user.email)
      errors.push(...emailValidation.errors)
      warnings.push(...emailValidation.warnings)
    }

    // 验证注册时间
    if (!user.registrationDate || !(user.registrationDate instanceof Date)) {
      errors.push(createValidationError('registrationDate', 'INVALID_USER_ID', {
        message: 'Ungültiges Registrierungsdatum'
      }))
    } else if (user.registrationDate < user.createdAt) {
      errors.push(createValidationError('registrationDate', 'INVALID_USER_ID', {
        message: 'Registrierungsdatum kann nicht vor Erstellungsdatum liegen'
      }))
    }

    // 验证同步设置
    if (user.syncEnabled) {
      if (!user.syncSettings) {
        errors.push(createValidationError('syncSettings', 'INVALID_USER_ID', {
          message: 'Synchronisationseinstellungen fehlen bei aktivierter Synchronisation'
        }))
      } else {
        const syncValidation = this.validateSyncSettings(user.syncSettings)
        errors.push(...syncValidation.errors)
        warnings.push(...syncValidation.warnings)
      }

      // 检查跨设备同步同意
      if (!user.consentSettings.crossDeviceSync || user.consentSettings.crossDeviceSync.status !== 'granted') {
        errors.push(createValidationError('consentSettings.crossDeviceSync', 'CONSENT_REQUIRED', {
          message: 'Einverständnis für geräteübergreifende Synchronisation erforderlich'
        }))
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // ============================================================================
  // 业务规则验证
  // ============================================================================

  /**
   * 验证业务规则合规性
   * @param user - 用户对象
   * @returns 验证结果
   */
  validateBusinessRules(user: User): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // DSGVO合规检查
    const dsgvoValidation = this.validateDsgvoCompliance(user)
    errors.push(...dsgvoValidation.errors)
    warnings.push(...dsgvoValidation.warnings)

    // 数据一致性检查
    const consistencyValidation = this.validateDataConsistency(user)
    errors.push(...consistencyValidation.errors)
    warnings.push(...consistencyValidation.warnings)

    // 安全性检查
    const securityValidation = this.validateSecurityRequirements(user)
    errors.push(...securityValidation.errors)
    warnings.push(...securityValidation.warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证DSGVO合规性
   * @param user - 用户对象
   * @returns 验证结果
   */
  private validateDsgvoCompliance(user: User): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 数据最小化检查
    const requiredFields = ['id', 'type', 'createdAt', 'lastActiveAt', 'dataVersion', 'preferences', 'consentSettings']
    const userFields = Object.keys(user)
    const unnecessaryFields = userFields.filter(field => !requiredFields.includes(field) && field !== 'deviceFingerprint' && field !== 'deviceInfo' && field !== 'email' && field !== 'emailVerified' && field !== 'registrationDate' && field !== 'syncEnabled' && field !== 'syncSettings')

    if (unnecessaryFields.length > 0) {
      warnings.push(createValidationWarning(
        'dataMinimization',
        'UNNECESSARY_DATA_FIELDS',
        'Möglicherweise unnötige Datenfelder erkannt',
        `Felder: ${unnecessaryFields.join(', ')}`
      ))
    }

    // 同意状态检查
    if (user.consentSettings.functional.status !== 'granted') {
      errors.push(createValidationError('consentSettings.functional', 'CONSENT_REQUIRED'))
    }

    // 数据保留期限检查
    const maxRetentionDays = DSGVO_CONSTANTS.MAX_RETENTION_DAYS
    if (user.preferences.dataRetentionDays > maxRetentionDays) {
      errors.push(createValidationError('preferences.dataRetentionDays', 'RETENTION_PERIOD_TOO_LONG'))
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证数据一致性
   * @param user - 用户对象
   * @returns 验证结果
   */
  private validateDataConsistency(user: User): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 时间戳一致性
    if (user.lastActiveAt < user.createdAt) {
      errors.push(createValidationError('lastActiveAt', 'INVALID_USER_ID', {
        message: 'Letzte Aktivitätszeit kann nicht vor Erstellungszeit liegen'
      }))
    }

    // 注册用户特定检查
    if (user.type === 'registered') {
      const registeredUser = user as RegisteredUser

      if (registeredUser.registrationDate < user.createdAt) {
        errors.push(createValidationError('registrationDate', 'INVALID_USER_ID', {
          message: 'Registrierungsdatum kann nicht vor Erstellungsdatum liegen'
        }))
      }

      // 同步设置一致性
      if (registeredUser.syncEnabled && !registeredUser.syncSettings) {
        errors.push(createValidationError('syncSettings', 'INVALID_USER_ID', {
          message: 'Synchronisationseinstellungen fehlen'
        }))
      }

      if (!registeredUser.syncEnabled && registeredUser.syncSettings?.enabled) {
        warnings.push(createValidationWarning(
          'syncSettings',
          'INCONSISTENT_SYNC_SETTINGS',
          'Inkonsistente Synchronisationseinstellungen',
          'syncEnabled und syncSettings.enabled stimmen nicht überein'
        ))
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证安全要求
   * @param user - 用户对象
   * @returns 验证结果
   */
  private validateSecurityRequirements(user: User): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 设备指纹安全检查
    if (user.deviceFingerprint.length < 8) {
      warnings.push(createValidationWarning(
        'deviceFingerprint',
        'WEAK_DEVICE_FINGERPRINT',
        'Schwacher Geräte-Fingerabdruck',
        'Geräte-Fingerabdruck sollte mindestens 8 Zeichen lang sein'
      ))
    }

    // 邮箱安全检查（注册用户）
    if (user.type === 'registered') {
      const registeredUser = user as RegisteredUser

      if (registeredUser.email && !registeredUser.emailVerified) {
        warnings.push(createValidationWarning(
          'emailVerified',
          'UNVERIFIED_EMAIL',
          'Unverifizierte E-Mail-Adresse',
          'E-Mail-Adresse sollte verifiziert werden'
        ))
      }
    }

    // 同意时间戳安全检查
    const consentAge = (Date.now() - user.consentSettings.consentDate.getTime()) / (1000 * 60 * 60 * 24)
    if (consentAge > 365) { // 1年
      warnings.push(createValidationWarning(
        'consentSettings',
        'OLD_CONSENT',
        'Veraltetes Einverständnis',
        'Einverständnis ist älter als ein Jahr und sollte erneuert werden'
      ))
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // ============================================================================
  // 性能优化的批量验证
  // ============================================================================

  /**
   * 批量验证多个用户
   * @param users - 用户数组
   * @returns 验证结果映射
   */
  validateBatch(users: User[]): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>()

    for (const user of users) {
      const validation = user.type === 'anonymous'
        ? this.validateAnonymousUser(user as AnonymousUser)
        : this.validateRegisteredUser(user as RegisteredUser)

      results.set(user.id, validation)
    }

    return results
  }

  /**
   * 快速验证（仅检查关键字段）
   * @param user - 用户对象
   * @returns 验证结果
   */
  validateQuick(user: User): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 仅验证关键字段
    const idValidation = this.validateUserId(user.id)
    errors.push(...idValidation.errors)

    if (user.type === 'registered') {
      const registeredUser = user as RegisteredUser
      if (registeredUser.email) {
        const emailValidation = this.validateEmail(registeredUser.email)
        errors.push(...emailValidation.errors)
      }
    }

    // 检查必需的同意
    if (user.consentSettings.functional.status !== 'granted') {
      errors.push(createValidationError('consentSettings.functional', 'CONSENT_REQUIRED'))
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}
