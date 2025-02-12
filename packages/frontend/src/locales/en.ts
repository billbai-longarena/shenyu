import type { LocaleMessages } from './types'

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
        blockPrefix: 'Block '
    },
    userInterface: {
        executionError: 'Execution failed'
    },
    configPanel: {
        userInputConfig: 'User Input Configuration',
        promptConfig: 'Prompt Configuration',
        previewTitle: 'Prompt Preview',
        saveExport: 'Save and Export',
        importJson: 'Import JSON',
        insert: 'Insert',
        delete: 'Delete',
        previewPrompt: 'Preview Prompt',
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
        inputPlaceholder: 'Please enter'
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
        loadSuccess: 'Configuration loaded successfully',
        loadError: 'Failed to load configuration',
        selectFirst: 'Please select a configuration file first',
        fileNotFound: 'Selected file not found'
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
    }
}
