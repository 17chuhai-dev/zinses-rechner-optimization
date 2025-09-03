"""
测试配置和共享fixtures
为德国复利计算器提供测试基础设施
"""

import pytest
import asyncio
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from httpx import AsyncClient

from app.main import app
from app.core.config import get_settings, Settings


class TestSettings(Settings):
    """测试环境配置"""
    environment: str = "testing"
    log_level: str = "DEBUG"
    testing: bool = True


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """创建事件循环用于异步测试"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_settings() -> TestSettings:
    """测试环境配置"""
    return TestSettings()


@pytest.fixture(scope="session")
def test_app():
    """测试应用实例"""
    # 覆盖设置依赖
    app.dependency_overrides[get_settings] = lambda: TestSettings()
    yield app
    app.dependency_overrides.clear()


@pytest.fixture(scope="session")
def client(test_app) -> Generator[TestClient, None, None]:
    """同步测试客户端"""
    with TestClient(test_app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
async def async_client(test_app) -> AsyncGenerator[AsyncClient, None]:
    """异步测试客户端"""
    async with AsyncClient(app=test_app, base_url="http://test") as ac:
        yield ac


# 测试数据fixtures
@pytest.fixture
def valid_calculator_request():
    """有效的计算器请求数据"""
    return {
        "principal": 10000.0,
        "monthly_payment": 500.0,
        "annual_rate": 4.0,
        "years": 10,
        "compound_frequency": "monthly"
    }


@pytest.fixture
def invalid_calculator_request():
    """无效的计算器请求数据"""
    return {
        "principal": -1000.0,  # 负数本金
        "monthly_payment": 100000.0,  # 过高月供
        "annual_rate": 25.0,  # 过高利率
        "years": 100,  # 过长期限
        "compound_frequency": "invalid"  # 无效频率
    }


@pytest.fixture
def edge_case_calculator_request():
    """边界值测试数据"""
    return {
        "principal": 1.0,  # 最小本金
        "monthly_payment": 0.0,  # 无月供
        "annual_rate": 0.0,  # 零利率
        "years": 1,  # 最短期限
        "compound_frequency": "yearly"
    }


@pytest.fixture
def large_calculator_request():
    """大数值测试数据"""
    return {
        "principal": 10000000.0,  # 最大本金
        "monthly_payment": 50000.0,  # 最大月供
        "annual_rate": 20.0,  # 最大利率
        "years": 50,  # 最长期限
        "compound_frequency": "monthly"
    }


# 预期结果fixtures
@pytest.fixture
def expected_calculation_result():
    """预期的计算结果"""
    return {
        "final_amount": 75624.32,
        "total_contributions": 70000.0,
        "total_interest": 5624.32,
        "annual_return": 4.2,
        "yearly_breakdown": []
    }


# 测试工具函数
def assert_calculation_result_structure(result: dict):
    """验证计算结果结构"""
    required_fields = [
        "final_amount",
        "total_contributions", 
        "total_interest",
        "annual_return",
        "yearly_breakdown",
        "calculation_time"
    ]
    
    for field in required_fields:
        assert field in result, f"Missing required field: {field}"
    
    # 验证数值类型
    assert isinstance(result["final_amount"], (int, float))
    assert isinstance(result["total_contributions"], (int, float))
    assert isinstance(result["total_interest"], (int, float))
    assert isinstance(result["annual_return"], (int, float))
    assert isinstance(result["yearly_breakdown"], list)
    assert isinstance(result["calculation_time"], str)


def assert_positive_numbers(result: dict):
    """验证结果为正数"""
    assert result["final_amount"] >= 0
    assert result["total_contributions"] >= 0
    assert result["total_interest"] >= 0


def assert_calculation_logic(request: dict, result: dict):
    """验证计算逻辑正确性"""
    # 最终金额应该大于等于总投入
    assert result["final_amount"] >= result["total_contributions"]
    
    # 利息收入应该等于最终金额减去总投入
    expected_interest = result["final_amount"] - result["total_contributions"]
    assert abs(result["total_interest"] - expected_interest) < 0.01
    
    # 总投入应该等于本金加上所有月供
    expected_contributions = request["principal"] + (request["monthly_payment"] * 12 * request["years"])
    assert abs(result["total_contributions"] - expected_contributions) < 0.01


# 性能测试fixtures
@pytest.fixture
def performance_test_data():
    """性能测试数据"""
    return [
        {
            "principal": 1000 * i,
            "monthly_payment": 100 * i,
            "annual_rate": 3.0 + (i % 10),
            "years": 5 + (i % 20),
            "compound_frequency": ["monthly", "quarterly", "yearly"][i % 3]
        }
        for i in range(1, 101)  # 100个测试用例
    ]


# 错误测试fixtures
@pytest.fixture
def validation_error_cases():
    """验证错误测试用例"""
    return [
        # 缺少必需字段
        {"monthly_payment": 500, "annual_rate": 4, "years": 10},
        # 负数值
        {"principal": -1000, "monthly_payment": 500, "annual_rate": 4, "years": 10},
        # 超出范围
        {"principal": 20000000, "monthly_payment": 500, "annual_rate": 4, "years": 10},
        # 错误类型
        {"principal": "invalid", "monthly_payment": 500, "annual_rate": 4, "years": 10},
        # 无效频率
        {"principal": 10000, "monthly_payment": 500, "annual_rate": 4, "years": 10, "compound_frequency": "invalid"}
    ]
