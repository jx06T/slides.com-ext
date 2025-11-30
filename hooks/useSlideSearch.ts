import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { extractSlides, SlideIndex } from '@/utils/slideExtractor';

export function useSlideSearch(isOpen: boolean, query: string) {
    const [slides, setSlides] = useState<SlideIndex[]>([]);
    const [results, setResults] = useState<SlideIndex[]>([]);

    // 1. 當開啟時，執行爬蟲
    useEffect(() => {
        if (isOpen) {
            // 可以在這裡做個 debounce 或是檢查是否已經爬過 (如果內容不會變的話)
            const data = extractSlides();
            setSlides(data);
        }
    }, [isOpen]);

    // 2. 設定 Fuse
    const fuse = useMemo(() => {
        return new Fuse(slides, {
            keys: ['content', 'title'],
            threshold: 0.3,
            ignoreLocation: true,
            includeMatches: true, // 讓 fuse 告訴我們哪裡匹配到了 (進階高亮用，這邊先保留)
        });
    }, [slides]);

    // 3. 執行搜尋
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        const searchResults = fuse.search(query);
        // 限制回傳數量優化效能
        setResults(searchResults.map(res => res.item).slice(0, 50)); 
    }, [query, fuse]);

    return { results, slideCount: slides.length };
}