declare global {
    interface Window {
        pdfjsLib: any;
    }
}

let ws: WebSocket | null = null;
let resolveCallback: ((value: string) => void) | null = null;
let rejectCallback: ((reason: any) => void) | null = null;

function setupWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        return;
    }

    console.log('正在建立WebSocket连接...');
    ws = new WebSocket('ws://localhost:3001/websocket');

    ws.onopen = () => {
        console.log('WebSocket连接已建立');
    };

    ws.onmessage = (event) => {
        const response = JSON.parse(event.data);

        switch (response.type) {
            case 'parseProgress':
                console.log('解析进度:', response.status);
                break;

            case 'parseResult':
                if (resolveCallback) {
                    resolveCallback(response.content);
                    resolveCallback = null;
                    rejectCallback = null;
                }
                break;

            case 'parseError':
                if (rejectCallback) {
                    rejectCallback(new Error(response.error));
                    resolveCallback = null;
                    rejectCallback = null;
                }
                break;
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket错误:', error);
        if (rejectCallback) {
            rejectCallback(error);
            resolveCallback = null;
            rejectCallback = null;
        }
    };

    ws.onclose = (event) => {
        console.log('WebSocket连接关闭:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
        });
        ws = null;
    };
}

async function loadPdfJs(): Promise<void> {
    if (!window.pdfjsLib) {
        await new Promise<void>((resolve, reject) => {
            const pdfScript = document.createElement('script');
            pdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            pdfScript.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve();
            };
            pdfScript.onerror = () => reject(new Error('Failed to load pdf.js'));
            document.head.appendChild(pdfScript);
        });
    }
}

async function renderPageToImage(page: any, pageNum: number): Promise<string> {
    const scale = 2; // 提高清晰度
    const viewport = page.getViewport({ scale });

    // 创建canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('无法创建canvas上下文');
    }

    // 设置canvas尺寸
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // 渲染PDF页面到canvas
    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;

    // 使用Promise包装blob转换过程
    return new Promise((resolve, reject) => {
        try {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('无法创建图片blob'));
                    return;
                }

                // 保存调试图片
                const debugUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `debug_page_${pageNum}.jpg`;
                link.href = debugUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(debugUrl);

                // 转换为base64
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result as string;
                    const pureBase64 = base64data.split(',')[1];
                    console.log(`已保存第${pageNum}页图片，尺寸: ${canvas.width}x${canvas.height}`);
                    resolve(pureBase64);
                };
                reader.onerror = () => {
                    reject(new Error('读取图片数据失败'));
                };
                reader.readAsDataURL(blob);
            }, 'image/jpeg', 0.95); // 使用较高的质量
        } catch (error) {
            reject(error);
        }
    });
}

export async function parsePdfContent(base64Content: string, useLocalOcr: boolean = false): Promise<string> {
    try {
        // 加载PDF.js
        await loadPdfJs();

        // 确保WebSocket连接已建立
        setupWebSocket();
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            await new Promise<void>((resolve) => {
                const checkConnection = () => {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        resolve();
                    } else {
                        setTimeout(checkConnection, 100);
                    }
                };
                checkConnection();
            });
        }

        // 从base64字符串获取PDF数据
        let fileData = base64Content;
        if (base64Content.includes(',')) {
            fileData = base64Content.split(',')[1];
        }

        // 解析PDF
        const pdfData = atob(fileData);
        const pdfBytes = new Uint8Array(pdfData.length);
        for (let i = 0; i < pdfData.length; i++) {
            pdfBytes[i] = pdfData.charCodeAt(i);
        }

        const pdf = await window.pdfjsLib.getDocument({ data: pdfBytes }).promise;
        const numPages = pdf.numPages;

        console.log('PDF信息:', {
            pageCount: numPages,
            timestamp: new Date().toISOString()
        });

        // 创建Promise来处理最终结果
        return new Promise((resolve, reject) => {
            resolveCallback = resolve;
            rejectCallback = reject;

            // 处理每一页
            let processedPages = 0;
            let allResults: string[] = new Array(numPages);

            const processPage = async (pageNum: number) => {
                try {
                    const page = await pdf.getPage(pageNum);
                    const imageData = await renderPageToImage(page, pageNum);

                    // 发送单页识别请求
                    ws!.send(JSON.stringify({
                        type: 'parseDocument',
                        fileData: imageData,
                        fileName: `page_${pageNum}_${Date.now()}.jpg`,
                        useLocalOcr: useLocalOcr,
                        pageInfo: {
                            pageNumber: pageNum,
                            totalPages: numPages
                        }
                    }));

                } catch (error) {
                    console.error(`处理第${pageNum}页时出错:`, error);
                    rejectCallback?.(error);
                }
            };

            // 监听WebSocket消息的处理函数
            const originalOnMessage = ws!.onmessage;
            ws!.onmessage = (event) => {
                const response = JSON.parse(event.data);

                switch (response.type) {
                    case 'parseProgress':
                        console.log('解析进度:', response.status);
                        break;

                    case 'parseResult':
                        processedPages++;
                        if (response.pageInfo) {
                            allResults[response.pageInfo.pageNumber - 1] = response.content;
                        }

                        // 所有页面都处理完成
                        if (processedPages === numPages) {
                            const finalResult = allResults.join('\n\n');
                            resolveCallback?.(finalResult);
                            resolveCallback = null;
                            rejectCallback = null;
                            // 恢复原始的消息处理函数
                            ws!.onmessage = originalOnMessage;
                        }
                        break;

                    case 'parseError':
                        rejectCallback?.(new Error(response.error));
                        resolveCallback = null;
                        rejectCallback = null;
                        // 恢复原始的消息处理函数
                        ws!.onmessage = originalOnMessage;
                        break;
                }
            };

            // 开始处理所有页面
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                processPage(pageNum);
            }
        });
    } catch (error) {
        console.error('PDF解析错误:', error);
        throw new Error('PDF解析失败');
    }
}
