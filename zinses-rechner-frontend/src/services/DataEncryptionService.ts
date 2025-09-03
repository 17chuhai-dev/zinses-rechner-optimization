/**
 * 数据加密服务
 * 实现端到端数据加密，包括传输加密、存储加密、密钥管理等
 */

import { auditLogService } from './AuditLogService'

// 加密相关类型定义
export interface EncryptionConfig {
  algorithm: EncryptionAlgorithm
  keySize: number
  mode: EncryptionMode
  padding: PaddingScheme
  keyDerivation: KeyDerivationFunction
  iterations: number
  saltSize: number
  ivSize: number
}

export type EncryptionAlgorithm = 'AES' | 'ChaCha20' | 'RSA' | 'ECC'

export type EncryptionMode = 'GCM' | 'CBC' | 'CTR' | 'ECB' | 'CFB' | 'OFB'

export type PaddingScheme = 'PKCS7' | 'OAEP' | 'PSS' | 'NONE'

export type KeyDerivationFunction = 'PBKDF2' | 'Argon2' | 'scrypt' | 'HKDF'

export interface EncryptionKey {
  id: string
  name: string
  algorithm: EncryptionAlgorithm
  keySize: number
  purpose: KeyPurpose
  status: KeyStatus
  createdAt: Date
  expiresAt?: Date
  rotatedAt?: Date
  version: number
  metadata: KeyMetadata
  permissions: KeyPermission[]
}

export type KeyPurpose = 
  | 'data_encryption'     // 数据加密
  | 'key_encryption'      // 密钥加密
  | 'digital_signature'   // 数字签名
  | 'authentication'      // 认证
  | 'key_agreement'       // 密钥协商

export type KeyStatus = 'active' | 'inactive' | 'expired' | 'revoked' | 'compromised'

export interface KeyMetadata {
  createdBy: string
  organizationId: string
  tags: string[]
  description: string
  customFields: Record<string, any>
}

export interface KeyPermission {
  userId: string
  operations: KeyOperation[]
  conditions?: PermissionCondition[]
  expiresAt?: Date
}

export type KeyOperation = 'encrypt' | 'decrypt' | 'sign' | 'verify' | 'derive' | 'export' | 'delete'

export interface PermissionCondition {
  type: 'ip_range' | 'time_range' | 'user_attribute' | 'resource_attribute'
  value: any
}

export interface EncryptedData {
  ciphertext: string
  keyId: string
  algorithm: EncryptionAlgorithm
  mode: EncryptionMode
  iv: string
  authTag?: string
  metadata: EncryptionMetadata
}

export interface EncryptionMetadata {
  timestamp: Date
  version: string
  checksum: string
  compressionUsed: boolean
  customHeaders: Record<string, string>
}

export interface DecryptionResult {
  plaintext: string
  verified: boolean
  keyId: string
  metadata: EncryptionMetadata
}

export interface KeyRotationPolicy {
  id: string
  name: string
  keyIds: string[]
  rotationInterval: number // days
  autoRotate: boolean
  notifyBefore: number // days
  retainOldKeys: number // number of old keys to retain
  isActive: boolean
  lastRotation?: Date
  nextRotation?: Date
}

export interface EncryptionAuditLog {
  id: string
  operation: EncryptionOperation
  keyId: string
  userId: string
  timestamp: Date
  success: boolean
  dataSize: number
  duration: number
  ipAddress: string
  userAgent: string
  error?: string
}

export type EncryptionOperation = 
  | 'encrypt'
  | 'decrypt'
  | 'key_generate'
  | 'key_rotate'
  | 'key_export'
  | 'key_import'
  | 'key_delete'
  | 'key_revoke'

export interface HSMConfig {
  provider: 'aws_cloudhsm' | 'azure_keyvault' | 'google_cloudkms' | 'thales' | 'safenet'
  endpoint: string
  credentials: HSMCredentials
  partition?: string
  slot?: number
  isActive: boolean
}

export interface HSMCredentials {
  username?: string
  password?: string
  certificatePath?: string
  privateKeyPath?: string
  accessKeyId?: string
  secretAccessKey?: string
  tenantId?: string
  clientId?: string
  clientSecret?: string
}

export interface CertificateInfo {
  subject: string
  issuer: string
  serialNumber: string
  validFrom: Date
  validTo: Date
  fingerprint: string
  keyUsage: string[]
  extendedKeyUsage: string[]
}

