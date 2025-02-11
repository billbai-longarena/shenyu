import { ref } from 'vue'

export function useJsonFiles() {
    interface JsonFile {
        filename: string;
        encodedFilename: string;
    }

    const jsonFiles = ref<string[]>([])

    // 获取public目录下的json文件列表
    const fetchJsonFiles = async () => {
        try {
            const response = await fetch('/json-files-list.json')
            if (!response.ok) {
                throw new Error('Failed to fetch json files list')
            }
            const files: JsonFile[] = await response.json()
            if (!Array.isArray(files)) {
                throw new Error('Invalid response format')
            }

            // 直接使用文件列表，不进行额外的可访问性检查
            jsonFiles.value = files.map(file => file.filename)
        } catch (error) {
            console.error('Error accessing json files:', error)
            throw new Error('无法获取或访问JSON文件，请检查文件是否存在')
        }
    }

    return {
        jsonFiles,
        fetchJsonFiles
    }
}
