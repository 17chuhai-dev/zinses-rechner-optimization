"""
应用配置设置
使用Pydantic Settings进行环境变量管理
"""

from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import List, Optional
import os


class Settings(BaseSettings):
    """应用设置类"""
    
    # 基础设置
    PROJECT_NAME: str = "Zinses-Rechner API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")
    
    # 服务器设置
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")
    
    # CORS设置
    ALLOWED_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174"
        ],
        env="ALLOWED_ORIGINS"
    )
    
    ALLOWED_HOSTS: List[str] = Field(
        default=["localhost", "127.0.0.1"],
        env="ALLOWED_HOSTS"
    )
    
    # API设置
    API_V1_PREFIX: str = "/api/v1"
    
    # 计算限制设置
    MAX_CALCULATION_YEARS: int = Field(default=50, env="MAX_CALCULATION_YEARS")
    MAX_PRINCIPAL_AMOUNT: float = Field(default=10_000_000.0, env="MAX_PRINCIPAL_AMOUNT")
    MAX_MONTHLY_PAYMENT: float = Field(default=50_000.0, env="MAX_MONTHLY_PAYMENT")
    MAX_ANNUAL_RATE: float = Field(default=20.0, env="MAX_ANNUAL_RATE")
    
    # 缓存设置
    CACHE_TTL: int = Field(default=300, env="CACHE_TTL")  # 5分钟
    
    # 速率限制设置
    RATE_LIMIT_REQUESTS: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    RATE_LIMIT_WINDOW: int = Field(default=900, env="RATE_LIMIT_WINDOW")  # 15分钟
    
    # 日志设置
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FORMAT: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        env="LOG_FORMAT"
    )
    
    # 德国本地化设置
    DEFAULT_LOCALE: str = Field(default="de_DE", env="DEFAULT_LOCALE")
    DEFAULT_CURRENCY: str = Field(default="EUR", env="DEFAULT_CURRENCY")
    DEFAULT_TAX_RATE: float = Field(default=0.25, env="DEFAULT_TAX_RATE")  # Abgeltungssteuer
    SOLIDARITY_TAX_RATE: float = Field(default=0.055, env="SOLIDARITY_TAX_RATE")  # Solidaritätszuschlag
    
    @validator("ALLOWED_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        """解析CORS origins"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @validator("ALLOWED_HOSTS", pre=True)
    def parse_allowed_hosts(cls, v):
        """解析允许的主机"""
        if isinstance(v, str):
            return [host.strip() for host in v.split(",")]
        return v
    
    @validator("ENVIRONMENT")
    def validate_environment(cls, v):
        """验证环境设置"""
        allowed_envs = ["development", "staging", "production"]
        if v not in allowed_envs:
            raise ValueError(f"Environment must be one of: {allowed_envs}")
        return v
    
    @validator("LOG_LEVEL")
    def validate_log_level(cls, v):
        """验证日志级别"""
        allowed_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in allowed_levels:
            raise ValueError(f"Log level must be one of: {allowed_levels}")
        return v.upper()
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# 创建全局设置实例
settings = Settings()


def get_settings() -> Settings:
    """获取应用设置"""
    return settings
