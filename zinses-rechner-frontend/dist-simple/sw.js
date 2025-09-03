/**
 * Service Worker for Zinses-Rechner PWA
 * 提供离线缓存、后台同步、推送通知等功能
 */

const CACHE_NAME = 'zinses-rechner-v1.0.0'
const RUNTIME_CACHE = 'zinses-rechner-runtime'
const API_CACHE = 'zinses-rechner-api'

// 预缓存资源列表
const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png'
]

// API端点配置
const API_ENDPOINTS = {
  COMPOUND_INTEREST: '/api/v1/calculator/compound-interest',
  HEALTH_CHECK: '/api/health'
}

// 缓存策略配置
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
}

// 资源类型配置
const RESOURCE_TYPES = {
  STATIC: ['js', 'css', 'png', 'jpg', 'jpeg', 'svg', 'woff', 'woff2'],
  API: ['json'],
  HTML: ['html']
}

/**
 * Service Worker安装事件
 */
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...')

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Precaching resources...')
        return cache.addAll(PRECACHE_URLS)
      })
      .then(() => {
        console.log('✅ Precaching completed')
        // 强制激活新的Service Worker
        return self.skipWaiting()
      })
      .catch(error => {
        console.error('❌ Precaching failed:', error)
      })
  )
})

/**
 * Service Worker激活事件
 */
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating...')

  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      cleanupOldCaches(),
      // 立即控制所有客户端
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activated')
    })
  )
})

/**
 * 网络请求拦截
 */
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // 跳过非GET请求
  if (request.method !== 'GET') {
    return
  }

  // 跳过Chrome扩展请求
  if (url.protocol === 'chrome-extension:') {
    return
  }

  // 根据请求类型选择缓存策略
  if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request))
  } else if (isStaticResource(url)) {
    event.respondWith(handleStaticResource(request))
  } else if (isHTMLRequest(request)) {
    event.respondWith(handleHTMLRequest(request))
  } else {
    event.respondWith(handleGenericRequest(request))
  }
})

/**
 * 消息事件处理
 */
self.addEventListener('message', event => {
  const { type, data } = event.data

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break

    case 'CACHE_RESOURCE':
      cacheResource(data.url, data.strategy)
      break

    case 'CLEAR_CACHE':
      clearAllCaches()
      break

    case 'GET_CACHE_SIZE':
      getCacheSize().then(size => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', size })
      })
      break

    default:
      console.warn('Unknown message type:', type)
  }
})

/**
 * 推送通知事件
 */
self.addEventListener('push', event => {
  console.log('📬 Push notification received')

  if (!event.data) {
    console.warn('Push event has no data')
    return
  }

  try {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/badge-72x72.png',
      tag: data.tag || 'default',
      data: data.data,
      actions: data.actions,
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  } catch (error) {
    console.error('Push notification error:', error)
  }
})

/**
 * 通知点击事件
 */
self.addEventListener('notificationclick', event => {
  console.log('🔔 Notification clicked')

  event.notification.close()

  const { data } = event.notification
  const url = data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then(clients => {
        // 查找已打开的窗口
        for (const client of clients) {
          if (client.url === url && 'focus' in client) {
            return client.focus()
          }
        }

        // 打开新窗口
        if (self.clients.openWindow) {
          return self.clients.openWindow(url)
        }
      })
  )
})

/**
 * 后台同步事件
 */
self.addEventListener('sync', event => {
  console.log('🔄 Background sync triggered:', event.tag)

  if (event.tag === 'background-calculation') {
    event.waitUntil(performBackgroundCalculation())
  }
})

// 辅助函数

/**
 * 清理旧缓存
 */
async function cleanupOldCaches() {
  const cacheNames = await caches.keys()
  const oldCaches = cacheNames.filter(name =>
    name.startsWith('zinses-rechner-') && name !== CACHE_NAME
  )

  return Promise.all(
    oldCaches.map(name => {
      console.log('🗑️ Deleting old cache:', name)
      return caches.delete(name)
    })
  )
}

/**
 * 判断是否为API请求
 */
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/')
}

/**
 * 判断是否为静态资源
 */
function isStaticResource(url) {
  const extension = url.pathname.split('.').pop()
  return RESOURCE_TYPES.STATIC.includes(extension)
}

/**
 * 判断是否为HTML请求
 */
function isHTMLRequest(request) {
  return request.headers.get('accept')?.includes('text/html')
}

