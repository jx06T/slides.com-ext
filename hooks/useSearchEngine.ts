import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { SearchResultItem, Bookmark } from '@/types/data';

export function useSearchEngine(data: SearchResultItem[], query: string) {
    const [results, setResults] = useState<SearchResultItem[]>([]);

    // 1. 預處理資料：為了讓 Fuse 能針對不同區塊給權重
    // 我們在記憶體中建立一個「搜尋專用」的物件結構，不影響原始資料
    const searchableData = useMemo(() => {
        return data.map(item => {
            // 如果 item 有 blocks (新結構)，我們就把它拆開
            const blocks = item.blocks || [];

            return {
                ...item, // 保留原始欄位 (id, h, v 等)

                // 拆解內容給搜尋引擎專用
                // A. 投影片大標題
                _s_title: item.title,

                // B. 內文中的標題 (H1~H6) -> 權重僅次於大標題
                _s_headers: blocks
                    .filter(b => b.type === 'header')
                    .map(b => b.content).join(' '),

                // C. 程式碼內容與語言 -> 權重高 (通常是關鍵字)
                _s_code: blocks
                    .filter(b => b.type === 'code')
                    .map(b => `${b.content} ${b.lang || ''}`).join(' '),

                // D. 普通內文與列表 -> 權重普通
                _s_text: blocks
                    .filter(b => b.type === 'text' || b.type === 'list')
                    .map(b => b.content).join(' '),

                // E. 來源簡報標題 (Bookmark 用)
                _s_deck: item.source === "bookmark" ? "" : item.presentationTitle || ""
            };
        });
    }, [data]);

    // 2. 設定 Fuse：精細化權重配置
    const fuse = useMemo(() => {
        return new Fuse(searchableData, {
            keys: [
                // 1. 最重要：投影片標題
                { name: '_s_title', weight: 1.0 },

                // 2. 次重要：內文中的小標題
                { name: '_s_headers', weight: 0.8 },

                // 3. 程式碼 (通常包含關鍵 API 名稱)
                { name: '_s_code', weight: 0.7 },

                // 4. 來源簡報名稱 (方便找特定投影片)
                { name: '_s_deck', weight: 0.5 },

                // 5. 普通內文 (權重最低，作為保底)
                { name: '_s_text', weight: 0.6 },

                // 兼容舊資料 (如果沒有 blocks 的話)
                { name: 'searchContent', weight: 0.5 }
            ],
            threshold: 0.3, // 模糊程度
            ignoreLocation: true, // 全文搜尋，不限制關鍵字出現位置
            includeMatches: true,
            minMatchCharLength: 2 // 至少輸入 2 個字才開始匹配
        });
    }, [searchableData]);

    // 3. 執行搜尋
    useEffect(() => {
        if (!query.trim()) {
            setResults(data.filter(i => i.source === 'local').slice(0, 20));
            return;
        }

        const searchResults = fuse.search(query);

        setResults(searchResults.map(res => res.item));

    }, [query, fuse, data]);

    return results;
}