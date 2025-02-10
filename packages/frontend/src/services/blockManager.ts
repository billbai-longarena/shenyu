import { ref } from 'vue'

export interface BlockContext {
    index: number;
    content: string;
    chunks: string[];
    status: 'pending' | 'streaming' | 'completed' | 'error';
    error?: string;
    startTime?: number;
    endTime?: number;
}

export class BlockManager {
    private blocks = new Map<number, BlockContext>();
    private completedCount = ref(0);
    private totalCount = ref(0);
    private isExecuting = ref(false);

    constructor(totalBlocks: number) {
        this.totalCount.value = totalBlocks;
        // 初始化所有block的上下文
        for (let i = 0; i < totalBlocks; i++) {
            this.blocks.set(i, {
                index: i,
                content: '',
                chunks: [],
                status: 'pending'
            });
        }
    }

    // 获取block上下文
    getBlock(index: number): BlockContext | undefined {
        return this.blocks.get(index);
    }

    // 更新block内容
    updateBlockContent(index: number, chunk: string): void {
        const block = this.blocks.get(index);
        if (block) {
            if (block.status === 'pending') {
                block.status = 'streaming';
                block.startTime = Date.now();
                console.log(`[BlockManager] Block ${index} started streaming`);
            }
            block.chunks.push(chunk);
            block.content += chunk;
        }
    }

    // 标记block完成
    completeBlock(index: number): void {
        const block = this.blocks.get(index);
        // 只有当block存在且状态不是completed时才更新
        if (block && block.status !== 'completed') {
            block.status = 'completed';
            block.endTime = Date.now();
            this.completedCount.value++;
            console.log(`[BlockManager] Block ${index} completed. Total completed: ${this.completedCount.value}/${this.totalCount.value}`);
        }
    }

    // 标记block错误
    errorBlock(index: number, error: string): void {
        const block = this.blocks.get(index);
        if (block) {
            block.status = 'error';
            block.error = error;
            block.endTime = Date.now();
            this.completedCount.value++;
            console.log(`[BlockManager] Block ${index} errored: ${error}. Total completed: ${this.completedCount.value}/${this.totalCount.value}`);
        }
    }

    // 获取完成进度
    getProgress(): { completed: number; total: number; percentage: number } {
        return {
            completed: this.completedCount.value,
            total: this.totalCount.value,
            percentage: Math.min(Math.floor((this.completedCount.value / this.totalCount.value) * 100), 100)
        };
    }

    // 获取所有block的状态
    getAllBlockStatuses(): BlockContext[] {
        return Array.from(this.blocks.values());
    }

    // 获取指定block的处理时间
    getBlockProcessingTime(index: number): number | undefined {
        const block = this.blocks.get(index);
        if (block && block.startTime && block.endTime) {
            return block.endTime - block.startTime;
        }
        return undefined;
    }

    // 重置管理器状态
    reset(): void {
        this.blocks.clear();
        this.completedCount.value = 0;
        this.totalCount.value = 0;
        this.isExecuting.value = false;
    }

    // 开始执行
    startExecution(): void {
        this.isExecuting.value = true;
        console.log('[BlockManager] Execution started');
    }

    // 结束执行
    endExecution(): void {
        this.isExecuting.value = false;
        console.log('[BlockManager] Execution ended');
    }

    // 检查是否正在执行
    isCurrentlyExecuting(): boolean {
        return this.isExecuting.value;
    }

    // 检查是否所有block都已完成
    isAllCompleted(): boolean {
        const allCompleted = this.completedCount.value === this.totalCount.value;
        console.log(`[BlockManager] Checking completion status: ${this.completedCount.value}/${this.totalCount.value} completed`);
        if (allCompleted) {
            console.log('[BlockManager] All blocks are completed');
        }
        return allCompleted;
    }

    // 获取block的内容
    getBlockContent(index: number): string {
        return this.blocks.get(index)?.content || '';
    }
}
