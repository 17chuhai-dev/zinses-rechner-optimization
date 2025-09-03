# 用户身份管理系统使用指南

## 快速开始

本指南将帮助您快速上手用户身份管理系统，了解如何在Zinses-Rechner应用中使用各项功能。

## 基本概念

### 用户类型

系统支持两种用户类型：

1. **匿名用户** - 无需注册即可使用基本功能
2. **注册用户** - 提供邮箱注册，享受完整功能和跨设备同步

### 数据处理原则

系统严格遵循DSGVO（德国数据保护法规）要求：
- 数据最小化 - 只收集必要的数据
- 目的限制 - 明确数据使用目的
- 存储限制 - 自动清理过期数据
- 透明度 - 清楚说明数据处理方式

## 用户生命周期管理

### 1. 创建匿名用户

当用户首次访问应用时，系统会自动创建匿名用户：

```typescript
import { UserIdentityService } from '@/services/UserIdentityService'

const userService = new UserIdentityService()

// 创建匿名用户
const anonymousUser = await userService.createAnonymousUser({
  preferences: {
    theme: 'auto',
    language: 'de',
    currency: 'EUR'
  }
})

console.log('匿名用户已创建:', anonymousUser.id)
```

### 2. 用户注册升级

用户可以选择注册以获得更多功能：

```typescript
// 升级为注册用户
const registeredUser = await userService.upgradeUser(
  anonymousUser.id,
  'user@example.de'
)

console.log('用户已升级为注册用户')
```

### 3. 用户信息更新

更新用户偏好设置：

```typescript
// 更新用户偏好
const updatedUser = await userService.updateUser(user.id, {
  preferences: {
    ...user.preferences,
    theme: 'dark',
    notifications: {
      ...user.preferences.notifications,
      goalReminders: false
    }
  }
})
```

### 4. 用户数据删除

用户可以随时删除自己的数据：

```typescript
// 删除用户数据（实现被遗忘权）
await userService.deleteUser(user.id)
console.log('用户数据已删除')
```

## 同意管理

### 理解同意类型

系统定义了三种同意类型：

1. **功能性同意** - 基本功能必需，基于合法利益
2. **分析同意** - 用于改进服务，需要用户明确同意
3. **营销同意** - 用于营销推广，需要用户明确同意

### 更新同意状态

```typescript
// 用户同意分析数据收集
await userService.updateConsent(
  user.id,
  'analytics',
  true,
  'user_action'
)

// 用户拒绝营销推广
await userService.updateConsent(
  user.id,
  'marketing',
  false,
  'privacy_settings'
)
```

### 检查同意权限

在执行数据处理前，始终检查用户同意：

```typescript
import { hasConsentForPurpose } from '@/utils/user-identity-utils'

// 检查是否可以进行分析
if (hasConsentForPurpose(user, 'analytics')) {
  // 执行分析相关操作
  trackUserBehavior(user.id, 'page_view')
} else {
  console.log('用户未同意分析数据收集')
}
```

## 数据验证和完整性

### 验证用户数据

定期验证用户数据的完整性：

```typescript
import { validateUserDataIntegrity } from '@/utils/user-identity-utils'

const validationResult = validateUserDataIntegrity(user)

if (!validationResult.isValid) {
  console.log('数据验证失败:')
  validationResult.errors.forEach(error => {
    console.log(`- ${error.field}: ${error.message}`)
  })
  
  // 处理验证错误
  await fixUserDataIssues(user, validationResult.errors)
}
```

### 数据清理

自动清理过期数据：

```typescript
import { needsDataCleanup } from '@/utils/user-identity-utils'

if (needsDataCleanup(user)) {
  console.log('用户数据需要清理')
  
  // 提醒用户或自动清理
  await cleanupExpiredData(user)
}
```

## 数据迁移

### 检查迁移需求

系统会自动检查数据是否需要迁移：

```typescript
import { dataMigrationService } from '@/services/DataMigrationService'

if (dataMigrationService.needsMigration(userData)) {
  console.log('检测到需要数据迁移')
  
  const migrationResult = await dataMigrationService.migrateUserData(userData)
  
  if (migrationResult.success) {
    console.log(`迁移成功: ${migrationResult.fromVersion} → ${migrationResult.toVersion}`)
    console.log(`处理时间: ${migrationResult.stats.duration}ms`)
  } else {
    console.error('迁移失败:', migrationResult.error)
  }
}
```

### 批量迁移