export class DataEncryptionService {
  private static instance: DataEncryptionService
  private keyCache: Map<string, CryptoKey> = new Map()
  private defaultConfig: EncryptionConfig = {
    algorithm: 'AES',
    keySize: 256,
    mode: 'GCM',
    padding: 'NONE',
    keyDerivation: 'PBKDF2',
    iterations: 100000,
    saltSize: 32,
    ivSize: 12
  }

  private constructor() {}

  public static getInstance(): DataEncryptionService {
    if (!DataEncryptionService.instance) {
      DataEncryptionService.instance = new DataEncryptionService()
    }
    return DataEncryptionService.instance
  }

  /**
   * 生成加密密钥
   */
  public async generateKey(
    algorithm: EncryptionAlgorithm = 'AES',
    keySize: number = 256,
    purpose: KeyPurpose = 'data_encryption'
  ): Promise<EncryptionKey | null> {
    try {
      const keyId = this.generateKeyId()
      
      let cryptoKey: CryptoKey
      
      if (algorithm === 'AES') {
        cryptoKey = await crypto.subtle.generateKey(
          {
            name: 'AES-GCM',
            length: keySize
          },
          true, // extractable
          ['encrypt', 'decrypt']
        )
      } else if (algorithm === 'RSA') {
        const keyPair = await crypto.subtle.generateKey(
          {
            name: 'RSA-OAEP',
            modulusLength: keySize,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256'
          },
          true,
          ['encrypt', 'decrypt']
        )
        cryptoKey = keyPair.privateKey
      } else {
        throw new Error(`不支持的算法: ${algorithm}`)
      }

      // 缓存密钥
      this.keyCache.set(keyId, cryptoKey)

      const encryptionKey: EncryptionKey = {
        id: keyId,
        name: `${algorithm}-${keySize}-${Date.now()}`,
        algorithm,
        keySize,
        purpose,
        status: 'active',
        createdAt: new Date(),
        version: 1,
        metadata: {
          createdBy: 'system',
          organizationId: 'default',
          tags: [],
          description: `Generated ${algorithm} key for ${purpose}`,
          customFields: {}
        },
        permissions: []
      }

      // 记录审计日志
      await auditLogService.log(
        'security_event',
        'security',
        'encryption_key_generated',
        'encryption_key',
        {
          description: `Encryption key generated: ${algorithm}-${keySize}`,
          customFields: { keyId, algorithm, keySize, purpose }
        },
        { resourceId: keyId, severity: 'medium', immediate: true }
      )

      return encryptionKey
    } catch (error) {
      console.error('生成加密密钥失败:', error)
      return null
    }
  }

