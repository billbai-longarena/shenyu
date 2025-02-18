<template>
  <el-container class="layout-container">
    <el-header>
      <div class="header-container">
        <el-menu
          :router="true"
          mode="horizontal"
          :default-active="$route.path"
        >
          <el-menu-item index="/chat">
            <el-icon><ChatDotRound /></el-icon>
            {{ t('menu.chat') }}
          </el-menu-item>
          <el-menu-item index="/sn43">
            <el-icon><Grid /></el-icon>
            {{ t('menu.agent') }}
          </el-menu-item>
          <el-menu-item index="/tab3" disabled>
            <el-icon><Grid /></el-icon>
            {{ t('menu.feature3') }}
          </el-menu-item>
          <el-menu-item index="/tab4" disabled>
            <el-icon><Grid /></el-icon>
            {{ t('menu.feature4') }}
          </el-menu-item>
        </el-menu>
<div class="model-controls">
  <span v-if="clientCount !== null" style="font-size: 16px; font-weight: 500; color: #409EFF;">{{ clientCount }}</span>
  <span v-else style="font-size: 16px; font-weight: 500; color: #909399;">-</span>
  <el-button
    type="primary"
    :loading="isTesting"
    :disabled="isTesting"
    @click="testModelSpeed"
    style="margin-right: 10px"
  >
    {{ t('controls.speedTest') }}
  </el-button>
          <el-select
            v-model="selectedModel"
            :placeholder="t('controls.modelSelect')"
            style="width: 300px"
          >
            <template #prefix>
              <span v-if="modelOptions.find(opt => opt.value === selectedModel)?.speed?.status === 'none'" style="color: #909399">-</span>
              <span v-else-if="modelOptions.find(opt => opt.value === selectedModel)?.speed?.status === 'error'">
                <el-icon><CircleClose style="color: #F56C6C" /></el-icon>
              </span>
              <span v-else :style="{ color: getSpeedColor(modelOptions.find(opt => opt.value === selectedModel)?.speed?.responseTime) }">
                {{ Math.round(modelOptions.find(opt => opt.value === selectedModel)?.speed?.responseTime || 0) }}token/s
              </span>
            </template>
            <el-option
              v-for="option in modelOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            >
              <div style="display: flex; justify-content: space-between; align-items: center; width: 100%">
                <span style="flex: 1; overflow: hidden; text-overflow: ellipsis;">{{ option.label }}</span>
                <span style="margin-left: 15px; min-width: 80px; text-align: right;">
                  <span v-if="option.speed?.status === 'none'" style="color: #909399">-</span>
                  <span v-else-if="option.speed?.status === 'error'">
                    <el-icon><CircleClose style="color: #F56C6C" /></el-icon>
                  </span>
                  <span v-else :style="{ color: getSpeedColor(option.speed?.responseTime) }">
                    {{ Math.round(option.speed?.responseTime || 0) }}token/s
                  </span>
                </span>
              </div>
            </el-option>
          </el-select>
          <el-select
            v-model="selectedTemperature"
            :placeholder="t('controls.paramSelect')"
            style="width: 150px"
          >
            <el-option
              v-for="option in temperatureOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-button
            type="primary"
            @click="saveAsDefault"
            :loading="isSaving"
          >
            {{ t('controls.setDefault') }}
          </el-button>
          <el-tooltip
            :content="t('github.tooltip')"
            placement="bottom"
          >
            <a 
              href="https://github.com/billbai-longarena/shenyu.git"
              target="_blank"
              style="text-decoration: none;"
            >
              <el-button
                type="primary"
                link
              >
                <el-icon><Share /></el-icon>
                {{ t('github.viewOnGithub') }}
              </el-button>
            </a>
          </el-tooltip>
          <el-switch
            v-model="isEnglish"
            active-text="EN"
            inactive-text="CN"
            inline-prompt
            @change="toggleLanguage"
            style="margin-left: 10px"
          />
        </div>
      </div>
    </el-header>
    
    <el-main>
      <router-view></router-view>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ChatDotRound, Grid, CircleClose, Share } from '@element-plus/icons-vue'
import { ref, watch, computed, onMounted, onUnmounted, provide } from 'vue'
import { setTemperature, RequestAI, setModel } from './api/api-deepseekStream'
import type { ModelType } from './api/api-deepseekStream'
import { useModelConfig } from './composables/useModelConfig'
import { useModelDefaults } from './composables/useModelDefaults'
import { useClientCount } from './composables/useClientCount'
import { useLanguage } from './composables/useLanguage'

