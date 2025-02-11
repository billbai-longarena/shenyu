import fs from 'node:fs'
import path from 'node:path'

export function generateFileList(): void {
    const itemCNDir = path.resolve(process.cwd(), 'public/item_CN')
    const files = fs.readdirSync(itemCNDir)
    const jsonFiles = files
        .filter(file => file.endsWith('.json'))
        .map(file => ({
            filename: file,
            // 添加item_CN路径前缀并进行URL编码
            encodedFilename: `item_CN/${encodeURIComponent(file)}`
        }))

    // 确保dist目录存在
    const distDir = path.resolve(process.cwd(), 'dist')
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir)
    }

    // 写入文件列表
    fs.writeFileSync(
        path.join(distDir, 'json-files-list.json'),
        JSON.stringify(jsonFiles, null, 2)
    )
}
