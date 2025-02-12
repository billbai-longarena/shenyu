#!/bin/bash

# 设置错误处理
set -e

# 默认端口
DEFAULT_PORT=8080
BACKEND_PORT=3001
PORT=${PORT:-$DEFAULT_PORT}

# 检查后端服务是否运行
check_backend() {
    echo "Checking backend service..."
    for i in {1..5}; do
        if curl -s http://localhost:$BACKEND_PORT > /dev/null; then
            echo "Backend service is running on port $BACKEND_PORT"
            return 0
        fi
        echo "Waiting for backend service... (attempt $i/5)"
        sleep 2
    done
    echo "Warning: Backend service not detected on port $BACKEND_PORT"
    read -p "Do you want to continue anyway? (y/N) " response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Please start the backend service first with: npm run dev:backend"
        exit 1
    fi
}

echo "Starting frontend development server on port $PORT..."

# 检查后端服务
check_backend

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

# 生成初始文件列表
echo "Generating initial file list..."
npx ts-node scripts/generate-file-list.ts

# 启动前端开发服务器
NODE_ENV=development PORT=$PORT npm run dev

# 捕获SIGINT信号（Ctrl+C）
trap "exit" SIGINT

# 等待服务器进程
wait
