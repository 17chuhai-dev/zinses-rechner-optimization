"""
API v1 主路由
聚合所有v1版本的API端点
"""

from fastapi import APIRouter
from app.api.v1.endpoints import calculator, privacy, health
from app.api.v1 import export

# 创建API路由器
api_router = APIRouter()

# 包含各个端点路由
api_router.include_router(
    calculator.router,
    prefix="/calculator",
    tags=["Calculator"]
)

api_router.include_router(
    health.router,
    prefix="/health",
    tags=["Health"]
)

api_router.include_router(
    privacy.router,
    prefix="/privacy",
    tags=["Privacy"]
)

api_router.include_router(
    export.router,
    prefix="/export",
    tags=["Export"]
)