/**
 * 处理API请求 - 网络优先策略
 */
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE)

  try {
    // 尝试网络请求
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      // 缓存成功的响应
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.warn('Network request failed, trying cache:', error)

    // 网络失败，尝试缓存
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // 返回离线响应
    return new Response(JSON.stringify({
      error: 'OFFLINE',
      message: 'Keine Internetverbindung verfügbar'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

/**
 * 处理静态资源 - 缓存优先策略
 */
async function handleStaticResource(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.error('Static resource fetch failed:', error)
    throw error
  }
}

/**
 * 处理HTML请求 - 网络优先，离线回退
 */
async function handleHTMLRequest(request) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.warn('HTML request failed, trying cache:', error)

    const cache = await caches.open(RUNTIME_CACHE)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    // 返回离线页面
    return caches.match('/offline.html')
  }
}

/**
 * 处理通用请求 - 过时时重新验证策略
 */
async function handleGenericRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cachedResponse = await cache.match(request)

  // 异步更新缓存
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch(error => {
    console.warn('Generic request failed:', error)
    return cachedResponse
  })

  // 返回缓存响应或等待网络响应
  return cachedResponse || fetchPromise
}

/**
 * 缓存指定资源
 */
async function cacheResource(url, strategy = CACHE_STRATEGIES.STALE_WHILE_REVALIDATE) {
  try {
    const cache = await caches.open(RUNTIME_CACHE)
    const response = await fetch(url)

    if (response.ok) {
      await cache.put(url, response)
      console.log('✅ Resource cached:', url)
    }
  } catch (error) {
    console.error('❌ Resource caching failed:', error)
  }
}

/**
 * 清除所有缓存
 */
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames.map(name => caches.delete(name))
    )
    console.log('🗑️ All caches cleared')
  } catch (error) {
    console.error('❌ Cache clearing failed:', error)
  }
}

/**
 * 获取缓存大小
 */
async function getCacheSize() {
  try {
    if ('storage' in navigator) {
      const estimate = await navigator.storage.estimate()
      return estimate.usage || 0
    }
    return 0
  } catch (error) {
    console.error('❌ Cache size calculation failed:', error)
    return 0
  }
}

/**
 * 执行后台计算
 */
