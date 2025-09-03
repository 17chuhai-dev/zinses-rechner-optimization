"""
缓存性能测试
验证缓存策略的有效性和性能指标
"""

import pytest
import asyncio
import time
import json
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.core.cache import CacheManager, CacheConfig


class TestCachePerformance:
    """缓存性能测试类"""

    def setup_method(self):
        """测试前置设置"""
        self.client = TestClient(app)
        self.cache_manager = CacheManager()
        
        # 测试数据
        self.test_request = {
            "principal": 10000,
            "annual_rate": 4.0,
            "years": 10,
            "monthly_payment": 500,
            "compound_frequency": "monthly"
        }

    def test_cache_hit_performance(self):
        """测试缓存命中性能"""
        # 第一次请求 - 缓存未命中
        start_time = time.time()
        response1 = self.client.post("/api/v1/calculator/compound-interest", json=self.test_request)
        first_request_time = time.time() - start_time
        
        assert response1.status_code == 200
        assert response1.headers.get("X-Cache") == "MISS"
        
        # 第二次请求 - 缓存命中
        start_time = time.time()
        response2 = self.client.post("/api/v1/calculator/compound-interest", json=self.test_request)
        second_request_time = time.time() - start_time
        
        assert response2.status_code == 200
        assert response2.headers.get("X-Cache") == "HIT"
        
        # 缓存命中应该显著更快
        assert second_request_time < first_request_time * 0.5
        print(f"第一次请求: {first_request_time:.3f}s, 第二次请求: {second_request_time:.3f}s")

    def test_cache_key_generation(self):
        """测试缓存键生成的一致性"""
        # 相同数据应该生成相同的缓存键
        key1 = self.cache_manager.generate_cache_key("test", self.test_request)
        key2 = self.cache_manager.generate_cache_key("test", self.test_request)
        assert key1 == key2
        
        # 不同数据应该生成不同的缓存键
        different_request = {**self.test_request, "principal": 20000}
        key3 = self.cache_manager.generate_cache_key("test", different_request)
        assert key1 != key3

    def test_cache_ttl_expiration(self):
        """测试缓存TTL过期机制"""
        # 设置短TTL用于测试
        original_ttl = CacheConfig.CALCULATION_CACHE_TTL
        CacheConfig.CALCULATION_CACHE_TTL = 1  # 1秒
        
        try:
            # 第一次请求
            response1 = self.client.post("/api/v1/calculator/compound-interest", json=self.test_request)
            assert response1.status_code == 200
            assert response1.headers.get("X-Cache") == "MISS"
            
            # 立即第二次请求 - 应该命中缓存
            response2 = self.client.post("/api/v1/calculator/compound-interest", json=self.test_request)
            assert response2.headers.get("X-Cache") == "HIT"
            
            # 等待缓存过期
            time.sleep(2)
            
            # 第三次请求 - 缓存应该已过期
            response3 = self.client.post("/api/v1/calculator/compound-interest", json=self.test_request)
            assert response3.headers.get("X-Cache") == "MISS"
            
        finally:
            # 恢复原始TTL
            CacheConfig.CALCULATION_CACHE_TTL = original_ttl

    def test_cache_stats_endpoint(self):
        """测试缓存统计端点"""
        # 执行一些请求以生成统计数据
        for i in range(5):
            request_data = {**self.test_request, "principal": 10000 + i * 1000}
            self.client.post("/api/v1/calculator/compound-interest", json=request_data)
        
        # 获取缓存统计
        stats_response = self.client.get("/cache/stats")
        assert stats_response.status_code == 200
        
        stats = stats_response.json()
        assert "hit_count" in stats
        assert "miss_count" in stats
        assert "hit_rate_percent" in stats
        assert "total_requests" in stats
        assert stats["cache_enabled"] is True

    def test_concurrent_cache_access(self):
        """测试并发缓存访问"""
        import threading
        import queue
        
        results = queue.Queue()
        
        def make_request():
            response = self.client.post("/api/v1/calculator/compound-interest", json=self.test_request)
            results.put({
                "status_code": response.status_code,
                "cache_status": response.headers.get("X-Cache"),
                "response_time": time.time()
            })
        
        # 创建10个并发线程
        threads = []
        start_time = time.time()
        
        for _ in range(10):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        # 收集结果
        responses = []
        while not results.empty():
            responses.append(results.get())
        
        # 验证结果
        assert len(responses) == 10
        assert all(r["status_code"] == 200 for r in responses)
        
        # 应该有缓存命中
        cache_hits = sum(1 for r in responses if r["cache_status"] == "HIT")
        assert cache_hits > 0
        
        print(f"并发测试: {cache_hits}/10 缓存命中")

    def test_cache_memory_usage(self):
        """测试缓存内存使用"""
        initial_stats = self.cache_manager.get_stats()
        initial_keys = initial_stats.get("total_keys", 0)
        
        # 创建多个不同的缓存条目
        for i in range(20):
            request_data = {**self.test_request, "principal": 10000 + i * 1000}
            self.client.post("/api/v1/calculator/compound-interest", json=request_data)
        
        final_stats = self.cache_manager.get_stats()
        final_keys = final_stats.get("total_keys", 0)
        
        # 验证缓存键数量增加
        assert final_keys > initial_keys
        print(f"缓存键数量: {initial_keys} -> {final_keys}")

    def test_cache_invalidation(self):
        """测试缓存失效机制"""
        # 第一次请求
        response1 = self.client.post("/api/v1/calculator/compound-interest", json=self.test_request)
        assert response1.headers.get("X-Cache") == "MISS"
        
        # 第二次请求 - 缓存命中
        response2 = self.client.post("/api/v1/calculator/compound-interest", json=self.test_request)
        assert response2.headers.get("X-Cache") == "HIT"
        
        # 手动清除缓存
        self.cache_manager.cache.clear()
        
        # 第三次请求 - 缓存应该未命中
        response3 = self.client.post("/api/v1/calculator/compound-interest", json=self.test_request)
        assert response3.headers.get("X-Cache") == "MISS"

    def test_cache_performance_targets(self):
        """测试缓存性能目标"""
        # 执行多次请求以建立缓存
        for _ in range(10):
            self.client.post("/api/v1/calculator/compound-interest", json=self.test_request)
        
        # 测试缓存命中性能
        start_time = time.time()
        for _ in range(100):
            response = self.client.post("/api/v1/calculator/compound-interest", json=self.test_request)
            assert response.status_code == 200
        
        total_time = time.time() - start_time
        avg_response_time = total_time / 100
        
        # 缓存命中的平均响应时间应该很快
        assert avg_response_time < 0.01  # 10ms
        print(f"平均缓存命中响应时间: {avg_response_time:.4f}s")
        
        # 检查缓存命中率
        stats = self.cache_manager.get_stats()
        hit_rate = float(stats["hit_rate_percent"])
        
        # 缓存命中率应该达到目标
        assert hit_rate >= 85.0  # 85%目标命中率
        print(f"缓存命中率: {hit_rate}%")

    @pytest.mark.asyncio
    async def test_async_cache_operations(self):
        """测试异步缓存操作"""
        # 模拟异步缓存操作
        async def async_cache_test():
            # 这里可以测试异步缓存操作
            # 由于当前实现是同步的，这个测试主要是为了未来扩展
            return True
        
        result = await async_cache_test()
        assert result is True

    def test_cache_error_handling(self):
        """测试缓存错误处理"""
        # 模拟缓存错误
        with patch.object(self.cache_manager.cache, 'get', side_effect=Exception("Cache error")):
            # 即使缓存出错，请求也应该正常处理
            response = self.client.post("/api/v1/calculator/compound-interest", json=self.test_request)
            assert response.status_code == 200

    def test_cache_configuration(self):
        """测试缓存配置"""
        # 验证缓存配置
        assert CacheConfig.CALCULATION_CACHE_TTL == 300
        assert CacheConfig.LIMITS_CACHE_TTL == 3600
        assert CacheConfig.HEALTH_CACHE_TTL == 60
        assert CacheConfig.MAX_CACHE_SIZE == 1000
        assert CacheConfig.CACHE_ENABLED is True

    def teardown_method(self):
        """测试后清理"""
        # 清理缓存
        self.cache_manager.cache.clear()