let pollTimer: number | null = null
const { clientCount, fetchClientCount, initWebSocket, closeWebSocket } = useClientCount()
const { loadDefaults, saveDefaults } = useModelDefaults()
const { getModelMaxTokens } = useModelConfig()
const { t, currentLanguage, loadDefaultLanguage, toggleLanguage } = useLanguage()
const isSaving = ref(false)
const isEnglish = ref(currentLanguage.value === 'en')

// 监听语言变化
watch(currentLanguage, (newValue) => {
  isEnglish.value = newValue === 'en'
})

// 保存为默认配置
const saveAsDefault = async () => {
    isSaving.value = true
    try {
        await saveDefaults(selectedModel.value, selectedTemperature.value)
    } finally {
        isSaving.value = false
    }
}

// 加载默认配置
const loadDefaultSettings = async () => {
    const defaults = await loadDefaults()
    if (defaults) {
        selectedModel.value = defaults.defaultModel
        selectedTemperature.value = defaults.defaultTemperature
    }
}

onMounted(() => {
    Promise.all([
        loadDefaultSettings().then(() => {
            // 确保在加载默认设置后设置初始模型
            setModel(selectedModel.value)
        }),
        loadDefaultLanguage()
    ])
    // 初始化WebSocket连接
    initWebSocket()
    // 启动定时器，每1秒获取一次客户端数量作为备份机制
    pollTimer = window.setInterval(fetchClientCount, 1000)
})

onUnmounted(() => {
    // 清理定时器
    if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
    }
    // 关闭WebSocket连接
    closeWebSocket()
})

interface ModelOption {
  label: string;
  value: ModelType;
  speed?: {
    responseTime?: number;
    status: 'none' | 'fast' | 'medium' | 'slow' | 'error';
  };
}

// 模型和参数选项
const modelOptions = ref<ModelOption[]>([
  { label: 'kimi-8k', value: 'kimi', speed: { status: 'none' } },  
  { label: '火山DeepseekV3', value: 'volcesDeepseek', speed: { status: 'none' } },
  { label: '火山DeepseekR1', value: 'volcesDeepseekR1', speed: { status: 'none' } },
  { label: 'Ali DeepSeekV3', value: 'alideepseekv3', speed: { status: 'none' } },
  { label: '腾讯云DeepseekV3', value: 'tencentDeepseek', speed: { status: 'none' } },
  { label: 'deepseek V3', value: 'deepseek', speed: { status: 'none' } },
  { label: '零一万物', value: 'yiwan', speed: { status: 'none' } },
  
  { label: '硅基流动DeepseekV3', value: 'siliconDeepseek', speed: { status: 'none' } },
 { label: '百度DeepSeekV3', value: 'baiduDeepseek', speed: { status: 'none' } },
  { label: 'Qwen 2.5 Plus', value: 'qwen-turbo-latest', speed: { status: 'none' } },
  
  
  { label: 'Ali DeepSeek R1', value: 'alideepseekr1', speed: { status: 'none' } },
  { label: 'MiniMax-Text-01', value: 'minimax-text', speed: { status: 'none' } }
])

//后端会根据模型的temperatureRange自动处理temperature范围
const temperatureOptions = computed(() => {
  return [
    { label: t('modelParams.conservative'), value: 0 },
    { label: t('modelParams.balanced'), value: 0.5 },
    { label: t('modelParams.creative'), value: 0.9 }
  ]
})

const selectedModel = ref<ModelType>('kimi')
provide('selectedModel', selectedModel)  // 提供给子组件使用
const selectedTemperature = ref(0.7) // 默认为通用对话和翻译模式
provide('selectedTemperature', selectedTemperature)  // 提供温度设置给子组件使用
const isTesting = ref(false)

// 获取速度对应的颜色
function getSpeedColor(speed?: number): string {
  if (!speed) return '#909399'
  if (speed > 20) return '#67C23A'  // 每秒20个token以上为快
  if (speed > 10) return '#E6A23C'  // 每秒10-20个token为中等
  return '#F56C6C'  // 每秒10个token以下为慢
}

