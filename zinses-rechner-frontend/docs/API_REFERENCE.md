# 用户身份管理系统 API 参考

## 概述

本文档提供了用户身份管理系统所有公共API的详细参考信息。

## 工具函数 (utils/user-identity-utils.ts)

### createAnonymousUser

创建新的匿名用户。

```typescript
function createAnonymousUser(
  overrides?: Partial<AnonymousUser>
): AnonymousUser
```

**参数:**
- `overrides` (可选) - 覆盖默认设置的部分用户数据

**返回值:**
- `AnonymousUser` - 新创建的匿名用户对象

**示例:**
```typescript
const user = createAnonymousUser({
  preferences: {
    theme: 'dark',
    language: 'de'
  }
})
```

### upgradeToRegisteredUser

将匿名用户升级为注册用户。

```typescript
function upgradeToRegisteredUser(
  anonymousUser: AnonymousUser,
  email: string,
  overrides?: Partial<Omit<RegisteredUser, keyof AnonymousUser | 'registrationDate'>>
): RegisteredUser
```

**参数:**
- `anonymousUser` - 要升级的匿名用户
- `email` - 用户邮箱地址
- `overrides` (可选) - 额外的注册用户属性

**返回值:**
- `RegisteredUser` - 升级后的注册用户对象

**异常:**
- `Error` - 当邮箱格式无效或为空时抛出

**示例:**
```typescript
const registeredUser = upgradeToRegisteredUser(
  anonymousUser, 
  'user@example.de'
)
```

### validateUserDataIntegrity

验证用户数据的完整性和有效性。

```typescript
function validateUserDataIntegrity(user: User): ValidationResult
```

**参数:**
- `user` - 要验证的用户对象

**返回值:**
- `ValidationResult` - 验证结果，包含错误和警告信息

**示例:**
```typescript
const result = validateUserDataIntegrity(user)
if (!result.isValid) {
  console.log('验证错误:', result.errors)
}
```

### hasConsentForPurpose

检查用户是否对特定数据处理目的给予了同意。

```typescript
function hasConsentForPurpose(
  user: User, 
  purpose: DataProcessingPurpose
): boolean
```

**参数:**
- `user` - 用户对象
- `purpose` - 数据处理目的

**返回值:**
- `boolean` - 是否有同意权限

**示例:**
```typescript
if (hasConsentForPurpose(user, 'analytics')) {
  // 执行分析相关操作
}
```

### updateConsent

更新用户的同意状态。

```typescript
function updateConsent<T extends User>(
  user: T,
  consentType: keyof ConsentSettings,
  granted: boolean,
  source?: ConsentRecord['source']
): T
```

**参数:**
- `user` - 用户对象
- `consentType` - 同意类型
- `granted` - 是否授予同意
- `source` (可选) - 同意来源，默认为 'settings_change'

**返回值:**
- `T` - 更新后的用户对象

**异常:**
- `Error` - 当同意类型无效时抛出

**示例:**
```typescript
const updatedUser = updateConsent(user, 'analytics', true, 'user_action')
```

### needsDataCleanup

检查用户数据是否需要清理（基于数据保留期限）。

```typescript
function needsDataCleanup(user: User): boolean
```

**参数:**
- `user` - 用户对象

**返回值:**
- `boolean` - 是否需要数据清理

**示例:**
```typescript
if (needsDataCleanup(user)) {
  // 执行数据清理操作
}
```

### anonymizeUserData

匿名化用户数据，移除个人标识信息。

```typescript
function anonymizeUserData(user: User): Record<string, unknown>
```

**参数:**
- `user` - 要匿名化的用户对象

**返回值:**
- `Record<string, unknown>` - 匿名化后的数据对象

**示例:**
```typescript
const anonymizedData = anonymizeUserData(user)
```

### isValidUser

检查对象是否为有效的用户对象。

```typescript
function isValidUser(obj: any): obj is User
```

**参数:**
- `obj` - 要检查的对象

**返回值:**
- `boolean` - 是否为有效用户对象

