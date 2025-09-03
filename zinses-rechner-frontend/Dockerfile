# 德国利息计算器 - 生产级 Dockerfile
# 多阶段构建，优化镜像大小和安全性

# ================================
# 阶段 1: 基础依赖阶段
# ================================
FROM node:18-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    curl \
    tzdata \
    && rm -rf /var/cache/apk/*

# 设置时区为德国时间
ENV TZ=Europe/Berlin
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建应用用户
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# ================================
# 阶段 2: 依赖安装阶段
# ================================
FROM base AS deps

# 复制package文件
COPY package*.json ./
COPY yarn.lock* ./

# 安装依赖（使用缓存优化）
RUN if [ -f yarn.lock ]; then \
        yarn install --frozen-lockfile --production=false; \
    else \
        npm ci --only=production=false; \
    fi

# ================================
# 阶段 3: 开发阶段
# ================================
FROM deps AS development

# 复制源代码
COPY . .

# 设置权限
RUN chown -R appuser:appgroup /app

# 切换到应用用户
USER appuser

# 暴露开发端口
EXPOSE 5173 24678

# 开发命令
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ================================
# 阶段 4: 构建阶段
# ================================
FROM deps AS builder

# 复制源代码
COPY . .

# 设置构建环境变量
ARG NODE_ENV=production
ARG VITE_APP_VERSION
ARG VITE_API_BASE_URL
ARG VITE_ECB_API_URL
ARG VITE_BUNDESBANK_API_URL
ARG VITE_YAHOO_API_URL
ARG VITE_FIXER_API_URL

ENV NODE_ENV=$NODE_ENV
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ECB_API_URL=$VITE_ECB_API_URL
ENV VITE_BUNDESBANK_API_URL=$VITE_BUNDESBANK_API_URL
ENV VITE_YAHOO_API_URL=$VITE_YAHOO_API_URL
ENV VITE_FIXER_API_URL=$VITE_FIXER_API_URL

# 运行构建
RUN npm run build

# 运行测试（可选）
ARG SKIP_TESTS=false
RUN if [ "$SKIP_TESTS" = "false" ]; then npm run test:unit; fi

# ================================
# 阶段 5: 生产阶段
# ================================
FROM nginx:1.25-alpine AS production

# 安装必要工具
RUN apk add --no-cache curl tzdata && rm -rf /var/cache/apk/*

# 设置时区
ENV TZ=Europe/Berlin
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建非root用户
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置文件
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/conf.d/default.conf

# 创建必要目录并设置权限
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run/nginx && \
    chown -R appuser:appgroup /var/cache/nginx /var/log/nginx /var/run/nginx /usr/share/nginx/html

# 复制启动脚本和健康检查
COPY docker/docker-entrypoint.sh /docker-entrypoint.sh
COPY docker/healthcheck.sh /healthcheck.sh
RUN chmod +x /docker-entrypoint.sh /healthcheck.sh

# 暴露端口
EXPOSE 80 443

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /healthcheck.sh

# 添加标签
LABEL maintainer="Zinses Rechner Team" \
      version="1.0.0" \
      description="German Interest Calculator - Production Ready"

# 切换到非root用户
USER appuser

# 启动命令
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
