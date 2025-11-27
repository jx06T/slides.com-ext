// utils/slideExtractor.ts

export interface SlideIndex {
    id: string;        // 唯一 ID，給 React list key 用
    h: number;         // 水平 index
    v: number;         // 垂直 index
    title: string;     // 標題 (抓第一行字)
    content: string;   // 全部文字 (給 Fuse 搜尋用)
    type: 'code' | 'text' | 'mixed'; // 簡單分類
}

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

// 解析單頁內容的 Helper
function parseSlideElement(el: HTMLElement, h: number, v: number): SlideIndex {
    // 抓取所有文字內容 (移除多餘空白)
    const fullText = (el.innerText || "").replace(/\s+/g, ' ').trim();

    // 嘗試抓標題：找 h1, h2, 或第一個有文字的元素
    const titleEl = el.querySelector('h1, h2, h3') || el.querySelector('.sl-block-content p');
    const title = titleEl ? (titleEl as HTMLElement).innerText : fullText.slice(0, 40) + "...";

    // 判斷是否包含程式碼 (你的範例有 .python class)
    const hasCode = !!el.querySelector('pre') || !!el.querySelector('code');

    return {
        id: `slide-${h}-${v}`,
        h,
        v,
        title: title.slice(0, 50),
        content: fullText,
        type: hasCode ? 'code' : 'text'
    };
}