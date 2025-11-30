export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    
    if (message.type === 'OPEN_DASHBOARD') {
      browser.tabs.create({ 
        url: browser.runtime.getURL('/dashboard.html') 
      });
    }

  });
});