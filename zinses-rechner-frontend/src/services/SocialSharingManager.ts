/**
 * 社交分享管理器
 * 提供完整的社交媒体分享功能，包括链接生成、图片分享、数据分享等
 */

import { ref, reactive } from 'vue'

// 分享平台枚举
export enum SharingPlatform {
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  WHATSAPP = 'whatsapp',
  TELEGRAM = 'telegram',
  EMAIL = 'email',
  COPY_LINK = 'copy-link',
  QR_CODE = 'qr-code'
}

// 分享内容接口
export interface ShareContent {
  title: string
  description: string
  url: string
  imageUrl?: string
  hashtags?: string[]
  via?: string
  calculationType?: string
  results?: {
    initialAmount: number
    finalAmount: number
    totalInterest: number
    years: number
    interestRate: number
  }
}

// 分享配置接口
export interface ShareConfig {
  enabledPlatforms: SharingPlatform[]
  defaultHashtags: string[]
  brandHandle: string
  trackingEnabled: boolean
  customDomain?: string
  shortUrlService?: 'tinyurl' | 'bitly' | 'custom'
}

// 分享统计接口
export interface ShareStatistics {
  totalShares: number
  sharesByPlatform: Record<SharingPlatform, number>
  popularCalculations: Array<{
    type: string
    shares: number
    conversionRate: number
  }>
  recentShares: Array<{
    platform: SharingPlatform
    timestamp: Date
    calculationType: string
  }>
}

// 分享状态接口
export interface SharingState {
  isSharing: boolean
  lastSharedUrl: string | null
  shareCount: number
  error: string | null
  qrCodeData: string | null
}

/**
 * 社交分享管理器类
 */
export class SocialSharingManager {
  private static instance: SocialSharingManager

  // 分享状态
  public readonly state = reactive<SharingState>({
    isSharing: false,
    lastSharedUrl: null,
    shareCount: 0,
    error: null,
    qrCodeData: null
  })

  // 分享配置
  public readonly config = reactive<ShareConfig>({
    enabledPlatforms: [
      SharingPlatform.FACEBOOK,
      SharingPlatform.TWITTER,
      SharingPlatform.LINKEDIN,
      SharingPlatform.WHATSAPP,
      SharingPlatform.EMAIL,
      SharingPlatform.COPY_LINK
    ],
    defaultHashtags: ['ZinsesRechner', 'Finanzen', 'Zinseszins', 'Geldanlage'],
    brandHandle: '@ZinsesRechner',
    trackingEnabled: true,
    shortUrlService: 'custom'
  })

  // 分享统计
  private statistics = ref<ShareStatistics>({
    totalShares: 0,
    sharesByPlatform: {} as Record<SharingPlatform, number>,
    popularCalculations: [],
    recentShares: []
  })

  private constructor() {
    this.initializeStatistics()
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): SocialSharingManager {
    if (!SocialSharingManager.instance) {
      SocialSharingManager.instance = new SocialSharingManager()
    }
    return SocialSharingManager.instance
  }

  /**
   * 分享到指定平台
   */
  public async shareToplatform(
    platform: SharingPlatform,
    content: ShareContent
  ): Promise<boolean> {
    try {
      this.state.isSharing = true
      this.state.error = null

      // 生成分享URL
      const shareUrl = await this.generateShareUrl(content)
      
      let success = false

      switch (platform) {
        case SharingPlatform.FACEBOOK:
          success = await this.shareToFacebook(shareUrl, content)
          break
        case SharingPlatform.TWITTER:
          success = await this.shareToTwitter(shareUrl, content)
          break
        case SharingPlatform.LINKEDIN:
          success = await this.shareToLinkedIn(shareUrl, content)
          break
        case SharingPlatform.WHATSAPP:
          success = await this.shareToWhatsApp(shareUrl, content)
          break
        case SharingPlatform.TELEGRAM:
          success = await this.shareToTelegram(shareUrl, content)
          break
        case SharingPlatform.EMAIL:
          success = await this.shareViaEmail(shareUrl, content)
          break
        case SharingPlatform.COPY_LINK:
          success = await this.copyToClipboard(shareUrl)
          break
        case SharingPlatform.QR_CODE:
          success = await this.generateQRCode(shareUrl)
          break
        default:
          throw new Error(`不支持的分享平台: ${platform}`)
      }

      if (success) {
        this.updateStatistics(platform, content.calculationType || 'unknown')
        this.state.lastSharedUrl = shareUrl
        this.state.shareCount++
      }

      return success
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : '分享失败'
      return false
    } finally {
      this.state.isSharing = false
    }
  }

  /**
   * 批量分享到多个平台
   */
  public async shareToMultiplePlatforms(
    platforms: SharingPlatform[],
    content: ShareContent
  ): Promise<Record<SharingPlatform, boolean>> {
    const results: Record<SharingPlatform, boolean> = {} as any

    for (const platform of platforms) {
      results[platform] = await this.shareToplatform(platform, content)
    }

    return results
  }

