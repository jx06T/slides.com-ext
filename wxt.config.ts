import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: "Slides.com Power Tools",
    permissions: ['storage'], 
    host_permissions: [
      "https://slides.com/*"
    ],
    action: {
      default_title: "Slides Tools"
    }
  },
  vite: () => ({
    plugins: [
      tailwindcss(),
    ],
  }),
});
