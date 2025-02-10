#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定义兼容的许可证列表
const compatibleLicenses = [
    'MIT',
    'ISC',
    'BSD',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'Apache-2.0',
    'Apache License 2.0',
    '0BSD',
    'CC0-1.0',
    'Unlicense'
];

// 定义需要特别注意的许可证
const warningLicenses = [
    'GPL',
    'LGPL',
    'AGPL',
    'MPL',
    'EPL'
];

function checkPackage(packagePath) {
    console.log(`\nChecking dependencies in ${packagePath}`);
    console.log('='.repeat(50));

    // 运行npm list命令获取依赖树
    try {
        const output = execSync('npm list --json --all', {
            cwd: path.dirname(packagePath)
        });
        const dependencies = JSON.parse(output.toString());

        // 获取所有依赖的许可证信息
        const licenses = {};
        function traverseDependencies(deps) {
            if (!deps) return;
            Object.entries(deps).forEach(([name, info]) => {
                if (info.license) {
                    licenses[name] = info.license;
                }
                if (info.dependencies) {
                    traverseDependencies(info.dependencies);
                }
            });
        }

        traverseDependencies(dependencies.dependencies);

        // 分析结果
        const issues = [];
        const warnings = [];
        const compatible = [];

        Object.entries(licenses).forEach(([name, license]) => {
            if (compatibleLicenses.some(l => license.includes(l))) {
                compatible.push(`${name}: ${license}`);
            } else if (warningLicenses.some(l => license.includes(l))) {
                warnings.push(`${name}: ${license}`);
            } else {
                issues.push(`${name}: ${license}`);
            }
        });

        // 输出结果
        console.log('\n✅ Compatible Licenses:');
        compatible.forEach(item => console.log(`  - ${item}`));

        if (warnings.length > 0) {
            console.log('\n⚠️  Warning - Licenses that need review:');
            warnings.forEach(item => console.log(`  - ${item}`));
        }

        if (issues.length > 0) {
            console.log('\n❌ Potentially Incompatible Licenses:');
            issues.forEach(item => console.log(`  - ${item}`));
        }

        return {
            compatible: compatible.length,
            warnings: warnings.length,
            issues: issues.length
        };
    } catch (error) {
        console.error(`Error checking ${packagePath}:`, error.message);
        return null;
    }
}

// 检查主要的package.json文件
const packages = [
    path.join(__dirname, '../package.json'),
    path.join(__dirname, '../packages/frontend/package.json'),
    path.join(__dirname, '../packages/backend/package.json')
];

let totalIssues = 0;
let totalWarnings = 0;

packages.forEach(packagePath => {
    if (fs.existsSync(packagePath)) {
        const results = checkPackage(packagePath);
        if (results) {
            totalIssues += results.issues;
            totalWarnings += results.warnings;
        }
    } else {
        console.error(`Package file not found: ${packagePath}`);
    }
});

// 输出总结
console.log('\nSummary');
console.log('='.repeat(50));
if (totalIssues === 0 && totalWarnings === 0) {
    console.log('✅ All dependencies have compatible licenses');
    process.exit(0);
} else {
    console.log(`Found ${totalIssues} potential issues and ${totalWarnings} warnings`);
    process.exit(totalIssues > 0 ? 1 : 0);
}
