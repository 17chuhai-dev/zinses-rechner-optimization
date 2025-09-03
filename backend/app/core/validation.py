"""
数据验证模块
为德国复利计算器提供后端数据验证功能
"""

from typing import Any, Dict, List, Optional, Union
from decimal import Decimal, InvalidOperation
from pydantic import BaseModel, Field, validator
from fastapi import HTTPException, status


class ValidationError(Exception):
    """自定义验证错误"""
    def __init__(self, field: str, message: str, code: str = "VALIDATION_ERROR"):
        self.field = field
        self.message = message
        self.code = code
        super().__init__(f"{field}: {message}")


class CalculatorInputValidator(BaseModel):
    """计算器输入验证模型"""
    
    principal: Decimal = Field(
        ...,
        ge=Decimal("1"),
        le=Decimal("10000000"),
        description="Startkapital in Euro (1€ - 10.000.000€)"
    )
    
    monthly_payment: Decimal = Field(
        default=Decimal("0"),
        ge=Decimal("0"),
        le=Decimal("50000"),
        description="Monatliche Sparrate in Euro (0€ - 50.000€)"
    )
    
    annual_rate: Decimal = Field(
        ...,
        ge=Decimal("0"),
        le=Decimal("20"),
        description="Jährlicher Zinssatz in Prozent (0% - 20%)"
    )
    
    years: int = Field(
        ...,
        ge=1,
        le=50,
        description="Anlagezeitraum in Jahren (1 - 50 Jahre)"
    )
    
    compound_frequency: str = Field(
        default="monthly",
        pattern="^(monthly|quarterly|yearly)$",
        description="Zinszahlungsfrequenz"
    )

    @validator('principal')
    def validate_principal(cls, v):
        """验证本金"""
        if v <= 0:
            raise ValueError("Das Startkapital muss größer als 0€ sein")
        if v > Decimal("10000000"):
            raise ValueError("Das Startkapital darf nicht größer als 10.000.000€ sein")
        return v

    @validator('monthly_payment')
    def validate_monthly_payment(cls, v):
        """验证月供"""
        if v < 0:
            raise ValueError("Die monatliche Sparrate kann nicht negativ sein")
        if v > Decimal("50000"):
            raise ValueError("Die monatliche Sparrate darf nicht größer als 50.000€ sein")
        return v

    @validator('annual_rate')
    def validate_annual_rate(cls, v):
        """验证年利率"""
        if v < 0:
            raise ValueError("Der Zinssatz kann nicht negativ sein")
        if v > Decimal("20"):
            raise ValueError("Der Zinssatz darf nicht größer als 20% sein")
        return v

    @validator('years')
    def validate_years(cls, v):
        """验证年限"""
        if v < 1:
            raise ValueError("Die Laufzeit muss mindestens 1 Jahr betragen")
        if v > 50:
            raise ValueError("Die Laufzeit darf nicht länger als 50 Jahre sein")
        return v

    @validator('compound_frequency')
    def validate_compound_frequency(cls, v):
        """验证复利频率"""
        valid_frequencies = ["monthly", "quarterly", "yearly"]
        if v not in valid_frequencies:
            raise ValueError(f"Ungültige Zinszahlungsfrequenz. Erlaubt: {', '.join(valid_frequencies)}")
        return v

    def validate_business_logic(self) -> List[str]:
        """业务逻辑验证"""
        warnings = []
        
        # 检查月供与本金的比例
        if self.monthly_payment > 0:
            monthly_to_yearly_ratio = (self.monthly_payment * 12) / self.principal
            if monthly_to_yearly_ratio > 2:
                warnings.append(
                    "Die monatliche Sparrate ist sehr hoch im Verhältnis zum Startkapital. "
                    "Bitte überprüfen Sie Ihre Eingaben."
                )
        
        # 检查极端投资期限
        if self.years > 40:
            warnings.append(
                "Eine Laufzeit von über 40 Jahren ist sehr lang. "
                "Berücksichtigen Sie Inflation und Lebensumstände."
            )
        
        # 检查不现实的利率
        if self.annual_rate > Decimal("15"):
            warnings.append(
                "Ein Zinssatz über 15% ist sehr optimistisch. "
                "Bitte prüfen Sie realistische Markterwartungen."
            )
        
        # 检查低利率警告
        if self.annual_rate < Decimal("0.1"):
            warnings.append(
                "Ein Zinssatz unter 0,1% ist sehr niedrig. "
                "Berücksichtigen Sie Inflation und Opportunitätskosten."
            )
        
        return warnings


