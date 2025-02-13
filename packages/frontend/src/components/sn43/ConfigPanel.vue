<template>
  <div class="admin-interface-container">
    <!-- Agent生成器区域 -->
    <div class="agent-section" :style="{ width: agentWidth + '%' }">
      <div class="agent-section-content">
        <h2 class="admin-title">{{ t('configPanel.agentTitle') }}</h2>
        <!-- AI智能体生成区域 -->
        <div class="agent-generator">
          <el-input
            type="textarea"
            v-model="textareaGenerateAgent"
            :rows="3"
            :placeholder="t('configPanel.agentInputPlaceholder')"
            class="agent-input"
          />
          <el-button 
            type="primary"
            class="generate-button"
            @click="generateAIAgent"
          >
            {{ t('configPanel.generateAgentButton') }}
          </el-button>
        </div>

        <!-- 路径输入和生成控件区域 -->
        <div class="path-input-section">
          <el-input
            type="textarea"
            v-model="pathInput"
            :rows="3"
            :placeholder="t('configPanel.pathInputPlaceholder')"
            class="path-input"
          />
          <el-button 
            type="primary"
            class="generate-button"
            @click="generateFromText"
            :disabled="!pathInput.trim()"
          >
            {{ t('configPanel.generateControls') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 第一个拖动分隔条 -->
    <div 
      class="resize-handle"
      @mousedown="startResizeAgent"
      @dblclick="resetWidths"
    ></div>

    <!-- 用户输入配置区域 -->
    <div class="config-section" :style="{ width: configWidth + '%' }">
      <div class="config-section-content">
        <div class="config-inputs-container">
          <h2 class="admin-title">{{ t('configPanel.userInputConfig') }}</h2>
          
          <!-- 配置操作按钮 -->
          <div class="config-actions">
            <el-button 
              type="danger"
              @click="exportConfig"
            >
              {{ t('configPanel.saveExport') }}
            </el-button>
            <el-button 
              type="primary"
              @click="fileInput?.click()"
            >
              {{ t('configPanel.importJson') }}
            </el-button>
          </div>
          
          <!-- 隐藏的文件输入框 -->
          <input
            type="file"
            ref="fileInput"
            style="display: none"
            accept=".json"
            @change="handleFileUpload"
          />

          <!-- 动态生成的配置输入框 -->
          <div v-for="(value, key) in adminInputs" :key="key" class="input-group">
            <div class="input-with-label">
              <el-button 
                type="primary" 
                link
                class="insert-button"
                @click="insertPlaceholder(String(key))"
                :disabled="lastFocusedIndex === null"
              >
                {{ t('configPanel.insert') }}
              </el-button>
              <el-input 
                v-model="adminInputs[key]"
                :placeholder="t('configPanel.inputPlaceholder') + key"
                @input="(value: string) => handleAdminInput(String(key), value)"
              />
              <el-button
                type="danger"
                link
                @click="deleteAdminInput(String(key))"
              >
                {{ t('configPanel.delete') }}
              </el-button>
            </div>
          </div>
           <!-- 增加用户输入按钮 -->
           <el-button 
            type="primary" 
            class="add-input-button"
            @click="addUserInput"
          >
            {{ t('configPanel.addUserInput') }}
          </el-button>

          <!-- 预览区域 -->
          <div class="preview-section">
            <h3 class="preview-title">{{ t('configPanel.previewTitle') }}</h3>
            <div class="preview-content" ref="previewContent">
              <div class="messages">
                <div class="message">
                  <div class="assistant-message">
                    <div class="loading-icon" v-if="isPreviewLoading">
                      <svg viewBox="0 0 1024 1024" class="loading">
                        <path d="M512 64q14.016 0 23.008 8.992T544 96v192q0 14.016-8.992 23.008T512 320t-23.008-8.992T480 288V96q0-14.016 8.992-23.008T512 64zm0 640q14.016 0 23.008 8.992T544 736v192q0 14.016-8.992 23.008T512 960t-23.008-8.992T480 928V736q0-14.016 8.992-23.008T512 704zm448-192q0 14.016-8.992 23.008T928 544H736q-14.016 0-23.008-8.992T704 512t8.992-23.008T736 480h192q14.016 0 23.008 8.992T960 512zm-640 0q0 14.016-8.992 23.008T288 544H96q-14.016 0-23.008-8.992T64 512t8.992-23.008T96 480h192q14.016 0 23.008 8.992T320 512zM195.008 195.008q10.016-8.992 23.008-8.992t22.016 8.992l136 136q8.992 10.016 8.992 23.008t-8.992 22.016-23.008 8.992-22.016-8.992l-136-136q-8.992-8.992-8.992-22.016t8.992-23.008zm454.016 454.016q10.016-8.992 23.008-8.992t22.016 8.992l136 136q8.992 10.016 8.992 23.008t-8.992 22.016-23.008 8.992-22.016-8.992l-136-136q-8.992-8.992-8.992-22.016t8.992-23.008zM828.992 195.008q8.992 10.016 8.992 23.008t-8.992 22.016l-136 136q-10.016 8.992-22.016 8.992t-23.008-8.992-8.992-22.016 8.992-23.008l136-136q8.992-8.992 22.016-8.992t23.008 8.992zM375.008 649.024q8.992 10.016 8.992 22.016t-8.992 23.008l-136 136q-10.016 8.992-22.016 8.992t-23.008-8.992-8.992-22.016 8.992-23.008l136-136q8.992-8.992 22.016-8.992t23.008 8.992z"/>
                      </svg>
                    </div>
                    <div class="markdown-content" v-html="renderedPreviewText"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 第二个拖动分隔条 -->
    <div 
      class="resize-handle"
      @mousedown="startResizeConfig"
      @dblclick="resetWidths"
    ></div>

    <!-- 提示词配置区域 -->
    <div class="prompt-section" ref="promptSection" :style="{ width: promptWidth + '%' }">
      <div class="prompt-config">
        <h2 class="admin-title">{{ t('configPanel.promptConfig') }}</h2>
        
        <!-- 提示词输入区域 -->
        <div v-for="(prompt, index) in promptBlocks" :key="index" class="prompt-container">
          <div class="prompt-input-group">
            <el-button 
              type="primary" 
              link
              class="insert-button"
              @click="insertPromptBlock(index)"
              :disabled="lastFocusedIndex === null || !canInsertPromptBlock(index, lastFocusedIndex)"
            >
              {{ t('configPanel.insert') }}
            </el-button>
            <div class="prompt-input-wrapper">
              <el-input
                v-model="prompt.text"
                type="textarea"
                :rows="4"
                :placeholder="t('configPanel.inputPromptPlaceholder')"
                class="prompt-input"
                @focus="handlePromptFocus(index)"
                @input="emit('config-modified')"
                :ref="(el: any) => setPromptRef(el, index)"
                @update:modelValue="(value) => updatePromptText(index, value)"
              />
              <div class="prompt-actions">
                <el-button 
                  type="primary"
                  link
                  class="preview-button"
                  @click="previewPrompt(index)"
                >
                  {{ t('configPanel.preview') }}
                </el-button>
                <el-button
                  type="danger"
                  link
                  @click="deletePromptBlock(index)"
                >
                  {{ t('configPanel.delete') }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
         <!-- 增加提示词块按钮 -->
         <el-button 
          type="primary" 
          class="add-prompt-button"
          @click="addPromptBlock"
        >
          {{ t('configPanel.addPromptBlock') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick, inject } from 'vue'
import { marked } from 'marked'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useConfig } from '../../composables/useConfig'
import { usePrompt } from '../../composables/usePrompt'
import { useLanguage } from '../../composables/useLanguage'
import { useStreamResponse } from '../../composables/useStreamResponse'
import { setTemperature } from '../../api/api-deepseekStream'

// AI智能体生成相关
const textareaGenerateAgent = ref('')
const { handleStreamResponse } = useStreamResponse()
const selectedTemperature = inject('selectedTemperature') as any

// 生成AI智能体
const generateAIAgent = async () => {
  if (!textareaGenerateAgent.value.trim()) {
    ElMessage.warning(t('configPanel.agentInputPlaceholder'))
    return
  }

  // 设置为保守模式
  setTemperature(0.1)
  selectedTemperature.value = 0.1

  const prompt = `我需要根据用户的输入：“${textareaGenerateAgent.value}”，来输出json，这个json是一个问卷，用户会输入inputB1-N，然后点击提交后，顺序调用prompt数组中的字符串给到ai，并依次把内容返回给用户。需要你帮我把要问用户的所有问题都写到inputBx中，而在promptBlock中不准问问题，只能根据用户在inputBx的<def>标签中的答案，来构建生成解决方案或者回答的prompt。根据质量要求设计需要prompt几次以及每次的prompt内容才能够达到要求，输出的时候输出json，按照以下的范例和规则输出。
  注意：inputB1永远为目标，默认内容为你根据用户输入，认为他最可能的想达成什么目的。
  "inputB1": "目标 <def>分析后认为用户想达成的目标</def>"
  然后inputB2-BN是你分析要达成这个目的，还需要向用户澄清的1-3个关键输入因素（参数），<def></def>默认值中填入一个该参数概率最大的选项
  然后判断用户最终需要的是很长的回复，还是简短的回复。如果是长的回复，可能需要多个promtBlock，如果是短回复，则一个promptBlock即可，因为inputB1-N是用户一次性输入的，因此promptBlock1-N都可以随时用占位符抓取到，应该用最优策略来写promptBlock，也就是除非是要求写大量复杂文章，一般都要在1个promptBlock解决问题。第2-N个promptBlock中必须要引用至少1个其前面的promptBlock。写promptBlock1的时候，用户就已经完成了inputB1-N的输入，不需要在promptBlock中追问用户。promptBlock1的典型写法为：“以下是基本信息： ”写法见下方。
  只输出json文件，不要输出其他不相关内容。

  以下是范例：
用户输入：你最喜欢什么动物
ai经过分析，让用户输入三种动物，默认值在<def></def>中，然后调用两次ai，第一次调用的prompt为："以下动物各列一个品种，只输出品种名称，不输出其他不相关的信息。 猫     狗  鸡"
第二次调用的prompt为 "你最喜欢哪个：波斯猫  拉布拉多 白来航鸡？直接输出结果，不需要解释"
（第二次调用中的波斯猫  拉布拉多 白来航鸡为第一次prompt生成的结果）
特别说明：Json文件中的"promptBlocks": [ string1,string2....] 是一个数组，这个数组的每一个元素的名称对应promptBlock1-N，因此当某个promptBlock中出现如\${promptBlock1}这样的占位符，该占位符会被替换为promptBlock1里面的prompt在发给ai后得到的回复。这个功能类似大模型中的叠加历史对话上下文的做法，只是更具选择性。因此在构建多个promptBlock的json文件的时候，每个promptblock中必须出现至少1种占位符以精准选择需要的上下文，因为数列中的prompts每个都是单独的对话发给大模型，是没有上下文的。

Json 文件范例如下：
多promptBlock范例
{
  "adminInputs": {
    "inputB1": "动物1 <def>猫</def>",
    "inputB2": "动物2 <def>狗</def>",
    "inputB3": "动物3  <def>鸡</def>"
  },
  "promptBlocks": {
    "promptBlock1": "以下动物各列一个品种，只输出品种名称，不输出其他不相关的信息。 \${inputB1}    \${inputB2} \${inputB3}",
    "promptBlock2": "你最喜欢哪个：\${promptBlock1} 直接输出结果，不需要解释"
  }
}

单promptblock范例
高血压配药器：
{
  "adminInputs": {
    "inputB1": "患者性别",
    "inputB2": "患者年龄",
    "inputB3": "收缩压（高压）",
    "inputB4": "舒张压（低压）",
    "inputB5": "备注（如糖尿病、肾损伤等）"
  },
  "promptBlocks": {
  "promptBlock1":"以下是患者的基本信息：\n性别：、\${inputB1}\n年龄：\${inputB2}\n收缩压：\${inputB3}\n舒张压：\${inputB4}\n其他信息，如共病等：\${inputB5}\n\n根据后面的诊断标准药物和药物列表，给判断进行诊断和用药推荐。输出格式为：\n患者高血压状况说明：xxxxx\n推荐用药、用量以及原因：xxxxxx\n注意关注可能有的副作用：xxxxxxxx\n目标血压、用药评估周期和罕见注意事项：xxxxxx\n免责声明：xxxx\n\n诊断标准如下：\n评估血压水平和分级\n\n\n轻度高血压(140-159/90-99 mmHg)\n中度高血压(160-179/100-109 mmHg)\n重度高血压(≥180/110 mmHg)\n\n\n考虑患者特征：\n\n\n年龄：\n\n≥65岁老年人：首选CCB或利尿剂，避免大幅降压\n中年人：可选择所有一线药物\n<55岁年轻人：可优先考虑ACEI/ARB\n\n\n性别：\n\n育龄期女性：禁用ACEI/ARB\n绝经后女性：注意骨质疏松风险，慎用利尿剂\n\n\n\n\n起始用药原则：\n\n\n轻度高血压：单药小剂量起始\n中重度高血压：可考虑小剂量联合用药\n收缩压>20mmHg或舒张压>10mmHg超过目标值：考虑双药联合\n\n\n特殊情况考虑：\n\n\n单纯收缩期高血压：优选CCB或利尿剂\n合并心衰：优选ACEI/ARB+β受体阻滞剂\n合并糖尿病：优先ACEI/ARB\n合并肾功能不全：优先ACEI/ARB（除非肾功能严重受损）\n\n\n监测和调整原则：\n\n\n起始治疗2周评估疗效和耐受性\n4-6周内未达标考虑调整方案\n注意监测电解质和肾功能\n关注患者依从性和生活方式改善情况\n\n药物列表如下：\n\n钙通道阻滞剂(CCB)\n\n\n氨氯地平：降压8-12/4-6 mmHg (收缩压/舒张压)\n主要副作用：踝部水肿、头痛、面部潮红、心动过速\n相互作用：避免与葡萄柚汁同服；与β受体阻滞剂合用需谨慎，可能加重心脏传导阻滞\n\n\n血管紧张素转换酶抑制剂(ACEI)\n\n\n卡托普利/依那普利：降压8-12/4-8 mmHg\n主要副作用：干咳(10-20%患者)、高钾血症、血管性水肿\n相互作用：禁忌与ARB联用；避免与保钾利尿剂同用；孕妇禁用\n\n\n血管紧张素受体拮抗剂(ARB)\n\n\n缬沙坦/替米沙坦：降压8-11/5-7 mmHg\n主要副作用：头晕、高钾血症(发生率低于ACEI)\n相互作用：禁忌与ACEI联用；避免与保钾利尿剂同用；孕妇禁用\n\n\n噻嗪类利尿剂\n\n\n氢氯噻嗪：降压9-13/4-6 mmHg\n主要副作用：低钾血症、高尿酸血症、血糖升高、血脂异常\n相互作用：避免与糖皮质激素同用；与锂剂合用可能增加锂中毒风险\n\n\nβ受体阻滞剂\n\n\n美托洛尔/比索洛尔：降压8-10/6-8 mmHg\n主要副作用：疲劳、心动过缓、支气管痉挛、掩盖低血糖症状\n相互作用：避免与维拉帕米类钙通道阻滞剂合用；与胰岛素/磺脲类降糖药合用需监测血糖"
  
  }
    
  
}

只输出json文件，不要输出其他不相关内容。
`

  try {
    // 清空所有现有配置
    emit('update:adminInputs', {})
    emit('update:promptBlocks', [])
    emit('update:inputCounter', 0)
    
    // 清空现有内容
    pathInput.value = ''
    
    // 发送请求并处理流式响应
    await handleStreamResponse(
      prompt,
      async (chunk: string, processedChunk: string) => {
        if (!chunk.includes('[DONE]') && !chunk.includes('[ERROR]')) {
          pathInput.value += processedChunk
        }
      }
    )

    // 自动点击生成按钮
    await generateFromText()
  } catch (error) {
    console.error('生成AI智能体失败:', error)
    ElMessage.error(t('configPanel.generateAgentError'))
  }
}

interface Props {
  adminInputs: { [key: string]: string }
  userInputs: { [key: string]: string }
  promptBlocks: { text: string }[]
  inputCounter: number
  previewText: string
  isPreviewLoading: boolean
}

const props = defineProps<Props>()

interface Emits {
  (e: 'update:adminInputs', value: { [key: string]: string }): void
  (e: 'update:userInputs', value: { [key: string]: string }): void
  (e: 'update:promptBlocks', value: { text: string }[]): void
  (e: 'update:inputCounter', value: number): void
  (e: 'update:previewText', value: string): void
  (e: 'update:isPreviewLoading', value: boolean): void
  (e: 'config-modified'): void
}

const emit = defineEmits<Emits>()

// 获取翻译函数
const { t } = useLanguage()

// 路径输入
const pathInput = ref('')

// 清理JSON字符串中的控制字符
const cleanJsonString = (str: string) => {
  return str
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 移除控制字符
    .replace(/\n\s*\n/g, '\n') // 移除多余的空行
    .trim();
}

// 从文本生成控件
const generateFromText = async () => {
  const input = pathInput.value
  try {
    // 首先尝试提取JSON内容
    const jsonRegex = /{[\s\S]*"adminInputs"[\s\S]*"promptBlocks"[\s\S]*}/g
    const matches = input.match(jsonRegex)
    
    if (!matches || matches.length === 0) {
      ElMessage.warning(t('configPanel.noValidJsonFound'))
      return
    }

    // 清理并解析JSON
    const cleanedJson = cleanJsonString(matches[0])
    const config = JSON.parse(cleanedJson)
    
    // 验证json结构
    if (!config.adminInputs || !config.promptBlocks) {
      ElMessage.warning(t('configPanel.invalidJsonStructure'))
      return
    }
    
    // 导入配置
    await importConfig(config)
    // 触发配置修改事件
    emit('config-modified')
    
    ElMessage.success(t('configPanel.controlsGenerated'))
  } catch (error) {
    console.error('生成控件失败:', error)
    ElMessage.error(t('configPanel.generateError'))
  }
}

const fileInput = ref<HTMLInputElement | null>(null)
// 配置marked选项
marked.setOptions({
  breaks: true,    // 支持GitHub风格的换行符
  gfm: true,       // 启用GitHub风格的Markdown
  pedantic: false  // 不要过分严格
})

const previewContent = ref<HTMLDivElement | null>(null)
const renderedPreviewText = computed(() => {
  return props.previewText ? marked(props.previewText).toString() : ''
})

// 滚动到底部
const scrollToBottom = () => {
  if (previewContent.value) {
    const messages = previewContent.value.querySelector('.messages')
    if (messages) {
      messages.scrollTop = messages.scrollHeight
    }
  }
}

// 监听预览文本变化
watch(() => props.previewText, () => {
  nextTick(() => {
    scrollToBottom()
  })
})

// 区域宽度
const agentWidth = ref(23) // Agent生成器区域的初始宽度百分比
const configWidth = ref(33) // 用户输入配置区域的初始宽度百分比
const promptWidth = computed(() => 100 - agentWidth.value - configWidth.value) // 提示词配置区域的宽度

// 拖动相关的状态
const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(0)
const currentResizeTarget = ref<'agent' | 'config' | null>(null)

// 开始拖动Agent区域
const startResizeAgent = (e: MouseEvent) => {
  isResizing.value = true
  startX.value = e.clientX
  startWidth.value = agentWidth.value
  currentResizeTarget.value = 'agent'
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.classList.add('resizing')
}

// 开始拖动Config区域
const startResizeConfig = (e: MouseEvent) => {
  isResizing.value = true
  startX.value = e.clientX
  startWidth.value = configWidth.value
  currentResizeTarget.value = 'config'
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.classList.add('resizing')
}

// 处理拖动
const handleResize = (e: MouseEvent) => {
  if (!isResizing.value || !currentResizeTarget.value) return
  
  const container = document.querySelector('.admin-interface-container')
  if (!container) return
  
  const dx = e.clientX - startX.value
  const containerWidth = container.getBoundingClientRect().width
  const newWidthPercent = startWidth.value + (dx / containerWidth * 100)
  
  // 限制拖动范围在20%到60%之间
  const limitedWidth = Math.min(Math.max(newWidthPercent, 20), 60)
  
  if (currentResizeTarget.value === 'agent') {
    // 确保三个区域的总宽度不超过100%
    const maxWidth = 100 - configWidth.value - 20 // 保留至少20%给提示词区域
    agentWidth.value = Math.min(limitedWidth, maxWidth)
  } else {
    // 确保三个区域的总宽度不超过100%
    const maxWidth = 100 - agentWidth.value - 20 // 保留至少20%给提示词区域
    configWidth.value = Math.min(limitedWidth, maxWidth)
  }
}

// 停止拖动
const stopResize = () => {
  isResizing.value = false
  currentResizeTarget.value = null
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.classList.remove('resizing')
}

// 双击重置宽度
const resetWidths = () => {
  agentWidth.value = 23
  configWidth.value = 33
}

// 组件卸载时清理事件监听
onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.classList.remove('resizing')
})

// 监听adminInputs的变化，检查是否有默认值需要设置
watch(() => props.adminInputs, (newAdminInputs) => {
  Object.entries(newAdminInputs).forEach(([key, value]) => {
    const match = value.match(/<def>(.*?)<\/def>/)
    if (match) {
      const userKey = `inputA${key.replace('inputB', '')}`
      const defaultValue = match[1]
      const newUserInputs = { ...props.userInputs }
      newUserInputs[userKey] = defaultValue
      emit('update:userInputs', newUserInputs)
    }
  })
}, { immediate: true, deep: true })

const promptSection = ref<HTMLElement | null>(null)
const { exportConfig, importConfig } = useConfig(props, emit)
const { 
  lastFocusedIndex,
  promptRefs,
  handlePromptFocus,
  addPromptBlock,
  setPromptRef,
  insertPlaceholder,
  previewPrompt,
  getPromptBlockPlaceholder,
  canInsertPromptBlock,
  deletePromptBlock
} = usePrompt(props, emit)

// 处理管理员输入
const handleAdminInput = (key: string, value: string) => {
  // 检查是否包含<def>标签
  const match = value.match(/<def>(.*?)<\/def>/)
  if (match) {
    // 获取对应的userInput的key (从inputB1转换为inputA1)
    const userKey = `inputA${key.replace('inputB', '')}`
    // 获取默认值
    const defaultValue = match[1]
    
    // 更新对应的userInput
    const newUserInputs = { ...props.userInputs }
    newUserInputs[userKey] = defaultValue
    emit('update:userInputs', newUserInputs)
  }
  
  emit('config-modified')
}

// 添加用户输入
const addUserInput = () => {
  const newCounter = props.inputCounter + 1
  emit('update:inputCounter', newCounter)
  
  const adminKey = `inputB${newCounter}`
  const newAdminInputs = { ...props.adminInputs }
  newAdminInputs[adminKey] = ''
  emit('update:adminInputs', newAdminInputs)
  
  // 同时创建用户界面的输入框
  const userKey = `inputA${newCounter}`
  const newUserInputs = { ...props.userInputs }
  newUserInputs[userKey] = ''
  emit('update:userInputs', newUserInputs)

  // 触发配置修改事件
  emit('config-modified')
}

// 处理文件上传
const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const jsonStr = cleanJsonString(e.target?.result as string)
      const config = JSON.parse(jsonStr)
      importConfig(config)
      // 触发配置修改事件
      emit('config-modified')
    } catch (error) {
      console.error('导入配置失败:', error)
      ElMessage.error(t('configPanel.importError'))
    }
    
    // 清空文件输入框
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
  reader.readAsText(file)
}

