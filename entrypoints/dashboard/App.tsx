// entrypoints/dashboard/App.tsx
import { useState, useEffect, useMemo } from 'react';
import { collectionsStore, bookmarksStore, generateId } from '@/utils/storage';
import { Collection, Bookmark } from '@/types/data';
import {
    FolderPlus, Trash2, Search, ExternalLink, Settings,
    MoreVertical, Edit2, Check, X, Tag
} from 'lucide-react';

export default function App() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

    const [activeColId, setActiveColId] = useState<string>('all'); // 'all' 或 collectionId
    const [searchQuery, setSearchQuery] = useState('');

    // Modal 狀態
    const [isEditColModalOpen, setIsEditColModalOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

    // 初始化資料
    useEffect(() => {
        const loadData = async () => {
            setCollections(await collectionsStore.getValue());
            setBookmarks(await bookmarksStore.getValue());
        };
        loadData();

        // 監聽變更 (如果有其他視窗在改)
        const unwatch1 = collectionsStore.watch(setCollections);
        const unwatch2 = bookmarksStore.watch(setBookmarks);
        return () => { unwatch1(); unwatch2(); };
    }, []);

    // --- CRUD Actions ---

    const handleSaveCollection = async (name: string, color: string, showInSearch: boolean) => {
        let newCols = [...collections];

        if (editingCollection) {
            // 編輯模式
            newCols = newCols.map(c => c.id === editingCollection.id ? { ...c, name, color, showInQuickSearch: showInSearch } : c);
        } else {
            // 新增模式
            const newCol: Collection = {
                id: generateId(),
                name,
                color,
                showInQuickSearch: showInSearch,
                createdAt: Date.now()
            };
            newCols.push(newCol);
        }

        await collectionsStore.setValue(newCols);
        setIsEditColModalOpen(false);
        setEditingCollection(null);
    };

    const handleDeleteCollection = async (id: string) => {
        if (!confirm('確定要刪除此分類嗎？底下的收藏會被移至「未分類」。')) return;

        // 1. 刪除分類
        const newCols = collections.filter(c => c.id !== id);
        await collectionsStore.setValue(newCols);

        // 2. 移動 bookmark 到 default
        const newBookmarks = bookmarks.map(b => b.collectionId === id ? { ...b, collectionId: 'default' } : b);
        await bookmarksStore.setValue(newBookmarks);

        if (activeColId === id) setActiveColId('all');
    };

    const handleDeleteBookmark = async (id: string) => {
        if (!confirm('確定移除此收藏？')) return;
        const newBookmarks = bookmarks.filter(b => b.id !== id);
        await bookmarksStore.setValue(newBookmarks);
    };

    // --- Derived State ---

    const filteredBookmarks = useMemo(() => {
        let list = activeColId === 'all'
            ? bookmarks
            : bookmarks.filter(b => b.collectionId === activeColId);

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(b =>
                b.title.toLowerCase().includes(q) ||
                b.contentSnippet.toLowerCase().includes(q) ||
                b.presentationTitle.toLowerCase().includes(q)
            );
        }
        return list;
    }, [bookmarks, activeColId, searchQuery]);

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-800">

            {/* === Left Sidebar: Collections === */}
            <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
                    <h1 className="font-bold text-lg">Slides Manager</h1>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    <NavItem
                        isActive={activeColId === 'all'}
                        onClick={() => setActiveColId('all')}
                        icon={<Tag className="w-4 h-4" />}
                        label="All Bookmarks"
                        count={bookmarks.length}
                    />

                    <div className="pt-4 pb-2 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Collections</div>

                    {collections.map(col => (
                        <div key={col.id} className="group relative">
                            <NavItem
                                isActive={activeColId === col.id}
                                onClick={() => setActiveColId(col.id)}
                                color={col.color}
                                label={col.name}
                                count={bookmarks.filter(b => b.collectionId === col.id).length}
                            />
                            {/* Edit Button (Hover) */}
                            {col.id !== 'default' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingCollection(col); setIsEditColModalOpen(true); }}
                                    className="absolute right-2 top-2 p-1 text-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-purple-200"
                                >
                                    <Edit2 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-3 border-t border-slate-100">
                    <button
                        onClick={() => { setEditingCollection(null); setIsEditColModalOpen(true); }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        <FolderPlus className="w-4 h-4" />
                        New Collection
                    </button>
                </div>
            </div>

            {/* === Main Content: Bookmarks === */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">

                {/* Header */}
                <div className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold">
                            {activeColId === 'all' ? 'All Bookmarks' : collections.find(c => c.id === activeColId)?.name}
                        </h2>
                        <span className="text-sm text-slate-400">{filteredBookmarks.length} items</span>
                    </div>

                    <div className="relative w-64">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search in collection..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredBookmarks.map(bm => {
                            const col = collections.find(c => c.id === bm.collectionId);

                            // 解析座標 (如果是 slides.com 格式 id 可能長這樣: deck#2/1)
                            // 我們假設 bm.id 裡面或者 bm 物件本身有存 h, v
                            // 這裡用簡單的 regex 提取頁碼，或者你在 Bookmark 介面裡加個 slideLabel 欄位
                            const slideLabel = bm.url.split('#')[1] || '?';

                            return (
                                <div key={bm.id} className="bg-white rounded-xl border border-slate-200 p-0 flex flex-col group overflow-hidden hover:shadow-sm transition-all duration-300">

                                    {/* 上半部：視覺識別區 (縮圖概念) */}
                                    <div className="h-24 bg-linear-to-br from-slate-100 to-slate-200 p-4 flex flex-col justify-between relative">
                                        {/* 分類標籤 */}
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 backdrop-blur" style={{ color: col?.color }}>
                                                {col?.name}
                                            </span>


                                        </div>


                                        {/* 簡報來源標題 (小字) */}
                                        <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                            {bm.presentationTitle}

                                            {/* 頁碼標記 */}
                                            <span className="text-xs font-mono text-slate-500 ">
                                                #{slideLabel}
                                            </span>
                                        </div>

                                        {/* 刪除按鈕 (Hover 顯示) */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteBookmark(bm.id); }}
                                            className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-red-400 hover:text-red-600 hover:bg-white opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* 下半部：內容區 */}
                                    <div className="p-4 flex-1 flex flex-col">
                                        {/* 單頁標題 (如果有抓到的話，通常是大標題) */}
                                        <h3 className="font-bold text-slate-800 mb-2 line-clamp-2 text-sm leading-snug">
                                            {bm.title || "Untitled Slide"}
                                        </h3>

                                        {/* 內容摘要 */}
                                        <p className="text-xs text-slate-500 line-clamp-4 mb-4 flex-1">
                                            {bm.contentSnippet || "No text content detected..."}
                                        </p>

                                        {/* 跳轉按鈕 */}
                                        <a
                                            href={bm.url}
                                            target="_blank"
                                            className="mt-auto flex items-center justify-center gap-2 w-full py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold text-slate-600 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-colors"
                                        >
                                            Go to Slide <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredBookmarks.length === 0 && (
                        <div className="text-center py-20 text-slate-400">
                            <p>No bookmarks found here.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* === Edit Collection Modal === */}
            {isEditColModalOpen && (
                <CollectionModal
                    initialData={editingCollection}
                    onSave={handleSaveCollection}
                    onDelete={editingCollection ? () => handleDeleteCollection(editingCollection.id) : undefined}
                    onClose={() => setIsEditColModalOpen(false)}
                />
            )}

        </div>
    );
}

// --- Sub Components ---

function NavItem({ isActive, onClick, icon, label, count, color }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
        >
            <div className="flex items-center gap-3">
                {icon || <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color || '#ccc' }} />}
                <span>{label}</span>
            </div>
            {count !== undefined && <span className="text-xs opacity-50">{count}</span>}
        </button>
    );
}

