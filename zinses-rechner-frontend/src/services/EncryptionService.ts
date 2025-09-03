/**
 * 客户端加密服务
 * 提供AES-256-GCM加密功能，基于设备指纹的密钥派生
 * 符合DSGVO要求，密钥不存储在本地
 */

import { generateDeviceFingerprint } from '../utils/user-identity-utils'

// 加密配置常量
const ENCRYPTION_CONFIG = {
  ALGORITHM: 'AES-GCM',
  KEY_LENGTH: 256, // AES-256
  IV_LENGTH: 12, // GCM推荐的IV长度
  TAG_LENGTH: 128, // 认证标签长度
  PBKDF2_ITERATIONS: 100000, // PBKDF2迭代次数
  SALT_LENGTH: 32 // 盐值长度
} as const

// 加密结果接口
export interface EncryptedData {
  data: string // Base64编码的加密数据
  iv: string // Base64编码的初始化向量
  salt: string // Base64编码的盐值
  version: string // 加密版本标识
  timestamp: number // 加密时间戳
}

// 密钥派生选项
export interface KeyDerivationOptions {
  deviceFingerprint?: string
  customSalt?: Uint8Array
  iterations?: number
}

/**
 * 加密服务类
 */
export class EncryptionService {
  private static instance: EncryptionService | null = null
  private deviceFingerprint: string | null = null
  private keyCache: Map<string, CryptoKey> = new Map()

  private constructor() {
    // 私有构造函数，实现单例模式
  }

  /**
   * 获取加密服务单例实例
   */
  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService()
    }
    return EncryptionService.instance
  }

  /**
   * 初始化加密服务
   */
  async initialize(): Promise<void> {
    try {
      // 检查Web Crypto API支持
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API not supported')
      }

      // 生成设备指纹
      this.deviceFingerprint = generateDeviceFingerprint()
      
      console.log('🔐 Encryption service initialized')
    } catch (error) {
      console.error('Failed to initialize encryption service:', error)
      throw error
    }
  }

  /**
   * 派生加密密钥
   */
  private async deriveKey(
    password: string,
    salt: Uint8Array,
    options: KeyDerivationOptions = {}
  ): Promise<CryptoKey> {
    const iterations = options.iterations || ENCRYPTION_CONFIG.PBKDF2_ITERATIONS
    const cacheKey = `${password}-${Array.from(salt).join(',')}-${iterations}`

    // 检查密钥缓存
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey)!
    }

    try {
      // 使用PBKDF2派生密钥
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
      )

      const key = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: iterations,
          hash: 'SHA-256'
        },
        keyMaterial,
        {
          name: ENCRYPTION_CONFIG.ALGORITHM,
          length: ENCRYPTION_CONFIG.KEY_LENGTH
        },
        false,
        ['encrypt', 'decrypt']
      )

      // 缓存密钥（最多缓存10个密钥）
      if (this.keyCache.size >= 10) {
        const firstKey = this.keyCache.keys().next().value
        this.keyCache.delete(firstKey)
      }
      this.keyCache.set(cacheKey, key)

      return key
    } catch (error) {
      console.error('Key derivation failed:', error)
      throw new Error('Failed to derive encryption key')
    }
  }

  /**
   * 生成随机盐值
   */
  private generateSalt(): Uint8Array {
    return window.crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.SALT_LENGTH))
  }

  /**
   * 生成随机初始化向量
   */
  private generateIV(): Uint8Array {
    return window.crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.IV_LENGTH))
  }

  /**
   * 获取密钥派生密码（基于设备指纹）
   */
  private getKeyPassword(): string {
    if (!this.deviceFingerprint) {
      throw new Error('Encryption service not initialized')
    }
    
    // 使用设备指纹作为密钥派生的基础
    // 添加一些固定的应用特定信息以增强安全性
    return `zinses-rechner-${this.deviceFingerprint}-encryption-key`
  }

  /**
   * 加密数据
   */
  async encrypt<T>(data: T): Promise<EncryptedData> {
    try {
      // 序列化数据
      const plaintext = JSON.stringify(data)
      const plaintextBytes = new TextEncoder().encode(plaintext)

      // 生成盐值和IV
      const salt = this.generateSalt()
      const iv = this.generateIV()

      // 派生密钥
      const key = await this.deriveKey(this.getKeyPassword(), salt)

      // 加密数据
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: ENCRYPTION_CONFIG.ALGORITHM,
          iv: iv,
          tagLength: ENCRYPTION_CONFIG.TAG_LENGTH
        },
        key,
        plaintextBytes
      )

      // 转换为Base64编码
      const encryptedArray = new Uint8Array(encryptedBuffer)
      const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray))
      const ivBase64 = btoa(String.fromCharCode(...iv))
      const saltBase64 = btoa(String.fromCharCode(...salt))

      return {
        data: encryptedBase64,
        iv: ivBase64,
        salt: saltBase64,
        version: '1.0',
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('Encryption failed:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  /**
   * 解密数据
   */
  async decrypt<T>(encryptedData: EncryptedData): Promise<T> {
    try {
      // 解码Base64数据
      const encryptedBytes = new Uint8Array(
        atob(encryptedData.data).split('').map(char => char.charCodeAt(0))
      )
      const iv = new Uint8Array(
        atob(encryptedData.iv).split('').map(char => char.charCodeAt(0))
      )
      const salt = new Uint8Array(
        atob(encryptedData.salt).split('').map(char => char.charCodeAt(0))
      )

      // 派生密钥
      const key = await this.deriveKey(this.getKeyPassword(), salt)

      // 解密数据
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: ENCRYPTION_CONFIG.ALGORITHM,
          iv: iv,
          tagLength: ENCRYPTION_CONFIG.TAG_LENGTH
        },
        key,
        encryptedBytes
      )

      // 转换为字符串并解析JSON
      const decryptedText = new TextDecoder().decode(decryptedBuffer)
      return JSON.parse(decryptedText)
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  /**
   * 验证加密数据的完整性
   */
  async verifyIntegrity(encryptedData: EncryptedData): Promise<boolean> {
    try {
      // 尝试解密数据，如果成功则说明数据完整
      await this.decrypt(encryptedData)
      return true
    } catch {
      return false
    }
  }

  /**
   * 清理密钥缓存
   */
  clearKeyCache(): void {
    this.keyCache.clear()
    console.log('🧹 Encryption key cache cleared')
  }

  /**
   * 获取加密服务状态
   */
  getStatus(): {
    initialized: boolean
    hasDeviceFingerprint: boolean
    cachedKeysCount: number
    supportedAlgorithms: string[]
  } {
    return {
      initialized: this.deviceFingerprint !== null,
      hasDeviceFingerprint: this.deviceFingerprint !== null,
      cachedKeysCount: this.keyCache.size,
      supportedAlgorithms: [ENCRYPTION_CONFIG.ALGORITHM]
    }
  }
}

// 导出单例实例
export const encryptionService = EncryptionService.getInstance()
