export type ModelType = 
  | 'deepseek'
  | 'kimi'
  | 'yiwan'
  | 'tencentDeepseek'
  | 'siliconDeepseek'
  | 'baiduDeepseek'
  | 'qwen-turbo-latest'
  | 'alideepseekv3';

export function getCurrentModel(): ModelType;
export function setModel(model: ModelType): void;
export function setTemperature(temp: number): void;
export function RequestAI(
    prompt: string,
    onChunk: (chunk: string) => void
): Promise<void>;
