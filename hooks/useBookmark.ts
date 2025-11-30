// hooks/useBookmark.ts
import { useState, useEffect, useCallback } from 'react';
import { bookmarksStore, collectionsStore, getBookmarkId, getCurrentPresentationId } from '@/utils/storage';
import { Bookmark, Collection } from '@/types/data';
import { useSlideNavigation } from '@/hooks/useSlideNavigation';

export function useBookmark() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [currentBookmark, setCurrentBookmark] = useState<Bookmark | null>(null);
    const { h, v } = useSlideNavigation();

    // 核心檢查邏輯 (現在變成依賴 h, v 參數)
    const checkStatus = useCallback(async (currentH: number, currentV: number) => {
        const currentId = getBookmarkId(currentH, currentV);
        const allBookmarks = await bookmarksStore.getValue();
        const found = allBookmarks.find(b => b.id === currentId);
        setCurrentBookmark(found || null);
    }, []);

    // 當 h, v 改變時 (換頁時)，自動重跑檢查
    useEffect(() => {
        checkStatus(h, v);
    }, [h, v, checkStatus]);

    // 初始化與 Storage 監聽 (這部分保留，但移除了 window event listener)
    useEffect(() => {
        collectionsStore.getValue().then(setCollections);

        const unwatchBookmarks = bookmarksStore.watch(() => checkStatus(h, v));
        const unwatchCollections = collectionsStore.watch(setCollections);

        return () => {
            unwatchBookmarks();
            unwatchCollections();
            // 不需要 removeEventListener 了，useSlideNavigation 會處理
        };
    }, [h, v, checkStatus]);

    // 3. 儲存 / 更新收藏
    const saveBookmark = async (collectionId: string, note: string = '') => {
        // 1. 抓取所有標記為 present 的 section
        // 2. 排除 aria-hidden="true"
        const candidates = document.querySelectorAll('.reveal .slides section.present:not([aria-hidden="true"])');

        // 3. 取最後一個 (Deepest active slide)
        // 原因：如果是垂直投影片，父層和子層都有 present，querySelectorAll 會依序回傳 [父, 子]
        // 我們要的是最內層的「子投影片」，也就是當前使用者看到的內容。
        const currentSlideEl = candidates.length > 0 ? candidates[candidates.length - 1] : null;

        let title = document.title;
        let content = '';

        if (currentSlideEl) {
            const el = currentSlideEl as HTMLElement;

            // 嘗試抓取標題 (增加針對 Slides.com 的結構 .sl-block-content 判斷)
            const h1 = el.querySelector('h1, h2, h3') || el.querySelector('.sl-block-content h1, .sl-block-content h2');

            // 獲取純文字內容
            const rawText = el.innerText || '';

            // 標題邏輯：有 H 標籤用 H 標籤，沒有則抓第一行字，再沒有就用網頁標題
            title = (h1 as HTMLElement)?.innerText
                || rawText.split('\n').find(line => line.trim().length > 0)?.slice(0, 50)
                || document.title;

            content = rawText;
        }

        const hash = window.location.hash || '#/0/0';
        const h = parseInt(hash.split('/')[1] || '0');
        const v = parseInt(hash.split('/')[2] || '0');
        const id = getBookmarkId(h, v);

        const newBookmark: Bookmark = {
            id,
            slideLabel: `${h}-${v}`,
            presentationTitle: document.title,
            presentationId: getCurrentPresentationId(),
            url: window.location.href,
            title: title.slice(0, 100),
            contentSnippet: content.slice(0, 300),
            collectionId,
            createdAt: Date.now(),
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
        // Storage watch 會自動觸發 checkStatus，將 currentBookmark 設為 null
    };

    return {
        collections,
        currentBookmark,
        saveBookmark,
        removeBookmark
    };
}