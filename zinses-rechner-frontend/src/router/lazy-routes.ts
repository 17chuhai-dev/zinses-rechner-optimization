/**
 * 懒加载路由配置
 * 优化首屏加载性能，按需加载页面组件
 */

import type { RouteRecordRaw } from 'vue-router'

// 懒加载工具函数
const lazyLoad = (componentPath: string, chunkName?: string) => {
  return () => import(
    /* webpackChunkName: "[request]" */
    /* webpackPreload: true */
    `../views/${componentPath}.vue`
  )
}

// 预加载工具函数
const preloadComponent = (componentPath: string) => {
  return () => import(
    /* webpackChunkName: "[request]" */
    /* webpackPrefetch: true */
    `../views/${componentPath}.vue`
  )
}

// 条件加载工具函数
const conditionalLoad = (componentPath: string, condition: () => boolean) => {
  return () => {
    if (condition()) {
      return import(`../views/${componentPath}.vue`)
    }
    return import('../views/error/NotFoundPage.vue')
  }
}

// 主要路由配置
export const lazyRoutes: RouteRecordRaw[] = [
  // 首页 - 立即加载
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomePage.vue'),
    meta: {
      title: 'Zinses Rechner - Startseite',
      description: 'Professional German Financial Calculator',
      preload: true,
      priority: 'high'
    }
  },

  // 计算器路由 - 高优先级预加载
  {
    path: '/zinseszins',
    name: 'CompoundInterest',
    component: lazyLoad('calculator/CompoundInterestPage'),
    meta: {
      title: 'Zinseszins-Rechner',
      description: 'Berechnen Sie Zinserträge mit unserem Zinseszins-Rechner',
      preload: true,
      priority: 'high'
    }
  },
  {
    path: '/kredit',
    name: 'Loan',
    component: lazyLoad('calculator/LoanCalculatorPage'),
    meta: {
      title: 'Kredit-Rechner',
      description: 'Kreditberechnungen und Tilgungspläne',
      preload: true,
      priority: 'high'
    }
  },
  {
    path: '/investment',
    name: 'Investment',
    component: lazyLoad('calculator/InvestmentPage'),
    meta: {
      title: 'Investment-Rechner',
      description: 'Investitionsberechnungen und Renditeanalyse',
      preload: true,
      priority: 'medium'
    }
  },
  {
    path: '/rente',
    name: 'Retirement',
    component: lazyLoad('calculator/RetirementPage'),
    meta: {
      title: 'Renten-Rechner',
      description: 'Altersvorsorge und Rentenplanung',
      preload: false,
      priority: 'medium'
    }
  },

  // 高级功能 - 按需加载
  {
    path: '/portfolio',
    name: 'Portfolio',
    component: lazyLoad('advanced/PortfolioAnalysisPage'),
    meta: {
      title: 'Portfolio-Analyse',
      description: 'Erweiterte Portfolio-Analyse und Optimierung',
      preload: false,
      priority: 'low',
      requiresAuth: true
    }
  },
  {
    path: '/comparison',
    name: 'Comparison',
    component: lazyLoad('advanced/ComparisonPage'),
    meta: {
      title: 'Vergleichsrechner',
      description: 'Vergleichen Sie verschiedene Finanzprodukte',
      preload: false,
      priority: 'low'
    }
  },

  // 用户相关页面 - 条件加载
  {
    path: '/login',
    name: 'Login',
    component: conditionalLoad('auth/LoginPage', () => !localStorage.getItem('auth_token')),
    meta: {
      title: 'Anmelden',
      description: 'Bei Ihrem Konto anmelden',
      preload: false,
      priority: 'low',
      requiresGuest: true
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: conditionalLoad('auth/RegisterPage', () => !localStorage.getItem('auth_token')),
    meta: {
      title: 'Registrieren',
      description: 'Neues Konto erstellen',
      preload: false,
      priority: 'low',
      requiresGuest: true
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: conditionalLoad('user/ProfilePage', () => !!localStorage.getItem('auth_token')),
    meta: {
      title: 'Profil',
      description: 'Ihr Benutzerprofil verwalten',
      preload: false,
      priority: 'low',
      requiresAuth: true
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: conditionalLoad('user/DashboardPage', () => !!localStorage.getItem('auth_token')),
    meta: {
      title: 'Dashboard',
      description: 'Ihr persönliches Dashboard',
      preload: false,
      priority: 'medium',
      requiresAuth: true
    }
  },

  // 管理员页面 - 条件加载
  {
    path: '/admin',
    name: 'Admin',
    component: conditionalLoad('admin/AdminDashboard', () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      return user.role === 'admin'
    }),
    meta: {
      title: 'Administration',
      description: 'Administrationsbereich',
      preload: false,
      priority: 'low',
      requiresAuth: true,
      requiresRole: 'admin'
    },
    children: [
      {
        path: 'users',
        name: 'AdminUsers',
        component: lazyLoad('admin/UsersManagement'),
        meta: {
          title: 'Benutzerverwaltung',
          requiresAuth: true,
          requiresRole: 'admin'
        }
      },
      {
        path: 'analytics',
        name: 'AdminAnalytics',
        component: lazyLoad('admin/AnalyticsPage'),
        meta: {
          title: 'Analytics',
          requiresAuth: true,
          requiresRole: 'admin'
        }
      }
    ]
  },

  // 静态页面 - 低优先级
  {
    path: '/about',
    name: 'About',
    component: lazyLoad('static/AboutPage'),
    meta: {
      title: 'Über uns',
      description: 'Erfahren Sie mehr über Zinses Rechner',
      preload: false,
      priority: 'low'
    }
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: lazyLoad('static/PrivacyPage'),
    meta: {
      title: 'Datenschutz',
      description: 'Unsere Datenschutzerklärung',
      preload: false,
      priority: 'low'
    }
  },
  {
    path: '/terms',
    name: 'Terms',
    component: lazyLoad('static/TermsPage'),
    meta: {
      title: 'Nutzungsbedingungen',
      description: 'Unsere Nutzungsbedingungen',
      preload: false,
      priority: 'low'
    }
  },
  {
    path: '/help',
    name: 'Help',
    component: lazyLoad('static/HelpPage'),
    meta: {
      title: 'Hilfe',
      description: 'Hilfe und häufig gestellte Fragen',
      preload: false,
      priority: 'medium'
    }
  },
  {
    path: '/contact',
    name: 'Contact',
    component: lazyLoad('static/ContactPage'),
    meta: {
      title: 'Kontakt',
      description: 'Kontaktieren Sie uns',
      preload: false,
      priority: 'low'
    }
  },

  // 错误页面 - 按需加载
  {
    path: '/maintenance',
    name: 'Maintenance',
    component: lazyLoad('error/MaintenancePage'),
    meta: {
      title: 'Wartungsarbeiten',
      description: 'Die Seite befindet sich in Wartung',
      preload: false,
      priority: 'low'
    }
  },
  {
    path: '/500',
    name: 'ServerError',
    component: lazyLoad('error/ServerErrorPage'),
    meta: {
      title: 'Serverfehler',
      description: 'Ein Serverfehler ist aufgetreten',
      preload: false,
      priority: 'low'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: lazyLoad('error/NotFoundPage'),
    meta: {
      title: 'Seite nicht gefunden',
      description: 'Die angeforderte Seite wurde nicht gefunden',
      preload: false,
      priority: 'low'
    }
  }
]

// 预加载配置
export const preloadConfig = {
  // 高优先级路由 - 立即预加载
  high: ['Home', 'CompoundInterest', 'Loan'],
  
  // 中等优先级路由 - 用户交互时预加载
  medium: ['Investment', 'Retirement', 'Dashboard', 'Help'],
  
  // 低优先级路由 - 空闲时预加载
  low: ['About', 'Privacy', 'Terms', 'Contact', 'Portfolio', 'Comparison']
}

// 路由预加载函数
export const preloadRoutes = (priority: 'high' | 'medium' | 'low' = 'medium') => {
  const routesToPreload = preloadConfig[priority]
  
  routesToPreload.forEach(routeName => {
    const route = lazyRoutes.find(r => r.name === routeName)
    if (route && typeof route.component === 'function') {
      // 在空闲时预加载
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          route.component()
        })
      } else {
        setTimeout(() => {
          route.component()
        }, 100)
      }
    }
  })
}

// 智能预加载 - 基于用户行为
export const smartPreload = () => {
  // 鼠标悬停预加载
  document.addEventListener('mouseover', (event) => {
    const target = event.target as HTMLElement
    const link = target.closest('a[href]') as HTMLAnchorElement
    
    if (link && link.href.includes(window.location.origin)) {
      const path = new URL(link.href).pathname
      const route = lazyRoutes.find(r => r.path === path)
      
      if (route && typeof route.component === 'function') {
        route.component()
      }
    }
  })
  
  // 视口内预加载
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const link = entry.target as HTMLAnchorElement
          const path = new URL(link.href).pathname
          const route = lazyRoutes.find(r => r.path === path)
          
          if (route && typeof route.component === 'function') {
            route.component()
            observer.unobserve(link)
          }
        }
      })
    }, { rootMargin: '100px' })
    
    // 观察所有链接
    document.querySelectorAll('a[href]').forEach(link => {
      observer.observe(link)
    })
  }
}
