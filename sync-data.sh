#!/bin/bash

# 设置错误处理
set -e

# 设置SSH连接信息
PEM_PATH=~/adambnn.pem
SERVER_HOST=root@139.224.248.148
LOCAL_BACKUP_PATH="/Users/bingbingbai/Desktop/sales_nail/data_shenyu"

# 确保PEM文件权限正确
chmod 400 $PEM_PATH || {
    echo "错误：无法设置PEM文件权限"
    exit 1
}

# 确保本地备份目录存在
mkdir -p $LOCAL_BACKUP_PATH

# 同步服务器数据到本地
echo "正在同步服务器数据到本地..."
rsync -avz -e "ssh -i $PEM_PATH" $SERVER_HOST:/root/shenyu/packages/backend/data/ $LOCAL_BACKUP_PATH/ || {
    echo "错误：无法同步服务器数据"
    exit 1
}

echo "数据同步完成！"
echo "数据已保存到: $LOCAL_BACKUP_PATH"
