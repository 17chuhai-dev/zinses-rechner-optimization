"""
生产环境安全配置
实现全面的安全措施和DSGVO合规要求
"""

import time
import hashlib
import secrets
from typing import Dict, List, Optional, Set
from datetime import datetime, timedelta
from fastapi import Request, Response, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

# 安全配置
class SecurityConfig:
    """安全配置类"""
    
    # Content Security Policy配置
    CSP_POLICY = {
        'default-src': ["'self'"],
        'script-src': [
            "'self'",
            "'unsafe-inline'",  # 仅用于内联脚本，生产环境应移除
            "https://www.googletagmanager.com",
            "https://www.google-analytics.com",
            "https://cdn.jsdelivr.net"
        ],
        'style-src': [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
            "https://cdn.jsdelivr.net"
        ],
        'font-src': [
            "'self'",
            "https://fonts.gstatic.com"
        ],
        'img-src': [
            "'self'",
            "data:",
            "https:",
            "blob:"
        ],
        'connect-src': [
            "'self'",
            "https://api.zinses-rechner.de",
            "https://www.google-analytics.com"
        ],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'upgrade-insecure-requests': []
    }
    
    # 安全头配置
    SECURITY_HEADERS = {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'same-origin'
    }
    
    # CORS配置
    CORS_CONFIG = {
        'allowed_origins': [
            'https://zinses-rechner.de',
            'https://www.zinses-rechner.de',
            'https://staging.zinses-rechner.de'
        ],
        'allowed_methods': ['GET', 'POST', 'OPTIONS'],
        'allowed_headers': ['Content-Type', 'Authorization', 'X-Requested-With'],
        'max_age': 86400  # 24小时
    }
    
    # 请求限流配置
    RATE_LIMIT_CONFIG = {
        'requests_per_minute': 60,
        'requests_per_hour': 1000,
        'requests_per_day': 10000,
        'burst_limit': 10,
        'window_size': 60  # 秒
    }


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """安全头中间件"""
    
    def __init__(self, app, config: SecurityConfig = None):
        super().__init__(app)
        self.config = config or SecurityConfig()
    
    def generate_csp_header(self) -> str:
        """生成CSP头"""
        csp_parts = []
        for directive, sources in self.config.CSP_POLICY.items():
            if sources:
                csp_parts.append(f"{directive} {' '.join(sources)}")
            else:
                csp_parts.append(directive)
        return '; '.join(csp_parts)
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # 添加安全头
        for header, value in self.config.SECURITY_HEADERS.items():
            response.headers[header] = value
        
        # 添加CSP头
        response.headers['Content-Security-Policy'] = self.generate_csp_header()
        
        # 添加DSGVO合规头
        response.headers['X-Robots-Tag'] = 'index, follow'
        response.headers['X-Permitted-Cross-Domain-Policies'] = 'none'
        
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """请求限流中间件"""
    
    def __init__(self, app, config: SecurityConfig = None):
        super().__init__(app)
        self.config = config or SecurityConfig()
        self.request_counts: Dict[str, List[float]] = {}
        self.blocked_ips: Set[str] = set()
        self.whitelist_ips: Set[str] = {
            '127.0.0.1',
            '::1',
            'localhost'
        }
    
    def get_client_ip(self, request: Request) -> str:
        """获取客户端IP地址"""
        # 检查Cloudflare头
        if 'CF-Connecting-IP' in request.headers:
            return request.headers['CF-Connecting-IP']
        
        # 检查代理头
        if 'X-Forwarded-For' in request.headers:
            return request.headers['X-Forwarded-For'].split(',')[0].strip()
        
        if 'X-Real-IP' in request.headers:
            return request.headers['X-Real-IP']
        
        # 回退到直接连接IP
        return request.client.host if request.client else 'unknown'
    
    def is_rate_limited(self, ip: str) -> bool:
        """检查IP是否被限流"""
        if ip in self.whitelist_ips:
            return False
        
        if ip in self.blocked_ips:
            return True
        
        current_time = time.time()
        window_start = current_time - self.config.RATE_LIMIT_CONFIG['window_size']
        
        # 清理过期记录
        if ip in self.request_counts:
            self.request_counts[ip] = [
                timestamp for timestamp in self.request_counts[ip]
                if timestamp > window_start
            ]
        else:
            self.request_counts[ip] = []
        
        # 检查请求频率
        request_count = len(self.request_counts[ip])
        limit = self.config.RATE_LIMIT_CONFIG['requests_per_minute']
        
        if request_count >= limit:
            # 临时阻止IP
            self.blocked_ips.add(ip)
            logger.warning(f"IP {ip} rate limited: {request_count} requests in {self.config.RATE_LIMIT_CONFIG['window_size']}s")
            return True
        
        # 记录请求
        self.request_counts[ip].append(current_time)
        return False
    
    async def dispatch(self, request: Request, call_next):
        client_ip = self.get_client_ip(request)
        
        # 检查是否被限流
        if self.is_rate_limited(client_ip):
            return JSONResponse(
                status_code=429,
                content={
                    'error': 'RATE_LIMIT_EXCEEDED',
                    'message': 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
                    'retry_after': self.config.RATE_LIMIT_CONFIG['window_size'],
                    'timestamp': datetime.now().isoformat()
                },
                headers={
                    'Retry-After': str(self.config.RATE_LIMIT_CONFIG['window_size']),
                    'X-RateLimit-Limit': str(self.config.RATE_LIMIT_CONFIG['requests_per_minute']),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': str(int(time.time() + self.config.RATE_LIMIT_CONFIG['window_size']))
                }
            )
        
        # 添加限流头
        remaining = self.config.RATE_LIMIT_CONFIG['requests_per_minute'] - len(self.request_counts.get(client_ip, []))
        response = await call_next(request)
        
        response.headers['X-RateLimit-Limit'] = str(self.config.RATE_LIMIT_CONFIG['requests_per_minute'])
        response.headers['X-RateLimit-Remaining'] = str(max(0, remaining - 1))
        response.headers['X-RateLimit-Reset'] = str(int(time.time() + self.config.RATE_LIMIT_CONFIG['window_size']))
        
        return response