// 保存滚动位置
const saveScrollPosition = () => {
  return promptSection.value?.scrollTop || 0
}

// 恢复滚动位置
const restoreScrollPosition = (position: number) => {
  if (promptSection.value) {
    promptSection.value.scrollTop = position
  }
}

// 更新提示词文本
const updatePromptText = (index: number, value: string) => {
  const newBlocks = [...props.promptBlocks]
  newBlocks[index] = { text: value }
  emit('update:promptBlocks', newBlocks)
}

// 插入提示词块占位符
const insertPromptBlock = (index: number) => {
  if (lastFocusedIndex.value === null) {
    ElMessage.warning(t('configPanel.insertWarning'))
    return
  }

  if (!canInsertPromptBlock(index, lastFocusedIndex.value)) {
    ElMessage.warning(t('configPanel.insertBlockWarning'))
    return
  }

  const scrollPosition = saveScrollPosition()
  insertPlaceholder(getPromptBlockPlaceholder(index), true)
  // 触发配置修改事件
  emit('config-modified')
  nextTick(() => {
    restoreScrollPosition(scrollPosition)
  })
}

// 删除管理员输入框
const deleteAdminInput = async (key: string) => {
  try {
    await ElMessageBox.confirm(
      t('configPanel.deleteInputConfirm'),
      t('configPanel.deleteConfirm'),
      {
        confirmButtonText: t('configPanel.confirm'),
        cancelButtonText: t('configPanel.cancel'),
        type: 'warning'
      }
    )

    // 删除管理员输入框
    const newAdminInputs = Object.fromEntries(
      Object.entries(props.adminInputs).filter(([k]) => k !== key)
    )
    emit('update:adminInputs', newAdminInputs)

    // 同时删除对应的用户输入框
    const userKey = `inputA${key.replace('inputB', '')}`
    const newUserInputs = Object.fromEntries(
      Object.entries(props.userInputs).filter(([k]) => k !== userKey)
    )
    emit('update:userInputs', newUserInputs)

    // 触发配置修改事件
    emit('config-modified')

    ElMessage.success(t('configPanel.deleteSuccess'))
  } catch (error) {
    // 用户取消删除操作，不做任何处理
    if (error !== 'cancel') {
      console.error('删除输入框时发生错误:', error)
      ElMessage.error(t('configPanel.deleteError') + (error as Error).message)
    }
  }
}
</script>