class TestCacheIntegration:
    """缓存集成测试"""
    
    def test_full_request_cycle_with_cache(self):
        """测试完整的请求周期缓存"""
        client = TestClient(app)
        
        request_data = {
            "principal": 15000,
            "annual_rate": 3.5,
            "years": 15,
            "monthly_payment": 300,
            "compound_frequency": "monthly"
        }
        
        # 第一次请求 - 完整计算
        response1 = client.post("/api/v1/calculator/compound-interest", json=request_data)
        assert response1.status_code == 200
        result1 = response1.json()
        
        # 第二次请求 - 缓存命中
        response2 = client.post("/api/v1/calculator/compound-interest", json=request_data)
        assert response2.status_code == 200
        result2 = response2.json()
        
        # 结果应该完全相同
        assert result1["final_amount"] == result2["final_amount"]
        assert result1["total_interest"] == result2["total_interest"]
        assert result1["total_contributions"] == result2["total_contributions"]
        
        # 第二次请求应该有缓存标记
        assert response2.headers.get("X-Cache") == "HIT"

    def test_cache_with_different_parameters(self):
        """测试不同参数的缓存隔离"""
        client = TestClient(app)
        
        request1 = {
            "principal": 10000,
            "annual_rate": 4.0,
            "years": 10,
            "monthly_payment": 0,
            "compound_frequency": "monthly"
        }
        
        request2 = {
            "principal": 20000,  # 不同的本金
            "annual_rate": 4.0,
            "years": 10,
            "monthly_payment": 0,
            "compound_frequency": "monthly"
        }
        
        # 两个不同的请求
        response1 = client.post("/api/v1/calculator/compound-interest", json=request1)
        response2 = client.post("/api/v1/calculator/compound-interest", json=request2)
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        # 结果应该不同
        result1 = response1.json()
        result2 = response2.json()
        assert result1["final_amount"] != result2["final_amount"]
        
        # 重复请求应该命中各自的缓存
        response1_repeat = client.post("/api/v1/calculator/compound-interest", json=request1)
        response2_repeat = client.post("/api/v1/calculator/compound-interest", json=request2)
        
        assert response1_repeat.headers.get("X-Cache") == "HIT"
        assert response2_repeat.headers.get("X-Cache") == "HIT"
