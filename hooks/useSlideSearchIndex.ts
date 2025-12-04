import { useState, useEffect } from 'react';
import { extractSlides } from '@/utils/slideExtractor';
import { SearchResultItem } from '@/types/data';

export function useSlideSearchIndex() {
    const [slides, setSlides] = useState<SearchResultItem[]>([]);

    const refresh = () => {
        const rawSlides = extractSlides();

        const formatted: SearchResultItem[] = rawSlides.map(s => ({
            source: 'local',
            ...s,
        }));

        setSlides(formatted);
        console.log(formatted)
    };
    useEffect(() => {
        refresh();
    }, []);

    return { slides, refresh };
}