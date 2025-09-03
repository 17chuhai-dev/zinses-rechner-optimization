-- Zinses-Rechner数据库初始化脚本
-- Cloudflare D1数据库架构设计

-- 计算历史表
-- 存储用户的计算记录，用于分析和优化
CREATE TABLE IF NOT EXISTS calculation_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    principal REAL NOT NULL,
    monthly_payment REAL NOT NULL DEFAULT 0,
    annual_rate REAL NOT NULL,
    years INTEGER NOT NULL,
    compound_frequency TEXT NOT NULL DEFAULT 'monthly',
    final_amount REAL NOT NULL,
    total_contributions REAL NOT NULL,
    total_interest REAL NOT NULL,
    annual_return REAL NOT NULL,
    calculation_time_ms INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_agent_hash TEXT,
    client_ip_hash TEXT,
    referer_domain TEXT
);

-- 计算历史表索引
CREATE INDEX IF NOT EXISTS idx_calculation_history_session 
ON calculation_history(session_id);

CREATE INDEX IF NOT EXISTS idx_calculation_history_created 
ON calculation_history(created_at);

CREATE INDEX IF NOT EXISTS idx_calculation_history_principal 
ON calculation_history(principal);

-- 监控指标表
-- 存储系统性能和业务指标
CREATE TABLE IF NOT EXISTS monitoring_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    metric_unit TEXT,
    tags TEXT, -- JSON格式的标签
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    worker_region TEXT,
    environment TEXT NOT NULL DEFAULT 'production'
);

-- 监控指标表索引
CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_name 
ON monitoring_metrics(metric_name);

CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_timestamp 
ON monitoring_metrics(timestamp);

CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_name_timestamp 
ON monitoring_metrics(metric_name, timestamp);

-- 告警历史表
-- 存储告警触发和解决记录
CREATE TABLE IF NOT EXISTS alert_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_name TEXT NOT NULL,
    alert_severity TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    current_value REAL NOT NULL,
    threshold_value REAL NOT NULL,
    alert_message TEXT NOT NULL,
    triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    resolution_message TEXT,
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_channels TEXT -- JSON数组
);

-- 告警历史表索引
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered 
ON alert_history(triggered_at);

CREATE INDEX IF NOT EXISTS idx_alert_history_severity 
ON alert_history(alert_severity);

CREATE INDEX IF NOT EXISTS idx_alert_history_resolved 
ON alert_history(resolved_at);

-- 缓存统计表
-- 存储缓存性能统计
CREATE TABLE IF NOT EXISTS cache_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date_key TEXT NOT NULL UNIQUE, -- YYYY-MM-DD格式
    hit_count INTEGER NOT NULL DEFAULT 0,
    miss_count INTEGER NOT NULL DEFAULT 0,
    total_requests INTEGER NOT NULL DEFAULT 0,
    hit_rate_percent REAL NOT NULL DEFAULT 0,
    average_response_time_ms REAL NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 缓存统计表索引
CREATE INDEX IF NOT EXISTS idx_cache_stats_date 
ON cache_stats(date_key);

-- 用户会话表
-- 存储用户会话信息（匿名化）
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL UNIQUE,
    session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_end DATETIME,
    total_calculations INTEGER NOT NULL DEFAULT 0,
    user_agent_hash TEXT,
    client_ip_hash TEXT,
    referer_domain TEXT,
    country_code TEXT,
    is_mobile BOOLEAN DEFAULT FALSE,
    session_duration_seconds INTEGER
);

-- 用户会话表索引
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id 
ON user_sessions(session_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_start 
ON user_sessions(session_start);

-- 系统配置表
-- 存储动态配置参数
CREATE TABLE IF NOT EXISTS system_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    config_type TEXT NOT NULL DEFAULT 'string', -- string, number, boolean, json
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 系统配置表索引
CREATE INDEX IF NOT EXISTS idx_system_config_key 
ON system_config(config_key);

-- 插入默认配置
INSERT OR IGNORE INTO system_config (config_key, config_value, config_type, description) VALUES
('max_calculation_years', '50', 'number', '最大计算年限'),
('max_principal_amount', '10000000', 'number', '最大本金金额'),
('default_tax_rate', '0.25', 'number', '默认税率'),
('cache_ttl_seconds', '300', 'number', '缓存过期时间'),
('rate_limit_requests', '100', 'number', '速率限制请求数'),
('rate_limit_window_seconds', '900', 'number', '速率限制时间窗口'),
('maintenance_mode', 'false', 'boolean', '维护模式开关'),
('feature_tax_calculation', 'true', 'boolean', '税务计算功能开关'),
('feature_export_pdf', 'true', 'boolean', 'PDF导出功能开关'),
('analytics_enabled', 'true', 'boolean', '分析统计开关');

-- 错误日志表
-- 存储应用错误和异常
CREATE TABLE IF NOT EXISTS error_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    request_url TEXT,
    request_method TEXT,
    request_headers TEXT, -- JSON格式
    request_body TEXT,
    user_agent_hash TEXT,
    client_ip_hash TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    environment TEXT NOT NULL DEFAULT 'production',
    worker_region TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT
);

