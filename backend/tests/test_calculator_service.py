"""
复利计算服务测试
测试复利计算算法的准确性和边界情况
"""

import pytest
from decimal import Decimal
from app.services.calculator_service import CalculatorService
from app.models.calculator import CalculatorRequest


class TestCalculatorService:
    """复利计算服务测试类"""

    def setup_method(self):
        """测试前置设置"""
        self.calculator = CalculatorService()

    def test_basic_compound_interest_calculation(self):
        """测试基础复利计算"""
        # 测试用例：10,000€ 本金，4% 年利率，10年
        request = CalculatorRequest(
            principal=10000,
            annual_rate=4.0,
            years=10,
            monthly_payment=0,
            compound_frequency="yearly"
        )
        
        result = self.calculator.calculate_compound_interest(request)
        
        # 预期结果：10,000 * (1.04)^10 = 14,802.44
        expected_final_amount = 14802.44
        assert abs(result.final_amount - expected_final_amount) < 0.01
        assert result.total_contributions == 10000.0
        assert abs(result.total_interest - 4802.44) < 0.01

    def test_monthly_compound_interest_calculation(self):
        """测试月复利计算"""
        request = CalculatorRequest(
            principal=10000,
            annual_rate=4.0,
            years=10,
            monthly_payment=0,
            compound_frequency="monthly"
        )
        
        result = self.calculator.calculate_compound_interest(request)
        
        # 月复利应该比年复利略高
        # 10,000 * (1 + 0.04/12)^(12*10) ≈ 14,908.33
        expected_final_amount = 14908.33
        assert abs(result.final_amount - expected_final_amount) < 1.00
        assert result.final_amount > Decimal('14802.44')  # 应该比年复利高

    def test_monthly_payment_calculation(self):
        """测试月供复利计算"""
        request = CalculatorRequest(
            principal=10000,
            annual_rate=4.0,
            years=10,
            monthly_payment=500,
            compound_frequency="monthly"
        )
        
        result = self.calculator.calculate_compound_interest(request)
        
        # 总投入：10,000 + (500 * 12 * 10) = 70,000
        expected_contributions = Decimal('70000')
        assert result.total_contributions == expected_contributions
        
        # 最终金额应该显著高于总投入
        assert result.final_amount > expected_contributions
        assert result.total_interest > Decimal('5000')

    def test_very_low_interest_rate(self):
        """测试极低利率情况"""
        request = CalculatorRequest(
            principal=10000,
            annual_rate=0.01,  # 使用允许的最小值
            years=10,
            monthly_payment=500,
            compound_frequency="monthly"
        )

        result = self.calculator.calculate_compound_interest(request)

        # 极低利率时，最终金额应该接近本金 + 总月供
        expected_base = 10000 + (500 * 12 * 10)  # 70,000
        assert result.final_amount > expected_base  # 应该略高于基础金额
        assert result.total_interest > 0  # 应该有少量利息

    def test_boundary_values(self):
        """测试边界值"""
        # 最小值测试
        min_request = CalculatorRequest(
            principal=100,  # 使用更大的本金确保有利息
            annual_rate=0.01,
            years=1,
            monthly_payment=0,
            compound_frequency="yearly"
        )

        min_result = self.calculator.calculate_compound_interest(min_request)
        assert min_result.final_amount > 100.0
        assert min_result.total_interest > Decimal('0')

        # 最大值测试
        max_request = CalculatorRequest(
            principal=10000000,
            annual_rate=20.0,
            years=50,
            monthly_payment=0,
            compound_frequency="yearly"
        )
        
        max_result = self.calculator.calculate_compound_interest(max_request)
        assert max_result.final_amount > Decimal('10000000')

    def test_invalid_inputs(self):
        """测试无效输入"""
        # 负数本金
        with pytest.raises(Exception):  # Pydantic会抛出ValidationError
            request = CalculatorRequest(
                principal=-1000,
                annual_rate=4.0,
                years=10,
                monthly_payment=0,
                compound_frequency="yearly"
            )

        # 负利率
        with pytest.raises(Exception):  # Pydantic会抛出ValidationError
            request = CalculatorRequest(
                principal=10000,
                annual_rate=-1.0,
                years=10,
                monthly_payment=0,
                compound_frequency="yearly"
            )

        # 零年限
        with pytest.raises(Exception):  # Pydantic会抛出ValidationError
            request = CalculatorRequest(
                principal=10000,
                annual_rate=4.0,
                years=0,
                monthly_payment=0,
                compound_frequency="yearly"
            )

    def test_yearly_breakdown_accuracy(self):
        """测试年度明细准确性"""
        request = CalculatorRequest(
            principal=10000,
            annual_rate=4.0,
            years=5,
            monthly_payment=0,
            compound_frequency="yearly"
        )
        
        result = self.calculator.calculate_compound_interest(request)
        
        # 检查年度明细
        assert len(result.yearly_breakdown) == 5
        
        # 第一年
        year_1 = result.yearly_breakdown[0]
        assert year_1.year == 1
        assert year_1.start_amount == 10000.0
        assert abs(year_1.end_amount - 10400.0) < 0.01
        
        # 最后一年
        year_5 = result.yearly_breakdown[4]
        assert year_5.year == 5
        assert abs(year_5.end_amount - result.final_amount) < Decimal('0.01')

    def test_monthly_payment_yearly_breakdown(self):
        """测试月供的年度明细"""
        request = CalculatorRequest(
            principal=1,  # 使用允许的最小值
            annual_rate=4.0,
            years=3,
            monthly_payment=1000,
            compound_frequency="monthly"
        )
        
        result = self.calculator.calculate_compound_interest(request)
        
        # 检查年度明细
        assert len(result.yearly_breakdown) == 3
        
        # 第一年应该有12,000的投入
        year_1 = result.yearly_breakdown[0]
        assert year_1.contributions == Decimal('12000')
        assert year_1.interest > Decimal('0')

    @pytest.mark.parametrize("principal,rate,years,expected_range", [
        (1000, 5.0, 1, (1040, 1060)),
        (50000, 3.5, 20, (95000, 105000)),
        (100000, 2.0, 30, (175000, 185000)),
    ])
    def test_calculation_ranges(self, principal, rate, years, expected_range):
        """参数化测试不同输入组合"""
        request = CalculatorRequest(
            principal=principal,
            annual_rate=rate,
            years=years,
            monthly_payment=0,
            compound_frequency="yearly"
        )
        
        result = self.calculator.calculate_compound_interest(request)
        
        assert expected_range[0] <= float(result.final_amount) <= expected_range[1]

    def test_precision_with_large_numbers(self):
        """测试大数值计算精度"""
        request = CalculatorRequest(
            principal=1000000,
            annual_rate=10.0,
            years=30,
            monthly_payment=0,
            compound_frequency="monthly"
        )
        
        result = self.calculator.calculate_compound_interest(request)
        
        # 确保没有精度丢失
        assert result.final_amount > Decimal('1000000')
        assert str(result.final_amount).count('.') <= 1  # 只有一个小数点
        
        # 检查小数位数不超过2位
        decimal_places = len(str(result.final_amount).split('.')[-1])
        assert decimal_places <= 2

    def test_performance_large_dataset(self):
        """测试大数据集性能"""
        import time
        
        request = CalculatorRequest(
            principal=10000,
            annual_rate=4.0,
            years=50,  # 50年，生成50个年度明细
            monthly_payment=1000,
            compound_frequency="monthly"
        )
        
        start_time = time.time()
        result = self.calculator.calculate_compound_interest(request)
        end_time = time.time()
        
        # 计算时间应该小于1秒
        calculation_time = end_time - start_time
        assert calculation_time < 1.0
        
        # 结果应该包含所有年度明细
        assert len(result.yearly_breakdown) == 50

    def test_compound_frequency_comparison(self):
        """测试不同复利频率的对比"""
        base_params = {
            "principal": 10000,
            "annual_rate": 4.0,
            "years": 10,
            "monthly_payment": 0
        }
        
        # 年复利
        yearly_request = CalculatorRequest(**base_params, compound_frequency="yearly")
        yearly_result = self.calculator.calculate_compound_interest(yearly_request)
        
        # 月复利
        monthly_request = CalculatorRequest(**base_params, compound_frequency="monthly")
        monthly_result = self.calculator.calculate_compound_interest(monthly_request)
        
        # 季度复利
        quarterly_request = CalculatorRequest(**base_params, compound_frequency="quarterly")
        quarterly_result = self.calculator.calculate_compound_interest(quarterly_request)

        # 复利频率越高，最终金额应该越大
        assert yearly_result.final_amount < quarterly_result.final_amount
        assert quarterly_result.final_amount < monthly_result.final_amount

        # 但差异不应该太大（对于4%的利率）
        difference = monthly_result.final_amount - yearly_result.final_amount
        assert difference < 200.0  # 差异应该小于200€
