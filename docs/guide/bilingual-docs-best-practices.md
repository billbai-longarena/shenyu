# 双语文档维护最佳实践 [中文] | [English](bilingual-docs-best-practices.en.md)

本文档总结了项目中维护双语文档的最佳实践和规范。

## 1. 文档结构

### 1.1 文件命名规范

- 中文文档：`document-name.md`
- 英文文档：`document-name.en.md`
- 使用小写字母和连字符，避免使用空格和其他特殊字符

### 1.2 文档头部导航

每个文档都应在头部包含语言切换链接：

```markdown
# 文档标题 [中文] | [English](document-name.en.md)
```

## 2. 内容组织

### 2.1 文档对应关系

- 每个中文文档都应有对应的英文版本
- 保持两种语言版本的目录结构一致
- 确保文档间的相互引用正确

### 2.2 内容同步

- 及时更新两种语言版本
- 保持内容的一致性
- 代码示例在两个版本中保持相同

## 3. README文件维护

### 3.1 文档引用

在README中引用文档时，明确标注语言版本：

```markdown
- [文档标题](docs/guide/document-name.md) [中文]
```

### 3.2 语言切换

- README.md 和 README.en.md 保持同步更新
- 确保两个版本的文档链接分别指向对应语言版本

## 4. 实际案例

### 4.1 新增文档

创建新文档时的步骤：

1. 创建中文版本：
```bash
touch docs/guide/new-document.md
```

2. 创建英文版本：
```bash
touch docs/guide/new-document.en.md
```

3. 在两个文件头部添加语言切换链接：
```markdown
# 标题 [中文] | [English](new-document.en.md)
```
```markdown
# Title [English] | [中文](new-document.md)
```

### 4.2 更新README

在两个README文件中添加新文档链接：

```markdown
# README.md
- [文档标题](docs/guide/new-document.md) [中文]

# README.en.md
- [Document Title](docs/guide/new-document.en.md) [English]
```

## 5. 注意事项

### 5.1 内容同步

- 在修改文档时，同时更新两种语言版本
- 使用版本控制系统的分支功能，确保同时提交两个版本的更改
- 在PR中包含两种语言版本的修改

### 5.2 链接维护

- 定期检查文档间的相互引用
- 确保语言切换链接正确
- 更新文件名时同时更新所有相关引用

## 6. 总结

维护双语文档的关键点：
1. 保持清晰的文件命名规范
2. 确保文档头部有语言切换链接
3. 同步更新两种语言版本
4. 正确维护文档引用
5. 定期检查和更新文档链接
