import { useState, useEffect } from 'react';
import { extractSlides } from '@/utils/slideExtractor';
import { SearchResultItem } from '@/types/data';

export function useLocalSlides(isOpen: boolean) {
    const [slides, setSlides] = useState<SearchResultItem[]>([]);

    useEffect(() => {
        if (!isOpen) return;

        // 執行爬蟲，並轉换成統一格式
        const rawSlides = extractSlides();
        const formatted: SearchResultItem[] = rawSlides.map(s => ({
            id: s.id,
            source: 'local',
            title: s.title,
            content: s.content,
            h: s.h,
            v: s.v,
            slideLabel: `${s.h}-${s.v}`,
            presentationTitle: 'Current Presentation',
            type: s.type
        }));

        setSlides(formatted);
    }, [isOpen]);

    return slides;
}