"""
德国税务计算服务测试
测试德国税务计算的准确性和边界情况
"""

import pytest
from app.services.german_tax_service import GermanTaxService, TaxSettings


class TestGermanTaxService:
    """德国税务计算服务测试类"""

    def test_basic_tax_calculation_single(self):
        """测试单身人士基础税务计算"""
        settings = TaxSettings(
            has_kirchensteuer=False,
            kirchensteuer_rate=0.0,
            bundesland="",
            is_married=False
        )
        
        # 测试2000€利息收入（超过1000€免税额度）
        result = GermanTaxService.calculate_yearly_tax(2000, settings, 2023)
        
        # 应税利息：2000 - 1000 = 1000€
        assert result.tax_free_amount == 1000
        assert result.taxable_interest == 1000
        
        # 资本利得税：1000 * 0.25 = 250€
        assert result.abgeltungssteuer == 250
        
        # 团结税：250 * 0.055 = 13.75€
        assert abs(result.solidaritaetszuschlag - 13.75) < 0.01
        
        # 无教会税
        assert result.kirchensteuer == 0
        
        # 总税额：250 + 13.75 = 263.75€
        assert abs(result.total_tax - 263.75) < 0.01
        
        # 税后净利息：2000 - 263.75 = 1736.25€
        assert abs(result.net_interest - 1736.25) < 0.01

    def test_basic_tax_calculation_married(self):
        """测试已婚人士基础税务计算"""
        settings = TaxSettings(
            has_kirchensteuer=False,
            kirchensteuer_rate=0.0,
            bundesland="",
            is_married=True
        )
        
        # 测试3000€利息收入（超过2000€免税额度）
        result = GermanTaxService.calculate_yearly_tax(3000, settings, 2023)
        
        # 应税利息：3000 - 2000 = 1000€
        assert result.tax_free_amount == 2000
        assert result.taxable_interest == 1000
        
        # 税额计算与单身相同（因为应税部分相同）
        assert result.abgeltungssteuer == 250
        assert abs(result.solidaritaetszuschlag - 13.75) < 0.01

    def test_kirchensteuer_calculation(self):
        """测试教会税计算"""
        settings = TaxSettings(
            has_kirchensteuer=True,
            kirchensteuer_rate=0.09,  # 9% (大部分州)
            bundesland="Berlin",
            is_married=False
        )
        
        result = GermanTaxService.calculate_yearly_tax(2000, settings, 2023)
        
        # 教会税：250 * 0.09 = 22.5€
        assert abs(result.kirchensteuer - 22.5) < 0.01
        
        # 总税额：250 + 13.75 + 22.5 = 286.25€
        assert abs(result.total_tax - 286.25) < 0.01

    def test_baden_wuerttemberg_kirchensteuer(self):
        """测试巴登-符腾堡州教会税（8%）"""
        settings = TaxSettings(
            has_kirchensteuer=True,
            kirchensteuer_rate=0.08,  # 8% (巴登-符腾堡州和巴伐利亚州)
            bundesland="Baden-Württemberg",
            is_married=False
        )
        
        result = GermanTaxService.calculate_yearly_tax(2000, settings, 2023)
        
        # 教会税：250 * 0.08 = 20€
        assert result.kirchensteuer == 20
        
        # 总税额：250 + 13.75 + 20 = 283.75€
        assert abs(result.total_tax - 283.75) < 0.01

    def test_below_tax_free_amount(self):
        """测试低于免税额度的情况"""
        settings = TaxSettings(
            has_kirchensteuer=False,
            kirchensteuer_rate=0.0,
            bundesland="",
            is_married=False
        )
        
        # 测试500€利息收入（低于1000€免税额度）
        result = GermanTaxService.calculate_yearly_tax(500, settings, 2023)
        
        assert result.tax_free_amount == 1000
        assert result.taxable_interest == 0
        assert result.abgeltungssteuer == 0
        assert result.solidaritaetszuschlag == 0
        assert result.kirchensteuer == 0
        assert result.total_tax == 0
        assert result.net_interest == 500

    def test_exactly_tax_free_amount(self):
        """测试恰好等于免税额度的情况"""
        settings = TaxSettings(
            has_kirchensteuer=False,
            kirchensteuer_rate=0.0,
            bundesland="",
            is_married=False
        )
        
        # 测试恰好1000€利息收入
        result = GermanTaxService.calculate_yearly_tax(1000, settings, 2023)
        
        assert result.taxable_interest == 0
        assert result.total_tax == 0
        assert result.net_interest == 1000

    def test_pre_2023_tax_free_amount(self):
        """测试2023年前的免税额度"""
        settings = TaxSettings(
            has_kirchensteuer=False,
            kirchensteuer_rate=0.0,
            bundesland="",
            is_married=False
        )
        
        # 2022年的免税额度是801€
        result = GermanTaxService.calculate_yearly_tax(1000, settings, 2022)
        
        assert result.tax_free_amount == 801
        assert result.taxable_interest == 199
        assert result.abgeltungssteuer == 199 * 0.25

    def test_multi_year_tax_calculation(self):
        """测试多年度税务计算"""
        settings = TaxSettings(
            has_kirchensteuer=False,
            kirchensteuer_rate=0.0,
            bundesland="",
            is_married=False
        )
        
        # 每年1500€利息收入，连续3年
        yearly_interests = [1500, 1500, 1500]
        
        result = GermanTaxService.calculate_multi_year_tax(
            yearly_interests, settings, 2023
        )
        
        assert len(result) == 3
        
        # 每年都应该有相同的税务计算
        for year_data in result:
            assert year_data.tax_calculation.tax_free_amount == 1000
            assert year_data.tax_calculation.taxable_interest == 500
            assert year_data.tax_calculation.abgeltungssteuer == 125

        # 累计税额应该递增
        assert result[0].cumulative_tax_paid < result[1].cumulative_tax_paid < result[2].cumulative_tax_paid

    def test_effective_tax_rate_calculation(self):
        """测试实际税率计算"""
        settings = TaxSettings(
            has_kirchensteuer=True,
            kirchensteuer_rate=0.09,
            bundesland="Berlin",
            is_married=False
        )
        
        result = GermanTaxService.calculate_yearly_tax(10000, settings, 2023)
        
        # 应税利息：10000 - 1000 = 9000€
        # 资本利得税：9000 * 0.25 = 2250€
        # 团结税：2250 * 0.055 = 123.75€
        # 教会税：2250 * 0.09 = 202.5€
        # 总税额：2250 + 123.75 + 202.5 = 2576.25€
        # 实际税率：2576.25 / 10000 = 25.76%
        
        expected_effective_rate = 25.76
        assert abs(result.effective_tax_rate - expected_effective_rate) < 0.1

    def test_kirchensteuer_rate_by_state(self):
        """测试各州教会税率"""
        # 巴登-符腾堡州和巴伐利亚州：8%
        assert GermanTaxService.get_kirchensteuer_rate("Baden-Württemberg") == 0.08
        assert GermanTaxService.get_kirchensteuer_rate("Bayern") == 0.08
        
        # 其他州：9%
        assert GermanTaxService.get_kirchensteuer_rate("Berlin") == 0.09
        assert GermanTaxService.get_kirchensteuer_rate("Hamburg") == 0.09
        
        # 未知州：默认9%
        assert GermanTaxService.get_kirchensteuer_rate("Unknown") == 0.09

    def test_tax_optimization_tips(self):
        """测试税务优化建议"""
        settings = TaxSettings(
            has_kirchensteuer=True,
            kirchensteuer_rate=0.09,
            bundesland="Berlin",
            is_married=False
        )
        
        # 高收益情况
        tips_high = GermanTaxService.get_tax_optimization_tips(15000, settings)
        assert len(tips_high) > 0
        assert any("Sparerpauschbetrag" in tip for tip in tips_high)
        
        # 已婚情况
        settings.is_married = True
        tips_married = GermanTaxService.get_tax_optimization_tips(3000, settings)
        assert any("Ehepaar" in tip for tip in tips_married)

    def test_tax_settings_validation(self):
        """测试税务设置验证"""
        # 有效设置
        valid_settings = TaxSettings(
            has_kirchensteuer=True,
            kirchensteuer_rate=0.09,
            bundesland="Berlin",
            is_married=False
        )
        
        errors = GermanTaxService.validate_tax_settings(valid_settings)
        assert len(errors) == 0
        
        # 无效教会税率
        invalid_settings = TaxSettings(
            has_kirchensteuer=True,
            kirchensteuer_rate=0.15,  # 太高
            bundesland="Berlin",
            is_married=False
        )
        
        errors = GermanTaxService.validate_tax_settings(invalid_settings)
        assert len(errors) > 0
        assert any("Kirchensteuersatz" in error for error in errors)

    def test_edge_cases(self):
        """测试边界情况"""
        settings = TaxSettings(
            has_kirchensteuer=False,
            kirchensteuer_rate=0.0,
            bundesland="",
            is_married=False
        )
        
        # 零利息
        result_zero = GermanTaxService.calculate_yearly_tax(0, settings, 2023)
        assert result_zero.total_tax == 0
        assert result_zero.net_interest == 0
        assert result_zero.effective_tax_rate == 0
        
        # 极小利息
        result_tiny = GermanTaxService.calculate_yearly_tax(0.01, settings, 2023)
        assert result_tiny.total_tax == 0  # 低于免税额度
        assert result_tiny.net_interest == 0.01
        
        # 极大利息
        result_huge = GermanTaxService.calculate_yearly_tax(1000000, settings, 2023)
        assert result_huge.taxable_interest == 999000  # 1,000,000 - 1,000
        assert result_huge.abgeltungssteuer == 249750  # 999,000 * 0.25
