/**
 * 德语本地化文案
 * 专为德国用户设计的复利计算器文案
 */

export default {
  // 应用基础信息
  app: {
    title: 'Zinseszins-Rechner',
    subtitle: 'Der transparente Zinseszins-Rechner für deutsche Sparer',
    description: 'Berechnen Sie sofort und kostenlos, wie Ihr Kapital mit Zinseszins wächst. Vollständig transparent, DSGVO-konform.',
    version: 'Version 1.0.0'
  },

  // 导航和页面标题
  navigation: {
    home: 'Startseite',
    calculator: 'Rechner',
    guide: 'Ratgeber',
    about: 'Über uns',
    contact: 'Kontakt',
    privacy: 'Datenschutz',
    imprint: 'Impressum'
  },

  // 计算器表单
  calculator: {
    title: 'Zinseszins-Rechner',
    subtitle: 'Berechnen Sie Ihre Kapitalentwicklung',
    
    // 表单字段
    form: {
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
      },
      compoundFrequency: {
        label: 'Zinszahlung',
        monthly: 'Monatlich',
        quarterly: 'Vierteljährlich',
        yearly: 'Jährlich'
      }
    },

    // 按钮
    buttons: {
      calculate: 'Jetzt berechnen',
      calculating: 'Berechnung läuft...',
      reset: 'Zurücksetzen',
      export: 'Exportieren',
      print: 'Drucken'
    },

    // 结果显示
    results: {
      title: 'Ihre Berechnung',
      finalAmount: 'Endkapital',
      totalContributions: 'Eingezahlt',
      totalInterest: 'Zinserträge',
      annualReturn: 'Durchschnittliche jährliche Rendite',
      totalReturn: 'Gesamtrendite',
      
      // 洞察提示
      insights: {
        title: '💡 Wichtige Erkenntnisse',
        growth: 'Ihr Geld hat sich in {years} Jahren um {percentage} vermehrt',
        interestShare: 'Die Zinserträge machen {percentage} Ihres Endkapitals aus',
        monthlyContribution: 'Durch regelmäßiges Sparen haben Sie zusätzlich {amount} eingezahlt'
      }
    },

    // 空状态
    emptyState: {
      title: 'Bereit für Ihre Berechnung',
      description: 'Geben Sie Ihre Daten ein und klicken Sie auf "Jetzt berechnen", um Ihre Zinserträge zu sehen.'
    }
  },

  // 图表和可视化
  charts: {
    title: 'Vermögensentwicklung über {years} Jahre',
    types: {
      line: 'Linie',
      area: 'Fläche',
      bar: 'Balken'
    },
    datasets: {
      totalWealth: 'Gesamtvermögen',
      contributions: 'Eingezahltes Kapital',
      interest: 'Zinserträge',
      yearlyInterest: 'Jährliche Zinserträge',
      yearlyContributions: 'Jährliche Einzahlungen'
    },
    summary: {
      averageGrowth: 'Durchschnittliches Wachstum',
      compoundEffect: 'Zinseszins-Effekt',
      totalReturn: 'Gesamtrendite'
    }
  },

  // 年度明细表格
  table: {
    title: 'Jährliche Aufschlüsselung',
    columns: {
      year: 'Jahr',
      startAmount: 'Startkapital',
      contributions: 'Einzahlungen',
      interest: 'Zinserträge',
      endAmount: 'Endkapital',
      growth: 'Wachstum'
    },
    controls: {
      export: 'CSV Export',
      compact: 'Kompaktansicht',
      detailed: 'Detailansicht'
    },
    summary: {
      totalContributions: 'Gesamte Einzahlungen',
      totalInterest: 'Gesamte Zinserträge',
      averageGrowth: 'Durchschn. Wachstum',
      bestYear: 'Beste Jahr'
    }
  },

  // 错误消息
  errors: {
    title: 'Berechnungsfehler',
    network: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.',
    calculation: 'Fehler bei der Berechnung. Bitte versuchen Sie es erneut.',
    validation: {
      required: 'Dieses Feld ist erforderlich',
      min: 'Der Wert muss mindestens {min} betragen',
      max: 'Der Wert darf höchstens {max} betragen',
      range: 'Der Wert muss zwischen {min} und {max} liegen'
    },
    fields: {
      principal: 'Das Startkapital muss zwischen 1€ und 10.000.000€ liegen.',
      monthlyPayment: 'Die monatliche Sparrate muss zwischen 0€ und 50.000€ liegen.',
      annualRate: 'Der Zinssatz muss zwischen 0% und 20% liegen.',
      years: 'Die Laufzeit muss zwischen 1 und 50 Jahren liegen.'
    }
  },

  // 加载状态
  loading: {
    calculating: 'Berechnung läuft...',
    loading: 'Wird geladen...',
    exporting: 'Export wird erstellt...',
    saving: 'Wird gespeichert...'
  },

  // 价值主张
  valueProposition: {
    speed: {
      title: 'Geschwindigkeit',
      description: 'Ergebnisse in unter 2 Sekunden. Keine Anmeldung, keine Wartezeit.'
    },
    transparency: {
      title: 'Transparenz',
      description: 'Jede Berechnung mit vollständiger Formel-Erklärung. Keine Black Box.'
    },
    localization: {
      title: 'Deutsche Anpassung',
      description: 'Berücksichtigt deutsche Steueraspekte und lokale Bankkonditionen.'
    }
  },

  // 公式说明
  formula: {
    title: 'So berechnen wir Ihren Zinseszins',
    description: 'Unsere Berechnung basiert auf der mathematisch korrekten Zinseszins-Formel:',
    parameters: {
      A: 'Endkapital nach t Jahren',
      P: 'Startkapital (Principal)',
      r: 'Jährlicher Zinssatz (als Dezimalzahl)',
      n: 'Anzahl der Zinsperioden pro Jahr',
      t: 'Anlagezeitraum in Jahren',
      PMT: 'Regelmäßige Zahlung (monatlich)'
    },
    example: {
      title: 'Beispielrechnung:',
      description: 'Bei 10.000€ Startkapital, 4% Zinssatz und 10 Jahren:',
      steps: [
        'A = 10.000 × (1 + 0,04)¹⁰',
        'A = 10.000 × 1,48024',
        'A = 14.802,44€'
      ]
    }
  },

  // 导出功能
  export: {
    csv: 'Als CSV exportieren',
    pdf: 'PDF-Bericht erstellen',
    excel: 'Excel-Datei erstellen',
    image: 'Diagramm als Bild speichern',
    filename: {
      csv: 'zinseszins-berechnung-{date}.csv',
      pdf: 'zinseszins-bericht-{date}.pdf',
      excel: 'zinseszins-aufschluesselung-{date}.xlsx'
    }
  },

  // 通用文本
  common: {
    yes: 'Ja',
    no: 'Nein',
    ok: 'OK',
    cancel: 'Abbrechen',
    close: 'Schließen',
    save: 'Speichern',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    view: 'Anzeigen',
    more: 'Mehr',
    less: 'Weniger',
    next: 'Weiter',
    previous: 'Zurück',
    finish: 'Fertig',
    retry: 'Erneut versuchen',
    dismiss: 'Verwerfen'
  },

  // 时间和日期
  time: {
    year: 'Jahr | Jahre',
    month: 'Monat | Monate',
    day: 'Tag | Tage',
    hour: 'Stunde | Stunden',
    minute: 'Minute | Minuten',
    second: 'Sekunde | Sekunden'
  },

  // 货币和数字
  currency: {
    euro: 'Euro',
    symbol: '€',
    thousand: 'Tausend',
    million: 'Million',
    billion: 'Milliarde'
  }
}
