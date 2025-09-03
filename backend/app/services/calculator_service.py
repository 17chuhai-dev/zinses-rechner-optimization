"""
复利计算服务
提供高精度的复利计算功能
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import List
from datetime import datetime

from app.models.calculator import CalculatorRequest, CalculatorResponse, YearlyBreakdown


class CalculatorService:
    """复利计算服务类"""
    
    @staticmethod
    def calculate_compound_interest(request: CalculatorRequest) -> CalculatorResponse:
        """
        计算复利
        
        Args:
            request: 计算请求参数
            
        Returns:
            CalculatorResponse: 计算结果
        """
        # 转换为Decimal以确保精度
        principal = Decimal(str(request.principal))
        monthly_payment = Decimal(str(request.monthly_payment))
        annual_rate = Decimal(str(request.annual_rate)) / Decimal('100')
        years = request.years
        
        # 根据复利频率确定计算参数
        if request.compound_frequency == "monthly":
            periods_per_year = 12
            rate_per_period = annual_rate / Decimal('12')
            total_periods = years * 12
        elif request.compound_frequency == "quarterly":
            periods_per_year = 4
            rate_per_period = annual_rate / Decimal('4')
            total_periods = years * 4
        else:  # yearly
            periods_per_year = 1
            rate_per_period = annual_rate
            total_periods = years
        
        # 计算复利
        current_amount = principal
        total_contributions = principal
        yearly_breakdown = []
        
        for year in range(1, years + 1):
            year_start_amount = current_amount
            year_contributions = Decimal('0')
            year_interest = Decimal('0')
            
            # 计算这一年的增长
            for period in range(periods_per_year):
                # 添加月供（如果是月复利）
                if request.compound_frequency == "monthly" and monthly_payment > 0:
                    current_amount += monthly_payment
                    year_contributions += monthly_payment
                    total_contributions += monthly_payment
                
                # 计算利息
                period_interest = current_amount * rate_per_period
                current_amount += period_interest
                year_interest += period_interest
            
            # 对于季度和年度复利，在年末添加年度供款
            if request.compound_frequency in ["quarterly", "yearly"] and monthly_payment > 0:
                annual_contribution = monthly_payment * Decimal('12')
                current_amount += annual_contribution
                year_contributions += annual_contribution
                total_contributions += annual_contribution
            
            # 计算年度增长率
            if year_start_amount > 0:
                growth_rate = ((current_amount - year_start_amount) / year_start_amount * Decimal('100'))
            else:
                growth_rate = Decimal('0')
            
            # 添加年度明细
            yearly_breakdown.append(YearlyBreakdown(
                year=year,
                start_amount=float(year_start_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
                contributions=float(year_contributions.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
                interest=float(year_interest.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
                end_amount=float(current_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
                growth_rate=float(growth_rate.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
            ))
        
        # 计算总利息
        final_amount = current_amount
        total_interest = final_amount - total_contributions
        
        # 计算年化收益率
        if total_contributions > 0 and years > 0:
            annual_return = ((final_amount / total_contributions) ** (Decimal('1') / Decimal(str(years))) - Decimal('1')) * Decimal('100')
        else:
            annual_return = Decimal('0')
        
        return CalculatorResponse(
            final_amount=float(final_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
            total_contributions=float(total_contributions.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
            total_interest=float(total_interest.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
            annual_return=float(annual_return.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
            yearly_breakdown=yearly_breakdown,
            calculation_time=datetime.now().isoformat()
        )
    
    @staticmethod
    def validate_request(request: CalculatorRequest) -> List[str]:
        """
        验证计算请求
        
        Args:
            request: 计算请求
            
        Returns:
            List[str]: 验证错误列表
        """
        errors = []
        
        if request.principal <= 0:
            errors.append("本金必须大于0")
        
        if request.principal > 10_000_000:
            errors.append("本金不能超过10,000,000€")
        
        if request.annual_rate <= 0:
            errors.append("利率必须大于0")
        
        if request.annual_rate > 20:
            errors.append("利率不能超过20%")
        
        if request.years <= 0:
            errors.append("年限必须大于0")
        
        if request.years > 50:
            errors.append("年限不能超过50年")
        
        if request.monthly_payment < 0:
            errors.append("月供不能为负数")
        
        if request.monthly_payment > 50_000:
            errors.append("月供不能超过50,000€")
        
        return errors
