# Data Migration Guide

This guide will help you manage and migrate data in the Shenyu project.

## Data Directory Structure

```
packages/backend/data/
├── users/                 # User data
│   ├── user1.json        # User configuration files
│   └── user2.json
├── histories/            # Chat histories
│   ├── user1/           # User history directory
│   │   ├── chat1.json   # Chat records
│   │   └── chat2.json
│   └── user2/
└── example/             # Example data
    ├── user.json       # Example user
    └── history/        # Example history
```

## Data Backup

### 1. Manual Backup

```bash
# Backup entire data directory
cp -r packages/backend/data /path/to/backup/data_$(date +%Y%m%d)

# Backup only user data
cp -r packages/backend/data/users /path/to/backup/users_$(date +%Y%m%d)

# Backup only histories
cp -r packages/backend/data/histories /path/to/backup/histories_$(date +%Y%m%d)
```

### 2. Automatic Backup Script

Create `backup.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/path/to/backup"
DATA_DIR="packages/backend/data"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup
BACKUP_NAME="shenyu_data_$(date +%Y%m%d_%H%M%S)"
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" "$DATA_DIR"

# Delete old backups
find "$BACKUP_DIR" -name "shenyu_data_*.tar.gz" -mtime +$RETENTION_DAYS -delete
```

Add to crontab:

```bash
# Run backup at 3 AM daily
0 3 * * * /path/to/backup.sh
```

## Data Migration

### 1. Export Data

```bash
# Create migration script
cat > export_data.js << 'EOF'
const fs = require('fs');
const path = require('path');

const exportData = async () => {
  const dataDir = path.join(__dirname, 'packages/backend/data');
  const exportDir = path.join(__dirname, 'export');

  // Create export directory
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }

  // Export user data
  const users = {};
  const usersDir = path.join(dataDir, 'users');
  const userFiles = fs.readdirSync(usersDir);
  
  for (const file of userFiles) {
    const userData = JSON.parse(fs.readFileSync(path.join(usersDir, file)));
    users[file.replace('.json', '')] = userData;
  }

  // Export histories
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

  // Save export data
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

# Run export
node export_data.js
```

### 2. Import Data

```bash
# Create import script
cat > import_data.js << 'EOF'
const fs = require('fs');
const path = require('path');

const importData = async () => {
  const importFile = path.join(__dirname, 'export/export.json');
  const dataDir = path.join(__dirname, 'packages/backend/data');

  // Read import data
  const importData = JSON.parse(fs.readFileSync(importFile));

  // Import user data
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

  // Import histories
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

# Run import
node import_data.js
```

## Data Cleanup

### 1. Clean Expired Data

```bash
# Create cleanup script
cat > cleanup_data.js << 'EOF'
const fs = require('fs');
const path = require('path');

const cleanupData = async () => {
  const dataDir = path.join(__dirname, 'packages/backend/data');
  const historiesDir = path.join(dataDir, 'histories');
  const retentionDays = 90; // Keep 90 days of history

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

# Run cleanup
node cleanup_data.js
```

### 2. Data Compression

```bash
# Create compression script
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

# Run compression
node compress_data.js
```

## Data Validation

### 1. Data Integrity Check

```bash
# Create validation script
cat > validate_data.js << 'EOF'
const fs = require('fs');
const path = require('path');

const validateData = async () => {
  const dataDir = path.join(__dirname, 'packages/backend/data');
  const errors = [];

  // Validate user data
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

  // Validate histories
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

# Run validation
node validate_data.js
```

## Disaster Recovery

### 1. Restore from Backup

```bash
# Restore entire data directory
tar -xzf /path/to/backup/shenyu_data_20250210.tar.gz -C /path/to/restore/

# Restore specific user data
cp /path/to/backup/users_20250210/specific_user.json packages/backend/data/users/

# Restore specific history
cp -r /path/to/backup/histories_20250210/user_id packages/backend/data/histories/
```

### 2. Data Recovery

If data corruption is detected, follow these steps:

1. Stop the service
2. Backup current data
3. Run validation script to identify issues
4. Restore affected files from recent backup
5. Re-run validation script
6. Restart service

## Best Practices

1. Regular Backups
   - Daily incremental backups
   - Weekly full backups
   - Retain at least 30 days of backup history

2. Data Security
   - Encrypt sensitive data
   - Restrict data directory permissions
   - Monitor for unusual access

3. Performance Optimization
   - Regular cleanup of expired data
   - Compress history records
   - Implement data pagination

4. Monitoring
   - Monitor data directory size
   - Monitor backup status
   - Set alert thresholds
