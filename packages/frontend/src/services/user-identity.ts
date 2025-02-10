export interface BrowserFingerprint {
    userAgent: string;
    language: string;
    colorDepth: number;
    screenResolution: string;
    timezone: string;
    cookiesEnabled: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    fonts: string[];
    canvasFingerprint: string;
    webglVendor: string;
    webglRenderer: string;
}

/**
 * 收集浏览器指纹
 */
export async function collectBrowserFingerprint(): Promise<BrowserFingerprint> {
    // 获取Canvas指纹
    const getCanvasFingerprint = (): string => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        // 绘制一些内容
        canvas.width = 200;
        canvas.height = 50;
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('Hello, world!', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Hello, world!', 4, 17);

        return canvas.toDataURL();
    };

    // 获取已安装字体
    const getFonts = async (): Promise<string[]> => {
        if ('queryLocalFonts' in window) {
            try {
                // @ts-ignore
                const fonts = await window.queryLocalFonts();
                return fonts.map((font: any) => font.family);
            } catch {
                return [];
            }
        }
        return [];
    };

    // 获取WebGL信息
    const getWebGLInfo = (): { vendor: string; renderer: string } => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        if (!gl) return { vendor: '', renderer: '' };

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (!debugInfo) return { vendor: '', renderer: '' };

        return {
            vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '',
            renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || ''
        };
    };

    // 获取屏幕分辨率
    const getScreenResolution = (): string => {
        return `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    };

    // 获取时区
    const getTimezone = (): string => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch {
            return '';
        }
    };

    const webglInfo = getWebGLInfo();
    const fonts = await getFonts();

    return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        colorDepth: window.screen.colorDepth,
        screenResolution: getScreenResolution(),
        timezone: getTimezone(),
        cookiesEnabled: navigator.cookieEnabled,
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage,
        fonts,
        canvasFingerprint: getCanvasFingerprint(),
        webglVendor: webglInfo.vendor,
        webglRenderer: webglInfo.renderer
    };
}
