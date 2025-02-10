# 贡献指南

感谢您对 Shenyu 项目的关注！我们欢迎任何形式的贡献，包括但不限于：

- 报告问题
- 提交功能建议
- 提交代码改进
- 改进文档

## 开发环境设置

1. Fork 本仓库
2. Clone 您的 Fork 到本地
```bash
git clone https://github.com/YOUR_USERNAME/shenyu.git
cd shenyu
```

3. 安装依赖
```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd backend
npm install
```

## 开发流程

1. 创建新的分支
```bash
git checkout -b feature/your-feature-name
```

2. 进行开发
- 遵循项目的代码规范
- 确保添加适当的测试
- 保持提交信息清晰明确

3. 提交更改
```bash
git add .
git commit -m "feat: add your feature description"
```

4. 推送到您的 Fork
```bash
git push origin feature/your-feature-name
```

5. 创建 Pull Request

## 代码规范

- 使用 TypeScript 进行开发
- 遵循 ESLint 配置的代码风格
- 组件开发遵循 Vue 3 组合式 API 规范
- 保持代码简洁，添加必要的注释

## 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- feat: 新功能
- fix: 修复问题
- docs: 文档变更
- style: 代码格式修改
- refactor: 代码重构
- test: 测试用例修改
- chore: 其他修改

## 测试要求

- 确保所有测试通过
```bash
npm run test:unit
npm run test:e2e
```

- 新功能需要添加对应的测试用例
- 修复问题时需要添加相关的测试用例

## 文档要求

- 新功能需要更新相应的文档
- 保持中英文文档的同步
- 文档需要清晰易懂，提供必要的示例

## 插件开发

如果您想要开发新的 AI 模型插件：

1. 参考 `src/api` 目录下的现有实现
2. 实现标准的模型接口
3. 提供完整的插件文档
4. 添加必要的测试用例

## 问题反馈

- 使用 GitHub Issues 提交问题
- 提供清晰的问题描述
- 包含必要的环境信息和复现步骤
- 如果可能，提供最小复现示例

## 安全问题

如果您发现了安全漏洞，请不要直接在 Issues 中提出，而是：

1. 发送邮件到项目维护者
2. 描述问题细节
3. 等待回复和修复方案

## 行为准则

- 保持友善和专业
- 尊重其他贡献者
- 积极参与讨论
- 接受建设性的批评

## 许可证

通过提交 Pull Request，您同意您的贡献将按照项目的 MIT 许可证进行授权。

## 获取帮助

- 查看项目文档
- 在 Issues 中搜索类似问题
- 通过 Discussions 与社区交流
- 联系项目维护者

再次感谢您的贡献！
