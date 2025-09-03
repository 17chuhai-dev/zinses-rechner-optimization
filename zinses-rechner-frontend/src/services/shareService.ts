/**
 * 社交分享服务
 * 支持多平台分享和打印功能
 */

import html2canvas from 'html2canvas'
import type { CalculationResult, CalculatorForm } from '@/types/calculator'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

// 全局变量声明
declare const gtag: (...args: any[]) => void

export interface ShareData {
  title: string
  text: string
  url: string
  hashtags?: string[]
}

export interface ShareImageOptions {
  width?: number
  height?: number
  quality?: number
  backgroundColor?: string
  includeWatermark?: boolean
}

export class ShareService {
  private static instance: ShareService

  public static getInstance(): ShareService {
    if (!ShareService.instance) {
      ShareService.instance = new ShareService()
    }
    return ShareService.instance
  }

  /**
   * 生成分享内容
   */
  generateShareContent(result: CalculationResult, form: CalculatorForm): ShareData {
    const finalAmount = formatCurrency(result.finalAmount || 0)
    const totalInterest = formatCurrency(result.totalInterest || 0)
    const returnRate = formatPercentage((((result.finalAmount || 0) - (result.totalContributions || 0)) / Math.max(result.totalContributions || 1, 1)) * 100)

    const title = 'Meine Zinseszins-Berechnung'
    const text = `🎯 Nach ${form.years} Jahren: ${finalAmount}\n💰 Zinserträge: ${totalInterest}\n📈 Rendite: ${returnRate}\n\nBerechnet mit dem kostenlosen Zinseszins-Rechner:`
    const url = window.location.origin
    const hashtags = ['Zinseszins', 'Geldanlage', 'Sparen', 'Finanzen']

    return { title, text, url, hashtags }
  }

  /**
   * LinkedIn分享
   */
  shareOnLinkedIn(shareData: ShareData): void {
    const linkedInUrl = new URL('https://www.linkedin.com/sharing/share-offsite/')
    linkedInUrl.searchParams.set('url', shareData.url)

    this.openShareWindow(linkedInUrl.toString(), 'LinkedIn')
  }

  /**
   * Twitter分享
   */
  shareOnTwitter(shareData: ShareData): void {
    const twitterUrl = new URL('https://twitter.com/intent/tweet')
    twitterUrl.searchParams.set('text', shareData.text)
    twitterUrl.searchParams.set('url', shareData.url)
    if (shareData.hashtags) {
      twitterUrl.searchParams.set('hashtags', shareData.hashtags.join(','))
    }

    this.openShareWindow(twitterUrl.toString(), 'Twitter')
  }

  /**
   * WhatsApp分享
   */
  shareOnWhatsApp(shareData: ShareData): void {
    const whatsappText = `${shareData.text}\n${shareData.url}`
    const whatsappUrl = new URL('https://wa.me/')
    whatsappUrl.searchParams.set('text', whatsappText)

    this.openShareWindow(whatsappUrl.toString(), 'WhatsApp')
  }

  /**
   * Facebook分享
   */
  shareOnFacebook(shareData: ShareData): void {
    const facebookUrl = new URL('https://www.facebook.com/sharer/sharer.php')
    facebookUrl.searchParams.set('u', shareData.url)
    facebookUrl.searchParams.set('quote', shareData.text)

    this.openShareWindow(facebookUrl.toString(), 'Facebook')
  }

  /**
   * 复制链接到剪贴板
   */
  async copyToClipboard(shareData: ShareData): Promise<boolean> {
    try {
      const textToCopy = `${shareData.text}\n${shareData.url}`

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy)
        return true
      } else {
        // 降级方案
        const textArea = document.createElement('textarea')
        textArea.value = textToCopy
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        const success = document.execCommand('copy')
        document.body.removeChild(textArea)
        return success
      }
    } catch (error) {
      console.error('复制到剪贴板失败:', error)
      return false
    }
  }

  /**
   * 生成分享图片
   */
  async generateShareImage(
    element: HTMLElement,
    options: ShareImageOptions = {}
  ): Promise<string> {
    const {
      width = 1200,
      height = 630,
      quality = 0.9,
      backgroundColor = '#ffffff',
      includeWatermark = true
    } = options

    try {
      const canvas = await html2canvas(element, {
        backgroundColor,
        scale: 2,
        useCORS: true,
        allowTaint: false,
        width,
        height,
        scrollX: 0,
        scrollY: 0
      })

      // 如果需要添加水印
      if (includeWatermark) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.font = '16px Inter, sans-serif'
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
          ctx.textAlign = 'right'
          ctx.fillText('zinses-rechner.de', canvas.width - 20, canvas.height - 20)
        }
      }

      return canvas.toDataURL('image/png', quality)
    } catch (error) {
      console.error('生成分享图片失败:', error)
      throw new Error('图片生成失败')
    }
  }

  /**
   * 下载分享图片
   */
  downloadShareImage(dataUrl: string, filename: string = 'zinseszins-berechnung.png'): void {
    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * 原生分享API（如果支持）
   */
  async nativeShare(shareData: ShareData): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url
        })
        return true
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('原生分享失败:', error)
        }
        return false
      }
    }
    return false
  }

  /**
   * 打印页面
   */
  printResults(): void {
    // 添加打印样式
    const printStyles = `
      <style>
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }

          /* 打印优化 */
          .chart-container {
            page-break-inside: avoid;
            max-height: 400px;
          }
          .results-table {
            page-break-inside: avoid;
          }
          .page-break {
            page-break-before: always;
          }
        }
      </style>
    `

    // 临时添加样式
    const styleElement = document.createElement('div')
    styleElement.innerHTML = printStyles
    document.head.appendChild(styleElement)

    // 执行打印
    window.print()

    // 清理样式
    setTimeout(() => {
      document.head.removeChild(styleElement)
    }, 1000)
  }

  /**
   * 获取分享统计
   */
  trackShare(platform: string, shareData: ShareData): void {
    // 发送分享统计到分析服务
    if (typeof gtag !== 'undefined') {
      gtag('event', 'share', {
        method: platform,
        content_type: 'calculation_result',
        content_id: `${shareData.title}_${Date.now()}`
      })
    }

    // 自定义统计
    console.log(`分享到 ${platform}:`, shareData.title)
  }

  /**
   * 打开分享窗口
   */
  private openShareWindow(url: string, platform: string): void {
    const width = 600
    const height = 400
    const left = (window.innerWidth - width) / 2
    const top = (window.innerHeight - height) / 2

    const features = `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`

    const shareWindow = window.open(url, `share_${platform}`, features)

    if (shareWindow) {
      shareWindow.focus()
    } else {
      // 如果弹窗被阻止，在当前窗口打开
      window.open(url, '_blank')
    }
  }

  /**
   * 检查分享功能支持
   */
  getShareCapabilities(): {
    nativeShare: boolean
    clipboard: boolean
    socialPlatforms: string[]
  } {
    return {
      nativeShare: !!navigator.share,
      clipboard: !!(navigator.clipboard && window.isSecureContext),
      socialPlatforms: ['linkedin', 'twitter', 'whatsapp', 'facebook']
    }
  }
}
