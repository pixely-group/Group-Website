/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { pdfExportPlugin } from './server/pdfExportPlugin.ts';

// The PDF export endpoint lives inside the Vite dev/preview server so a single
// `npm run dev` gives you the editor, the preview and real PDF generation.
export default defineConfig({
  plugins: [react(), tailwindcss(), pdfExportPlugin()],
  server: { port: 5173, strictPort: false },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
