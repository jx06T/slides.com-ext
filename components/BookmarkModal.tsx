// components/BookmarkModal.tsx
import { useState, useEffect } from 'react';
import { Bookmark, Check, Trash2, X } from 'lucide-react';
import { useBookmarkStore } from '@/hooks/useBookmarkStore';
import { browser } from 'wxt/browser';

export default function BookmarkModal() {
    const { collections, currentBookmark, saveBookmark, removeBookmark } = useBookmarkStore();

    const [isOpen, setIsOpen] = useState(false);
    const [selectedCol, setSelectedCol] = useState('default');

    // 1. 初始化與更新 selectedCol (保持不變)
    useEffect(() => {
        if (currentBookmark) {
            setSelectedCol(currentBookmark.collectionId);
        } else if (collections.length > 0) {
            setSelectedCol(collections[0].id);
        }
    }, [currentBookmark, collections]);

    // 當 h 或 v 改變時，代表使用者切換了投影片，強制關閉 Modal
    useEffect(() => {
        setIsOpen(false);
    }, [currentBookmark]);


    const handleSave = async () => {
        await saveBookmark(selectedCol);
        setIsOpen(false);
    };

    const handleDelete = async () => {
        await removeBookmark();
        setIsOpen(false);
    };

    useEffect(() => {
        setIsOpen(false);
    }, [currentBookmark?.id]);

    return (
        <div className="fixed top-4 left-4 z-2147483647 font-sans">

            {/* === 1. 觸發按鈕 (Indicator) === */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                onDoubleClick={() => browser.runtime.sendMessage({ type: 'OPEN_DASHBOARD' })}
                className={` h-10 min-w-10
                    flex items-center gap-1 px-3 py-2 rounded-full shadow-md transition-all duration-200
                    ${isOpen ? 'ring-1 ring-purple-400' : ''}
                    ${currentBookmark
                        ? 'bg-purple-100  text-purple-600 hover:bg-purple-200' // 已收藏狀態
                        : 'bg-white/70 backdrop-blur text-gray-400 hover:text-purple-600 hover:bg-white' // 未收藏狀態
                    }
                `}
            >
                <Bookmark className={`w-4 h-4 ${currentBookmark ? 'fill-current' : ''}`} />
                {currentBookmark && (
                    <span className="text-xs mt-0.5 inline-block font-medium max-w-[100px] truncate">
                        {collections.find(c => c.id === currentBookmark.collectionId)?.name}
                    </span>
                )}
            </button>


            {/* === 2. 彈出面板 (Popover) === */}
            {isOpen && (
                <div className="absolute top-12 left-0 w-[280px] bg-white rounded-xl shadow-2xl border border-gray-100 p-4 animate-in slide-in-from-top-2 fade-in duration-200 origin-top-left">

                    {/* Header */}
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-gray-700">
                            {currentBookmark ? '編輯收藏' : '加入收藏'}
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* 分類選擇 */}
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">選擇分類</label>
                        <div className="space-y-1 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                            {collections.map(col => (
                                <button
                                    key={col.id}
                                    onClick={() => setSelectedCol(col.id)}
                                    className={`
                                        w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                                        ${selectedCol === col.id
                                            ? 'bg-purple-50 text-purple-800 font-medium'
                                            : 'hover:bg-gray-50 text-gray-600'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                                        <span>{col.name}</span>
                                    </div>
                                    {selectedCol === col.id && <Check className="w-3.5 h-3.5" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-gray-50">
                        {currentBookmark && (
                            <button
                                onClick={handleDelete}
                                className="p-2 px-3 text-red-600 hover:bg-red-50 hover:text-red-800 rounded-lg transition-colors"
                                title="移除收藏"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            className="flex-1 bg-purple-400 hover:bg-purple-500 text-white text-sm font-medium py-2 rounded-lg transition-colors shadow-sm"
                        >
                            {currentBookmark ? '更新' : '儲存'}
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
}