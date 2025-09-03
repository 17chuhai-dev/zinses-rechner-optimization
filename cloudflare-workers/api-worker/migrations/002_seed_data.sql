-- Zinses-Rechner种子数据
-- 初始化系统配置和测试数据

-- 系统配置种子数据
INSERT OR IGNORE INTO system_config (config_key, config_value, config_type, description) VALUES
-- 应用配置
('app_version', '1.0.0', 'string', '应用版本号'),
('app_name', 'Zinses-Rechner', 'string', '应用名称'),
('app_description', 'Professioneller Zinseszins-Rechner für Deutschland', 'string', '应用描述'),

-- 功能开关
('maintenance_mode', 'false', 'boolean', '维护模式开关'),
('feature_tax_calculation', 'true', 'boolean', '税务计算功能开关'),
('feature_export_pdf', 'true', 'boolean', 'PDF导出功能开关'),
('feature_export_excel', 'true', 'boolean', 'Excel导出功能开关'),
('feature_advanced_charts', 'true', 'boolean', '高级图表功能开关'),
('feature_comparison_mode', 'true', 'boolean', '比较模式功能开关'),
('feature_savings_goals', 'true', 'boolean', '储蓄目标功能开关'),

-- 计算限制
('max_calculation_years', '50', 'number', '最大计算年限'),
('max_principal_amount', '10000000', 'number', '最大本金金额（欧元）'),
('max_monthly_payment', '50000', 'number', '最大月供金额（欧元）'),
('min_annual_rate', '0.01', 'number', '最小年利率（%）'),
('max_annual_rate', '20', 'number', '最大年利率（%）'),

-- 税务配置
('default_tax_rate', '0.25', 'number', '默认税率（Abgeltungssteuer）'),
('sparerpauschbetrag_single', '1000', 'number', '单身免税额（欧元）'),
('sparerpauschbetrag_married', '2000', 'number', '已婚免税额（欧元）'),
('solidaritaetszuschlag_rate', '0.055', 'number', '团结税率'),
('kirchensteuer_rate', '0.08', 'number', '教会税率（平均）'),

-- 缓存配置
('cache_ttl_seconds', '300', 'number', '缓存过期时间（秒）'),
('cache_max_entries', '1000', 'number', '最大缓存条目数'),
('cache_cleanup_interval', '3600', 'number', '缓存清理间隔（秒）'),

-- 速率限制
('rate_limit_requests', '100', 'number', '速率限制请求数'),
('rate_limit_window_seconds', '900', 'number', '速率限制时间窗口（秒）'),
('rate_limit_burst', '20', 'number', '突发请求限制'),

-- 监控配置
('monitoring_enabled', 'true', 'boolean', '监控功能开关'),
('analytics_enabled', 'true', 'boolean', '分析功能开关'),
('error_reporting_enabled', 'true', 'boolean', '错误报告开关'),
('performance_tracking_enabled', 'true', 'boolean', '性能跟踪开关'),

-- 告警阈值
('alert_error_rate_threshold', '5', 'number', '错误率告警阈值（%）'),
('alert_response_time_threshold', '2000', 'number', '响应时间告警阈值（毫秒）'),
('alert_calculation_failure_threshold', '10', 'number', '计算失败告警阈值'),

-- 数据保留策略
('data_retention_calculation_history_days', '365', 'number', '计算历史保留天数'),
('data_retention_monitoring_metrics_days', '30', 'number', '监控指标保留天数'),
('data_retention_error_logs_days', '90', 'number', '错误日志保留天数'),
('data_retention_user_sessions_days', '30', 'number', '用户会话保留天数'),

-- API配置
('api_version', 'v1', 'string', 'API版本'),
('api_rate_limit_enabled', 'true', 'boolean', 'API速率限制开关'),
('api_cors_enabled', 'true', 'boolean', 'CORS支持开关'),
('api_compression_enabled', 'true', 'boolean', 'API响应压缩开关'),

-- 安全配置
('security_headers_enabled', 'true', 'boolean', '安全头开关'),
('csrf_protection_enabled', 'true', 'boolean', 'CSRF保护开关'),
('input_validation_strict', 'true', 'boolean', '严格输入验证开关'),

-- UI配置
('ui_theme_default', 'light', 'string', '默认UI主题'),
('ui_language_default', 'de', 'string', '默认语言'),
('ui_currency_default', 'EUR', 'string', '默认货币'),
('ui_date_format', 'DD.MM.YYYY', 'string', '日期格式'),
('ui_number_format', 'de-DE', 'string', '数字格式'),

-- 计算默认值
('default_compound_frequency', 'monthly', 'string', '默认复利频率'),
('default_calculation_years', '10', 'number', '默认计算年限'),
('default_annual_rate', '4.0', 'number', '默认年利率（%）'),