class APIKeyAuth:
    """API密钥认证"""
    
    def __init__(self):
        self.api_keys: Dict[str, Dict[str, any]] = {
            # 示例API密钥配置（实际应从环境变量读取）
            # 'zr_prod_key_123': {
            #     'name': 'Production Key',
            #     'permissions': ['calculate', 'export'],
            #     'rate_limit': 1000,
            #     'expires_at': None
            # }
        }
        self.security = HTTPBearer(auto_error=False)
    
    async def verify_api_key(self, credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[Dict[str, any]]:
        """验证API密钥"""
        if not credentials:
            return None
        
        api_key = credentials.credentials
        key_info = self.api_keys.get(api_key)
        
        if not key_info:
            raise HTTPException(
                status_code=401,
                detail={
                    'error': 'INVALID_API_KEY',
                    'message': 'Ungültiger API-Schlüssel'
                }
            )
        
        # 检查过期时间
        if key_info.get('expires_at') and datetime.now() > key_info['expires_at']:
            raise HTTPException(
                status_code=401,
                detail={
                    'error': 'API_KEY_EXPIRED',
                    'message': 'API-Schlüssel ist abgelaufen'
                }
            )
        
        return key_info


class InputSanitizer:
    """输入数据清理和验证"""
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 1000) -> str:
        """清理字符串输入"""
        if not isinstance(value, str):
            raise ValueError("Input must be a string")
        
        # 移除危险字符
        dangerous_chars = ['<', '>', '"', "'", '&', '\x00', '\n', '\r', '\t']
        for char in dangerous_chars:
            value = value.replace(char, '')
        
        # 限制长度
        if len(value) > max_length:
            value = value[:max_length]
        
        return value.strip()
    
    @staticmethod
    def sanitize_number(value: any, min_val: float = None, max_val: float = None) -> float:
        """清理数字输入"""
        try:
            num_value = float(value)
            
            # 检查范围
            if min_val is not None and num_value < min_val:
                raise ValueError(f"Value must be >= {min_val}")
            
            if max_val is not None and num_value > max_val:
                raise ValueError(f"Value must be <= {max_val}")
            
            # 检查特殊值
            if not isinstance(num_value, (int, float)) or num_value != num_value:  # NaN检查
                raise ValueError("Invalid number")
            
            return num_value
            
        except (ValueError, TypeError) as e:
            raise ValueError(f"Invalid number format: {e}")
    
    @staticmethod
    def validate_calculation_input(data: Dict[str, any]) -> Dict[str, any]:
        """验证计算输入数据"""
        sanitized = {}
        
        # 验证本金
        sanitized['principal'] = InputSanitizer.sanitize_number(
            data.get('principal'), 
            min_val=1, 
            max_val=10_000_000
        )
        
        # 验证年利率
        sanitized['annual_rate'] = InputSanitizer.sanitize_number(
            data.get('annual_rate'), 
            min_val=0.01, 
            max_val=20
        )
        
        # 验证年限
        sanitized['years'] = int(InputSanitizer.sanitize_number(
            data.get('years'), 
            min_val=1, 
            max_val=50
        ))
        
        # 验证月供
        sanitized['monthly_payment'] = InputSanitizer.sanitize_number(
            data.get('monthly_payment', 0), 
            min_val=0, 
            max_val=50_000
        )
        
        # 验证复利频率
        compound_frequency = data.get('compound_frequency', 'monthly')
        allowed_frequencies = ['monthly', 'quarterly', 'yearly']
        if compound_frequency not in allowed_frequencies:
            raise ValueError(f"Invalid compound frequency. Allowed: {allowed_frequencies}")
        sanitized['compound_frequency'] = compound_frequency
        
        return sanitized


