/**
 * 性能优化分析和建议工具
 * 基于测试结果提供具体的优化建议
 */

export interface PerformanceMetrics {
  api_response_time_p95: number
  api_response_time_avg: number
  concurrent_rps: number
  error_rate: number
  memory_usage_avg: number
  memory_usage_peak: number
  cpu_usage_avg: number
  cpu_usage_peak: number
  cache_hit_rate: number
  frontend_performance_score: number
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  ttfb: number // Time to First Byte
}

export interface PerformanceTargets {
  api_response_time_max: number
  concurrent_rps_min: number
  error_rate_max: number
  memory_usage_max: number
  cpu_usage_max: number
  cache_hit_rate_min: number
  frontend_score_min: number
  lcp_max: number
  fid_max: number
  cls_max: number
}

export interface OptimizationRecommendation {
  category: 'api' | 'frontend' | 'infrastructure' | 'database' | 'cache'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  implementation: string
  expected_improvement: string
  effort_estimate: string
}

export class PerformanceOptimizer {
  private targets: PerformanceTargets

  constructor() {
    this.targets = {
      api_response_time_max: 500,
      concurrent_rps_min: 1000,
      error_rate_max: 1,
      memory_usage_max: 80,
      cpu_usage_max: 80,
      cache_hit_rate_min: 85,
      frontend_score_min: 85,
      lcp_max: 2500,
      fid_max: 100,
      cls_max: 0.1
    }
  }

  /**
   * 分析性能指标并生成优化建议
   */
  analyzePerformance(metrics: PerformanceMetrics): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = []

    // API性能分析
    if (metrics.api_response_time_p95 > this.targets.api_response_time_max) {
      recommendations.push({
        category: 'api',
        priority: 'high',
        title: 'API响应时间优化',
        description: `API P95响应时间为${metrics.api_response_time_p95}ms，超过目标${this.targets.api_response_time_max}ms`,
        implementation: `
1. 优化复利计算算法，使用更高效的数学库
2. 实施API响应缓存，缓存常见计算结果
3. 优化数据库查询，添加适当索引
4. 考虑使用Redis缓存热点数据
5. 实施API响应压缩`,
        expected_improvement: '响应时间减少30-50%',
        effort_estimate: '2-3个开发日'
      })
    }

    // 并发能力分析
    if (metrics.concurrent_rps < this.targets.concurrent_rps_min) {
      recommendations.push({
        category: 'infrastructure',
        priority: 'high',
        title: '并发处理能力提升',
        description: `当前RPS为${metrics.concurrent_rps}，低于目标${this.targets.concurrent_rps_min}`,
        implementation: `
1. 增加Cloudflare Workers实例数量
2. 优化Workers代码，减少CPU密集型操作
3. 实施连接池管理
4. 配置负载均衡策略
5. 优化数据库连接池大小`,
        expected_improvement: 'RPS提升50-100%',
        effort_estimate: '3-5个开发日'
      })
    }

    // 内存使用分析
    if (metrics.memory_usage_peak > this.targets.memory_usage_max) {
      recommendations.push({
        category: 'infrastructure',
        priority: 'medium',
        title: '内存使用优化',
        description: `峰值内存使用率${metrics.memory_usage_peak}%，超过目标${this.targets.memory_usage_max}%`,
        implementation: `
1. 优化数据结构，减少内存占用
2. 实施对象池管理
3. 及时释放不需要的变量
4. 优化图表数据处理
5. 实施内存泄漏检测`,
        expected_improvement: '内存使用减少20-30%',
        effort_estimate: '2-3个开发日'
      })
    }

    // 缓存性能分析
    if (metrics.cache_hit_rate < this.targets.cache_hit_rate_min) {
      recommendations.push({
        category: 'cache',
        priority: 'medium',
        title: '缓存策略优化',
        description: `缓存命中率${metrics.cache_hit_rate}%，低于目标${this.targets.cache_hit_rate_min}%`,
        implementation: `
1. 分析缓存失效模式，调整TTL策略
2. 实施智能缓存预热
3. 优化缓存键设计，提高命中率
4. 实施多层缓存架构
5. 监控缓存性能指标`,
        expected_improvement: '缓存命中率提升10-15%',
        effort_estimate: '1-2个开发日'
      })
    }

