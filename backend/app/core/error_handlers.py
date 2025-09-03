"""
全局错误处理中间件
为德国复利计算器提供统一的错误处理和德语错误消息
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from typing import Union
import logging

from app.core.logging import get_logger

logger = get_logger(__name__)


class ErrorResponse:
    """标准错误响应格式"""
    
    def __init__(
        self,
        error: str,
        message: str,
        code: str = "UNKNOWN_ERROR",
        details: Union[dict, list, None] = None,
        status_code: int = 500
    ):
        self.error = error
        self.message = message
        self.code = code
        self.details = details
        self.status_code = status_code
    
    def to_dict(self) -> dict:
        response = {
            "error": self.error,
            "message": self.message,
            "code": self.code
        }
        if self.details:
            response["details"] = self.details
        return response


def create_error_response(
    error_type: str,
    message: str,
    code: str = "UNKNOWN_ERROR",
    details: Union[dict, list, None] = None,
    status_code: int = 500
) -> JSONResponse:
    """创建标准错误响应"""
    error_response = ErrorResponse(error_type, message, code, details, status_code)
    return JSONResponse(
        status_code=status_code,
        content=error_response.to_dict()
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """处理Pydantic验证错误"""
    logger.warning(f"验证错误: {exc.errors()}")
    
    # 转换为德语错误消息
    german_errors = []
    for error in exc.errors():
        field = error.get('loc', ['unknown'])[-1]
        error_type = error.get('type', 'value_error')
        
        # 德语错误消息映射
        german_message = get_german_validation_message(field, error_type, error)
        
        german_errors.append({
            'field': field,
            'message': german_message,
            'code': error_type.upper().replace('.', '_')
        })
    
    return create_error_response(
        error_type="Validation Error",
        message="Die Eingabedaten sind ungültig",
        code="VALIDATION_FAILED",
        details=german_errors,
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
    )


async def http_exception_handler(request: Request, exc: HTTPException):
    """处理HTTP异常"""
    logger.warning(f"HTTP异常: {exc.status_code} - {exc.detail}")
    
    # 如果detail已经是字典格式，直接返回
    if isinstance(exc.detail, dict):
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.detail
        )
    
    # 转换为标准格式
    return create_error_response(
        error_type="HTTP Error",
        message=str(exc.detail),
        code=f"HTTP_{exc.status_code}",
        status_code=exc.status_code
    )


async def general_exception_handler(request: Request, exc: Exception):
    """处理一般异常"""
    logger.error(f"未处理的异常: {type(exc).__name__}: {str(exc)}", exc_info=True)
    
    return create_error_response(
        error_type="Internal Server Error",
        message="Ein unerwarteter Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
        code="INTERNAL_SERVER_ERROR",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


def get_german_validation_message(field: str, error_type: str, error_detail: dict) -> str:
    """获取德语验证错误消息"""
    
    # 字段名德语映射
    field_names = {
        'principal': 'Startkapital',
        'monthly_payment': 'Monatliche Sparrate',
        'annual_rate': 'Zinssatz',
        'years': 'Laufzeit',
        'compound_frequency': 'Zinszahlungsfrequenz'
    }
    
    german_field = field_names.get(field, field)
    
    # 错误类型德语消息映射
    error_messages = {
        'missing': f"Das Feld '{german_field}' ist erforderlich",
        'value_error.missing': f"Das Feld '{german_field}' ist erforderlich",
        'type_error.integer': f"Das Feld '{german_field}' muss eine ganze Zahl sein",
        'type_error.float': f"Das Feld '{german_field}' muss eine Dezimalzahl sein",
        'value_error.number.not_gt': f"Das Feld '{german_field}' muss größer als {error_detail.get('ctx', {}).get('limit_value', 0)} sein",
        'value_error.number.not_ge': f"Das Feld '{german_field}' muss mindestens {error_detail.get('ctx', {}).get('limit_value', 0)} betragen",
        'value_error.number.not_le': f"Das Feld '{german_field}' darf höchstens {error_detail.get('ctx', {}).get('limit_value', 0)} betragen",
        'value_error.number.not_lt': f"Das Feld '{german_field}' muss kleiner als {error_detail.get('ctx', {}).get('limit_value', 0)} sein",
        'value_error.str.regex': f"Das Feld '{german_field}' hat ein ungültiges Format",
    }
    
    # 特定字段的自定义消息
    if field == 'principal':
        if 'not_gt' in error_type or 'not_ge' in error_type:
            return "Das Startkapital muss größer als 0€ sein"
        elif 'not_le' in error_type:
            return "Das Startkapital darf nicht größer als 10.000.000€ sein"
    elif field == 'monthly_payment':
        if 'not_ge' in error_type:
            return "Die monatliche Sparrate kann nicht negativ sein"
        elif 'not_le' in error_type:
            return "Die monatliche Sparrate darf nicht größer als 50.000€ sein"
    elif field == 'annual_rate':
        if 'not_gt' in error_type or 'not_ge' in error_type:
            return "Der Zinssatz muss größer als 0% sein"
        elif 'not_le' in error_type:
            return "Der Zinssatz darf nicht größer als 20% sein"
    elif field == 'years':
        if 'not_gt' in error_type or 'not_ge' in error_type:
            return "Die Laufzeit muss mindestens 1 Jahr betragen"
        elif 'not_le' in error_type:
            return "Die Laufzeit darf nicht länger als 50 Jahre sein"
    elif field == 'compound_frequency':
        return "Ungültige Zinszahlungsfrequenz. Erlaubt: monthly, quarterly, yearly"
    
    # 默认消息
    return error_messages.get(error_type, f"Ungültiger Wert für das Feld '{german_field}'")


# 错误代码常量
class ErrorCodes:
    """错误代码常量"""
    
    # 验证错误
    VALIDATION_FAILED = "VALIDATION_FAILED"
    REQUIRED_FIELD = "REQUIRED_FIELD"
    INVALID_TYPE = "INVALID_TYPE"
    VALUE_OUT_OF_RANGE = "VALUE_OUT_OF_RANGE"
    
    # 业务逻辑错误
    CALCULATION_ERROR = "CALCULATION_ERROR"
    INVALID_COMBINATION = "INVALID_COMBINATION"
    UNREALISTIC_VALUES = "UNREALISTIC_VALUES"
    
    # 系统错误
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    
    # 网络错误
    NETWORK_ERROR = "NETWORK_ERROR"
    TIMEOUT_ERROR = "TIMEOUT_ERROR"


# 德语错误消息常量
class GermanErrorMessages:
    """德语错误消息常量"""
    
    VALIDATION_FAILED = "Die Eingabedaten sind ungültig"
    CALCULATION_ERROR = "Fehler bei der Berechnung"
    INTERNAL_SERVER_ERROR = "Ein unerwarteter Serverfehler ist aufgetreten"
    SERVICE_UNAVAILABLE = "Der Service ist vorübergehend nicht verfügbar"
    RATE_LIMIT_EXCEEDED = "Zu viele Anfragen. Bitte versuchen Sie es später erneut"
    NETWORK_ERROR = "Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung"
    TIMEOUT_ERROR = "Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut"
