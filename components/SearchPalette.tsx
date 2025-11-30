import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X, Code, FileText, CornerUpLeft, Bookmark, ExternalLink } from 'lucide-react';
import { useLocalSlides } from '@/hooks/useLocalSlides';
import { useBookmarkSlides } from '@/hooks/useBookmarkSlides';
import { useSearchEngine } from '@/hooks/useSearchEngine';
import { SearchResultItem } from '@/types/data'; // 確保這指向我們定義的新介面
import { HighlightedText } from '@/components/HighlightedText';

export default function SearchPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');

    // === 1. 資料與搜尋邏輯 (Hooks 分離) ===
    const localSlides = useLocalSlides(isOpen);
    const bookmarkSlides = useBookmarkSlides(isOpen);

    // 合併資料池
    const searchPool = useMemo(() => {
        return [...localSlides, ...bookmarkSlides];
    }, [localSlides, bookmarkSlides]);

    // 執行搜尋
    const results = useSearchEngine(searchPool, query);


    // === 2. UI 狀態管理 ===
    const [activeIndex, setActiveIndex] = useState(0);
    const resultContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [prevHash, setPrevHash] = useState<string>('');
    const [lastJumpedId, setLastJumpedId] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);

    // === 3. Helper Functions ===

    // 聚焦輸入框並全選
    const focusInput = useCallback(() => {
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.select();
            }
        }, 10);
    }, []);

    // 失焦並將控制權還給投影片
    const blurToSlides = useCallback(() => {
        if (inputRef.current) {
            inputRef.current.blur();
        }
        window.focus();
        document.body.focus();
    }, []);

    const isTriggerKey = (e: KeyboardEvent | React.KeyboardEvent) =>
        (e.metaKey || e.ctrlKey) && e.key === 'k';

    const openPalette = useCallback(() => {
        if (!isOpen) {
            setPrevHash(window.location.hash || "#0/0");
            setIsOpen(true);
        }
        focusInput();
    }, [isOpen, focusInput]);

    const closePalette = useCallback(() => {
        setIsOpen(false);
        setLastJumpedId(null);
    }, []);

    // === 4. 事件監聽 ===

    // 全域監聽 Cmd+K
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (isTriggerKey(e)) {
                e.preventDefault();
                openPalette();
            } else if (e.key === 'Escape' && isOpen) {
                closePalette();
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isOpen, openPalette, closePalette]);

    // 當搜尋關鍵字改變時，重置選中狀態
    useEffect(() => {
        setActiveIndex(0);
        setLastJumpedId(null);
    }, [query]);

    // === 5. 動作處理 (Jump Logic) ===

    const handleJump = (item: SearchResultItem, newTab = false) => {
        // A. 處理外部收藏 (直接開新分頁)
        if (item.source === 'bookmark') {
            window.open(item.bookmarkData?.url, '_blank');
            return;
        }

        // B. 處理本地跳轉
        const targetHash = `/${item.h}/${item.v}/21`;

        // 如果按住 Ctrl 強制開新分頁 (本地頁面)
        if (newTab) {
            const baseUrl = window.location.href.split('#')[0];
            window.open(`${baseUrl}#${targetHash}`, '_blank');
            return;
        }

        // 第二次點擊同一張投影片 -> 聚焦投影片
        if (lastJumpedId === item.id && isFocused) {
            blurToSlides();
            return;
        }

        // 第一次點擊 -> 執行跳轉
        if (window.location.hash !== `#${targetHash}` && lastJumpedId !== item.id) {
            if (!prevHash) setPrevHash(window.location.hash);

            window.location.hash = targetHash;
            window.postMessage({
                type: 'EXTENSION_JUMP_TO_SLIDE',
                h: item.h,
                v: item.v
            }, '*');

            focusInput(); // 跳轉後保持輸入框聚焦
        }

        setLastJumpedId(item.id);
    };

    const handleBack = () => {
        if (prevHash) {
            window.location.hash = prevHash;
            setLastJumpedId(null);
        }
    };

    // 輸入框按鍵處理
    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (isTriggerKey(e)) {
            e.preventDefault();
            e.stopPropagation();
            focusInput();
            return;
        }

        if (e.key === 'Escape') {
            e.stopPropagation();
            closePalette();
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            e.stopPropagation();
            setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            e.stopPropagation();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
        }
        else if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            if (results[activeIndex]) {
                handleJump(results[activeIndex], e.ctrlKey || e.metaKey);
            }
        }
        else {
            e.stopPropagation();
        }
    };

    // 自動滾動
    useEffect(() => {
        if (resultContainerRef.current) {
            const activeEl = resultContainerRef.current.children[activeIndex] as HTMLElement;
            activeEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [activeIndex]);


    // === 6. 渲染 ===

    if (!isOpen) return (
        <div className='w-10 h-10 hover:w-12 fixed top-[30vh] right-0 z-2147483647 animate-out zoom-out-95 fade-out duration-200'>
            <button
                className='w-full h-full bg-white/70 backdrop-blur-md hover:bg-white shadow-xl rounded-l-lg flex items-center justify-center transition-all hover:w-12 group'
                onClick={openPalette}
                title="Search Slides (Cmd+K)"
            >
                <Search className="w-5 h-5 text-gray-500 group-hover:text-purple-600 transition-colors" />
            </button>
        </div>
    );

    return (
        <div className="fixed right-2 top-[12vh] z-2147483647 w-[360px] h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 transition-all bg-white rounded-xl shadow-2xl">
            <div className="flex items-center px-4 py-3 border-b border-gray-100 shrink-0 gap-2 bg-white z-10">
                <Search className={`w-5 h-5 transition-colors duration-200 ${isFocused ? "text-purple-500" : "text-gray-400"}`} />
                <input
                    ref={inputRef}
                    type="text"
                    className="flex-1 text-lg outline-none text-gray-700 placeholder:text-gray-400 bg-transparent min-w-0"
                    placeholder="Search..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                    onKeyDown={handleInputKeyDown}
                    onKeyUp={(e) => e.stopPropagation()}
                    onFocus={() => {
                        setIsFocused(true)
                        setLastJumpedId(lastJumpedId && lastJumpedId.replace(/\*+$/, ""))
                    }}
                    onBlur={() => {
                        setIsFocused(false)
                        setLastJumpedId(lastJumpedId ? lastJumpedId + "*" : null)
                    }}
                />

                {prevHash && (
                    <button onClick={handleBack} title="Go Back" className="p-1.5 hover:bg-gray-100 rounded text-purple-500 hover:text-purple-700">
                        <CornerUpLeft className="w-4 h-4" />
                    </button>
                )}

                <button onClick={closePalette} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div
                ref={resultContainerRef}
                className="flex-1 overflow-y-auto p-2 bg-slate-50 space-y-2 overscroll-contain"
            >
                {results.length === 0 && (
                    <div className="text-center py-10 text-gray-400 flex flex-col items-center gap-2">
                        <Search className="w-8 h-8 opacity-20" />
                        <span>{query ? "No results" : "Type to search"}</span>
                    </div>
                )}

                {results.map((item, index) => {
                    // 判斷是否為收藏來源
                    const isBookmark = item.source === 'bookmark';

                    return (
                        <div
                            key={item.id}
                            onClick={(e) => {
                                handleJump(item, e.ctrlKey || e.metaKey)
                                setActiveIndex(index)
                            }}
                            className={`
                                group flex flex-col p-3 rounded-lg border cursor-pointer transition-all relative
                                ${(index === activeIndex && isFocused)
                                    // 聚焦選中樣式
                                    ? 'bg-white border-purple-400 shadow-md ring-1 ring-purple-100 z-10'
                                    // 未選中樣式 (區分 bookmark)
                                    : 'bg-white border-gray-100 hover:border-purple-400 ring-purple-100'
                                }
                            `}
                        >
                            <div className="flex items-center gap-2 justify-between mb-1.5">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {/* Icon 區分 */}
                                    {isBookmark ? (
                                        <Bookmark className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                                    ) : item.type === 'code' ? (
                                        <Code className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                                    ) : (
                                        <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    )}

                                    <h4 className="font-semibold text-gray-800 text-sm truncate w-full flex items-center gap-2">
                                        {/* 如果是外部收藏，顯示來源簡報標題 */}
                                        {isBookmark && (
                                            <span className=" truncate max-w-36">
                                                {item.presentationTitle} /
                                            </span>
                                        )}
                                        <HighlightedText text={item.title} highlight={query} />
                                    </h4>
                                </div>

                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1 ${(lastJumpedId && lastJumpedId.includes(item.id))
                                    ? "text-gray-500 bg-purple-100"
                                    : "text-gray-400 bg-gray-100"
                                    }`}>
                                    {isBookmark ? <ExternalLink className="w-3 h-3 inline" /> : item.slideLabel}
                                </span>
                            </div>

                            <div className="text-xs text-gray-500 line-clamp-2 pl-5.5 leading-relaxed">
                                <HighlightedText text={item.content} highlight={query} />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="px-4 py-2 bg-white border-t text-[10px] text-gray-400 flex justify-between shrink-0 select-none">
                <div className="flex gap-2">
                    <span><kbd className="border px-1 rounded bg-gray-50">Ctrl+Enter</kbd> New Tab</span>
                    <span ><kbd className="border px-1 rounded bg-gray-50" >Enter*2</kbd> Focus Slide</span>
                </div>
                <span>{prevHash}</span>
                <span>{results.length} found</span>
            </div>

        </div>
    );
}