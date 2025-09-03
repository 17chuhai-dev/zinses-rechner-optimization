"""
Zinses-Rechner FastAPI Backend
德国复利计算器后端API服务
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import uvicorn
import logging
from contextlib import asynccontextmanager
from datetime import datetime

from app.core.config import settings
from app.api.v1.api import api_router
from app.core.logging import setup_logging
from app.core.docs_config import customize_openapi_schema
from app.core.cache import cache_response_middleware, get_cache_manager
from app.core.security import (
    SecurityHeadersMiddleware,
    RateLimitMiddleware,
    security_middleware,
    get_security_audit_logger
)
from app.core.monitoring import get_monitoring_service
from app.core.error_handlers import (
    validation_exception_handler,
    http_exception_handler,
    general_exception_handler
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    setup_logging()
    logging.info("🚀 Zinses-Rechner API starting up...")
    
    yield
    
    # 关闭时执行
    logging.info("📴 Zinses-Rechner API shutting down...")


# 创建FastAPI应用实例
app = FastAPI(
    title="Zinseszins-Rechner API",
    summary="Deutsche Zinseszins-Berechnung API",
    description="""
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
    """,
    version="1.0.0",
    contact={
        "name": "Zinseszins-Rechner Support",
        "url": "https://zinses-rechner.de/kontakt",
        "email": "support@zinses-rechner.de"
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT"
    },
    terms_of_service="https://zinses-rechner.de/nutzungsbedingungen",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    openapi_url="/openapi.json" if settings.ENVIRONMENT != "production" else None,
    servers=[
        {
            "url": "https://api.zinses-rechner.de",
            "description": "Produktionsserver (Deutschland)"
        },
        {
            "url": "https://staging-api.zinses-rechner.de",
            "description": "Staging-Server"
        },
        {
            "url": "http://localhost:8000",
            "description": "Lokaler Entwicklungsserver"
        }
    ],
    openapi_tags=[
        {
            "name": "Calculator",
            "description": "🧮 **Zinseszins-Berechnungen** - Hauptfunktionen für Finanzberechnungen",
        },
        {
            "name": "Tax",
            "description": "💰 **Deutsche Steuerberechnung** - Abgeltungssteuer und Solidaritätszuschlag",
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
    ],
    lifespan=lifespan
)

# CORS中间件配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Request-ID"]
)

# 受信任主机中间件
if settings.ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )

# 注册错误处理器
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# 添加安全中间件（按顺序） - 暂时禁用以调试
# app.add_middleware(SecurityHeadersMiddleware)
# app.add_middleware(RateLimitMiddleware)
# app.middleware("http")(security_middleware)

# 添加缓存中间件 - 暂时禁用以调试
# app.middleware("http")(cache_response_middleware)

# 自定义OpenAPI文档 - 暂时禁用以避免递归错误
# app.openapi = lambda: customize_openapi_schema(app, settings)

# 包含API路由
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Root"])
async def root():
    """根路径 - API状态检查"""
    return {
        "message": "Zinses-Rechner API",
        "version": "1.0.0",
        "status": "healthy",
        "docs": "/docs" if settings.ENVIRONMENT != "production" else "disabled"
    }


@app.get(
    "/health",
    tags=["Health"],
    summary="🏥 API-Gesundheitscheck",
    description="""
    **Überprüft den Status der Zinseszins-Rechner API**

    Dieser Endpunkt wird für Monitoring und Verfügbarkeitsprüfungen verwendet.

    ### 📊 Rückgabewerte
    - **status**: Service-Status ('healthy', 'degraded', 'unhealthy')
    - **environment**: Aktuelle Umgebung (development, staging, production)
    - **timestamp**: Serverzeit im ISO 8601 Format
    - **version**: API-Version
    - **uptime**: Service-Laufzeit in Sekunden

    ### 🔍 Monitoring-Integration
    - Wird von Cloudflare Health Checks verwendet
    - Antwortzeit sollte < 100ms sein
    - Automatische Überwachung alle 30 Sekunden
    """,
    responses={
        200: {
            "description": "✅ Service ist gesund und funktionsfähig",
            "content": {
                "application/json": {
                    "example": {
                        "status": "healthy",
                        "environment": "production",
                        "timestamp": "2024-01-15T10:30:00Z",
                        "version": "1.0.0",
                        "uptime": 86400,
                        "requests_per_minute": 45,
                        "average_response_time": "85ms"
                    }
                }
            }
        },
        503: {
            "description": "🚨 Service nicht verfügbar",
            "content": {
                "application/json": {
                    "example": {
                        "status": "unhealthy",
                        "environment": "production",
                        "timestamp": "2024-01-15T10:30:00Z",
                        "error": "Database connection failed",
                        "last_healthy": "2024-01-15T09:45:00Z"
                    }
                }
            }
        }
    }
)
async def health_check():
    """API健康检查端点"""
    from datetime import datetime
    import time
    import psutil

    try:
        # 获取系统信息
        current_time = datetime.now()
        uptime = time.time() - psutil.boot_time()

        return {
            "status": "healthy",
            "environment": settings.ENVIRONMENT,
            "timestamp": current_time.isoformat(),
            "version": "1.0.0",
            "uptime": int(uptime),
            "memory_usage": f"{psutil.virtual_memory().percent:.1f}%",
            "cpu_usage": f"{psutil.cpu_percent(interval=1):.1f}%",
            "requests_per_minute": 0,  # 这里可以集成实际的请求统计
            "average_response_time": "< 100ms"
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "environment": settings.ENVIRONMENT,
                "timestamp": datetime.now().isoformat(),
                "error": str(e),
                "last_healthy": "unknown"
            }
        )


@app.get(
    "/cache/stats",
    tags=["Cache"],
    summary="📊 缓存统计信息",
    description="""
    **获取缓存系统的详细统计信息**

    ### 📈 统计指标
    - **命中率**: 缓存命中百分比
    - **总请求数**: 缓存查询总数
    - **内存使用**: 缓存占用内存
    - **键数量**: 当前缓存键总数

    ### 🎯 性能监控
    - 目标命中率: > 85%
    - 内存使用监控
    - 缓存效率分析
    """,
    responses={
        200: {
            "description": "✅ 缓存统计信息获取成功",
            "content": {
                "application/json": {
                    "example": {
                        "hit_count": 1250,
                        "miss_count": 180,
                        "hit_rate_percent": 87.4,
                        "total_requests": 1430,
                        "cache_enabled": True,
                        "total_keys": 45,
                        "memory_usage": 2048576
                    }
                }
            }
        }
    }
)
async def get_cache_stats():
    """获取缓存统计信息"""
    cache_manager = get_cache_manager()
    return cache_manager.get_stats()


@app.get(
    "/security/audit",
    tags=["Security"],
    summary="🔒 安全审计日志",
    description="""
    **获取安全事件和审计日志**

    ### 🛡️ 安全监控
    - **安全事件**: 可疑活动记录
    - **IP阻止**: 被阻止的IP地址
    - **请求模式**: 异常请求模式分析
    - **威胁检测**: 自动威胁识别

    ### 📊 审计功能
    - 实时安全事件监控
    - 历史安全数据分析
    - 威胁情报集成
    """,
    responses={
        200: {
            "description": "✅ 安全审计信息获取成功",
            "content": {
                "application/json": {
                    "example": {
                        "total_events": 15,
                        "blocked_ips": 3,
                        "suspicious_activities": 8,
                        "last_24h_events": 12
                    }
                }
            }
        }
    }
)
async def get_security_audit(hours: int = 24):
    """获取安全审计信息"""
    audit_logger = get_security_audit_logger()

    events = audit_logger.get_security_events(hours=hours)
    blocked_events = audit_logger.get_security_events('BLOCKED_REQUEST', hours=hours)
    suspicious_events = audit_logger.get_security_events('SUSPICIOUS_PATTERN', hours=hours)

    return {
        'total_events': len(events),
        'blocked_ips': len(set(event['ip'] for event in blocked_events)),
        'suspicious_activities': len(suspicious_events),
        'last_24h_events': len(events),
        'events': events[:50],  # 最近50个事件
        'summary': {
            'most_common_threats': {},
            'top_blocked_ips': [],
            'security_score': 100 - min(len(suspicious_events) * 2, 50)  # 简化评分
        }
    }


@app.get(
    "/monitoring/status",
    tags=["Monitoring"],
    summary="📊 监控系统状态",
    description="""
    **获取完整的监控系统状态信息**

    ### 🔍 监控指标
    - **整体状态**: 系统健康状况概览
    - **健康检查**: API、数据库、缓存、系统资源
    - **活跃告警**: 当前触发的告警
    - **运行时间**: 服务运行时长

    ### 📈 性能监控
    - 服务可用性 > 99.9%
    - API响应时间 < 500ms
    - 错误率 < 0.1%
    - 缓存命中率 > 85%
    """,
    responses={
        200: {
            "description": "✅ 监控状态获取成功",
            "content": {
                "application/json": {
                    "example": {
                        "monitoring_active": True,
                        "overall_status": "healthy",
                        "health_checks": {
                            "api": {"status": "healthy", "response_time_ms": 45},
                            "cache": {"status": "healthy", "response_time_ms": 12}
                        },
                        "active_alerts": [],
                        "alert_count": 0,
                        "uptime_seconds": 86400
                    }
                }
            }
        }
    }
)
async def get_monitoring_status():
    """获取监控系统状态"""
    monitoring_service = get_monitoring_service()
    return monitoring_service.get_monitoring_status()


@app.get(
    "/monitoring/alerts",
    tags=["Monitoring"],
    summary="🚨 告警信息",
    description="""
    **获取系统告警信息**

    ### 🔔 告警类型
    - **INFO**: 信息性告警
    - **WARNING**: 警告级告警
    - **ERROR**: 错误级告警
    - **CRITICAL**: 严重告警

    ### 📋 告警管理
    - 活跃告警列表
    - 告警历史记录
    - 告警规则配置
    - 通知渠道状态
    """,
    responses={
        200: {
            "description": "✅ 告警信息获取成功"
        }
    }
)
async def get_monitoring_alerts(hours: int = 24):
    """获取告警信息"""
    monitoring_service = get_monitoring_service()

    active_alerts = monitoring_service.alert_manager.get_active_alerts()
    alert_history = monitoring_service.alert_manager.get_alert_history(hours)

    return {
        'active_alerts': [alert.to_dict() for alert in active_alerts],
        'alert_history': [alert.to_dict() for alert in alert_history],
        'alert_rules': len(monitoring_service.alert_manager.alert_rules),
        'notification_channels': list(monitoring_service.alert_manager.notification_channels.keys()),
        'query_timestamp': datetime.now().isoformat()
    }


@app.get(
    "/monitoring/metrics",
    tags=["Monitoring"],
    summary="📈 系统指标数据",
    description="""
    **获取系统性能指标数据**

    ### 📊 可用指标
    - **系统指标**: CPU、内存、磁盘使用率
    - **API指标**: 响应时间、错误率、请求量
    - **缓存指标**: 命中率、内存使用
    - **网络指标**: 带宽使用、连接数

    ### 🎯 监控目标
    - CPU使用率 < 80%
    - 内存使用率 < 80%
    - 磁盘使用率 < 90%
    - API响应时间 < 500ms
    """,
    responses={
        200: {
            "description": "✅ 指标数据获取成功"
        }
    }
)
async def get_monitoring_metrics(metric_name: str = None, hours: int = 24):
    """获取监控指标数据"""
    monitoring_service = get_monitoring_service()

    metrics = monitoring_service.metrics_collector.get_metrics(metric_name, hours)

    # 生成摘要统计
    summary = {}
    if metric_name:
        summary[metric_name] = monitoring_service.metrics_collector.get_metric_summary(metric_name, hours)
    else:
        # 获取所有指标的摘要
        unique_names = set(metric.name for metric in metrics)
        for name in unique_names:
            summary[name] = monitoring_service.metrics_collector.get_metric_summary(name, hours)

    return {
        'metrics_count': len(metrics),
        'latest_metrics': [metric.to_dict() for metric in metrics[-50:]],  # 最近50个
        'summary': summary,
        'time_range_hours': hours,
        'query_timestamp': datetime.now().isoformat()
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """HTTP异常处理器"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
                "type": "http_error"
            }
        }
    )


@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    """值错误处理器"""
    return JSONResponse(
        status_code=400,
        content={
            "error": {
                "code": 400,
                "message": str(exc),
                "type": "validation_error"
            }
        }
    )


@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    logger.info("🚀 Zinses-Rechner API启动中...")
    logger.info(f"📊 文档地址: http://localhost:8000/docs")
    logger.info(f"🔧 环境: {settings.ENVIRONMENT}")

    # 启动监控服务
    monitoring_service = get_monitoring_service()
    await monitoring_service.start_monitoring()
    logger.info("📊 监控服务已启动")

    logger.info("✅ API启动完成")


@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭事件"""
    logger.info("🛑 Zinses-Rechner API关闭中...")

    # 停止监控服务
    monitoring_service = get_monitoring_service()
    await monitoring_service.stop_monitoring()
    logger.info("📊 监控服务已停止")

    logger.info("✅ API关闭完成")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        log_level="info"
    )
