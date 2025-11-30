import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { SearchResultItem } from '@/types/data';

export function useSearchEngine(data: SearchResultItem[], query: string) {
    const [results, setResults] = useState<SearchResultItem[]>([]);

    // 設定 Fuse
    const fuse = useMemo(() => {
        return new Fuse(data, {
            keys: [
                { name: 'title', weight: 0.7 },
                { name: 'content', weight: 0.3 },
                { name: 'presentationTitle', weight: 0.5 }
            ],
            threshold: 0.3,
            ignoreLocation: true,
            includeMatches: true,
        });
    }, [data]);

    // 執行搜尋
    useEffect(() => {
        if (!query.trim()) {
            // 沒輸入關鍵字時，預設顯示 Local 的前幾頁 (體驗較好)
            setResults(data.filter(i => i.source === 'local').slice(0, 20));
            return;
        }

        const searchResults = fuse.search(query);
        setResults(searchResults.map(res => res.item).slice(0, 50));
    }, [query, fuse, data]);

    return results;
}