<style scoped>
.admin-interface-container {
  display: flex;
  height: 100%;
}

.agent-section {
  display: flex;
  flex-direction: column;
  min-width: 200px;
  overflow: hidden;
}

.agent-section-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.config-section {
  display: flex;
  flex-direction: column;
  min-width: 200px;
  overflow: hidden;
}

.config-section-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.prompt-section {
  display: flex;
  flex-direction: column;
  min-width: 200px;
  overflow: hidden;
}

.prompt-config {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.prompt-config {
  height: 100%;
}

.path-input-section {
  margin-bottom: 20px;
}

.path-input {
  margin-bottom: 10px;
}

.generate-button {
  width: 100%;
}

.preview-section {
  margin-top: 20px;
  border-top: 1px solid #dcdfe6;
  padding-top: 16px;
  height: 300px;
}

.preview-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.preview-content {
  height: calc(100% - 40px);
  background-color: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.messages {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  padding: 12px;
}

.message {
  margin-bottom: 15px;
  padding: 12px 16px;
  border-radius: 8px;
  background-color: #f4f4f5;
  color: #333333;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.assistant-message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.loading-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.loading {
  animation: rotate 1s linear infinite;
  fill: #409eff;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.markdown-content {
  flex: 1;
  line-height: 1.6;
  font-size: 14px;
  text-align: left;
  white-space: normal;
  word-break: break-word;
}

.markdown-content :deep(*) {
  white-space: pre-wrap;
}

.markdown-content :deep(pre) {
  background-color: #f8f9fa;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1em 0;
}

.markdown-content :deep(code) {
  background-color: #f8f9fa;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
}

.markdown-content :deep(p) {
  margin: 1em 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 2em;
  margin: 1em 0;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4) {
  margin-top: 1.5em;
  margin-bottom: 1em;
  font-weight: 600;
}

.markdown-content :deep(blockquote) {
  margin: 1em 0;
  padding-left: 1em;
  border-left: 4px solid #dcdfe6;
  color: #666;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  margin: 1em 0;
  width: 100%;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #dcdfe6;
  padding: 0.6em 1em;
}

.markdown-content :deep(th) {
  background-color: #f8f9fa;
}

.config-inputs-container {
  flex: 1;
}

.config-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.agent-generator {
  margin-bottom: 20px;
}

.agent-input {
  margin-bottom: 10px;
}

.insert-button {
  min-width: 60px;
}

.admin-title {
  color: #1a1a1a;
  font-weight: 600;
  margin: 0;
  line-height: 32px;
}

.input-with-label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.input-group {
  margin-bottom: 15px;
}

.add-input-button,
.add-prompt-button {
  margin-bottom: 20px;
}

.prompt-container {
  margin-top: 20px;
}

.prompt-input-group {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.prompt-input-wrapper {
  flex: 1;
  display: flex;
  gap: 10px;
}

.prompt-input {
  flex: 1;
}

.prompt-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.insert-button {
  min-width: 60px;
  margin-top: 8px;
}

/* 拖动分隔条样式 */
.resize-handle {
  width: 6px;
  background-color: #dcdfe6;
  cursor: col-resize;
  transition: background-color 0.2s;
  position: relative;
}

.resize-handle:hover,
.resize-handle:active {
  background-color: #409eff;
}

.resize-handle::after {
  content: "⋮";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #909399;
  font-size: 16px;
  line-height: 1;
}

/* 拖动时禁止选择文本 */
:global(.resizing) {
  user-select: none;
  cursor: col-resize;
}
</style>
