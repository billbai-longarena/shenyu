import type { LocaleMessages } from './types'
import { agentPromptTemplate1 } from './prompts/agent-prompt-template1-en'
import { agentPromptTemplate2 } from './prompts/agent-prompt-template2-en'

export const messages: LocaleMessages = {
    outputPanel: {
        title: 'Output Result',
        copyResult: 'Copy Result',
        copySuccess: 'Copied successfully',
        copyError: 'Copy failed'
    },
    executionPanel: {
        rewrite: 'Rewrite',
        loadTemplate: 'Please load template first',
        execute: 'Execute',
        waiting: 'Waiting',
        processing: 'Processing',
        completed: 'Completed',
        error: 'Error',
        unknown: 'Unknown',
        blockPrefix: 'Block ',
        invalidPromptBlock: 'Invalid Prompt Block'
    },
    userInterface: {
        executionError: 'Execution failed'
    },
    configPanel: {
        agentPromptTemplate1,
        agentPromptTemplate2,
        agentTitle: 'Agent Generator',
        generateAgentButton: 'Generate AI Agent (Conservative Temperature)',
        generateAgentError: 'Generation failed, please try again',
        agentGenerator: 'Agent Generator',
        agentInputPlaceholder: 'Enter and try: deep research with output 10 promptblocks',
        generateAgent: 'Generate AI Agent',
        userInputConfig: 'User Input Configuration',
        promptConfig: 'Prompt Configuration',
        previewTitle: 'Prompt Preview',
        saveExport: 'Save and Export',
        importJson: 'Import JSON',
        insert: 'Insert',
        delete: 'Delete',
        previewPrompt: 'Preview Prompt',
        preview: 'Preview',
        invalidPromptBlockPreview: 'Invalid Prompt Block',
        addUserInput: 'Add User Input',
        addPromptBlock: 'Add Prompt Block',
        inputPromptPlaceholder: 'Please enter prompt',
        deleteConfirm: 'Confirm Delete',
        deleteInputConfirm: 'Are you sure you want to delete this input?',
        confirm: 'Confirm',
        cancel: 'Cancel',
        deleteSuccess: 'Deleted successfully',
        deleteError: 'Delete failed: ',
        importError: 'Invalid configuration file format',
        insertWarning: 'Please click the prompt input box first',
        insertBlockWarning: 'Can only insert placeholder in input boxes below the current prompt block',
        inputPlaceholder: 'Please enter',
        pathInputPlaceholder: 'Please enter text containing json configuration',
        generateControls: 'Generate Controls',
        noValidJsonFound: 'No valid json content found',
        generateError: 'Failed to generate controls',
        controlsGenerated: 'Controls generated successfully',
        invalidJsonStructure: 'Invalid json structure, must contain adminInputs and promptBlocks',
        versionManagement: {
            inputPlaceholder: 'Enter version description',
            historyTitle: 'Version History',
            loadVersion: 'Load This Version',
            exportSuccess: 'Configuration exported',
            importSuccess: 'Configuration imported',
            importError: 'Import failed',
            versionDescriptionRequired: 'Please enter version description',
            initialImport: 'Initial Import'
        },
        models: {
            kimi: 'kimi-8k',
            volcesDeepseek: 'Volces DeepseekV3',
            volcesDeepseekR1: 'Volces DeepseekR1',
            alideepseekv3: 'Ali DeepSeekV3',
            tencentDeepseek: 'Tencent DeepseekV3',
            deepseek: 'deepseek V3',
            yiwan: 'Zero One',
            siliconDeepseek: 'Silicon DeepseekV3',
            baiduDeepseek: 'Baidu DeepSeekV3',
            qwenTurboLatest: 'Qwen 2.5 Plus',
            alideepseekr1: 'Ali DeepSeek R1',
            minimaxText: 'MiniMax-Text-01'
        },
        inheritGlobal: 'Inherit Global Settings'
    },
    historyPanel: {
        syncing: 'Syncing...',
        newChat: 'New Chat',
        deleteAll: 'Delete All',
        editTitle: 'Edit History',
        inputTitle: 'Enter new title',
        cancel: 'Cancel',
        confirm: 'Confirm',
        deleteConfirm: 'Confirm Delete',
        deleteMessage: 'Are you sure you want to delete this history?',
        deleteAllMessage: 'Are you sure you want to delete all history? This action cannot be undone.',
        defaultTitle: 'New Chat'
    },
    sn43: {
        userInterface: 'User Interface',
        adminConfig: 'Admin Configuration',
        restoreHistoryError: 'Failed to restore history',
        newChatSuccess: 'New chat started'
    },
    chat: {
        inputPlaceholder: 'Enter your message...',
        sendButton: 'Send'
    },
    inputPanel: {
        inputPlaceholder: 'Enter'
    },
    configSelector: {
        title: 'Input Area',
        selectPlaceholder: 'Select Configuration',
        loadButton: 'Load',
        loadError: 'Failed to load configuration',
        selectFirst: 'Please select a configuration file first',
        fileNotFound: 'Selected file not found',
        importSuccess: 'Configuration imported successfully'
    },
    menu: {
        chat: 'Chat',
        agent: 'Agent',
        feature3: 'Feature 3',
        feature4: 'Feature 4'
    },
    controls: {
        speedTest: 'Speed Test',
        setDefault: 'Set as Default',
        modelSelect: 'Select Model',
        paramSelect: 'Select Parameter'
    },
    modelParams: {
        conservative: 'Conservative',
        balanced: 'Balanced',
        creative: 'Creative',
        codeGen: 'Code Generation/Math',
        dataExtract: 'Data Extraction',
        generalChat: 'General Chat',
        creativeWriting: 'Creative Writing'
    },
    github: {
        viewOnGithub: 'View on GitHub',
        tooltip: 'View source code'
    },
    language: {
        switchSuccess: 'Language switched successfully',
        code: 'en'
    }
}
