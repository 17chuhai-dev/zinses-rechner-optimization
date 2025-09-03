"""
监控告警系统
实现全面的服务监控、健康检查和告警机制
"""

import asyncio
import time
import psutil
import logging
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
from fastapi import Request
import httpx

logger = logging.getLogger(__name__)


class HealthStatus(Enum):
    """健康状态枚举"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


class AlertSeverity(Enum):
    """告警严重程度"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class HealthCheck:
    """健康检查结果"""
    name: str
    status: HealthStatus
    response_time_ms: float
    message: str
    timestamp: datetime
    details: Dict[str, Any] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            **asdict(self),
            'status': self.status.value,
            'timestamp': self.timestamp.isoformat()
        }


@dataclass
class MetricData:
    """监控指标数据"""
    name: str
    value: float
    unit: str
    timestamp: datetime
    tags: Dict[str, str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            **asdict(self),
            'timestamp': self.timestamp.isoformat()
        }


@dataclass
class Alert:
    """告警信息"""
    id: str
    name: str
    severity: AlertSeverity
    message: str
    metric_name: str
    current_value: float
    threshold: float
    timestamp: datetime
    resolved: bool = False
    resolved_at: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            **asdict(self),
            'severity': self.severity.value,
            'timestamp': self.timestamp.isoformat(),
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }


class HealthChecker:
    """健康检查器"""
    
    def __init__(self):
        self.checks: Dict[str, Callable] = {}
        self.last_results: Dict[str, HealthCheck] = {}
    
    def register_check(self, name: str, check_func: Callable):
        """注册健康检查函数"""
        self.checks[name] = check_func
        logger.info(f"Registered health check: {name}")
    
    async def run_check(self, name: str) -> HealthCheck:
        """运行单个健康检查"""
        if name not in self.checks:
            return HealthCheck(
                name=name,
                status=HealthStatus.UNKNOWN,
                response_time_ms=0,
                message=f"Check '{name}' not found",
                timestamp=datetime.now()
            )
        
        start_time = time.time()
        try:
            result = await self.checks[name]()
            response_time = (time.time() - start_time) * 1000
            
            if isinstance(result, HealthCheck):
                result.response_time_ms = response_time
                return result
            else:
                return HealthCheck(
                    name=name,
                    status=HealthStatus.HEALTHY,
                    response_time_ms=response_time,
                    message="Check passed",
                    timestamp=datetime.now(),
                    details=result if isinstance(result, dict) else None
                )
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            logger.error(f"Health check '{name}' failed: {e}")
            
            return HealthCheck(
                name=name,
                status=HealthStatus.UNHEALTHY,
                response_time_ms=response_time,
                message=str(e),
                timestamp=datetime.now()
            )
    
    async def run_all_checks(self) -> Dict[str, HealthCheck]:
        """运行所有健康检查"""
        results = {}
        
        for name in self.checks.keys():
            result = await self.run_check(name)
            results[name] = result
            self.last_results[name] = result
        
        return results
    
    def get_overall_status(self) -> HealthStatus:
        """获取整体健康状态"""
        if not self.last_results:
            return HealthStatus.UNKNOWN
        
        statuses = [check.status for check in self.last_results.values()]
        
        if any(status == HealthStatus.UNHEALTHY for status in statuses):
            return HealthStatus.UNHEALTHY
        elif any(status == HealthStatus.DEGRADED for status in statuses):
            return HealthStatus.DEGRADED
        elif all(status == HealthStatus.HEALTHY for status in statuses):
            return HealthStatus.HEALTHY
        else:
            return HealthStatus.UNKNOWN