function CollectionModal({ initialData, onSave, onDelete, onClose }: any) {
    const [name, setName] = useState(initialData?.name || '');
    const [color, setColor] = useState(initialData?.color || '#a855f7');
    const [showInSearch, setShowInSearch] = useState(initialData?.showInQuickSearch ?? true); // 預設開啟

    return (
        <div className=" fixed inset-0 flex justify-center py-20">
            <div className="bg-white rounded-xl shadow-xl p-6 w-[400px] grow-0 h-fit">
                <h3 className="text-lg font-bold mb-4">{initialData ? 'Edit Collection' : 'New Collection'}</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full border rounded p-2 focus:ring-2 focus:ring-purple-200 outline-none"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                            <input
                                type="color"
                                value={color}
                                onChange={e => setColor(e.target.value)}
                                className="w-full h-10 p-1 border rounded cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded border border-slate-100">
                        <input
                            type="checkbox"
                            id="showInSearch"
                            checked={showInSearch}
                            onChange={e => setShowInSearch(e.target.checked)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="showInSearch" className="text-sm text-slate-700 cursor-pointer select-none">
                            Show in Quick Search (Cmd+K)
                            <p className="text-xs text-slate-400 mt-0.5">Include bookmarks from this collection in search results.</p>
                        </label>
                    </div>

                </div>

                <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
                    {onDelete && initialData.id !== 'default' ? (
                        <button onClick={onDelete} className="text-red-500 text-sm hover:underline">Delete</button>
                    ) : <div></div>}

                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded">Cancel</button>
                        <button
                            onClick={() => onSave(name, color, showInSearch)}
                            disabled={!name}
                            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}