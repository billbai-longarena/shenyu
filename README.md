# Shenyu

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Shenyu 是一个强大的 AI 对话平台，支持多种 AI 模型和可扩展的插件系统。
重点是其创新地采用了问卷式交互方式来创造AI Agent，有效避免了对话式交互头脑放空的问题。
AI Agent的配置也是公开展示的，方便prompt调优

## 特性

- 🚀 支持多种 AI 模型（DeepSeek、Kimi、阿里云等）
- 💬 实时流式响应
- 🔌 可扩展的插件系统
- 📝 对话历史记录持久化
- 🌐 WebSocket 长连接支持
- 🔄 智能并发控制
- 📊 内置性能测试工具
- 🎨 优雅的用户界面

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装

1. 克隆仓库
```bash
git clone https://github.com/billbai-longarena/shenyu.git
cd shenyu
```

2. 配置环境变量
```bash
# 后端配置
cd packages/backend
cp .env.example .env
# 编辑 .env 文件，填入您的 API 密钥
```

### 开发

项目提供了便捷的启动脚本，默认端口配置如下：

- 前端：8080
- 后端：3001

1. 启动后端服务
```bash
./scripts/start-backend.sh
# 或指定其他端口
PORT=3002 ./scripts/start-backend.sh
```

2. 启动前端开发服务器
```bash
# 新开一个终端
./scripts/start-frontend.sh
# 或指定其他端口
PORT=8081 ./scripts/start-frontend.sh
```

这些脚本会自动：
- 检查端口占用情况并提供友好提示
- 安装依赖
- 加载环境变量
- 启动开发服务器

注意：
- 如果需要同时运行多个实例，请使用不同的端口
- 修改前端端口后，需要相应修改后端的CORS配置
- 建议在开发时保持默认端口，除非有特殊需求

### 生产部署

1. 构建前端
```bash
cd packages/frontend
npm run build
```

2. 构建后端
```bash
cd packages/backend
npm run build
```

3. 启动服务
```bash
# 启动前端
cd packages/frontend
npm run preview

# 启动后端
cd packages/backend
npm start
```

## 项目结构

```
shenyu/
├── packages/
│   ├── frontend/     # 前端项目
│   │   ├── src/     # 源码
│   │   ├── public/  # 静态资源
│   │   └── dist/    # 构建输出
│   └── backend/     # 后端项目
│       ├── src/     # TypeScript 源码
│       └── dist/    # 构建输出
├── docs/            # 项目文档
└── scripts/         # 工具脚本
```

## 文档

- [开发指南](docs/guide/index.md)
- [API 文档](docs/api/chat-completions.md)
- [组件文档](docs/components/execution-panel.md)
- [更新日志](docs/changelog.md)

## 插件开发

Shenyu 支持通过插件系统扩展 AI 模型支持。查看[插件开发指南](docs/guide/plugin-development.md)了解如何开发自己的模型插件。

## 贡献指南

我们欢迎任何形式的贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与项目开发。

## 安全

如果您发现了安全漏洞，请查看我们的 [安全策略](SECURITY.md) 了解如何报告。

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 了解详情

## 致谢

感谢所有为这个项目做出贡献的开发者！

## 联系我们

- 提交 Issue
- 项目讨论区
- 邮件联系

## 状态徽章

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/billbai-longarena/shenyu/ci.yml?branch=main)
![GitHub package.json version](https://img.shields.io/github/package-json/v/billbai-longarena/shenyu)
![GitHub](https://img.shields.io/github/license/billbai-longarena/shenyu)
