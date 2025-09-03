"""
健康检查端点
提供系统状态和健康监控功能
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Any
import psutil
import time
from datetime import datetime

from app.core.config import get_settings, Settings

router = APIRouter()


class HealthResponse(BaseModel):
    """健康检查响应模型"""
    status: str
    timestamp: str
    version: str
    environment: str
    uptime: float
    system: Dict[str, Any]


class DetailedHealthResponse(BaseModel):
    """详细健康检查响应模型"""
    status: str
    timestamp: str
    version: str
    environment: str
    uptime: float
    system: Dict[str, Any]
    services: Dict[str, str]
    configuration: Dict[str, Any]


# 应用启动时间
start_time = time.time()


@router.get("/", response_model=HealthResponse)
async def health_check(settings: Settings = Depends(get_settings)):
    """基础健康检查"""
    current_time = datetime.utcnow()
    uptime = time.time() - start_time
    
    # 获取系统信息
    system_info = {
        "cpu_percent": psutil.cpu_percent(interval=1),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage('/').percent,
        "load_average": psutil.getloadavg()[0] if hasattr(psutil, 'getloadavg') else None
    }
    
    return HealthResponse(
        status="healthy",
        timestamp=current_time.isoformat() + "Z",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        uptime=uptime,
        system=system_info
    )


@router.get("/detailed", response_model=DetailedHealthResponse)
async def detailed_health_check(settings: Settings = Depends(get_settings)):
    """详细健康检查"""
    current_time = datetime.utcnow()
    uptime = time.time() - start_time
    
    # 获取系统信息
    system_info = {
        "cpu_percent": psutil.cpu_percent(interval=1),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage('/').percent,
        "load_average": psutil.getloadavg()[0] if hasattr(psutil, 'getloadavg') else None,
        "boot_time": datetime.fromtimestamp(psutil.boot_time()).isoformat(),
        "python_version": f"{psutil.sys.version_info.major}.{psutil.sys.version_info.minor}.{psutil.sys.version_info.micro}"
    }
    
    # 服务状态检查
    services = {
        "api": "healthy",
        "calculator": "healthy",
        "logging": "healthy"
    }
    
    # 配置信息（不包含敏感数据）
    configuration = {
        "max_calculation_years": settings.MAX_CALCULATION_YEARS,
        "max_principal_amount": settings.MAX_PRINCIPAL_AMOUNT,
        "cache_ttl": settings.CACHE_TTL,
        "rate_limit_requests": settings.RATE_LIMIT_REQUESTS,
        "default_locale": settings.DEFAULT_LOCALE,
        "default_currency": settings.DEFAULT_CURRENCY
    }
    
    return DetailedHealthResponse(
        status="healthy",
        timestamp=current_time.isoformat() + "Z",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        uptime=uptime,
        system=system_info,
        services=services,
        configuration=configuration
    )


@router.get("/ready")
async def readiness_check():
    """就绪检查 - 用于Kubernetes等容器编排"""
    return {"status": "ready", "timestamp": datetime.utcnow().isoformat() + "Z"}


@router.get("/live")
async def liveness_check():
    """存活检查 - 用于Kubernetes等容器编排"""
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat() + "Z"}