def validate_calculation_input(data: Dict[str, Any]) -> CalculatorInputValidator:
    """
    验证计算输入数据
    
    Args:
        data: 输入数据字典
        
    Returns:
        验证后的数据模型
        
    Raises:
        HTTPException: 验证失败时抛出HTTP异常
    """
    try:
        # 数据类型转换
        processed_data = {}
        
        # 处理数字字段
        for field in ['principal', 'monthly_payment', 'annual_rate']:
            if field in data:
                try:
                    processed_data[field] = Decimal(str(data[field]))
                except (InvalidOperation, ValueError):
                    raise ValidationError(
                        field=field,
                        message=f"Ungültiger Wert für {field}. Bitte geben Sie eine gültige Zahl ein.",
                        code="INVALID_NUMBER"
                    )
        
        # 处理整数字段
        if 'years' in data:
            try:
                processed_data['years'] = int(data['years'])
            except (ValueError, TypeError):
                raise ValidationError(
                    field='years',
                    message="Ungültiger Wert für Jahre. Bitte geben Sie eine ganze Zahl ein.",
                    code="INVALID_INTEGER"
                )
        
        # 处理字符串字段
        if 'compound_frequency' in data:
            processed_data['compound_frequency'] = str(data['compound_frequency']).lower()
        
        # 创建验证模型
        validator = CalculatorInputValidator(**processed_data)
        
        return validator
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "Validation Error",
                "message": e.message,
                "field": e.field,
                "code": e.code
            }
        )
    except ValueError as e:
        # Pydantic验证错误
        error_msg = str(e)
        field = "unknown"
        
        # 尝试从错误消息中提取字段名
        if "principal" in error_msg.lower():
            field = "principal"
        elif "monthly_payment" in error_msg.lower():
            field = "monthly_payment"
        elif "annual_rate" in error_msg.lower():
            field = "annual_rate"
        elif "years" in error_msg.lower():
            field = "years"
        elif "compound_frequency" in error_msg.lower():
            field = "compound_frequency"
        
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "Validation Error",
                "message": error_msg,
                "field": field,
                "code": "VALIDATION_ERROR"
            }
        )


def validate_api_limits(data: CalculatorInputValidator) -> None:
    """
    验证API使用限制
    
    Args:
        data: 验证后的输入数据
        
    Raises:
        HTTPException: 超出限制时抛出异常
    """
    # 检查计算复杂度
    total_periods = data.years * 12  # 总月数
    if total_periods > 600:  # 50年 * 12月
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "Calculation Limit Exceeded",
                "message": "Die Berechnung ist zu komplex. Maximale Laufzeit: 50 Jahre.",
                "code": "CALCULATION_TOO_COMPLEX"
            }
        )
    
    # 检查极端值组合
    total_investment = data.principal + (data.monthly_payment * 12 * data.years)
    if total_investment > Decimal("50000000"):  # 5000万欧元
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "Investment Too Large",
                "message": "Die Gesamtinvestition ist zu hoch für diese Berechnung.",
                "code": "INVESTMENT_TOO_LARGE"
            }
        )


def format_validation_errors(errors: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    格式化验证错误为德语消息
    
    Args:
        errors: Pydantic验证错误列表
        
    Returns:
        格式化的错误响应
    """
    formatted_errors = []
    
    for error in errors:
        field = error.get('loc', ['unknown'])[-1]
        error_type = error.get('type', 'value_error')
        
        # 德语错误消息映射
        message_map = {
            'value_error.number.not_ge': f"Der Wert für {field} ist zu klein",
            'value_error.number.not_le': f"Der Wert für {field} ist zu groß",
            'value_error.missing': f"Das Feld {field} ist erforderlich",
            'type_error.integer': f"Das Feld {field} muss eine ganze Zahl sein",
            'type_error.decimal': f"Das Feld {field} muss eine Dezimalzahl sein",
        }
        
        message = message_map.get(error_type, error.get('msg', 'Ungültiger Wert'))
        
        formatted_errors.append({
            'field': field,
            'message': message,
            'code': error_type.upper().replace('.', '_')
        })
    
    return {
        'error': 'Validation Failed',
        'message': 'Die Eingabedaten sind ungültig',
        'details': formatted_errors
    }
