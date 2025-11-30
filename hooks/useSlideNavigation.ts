import { useState, useEffect } from 'react';

export interface SlidePosition {
    h: number;
    v: number;
    hash: string;
}

export function useSlideNavigation() {
    // 解析當前 URL 的 Helper
    const getPos = (): SlidePosition => {
        const hash = window.location.hash || '#/0/0';
        const parts = hash.replace('#/', '').split('/');
        return {
            h: parseInt(parts[0] || '0'),
            v: parseInt(parts[1] || '0'),
            hash
        };
    };

    const [pos, setPos] = useState<SlidePosition>(getPos());

    useEffect(() => {
        const handleUpdate = () => {
            // 微小的延遲確保 URL 已經變更完成
            setTimeout(() => {
                const newPos = getPos();
                // 簡單的 diff 檢查，避免重複 render
                setPos(prev => (
                    prev.h === newPos.h && prev.v === newPos.v
                        ? prev
                        : newPos
                ));
            }, 0);
        };

        // 1. 優先使用現代的 Navigation API
        if ((window as any).navigation) {
            (window as any).navigation.addEventListener('navigatesuccess', handleUpdate);
        } else {
            // 2. 舊瀏覽器備案 (雖然 Chrome Extension 環境通常都有 navigation)
            window.addEventListener('hashchange', handleUpdate);
            window.addEventListener('popstate', handleUpdate);
        }

        return () => {
            if ((window as any).navigation) {
                (window as any).navigation.removeEventListener('navigatesuccess', handleUpdate);
            }
            window.removeEventListener('hashchange', handleUpdate);
            window.removeEventListener('popstate', handleUpdate);
        };
    }, []);

    return pos;
}