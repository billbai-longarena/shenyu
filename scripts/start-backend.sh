#!/bin/bash

# 设置错误处理
set -e

# 默认端口
DEFAULT_PORT=3001
PORT=${PORT:-$DEFAULT_PORT}

echo "Starting backend service on port $PORT..."

# 切换到后端目录
cd "$(dirname "$0")/../packages/backend"

# 检查环境文件
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please copy .env.example to .env and configure it properly."
    exit 1
fi

# 检查端口是否被占用并尝试关闭占用的进程
if lsof -i :$PORT > /dev/null 2>&1; then
    echo "Port $PORT is in use. Attempting to stop the process..."
    lsof -ti :$PORT | xargs kill -9
    sleep 1
fi

# 确保.env文件中的端口与启动端口一致
sed -i.bak "s/^PORT=.*/PORT=$PORT/" .env
rm -f .env.bak

# 启动后端服务
npm run dev

# 捕获SIGINT信号（Ctrl+C）
trap "exit" SIGINT

# 等待服务器进程
wait