  /**
   * 生成分享链接
   */
  public async generateShareableLink(
    calculationData: any,
    includeResults: boolean = true
  ): Promise<string> {
    try {
      // 创建分享数据
      const shareData = {
        type: calculationData.calculatorType,
        params: calculationData.inputData,
        ...(includeResults && { results: calculationData.results }),
        timestamp: Date.now()
      }

      // 编码数据
      const encodedData = btoa(JSON.stringify(shareData))
      
      // 生成完整URL
      const baseUrl = this.config.customDomain || window.location.origin
      const shareUrl = `${baseUrl}/shared/${encodedData}`

      // 可选：生成短链接
      if (this.config.shortUrlService) {
        return await this.shortenUrl(shareUrl)
      }

      return shareUrl
    } catch (error) {
      console.error('生成分享链接失败:', error)
      throw error
    }
  }

  /**
   * 解析分享链接
   */
  public parseSharedLink(shareToken: string): any {
    try {
      const decodedData = atob(shareToken)
      return JSON.parse(decodedData)
    } catch (error) {
      console.error('解析分享链接失败:', error)
      return null
    }
  }

  /**
   * 生成分享图片
   */
  public async generateShareImage(
    calculationData: any,
    template: 'summary' | 'chart' | 'detailed' = 'summary'
  ): Promise<string> {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      // 设置画布尺寸 (适合社交媒体)
      canvas.width = 1200
      canvas.height = 630

      // 绘制背景
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 绘制品牌标识
      await this.drawBrandHeader(ctx, canvas.width)

      // 根据模板绘制内容
      switch (template) {
        case 'summary':
          await this.drawSummaryTemplate(ctx, calculationData, canvas.width, canvas.height)
          break
        case 'chart':
          await this.drawChartTemplate(ctx, calculationData, canvas.width, canvas.height)
          break
        case 'detailed':
          await this.drawDetailedTemplate(ctx, calculationData, canvas.width, canvas.height)
          break
      }

      // 绘制页脚
      this.drawFooter(ctx, canvas.width, canvas.height)

      return canvas.toDataURL('image/png', 0.9)
    } catch (error) {
      console.error('生成分享图片失败:', error)
      throw error
    }
  }

  /**
   * 获取分享统计
   */
  public getStatistics(): ShareStatistics {
    return this.statistics.value
  }

  /**
   * 检查平台可用性
   */
  public isPlatformAvailable(platform: SharingPlatform): boolean {
    switch (platform) {
      case SharingPlatform.COPY_LINK:
        return 'clipboard' in navigator
      case SharingPlatform.QR_CODE:
        return true
      default:
        return true // 大多数平台通过URL scheme支持
    }
  }

  // 私有方法

  /**
   * 初始化统计数据
   */
  private initializeStatistics(): void {
    // 从localStorage加载统计数据
    const saved = localStorage.getItem('sharing_statistics')
    if (saved) {
      try {
        this.statistics.value = JSON.parse(saved)
      } catch (error) {
        console.warn('加载分享统计失败:', error)
      }
    }

    // 初始化平台统计
    for (const platform of Object.values(SharingPlatform)) {
      if (!this.statistics.value.sharesByPlatform[platform]) {
        this.statistics.value.sharesByPlatform[platform] = 0
      }
    }
  }

  /**
   * 生成分享URL
   */
  private async generateShareUrl(content: ShareContent): Promise<string> {
    let url = content.url

    // 添加跟踪参数
    if (this.config.trackingEnabled) {
      const urlObj = new URL(url)
      urlObj.searchParams.set('utm_source', 'social_share')
      urlObj.searchParams.set('utm_medium', 'social')
      urlObj.searchParams.set('utm_campaign', 'calculation_share')
      url = urlObj.toString()
    }

    return url
  }

  /**
   * 分享到Facebook
   */
  private async shareToFacebook(url: string, content: ShareContent): Promise<boolean> {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    return this.openShareWindow(shareUrl)
  }

  /**
   * 分享到Twitter
   */
  private async shareToTwitter(url: string, content: ShareContent): Promise<boolean> {
    const text = `${content.title} - ${content.description}`
    const hashtags = [...this.config.defaultHashtags, ...(content.hashtags || [])].join(',')
    const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}&hashtags=${hashtags}&via=${this.config.brandHandle.replace('@', '')}`
    return this.openShareWindow(shareUrl)
  }

  /**
   * 分享到LinkedIn
   */
  private async shareToLinkedIn(url: string, content: ShareContent): Promise<boolean> {
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    return this.openShareWindow(shareUrl)
  }

  /**
   * 分享到WhatsApp
   */
  private async shareToWhatsApp(url: string, content: ShareContent): Promise<boolean> {
    const text = `${content.title}\n${content.description}\n${url}`
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    return this.openShareWindow(shareUrl)
  }

  /**
   * 分享到Telegram
   */
  private async shareToTelegram(url: string, content: ShareContent): Promise<boolean> {
    const text = `${content.title} - ${content.description}`
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    return this.openShareWindow(shareUrl)
  }

  /**
   * 通过邮件分享
   */
  private async shareViaEmail(url: string, content: ShareContent): Promise<boolean> {
    const subject = encodeURIComponent(content.title)
    const body = encodeURIComponent(`${content.description}\n\n${url}`)
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`
    
    window.location.href = mailtoUrl
    return true
  }

  /**
   * 复制到剪贴板
   */
  private async copyToClipboard(url: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(url)
      return true
    } catch (error) {
      // 降级方案
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      return success
    }
  }

  /**
   * 生成二维码
   */
  private async generateQRCode(url: string): Promise<boolean> {
    try {
      // 简化的二维码生成（实际应该使用专门的库）
      this.state.qrCodeData = url
      return true
    } catch (error) {
      console.error('二维码生成失败:', error)
      return false
    }
  }

  /**
   * 打开分享窗口
   */
  private openShareWindow(url: string): boolean {
    try {
      const width = 600
      const height = 400
      const left = (window.innerWidth - width) / 2
      const top = (window.innerHeight - height) / 2
      
      window.open(
        url,
        'share',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      )
      return true
    } catch (error) {
      console.error('打开分享窗口失败:', error)
      return false
    }
  }

  /**
   * 缩短URL
   */
  private async shortenUrl(url: string): Promise<string> {
    // 简化实现，实际应该调用短链接服务API
    return url
  }

  /**
   * 更新统计数据
   */
  private updateStatistics(platform: SharingPlatform, calculationType: string): void {
    this.statistics.value.totalShares++
    this.statistics.value.sharesByPlatform[platform]++
    
    this.statistics.value.recentShares.unshift({
      platform,
      timestamp: new Date(),
      calculationType
    })

    // 保持最近分享记录在100条以内
    if (this.statistics.value.recentShares.length > 100) {
      this.statistics.value.recentShares = this.statistics.value.recentShares.slice(0, 100)
    }

    // 保存到localStorage
    localStorage.setItem('sharing_statistics', JSON.stringify(this.statistics.value))
  }

  /**
   * 绘制品牌头部
   */
  private async drawBrandHeader(ctx: CanvasRenderingContext2D, width: number): Promise<void> {
    ctx.fillStyle = '#1f2937'
    ctx.font = 'bold 32px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Zinses-Rechner', width / 2, 60)
  }

  /**
   * 绘制摘要模板
   */
  private async drawSummaryTemplate(
    ctx: CanvasRenderingContext2D,
    data: any,
    width: number,
    height: number
  ): Promise<void> {
    // 绘制主要结果
    ctx.fillStyle = '#374151'
    ctx.font = '24px Arial'
    ctx.textAlign = 'center'
    
    const results = data.results
    if (results) {
      ctx.fillText(`Startkapital: €${results.initialAmount.toLocaleString('de-DE')}`, width / 2, 200)
      ctx.fillText(`Endkapital: €${results.finalAmount.toLocaleString('de-DE')}`, width / 2, 250)
      ctx.fillText(`Zinsen: €${results.totalInterest.toLocaleString('de-DE')}`, width / 2, 300)
      ctx.fillText(`Laufzeit: ${results.years} Jahre`, width / 2, 350)
    }
  }

  /**
   * 绘制图表模板
   */
  private async drawChartTemplate(
    ctx: CanvasRenderingContext2D,
    data: any,
    width: number,
    height: number
  ): Promise<void> {
    // 简化的图表绘制
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(100, height - 100)
    ctx.lineTo(width - 100, 150)
    ctx.stroke()
  }

  /**
   * 绘制详细模板
   */
  private async drawDetailedTemplate(
    ctx: CanvasRenderingContext2D,
    data: any,
    width: number,
    height: number
  ): Promise<void> {
    // 结合摘要和图表
    await this.drawSummaryTemplate(ctx, data, width, height)
    await this.drawChartTemplate(ctx, data, width, height)
  }

  /**
   * 绘制页脚
   */
  private drawFooter(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = '#9ca3af'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('zinses-rechner.de', width / 2, height - 30)
  }
}

// 导出单例实例
export const socialSharingManager = SocialSharingManager.getInstance()

// 导出便捷的composable
export function useSocialSharing() {
  const manager = SocialSharingManager.getInstance()
  
  return {
    // 状态
    state: manager.state,
    config: manager.config,
    
    // 方法
    shareToplatform: manager.shareToplatform.bind(manager),
    shareToMultiplePlatforms: manager.shareToMultiplePlatforms.bind(manager),
    generateShareableLink: manager.generateShareableLink.bind(manager),
    parseSharedLink: manager.parseSharedLink.bind(manager),
    generateShareImage: manager.generateShareImage.bind(manager),
    getStatistics: manager.getStatistics.bind(manager),
    isPlatformAvailable: manager.isPlatformAvailable.bind(manager)
  }
}
