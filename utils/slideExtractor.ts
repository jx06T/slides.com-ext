import { SlideIndex, SlideBlock } from "@/types/data";

export function extractSlides(): SlideIndex[] {
    const slides: SlideIndex[] = [];

    // 1. 抓取最外層的所有 section (水平)
    // .reveal .slides > section 代表只抓第一層
    const horizontalSlides = document.querySelectorAll('.reveal .slides > section');

    horizontalSlides.forEach((hSlide, hIndex) => {
        // 2. 檢查有沒有垂直子頁面
        const verticalSlides = hSlide.querySelectorAll('section');

        if (verticalSlides.length > 0) {
            // === 有垂直子頁面 (2D) ===
            verticalSlides.forEach((vSlide, vIndex) => {
                slides.push(parseSlideElement(vSlide, hIndex, vIndex));
            });
        } else {
            // === 只有水平頁面 (沒有子分頁) ===
            slides.push(parseSlideElement(hSlide as HTMLElement, hIndex, 0));
        }
    });

    return slides;
}

function getCodeTextByRegex(element: HTMLElement): string {
    const clone = element.cloneNode(true) as HTMLElement;

    let html = clone.innerHTML;

    html = html
        .replace(/<\/tr>/gi, '\n')      // 表格行結尾
        // .replace(/<\/div>/gi, '\n')     // div 結尾
        // .replace(/<\/p>/gi, '\n')       // p 結尾
        // .replace(/<br\s*\/?>/gi, '\n'); // br 標籤

    // 4. 建立一個暫存元素來過濾掉剩下的 HTML 標籤 (只取純文字)
    const temp = document.createElement('div');
    temp.innerHTML = html;

    return (temp.textContent || '').trim();
}

function parseSlideElement(el: HTMLElement, h: number, v: number): SlideIndex {
    const blocks: SlideBlock[] = [];

    // 1. 抓取標題 (邏輯保持，優先找 H 標籤)
    const titleEl = el.querySelector('h1, h2, h3') || el.querySelector('.sl-block-content h1');
    // 如果找不到標題標籤，暫時用空字串，後面邏輯會處理
    const title = titleEl ? (titleEl as HTMLElement).textContent.trim() : "";

    // 2. 遍歷內容區塊
    // Slides.com 的內容通常包在 .sl-block-content 裡面
    const contentNodes = el.querySelectorAll('.sl-block-content');

    contentNodes.forEach(node => {
        const element = node as HTMLElement;

        // A. 處理程式碼 (Code)
        const codeEl = element.querySelector('pre code, pre');
        if (codeEl) {

            let lang = '';
            codeEl.classList.forEach(cls => {
                if (cls !== 'hljs' && cls !== 'sl-block-content') {
                    lang = cls.replace('language-', '');
                }
            });
            // 備用方案
            if (!lang) lang = codeEl.getAttribute('data-language') || '';

            blocks.push({
                type: 'code',
                content: getCodeTextByRegex(codeEl as HTMLElement),
                lang
            });
            return;
        }

        // B. 處理列表 (List) - 保留 MD 格式
        const listEl = element.querySelector('ul, ol');
        if (listEl) {
            const isOrdered = listEl.tagName === 'OL';
            const items = listEl.querySelectorAll('li');
            const listContent = Array.from(items).map((li, index) => {
                const prefix = isOrdered ? `${index + 1}. ` : `- `;
                return `${prefix}${li.textContent.trim()}`;
            }).join('\n'); // 列表內部用換行接起來

            if (listContent) {
                blocks.push({
                    type: 'list',
                    content: listContent
                });
            }
            return;
        }

        // C. 處理標題 (Header)
        const headerEl = element.querySelector('h1, h2, h3, h4');
        if (headerEl) {
            const level = parseInt(headerEl.tagName.replace('H', '')) || 2;
            blocks.push({
                type: 'header',
                content: headerEl.textContent?.trim() || '',
                level
            });
            return;
        }

        // D. 處理普通文字 (Text)
        // 排除掉已經被抓出的標題 (避免重複)
        const text = element.textContent.trim();
        if (text && text !== title) {
            blocks.push({
                type: 'text',
                content: text
            });
        }
    });

    // 3. 如果沒抓到標題，試著從第一個 Header block 拿，或是用第一段文字
    let finalTitle = title;
    if (!finalTitle && blocks.length > 0) {
        const firstHeader = blocks.find(b => b.type === 'header');
        if (firstHeader) {
            finalTitle = firstHeader.content;
        } else {
            finalTitle = blocks[0].content.slice(0, 50);
        }
    }
    if (!finalTitle) finalTitle = "Untitled Slide";

    // 4. 產生給 Fuse 搜尋用的字串 (合併所有內容)
    const searchContent = blocks.map(b => b.content).join(' ');

    // 5. 判斷頁面主要類型
    const hasCode = blocks.some(b => b.type === 'code');
    const type = hasCode ? 'code' : 'text';

    return {
        id: `slide-${h}-${v}`,
        h, v,
        title: finalTitle,
        blocks,
        searchContent,
        slideLabel: `${h}-${v}`,
        type
    };
}

export function extractCurrentSlide(): SlideIndex | null {
    // 1. 找到當前可見的 Slide
    const candidates = document.querySelectorAll('.reveal .slides section.present:not([aria-hidden="true"])');
    const currentSlideEl = candidates.length > 0 ? candidates[candidates.length - 1] : null;

    if (!currentSlideEl) return null;

    // 2. 計算座標
    const hash = window.location.hash || '#/0/0';
    const h = parseInt(hash.split('/')[1] || '0');
    const v = parseInt(hash.split('/')[2] || '0');

    // 3. 呼叫解析器
    return parseSlideElement(currentSlideEl as HTMLElement, h, v);
}