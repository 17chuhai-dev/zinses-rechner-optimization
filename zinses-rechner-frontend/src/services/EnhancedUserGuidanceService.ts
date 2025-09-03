/**
 * 增强的用户引导服务
 * 提供完整的用户引导系统，包括智能引导、个性化推荐和进度跟踪
 */

import { ref, reactive, computed } from 'vue'
import type { GuidanceStep, GuidanceTour, UserProgress } from './UserGuidanceService'

// 智能引导配置
export interface SmartGuidanceConfig {
  userLevel: 'beginner' | 'intermediate' | 'advanced'
  preferredLearningStyle: 'visual' | 'textual' | 'interactive' | 'mixed'
  timeAvailable: number // 分钟
  specificGoals: string[]
  skipCompleted: boolean
  adaptiveSpeed: boolean
}

// 引导上下文
export interface GuidanceContext {
  currentPage: string
  userActions: string[]
  timeSpent: number
  errorsMade: number
  helpRequested: number
  lastInteraction: Date
}

// 个性化推荐
export interface PersonalizedRecommendation {
  tourId: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  estimatedBenefit: number
  prerequisites: string[]
  tags: string[]
}

/**
 * 增强的用户引导服务类
 */
export class EnhancedUserGuidanceService {
  private static instance: EnhancedUserGuidanceService

  // 智能引导状态
  public readonly smartState = reactive({
    isAnalyzing: false,
    recommendations: [] as PersonalizedRecommendation[],
    adaptiveConfig: null as SmartGuidanceConfig | null,
    context: null as GuidanceContext | null,
    learningPath: [] as string[],
    completionRate: 0,
    skillLevel: 0
  })

  // 完整的引导流程库
  private completeTours = new Map<string, GuidanceTour>()

  public static getInstance(): EnhancedUserGuidanceService {
    if (!EnhancedUserGuidanceService.instance) {
      EnhancedUserGuidanceService.instance = new EnhancedUserGuidanceService()
    }
    return EnhancedUserGuidanceService.instance
  }

  constructor() {
    this.initializeCompleteTours()
  }

