# InputPanel 组件文档

## 组件功能

InputPanel组件负责处理用户输入界面，主要功能包括：
1. 显示用户输入框（inputAx）
2. 显示管理员配置的标签（来自inputBx）
3. 处理输入值的更新和同步

## 最近更新

### 2024-02-05 标签显示优化
1. 标签处理功能
   - 添加了`<def>`标签过滤功能
   - 优化了label显示逻辑
   - 实现了更清晰的界面展示

2. 组件改进
   - 添加了removeDefTags工具函数
   - 优化了getAdminInputValue方法
   - 保持了原有功能的完整性

## 组件接口

### Props
- `userInputs`: { [key: string]: string }
  * 用户输入值的对象
  * key格式为"inputAx"（x为数字）
  * value为用户输入的内容

- `adminInputs`: { [key: string]: string }
  * 管理员配置的对象
  * key格式为"inputBx"（x为数字）
  * value为配置的内容，可能包含`<def>`标签

### Events
- `update:userInputs`: 当用户输入值变化时触发
  * 参数：更新后的userInputs对象
  * 用于实现v-model双向绑定

## 实现细节

### 标签处理
1. `removeDefTags`函数
   - 使用正则表达式移除`<def>`标签及其内容
   - 保留标签外的描述文本
   - 用于label的显示

2. `getAdminInputValue`方法
   - 将inputAx的key转换为对应的inputBx
   - 获取adminInputs中的值
   - 移除`<def>`标签后返回纯文本

### 状态管理
1. 本地状态
   - 使用ref管理localUserInputs
   - 通过watch同步props变化
   - 使用emit更新父组件状态

2. 输入处理
   - 监听输入事件
   - 更新本地状态
   - 触发update事件

## 使用示例

```vue
<template>
  <InputPanel
    v-model:userInputs="userInputs"
    :adminInputs="adminInputs"
  />
</template>

<script setup>
const userInputs = ref({
  inputA1: '',
  inputA2: ''
})

const adminInputs = ref({
  inputB1: '客户公司<def>某某科技</def>',
  inputB2: '客户行业<def>互联网</def>'
})
</script>
```

## 注意事项

1. 标签处理
   - `<def>`标签仅在label显示时被移除
   - 标签在adminInputs中保持完整
   - 标签内容会自动填入对应的输入框

2. 状态同步
   - 使用v-model进行双向绑定
   - 保持输入值的实时更新
   - 正确处理props的变化

3. 性能考虑
   - 使用本地状态避免频繁更新
   - 合理使用watch和computed
   - 优化DOM更新和渲染
