# Zinses Rechner Mobile App

Eine professionelle React Native Anwendung für Zinsberechnungen und Finanzplanung.

## 📱 Funktionen

### Kernfunktionen
- **Zinseszinsrechner**: Berechnung von Kapitalwachstum mit Zinseszinseffekt
- **Hypothekenrechner**: Immobilienfinanzierung und Tilgungspläne
- **Kreditrechner**: Kreditkosten und Rückzahlungspläne
- **Investmentrechner**: Anlagestrategien und Portfolio-Analyse

### Mobile-optimierte Features
- **Native Performance**: Optimiert für iOS und Android
- **Offline-Funktionalität**: Berechnungen ohne Internetverbindung
- **Touch-optimierte UI**: Intuitive Bedienung auf Mobilgeräten
- **Biometrische Authentifizierung**: Sicherer Zugang mit Fingerabdruck/Face ID
- **Push-Benachrichtigungen**: Erinnerungen und Updates
- **Dunkler Modus**: Augenschonende Darstellung
- **Mehrsprachigkeit**: Deutsch als Hauptsprache

### Datenvisualisierung
- **Interaktive Diagramme**: Linien-, Kreis- und Balkendiagramme
- **Responsive Charts**: Optimiert für verschiedene Bildschirmgrößen
- **Animationen**: Flüssige Übergänge und Feedback
- **Export-Funktionen**: Teilen von Ergebnissen und Diagrammen

## 🚀 Installation

### Voraussetzungen
- Node.js 18+
- React Native CLI
- Android Studio (für Android)
- Xcode (für iOS, nur macOS)

### Setup
```bash
# Repository klonen
git clone https://github.com/zinses-rechner/mobile-app.git
cd zinses-rechner-mobile

# Abhängigkeiten installieren
npm install

# iOS Pods installieren (nur macOS)
cd ios && pod install && cd ..

# Metro Server starten
npm start
```

### Entwicklung
```bash
# Android
npm run android

# iOS (nur macOS)
npm run ios

# Tests ausführen
npm test

# Linting
npm run lint
```

## 🏗️ Architektur

### Technologie-Stack
- **React Native 0.73**: Cross-platform Framework
- **TypeScript**: Typsichere Entwicklung
- **Redux Toolkit**: State Management
- **React Navigation 6**: Navigation System
- **React Native Paper**: Material Design Komponenten
- **React Native Chart Kit**: Datenvisualisierung
- **React Native Reanimated**: Performante Animationen

### Projektstruktur
```
src/
├── components/          # Wiederverwendbare Komponenten
│   ├── common/         # Allgemeine Komponenten
│   ├── calculators/    # Rechner-spezifische Komponenten
│   └── charts/         # Diagramm-Komponenten
├── screens/            # Bildschirm-Komponenten
│   ├── calculators/    # Rechner-Bildschirme
│   └── settings/       # Einstellungen
├── navigation/         # Navigation-Konfiguration
├── store/             # Redux Store und Slices
├── services/          # API und Business Logic
├── utils/             # Hilfsfunktionen
├── hooks/             # Custom React Hooks
├── types/             # TypeScript Definitionen
└── theme/             # Design System
```

### State Management
```typescript
// Redux Store Structure
{
  auth: {
    user: User | null,
    isAuthenticated: boolean,
    biometricEnabled: boolean
  },
  calculations: {
    history: Calculation[],
    favorites: string[],
    isLoading: boolean
  },
  settings: {
    theme: 'light' | 'dark' | 'system',
    currency: 'EUR' | 'USD' | 'GBP',
    language: 'de',
    notifications: NotificationSettings
  },
  market: {
    data: MarketData,
    lastUpdated: string
  }
}
```

## 📊 Rechner-Module

### 1. Zinseszinsrechner
- Anfangskapital und regelmäßige Einzahlungen
- Variable Zinssätze und Zinseszins-Häufigkeit
- Grafische Darstellung des Kapitalwachstums
- Szenario-Vergleiche

### 2. Hypothekenrechner
- Kaufpreis, Eigenkapital und Finanzierungsbedarf
- Zinssatz, Tilgung und Sondertilgungen
- Tilgungsplan mit detaillierter Aufschlüsselung
- Vergleich verschiedener Finanzierungsoptionen

### 3. Kreditrechner
- Kreditbetrag, Laufzeit und Zinssatz
- Monatliche Rate und Gesamtkosten
- Vorzeitige Rückzahlung und Sondertilgungen
- Kreditvergleich verschiedener Anbieter

### 4. Investmentrechner
- Portfolio-Zusammensetzung und Risikoprofil
- Historische Performance-Analyse
- Monte-Carlo-Simulationen
- Rebalancing-Strategien

## 🎨 Design System

