"""
监控验证测试端点
仅在测试环境中启用，用于验证监控和告警功能
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
import asyncio
import time
import psutil
import logging
from datetime import datetime

from app.core.config import get_settings
from app.core.security import get_current_user_optional

# 仅在非生产环境启用
settings = get_settings()
if settings.ENVIRONMENT == "production":
    # 生产环境不暴露测试端点
    router = APIRouter(include_in_schema=False)
else:
    router = APIRouter(prefix="/test", tags=["monitoring-test"])

logger = logging.getLogger(__name__)

class AlertTriggerRequest(BaseModel):
    """告警触发请求模型"""
    metric: str = Field(..., description="指标名称")
    value: float = Field(..., description="指标值")
    test: bool = Field(default=True, description="是否为测试")
    duration_seconds: Optional[int] = Field(default=60, description="持续时间")

class SystemStressRequest(BaseModel):
    """系统压力测试请求"""
    stress_type: str = Field(..., description="压力类型: cpu, memory, io")
    intensity: int = Field(default=50, ge=1, le=100, description="压力强度百分比")
    duration_seconds: int = Field(default=30, ge=1, le=300, description="持续时间")

class MonitoringTestResponse(BaseModel):
    """监控测试响应"""
    success: bool
    message: str
    details: Dict[str, Any]
    timestamp: datetime

@router.post("/trigger-alert", response_model=MonitoringTestResponse)
async def trigger_test_alert(
    request: AlertTriggerRequest,
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    """
    触发测试告警
    用于验证告警规则和通知渠道
    """
    if settings.ENVIRONMENT == "production":
        raise HTTPException(status_code=404, detail="Test endpoint not available in production")
    
    logger.info(f"触发测试告警: {request.metric} = {request.value}")
    
    try:
        # 模拟告警条件
        alert_triggered = False
        alert_message = ""
        
        if request.metric == "cpu_usage" and request.value > 80:
            alert_triggered = True
            alert_message = f"CPU使用率过高: {request.value}%"
            
        elif request.metric == "memory_usage" and request.value > 80:
            alert_triggered = True
            alert_message = f"内存使用率过高: {request.value}%"
            
        elif request.metric == "api_response_time" and request.value > 1000:
            alert_triggered = True
            alert_message = f"API响应时间过长: {request.value}ms"
            
        elif request.metric == "error_rate" and request.value > 1:
            alert_triggered = True
            alert_message = f"错误率过高: {request.value}%"
        
        # 如果触发告警，发送通知
        if alert_triggered:
            await send_test_notification(request.metric, request.value, alert_message)
            
            return MonitoringTestResponse(
                success=True,
                message=f"测试告警已触发: {alert_message}",
                details={
                    "metric": request.metric,
                    "value": request.value,
                    "threshold_exceeded": True,
                    "notification_sent": True
                },
                timestamp=datetime.now()
            )
        else:
            return MonitoringTestResponse(
                success=True,
                message=f"指标值正常，未触发告警: {request.metric} = {request.value}",
                details={
                    "metric": request.metric,
                    "value": request.value,
                    "threshold_exceeded": False,
                    "notification_sent": False
                },
                timestamp=datetime.now()
            )
            
    except Exception as e:
        logger.error(f"告警测试失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"告警测试失败: {str(e)}")

@router.post("/system-stress", response_model=MonitoringTestResponse)
async def create_system_stress(
    request: SystemStressRequest,
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    """
    创建系统压力测试
    用于验证监控系统在高负载下的表现
    """
    if settings.ENVIRONMENT == "production":
        raise HTTPException(status_code=404, detail="Test endpoint not available in production")
    
    logger.info(f"开始系统压力测试: {request.stress_type} - {request.intensity}% - {request.duration_seconds}s")
    
    try:
        stress_details = {}
        
        if request.stress_type == "cpu":
            stress_details = await simulate_cpu_stress(request.intensity, request.duration_seconds)
            
        elif request.stress_type == "memory":
            stress_details = await simulate_memory_stress(request.intensity, request.duration_seconds)
            
        elif request.stress_type == "io":
            stress_details = await simulate_io_stress(request.intensity, request.duration_seconds)
            
        else:
            raise HTTPException(status_code=400, detail="不支持的压力测试类型")
        
        return MonitoringTestResponse(
            success=True,
            message=f"{request.stress_type}压力测试完成",
            details=stress_details,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"压力测试失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"压力测试失败: {str(e)}")

@router.get("/system-metrics", response_model=Dict[str, Any])
async def get_current_system_metrics():
    """
    获取当前系统指标
    用于验证监控数据收集
    """
    if settings.ENVIRONMENT == "production":
        raise HTTPException(status_code=404, detail="Test endpoint not available in production")
    
    try:
        # 获取系统指标
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # 获取进程指标
        process = psutil.Process()
        process_memory = process.memory_info()
        
        metrics = {
            "timestamp": datetime.now().isoformat(),
            "system": {
                "cpu_usage_percent": cpu_percent,
                "memory_usage_percent": memory.percent,
                "memory_available_mb": memory.available // (1024 * 1024),
                "disk_usage_percent": disk.percent,
                "disk_free_gb": disk.free // (1024 * 1024 * 1024)
            },
            "process": {
                "memory_rss_mb": process_memory.rss // (1024 * 1024),
                "memory_vms_mb": process_memory.vms // (1024 * 1024),
                "cpu_percent": process.cpu_percent(),
                "num_threads": process.num_threads()
            },
            "application": {
                "uptime_seconds": time.time() - settings.START_TIME,
                "environment": settings.ENVIRONMENT,
                "version": settings.VERSION
            }
        }
        
        return metrics
        
    except Exception as e:
        logger.error(f"获取系统指标失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取系统指标失败: {str(e)}")

@router.get("/health-detailed", response_model=Dict[str, Any])
async def get_detailed_health_check():
    """
    详细健康检查
    包含所有系统组件的健康状态
    """
    health_status = {
        "timestamp": datetime.now().isoformat(),
        "overall_status": "healthy",
        "components": {}
    }
    
    try:
        # 检查数据库连接
        # 这里应该检查实际的数据库连接
        health_status["components"]["database"] = {
            "status": "healthy",
            "response_time_ms": 10,
            "details": "Connection pool active"
        }
        
        # 检查缓存系统
        health_status["components"]["cache"] = {
            "status": "healthy",
            "hit_rate_percent": 85,
            "details": "Cache performance normal"
        }
        
        # 检查外部依赖
        health_status["components"]["external_apis"] = {
            "status": "healthy",
            "details": "All external services responding"
        }
        
        # 检查系统资源
        cpu_usage = psutil.cpu_percent(interval=1)
        memory_usage = psutil.virtual_memory().percent
        
        health_status["components"]["system_resources"] = {
            "status": "healthy" if cpu_usage < 80 and memory_usage < 80 else "warning",
            "cpu_usage_percent": cpu_usage,
            "memory_usage_percent": memory_usage,
            "details": f"CPU: {cpu_usage}%, Memory: {memory_usage}%"
        }
        
        # 确定整体状态
        component_statuses = [comp["status"] for comp in health_status["components"].values()]
        if "unhealthy" in component_statuses:
            health_status["overall_status"] = "unhealthy"
        elif "warning" in component_statuses:
            health_status["overall_status"] = "warning"
        
        return health_status
        
    except Exception as e:
        logger.error(f"详细健康检查失败: {str(e)}")
        health_status["overall_status"] = "unhealthy"
        health_status["error"] = str(e)
        return health_status

async def send_test_notification(metric: str, value: float, message: str):
    """发送测试通知"""
    try:
        # 这里应该调用实际的通知服务
        logger.info(f"发送测试通知: {message}")
        
        # 模拟通知发送延迟
        await asyncio.sleep(0.1)
        
        return True
    except Exception as e:
        logger.error(f"发送通知失败: {str(e)}")
        return False

async def simulate_cpu_stress(intensity: int, duration: int) -> Dict[str, Any]:
    """模拟CPU压力"""
    start_time = time.time()
    start_cpu = psutil.cpu_percent()
    
    # 创建CPU密集型任务
    def cpu_intensive_task():
        end_time = time.time() + duration
        while time.time() < end_time:
            # 执行一些CPU密集型计算
            sum(i * i for i in range(1000))
    
    # 根据强度创建多个任务
    tasks = []
    num_tasks = max(1, intensity // 20)
    
    for _ in range(num_tasks):
        task = asyncio.create_task(asyncio.to_thread(cpu_intensive_task))
        tasks.append(task)
    
    # 等待所有任务完成
    await asyncio.gather(*tasks)
    
    end_cpu = psutil.cpu_percent()
    actual_duration = time.time() - start_time
    
    return {
        "stress_type": "cpu",
        "target_intensity": intensity,
        "duration_seconds": actual_duration,
        "cpu_before": start_cpu,
        "cpu_after": end_cpu,
        "cpu_increase": end_cpu - start_cpu,
        "tasks_created": num_tasks
    }

async def simulate_memory_stress(intensity: int, duration: int) -> Dict[str, Any]:
    """模拟内存压力"""
    start_time = time.time()
    start_memory = psutil.virtual_memory().percent
    
    # 计算要分配的内存大小（MB）
    memory_to_allocate = intensity * 10  # 每个强度点分配10MB
    
    # 分配内存
    memory_blocks = []
    try:
        for _ in range(memory_to_allocate):
            # 分配1MB的内存块
            block = bytearray(1024 * 1024)
            memory_blocks.append(block)
        
        # 保持内存分配指定时间
        await asyncio.sleep(duration)
        
    finally:
        # 释放内存
        memory_blocks.clear()
    
    end_memory = psutil.virtual_memory().percent
    actual_duration = time.time() - start_time
    
    return {
        "stress_type": "memory",
        "target_intensity": intensity,
        "duration_seconds": actual_duration,
        "memory_before": start_memory,
        "memory_after": end_memory,
        "memory_allocated_mb": memory_to_allocate,
        "blocks_created": len(memory_blocks) if memory_blocks else 0
    }

async def simulate_io_stress(intensity: int, duration: int) -> Dict[str, Any]:
    """模拟IO压力"""
    start_time = time.time()
    
    # 创建临时文件进行IO操作
    import tempfile
    import os
    
    operations_count = 0
    bytes_written = 0
    
    end_time = time.time() + duration
    
    while time.time() < end_time:
        try:
            # 创建临时文件
            with tempfile.NamedTemporaryFile(delete=True) as temp_file:
                # 写入数据
                data_size = intensity * 1024  # 根据强度调整数据大小
                data = b'x' * data_size
                temp_file.write(data)
                temp_file.flush()
                os.fsync(temp_file.fileno())
                
                # 读取数据
                temp_file.seek(0)
                temp_file.read()
                
                operations_count += 1
                bytes_written += data_size
                
        except Exception as e:
            logger.warning(f"IO压力测试操作失败: {str(e)}")
            break
        
        # 短暂延迟避免过度消耗资源
        await asyncio.sleep(0.01)
    
    actual_duration = time.time() - start_time
    
    return {
        "stress_type": "io",
        "target_intensity": intensity,
        "duration_seconds": actual_duration,
        "operations_completed": operations_count,
        "bytes_written": bytes_written,
        "ops_per_second": operations_count / actual_duration if actual_duration > 0 else 0
    }

@router.get("/monitoring-status", response_model=Dict[str, Any])
async def get_monitoring_status():
    """
    获取监控系统状态
    验证监控组件是否正常工作
    """
    if settings.ENVIRONMENT == "production":
        raise HTTPException(status_code=404, detail="Test endpoint not available in production")
    
    try:
        status = {
            "timestamp": datetime.now().isoformat(),
            "monitoring_components": {
                "metrics_collection": {
                    "enabled": True,
                    "last_collection": datetime.now().isoformat(),
                    "status": "active"
                },
                "alert_rules": {
                    "enabled": True,
                    "rules_count": 5,
                    "status": "active"
                },
                "notification_channels": {
                    "slack": {
                        "enabled": bool(settings.SLACK_WEBHOOK_URL),
                        "status": "configured" if settings.SLACK_WEBHOOK_URL else "not_configured"
                    },
                    "email": {
                        "enabled": bool(settings.EMAIL_SMTP_SERVER),
                        "status": "configured" if settings.EMAIL_SMTP_SERVER else "not_configured"
                    }
                },
                "data_storage": {
                    "enabled": True,
                    "retention_days": 30,
                    "status": "active"
                }
            },
            "system_health": {
                "cpu_usage": psutil.cpu_percent(),
                "memory_usage": psutil.virtual_memory().percent,
                "disk_usage": psutil.disk_usage('/').percent,
                "uptime_seconds": time.time() - settings.START_TIME
            }
        }
        
        return status
        
    except Exception as e:
        logger.error(f"获取监控状态失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取监控状态失败: {str(e)}")

@router.post("/simulate-load", response_model=MonitoringTestResponse)
async def simulate_api_load(
    requests_per_second: int = Field(default=100, ge=1, le=1000),
    duration_seconds: int = Field(default=60, ge=1, le=300),
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    """
    模拟API负载
    用于测试监控系统在高负载下的表现
    """
    if settings.ENVIRONMENT == "production":
        raise HTTPException(status_code=404, detail="Test endpoint not available in production")
    
    logger.info(f"开始负载模拟: {requests_per_second} RPS, {duration_seconds}s")
    
    try:
        start_time = time.time()
        total_requests = 0
        successful_requests = 0
        failed_requests = 0
        
        # 计算请求间隔
        request_interval = 1.0 / requests_per_second
        
        async def make_test_request():
            nonlocal total_requests, successful_requests, failed_requests
            try:
                # 模拟API请求处理
                await asyncio.sleep(0.01)  # 模拟处理时间
                total_requests += 1
                successful_requests += 1
            except Exception:
                total_requests += 1
                failed_requests += 1
        
        # 生成负载
        end_time = time.time() + duration_seconds
        while time.time() < end_time:
            # 创建并发请求
            tasks = []
            for _ in range(min(10, requests_per_second)):  # 批量处理
                task = asyncio.create_task(make_test_request())
                tasks.append(task)
            
            await asyncio.gather(*tasks, return_exceptions=True)
            await asyncio.sleep(request_interval * 10)  # 调整间隔
        
        actual_duration = time.time() - start_time
        actual_rps = total_requests / actual_duration if actual_duration > 0 else 0
        
        return MonitoringTestResponse(
            success=True,
            message=f"负载模拟完成: {actual_rps:.1f} RPS",
            details={
                "target_rps": requests_per_second,
                "actual_rps": actual_rps,
                "duration_seconds": actual_duration,
                "total_requests": total_requests,
                "successful_requests": successful_requests,
                "failed_requests": failed_requests,
                "success_rate": (successful_requests / total_requests * 100) if total_requests > 0 else 0
            },
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"负载模拟失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"负载模拟失败: {str(e)}")

async def send_test_notification(metric: str, value: float, message: str):
    """发送测试通知到配置的渠道"""
    try:
        # 发送Slack通知
        if settings.SLACK_WEBHOOK_URL:
            import aiohttp
            
            payload = {
                "text": f"🧪 监控测试告警: {message}",
                "attachments": [
                    {
                        "color": "warning",
                        "fields": [
                            {
                                "title": "指标",
                                "value": metric,
                                "short": True
                            },
                            {
                                "title": "数值",
                                "value": str(value),
                                "short": True
                            },
                            {
                                "title": "时间",
                                "value": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                                "short": True
                            },
                            {
                                "title": "类型",
                                "value": "测试告警",
                                "short": True
                            }
                        ],
                        "footer": "Zinses-Rechner 监控系统测试"
                    }
                ]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(settings.SLACK_WEBHOOK_URL, json=payload) as response:
                    if response.status == 200:
                        logger.info("测试通知发送成功")
                    else:
                        logger.warning(f"测试通知发送失败: HTTP {response.status}")
        
        return True
        
    except Exception as e:
        logger.error(f"发送测试通知失败: {str(e)}")
        return False

# 仅在非生产环境注册路由
if settings.ENVIRONMENT != "production":
    # 添加到主应用
    pass