-- 错误日志表索引
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp 
ON error_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_error_logs_type 
ON error_logs(error_type);

CREATE INDEX IF NOT EXISTS idx_error_logs_resolved 
ON error_logs(resolved);

-- API使用统计表
-- 存储API使用模式分析
CREATE TABLE IF NOT EXISTS api_usage_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date_key TEXT NOT NULL, -- YYYY-MM-DD格式
    hour_key INTEGER NOT NULL, -- 0-23
    endpoint TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    average_response_time_ms REAL NOT NULL DEFAULT 0,
    unique_sessions INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_key, hour_key, endpoint)
);

-- API使用统计表索引
CREATE INDEX IF NOT EXISTS idx_api_usage_stats_date_hour 
ON api_usage_stats(date_key, hour_key);

CREATE INDEX IF NOT EXISTS idx_api_usage_stats_endpoint 
ON api_usage_stats(endpoint);

-- 创建视图：每日统计摘要
CREATE VIEW IF NOT EXISTS daily_stats_summary AS
SELECT 
    date_key,
    SUM(request_count) as total_requests,
    SUM(success_count) as total_success,
    SUM(error_count) as total_errors,
    AVG(average_response_time_ms) as avg_response_time,
    SUM(unique_sessions) as total_unique_sessions,
    ROUND((SUM(success_count) * 100.0 / SUM(request_count)), 2) as success_rate_percent
FROM api_usage_stats 
GROUP BY date_key
ORDER BY date_key DESC;

-- 创建视图：热门计算参数
CREATE VIEW IF NOT EXISTS popular_calculations AS
SELECT 
    CASE 
        WHEN principal < 1000 THEN 'under_1k'
        WHEN principal < 10000 THEN '1k_to_10k'
        WHEN principal < 100000 THEN '10k_to_100k'
        WHEN principal < 1000000 THEN '100k_to_1m'
        ELSE 'over_1m'
    END as principal_range,
    CASE 
        WHEN years <= 5 THEN 'short_term'
        WHEN years <= 15 THEN 'medium_term'
        WHEN years <= 30 THEN 'long_term'
        ELSE 'very_long_term'
    END as years_range,
    CASE 
        WHEN annual_rate < 2 THEN 'low_rate'
        WHEN annual_rate < 5 THEN 'moderate_rate'
        WHEN annual_rate < 10 THEN 'high_rate'
        ELSE 'very_high_rate'
    END as rate_range,
    compound_frequency,
    COUNT(*) as calculation_count,
    AVG(final_amount) as avg_final_amount,
    AVG(total_interest) as avg_total_interest
FROM calculation_history 
WHERE created_at >= datetime('now', '-30 days')
GROUP BY principal_range, years_range, rate_range, compound_frequency
ORDER BY calculation_count DESC;

-- 数据保留策略触发器
-- 自动清理超过1年的详细数据
CREATE TRIGGER IF NOT EXISTS cleanup_old_calculation_history
AFTER INSERT ON calculation_history
BEGIN
    DELETE FROM calculation_history 
    WHERE created_at < datetime('now', '-1 year');
END;

CREATE TRIGGER IF NOT EXISTS cleanup_old_monitoring_metrics
AFTER INSERT ON monitoring_metrics
BEGIN
    DELETE FROM monitoring_metrics 
    WHERE timestamp < datetime('now', '-30 days');
END;

CREATE TRIGGER IF NOT EXISTS cleanup_old_error_logs
AFTER INSERT ON error_logs
BEGIN
    DELETE FROM error_logs 
    WHERE timestamp < datetime('now', '-90 days') AND resolved = TRUE;
END;
