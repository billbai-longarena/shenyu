# 部署指南

本指南将帮助您在生产环境中部署和运行Shenyu项目。

## 系统要求

### 硬件要求
- CPU: 2核心或以上
- 内存: 4GB或以上
- 磁盘空间: 20GB或以上

### 软件要求
- Node.js >= 18.0.0
- npm >= 7.0.0
- Git
- PM2 (用于进程管理)

## 安装步骤

### 1. 安装Node.js和npm
```bash
# 使用nvm安装Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### 2. 安装PM2
```bash
npm install -g pm2
```

### 3. 克隆项目
```bash
git clone https://github.com/sales-nail/shenyu.git
cd shenyu
```

### 4. 安装依赖
```bash
npm run install:all
```

### 5. 构建项目
```bash
npm run build
```

## 配置说明

### 1. 环境变量
在后端目录创建`.env`文件：
```bash
cd packages/backend
cp .env.example .env
```

编辑`.env`文件，设置必要的环境变量（参考.env.example文件）：
```
# 参考.env.example文件设置环境变量
# 不要在文档中展示实际的环境变量值
```

### 2. 前端配置
在前端目录创建`.env.production`文件：
```bash
cd ../frontend
```

添加必要的环境变量（参考项目文档中的配置说明）：
```
# 在此处配置您的生产环境API地址
# 不要使用实际的域名或IP地址
```

## 生产环境部署

### 1. 使用PM2启动后端服务
创建`ecosystem.config.js`：
```javascript
module.exports = {
  apps: [{
    name: 'shenyu-backend',
    script: 'dist/api-server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

启动服务：
```bash
cd packages/backend
pm2 start ecosystem.config.js
```

### 2. 部署前端
将构建后的前端文件部署到Web服务器：
```bash
cd ../frontend
npm run build
```

将`dist`目录的内容复制到Web服务器目录。

### 3. 配置Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的实际域名

    # 前端静态文件
    location / {
        root /path/to/your/frontend/dist;  # 替换为您的实际前端构建目录
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 监控和维护

### 1. 使用PM2监控
```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs

# 监控资源使用
pm2 monit
```

### 2. 日志管理
日志文件位于：
- 后端: `packages/backend/logs/`
- PM2: `~/.pm2/logs/`

### 3. 备份策略
定期备份以下内容：
- 数据目录: `packages/backend/data/`
- 环境配置文件
- 数据库（如果使用）

## 故障排除

### 1. 常见问题

#### 服务无法启动
- 检查端口是否被占用
- 检查环境变量是否正确
- 检查日志文件

#### 502错误
- 检查后端服务是否运行
- 检查Nginx配置
- 检查防火墙设置

#### 内存溢出
- 检查PM2内存限制设置
- 增加服务器内存
- 优化代码内存使用

### 2. 性能优化
- 启用Nginx缓存
- 配置PM2集群模式
- 优化数据库查询
- 使用CDN加速静态资源

## 安全建议

### 1. 服务器安全
- 启用防火墙
- 定期更新系统
- 使用SSH密钥登录
- 禁用root远程登录

### 2. 应用安全
- 启用HTTPS
- 配置CORS
- 使用安全的会话管理
- 实施速率限制

### 3. 数据安全
- 定期备份
- 加密敏感数据
- 实施访问控制
- 监控异常访问

## 更新和升级

### 1. 更新步骤
```bash
# 拉取最新代码
git pull

# 安装依赖
npm run install:all

# 构建项目
npm run build

# 重启服务
pm2 restart all
```

### 2. 回滚策略
```bash
# 切换到上一个稳定版本
git checkout <previous-tag>

# 重新构建和部署
npm run install:all
npm run build
pm2 restart all