处理多个用户的数据迁移：

```typescript
const userDataList = await loadAllUserData()
const migrationResults = await dataMigrationService.migrateBatch(userDataList)

const successCount = migrationResults.filter(r => r.success).length
const failureCount = migrationResults.length - successCount

console.log(`迁移完成: ${successCount} 成功, ${failureCount} 失败`)
```

## DSGVO合规性检查

### 单用户合规性验证

定期检查用户数据的DSGVO合规性：

```typescript
import { dsgvoComplianceValidator } from '@/services/DSGVOComplianceValidator'

const complianceResult = dsgvoComplianceValidator.validateUserCompliance(user)

console.log(`合规分数: ${complianceResult.complianceScore}/100`)
console.log(`合规状态: ${complianceResult.isCompliant ? '✅ 合规' : '❌ 不合规'}`)

// 处理违规项
if (complianceResult.violations.length > 0) {
  console.log('发现违规项:')
  complianceResult.violations.forEach(violation => {
    console.log(`- ${violation.article}: ${violation.description}`)
    console.log(`  修复建议: ${violation.remediation}`)
  })
}

// 查看建议
complianceResult.recommendations.forEach(rec => {
  console.log(`建议 (${rec.priority}): ${rec.description}`)
})
```

### 生成合规性报告

生成详细的合规性报告：

```typescript
import { dsgvoComplianceReporter } from '@/services/DSGVOComplianceReporter'

// 生成HTML报告
const htmlReport = dsgvoComplianceReporter.generateUserComplianceReport(user, {
  format: 'html',
  includeRecommendations: true,
  includeAuditTrail: true,
  language: 'de'
})

// 保存或显示报告
await saveReportToFile(htmlReport, `compliance-report-${user.id}.html`)

// 生成Markdown报告
const markdownReport = dsgvoComplianceReporter.generateUserComplianceReport(user, {
  format: 'markdown'
})

console.log(markdownReport)
```

## 本地存储加密

### 安全存储用户数据

使用加密服务安全存储敏感数据：

```typescript
import { localStorageEncryptionService } from '@/services/LocalStorageEncryptionService'

// 存储加密数据
await localStorageEncryptionService.setItem('user_preferences', user.preferences)
await localStorageEncryptionService.setItem('user_calculations', calculationHistory)

// 读取解密数据
const preferences = await localStorageEncryptionService.getItem('user_preferences')
const calculations = await localStorageEncryptionService.getItem('user_calculations')

// 删除敏感数据
await localStorageEncryptionService.removeItem('user_session')
```

### 数据清理

定期清理本地存储：

```typescript
// 清理过期的缓存数据
await localStorageEncryptionService.removeItem('expired_cache')

// 完全清理（谨慎使用）
await localStorageEncryptionService.clear()
```

## 实际使用场景

### 场景1：新用户首次访问

```typescript
// 1. 检测是否为新用户
const existingUserId = localStorage.getItem('user_id')

if (!existingUserId) {
  // 2. 创建匿名用户
  const newUser = await userService.createAnonymousUser()
  
  // 3. 存储用户ID
  localStorage.setItem('user_id', newUser.id)
  
  // 4. 显示隐私政策和同意选项
  showPrivacyConsentDialog(newUser)
} else {
  // 加载现有用户
  const user = await userService.getUser(existingUserId)
  if (user) {
    // 检查数据迁移
    await checkAndMigrateUserData(user)
  }
}
```

### 场景2：用户更改隐私设置

```typescript
async function updatePrivacySettings(userId: string, settings: PrivacySettings) {
  // 1. 更新分析同意
  if (settings.analytics !== undefined) {
    await userService.updateConsent(
      userId,
      'analytics',
      settings.analytics,
      'privacy_settings'
    )
  }
  
  // 2. 更新营销同意
  if (settings.marketing !== undefined) {
    await userService.updateConsent(
      userId,
      'marketing',
      settings.marketing,
      'privacy_settings'
    )
  }
  
  // 3. 更新数据保留期限
  if (settings.dataRetentionDays) {
    await userService.updateUser(userId, {
      preferences: {
        dataRetentionDays: settings.dataRetentionDays
      }
    })
  }
  
  // 4. 验证更新后的合规性
  const user = await userService.getUser(userId)
  if (user) {
    const compliance = dsgvoComplianceValidator.validateUserCompliance(user)
    if (!compliance.isCompliant) {
      console.warn('隐私设置更新后仍存在合规问题')
    }
  }
}
```

