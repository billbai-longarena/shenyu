import { ref } from 'vue'
import type { ModelType } from '../api/api-deepseekStream'

interface ModelConfig {
    maxTokens: number;
    temperatureRange: {
        min: number;
        max: number;
        default: number;
        presets: {
            conservative: number;
            balanced: number;
            creative: number;
        };
    };
}

interface ModelConfigs {
    modelConfigs: {
        [key in ModelType]: ModelConfig;
    };
}

let cachedConfigs: ModelConfigs | null = null;

export function useModelConfig() {
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    async function loadModelConfigs(): Promise<ModelConfigs> {
        if (cachedConfigs) {
            return cachedConfigs;
        }

        isLoading.value = true;
        error.value = null;

        try {
            const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
            const port = import.meta.env.PROD ? '' : ':3001';
            const response = await fetch(`${protocol}//${window.location.hostname}${port}/api/model-config`);
            
            if (!response.ok) {
                throw new Error('Failed to load model configurations');
            }
            
            const configs = await response.json() as ModelConfigs;
            cachedConfigs = configs;
            return configs;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Unknown error';
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    async function getModelMaxTokens(model: ModelType): Promise<number> {
        if (!cachedConfigs) {
            await loadModelConfigs();
        }
        if (!cachedConfigs?.modelConfigs[model]) {
            console.warn(`No config found for model ${model}, using default max_tokens 4096`);
            return 4096;
        }
        return cachedConfigs.modelConfigs[model].maxTokens;
    }

    return {
        isLoading,
        error,
        loadModelConfigs,
        getModelMaxTokens
    }
}
