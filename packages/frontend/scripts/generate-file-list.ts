import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

function generateFileList(): void {
    // 处理中文文件列表
    const itemCNDir = path.resolve(process.cwd(), 'public/item_CN')
    const cnFiles = fs.readdirSync(itemCNDir)
    const cnJsonFiles = cnFiles
        .filter(file => file.endsWith('.json') && file !== 'json-files-list.json')
        .map(file => ({
            filename: file,
            encodedFilename: `item_CN/${encodeURIComponent(file)}`
        }))

    // 处理英文文件列表
    const itemENDir = path.resolve(process.cwd(), 'public/item_EN')
    const enFiles = fs.readdirSync(itemENDir)
    const enJsonFiles = enFiles
        .filter(file => file.endsWith('.json') && file !== 'json-files-list.json')
        .map(file => ({
            filename: file,
            encodedFilename: `item_EN/${encodeURIComponent(file)}`
        }))

    // 直接写入到各自的目录
    fs.writeFileSync(
        path.join(itemCNDir, 'json-files-list.json'),
        JSON.stringify(cnJsonFiles, null, 2)
    )
    fs.writeFileSync(
        path.join(itemENDir, 'json-files-list.json'),
        JSON.stringify(enJsonFiles, null, 2)
    )
}

// 当作为脚本直接运行时执行
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    console.log('Generating file lists...')
    generateFileList()
    console.log('File lists generated successfully')
}

export { generateFileList }
