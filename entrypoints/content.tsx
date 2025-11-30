import '@/assets/style.css';
import ReactDOM from 'react-dom/client';
import SidePanel from '@/components/SidePanel';

export default defineContentScript({
  matches: ['*://slides.com/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'slides-search-ui',
      position: 'overlay',
      zIndex: 2147483647,
      onMount: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(<SidePanel />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
