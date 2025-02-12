# 国际化改造方案

## 必读文档

在开始实施国际化改造之前，请务必阅读以下文档：

- [i18n最佳实践指南](./guide/i18n-best-practices.md) - 包含详细的实现指南、性能优化建议和问题排查方法

## 1. 技术方案概述

- 使用 vue-i18n 作为国际化解决方案
- 使用 Vue3 Composables 模式管理语言状态
- 创建语言切换组件
- 分离中英文翻译文件

## 2. 具体实施步骤

### A. 基础设施搭建

- [x] 1. 安装依赖：
   - vue-i18n

- [x] 2. 创建语言文件结构：
```
src/
  locales/
    types.ts      # 类型定义
    en.ts         # 英文翻译
    zh.ts         # 中文翻译
```

- [x] 3. 创建语言状态管理：
   - 新建 src/composables/useLanguage.ts
   - 实现语言切换和持久化功能
   - 保持与项目现有 composables 风格一致

### B. 语言文本管理

- [x] 1. 类型定义 (types.ts):
```typescript
export interface LocaleMessages {
  menu: {
    chat: string
    agent: string
    feature3: string
    feature4: string
  }
  controls: {
    speedTest: string
    setDefault: string
    modelSelect: string
    paramSelect: string
  }
  modelParams: {
    conservative: string
    balanced: string
    creative: string
    codeGen: string
    dataExtract: string
    generalChat: string
    creativeWriting: string
  }
  // ... 其他文本类别
}
```

- [x] 2. 语言实现示例：

```typescript
// en.ts
export const messages: LocaleMessages = {
  menu: {
    chat: 'Chat',
    agent: 'Agent',
    feature3: 'Feature 3',
    feature4: 'Feature 4'
  },
  controls: {
    speedTest: 'Speed Test',
    setDefault: 'Set as Default',
    modelSelect: 'Select Model',
    paramSelect: 'Select Parameter'
  },
  modelParams: {
    conservative: 'Conservative',
    balanced: 'Balanced',
    creative: 'Creative',
    codeGen: 'Code Generation/Math',
    dataExtract: 'Data Extraction',
    generalChat: 'General Chat',
    creativeWriting: 'Creative Writing'
  }
}

// zh.ts
export const messages: LocaleMessages = {
  menu: {
    chat: '对话',
    agent: '智能体',
    feature3: '功能3',
    feature4: '功能4'
  },
  controls: {
    speedTest: '测速',
    setDefault: '设为默认',
    modelSelect: '选择模型',
    paramSelect: '选择参数'
  },
  modelParams: {
    conservative: '保守',
    balanced: '平衡',
    creative: '创造',
    codeGen: '代码生成/数学解题',
    dataExtract: '数据抽取/分析',
    generalChat: '通用对话和翻译',
    creativeWriting: '创意类写作'
  }
}
```

- [x] 3. useLanguage Composable 实现：
```typescript
import { ref, computed } from 'vue'
import type { LocaleMessages } from '../locales/types'
import { messages as enMessages } from '../locales/en'
import { messages as zhMessages } from '../locales/zh'

export function useLanguage() {
  const currentLanguage = ref('en')
  
  // 当前语言的所有文本
  const messages = computed<LocaleMessages>(() => 
    currentLanguage.value === 'en' ? enMessages : zhMessages
  )
  
  // 获取特定文本的辅助函数
  const t = (path: string) => {
    const keys = path.split('.')
    let result: any = messages.value
    for (const key of keys) {
      result = result[key]
    }
    return result
  }
  
  // 加载默认语言
  const loadDefaultLanguage = async () => {
    // 实现类似 useModelDefaults 的加载逻辑
  }
  
  // 保存默认语言
  const saveDefaultLanguage = async (lang: string) => {
    // 实现类似 useModelDefaults 的保存逻辑
  }
  
  // 切换语言
  const toggleLanguage = () => {
    currentLanguage.value = currentLanguage.value === 'en' ? 'zh' : 'en'
    // 触发重新加载对应语言的数据
  }
  
  return {
    currentLanguage,
    messages,
    t,
    loadDefaultLanguage,
    saveDefaultLanguage,
    toggleLanguage
  }
}
```

### C. 组件改造

- [x] 1. App.vue 修改：
- 在"设为默认"按钮右侧添加 EN/CN 切换按钮
- 使用 Element Plus 的 el-switch 组件实现

- [x] 2. 组件中使用示例：
```vue
<template>
  <el-menu-item index="/chat">
    <el-icon><ChatDotRound /></el-icon>
    {{ t('menu.chat') }}
  </el-menu-item>
  
  <el-button
    type="primary"
    :loading="isTesting"
    :disabled="isTesting"
    @click="testModelSpeed"
  >
    {{ t('controls.speedTest') }}
  </el-button>
</template>

<script setup>
import { useLanguage } from '../composables/useLanguage'

const { t } = useLanguage()
</script>
```

### D. 数据加载逻辑改造

- [x] 1. JSON 文件加载逻辑：
- 根据当前语言选择加载 item_EN 或 item_CN 目录下的文件
- 在语言切换时重新加载对应语言的数据
- 添加了自动生成文件列表的脚本

## 3. 测试计划

- [ ] 1. 单元测试：
- 语言切换功能
- 文本加载功能
- 默认语言保存/加载功能

- [ ] 2. 集成测试：
- JSON 文件加载
- 语言切换时的数据重新加载

- [ ] 3. UI测试：
- 确保所有文本正确显示
- 验证语言切换按钮功能
- 检查动态加载内容的语言切换

- [ ] 4. 兼容性测试：
- 确保在不同浏览器中正常工作
- 验证本地存储功能

## 4. 注意事项

1. 代码规范：
- 确保所有硬编码的文本都被提取到语言文件中
- 保持英文为默认语言
- 保持与项目现有的代码风格一致

2. 性能考虑：
- 按需加载语言文件
- 优化语言切换时的重新渲染

3. 用户体验：
- 实现语言选择的本地存储，记住用户的选择
- 确保语言切换时的平滑过渡
- 保持与现有的错误处理和消息提示方式一致

4. 维护性：
- 清晰的文本组织结构
- 完善的类型定义
- 统一的文本访问模式

## 5. 开发指南

在开发过程中，请严格遵循[i18n最佳实践指南](./guide/i18n-best-practices.md)中的建议，特别注意：

1. 语言状态管理
   - 使用全局响应式状态
   - 通过依赖注入共享状态
   - 使用computed属性处理派生值

2. 资源加载
   - 实现适当的缓存控制
   - 正确处理非ASCII字符
   - 遵循目录结构规范

3. 性能优化
   - 实现延迟加载策略
   - 避免不必要的资源重载
   - 优化资源包大小

4. 调试和问题排查
   - 使用文档中提供的调试工具
   - 遵循问题排查流程
   - 实现完整的日志跟踪
