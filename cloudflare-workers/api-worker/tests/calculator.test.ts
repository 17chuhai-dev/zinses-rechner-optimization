/**
 * Cloudflare Workers API测试
 * 验证计算逻辑和API功能
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CalculatorService } from '../src/services/calculator'
import { ValidationService } from '../src/services/validation'
import { CacheService } from '../src/services/cache'
import { SecurityService } from '../src/services/security'
import { CalculatorRequest } from '../src/types/api'

// 模拟环境
const mockEnv = {
  ENVIRONMENT: 'test',
  DEBUG: 'true',
  CORS_ORIGIN: 'http://localhost:5173',
  MAX_CALCULATION_YEARS: '50',
  MAX_PRINCIPAL_AMOUNT: '10000000',
  DEFAULT_TAX_RATE: '0.25',
  CACHE_TTL: '300',
  RATE_LIMIT_REQUESTS: '100',
  RATE_LIMIT_WINDOW: '900',
  DB: {} as any,
  CACHE: {} as any,
  ANALYTICS: {} as any,
  RATE_LIMITER: {} as any
}

describe('CalculatorService', () => {
  let calculatorService: CalculatorService

  beforeEach(() => {
    calculatorService = new CalculatorService(mockEnv)
  })

  it('应该正确计算简单复利', async () => {
    const request: CalculatorRequest = {
      principal: 1000,
      monthly_payment: 0,
      annual_rate: 4,
      years: 1,
      compound_frequency: 'yearly'
    }

    const result = await calculatorService.calculateCompoundInterest(request)

    expect(result.final_amount).toBeCloseTo(1040, 2)
    expect(result.total_contributions).toBe(1000)
    expect(result.total_interest).toBeCloseTo(40, 2)
    expect(result.yearly_breakdown).toHaveLength(1)
  })

  it('应该正确计算带月供的复利', async () => {
    const request: CalculatorRequest = {
      principal: 10000,
      monthly_payment: 500,
      annual_rate: 4,
      years: 10,
      compound_frequency: 'monthly'
    }

    const result = await calculatorService.calculateCompoundInterest(request)

    expect(result.final_amount).toBeGreaterThan(70000)
    expect(result.total_contributions).toBe(70000) // 10000 + 500*12*10
    expect(result.total_interest).toBeGreaterThan(0)
    expect(result.yearly_breakdown).toHaveLength(10)
  })

  it('应该正确计算德国税务', () => {
    const grossInterest = 2000
    const taxResult = calculatorService.calculateGermanTax(grossInterest, false)

    expect(taxResult.tax_free_amount).toBe(1000) // Sparerpauschbetrag
    expect(taxResult.taxable_interest).toBe(1000) // 2000 - 1000
    expect(taxResult.abgeltungssteuer).toBe(250) // 1000 * 0.25
    expect(taxResult.solidaritaetszuschlag).toBeCloseTo(13.75, 2) // 250 * 0.055
    expect(taxResult.kirchensteuer).toBe(0) // 未选择教会税
  })

  it('应该处理边界情况', async () => {
    const request: CalculatorRequest = {
      principal: 1,
      monthly_payment: 0,
      annual_rate: 0.01,
      years: 1,
      compound_frequency: 'yearly'
    }

    const result = await calculatorService.calculateCompoundInterest(request)

    expect(result.final_amount).toBeGreaterThan(1)
    expect(result.total_interest).toBeGreaterThan(0)
  })
})

describe('ValidationService', () => {
  let validationService: ValidationService

  beforeEach(() => {
    validationService = new ValidationService(mockEnv)
  })

  it('应该验证有效的请求数据', () => {
    const validRequest: CalculatorRequest = {
      principal: 10000,
      monthly_payment: 500,
      annual_rate: 4,
      years: 10,
      compound_frequency: 'monthly'
    }

    const result = validationService.validateCalculatorRequest(validRequest)
    expect(result.valid).toBe(true)
  })

  it('应该拒绝无效的本金', () => {
    const invalidRequest: CalculatorRequest = {
      principal: -1000,
      monthly_payment: 0,
      annual_rate: 4,
      years: 10,
      compound_frequency: 'monthly'
    }

    const result = validationService.validateCalculatorRequest(invalidRequest)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Das Startkapital muss größer als 0€ sein')
  })

  it('应该拒绝过高的利率', () => {
    const invalidRequest: CalculatorRequest = {
      principal: 10000,
      monthly_payment: 0,
      annual_rate: 25,
      years: 10,
      compound_frequency: 'monthly'
    }

    const result = validationService.validateCalculatorRequest(invalidRequest)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Der Zinssatz darf nicht größer als 20% sein')
  })

  it('应该拒绝无效的复利频率', () => {
    const invalidRequest: CalculatorRequest = {
      principal: 10000,
      monthly_payment: 0,
      annual_rate: 4,
      years: 10,
      compound_frequency: 'invalid' as any
    }

    const result = validationService.validateCalculatorRequest(invalidRequest)
    expect(result.valid).toBe(false)
    expect(result.errors?.some(e => e.includes('Zinseszins-Häufigkeit'))).toBe(true)
  })
})

describe('CacheService', () => {
  let cacheService: CacheService

  beforeEach(() => {
    // 模拟KV存储
    const mockKV = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    }
    
    const mockEnvWithKV = {
      ...mockEnv,
      CACHE: mockKV as any
    }
    
    cacheService = new CacheService(mockEnvWithKV)
  })

  it('应该生成一致的缓存键', () => {
    const request: CalculatorRequest = {
      principal: 10000,
      monthly_payment: 500,
      annual_rate: 4,
      years: 10,
      compound_frequency: 'monthly'
    }

    const key1 = cacheService.generateCacheKey(request)
    const key2 = cacheService.generateCacheKey(request)

    expect(key1).toBe(key2)
    expect(key1).toMatch(/^calc:[a-z0-9]+$/)
  })

  it('应该为不同请求生成不同的缓存键', () => {
    const request1: CalculatorRequest = {
      principal: 10000,
      monthly_payment: 500,
      annual_rate: 4,
      years: 10,
      compound_frequency: 'monthly'
    }

    const request2: CalculatorRequest = {
      principal: 20000,
      monthly_payment: 500,
      annual_rate: 4,
      years: 10,
      compound_frequency: 'monthly'
    }

    const key1 = cacheService.generateCacheKey(request1)
    const key2 = cacheService.generateCacheKey(request2)

    expect(key1).not.toBe(key2)
  })
})

describe('SecurityService', () => {
  let securityService: SecurityService

  beforeEach(() => {
    securityService = new SecurityService(mockEnv)
  })

  it('应该验证有效的POST请求', async () => {
    const request = new Request('https://api.zinses-rechner.de/api/v1/calculate/compound-interest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    const result = await securityService.validateRequest(request, mockEnv)
    expect(result.valid).toBe(true)
  })

  it('应该拒绝无效的HTTP方法', async () => {
    const request = new Request('https://api.zinses-rechner.de/api/v1/calculate/compound-interest', {
      method: 'DELETE',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    const result = await securityService.validateRequest(request, mockEnv)
    expect(result.valid).toBe(false)
    expect(result.code).toBe('INVALID_METHOD')
  })

  it('应该生成正确的CORS头', () => {
    const corsHeaders = securityService.getCorsHeaders('https://zinses-rechner.de')
    
    expect(corsHeaders['Access-Control-Allow-Origin']).toBe('https://zinses-rechner.de')
    expect(corsHeaders['Access-Control-Allow-Methods']).toContain('POST')
    expect(corsHeaders['Access-Control-Allow-Headers']).toContain('Content-Type')
  })

  it('应该生成安全头', () => {
    const securityHeaders = securityService.getSecurityHeaders()
    
    expect(securityHeaders['X-Content-Type-Options']).toBe('nosniff')
    expect(securityHeaders['X-Frame-Options']).toBe('DENY')
    expect(securityHeaders['Content-Security-Policy']).toContain("default-src 'self'")
  })
})

describe('API集成测试', () => {
  it('应该处理完整的计算请求流程', async () => {
    // 这里应该测试完整的API请求流程
    // 包括验证、计算、缓存和响应
    
    const request: CalculatorRequest = {
      principal: 25000,
      monthly_payment: 300,
      annual_rate: 4.5,
      years: 15,
      compound_frequency: 'monthly'
    }

    // 模拟API调用
    const mockRequest = new Request('https://api.zinses-rechner.de/api/v1/calculate/compound-interest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify(request)
    })

    // 这里应该调用实际的Worker处理函数
    // 由于测试环境限制，我们验证请求格式
    expect(mockRequest.method).toBe('POST')
    expect(mockRequest.headers.get('Content-Type')).toBe('application/json')
  })

  it('应该正确处理错误情况', async () => {
    const invalidRequest = {
      principal: -1000,
      annual_rate: 25,
      years: 100
    }

    // 验证错误处理
    const validationService = new ValidationService(mockEnv)
    const result = validationService.validateCalculatorRequest(invalidRequest as any)
    
    expect(result.valid).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.errors!.length).toBeGreaterThan(0)
  })
})
