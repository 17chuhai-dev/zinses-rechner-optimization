"""
复利计算服务单元测试
测试核心计算算法的准确性和边界情况
"""

import pytest
import math
from decimal import Decimal
from app.services.calculator_service import CalculatorService
from app.models.calculator import CalculatorRequest


class TestCalculatorService:
    """复利计算服务测试类"""
    
    def setup_method(self):
        """测试前设置"""
        self.calculator = CalculatorService()
    
    @pytest.mark.unit
    @pytest.mark.calculation
    def test_simple_compound_interest_calculation(self):
        """测试简单复利计算"""
        request = CalculatorRequest(
            principal=10000.0,
            monthly_payment=0.0,
            annual_rate=5.0,
            years=10,
            compound_frequency="yearly"
        )
        
        result = self.calculator.calculate_compound_interest(request)
        
        # 验证基本结构
        assert "final_amount" in result
        assert "total_contributions" in result
        assert "total_interest" in result
        
        # 验证计算结果（10000 * (1.05)^10 ≈ 16288.95）
        expected_final = 10000 * (1.05 ** 10)
        assert abs(result["final_amount"] - expected_final) < 1.0
        
        # 验证总投入等于本金（无月供）
        assert result["total_contributions"] == 10000.0
        
        # 验证利息收入
        expected_interest = expected_final - 10000
        assert abs(result["total_interest"] - expected_interest) < 1.0
    
    @pytest.mark.unit
    @pytest.mark.calculation
    def test_monthly_compound_interest(self):
        """测试月复利计算"""
        request = CalculatorRequest(
            principal=10000.0,
            monthly_payment=0.0,
            annual_rate=6.0,
            years=5,
            compound_frequency="monthly"
        )
        
        result = self.calculator.calculate_compound_interest(request)
        
        # 月复利公式: A = P(1 + r/12)^(12*t)
        monthly_rate = 0.06 / 12
        periods = 12 * 5
        expected_final = 10000 * ((1 + monthly_rate) ** periods)
        
        assert abs(result["final_amount"] - expected_final) < 1.0
    
    @pytest.mark.unit
    @pytest.mark.calculation
    def test_with_monthly_payments(self):
        """测试包含月供的复利计算"""
        request = CalculatorRequest(
            principal=10000.0,
            monthly_payment=500.0,
            annual_rate=4.0,
            years=10,
            compound_frequency="monthly"
        )
        
        result = self.calculator.calculate_compound_interest(request)
        
        # 验证总投入
        expected_contributions = 10000 + (500 * 12 * 10)
        assert result["total_contributions"] == expected_contributions
        
        # 最终金额应该大于总投入
        assert result["final_amount"] > result["total_contributions"]
        
        # 利息应该为正
        assert result["total_interest"] > 0
    
    @pytest.mark.unit
    @pytest.mark.calculation
    def test_zero_interest_rate(self):
        """测试零利率情况"""
        request = CalculatorRequest(
            principal=10000.0,
            monthly_payment=500.0,
            annual_rate=0.0,
            years=5,
            compound_frequency="monthly"
        )
        
        result = self.calculator.calculate_compound_interest(request)
        
        # 零利率时，最终金额应该等于总投入
        expected_total = 10000 + (500 * 12 * 5)
        assert result["final_amount"] == expected_total
        assert result["total_interest"] == 0.0
    
    @pytest.mark.unit
    @pytest.mark.calculation
    def test_quarterly_compounding(self):
        """测试季度复利"""
        request = CalculatorRequest(
            principal=5000.0,
            monthly_payment=0.0,
            annual_rate=8.0,
            years=3,
            compound_frequency="quarterly"
        )
        
        result = self.calculator.calculate_compound_interest(request)
        
        # 季度复利公式: A = P(1 + r/4)^(4*t)
        quarterly_rate = 0.08 / 4
        periods = 4 * 3
        expected_final = 5000 * ((1 + quarterly_rate) ** periods)
        
        assert abs(result["final_amount"] - expected_final) < 1.0
    
    @pytest.mark.unit
    @pytest.mark.calculation
    def test_yearly_breakdown_generation(self):
        """测试年度明细生成"""
        request = CalculatorRequest(
            principal=10000.0,
            monthly_payment=100.0,
            annual_rate=5.0,
            years=3,
            compound_frequency="monthly"
        )
        
        result = self.calculator.calculate_compound_interest(request)
        
        # 验证年度明细结构
        assert "yearly_breakdown" in result
        assert len(result["yearly_breakdown"]) == 3
        
        for i, year_data in enumerate(result["yearly_breakdown"]):
            assert "year" in year_data
            assert "start_amount" in year_data
            assert "contributions" in year_data
            assert "interest" in year_data
            assert "end_amount" in year_data
            assert "growth_rate" in year_data
            
            assert year_data["year"] == i + 1
            assert year_data["contributions"] == 1200.0  # 100 * 12
    
    @pytest.mark.unit
    @pytest.mark.calculation
    def test_large_numbers(self):
        """测试大数值计算"""
        request = CalculatorRequest(
            principal=1000000.0,
            monthly_payment=5000.0,
            annual_rate=7.0,
            years=20,
            compound_frequency="monthly"
        )
        
        result = self.calculator.calculate_compound_interest(request)
        
        # 验证结果为合理范围
        assert result["final_amount"] > 1000000
        assert result["final_amount"] < 10000000  # 合理上限
        assert result["total_interest"] > 0
    
    @pytest.mark.unit
    @pytest.mark.calculation
    def test_precision_with_decimals(self):
        """测试小数精度"""
        request = CalculatorRequest(
            principal=10000.50,
            monthly_payment=250.25,
            annual_rate=3.75,
            years=5,
            compound_frequency="monthly"
        )
        
        result = self.calculator.calculate_compound_interest(request)
        
        # 验证结果精度（保留2位小数）
        assert isinstance(result["final_amount"], float)
        assert round(result["final_amount"], 2) == result["final_amount"]
    
    @pytest.mark.unit
    @pytest.mark.calculation
    def test_annual_return_calculation(self):
        """测试年化收益率计算"""
        request = CalculatorRequest(
            principal=10000.0,
            monthly_payment=0.0,
            annual_rate=6.0,
            years=10,
            compound_frequency="yearly"
        )
        
        result = self.calculator.calculate_compound_interest(request)
        
        # 年化收益率应该接近设定的利率
        assert abs(result["annual_return"] - 6.0) < 0.5
    
    @pytest.mark.unit
    @pytest.mark.calculation
    def test_edge_case_minimum_values(self):
        """测试最小值边界情况"""
        request = CalculatorRequest(
            principal=1.0,
            monthly_payment=0.0,
            annual_rate=0.1,
            years=1,
            compound_frequency="yearly"
        )
        
        result = self.calculator.calculate_compound_interest(request)
        
        # 验证最小值计算正确
        expected_final = 1.0 * (1 + 0.001)  # 0.1% 利率
        assert abs(result["final_amount"] - expected_final) < 0.01
    
    @pytest.mark.unit
    @pytest.mark.calculation
    def test_edge_case_maximum_values(self):
        """测试最大值边界情况"""
        request = CalculatorRequest(
            principal=10000000.0,
            monthly_payment=50000.0,
            annual_rate=20.0,
            years=50,
            compound_frequency="monthly"
        )
        
        result = self.calculator.calculate_compound_interest(request)
        
        # 验证大值计算不会溢出
        assert result["final_amount"] > 0
        assert math.isfinite(result["final_amount"])
        assert not math.isnan(result["final_amount"])
    
    @pytest.mark.unit
    @pytest.mark.calculation
    def test_calculation_consistency(self):
        """测试计算一致性"""
        request = CalculatorRequest(
            principal=15000.0,
            monthly_payment=300.0,
            annual_rate=4.5,
            years=8,
            compound_frequency="monthly"
        )
        
        # 多次计算应该得到相同结果
        result1 = self.calculator.calculate_compound_interest(request)
        result2 = self.calculator.calculate_compound_interest(request)
        
        assert result1["final_amount"] == result2["final_amount"]
        assert result1["total_interest"] == result2["total_interest"]
    
    @pytest.mark.unit
    @pytest.mark.calculation
    def test_mathematical_properties(self):
        """测试数学属性"""
        request = CalculatorRequest(
            principal=10000.0,
            monthly_payment=200.0,
            annual_rate=5.0,
            years=10,
            compound_frequency="monthly"
        )
        
        result = self.calculator.calculate_compound_interest(request)
        
        # 验证数学属性
        # 1. 最终金额 = 总投入 + 利息收入
        assert abs(
            result["final_amount"] - 
            (result["total_contributions"] + result["total_interest"])
        ) < 0.01
        
        # 2. 总投入 = 本金 + 所有月供
        expected_contributions = request.principal + (
            request.monthly_payment * 12 * request.years
        )
        assert abs(result["total_contributions"] - expected_contributions) < 0.01
        
        # 3. 年度明细总和应该等于最终结果
        if result["yearly_breakdown"]:
            last_year = result["yearly_breakdown"][-1]
            assert abs(last_year["end_amount"] - result["final_amount"]) < 0.01
