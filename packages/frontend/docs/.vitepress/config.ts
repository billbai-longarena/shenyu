import { defineConfig } from 'vitepress'

export default defineConfig({
    title: 'Sales Nail 文档',
    description: 'Sales Nail项目文档',
    themeConfig: {
        nav: [
            { text: '指南', link: '/guide/' },
            { text: '组件', link: '/components/' },
            { text: 'API', link: '/api/' },
            { text: '更新日志', link: '/changelog' }
        ],
        sidebar: {
            '/guide/': [
                {
                    text: '开始',
                    items: [
                        { text: '介绍', link: '/guide/' },
                        { text: '快速开始', link: '/guide/getting-started' }
                    ]
                },
                {
                    text: '开发指南',
                    items: [
                        { text: '项目结构', link: '/guide/#项目结构' },
                        { text: '开发规范', link: '/guide/#开发规范' },
                        { text: '最佳实践', link: '/guide/#最佳实践' }
                    ]
                }
            ],
            '/components/': [
                {
                    text: '基础组件',
                    items: [
                        { text: 'HistoryPanel', link: '/components/history-panel' }
                    ]
                },
                {
                    text: '业务组件',
                    items: [
                        { text: 'SN43View', link: '/components/sn43-view' }
                    ]
                }
            ],
            '/api/': [
                {
                    text: '接口',
                    items: [
                        { text: 'DeepSeek Stream', link: '/api/deepseek-stream' }
                    ]
                }
            ]
        },
        outline: {
            level: [2, 3],
            label: '目录'
        },
        docFooter: {
            prev: '上一页',
            next: '下一页'
        },
        returnToTopLabel: '返回顶部',
        sidebarMenuLabel: '菜单',
        darkModeSwitchLabel: '主题',
        lastUpdatedText: '最后更新'
    }
})
