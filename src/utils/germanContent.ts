/**
 * 德语内容和文案常量
 * 专为德国用户优化的复利计算器文案
 */

// 主要标题和描述
export const MAIN_CONTENT = {
  title: 'Der transparente Zinseszins-Rechner für deutsche Sparer',
  subtitle: 'Berechnen Sie sofort und kostenlos, wie Ihr Kapital mit Zinseszins wächst',
  description: 'Vollständig transparent, DSGVO-konform und speziell für deutsche Steuergesetze optimiert.'
}

// 价值主张
export const VALUE_PROPOSITIONS = [
  {
    icon: '⚡',
    title: 'Geschwindigkeit',
    description: 'Ergebnisse in unter 2 Sekunden. Keine Anmeldung, keine Wartezeit.'
  },
  {
    icon: '🔍',
    title: 'Transparenz',
    description: 'Jede Berechnung mit vollständiger Formel-Erklärung. Keine Black Box.'
  },
  {
    icon: '🇩🇪',
    title: 'Deutsche Anpassung',
    description: 'Berücksichtigt deutsche Steueraspekte und lokale Bankkonditionen.'
  }
]

// 表单标签和帮助文本
export const FORM_LABELS = {
  principal: {
    label: 'Startkapital (€)',
    placeholder: '10.000',
    help: 'Ihr anfängliches Investitionskapital'
  },
  monthlyPayment: {
    label: 'Monatliche Sparrate (€)',
    placeholder: '500',
    help: 'Optional: Regelmäßige monatliche Einzahlungen'
  },
  annualRate: {
    label: 'Zinssatz (%)',
    placeholder: '4,0',
    help: 'Erwarteter jährlicher Zinssatz'
  },
  years: {
    label: 'Laufzeit: {years} Jahre',
    help: 'Anlagezeitraum in Jahren'
  }
}

// 按钮文本
export const BUTTONS = {
  calculate: 'Jetzt berechnen',
  calculating: 'Berechnung läuft...',
  reset: 'Zurücksetzen',
  exportCSV: 'Als CSV exportieren',
  exportPDF: 'PDF-Bericht erstellen',
  compact: 'Kompaktansicht',
  detailed: 'Detailansicht'
}

// 结果标签
export const RESULT_LABELS = {
  finalAmount: 'Endkapital',
  totalContributions: 'Eingezahlt',
  totalInterest: 'Zinserträge',
  annualReturn: 'Durchschnittliche jährliche Rendite',
  totalReturn: 'Gesamtrendite'
}

// 图表标签
export const CHART_LABELS = {
  title: 'Vermögensentwicklung über {years} Jahre',
  totalWealth: 'Gesamtvermögen',
  contributions: 'Eingezahltes Kapital',
  interest: 'Zinserträge',
  yearlyInterest: 'Jährliche Zinserträge',
  yearlyContributions: 'Jährliche Einzahlungen',
  averageGrowth: 'Durchschnittliches Wachstum',
  compoundEffect: 'Zinseszins-Effekt'
}

// 表格标题
export const TABLE_HEADERS = {
  year: 'Jahr',
  startAmount: 'Startkapital',
  contributions: 'Einzahlungen',
  interest: 'Zinserträge',
  endAmount: 'Endkapital',
  growth: 'Wachstum'
}

// 错误消息
export const ERROR_MESSAGES = {
  networkError: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.',
  calculationError: 'Fehler bei der Berechnung. Bitte versuchen Sie es erneut.',
  unknownError: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
  
  validation: {
    principal: 'Das Startkapital muss zwischen 1€ und 10.000.000€ liegen.',
    monthlyPayment: 'Die monatliche Sparrate muss zwischen 0€ und 50.000€ liegen.',
    annualRate: 'Der Zinssatz muss zwischen 0% und 20% liegen.',
    years: 'Die Laufzeit muss zwischen 1 und 50 Jahren liegen.'
  }
}

// 洞察提示
export const INSIGHTS = {
  title: '💡 Wichtige Erkenntnisse',
  growth: 'Ihr Geld hat sich in {years} Jahren um {percentage} vermehrt',
  interestShare: 'Die Zinserträge machen {percentage} Ihres Endkapitals aus',
  monthlyContribution: 'Durch regelmäßiges Sparen haben Sie zusätzlich {amount} eingezahlt'
}

// 空状态提示
export const EMPTY_STATE = {
  title: 'Bereit für Ihre Berechnung',
  description: 'Geben Sie Ihre Daten ein und klicken Sie auf "Jetzt berechnen", um Ihre Zinserträge zu sehen.'
}

// 德国金融术语
export const FINANCIAL_TERMS = {
  abgeltungssteuer: 'Abgeltungssteuer',
  solidaritaetszuschlag: 'Solidaritätszuschlag',
  kirchensteuer: 'Kirchensteuer',
  sparerpauschbetrag: 'Sparerpauschbetrag',
  freistellungsauftrag: 'Freistellungsauftrag',
  kapitalertragsteuer: 'Kapitalertragsteuer'
}

// 工具函数：替换占位符
export function replacePlaceholders(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return values[key]?.toString() || match
  })
}