async function performBackgroundCalculation() {
  try {
    // 获取待处理的计算任务
    const calculations = await getQueuedCalculations()

    for (const calculation of calculations) {
      try {
        const result = await fetch('/api/v1/calculator/compound-interest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(calculation.data)
        })

        if (result.ok) {
          // 保存计算结果
          await saveCalculationResult(calculation.id, await result.json())

          // 发送通知
          await self.registration.showNotification('Berechnung abgeschlossen', {
            body: 'Ihre Zinseszins-Berechnung ist fertig.',
            icon: '/icons/icon-192x192.png',
            tag: `calculation-${calculation.id}`,
            data: { url: `/?result=${calculation.id}` }
          })
        }
      } catch (error) {
        console.error('Background calculation failed:', error)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

/**
 * 获取排队的计算任务
 */
async function getQueuedCalculations() {
  try {
    const db = await openIndexedDB()
    const transaction = db.transaction(['calculations'], 'readonly')
    const store = transaction.objectStore('calculations')
    const request = store.getAll()

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const calculations = request.result.filter(calc => calc.status === 'queued')
        resolve(calculations)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Failed to get queued calculations:', error)
    return []
  }
}

/**
 * 保存计算结果
 */
async function saveCalculationResult(id, result) {
  try {
    const db = await openIndexedDB()
    const transaction = db.transaction(['calculations'], 'readwrite')
    const store = transaction.objectStore('calculations')

    const calculation = await getCalculationById(store, id)
    if (calculation) {
      calculation.result = result
      calculation.status = 'completed'
      calculation.completedAt = new Date().toISOString()

      await new Promise((resolve, reject) => {
        const request = store.put(calculation)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      console.log('✅ Calculation result saved:', id)
    }
  } catch (error) {
    console.error('❌ Failed to save calculation result:', error)
  }
}

/**
 * 打开IndexedDB数据库
 */
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ZinsesRechnerDB', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // 创建计算存储
      if (!db.objectStoreNames.contains('calculations')) {
        const calculationStore = db.createObjectStore('calculations', { keyPath: 'id' })
        calculationStore.createIndex('status', 'status', { unique: false })
        calculationStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      // 创建历史存储
      if (!db.objectStoreNames.contains('history')) {
        const historyStore = db.createObjectStore('history', { keyPath: 'id' })
        historyStore.createIndex('timestamp', 'timestamp', { unique: false })
        historyStore.createIndex('type', 'type', { unique: false })
      }

      // 创建设置存储
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }

      // 创建缓存元数据存储
      if (!db.objectStoreNames.contains('cacheMetadata')) {
        const cacheStore = db.createObjectStore('cacheMetadata', { keyPath: 'url' })
        cacheStore.createIndex('lastUpdated', 'lastUpdated', { unique: false })
        cacheStore.createIndex('strategy', 'strategy', { unique: false })
      }
    }
  })
}

/**
 * 根据ID获取计算
 */
function getCalculationById(store, id) {
  return new Promise((resolve, reject) => {
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * 离线计算功能
 */
async function performOfflineCalculation(calculationData) {
  try {
    // 复利计算公式实现
    const { principal, rate, time, compound } = calculationData

    const compoundFrequency = compound || 1 // 默认年复利
    const finalAmount = principal * Math.pow(1 + (rate / 100) / compoundFrequency, compoundFrequency * time)
    const totalInterest = finalAmount - principal

    // 生成年度明细
    const yearlyBreakdown = []
    for (let year = 1; year <= time; year++) {
      const yearAmount = principal * Math.pow(1 + (rate / 100) / compoundFrequency, compoundFrequency * year)
      const yearInterest = yearAmount - (year === 1 ? principal : yearlyBreakdown[year - 2].amount)

      yearlyBreakdown.push({
        year,
        amount: Math.round(yearAmount * 100) / 100,
        interest: Math.round(yearInterest * 100) / 100,
        totalInterest: Math.round((yearAmount - principal) * 100) / 100
      })
    }

    return {
      finalAmount: Math.round(finalAmount * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      yearlyBreakdown,
      calculatedAt: new Date().toISOString(),
      offline: true
    }
  } catch (error) {
    console.error('Offline calculation failed:', error)
    throw error
  }
}

/**
 * 网络状态检测
 */
function isOnline() {
  return navigator.onLine
}

/**
 * 数据同步管理
 */
async function syncOfflineData() {
  if (!isOnline()) {
    console.log('📴 Device is offline, skipping sync')
    return
  }

  try {
    const db = await openIndexedDB()

    // 同步计算数据
    await syncCalculations(db)

    // 同步历史数据
    await syncHistory(db)

    // 同步设置数据
    await syncSettings(db)

    console.log('✅ Offline data synced successfully')
  } catch (error) {
    console.error('❌ Data sync failed:', error)
  }
}

/**
 * 同步计算数据
 */
async function syncCalculations(db) {
  const transaction = db.transaction(['calculations'], 'readwrite')
  const store = transaction.objectStore('calculations')
  const calculations = await getAllFromStore(store)

  const unsyncedCalculations = calculations.filter(calc => !calc.synced)

  for (const calculation of unsyncedCalculations) {
    try {
      const response = await fetch('/api/v1/calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calculation)
      })

      if (response.ok) {
        calculation.synced = true
        calculation.syncedAt = new Date().toISOString()
        await putInStore(store, calculation)
      }
    } catch (error) {
      console.error('Failed to sync calculation:', calculation.id, error)
    }
  }
}

/**
 * 同步历史数据
 */
async function syncHistory(db) {
  const transaction = db.transaction(['history'], 'readwrite')
  const store = transaction.objectStore('history')
  const history = await getAllFromStore(store)

  const unsyncedHistory = history.filter(item => !item.synced)

  for (const item of unsyncedHistory) {
    try {
      const response = await fetch('/api/v1/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      })

      if (response.ok) {
        item.synced = true
        item.syncedAt = new Date().toISOString()
        await putInStore(store, item)
      }
    } catch (error) {
      console.error('Failed to sync history item:', item.id, error)
    }
  }
}

/**
 * 同步设置数据
 */
async function syncSettings(db) {
  const transaction = db.transaction(['settings'], 'readwrite')
  const store = transaction.objectStore('settings')
  const settings = await getAllFromStore(store)

  const unsyncedSettings = settings.filter(setting => !setting.synced)

  for (const setting of unsyncedSettings) {
    try {
      const response = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setting)
      })

      if (response.ok) {
        setting.synced = true
        setting.syncedAt = new Date().toISOString()
        await putInStore(store, setting)
      }
    } catch (error) {
      console.error('Failed to sync setting:', setting.key, error)
    }
  }
}

/**
 * 从存储中获取所有数据
 */
function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * 向存储中添加数据
 */
function putInStore(store, data) {
  return new Promise((resolve, reject) => {
    const request = store.put(data)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// 定期同步数据
setInterval(() => {
  if (isOnline()) {
    syncOfflineData()
  }
}, 5 * 60 * 1000) // 每5分钟同步一次

console.log('🎯 Enhanced Service Worker loaded successfully')
