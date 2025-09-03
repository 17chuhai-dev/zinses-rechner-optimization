import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
// 懒加载导入，避免循环依赖
// import { calculatorRegistry } from '@/core/CalculatorRegistry'
// import { userManager } from '@/services/UserManager'
import HomeView from '../views/HomeView.vue'
import CalculatorView from '../views/CalculatorView.vue'

// 新功能组件 (懒加载)
const AIAdvisorPanel = () => import('@/components/ai/AIAdvisorPanel.vue')
const RealTimeDataPanel = () => import('@/components/data/RealTimeDataPanel.vue')
const DataVisualizationPanel = () => import('@/components/visualization/DataVisualizationPanel.vue')
const ExportPanel = () => import('@/components/export/ExportPanel.vue')
const CollaborationPanel = () => import('@/components/collaboration/CollaborationPanel.vue')
const UserProfile = () => import('@/views/UserProfile.vue')
const SettingsPanel = () => import('@/views/SettingsPanel.vue')

// 基础路由配置
const baseRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      title: 'Zinses-Rechner - Kostenloser Online-Rechner',
      description: 'Berechnen Sie Zinseszins, Kredite und mehr mit unseren kostenlosen Online-Rechnern'
    }
  },
  {
    path: '/rechner/:calculatorId',
    name: 'calculator',
    component: CalculatorView,
    props: true,
    meta: {
      title: 'Rechner',
      description: 'Finanzrechner'
    }
  },
  {
    path: '/ai-analysis',
    name: 'ai-analysis',
    component: () => import('../views/AIAnalysisView.vue'),
    meta: {
      title: 'AI-Finanzanalyse',
      description: 'Erhalten Sie personalisierte Finanzempfehlungen durch künstliche Intelligenz'
    }
  },
  {
    path: '/market-data',
    name: 'market-data',
    component: () => import('../views/RealTimeDataView.vue'),
    meta: {
      title: 'Aktuelle Marktdaten',
      description: 'Verfolgen Sie die neuesten Zinssätze, Wechselkurse und Wirtschaftsindikatoren in Echtzeit'
    }
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue'),
    meta: {
      title: 'Über uns',
      description: 'Erfahren Sie mehr über unsere Finanzrechner'
    }
  },
  {
    path: '/privacy',
    name: 'privacy',
    component: () => import('../views/PrivacyView.vue'),
    meta: {
      title: 'Datenschutz',
      description: 'Datenschutzerklärung'
    }
  },
  {
    path: '/imprint',
    name: 'imprint',
    component: () => import('../views/ImprintView.vue'),
    meta: {
      title: 'Impressum',
      description: 'Impressum und rechtliche Hinweise'
    }
  },
  // 友好的计算器URL映射
  {
    path: '/zinseszins-rechner',
    name: 'compound-interest-calculator',
    component: CalculatorView,
    props: { calculatorId: 'compound-interest' },
    meta: {
      title: 'Zinseszins-Rechner',
      description: 'Berechnen Sie Ihre Kapitalentwicklung mit Zinseszins'
    }
  },
  {
    path: '/darlehensrechner',
    name: 'loan-calculator',
    component: CalculatorView,
    props: { calculatorId: 'loan' },
    meta: {
      title: 'Darlehensrechner',
      description: 'Berechnen Sie Ihre Kreditraten und Tilgungspläne'
    }
  },
  {
    path: '/baufinanzierungsrechner',
    name: 'mortgage-calculator',
    component: CalculatorView,
    props: { calculatorId: 'mortgage' },
    meta: {
      title: 'Baufinanzierungsrechner',
      description: 'Berechnen Sie Ihre Immobilienfinanzierung'
    }
  },
  {
    path: '/altersvorsorge-rechner',
    name: 'retirement-calculator',
    component: CalculatorView,
    props: { calculatorId: 'retirement' },
    meta: {
      title: 'Altersvorsorge-Rechner',
      description: 'Planen Sie Ihre Altersvorsorge nach deutschem Recht'
    }
  },
  {
    path: '/portfolio-rechner',
    name: 'portfolio-calculator',
    component: CalculatorView,
    props: { calculatorId: 'portfolio' },
    meta: {
      title: 'Portfolio-Rechner',
      description: 'Analysieren Sie Ihr Anlageportfolio'
    }
  },
  {
    path: '/steueroptimierung-rechner',
    name: 'tax-optimization-calculator',
    component: CalculatorView,
    props: { calculatorId: 'tax-optimization' },
    meta: {
      title: 'Steueroptimierung-Rechner',
      description: 'Optimieren Sie Ihre Steuerlast bei Kapitalanlagen'
    }
  },
  {
    path: '/sparplan-rechner',
    name: 'savings-plan-calculator',
    component: CalculatorView,
    props: { calculatorId: 'savings-plan' },
    meta: {
      title: 'Sparplan-Rechner',
      description: 'Berechnen Sie Ihre Sparplan-Entwicklung mit deutschen Bankprodukten'
    }
  },
  {
    path: '/etf-sparplan-rechner',
    name: 'etf-savings-plan-calculator',
    component: CalculatorView,
    props: { calculatorId: 'etf-savings-plan' },
    meta: {
      title: 'ETF-Sparplan-Rechner',
      description: 'Berechnen Sie Ihre ETF-Sparplan-Entwicklung mit deutschen Steueraspekten'
    }
  },
  {
    path: '/rechner',
    name: 'rechner-hub',
    component: () => import('../views/RechnerHubView.vue'),
    meta: {
      title: 'Finanzrechner Übersicht',
      description: 'Alle kostenlosen Finanzrechner für Deutschland in der Übersicht'
    }
  },
  {
    path: '/ratgeber',
    name: 'ratgeber-hub',
    component: () => import('../views/RatgeberHubView.vue'),
    meta: {
      title: 'Finanz-Ratgeber',
      description: 'Verständliche Finanz-Ratgeber und Expertentipps für Deutschland'
    }
  },
  {
    path: '/vergleich',
    name: 'vergleich-hub',
    component: () => import('../views/VergleichHubView.vue'),
    meta: {
      title: 'Finanzprodukte vergleichen',
      description: 'Objektive Vergleiche von Finanzprodukten - Zinsen, Kosten und Konditionen'
    }
  },
  {
    path: '/ratgeber/zinseszins-erklaert',
    name: 'zinseszins-erklaert',
    component: () => import('../views/ZinseszinsErklaertView.vue'),
    meta: {
      title: 'Zinseszins einfach erklärt - Formel, Beispiele und Rechner',
      description: 'Verstehen Sie den Zinseszinseffekt: Definition, Formel, praktische Beispiele und interaktive Berechnungen für Ihren Vermögensaufbau.'
    }
  },
  // AI和智能功能路由
  {
    path: '/ki-berater',
    name: 'ai-advisor',
    component: AIAdvisorPanel,
    meta: {
      title: 'KI Finanzberater',
      description: 'Intelligente Finanzberatung mit KI-Technologie für personalisierte Empfehlungen',
      keywords: 'KI Berater, AI Advisor, Finanzberatung, Künstliche Intelligenz'
    }
  },
  // 实时数据路由
  {
    path: '/echtzeit-daten',
    name: 'realtime-data',
    component: RealTimeDataPanel,
    meta: {
      title: 'Echtzeit Finanzdaten',
      description: 'Aktuelle Zinssätze, Wechselkurse und Marktdaten von EZB, Bundesbank und anderen Quellen',
      keywords: 'Echtzeit Daten, Zinssätze, Wechselkurse, Marktdaten, EZB, Bundesbank'
    }
  },
  // 数据可视化路由
  {
    path: '/datenvisualisierung',
    name: 'data-visualization',
    component: DataVisualizationPanel,
    meta: {
      title: 'Datenvisualisierung',
      description: 'Visualisieren Sie Ihre Finanzdaten mit interaktiven Diagrammen und Charts',
      keywords: 'Diagramme, Charts, Visualisierung, Grafiken, Finanzanalyse'
    }
  },
  // 导出工具路由
  {
    path: '/export-tools',
    name: 'export-tools',
    component: ExportPanel,
    meta: {
      title: 'Export Tools',
      description: 'Exportieren Sie Ihre Berechnungen in verschiedene Formate (PDF, Excel, CSV)',
      keywords: 'Export, PDF, Excel, CSV, Berichte, Download'
    }
  },
  // 协作功能路由
  {
    path: '/zusammenarbeit',
    name: 'collaboration',
    component: CollaborationPanel,
    meta: {
      title: 'Zusammenarbeit',
      description: 'Arbeiten Sie gemeinsam an Finanzberechnungen und teilen Sie Ergebnisse',
      keywords: 'Zusammenarbeit, Kollaboration, Team, Sharing, Gemeinsam',
      requiresAuth: true
    }
  },
  // 用户相关路由
  {
    path: '/profil',
    name: 'user-profile',
    component: UserProfile,
    meta: {
      title: 'Benutzerprofil',
      description: 'Verwalten Sie Ihr Benutzerprofil und persönliche Einstellungen',
      requiresAuth: true
    }
  },
  {
    path: '/einstellungen',
    name: 'settings',
    component: SettingsPanel,
    meta: {
      title: 'Einstellungen',
      description: 'Anwendungseinstellungen, Themen und Präferenzen konfigurieren'
    }
  }
]