**示例:**
```typescript
if (isValidUser(data)) {
  // 安全地使用用户数据
}
```

### generateDeviceFingerprint

生成设备指纹用于用户识别。

```typescript
function generateDeviceFingerprint(): string
```

**返回值:**
- `string` - 设备指纹字符串

**示例:**
```typescript
const fingerprint = generateDeviceFingerprint()
```

## 数据验证器 (services/UserDataValidator.ts)

### UserDataValidator

用户数据验证器类，提供专业的数据验证功能。

#### 构造函数

```typescript
constructor()
```

#### validateAnonymousUser

验证匿名用户数据。

```typescript
validateAnonymousUser(user: AnonymousUser): ValidationResult
```

**参数:**
- `user` - 匿名用户对象

**返回值:**
- `ValidationResult` - 验证结果

#### validateRegisteredUser

验证注册用户数据。

```typescript
validateRegisteredUser(user: RegisteredUser): ValidationResult
```

**参数:**
- `user` - 注册用户对象

**返回值:**
- `ValidationResult` - 验证结果

## 用户身份服务 (services/UserIdentityService.ts)

### UserIdentityService

用户身份管理服务，提供完整的用户生命周期管理。

#### 构造函数

```typescript
constructor()
```

#### createAnonymousUser

创建匿名用户。

```typescript
async createAnonymousUser(
  overrides?: Partial<AnonymousUser>
): Promise<AnonymousUser>
```

#### upgradeUser

升级用户为注册用户。

```typescript
async upgradeUser(
  userId: string, 
  email: string
): Promise<RegisteredUser>
```

#### updateUser

更新用户信息。

```typescript
async updateUser<T extends User>(
  userId: string, 
  updates: Partial<T>
): Promise<T>
```

#### deleteUser

删除用户数据。

```typescript
async deleteUser(userId: string): Promise<void>
```

#### getUser

获取用户数据。

```typescript
async getUser(userId: string): Promise<User | null>
```

#### updateConsent

更新用户同意状态。

```typescript
async updateConsent(
  userId: string,
  consentType: keyof ConsentSettings,
  granted: boolean,
  source?: ConsentRecord['source']
): Promise<User>
```

## 数据迁移服务 (services/DataMigrationService.ts)

### DataMigrationService

数据迁移管理服务，处理用户数据的版本升级。

#### getInstance

获取服务单例实例。

```typescript
static getInstance(): DataMigrationService
```

#### needsMigration

检查数据是否需要迁移。

```typescript
needsMigration(data: any): boolean
```

#### migrateUserData

执行用户数据迁移。

```typescript
async migrateUserData(userData: any): Promise<MigrationResult>
```

#### migrateBatch

批量迁移用户数据。

```typescript
async migrateBatch(userDataList: any[]): Promise<MigrationResult[]>
```

#### getMigrationStats

获取迁移统计信息。

```typescript
getMigrationStats(): MigrationStats
```

## DSGVO合规性验证器 (services/DSGVOComplianceValidator.ts)

### DSGVOComplianceValidator

DSGVO合规性验证器，检查用户数据是否符合德国数据保护法规。

#### getInstance

获取验证器单例实例。

```typescript
static getInstance(): DSGVOComplianceValidator
```

#### validateUserCompliance

验证用户数据的DSGVO合规性。

```typescript
validateUserCompliance(user: User): DSGVOComplianceResult
```

**参数:**
- `user` - 要验证的用户对象

**返回值:**
- `DSGVOComplianceResult` - 合规性验证结果

**示例:**
```typescript
const result = validator.validateUserCompliance(user)
console.log(`合规分数: ${result.complianceScore}/100`)
```

#### getAuditLog

获取审计日志。

```typescript
getAuditLog(): DSGVOAuditEntry[]
```

#### clearAuditLog

清除审计日志。

```typescript
clearAuditLog(): void
```

## DSGVO合规性报告器 (services/DSGVOComplianceReporter.ts)

### DSGVOComplianceReporter

DSGVO合规性报告生成器，生成详细的合规性报告。

