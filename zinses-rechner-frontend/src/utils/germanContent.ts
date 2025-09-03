/**
 * 德语内容配置
 * 包含网站的所有德语文本内容
 */

export const MAIN_CONTENT = {
  title: "Zinseszins-Rechner",
  subtitle: "Berechnen Sie Ihre Kapitalentwicklung mit unserem kostenlosen Zinseszins-Rechner",
  description: "Planen Sie Ihre finanzielle Zukunft mit unserem präzisen Zinseszins-Rechner. Berechnen Sie, wie sich Ihr Kapital über die Jahre entwickelt.",
  
  // 表单标签
  form: {
    startCapital: "Startkapital (€)",
    monthlyPayment: "Monatliche Einzahlung (€)",
    interestRate: "Zinssatz (%)",
    duration: "Laufzeit (Jahre)",
    compoundFrequency: "Zinszusammensetzung",
    calculate: "Jetzt berechnen",
    reset: "Zurücksetzen"
  },
  
  // 复利频率选项
  compoundFrequencies: {
    monthly: "Monatlich",
    quarterly: "Vierteljährlich", 
    yearly: "Jährlich"
  },
  
  // 结果标签
  results: {
    title: "Ihre Berechnung",
    finalAmount: "Endkapital",
    totalContributions: "Gesamte Einzahlungen",
    totalInterest: "Zinserträge",
    effectiveReturn: "Effektive Rendite"
  },
  
  // 错误消息
  errors: {
    invalidInput: "Bitte geben Sie gültige Werte ein",
    calculationFailed: "Berechnung fehlgeschlagen. Bitte versuchen Sie es erneut.",
    networkError: "Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung."
  }
}

export const VALUE_PROPOSITIONS = [
  {
    title: "Präzise Berechnung",
    description: "Exakte Zinseszins-Berechnung mit verschiedenen Zinszusammensetzungen",
    icon: "calculator"
  },
  {
    title: "Kostenlos & Sicher",
    description: "Vollständig kostenlos und ohne Registrierung. Ihre Daten bleiben privat.",
    icon: "shield"
  },
  {
    title: "Sofortige Ergebnisse",
    description: "Erhalten Sie Ihre Berechnungsergebnisse in Sekundenschnelle",
    icon: "lightning"
  },
  {
    title: "Detaillierte Aufschlüsselung",
    description: "Jahresweise Aufschlüsselung Ihrer Kapitalentwicklung",
    icon: "chart"
  }
]

export const SEO_CONTENT = {
  title: "Zinseszins-Rechner | Kostenlos Kapitalentwicklung berechnen",
  description: "Berechnen Sie mit unserem kostenlosen Zinseszins-Rechner, wie sich Ihr Kapital über die Jahre entwickelt. Präzise Berechnung mit monatlichen Einzahlungen.",
  keywords: "Zinseszins, Rechner, Kapitalentwicklung, Zinsen, Sparen, Geldanlage, kostenlos"
}

export const NAVIGATION = {
  home: "Startseite",
  calculator: "Rechner",
  about: "Über uns",
  contact: "Kontakt",
  privacy: "Datenschutz",
  imprint: "Impressum"
}

export const FOOTER_CONTENT = {
  copyright: "© 2025 Zinseszins-Rechner.de. Alle Rechte vorbehalten.",
  disclaimer: "Alle Berechnungen sind unverbindlich und dienen nur zur Orientierung.",
  links: {
    privacy: "Datenschutz",
    imprint: "Impressum",
    contact: "Kontakt"
  }
}
