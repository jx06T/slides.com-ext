import { useState, useEffect, useCallback } from 'react';
import { bookmarksStore, collectionsStore, getBookmarkId, getCurrentPresentationId } from '@/utils/storage';
import { Bookmark, Collection } from '@/types/data';
import { useSlideNavigation } from '@/hooks/useSlideNavigation';
import { extractCurrentSlide } from '@/utils/slideExtractor';

export function useBookmarkStore() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [currentBookmark, setCurrentBookmark] = useState<Bookmark | null>(null);
    const { h, v } = useSlideNavigation();

    // 1. 檢查狀態
    const checkStatus = useCallback(async (currentH: number, currentV: number) => {
        const currentId = getBookmarkId(currentH, currentV);
        const allBookmarks = await bookmarksStore.getValue();
        const found = allBookmarks.find(b => b.id === currentId);
        setCurrentBookmark(found || null);
    }, []);

    // 2. 監聽變化
    useEffect(() => {
        checkStatus(h, v);
    }, [h, v, checkStatus]);

    useEffect(() => {
        collectionsStore.getValue().then(setCollections);
        const unwatchBookmarks = bookmarksStore.watch(() => checkStatus(h, v));
        const unwatchCollections = collectionsStore.watch(setCollections);
        return () => { unwatchBookmarks(); unwatchCollections(); };
    }, [h, v, checkStatus]);

    // 3. 儲存邏輯
    const saveBookmark = async (collectionId: string, note: string = '') => {
        // 使用 extractCurrentSlide，它內部已經包含了:
        // 1. 找到正確的 DOM (排除 hidden)
        // 2. 解析出 blocks (包含 code lang, list, header)
        // 3. 產生 searchContent
        const slideData = extractCurrentSlide();

        if (!slideData) {
            console.warn('無法讀取當前投影片');
            return;
        }

        const id = getBookmarkId(slideData.h, slideData.v);

        const newBookmark: Bookmark = {
            bookmarkId: id,
            // 基礎資訊
            presentationTitle: document.title,
            presentationId: getCurrentPresentationId(),
            url: window.location.href,

            collectionId,

            createdAt: Date.now(),
            ...slideData
        };

        const all = await bookmarksStore.getValue();
        const filtered = all.filter(b => b.id !== id);
        await bookmarksStore.setValue([newBookmark, ...filtered]);

        setCurrentBookmark(newBookmark);
    };

    // 4. 移除收藏
    const removeBookmark = async () => {
        if (!currentBookmark) return;
        const all = await bookmarksStore.getValue();
        await bookmarksStore.setValue(all.filter(b => b.id !== currentBookmark.id));
    };

    return {
        collections,
        currentBookmark,
        saveBookmark,
        removeBookmark
    };
}