### Farbschema
```typescript
// Light Theme
const lightTheme = {
  primary: '#1976D2',
  secondary: '#03DAC6',
  surface: '#FFFFFF',
  background: '#F5F5F5',
  error: '#B00020',
  success: '#4CAF50',
  warning: '#FF9800'
}

// Dark Theme
const darkTheme = {
  primary: '#90CAF9',
  secondary: '#03DAC6',
  surface: '#121212',
  background: '#000000',
  error: '#CF6679',
  success: '#81C784',
  warning: '#FFB74D'
}
```

### Typografie
- **Überschriften**: Roboto Bold, 24-32px
- **Untertitel**: Roboto Medium, 18-20px
- **Fließtext**: Roboto Regular, 14-16px
- **Beschriftungen**: Roboto Regular, 12-14px

### Komponenten
- **Cards**: Abgerundete Ecken, Schatten, Padding 16px
- **Buttons**: Material Design 3 Stil
- **Inputs**: Outlined Style mit Icons
- **Charts**: Responsive und interaktiv

## 🔧 Konfiguration

### Umgebungsvariablen
```bash
# .env
API_BASE_URL=https://api.zinses-rechner.de
MARKET_DATA_API_KEY=your_api_key
ANALYTICS_TRACKING_ID=your_tracking_id
SENTRY_DSN=your_sentry_dsn
```

### Build-Konfiguration
```javascript
// metro.config.js
module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
}
```

## 📱 Platform-spezifische Features

### iOS
- **Face ID / Touch ID**: Biometrische Authentifizierung
- **Haptic Feedback**: Taktiles Feedback bei Interaktionen
- **Dynamic Type**: Unterstützung für Systemschriftgrößen
- **Dark Mode**: Automatische Anpassung an Systemeinstellungen

### Android
- **Fingerprint**: Biometrische Authentifizierung
- **Material You**: Dynamic Color (Android 12+)
- **Adaptive Icons**: Verschiedene Icon-Formen
- **Edge-to-Edge**: Vollbild-Layout

## 🧪 Testing

### Test-Strategien
- **Unit Tests**: Jest für Business Logic
- **Component Tests**: React Native Testing Library
- **Integration Tests**: Detox für E2E Tests
- **Performance Tests**: Flipper Integration

### Test-Befehle
```bash
# Unit Tests
npm test

# Component Tests
npm run test:components

# E2E Tests
npm run test:e2e:ios
npm run test:e2e:android

# Coverage Report
npm run test:coverage
```

## 🚀 Deployment

### Android
```bash
# Debug Build
npm run build:android:debug

# Release Build
npm run build:android:release

# Upload to Play Store
npm run deploy:android
```

### iOS
```bash
# Debug Build
npm run build:ios:debug

# Release Build
npm run build:ios:release

# Upload to App Store
npm run deploy:ios
```

### Code Push (Hot Updates)
```bash
# Staging Deployment
npm run codepush:staging

# Production Deployment
npm run codepush:production
```

## 📈 Performance

### Optimierungen
- **Bundle Splitting**: Lazy Loading von Screens
- **Image Optimization**: WebP Format, Caching
- **Memory Management**: Automatische Garbage Collection
- **Network Optimization**: Request Batching, Caching

### Monitoring
- **Crashlytics**: Crash Reporting
- **Performance Monitoring**: App-Start-Zeit, Frame-Rate
- **Analytics**: User Behavior Tracking
- **Error Tracking**: Sentry Integration

## 🔒 Sicherheit

### Datenschutz
- **Lokale Verschlüsselung**: Sensitive Daten verschlüsselt
- **Biometrische Authentifizierung**: Sicherer Zugang
- **Certificate Pinning**: Schutz vor Man-in-the-Middle
- **GDPR Compliance**: Datenschutz-konforme Implementierung

### Best Practices
- **Code Obfuscation**: Schutz vor Reverse Engineering
- **Root/Jailbreak Detection**: Sicherheitsüberprüfungen
- **API Security**: Token-basierte Authentifizierung
- **Data Validation**: Input-Validierung und Sanitization

## 🤝 Contributing

### Entwicklungsrichtlinien
1. **Code Style**: ESLint und Prettier Konfiguration befolgen
2. **Commit Messages**: Conventional Commits verwenden
3. **Branch Strategy**: GitFlow für Feature-Entwicklung
4. **Pull Requests**: Code Review vor Merge erforderlich

### Setup für Contributors
```bash
# Fork des Repositories erstellen
git clone https://github.com/your-username/zinses-rechner-mobile.git

# Development Branch erstellen
git checkout -b feature/your-feature-name

# Änderungen committen
git commit -m "feat: add new calculator feature"

# Pull Request erstellen
git push origin feature/your-feature-name
```

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) Datei für Details.

## 📞 Support

- **Email**: support@zinses-rechner.de
- **GitHub Issues**: [Issues](https://github.com/zinses-rechner/mobile-app/issues)
- **Documentation**: [Wiki](https://github.com/zinses-rechner/mobile-app/wiki)

---

**Entwickelt mit ❤️ für bessere Finanzplanung**
