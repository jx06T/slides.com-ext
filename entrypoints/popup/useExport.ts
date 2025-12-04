import { useState } from 'react';
import { browser } from 'wxt/browser';

export function useExport() {
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const exportMarkdown = async () => {
        setIsExporting(true);
        setError(null);

        try {
            // 1. 獲取當前活躍的分頁
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

            if (!tab?.id) {
                throw new Error('找不到當前分頁');
            }

            // 2. 發送訊息給 Content Script 要資料
            // 注意：如果該分頁不是 Slides 網站，Content Script 不會跑，這裡會報錯
            const response = await browser.tabs.sendMessage(tab.id, { type: 'GET_SLIDES_DATA' }).catch(() => {
                throw new Error('無法連接到頁面，請確認您在簡報頁面上並重新整理。');
            });

            if (!response || !response.slides) {
                throw new Error('無法抓取投影片資料');
            }

            const { title, slides } = response;

            // 3. 轉換成 Markdown
            let mdContent = `# ${title}\n\n`;
            mdContent += `> Exported via Slides Extension\n\n---\n\n`;

            slides.forEach((slide: any) => {
                mdContent += `## Slide ${slide.slideLabel}: ${slide.title}\n\n`;

                if (slide.blocks && slide.blocks.length > 0) {
                    slide.blocks.forEach((block: any) => {
                        switch (block.type) {
                            case 'code':
                                // 1. 程式碼區塊
                                mdContent += '```' + (block.lang || '') + '\n' + block.content + '\n```\n\n';
                                break;

                            case 'list':
                                // 2. 列表 (已經在爬蟲階段處理好前綴了，直接輸出)
                                mdContent += block.content + '\n\n';
                                break;

                            case 'header':
                                // 3. 標題 (根據 level 加上 #)
                                mdContent += `${'#'.repeat(block.level || 2)} ${block.content}\n\n`;
                                break;

                            case 'text':
                            default:
                                // 4. 普通段落 (確保換行)
                                mdContent += `${block.content}\n\n`;
                                break;
                        }
                    });
                } else {
                    // Fallback (舊資料相容)
                    mdContent += `${slide.content || ''}\n\n`;
                }

                mdContent += `---\n\n`;
            });

            // 4. 下載檔案 (Popup 環境可以直接操作 Blob 下載)
            const blob = new Blob([mdContent], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const safeTitle = (title || 'slides').replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_');
            a.download = `${safeTitle}.md`;
            document.body.appendChild(a); // Firefox 需要掛載才能點擊
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