#### getInstance

获取报告器单例实例。

```typescript
static getInstance(): DSGVOComplianceReporter
```

#### generateUserComplianceReport

生成用户合规性报告。

```typescript
generateUserComplianceReport(
  user: User, 
  config?: Partial<ReportConfig>
): string
```

**参数:**
- `user` - 用户对象
- `config` (可选) - 报告配置

**返回值:**
- `string` - 生成的报告内容

**示例:**
```typescript
const htmlReport = reporter.generateUserComplianceReport(user, {
  format: 'html',
  includeRecommendations: true
})
```

#### generateBatchComplianceSummary

生成批量用户合规性摘要。

```typescript
generateBatchComplianceSummary(users: User[]): string
```

## 本地存储加密服务 (services/LocalStorageEncryptionService.ts)

### LocalStorageEncryptionService

本地存储加密服务，提供安全的数据存储功能。

#### getInstance

获取服务单例实例。

```typescript
static getInstance(): LocalStorageEncryptionService
```

#### setItem

存储加密数据。

```typescript
async setItem(key: string, value: any): Promise<void>
```

#### getItem

读取解密数据。

```typescript
async getItem<T>(key: string): Promise<T | null>
```

#### removeItem

删除存储项。

```typescript
async removeItem(key: string): Promise<void>
```

#### clear

清除所有存储数据。

```typescript
async clear(): Promise<void>
```

## 类型定义

### 核心类型

```typescript
// 基础用户类型
interface BaseUser {
  id: string
  type: 'anonymous' | 'registered'
  createdAt: Date
  lastActiveAt: Date
  dataVersion: DataVersion
  deviceFingerprint: string
  deviceInfo: DeviceInfo
  preferences: UserPreferences
  consentSettings: ConsentSettings
}

// 匿名用户
interface AnonymousUser extends BaseUser {
  type: 'anonymous'
}

// 注册用户
interface RegisteredUser extends BaseUser {
  type: 'registered'
  email: string
  emailVerified: boolean
  registrationDate: Date
  syncEnabled: boolean
  syncSettings: SyncSettings
}
```

### 验证结果类型

```typescript
interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

interface ValidationError {
  field: string
  code: string
  message: string
  details?: Record<string, any>
}
```

### DSGVO合规性类型

```typescript
interface DSGVOComplianceResult {
  isCompliant: boolean
  complianceScore: number
  violations: DSGVOViolation[]
  warnings: DSGVOWarning[]
  recommendations: DSGVORecommendation[]
  auditTrail: DSGVOAuditEntry[]
}
```

## 错误处理

### 常见错误代码

- `INVALID_USER_ID` - 无效的用户ID
- `INVALID_EMAIL` - 无效的邮箱地址
- `CONSENT_REQUIRED` - 需要用户同意
- `MIGRATION_FAILED` - 数据迁移失败
- `VALIDATION_ERROR` - 数据验证错误

### 错误处理最佳实践

```typescript
try {
  const result = await userService.createAnonymousUser()
  // 处理成功结果
} catch (error) {
  if (error instanceof ValidationError) {
    // 处理验证错误
  } else {
    // 处理其他错误
  }
}
```

## 配置选项

### 默认配置

所有服务都提供合理的默认配置，可以通过参数进行自定义。

### 环境变量

- `ENCRYPTION_KEY` - 数据加密密钥
- `DEBUG_MODE` - 调试模式开关
- `AUDIT_ENABLED` - 审计功能开关

## 版本兼容性

当前API版本：v1.0.0

- 支持的数据版本：1.0, 1.1, 1.2
- 向后兼容性：完全支持
- 迁移路径：自动处理

## 性能考虑

### 最佳实践

1. 使用批量操作处理大量数据
2. 启用缓存减少重复计算
3. 异步处理长时间操作
4. 定期清理过期数据

### 性能指标

- 用户创建：< 100ms
- 数据验证：< 50ms
- 合规性检查：< 200ms
- 数据迁移：< 1s/用户
