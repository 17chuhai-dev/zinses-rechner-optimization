# Docker开发环境指南

## 概述

德国复利计算器项目使用Docker和Docker Compose来提供一致的开发环境，确保所有开发者都能在相同的环境中工作。

## 系统要求

- Docker Engine 20.10+
- Docker Compose 2.0+
- 至少4GB可用内存
- 至少10GB可用磁盘空间

## 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone <repository-url>
cd zinses-rechner

# 复制环境变量文件
cp .env.example .env

# 启动开发环境
./scripts/docker-dev.sh start
```

### 2. 访问服务

- **前端应用**: http://localhost:5173
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs
- **Redis**: localhost:6379
- **MailHog**: http://localhost:8025 (邮件测试)
- **Adminer**: http://localhost:8080 (数据库管理)

## 服务架构

### 核心服务

1. **frontend** - Vue.js前端应用
   - 端口: 5173
   - 热重载支持
   - 开发工具集成

2. **backend** - FastAPI后端服务
   - 端口: 8000
   - 自动重载
   - 调试模式

3. **redis** - 缓存服务
   - 端口: 6379
   - 持久化存储

### 开发工具服务

1. **mailhog** - 邮件测试工具
   - SMTP: 1025
   - Web UI: 8025

2. **adminer** - 数据库管理工具
   - 端口: 8080
   - 支持多种数据库

3. **nginx** - 反向代理（生产模式）
   - 端口: 80
   - 负载均衡和缓存

## 常用命令

### 使用管理脚本

```bash
# 启动开发环境
./scripts/docker-dev.sh start

# 停止服务
./scripts/docker-dev.sh stop

# 重启服务
./scripts/docker-dev.sh restart

# 构建镜像
./scripts/docker-dev.sh build

# 查看日志
./scripts/docker-dev.sh logs
./scripts/docker-dev.sh logs backend

# 检查服务状态
./scripts/docker-dev.sh status

# 清理环境
./scripts/docker-dev.sh clean
```

### 直接使用Docker Compose

```bash
# 启动开发环境
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f backend

# 进入容器
docker compose exec backend bash
docker compose exec frontend sh

# 停止服务
docker compose down
```

## 环境配置

### 环境变量

主要环境变量在 `.env` 文件中配置：

```bash
# 前端配置
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_ANALYTICS=false

# 后端配置
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=debug

# 数据库配置
DATABASE_URL=sqlite:///./zinses_rechner.db
REDIS_URL=redis://redis:6379/0
```

### 开发模式特性

- **热重载**: 前后端代码修改自动重载
- **调试模式**: 详细的错误信息和日志
- **开发工具**: MailHog、Adminer等辅助工具
- **卷挂载**: 代码实时同步到容器

## 故障排查

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :5173
   lsof -i :8000
   
   # 修改端口配置
   vim docker-compose.dev.yml
   ```

2. **容器启动失败**
   ```bash
   # 查看详细日志
   docker compose logs backend
   
   # 重新构建镜像
   docker compose build --no-cache backend
   ```

3. **数据库连接问题**
   ```bash
   # 检查Redis连接
   docker compose exec redis redis-cli ping
   
   # 重启Redis服务
   docker compose restart redis
   ```

4. **前端热重载不工作**
   ```bash
   # 检查文件挂载
   docker compose exec frontend ls -la /app
   
   # 重启前端服务
   docker compose restart frontend
   ```

### 性能优化

1. **构建缓存**
   ```bash
   # 使用构建缓存
   docker compose build
   
   # 清理构建缓存
   docker builder prune
   ```

2. **卷优化**
   ```bash
   # 使用命名卷提升性能
   docker volume ls
   docker volume prune
   ```

## 生产环境部署

### 生产配置

```bash
# 使用生产配置
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 启用nginx反向代理
docker compose --profile production up -d
```

### 安全配置

- 移除开发工具服务
- 启用HTTPS
- 配置防火墙规则
- 设置资源限制

## 维护和监控

### 日志管理

```bash
# 查看所有服务日志
docker compose logs

# 实时跟踪日志
docker compose logs -f --tail=100

# 导出日志
docker compose logs > logs/docker-$(date +%Y%m%d).log
```

### 健康检查

```bash
# 检查服务健康状态
docker compose ps

# 手动健康检查
curl http://localhost:8000/health
curl http://localhost:5173
```

### 备份和恢复

```bash
# 备份数据卷
docker run --rm -v zinses-rechner_redis-data:/data -v $(pwd):/backup alpine tar czf /backup/redis-backup.tar.gz -C /data .

# 恢复数据卷
docker run --rm -v zinses-rechner_redis-data:/data -v $(pwd):/backup alpine tar xzf /backup/redis-backup.tar.gz -C /data
```

## 最佳实践

1. **定期更新镜像**
2. **监控资源使用**
3. **定期清理未使用的镜像和卷**
4. **使用.dockerignore优化构建**
5. **配置适当的健康检查**
6. **使用多阶段构建优化镜像大小**

## 支持和帮助

如果遇到问题，请：

1. 查看本文档的故障排查部分
2. 检查Docker和Docker Compose版本
3. 查看服务日志获取详细错误信息
4. 联系开发团队获取支持