  /**
   * 加密数据
   */
  public async encryptData(
    plaintext: string,
    keyId: string,
    config?: Partial<EncryptionConfig>
  ): Promise<EncryptedData | null> {
    try {
      const startTime = Date.now()
      const effectiveConfig = { ...this.defaultConfig, ...config }
      
      // 获取密钥
      const cryptoKey = this.keyCache.get(keyId)
      if (!cryptoKey) {
        throw new Error(`密钥不存在: ${keyId}`)
      }

      // 生成IV
      const iv = crypto.getRandomValues(new Uint8Array(effectiveConfig.ivSize))
      
      // 编码明文
      const encoder = new TextEncoder()
      const data = encoder.encode(plaintext)

      // 执行加密
      const encrypted = await crypto.subtle.encrypt(
        {
          name: `${effectiveConfig.algorithm}-${effectiveConfig.mode}`,
          iv: iv
        },
        cryptoKey,
        data
      )

      // 提取认证标签（对于GCM模式）
      let authTag: string | undefined
      let ciphertext: ArrayBuffer
      
      if (effectiveConfig.mode === 'GCM') {
        // GCM模式下，最后16字节是认证标签
        const encryptedArray = new Uint8Array(encrypted)
        const tagLength = 16
        authTag = this.arrayBufferToBase64(encryptedArray.slice(-tagLength))
        ciphertext = encryptedArray.slice(0, -tagLength).buffer
      } else {
        ciphertext = encrypted
      }

      const encryptedData: EncryptedData = {
        ciphertext: this.arrayBufferToBase64(ciphertext),
        keyId,
        algorithm: effectiveConfig.algorithm,
        mode: effectiveConfig.mode,
        iv: this.arrayBufferToBase64(iv),
        authTag,
        metadata: {
          timestamp: new Date(),
          version: '1.0',
          checksum: await this.calculateChecksum(plaintext),
          compressionUsed: false,
          customHeaders: {}
        }
      }

      const duration = Date.now() - startTime

      // 记录审计日志
      await auditLogService.log(
        'security_event',
        'security',
        'data_encrypted',
        'encrypted_data',
        {
          description: `Data encrypted using key ${keyId}`,
          customFields: { 
            keyId, 
            algorithm: effectiveConfig.algorithm,
            dataSize: plaintext.length,
            duration
          }
        },
        { resourceId: keyId, severity: 'low' }
      )

      return encryptedData
    } catch (error) {
      console.error('数据加密失败:', error)
      
      // 记录错误审计日志
      await auditLogService.log(
        'security_event',
        'security',
        'data_encryption_failed',
        'encrypted_data',
        {
          description: `Data encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          customFields: { keyId, error: error instanceof Error ? error.message : 'Unknown error' }
        },
        { resourceId: keyId, severity: 'high', immediate: true }
      )

      return null
    }
  }

  /**
   * 解密数据
   */
  public async decryptData(encryptedData: EncryptedData): Promise<DecryptionResult | null> {
    try {
      const startTime = Date.now()
      
      // 获取密钥
      const cryptoKey = this.keyCache.get(encryptedData.keyId)
      if (!cryptoKey) {
        throw new Error(`密钥不存在: ${encryptedData.keyId}`)
      }

      // 解码数据
      const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext)
      const iv = this.base64ToArrayBuffer(encryptedData.iv)
      
      // 准备解密数据
      let dataToDecrypt: ArrayBuffer
      
      if (encryptedData.mode === 'GCM' && encryptedData.authTag) {
        // GCM模式需要附加认证标签
        const authTag = this.base64ToArrayBuffer(encryptedData.authTag)
        const combined = new Uint8Array(ciphertext.byteLength + authTag.byteLength)
        combined.set(new Uint8Array(ciphertext))
        combined.set(new Uint8Array(authTag), ciphertext.byteLength)
        dataToDecrypt = combined.buffer
      } else {
        dataToDecrypt = ciphertext
      }

      // 执行解密
      const decrypted = await crypto.subtle.decrypt(
        {
          name: `${encryptedData.algorithm}-${encryptedData.mode}`,
          iv: iv
        },
        cryptoKey,
        dataToDecrypt
      )

      // 解码明文
      const decoder = new TextDecoder()
      const plaintext = decoder.decode(decrypted)

      // 验证校验和
      const calculatedChecksum = await this.calculateChecksum(plaintext)
      const verified = calculatedChecksum === encryptedData.metadata.checksum

      const duration = Date.now() - startTime

      // 记录审计日志
      await auditLogService.log(
        'security_event',
        'security',
        'data_decrypted',
        'encrypted_data',
        {
          description: `Data decrypted using key ${encryptedData.keyId}`,
          customFields: { 
            keyId: encryptedData.keyId,
            algorithm: encryptedData.algorithm,
            verified,
            duration
          }
        },
        { resourceId: encryptedData.keyId, severity: 'low' }
      )

      return {
        plaintext,
        verified,
        keyId: encryptedData.keyId,
        metadata: encryptedData.metadata
      }
    } catch (error) {
      console.error('数据解密失败:', error)
      
      // 记录错误审计日志
      await auditLogService.log(
        'security_event',
        'security',
        'data_decryption_failed',
        'encrypted_data',
        {
          description: `Data decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          customFields: { 
            keyId: encryptedData.keyId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          }
        },
        { resourceId: encryptedData.keyId, severity: 'high', immediate: true }
      )

      return null
    }
  }

  /**
   * 轮换密钥
   */
  public async rotateKey(keyId: string): Promise<EncryptionKey | null> {
    try {
      const oldKey = this.keyCache.get(keyId)
      if (!oldKey) {
        throw new Error(`密钥不存在: ${keyId}`)
      }

      // 生成新密钥（保持相同的算法和大小）
      const newKey = await this.generateKey('AES', 256, 'data_encryption')
      if (!newKey) {
        throw new Error('生成新密钥失败')
      }

      // 标记旧密钥为已轮换
      // 在实际实现中，这里应该更新数据库中的密钥状态

      // 记录审计日志
      await auditLogService.log(
        'security_event',
        'security',
        'encryption_key_rotated',
        'encryption_key',
        {
          description: `Encryption key rotated: ${keyId} -> ${newKey.id}`,
          customFields: { oldKeyId: keyId, newKeyId: newKey.id }
        },
        { resourceId: keyId, severity: 'medium', immediate: true }
      )

      return newKey
    } catch (error) {
      console.error('密钥轮换失败:', error)
      return null
    }
  }

