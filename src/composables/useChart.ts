/**
 * Chart.js配置和工具函数
 * 专为德国金融数据可视化优化
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type ChartData
} from 'chart.js'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// 德国金融图表色彩主题
export const chartColors = {
  primary: '#3b82f6',
  primaryLight: '#93c5fd',
  success: '#22c55e',
  successLight: '#86efac',
  warning: '#f59e0b',
  warningLight: '#fcd34d',
  gray: '#6b7280',
  grayLight: '#d1d5db'
}

/**
 * 获取金融图表的基础配置
 */
export function useFinancialChart() {
  
  /**
   * 基础图表选项配置
   */
  const getBaseChartOptions = (): ChartOptions => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            family: 'Inter, sans-serif',
            size: 12
          },
          color: '#374151',
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          family: 'Inter, sans-serif',
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          family: 'Inter, sans-serif',
          size: 13
        },
        callbacks: {
          title: (context) => {
            return `Jahr ${context[0].label}`
          },
          label: (context) => {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            return `${label}: ${formatCurrency(value)}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'Inter, sans-serif',
            size: 11
          },
          color: '#6b7280'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f4f6',
          drawBorder: false
        },
        ticks: {
          font: {
            family: 'Inter, sans-serif',
            size: 11
          },
          color: '#6b7280',
          callback: function(value) {
            return formatCurrency(Number(value))
          }
        }
      }
    }
  })

  /**
   * 线性图表配置（用于复利增长趋势）
   */
  const getLineChartOptions = (): ChartOptions<'line'> => ({
    ...getBaseChartOptions(),
    elements: {
      line: {
        tension: 0.4, // 平滑曲线
        borderWidth: 3
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
        backgroundColor: '#ffffff'
      }
    }
  })

  /**
   * 面积图表配置（用于资产构成展示）
   */
  const getAreaChartOptions = (): ChartOptions<'line'> => ({
    ...getLineChartOptions(),
    plugins: {
      ...getLineChartOptions().plugins,
      filler: {
        propagate: false
      }
    },
    scales: {
      ...getLineChartOptions().scales,
      y: {
        ...getLineChartOptions().scales?.y,
        stacked: true
      }
    }
  })

  /**
   * 柱状图配置（用于年度对比）
   */
  const getBarChartOptions = (): ChartOptions<'bar'> => ({
    ...getBaseChartOptions(),
    elements: {
      bar: {
        borderRadius: 4,
        borderSkipped: false
      }
    }
  })

  /**
   * 移动端图表配置
   */
  const getMobileChartOptions = (baseOptions: ChartOptions): ChartOptions => ({
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      legend: {
        ...baseOptions.plugins?.legend,
        labels: {
          ...baseOptions.plugins?.legend?.labels,
          font: {
            family: 'Inter, sans-serif',
            size: 10
          },
          padding: 15
        }
      },
      tooltip: {
        ...baseOptions.plugins?.tooltip,
        titleFont: {
          family: 'Inter, sans-serif',
          size: 12,
          weight: 'bold'
        },
        bodyFont: {
          family: 'Inter, sans-serif',
          size: 11
        }
      }
    },
    scales: {
      ...baseOptions.scales,
      x: {
        ...baseOptions.scales?.x,
        ticks: {
          ...baseOptions.scales?.x?.ticks,
          maxTicksLimit: 6,
          font: {
            family: 'Inter, sans-serif',
            size: 9
          }
        }
      },
      y: {
        ...baseOptions.scales?.y,
        ticks: {
          ...baseOptions.scales?.y?.ticks,
          maxTicksLimit: 5,
          font: {
            family: 'Inter, sans-serif',
            size: 9
          }
        }
      }
    }
  })

  return {
    getBaseChartOptions,
    getLineChartOptions,
    getAreaChartOptions,
    getBarChartOptions,
    getMobileChartOptions,
    chartColors
  }
}
