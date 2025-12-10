export interface Collection {
    id: string;
    name: string;
    color: string;           // 視覺標記用 (例如 #FF5733)
    showInQuickSearch: boolean; // 控制是否出現在 Cmd+K 搜尋結果中
    createdAt: number;
}

export interface Bookmark extends SlideIndex {
    // 來源資訊
    presentationId: string;
    presentationTitle: string;
    url: string;            // 完整跳轉連結

    // 分類資訊
    collectionId: string;   // 必填：這張投影片屬於哪個分類

    // 額外資訊
    bookmarkId: string;     // Bookmark 自己的唯一 ID
    createdAt: number;
}

export type SearchResultItem =
    | (SlideIndex & { source: 'local'; presentationTitle?: string }) // 本地資料 (多補一個 presentationTitle 可選欄位方便 UI 顯示)
    | (Bookmark & { source: 'bookmark' }); // 收藏資料 (自帶 presentationTitle)


export type BlockType = 'text' | 'code' | 'list' | 'header' | 'image';

export interface SlideBlock {
    type: BlockType;
    content: string; // 內容
    lang?: string;   // code 專用
    level?: number;  // header 專用 (h1~h6)
    src?: string;    // 新增：圖片網址
    alt?: string;
}

export interface SlideIndex {
    id: string;
    h: number;
    v: number;
    slideLabel: string;     // 例如 "2-1"
    title: string;

    // 🔥 新結構：有序的內容區塊
    blocks: SlideBlock[];

    // 為了 Fuse.js 搜尋方便，我們還是會生成一個純文字版
    searchContent: string;

    // 為了列表顯示方便，保留主要類型
    type: 'code' | 'text' | 'mixed';
}
