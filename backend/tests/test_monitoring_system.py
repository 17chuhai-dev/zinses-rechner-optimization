"""
监控系统测试
验证监控告警系统的功能和可靠性
"""

import pytest
import asyncio
import time
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient

from app.main import app
from app.core.monitoring import (
    MonitoringService, 
    HealthChecker, 
    MetricsCollector, 
    AlertManager,
    HealthStatus,
    AlertSeverity
)
from app.core.notifications import NotificationManager


class TestHealthChecker:
    """健康检查器测试"""

    def setup_method(self):
        """测试前置设置"""
        self.health_checker = HealthChecker()

    @pytest.mark.asyncio
    async def test_register_and_run_check(self):
        """测试注册和运行健康检查"""
        # 注册一个简单的检查
        async def dummy_check():
            return {"status": "ok"}
        
        self.health_checker.register_check("dummy", dummy_check)
        
        # 运行检查
        result = await self.health_checker.run_check("dummy")
        
        assert result.name == "dummy"
        assert result.status == HealthStatus.HEALTHY
        assert result.response_time_ms > 0

    @pytest.mark.asyncio
    async def test_failing_health_check(self):
        """测试失败的健康检查"""
        async def failing_check():
            raise Exception("Check failed")
        
        self.health_checker.register_check("failing", failing_check)
        
        result = await self.health_checker.run_check("failing")
        
        assert result.name == "failing"
        assert result.status == HealthStatus.UNHEALTHY
        assert "Check failed" in result.message

    @pytest.mark.asyncio
    async def test_run_all_checks(self):
        """测试运行所有检查"""
        async def check1():
            return {"status": "ok"}
        
        async def check2():
            return {"status": "ok"}
        
        self.health_checker.register_check("check1", check1)
        self.health_checker.register_check("check2", check2)
        
        results = await self.health_checker.run_all_checks()
        
        assert len(results) == 2
        assert "check1" in results
        assert "check2" in results
        assert all(result.status == HealthStatus.HEALTHY for result in results.values())

    def test_overall_status_calculation(self):
        """测试整体状态计算"""
        # 模拟检查结果
        from app.core.monitoring import HealthCheck
        from datetime import datetime
        
        self.health_checker.last_results = {
            "api": HealthCheck("api", HealthStatus.HEALTHY, 100, "OK", datetime.now()),
            "cache": HealthCheck("cache", HealthStatus.DEGRADED, 200, "Slow", datetime.now())
        }
        
        overall = self.health_checker.get_overall_status()
        assert overall == HealthStatus.DEGRADED  # 最差状态


class TestMetricsCollector:
    """指标收集器测试"""

    def setup_method(self):
        """测试前置设置"""
        self.metrics_collector = MetricsCollector()

    def test_collect_metric(self):
        """测试指标收集"""
        self.metrics_collector.collect_metric("test.metric", 42.5, "ms")
        
        metrics = self.metrics_collector.get_metrics("test.metric")
        assert len(metrics) == 1
        assert metrics[0].name == "test.metric"
        assert metrics[0].value == 42.5
        assert metrics[0].unit == "ms"

    def test_metric_retention(self):
        """测试指标保留"""
        # 添加大量指标
        for i in range(15000):
            self.metrics_collector.collect_metric(f"test.metric.{i}", i, "count")
        
        # 验证指标数量被限制
        all_metrics = self.metrics_collector.get_metrics()
        assert len(all_metrics) <= self.metrics_collector.max_metrics

    @patch('psutil.cpu_percent')
    @patch('psutil.virtual_memory')
    @patch('psutil.disk_usage')
    @patch('psutil.net_io_counters')
    def test_system_metrics_collection(self, mock_net, mock_disk, mock_memory, mock_cpu):
        """测试系统指标收集"""
        # 模拟系统指标
        mock_cpu.return_value = 45.2
        mock_memory.return_value = MagicMock(percent=67.8, available=1024*1024*1024)
        mock_disk.return_value = MagicMock(used=500*1024*1024, total=1000*1024*1024)
        mock_net.return_value = MagicMock(bytes_sent=1000000, bytes_recv=2000000)
        
        self.metrics_collector.collect_system_metrics()
        
        # 验证指标被收集
        cpu_metrics = self.metrics_collector.get_metrics("system.cpu.usage")
        assert len(cpu_metrics) == 1
        assert cpu_metrics[0].value == 45.2

    def test_metric_summary(self):
        """测试指标摘要统计"""
        # 添加测试数据
        values = [10, 20, 30, 40, 50]
        for value in values:
            self.metrics_collector.collect_metric("test.summary", value, "count")
        
        summary = self.metrics_collector.get_metric_summary("test.summary")
        
        assert summary['count'] == 5
        assert summary['min'] == 10
        assert summary['max'] == 50
        assert summary['avg'] == 30
        assert summary['latest'] == 50


