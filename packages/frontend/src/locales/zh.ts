import type { LocaleMessages } from './types'
import { agentPromptTemplate1 } from './prompts/agent-prompt-template1-zh'
import { agentPromptTemplate2 } from './prompts/agent-prompt-template2-zh'

export const messages: LocaleMessages = {
    outputPanel: {
        title: '输出结果',
        copyResult: '复制结果',
        copySuccess: '复制成功',
        copyError: '复制失败'
    },
    executionPanel: {
        rewrite: '重写',
        loadTemplate: '请先载入模板',
        execute: '执行',
        waiting: '等待中',
        processing: '处理中',
        completed: '已完成',
        error: '错误',
        unknown: '未知',
        blockPrefix: '区块 ',
        invalidPromptBlock: '有无效的提示词块'
    },
    userInterface: {
        executionError: '执行失败'
    },
    configPanel: {
        agentPromptTemplate1,
        agentPromptTemplate2,
        agentTitle: 'Agent生成器',
        generateAgentButton: '生成AI智能体(温度用保守)',
        agentInputPlaceholder: '输入试一试：有10个promptblock输出的深度研究agent',
        generateAgentError: '生成失败，请重试',
        agentGenerator: 'Agent生成器',
        generateAgent: '生成AI智能体',
        userInputConfig: '用户输入配置',
        promptConfig: '提示词配置',
        previewTitle: '提示词预览',
        saveExport: '保存并导出',
        importJson: '导入JSON',
        insert: '插入',
        delete: '删除',
        previewPrompt: '预览提示词',
        preview: '预览',
        invalidPromptBlockPreview: '有无效的提示词块',
        addUserInput: '增加用户输入',
        addPromptBlock: '增加提示词块',
        inputPromptPlaceholder: '请输入提示词',
        deleteConfirm: '确认删除',
        deleteInputConfirm: '确定要删除这个输入框吗？',
        confirm: '确定',
        cancel: '取消',
        deleteSuccess: '删除成功',
        deleteError: '删除失败：',
        importError: '配置文件格式错误',
        insertWarning: '请先点击要插入的提示词输入框',
        insertBlockWarning: '只能在当前提示词块下方的输入框中插入占位符',
        inputPlaceholder: '请输入',
        pathInputPlaceholder: '请输入包含json配置的文本',
        generateControls: '生成控件',
        noValidJsonFound: '未找到有效的json内容',
        generateError: '生成控件失败',
        controlsGenerated: '控件生成成功',
        invalidJsonStructure: 'json结构不正确，必须包含adminInputs和promptBlocks',
        versionManagement: {
            inputPlaceholder: '请输入版本说明',
            historyTitle: '版本历史',
            loadVersion: '载入此版本',
            exportSuccess: '配置已导出',
            importSuccess: '配置已导入',
            importError: '导入失败',
            versionDescriptionRequired: '请输入版本说明',
            initialImport: '初始导入'
        },
        models: {
            kimi: 'kimi-8k',
            volcesDeepseek: '火山DeepseekV3',
            volcesDeepseekR1: '火山DeepseekR1',
            alideepseekv3: 'Ali DeepSeekV3',
            tencentDeepseek: '腾讯云DeepseekV3',
            deepseek: 'deepseek V3',
            yiwan: '零一万物',
            siliconDeepseek: '硅基流动DeepseekV3',
            baiduDeepseek: '百度DeepSeekV3',
            qwenTurboLatest: 'Qwen 2.5 Plus',
            alideepseekr1: 'Ali DeepSeek R1',
            minimaxText: 'MiniMax-Text-01'
        },
        inheritGlobal: '继承全局设置'
    },
    historyPanel: {
        syncing: '同步中...',
        newChat: '开启新对话',
        deleteAll: '删除所有记录',
        editTitle: '编辑历史记录',
        inputTitle: '请输入新的标题',
        cancel: '取消',
        confirm: '确定',
        deleteConfirm: '确认删除',
        deleteMessage: '确定要删除这条历史记录吗？',
        deleteAllMessage: '确定要删除所有历史记录吗？此操作不可恢复。',
        defaultTitle: '新对话'
    },
    sn43: {
        userInterface: '用户界面',
        adminConfig: '后台配置',
        restoreHistoryError: '恢复历史记录失败',
        newChatSuccess: '已开启新对话'
    },
    chat: {
        inputPlaceholder: '请输入消息...',
        sendButton: '发送'
    },
    inputPanel: {
        inputPlaceholder: '请输入'
    },
    configSelector: {
        title: '输入区域',
        selectPlaceholder: '选择配置文件',
        loadButton: '载入',
        loadError: '加载配置失败',
        selectFirst: '请先选择配置文件',
        fileNotFound: '找不到选中的文件',
        importSuccess: '配置导入成功'
    },
    menu: {
        chat: '对话',
        agent: '智能体',
        feature3: '功能3',
        feature4: '功能4'
    },
    controls: {
        speedTest: '测速',
        setDefault: '设为默认',
        modelSelect: '选择模型',
        paramSelect: '选择参数'
    },
    modelParams: {
        conservative: '保守',
        balanced: '平衡',
        creative: '创造',
        codeGen: '代码生成/数学解题',
        dataExtract: '数据抽取/分析',
        generalChat: '通用对话和翻译',
        creativeWriting: '创意类写作'
    },
    github: {
        viewOnGithub: '在GitHub上查看',
        tooltip: '查看源代码'
    },
    language: {
        switchSuccess: '语言切换成功',
        code: 'zh'
    }
}
