"""
Gunicorn配置文件
用于生产环境的WSGI服务器配置
"""

import multiprocessing
import os

# 服务器套接字
bind = "0.0.0.0:8000"
backlog = 2048

# 工作进程
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50

# 超时设置
timeout = 30
keepalive = 2

# 日志配置
accesslog = "/app/logs/gunicorn_access.log"
errorlog = "/app/logs/gunicorn_error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# 进程命名
proc_name = "zinses-rechner-api"

# 安全设置
user = "appuser"
group = "appuser"

# 预加载应用
preload_app = True

# 重启设置
max_requests = 1000
max_requests_jitter = 100

# 临时目录
tmp_upload_dir = None

# SSL设置（如果需要）
# keyfile = "/path/to/keyfile"
# certfile = "/path/to/certfile"

def when_ready(server):
    """服务器准备就绪时的回调"""
    server.log.info("🚀 Zinses-Rechner API server is ready. Listening on: %s", server.address)

def worker_int(worker):
    """工作进程中断时的回调"""
    worker.log.info("🔄 Worker received INT or QUIT signal")

def pre_fork(server, worker):
    """工作进程fork前的回调"""
    server.log.info("👷 Worker spawned (pid: %s)", worker.pid)

def post_fork(server, worker):
    """工作进程fork后的回调"""
    server.log.info("✅ Worker spawned (pid: %s)", worker.pid)

def worker_abort(worker):
    """工作进程异常终止时的回调"""
    worker.log.info("❌ Worker received SIGABRT signal")