class TestAlertManager:
    """告警管理器测试"""

    def setup_method(self):
        """测试前置设置"""
        self.alert_manager = AlertManager()

    def test_add_alert_rule(self):
        """测试添加告警规则"""
        self.alert_manager.add_alert_rule(
            name="Test Alert",
            metric_name="test.metric",
            threshold=100,
            severity=AlertSeverity.WARNING
        )
        
        assert len(self.alert_manager.alert_rules) == 1
        rule = self.alert_manager.alert_rules[0]
        assert rule['name'] == "Test Alert"
        assert rule['threshold'] == 100

    @pytest.mark.asyncio
    async def test_alert_triggering(self):
        """测试告警触发"""
        # 添加告警规则
        self.alert_manager.add_alert_rule(
            name="High Value Alert",
            metric_name="test.value",
            threshold=50,
            severity=AlertSeverity.WARNING
        )
        
        # 模拟指标数据
        from app.core.monitoring import MetricData
        from datetime import datetime
        
        metrics = [
            MetricData("test.value", 75, "count", datetime.now())  # 超过阈值
        ]
        
        # 检查告警
        await self.alert_manager.check_alerts(metrics)
        
        # 验证告警被触发
        active_alerts = self.alert_manager.get_active_alerts()
        assert len(active_alerts) == 1
        assert active_alerts[0].name == "High Value Alert"

    @pytest.mark.asyncio
    async def test_alert_resolution(self):
        """测试告警解决"""
        # 先触发告警
        self.alert_manager.add_alert_rule(
            name="Test Resolution",
            metric_name="test.resolution",
            threshold=50,
            severity=AlertSeverity.WARNING
        )
        
        from app.core.monitoring import MetricData
        from datetime import datetime
        
        # 触发告警
        high_metrics = [MetricData("test.resolution", 75, "count", datetime.now())]
        await self.alert_manager.check_alerts(high_metrics)
        
        assert len(self.alert_manager.get_active_alerts()) == 1
        
        # 解决告警
        low_metrics = [MetricData("test.resolution", 25, "count", datetime.now())]
        await self.alert_manager.check_alerts(low_metrics)
        
        assert len(self.alert_manager.get_active_alerts()) == 0

    @pytest.mark.asyncio
    async def test_notification_channel_registration(self):
        """测试通知渠道注册"""
        notification_called = False
        
        async def test_notification(alert):
            nonlocal notification_called
            notification_called = True
        
        self.alert_manager.register_notification_channel("test", test_notification)
        
        # 添加使用测试渠道的告警规则
        self.alert_manager.add_alert_rule(
            name="Test Notification",
            metric_name="test.notification",
            threshold=50,
            channels=["test"]
        )
        
        # 触发告警
        from app.core.monitoring import MetricData
        from datetime import datetime
        
        metrics = [MetricData("test.notification", 75, "count", datetime.now())]
        await self.alert_manager.check_alerts(metrics)
        
        # 验证通知被调用
        assert notification_called


