import { storage } from '#imports';
import { Bookmark, Collection } from '@/types/data';

const DEFAULT_COLLECTION: Collection = {
    id: 'default',
    name: 'General',
    color: '#94a3b8',
    showInQuickSearch: true,
    createdAt: Date.now(),
};

// --- Storage Items ---

// 分類通常很小，可以用 sync 讓使用者跨裝置同步分類設定
export const collectionsStore = storage.defineItem<Collection[]>('sync:collections', {
    defaultValue: [DEFAULT_COLLECTION],
    version: 1,
});

// Bookmark 暫時用 local
export const bookmarksStore = storage.defineItem<Bookmark[]>('local:bookmarks', {
    defaultValue: [],
    version: 1,
});

// --- Helper Functions ---

export const generateId = () => Math.random().toString(36).substring(2, 9);

export const getCurrentPresentationId = () => {
    if (window.location.protocol === 'chrome-extension:') {
        console.warn('getCurrentPresentationId called from extension page, this might be a bug.');
        return 'extension-context';
    }

    const path = window.location.pathname.split('/').filter(Boolean);
    if (path.length >= 2) return `${path[0]}/${path[1]}`;
    return 'unknown-presentation';
};

export const getBookmarkId = (h: number, v: number) => {
    return `${getCurrentPresentationId()}#${h}/${v}`;
};