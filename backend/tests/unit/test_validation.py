"""
数据验证逻辑单元测试
测试输入验证和错误处理
"""

import pytest
from decimal import Decimal
from fastapi import HTTPException
from pydantic import ValidationError

from app.core.validation import (
    CalculatorInputValidator,
    validate_calculation_input,
    validate_api_limits
)


class TestCalculatorInputValidator:
    """计算器输入验证器测试"""
    
    @pytest.mark.unit
    @pytest.mark.validation
    def test_valid_input_validation(self, valid_calculator_request):
        """测试有效输入验证"""
        validator = CalculatorInputValidator(**valid_calculator_request)
        
        assert validator.principal == Decimal("10000.0")
        assert validator.monthly_payment == Decimal("500.0")
        assert validator.annual_rate == Decimal("4.0")
        assert validator.years == 10
        assert validator.compound_frequency == "monthly"
    
    @pytest.mark.unit
    @pytest.mark.validation
    def test_principal_validation(self):
        """测试本金验证"""
        # 有效本金
        valid_data = {
            "principal": 10000,
            "annual_rate": 4.0,
            "years": 10
        }
        validator = CalculatorInputValidator(**valid_data)
        assert validator.principal == Decimal("10000")
        
        # 无效本金 - 负数
        with pytest.raises(ValidationError) as exc_info:
            CalculatorInputValidator(
                principal=-1000,
                annual_rate=4.0,
                years=10
            )
        assert "größer als 0" in str(exc_info.value)
        
        # 无效本金 - 超出上限
        with pytest.raises(ValidationError) as exc_info:
            CalculatorInputValidator(
                principal=20000000,
                annual_rate=4.0,
                years=10
            )
        assert "nicht größer als 10.000.000" in str(exc_info.value)
    
    @pytest.mark.unit
    @pytest.mark.validation
    def test_monthly_payment_validation(self):
        """测试月供验证"""
        # 有效月供 - 零值
        valid_data = {
            "principal": 10000,
            "monthly_payment": 0,
            "annual_rate": 4.0,
            "years": 10
        }
        validator = CalculatorInputValidator(**valid_data)
        assert validator.monthly_payment == Decimal("0")
        
        # 有效月供 - 正值
        valid_data["monthly_payment"] = 500
        validator = CalculatorInputValidator(**valid_data)
        assert validator.monthly_payment == Decimal("500")
        
        # 无效月供 - 负数
        with pytest.raises(ValidationError) as exc_info:
            CalculatorInputValidator(
                principal=10000,
                monthly_payment=-100,
                annual_rate=4.0,
                years=10
            )
        assert "nicht negativ" in str(exc_info.value)
        
        # 无效月供 - 超出上限
        with pytest.raises(ValidationError) as exc_info:
            CalculatorInputValidator(
                principal=10000,
                monthly_payment=100000,
                annual_rate=4.0,
                years=10
            )
        assert "nicht größer als 50.000" in str(exc_info.value)
    
    @pytest.mark.unit
    @pytest.mark.validation
    def test_annual_rate_validation(self):
        """测试年利率验证"""
        # 有效利率
        valid_data = {
            "principal": 10000,
            "annual_rate": 5.5,
            "years": 10
        }
        validator = CalculatorInputValidator(**valid_data)
        assert validator.annual_rate == Decimal("5.5")
        
        # 边界值 - 零利率
        valid_data["annual_rate"] = 0
        validator = CalculatorInputValidator(**valid_data)
        assert validator.annual_rate == Decimal("0")
        
        # 边界值 - 最大利率
        valid_data["annual_rate"] = 20
        validator = CalculatorInputValidator(**valid_data)
        assert validator.annual_rate == Decimal("20")
        
        # 无效利率 - 负数
        with pytest.raises(ValidationError) as exc_info:
            CalculatorInputValidator(
                principal=10000,
                annual_rate=-1,
                years=10
            )
        assert "nicht negativ" in str(exc_info.value)
        
        # 无效利率 - 超出上限
        with pytest.raises(ValidationError) as exc_info:
            CalculatorInputValidator(
                principal=10000,
                annual_rate=25,
                years=10
            )
        assert "nicht größer als 20" in str(exc_info.value)
    
    @pytest.mark.unit
    @pytest.mark.validation
    def test_years_validation(self):
        """测试年限验证"""
        # 有效年限
        valid_data = {
            "principal": 10000,
            "annual_rate": 4.0,
            "years": 15
        }
        validator = CalculatorInputValidator(**valid_data)
        assert validator.years == 15
        
        # 边界值 - 最小年限
        valid_data["years"] = 1
        validator = CalculatorInputValidator(**valid_data)
        assert validator.years == 1
        
        # 边界值 - 最大年限
        valid_data["years"] = 50
        validator = CalculatorInputValidator(**valid_data)
        assert validator.years == 50
        
        # 无效年限 - 零
        with pytest.raises(ValidationError) as exc_info:
            CalculatorInputValidator(
                principal=10000,
                annual_rate=4.0,
                years=0
            )
        assert "mindestens 1 Jahr" in str(exc_info.value)
        
        # 无效年限 - 超出上限
        with pytest.raises(ValidationError) as exc_info:
            CalculatorInputValidator(
                principal=10000,
                annual_rate=4.0,
                years=100
            )
        assert "nicht länger als 50 Jahre" in str(exc_info.value)
    
    @pytest.mark.unit
    @pytest.mark.validation
    def test_compound_frequency_validation(self):
        """测试复利频率验证"""
        valid_frequencies = ["monthly", "quarterly", "yearly"]
        
        for frequency in valid_frequencies:
            validator = CalculatorInputValidator(
                principal=10000,
                annual_rate=4.0,
                years=10,
                compound_frequency=frequency
            )
            assert validator.compound_frequency == frequency
        
        # 无效频率
        with pytest.raises(ValidationError) as exc_info:
            CalculatorInputValidator(
                principal=10000,
                annual_rate=4.0,
                years=10,
                compound_frequency="invalid"
            )
        assert "Ungültige Zinszahlungsfrequenz" in str(exc_info.value)
    
    @pytest.mark.unit
    @pytest.mark.validation
    def test_business_logic_validation(self):
        """测试业务逻辑验证"""
        # 正常情况 - 无警告
        validator = CalculatorInputValidator(
            principal=10000,
            monthly_payment=500,
            annual_rate=5.0,
            years=10
        )
        warnings = validator.validate_business_logic()
        assert len(warnings) == 0
        
        # 月供过高警告
        validator = CalculatorInputValidator(
            principal=1000,
            monthly_payment=500,  # 月供是本金的60%
            annual_rate=5.0,
            years=10
        )
        warnings = validator.validate_business_logic()
        assert len(warnings) > 0
        assert any("sehr hoch im Verhältnis" in w for w in warnings)
        
        # 期限过长警告
        validator = CalculatorInputValidator(
            principal=10000,
            monthly_payment=100,
            annual_rate=5.0,
            years=45  # 超过40年
        )
        warnings = validator.validate_business_logic()
        assert len(warnings) > 0
        assert any("sehr lang" in w for w in warnings)
        
        # 利率过高警告
        validator = CalculatorInputValidator(
            principal=10000,
            monthly_payment=100,
            annual_rate=18.0,  # 超过15%
            years=10
        )
        warnings = validator.validate_business_logic()
        assert len(warnings) > 0
        assert any("sehr optimistisch" in w for w in warnings)


