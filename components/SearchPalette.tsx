import { useState, useEffect } from 'react';
import { Search, X, Code, FileText, ArrowRight } from 'lucide-react';
import Fuse from 'fuse.js';

import { extractSlides, SlideIndex } from '@/utils/slideExtractor';

export default function SearchPalette() {
    const [isOpen, setIsOpen] = useState(true);
    const [query, setQuery] = useState('api');

    const [slides, setSlides] = useState<SlideIndex[]>([]);
    const [results, setResults] = useState<SlideIndex[]>([]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            const data = extractSlides();
            // console.log("爬到的投影片:", data);
            setSlides(data);
        }
    }, [isOpen]);

    // 設定 Fuse 搜尋引擎
    const fuse = useMemo(() => {
        return new Fuse(slides, {
            keys: ['content', 'title'], // 搜尋內容和標題
            threshold: 0.3,             // 模糊程度 (0=精準, 1=超模糊)
            ignoreLocation: true,       // 全文搜尋，不限制位置
        });
    }, [slides]);

    // 當 Query 改變時執行搜尋
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        const searchResults = fuse.search(query);
        setResults(searchResults.map(res => res.item).slice(0, 30)); // 只顯示前 10 筆
    }, [query, fuse]);

    // 跳轉功能
    const jumpToSlide = (h: number, v: number) => {
        window.location.hash = `/${h}/${v}/21`;
    };



    if (!isOpen) return (
        <div className=' bg-white/80 rounded-xl fixed top-[40vh] right-0 w-10 h-10 z-999999  shadow-2xl border-purple-400 border animate-out fade-out zoom-out-95 duration-200'>
            <button className='w-full h-full pt-0 pl-2  ' onClick={() => setIsOpen(true)}>
                <Search className="w-6 h-6 text-gray-400 mr-3 inline-block" />
            </button>
        </div>
    );

    return (
        <div className=" bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200  fixed top-20 right-6 h-[80vh] w-[360px] z-999999">
            <div className=' grid grid-rows-[3rem_1fr_2rem] h-full'>
                <div className="h-full  flex items-center px-4 py-3 border-b border-gray-100">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                        type="text"
                        className="flex-1 text-lg outline-none text-gray-700 placeholder:text-gray-400 bg-transparent"
                        placeholder="搜尋投影片內容..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus

                        onKeyDown={(e) => {
                            // 1. 允許 Escape 鍵往上傳 (因為我們要讓外層的 window listener 收到並關閉視窗)
                            if (e.key === 'Escape') {
                                return;
                            }

                            // 2. 允許 Enter 鍵 (如果你有要做 Enter 選擇功能的話，也可以不擋，或是在這邊處理掉)
                            if (e.key === 'Enter') {
                                // jumpToSlide(...);
                                // e.stopPropagation(); // 視需求決定要不要擋
                                return;
                            }

                            // 3. 殺死其他所有按鍵事件 (Space, F, S, 方向鍵...)
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                            // 保險起見，有些舊套件監聽 keyup/keypress，也可以考慮加
                        }}

                        onKeyUp={(e) => e.stopPropagation()}
                    />
                    <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-4  text-gray-500 text-center overflow-y-auto overscroll-contain" >
                    {results.length === 0 && (
                        <div className="text-center py-8 text-gray-400">{query ? "找不到相關內容" : "輸入關鍵字搜尋"}</div>
                    )}

                    {results.map((slide) => (
                        <div
                            key={slide.id}
                            onClick={() => jumpToSlide(slide.h, slide.v)}
                            className="group flex flex-col p-3 mb-2 bg-white rounded-lg border border-gray-100 hover:border-purple-400 hover:shadow-md cursor-pointer transition-all"
                        >
                            <div className="flex items-center gap-2 justify-between">
                                <div className="">
                                    {slide.type === 'code' ? (
                                        <Code className="w-4 h-4 /text-purple-500" />
                                    ) : (
                                        <FileText className="w-4 h-4 /text-blue-500" />
                                    )}
                                </div>
                                <span className="font-semibold w-full text-start text-gray-800 text-sm truncate">
                                    {slide.title}
                                </span>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded text-nowrap">
                                    Page {slide.h}-{slide.v}
                                </span>
                            </div>

                            {/* 顯示部分內容預覽 (截斷) */}
                            <div className="text-xs text-gray-500 line-clamp-3 pl-6 text-start mt-1.5">
                                {slide.content}
                            </div>
                        </div>
                    ))}
                </div>

                <div className=" h-full px-4 py-2 bg-slate-50 border-t text-xs text-gray-400 flex justify-between">
                    <span>找到 {results.length} 筆結果</span>
                    <span>Enter 選擇 / Esc 關閉</span>
                </div>

            </div>
        </div>
    );
}