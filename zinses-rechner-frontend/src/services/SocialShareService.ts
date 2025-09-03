/**
 * 社交分享服务
 * 支持多种社交媒体平台的分享功能
 */

export interface ShareData {
  title: string
  description: string
  url: string
  hashtags?: string[]
  image?: string
  calculatorType?: string
  result?: {
    finalAmount?: number
    totalReturn?: number
    years?: number
  }
}

export interface ShareOptions {
  platform: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'telegram' | 'email' | 'copy'
  customMessage?: string
  includeResult?: boolean
  includeHashtags?: boolean
}

/**
 * 社交分享服务类
 */
export class SocialShareService {
  private static instance: SocialShareService

  static getInstance(): SocialShareService {
    if (!SocialShareService.instance) {
      SocialShareService.instance = new SocialShareService()
    }
    return SocialShareService.instance
  }

  /**
   * 分享计算结果
   */
  async shareCalculation(data: ShareData, options: ShareOptions): Promise<void> {
    try {
      const shareUrl = this.buildShareUrl(data, options)
      
      if (options.platform === 'copy') {
        await this.copyToClipboard(data, options)
        return
      }

      if (options.platform === 'email') {
        this.shareViaEmail(data, options)
        return
      }

      // 在新窗口中打开分享链接
      const popup = window.open(
        shareUrl,
        'share',
        'width=600,height=400,scrollbars=yes,resizable=yes'
      )

      // 检查弹窗是否被阻止
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        throw new Error('Popup wurde blockiert. Bitte erlauben Sie Popups für diese Seite.')
      }

      // 记录分享事件（用于分析）
      this.trackShareEvent(options.platform, data.calculatorType)

    } catch (error) {
      console.error('Share failed:', error)
      throw new Error(`Teilen fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    }
  }

  /**
   * 构建分享URL
   */
  private buildShareUrl(data: ShareData, options: ShareOptions): string {
    const message = this.buildShareMessage(data, options)
    const encodedUrl = encodeURIComponent(data.url)
    const encodedMessage = encodeURIComponent(message)

    switch (options.platform) {
      case 'twitter':
        const hashtags = options.includeHashtags && data.hashtags 
          ? data.hashtags.join(',') 
          : ''
        return `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}&hashtags=${hashtags}`

      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`

      case 'linkedin':
        const encodedTitle = encodeURIComponent(data.title)
        const encodedDescription = encodeURIComponent(data.description)
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`

      case 'whatsapp':
        const whatsappMessage = `${message} ${data.url}`
        return `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`

      case 'telegram':
        const telegramMessage = `${message} ${data.url}`
        return `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(message)}`

      default:
        throw new Error(`Unsupported platform: ${options.platform}`)
    }
  }

  /**
   * 构建分享消息
   */
  private buildShareMessage(data: ShareData, options: ShareOptions): string {
    if (options.customMessage) {
      return options.customMessage
    }

    let message = data.title

    if (options.includeResult && data.result) {
      const resultText = this.formatResultForShare(data.result, data.calculatorType)
      message += ` ${resultText}`
    }

    if (data.description) {
      message += ` - ${data.description}`
    }

    return message
  }

  /**
   * 格式化结果用于分享
   */
  private formatResultForShare(result: any, calculatorType?: string): string {
    switch (calculatorType) {
      case 'compound-interest':
      case 'savings-plan':
        if (result.finalAmount && result.years) {
          return `Nach ${result.years} Jahren: ${this.formatCurrency(result.finalAmount)}`
        }
        break

      case 'etf-savings-plan':
        if (result.finalValue && result.totalReturn) {
          const returnPercent = ((result.totalReturn / (result.finalValue - result.totalReturn)) * 100).toFixed(1)
          return `Rendite: ${returnPercent}% (${this.formatCurrency(result.finalValue)})`
        }
        break

      case 'loan':
      case 'mortgage':
        if (result.monthlyPayment) {
          return `Monatliche Rate: ${this.formatCurrency(result.monthlyPayment)}`
        }
        break

      default:
        if (result.finalAmount) {
          return `Ergebnis: ${this.formatCurrency(result.finalAmount)}`
        }
    }

    return ''
  }

  /**
   * 复制到剪贴板
   */
  private async copyToClipboard(data: ShareData, options: ShareOptions): Promise<void> {
    const message = this.buildShareMessage(data, options)
    const fullText = `${message}\n\n${data.url}`

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fullText)
      } else {
        // 回退方案
        const textArea = document.createElement('textarea')
        textArea.value = fullText
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }
    } catch (error) {
      throw new Error('Kopieren in die Zwischenablage fehlgeschlagen')
    }
  }

  /**
   * 通过邮件分享
   */
  private shareViaEmail(data: ShareData, options: ShareOptions): void {
    const subject = encodeURIComponent(data.title)
    const message = this.buildShareMessage(data, options)
    const body = encodeURIComponent(`${message}\n\n${data.url}\n\n---\nBerechnet mit dem kostenlosen Finanzrechner von zinses-rechner.de`)

    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`
    window.location.href = mailtoUrl
  }

  /**
   * 生成分享数据
   */
  generateShareData(calculatorType: string, result: any, inputParams: any): ShareData {
    const baseUrl = window.location.origin
    const calculatorUrl = `${baseUrl}${window.location.pathname}`

    const shareData: ShareData = {
      title: this.getShareTitle(calculatorType, result),
      description: this.getShareDescription(calculatorType, result),
      url: calculatorUrl,
      hashtags: this.getHashtags(calculatorType),
      calculatorType,
      result
    }

    return shareData
  }

  /**
   * 获取分享标题
   */
  private getShareTitle(calculatorType: string, result: any): string {
    const titles: Record<string, string> = {
      'compound-interest': 'Meine Zinseszins-Berechnung',
      'savings-plan': 'Mein Sparplan-Ergebnis',
      'etf-savings-plan': 'Meine ETF-Sparplan-Analyse',
      'loan': 'Meine Kredit-Berechnung',
      'mortgage': 'Meine Baufinanzierung',
      'retirement': 'Meine Altersvorsorge-Planung',
      'portfolio': 'Meine Portfolio-Analyse',
      'tax-optimization': 'Meine Steueroptimierung'
    }

    return titles[calculatorType] || 'Meine Finanz-Berechnung'
  }

  /**
   * 获取分享描述
   */
  private getShareDescription(calculatorType: string, result: any): string {
    const descriptions: Record<string, string> = {
      'compound-interest': 'Entdecke die Macht des Zinseszinseffekts mit diesem kostenlosen Rechner',
      'savings-plan': 'Plane deine Geldanlage mit deutschen Bankprodukten',
      'etf-savings-plan': 'Optimiere deine ETF-Strategie mit Steuervorteilen',
      'loan': 'Finde den besten Kredit für deine Bedürfnisse',
      'mortgage': 'Plane deine Immobilienfinanzierung optimal',
      'retirement': 'Sichere deine Altersvorsorge nach deutschem Recht',
      'portfolio': 'Analysiere dein Anlageportfolio professionell',
      'tax-optimization': 'Optimiere deine Steuerlast bei Kapitalanlagen'
    }

    return descriptions[calculatorType] || 'Kostenlose Finanzrechner für Deutschland'
  }

  /**
   * 获取相关标签
   */
  private getHashtags(calculatorType: string): string[] {
    const hashtagMap: Record<string, string[]> = {
      'compound-interest': ['Zinseszins', 'Sparen', 'Geldanlage', 'Vermögensaufbau'],
      'savings-plan': ['Sparplan', 'Sparen', 'Tagesgeld', 'Festgeld'],
      'etf-savings-plan': ['ETF', 'Sparplan', 'Investieren', 'Börse'],
      'loan': ['Kredit', 'Finanzierung', 'Darlehen'],
      'mortgage': ['Baufinanzierung', 'Immobilie', 'Hypothek'],
      'retirement': ['Altersvorsorge', 'Rente', 'Riester', 'Rürup'],
      'portfolio': ['Portfolio', 'Diversifikation', 'Risiko'],
      'tax-optimization': ['Steuern', 'Abgeltungssteuer', 'Freibetrag']
    }

    const baseHashtags = ['Finanzrechner', 'Deutschland', 'kostenlos']
    const specificHashtags = hashtagMap[calculatorType] || []

    return [...specificHashtags, ...baseHashtags]
  }

  /**
   * 记录分享事件
   */
  private trackShareEvent(platform: string, calculatorType?: string): void {
    // Google Analytics 4 事件
    if (typeof gtag !== 'undefined') {
      gtag('event', 'share', {
        method: platform,
        content_type: calculatorType || 'calculator',
        content_id: calculatorType
      })
    }

    // 自定义分析
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Calculation Shared', {
        platform,
        calculatorType,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * 格式化货币
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  /**
   * 检查分享支持
   */
  isShareSupported(platform: string): boolean {
    switch (platform) {
      case 'copy':
        return !!(navigator.clipboard || document.execCommand)
      case 'email':
        return true
      default:
        return true // 社交媒体平台通过URL分享，总是支持的
    }
  }

  /**
   * 获取平台显示名称
   */
  getPlatformDisplayName(platform: string): string {
    const names: Record<string, string> = {
      twitter: 'Twitter',
      facebook: 'Facebook',
      linkedin: 'LinkedIn',
      whatsapp: 'WhatsApp',
      telegram: 'Telegram',
      email: 'E-Mail',
      copy: 'Link kopieren'
    }

    return names[platform] || platform
  }

  /**
   * 获取平台图标
   */
  getPlatformIcon(platform: string): string {
    const icons: Record<string, string> = {
      twitter: '🐦',
      facebook: '📘',
      linkedin: '💼',
      whatsapp: '💬',
      telegram: '✈️',
      email: '📧',
      copy: '📋'
    }

    return icons[platform] || '🔗'
  }
}

// 导出单例实例
export const socialShareService = SocialShareService.getInstance()
