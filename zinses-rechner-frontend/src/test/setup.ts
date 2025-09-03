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

// 设置测试环境变量
// Environment variables are handled by Vite automatically in tests
// VITE_API_BASE_URL is available via import.meta.env
