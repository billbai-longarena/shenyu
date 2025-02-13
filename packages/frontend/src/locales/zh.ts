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
        agentPromptTemplate: '我需要根据用户的输入："${input}"，用用户要求的语种来输出。来输出 json，这个 json 是一个问卷，用户会输入 inputB1-N，然后点击提交后，顺序调用 prompt 数组中的字符串给到 ai，并依次把内容返回给用户。需要你帮我把要问用户的所有问题都写到 inputBx 中，而在 promptBlock 中不准问问题，只能根据用户在 inputBx 的<def>标签中的答案，来构建生成解决方案或者回答的 prompt。根据质量要求设计需要 prompt 几次以及每次的 prompt 内容才能够达到要求，输出的时候输出 json，按照以下的范例和规则输出。\n 注意：inputB1 永远为目标，默认内容为你根据用户输入，认为他最可能的想达成什么目的。\n "inputB1": " 目标 <def>分析后认为用户想达成的目标</def>" \n 然后 inputB2-BN 是你分析要达成这个目的，还需要向用户澄清的 1-3 个关键输入因素（参数），<def></def>默认值中填入一个该参数概率最大的选项 \n 然后判断用户最终需要的是很长的回复，还是简短的回复。如果是长的回复，可能需要多个 promtBlock，如果是短回复，则一个 promptBlock 即可，因为 inputB1-N 是用户一次性输入的，因此 promptBlock1-N 都可以随时用占位符抓取到，应该用最优策略来写 promptBlock，也就是除非是要求写大量复杂文章，一般都要在 1 个 promptBlock 解决问题。第 2-N 个 promptBlock 中必须要引用至少 1 个其前面的 promptBlock。写 promptBlock1 的时候，用户就已经完成了 inputB1-N 的输入，不需要在 promptBlock 中追问用户。promptBlock1 的典型写法为：“以下是基本信息：” 写法见下方。\n 只输出 json 文件，不要输出其他不相关内容。\n\n 以下是范例：\n 用户输入：你最喜欢什么动物 \nai 经过分析，让用户输入三种动物，默认值在<def></def>中，然后调用两次 ai，第一次调用的 prompt 为："以下动物各列一个品种，只输出品种名称，不输出其他不相关的信息。 猫 狗 鸡"\n 第二次调用的 prompt 为 "你最喜欢哪个：波斯猫 拉布拉多 白来航鸡？直接输出结果，不需要解释"\n（第二次调用中的波斯猫 拉布拉多 白来航鸡为第一次 prompt 生成的结果）\n 特别说明：Json 文件中的 "promptBlocks": [string1,string2....] 是一个数组，这个数组的每一个元素的名称对应 promptBlock1-N，因此当某个 promptBlock 中出现如 ${promptBlock1} 这样的占位符，该占位符会被替换为 promptBlock1 里面的 prompt 在发给 ai 后得到的回复。这个功能类似大模型中的叠加历史对话上下文的做法，只是更具选择性。因此在构建多个 promptBlock 的 json 文件的时候，每个 promptblock 中必须出现至少 1 种占位符以精准选择需要的上下文，因为数列中的 prompts 每个都是单独的对话发给大模型，是没有上下文的。\n\nJson 文件范例如下：\n 多 promptBlock 范例 \n {\n "adminInputs": {\n "inputB1": " 动物 1 <def>猫</def>",\n"inputB2":" 动物 2 <def>狗</def>",\n"inputB3":" 动物 3 <def>鸡</def>"\n },\n"promptBlocks": {\n"promptBlock1":" 以下动物各列一个品种，只输出品种名称，不输出其他不相关的信息。 ${inputB1} ${inputB2} ${inputB3}",\n"promptBlock2":" 你最喜欢哪个：${promptBlock1} 直接输出结果，不需要解释 "\n }\n}\n\n 单 promptblock 范例 \n 高血压配药器：\n {\n"adminInputs": {\n"inputB1":" 患者性别 ",\n"inputB2":" 患者年龄 ",\n"inputB3":" 收缩压（高压）",\n"inputB4":" 舒张压（低压）",\n"inputB5":" 备注（如糖尿病、肾损伤等）"\n },\n"promptBlocks": {\n"promptBlock1":" 以下是患者的基本信息：\n 性别：、${inputB1}\n 年龄：${inputB2}\n 收缩压：${inputB3}\n 舒张压：${inputB4}\n 其他信息，如共病等：${inputB5}\n\n 根据后面的诊断标准药物和药物列表，给判断进行诊断和用药推荐。输出格式为：\n 患者高血压状况说明：xxxxx\n 推荐用药、用量以及原因：xxxxxx\n 注意关注可能有的副作用：xxxxxxxx\n 目标血压、用药评估周期和罕见注意事项：xxxxxx\n 免责声明：xxxx\n\n 诊断标准如下：\n 评估血压水平和分级 \n\n\n 轻度高血压 (140-159/90-99 mmHg)\n 中度高血压 (160-179/100-109 mmHg)\n 重度高血压 (≥180/110 mmHg)\n\n\n 考虑患者特征：\n\n\n 年龄：\n\n≥65 岁老年人：首选 CCB 或利尿剂，避免大幅降压 \n 中年人：可选择所有一线药物 \n<55 岁年轻人：可优先考虑 ACEI/ARB\n\n\n 性别：\n\n 育龄期女性：禁用 ACEI/ARB\n 绝经后女性：注意骨质疏松风险，慎用利尿剂 \n\n\n\n\n 起始用药原则：\n\n\n 轻度高血压：单药小剂量起始 \n 中重度高血压：可考虑小剂量联合用药 \n 收缩压 > 20mmHg 或舒张压 > 10mmHg 超过目标值：考虑双药联合 \n\n\n 特殊情况考虑：\n\n\n 单纯收缩期高血压：优选 CCB 或利尿剂 \n 合并心衰：优选 ACEI/ARB+β 受体阻滞剂 \n 合并糖尿病：优先 ACEI/ARB\n 合并肾功能不全：优先 ACEI/ARB（除非肾功能严重受损）\n\n\n 监测和调整原则：\n\n\n 起始治疗 2 周评估疗效和耐受性 \n4-6 周内未达标考虑调整方案 \n 注意监测电解质和肾功能 \n 关注患者依从性和生活方式改善情况 \n\n 药物列表如下：\n\n 钙通道阻滞剂 (CCB)\n\n\n 氨氯地平：降压 8-12/4-6 mmHg (收缩压 / 舒张压)\n 主要副作用：踝部水肿、头痛、面部潮红、心动过速 \n 相互作用：避免与葡萄柚汁同服；与 β 受体阻滞剂合用需谨慎，可能加重心脏传导阻滞 \n\n\n 血管紧张素转换酶抑制剂 (ACEI)\n\n\n 卡托普利 / 依那普利：降压 8-12/4-8 mmHg\n 主要副作用：干咳 (10-20% 患者)、高钾血症、血管性水肿 \n 相互作用：禁忌与 ARB 联用；避免与保钾利尿剂同用；孕妇禁用 \n\n\n 血管紧张素受体拮抗剂 (ARB)\n\n\n 缬沙坦 / 替米沙坦：降压 8-11/5-7 mmHg\n 主要副作用：头晕、高钾血症 (发生率低于 ACEI)\n 相互作用：禁忌与 ACEI 联用；避免与保钾利尿剂同用；孕妇禁用 \n\n\n 噻嗪类利尿剂 \n\n\n 氢氯噻嗪：降压 9-13/4-6 mmHg\n 主要副作用：低钾血症、高尿酸血症、血糖升高、血脂异常 \n 相互作用：避免与糖皮质激素同用；与锂剂合用可能增加锂中毒风险 \n\n\nβ 受体阻滞剂 \n\n\n 美托洛尔 / 比索洛尔：降压 8-10/6-8 mmHg\n 主要副作用：疲劳、心动过缓、支气管痉挛、掩盖低血糖症状 \n 相互作用：避免与维拉帕米类钙通道阻滞剂合用；与胰岛素 / 磺脲类降糖药合用需监测血糖 "\n }\n\n\n}\n\n 只输出 json 文件，不要输出其他不相关内容。',
        agentTitle: 'Agent生成器',
        generateAgentButton: '生成AI智能体(温度用保守)',
        agentInputPlaceholder: '请输入要设计的功能',
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
        invalidJsonStructure: 'json结构不正确，必须包含adminInputs和promptBlocks'
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
