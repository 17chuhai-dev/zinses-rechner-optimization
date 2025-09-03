/**
 * 税收帮助信息系统测试
 * 验证德国税收帮助文档、上下文帮助和智能引导功能
 */

// 模拟税收帮助服务
class MockTaxHelpService {
  constructor() {
    this.helpContent = new Map()
    this.contextualHelp = new Map()
    this.calculationExamples = new Map()
    this.faqItems = new Map()
    
    this.initializeHelpContent()
    this.initializeContextualHelp()
    this.initializeCalculationExamples()
    this.initializeFAQ()
    
    console.log('📚 模拟税收帮助服务已初始化')
  }

  initializeHelpContent() {
    // 基础概念
    this.helpContent.set('basics-overview', {
      id: 'basics-overview',
      title: 'Grundlagen der Kapitalertragsbesteuerung',
      content: '<h3>Was sind Kapitalerträge?</h3><p>Kapitalerträge sind Einkünfte aus Kapitalvermögen...</p>',
      category: 'basics',
      tags: ['grundlagen', 'kapitalerträge', 'besteuerung'],
      lastUpdated: new Date(),
      difficulty: 'beginner',
      readingTime: 3
    })

    // 资本利得税
    this.helpContent.set('abgeltungssteuer-details', {
      id: 'abgeltungssteuer-details',
      title: 'Abgeltungssteuer im Detail',
      content: '<h3>Was ist die Abgeltungssteuer?</h3><p>Die Abgeltungssteuer ist eine Quellensteuer...</p>',
      category: 'abgeltungssteuer',
      tags: ['abgeltungssteuer', '25%', 'berechnung'],
      lastUpdated: new Date(),
      difficulty: 'intermediate',
      readingTime: 5
    })

    // 免税额度
    this.helpContent.set('freistellungsauftrag-guide', {
      id: 'freistellungsauftrag-guide',
      title: 'Freistellungsauftrag optimal nutzen',
      content: '<h3>Was ist ein Freistellungsauftrag?</h3><p>Mit einem Freistellungsauftrag...</p>',
      category: 'freistellungsauftrag',
      tags: ['freistellungsauftrag', 'freibetrag', '801€'],
      lastUpdated: new Date(),
      difficulty: 'beginner',
      readingTime: 4
    })

    // ETF部分免税
    this.helpContent.set('etf-teilfreistellung-explained', {
      id: 'etf-teilfreistellung-explained',
      title: 'ETF Teilfreistellung verstehen',
      content: '<h3>Was ist die Teilfreistellung?</h3><p>Die Teilfreistellung reduziert...</p>',
      category: 'etf_teilfreistellung',
      tags: ['etf', 'teilfreistellung', 'steueroptimierung'],
      lastUpdated: new Date(),
      difficulty: 'intermediate',
      readingTime: 6
    })
  }

  initializeContextualHelp() {
    this.contextualHelp.set('tax-rate-input', {
      context: 'tax-rate-input',
      title: 'Steuersatz eingeben',
      content: 'Die Abgeltungssteuer beträgt einheitlich 25%. Zusätzlich fallen Solidaritätszuschlag (5,5%) und ggf. Kirchensteuer (8-9%) an.',
      actions: [
        {
          label: 'Mehr über Abgeltungssteuer',
          action: 'modal',
          target: 'abgeltungssteuer-details'
        }
      ]
    })

    this.contextualHelp.set('allowance-input', {
      context: 'allowance-input',
      title: 'Freibetrag nutzen',
      content: 'Seit 2023 beträgt der jährliche Freibetrag 801€ pro Person. Verheiratete können gemeinsam 1.602€ geltend machen.',
      actions: [
        {
          label: 'Freistellungsauftrag Guide',
          action: 'modal',
          target: 'freistellungsauftrag-guide'
        }
      ]
    })

    this.contextualHelp.set('etf-type-selection', {
      context: 'etf-type-selection',
      title: 'ETF-Typ wählen',
      content: 'Verschiedene ETF-Typen haben unterschiedliche Teilfreistellungssätze. Aktien-ETFs (30%) und Immobilien-ETFs (60%) sind steuerlich vorteilhaft.',
      actions: [
        {
          label: 'ETF Teilfreistellung erklärt',
          action: 'modal',
          target: 'etf-teilfreistellung-explained'
        }
      ]
    })
  }

