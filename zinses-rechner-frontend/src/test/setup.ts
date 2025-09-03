/**
 * 测试环境设置
 * 配置全局测试环境和模拟
 */

import { vi } from 'vitest'

// 模拟Chart.js
vi.mock('chart.js', () => ({
  Chart: vi.fn(),
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  PointElement: vi.fn(),
  LineElement: vi.fn(),
  BarElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
  Filler: vi.fn(),
  register: vi.fn()
}))

// 模拟vue-chartjs
vi.mock('vue-chartjs', () => ({
  Line: {
    name: 'Line',
    template: '<div data-testid="line-chart">Line Chart</div>'
  },
  Bar: {
    name: 'Bar',
    template: '<div data-testid="bar-chart">Bar Chart</div>'
  }
}))

// 模拟API调用
global.fetch = vi.fn()

// 模拟window对象
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// 模拟ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// 模拟IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// 模拟IndexedDB
const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null,
  readyState: 'done',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
}

const mockIDBDatabase = {
  name: 'test-db',
  version: 1,
  objectStoreNames: [],
  transaction: vi.fn(() => mockIDBTransaction),
  createObjectStore: vi.fn(),
  deleteObjectStore: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
}

const mockIDBTransaction = {
  objectStore: vi.fn(() => mockIDBObjectStore),
  abort: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  db: mockIDBDatabase,
  error: null,
  mode: 'readonly'
}

const mockIDBObjectStore = {
  add: vi.fn(() => mockIDBRequest),
  put: vi.fn(() => mockIDBRequest),
  get: vi.fn(() => mockIDBRequest),
  delete: vi.fn(() => mockIDBRequest),
  clear: vi.fn(() => mockIDBRequest),
  count: vi.fn(() => mockIDBRequest),
  getAll: vi.fn(() => mockIDBRequest),
  getAllKeys: vi.fn(() => mockIDBRequest),
  createIndex: vi.fn(),
  deleteIndex: vi.fn(),
  index: vi.fn()
}

global.indexedDB = {
  open: vi.fn(() => {
    const request = { ...mockIDBRequest }
    setTimeout(() => {
      request.result = mockIDBDatabase
      if (request.onsuccess) request.onsuccess({ target: request })
    }, 0)
    return request
  }),
  deleteDatabase: vi.fn(() => mockIDBRequest),
  databases: vi.fn(() => Promise.resolve([])),
  cmp: vi.fn()
}

// 模拟Web Crypto API
const mockCryptoKey = {
  algorithm: { name: 'AES-GCM', length: 256 },
  extractable: false,
  type: 'secret',
  usages: ['encrypt', 'decrypt']
}

// 使用Object.defineProperty来设置crypto，避免只读属性错误
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      encrypt: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
      decrypt: vi.fn(() => Promise.resolve(new ArrayBuffer(16))),
      generateKey: vi.fn(() => Promise.resolve(mockCryptoKey)),
      importKey: vi.fn(() => Promise.resolve(mockCryptoKey)),
      exportKey: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
      deriveBits: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
      deriveKey: vi.fn(() => Promise.resolve(mockCryptoKey)),
      sign: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
      verify: vi.fn(() => Promise.resolve(true)),
      digest: vi.fn(() => Promise.resolve(new ArrayBuffer(32)))
    },
    getRandomValues: vi.fn((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
      return array
    })
  },
  writable: true,
  configurable: true
})

// 模拟Canvas API
const mockCanvasContext = {
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1
  })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1
  })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  arc: vi.fn(),
  rect: vi.fn(),
  measureText: vi.fn(() => ({ width: 10 })),
  fillText: vi.fn(),
  strokeText: vi.fn()
}

HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext)
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,test')

// 模拟localStorage和sessionStorage
const createMockStorage = () => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null)
  }
}

Object.defineProperty(window, 'localStorage', {
  value: createMockStorage()
})

Object.defineProperty(window, 'sessionStorage', {
  value: createMockStorage()
})

// 设置测试环境变量
// Environment variables are handled by Vite automatically in tests
// VITE_API_BASE_URL is available via import.meta.env
