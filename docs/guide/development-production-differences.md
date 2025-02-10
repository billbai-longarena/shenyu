# 开发环境与生产环境的差异指南

## WebSocket连接差异

### 1. 连接配置
- **统一配置（开发和生产环境）**：
  ```typescript
  // 自动匹配当前域名、协议和WebSocket路径
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const port = import.meta.env.PROD ? '' : ':3001';
  const wsUrl = `${protocol}//${window.location.hostname}${port}/websocket`;
  ```

- **后端配置**：
  ```typescript
  // WebSocket服务器配置
  this.wss = new WSServer({
    server,
    path: '/websocket',  // 统一的WebSocket路径
    // ... 其他配置
  });
  ```

- **Nginx配置（生产环境）**：
  ```nginx
  # WebSocket代理配置
  location /websocket {
    proxy_pass http://localhost:3001/websocket;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    # ... 其他WebSocket相关配置
  }
  ```

### 2. 连接管理
- **开发环境**：
  - 普通请求复用WebSocket连接
  - 测速模式使用独立连接
  - 连接自动重连
  - 详细的错误日志

- **生产环境**：
  - 智能的连接复用
  - 自动清理断开的连接
  - 优雅的错误处理
  - 用户友好的提示

### 3. 错误处理
- **开发环境**：
  - 详细的错误日志
  - 立即显示错误信息
  - 快速失败策略

- **生产环境**：
  - 优雅降级到HTTP轮询
  - 自动重试机制
  - 用户友好的错误提示
  ```typescript
  // 生产环境错误处理
  ws.onerror = async (error) => {
    console.error('WebSocket错误，切换到HTTP轮询');
    await fallbackToHttpPolling();
  };
  ```

## 静态文件处理差异

### 1. 文件服务
- **开发环境**：
  - Vite开发服务器提供静态文件服务
  - 支持热更新（HMR）
  - 源文件直接服务，无需构建

- **生产环境**：
  - Nginx静态文件服务
  - 文件经过压缩和优化
  - 配置适当的缓存策略
  ```nginx
  # 静态文件缓存配置
  location /assets {
    expires 7d;
    add_header Cache-Control "public, no-transform";
  }
  ```

### 2. 资源路径
- **开发环境**：
  - 相对路径
  - 支持别名（@/components）
  - 动态导入支持

- **生产环境**：
  - 绝对路径
  - CDN支持
  - 资源哈希命名
## TypeScript类型检查差异

### 1. 类型检查级别
- **开发环境**：
  - 增量类型检查
  - 允许部分类型推断
  - 更宽松的类型检查
  ```json
  {
    "compilerOptions": {
      "strict": false,
      "noImplicitAny": false,
      "skipLibCheck": true
    }
  }
  ```

- **生产环境**：
  - 完整类型检查
  - 严格的类型推断
  - 不允许隐式any
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "skipLibCheck": false
    }
  }
  ```

### 2. 构建配置
- **开发环境**：
  - 快速构建
  - 保留源码映射
  - 类型错误不阻止构建

- **生产环境**：
  - 完整类型检查
  - 移除源码映射
  - 类型错误阻止构建
## 并发控制差异

### 1. 请求队列
- **开发环境**：
  - 最大并发请求：2
  - 队列大小：10
  - 快速失败策略

- **生产环境**：
  - 最大并发请求：4
  - 队列大小：100
  - 智能负载均衡
  - 定期清理过期请求

### 2. 性能监控
- **开发环境**：
  - 详细的性能日志
  - 实时监控队列状态

- **生产环境**：
  - 聚合的性能指标
  - 定期清理过期请求
  ```typescript
  // 生产环境监控示例
  setInterval(() => {
    console.log('队列状态:', {
      waiting: queue.length,
      processing: currentProcessing,
      totalProcessed: totalRequests
    });
  }, 60000);
  ```

## 文件权限和路径问题

### 1. 文件权限
- **开发环境**：
  - 默认用户权限
  - 宽松的文件访问控制
  - 自动创建目录和文件

- **生产环境**：
  - 严格的文件权限控制
  - 使用专门的服务用户
  - 限制目录访问权限
  ```bash
  # 生产环境权限设置
  chmod 755 /path/to/app
  chown -R app:app /path/to/app
  ```

### 2. 路径处理
- **开发环境**：
  - 相对路径
  - 本地文件系统直接访问
  ```typescript
  // 开发环境路径处理
  const configPath = './config.json';
  const logPath = './logs';
  ```

- **生产环境**：
  - 绝对路径
  - 环境变量配置路径
  - 跨平台路径处理
  ```typescript
  // 生产环境路径处理
  const configPath = process.env.CONFIG_PATH || '/etc/app/config.json';
  const logPath = process.env.LOG_PATH || '/var/log/app';
  ```

### 3. 文件操作安全
- **开发环境**：
  - 直接文件操作
  - 同步操作允许
  - 详细错误信息

- **生产环境**：
  - 异步文件操作
  - 错误重试机制
  - 文件锁定机制
  ```typescript
  // 生产环境文件操作
  async function writeConfig(data: any) {
    const tempPath = `${configPath}.tmp`;
    try {
      await fs.writeFile(tempPath, JSON.stringify(data));
      await fs.rename(tempPath, configPath);
    } catch (error) {
      console.error('配置文件写入失败:', error);
      throw error;
    }
  }
  ```
## 调试和日志

### 1. 关键日志点
- 环境信息
  ```javascript
  console.log('环境变量:', {
      NODE_ENV: process.env.NODE_ENV,
      PWD: process.cwd(),
      __dirname: __dirname
  });
  ```

- WebSocket状态
  ```javascript
  console.log('WebSocket状态:', {
      连接数: pool.getConnectionCount(),
      活跃请求: currentProcessing,
      队列长度: queue.length
  });
  ```

- 性能指标
  ```javascript
  console.log('性能指标:', {
      平均响应时间: avgResponseTime,
      错误率: errorRate,
      并发数: concurrentRequests
  });
  ```

### 2. 常见问题诊断
- 检查WebSocket连接状态
- 验证请求队列处理
- 确认并发控制是否生效
- 监控连接池使用情况

## 最佳实践

1. **WebSocket管理**
   - 统一使用'/websocket'路径，避免路径不一致导致的连接问题
   - 正确处理连接生命周期
   - 实现可靠的重连机制
   - 添加HTTP轮询作为备份
   - 确保所有WebSocket客户端使用相同的连接配置

2. **并发控制**
   - 根据服务器能力设置限制
   - 实现智能的队列管理
   - 添加超时和清理机制

3. **错误处理**
   - 实现优雅降级策略
   - 添加详细的错误日志
   - 提供用户友好的提示

4. **部署配置**
   - 正确配置WebSocket代理
   - 设置适当的超时时间
   - 启用性能监控