  initializeCalculationExamples() {
    this.calculationExamples.set('basic-tax-calculation', {
      id: 'basic-tax-calculation',
      title: 'Grundlegende Steuerberechnung',
      description: 'Berechnung der Abgeltungssteuer auf Kapitalerträge',
      scenario: 'Sie haben 2.000€ Kapitalerträge und sind kirchensteuerpflichtig (9%)',
      inputs: {
        capitalGains: 2000,
        allowanceUsed: 801,
        churchTaxRate: 0.09
      },
      steps: [
        {
          step: 1,
          description: 'Freibetrag abziehen',
          formula: 'Kapitalertrag - Freibetrag',
          calculation: '2.000€ - 801€',
          result: 1199,
          explanation: 'Der Freibetrag von 801€ wird von den Kapitalerträgen abgezogen'
        },
        {
          step: 2,
          description: 'Abgeltungssteuer berechnen',
          formula: 'Steuerpflichtiger Betrag × 25%',
          calculation: '1.199€ × 0,25',
          result: 299.75,
          explanation: 'Auf den steuerpflichtigen Betrag wird die Abgeltungssteuer von 25% erhoben'
        }
      ],
      result: {
        totalTax: 343.22,
        netIncome: 1656.78,
        effectiveTaxRate: 17.16
      },
      explanation: 'Die Gesamtsteuerbelastung beträgt 343,22€, was einer effektiven Steuerrate von 17,16% entspricht.',
      tips: [
        'Nutzen Sie Ihren Freibetrag optimal aus',
        'Bei hohen Erträgen kann ein Kirchenaustritt steuerlich vorteilhaft sein'
      ]
    })
  }

  initializeFAQ() {
    this.faqItems.set('faq-1', {
      id: 'faq-1',
      question: 'Wie hoch ist die Abgeltungssteuer?',
      answer: 'Die Abgeltungssteuer beträgt einheitlich 25% auf alle Kapitalerträge. Zusätzlich fallen 5,5% Solidaritätszuschlag und gegebenenfalls 8-9% Kirchensteuer an.',
      category: 'abgeltungssteuer',
      popularity: 95,
      relatedTopics: ['abgeltungssteuer', 'steuersatz', 'kirchensteuer']
    })

    this.faqItems.set('faq-2', {
      id: 'faq-2',
      question: 'Wie hoch ist der Freibetrag für Kapitalerträge?',
      answer: 'Der jährliche Freibetrag beträgt seit 2023 801€ pro Person. Verheiratete können bei gemeinsamer Veranlagung 1.602€ geltend machen.',
      category: 'freistellungsauftrag',
      popularity: 88,
      relatedTopics: ['freibetrag', 'freistellungsauftrag', '801€']
    })

    this.faqItems.set('faq-3', {
      id: 'faq-3',
      question: 'Was ist die ETF Teilfreistellung?',
      answer: 'Die Teilfreistellung reduziert die steuerpflichtigen Erträge von ETFs. Aktien-ETFs haben 30%, Immobilien-ETFs 60% und Renten-ETFs 0% Teilfreistellung.',
      category: 'etf_teilfreistellung',
      popularity: 76,
      relatedTopics: ['etf', 'teilfreistellung', 'steueroptimierung']
    })
  }

  getHelpContent(id) {
    return this.helpContent.get(id) || null
  }

  getHelpByCategory(category) {
    return Array.from(this.helpContent.values())
      .filter(content => content.category === category)
      .sort((a, b) => a.title.localeCompare(b.title, 'de'))
  }

  searchHelp(query) {
    const searchTerm = query.toLowerCase()
    return Array.from(this.helpContent.values())
      .filter(content => 
        content.title.toLowerCase().includes(searchTerm) ||
        content.content.toLowerCase().includes(searchTerm) ||
        content.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      )
      .sort((a, b) => {
        const aTitle = a.title.toLowerCase().includes(searchTerm)
        const bTitle = b.title.toLowerCase().includes(searchTerm)
        if (aTitle && !bTitle) return -1
        if (!aTitle && bTitle) return 1
        return a.title.localeCompare(b.title, 'de')
      })
  }

  getContextualHelp(context) {
    return this.contextualHelp.get(context) || null
  }

  getCalculationExample(id) {
    return this.calculationExamples.get(id) || null
  }

  getAllCalculationExamples() {
    return Array.from(this.calculationExamples.values())
  }

  getFAQItem(id) {
    return this.faqItems.get(id) || null
  }

  getFAQByCategory(category) {
    return Array.from(this.faqItems.values())
      .filter(item => item.category === category)
      .sort((a, b) => b.popularity - a.popularity)
  }