// 测试单个模型的函数
async function testSingleModel(model: ModelType, label: string): Promise<{
  responseTime?: number;
  status: 'none' | 'fast' | 'medium' | 'slow' | 'error';
}> {
  return new Promise((resolve, reject) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const port = import.meta.env.PROD ? '' : ':3001';
    const wsUrl = `${protocol}//${window.location.hostname}${port}/websocket`;
    const ws = new WebSocket(wsUrl);
    const startTime = Date.now();
    let firstResponseTime: number | null = null;
    let chunks: string[] = [];

    ws.onopen = async () => {
      const max_tokens = await getModelMaxTokens(model);
      const request = {
        type: 'stream',
        model: model,
        messages: [{ role: 'user', content: '你好' }],
        temperature: 0.7,
        max_tokens,
        mode: 'speed_test'
      };
      ws.send(JSON.stringify(request));
    };

    ws.onmessage = (event) => {
      const response = JSON.parse(event.data);
      
      if (response.type === 'error') {
        ws.close();
        reject(new Error(response.message));
        return;
      }

      if (response.type === 'chunk') {
        if (!firstResponseTime) {
          firstResponseTime = Date.now();
          console.log(`[测试] ${label} 首次响应时间: ${firstResponseTime - startTime}ms`);
        }
        chunks.push(response.content);
      }
      
      if (response.type === 'complete') {
        const endTime = Date.now();
        const totalContent = chunks.join('');
        // 假设每个汉字约等于2个token，每个英文单词约等于1个token
        const totalTokens = Math.ceil(totalContent.length * 1.5);
        const totalTimeInSeconds = (endTime - firstResponseTime!) / 1000;
        const tokensPerSecond = totalTokens / totalTimeInSeconds;
        
        ws.close();
        resolve({
          responseTime: tokensPerSecond,
          status: tokensPerSecond > 20 ? 'fast' : tokensPerSecond > 10 ? 'medium' : 'slow'
        });
      }
    };

    ws.onerror = (error) => {
      ws.close();
      reject(error);
    };
  });
}

// 测速函数
async function testModelSpeed() {
  if (isTesting.value) return;
  isTesting.value = true;
  
  try {
    // 重置所有模型状态
    modelOptions.value.forEach(option => {
      option.speed = { status: 'none' };
    });

    // 并行测试所有模型，让后端的请求队列管理并发
    const promises = modelOptions.value.map(async (option) => {
      try {
        const result = await testSingleModel(option.value, option.label);
        option.speed = result;
        console.log(`[测试结果] ${option.label}:`, result);
      } catch (error) {
        console.error(`[测试失败] ${option.label}:`, error);
        option.speed = { status: 'error' };
      }
    });

    await Promise.all(promises);
  } finally {
    isTesting.value = false;
  }
}

// 监听模型变化
watch(selectedModel, (newValue) => {
  // 更新全局模型状态
  setModel(newValue)
  
  // 更新temperature
  if (newValue === 'kimi'|| newValue === 'volcesDeepseek') {
    selectedTemperature.value = 0.5  // kimi使用平衡的temperature
  } else if (newValue === 'deepseek' || newValue === 'siliconDeepseek' || 
      newValue === 'baiduDeepseek' || newValue === 'alideepseekv3' || 
      newValue === 'alideepseekr1' || newValue === 'volcesDeepseekR1' ||
      newValue === 'minimax-text') {
    selectedTemperature.value = 1  // deepseek系列使用通用对话模式
  } else {
    selectedTemperature.value = 0.5  // 其他模型使用较保守的temperature
  }
})

watch(selectedTemperature, (newValue) => {
  setTemperature(newValue)
})
</script>

<style>
.model-controls span {
  transition: all 0.3s ease;
}

.layout-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

.el-header {
  padding: 0;
  border-bottom: 1px solid #dcdfe6;
  height: 60px !important;
  z-index: 100;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.el-menu {
  height: 100%;
  border-bottom: none !important;
  flex: 1;
}

.el-menu-item {
  height: 60px;
  line-height: 60px;
}

.model-controls {
  display: flex;
  gap: 10px;
  padding-right: 20px;
  height: 100%;
  align-items: center;
}

.el-main {
  padding: 0;
  flex: 1;
  overflow: hidden;
  width: 100%;
  display: flex;
}


.el-main > * {
  flex: 1;
}
</style>
