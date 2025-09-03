# Zinses-Rechner Backend API

德国复利计算器后端API服务 - FastAPI + Python

## 项目概述

这是一个专为德国用户设计的复利计算器后端API，提供透明、快速、本地化的财务计算服务。

## 技术栈

- **框架**: FastAPI 0.104.1
- **语言**: Python 3.11+
- **ASGI服务器**: Uvicorn
- **配置管理**: Pydantic Settings
- **数据验证**: Pydantic v2
- **日志**: 结构化日志 + 德语本地化

## 项目结构

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/    # API端点
│   │       └── api.py       # 路由聚合
│   ├── core/
│   │   ├── config.py        # 应用配置
│   │   └── logging.py       # 日志配置
│   ├── models/              # 数据模型
│   ├── services/            # 业务逻辑
│   └── main.py             # 应用入口
├── tests/                   # 测试文件
├── requirements.txt         # 依赖列表
├── Dockerfile              # 容器配置
└── .env.example            # 环境变量示例
```

## 快速开始

### 1. 环境准备

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt
```

### 2. 环境配置

```bash
# 复制环境配置文件
cp .env.example .env

# 根据需要修改配置
vim .env
```

### 3. 启动开发服务器

```bash
# 方式1: 直接运行
python -m app.main

# 方式2: 使用uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. 访问API文档

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

## API端点

### 健康检查
- `GET /health` - 基础健康检查
- `GET /health/detailed` - 详细健康检查
- `GET /health/ready` - 就绪检查
- `GET /health/live` - 存活检查

### 复利计算
- `POST /api/v1/calculate/compound-interest` - 复利计算
- `GET /api/v1/calculate/limits` - 获取计算限制

## 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| ENVIRONMENT | development | 运行环境 |
| DEBUG | true | 调试模式 |
| HOST | 0.0.0.0 | 服务器地址 |
| PORT | 8000 | 服务器端口 |
| MAX_CALCULATION_YEARS | 50 | 最大计算年限 |
| MAX_PRINCIPAL_AMOUNT | 10000000.0 | 最大本金金额 |
| DEFAULT_TAX_RATE | 0.25 | 德国资本利得税率 |

### 德国本地化

- 货币: 欧元 (EUR)
- 语言: 德语 (de_DE)
- 税务: Abgeltungssteuer (25%) + Solidaritätszuschlag (5.5%)
- 日志: 德语级别名称

## Docker部署

```bash
# 构建镜像
docker build -t zinses-rechner-api .

# 运行容器
docker run -p 8000:8000 -e ENVIRONMENT=production zinses-rechner-api
```

## 开发指南

### 代码质量

```bash
# 代码格式化
black app/
isort app/

# 代码检查
flake8 app/
mypy app/
```

### 测试

```bash
# 运行测试
pytest

# 测试覆盖率
pytest --cov=app
```

## 性能目标

- API响应时间: < 500ms
- 计算延迟: < 100ms
- 并发支持: 1000+ req/s
- 内存使用: < 512MB

## 安全特性

- CORS配置
- 受信任主机验证
- 请求速率限制
- 输入数据验证
- 结构化错误处理

## 监控和日志

- 健康检查端点
- 结构化日志记录
- 德语本地化日志
- 系统资源监控
- 请求追踪
