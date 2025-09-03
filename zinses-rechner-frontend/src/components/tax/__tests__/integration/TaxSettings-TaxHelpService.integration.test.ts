/**
 * TaxSettings与TaxHelpService集成测试
 * 验证组件与帮助服务的协作关系和帮助信息功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick, ref, onMounted, onUnmounted } from 'vue'
import { TaxHelpService } from '@/services/TaxHelpService'
import {
  TaxSettings as TaxSettingsType,
  DEFAULT_TAX_SETTINGS,
  GermanState,
  ChurchTaxType,
  HelpTopic,
  HelpContent,
  FAQ
} from '@/types/GermanTaxTypes'

// 创建简化的TaxSettings组件用于帮助服务集成测试
const TaxSettingsHelpTestComponent = {
  name: 'TaxSettingsHelpTest',
  template: `
    <div class="tax-settings-help-test" data-testid="tax-settings-help">
      <div class="help-panel" v-if="showHelp" data-testid="help-panel">
        <div class="help-header">
          <h3 data-testid="help-title">{{ helpTitle }}</h3>
          <button @click="closeHelp" data-testid="close-help">×</button>
        </div>

        <div class="help-search" data-testid="help-search">
          <input
            type="text"
            v-model="searchQuery"
            @input="handleSearch"
            placeholder="搜索帮助内容..."
            data-testid="search-input"
          />
          <button @click="performSearch" data-testid="search-button">搜索</button>
        </div>

        <div class="contextual-help" v-if="contextualHelp" data-testid="contextual-help">
          <h4>相关帮助</h4>
          <div class="help-content" v-html="contextualHelp.content"></div>
          <div class="help-links" v-if="contextualHelp.relatedLinks">
            <a
              v-for="link in contextualHelp.relatedLinks"
              :key="link.id"
              @click="loadHelpTopic(link.topic)"
              :data-testid="'help-link-' + link.id"
            >
              {{ link.title }}
            </a>
          </div>
        </div>

        <div class="search-results" v-if="searchResults.length > 0" data-testid="search-results">
          <h4>搜索结果</h4>
          <div
            v-for="result in searchResults"
            :key="result.id"
            class="search-result-item"
            :data-testid="'search-result-' + result.id"
          >
            <h5>{{ result.title }}</h5>
            <p>{{ result.excerpt }}</p>
            <button @click="loadHelpContent(result.id)">查看详情</button>
          </div>
        </div>

        <div class="faq-section" v-if="faqs.length > 0" data-testid="faq-section">
          <h4>常见问题</h4>
          <div
            v-for="faq in faqs"
            :key="faq.id"
            class="faq-item"
            :data-testid="'faq-' + faq.id"
          >
            <button
              @click="toggleFAQ(faq.id)"
              class="faq-question"
              :data-testid="'faq-question-' + faq.id"
            >
              {{ faq.question }}
            </button>
            <div
              v-if="expandedFAQs.includes(faq.id)"
              class="faq-answer"
              :data-testid="'faq-answer-' + faq.id"
            >
              {{ faq.answer }}
            </div>
          </div>
        </div>

        <div class="recommendations" v-if="recommendations.length > 0" data-testid="recommendations">
          <h4>推荐内容</h4>
          <div
            v-for="rec in recommendations"
            :key="rec.id"
            class="recommendation-item"
            :data-testid="'recommendation-' + rec.id"
          >
            <h5>{{ rec.title }}</h5>
            <p>{{ rec.description }}</p>
            <button @click="loadRecommendation(rec.id)">了解更多</button>
          </div>
        </div>
      </div>

      <div class="main-content">
        <div class="form-section">
          <label>联邦州选择</label>
          <select
            v-model="settings.userInfo.state"
            @change="handleStateChange"
            @focus="showContextualHelp('state-selection')"
            data-testid="state-select"
          >
            <option value="">请选择联邦州</option>
            <option value="NORDRHEIN_WESTFALEN">北莱茵-威斯特法伦州</option>
            <option value="BAYERN">巴伐利亚州</option>
            <option value="BADEN_WUERTTEMBERG">巴登-符腾堡州</option>
          </select>
          <button
            @click="requestHelp('state-selection')"
            class="help-trigger"
            data-testid="state-help-button"
          >
            ?
          </button>
        </div>

        <div class="form-section">
          <label>教会税设置</label>
          <input
            type="radio"
            id="church-none"
            value="NONE"
            v-model="settings.userInfo.churchTaxType"
            @focus="showContextualHelp('church-tax')"
            data-testid="church-none"
          />
          <label for="church-none">无教会税</label>

          <input
            type="radio"
            id="church-catholic"
            value="CATHOLIC"
            v-model="settings.userInfo.churchTaxType"
            @focus="showContextualHelp('church-tax')"
            data-testid="church-catholic"
          />
          <label for="church-catholic">天主教</label>
          <button
            @click="requestHelp('church-tax')"
            class="help-trigger"
            data-testid="church-help-button"
          >
            ?
          </button>
        </div>

        <div class="form-section">
          <label>免税额度设置</label>
          <input
            type="number"
            v-model.number="settings.freistellungsauftrag.annualAllowance"
            @focus="showContextualHelp('freistellungsauftrag')"
            data-testid="allowance-input"
          />
          <button
            @click="requestHelp('freistellungsauftrag')"
            class="help-trigger"
            data-testid="allowance-help-button"
          >
            ?
          </button>
        </div>

        <div class="actions">
          <button @click="toggleHelp" data-testid="toggle-help">
            {{ showHelp ? '隐藏帮助' : '显示帮助' }}
          </button>
          <button @click="loadFAQs" data-testid="load-faqs">加载FAQ</button>
          <button @click="getRecommendations" data-testid="get-recommendations">获取推荐</button>
        </div>
      </div>

      <div v-if="statusMessage" class="status-message" data-testid="status-message">
        {{ statusMessage }}
      </div>

      <div v-if="isLoading" class="loading-indicator" data-testid="loading-indicator">
        加载中...
      </div>
    </div>
  `,
  setup() {
    const helpService = TaxHelpService.getInstance()
    const settings = ref({ ...DEFAULT_TAX_SETTINGS })
    const showHelp = ref(false)
    const helpTitle = ref('税收帮助')
    const contextualHelp = ref(null)
    const searchQuery = ref('')
    const searchResults = ref([])
    const faqs = ref([])
    const recommendations = ref([])
    const expandedFAQs = ref([])
    const statusMessage = ref('')
    const isLoading = ref(false)

    // 组件挂载时初始化帮助服务
    onMounted(async () => {
      try {
        await helpService.initialize()
        statusMessage.value = '帮助服务已初始化'
      } catch (error) {
        statusMessage.value = '帮助服务初始化失败'
        console.error('帮助服务初始化失败:', error)
      }
    })

    // 监听帮助内容更新
    const unsubscribeHelpUpdate = helpService.onHelpContentUpdate('test-component', (content) => {
      contextualHelp.value = content
      statusMessage.value = '帮助内容已更新'
    })

    const unsubscribeSearchResults = helpService.onSearchResults('test-component', (results) => {
      searchResults.value = results
      statusMessage.value = `找到 ${results.length} 个搜索结果`
    })

    // 清理监听器
    onUnmounted(() => {
      unsubscribeHelpUpdate()
      unsubscribeSearchResults()
    })

    // 事件处理器
    const toggleHelp = () => {
      showHelp.value = !showHelp.value
      if (showHelp.value) {
        helpService.trackUserAction('help-panel-opened')
      }
    }

    const closeHelp = () => {
      showHelp.value = false
      helpService.trackUserAction('help-panel-closed')
    }

    const requestHelp = async (topic) => {
      isLoading.value = true
      try {
        const helpContent = await helpService.getHelpContent(topic)
        contextualHelp.value = helpContent
        showHelp.value = true
        helpTitle.value = helpContent.title || '帮助信息'
        statusMessage.value = '帮助内容已加载'
      } catch (error) {
        statusMessage.value = '加载帮助内容失败'
        console.error('加载帮助内容失败:', error)
      } finally {
        isLoading.value = false
      }
    }

    const showContextualHelp = async (context) => {
      try {
        const helpContent = await helpService.getContextualHelp(context, settings.value)
        contextualHelp.value = helpContent
        helpService.trackUserAction('contextual-help-shown', { context })
      } catch (error) {
        console.error('显示上下文帮助失败:', error)
      }
    }

    const handleSearch = () => {
      if (searchQuery.value.length > 2) {
        performSearch()
      }
    }

    const performSearch = async () => {
      if (!searchQuery.value.trim()) return

      isLoading.value = true
      try {
        const results = await helpService.searchHelp(searchQuery.value)
        searchResults.value = results
        helpService.trackUserAction('help-search', { query: searchQuery.value })
        statusMessage.value = `搜索完成，找到 ${results.length} 个结果`
      } catch (error) {
        statusMessage.value = '搜索失败'
        console.error('搜索失败:', error)
      } finally {
        isLoading.value = false
      }
    }

    const loadFAQs = async () => {
      isLoading.value = true
      try {
        const faqList = await helpService.getFAQs('tax-settings')
        faqs.value = faqList
        statusMessage.value = `加载了 ${faqList.length} 个常见问题`
      } catch (error) {
        statusMessage.value = '加载FAQ失败'
        console.error('加载FAQ失败:', error)
      } finally {
        isLoading.value = false
      }
    }

    const toggleFAQ = (faqId) => {
      const index = expandedFAQs.value.indexOf(faqId)
      if (index > -1) {
        expandedFAQs.value.splice(index, 1)
      } else {
        expandedFAQs.value.push(faqId)
      }
      helpService.trackUserAction('faq-toggled', { faqId })
    }

    const getRecommendations = async () => {
      isLoading.value = true
      try {
        const recs = await helpService.getPersonalizedRecommendations(settings.value)
        recommendations.value = recs
        statusMessage.value = `获得 ${recs.length} 个推荐内容`
      } catch (error) {
        statusMessage.value = '获取推荐失败'
        console.error('获取推荐失败:', error)
      } finally {
        isLoading.value = false
      }
    }

    const loadHelpTopic = async (topic) => {
      await requestHelp(topic)
    }

    const loadHelpContent = async (contentId) => {
      isLoading.value = true
      try {
        const content = await helpService.getHelpContentById(contentId)
        contextualHelp.value = content
        statusMessage.value = '详细内容已加载'
      } catch (error) {
        statusMessage.value = '加载详细内容失败'
        console.error('加载详细内容失败:', error)
      } finally {
        isLoading.value = false
      }
    }

    const loadRecommendation = async (recId) => {
      await loadHelpContent(recId)
    }

    const handleStateChange = () => {
      showContextualHelp('state-selection')
    }

    return {
      settings,
      showHelp,
      helpTitle,
      contextualHelp,
      searchQuery,
      searchResults,
      faqs,
      recommendations,
      expandedFAQs,
      statusMessage,
      isLoading,
      toggleHelp,
      closeHelp,
      requestHelp,
      showContextualHelp,
      handleSearch,
      performSearch,
      loadFAQs,
      toggleFAQ,
      getRecommendations,
      loadHelpTopic,
      loadHelpContent,
      loadRecommendation,
      handleStateChange
    }
  }
}

describe('TaxSettings与TaxHelpService集成测试', () => {
  let wrapper: VueWrapper<any>
  let helpService: TaxHelpService

  beforeEach(() => {
    // 重置单例实例
    ;(TaxHelpService as any).instance = null
    helpService = TaxHelpService.getInstance()

    // 清除所有mock调用记录
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    // 清理单例实例
    ;(TaxHelpService as any).instance = null
  })

  describe('帮助服务初始化集成', () => {
    it('应该在组件挂载时正确初始化帮助服务', async () => {
      const initializeSpy = vi.spyOn(helpService, 'initialize').mockResolvedValue(undefined)

      wrapper = mount(TaxSettingsHelpTestComponent)
      await nextTick()

      // 验证帮助服务被初始化
      expect(initializeSpy).toHaveBeenCalled()
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('帮助服务已初始化')
    })

    it('应该正确注册帮助内容更新监听器', async () => {
      const onHelpContentUpdateSpy = vi.spyOn(helpService, 'onHelpContentUpdate')

      wrapper = mount(TaxSettingsHelpTestComponent)
      await nextTick()

      // 验证监听器被注册
      expect(onHelpContentUpdateSpy).toHaveBeenCalledWith('test-component', expect.any(Function))
    })

    it('应该在初始化失败时显示错误信息', async () => {
      const initializeSpy = vi.spyOn(helpService, 'initialize').mockRejectedValue(new Error('初始化失败'))

      wrapper = mount(TaxSettingsHelpTestComponent)
      await nextTick()

      // 验证错误信息显示
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('帮助服务初始化失败')
    })
  })

  describe('上下文相关帮助集成测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxSettingsHelpTestComponent)
      await nextTick()
    })

    it('应该在用户聚焦联邦州选择时显示相关帮助', async () => {
      const getContextualHelpSpy = vi.spyOn(helpService, 'getContextualHelp').mockResolvedValue({
        id: 'state-help',
        title: '联邦州选择帮助',
        content: '请选择您居住的联邦州，这将影响教会税税率的计算。',
        relatedLinks: [
          { id: 'church-tax-link', title: '教会税说明', topic: 'church-tax' }
        ]
      })

      const stateSelect = wrapper.find('[data-testid="state-select"]')
      await stateSelect.trigger('focus')
      await nextTick()

      // 验证上下文帮助被请求
      expect(getContextualHelpSpy).toHaveBeenCalledWith('state-selection', expect.any(Object))
    })

    it('应该在用户点击帮助按钮时加载帮助内容', async () => {
      const getHelpContentSpy = vi.spyOn(helpService, 'getHelpContent').mockResolvedValue({
        id: 'state-help',
        title: '联邦州选择指南',
        content: '详细的联邦州选择说明...',
        relatedLinks: []
      })

      const helpButton = wrapper.find('[data-testid="state-help-button"]')
      await helpButton.trigger('click')
      await nextTick()

      // 验证帮助内容被加载
      expect(getHelpContentSpy).toHaveBeenCalledWith('state-selection')
      expect(wrapper.find('[data-testid="help-panel"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="help-title"]').text()).toBe('联邦州选择指南')
    })

    it('应该正确显示上下文相关的帮助链接', async () => {
      const mockHelpContent = {
        id: 'church-tax-help',
        title: '教会税说明',
        content: '教会税是德国的一种宗教税...',
        relatedLinks: [
          { id: 'link1', title: '税率计算', topic: 'tax-calculation' },
          { id: 'link2', title: '免税条件', topic: 'tax-exemption' }
        ]
      }

      vi.spyOn(helpService, 'getHelpContent').mockResolvedValue(mockHelpContent)

      const helpButton = wrapper.find('[data-testid="church-help-button"]')
      await helpButton.trigger('click')
      await nextTick()

      // 验证相关链接显示
      expect(wrapper.find('[data-testid="help-link-link1"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="help-link-link2"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="help-link-link1"]').text()).toBe('税率计算')
    })
  })

  describe('搜索功能集成测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxSettingsHelpTestComponent)
      await nextTick()

      // 显示帮助面板
      await wrapper.find('[data-testid="toggle-help"]').trigger('click')
      await nextTick()
    })

    it('应该在用户输入搜索词时触发搜索', async () => {
      const searchHelpSpy = vi.spyOn(helpService, 'searchHelp').mockResolvedValue([
        {
          id: 'result1',
          title: '教会税计算',
          excerpt: '教会税的计算方法和税率...',
          relevance: 0.9
        }
      ])

      const searchInput = wrapper.find('[data-testid="search-input"]')
      await searchInput.setValue('教会税')
      await searchInput.trigger('input')
      await nextTick()

      // 验证搜索被触发
      expect(searchHelpSpy).toHaveBeenCalledWith('教会税')
    })

    it('应该正确显示搜索结果', async () => {
      const mockSearchResults = [
        {
          id: 'result1',
          title: '教会税基础知识',
          excerpt: '教会税是德国特有的税种...',
          relevance: 0.95
        },
        {
          id: 'result2',
          title: '免税额度设置',
          excerpt: '如何正确设置免税额度...',
          relevance: 0.85
        }
      ]

      vi.spyOn(helpService, 'searchHelp').mockResolvedValue(mockSearchResults)

      const searchButton = wrapper.find('[data-testid="search-button"]')
      await wrapper.find('[data-testid="search-input"]').setValue('税收')
      await searchButton.trigger('click')
      await nextTick()

      // 验证搜索结果显示
      expect(wrapper.find('[data-testid="search-results"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="search-result-result1"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="search-result-result2"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('找到 2 个搜索结果')
    })

    it('应该在搜索失败时显示错误信息', async () => {
      vi.spyOn(helpService, 'searchHelp').mockRejectedValue(new Error('搜索服务不可用'))

      const searchButton = wrapper.find('[data-testid="search-button"]')
      await wrapper.find('[data-testid="search-input"]').setValue('测试')
      await searchButton.trigger('click')
      await nextTick()

      // 验证错误信息显示
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('搜索失败')
    })
  })

  describe('FAQ功能集成测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxSettingsHelpTestComponent)
      await nextTick()

      // 显示帮助面板
      await wrapper.find('[data-testid="toggle-help"]').trigger('click')
      await nextTick()
    })

    it('应该正确加载和显示FAQ列表', async () => {
      const mockFAQs = [
        {
          id: 'faq1',
          question: '什么是教会税？',
          answer: '教会税是德国对宗教团体成员征收的税种...',
          category: 'church-tax',
          priority: 1
        },
        {
          id: 'faq2',
          question: '如何设置免税额度？',
          answer: '免税额度可以通过Freistellungsauftrag设置...',
          category: 'freistellungsauftrag',
          priority: 2
        }
      ]

      vi.spyOn(helpService, 'getFAQs').mockResolvedValue(mockFAQs)

      const loadFAQsButton = wrapper.find('[data-testid="load-faqs"]')
      await loadFAQsButton.trigger('click')
      await nextTick()

      // 验证FAQ显示
      expect(wrapper.find('[data-testid="faq-section"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="faq-faq1"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="faq-faq2"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('加载了 2 个常见问题')
    })

    it('应该支持FAQ的展开和折叠', async () => {
      const mockFAQs = [
        {
          id: 'faq1',
          question: '什么是资本利得税？',
          answer: '资本利得税是对投资收益征收的税种...',
          category: 'abgeltungssteuer',
          priority: 1
        }
      ]

      vi.spyOn(helpService, 'getFAQs').mockResolvedValue(mockFAQs)
      const trackUserActionSpy = vi.spyOn(helpService, 'trackUserAction')

      await wrapper.find('[data-testid="load-faqs"]').trigger('click')
      await nextTick()

      // 点击FAQ问题展开答案
      const faqQuestion = wrapper.find('[data-testid="faq-question-faq1"]')
      await faqQuestion.trigger('click')
      await nextTick()

      // 验证答案显示
      expect(wrapper.find('[data-testid="faq-answer-faq1"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="faq-answer-faq1"]').text()).toContain('资本利得税是对投资收益征收的税种')
      expect(trackUserActionSpy).toHaveBeenCalledWith('faq-toggled', { faqId: 'faq1' })

      // 再次点击折叠答案
      await faqQuestion.trigger('click')
      await nextTick()

      // 验证答案隐藏
      expect(wrapper.find('[data-testid="faq-answer-faq1"]').exists()).toBe(false)
    })
  })

  describe('个性化推荐集成测试', () => {
    beforeEach(async () => {
      wrapper = mount(TaxSettingsHelpTestComponent)
      await nextTick()

      // 显示帮助面板
      await wrapper.find('[data-testid="toggle-help"]').trigger('click')
      await nextTick()
    })

    it('应该基于用户设置获取个性化推荐', async () => {
      const mockRecommendations = [
        {
          id: 'rec1',
          title: '巴伐利亚州教会税指南',
          description: '针对巴伐利亚州居民的教会税计算说明',
          relevance: 0.9,
          reason: '基于您选择的联邦州'
        },
        {
          id: 'rec2',
          title: '免税额度优化建议',
          description: '如何最大化利用免税额度',
          relevance: 0.8,
          reason: '基于您的投资金额'
        }
      ]

      vi.spyOn(helpService, 'getPersonalizedRecommendations').mockResolvedValue(mockRecommendations)

      // 先设置一些用户偏好
      await wrapper.find('[data-testid="state-select"]').setValue('BAYERN')
      await nextTick()

      const getRecommendationsButton = wrapper.find('[data-testid="get-recommendations"]')
      await getRecommendationsButton.trigger('click')
      await nextTick()

      // 验证推荐内容显示
      expect(wrapper.find('[data-testid="recommendations"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="recommendation-rec1"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="recommendation-rec2"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('获得 2 个推荐内容')
    })

    it('应该在获取推荐失败时显示错误信息', async () => {
      vi.spyOn(helpService, 'getPersonalizedRecommendations').mockRejectedValue(new Error('推荐服务不可用'))

      const getRecommendationsButton = wrapper.find('[data-testid="get-recommendations"]')
      await getRecommendationsButton.trigger('click')
      await nextTick()

      // 验证错误信息显示
      expect(wrapper.find('[data-testid="status-message"]').text()).toContain('获取推荐失败')
    })
  })
})
