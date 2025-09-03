from fastapi import APIRouter
from .endpoints.calculator import router as calculator_router
from .endpoints.health import router as health_router
from .export import router as export_router

api_router = APIRouter()
api_router.include_router(calculator_router, prefix="/calculator", tags=["Calculator"])
api_router.include_router(health_router, prefix="/health", tags=["Health"])
api_router.include_router(export_router, prefix="/export", tags=["Export"])