### 场景3：用户请求数据导出

```typescript
async function exportUserData(userId: string): Promise<string> {
  // 1. 获取用户数据
  const user = await userService.getUser(userId)
  if (!user) {
    throw new Error('用户不存在')
  }
  
  // 2. 检查数据导出权限
  if (!hasConsentForPurpose(user, 'data_export')) {
    throw new Error('用户未同意数据导出')
  }
  
  // 3. 收集所有用户数据
  const userData = {
    profile: user,
    calculations: await getCalculationHistory(userId),
    preferences: user.preferences,
    consentHistory: await getConsentHistory(userId)
  }
  
  // 4. 生成导出文件
  return JSON.stringify(userData, null, 2)
}
```

### 场景4：定期合规性检查

```typescript
async function performRegularComplianceCheck() {
  // 1. 获取所有用户
  const allUsers = await getAllUsers()
  
  // 2. 批量合规性检查
  const complianceResults = allUsers.map(user => ({
    userId: user.id,
    compliance: dsgvoComplianceValidator.validateUserCompliance(user)
  }))
  
  // 3. 统计结果
  const totalUsers = complianceResults.length
  const compliantUsers = complianceResults.filter(r => r.compliance.isCompliant).length
  const averageScore = complianceResults.reduce((sum, r) => sum + r.compliance.complianceScore, 0) / totalUsers
  
  // 4. 生成摘要报告
  const summaryReport = dsgvoComplianceReporter.generateBatchComplianceSummary(allUsers)
  
  // 5. 处理不合规用户
  const nonCompliantUsers = complianceResults.filter(r => !r.compliance.isCompliant)
  for (const result of nonCompliantUsers) {
    await handleNonCompliantUser(result.userId, result.compliance)
  }
  
  console.log(`合规性检查完成: ${compliantUsers}/${totalUsers} 用户合规，平均分数: ${Math.round(averageScore)}`)
}
```

## 最佳实践

### 1. 数据处理原则

- 始终检查用户同意状态
- 定期验证数据完整性
- 及时清理过期数据
- 保持审计日志完整

### 2. 错误处理

```typescript
try {
  const result = await userService.updateUser(userId, updates)
  return result
} catch (error) {
  // 记录错误
  console.error('用户更新失败:', error)
  
  // 根据错误类型处理
  if (error.code === 'VALIDATION_ERROR') {
    // 显示验证错误给用户
    showValidationErrors(error.details)
  } else if (error.code === 'CONSENT_REQUIRED') {
    // 请求用户同意
    requestUserConsent(error.purpose)
  } else {
    // 通用错误处理
    showGenericError('操作失败，请稍后重试')
  }
}
```

### 3. 性能优化

- 使用批量操作处理大量数据
- 缓存频繁访问的数据
- 异步处理长时间操作
- 定期清理缓存和临时数据

### 4. 安全考虑

- 加密存储敏感数据
- 定期轮换加密密钥
- 限制数据访问权限
- 监控异常访问模式

## 故障排除

### 常见问题

**Q: 用户数据验证失败**
```typescript
// 诊断和修复
const result = validateUserDataIntegrity(user)
if (!result.isValid) {
  // 查看具体错误
  result.errors.forEach(error => {
    console.log(`字段 ${error.field}: ${error.message}`)
  })
  
  // 尝试自动修复
  const fixedUser = await autoFixUserData(user, result.errors)
}
```

**Q: 合规性分数低**
```typescript
// 生成详细报告
const report = dsgvoComplianceReporter.generateUserComplianceReport(user, {
  format: 'markdown',
  includeRecommendations: true
})

console.log(report)
```

**Q: 数据迁移失败**
```typescript
// 查看迁移统计
const stats = dataMigrationService.getMigrationStats()
console.log('迁移统计:', stats)

// 重试迁移
const retryResult = await dataMigrationService.migrateUserData(userData)
```

## 总结

用户身份管理系统提供了完整的用户生命周期管理功能，严格遵循DSGVO要求，确保用户数据的安全和隐私。通过本指南，您应该能够：

1. 创建和管理用户账户
2. 处理用户同意和隐私设置
3. 验证数据完整性和合规性
4. 执行数据迁移和清理
5. 生成合规性报告
6. 安全存储和处理用户数据

如需更多技术细节，请参考[API参考文档](./API_REFERENCE.md)和[技术文档](./USER_IDENTITY_SYSTEM.md)。
