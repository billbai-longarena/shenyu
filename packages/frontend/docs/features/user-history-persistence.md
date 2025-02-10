# 用户历史记录持久化方案

## 1. 功能概述

### 1.1 需求背景
- 在不依赖数据库和用户登录的情况下，实现用户历史记录的持久化存储
- 需要准确识别用户并在用户重新访问时恢复其历史记录
- 确保数据持久性和用户体验的连续性
- 分离对话和智能体的历史记录，提供更清晰的用户体验

### 1.2 最新更新
- 实现了对话和智能体历史记录的分离存储
- 通过路由meta配置自动加载对应的历史记录
- 在页面切换时自动切换历史记录显示
- 优化了历史记录的存储结构，支持多页面独立存储

### 1.3 主要功能
- 用户身份识别
- 历史记录持久化存储
- 历史记录恢复
- 本地与服务器数据同步
- 多页面历史记录分离

## 2. 技术方案

### 2.1 路由配置
```typescript
// 路由meta中定义storageKey
const routes = [
    {
        path: '/chat',
        component: ChatView,
        meta: {
            storageKey: 'chat-history'
        }
    },
    {
        path: '/sn43',
        component: SN43View,
        meta: {
            title: 'SN4+3',
            storageKey: 'sn43-history'
        }
    }
]

// 路由守卫处理页面切换
router.beforeEach((to, from, next) => {
    if (to.meta.storageKey !== from.meta.storageKey) {
        // 切换历史记录存储
        console.log(`[Router] Switching history storage: ${from.meta.storageKey} -> ${to.meta.storageKey}`);
    }
    next();
})
```

### 2.2 用户识别策略
#### 2.1.1 多维度特征收集
```typescript
interface BrowserFingerprint {
  // 浏览器基本信息
  userAgent: string;
  language: string;
  colorDepth: number;
  screenResolution: string;
  timezone: string;
  
  // 浏览器功能特征
  cookiesEnabled: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  
  // 高级特征
  fonts: string[];
  canvasFingerprint: string;
  webglVendor: string;
  webglRenderer: string;
}
```

#### 2.1.2 存储策略
- 主标识符：localStorage中的UUID
- 备份标识符：
  - First-Party Cookie
  - SessionStorage
  - IndexedDB

#### 2.1.3 识别算法
- 多维度特征匹配
- 概率匹配机制
- 关联分析

### 2.2 数据存储设计
#### 2.2.1 文件结构
```typescript
// 用户信息
interface UserIdentity {
  id: string;          // 唯一标识符
  fingerprint: BrowserFingerprint;
  firstSeen: string;   // 首次访问时间
  lastSeen: string;    // 最后访问时间
}

// 分页面历史记录
interface PageHistory {
  storageKey: string;  // 对应不同页面的历史记录键名
  histories: ChatHistory[];  // 每个页面独立的历史记录集合
}

// 用户历史记录集合
interface UserHistories {
  userId: string;
  pages: PageHistory[];  // 每个页面独立的历史记录
  lastSync: string;
}

// 消息接口
interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

// 历史记录项
interface ChatHistory {
    id: number;
    title: string;
    messages: Message[];
}
```

#### 2.2.2 存储路径
- 用户信息：`data/users/{userId}.json`
- 历史记录：`data/histories/{userId}/{storageKey}.json`
- 每个页面独立存储，通过storageKey区分

## 3. API设计

### 3.1 用户识别API
```typescript
// POST /api/user/identify
interface IdentifyRequest {
  fingerprint: BrowserFingerprint;
}

interface IdentifyResponse {
  userId: string;
  isNewUser: boolean;
}
```

### 3.2 历史记录API
```typescript
// GET /api/history/{userId}/{storageKey}
interface GetHistoryResponse {
  histories: ChatHistory[];
  lastSync: string;
}

// POST /api/history/{userId}/{storageKey}
interface SaveHistoryRequest {
  histories: ChatHistory[];
}

// PUT /api/history/{userId}/{storageKey}/sync
interface SyncHistoryResponse {
  success: boolean;
  lastSync: string;
}

// DELETE /api/history/{userId}/{storageKey}/{historyId}
// 删除特定历史记录

// PUT /api/history/{userId}/{storageKey}/{historyId}/rename
// 重命名历史记录
interface RenameHistoryRequest {
  title: string;
}
```

## 4. 实现步骤

### 4.1 后端实现
1. 创建用户识别服务 (user-identity-service.ts)
   - 实现指纹收集和验证
   - 实现用户ID生成和验证
   - 实现用户信息持久化

2. 创建历史记录服务 (history-service.ts)
   - 实现按页面分类的历史记录文件存储
   - 实现历史记录的CRUD操作
   - 实现数据同步机制
   - 处理历史记录排序（最新记录置顶）