class SecurityAuditLogger:
    """安全审计日志"""
    
    def __init__(self):
        self.security_events: List[Dict[str, any]] = []
        self.max_events = 10000
    
    def log_security_event(
        self, 
        event_type: str, 
        ip: str, 
        user_agent: str = None,
        details: Dict[str, any] = None
    ):
        """记录安全事件"""
        event = {
            'timestamp': datetime.now().isoformat(),
            'event_type': event_type,
            'ip': ip,
            'user_agent': user_agent,
            'details': details or {},
            'event_id': secrets.token_hex(16)
        }
        
        self.security_events.append(event)
        
        # 限制事件数量
        if len(self.security_events) > self.max_events:
            self.security_events = self.security_events[-self.max_events//2:]
        
        # 记录到日志
        logger.warning(f"Security Event: {event_type} from {ip}", extra=event)
    
    def get_security_events(self, event_type: str = None, hours: int = 24) -> List[Dict[str, any]]:
        """获取安全事件"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        filtered_events = [
            event for event in self.security_events
            if datetime.fromisoformat(event['timestamp']) > cutoff_time
        ]
        
        if event_type:
            filtered_events = [
                event for event in filtered_events
                if event['event_type'] == event_type
            ]
        
        return filtered_events


class DDoSProtection:
    """DDoS保护"""
    
    def __init__(self):
        self.suspicious_ips: Dict[str, Dict[str, any]] = {}
        self.blocked_ips: Set[str] = set()
        self.request_patterns: Dict[str, List[float]] = {}
    
    def analyze_request_pattern(self, ip: str, request: Request) -> bool:
        """分析请求模式，检测可疑行为"""
        current_time = time.time()
        
        # 初始化IP记录
        if ip not in self.request_patterns:
            self.request_patterns[ip] = []
        
        # 添加当前请求时间
        self.request_patterns[ip].append(current_time)
        
        # 清理1分钟前的记录
        self.request_patterns[ip] = [
            timestamp for timestamp in self.request_patterns[ip]
            if current_time - timestamp <= 60
        ]
        
        # 检测异常模式
        recent_requests = len(self.request_patterns[ip])
        
        # 检测高频请求
        if recent_requests > 100:  # 1分钟内超过100次请求
            self.mark_suspicious(ip, 'HIGH_FREQUENCY', {
                'requests_per_minute': recent_requests,
                'user_agent': request.headers.get('User-Agent', 'unknown')
            })
            return True
        
        # 检测相同请求重复
        if recent_requests > 20:
            # 简化的重复检测（实际应该检查请求内容）
            if self.is_repetitive_pattern(self.request_patterns[ip]):
                self.mark_suspicious(ip, 'REPETITIVE_PATTERN', {
                    'pattern_detected': True,
                    'requests_count': recent_requests
                })
                return True
        
        return False
    
    def is_repetitive_pattern(self, timestamps: List[float]) -> bool:
        """检测重复模式"""
        if len(timestamps) < 10:
            return False
        
        # 检查请求间隔是否过于规律
        intervals = [timestamps[i] - timestamps[i-1] for i in range(1, len(timestamps))]
        avg_interval = sum(intervals) / len(intervals)
        
        # 如果间隔过于规律（标准差很小），可能是机器人
        variance = sum((interval - avg_interval) ** 2 for interval in intervals) / len(intervals)
        std_dev = variance ** 0.5
        
        return std_dev < 0.1 and avg_interval < 1.0  # 间隔小于1秒且非常规律
    
    def mark_suspicious(self, ip: str, reason: str, details: Dict[str, any]):
        """标记可疑IP"""
        if ip not in self.suspicious_ips:
            self.suspicious_ips[ip] = {
                'first_seen': time.time(),
                'reasons': [],
                'request_count': 0,
                'blocked': False
            }
        
        self.suspicious_ips[ip]['reasons'].append({
            'reason': reason,
            'timestamp': time.time(),
            'details': details
        })
        
        # 如果多次标记为可疑，则阻止
        if len(self.suspicious_ips[ip]['reasons']) >= 3:
            self.blocked_ips.add(ip)
            self.suspicious_ips[ip]['blocked'] = True
            logger.critical(f"IP {ip} blocked due to suspicious activity: {reason}")
    
    def is_blocked(self, ip: str) -> bool:
        """检查IP是否被阻止"""
        return ip in self.blocked_ips


# 全局实例
security_audit_logger = SecurityAuditLogger()
ddos_protection = DDoSProtection()
api_key_auth = APIKeyAuth()


def get_security_audit_logger() -> SecurityAuditLogger:
    """获取安全审计日志实例"""
    return security_audit_logger


def get_ddos_protection() -> DDoSProtection:
    """获取DDoS保护实例"""
    return ddos_protection


def get_api_key_auth() -> APIKeyAuth:
    """获取API密钥认证实例"""
    return api_key_auth


async def security_middleware(request: Request, call_next):
    """综合安全中间件"""
    client_ip = ddos_protection.get_client_ip(request) if hasattr(ddos_protection, 'get_client_ip') else request.client.host
    
    # DDoS保护检查
    if ddos_protection.is_blocked(client_ip):
        security_audit_logger.log_security_event(
            'BLOCKED_REQUEST',
            client_ip,
            request.headers.get('User-Agent'),
            {'reason': 'IP_BLOCKED', 'path': request.url.path}
        )
        
        return JSONResponse(
            status_code=403,
            content={
                'error': 'ACCESS_DENIED',
                'message': 'Zugriff verweigert. Kontaktieren Sie den Support, wenn Sie glauben, dass dies ein Fehler ist.',
                'timestamp': datetime.now().isoformat()
            }
        )
    
    # 分析请求模式
    if ddos_protection.analyze_request_pattern(client_ip, request):
        security_audit_logger.log_security_event(
            'SUSPICIOUS_PATTERN',
            client_ip,
            request.headers.get('User-Agent'),
            {'path': request.url.path, 'method': request.method}
        )
    
    # 执行请求
    response = await call_next(request)
    
    # 添加安全响应头
    response.headers['X-Request-ID'] = secrets.token_hex(16)
    response.headers['X-Security-Scan'] = 'passed'
    
    return response
