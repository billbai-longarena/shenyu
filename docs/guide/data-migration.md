# 数据迁移指南

本指南将帮助您管理和迁移Shenyu项目中的数据。

## 数据目录结构

```
packages/backend/data/
├── users/                 # 用户数据
│   ├── user1.json        # 用户配置文件
│   └── user2.json
├── histories/            # 历史记录
│   ├── user1/           # 用户历史记录目录
│   │   ├── chat1.json   # 对话记录
│   │   └── chat2.json
│   └── user2/
└── example/             # 示例数据
    ├── user.json       # 示例用户
    └── history/        # 示例历史记录
```

## 数据备份

### 1. 手动备份

```bash
# 备份整个数据目录
cp -r packages/backend/data ./backup/data_$(date +%Y%m%d)

# 仅备份用户数据
cp -r packages/backend/data/users ./backup/users_$(date +%Y%m%d)

# 仅备份历史记录
cp -r packages/backend/data/histories ./backup/histories_$(date +%Y%m%d)
```

### 2. 自动备份脚本

创建`backup.sh`：

```bash
#!/bin/bash

# 配置
BACKUP_DIR="./backup"  # 根据实际情况修改备份目录
DATA_DIR="packages/backend/data"
RETENTION_DAYS=30

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 创建备份
BACKUP_NAME="shenyu_data_$(date +%Y%m%d_%H%M%S)"
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" "$DATA_DIR"

# 删除旧备份
find "$BACKUP_DIR" -name "shenyu_data_*.tar.gz" -mtime +$RETENTION_DAYS -delete
```

添加到crontab：

```bash
# 每天凌晨3点执行备份
0 3 * * * /your/path/to/backup.sh  # 替换为实际的脚本路径
```

## 数据迁移

### 1. 导出数据

```bash
# 创建迁移脚本
cat > export_data.js << 'EOF'
const fs = require('fs');
const path = require('path');

const exportData = async () => {
  const dataDir = path.join(__dirname, 'packages/backend/data');
  const exportDir = path.join(__dirname, 'export');

  // 创建导出目录
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }

  // 导出用户数据
  const users = {};
  const usersDir = path.join(dataDir, 'users');
  const userFiles = fs.readdirSync(usersDir);
  
  for (const file of userFiles) {
    const userData = JSON.parse(fs.readFileSync(path.join(usersDir, file)));
    users[file.replace('.json', '')] = userData;
  }

  // 导出历史记录
  const histories = {};
  const historiesDir = path.join(dataDir, 'histories');
  const historyDirs = fs.readdirSync(historiesDir);

  for (const dir of historyDirs) {
    const userHistories = [];
    const userHistoryDir = path.join(historiesDir, dir);
    const historyFiles = fs.readdirSync(userHistoryDir);

    for (const file of historyFiles) {
      const historyData = JSON.parse(fs.readFileSync(path.join(userHistoryDir, file)));
      userHistories.push(historyData);
    }

    histories[dir] = userHistories;
  }

  // 保存导出数据
  const exportData = {
    users,
    histories,
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  };

  fs.writeFileSync(
    path.join(exportDir, 'export.json'),
    JSON.stringify(exportData, null, 2)
  );
};

exportData().catch(console.error);
EOF

# 执行导出
node export_data.js
```

### 2. 导入数据

```bash
# 创建导入脚本
cat > import_data.js << 'EOF'
const fs = require('fs');
const path = require('path');

const importData = async () => {
  const importFile = path.join(__dirname, 'export/export.json');
  const dataDir = path.join(__dirname, 'packages/backend/data');

  // 读取导入数据
  const importData = JSON.parse(fs.readFileSync(importFile));

  // 导入用户数据
  const usersDir = path.join(dataDir, 'users');
  if (!fs.existsSync(usersDir)) {
    fs.mkdirSync(usersDir, { recursive: true });
  }

  for (const [userId, userData] of Object.entries(importData.users)) {
    fs.writeFileSync(
      path.join(usersDir, `${userId}.json`),
      JSON.stringify(userData, null, 2)
    );
  }

  // 导入历史记录
  const historiesDir = path.join(dataDir, 'histories');
  if (!fs.existsSync(historiesDir)) {
    fs.mkdirSync(historiesDir, { recursive: true });
  }

  for (const [userId, histories] of Object.entries(importData.histories)) {
    const userHistoryDir = path.join(historiesDir, userId);
    if (!fs.existsSync(userHistoryDir)) {
      fs.mkdirSync(userHistoryDir);
    }

    histories.forEach((history, index) => {
      fs.writeFileSync(
        path.join(userHistoryDir, `${index}.json`),
        JSON.stringify(history, null, 2)
      );
    });
  }
};

importData().catch(console.error);
EOF

# 执行导入
node import_data.js
```

