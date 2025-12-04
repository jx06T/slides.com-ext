import { useState } from 'react';
import { browser } from 'wxt/browser';

export function useExport() {
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const exportMarkdown = async () => {
        setIsExporting(true);
        setError(null);

        try {
            // 1. 獲取資料 (這部分不變)
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id) throw new Error('找不到當前分頁');

            const response = await browser.tabs.sendMessage(tab.id, { type: 'GET_SLIDES_DATA' }).catch(() => {
                throw new Error('無法連接到頁面，請確認您在簡報頁面上並重新整理。');
            });

            if (!response || !response.slides) throw new Error('無法抓取投影片資料');

            const { title, slides } = response;

            // 2. 轉換成 Reveal.js 標準 Markdown
            let mdContent = '';
            
            // 為了不干擾 Reveal 解析，前面不要加太多自定義 Header
            // 如果要加 meta info，可以加在 HTML comment 裡
            mdContent += `<!-- Exported via Slides Extension: ${title} -->\n\n`;

            let prevH = -1;

            slides.forEach((slide: any, index: number) => {
                const currentH = slide.h;
                
                // 決定分隔符
                if (index > 0) {
                    if (currentH !== prevH) {
                        // 水平切換 (Horizontal Slide)
                        mdContent += '\n\n---\n\n';
                    } else {
                        // 垂直切換 (Vertical Slide)
                        mdContent += '\n\n--\n\n';
                    }
                }
                prevH = currentH;

                // 產生單頁內容 (Block 解析邏輯)
                if (slide.blocks && slide.blocks.length > 0) {
                    slide.blocks.forEach((block: any) => {
                        switch (block.type) {
                            case 'code':
                                // 程式碼區塊
                                mdContent += '``` ' + (block.lang || '') + '\n' + block.content + '\n```\n\n';
                                break;
                            case 'list':
                                // 列表 (確保上下有空行)
                                mdContent += block.content + '\n\n';
                                break;
                            case 'header':
                                // 標題 (根據 level 加上 #)
                                mdContent += `${'#'.repeat(block.level || 2)} ${block.content}\n\n`;
                                break;
                            case 'text':
                            default:
                                // 普通段落
                                mdContent += `${block.content}\n\n`;
                                break;
                        }
                    });
                } else {
                    // Fallback
                    mdContent += `${slide.content || ''}\n\n`;
                }
            });

            // 3. 下載檔案 (這部分不變)
            const blob = new Blob([mdContent], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const safeTitle = (title || 'slides').replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_');
            a.download = `${safeTitle}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (err: any) {
            console.error(err);
            setError(err.message || '匯出失敗');
        } finally {
            setIsExporting(false);
        }
    };

    return { exportMarkdown, isExporting, error };
}