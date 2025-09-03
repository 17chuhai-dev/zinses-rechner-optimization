/**
 * 智能结果解释系统
 * 根据计算结果生成个性化的德语解释和建议
 */

import { computed, type Ref } from 'vue'
import type { CalculationResult, CalculatorForm } from '@/types/calculator'

interface ResultInsight {
  type: 'success' | 'warning' | 'info' | 'tip'
  icon: string
  title: string
  message: string
  priority: number
}

interface ResultExplanation {
  summary: string
  keyMetrics: {
    totalReturn: number
    annualReturn: number
    inflationAdjusted?: number
  }
  insights: ResultInsight[]
  recommendations: string[]
  riskFactors: string[]
}

export function useResultExplanation(
  result: Ref<CalculationResult | null>,
  form: Ref<CalculatorForm>
) {

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100)
  }

  const generateInsights = (result: CalculationResult, form: CalculatorForm): ResultInsight[] => {
    const insights: ResultInsight[] = []
    const totalReturn = (((result.finalAmount || 0) - (result.totalContributions || 0)) / Math.max(result.totalContributions || 1, 1)) * 100
    const monthlyContribution = form.monthlyPayment || 0

    // 收益率分析
    if (totalReturn > 150) {
      insights.push({
        type: 'success',
        icon: '🎉',
        title: 'Ausgezeichnete Rendite!',
        message: `Ihr Kapital hat sich mehr als verdoppelt. Das ist eine hervorragende Leistung über ${form.years} Jahre.`,
        priority: 1
      })
    } else if (totalReturn > 50) {
      insights.push({
        type: 'success',
        icon: '📈',
        title: 'Solide Kapitalentwicklung',
        message: `Mit ${formatPercentage(totalReturn)} Gesamtrendite liegen Sie über dem langfristigen Durchschnitt.`,
        priority: 2
      })
    } else if (totalReturn < 20) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Niedrige Rendite',
        message: 'Bei dieser Rendite sollten Sie alternative Anlageformen in Betracht ziehen.',
        priority: 1
      })
    }

    // Zinseszinseffekt-Analyse
    const simpleInterest = form.principal * (form.annualRate / 100) * form.years
    const compoundBonus = (result.totalInterest || 0) - simpleInterest
    if (compoundBonus > 1000) {
      insights.push({
        type: 'info',
        icon: '🔄',
        title: 'Zinseszinseffekt wirkt!',
        message: `Der Zinseszinseffekt bringt Ihnen zusätzlich ${formatCurrency(compoundBonus)} gegenüber einfachen Zinsen.`,
        priority: 2
      })
    }

    // Sparrate-Analyse
    if (monthlyContribution > 0) {
      const contributionRatio = (monthlyContribution * 12) / form.principal
      if (contributionRatio > 0.5) {
        insights.push({
          type: 'tip',
          icon: '💡',
          title: 'Hohe Sparrate',
          message: 'Ihre monatlichen Einzahlungen sind der Haupttreiber Ihres Vermögenswachstums.',
          priority: 3
        })
      }
    }

    // Zeitfaktor-Analyse
    if (form.years >= 20) {
      insights.push({
        type: 'info',
        icon: '⏰',
        title: 'Zeit ist Ihr Freund',
        message: 'Langfristige Anlagen profitieren maximal vom Zinseszinseffekt. Bleiben Sie dabei!',
        priority: 3
      })
    } else if (form.years < 5) {
      insights.push({
        type: 'warning',
        icon: '⏱️',
        title: 'Kurze Anlagedauer',
        message: 'Bei kurzen Anlagezeiträumen ist der Zinseszinseffekt noch begrenzt.',
        priority: 2
      })
    }

    // Inflationswarnung
    const assumedInflation = 2.0 // 2% jährliche Inflation
    const realReturn = form.annualRate - assumedInflation
    if (realReturn < 1) {
      insights.push({
        type: 'warning',
        icon: '📉',
        title: 'Inflationsrisiko beachten',
        message: `Bei 2% Inflation beträgt Ihre reale Rendite nur etwa ${formatPercentage(realReturn)}.`,
        priority: 2
      })
    }

    return insights.sort((a, b) => a.priority - b.priority)
  }

  const generateRecommendations = (result: CalculationResult, form: CalculatorForm): string[] => {
    const recommendations: string[] = []
    const totalReturn = (((result.finalAmount || 0) - (result.totalContributions || 0)) / Math.max(result.totalContributions || 1, 1)) * 100

    if (form.annualRate < 3) {
      recommendations.push('Prüfen Sie ETFs oder Aktienfonds für höhere Renditen bei längeren Anlagezeiträumen.')
    }

    if (form.years < 10 && form.monthlyPayment === 0) {
      recommendations.push('Regelmäßige Einzahlungen verstärken den Zinseszinseffekt erheblich.')
    }

    if (totalReturn > 100 && form.years > 15) {
      recommendations.push('Denken Sie an die Diversifikation Ihres Portfolios, um Risiken zu streuen.')
    }

    if (form.principal > 50000) {
      recommendations.push('Bei größeren Beträgen sollten Sie professionelle Finanzberatung in Anspruch nehmen.')
    }

    recommendations.push('Berücksichtigen Sie die deutsche Abgeltungssteuer von 25% auf Kapitalerträge.')

    return recommendations
  }

  const generateRiskFactors = (form: CalculatorForm): string[] => {
    const risks: string[] = []

    if (form.annualRate > 8) {
      risks.push('Hohe Renditen sind meist mit höheren Risiken verbunden.')
    }

    if (form.years > 20) {
      risks.push('Langfristige Prognosen unterliegen größeren Unsicherheiten.')
    }

    risks.push('Inflation kann die reale Kaufkraft Ihrer Erträge reduzieren.')
    risks.push('Zinssätze können sich über die Zeit ändern.')
    risks.push('Diese Berechnung berücksichtigt keine Gebühren oder Steuern.')

    return risks
  }

  const explanation = computed((): ResultExplanation | null => {
    if (!result.value) return null

    const totalReturn = (((result.value.finalAmount || 0) - (result.value.totalContributions || 0)) / Math.max(result.value.totalContributions || 1, 1)) * 100
    const annualReturn = result.value.annualReturn || 0

    // Inflationsbereinigte Rendite (vereinfacht)
    const assumedInflation = 2.0
    const inflationAdjusted = annualReturn - assumedInflation

    return {
      summary: `Nach ${form.value.years} Jahren haben Sie ${formatCurrency(result.value.finalAmount || 0)} erreicht. Das entspricht einem Gewinn von ${formatCurrency(result.value.totalInterest || 0)} (${formatPercentage(totalReturn)}).`,
      keyMetrics: {
        totalReturn,
        annualReturn,
        inflationAdjusted
      },
      insights: generateInsights(result.value, form.value),
      recommendations: generateRecommendations(result.value, form.value),
      riskFactors: generateRiskFactors(form.value)
    }
  })

  const hasHighReturn = computed(() => {
    return explanation.value && explanation.value.keyMetrics.totalReturn > 100
  })

  const hasLowReturn = computed(() => {
    return explanation.value && explanation.value.keyMetrics.totalReturn < 20
  })

  const isLongTerm = computed(() => {
    return form.value.years >= 15
  })

  return {
    explanation,
    hasHighReturn,
    hasLowReturn,
    isLongTerm,
    formatCurrency,
    formatPercentage
  }
}