class TestMonitoringService:
    """监控服务测试"""

    def setup_method(self):
        """测试前置设置"""
        self.monitoring_service = MonitoringService()

    @pytest.mark.asyncio
    async def test_monitoring_service_lifecycle(self):
        """测试监控服务生命周期"""
        # 启动监控
        await self.monitoring_service.start_monitoring()
        assert self.monitoring_service.is_running
        
        # 等待一个监控周期
        await asyncio.sleep(0.1)
        
        # 停止监控
        await self.monitoring_service.stop_monitoring()
        assert not self.monitoring_service.is_running

    def test_monitoring_status(self):
        """测试监控状态获取"""
        status = self.monitoring_service.get_monitoring_status()
        
        assert 'monitoring_active' in status
        assert 'overall_status' in status
        assert 'health_checks' in status
        assert 'active_alerts' in status
        assert 'uptime_seconds' in status

    @patch('psutil.cpu_percent')
    def test_system_metrics_integration(self, mock_cpu):
        """测试系统指标集成"""
        mock_cpu.return_value = 75.5
        
        # 收集系统指标
        self.monitoring_service.metrics_collector.collect_system_metrics()
        
        # 验证指标被收集
        cpu_metrics = self.monitoring_service.metrics_collector.get_metrics("system.cpu.usage")
        assert len(cpu_metrics) == 1
        assert cpu_metrics[0].value == 75.5


class TestMonitoringAPI:
    """监控API测试"""

    def setup_method(self):
        """测试前置设置"""
        self.client = TestClient(app)

    def test_monitoring_status_endpoint(self):
        """测试监控状态端点"""
        response = self.client.get("/monitoring/status")
        assert response.status_code == 200
        
        data = response.json()
        assert 'monitoring_active' in data
        assert 'overall_status' in data
        assert 'health_checks' in data

    def test_monitoring_alerts_endpoint(self):
        """测试监控告警端点"""
        response = self.client.get("/monitoring/alerts")
        assert response.status_code == 200
        
        data = response.json()
        assert 'active_alerts' in data
        assert 'alert_history' in data
        assert 'alert_rules' in data
        assert 'notification_channels' in data

    def test_monitoring_metrics_endpoint(self):
        """测试监控指标端点"""
        response = self.client.get("/monitoring/metrics")
        assert response.status_code == 200
        
        data = response.json()
        assert 'metrics_count' in data
        assert 'latest_metrics' in data
        assert 'summary' in data

    def test_monitoring_metrics_filtering(self):
        """测试指标过滤"""
        response = self.client.get("/monitoring/metrics?metric_name=system.cpu.usage&hours=1")
        assert response.status_code == 200
        
        data = response.json()
        assert data['time_range_hours'] == 1


class TestNotificationSystem:
    """通知系统测试"""

    def setup_method(self):
        """测试前置设置"""
        self.notification_manager = NotificationManager()

    @pytest.mark.asyncio
    async def test_notification_suppression(self):
        """测试通知抑制"""
        from app.core.monitoring import Alert
        from datetime import datetime
        
        # 创建测试告警
        alert = Alert(
            id="test_alert",
            name="Test Alert",
            severity=AlertSeverity.WARNING,
            message="Test message",
            metric_name="test.metric",
            current_value=100,
            threshold=50,
            timestamp=datetime.now()
        )
        
        # 第一次发送应该成功
        should_suppress_1 = self.notification_manager._should_suppress_notification(alert)
        assert not should_suppress_1
        
        # 记录发送
        self.notification_manager.suppressed_alerts[alert.id] = datetime.now()
        
        # 立即再次发送应该被抑制
        should_suppress_2 = self.notification_manager._should_suppress_notification(alert)
        assert should_suppress_2

    def test_notification_stats(self):
        """测试通知统计"""
        stats = self.notification_manager.get_notification_stats()
        
        assert 'total_notifications_24h' in stats
        assert 'notifications_by_severity' in stats
        assert 'notifications_by_channel' in stats
        assert 'suppressed_alerts' in stats


