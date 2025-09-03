"""
日志配置模块
配置结构化日志记录，支持德语本地化
"""

import logging
import logging.config
import sys
from typing import Dict, Any
from app.core.config import settings


class GermanFormatter(logging.Formatter):
    """德语本地化日志格式化器"""
    
    LEVEL_NAMES = {
        'DEBUG': 'DEBUG',
        'INFO': 'INFO',
        'WARNING': 'WARNUNG',
        'ERROR': 'FEHLER',
        'CRITICAL': 'KRITISCH'
    }
    
    def format(self, record):
        # 替换日志级别为德语
        if record.levelname in self.LEVEL_NAMES:
            record.levelname = self.LEVEL_NAMES[record.levelname]
        
        return super().format(record)


def setup_logging():
    """设置应用日志配置"""
    
    logging_config: Dict[str, Any] = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "()": GermanFormatter,
                "format": settings.LOG_FORMAT,
                "datefmt": "%Y-%m-%d %H:%M:%S"
            },
            "detailed": {
                "()": GermanFormatter,
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(module)s:%(lineno)d - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            },
            "json": {
                "()": GermanFormatter,
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(module)s:%(lineno)d - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": settings.LOG_LEVEL,
                "formatter": "default",
                "stream": sys.stdout
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": settings.LOG_LEVEL,
                "formatter": "detailed",
                "filename": "logs/app.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
                "encoding": "utf-8"
            }
        },
        "loggers": {
            "": {  # root logger
                "level": settings.LOG_LEVEL,
                "handlers": ["console"],
                "propagate": False
            },
            "app": {
                "level": settings.LOG_LEVEL,
                "handlers": ["console", "file"] if settings.ENVIRONMENT != "development" else ["console"],
                "propagate": False
            },
            "uvicorn": {
                "level": "INFO",
                "handlers": ["console"],
                "propagate": False
            },
            "uvicorn.error": {
                "level": "INFO",
                "handlers": ["console"],
                "propagate": False
            },
            "uvicorn.access": {
                "level": "INFO",
                "handlers": ["console"],
                "propagate": False
            }
        }
    }
    
    # 创建日志目录
    import os
    os.makedirs("logs", exist_ok=True)
    
    # 应用日志配置
    logging.config.dictConfig(logging_config)
    
    # 设置第三方库日志级别
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """获取指定名称的日志记录器"""
    return logging.getLogger(f"app.{name}")


# 创建应用日志记录器
logger = get_logger(__name__)
