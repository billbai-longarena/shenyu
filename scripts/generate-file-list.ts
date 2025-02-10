import fs from 'node:fs'
import path from 'node:path'

export function generateFileList(): void {
    const publicDir = path.resolve(process.cwd(), 'public')
    const files = fs.readdirSync(publicDir)
    const jsonFiles = files
        .filter(file => file.endsWith('.json'))
        .map(file => ({
            filename: file,
            // 对文件名进行URL编码，以处理中文字符
            encodedFilename: encodeURIComponent(file)
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
