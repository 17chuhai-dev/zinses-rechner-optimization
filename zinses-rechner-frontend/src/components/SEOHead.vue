<template>
  <!-- SEO组件不需要渲染任何可见内容 -->
  <div style="display: none;">
    <!-- 这个组件只处理head标签，不渲染可见内容 -->
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSEO } from '@/composables/useSEO'
import { getPageSEO, structuredDataTemplates } from '@/utils/seoConfig'
import type { CalculationResult, CalculatorForm } from '@/types/calculator'

interface Props {
  pageType?: 'homepage' | 'calculator' | 'ratgeber' | 'faq' | 'legal'
  calculationResult?: CalculationResult
  calculatorForm?: CalculatorForm
  customTitle?: string
  customDescription?: string
  customKeywords?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  pageType: 'homepage'
})

const route = useRoute()
const { 
  setHomepageSEO, 
  setCalculationResultSEO, 
  setEducationalContentSEO,
  applySEO 
} = useSEO()

/**
 * 初始化SEO
 */
const initializeSEO = () => {
  const currentPath = route.path

  // 根据页面类型设置SEO
  switch (props.pageType) {
    case 'homepage':
      setHomepageSEO()
      addOrganizationSchema()
      addWebsiteSchema()
      break

    case 'calculator':
      if (props.calculationResult && props.calculatorForm) {
        setCalculationResultSEO(props.calculationResult, props.calculatorForm)
      } else {
        setHomepageSEO() // 回退到主页SEO
      }
      break

    case 'ratgeber':
      handleRatgeberSEO(currentPath)
      break

    case 'faq':
      handleFAQSEO()
      break

    case 'legal':
      handleLegalPageSEO(currentPath)
      break

    default:
      // 尝试从配置中获取页面SEO
      const pageSEO = getPageSEO(currentPath)
      if (pageSEO) {
        setEducationalContentSEO(
          pageSEO.title,
          pageSEO.description,
          currentPath.replace('/', ''),
          pageSEO.keywords
        )
      } else {
        setHomepageSEO()
      }
  }
}

/**
 * 处理Ratgeber页面SEO
 */
const handleRatgeberSEO = (path: string) => {
  const ratgeberPages = {
    '/ratgeber': {
      title: 'Zinseszins Ratgeber | Alles über Compound Interest',
      description: 'Lernen Sie alles über Zinseszins: Formel, Berechnung, Strategien und Tipps für deutsche Sparer. Kostenloser Ratgeber mit Beispielen.',
      keywords: ['zinseszins ratgeber', 'compound interest guide', 'geld anlegen lernen']
    },
    '/ratgeber/zinseszins-formel': {
      title: 'Zinseszins-Formel einfach erklärt | Mit Beispielen',
      description: 'Die Zinseszins-Formel Schritt für Schritt erklärt. Verstehen Sie, wie A = P(1+r)^t funktioniert - mit praktischen Beispielen.',
      keywords: ['zinseszins formel', 'compound interest formel', 'mathematik zinseszins']
    },
    '/ratgeber/sparplan-strategie': {
      title: 'Sparplan-Strategien | Optimal Geld anlegen mit Zinseszins',
      description: 'Die besten Sparplan-Strategien für maximalen Zinseszins-Effekt. Monatlich sparen, langfristig profitieren.',
      keywords: ['sparplan strategie', 'monatlich sparen', 'langfristig anlegen']
    },
    '/ratgeber/deutsche-steuern': {
      title: 'Zinseszins und deutsche Steuern | Abgeltungssteuer erklärt',
      description: 'Wie wirkt sich die deutsche Abgeltungssteuer auf Ihre Zinseszins-Erträge aus? Freibeträge und Optimierungstipps.',
      keywords: ['abgeltungssteuer', 'deutsche steuern zinseszins', 'kapitalertragsteuer']
    }
  }

  const pageInfo = ratgeberPages[path as keyof typeof ratgeberPages]
  if (pageInfo) {
    setEducationalContentSEO(
      pageInfo.title,
      pageInfo.description,
      path.replace('/ratgeber/', ''),
      pageInfo.keywords
    )
    addArticleSchema(pageInfo.title, pageInfo.description, path)
  }
}

/**
 * 处理FAQ页面SEO
 */
const handleFAQSEO = () => {
  setEducationalContentSEO(
    'Häufige Fragen zum Zinseszins-Rechner | FAQ',
    'Antworten auf die häufigsten Fragen zu Zinseszins-Berechnungen, Formeln und Strategien. Schnelle Hilfe für alle Ihre Fragen.',
    'faq',
    ['zinseszins faq', 'häufige fragen', 'hilfe zinseszins']
  )
  addFAQSchema()
}

/**
 * 处理法律页面SEO
 */
const handleLegalPageSEO = (path: string) => {
  const legalPages = {
    '/impressum': {
      title: 'Impressum | Zinseszins-Rechner.de',
      description: 'Impressum und rechtliche Informationen zu Zinseszins-Rechner.de. Kontakt, Verantwortlicher und Haftungsausschluss.'
    },
    '/datenschutz': {
      title: 'Datenschutzerklärung | Zinseszins-Rechner.de',
      description: 'Datenschutzerklärung gemäß DSGVO. Erfahren Sie, wie wir Ihre Daten schützen und verwenden.'
    }
  }

  const pageInfo = legalPages[path as keyof typeof legalPages]
  if (pageInfo) {
    setEducationalContentSEO(
      pageInfo.title,
      pageInfo.description,
      path.replace('/', ''),
      []
    )
  }
}

/**
 * 添加组织结构化数据
 */
const addOrganizationSchema = () => {
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(structuredDataTemplates.organization)
  document.head.appendChild(script)
}

/**
 * 添加网站结构化数据
 */
const addWebsiteSchema = () => {
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(structuredDataTemplates.website)
  document.head.appendChild(script)
}

/**
 * 添加文章结构化数据
 */
const addArticleSchema = (title: string, description: string, path: string) => {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    url: `https://zinses-rechner.de${path}`,
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: 'Zinseszins-Rechner.de'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Zinseszins-Rechner.de',
      logo: {
        '@type': 'ImageObject',
        url: 'https://zinses-rechner.de/images/logo.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://zinses-rechner.de${path}`
    },
    inLanguage: 'de'
  }

  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(articleSchema)
  document.head.appendChild(script)
}

/**
 * 添加FAQ结构化数据
 */
const addFAQSchema = () => {
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(structuredDataTemplates.faqPage)
  document.head.appendChild(script)
}

/**
 * 添加面包屑导航
 */
const addBreadcrumbSchema = (breadcrumbs: Array<{ name: string; url: string }>) => {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url
    }))
  }

  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(breadcrumbSchema)
  document.head.appendChild(script)
}

/**
 * 清理旧的结构化数据脚本
 */
const cleanupOldSchemas = () => {
  const oldSchemas = document.querySelectorAll('script[type="application/ld+json"]')
  oldSchemas.forEach(script => {
    if (script.parentNode) {
      script.parentNode.removeChild(script)
    }
  })
}

// 监听路由变化
watch(() => route.path, () => {
  cleanupOldSchemas()
  initializeSEO()
}, { immediate: false })

// 监听计算结果变化
watch(() => [props.calculationResult, props.calculatorForm], () => {
  if (props.pageType === 'calculator' && props.calculationResult && props.calculatorForm) {
    setCalculationResultSEO(props.calculationResult, props.calculatorForm)
  }
}, { deep: true })

// 组件挂载时初始化
onMounted(() => {
  initializeSEO()
})
</script>

<style scoped>
/* 这个组件不需要样式，因为它不渲染可见内容 */
</style>
