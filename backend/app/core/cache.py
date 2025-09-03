"""
缓存中间件和策略
实现高效的API响应缓存，优化计算性能
"""

import hashlib
import json
import time
from typing import Dict, Any, Optional, Union
from datetime import datetime, timedelta
from fastapi import Request, Response
from fastapi.responses import JSONResponse
import logging

# 可选的Redis导入
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None

logger = logging.getLogger(__name__)


class CacheConfig:
    """缓存配置类"""
    
    # 缓存时间配置（秒）
    CALCULATION_CACHE_TTL = 300  # 5分钟 - 计算结果缓存
    LIMITS_CACHE_TTL = 3600     # 1小时 - API限制缓存
    HEALTH_CACHE_TTL = 60       # 1分钟 - 健康检查缓存
    
    # 缓存键前缀
    CACHE_PREFIX = "zinses_rechner"
    CALCULATION_PREFIX = f"{CACHE_PREFIX}:calc"
    LIMITS_PREFIX = f"{CACHE_PREFIX}:limits"
    HEALTH_PREFIX = f"{CACHE_PREFIX}:health"
    
    # 缓存配置
    MAX_CACHE_SIZE = 1000  # 最大缓存条目数
    CACHE_ENABLED = True   # 缓存开关


class MemoryCache:
    """内存缓存实现（用于开发环境）"""
    
    def __init__(self, max_size: int = 1000):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._max_size = max_size
        self._access_times: Dict[str, float] = {}
    
    def _cleanup_if_needed(self):
        """LRU清理策略"""
        if len(self._cache) >= self._max_size:
            # 删除最久未访问的条目
            oldest_key = min(self._access_times.keys(), key=lambda k: self._access_times[k])
            del self._cache[oldest_key]
            del self._access_times[oldest_key]
    
    def get(self, key: str) -> Optional[Any]:
        """获取缓存值"""
        if key not in self._cache:
            return None
        
        cache_entry = self._cache[key]
        
        # 检查是否过期
        if time.time() > cache_entry['expires_at']:
            del self._cache[key]
            del self._access_times[key]
            return None
        
        # 更新访问时间
        self._access_times[key] = time.time()
        return cache_entry['value']
    
    def set(self, key: str, value: Any, ttl: int = 300):
        """设置缓存值"""
        self._cleanup_if_needed()
        
        expires_at = time.time() + ttl
        self._cache[key] = {
            'value': value,
            'expires_at': expires_at,
            'created_at': time.time()
        }
        self._access_times[key] = time.time()
    
    def delete(self, key: str):
        """删除缓存值"""
        if key in self._cache:
            del self._cache[key]
            del self._access_times[key]
    
    def clear(self):
        """清空缓存"""
        self._cache.clear()
        self._access_times.clear()
    
    def stats(self) -> Dict[str, Any]:
        """获取缓存统计信息"""
        return {
            'total_keys': len(self._cache),
            'max_size': self._max_size,
            'hit_rate': 0,  # 简化实现，实际应该跟踪命中率
            'memory_usage': len(str(self._cache))
        }