### 4.2 前端实现
1. 增强存储服务 (storage.ts)
```typescript
interface StorageService {
    saveHistory(history: ChatHistory[], key?: string): void;
    loadHistory(key?: string): ChatHistory[];
    clearHistory(key?: string): void;
}

class EnhancedStorageService {
    // 本地存储
    private localStorageService: StorageService;
    // 远程同步
    private remoteStorageService: RemoteStorageService;
    
    async saveHistory(history: ChatHistory[], key: string): Promise<void>;
    async loadHistory(key: string): Promise<ChatHistory[]>;
    async deleteHistory(historyId: number, key: string): Promise<void>;
    async renameHistory(historyId: number, newTitle: string, key: string): Promise<void>;
    
    // 监听历史记录变化
    private watchHistoryChanges(key: string): void {
        // 使用Vue的watch API监听变化并同步
        watch(this.chatHistory, (newHistory) => {
            this.syncToServer(newHistory, key);
        }, { deep: true });
    }
    
    // 处理冲突
    private async resolveConflicts(
        localHistory: ChatHistory[], 
        serverHistory: ChatHistory[]
    ): Promise<ChatHistory[]>;
}
```

2. 修改历史记录组件 (HistoryPanel.vue)
   - 保持现有的UI和交互逻辑
   - 集成增强的存储服务
   - 添加操作状态和错误提示
   - 维护现有的功能:
     ```typescript
     // 组件功能
     interface HistoryPanelProps {
         storageKey?: string;  // 区分不同页面的历史记录
     }
     
     interface HistoryPanelEmits {
         select: (history: ChatHistory) => void;
         'new-chat': () => void;
         update: (history: ChatHistory) => void;
     }
     
     // 核心方法
     const updateOrCreateHistory = (messages: Message[]) => {
         // 保持现有的标题生成逻辑
         // 保持最新记录置顶的排序
         // 添加服务器同步
     }
     ```

3. 更新历史记录Hook (useHistory.ts)
   - 实现本地和远程存储的统一管理
   - 处理所有历史记录操作的同步
   - 维护最新记录置顶的排序逻辑
   - 保持现有功能:
     ```typescript
     export function useHistory(storageKey: string = 'default-history') {
         const chatHistory = ref<ChatHistory[]>([]);
         const editingHistory = ref<ChatHistory | null>(null);
         
         // 核心方法
         const selectHistory = (history: ChatHistory) => {...}
         const editHistory = (history: ChatHistory) => {...}
         const deleteHistory = () => {...}
         const addHistory = (history: ChatHistory) => {
             chatHistory.value.unshift(history);  // 保持最新记录置顶
         }
         
         // 添加服务器同步
         const syncWithServer = async () => {...}
         
         // 监听变化
         watch(chatHistory, async (newHistory) => {
             await syncWithServer();
         }, { deep: true });
     }
     ```

4. 添加用户识别模块
   - 实现指纹收集
   - 实现本地存储
   - 实现自动重连和恢复

### 4.3 数据同步策略
1. 启动同步
   - 应用启动时进行初始同步
   - 验证本地存储的用户ID
   - 合并本地和服务器数据

2. 操作同步
   - 新增记录：立即同步到服务器
   - 删除记录：
     ```typescript
     // 删除操作流程
     const deleteHistory = async () => {
         if (!editingHistory.value) return
         
         // 1. 从列表中删除
         const index = chatHistory.value.findIndex(h => h.id === editingHistory.value?.id)
         if (index !== -1) {
             chatHistory.value.splice(index, 1)
         }
         
         // 2. 清理状态并触发新对话
         selectedHistoryId.value = null  // 清除选中状态
         editingHistory.value = null     // 清除编辑状态
         emit('new-chat')                // 触发新对话，清理右侧面板
         
         // 3. 同步到服务器
         await remoteStorageService.deleteHistory(historyId, storageKey)
         
         deleteDialogVisible.value = false
     }
     ```
   - 重命名：同步更新操作
   - 保持最新记录置顶排序

3. 增量同步
   - 定期同步新增历史记录
   - 处理同步冲突
   - 使用时间戳和版本号

4. 错误处理
   - 实现重试机制
   - 本地缓存保护
   - 同步失败的用户提示

## 5. 隐私和安全考虑

### 5.1 数据收集
- 仅收集必要的识别信息
- 提供清晰的隐私声明
- 实现数据过期清理

### 5.2 安全措施
- 数据传输加密
- 服务器端验证
- 防止ID伪造

## 6. 测试计划

### 6.1 单元测试
- 用户识别准确性测试
- 数据持久化测试
- 同步机制测试

### 6.2 集成测试
- 前后端交互测试
- 数据一致性测试
- 性能和负载测试

## 7. 部署和维护

### 7.1 部署要求
- 确保文件系统权限
- 配置定期备份
- 监控系统设置

### 7.2 维护计划
- 定期数据清理
- 性能监控
- 错误日志分析
