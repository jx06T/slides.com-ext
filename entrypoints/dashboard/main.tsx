import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/assets/style.css'; // 確保 Tailwind 生效

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);