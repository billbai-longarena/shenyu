export interface LocaleMessages {
    outputPanel: {
        title: string
        copyResult: string
        copySuccess: string
        copyError: string
    }
    executionPanel: {
        rewrite: string
        loadTemplate: string
        execute: string
        waiting: string
        processing: string
        completed: string
        error: string
        unknown: string
        blockPrefix: string
        invalidPromptBlock: string
    }
    userInterface: {
        executionError: string
    }
    configPanel: {
        agentPromptTemplate1: string
        agentPromptTemplate2?: string
        agentPromptTemplate3?: string
        agentTitle: string
        generateAgentButton: string
        generateAgentError: string
        agentGenerator: string
        agentInputPlaceholder: string
        generateAgent: string
        userInputConfig: string
        promptConfig: string
        previewTitle: string
        saveExport: string
        importJson: string
        insert: string
        delete: string
        previewPrompt: string
        preview: string
        invalidPromptBlockPreview: string
        addUserInput: string
        addPromptBlock: string
        inputPromptPlaceholder: string
        deleteConfirm: string
        deleteInputConfirm: string
        confirm: string
        cancel: string
        deleteSuccess: string
        deleteError: string
        importError: string
        insertWarning: string
        insertBlockWarning: string
        inputPlaceholder: string
        pathInputPlaceholder: string
        generateControls: string
        noValidJsonFound: string
        generateError: string
        controlsGenerated: string
        invalidJsonStructure: string
        versionManagement: {
            inputPlaceholder: string
            historyTitle: string
            loadVersion: string
            exportSuccess: string
            importSuccess: string
            importError: string
            versionDescriptionRequired: string
            initialImport: string
        }
        models: {
            kimi: string
            volcesDeepseek: string
            volcesDeepseekR1: string
            alideepseekv3: string
            tencentDeepseek: string
            deepseek: string
            yiwan: string
            siliconDeepseek: string
            baiduDeepseek: string
            qwenTurboLatest: string
            alideepseekr1: string
            minimaxText: string
        }
        inheritGlobal: string
    }
    historyPanel: {
        syncing: string
        newChat: string
        deleteAll: string
        editTitle: string
        inputTitle: string
        cancel: string
        confirm: string
        deleteConfirm: string
        deleteMessage: string
        deleteAllMessage: string
        defaultTitle: string
    }
    sn43: {
        userInterface: string
        adminConfig: string
        restoreHistoryError: string
        newChatSuccess: string
    }
    chat: {
        inputPlaceholder: string
        sendButton: string
    }
    inputPanel: {
        inputPlaceholder: string
    }
    configSelector: {
        title: string
        selectPlaceholder: string
        loadButton: string
        loadError: string
        selectFirst: string
        fileNotFound: string
        importSuccess: string
    }
    menu: {
        chat: string
        agent: string
        feature3: string
        feature4: string
    }
    controls: {
        speedTest: string
        setDefault: string
        modelSelect: string
        paramSelect: string
    }
    modelParams: {
        conservative: string
        balanced: string
        creative: string
        codeGen: string
        dataExtract: string
        generalChat: string
        creativeWriting: string
    }
    github: {
        viewOnGithub: string
        tooltip: string
    }
    language: {
        switchSuccess: string
        code: string
    }
}
