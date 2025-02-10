#!/bin/bash

# 设置错误处理
set -e

# 默认端口
DEFAULT_PORT=8080
PORT=${PORT:-$DEFAULT_PORT}

echo "Starting frontend development server on port $PORT..."

# 切换到前端目录
cd "$(dirname "$0")/.."
cd packages/frontend

# 检查端口是否被占用并尝试关闭占用的进程
if lsof -i :$PORT > /dev/null 2>&1; then
    echo "Port $PORT is in use. Attempting to stop the process..."
    lsof -ti :$PORT | xargs kill -9
    sleep 1
fi

# 检查并安装依赖
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# 启动前端开发服务器
NODE_ENV=development PORT=$PORT npm run dev

# 捕获SIGINT信号（Ctrl+C）
trap "exit" SIGINT

# 等待服务器进程
wait