class MetricsCollector:
    """指标收集器"""
    
    def __init__(self):
        self.metrics: List[MetricData] = []
        self.max_metrics = 10000
        self.collection_interval = 30  # 秒
    
    def collect_metric(self, name: str, value: float, unit: str, tags: Dict[str, str] = None):
        """收集单个指标"""
        metric = MetricData(
            name=name,
            value=value,
            unit=unit,
            timestamp=datetime.now(),
            tags=tags or {}
        )
        
        self.metrics.append(metric)
        
        # 限制指标数量
        if len(self.metrics) > self.max_metrics:
            self.metrics = self.metrics[-self.max_metrics//2:]
        
        logger.debug(f"Collected metric: {name}={value}{unit}")
    
    def collect_system_metrics(self):
        """收集系统指标"""
        try:
            # CPU使用率
            cpu_percent = psutil.cpu_percent(interval=1)
            self.collect_metric("system.cpu.usage", cpu_percent, "%")
            
            # 内存使用率
            memory = psutil.virtual_memory()
            self.collect_metric("system.memory.usage", memory.percent, "%")
            self.collect_metric("system.memory.available", memory.available, "bytes")
            
            # 磁盘使用率
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            self.collect_metric("system.disk.usage", disk_percent, "%")
            
            # 网络IO
            network = psutil.net_io_counters()
            self.collect_metric("system.network.bytes_sent", network.bytes_sent, "bytes")
            self.collect_metric("system.network.bytes_recv", network.bytes_recv, "bytes")
            
        except Exception as e:
            logger.error(f"Failed to collect system metrics: {e}")
    
    def get_metrics(self, name: str = None, hours: int = 24) -> List[MetricData]:
        """获取指标数据"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        filtered_metrics = [
            metric for metric in self.metrics
            if metric.timestamp > cutoff_time
        ]
        
        if name:
            filtered_metrics = [
                metric for metric in filtered_metrics
                if metric.name == name
            ]
        
        return filtered_metrics
    
    def get_metric_summary(self, name: str, hours: int = 1) -> Dict[str, float]:
        """获取指标摘要统计"""
        metrics = self.get_metrics(name, hours)
        
        if not metrics:
            return {}
        
        values = [metric.value for metric in metrics]
        
        return {
            'count': len(values),
            'min': min(values),
            'max': max(values),
            'avg': sum(values) / len(values),
            'latest': values[-1] if values else 0
        }


class AlertManager:
    """告警管理器"""
    
    def __init__(self):
        self.alert_rules: List[Dict[str, Any]] = []
        self.active_alerts: Dict[str, Alert] = {}
        self.alert_history: List[Alert] = []
        self.notification_channels: Dict[str, Callable] = {}
    
    def add_alert_rule(
        self,
        name: str,
        metric_name: str,
        threshold: float,
        comparison: str = "greater_than",
        severity: AlertSeverity = AlertSeverity.WARNING,
        duration_minutes: int = 5,
        channels: List[str] = None
    ):
        """添加告警规则"""
        rule = {
            'name': name,
            'metric_name': metric_name,
            'threshold': threshold,
            'comparison': comparison,
            'severity': severity,
            'duration_minutes': duration_minutes,
            'channels': channels or ['log'],
            'enabled': True
        }
        
        self.alert_rules.append(rule)
        logger.info(f"Added alert rule: {name}")
    
    def register_notification_channel(self, name: str, handler: Callable):
        """注册通知渠道"""
        self.notification_channels[name] = handler
        logger.info(f"Registered notification channel: {name}")
    
    async def check_alerts(self, metrics: List[MetricData]):
        """检查告警条件"""
        for rule in self.alert_rules:
            if not rule['enabled']:
                continue
            
            await self._check_single_rule(rule, metrics)
    
    async def _check_single_rule(self, rule: Dict[str, Any], metrics: List[MetricData]):
        """检查单个告警规则"""
        metric_name = rule['metric_name']
        threshold = rule['threshold']
        comparison = rule['comparison']
        
        # 获取相关指标
        relevant_metrics = [m for m in metrics if m.name == metric_name]
        
        if not relevant_metrics:
            return
        
        # 获取最新值
        latest_metric = max(relevant_metrics, key=lambda m: m.timestamp)
        current_value = latest_metric.value
        
        # 检查告警条件
        should_alert = False
        if comparison == "greater_than" and current_value > threshold:
            should_alert = True
        elif comparison == "less_than" and current_value < threshold:
            should_alert = True
        elif comparison == "equals" and current_value == threshold:
            should_alert = True
        
        alert_id = f"{rule['name']}_{metric_name}"
        
        if should_alert:
            if alert_id not in self.active_alerts:
                # 创建新告警
                alert = Alert(
                    id=alert_id,
                    name=rule['name'],
                    severity=rule['severity'],
                    message=f"{rule['name']}: {metric_name} is {current_value} (threshold: {threshold})",
                    metric_name=metric_name,
                    current_value=current_value,
                    threshold=threshold,
                    timestamp=datetime.now()
                )
                
                self.active_alerts[alert_id] = alert
                self.alert_history.append(alert)
                
                # 发送通知
                await self._send_notifications(alert, rule['channels'])
                
                logger.warning(f"Alert triggered: {alert.name}")
        
        else:
            # 检查是否需要解决告警
            if alert_id in self.active_alerts:
                alert = self.active_alerts[alert_id]
                alert.resolved = True
                alert.resolved_at = datetime.now()
                
                del self.active_alerts[alert_id]
                
                logger.info(f"Alert resolved: {alert.name}")
    
    async def _send_notifications(self, alert: Alert, channels: List[str]):
        """发送告警通知"""
        for channel in channels:
            if channel in self.notification_channels:
                try:
                    await self.notification_channels[channel](alert)
                except Exception as e:
                    logger.error(f"Failed to send notification to {channel}: {e}")
    
    def get_active_alerts(self) -> List[Alert]:
        """获取活跃告警"""
        return list(self.active_alerts.values())
    
    def get_alert_history(self, hours: int = 24) -> List[Alert]:
        """获取告警历史"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        return [
            alert for alert in self.alert_history
            if alert.timestamp > cutoff_time
        ]


