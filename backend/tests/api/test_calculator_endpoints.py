"""
计算器API端点集成测试
测试完整的API请求-响应流程
"""

import pytest
from fastapi import status
from httpx import AsyncClient
from tests.conftest import (
    assert_calculation_result_structure,
    assert_positive_numbers,
    assert_calculation_logic
)


class TestCalculatorEndpoints:
    """计算器API端点测试"""
    
    @pytest.mark.asyncio
    @pytest.mark.api
    async def test_health_check(self, async_client: AsyncClient):
        """测试健康检查端点"""
        response = await async_client.get("/api/v1/health")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "version" in data
    
    @pytest.mark.asyncio
    @pytest.mark.api
    async def test_calculate_compound_interest_success(
        self, 
        async_client: AsyncClient, 
        valid_calculator_request
    ):
        """测试成功的复利计算请求"""
        response = await async_client.post(
            "/api/v1/calculator/compound-interest",
            json=valid_calculator_request
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # 验证响应结构
        assert_calculation_result_structure(data)
        
        # 验证数值合理性
        assert_positive_numbers(data)
        
        # 验证计算逻辑
        assert_calculation_logic(valid_calculator_request, data)
    
    @pytest.mark.asyncio
    @pytest.mark.api
    async def test_calculate_with_edge_cases(
        self, 
        async_client: AsyncClient, 
        edge_case_calculator_request
    ):
        """测试边界值计算"""
        response = await async_client.post(
            "/api/v1/calculator/compound-interest",
            json=edge_case_calculator_request
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # 边界值应该也能正确计算
        assert_calculation_result_structure(data)
        assert_positive_numbers(data)
        
        # 零利率情况下，最终金额应该等于总投入
        if edge_case_calculator_request["annual_rate"] == 0.0:
            assert data["final_amount"] == data["total_contributions"]
            assert data["total_interest"] == 0.0
    
    @pytest.mark.asyncio
    @pytest.mark.api
    async def test_calculate_with_large_numbers(
        self, 
        async_client: AsyncClient, 
        large_calculator_request
    ):
        """测试大数值计算"""
        response = await async_client.post(
            "/api/v1/calculator/compound-interest",
            json=large_calculator_request
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert_calculation_result_structure(data)
        assert_positive_numbers(data)
        
        # 大数值计算结果应该合理
        assert data["final_amount"] > data["total_contributions"]
        assert data["total_interest"] > 0
    
    @pytest.mark.asyncio
    @pytest.mark.api
    async def test_validation_errors(
        self, 
        async_client: AsyncClient, 
        validation_error_cases
    ):
        """测试验证错误情况"""
        for invalid_data in validation_error_cases:
            response = await async_client.post(
                "/api/v1/calculator/compound-interest",
                json=invalid_data
            )
            
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
            error_data = response.json()
            
            assert "error" in error_data
            assert "message" in error_data
            assert "code" in error_data
    
    @pytest.mark.asyncio
    @pytest.mark.api
    async def test_invalid_json_format(self, async_client: AsyncClient):
        """测试无效JSON格式"""
        response = await async_client.post(
            "/api/v1/calculator/compound-interest",
            content="invalid json",
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    @pytest.mark.asyncio
    @pytest.mark.api
    async def test_missing_content_type(self, async_client: AsyncClient):
        """测试缺少Content-Type头"""
        response = await async_client.post(
            "/api/v1/calculator/compound-interest",
            content='{"principal": 10000, "annual_rate": 4, "years": 10}'
        )
        
        # FastAPI应该能处理这种情况
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_422_UNPROCESSABLE_ENTITY]
    
    @pytest.mark.asyncio
    @pytest.mark.api
    async def test_negative_values_validation(self, async_client: AsyncClient):
        """测试负数值验证"""
        invalid_data = {
            "principal": -10000,
            "monthly_payment": -500,
            "annual_rate": -4.0,
            "years": -10
        }
        
        response = await async_client.post(
            "/api/v1/calculator/compound-interest",
            json=invalid_data
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        error_data = response.json()
        
        # 应该包含德语错误消息
        assert any("größer" in str(error_data).lower() or 
                  "positiv" in str(error_data).lower() or
                  "negativ" in str(error_data).lower())
    
    @pytest.mark.asyncio
    @pytest.mark.api
    async def test_out_of_range_values(self, async_client: AsyncClient):
        """测试超出范围的值"""
        out_of_range_data = {
            "principal": 20000000,  # 超过1000万限制
            "monthly_payment": 100000,  # 超过5万限制
            "annual_rate": 25.0,  # 超过20%限制
            "years": 100  # 超过50年限制
        }
        
        response = await async_client.post(
            "/api/v1/calculator/compound-interest",
            json=out_of_range_data
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    @pytest.mark.asyncio
    @pytest.mark.api
    async def test_string_instead_of_number(self, async_client: AsyncClient):
        """测试字符串而非数字的输入"""
        invalid_data = {
            "principal": "ten thousand",
            "monthly_payment": "five hundred",
            "annual_rate": "four percent",
            "years": "ten years"
        }
        
        response = await async_client.post(
            "/api/v1/calculator/compound-interest",
            json=invalid_data
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    @pytest.mark.asyncio
    @pytest.mark.api
    async def test_response_headers(
        self, 
        async_client: AsyncClient, 
        valid_calculator_request
    ):
        """测试响应头"""
        response = await async_client.post(
            "/api/v1/calculator/compound-interest",
            json=valid_calculator_request
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # 验证CORS头
        assert "access-control-allow-origin" in response.headers
        
        # 验证Content-Type
        assert response.headers["content-type"] == "application/json"
    
    @pytest.mark.asyncio
    @pytest.mark.api
    async def test_calculation_time_field(
        self, 
        async_client: AsyncClient, 
        valid_calculator_request
    ):
        """测试计算时间字段"""
        response = await async_client.post(
            "/api/v1/calculator/compound-interest",
            json=valid_calculator_request
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert "calculation_time" in data
        # 验证ISO格式时间戳
        import datetime
        try:
            datetime.datetime.fromisoformat(data["calculation_time"].replace('Z', '+00:00'))
        except ValueError:
            pytest.fail("Invalid ISO timestamp format")
    
    @pytest.mark.asyncio
    @pytest.mark.api
    async def test_yearly_breakdown_structure(
        self, 
        async_client: AsyncClient, 
        valid_calculator_request
    ):
        """测试年度明细结构"""
        response = await async_client.post(
            "/api/v1/calculator/compound-interest",
            json=valid_calculator_request
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert "yearly_breakdown" in data
        yearly_breakdown = data["yearly_breakdown"]
        
        if yearly_breakdown:  # 如果有年度明细
            for year_data in yearly_breakdown:
                required_fields = [
                    "year", "start_amount", "contributions", 
                    "interest", "end_amount", "growth_rate"
                ]
                for field in required_fields:
                    assert field in year_data, f"Missing field: {field}"
                
                # 验证数据类型
                assert isinstance(year_data["year"], int)
                assert isinstance(year_data["start_amount"], (int, float))
                assert isinstance(year_data["contributions"], (int, float))
                assert isinstance(year_data["interest"], (int, float))
                assert isinstance(year_data["end_amount"], (int, float))
                assert isinstance(year_data["growth_rate"], (int, float))


class TestCalculatorPerformance:
    """计算器性能测试"""
    
    @pytest.mark.asyncio
    @pytest.mark.api
    @pytest.mark.slow
    async def test_response_time(
        self, 
        async_client: AsyncClient, 
        valid_calculator_request
    ):
        """测试响应时间"""
        import time
        
        start_time = time.time()
        response = await async_client.post(
            "/api/v1/calculator/compound-interest",
            json=valid_calculator_request
        )
        end_time = time.time()
        
        assert response.status_code == status.HTTP_200_OK
        
        # 响应时间应该小于1秒
        response_time = end_time - start_time
        assert response_time < 1.0, f"Response time too slow: {response_time}s"
    
    @pytest.mark.asyncio
    @pytest.mark.api
    @pytest.mark.slow
    async def test_concurrent_requests(
        self, 
        async_client: AsyncClient, 
        performance_test_data
    ):
        """测试并发请求"""
        import asyncio
        
        async def make_request(data):
            response = await async_client.post(
                "/api/v1/calculator/compound-interest",
                json=data
            )
            return response.status_code == status.HTTP_200_OK
        
        # 并发执行10个请求
        tasks = [make_request(data) for data in performance_test_data[:10]]
        results = await asyncio.gather(*tasks)
        
        # 所有请求都应该成功
        assert all(results), "Some concurrent requests failed"
    
    @pytest.mark.asyncio
    @pytest.mark.api
    @pytest.mark.slow
    async def test_large_calculation_performance(self, async_client: AsyncClient):
        """测试大型计算性能"""
        large_request = {
            "principal": 5000000.0,
            "monthly_payment": 25000.0,
            "annual_rate": 8.0,
            "years": 40,
            "compound_frequency": "monthly"
        }
        
        import time
        start_time = time.time()
        
        response = await async_client.post(
            "/api/v1/calculator/compound-interest",
            json=large_request
        )
        
        end_time = time.time()
        
        assert response.status_code == status.HTTP_200_OK
        
        # 即使是大型计算，也应该在合理时间内完成
        response_time = end_time - start_time
        assert response_time < 2.0, f"Large calculation too slow: {response_time}s"
