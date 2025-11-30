// utils/storage.ts
import { storage } from '#imports';
import { Bookmark, Collection } from '@/types/data';

// 預設分類：未分類 (預設顯示)
const DEFAULT_COLLECTION: Collection = {
    id: 'default',
    name: 'General',
    color: '#94a3b8', // 灰色
    showInQuickSearch: true, 
    createdAt: Date.now(),
};

// --- Storage Items ---

export const collectionsStore = storage.defineItem<Collection[]>('sync:collections', {
    defaultValue: [DEFAULT_COLLECTION],
    version: 1,
});

export const bookmarksStore = storage.defineItem<Bookmark[]>('sync:bookmarks', {
    defaultValue: [],
    version: 1,
});

// --- Helper Functions ---

// 產生 ID 工具
export const generateId = () => Math.random().toString(36).substring(2, 9);

// 取得當前網址的 Presentation ID (針對 Slides.com)
export const getCurrentPresentationId = () => {
    const path = window.location.pathname.split('/').filter(Boolean);
    // 例如 /username/deck-name -> username/deck-name
    if (path.length >= 2) return `${path[0]}/${path[1]}`;
    return 'unknown-presentation';
};

// 產生唯一的 Bookmark ID (避免同一頁重複存)
export const getBookmarkId = (h: number, v: number) => {
    return `${getCurrentPresentationId()}#${h}/${v}`;
};