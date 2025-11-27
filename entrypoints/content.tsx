import '@/assets/style.css';
import ReactDOM from 'react-dom/client';
import SearchPalette from '@/components/SearchPalette';

export default defineContentScript({
  matches: ['*://slides.com/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'slides-search-palette',
      position: 'overlay',
      zIndex: 2147483647,
      // position: 'inline',
      // anchor: 'body',
      onMount: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(<SearchPalette />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
