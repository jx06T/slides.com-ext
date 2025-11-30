// components/SidePanel.tsx
import SearchPalette from './SearchPalette';
import BookmarkModal from './BookmarkModal';

export default function SidePanel() {
    return (
        <>
            <SearchPalette />

            <BookmarkModal />
        </>
    );
}