import React from 'react';

interface Props {
    text: string;
    highlight: string;
    className?: string;
}

function escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const HighlightedText: React.FC<Props> = ({ text, highlight, className = "" }) => {
    if (!highlight.trim()) {
        return <span className={className}>{text}</span>;
    }
    highlight = escapeRegExp(highlight);

    // 正則表達式：全域且不分大小寫
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);

    return (
        <span className={className}>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark key={i} className="bg-purple-200 text-purple-900 rounded-sm px-0.5">
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
};