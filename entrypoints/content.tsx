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
        // 1. 執行爬蟲 (直接重用你原本寫好的函式！)
        const rawSlides = extractSlides();

        // 2. 整理一下資料 (只回傳需要的欄位以節省傳輸)
        const exportData = rawSlides.map(s => ({
          slideLabel: `${s.h}-${s.v}`,
          title: s.title,
          content: s.content,
          codeLang: s.codeLang
        }));

        // 3. 回傳給 Popup
        sendResponse({ title: document.title, slides: exportData });
      }
    });
  },
});
