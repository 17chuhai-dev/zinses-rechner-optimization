"""
计算器API接口测试
测试FastAPI端点的功能和错误处理
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestCalculatorAPI:
    """计算器API测试类"""

    def test_calculate_endpoint_success(self):
        """测试计算接口成功情况"""
        request_data = {
            "principal": 10000,
            "annual_rate": 4.0,
            "years": 10,
            "monthly_payment": 0,
            "compound_frequency": "monthly"
        }
        
        response = client.post("/api/v1/calculator/calculate", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # 检查响应结构
        assert "final_amount" in data
        assert "total_interest" in data
        assert "total_contributions" in data
        assert "yearly_breakdown" in data
        
        # 检查数值合理性
        assert data["final_amount"] > 10000
        assert data["total_interest"] > 0
        assert data["total_contributions"] == 10000

    def test_calculate_with_monthly_payment(self):
        """测试包含月供的计算"""
        request_data = {
            "principal": 5000,
            "annual_rate": 3.5,
            "years": 5,
            "monthly_payment": 200,
            "compound_frequency": "monthly"
        }
        
        response = client.post("/api/v1/calculator/calculate", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # 总投入：5000 + (200 * 12 * 5) = 17000
        assert data["total_contributions"] == 17000
        assert data["final_amount"] > 17000

    def test_calculate_endpoint_validation_errors(self):
        """测试计算接口验证错误"""
        # 负数本金
        invalid_request = {
            "principal": -1000,
            "annual_rate": 4.0,
            "years": 10,
            "monthly_payment": 0,
            "compound_frequency": "monthly"
        }
        
        response = client.post("/api/v1/calculator/calculate", json=invalid_request)
        assert response.status_code == 422
        
        error_data = response.json()
        assert "detail" in error_data
        assert error_data["detail"]["error"] == "VALIDATION_ERROR"

    def test_calculate_endpoint_missing_fields(self):
        """测试缺少必填字段"""
        incomplete_request = {
            "principal": 10000,
            "annual_rate": 4.0
            # 缺少 years, monthly_payment, compound_frequency
        }
        
        response = client.post("/api/v1/calculator/calculate", json=incomplete_request)
        assert response.status_code == 422

    def test_calculate_endpoint_invalid_compound_frequency(self):
        """测试无效的复利频率"""
        invalid_request = {
            "principal": 10000,
            "annual_rate": 4.0,
            "years": 10,
            "monthly_payment": 0,
            "compound_frequency": "invalid_frequency"
        }
        
        response = client.post("/api/v1/calculator/calculate", json=invalid_request)
        assert response.status_code == 422

    def test_calculate_endpoint_extreme_values(self):
        """测试极值情况"""
        # 最大值测试
        max_request = {
            "principal": 10000000,
            "annual_rate": 20.0,
            "years": 50,
            "monthly_payment": 50000,
            "compound_frequency": "monthly"
        }
        
        response = client.post("/api/v1/calculator/calculate", json=max_request)
        assert response.status_code == 200
        
        # 最小值测试
        min_request = {
            "principal": 1,
            "annual_rate": 0.01,
            "years": 1,
            "monthly_payment": 0,
            "compound_frequency": "yearly"
        }
        
        response = client.post("/api/v1/calculator/calculate", json=min_request)
        assert response.status_code == 200

    def test_health_check_endpoint(self):
        """测试健康检查接口"""
        response = client.get("/api/v1/calculator/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "healthy"
        assert "service" in data
        assert "timestamp" in data

    def test_validate_endpoint(self):
        """测试验证接口"""
        valid_request = {
            "principal": 10000,
            "annual_rate": 4.0,
            "years": 10,
            "monthly_payment": 0,
            "compound_frequency": "monthly"
        }
        
        response = client.post("/api/v1/calculator/validate", json=valid_request)
        assert response.status_code == 200
        
        data = response.json()
        assert data["valid"] is True
        assert len(data["errors"]) == 0

    def test_validate_endpoint_with_errors(self):
        """测试验证接口错误情况"""
        invalid_request = {
            "principal": -1000,
            "annual_rate": 25.0,  # 超过最大值
            "years": 0,
            "monthly_payment": -100,
            "compound_frequency": "monthly"
        }
        
        response = client.post("/api/v1/calculator/validate", json=invalid_request)
        assert response.status_code == 200
        
        data = response.json()
        assert data["valid"] is False
        assert len(data["errors"]) > 0

    @pytest.mark.parametrize("principal,rate,years,monthly", [
        (1000, 1.0, 1, 0),
        (50000, 5.0, 20, 500),
        (100000, 3.0, 30, 1000),
        (500000, 7.0, 15, 2000),
    ])
    def test_calculate_various_scenarios(self, principal, rate, years, monthly):
        """参数化测试各种计算场景"""
        request_data = {
            "principal": principal,
            "annual_rate": rate,
            "years": years,
            "monthly_payment": monthly,
            "compound_frequency": "monthly"
        }
        
        response = client.post("/api/v1/calculator/calculate", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["final_amount"] > principal
        assert data["total_contributions"] == principal + (monthly * 12 * years)

    def test_api_response_format(self):
        """测试API响应格式"""
        request_data = {
            "principal": 10000,
            "annual_rate": 4.0,
            "years": 10,
            "monthly_payment": 0,
            "compound_frequency": "monthly"
        }
        
        response = client.post("/api/v1/calculator/calculate", json=request_data)
        data = response.json()
        
        # 检查必需字段
        required_fields = [
            "final_amount", "total_interest", "total_contributions",
            "yearly_breakdown", "calculation_metadata"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # 检查年度明细格式
        yearly_breakdown = data["yearly_breakdown"]
        assert len(yearly_breakdown) == 10
        
        for year_data in yearly_breakdown:
            assert "year" in year_data
            assert "start_amount" in year_data
            assert "contributions" in year_data
            assert "interest" in year_data
            assert "end_amount" in year_data

    def test_api_error_handling(self):
        """测试API错误处理"""
        # 发送无效JSON
        response = client.post(
            "/api/v1/calculator/calculate",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422

    def test_api_cors_headers(self):
        """测试CORS头部"""
        response = client.options("/api/v1/calculator/calculate")
        
        # 检查CORS头部存在
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers

    def test_api_rate_limiting(self):
        """测试API速率限制（如果实现了）"""
        request_data = {
            "principal": 10000,
            "annual_rate": 4.0,
            "years": 10,
            "monthly_payment": 0,
            "compound_frequency": "monthly"
        }
        
        # 快速发送多个请求
        responses = []
        for _ in range(10):
            response = client.post("/api/v1/calculator/calculate", json=request_data)
            responses.append(response)
        
        # 大部分请求应该成功
        successful_responses = [r for r in responses if r.status_code == 200]
        assert len(successful_responses) >= 8  # 至少80%成功率
