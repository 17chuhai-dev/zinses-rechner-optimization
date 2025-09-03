/**
 * SEO配置和德语关键词优化
 * 针对德国搜索引擎优化的配置
 */

export interface SEOPage {
  path: string
  title: string
  description: string
  keywords: string[]
  priority: number
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
}

/**
 * 德语关键词配置
 */
export const germanKeywords = {
  primary: [
    'zinseszins rechner',
    'zinsen berechnen',
    'sparplan rechner',
    'geld anlegen rechner',
    'compound interest calculator',
    'zinssatz berechnen'
  ],
  secondary: [
    'kapitalanlage rechner',
    'investment rechner',
    'sparen rechner',
    'finanzrechner',
    'rendite berechnen',
    'vermögen aufbauen',
    'geldanlage planen',
    'sparrate berechnen'
  ],
  longTail: [
    'wie berechnet man zinseszins',
    'zinseszins formel erklärung',
    'monatlich sparen rechner',
    'langfristig geld anlegen',
    'zinsen auf zinsen rechner',
    'kapital vermehren rechner',
    'sparplan mit zinseszins',
    'investment wachstum berechnen'
  ],
  local: [
    'zinseszins rechner deutschland',
    'deutsche steuer zinseszins',
    'abgeltungssteuer rechner',
    'sparplan deutschland',
    'geld anlegen deutschland'
  ]
}

/**
 * 页面SEO配置
 */
export const seoPages: SEOPage[] = [
  {
    path: '/',
    title: 'Zinseszins-Rechner | Kostenloser Online-Rechner 2025',
    description: '✓ Kostenlos ✓ Sofortige Ergebnisse ✓ Deutsche Steueraspekte. Berechnen Sie Zinseszins mit unserem transparenten Online-Rechner. Jetzt ausprobieren!',
    keywords: [...germanKeywords.primary, ...germanKeywords.secondary.slice(0, 4)],
    priority: 1.0,
    changefreq: 'daily'
  },
  {
    path: '/ratgeber',
    title: 'Zinseszins Ratgeber | Alles über Compound Interest',
    description: 'Lernen Sie alles über Zinseszins: Formel, Berechnung, Strategien und Tipps für deutsche Sparer. Kostenloser Ratgeber mit Beispielen.',
    keywords: [...germanKeywords.longTail.slice(0, 5), 'zinseszins ratgeber', 'compound interest guide'],
    priority: 0.8,
    changefreq: 'weekly'
  },
  {
    path: '/ratgeber/zinseszins-formel',
    title: 'Zinseszins-Formel einfach erklärt | Mit Beispielen',
    description: 'Die Zinseszins-Formel Schritt für Schritt erklärt. Verstehen Sie, wie A = P(1+r)^t funktioniert - mit praktischen Beispielen und Berechnungen.',
    keywords: ['zinseszins formel', 'compound interest formel', 'zinsen berechnen formel', 'mathematik zinseszins'],
    priority: 0.7,
    changefreq: 'monthly'
  },
  {
    path: '/ratgeber/sparplan-strategie',
    title: 'Sparplan-Strategien | Optimal Geld anlegen mit Zinseszins',
    description: 'Die besten Sparplan-Strategien für maximalen Zinseszins-Effekt. Monatlich sparen, langfristig profitieren - Tipps für deutsche Sparer.',
    keywords: ['sparplan strategie', 'monatlich sparen', 'langfristig anlegen', 'vermögen aufbauen'],
    priority: 0.7,
    changefreq: 'monthly'
  },
  {
    path: '/ratgeber/deutsche-steuern',
    title: 'Zinseszins und deutsche Steuern | Abgeltungssteuer erklärt',
    description: 'Wie wirkt sich die deutsche Abgeltungssteuer auf Ihre Zinseszins-Erträge aus? Freibeträge, Steuersätze und Optimierungstipps.',
    keywords: [...germanKeywords.local, 'abgeltungssteuer', 'kapitalertragsteuer', 'freibetrag'],
    priority: 0.6,
    changefreq: 'monthly'
  },
  {
    path: '/faq',
    title: 'Häufige Fragen zum Zinseszins-Rechner | FAQ',
    description: 'Antworten auf die häufigsten Fragen zu Zinseszins-Berechnungen, Formeln und Strategien. Schnelle Hilfe für alle Ihre Fragen.',
    keywords: ['zinseszins faq', 'häufige fragen', 'hilfe zinseszins', 'rechner hilfe'],
    priority: 0.5,
    changefreq: 'monthly'
  },
  {
    path: '/impressum',
    title: 'Impressum | Zinseszins-Rechner.de',
    description: 'Impressum und rechtliche Informationen zu Zinseszins-Rechner.de. Kontakt, Verantwortlicher und Haftungsausschluss.',
    keywords: ['impressum', 'kontakt', 'rechtliches'],
    priority: 0.1,
    changefreq: 'yearly'
  },
  {
    path: '/datenschutz',
    title: 'Datenschutzerklärung | Zinseszins-Rechner.de',
    description: 'Datenschutzerklärung gemäß DSGVO. Erfahren Sie, wie wir Ihre Daten schützen und verwenden. Transparent und rechtssicher.',
    keywords: ['datenschutz', 'dsgvo', 'privacy policy'],
    priority: 0.1,
    changefreq: 'yearly'
  }
]