class TestValidationFunctions:
    """验证函数测试"""
    
    @pytest.mark.unit
    @pytest.mark.validation
    def test_validate_calculation_input_success(self, valid_calculator_request):
        """测试成功的输入验证"""
        result = validate_calculation_input(valid_calculator_request)
        
        assert isinstance(result, CalculatorInputValidator)
        assert result.principal == Decimal("10000.0")
        assert result.monthly_payment == Decimal("500.0")
        assert result.annual_rate == Decimal("4.0")
        assert result.years == 10
    
    @pytest.mark.unit
    @pytest.mark.validation
    def test_validate_calculation_input_invalid_number(self):
        """测试无效数字输入"""
        invalid_data = {
            "principal": "invalid_number",
            "annual_rate": 4.0,
            "years": 10
        }
        
        with pytest.raises(HTTPException) as exc_info:
            validate_calculation_input(invalid_data)
        
        assert exc_info.value.status_code == 422
        assert "Ungültiger Wert" in exc_info.value.detail["message"]
    
    @pytest.mark.unit
    @pytest.mark.validation
    def test_validate_calculation_input_missing_field(self):
        """测试缺少必需字段"""
        incomplete_data = {
            "monthly_payment": 500.0,
            "annual_rate": 4.0,
            "years": 10
            # 缺少 principal
        }
        
        with pytest.raises(HTTPException) as exc_info:
            validate_calculation_input(incomplete_data)
        
        assert exc_info.value.status_code == 422
    
    @pytest.mark.unit
    @pytest.mark.validation
    def test_validate_api_limits_normal(self, valid_calculator_request):
        """测试正常API限制验证"""
        validator = CalculatorInputValidator(**valid_calculator_request)
        
        # 应该不抛出异常
        validate_api_limits(validator)
    
    @pytest.mark.unit
    @pytest.mark.validation
    def test_validate_api_limits_too_complex(self):
        """测试过于复杂的计算"""
        validator = CalculatorInputValidator(
            principal=10000,
            monthly_payment=1000,
            annual_rate=5.0,
            years=60  # 超过50年限制
        )
        
        with pytest.raises(HTTPException) as exc_info:
            validate_api_limits(validator)
        
        assert exc_info.value.status_code == 422
        assert "zu komplex" in exc_info.value.detail["message"]
    
    @pytest.mark.unit
    @pytest.mark.validation
    def test_validate_api_limits_investment_too_large(self):
        """测试投资金额过大"""
        validator = CalculatorInputValidator(
            principal=10000000,
            monthly_payment=50000,
            annual_rate=5.0,
            years=50
        )
        
        with pytest.raises(HTTPException) as exc_info:
            validate_api_limits(validator)
        
        assert exc_info.value.status_code == 422
        assert "zu hoch" in exc_info.value.detail["message"]
    
    @pytest.mark.unit
    @pytest.mark.validation
    def test_decimal_precision_handling(self):
        """测试小数精度处理"""
        data = {
            "principal": 10000.123456789,
            "monthly_payment": 500.987654321,
            "annual_rate": 4.123456789,
            "years": 10
        }
        
        validator = validate_calculation_input(data)
        
        # 验证精度保持
        assert isinstance(validator.principal, Decimal)
        assert isinstance(validator.monthly_payment, Decimal)
        assert isinstance(validator.annual_rate, Decimal)
