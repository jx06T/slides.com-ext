import '@/assets/style.css';
import ReactDOM from 'react-dom/client';
import SidePanel from '@/components/SidePanel';

import { extractSlides } from '@/utils/slideExtractor';

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


    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'GET_SLIDES_DATA') {
        const rawSlides = extractSlides();

        // 2. 整理一下資料
        const exportData = rawSlides.map(s => ({
          // 基礎資訊
          h: s.h,
          v: s.v,
          slideLabel: `${s.h}-${s.v}`,
          title: s.title,

          blocks: s.blocks,

          content: s.searchContent
        }));

        sendResponse({ title: document.title, slides: exportData });
      }
    });
  },
});