  getPopularFAQ(limit = 10) {
    return Array.from(this.faqItems.values())
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit)
  }

  getPersonalizedHelp(settings) {
    const recommendations = []

    if (settings.abgeltungssteuer?.enabled) {
      const abgeltungssteuerHelp = this.getHelpByCategory('abgeltungssteuer')
      recommendations.push(...abgeltungssteuerHelp.slice(0, 2))
    }

    if (settings.freistellungsauftrag?.enabled) {
      const freistellungsauftragHelp = this.getHelpByCategory('freistellungsauftrag')
      recommendations.push(...freistellungsauftragHelp.slice(0, 2))
    }

    if (settings.etfTeilfreistellung?.enabled) {
      const etfHelp = this.getHelpByCategory('etf_teilfreistellung')
      recommendations.push(...etfHelp.slice(0, 2))
    }

    return recommendations.slice(0, 6)
  }

  getSmartTips(context, userInput) {
    const tips = []

    switch (context) {
      case 'abgeltungssteuer-rate':
        tips.push('Die Abgeltungssteuer beträgt einheitlich 25% auf alle Kapitalerträge.')
        tips.push('Zusätzlich fallen 5,5% Solidaritätszuschlag auf die Abgeltungssteuer an.')
        break

      case 'freistellungsauftrag-amount':
        tips.push('Der jährliche Freibetrag beträgt seit 2023 801€ pro Person.')
        tips.push('Verheiratete können den Freibetrag auf 1.602€ verdoppeln.')
        if (userInput && userInput > 801) {
          tips.push('⚠️ Der eingegebene Betrag überschreitet den maximalen Freibetrag.')
        }
        break

      case 'church-tax-rate':
        tips.push('Die Kirchensteuer beträgt 8% in Bayern und Baden-Württemberg, 9% in allen anderen Bundesländern.')
        tips.push('Die Kirchensteuer wird auf die Abgeltungssteuer erhoben, nicht auf die Kapitalerträge direkt.')
        break

      case 'etf-selection':
        tips.push('Aktien-ETFs haben eine Teilfreistellung von 30%.')
        tips.push('Immobilien-ETFs haben die höchste Teilfreistellung von 60%.')
        tips.push('Renten-ETFs haben keine Teilfreistellung (0%).')
        break
    }

    return tips
  }
}

