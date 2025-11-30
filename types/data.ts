// types/data.ts

export interface Collection {
    id: string;
    name: string;
    color: string;           // 視覺標記用 (例如 #FF5733)
    showInQuickSearch: boolean; // 🔥 關鍵：控制是否出現在 Cmd+K 搜尋結果中
    createdAt: number;
}

export interface Bookmark {
    id: string;              // 唯一 ID (例如: "slides.com/user/deck#2/1")

    // 來源資訊
    slideLabel: string;
    presentationTitle: string;
    presentationId: string;  // 簡報 ID
    url: string;             // 完整跳轉連結

    // 內容資訊 (用於搜尋)
    title: string;
    contentSnippet: string;  // 搜尋用的文字摘要

    // 關聯
    collectionId: string;    // 必填：這張投影片屬於哪個分類

    createdAt: number;
}

export interface SearchResultItem {
    id: string;

    // 來源區分
    source: 'local' | 'bookmark';
    type: string;
    // 搜尋與顯示用
    title: string;
    content: string;

    // 定位用
    h?: number;         // Local 專用
    v?: number;         // Local 專用
    slideLabel: string; // 顯示用的 "1-2"

    // Bookmark 專用
    bookmarkData?: Bookmark;
    presentationTitle?: string; // 來自哪份簡報
    collectionId?: string;    // 這張投影片屬於哪個分類

}