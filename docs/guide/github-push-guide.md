# GitHub 推送指南

本指南总结了向GitHub推送代码的常见场景和解决方案。

## 常见认证方式

### 1. HTTPS认证

使用HTTPS URL（如`https://github.com/username/repo.git`）时的认证方式：

- 用户名密码：不推荐，GitHub已不再支持
- Personal Access Token (PAT)：推荐
  ```bash
  # 设置认证信息
  git config --global credential.helper store
  # 首次推送时输入用户名和PAT
  git push origin main
  ```

### 2. SSH认证（推荐）

使用SSH URL（如`git@github.com:username/repo.git`）时的认证方式：

1. 检查现有SSH密钥
   ```bash
   ls -la ~/.ssh
   ```

2. 生成新的SSH密钥（如果没有）
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

3. 将公钥添加到GitHub
   - 复制公钥内容：`cat ~/.ssh/id_ed25519.pub`
   - 访问GitHub设置：Settings > SSH and GPG keys > New SSH key
   - 粘贴公钥内容并保存

4. 测试SSH连接
   ```bash
   ssh -T git@github.com
   ```

## 推送步骤

1. 检查远程仓库URL
   ```bash
   git remote -v
   ```

2. 如果是HTTPS URL，建议切换到SSH URL
   ```bash
   git remote set-url origin git@github.com:username/repo.git
   ```

3. 添加更改
   ```bash
   git add .  # 添加所有更改
   # 或
   git add file1 file2  # 添加特定文件
   ```

4. 创建提交
   ```bash
   git commit -m "type: descriptive message"
   ```
   提交消息规范：
   - feat: 新功能
   - fix: 修复bug
   - docs: 文档更新
   - style: 代码格式修改
   - refactor: 代码重构
   - test: 测试用例修改
   - chore: 其他修改

5. 推送更改
   ```bash
   git push origin branch-name
   ```

## 常见问题解决

### 1. 认证失败

如果使用HTTPS URL遇到认证失败：
```bash
# 切换到SSH URL
git remote set-url origin git@github.com:username/repo.git
```

### 2. 首次连接SSH警告

首次通过SSH连接GitHub时会显示指纹确认：
```
The authenticity of host 'github.com' can't be established.
... key fingerprint is SHA256:...
Are you sure you want to continue connecting (yes/no)?
```
确认GitHub的官方指纹后输入"yes"即可。

### 3. 代理设置

如果需要通过代理访问GitHub：
```bash
# 设置HTTP代理
git config --global http.proxy http://127.0.0.1:port
git config --global https.proxy http://127.0.0.1:port

# 设置SSH代理（在~/.ssh/config中）
Host github.com
  ProxyCommand nc -X 5 -x 127.0.0.1:port %h %p
```

### 4. 分支保护

如果无法直接推送到main分支：
1. 创建新分支进行开发
   ```bash
   git checkout -b feature-branch
   ```
2. 推送新分支
   ```bash
   git push origin feature-branch
   ```
3. 在GitHub上创建Pull Request

## 最佳实践

1. 使用SSH认证，避免频繁输入认证信息
2. 遵循提交消息规范，保持提交历史清晰
3. 在推送前先拉取最新代码：`git pull origin main`
4. 重要更改使用分支开发，通过PR合并
5. 定期清理本地和远程分支
6. 不要提交敏感信息（如密码、密钥等）
7. 使用.gitignore忽略不需要版本控制的文件

## 配置建议

推荐的全局Git配置：
```bash
# 设置用户信息
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 设置默认分支名
git config --global init.defaultBranch main

# 设置自动转换行尾符
git config --global core.autocrlf input  # Mac/Linux
git config --global core.autocrlf true   # Windows

# 设置默认编辑器
git config --global core.editor "code --wait"  # VS Code