class RedisCache:
    """Redis缓存实现（用于生产环境）"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        if not REDIS_AVAILABLE:
            logger.warning("Redis不可用，使用内存缓存")
            self.available = False
            self.fallback_cache = MemoryCache()
            return

        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            self.redis_client.ping()  # 测试连接
            self.available = True
            logger.info("Redis缓存连接成功")
        except Exception as e:
            logger.warning(f"Redis连接失败，使用内存缓存: {e}")
            self.available = False
            self.fallback_cache = MemoryCache()
    
    def get(self, key: str) -> Optional[Any]:
        """获取缓存值"""
        if not self.available:
            return self.fallback_cache.get(key)
        
        try:
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Redis获取失败: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: int = 300):
        """设置缓存值"""
        if not self.available:
            return self.fallback_cache.set(key, value, ttl)
        
        try:
            serialized_value = json.dumps(value, default=str)
            self.redis_client.setex(key, ttl, serialized_value)
        except Exception as e:
            logger.error(f"Redis设置失败: {e}")
    
    def delete(self, key: str):
        """删除缓存值"""
        if not self.available:
            return self.fallback_cache.delete(key)
        
        try:
            self.redis_client.delete(key)
        except Exception as e:
            logger.error(f"Redis删除失败: {e}")
    
    def clear(self):
        """清空缓存"""
        if not self.available:
            return self.fallback_cache.clear()
        
        try:
            self.redis_client.flushdb()
        except Exception as e:
            logger.error(f"Redis清空失败: {e}")
    
    def stats(self) -> Dict[str, Any]:
        """获取缓存统计信息"""
        if not self.available:
            return self.fallback_cache.stats()
        
        try:
            info = self.redis_client.info()
            return {
                'total_keys': info.get('db0', {}).get('keys', 0),
                'memory_usage': info.get('used_memory', 0),
                'hit_rate': info.get('keyspace_hits', 0) / max(info.get('keyspace_hits', 0) + info.get('keyspace_misses', 0), 1),
                'connected_clients': info.get('connected_clients', 0)
            }
        except Exception as e:
            logger.error(f"Redis统计获取失败: {e}")
            return {}


class CacheManager:
    """缓存管理器"""
    
    def __init__(self, redis_url: Optional[str] = None):
        if redis_url:
            self.cache = RedisCache(redis_url)
        else:
            self.cache = MemoryCache(CacheConfig.MAX_CACHE_SIZE)
        
        self.config = CacheConfig()
        self._hit_count = 0
        self._miss_count = 0
    
    def generate_cache_key(self, prefix: str, data: Dict[str, Any]) -> str:
        """生成缓存键"""
        # 创建数据的哈希值
        data_str = json.dumps(data, sort_keys=True, default=str)
        data_hash = hashlib.md5(data_str.encode()).hexdigest()
        return f"{prefix}:{data_hash}"
    
    def get_calculation_cache(self, request_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """获取计算结果缓存"""
        if not self.config.CACHE_ENABLED:
            return None
        
        cache_key = self.generate_cache_key(self.config.CALCULATION_PREFIX, request_data)
        result = self.cache.get(cache_key)
        
        if result:
            self._hit_count += 1
            logger.info(f"缓存命中: {cache_key}")
        else:
            self._miss_count += 1
            logger.info(f"缓存未命中: {cache_key}")
        
        return result
    
    def set_calculation_cache(self, request_data: Dict[str, Any], result: Dict[str, Any]):
        """设置计算结果缓存"""
        if not self.config.CACHE_ENABLED:
            return
        
        cache_key = self.generate_cache_key(self.config.CALCULATION_PREFIX, request_data)
        
        # 添加缓存元数据
        cached_result = {
            **result,
            'cached_at': datetime.now().isoformat(),
            'cache_key': cache_key
        }
        
        self.cache.set(cache_key, cached_result, self.config.CALCULATION_CACHE_TTL)
        logger.info(f"缓存设置: {cache_key}")
    
    def get_limits_cache(self) -> Optional[Dict[str, Any]]:
        """获取API限制缓存"""
        return self.cache.get(f"{self.config.LIMITS_PREFIX}:current")
    
    def set_limits_cache(self, limits: Dict[str, Any]):
        """设置API限制缓存"""
        self.cache.set(
            f"{self.config.LIMITS_PREFIX}:current", 
            limits, 
            self.config.LIMITS_CACHE_TTL
        )
    
    def get_health_cache(self) -> Optional[Dict[str, Any]]:
        """获取健康检查缓存"""
        return self.cache.get(f"{self.config.HEALTH_PREFIX}:status")
    
    def set_health_cache(self, health_data: Dict[str, Any]):
        """设置健康检查缓存"""
        self.cache.set(
            f"{self.config.HEALTH_PREFIX}:status",
            health_data,
            self.config.HEALTH_CACHE_TTL
        )
    
    def invalidate_pattern(self, pattern: str):
        """按模式失效缓存"""
        # 简化实现，实际应该支持模式匹配
        logger.info(f"缓存失效模式: {pattern}")
    
    def get_stats(self) -> Dict[str, Any]:
        """获取缓存统计信息"""
        cache_stats = self.cache.stats()
        total_requests = self._hit_count + self._miss_count
        hit_rate = self._hit_count / max(total_requests, 1) * 100
        
        return {
            **cache_stats,
            'hit_count': self._hit_count,
            'miss_count': self._miss_count,
            'hit_rate_percent': round(hit_rate, 2),
            'total_requests': total_requests,
            'cache_enabled': self.config.CACHE_ENABLED
        }


# 全局缓存管理器实例
cache_manager = CacheManager()


def get_cache_manager() -> CacheManager:
    """获取缓存管理器实例"""
    return cache_manager


async def cache_response_middleware(request: Request, call_next):
    """缓存响应中间件"""
    # 只对特定路径启用缓存
    if not request.url.path.startswith('/api/v1/calculator/'):
        response = await call_next(request)
        return response
    
    # 检查是否为可缓存的请求
    if request.method != 'POST' or 'compound-interest' not in request.url.path:
        response = await call_next(request)
        return response
    
    try:
        # 获取请求体
        body = await request.body()
        request_data = json.loads(body) if body else {}
        
        # 尝试从缓存获取
        cached_result = cache_manager.get_calculation_cache(request_data)
        if cached_result:
            # 添加缓存头
            headers = {
                'X-Cache': 'HIT',
                'X-Cache-Key': cached_result.get('cache_key', ''),
                'Cache-Control': f'public, max-age={CacheConfig.CALCULATION_CACHE_TTL}'
            }
            return JSONResponse(content=cached_result, headers=headers)
        
        # 缓存未命中，执行请求
        response = await call_next(request)
        
        # 如果响应成功，缓存结果
        if response.status_code == 200:
            response_body = b""
            async for chunk in response.body_iterator:
                response_body += chunk
            
            result = json.loads(response_body.decode())
            cache_manager.set_calculation_cache(request_data, result)
            
            # 重新创建响应
            headers = dict(response.headers)
            headers.update({
                'X-Cache': 'MISS',
                'Cache-Control': f'public, max-age={CacheConfig.CALCULATION_CACHE_TTL}'
            })
            
            return JSONResponse(content=result, headers=headers, status_code=response.status_code)
        
        return response
        
    except Exception as e:
        logger.error(f"缓存中间件错误: {e}")
        # 出错时直接执行原始请求
        response = await call_next(request)
        return response
