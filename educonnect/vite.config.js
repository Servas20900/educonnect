import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: (() => {
      // __dirname is not defined in ESM; derive from import.meta.url
      const root = fileURLToPath(new URL('.', import.meta.url));
      return [
        { find: 'components', replacement: path.resolve(root, 'src/components') },
        { find: 'hooks', replacement: path.resolve(root, 'src/hooks') },
        { find: 'api', replacement: path.resolve(root, 'src/api') },
        { find: 'layout', replacement: path.resolve(root, 'src/layout') },
        { find: 'assets', replacement: path.resolve(root, 'src/assets') },
        // Prefer local config file over npm "config" package
        { find: 'config', replacement: path.resolve(root, 'src/config') }
      ];
    })()
  }
})
