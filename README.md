# Zinses-Rechner - Der transparente Zinseszins-Rechner

[![Deploy Status](https://img.shields.io/badge/deploy-success-brightgreen)](https://zinses-rechner.de)
[![Security Scan](https://img.shields.io/badge/security-verified-green)](https://github.com/zinses-rechner/security-reports)
[![Performance](https://img.shields.io/badge/lighthouse-95%2B-brightgreen)](https://pagespeed.web.dev/analysis/https-zinses-rechner-de)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **Der kostenlose, transparente und benutzerfreundliche Zinseszins-Rechner für deutsche Sparer**

## 🎯 Projektübersicht

Zinses-Rechner ist eine moderne Web-Anwendung, die deutschen Sparern hilft, die Kraft des Zinseszinses zu verstehen und zu berechnen. Mit vollständiger Transparenz der Berechnungsformeln und deutscher Steuerberücksichtigung.

### ✨ Hauptfunktionen

- **💰 Präzise Zinseszins-Berechnung** - Hochgenaue Berechnungen mit Decimal-Arithmetik
- **📊 Interaktive Visualisierung** - Chart.js-basierte Diagramme und Tabellen
- **📱 Responsive Design** - Optimiert für alle Geräte und Bildschirmgrößen
- **🇩🇪 Deutsche Lokalisierung** - Vollständig auf deutsche Nutzer zugeschnitten
- **🔒 Sicherheit & Datenschutz** - DSGVO-konform und sicherheitsoptimiert
- **⚡ Hohe Performance** - Cloudflare-basierte globale Infrastruktur

## 🏗️ Technische Architektur

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Worker    │    │   Monitoring    │
│   Vue 3 + Vite  │◄──►│ Cloudflare      │◄──►│   Dashboard     │
│   Tailwind CSS  │    │   Workers       │    │   Analytics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Cloudflare Pages│    │ Cloudflare D1   │    │ Security Scan   │
│   Static Host   │    │   Database      │    │   OWASP ZAP     │
│   Global CDN    │    │   SQLite        │    │   npm audit     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🛠️ 技术栈

**Frontend:**
- Vue 3 (Composition API)
- TypeScript
- Vite (Build Tool)
- Tailwind CSS
- Headless UI
- Chart.js
- Pinia (State Management)

**Backend:**
- Cloudflare Workers
- TypeScript/JavaScript
- Cloudflare D1 (SQLite)
- Hono.js (Web Framework)

**Infrastructure:**
- Cloudflare Pages (Frontend Hosting)
- Cloudflare Workers (API)
- Cloudflare Analytics
- GitHub Actions (CI/CD)

**Development:**
- Playwright (E2E Testing)
- Vitest (Unit Testing)
- ESLint + Prettier
- Docker (Development Environment)

## 🚀 Schnellstart

### Voraussetzungen

- Node.js 20+
- npm oder yarn
- Docker (optional, für lokale Entwicklung)
- Git

### Lokale Entwicklung

```bash
# Repository klonen
git clone https://github.com/your-org/zinses-rechner.git
cd zinses-rechner

# Frontend Setup
cd zinses-rechner-frontend
npm install
npm run dev

# Backend Setup (in neuem Terminal)
cd ../backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# oder: venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# Mit Docker (Alternative)
docker-compose up -dev
```

### Produktions-Deployment

```bash
# Frontend zu Cloudflare Pages
cd zinses-rechner-frontend
npm run build
npx wrangler pages deploy dist

# API Worker zu Cloudflare Workers
cd ../cloudflare-workers/api-worker
npx wrangler deploy --env production
```

## 📁 Projektstruktur

```
zinses-rechner/
├── 📁 zinses-rechner-frontend/     # Vue.js Frontend
│   ├── src/
│   │   ├── components/             # Vue Komponenten
│   │   ├── views/                  # Seiten/Views
│   │   ├── composables/            # Composition API Logic
│   │   ├── stores/                 # Pinia Stores
│   │   └── types/                  # TypeScript Definitionen
│   ├── tests/                      # Frontend Tests
│   └── public/                     # Statische Assets
│
├── 📁 cloudflare-workers/          # Cloudflare Workers
│   ├── api-worker/                 # Haupt-API Worker
│   └── cache-worker.js             # Cache Management
│
├── 📁 backend/                     # FastAPI Backend (Development)
│   ├── app/
│   │   ├── api/                    # API Routen
│   │   ├── core/                   # Kern-Konfiguration
│   │   ├── models/                 # Datenmodelle
│   │   └── services/               # Business Logic
│   └── tests/                      # Backend Tests
│
├── 📁 infrastructure/              # Infrastructure as Code
│   ├── dns-config.tf               # DNS Konfiguration
│   └── monitoring/                 # Monitoring Setup
│
├── 📁 monitoring/                  # Monitoring & Observability
│   ├── dashboard-validator.ts      # Dashboard Validation
│   └── scripts/                    # Monitoring Scripts
│
├── 📁 security/                    # Security Configuration
│   ├── owasp-zap-config.yml       # Security Scan Config
│   ├── scripts/                    # Security Scripts
│   └── security-enhancements.ts   # Security Middleware
│
├── 📁 tests/                       # Integration Tests
│   ├── monitoring/                 # Monitoring Tests
│   └── performance/                # Performance Tests
│
├── 📁 scripts/                     # Deployment Scripts
└── 📁 docs/                        # Documentation
```

## 🔧 Entwicklung

### Lokale Entwicklung starten

```bash
# Alle Services mit Docker
docker-compose -f docker-compose.dev.yml up

# Oder manuell:
# Terminal 1: Frontend
cd zinses-rechner-frontend && npm run dev

# Terminal 2: Backend
cd backend && uvicorn app.main:app --reload

# Terminal 3: Monitoring
cd monitoring && npm run dashboard
```

### Tests ausführen

```bash
# Frontend Unit Tests
cd zinses-rechner-frontend
npm run test

# E2E Tests
npm run test:e2e

# Backend Tests
cd ../backend
pytest

# Security Scans
./security/scripts/run-security-scan.sh

# Performance Tests
./tests/performance/run-performance-tests.sh
```

### Code Quality

```bash
# Linting und Formatierung
npm run lint
npm run format

# Type Checking
npm run type-check

# Build Verification
npm run build
```

## 🚀 Deployment

### Staging Environment

```bash
# Deploy zu Staging
./scripts/deploy.sh staging

# Monitoring Verification
./monitoring/scripts/verify-monitoring.sh
```

### Production Environment

```bash
# Deploy zu Production
./scripts/deploy.sh production

# Post-Deployment Verification
./scripts/post-deploy-verification.sh
```

## 📊 Monitoring & Observability

- **Performance Dashboard**: https://monitoring.zinses-rechner.de
- **Security Reports**: `security/reports/`
- **Application Logs**: Cloudflare Analytics
- **Error Tracking**: Integriert in Monitoring Dashboard

### Wichtige Metriken

- **API Response Time**: < 500ms (Ziel)
- **Frontend Load Time**: < 2s (LCP)
- **Uptime**: > 99.9%
- **Cache Hit Rate**: > 85%

## 🔒 Sicherheit

### Implementierte Sicherheitsmaßnahmen

- **Content Security Policy (CSP)**: Schutz vor XSS
- **Rate Limiting**: API-Schutz vor Missbrauch
- **Input Validation**: Umfassende Eingabevalidierung
- **HTTPS Everywhere**: Vollständige SSL/TLS-Verschlüsselung
- **Security Headers**: Vollständiger Satz von Sicherheitsheadern

### Regelmäßige Security Scans

```bash
# Automatische tägliche Scans via GitHub Actions
# Manuelle Scans:
./security/scripts/run-security-scan.sh full
```

## 🤝 Beitragen

### Development Workflow

1. **Feature Branch erstellen**: `git checkout -b feature/neue-funktion`
2. **Entwickeln und Testen**: Lokale Tests ausführen
3. **Pull Request erstellen**: Mit ausführlicher Beschreibung
4. **Code Review**: Automatische und manuelle Überprüfung
5. **Merge**: Nach erfolgreicher Überprüfung

### Code Standards

- **TypeScript**: Strikte Typisierung
- **ESLint**: Automatische Code-Qualitätsprüfung
- **Prettier**: Einheitliche Code-Formatierung
- **Conventional Commits**: Strukturierte Commit-Nachrichten

## 📚 Weitere Dokumentation

- **[API Dokumentation](docs/API.md)** - Detaillierte API-Referenz
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Schritt-für-Schritt Deployment
- **[Architecture Guide](docs/ARCHITECTURE.md)** - Technische Architektur
- **[Security Guide](docs/SECURITY.md)** - Sicherheitsrichtlinien
- **[Monitoring Guide](docs/MONITORING.md)** - Monitoring und Alerting
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Fehlerbehebung

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/zinses-rechner/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/zinses-rechner/discussions)
- **Email**: support@zinses-rechner.de

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert. Siehe [LICENSE](LICENSE) für Details.

---

## 🔄 Aktuelle Optimierung: Deutsche Fokussierung

**Status**: In Bearbeitung - 4-Wochen Optimierungsprojekt

### 🎯 Optimierungsziele
- **Mehrsprachigkeit entfernen**: Fokus auf deutsche Nutzer
- **15 Rechner vervollständigen**: Alle Finanzrechner implementieren
- **SEO 2025 Standards**: Google-konforme Optimierung
- **Admin-Dashboard**: Vollständiges Verwaltungssystem
- **Code-Bereinigung**: 30% weniger Code, 25% kleinere Bundles

### 📋 Fortschritt
- [x] **Epic**: [Projekt-Übersicht](https://github.com/17chuhai-dev/zinses-rechner-optimization/issues/1)
- [x] **Task 001**: [Mehrsprachigkeits-Audit](https://github.com/17chuhai-dev/zinses-rechner-optimization/issues/2)
- [x] **Task 002**: [I18n-Service Vereinfachung](https://github.com/17chuhai-dev/zinses-rechner-optimization/issues/3)
- [x] **Task 003**: [Rechner-Funktionalität](https://github.com/17chuhai-dev/zinses-rechner-optimization/issues/4)
- [x] **Task 006**: [SEO-Optimierung](https://github.com/17chuhai-dev/zinses-rechner-optimization/issues/5)
- [x] **Task 008**: [Admin-Dashboard](https://github.com/17chuhai-dev/zinses-rechner-optimization/issues/6)

### 🎯 Erwartete Verbesserungen
- **Performance**: PageSpeed > 95 Punkte
- **Ladezeit**: < 2 Sekunden
- **SEO**: Top-Rankings für deutsche Suchbegriffe
- **Wartbarkeit**: Vereinfachte Codebasis

**Entwickelt mit ❤️ für deutsche Sparer**