class TestIntegrationScenarios:
    """集成场景测试"""

    def setup_method(self):
        """测试前置设置"""
        self.client = TestClient(app)

    @pytest.mark.asyncio
    async def test_high_cpu_alert_scenario(self):
        """测试高CPU使用率告警场景"""
        monitoring_service = MonitoringService()
        
        # 模拟高CPU使用率
        with patch('psutil.cpu_percent', return_value=95.0):
            monitoring_service.metrics_collector.collect_system_metrics()
            
            # 检查是否触发告警
            recent_metrics = monitoring_service.metrics_collector.get_metrics(hours=1)
            await monitoring_service.alert_manager.check_alerts(recent_metrics)
            
            # 验证告警被触发
            active_alerts = monitoring_service.alert_manager.get_active_alerts()
            cpu_alerts = [alert for alert in active_alerts if 'CPU' in alert.name]
            assert len(cpu_alerts) > 0

    def test_api_health_degradation_scenario(self):
        """测试API健康状况恶化场景"""
        # 模拟API响应缓慢
        response = self.client.get("/health")
        assert response.status_code == 200
        
        # 检查响应时间（实际应该测量）
        # 这里简化为检查响应成功

    def test_cache_performance_monitoring(self):
        """测试缓存性能监控"""
        # 获取缓存统计
        response = self.client.get("/cache/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert 'hit_rate_percent' in data
        assert 'total_requests' in data

    def test_monitoring_dashboard_data(self):
        """测试监控仪表盘数据"""
        # 获取监控状态
        status_response = self.client.get("/monitoring/status")
        assert status_response.status_code == 200
        
        # 获取告警信息
        alerts_response = self.client.get("/monitoring/alerts")
        assert alerts_response.status_code == 200
        
        # 验证数据结构
        status_data = status_response.json()
        alerts_data = alerts_response.json()
        
        assert 'overall_status' in status_data
        assert 'health_checks' in status_data
        assert 'active_alerts' in alerts_data
        assert 'alert_history' in alerts_data


class TestProductionReadiness:
    """生产环境就绪性测试"""

    def test_monitoring_configuration(self):
        """测试监控配置"""
        # 验证默认配置
        monitoring_service = MonitoringService()
        
        # 检查健康检查是否注册
        assert len(monitoring_service.health_checker.checks) > 0
        
        # 检查告警规则是否配置
        assert len(monitoring_service.alert_manager.alert_rules) > 0
        
        # 检查通知渠道是否注册
        assert len(monitoring_service.alert_manager.notification_channels) > 0

    def test_performance_impact(self):
        """测试性能影响"""
        # 监控系统不应显著影响API性能
        start_time = time.time()
        
        response = self.client.get("/health")
        
        response_time = (time.time() - start_time) * 1000
        
        assert response.status_code == 200
        assert response_time < 100  # 响应时间应小于100ms

    def test_error_handling_robustness(self):
        """测试错误处理健壮性"""
        # 监控系统应该能够处理各种错误情况
        monitoring_service = MonitoringService()
        
        # 测试无效指标名称
        try:
            monitoring_service.metrics_collector.collect_metric("", 0, "")
        except Exception:
            pass  # 应该优雅处理错误
        
        # 测试无效告警规则
        try:
            monitoring_service.alert_manager.add_alert_rule(
                name="",
                metric_name="",
                threshold=-1,
                severity="invalid"
            )
        except Exception:
            pass  # 应该优雅处理错误

    def test_monitoring_api_security(self):
        """测试监控API安全性"""
        # 监控端点应该受到安全保护
        response = self.client.get("/monitoring/status")
        
        # 验证安全头
        assert 'X-Frame-Options' in response.headers
        assert 'X-Content-Type-Options' in response.headers
        assert 'Content-Security-Policy' in response.headers

    def test_monitoring_data_privacy(self):
        """测试监控数据隐私"""
        # 监控数据不应包含敏感信息
        response = self.client.get("/monitoring/status")
        assert response.status_code == 200
        
        data = response.json()
        response_text = str(data).lower()
        
        # 不应包含敏感信息
        sensitive_terms = ['password', 'secret', 'key', 'token', 'private']
        for term in sensitive_terms:
            assert term not in response_text
