import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Code, FileText, CornerUpLeft } from 'lucide-react';
import { SlideIndex } from '@/utils/slideExtractor';
import { useSlideSearch } from '@/hooks/useSlideSearch';
import { HighlightedText } from '@/components/HighlightedText';

export default function SearchPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');

    const { results } = useSlideSearch(isOpen, query);

    const [activeIndex, setActiveIndex] = useState(0);
    const resultContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [prevHash, setPrevHash] = useState<string>('');

    // 🔥 新增：記錄上一次跳轉的 ID，用來判斷是否為「第二次點擊」
    const [lastJumpedId, setLastJumpedId] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);

    // === Helper Functions ===

    const isTriggerKey = (e: KeyboardEvent | React.KeyboardEvent) =>
        (e.metaKey || e.ctrlKey) && e.key === 'k';

    const openPalette = useCallback(() => {
        if (!isOpen) {
            setPrevHash(window.location.hash || "#0/0");
            setIsOpen(true);
        }
        setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }, 10);
    }, [isOpen]);

    const closePalette = useCallback(() => {
        setIsOpen(false);
        setLastJumpedId(null); // 關閉時重置
    }, []);

    // === 1. 全域監聽 ===
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

    // 當搜尋關鍵字改變時，重置選中狀態和跳轉紀錄
    useEffect(() => {
        setActiveIndex(0);
        setLastJumpedId(null);
    }, [query]);

    // === 2. 動作處理 ===

    const handleJump = (slide: SlideIndex, newTab = false) => {
        const targetHash = `/${slide.h}/${slide.v}/21`;

        if (newTab) {
            const baseUrl = window.location.href.split('#')[0];
            window.open(`${baseUrl}#${targetHash}`, '_blank');
            return;
        }

        // 🔥 核心邏輯：如果是第二次點擊同一張投影片
        if (lastJumpedId === slide.id) {
            // 1. 讓搜尋框失焦
            inputRef.current?.blur();
            // 2. 將焦點還給瀏覽器主體 (Reveal.js 通常監聽 body)
            window.focus();
            document.body.focus();
            // 3. (可選) 可以在這裡做個 Toast 提示 "Focus Slides"
            return;
        }

        // === 第一次點擊：執行跳轉 ===
        if (window.location.hash !== `#${targetHash}` && lastJumpedId !== slide.id) {
            if (!prevHash) setPrevHash(window.location.hash);
            window.location.hash = targetHash;
            window.postMessage({
                type: 'EXTENSION_JUMP_TO_SLIDE',
                h: slide.h,
                v: slide.v
            }, '*');
            inputRef.current?.focus();
            inputRef.current?.select();
        }

        // 記錄這次跳轉的 ID
        setLastJumpedId(slide.id);
    };

    const handleBack = () => {
        if (prevHash) {
            window.location.hash = prevHash;
            setLastJumpedId(null); // 返回後重置狀態
        }
    };

    // === 3. 輸入框監聽 ===
    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (isTriggerKey(e)) {
            e.preventDefault();
            e.stopPropagation();
            inputRef.current?.focus();
            inputRef.current?.select();
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


    // === 4. 渲染 ===

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
        <div className="fixed right-2 top-[12vh] z-2147483647 w-[360px] h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 transition-all bg-white rounded-xl shadow-2xl ">
            <div className="flex items-center px-4 py-3 border-b border-gray-100 shrink-0 gap-2 bg-white z-10">
                <Search className={`w-5 h-5 ${isFocused ? "text-purple-400" : "text-gray-400"} `} />
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

                {results.map((slide, index) => (
                    <div
                        key={slide.id}
                        onClick={(e) => {
                            handleJump(slide, e.ctrlKey || e.metaKey)
                        }}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`
                                group flex flex-col p-3 rounded-lg border cursor-pointer transition-all relative
                                ${index === activeIndex
                                ? 'bg-white border-purple-400 shadow-md ring-1 ring-purple-100 z-10'
                                : 'bg-white border-gray-100 hover:border-purple-200'
                            }
                            `}
                    >
                        <div className="flex items-center gap-2 justify-between mb-1.5">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                {slide.type === 'code' ? (
                                    <Code className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                                ) : (
                                    <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                )}
                                <h4 className="font-semibold text-gray-800 text-sm truncate w-full">
                                    <HighlightedText text={slide.title} highlight={query} />
                                </h4>
                            </div>
                            <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                                {/* 🔥 視覺提示：如果這張已經跳過了，可以顯示個小 icon 或顏色變化，這裡暫時維持原樣 */}
                                {slide.h}-{slide.v}
                            </span>
                        </div>

                        <div className="text-xs text-gray-500 line-clamp-2 pl-5.5 leading-relaxed">
                            <HighlightedText text={slide.content} highlight={query} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="px-4 py-2 bg-white border-t text-[10px] text-gray-400 flex justify-between shrink-0 select-none">
                <div className="flex gap-2">
                    {/* <span><kbd className="font-sans border px-1 rounded bg-gray-50">↑↓</kbd> Navigate</span> */}
                    {/* <span><kbd className="border px-1 rounded bg-gray-50">Enter</kbd> Jump</span> */}
                    <span><kbd className="border px-1 rounded bg-gray-50">Ctrl+Enter</kbd> New Tab</span>
                    {/* 🔥 提示使用者可以按兩次 */}
                    <span><kbd className="border px-1 rounded bg-gray-50">2x Enter</kbd> Focus</span>
                </div>
                <span>{prevHash}</span>
                <span>{results.length} found</span>
            </div>

        </div>
    );
}