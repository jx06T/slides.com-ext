import { useState, useEffect } from 'react';
import { bookmarksStore, collectionsStore, getCurrentPresentationId } from '@/utils/storage';
import { SearchResultItem } from '@/types/data';

export function useBookmarkSearchIndex(isOpen: boolean) {
    const [bookmarks, setBookmarks] = useState<SearchResultItem[]>([]);

    useEffect(() => {
        if (!isOpen) return;

        const loadData = async () => {
            const currentDeckId = getCurrentPresentationId();
            const cols = await collectionsStore.getValue();
            const allBookmarks = await bookmarksStore.getValue();

            // 1. 找出允許在快速搜尋顯示的分類 ID
            const allowedColIds = new Set(
                cols.filter(c => c.showInQuickSearch).map(c => c.id)
            );

            // 2. 篩選與格式化
            const formatted: SearchResultItem[] = allBookmarks
                .filter(b => allowedColIds.has(b.collectionId)) // 規則：分類允許
                .filter(b => b.presentationId !== currentDeckId) // 規則：排除當前簡報
                .map(b => ({
                    source: 'bookmark',
                    ...b
                }));

            setBookmarks(formatted);
        };

        loadData();
    }, [isOpen]);

    return bookmarks;
}