-- 导出配置
('export_pdf_enabled', 'true', 'boolean', 'PDF导出开关'),
('export_excel_enabled', 'true', 'boolean', 'Excel导出开关'),
('export_csv_enabled', 'true', 'boolean', 'CSV导出开关'),
('export_max_file_size_mb', '10', 'number', '导出文件最大大小（MB）'),

-- 通知配置
('notification_email_enabled', 'false', 'boolean', '邮件通知开关'),
('notification_webhook_enabled', 'false', 'boolean', 'Webhook通知开关'),
('notification_slack_enabled', 'false', 'boolean', 'Slack通知开关');

-- 初始化缓存统计
INSERT OR IGNORE INTO cache_stats (date_key, hit_count, miss_count, total_requests, hit_rate_percent) VALUES
(date('now'), 0, 0, 0, 0.0),
(date('now', '-1 day'), 0, 0, 0, 0.0),
(date('now', '-2 days'), 0, 0, 0, 0.0);

-- 初始化API使用统计（当天各小时）
INSERT OR IGNORE INTO api_usage_stats (date_key, hour_key, endpoint, request_count, success_count, error_count) VALUES
(date('now'), 0, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 1, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 2, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 3, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 4, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 5, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 6, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 7, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 8, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 9, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 10, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 11, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 12, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 13, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 14, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 15, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 16, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 17, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 18, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 19, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 20, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 21, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 22, '/api/v1/calculate/compound-interest', 0, 0, 0),
(date('now'), 23, '/api/v1/calculate/compound-interest', 0, 0, 0);

-- 健康检查端点统计
INSERT OR IGNORE INTO api_usage_stats (date_key, hour_key, endpoint, request_count, success_count, error_count) VALUES
(date('now'), 12, '/health', 0, 0, 0),
(date('now'), 12, '/monitoring/metrics', 0, 0, 0);

-- 创建数据库视图（如果不存在）
CREATE VIEW IF NOT EXISTS daily_stats_summary AS
SELECT 
    date_key,
    SUM(request_count) as total_requests,
    SUM(success_count) as total_success,
    SUM(error_count) as total_errors,
    AVG(average_response_time_ms) as avg_response_time,
    SUM(unique_sessions) as total_unique_sessions,
    ROUND((SUM(success_count) * 100.0 / NULLIF(SUM(request_count), 0)), 2) as success_rate_percent
FROM api_usage_stats 
GROUP BY date_key
ORDER BY date_key DESC;

CREATE VIEW IF NOT EXISTS popular_calculations AS
SELECT 
    CASE 
        WHEN principal < 1000 THEN 'unter_1k'
        WHEN principal < 10000 THEN '1k_bis_10k'
        WHEN principal < 100000 THEN '10k_bis_100k'
        WHEN principal < 1000000 THEN '100k_bis_1m'
        ELSE 'über_1m'
    END as principal_range,
    CASE 
        WHEN years <= 5 THEN 'kurzfristig'
        WHEN years <= 15 THEN 'mittelfristig'
        WHEN years <= 30 THEN 'langfristig'
        ELSE 'sehr_langfristig'
    END as years_range,
    CASE 
        WHEN annual_rate < 2 THEN 'niedrig'
        WHEN annual_rate < 5 THEN 'moderat'
        WHEN annual_rate < 10 THEN 'hoch'
        ELSE 'sehr_hoch'
    END as rate_range,
    compound_frequency,
    COUNT(*) as calculation_count,
    AVG(final_amount) as avg_final_amount,
    AVG(total_interest) as avg_total_interest,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM calculation_history WHERE created_at >= datetime('now', '-30 days')), 2) as percentage
FROM calculation_history 
WHERE created_at >= datetime('now', '-30 days')
GROUP BY principal_range, years_range, rate_range, compound_frequency
HAVING calculation_count >= 2
ORDER BY calculation_count DESC;

-- 性能监控视图
CREATE VIEW IF NOT EXISTS performance_overview AS
SELECT 
    date(timestamp) as date_key,
    metric_name,
    AVG(metric_value) as avg_value,
    MIN(metric_value) as min_value,
    MAX(metric_value) as max_value,
    COUNT(*) as sample_count
FROM monitoring_metrics 
WHERE timestamp >= datetime('now', '-7 days')
GROUP BY date(timestamp), metric_name
ORDER BY date_key DESC, metric_name;

-- 错误统计视图
CREATE VIEW IF NOT EXISTS error_summary AS
SELECT 
    date(timestamp) as date_key,
    error_type,
    COUNT(*) as error_count,
    COUNT(CASE WHEN resolved = TRUE THEN 1 END) as resolved_count,
    ROUND(COUNT(CASE WHEN resolved = TRUE THEN 1 END) * 100.0 / COUNT(*), 2) as resolution_rate
FROM error_logs 
WHERE timestamp >= datetime('now', '-30 days')
GROUP BY date(timestamp), error_type
ORDER BY date_key DESC, error_count DESC;
