/**
 * SEO管理系统
 * 处理元数据、结构化数据和德语SEO优化
 */

import { ref, computed, watch } from 'vue'
// import { useHead } from '@unhead/vue' // 暂时禁用以避免依赖问题
import type { CalculationResult, CalculatorForm } from '@/types/calculator'

export interface SEOData {
  title: string
  description: string
  keywords: string[]
  canonicalUrl: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  structuredData?: Record<string, any>
}

export interface SEOConfig {
  siteName: string
  siteUrl: string
  defaultImage: string
  twitterHandle: string
  locale: string
  language: string
}

const defaultConfig: SEOConfig = {
  siteName: 'Zinseszins-Rechner.de',
  siteUrl: 'https://zinses-rechner.de',
  defaultImage: '/images/og-default.jpg',
  twitterHandle: '@zinsesrechner',
  locale: 'de_DE',
  language: 'de'
}

export function useSEO(config: Partial<SEOConfig> = {}) {
  const seoConfig = { ...defaultConfig, ...config }
  const currentSEO = ref<SEOData | null>(null)

  /**
   * 设置主页SEO
   */
  const setHomepageSEO = () => {
    const seoData: SEOData = {
      title: 'Zinseszins-Rechner | Kostenloser Online-Rechner 2025',
      description: '✓ Kostenlos ✓ Sofortige Ergebnisse ✓ Deutsche Steueraspekte. Berechnen Sie Zinseszins mit unserem transparenten Online-Rechner. Jetzt ausprobieren!',
      keywords: [
        'zinseszins rechner',
        'zinsen berechnen',
        'sparplan rechner',
        'geld anlegen rechner',
        'compound interest calculator',
        'zinssatz berechnen',
        'kapitalanlage rechner',
        'investment rechner',
        'sparen rechner',
        'finanzrechner'
      ],
      canonicalUrl: seoConfig.siteUrl,
      ogTitle: 'Zinseszins-Rechner - Kostenlos & Transparent',
      ogDescription: 'Der schnellste Zinseszins-Rechner für deutsche Sparer. Sofortige Ergebnisse mit vollständiger Formel-Erklärung.',
      ogImage: `${seoConfig.siteUrl}/images/og-homepage.jpg`,
      twitterTitle: 'Zinseszins-Rechner - Kostenlos berechnen',
      twitterDescription: 'Berechnen Sie sofort, wie Ihr Kapital mit Zinseszins wächst. Kostenlos, transparent und mit deutscher Steuerberatung.',
      twitterImage: `${seoConfig.siteUrl}/images/twitter-homepage.jpg`,
      structuredData: generateWebApplicationSchema()
    }

    applySEO(seoData)
  }

  /**
   * 设置计算结果页面SEO
   */
  const setCalculationResultSEO = (result: CalculationResult, form: CalculatorForm) => {
    const finalAmount = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(result.finalAmount || 0)

    const totalInterest = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(result.totalInterest || 0)

    const seoData: SEOData = {
      title: `${finalAmount} nach ${form.years} Jahren - Zinseszins-Berechnung`,
      description: `Aus ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(form.principal)} werden ${finalAmount} mit ${totalInterest} Zinserträgen. Jetzt Ihre Berechnung starten!`,
      keywords: [
        'zinseszins berechnung',
        `${form.years} jahre anlage`,
        'kapitalwachstum',
        'zinserträge berechnen',
        'investment ergebnis'
      ],
      canonicalUrl: `${seoConfig.siteUrl}/berechnung`,
      ogTitle: `${finalAmount} Endkapital nach ${form.years} Jahren`,
      ogDescription: `Zinseszins-Berechnung: ${totalInterest} Zinserträge bei ${form.annualRate}% Zinssatz. Berechnen Sie Ihre Rendite!`,
      ogImage: generateResultImage(result, form),
      structuredData: generateCalculationSchema(result, form)
    }

    applySEO(seoData)
  }

  /**
   * 设置教育内容页面SEO
   */
  const setEducationalContentSEO = (
    title: string,
    description: string,
    slug: string,
    keywords: string[] = []
  ) => {
    const seoData: SEOData = {
      title: `${title} | Zinseszins-Rechner Ratgeber`,
      description,
      keywords: [
        ...keywords,
        'zinseszins ratgeber',
        'geld anlegen tipps',
        'finanz bildung',
        'investment wissen'
      ],
      canonicalUrl: `${seoConfig.siteUrl}/ratgeber/${slug}`,
      ogTitle: title,
      ogDescription: description,
      ogImage: `${seoConfig.siteUrl}/images/og-ratgeber-${slug}.jpg`,
      structuredData: generateArticleSchema(title, description, slug)
    }

    applySEO(seoData)
  }

  /**
   * 应用SEO数据到页面
   */
  const applySEO = (seoData: SEOData) => {
    currentSEO.value = seoData

    // 暂时禁用useHead调用以避免依赖问题
    // TODO: 重新启用SEO功能当@unhead/vue依赖可用时
    console.log('SEO data applied:', seoData.title)
  }

  /**
   * 生成Web应用结构化数据
   */
  const generateWebApplicationSchema = () => {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Zinseszins-Rechner',
      description: 'Kostenloser Online-Rechner für Zinseszins-Berechnungen mit deutscher Steuerberatung',
      url: seoConfig.siteUrl,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      softwareVersion: '2.0',
      datePublished: '2024-01-15',
      dateModified: new Date().toISOString().split('T')[0],
      inLanguage: 'de',
      isAccessibleForFree: true,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock'
      },
      provider: {
        '@type': 'Organization',
        name: 'Zinseszins-Rechner.de',
        url: seoConfig.siteUrl,
        logo: `${seoConfig.siteUrl}/images/logo.png`,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          availableLanguage: 'German'
        }
      },
      featureList: [
        'Kostenlose Zinseszins-Berechnung',
        'Transparente Formel-Erklärung',
        'Deutsche Steueraspekte',
        'Sofortige Ergebnisse',
        'Mobile-optimiert',
        'Datenexport (CSV, Excel, PDF)'
      ]
    }
  }

  /**
   * 生成计算结果结构化数据
   */
  const generateCalculationSchema = (result: CalculationResult, form: CalculatorForm) => {
    return {
      '@context': 'https://schema.org',
      '@type': 'FinancialProduct',
      name: 'Zinseszins-Berechnung',
      description: `Berechnung für ${form.years} Jahre Anlagedauer mit ${form.annualRate}% Zinssatz`,
      provider: {
        '@type': 'Organization',
        name: 'Zinseszins-Rechner.de'
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR'
      },
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'Startkapital',
          value: form.principal,
          unitCode: 'EUR'
        },
        {
          '@type': 'PropertyValue',
          name: 'Zinssatz',
          value: form.annualRate,
          unitCode: 'P1'
        },
        {
          '@type': 'PropertyValue',
          name: 'Laufzeit',
          value: form.years,
          unitCode: 'ANN'
        },
        {
          '@type': 'PropertyValue',
          name: 'Endkapital',
          value: result.finalAmount,
          unitCode: 'EUR'
        }
      ]
    }
  }

  /**
   * 生成文章结构化数据
   */
  const generateArticleSchema = (title: string, description: string, slug: string) => {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: description,
      url: `${seoConfig.siteUrl}/ratgeber/${slug}`,
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
          url: `${seoConfig.siteUrl}/images/logo.png`
        }
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${seoConfig.siteUrl}/ratgeber/${slug}`
      },
      inLanguage: 'de'
    }
  }

  /**
   * 生成结果图片URL（用于社交分享）
   */
  const generateResultImage = (result: CalculationResult, form: CalculatorForm): string => {
    const params = new URLSearchParams({
      principal: form.principal.toString(),
      final: (result.finalAmount || 0).toString(),
      years: form.years.toString(),
      rate: form.annualRate.toString()
    })

    return `${seoConfig.siteUrl}/api/og-image?${params.toString()}`
  }

  /**
   * 获取当前页面的SEO数据
   */
  const getCurrentSEO = computed(() => currentSEO.value)

  /**
   * 生成面包屑导航结构化数据
   */
  const generateBreadcrumbSchema = (breadcrumbs: Array<{ name: string; url: string }>) => {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url
      }))
    }
  }

  return {
    setHomepageSEO,
    setCalculationResultSEO,
    setEducationalContentSEO,
    applySEO,
    getCurrentSEO,
    generateBreadcrumbSchema,
    seoConfig
  }
}
