# 🚀 Zinses Rechner - Vollständige Deployment-Anleitung

Umfassende Anleitung zur Bereitstellung der Zinses Rechner Anwendung in verschiedenen Umgebungen.

## 📋 Inhaltsverzeichnis

- [Systemanforderungen](#systemanforderungen)
- [Lokale Entwicklung](#lokale-entwicklung)
- [Produktionsumgebung](#produktionsumgebung)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Monitoring & Wartung](#monitoring--wartung)
- [Troubleshooting](#troubleshooting)

## 🖥️ Systemanforderungen

### Mindestanforderungen

#### Backend (FastAPI)
- **Python**: 3.9+ (empfohlen: 3.11)
- **RAM**: 512MB (empfohlen: 2GB)
- **CPU**: 1 Core (empfohlen: 2+ Cores)
- **Speicher**: 1GB verfügbar

#### Frontend (Vue.js)
- **Node.js**: 18+ (empfohlen: 20 LTS)
- **npm**: 9+ oder **pnpm**: 8+
- **RAM**: 1GB während Build (empfohlen: 4GB)
- **Speicher**: 500MB für Build-Artefakte

### Unterstützte Betriebssysteme

- ✅ **Linux**: Ubuntu 20.04+, CentOS 8+, Debian 11+
- ✅ **macOS**: 12.0+ (Monterey)
- ✅ **Windows**: 10/11 mit WSL2
- ✅ **Docker**: Alle Docker-kompatiblen Systeme

## 🛠️ Lokale Entwicklung

### Schnellstart

```bash
# Repository klonen
git clone https://github.com/your-org/zinses-rechner.git
cd zinses-rechner

# Backend starten
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend starten (neues Terminal)
cd ../zinses-rechner-frontend
npm install
npm run dev
```

### Umgebungsvariablen

#### Backend (.env)

```env
# Anwendungseinstellungen
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# API Konfiguration
API_V1_STR=/api/v1
PROJECT_NAME="Zinses Rechner API"
VERSION=1.0.0

# CORS Einstellungen
ALLOWED_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
ALLOWED_HOSTS=["localhost", "127.0.0.1"]

# Deutsche Lokalisierung
DEFAULT_LOCALE=de_DE
DEFAULT_CURRENCY=EUR
DEFAULT_TIMEZONE=Europe/Berlin
```

#### Frontend (.env)

```env
# API Endpoints
VITE_API_BASE_URL=http://localhost:8000
VITE_API_VERSION=v1

# Anwendungseinstellungen
VITE_APP_TITLE="Zinses Rechner"
VITE_APP_DESCRIPTION="Kostenloser Online Zinseszins-Rechner"

# Deutsche Einstellungen
VITE_DEFAULT_LOCALE=de-DE
VITE_DEFAULT_CURRENCY=EUR
```

## 🏭 Produktionsumgebung

### System-Vorbereitung

#### Ubuntu/Debian Setup

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Erforderliche Pakete installieren
sudo apt install -y nginx python3 python3-pip python3-venv nodejs npm git curl

# Node.js 18+ installieren (falls nicht verfügbar)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Anwendungsbenutzer erstellen
sudo useradd -m -s /bin/bash zinses
sudo usermod -aG sudo zinses
```

### Backend Deployment

```bash
# Als zinses Benutzer
sudo su - zinses

# Repository klonen
git clone https://github.com/your-org/zinses-rechner.git
cd zinses-rechner/backend

# Python Virtual Environment
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn uvicorn[standard]

# Produktions-Konfiguration
cp .env.example .env.production
# .env.production bearbeiten

# Systemd Service erstellen
sudo tee /etc/systemd/system/zinses-api.service > /dev/null <<EOF
[Unit]
Description=Zinses Rechner API
After=network.target

[Service]
Type=exec
User=zinses
Group=zinses
WorkingDirectory=/home/zinses/zinses-rechner/backend
Environment=PATH=/home/zinses/zinses-rechner/backend/venv/bin
EnvironmentFile=/home/zinses/zinses-rechner/backend/.env.production
ExecStart=/home/zinses/zinses-rechner/backend/venv/bin/gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8000
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Service aktivieren
sudo systemctl daemon-reload
sudo systemctl enable zinses-api
sudo systemctl start zinses-api
```

### Frontend Build & Deployment

```bash
# Frontend bauen
cd /home/zinses/zinses-rechner/zinses-rechner-frontend

# Abhängigkeiten installieren
npm ci --production=false

# Produktions-Build
npm run build

# Build-Artefakte zu Nginx kopieren
sudo mkdir -p /var/www/zinses-rechner
sudo cp -r dist/* /var/www/zinses-rechner/
sudo chown -R www-data:www-data /var/www/zinses-rechner
sudo chmod -R 755 /var/www/zinses-rechner
```

### Nginx Konfiguration

```bash
# Nginx Site-Konfiguration
sudo tee /etc/nginx/sites-available/zinses-rechner > /dev/null <<'EOF'
server {
    listen 80;
    server_name zinses-rechner.de www.zinses-rechner.de;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name zinses-rechner.de www.zinses-rechner.de;
    
    # SSL Konfiguration
    ssl_certificate /etc/letsencrypt/live/zinses-rechner.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zinses-rechner.de/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Frontend
    location / {
        root /var/www/zinses-rechner;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Site aktivieren
sudo ln -s /etc/nginx/sites-available/zinses-rechner /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL mit Let's Encrypt

```bash
# Certbot installieren
sudo apt install -y certbot python3-certbot-nginx

# SSL-Zertifikat erstellen
sudo certbot --nginx -d zinses-rechner.de -d www.zinses-rechner.de

# Automatische Erneuerung
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## 🐳 Docker Deployment

### Docker Compose Setup

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - DEFAULT_LOCALE=de_DE
      - DEFAULT_CURRENCY=EUR
    volumes:
      - ./backend/logs:/app/logs
    restart: unless-stopped

  frontend:
    build:
      context: ./zinses-rechner-frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./ssl:/etc/ssl/certs
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./ssl:/etc/ssl/certs
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
```

### Backend Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health/check || exit 1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci --only=production=false

# Build
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Deployment ausführen

```bash
# Docker Compose starten
docker-compose up -d

# Logs überprüfen
docker-compose logs -f

# Services überprüfen
docker-compose ps

# Updates durchführen
docker-compose pull
docker-compose up -d --build

# Backup erstellen
docker-compose exec backend python -c "print('Backup completed')"
```

## ☁️ Cloud Deployment

### Cloudflare Pages (Frontend)

#### 1. Über Cloudflare Dashboard

1. Bei [Cloudflare Dashboard](https://dash.cloudflare.com) anmelden
2. **Pages** Bereich aufrufen
3. **Create a project** klicken
4. Git-Repository verbinden
5. Build-Einstellungen konfigurieren:
   ```
   Framework preset: Vue
   Build command: cd zinses-rechner-frontend && npm run build
   Build output directory: zinses-rechner-frontend/dist
   Root directory: /
   Node.js version: 18
   ```

#### 2. Umgebungsvariablen

```bash
# Produktionsumgebung
VITE_API_BASE_URL=https://api.zinses-rechner.de
VITE_APP_TITLE=Zinseszins-Rechner
VITE_APP_VERSION=1.0.0

# Deutsche Lokalisierung
VITE_DEFAULT_LOCALE=de-DE
VITE_DEFAULT_CURRENCY=EUR

# Optional: Analytics
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_MATOMO_URL=https://analytics.your-domain.com
VITE_MATOMO_SITE_ID=1
```

#### 3. Custom Domain Setup

1. **Custom domains** navigieren
2. Domain hinzufügen: `zinses-rechner.de`
3. DNS-Konfiguration (CNAME-Eintrag)
4. SSL-Zertifikat automatisch konfigurieren

### Vercel (Alternative Frontend)

```bash
# Vercel CLI installieren
npm i -g vercel

# Projekt deployen
cd zinses-rechner-frontend
vercel

# Produktions-Deployment
vercel --prod
```

### Railway (Backend)

```bash
# Railway CLI installieren
npm install -g @railway/cli

# Projekt erstellen
railway login
railway init
railway add

# Umgebungsvariablen setzen
railway variables set ENVIRONMENT=production
railway variables set DEFAULT_LOCALE=de_DE
railway variables set DEFAULT_CURRENCY=EUR

# Deployen
railway up
```

### AWS EC2

```bash
# EC2 Instanz vorbereiten
ssh -i your-key.pem ubuntu@your-ec2-instance

# Docker installieren
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu

# Anwendung deployen
git clone https://github.com/your-org/zinses-rechner.git
cd zinses-rechner
docker-compose up -d
```

## 📊 Monitoring & Wartung

### Systemd Services überwachen

```bash
# Service Status prüfen
sudo systemctl status zinses-api

# Logs anzeigen
sudo journalctl -u zinses-api -f

# Service neustarten
sudo systemctl restart zinses-api

# Service-Metriken
sudo systemctl show zinses-api --property=MainPID,ActiveState,SubState
```

### Nginx Logs

```bash
# Access Logs
sudo tail -f /var/log/nginx/access.log

# Error Logs
sudo tail -f /var/log/nginx/error.log

# Log-Analyse
sudo grep "ERROR" /var/log/nginx/error.log | tail -20

# Log Rotation konfigurieren
sudo logrotate -d /etc/logrotate.d/nginx
```

### Performance Monitoring

```bash
# System-Ressourcen überwachen
htop
iotop
nethogs

# Anwendungs-Metriken
curl http://localhost:8000/api/v1/health/detailed

# Disk Usage
df -h
du -sh /var/www/zinses-rechner
du -sh /home/zinses/zinses-rechner
```

### Backup-Strategie

```bash
# Automatisches Backup-Script erstellen
sudo tee /usr/local/bin/backup-zinses.sh > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/backup/zinses-rechner"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Code Backup
tar -czf $BACKUP_DIR/code_$DATE.tar.gz /home/zinses/zinses-rechner

# Konfiguration Backup
cp /etc/nginx/sites-available/zinses-rechner $BACKUP_DIR/nginx_$DATE.conf
cp /home/zinses/zinses-rechner/backend/.env.production $BACKUP_DIR/env_$DATE

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.conf" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

sudo chmod +x /usr/local/bin/backup-zinses.sh

# Cron-Job für tägliches Backup
echo "0 2 * * * /usr/local/bin/backup-zinses.sh" | sudo crontab -
```

## 🔧 Troubleshooting

### Häufige Probleme

#### Backend startet nicht

```bash
# Logs prüfen
sudo journalctl -u zinses-api -n 50

# Port-Konflikte prüfen
sudo netstat -tlnp | grep :8000

# Abhängigkeiten prüfen
source venv/bin/activate
pip check

# Python-Pfad prüfen
which python
python --version
```

#### Frontend Build-Fehler

```bash
# Node.js Version prüfen
node --version
npm --version

# Cache löschen
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Memory-Probleme
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Build-Logs analysieren
npm run build 2>&1 | tee build.log
```

#### Nginx-Konfigurationsfehler

```bash
# Konfiguration testen
sudo nginx -t

# Syntax-Fehler finden
sudo nginx -T

# Service neustarten
sudo systemctl restart nginx

# Nginx-Status prüfen
sudo systemctl status nginx
```

#### SSL-Zertifikat-Probleme

```bash
# Zertifikat-Status prüfen
sudo certbot certificates

# Manuelle Erneuerung
sudo certbot renew

# Nginx nach Erneuerung neustarten
sudo systemctl reload nginx

# Zertifikat-Details prüfen
openssl x509 -in /etc/letsencrypt/live/zinses-rechner.de/fullchain.pem -text -noout
```

### Performance-Optimierung

#### Backend-Optimierung

```bash
# Gunicorn Worker anpassen
# In /etc/systemd/system/zinses-api.service
ExecStart=/path/to/gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --max-requests 1000 --max-requests-jitter 100

# Memory-Monitoring
ps aux | grep gunicorn

# CPU-Optimierung
htop -p $(pgrep -f gunicorn)
```

#### Frontend-Optimierung

```bash
# Build-Optimierung
npm run build -- --analyze

# Bundle-Größe prüfen
ls -lah dist/assets/

# Gzip-Kompression in Nginx aktivieren
# In /etc/nginx/sites-available/zinses-rechner
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

### Sicherheits-Checkliste

- [ ] SSL/TLS konfiguriert und aktiv
- [ ] Security Headers gesetzt
- [ ] Firewall konfiguriert (nur notwendige Ports offen)
- [ ] Regelmäßige System-Updates
- [ ] Starke Passwörter und SSH-Keys
- [ ] Backup-Strategie implementiert
- [ ] Monitoring eingerichtet
- [ ] Log-Rotation konfiguriert

#### Firewall-Konfiguration

```bash
# UFW Firewall einrichten
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Notwendige Ports öffnen
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Status prüfen
sudo ufw status verbose
```

#### Security Headers

```nginx
# In Nginx-Konfiguration hinzufügen
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## 📈 Deployment-Checkliste

### Pre-Deployment

- [ ] Code-Review abgeschlossen
- [ ] Tests erfolgreich durchgeführt
- [ ] Backup der aktuellen Version erstellt
- [ ] Umgebungsvariablen konfiguriert
- [ ] SSL-Zertifikate gültig
- [ ] DNS-Einträge korrekt

### Deployment

- [ ] Backend-Service gestoppt
- [ ] Code aktualisiert
- [ ] Abhängigkeiten installiert
- [ ] Datenbank-Migrationen (falls erforderlich)
- [ ] Frontend neu gebaut
- [ ] Services neu gestartet
- [ ] Health-Checks erfolgreich

### Post-Deployment

- [ ] Anwendung erreichbar
- [ ] API-Endpoints funktional
- [ ] Frontend lädt korrekt
- [ ] Logs auf Fehler überprüft
- [ ] Performance-Metriken normal
- [ ] Monitoring-Alerts konfiguriert

## 🔄 Rollback-Strategie

### Automatisches Rollback

```bash
# Rollback-Script erstellen
sudo tee /usr/local/bin/rollback-zinses.sh > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/backup/zinses-rechner"
LATEST_BACKUP=$(ls -t $BACKUP_DIR/code_*.tar.gz | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "Kein Backup gefunden!"
    exit 1
fi

echo "Rollback zu: $LATEST_BACKUP"

# Service stoppen
sudo systemctl stop zinses-api

# Backup wiederherstellen
cd /home/zinses
sudo rm -rf zinses-rechner
sudo tar -xzf $LATEST_BACKUP

# Service neu starten
sudo systemctl start zinses-api
sudo systemctl reload nginx

echo "Rollback abgeschlossen"
EOF

sudo chmod +x /usr/local/bin/rollback-zinses.sh
```

### Manuelles Rollback

```bash
# Git-basiertes Rollback
cd /home/zinses/zinses-rechner
git log --oneline -10
git checkout <previous-commit-hash>

# Service neu starten
sudo systemctl restart zinses-api

# Frontend neu bauen
cd zinses-rechner-frontend
npm run build
sudo cp -r dist/* /var/www/zinses-rechner/
```

## 📞 Support und Wartung

### Kontaktinformationen

- **Technische Dokumentation**: [GitHub Wiki](https://github.com/your-org/zinses-rechner/wiki)
- **Issue-Tracking**: [GitHub Issues](https://github.com/your-org/zinses-rechner/issues)
- **Support-Email**: support@zinses-rechner.de

### Wartungsplan

#### Täglich
- Automatische Backups
- Log-Monitoring
- Health-Check-Überwachung
- Performance-Metriken

#### Wöchentlich
- System-Updates prüfen
- SSL-Zertifikat-Status
- Disk-Space-Überwachung
- Security-Scans

#### Monatlich
- Abhängigkeiten aktualisieren
- Performance-Optimierung
- Backup-Wiederherstellung testen
- Sicherheits-Audit

#### Quartalsweise
- Vollständige System-Überprüfung
- Disaster-Recovery-Test
- Kapazitätsplanung
- Sicherheitsrichtlinien-Review

---

## 📝 Deployment-Logs

### Log-Beispiel

```bash
# Deployment-Log-Format
[2024-01-15 10:30:00] INFO: Deployment gestartet
[2024-01-15 10:30:05] INFO: Backend-Service gestoppt
[2024-01-15 10:30:10] INFO: Code aktualisiert (Commit: abc123)
[2024-01-15 10:30:15] INFO: Abhängigkeiten installiert
[2024-01-15 10:30:20] INFO: Frontend gebaut
[2024-01-15 10:30:25] INFO: Services neu gestartet
[2024-01-15 10:30:30] INFO: Health-Checks erfolgreich
[2024-01-15 10:30:35] SUCCESS: Deployment abgeschlossen
```

---

**Letzte Aktualisierung**: $(date +%Y-%m-%d)
**Dokumentversion**: 1.0.0
**Autor**: Zinses Rechner Development Team