  /**
   * 初始化完整的引导流程
   */
  private initializeCompleteTours(): void {
    // 1. 全面的新手入门引导
    this.completeTours.set('comprehensive-onboarding', {
      id: 'comprehensive-onboarding',
      name: 'Vollständige Einführung',
      description: 'Umfassende Einführung in alle Funktionen des Zinses-Rechners',
      category: 'onboarding',
      difficulty: 'beginner',
      estimatedTime: 15,
      steps: [
        {
          id: 'welcome-comprehensive',
          title: 'Willkommen beim Zinses-Rechner!',
          content: 'Herzlich willkommen! Ich bin Ihr persönlicher Assistent und führe Sie durch alle Funktionen unseres professionellen Finanzrechners. Diese umfassende Tour dauert etwa 15 Minuten und macht Sie zum Experten.',
          position: 'center',
          overlay: true,
          skipable: true,
          animation: 'fade',
          duration: 4000
        },
        {
          id: 'interface-overview',
          title: 'Benutzeroberfläche verstehen',
          content: 'Verschaffen Sie sich einen Überblick über die Hauptbereiche: Navigation oben, Eingabebereich links, Ergebnisse rechts und Werkzeuge unten.',
          target: 'body',
          position: 'center',
          highlight: false,
          animation: 'slide',
          duration: 3000
        },
        {
          id: 'navigation-detailed',
          title: 'Navigation im Detail',
          content: 'Die Hauptnavigation bietet Zugang zu verschiedenen Rechnern: Zinseszins, Kredite, Sparpläne, Investitionen und mehr. Jeder Rechner ist spezialisiert.',
          target: '.main-navigation',
          position: 'bottom',
          highlight: true,
          animation: 'bounce'
        },
        {
          id: 'calculator-types',
          title: 'Rechner-Typen erkunden',
          content: 'Klicken Sie durch die verschiedenen Rechner-Typen. Jeder hat spezielle Eingabefelder und Berechnungslogik.',
          target: '.calculator-selector',
          position: 'bottom',
          highlight: true,
          action: 'click',
          actionTarget: '.calculator-selector .tab-button',
          nextButton: 'Rechner erkunden'
        },
        {
          id: 'input-validation',
          title: 'Intelligente Eingabevalidierung',
          content: 'Unsere Eingabefelder validieren Ihre Daten in Echtzeit und geben hilfreiche Hinweise. Probieren Sie es aus!',
          target: '.input-field:first',
          position: 'right',
          highlight: true,
          action: 'input',
          actionTarget: '.input-field:first',
          actionValue: '1000'
        },
        {
          id: 'help-system',
          title: 'Integriertes Hilfesystem',
          content: 'Jedes Eingabefeld hat ein Hilfe-Symbol. Klicken Sie darauf für detaillierte Erklärungen und Beispiele.',
          target: '.help-icon',
          position: 'top',
          highlight: true,
          action: 'click',
          actionTarget: '.help-icon:first'
        },
        {
          id: 'mobile-optimization',
          title: 'Mobile Optimierung',
          content: 'Auf Smartphones und Tablets führt Sie ein Schritt-für-Schritt-Assistent durch die Eingabe. Perfekt für unterwegs!',
          target: '.mobile-stepper',
          position: 'top',
          highlight: true,
          skipable: true
        },
        {
          id: 'calculation-process',
          title: 'Berechnungsprozess',
          content: 'Sobald alle Pflichtfelder ausgefüllt sind, wird der Berechnen-Button aktiv. Die Berechnung erfolgt in Echtzeit.',
          target: '.calculate-button',
          position: 'top',
          highlight: true,
          action: 'click',
          actionTarget: '.calculate-button'
        },
        {
          id: 'results-interpretation',
          title: 'Ergebnisse richtig interpretieren',
          content: 'Die Ergebnisse werden in drei Bereichen dargestellt: Zusammenfassung, detaillierte Tabelle und interaktive Diagramme.',
          target: '.results-container',
          position: 'top',
          highlight: true,
          animation: 'fade'
        },
        {
          id: 'interactive-charts',
          title: 'Interaktive Diagramme',
          content: 'Bewegen Sie die Maus über die Diagramme für Details. Klicken Sie auf Legendeneinträge zum Ein-/Ausblenden.',
          target: '.chart-container',
          position: 'bottom',
          highlight: true,
          action: 'hover',
          actionTarget: '.chart-container'
        },
        {
          id: 'comparison-feature',
          title: 'Vergleichsfunktion',
          content: 'Aktivieren Sie den Vergleichsmodus, um verschiedene Szenarien nebeneinander zu analysieren.',
          target: '.comparison-toggle',
          position: 'left',
          highlight: true,
          action: 'click',
          actionTarget: '.comparison-toggle'
        },
        {
          id: 'export-comprehensive',
          title: 'Umfassende Export-Optionen',
          content: 'Exportieren Sie als PDF-Bericht, Excel-Tabelle, PNG-Bild oder SVG-Grafik. Jedes Format ist anpassbar.',
          target: '.export-dropdown',
          position: 'left',
          highlight: true,
          action: 'click',
          actionTarget: '.export-dropdown'
        },
        {
          id: 'history-management',
          title: 'Berechnungshistorie',
          content: 'Alle Berechnungen werden automatisch gespeichert. Verwalten Sie Ihre Historie und greifen Sie auf frühere Ergebnisse zu.',
          target: '.history-panel',
          position: 'bottom',
          highlight: true
        },
        {
          id: 'settings-customization',
          title: 'Einstellungen und Anpassung',
          content: 'Passen Sie die Anwendung an Ihre Bedürfnisse an: Währung, Sprache, Darstellung und mehr.',
          target: '.settings-button',
          position: 'bottom',
          highlight: true
        },
        {
          id: 'completion-comprehensive',
          title: 'Herzlichen Glückwunsch!',
          content: 'Sie sind jetzt ein Zinses-Rechner-Experte! Sie kennen alle wichtigen Funktionen und können professionelle Finanzberechnungen durchführen.',
          position: 'center',
          overlay: true,
          animation: 'bounce',
          nextButton: 'Jetzt durchstarten!'
        }
      ],
      completionReward: {
        type: 'badge',
        value: 'Zinses-Rechner Experte'
      }
    })

    // 2. Spezielle Rechner-Touren
    this.completeTours.set('compound-interest-mastery', {
      id: 'compound-interest-mastery',
      name: 'Zinseszins-Rechner Meisterklasse',
      description: 'Werden Sie zum Experten für Zinseszins-Berechnungen',
      category: 'feature',
      difficulty: 'intermediate',
      estimatedTime: 10,
      prerequisites: ['comprehensive-onboarding'],
      steps: [
        {
          id: 'compound-intro',
          title: 'Zinseszins verstehen',
          content: 'Der Zinseszins ist einer der mächtigsten Faktoren beim Vermögensaufbau. Lernen Sie, wie Sie ihn optimal nutzen.',
          position: 'center',
          overlay: true,
          animation: 'fade'
        },
        {
          id: 'basic-parameters',
          title: 'Grundparameter richtig wählen',
          content: 'Startkapital, monatliche Sparrate, Zinssatz und Laufzeit - jeder Parameter hat große Auswirkungen auf das Endergebnis.',
          target: '.compound-form',
          position: 'right',
          highlight: true
        },
        {
          id: 'interest-rate-impact',
          title: 'Zinssatz-Auswirkungen',
          content: 'Schon kleine Unterschiede beim Zinssatz haben dramatische Auswirkungen. Nutzen Sie den Schieberegler zum Experimentieren.',
          target: '.interest-rate-slider',
          position: 'top',
          highlight: true,
          action: 'input',
          actionTarget: '.interest-rate-slider'
        },
        {
          id: 'time-factor',
          title: 'Der Faktor Zeit',
          content: 'Zeit ist beim Zinseszins entscheidend. Sehen Sie, wie sich längere Laufzeiten exponentiell auswirken.',
          target: '.duration-input',
          position: 'bottom',
          highlight: true
        },
        {
          id: 'monthly-savings',
          title: 'Regelmäßiges Sparen',
          content: 'Monatliche Sparraten verstärken den Zinseszins-Effekt erheblich. Finden Sie Ihre optimale Sparrate.',
          target: '.monthly-payment-input',
          position: 'right',
          highlight: true
        },
        {
          id: 'compound-visualization',
          title: 'Zinseszins visualisiert',
          content: 'Das Diagramm zeigt deutlich den exponentiellen Verlauf. Beachten Sie den Unterschied zwischen Einzahlungen und Zinserträgen.',
          target: '.compound-chart',
          position: 'bottom',
          highlight: true
        },
        {
          id: 'scenario-comparison',
          title: 'Szenarien vergleichen',
          content: 'Vergleichen Sie verschiedene Szenarien: früh vs. spät anfangen, mehr vs. weniger sparen, höhere vs. niedrigere Zinsen.',
          target: '.scenario-comparison',
          position: 'left',
          highlight: true
        }
      ]
    })

    // 3. Export-Experte Tour
    this.completeTours.set('export-expert', {
      id: 'export-expert',
      name: 'Export-Experte werden',
      description: 'Meistern Sie alle Export-Funktionen für professionelle Berichte',
      category: 'feature',
      difficulty: 'advanced',
      estimatedTime: 8,
      prerequisites: ['comprehensive-onboarding'],
      steps: [
        {
          id: 'export-overview',
          title: 'Export-Möglichkeiten im Überblick',
          content: 'Lernen Sie alle Export-Formate kennen und wann Sie welches Format am besten verwenden.',
          target: '.export-panel',
          position: 'left',
          highlight: true
        },
        {
          id: 'pdf-reports',
          title: 'Professionelle PDF-Berichte',
          content: 'Erstellen Sie vollständige PDF-Berichte mit Ihrem Logo, Farben und Layout. Perfekt für Kunden und Präsentationen.',
          target: '.pdf-export-options',
          position: 'bottom',
          highlight: true
        },
        {
          id: 'excel-integration',
          title: 'Excel-Integration',
          content: 'Exportieren Sie Daten nach Excel für weitere Analysen. Alle Formeln und Formatierungen bleiben erhalten.',
          target: '.excel-export-button',
          position: 'top',
          highlight: true
        },
        {
          id: 'chart-customization',
          title: 'Diagramm-Anpassung',
          content: 'Passen Sie Diagramme vor dem Export an: Farben, Größe, Beschriftungen und mehr.',
          target: '.chart-customization',
          position: 'right',
          highlight: true
        },
        {
          id: 'batch-export',
          title: 'Stapel-Export',
          content: 'Exportieren Sie mehrere Berechnungen gleichzeitig. Ideal für umfangreiche Analysen.',
          target: '.batch-export',
          position: 'bottom',
          highlight: true
        }
      ]
    })

    // 4. Problemlösung und Troubleshooting
    this.completeTours.set('troubleshooting-guide', {
      id: 'troubleshooting-guide',
      name: 'Problemlösung und Tipps',
      description: 'Lösen Sie häufige Probleme und nutzen Sie versteckte Features',
      category: 'troubleshooting',
      difficulty: 'intermediate',
      estimatedTime: 6,
      steps: [
        {
          id: 'common-errors',
          title: 'Häufige Eingabefehler',
          content: 'Lernen Sie die häufigsten Eingabefehler kennen und wie Sie sie vermeiden.',
          position: 'center',
          overlay: true
        },
        {
          id: 'validation-messages',
          title: 'Validierungsmeldungen verstehen',
          content: 'Rote Felder und Fehlermeldungen helfen Ihnen bei der korrekten Eingabe. Hier erfahren Sie, was sie bedeuten.',
          target: '.validation-message',
          position: 'top',
          highlight: true
        },
        {
          id: 'performance-tips',
          title: 'Performance-Tipps',
          content: 'Bei sehr großen Berechnungen können Sie die Performance optimieren. Hier sind die besten Tipps.',
          target: '.performance-settings',
          position: 'right',
          highlight: true
        },
        {
          id: 'browser-compatibility',
          title: 'Browser-Kompatibilität',
          content: 'Der Zinses-Rechner funktioniert in allen modernen Browsern. Hier sind Tipps für optimale Kompatibilität.',
          position: 'center',
          overlay: true
        },
        {
          id: 'keyboard-shortcuts',
          title: 'Tastatur-Shortcuts',
          content: 'Arbeiten Sie effizienter mit Tastatur-Shortcuts: Strg+Enter für Berechnung, Tab für Navigation, F1 für Hilfe.',
          position: 'center',
          overlay: true
        }
      ]
    })

    // 5. Mobile Nutzung optimieren
    this.completeTours.set('mobile-optimization', {
      id: 'mobile-optimization',
      name: 'Mobile Nutzung optimieren',
      description: 'Nutzen Sie den Zinses-Rechner optimal auf Smartphone und Tablet',
      category: 'feature',
      difficulty: 'beginner',
      estimatedTime: 5,
      steps: [
        {
          id: 'mobile-interface',
          title: 'Mobile Benutzeroberfläche',
          content: 'Die mobile Version ist speziell für Touch-Bedienung optimiert. Alle Funktionen sind verfügbar.',
          position: 'center',
          overlay: true
        },
        {
          id: 'touch-gestures',
          title: 'Touch-Gesten',
          content: 'Nutzen Sie Wischen, Pinch-to-Zoom und Tap-Gesten für eine intuitive Bedienung.',
          target: '.mobile-container',
          position: 'center',
          highlight: true
        },
        {
          id: 'mobile-keyboard',
          title: 'Mobile Tastatur',
          content: 'Numerische Felder öffnen automatisch die Zahlentastatur. Nutzen Sie die Schnelleingabe-Buttons.',
          target: '.numeric-input',
          position: 'top',
          highlight: true
        },
        {
          id: 'offline-capability',
          title: 'Offline-Funktionen',
          content: 'Viele Berechnungen funktionieren auch offline. Ihre Daten werden lokal gespeichert.',
          position: 'center',
          overlay: true
        }
      ]
    })
  }

