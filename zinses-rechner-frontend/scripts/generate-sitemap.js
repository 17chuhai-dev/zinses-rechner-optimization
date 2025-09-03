/**
 * 站点地图生成脚本
 * 生成符合德国SEO标准的sitemap.xml
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const baseUrl = 'https://zinses-rechner.de'
const currentDate = new Date().toISOString().split('T')[0]

// 页面配置
const pages = [
  {
    path: '/',
    priority: 1.0,
    changefreq: 'daily',
    lastmod: currentDate
  },
  {
    path: '/ratgeber',
    priority: 0.8,
    changefreq: 'weekly',
    lastmod: currentDate
  },
  {
    path: '/ratgeber/zinseszins-formel',
    priority: 0.7,
    changefreq: 'monthly',
    lastmod: currentDate
  },
  {
    path: '/ratgeber/sparplan-strategie',
    priority: 0.7,
    changefreq: 'monthly',
    lastmod: currentDate
  },
  {
    path: '/ratgeber/deutsche-steuern',
    priority: 0.6,
    changefreq: 'monthly',
    lastmod: currentDate
  },
  {
    path: '/faq',
    priority: 0.5,
    changefreq: 'monthly',
    lastmod: currentDate
  },
  {
    path: '/impressum',
    priority: 0.1,
    changefreq: 'yearly',
    lastmod: currentDate
  },
  {
    path: '/datenschutz',
    priority: 0.1,
    changefreq: 'yearly',
    lastmod: currentDate
  }
]

// 生成sitemap.xml内容
function generateSitemap() {
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`

  pages.forEach(page => {
    sitemap += `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <xhtml:link rel="alternate" hreflang="de" href="${baseUrl}${page.path}" />
  </url>
`
  })

  sitemap += '</urlset>'
  return sitemap
}

// 写入sitemap.xml文件
function writeSitemap() {
  const sitemapContent = generateSitemap()
  const publicDir = path.join(__dirname, '../public')
  const sitemapPath = path.join(publicDir, 'sitemap.xml')
  
  // 确保public目录存在
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }
  
  fs.writeFileSync(sitemapPath, sitemapContent, 'utf8')
  console.log(`✅ Sitemap generated: ${sitemapPath}`)
  console.log(`📊 Total pages: ${pages.length}`)
}

// 执行生成
try {
  writeSitemap()
} catch (error) {
  console.error('❌ Error generating sitemap:', error)
  process.exit(1)
}