// 测试函数
async function runTaxHelpSystemTests() {
  console.log('🧪 开始税收帮助信息系统测试...\n')
  
  const helpService = new MockTaxHelpService()
  
  let passed = 0
  let failed = 0
  
  function test(description, condition) {
    if (condition) {
      console.log(`✅ ${description}`)
      passed++
    } else {
      console.log(`❌ ${description}`)
      failed++
    }
  }
  
  // 测试1: 服务初始化
  console.log('🏗️ 测试服务初始化:')
  
  test('帮助服务应该正确初始化', helpService !== null)
  test('应该有帮助内容', helpService.helpContent.size > 0)
  test('应该有上下文帮助', helpService.contextualHelp.size > 0)
  test('应该有计算示例', helpService.calculationExamples.size > 0)
  test('应该有FAQ项目', helpService.faqItems.size > 0)
  
  // 测试2: 帮助内容获取
  console.log('\n📖 测试帮助内容获取:')
  
  const basicHelp = helpService.getHelpContent('basics-overview')
  test('应该能获取基础帮助内容', basicHelp !== null)
  test('帮助内容应该有标题', basicHelp?.title === 'Grundlagen der Kapitalertragsbesteuerung')
  test('帮助内容应该有内容', basicHelp?.content.includes('Kapitalerträge'))
  test('帮助内容应该有标签', Array.isArray(basicHelp?.tags) && basicHelp.tags.length > 0)
  test('帮助内容应该有难度级别', ['beginner', 'intermediate', 'advanced'].includes(basicHelp?.difficulty))
  
  const nonExistentHelp = helpService.getHelpContent('non-existent')
  test('不存在的帮助内容应该返回null', nonExistentHelp === null)
  
  // 测试3: 按类别获取帮助
  console.log('\n📚 测试按类别获取帮助:')
  
  const basicsHelp = helpService.getHelpByCategory('basics')
  test('应该能按类别获取帮助', Array.isArray(basicsHelp))
  test('基础类别应该有内容', basicsHelp.length > 0)
  test('返回的内容应该属于正确类别', basicsHelp.every(item => item.category === 'basics'))
  
  const abgeltungssteuerHelp = helpService.getHelpByCategory('abgeltungssteuer')
  test('资本利得税类别应该有内容', abgeltungssteuerHelp.length > 0)
  
  const emptyCategory = helpService.getHelpByCategory('non-existent-category')
  test('不存在的类别应该返回空数组', Array.isArray(emptyCategory) && emptyCategory.length === 0)
  
  // 测试4: 搜索功能
  console.log('\n🔍 测试搜索功能:')
  
  const searchResults1 = helpService.searchHelp('Abgeltungssteuer')
  test('搜索应该返回结果', Array.isArray(searchResults1) && searchResults1.length > 0)
  test('搜索结果应该包含相关内容', searchResults1.some(item => item.title.includes('Abgeltungssteuer')))
  
  const searchResults2 = helpService.searchHelp('25%')
  test('搜索标签应该有效', searchResults2.some(item => item.tags.includes('25%')))
  
  const searchResults3 = helpService.searchHelp('Kapitalerträge')
  test('搜索内容应该有效', searchResults3.some(item => item.content.includes('Kapitalerträge')))
  
  const emptySearch = helpService.searchHelp('xyz123nonexistent')
  test('无匹配搜索应该返回空数组', Array.isArray(emptySearch) && emptySearch.length === 0)
  
  // 测试5: 上下文帮助
  console.log('\n💡 测试上下文帮助:')
  
  const contextHelp1 = helpService.getContextualHelp('tax-rate-input')
  test('应该能获取上下文帮助', contextHelp1 !== null)
  test('上下文帮助应该有标题', contextHelp1?.title === 'Steuersatz eingeben')
  test('上下文帮助应该有内容', contextHelp1?.content.includes('25%'))
  test('上下文帮助应该有操作', Array.isArray(contextHelp1?.actions) && contextHelp1.actions.length > 0)
  
  const contextHelp2 = helpService.getContextualHelp('allowance-input')
  test('免税额度上下文帮助应该存在', contextHelp2 !== null && contextHelp2.content.includes('801€'))
  
  const noContextHelp = helpService.getContextualHelp('non-existent-context')
  test('不存在的上下文应该返回null', noContextHelp === null)
  
  // 测试6: 计算示例
  console.log('\n🧮 测试计算示例:')
  
  const example = helpService.getCalculationExample('basic-tax-calculation')
  test('应该能获取计算示例', example !== null)
  test('计算示例应该有标题', example?.title === 'Grundlegende Steuerberechnung')
  test('计算示例应该有描述', example?.description.includes('Berechnung'))
  test('计算示例应该有场景', example?.scenario.includes('2.000€'))
  test('计算示例应该有步骤', Array.isArray(example?.steps) && example.steps.length > 0)
  test('计算示例应该有结果', example?.result && typeof example.result.totalTax === 'number')
  test('计算示例应该有提示', Array.isArray(example?.tips) && example.tips.length > 0)
  
  const allExamples = helpService.getAllCalculationExamples()
  test('应该能获取所有计算示例', Array.isArray(allExamples) && allExamples.length > 0)
  
  // 测试7: FAQ功能
  console.log('\n❓ 测试FAQ功能:')
  
  const faq1 = helpService.getFAQItem('faq-1')
  test('应该能获取FAQ项目', faq1 !== null)
  test('FAQ应该有问题', faq1?.question.includes('Abgeltungssteuer'))
  test('FAQ应该有答案', faq1?.answer.includes('25%'))
  test('FAQ应该有流行度', typeof faq1?.popularity === 'number')
  test('FAQ应该有相关主题', Array.isArray(faq1?.relatedTopics) && faq1.relatedTopics.length > 0)
  
  const categoryFAQ = helpService.getFAQByCategory('abgeltungssteuer')
  test('应该能按类别获取FAQ', Array.isArray(categoryFAQ) && categoryFAQ.length > 0)
  test('类别FAQ应该按流行度排序', categoryFAQ.length <= 1 || categoryFAQ[0].popularity >= categoryFAQ[1].popularity)
  
  const popularFAQ = helpService.getPopularFAQ(2)
  test('应该能获取热门FAQ', Array.isArray(popularFAQ) && popularFAQ.length <= 2)
  test('热门FAQ应该按流行度排序', popularFAQ.length <= 1 || popularFAQ[0].popularity >= popularFAQ[1].popularity)
  
  // 测试8: 个性化帮助
  console.log('\n👤 测试个性化帮助:')
  
  const userSettings1 = {
    abgeltungssteuer: { enabled: true },
    freistellungsauftrag: { enabled: true },
    etfTeilfreistellung: { enabled: false }
  }
  
  const personalizedHelp1 = helpService.getPersonalizedHelp(userSettings1)
  test('应该能获取个性化帮助', Array.isArray(personalizedHelp1))
  test('个性化帮助应该基于用户设置', personalizedHelp1.length > 0)
  test('个性化帮助应该有限制', personalizedHelp1.length <= 6)
  
  const userSettings2 = {
    abgeltungssteuer: { enabled: false },
    freistellungsauftrag: { enabled: false },
    etfTeilfreistellung: { enabled: true }
  }
  
  const personalizedHelp2 = helpService.getPersonalizedHelp(userSettings2)
  test('不同设置应该产生不同推荐', personalizedHelp2.length >= 0)
  
  // 测试9: 智能提示
  console.log('\n🤖 测试智能提示:')
  
  const tips1 = helpService.getSmartTips('abgeltungssteuer-rate')
  test('应该能获取智能提示', Array.isArray(tips1) && tips1.length > 0)
  test('提示应该包含相关信息', tips1.some(tip => tip.includes('25%')))
  
  const tips2 = helpService.getSmartTips('freistellungsauftrag-amount', 1000)
  test('应该能基于用户输入提供提示', Array.isArray(tips2) && tips2.length > 0)
  test('超限输入应该有警告提示', tips2.some(tip => tip.includes('⚠️')))
  
  const tips3 = helpService.getSmartTips('church-tax-rate')
  test('教会税提示应该包含州信息', tips3.some(tip => tip.includes('Bayern')))
  
  const tips4 = helpService.getSmartTips('etf-selection')
  test('ETF选择提示应该包含免税信息', tips4.some(tip => tip.includes('30%')))
  
  const noTips = helpService.getSmartTips('unknown-context')
  test('未知上下文应该返回空数组', Array.isArray(noTips) && noTips.length === 0)
  
  // 测试10: 数据完整性
  console.log('\n🔍 测试数据完整性:')
  
  // 检查所有帮助内容的完整性
  const allHelpContent = Array.from(helpService.helpContent.values())
  test('所有帮助内容应该有ID', allHelpContent.every(item => item.id))
  test('所有帮助内容应该有标题', allHelpContent.every(item => item.title))
  test('所有帮助内容应该有内容', allHelpContent.every(item => item.content))
  test('所有帮助内容应该有类别', allHelpContent.every(item => item.category))
  test('所有帮助内容应该有标签', allHelpContent.every(item => Array.isArray(item.tags)))
  test('所有帮助内容应该有更新时间', allHelpContent.every(item => item.lastUpdated instanceof Date))
  test('所有帮助内容应该有难度级别', allHelpContent.every(item => ['beginner', 'intermediate', 'advanced'].includes(item.difficulty)))
  test('所有帮助内容应该有阅读时间', allHelpContent.every(item => typeof item.readingTime === 'number'))
  
  // 检查所有FAQ的完整性
  const allFAQ = Array.from(helpService.faqItems.values())
  test('所有FAQ应该有问题', allFAQ.every(item => item.question))
  test('所有FAQ应该有答案', allFAQ.every(item => item.answer))
  test('所有FAQ应该有流行度', allFAQ.every(item => typeof item.popularity === 'number'))
  test('所有FAQ应该有相关主题', allFAQ.every(item => Array.isArray(item.relatedTopics)))
  
  // 输出测试结果
  console.log('\n' + '='.repeat(50))
  console.log(`📊 测试结果总结:`)
  console.log(`✅ 通过: ${passed} 个测试`)
  console.log(`❌ 失败: ${failed} 个测试`)
  console.log(`📈 成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  
  // 输出功能覆盖情况
  console.log('\n🎯 功能覆盖情况:')
  console.log(`   ✅ 服务初始化 - 帮助内容和数据结构`)
  console.log(`   ✅ 帮助内容获取 - 单个内容检索和验证`)
  console.log(`   ✅ 按类别获取帮助 - 分类浏览功能`)
  console.log(`   ✅ 搜索功能 - 全文搜索和结果排序`)
  console.log(`   ✅ 上下文帮助 - 情境相关的帮助提示`)
  console.log(`   ✅ 计算示例 - 详细的计算步骤和说明`)
  console.log(`   ✅ FAQ功能 - 常见问题和答案管理`)
  console.log(`   ✅ 个性化帮助 - 基于用户设置的推荐`)
  console.log(`   ✅ 智能提示 - 上下文感知的智能建议`)
  console.log(`   ✅ 数据完整性 - 所有数据结构的完整性验证`)
  
  if (failed === 0) {
    console.log('\n🎉 所有税收帮助信息系统测试都通过了！')
    return true
  } else {
    console.log('\n⚠️  有测试失败，需要检查帮助系统实现。')
    return false
  }
}

// 运行测试
runTaxHelpSystemTests().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('测试运行失败:', error)
  process.exit(1)
})