/**
 * 结构化数据模板
 */
export const structuredDataTemplates = {
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Zinseszins-Rechner.de',
    url: 'https://zinses-rechner.de',
    logo: 'https://zinses-rechner.de/images/logo.png',
    description: 'Kostenloser Online-Rechner für Zinseszins-Berechnungen mit deutscher Steuerberatung',
    foundingDate: '2024-01-15',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['German'],
      areaServed: 'DE'
    },
    sameAs: [
      'https://twitter.com/zinsesrechner',
      'https://www.linkedin.com/company/zinseszins-rechner'
    ]
  },

  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Zinseszins-Rechner.de',
    url: 'https://zinses-rechner.de',
    description: 'Der führende kostenlose Zinseszins-Rechner für deutsche Sparer',
    inLanguage: 'de',
    isAccessibleForFree: true,
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://zinses-rechner.de/suche?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Zinseszins-Rechner.de'
    }
  },

  faqPage: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Wie funktioniert der Zinseszins-Rechner?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Unser Zinseszins-Rechner verwendet die mathematische Formel A = P(1+r/n)^(nt), um zu berechnen, wie Ihr Kapital über die Zeit wächst. Sie geben Startkapital, Zinssatz, Laufzeit und optional monatliche Sparraten ein.'
        }
      },
      {
        '@type': 'Question',
        name: 'Ist der Rechner kostenlos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ja, unser Zinseszins-Rechner ist vollständig kostenlos. Es gibt keine versteckten Gebühren oder Premium-Features. Alle Funktionen stehen Ihnen frei zur Verfügung.'
        }
      },
      {
        '@type': 'Question',
        name: 'Berücksichtigt der Rechner deutsche Steuern?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Der Rechner zeigt Brutto-Erträge an. Für deutsche Steuern (Abgeltungssteuer von 25% plus Solidaritätszuschlag) bieten wir separate Informationen und Hinweise.'
        }
      }
    ]
  }
}

/**
 * Meta标签模板
 */
export const metaTemplates = {
  default: {
    robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
    googlebot: 'index, follow',
    bingbot: 'index, follow',
    'google-site-verification': import.meta.env.VITE_GOOGLE_SITE_VERIFICATION || '',
    'msvalidate.01': import.meta.env.VITE_BING_SITE_VERIFICATION || '',
    'yandex-verification': import.meta.env.VITE_YANDEX_SITE_VERIFICATION || ''
  },

  social: {
    'og:type': 'website',
    'og:locale': 'de_DE',
    'og:site_name': 'Zinseszins-Rechner.de',
    'twitter:card': 'summary_large_image',
    'twitter:site': '@zinsesrechner',
    'twitter:creator': '@zinsesrechner'
  },

  mobile: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Zinseszins-Rechner',
    'application-name': 'Zinseszins-Rechner',
    'theme-color': '#2563eb',
    'msapplication-TileColor': '#2563eb',
    'msapplication-navbutton-color': '#2563eb'
  }
}

/**
 * 生成站点地图数据
 */
export function generateSitemapData(): string {
  const baseUrl = 'https://zinses-rechner.de'
  const currentDate = new Date().toISOString().split('T')[0]

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`

  seoPages.forEach(page => {
    sitemap += `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <xhtml:link rel="alternate" hreflang="de" href="${baseUrl}${page.path}" />
  </url>
`
  })

  sitemap += '</urlset>'
  return sitemap
}

/**
 * 生成robots.txt内容
 */
export function generateRobotsTxt(): string {
  const baseUrl = 'https://zinses-rechner.de'

  return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Disallow admin areas (if any)
Disallow: /admin/
Disallow: /api/internal/

# Allow important resources
Allow: /css/
Allow: /js/
Allow: /images/
Allow: /fonts/

# Host directive
Host: ${baseUrl}
`
}

/**
 * 获取页面特定的SEO配置
 */
export function getPageSEO(path: string): SEOPage | undefined {
  return seoPages.find(page => page.path === path)
}

/**
 * 生成关键词变体
 */
export function generateKeywordVariants(baseKeyword: string): string[] {
  const variants: string[] = []
  const suffixes = [
    'kostenlos',
    'online',
    '2025',
    'deutschland',
    'rechner',
    'berechnen',
    'tool',
    'calculator'
  ]

  suffixes.forEach(suffix => {
    variants.push(`${baseKeyword} ${suffix}`)
    variants.push(`${suffix} ${baseKeyword}`)
  })

  return [...new Set(variants)] // 去重
}