/**
 * 动态生成计算器路由 - 异步版本
 */
async function generateCalculatorRoutes(): Promise<RouteRecordRaw[]> {
  // 异步导入计算器注册表以避免循环依赖
  const { calculatorRegistry } = await import('@/core/CalculatorRegistry')
  const calculators = calculatorRegistry.getAllCalculators()

  return calculators.map(calculator => ({
    path: `/rechner/${calculator.id}`,
    name: `calculator-${calculator.id}`,
    component: CalculatorView,
    props: { calculatorId: calculator.id },
    meta: {
      title: calculator.name,
      description: calculator.description,
      calculator: calculator
    }
  }))
}

/**
 * 创建路由实例
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...baseRoutes,
    // 动态计算器路由将在运行时添加
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: {
        title: 'Seite nicht gefunden',
        description: 'Die angeforderte Seite wurde nicht gefunden'
      }
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

/**
 * 注册动态路由 - 异步版本
 */
export async function registerDynamicRoutes() {
  try {
    const dynamicRoutes = await generateCalculatorRoutes()

    dynamicRoutes.forEach(route => {
      router.addRoute(route)
    })

    console.log(`✅ ${dynamicRoutes.length} 个动态计算器路由已注册`)
  } catch (error) {
    console.error('❌ 注册动态路由失败:', error)
  }
}

/**
 * 路由守卫 - 设置页面标题和元数据，检查认证
 */
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} | Zinses-Rechner`
  }

  // 设置meta描述
  if (to.meta?.description) {
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', to.meta.description as string)
    }
  }

  // 设置meta关键词
  if (to.meta?.keywords) {
    const metaKeywords = document.querySelector('meta[name="keywords"]')
    if (metaKeywords) {
      metaKeywords.setAttribute('content', to.meta.keywords as string)
    }
  }

  // 检查认证要求
  if (to.meta?.requiresAuth) {
    if (!userManager.isAuthenticated.value) {
      // 保存原始路径，登录后重定向
      const redirectPath = to.fullPath
      next({
        path: '/',
        query: { redirect: redirectPath, auth: 'required' }
      })
      return
    }
  }

  // 检查权限要求
  if (to.meta?.requiresPermission) {
    const permission = to.meta.requiresPermission as string
    if (!userManager.hasPermission(permission)) {
      next({
        path: '/',
        query: { error: 'insufficient_permissions' }
      })
      return
    }
  }

  next()
})

/**
 * 路由错误处理
 */
router.onError((error) => {
  console.error('路由错误:', error)
})

export default router