## 数据清理

### 1. 清理过期数据

```bash
# 创建清理脚本
cat > cleanup_data.js << 'EOF'
const fs = require('fs');
const path = require('path');

const cleanupData = async () => {
  const dataDir = path.join(__dirname, 'packages/backend/data');
  const historiesDir = path.join(dataDir, 'histories');
  const retentionDays = 90; // 保留90天的历史记录

  const now = Date.now();
  const dirs = fs.readdirSync(historiesDir);

  for (const dir of dirs) {
    const userHistoryDir = path.join(historiesDir, dir);
    const files = fs.readdirSync(userHistoryDir);

    for (const file of files) {
      const filePath = path.join(userHistoryDir, file);
      const stats = fs.statSync(filePath);
      const daysOld = (now - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

      if (daysOld > retentionDays) {
        fs.unlinkSync(filePath);
      }
    }
  }
};

cleanupData().catch(console.error);
EOF

# 执行清理
node cleanup_data.js
```

### 2. 数据压缩

```bash
# 创建压缩脚本
cat > compress_data.js << 'EOF'
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const compressData = async () => {
  const dataDir = path.join(__dirname, 'packages/backend/data');
  const historiesDir = path.join(dataDir, 'histories');

  const dirs = fs.readdirSync(historiesDir);

  for (const dir of dirs) {
    const userHistoryDir = path.join(historiesDir, dir);
    const files = fs.readdirSync(userHistoryDir);

    for (const file of files) {
      if (!file.endsWith('.gz')) {
        const filePath = path.join(userHistoryDir, file);
        const content = fs.readFileSync(filePath);
        const compressed = zlib.gzipSync(content);
        fs.writeFileSync(`${filePath}.gz`, compressed);
        fs.unlinkSync(filePath);
      }
    }
  }
};

compressData().catch(console.error);
EOF

# 执行压缩
node compress_data.js
```

## 数据验证

### 1. 数据完整性检查

```bash
# 创建验证脚本
cat > validate_data.js << 'EOF'
const fs = require('fs');
const path = require('path');

const validateData = async () => {
  const dataDir = path.join(__dirname, 'packages/backend/data');
  const errors = [];

  // 验证用户数据
  const usersDir = path.join(dataDir, 'users');
  const userFiles = fs.readdirSync(usersDir);

  for (const file of userFiles) {
    try {
      const userData = JSON.parse(fs.readFileSync(path.join(usersDir, file)));
      if (!userData.id || !userData.created_at) {
        errors.push(`Invalid user data in ${file}`);
      }
    } catch (e) {
      errors.push(`Error reading user file ${file}: ${e.message}`);
    }
  }

  // 验证历史记录
  const historiesDir = path.join(dataDir, 'histories');
  const historyDirs = fs.readdirSync(historiesDir);

  for (const dir of historyDirs) {
    const userHistoryDir = path.join(historiesDir, dir);
    const historyFiles = fs.readdirSync(userHistoryDir);

    for (const file of historyFiles) {
      try {
        const historyData = JSON.parse(fs.readFileSync(path.join(userHistoryDir, file)));
        if (!historyData.messages || !Array.isArray(historyData.messages)) {
          errors.push(`Invalid history data in ${dir}/${file}`);
        }
      } catch (e) {
        errors.push(`Error reading history file ${dir}/${file}: ${e.message}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('Data validation errors:');
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  } else {
    console.log('Data validation successful');
  }
};

validateData().catch(console.error);
EOF

# 执行验证
node validate_data.js
```

## 故障恢复

### 1. 从备份恢复

```bash
# 恢复整个数据目录
tar -xzf ./backup/shenyu_data_[timestamp].tar.gz -C ./restore/

# 恢复特定用户数据
cp ./backup/users_[timestamp]/[user].json packages/backend/data/users/

# 恢复特定历史记录
cp -r ./backup/histories_[timestamp]/[user_id] packages/backend/data/histories/
```

### 2. 数据修复

如果发现数据损坏，可以使用以下步骤：

1. 停止服务
2. 备份当前数据
3. 运行验证脚本找出问题
4. 从最近的备份恢复受影响的文件
5. 重新运行验证脚本
6. 重启服务

## 最佳实践

1. 定期备份
   - 每天进行增量备份
   - 每周进行完整备份
   - 保留至少30天的备份历史

2. 数据安全
   - 加密敏感数据
   - 限制数据目录访问权限
   - 监控异常访问

3. 性能优化
   - 定期清理过期数据
   - 压缩历史记录
   - 实施数据分页

4. 监控
   - 监控数据目录大小
   - 监控备份状态
   - 设置告警阈值
