import { ref, computed, inject, watch, reactive, type Ref, type ComputedRef } from 'vue'

export interface JsonFile {
    filename: string;
    encodedFilename: string;
}

export interface UseJsonFilesReturn {
    jsonFiles: Ref<JsonFile[]>;
    fetchJsonFiles: () => Promise<void>;
    getDefaultFile: ComputedRef<string>;
}

export function useJsonFiles(): UseJsonFilesReturn {
    console.log('[useJsonFiles] 初始化')
    const languageState = inject<{ current: 'en' | 'zh' }>('languageState')
    if (!languageState) {
        console.error('[useJsonFiles] languageState未被提供')
        throw new Error('languageState not provided')
    }
    console.log('[useJsonFiles] 获取到当前语言:', languageState.current)


    interface I18nState {
        currentLang: 'en' | 'zh'
        currentDir: string
        defaultFile: string
    }

    // 计算属性：当前语言目录
    const currentDir = computed(() => {
        const dir = languageState.current === 'en' ? 'item_EN' : 'item_CN'
        console.log('[useJsonFiles] 计算语言目录', {
            当前语言: languageState.current,
            目录: dir
        })
        return dir
    })

    // 计算属性：默认文件名
    const getDefaultFile = computed(() => {
        const file = languageState.current === 'en' ? 'Hypertension_Quick_Prescription.json' : '高血压快速配药器.json'
        console.log('[useJsonFiles] 计算默认文件', {
            当前语言: languageState.current,
            文件: file
        })
        return file
    })

    const jsonFiles = ref<JsonFile[]>([])

    // 监听语言变化
    watch(() => languageState.current, (newLang) => {
        console.log('[useJsonFiles] 语言变化:', newLang)
        // 语言变化时不自动获取文件列表，让用户点击时再获取
        jsonFiles.value = [] // 清空文件列表，强制用户重新获取
    })

    // 获取文件列表
    const fetchJsonFiles = async () => {
        const dir = currentDir.value
        console.log('[useJsonFiles] 开始获取文件列表', {
            当前语言: languageState.current,
            目录: dir
        })
        try {
            // 添加时间戳以避免缓存
            const timestamp = new Date().getTime()
            const url = `/${dir}/json-files-list.json?t=${timestamp}`
            console.log('[useJsonFiles] 请求URL:', url)
            const response = await fetch(url, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                cache: 'no-store'
            })
            if (!response.ok) {
                throw new Error('Failed to fetch json files list')
            }
            const files: JsonFile[] = await response.json()
            if (!Array.isArray(files)) {
                throw new Error('Invalid response format')
            }

            // 更新文件列表，确保文件路径正确
            jsonFiles.value = files.map(file => {
                const encodedFilename = `${dir}/${encodeURIComponent(file.filename)}`
                /*console.log('[useJsonFiles] 处理文件:', {
                    原始文件名: file.filename,
                    编码后路径: encodedFilename
                })*/
                return {
                    ...file,
                    encodedFilename
                }
            })
            console.log('[useJsonFiles] 文件列表更新完成, 共', jsonFiles.value.length, '个文件')
        } catch (error) {
            console.error('Error accessing json files:', error)
            jsonFiles.value = []
            throw new Error(`无法获取或访问${languageState.current === 'en' ? '英文' : '中文'}JSON文件，请检查文件是否存在`)
        }
    }

    return {
        jsonFiles,
        fetchJsonFiles,
        getDefaultFile
    }
}
