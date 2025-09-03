"""
复利计算服务
实现精确的复利计算算法
"""

import math
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Any
from app.models.calculator import CalculatorRequest


class CalculatorService:
    """复利计算服务类"""
    
    def __init__(self):
        """初始化计算服务"""
        pass
    
    def calculate_compound_interest(self, request: CalculatorRequest) -> Dict[str, Any]:
        """
        计算复利
        
        Args:
            request: 计算请求参数
            
        Returns:
            计算结果字典
        """
        # 转换为Decimal以确保精度
        principal = Decimal(str(request.principal))
        monthly_payment = Decimal(str(request.monthly_payment))
        annual_rate = Decimal(str(request.annual_rate)) / Decimal('100')  # 转换为小数
        years = request.years
        
        # 获取复利频率
        compound_periods_per_year = self._get_compound_periods(request.compound_frequency)
        
        # 计算复利
        if monthly_payment == 0:
            # 只有本金的复利计算
            final_amount = self._calculate_simple_compound_interest(
                principal, annual_rate, compound_periods_per_year, years
            )
            total_contributions = principal
        else:
            # 包含定期投入的复利计算
            final_amount, total_contributions = self._calculate_compound_interest_with_payments(
                principal, monthly_payment, annual_rate, compound_periods_per_year, years
            )
        
        # 计算利息收入
        total_interest = final_amount - total_contributions
        
        # 计算年化收益率
        annual_return = self._calculate_annual_return(
            float(total_contributions), float(final_amount), years
        )
        
        # 生成年度明细
        yearly_breakdown = self._generate_yearly_breakdown(
            principal, monthly_payment, annual_rate, compound_periods_per_year, years
        )
        
        return {
            "final_amount": float(final_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
            "total_contributions": float(total_contributions.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
            "total_interest": float(total_interest.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
            "annual_return": round(annual_return, 2),
            "yearly_breakdown": yearly_breakdown
        }
    
    def _get_compound_periods(self, frequency: str) -> int:
        """获取复利周期数"""
        frequency_map = {
            "monthly": 12,
            "quarterly": 4,
            "yearly": 1
        }
        return frequency_map.get(frequency, 12)
    
    def _calculate_simple_compound_interest(
        self, 
        principal: Decimal, 
        annual_rate: Decimal, 
        periods_per_year: int, 
        years: int
    ) -> Decimal:
        """计算简单复利（无定期投入）"""
        if annual_rate == 0:
            return principal
        
        period_rate = annual_rate / Decimal(str(periods_per_year))
        total_periods = periods_per_year * years
        
        # A = P(1 + r/n)^(nt)
        compound_factor = (Decimal('1') + period_rate) ** total_periods
        return principal * compound_factor
    
    def _calculate_compound_interest_with_payments(
        self,
        principal: Decimal,
        monthly_payment: Decimal,
        annual_rate: Decimal,
        periods_per_year: int,
        years: int
    ) -> tuple[Decimal, Decimal]:
        """计算包含定期投入的复利"""
        if annual_rate == 0:
            # 零利率情况
            total_contributions = principal + (monthly_payment * 12 * years)
            return total_contributions, total_contributions
        
        # 本金部分的复利
        principal_final = self._calculate_simple_compound_interest(
            principal, annual_rate, periods_per_year, years
        )
        
        # 定期投入部分的复利（年金现值公式）
        monthly_rate = annual_rate / Decimal('12')
        total_months = years * 12
        
        if monthly_rate == 0:
            payments_final = monthly_payment * total_months
        else:
            # PMT * [((1 + r)^n - 1) / r]
            compound_factor = (Decimal('1') + monthly_rate) ** total_months
            payments_final = monthly_payment * ((compound_factor - Decimal('1')) / monthly_rate)
        
        final_amount = principal_final + payments_final
        total_contributions = principal + (monthly_payment * 12 * years)
        
        return final_amount, total_contributions
    
    def _calculate_annual_return(self, total_contributions: float, final_amount: float, years: int) -> float:
        """计算年化收益率"""
        if total_contributions <= 0 or years <= 0:
            return 0.0
        
        # 使用复合年增长率公式: CAGR = (Final/Initial)^(1/years) - 1
        try:
            cagr = (final_amount / total_contributions) ** (1 / years) - 1
            return cagr * 100  # 转换为百分比
        except (ZeroDivisionError, ValueError):
            return 0.0
    
    def _generate_yearly_breakdown(
        self,
        principal: Decimal,
        monthly_payment: Decimal,
        annual_rate: Decimal,
        periods_per_year: int,
        years: int
    ) -> List[Dict[str, Any]]:
        """生成年度明细"""
        breakdown = []
        current_amount = principal
        
        for year in range(1, years + 1):
            start_amount = current_amount
            year_contributions = monthly_payment * 12
            
            # 计算本年度利息
            if annual_rate == 0:
                year_interest = Decimal('0')
            else:
                # 简化计算：假设月供在年中投入
                avg_amount = start_amount + (year_contributions / 2)
                year_interest = avg_amount * annual_rate
            
            end_amount = start_amount + year_contributions + year_interest
            
            # 计算增长率
            if start_amount > 0:
                growth_rate = float((year_interest / start_amount) * 100)
            else:
                growth_rate = 0.0
            
            breakdown.append({
                "year": year,
                "start_amount": float(start_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
                "contributions": float(year_contributions.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
                "interest": float(year_interest.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
                "end_amount": float(end_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
                "growth_rate": round(growth_rate, 2)
            })
            
            current_amount = end_amount
        
        return breakdown
