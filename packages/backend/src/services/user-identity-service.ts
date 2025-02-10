import { Request } from 'express';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface BrowserFingerprint {
    userAgent: string;
    language: string;
    colorDepth: number;
    screenResolution: string;
    timezone: string;
    cookiesEnabled: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    fonts: string[];
    canvasFingerprint: string;
    webglVendor: string;
    webglRenderer: string;
}

export interface UserIdentity {
    id: string;
    fingerprint: BrowserFingerprint;
    firstSeen: string;
    lastSeen: string;
}

export class UserIdentityService {
    private readonly dataDir = path.join(process.cwd(), 'data', 'users');

    constructor() {
        // 确保数据目录存在
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    /**
     * 生成用户标识符
     */
    private generateUserId(fingerprint: BrowserFingerprint): string {
        const components = [
            fingerprint.userAgent,
            fingerprint.screenResolution,
            fingerprint.timezone,
            fingerprint.canvasFingerprint,
            // 添加IP地址作为辅助识别
            fingerprint.webglVendor,
            fingerprint.webglRenderer,
            // 添加随机盐值增加唯一性
            crypto.randomBytes(16).toString('hex')
        ];

        return crypto
            .createHash('sha256')
            .update(components.join('|'))
            .digest('hex');
    }

    /**
     * 保存用户身份信息
     */
    private async saveUserIdentity(identity: UserIdentity): Promise<void> {
        const filePath = path.join(this.dataDir, `${identity.id}.json`);
        await fs.promises.writeFile(
            filePath,
            JSON.stringify(identity, null, 2),
            'utf8'
        );
    }

    /**
     * 加载用户身份信息
     */
    private async loadUserIdentity(userId: string): Promise<UserIdentity | null> {
        const filePath = path.join(this.dataDir, `${userId}.json`);
        try {
            const data = await fs.promises.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }

    /**
     * 计算指纹相似度
     */
    private calculateFingerprintSimilarity(
        fp1: BrowserFingerprint,
        fp2: BrowserFingerprint
    ): number {
        let matches = 0;
        let total = 0;

        // 比较每个特征
        for (const key of Object.keys(fp1) as Array<keyof BrowserFingerprint>) {
            total++;
            if (fp1[key] === fp2[key]) {
                matches++;
            }
        }

        return matches / total;
    }

    /**
     * 识别或创建用户身份
     */
    async identifyUser(
        fingerprint: BrowserFingerprint,
        req: Request
    ): Promise<{ userId: string; isNewUser: boolean }> {
        // 遍历现有用户，查找匹配
        const files = await fs.promises.readdir(this.dataDir);
        let bestMatch: { userId: string; similarity: number } | null = null;

        for (const file of files) {
            if (!file.endsWith('.json')) continue;

            const userId = file.replace('.json', '');
            const identity = await this.loadUserIdentity(userId);
            if (!identity) continue;

            const similarity = this.calculateFingerprintSimilarity(
                fingerprint,
                identity.fingerprint
            );

            // 设置相似度阈值
            if (similarity > 0.8 && (!bestMatch || similarity > bestMatch.similarity)) {
                bestMatch = { userId, similarity };
            }
        }

        if (bestMatch) {
            // 更新现有用户
            const identity = await this.loadUserIdentity(bestMatch.userId);
            if (identity) {
                identity.lastSeen = new Date().toISOString();
                await this.saveUserIdentity(identity);
                return { userId: identity.id, isNewUser: false };
            }
        }

        // 创建新用户
        const newUserId = this.generateUserId(fingerprint);
        const newIdentity: UserIdentity = {
            id: newUserId,
            fingerprint,
            firstSeen: new Date().toISOString(),
            lastSeen: new Date().toISOString()
        };

        await this.saveUserIdentity(newIdentity);
        return { userId: newUserId, isNewUser: true };
    }

    /**
     * 获取用户身份信息
     */
    async getUserIdentity(userId: string): Promise<UserIdentity | null> {
        return this.loadUserIdentity(userId);
    }

    /**
     * 更新用户最后访问时间
     */
    async updateLastSeen(userId: string): Promise<void> {
        const identity = await this.loadUserIdentity(userId);
        if (identity) {
            identity.lastSeen = new Date().toISOString();
            await this.saveUserIdentity(identity);
        }
    }
}

// 导出单例实例
export const userIdentityService = new UserIdentityService();