    // 前端性能分析
    if (metrics.frontend_performance_score < this.targets.frontend_score_min) {
      recommendations.push({
        category: 'frontend',
        priority: 'high',
        title: '前端性能优化',
        description: `前端性能评分${metrics.frontend_performance_score}，低于目标${this.targets.frontend_score_min}`,
        implementation: `
1. 实施代码分割和懒加载
2. 优化图片格式和大小
3. 压缩和合并CSS/JS资源
4. 实施Service Worker缓存
5. 优化关键渲染路径`,
        expected_improvement: '性能评分提升10-20分',
        effort_estimate: '3-4个开发日'
      })
    }

    // LCP优化
    if (metrics.lcp > this.targets.lcp_max) {
      recommendations.push({
        category: 'frontend',
        priority: 'high',
        title: 'LCP (最大内容绘制) 优化',
        description: `LCP为${metrics.lcp}ms，超过目标${this.targets.lcp_max}ms`,
        implementation: `
1. 优化关键资源加载顺序
2. 实施资源预加载 (preload)
3. 优化服务器响应时间
4. 压缩和优化关键CSS
5. 使用CDN加速资源分发`,
        expected_improvement: 'LCP减少500-1000ms',
        effort_estimate: '2-3个开发日'
      })
    }

    // CLS优化
    if (metrics.cls > this.targets.cls_max) {
      recommendations.push({
        category: 'frontend',
        priority: 'medium',
        title: 'CLS (累积布局偏移) 优化',
        description: `CLS为${metrics.cls}，超过目标${this.targets.cls_max}`,
        implementation: `
1. 为图片和iframe设置明确的尺寸
2. 避免在现有内容上方插入内容
3. 使用CSS aspect-ratio属性
4. 预留广告和嵌入内容的空间
5. 优化字体加载策略`,
        expected_improvement: 'CLS减少到0.05以下',
        effort_estimate: '1-2个开发日'
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * 生成性能优化实施计划
   */
  generateOptimizationPlan(recommendations: OptimizationRecommendation[]): string {
    const highPriority = recommendations.filter(r => r.priority === 'high')
    const mediumPriority = recommendations.filter(r => r.priority === 'medium')
    const lowPriority = recommendations.filter(r => r.priority === 'low')

    let plan = `# Zinses-Rechner 性能优化实施计划

## 执行摘要
发现 ${recommendations.length} 个优化机会：
- 🔴 高优先级: ${highPriority.length} 项
- 🟡 中优先级: ${mediumPriority.length} 项  
- 🟢 低优先级: ${lowPriority.length} 项

## 第一阶段：高优先级优化 (立即执行)
`

    highPriority.forEach((rec, index) => {
      plan += `
### ${index + 1}. ${rec.title}
**问题**: ${rec.description}
**预期改进**: ${rec.expected_improvement}
**工作量**: ${rec.effort_estimate}

**实施步骤**:
${rec.implementation}

---
`
    })

    if (mediumPriority.length > 0) {
      plan += `
## 第二阶段：中优先级优化 (1-2周内)
`
      mediumPriority.forEach((rec, index) => {
        plan += `
### ${index + 1}. ${rec.title}
**预期改进**: ${rec.expected_improvement}
**工作量**: ${rec.effort_estimate}
`
      })
    }

    if (lowPriority.length > 0) {
      plan += `
## 第三阶段：低优先级优化 (长期规划)
`
      lowPriority.forEach((rec, index) => {
        plan += `- ${rec.title} (${rec.effort_estimate})
`
      })
    }

    plan += `
## 监控和验证
1. 实施每项优化后运行性能测试验证
2. 监控生产环境性能指标变化
3. 建立性能回归检测机制
4. 定期审查和调整优化策略

## 成功标准
- API P95响应时间 < 500ms
- 并发处理能力 > 1000 RPS
- 前端性能评分 > 85分
- 系统资源使用率 < 80%
- 缓存命中率 > 85%
`

    return plan
  }

  /**
   * 生成性能监控配置
   */
  generateMonitoringConfig(): object {
    return {
      alerts: {
        api_response_time: {
          threshold: this.targets.api_response_time_max,
          severity: 'critical',
          notification_channels: ['slack', 'email']
        },
        concurrent_rps: {
          threshold: this.targets.concurrent_rps_min,
          severity: 'warning',
          notification_channels: ['slack']
        },
        error_rate: {
          threshold: this.targets.error_rate_max,
          severity: 'critical',
          notification_channels: ['slack', 'email', 'pagerduty']
        },
        memory_usage: {
          threshold: this.targets.memory_usage_max,
          severity: 'warning',
          notification_channels: ['slack']
        },
        cpu_usage: {
          threshold: this.targets.cpu_usage_max,
          severity: 'warning',
          notification_channels: ['slack']
        }
      },
      dashboards: {
        grafana: {
          panels: [
            'api_response_time_trend',
            'rps_trend',
            'error_rate_trend',
            'resource_usage_trend',
            'cache_performance'
          ]
        },
        cloudflare: {
          analytics: [
            'requests_per_second',
            'bandwidth_usage',
            'cache_hit_ratio',
            'origin_response_time'
          ]
        }
      },
      automated_tests: {
        schedule: 'daily',
        environments: ['production', 'staging'],
        test_types: ['load', 'stress', 'lighthouse'],
        notification_on_failure: true
      }
    }
  }
}

/**
 * 性能基准测试工具
 */
export class PerformanceBenchmark {
  private baselineMetrics: PerformanceMetrics | null = null

  /**
   * 设置性能基准
   */
  setBaseline(metrics: PerformanceMetrics): void {
    this.baselineMetrics = metrics
    console.log('✅ 性能基准已设置')
  }

  /**
   * 比较当前性能与基准
   */
  compareWithBaseline(currentMetrics: PerformanceMetrics): {
    improvements: string[]
    regressions: string[]
    overall_trend: 'improved' | 'degraded' | 'stable'
  } {
    if (!this.baselineMetrics) {
      throw new Error('性能基准未设置')
    }

    const improvements: string[] = []
    const regressions: string[] = []

    // 比较各项指标
    const comparisons = [
      {
        metric: 'API响应时间',
        current: currentMetrics.api_response_time_p95,
        baseline: this.baselineMetrics.api_response_time_p95,
        lowerIsBetter: true
      },
      {
        metric: '并发RPS',
        current: currentMetrics.concurrent_rps,
        baseline: this.baselineMetrics.concurrent_rps,
        lowerIsBetter: false
      },
      {
        metric: '错误率',
        current: currentMetrics.error_rate,
        baseline: this.baselineMetrics.error_rate,
        lowerIsBetter: true
      },
      {
        metric: '内存使用率',
        current: currentMetrics.memory_usage_peak,
        baseline: this.baselineMetrics.memory_usage_peak,
        lowerIsBetter: true
      },
      {
        metric: 'CPU使用率',
        current: currentMetrics.cpu_usage_peak,
        baseline: this.baselineMetrics.cpu_usage_peak,
        lowerIsBetter: true
      },
      {
        metric: '缓存命中率',
        current: currentMetrics.cache_hit_rate,
        baseline: this.baselineMetrics.cache_hit_rate,
        lowerIsBetter: false
      },
      {
        metric: '前端性能评分',
        current: currentMetrics.frontend_performance_score,
        baseline: this.baselineMetrics.frontend_performance_score,
        lowerIsBetter: false
      },
      {
        metric: 'LCP',
        current: currentMetrics.lcp,
        baseline: this.baselineMetrics.lcp,
        lowerIsBetter: true
      }
    ]

    comparisons.forEach(comp => {
      const changePercent = ((comp.current - comp.baseline) / comp.baseline) * 100
      const isImprovement = comp.lowerIsBetter ? changePercent < -5 : changePercent > 5
      const isRegression = comp.lowerIsBetter ? changePercent > 5 : changePercent < -5

      if (isImprovement) {
        improvements.push(`${comp.metric}: ${Math.abs(changePercent).toFixed(1)}% 改善`)
      } else if (isRegression) {
        regressions.push(`${comp.metric}: ${Math.abs(changePercent).toFixed(1)}% 退化`)
      }
    })

    // 确定整体趋势
    let overall_trend: 'improved' | 'degraded' | 'stable' = 'stable'
    if (improvements.length > regressions.length) {
      overall_trend = 'improved'
    } else if (regressions.length > improvements.length) {
      overall_trend = 'degraded'
    }

    return { improvements, regressions, overall_trend }
  }

  /**
   * 生成性能趋势报告
   */
  generateTrendReport(historicalData: PerformanceMetrics[]): string {
    if (historicalData.length < 2) {
      return '历史数据不足，无法生成趋势报告'
    }

    const latest = historicalData[historicalData.length - 1]
    const previous = historicalData[historicalData.length - 2]

    const trends = {
      api_response_time: this.calculateTrend(latest.api_response_time_p95, previous.api_response_time_p95, true),
      concurrent_rps: this.calculateTrend(latest.concurrent_rps, previous.concurrent_rps, false),
      memory_usage: this.calculateTrend(latest.memory_usage_peak, previous.memory_usage_peak, true),
      cache_hit_rate: this.calculateTrend(latest.cache_hit_rate, previous.cache_hit_rate, false),
      frontend_score: this.calculateTrend(latest.frontend_performance_score, previous.frontend_performance_score, false)
    }

    return `# 性能趋势分析报告

## 关键指标趋势
- **API响应时间**: ${trends.api_response_time.emoji} ${trends.api_response_time.description}
- **并发处理能力**: ${trends.concurrent_rps.emoji} ${trends.concurrent_rps.description}
- **内存使用**: ${trends.memory_usage.emoji} ${trends.memory_usage.description}
- **缓存性能**: ${trends.cache_hit_rate.emoji} ${trends.cache_hit_rate.description}
- **前端性能**: ${trends.frontend_score.emoji} ${trends.frontend_score.description}

## 总体评估
${this.getOverallAssessment(Object.values(trends))}

## 建议行动
${this.getActionRecommendations(trends)}
`
  }

  private calculateTrend(current: number, previous: number, lowerIsBetter: boolean) {
    const changePercent = ((current - previous) / previous) * 100
    const isImproving = lowerIsBetter ? changePercent < 0 : changePercent > 0

    let emoji = '📊'
    let description = `变化 ${changePercent.toFixed(1)}%`

    if (Math.abs(changePercent) < 2) {
      emoji = '➡️'
      description = '保持稳定'
    } else if (isImproving) {
      emoji = '📈'
      description = `改善 ${Math.abs(changePercent).toFixed(1)}%`
    } else {
      emoji = '📉'
      description = `退化 ${Math.abs(changePercent).toFixed(1)}%`
    }

    return { emoji, description, changePercent, isImproving }
  }

  private getOverallAssessment(trends: any[]): string {
    const improving = trends.filter(t => t.isImproving).length
    const degrading = trends.filter(t => !t.isImproving && Math.abs(t.changePercent) > 2).length

    if (improving > degrading) {
      return '🚀 **整体性能呈上升趋势**，系统优化效果显著'
    } else if (degrading > improving) {
      return '⚠️ **性能出现退化趋势**，需要立即关注和优化'
    } else {
      return '📊 **性能保持稳定**，继续监控关键指标'
    }
  }

  private getActionRecommendations(trends: any): string {
    const actions = []

    if (trends.api_response_time.changePercent > 10) {
      actions.push('- 立即检查API性能瓶颈')
    }
    if (trends.concurrent_rps.changePercent < -10) {
      actions.push('- 调查并发处理能力下降原因')
    }
    if (trends.memory_usage.changePercent > 15) {
      actions.push('- 排查内存泄漏问题')
    }
    if (trends.cache_hit_rate.changePercent < -5) {
      actions.push('- 优化缓存策略配置')
    }

    return actions.length > 0 ? actions.join('\n') : '- 继续保持当前优化策略'
  }
}

/**
 * 创建默认性能优化器实例
 */
export function createPerformanceOptimizer(): PerformanceOptimizer {
  return new PerformanceOptimizer()
}
