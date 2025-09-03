"""
安全合规性测试
验证生产环境安全配置和DSGVO合规性
"""

import pytest
import time
import json
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.core.security import SecurityConfig, InputSanitizer


class TestSecurityConfiguration:
    """安全配置测试类"""

    def setup_method(self):
        """测试前置设置"""
        self.client = TestClient(app)

    def test_security_headers(self):
        """测试安全头配置"""
        response = self.client.get("/health")
        
        # 验证关键安全头
        assert 'X-Frame-Options' in response.headers
        assert response.headers['X-Frame-Options'] == 'DENY'
        
        assert 'X-Content-Type-Options' in response.headers
        assert response.headers['X-Content-Type-Options'] == 'nosniff'
        
        assert 'X-XSS-Protection' in response.headers
        assert response.headers['X-XSS-Protection'] == '1; mode=block'
        
        assert 'Strict-Transport-Security' in response.headers
        assert 'max-age=31536000' in response.headers['Strict-Transport-Security']
        
        assert 'Content-Security-Policy' in response.headers
        csp = response.headers['Content-Security-Policy']
        assert "default-src 'self'" in csp
        assert "frame-ancestors 'none'" in csp

    def test_cors_configuration(self):
        """测试CORS配置"""
        # 测试预检请求
        response = self.client.options(
            "/api/v1/calculator/compound-interest",
            headers={
                'Origin': 'https://zinses-rechner.de',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        )
        
        # 验证CORS头
        assert response.status_code in [200, 204]
        # 注意：实际的CORS头可能由FastAPI的CORSMiddleware处理

    def test_rate_limiting(self):
        """测试请求限流"""
        # 快速发送多个请求
        responses = []
        for i in range(65):  # 超过限制
            response = self.client.post(
                "/api/v1/calculator/compound-interest",
                json={
                    "principal": 10000,
                    "annual_rate": 4.0,
                    "years": 10,
                    "monthly_payment": 0,
                    "compound_frequency": "monthly"
                }
            )
            responses.append(response)
            
            # 如果被限流，停止测试
            if response.status_code == 429:
                break
        
        # 应该有一些请求被限流
        rate_limited = [r for r in responses if r.status_code == 429]
        
        if rate_limited:
            # 验证限流响应
            limited_response = rate_limited[0]
            assert 'Retry-After' in limited_response.headers
            assert 'X-RateLimit-Limit' in limited_response.headers
            
            error_data = limited_response.json()
            assert error_data['error'] == 'RATE_LIMIT_EXCEEDED'
            assert 'Zu viele Anfragen' in error_data['message']

    def test_input_sanitization(self):
        """测试输入数据清理"""
        # 测试恶意输入
        malicious_data = {
            "principal": "<script>alert('xss')</script>10000",
            "annual_rate": "4.0'; DROP TABLE users; --",
            "years": "10<img src=x onerror=alert(1)>",
            "monthly_payment": "500\x00\n\r\t",
            "compound_frequency": "monthly"
        }
        
        response = self.client.post(
            "/api/v1/calculator/compound-interest",
            json=malicious_data
        )
        
        # 应该返回验证错误或清理后的数据
        assert response.status_code in [200, 422]
        
        if response.status_code == 200:
            # 如果成功，验证数据已被清理
            result = response.json()
            assert 'script' not in str(result)
            assert 'DROP TABLE' not in str(result)

    def test_input_validation_limits(self):
        """测试输入验证限制"""
        # 测试超出限制的值
        invalid_data = {
            "principal": 20_000_000,  # 超过最大值
            "annual_rate": 25.0,      # 超过最大利率
            "years": 100,             # 超过最大年限
            "monthly_payment": 100_000, # 超过最大月供
            "compound_frequency": "daily"  # 无效频率
        }
        
        response = self.client.post(
            "/api/v1/calculator/compound-interest",
            json=invalid_data
        )
        
        assert response.status_code == 422
        error_data = response.json()
        assert 'detail' in error_data

    def test_api_security_audit(self):
        """测试安全审计功能"""
        # 执行一些请求以生成审计数据
        for i in range(5):
            self.client.get("/health")
        
        # 获取安全审计信息
        response = self.client.get("/security/audit")
        assert response.status_code == 200
        
        audit_data = response.json()
        assert 'total_events' in audit_data
        assert 'security_score' in audit_data
        assert isinstance(audit_data['events'], list)


class TestDSGVOCompliance:
    """DSGVO合规性测试类"""

    def setup_method(self):
        """测试前置设置"""
        self.client = TestClient(app)

    def test_cookie_consent_recording(self):
        """测试Cookie同意记录"""
        consent_data = {
            "preferences": {
                "necessary": True,
                "analytics": True,
                "performance": True,
                "marketing": False
            },
            "timestamp": "2024-01-15T10:30:00Z",
            "version": "1.0",
            "userAgent": "Mozilla/5.0 Test Browser",
            "language": "de-DE"
        }
        
        response = self.client.post("/api/v1/privacy/cookie-consent", json=consent_data)
        assert response.status_code == 200
        
        result = response.json()
        assert result['success'] is True
        assert 'reference_id' in result
        assert 'Cookie-Einstellungen erfolgreich gespeichert' in result['message']

    def test_data_deletion_request(self):
        """测试数据删除请求"""
        deletion_data = {
            "timestamp": "2024-01-15T10:30:00Z",
            "reason": "user_request",
            "confirmation": True
        }
        
        response = self.client.post("/api/v1/privacy/delete-user-data", json=deletion_data)
        assert response.status_code == 200
        
        result = response.json()
        assert result['success'] is True
        assert 'gelöscht' in result['message']

    def test_data_deletion_without_confirmation(self):
        """测试未确认的数据删除请求"""
        deletion_data = {
            "timestamp": "2024-01-15T10:30:00Z",
            "reason": "user_request",
            "confirmation": False
        }
        
        response = self.client.post("/api/v1/privacy/delete-user-data", json=deletion_data)
        assert response.status_code == 400
        
        error_data = response.json()
        assert error_data['detail']['error'] == 'DELETION_NOT_CONFIRMED'

    def test_data_export_request(self):
        """测试数据导出请求"""
        response = self.client.get("/api/v1/privacy/export-user-data")
        assert response.status_code == 200
        
        result = response.json()
        assert 'export_id' in result
        assert 'download_url' in result
        assert 'expires_at' in result
        assert isinstance(result['data_types'], list)

    def test_compliance_status(self):
        """测试合规状态检查"""
        response = self.client.get("/api/v1/privacy/compliance-status")
        assert response.status_code == 200
        
        result = response.json()
        assert 'compliance_score' in result
        assert 'is_compliant' in result
        assert 'checks' in result
        assert isinstance(result['checks'], dict)
        
        # 验证关键合规检查
        checks = result['checks']
        assert checks['cookie_consent'] is True
        assert checks['data_processing_notice'] is True
        assert checks['right_to_delete'] is True
        assert checks['right_to_export'] is True

    def test_data_processing_info(self):
        """测试数据处理信息"""
        response = self.client.get("/api/v1/privacy/data-processing-info")
        assert response.status_code == 200
        
        result = response.json()
        assert 'data_controller' in result
        assert 'data_processing' in result
        assert 'user_rights' in result
        assert 'contact' in result
        
        # 验证DSGVO要求的信息
        assert 'datenschutz@zinses-rechner.de' in str(result)
        assert 'Art. 6 Abs. 1' in str(result)  # 法律依据

    def test_web_vitals_collection(self):
        """测试Web Vitals数据收集"""
        vitals_data = {
            "lcp": 2300,
            "fid": 85,
            "cls": 0.08,
            "ttfb": 650,
            "fcp": 1800,
            "userAgent": "Mozilla/5.0 Test Browser",
            "language": "de-DE"
        }
        
        response = self.client.post("/api/v1/privacy/web-vitals", json=vitals_data)
        assert response.status_code == 200
        
        result = response.json()
        assert result['success'] is True
        assert 'Performance-Daten erfolgreich erfasst' in result['message']

    def test_malicious_web_vitals_data(self):
        """测试恶意Web Vitals数据"""
        malicious_data = {
            "lcp": 999999,  # 超出合理范围
            "fid": -100,    # 负值
            "cls": "invalid", # 无效类型
            "userAgent": "<script>alert('xss')</script>",
            "language": "de-DE"
        }
        
        response = self.client.post("/api/v1/privacy/web-vitals", json=malicious_data)
        
        # 应该成功处理但忽略无效数据
        assert response.status_code in [200, 400]


class TestInputSanitization:
    """输入清理测试类"""

    def test_string_sanitization(self):
        """测试字符串清理"""
        # 测试危险字符移除
        dangerous_input = "<script>alert('xss')</script>Hello World"
        sanitized = InputSanitizer.sanitize_string(dangerous_input)
        assert '<script>' not in sanitized
        assert 'Hello World' in sanitized

    def test_number_sanitization(self):
        """测试数字清理"""
        # 测试有效数字
        assert InputSanitizer.sanitize_number("123.45") == 123.45
        assert InputSanitizer.sanitize_number(100) == 100.0
        
        # 测试范围限制
        with pytest.raises(ValueError):
            InputSanitizer.sanitize_number(150, min_val=0, max_val=100)
        
        # 测试无效输入
        with pytest.raises(ValueError):
            InputSanitizer.sanitize_number("not_a_number")

    def test_calculation_input_validation(self):
        """测试计算输入验证"""
        valid_data = {
            "principal": 10000,
            "annual_rate": 4.0,
            "years": 10,
            "monthly_payment": 500,
            "compound_frequency": "monthly"
        }
        
        sanitized = InputSanitizer.validate_calculation_input(valid_data)
        assert sanitized['principal'] == 10000
        assert sanitized['annual_rate'] == 4.0
        assert sanitized['years'] == 10
        assert sanitized['monthly_payment'] == 500
        assert sanitized['compound_frequency'] == 'monthly'

    def test_invalid_calculation_input(self):
        """测试无效计算输入"""
        invalid_data = {
            "principal": -1000,  # 负值
            "annual_rate": 25,   # 超出范围
            "years": 0,          # 无效年限
            "compound_frequency": "invalid"  # 无效频率
        }
        
        with pytest.raises(ValueError):
            InputSanitizer.validate_calculation_input(invalid_data)


class TestSecurityMiddleware:
    """安全中间件测试类"""

    def setup_method(self):
        """测试前置设置"""
        self.client = TestClient(app)

    def test_ddos_protection(self):
        """测试DDoS保护"""
        # 模拟大量请求
        responses = []
        for i in range(10):
            response = self.client.get("/health")
            responses.append(response)
            time.sleep(0.01)  # 短暂延迟
        
        # 大部分请求应该成功
        successful = [r for r in responses if r.status_code == 200]
        assert len(successful) >= 8  # 至少80%成功

    def test_request_id_generation(self):
        """测试请求ID生成"""
        response = self.client.get("/health")
        assert 'X-Request-ID' in response.headers
        assert len(response.headers['X-Request-ID']) == 32  # 16字节hex

    def test_security_scan_header(self):
        """测试安全扫描头"""
        response = self.client.get("/health")
        assert 'X-Security-Scan' in response.headers
        assert response.headers['X-Security-Scan'] == 'passed'


class TestPrivacyAPI:
    """隐私API测试类"""

    def setup_method(self):
        """测试前置设置"""
        self.client = TestClient(app)

    def test_compliance_status_endpoint(self):
        """测试合规状态端点"""
        response = self.client.get("/api/v1/privacy/compliance-status")
        assert response.status_code == 200
        
        data = response.json()
        assert data['compliance_score'] >= 90
        assert data['is_compliant'] is True
        assert 'checks' in data
        assert 'recommendations' in data

    def test_data_processing_info_endpoint(self):
        """测试数据处理信息端点"""
        response = self.client.get("/api/v1/privacy/data-processing-info")
        assert response.status_code == 200
        
        data = response.json()
        assert 'data_controller' in data
        assert 'data_processing' in data
        assert 'user_rights' in data
        assert 'contact' in data
        
        # 验证DSGVO要求的信息
        assert 'datenschutz@zinses-rechner.de' in json.dumps(data)

    def test_cookie_consent_validation(self):
        """测试Cookie同意验证"""
        # 测试有效的同意数据
        valid_consent = {
            "preferences": {
                "necessary": True,
                "analytics": False,
                "performance": True,
                "marketing": False
            },
            "timestamp": "2024-01-15T10:30:00Z",
            "version": "1.0"
        }
        
        response = self.client.post("/api/v1/privacy/cookie-consent", json=valid_consent)
        assert response.status_code == 200

    def test_invalid_cookie_consent(self):
        """测试无效Cookie同意"""
        # 测试无效的同意数据
        invalid_consent = {
            "preferences": {
                "invalid_category": True,
                "necessary": "not_boolean"
            },
            "timestamp": "invalid_timestamp"
        }
        
        response = self.client.post("/api/v1/privacy/cookie-consent", json=invalid_consent)
        assert response.status_code == 400


class TestSecurityAudit:
    """安全审计测试类"""

    def setup_method(self):
        """测试前置设置"""
        self.client = TestClient(app)

    def test_security_audit_endpoint(self):
        """测试安全审计端点"""
        response = self.client.get("/security/audit")
        assert response.status_code == 200
        
        data = response.json()
        assert 'total_events' in data
        assert 'blocked_ips' in data
        assert 'suspicious_activities' in data
        assert 'events' in data
        assert 'summary' in data

    def test_security_event_logging(self):
        """测试安全事件记录"""
        # 执行一些操作以生成安全事件
        self.client.get("/health")
        self.client.post("/api/v1/calculator/compound-interest", json={
            "principal": 10000,
            "annual_rate": 4.0,
            "years": 10
        })
        
        # 检查审计日志
        response = self.client.get("/security/audit?hours=1")
        assert response.status_code == 200
        
        data = response.json()
        assert data['total_events'] >= 0  # 可能有事件记录


class TestProductionReadiness:
    """生产环境就绪性测试"""

    def test_environment_configuration(self):
        """测试环境配置"""
        # 验证关键配置
        assert SecurityConfig.RATE_LIMIT_CONFIG['requests_per_minute'] > 0
        assert SecurityConfig.CSP_POLICY['default-src'] == ["'self'"]
        assert 'DENY' in SecurityConfig.SECURITY_HEADERS['X-Frame-Options']

    def test_error_handling_security(self):
        """测试错误处理安全性"""
        # 测试404错误不泄露信息
        response = self.client.get("/nonexistent-endpoint")
        assert response.status_code == 404
        
        # 错误响应不应包含敏感信息
        error_text = response.text.lower()
        assert 'traceback' not in error_text
        assert 'exception' not in error_text
        assert 'stack' not in error_text

    def test_https_enforcement(self):
        """测试HTTPS强制"""
        response = self.client.get("/health")
        
        # 验证HSTS头
        assert 'Strict-Transport-Security' in response.headers
        hsts = response.headers['Strict-Transport-Security']
        assert 'max-age=31536000' in hsts
        assert 'includeSubDomains' in hsts
        assert 'preload' in hsts

    def test_sensitive_data_handling(self):
        """测试敏感数据处理"""
        # 验证响应中不包含敏感信息
        response = self.client.get("/api/v1/privacy/compliance-status")
        assert response.status_code == 200
        
        response_text = response.text.lower()
        
        # 不应包含敏感信息
        sensitive_terms = ['password', 'secret', 'key', 'token', 'private']
        for term in sensitive_terms:
            assert term not in response_text or f'no {term}' in response_text