  /**
   * 智能推荐引导流程
   */
  public async getSmartRecommendations(
    userProgress: UserProgress,
    context: GuidanceContext
  ): Promise<PersonalizedRecommendation[]> {
    this.smartState.isAnalyzing = true
    
    try {
      const recommendations: PersonalizedRecommendation[] = []
      
      // 基于用户进度推荐
      if (userProgress.completedTours.length === 0) {
        recommendations.push({
          tourId: 'comprehensive-onboarding',
          reason: 'Als Neuling sollten Sie mit der umfassenden Einführung beginnen',
          priority: 'high',
          estimatedBenefit: 95,
          prerequisites: [],
          tags: ['Einsteiger', 'Grundlagen', 'Vollständig']
        })
      }
      
      // 基于用户行为推荐
      if (context.helpRequested > 3) {
        recommendations.push({
          tourId: 'troubleshooting-guide',
          reason: 'Sie haben oft Hilfe benötigt - dieser Guide hilft bei häufigen Problemen',
          priority: 'high',
          estimatedBenefit: 80,
          prerequisites: [],
          tags: ['Problemlösung', 'Tipps', 'Effizienz']
        })
      }
      
      // 基于设备类型推荐
      if (this.isMobileDevice()) {
        recommendations.push({
          tourId: 'mobile-optimization',
          reason: 'Optimieren Sie Ihre mobile Nutzung für bessere Effizienz',
          priority: 'medium',
          estimatedBenefit: 70,
          prerequisites: [],
          tags: ['Mobil', 'Touch', 'Unterwegs']
        })
      }
      
      // 基于使用频率推荐
      if (userProgress.statistics.toursCompleted >= 2) {
        recommendations.push({
          tourId: 'export-expert',
          reason: 'Als erfahrener Nutzer können Sie von erweiterten Export-Funktionen profitieren',
          priority: 'medium',
          estimatedBenefit: 85,
          prerequisites: ['comprehensive-onboarding'],
          tags: ['Fortgeschritten', 'Export', 'Professionell']
        })
      }
      
      // 按优先级和收益排序
      recommendations.sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 }
        const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority]
        if (priorityDiff !== 0) return priorityDiff
        return b.estimatedBenefit - a.estimatedBenefit
      })
      
      this.smartState.recommendations = recommendations
      return recommendations
      
    } finally {
      this.smartState.isAnalyzing = false
    }
  }

  /**
   * 创建个性化学习路径
   */
  public createLearningPath(
    userLevel: 'beginner' | 'intermediate' | 'advanced',
    goals: string[],
    timeAvailable: number
  ): string[] {
    const path: string[] = []
    
    // 基础路径
    if (userLevel === 'beginner') {
      path.push('comprehensive-onboarding')
      if (timeAvailable > 20) {
        path.push('compound-interest-mastery')
      }
    }
    
    // 中级路径
    if (userLevel === 'intermediate') {
      path.push('compound-interest-mastery')
      path.push('export-expert')
    }
    
    // 高级路径
    if (userLevel === 'advanced') {
      path.push('export-expert')
      path.push('troubleshooting-guide')
    }
    
    // 基于目标调整
    if (goals.includes('mobile')) {
      path.push('mobile-optimization')
    }
    
    this.smartState.learningPath = path
    return path
  }

  /**
   * 获取完整的引导流程
   */
  public getCompleteTour(tourId: string): GuidanceTour | undefined {
    return this.completeTours.get(tourId)
  }

  /**
   * 获取所有可用的引导流程
   */
  public getAllCompleteTours(): GuidanceTour[] {
    return Array.from(this.completeTours.values())
  }

  /**
   * 检查是否为移动设备
   */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  /**
   * 分析用户技能水平
   */
  public analyzeSkillLevel(userProgress: UserProgress): number {
    let skillLevel = 0
    
    // 基于完成的教程数量
    skillLevel += userProgress.completedTours.length * 20
    
    // 基于完成时间（更快 = 更熟练）
    if (userProgress.statistics.averageCompletionTime < 300) { // 5分钟以下
      skillLevel += 30
    } else if (userProgress.statistics.averageCompletionTime < 600) { // 10分钟以下
      skillLevel += 15
    }
    
    // 基于总步骤数
    skillLevel += Math.min(userProgress.statistics.totalSteps / 10, 30)
    
    this.smartState.skillLevel = Math.min(skillLevel, 100)
    return this.smartState.skillLevel
  }
}

// 导出单例实例
export const enhancedUserGuidanceService = EnhancedUserGuidanceService.getInstance()

// 便捷函数
export function getSmartGuidanceRecommendations(
  userProgress: UserProgress,
  context: GuidanceContext
): Promise<PersonalizedRecommendation[]> {
  return enhancedUserGuidanceService.getSmartRecommendations(userProgress, context)
}

export function createPersonalizedLearningPath(
  userLevel: 'beginner' | 'intermediate' | 'advanced',
  goals: string[],
  timeAvailable: number
): string[] {
  return enhancedUserGuidanceService.createLearningPath(userLevel, goals, timeAvailable)
}
