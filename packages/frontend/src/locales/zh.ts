import type { LocaleMessages } from './types'

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
        blockPrefix: '区块 '
    },
    userInterface: {
        executionError: '执行失败'
    },
    configPanel: {
        userInputConfig: '用户输入配置',
        promptConfig: '提示词配置',
        previewTitle: '提示词预览',
        saveExport: '保存并导出',
        importJson: '导入JSON',
        insert: '插入',
        delete: '删除',
        previewPrompt: '预览提示词',
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
        inputPlaceholder: '请输入'
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
        loadSuccess: '配置加载成功',
        loadError: '加载配置失败',
        selectFirst: '请先选择配置文件',
        fileNotFound: '找不到选中的文件'
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
    }
}