class MonitoringService:
    """监控服务"""
    
    def __init__(self):
        self.health_checker = HealthChecker()
        self.metrics_collector = MetricsCollector()
        self.alert_manager = AlertManager()
        self.is_running = False
        self.monitoring_task = None
        
        # 注册默认健康检查
        self._register_default_health_checks()
        
        # 注册默认告警规则
        self._register_default_alert_rules()
        
        # 注册默认通知渠道
        self._register_default_notification_channels()
    
    def _register_default_health_checks(self):
        """注册默认健康检查"""
        
        async def check_api_health():
            """API健康检查"""
            try:
                # 检查API响应
                async with httpx.AsyncClient() as client:
                    response = await client.get("http://localhost:8000/health", timeout=5.0)
                    
                if response.status_code == 200:
                    return HealthCheck(
                        name="api",
                        status=HealthStatus.HEALTHY,
                        response_time_ms=0,  # 将在run_check中设置
                        message="API responding normally",
                        timestamp=datetime.now()
                    )
                else:
                    return HealthCheck(
                        name="api",
                        status=HealthStatus.DEGRADED,
                        response_time_ms=0,
                        message=f"API returned status {response.status_code}",
                        timestamp=datetime.now()
                    )
            except Exception as e:
                return HealthCheck(
                    name="api",
                    status=HealthStatus.UNHEALTHY,
                    response_time_ms=0,
                    message=f"API check failed: {str(e)}",
                    timestamp=datetime.now()
                )
        
        async def check_database_health():
            """数据库健康检查"""
            # 简化实现，实际应该检查数据库连接
            try:
                # 模拟数据库检查
                await asyncio.sleep(0.01)
                return HealthCheck(
                    name="database",
                    status=HealthStatus.HEALTHY,
                    response_time_ms=0,
                    message="Database connection healthy",
                    timestamp=datetime.now()
                )
            except Exception as e:
                return HealthCheck(
                    name="database",
                    status=HealthStatus.UNHEALTHY,
                    response_time_ms=0,
                    message=f"Database check failed: {str(e)}",
                    timestamp=datetime.now()
                )
        
        async def check_cache_health():
            """缓存健康检查"""
            try:
                from app.core.cache import get_cache_manager
                cache_manager = get_cache_manager()
                stats = cache_manager.get_stats()
                
                # 检查缓存命中率
                hit_rate = stats.get('hit_rate_percent', 0)
                if hit_rate >= 80:
                    status = HealthStatus.HEALTHY
                    message = f"Cache hit rate: {hit_rate}%"
                elif hit_rate >= 60:
                    status = HealthStatus.DEGRADED
                    message = f"Cache hit rate low: {hit_rate}%"
                else:
                    status = HealthStatus.UNHEALTHY
                    message = f"Cache hit rate critical: {hit_rate}%"
                
                return HealthCheck(
                    name="cache",
                    status=status,
                    response_time_ms=0,
                    message=message,
                    timestamp=datetime.now(),
                    details=stats
                )
            except Exception as e:
                return HealthCheck(
                    name="cache",
                    status=HealthStatus.UNHEALTHY,
                    response_time_ms=0,
                    message=f"Cache check failed: {str(e)}",
                    timestamp=datetime.now()
                )
        
        async def check_system_resources():
            """系统资源检查"""
            try:
                cpu_percent = psutil.cpu_percent(interval=1)
                memory = psutil.virtual_memory()
                disk = psutil.disk_usage('/')
                
                # 评估系统状态
                if cpu_percent > 90 or memory.percent > 90 or (disk.used / disk.total) > 0.9:
                    status = HealthStatus.UNHEALTHY
                    message = "System resources critical"
                elif cpu_percent > 70 or memory.percent > 70 or (disk.used / disk.total) > 0.8:
                    status = HealthStatus.DEGRADED
                    message = "System resources high"
                else:
                    status = HealthStatus.HEALTHY
                    message = "System resources normal"
                
                return HealthCheck(
                    name="system",
                    status=status,
                    response_time_ms=0,
                    message=message,
                    timestamp=datetime.now(),
                    details={
                        'cpu_percent': cpu_percent,
                        'memory_percent': memory.percent,
                        'disk_percent': (disk.used / disk.total) * 100
                    }
                )
            except Exception as e:
                return HealthCheck(
                    name="system",
                    status=HealthStatus.UNHEALTHY,
                    response_time_ms=0,
                    message=f"System check failed: {str(e)}",
                    timestamp=datetime.now()
                )
        
        # 注册检查函数
        self.health_checker.register_check("api", check_api_health)
        self.health_checker.register_check("database", check_database_health)
        self.health_checker.register_check("cache", check_cache_health)
        self.health_checker.register_check("system", check_system_resources)
    
    def _register_default_alert_rules(self):
        """注册默认告警规则"""
        
        # API响应时间告警
        self.alert_manager.add_alert_rule(
            name="API Response Time High",
            metric_name="api.response_time",
            threshold=1000,  # 1秒
            comparison="greater_than",
            severity=AlertSeverity.WARNING,
            channels=["log", "email"]
        )
        
        # 错误率告警
        self.alert_manager.add_alert_rule(
            name="Error Rate High",
            metric_name="api.error_rate",
            threshold=1.0,  # 1%
            comparison="greater_than",
            severity=AlertSeverity.ERROR,
            channels=["log", "email", "slack"]
        )
        
        # 缓存命中率告警
        self.alert_manager.add_alert_rule(
            name="Cache Hit Rate Low",
            metric_name="cache.hit_rate",
            threshold=80.0,  # 80%
            comparison="less_than",
            severity=AlertSeverity.WARNING,
            channels=["log"]
        )
        
        # 系统资源告警
        self.alert_manager.add_alert_rule(
            name="CPU Usage High",
            metric_name="system.cpu.usage",
            threshold=80.0,  # 80%
            comparison="greater_than",
            severity=AlertSeverity.WARNING,
            channels=["log", "email"]
        )
        
        self.alert_manager.add_alert_rule(
            name="Memory Usage Critical",
            metric_name="system.memory.usage",
            threshold=90.0,  # 90%
            comparison="greater_than",
            severity=AlertSeverity.CRITICAL,
            channels=["log", "email", "slack"]
        )
    
    def _register_default_notification_channels(self):
        """注册默认通知渠道"""
        
        async def log_notification(alert: Alert):
            """日志通知"""
            logger.warning(f"ALERT: {alert.name} - {alert.message}")
        
        async def email_notification(alert: Alert):
            """邮件通知（模拟）"""
            # 实际实现应该集成邮件服务
            logger.info(f"EMAIL ALERT: {alert.name} - {alert.message}")
            # 这里应该调用邮件服务API
        
        async def slack_notification(alert: Alert):
            """Slack通知（模拟）"""
            # 实际实现应该集成Slack Webhook
            logger.info(f"SLACK ALERT: {alert.name} - {alert.message}")
            # 这里应该调用Slack Webhook
        
        self.alert_manager.register_notification_channel("log", log_notification)
        self.alert_manager.register_notification_channel("email", email_notification)
        self.alert_manager.register_notification_channel("slack", slack_notification)
    
    async def start_monitoring(self):
        """开始监控"""
        if self.is_running:
            return
        
        self.is_running = True
        self.monitoring_task = asyncio.create_task(self._monitoring_loop())
        logger.info("Monitoring service started")
    
    async def stop_monitoring(self):
        """停止监控"""
        self.is_running = False
        if self.monitoring_task:
            self.monitoring_task.cancel()
            try:
                await self.monitoring_task
            except asyncio.CancelledError:
                pass
        logger.info("Monitoring service stopped")
    
    async def _monitoring_loop(self):
        """监控循环"""
        while self.is_running:
            try:
                # 收集系统指标
                self.metrics_collector.collect_system_metrics()
                
                # 运行健康检查
                await self.health_checker.run_all_checks()
                
                # 检查告警
                recent_metrics = self.metrics_collector.get_metrics(hours=1)
                await self.alert_manager.check_alerts(recent_metrics)
                
                # 等待下一次检查
                await asyncio.sleep(self.metrics_collector.collection_interval)
                
            except Exception as e:
                logger.error(f"Monitoring loop error: {e}")
                await asyncio.sleep(5)  # 错误时短暂等待
    
    def get_monitoring_status(self) -> Dict[str, Any]:
        """获取监控状态"""
        health_results = self.health_checker.last_results
        active_alerts = self.alert_manager.get_active_alerts()
        
        return {
            'monitoring_active': self.is_running,
            'overall_status': self.health_checker.get_overall_status().value,
            'health_checks': {name: check.to_dict() for name, check in health_results.items()},
            'active_alerts': [alert.to_dict() for alert in active_alerts],
            'alert_count': len(active_alerts),
            'last_check': max(
                (check.timestamp for check in health_results.values()),
                default=datetime.now()
            ).isoformat(),
            'uptime_seconds': time.time() - getattr(self, '_start_time', time.time())
        }


# 全局监控服务实例
monitoring_service = MonitoringService()


def get_monitoring_service() -> MonitoringService:
    """获取监控服务实例"""
    return monitoring_service
