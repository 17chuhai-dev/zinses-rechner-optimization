"""
API文档配置
配置FastAPI的OpenAPI文档生成，包括德语化和详细说明
"""

from typing import Dict, Any


def get_openapi_config() -> Dict[str, Any]:
    """获取OpenAPI配置"""
    return {
        "title": "Zinseszins-Rechner API",
        "summary": "Deutsche Zinseszins-Berechnung API",
        "description": """
        ## 🇩🇪 Deutsche Zinseszins-Berechnung API
        
        **Transparente, schnelle und präzise Finanzberechnungen für deutsche Sparer**
        
        ### ✨ Hauptfunktionen
        - 🧮 **Hochpräzise Zinseszins-Berechnung** mit Decimal-Arithmetik
        - 💰 **Deutsche Steuerberechnung** (Abgeltungssteuer, Solidaritätszuschlag, Kirchensteuer)
        - 📊 **Detaillierte Jahresaufschlüsselung** für langfristige Planung
        - 🔒 **DSGVO-konform** und datenschutzfreundlich
        - ⚡ **Optimiert für deutsche Nutzer** mit lokalen Steuergesetzen
        
        ### 🎯 Zielgruppe
        Deutsche Sparer und Anleger, die transparente und genaue Zinseszins-Berechnungen 
        für ihre Finanzplanung benötigen.
        
        ### 📋 API-Standards
        - **Format**: JSON (application/json)
        - **Währung**: Euro (EUR)
        - **Locale**: Deutsch (de_DE)
        - **Zeitzone**: Europe/Berlin
        - **Genauigkeit**: 2 Dezimalstellen für Geldbeträge
        
        ### 🔐 Sicherheit
        - Rate Limiting: 100 Anfragen pro 15 Minuten
        - CORS-Schutz für autorisierte Domains
        - Input-Validierung und Sanitization
        - Keine Speicherung persönlicher Daten
        
        ### 📚 Erste Schritte
        
        1. **Basis-Berechnung**: Verwenden Sie `/api/v1/calculator/compound-interest`
        2. **Parameter-Limits**: Prüfen Sie `/api/v1/calculator/limits`
        3. **Gesundheitscheck**: Überwachen Sie `/health`
        
        ### 💡 Beispiel-Workflow
        
        ```javascript
        // 1. Limits abrufen
        const limits = await fetch('/api/v1/calculator/limits').then(r => r.json())
        
        // 2. Berechnung durchführen
        const result = await fetch('/api/v1/calculator/compound-interest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            principal: 10000,
            annual_rate: 4.0,
            years: 10,
            monthly_payment: 500,
            compound_frequency: 'monthly'
          })
        }).then(r => r.json())
        
        console.log(`Endkapital: ${result.final_amount.toLocaleString('de-DE')}€`)
        ```
        
        ### 🆘 Support
        
        - **Dokumentation**: [zinses-rechner.de/api-docs](https://zinses-rechner.de/api-docs)
        - **Support**: [support@zinses-rechner.de](mailto:support@zinses-rechner.de)
        - **GitHub**: [github.com/zinses-rechner/api](https://github.com/zinses-rechner/api)
        """,
        "version": "1.0.0",
        "contact": {
            "name": "Zinseszins-Rechner Support",
            "url": "https://zinses-rechner.de/kontakt",
            "email": "support@zinses-rechner.de"
        },
        "license_info": {
            "name": "MIT License",
            "url": "https://opensource.org/licenses/MIT"
        },
        "terms_of_service": "https://zinses-rechner.de/nutzungsbedingungen"
    }


def get_openapi_tags() -> list:
    """获取API标签配置"""
    return [
        {
            "name": "Calculator",
            "description": "🧮 **Zinseszins-Berechnungen** - Hauptfunktionen für Finanzberechnungen",
            "externalDocs": {
                "description": "Zinseszins-Grundlagen",
                "url": "https://zinses-rechner.de/ratgeber/zinseszins-grundlagen"
            }
        },
        {
            "name": "Tax",
            "description": "💰 **Deutsche Steuerberechnung** - Abgeltungssteuer und Solidaritätszuschlag",
            "externalDocs": {
                "description": "Deutsche Steuergesetze für Kapitalerträge",
                "url": "https://zinses-rechner.de/ratgeber/steuer-optimierung"
            }
        },
        {
            "name": "Export", 
            "description": "📊 **Datenexport** - CSV, Excel und PDF-Berichte",
        },
        {
            "name": "Health",
            "description": "🏥 **Systemstatus** - Gesundheitschecks und Monitoring",
        },
        {
            "name": "Root",
            "description": "🏠 **Basis-Endpunkte** - API-Information und Status",
        }
    ]


def get_servers_config(environment: str) -> list:
    """获取服务器配置"""
    servers = [
        {
            "url": "http://localhost:8000",
            "description": "🛠️ Lokaler Entwicklungsserver"
        }
    ]
    
    if environment in ["staging", "production"]:
        servers.extend([
            {
                "url": "https://staging-api.zinses-rechner.de", 
                "description": "🧪 Staging-Server (Test-Umgebung)"
            }
        ])
    
    if environment == "production":
        servers.append({
            "url": "https://api.zinses-rechner.de",
            "description": "🚀 Produktionsserver (Deutschland)"
        })
    
    return servers


def customize_openapi_schema(app, settings):
    """自定义OpenAPI模式"""
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = app.openapi()

    # 添加自定义信息
    config = get_openapi_config()
    openapi_schema["info"]["summary"] = config["summary"]
    openapi_schema["info"]["contact"] = config["contact"]
    openapi_schema["info"]["license"] = config["license_info"]
    openapi_schema["info"]["termsOfService"] = config["terms_of_service"]

    openapi_schema["servers"] = get_servers_config(settings.ENVIRONMENT)
    openapi_schema["tags"] = get_openapi_tags()
    
    # 添加安全方案
    openapi_schema["components"]["securitySchemes"] = {
        "RateLimiting": {
            "type": "apiKey",
            "in": "header",
            "name": "X-RateLimit-Limit",
            "description": "API Rate Limiting (100 Anfragen pro 15 Minuten)"
        }
    }
    
    # 添加全局响应
    openapi_schema["components"]["responses"] = {
        "ValidationError": {
            "description": "Validierungsfehler bei Eingabeparametern",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "detail": {
                                "type": "object",
                                "properties": {
                                    "error": {"type": "string", "example": "VALIDATION_ERROR"},
                                    "message": {"type": "string", "example": "Das Startkapital muss zwischen 1€ und 10.000.000€ liegen"},
                                    "field": {"type": "string", "example": "principal"},
                                    "code": {"type": "string", "example": "INVALID_PRINCIPAL"}
                                }
                            }
                        }
                    }
                }
            }
        },
        "RateLimitExceeded": {
            "description": "Rate Limit überschritten",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "detail": {
                                "type": "string",
                                "example": "Rate limit exceeded. Try again in 15 minutes."
                            }
                        }
                    }
                }
            }
        }
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema
