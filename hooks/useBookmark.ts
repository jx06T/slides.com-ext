// hooks/useBookmark.ts
import { useState, useEffect, useCallback } from 'react';
import { bookmarksStore, collectionsStore, getBookmarkId, getCurrentPresentationId } from '@/utils/storage';
import { Bookmark, Collection } from '@/types/data';

export function useBookmark() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [currentBookmark, setCurrentBookmark] = useState<Bookmark | null>(null);

    // 1. 核心檢查邏輯：比對當前 URL 與 Storage
    const checkStatus = useCallback(async () => {
        // A. 取得當前頁面的 ID
        const hash = window.location.hash || '#/0/0';
        const h = parseInt(hash.split('/')[1] || '0');
        const v = parseInt(hash.split('/')[2] || '0');
        const currentId = getBookmarkId(h, v);

        // B. 比對 Storage 裡的資料
        const allBookmarks = await bookmarksStore.getValue();
        const found = allBookmarks.find(b => b.id === currentId);

        // C. 更新狀態 (如果沒找到就是 null，UI 就會變回未收藏樣式)
        console.log(allBookmarks, found, currentId)
        setCurrentBookmark(found || null);
    }, []);

    // 2. 初始化與事件監聽
    useEffect(() => {
        // 初始化載入分類
        collectionsStore.getValue().then(setCollections);

        // 初始檢查
        checkStatus();

        // 監聽 hash 變化 (切換投影片時觸發)
        const handleNavigate = () => {
            // 微小的延遲，確保 URL 已經變更完成
            setTimeout(checkStatus, 0);
        };

        // @ts-expect-error
        if (window.navigation) {
            // @ts-expect-error
            window.navigation.addEventListener('navigatesuccess', handleNavigate);
        } else {
            window.addEventListener('hashchange', () => {
                checkStatus();
            });
            window.addEventListener('popstate', () => {
                checkStatus();
            });
        }
        // 監聽 Storage 變化 
        // 1. Bookmarks 變動 (例如在 Dashboard 刪除) -> 重跑檢查
        const unwatchBookmarks = bookmarksStore.watch(() => {
            checkStatus();
        });

        // 2. Collections 變動 (例如在 Dashboard 新增分類) -> 更新列表
        const unwatchCollections = collectionsStore.watch((newCols) => {
            setCollections(newCols);
        });

        return () => {
            window.removeEventListener('hashchange', checkStatus);
            window.removeEventListener('popstate', checkStatus);
            unwatchBookmarks();
            unwatchCollections();
            
            // @ts-expect-error
            if (window.navigation) {
                // @ts-expect-error
                window.navigation.removeEventListener('navigatesuccess', handleNavigate);
            }
        };
    }, [checkStatus]);

    // 3. 儲存 / 更新收藏
    const saveBookmark = async (collectionId: string, note: string = '') => {
        // 抓取當前頁面內容 (簡易 DOM 爬蟲)
        const currentSlideEl = document.querySelector('.reveal .slides section.present');
        let title = document.title;
        let content = '';

        if (currentSlideEl) {
            // 嘗試抓取標題 (h1~h3) 或用 block content
            const h1 = currentSlideEl.querySelector('h1, h2, h3');
            title = (h1 as HTMLElement)?.innerText || document.title;
            content = (currentSlideEl as HTMLElement).innerText || '';
        }

        const hash = window.location.hash || '#/0/0';
        const h = parseInt(hash.split('/')[1] || '0');
        const v = parseInt(hash.split('/')[2] || '0');
        const id = getBookmarkId(h, v);

        const newBookmark: Bookmark = {
            id,
            slideLabel: `${h}-${v}`, // 顯示用的頁碼
            presentationTitle: document.title,
            presentationId: getCurrentPresentationId(),
            url: window.location.href,
            title: title.slice(0, 100), // 標題不要太長
            contentSnippet: content.slice(0, 300), // 搜尋用摘要
            collectionId,
            createdAt: Date.now(),
        };

        // 寫入 Storage
        const all = await bookmarksStore.getValue();
        // 如果已存在就移除舊的 (更新模式)，不存在就直接加 (新增模式)
        const filtered = all.filter(b => b.id !== id);

        // 寫入新數據 (Storage watch 會觸發 checkStatus 更新 UI)
        await bookmarksStore.setValue([newBookmark, ...filtered]);
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