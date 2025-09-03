/**
 * TaxHelpService单元测试
 * 测试税收帮助信息服务的所有功能，包括帮助内容管理、搜索、上下文帮助、个性化推荐等
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TaxHelpService, HelpCategory, HelpContent, ContextualHelp } from '../TaxHelpService'
import { TaxSettings, DEFAULT_TAX_SETTINGS, GermanState, ChurchTaxType, ETFType } from '@/types/GermanTaxTypes'

// Mock console方法
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('TaxHelpService', () => {
  let service: TaxHelpService
  let defaultSettings: TaxSettings

  beforeEach(() => {
    // 清除所有mock调用记录
    vi.clearAllMocks()
    
    // 深拷贝默认设置
    defaultSettings = JSON.parse(JSON.stringify(DEFAULT_TAX_SETTINGS))
    
    // 重置单例实例
    ;(TaxHelpService as any).instance = null
    
    // 创建新的服务实例
    service = TaxHelpService.getInstance()
  })

  afterEach(() => {
    // 清理
    ;(TaxHelpService as any).instance = null
  })

  describe('单例模式', () => {
    it('应该返回同一个实例', () => {
      const instance1 = TaxHelpService.getInstance()
      const instance2 = TaxHelpService.getInstance()
      
      expect(instance1).toBe(instance2)
    })

    it('应该在初始化时记录日志', () => {
      expect(mockConsoleLog).toHaveBeenCalledWith('📚 税收帮助服务已初始化')
    })
  })

  describe('帮助内容管理', () => {
    it('应该获取指定ID的帮助内容', () => {
      const helpContent = service.getHelpContent('abgeltungssteuer-basics')
      
      expect(helpContent).toBeDefined()
      expect(helpContent?.id).toBe('abgeltungssteuer-basics')
      expect(helpContent?.category).toBe(HelpCategory.ABGELTUNGSSTEUER)
    })

    it('应该返回null当帮助内容不存在', () => {
      const helpContent = service.getHelpContent('non-existent-id')
      
      expect(helpContent).toBeNull()
    })

    it('应该按类别获取帮助内容', () => {
      const abgeltungssteuerHelp = service.getHelpByCategory(HelpCategory.ABGELTUNGSSTEUER)
      
      expect(abgeltungssteuerHelp).toBeInstanceOf(Array)
      expect(abgeltungssteuerHelp.length).toBeGreaterThan(0)
      expect(abgeltungssteuerHelp.every(item => item.category === HelpCategory.ABGELTUNGSSTEUER)).toBe(true)
    })

    it('应该按难度级别获取帮助内容', () => {
      const beginnerHelp = service.getHelpByDifficulty('beginner')
      
      expect(beginnerHelp).toBeInstanceOf(Array)
      expect(beginnerHelp.every(item => item.difficulty === 'beginner')).toBe(true)
    })

    it('应该获取所有帮助内容', () => {
      const allHelp = service.getAllHelpContent()
      
      expect(allHelp).toBeInstanceOf(Array)
      expect(allHelp.length).toBeGreaterThan(0)
      
      // 验证包含所有类别
      const categories = new Set(allHelp.map(item => item.category))
      expect(categories.has(HelpCategory.ABGELTUNGSSTEUER)).toBe(true)
      expect(categories.has(HelpCategory.FREISTELLUNGSAUFTRAG)).toBe(true)
      expect(categories.has(HelpCategory.ETF_TEILFREISTELLUNG)).toBe(true)
    })
  })

  describe('搜索功能', () => {
    it('应该按标题搜索帮助内容', () => {
      const results = service.searchHelp('Abgeltungssteuer')
      
      expect(results).toBeInstanceOf(Array)
      expect(results.length).toBeGreaterThan(0)
      expect(results.some(item => item.title.toLowerCase().includes('abgeltungssteuer'))).toBe(true)
    })

    it('应该按内容搜索帮助内容', () => {
      const results = service.searchHelp('25%')
      
      expect(results).toBeInstanceOf(Array)
      expect(results.length).toBeGreaterThan(0)
    })

    it('应该按标签搜索帮助内容', () => {
      const results = service.searchHelp('steuer')
      
      expect(results).toBeInstanceOf(Array)
      expect(results.length).toBeGreaterThan(0)
    })

    it('应该返回空数组当没有匹配结果', () => {
      const results = service.searchHelp('xyz123nonexistent')
      
      expect(results).toBeInstanceOf(Array)
      expect(results.length).toBe(0)
    })

    it('应该按相关性排序搜索结果', () => {
      const results = service.searchHelp('Abgeltungssteuer')
      
      if (results.length > 1) {
        // 标题匹配的应该排在前面
        const firstResult = results[0]
        expect(firstResult.title.toLowerCase().includes('abgeltungssteuer')).toBe(true)
      }
    })

    it('应该支持不区分大小写的搜索', () => {
      const upperCaseResults = service.searchHelp('ABGELTUNGSSTEUER')
      const lowerCaseResults = service.searchHelp('abgeltungssteuer')
      
      expect(upperCaseResults).toEqual(lowerCaseResults)
    })
  })

  describe('上下文帮助', () => {
    it('应该获取指定上下文的帮助', () => {
      const contextHelp = service.getContextualHelp('abgeltungssteuer-rate')
      
      expect(contextHelp).toBeDefined()
      expect(contextHelp?.context).toBe('abgeltungssteuer-rate')
      expect(contextHelp?.title).toBeDefined()
      expect(contextHelp?.content).toBeDefined()
    })

    it('应该返回null当上下文帮助不存在', () => {
      const contextHelp = service.getContextualHelp('non-existent-context')
      
      expect(contextHelp).toBeNull()
    })

    it('应该获取智能提示', () => {
      const tips = service.getSmartTips('freistellungsauftrag-amount', 1000)
      
      expect(tips).toBeInstanceOf(Array)
      expect(tips.length).toBeGreaterThan(0)
      expect(tips.some(tip => tip.includes('801€'))).toBe(true)
    })

    it('应该为超出免税额度的输入提供警告提示', () => {
      const tips = service.getSmartTips('freistellungsauftrag-amount', 1000)
      
      expect(tips.some(tip => tip.includes('⚠️'))).toBe(true)
    })

    it('应该为不同上下文提供不同的提示', () => {
      const abgeltungssteuerTips = service.getSmartTips('abgeltungssteuer-rate')
      const freistellungsauftragTips = service.getSmartTips('freistellungsauftrag-amount')
      
      expect(abgeltungssteuerTips).not.toEqual(freistellungsauftragTips)
    })
  })

  describe('个性化帮助', () => {
    it('应该基于用户设置推荐相关帮助', () => {
      const settingsWithAbgeltungssteuer = {
        ...defaultSettings,
        abgeltungssteuer: {
          ...defaultSettings.abgeltungssteuer,
          enabled: true
        }
      }

      const recommendations = service.getPersonalizedHelp(settingsWithAbgeltungssteuer)
      
      expect(recommendations).toBeInstanceOf(Array)
      expect(recommendations.some(item => item.category === HelpCategory.ABGELTUNGSSTEUER)).toBe(true)
    })

    it('应该为启用免税额度的用户推荐相关帮助', () => {
      const settingsWithFreistellungsauftrag = {
        ...defaultSettings,
        freistellungsauftrag: {
          ...defaultSettings.freistellungsauftrag,
          enabled: true
        }
      }

      const recommendations = service.getPersonalizedHelp(settingsWithFreistellungsauftrag)
      
      expect(recommendations.some(item => item.category === HelpCategory.FREISTELLUNGSAUFTRAG)).toBe(true)
    })

    it('应该为启用ETF免税的用户推荐相关帮助', () => {
      const settingsWithETF = {
        ...defaultSettings,
        etfTeilfreistellung: {
          ...defaultSettings.etfTeilfreistellung,
          enabled: true
        }
      }

      const recommendations = service.getPersonalizedHelp(settingsWithETF)
      
      expect(recommendations.some(item => item.category === HelpCategory.ETF_TEILFREISTELLUNG)).toBe(true)
    })

    it('应该为教会税用户推荐相关帮助', () => {
      const settingsWithChurchTax = {
        ...defaultSettings,
        userInfo: {
          ...defaultSettings.userInfo,
          churchTaxType: ChurchTaxType.CATHOLIC
        }
      }

      const recommendations = service.getPersonalizedHelp(settingsWithChurchTax)
      
      expect(recommendations.some(item => item.category === HelpCategory.CHURCH_TAX)).toBe(true)
    })

    it('应该限制推荐数量', () => {
      const settingsWithAllEnabled = {
        ...defaultSettings,
        abgeltungssteuer: { ...defaultSettings.abgeltungssteuer, enabled: true },
        freistellungsauftrag: { ...defaultSettings.freistellungsauftrag, enabled: true },
        etfTeilfreistellung: { ...defaultSettings.etfTeilfreistellung, enabled: true },
        userInfo: { ...defaultSettings.userInfo, churchTaxType: ChurchTaxType.CATHOLIC }
      }

      const recommendations = service.getPersonalizedHelp(settingsWithAllEnabled)
      
      expect(recommendations.length).toBeLessThanOrEqual(10) // 假设最多推荐10个
    })
  })

  describe('计算示例', () => {
    it('应该获取计算示例', () => {
      const example = service.getCalculationExample('basic-abgeltungssteuer')
      
      expect(example).toBeDefined()
      expect(example?.id).toBe('basic-abgeltungssteuer')
      expect(example?.inputs).toBeDefined()
      expect(example?.expectedResults).toBeDefined()
      expect(example?.explanation).toBeDefined()
    })

    it('应该按类别获取计算示例', () => {
      const examples = service.getCalculationExamplesByCategory(HelpCategory.ABGELTUNGSSTEUER)
      
      expect(examples).toBeInstanceOf(Array)
      expect(examples.every(example => example.category === HelpCategory.ABGELTUNGSSTEUER)).toBe(true)
    })

    it('应该返回null当计算示例不存在', () => {
      const example = service.getCalculationExample('non-existent-example')
      
      expect(example).toBeNull()
    })
  })

  describe('FAQ功能', () => {
    it('应该获取FAQ项目', () => {
      const faqItem = service.getFAQItem('what-is-abgeltungssteuer')
      
      expect(faqItem).toBeDefined()
      expect(faqItem?.id).toBe('what-is-abgeltungssteuer')
      expect(faqItem?.question).toBeDefined()
      expect(faqItem?.answer).toBeDefined()
    })

    it('应该按类别获取FAQ项目', () => {
      const faqItems = service.getFAQByCategory(HelpCategory.ABGELTUNGSSTEUER)
      
      expect(faqItems).toBeInstanceOf(Array)
      expect(faqItems.every(item => item.category === HelpCategory.ABGELTUNGSSTEUER)).toBe(true)
    })

    it('应该获取热门FAQ', () => {
      const popularFAQ = service.getPopularFAQ()
      
      expect(popularFAQ).toBeInstanceOf(Array)
      expect(popularFAQ.length).toBeGreaterThan(0)
      
      // 验证按热门程度排序
      if (popularFAQ.length > 1) {
        expect(popularFAQ[0].popularity).toBeGreaterThanOrEqual(popularFAQ[1].popularity)
      }
    })

    it('应该搜索FAQ', () => {
      const results = service.searchFAQ('Abgeltungssteuer')
      
      expect(results).toBeInstanceOf(Array)
      expect(results.some(item => 
        item.question.toLowerCase().includes('abgeltungssteuer') ||
        item.answer.toLowerCase().includes('abgeltungssteuer')
      )).toBe(true)
    })

    it('应该返回null当FAQ项目不存在', () => {
      const faqItem = service.getFAQItem('non-existent-faq')
      
      expect(faqItem).toBeNull()
    })
  })

  describe('帮助内容统计', () => {
    it('应该获取帮助内容统计信息', () => {
      const stats = service.getHelpStats()
      
      expect(stats).toBeDefined()
      expect(stats.totalContent).toBeGreaterThan(0)
      expect(stats.categoryCounts).toBeDefined()
      expect(stats.difficultyCounts).toBeDefined()
      expect(stats.averageReadingTime).toBeGreaterThan(0)
    })

    it('应该正确计算各类别的内容数量', () => {
      const stats = service.getHelpStats()
      const allContent = service.getAllHelpContent()
      
      const actualAbgeltungssteuerCount = allContent.filter(
        item => item.category === HelpCategory.ABGELTUNGSSTEUER
      ).length
      
      expect(stats.categoryCounts[HelpCategory.ABGELTUNGSSTEUER]).toBe(actualAbgeltungssteuerCount)
    })

    it('应该正确计算各难度级别的内容数量', () => {
      const stats = service.getHelpStats()
      const allContent = service.getAllHelpContent()
      
      const actualBeginnerCount = allContent.filter(
        item => item.difficulty === 'beginner'
      ).length
      
      expect(stats.difficultyCounts.beginner).toBe(actualBeginnerCount)
    })
  })

  describe('错误处理', () => {
    it('应该处理空搜索查询', () => {
      const results = service.searchHelp('')
      
      expect(results).toBeInstanceOf(Array)
      expect(results.length).toBe(0)
    })

    it('应该处理空白搜索查询', () => {
      const results = service.searchHelp('   ')
      
      expect(results).toBeInstanceOf(Array)
      expect(results.length).toBe(0)
    })

    it('应该处理特殊字符搜索', () => {
      const results = service.searchHelp('!@#$%^&*()')
      
      expect(results).toBeInstanceOf(Array)
      // 不应该抛出错误
    })
  })
})