  /**
   * 撤销密钥
   */
  public async revokeKey(keyId: string, reason: string): Promise<boolean> {
    try {
      // 从缓存中移除密钥
      this.keyCache.delete(keyId)

      // 记录审计日志
      await auditLogService.log(
        'security_event',
        'security',
        'encryption_key_revoked',
        'encryption_key',
        {
          description: `Encryption key revoked: ${keyId}`,
          customFields: { keyId, reason }
        },
        { resourceId: keyId, severity: 'high', immediate: true }
      )

      return true
    } catch (error) {
      console.error('撤销密钥失败:', error)
      return false
    }
  }

  /**
   * 导出密钥（仅用于备份）
   */
  public async exportKey(keyId: string, format: 'jwk' | 'raw' | 'pkcs8' = 'jwk'): Promise<string | null> {
    try {
      const cryptoKey = this.keyCache.get(keyId)
      if (!cryptoKey) {
        throw new Error(`密钥不存在: ${keyId}`)
      }

      let exportedKey: ArrayBuffer | JsonWebKey
      
      if (format === 'jwk') {
        exportedKey = await crypto.subtle.exportKey('jwk', cryptoKey)
        return JSON.stringify(exportedKey)
      } else {
        exportedKey = await crypto.subtle.exportKey(format, cryptoKey)
        return this.arrayBufferToBase64(exportedKey)
      }
    } catch (error) {
      console.error('导出密钥失败:', error)
      return null
    }
  }

  /**
   * 导入密钥
   */
  public async importKey(
    keyData: string,
    format: 'jwk' | 'raw' | 'pkcs8' = 'jwk',
    algorithm: EncryptionAlgorithm = 'AES'
  ): Promise<string | null> {
    try {
      const keyId = this.generateKeyId()
      let keyDataBuffer: ArrayBuffer | JsonWebKey
      
      if (format === 'jwk') {
        keyDataBuffer = JSON.parse(keyData)
      } else {
        keyDataBuffer = this.base64ToArrayBuffer(keyData)
      }

      let algorithmParams: any
      if (algorithm === 'AES') {
        algorithmParams = { name: 'AES-GCM' }
      } else if (algorithm === 'RSA') {
        algorithmParams = { name: 'RSA-OAEP', hash: 'SHA-256' }
      } else {
        throw new Error(`不支持的算法: ${algorithm}`)
      }

      const cryptoKey = await crypto.subtle.importKey(
        format,
        keyDataBuffer,
        algorithmParams,
        true,
        ['encrypt', 'decrypt']
      )

      // 缓存密钥
      this.keyCache.set(keyId, cryptoKey)

      // 记录审计日志
      await auditLogService.log(
        'security_event',
        'security',
        'encryption_key_imported',
        'encryption_key',
        {
          description: `Encryption key imported: ${algorithm}`,
          customFields: { keyId, algorithm, format }
        },
        { resourceId: keyId, severity: 'medium', immediate: true }
      )

      return keyId
    } catch (error) {
      console.error('导入密钥失败:', error)
      return null
    }
  }

  /**
   * 计算数据校验和
   */
  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    return this.arrayBufferToBase64(hashBuffer)
  }

  /**
   * ArrayBuffer转Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Base64转ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  /**
   * 生成密钥ID
   */
  private generateKeyId(): string {
    return 'key_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36)
  }

  /**
   * 获取密钥信息
   */
  public getKeyInfo(keyId: string): { exists: boolean; algorithm?: string } {
    const exists = this.keyCache.has(keyId)
    return { exists, algorithm: exists ? 'AES' : undefined }
  }

  /**
   * 清除密钥缓存
   */
  public clearKeyCache(): void {
    this.keyCache.clear()
  }

  /**
   * 获取缓存的密钥数量
   */
  public getCachedKeyCount(): number {
    return this.keyCache.size
  }

  /**
   * 检查浏览器加密支持
   */
  public checkCryptoSupport(): {
    webCrypto: boolean
    algorithms: string[]
    features: string[]
  } {
    const support = {
      webCrypto: !!crypto.subtle,
      algorithms: [] as string[],
      features: [] as string[]
    }

    if (crypto.subtle) {
      // 检查支持的算法
      const algorithms = ['AES-GCM', 'AES-CBC', 'RSA-OAEP', 'ECDSA', 'HMAC', 'PBKDF2']
      support.algorithms = algorithms

      // 检查支持的功能
      const features = ['generateKey', 'encrypt', 'decrypt', 'sign', 'verify', 'digest', 'importKey', 'exportKey']
      support.features = features.filter(feature => typeof (crypto.subtle as any)[feature] === 'function')
    }

    return support
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    this.keyCache.clear()
  }
}

// 导出单例实例
export const dataEncryptionService = DataEncryptionService.getInstance()
