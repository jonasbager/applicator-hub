import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        // Proxy auth requests to development Clerk instance
        '/auth': {
          target: 'https://exact-viper-93.accounts.dev',
          changeOrigin: true,
          secure: true,
        }
      }
    },
    build: {
      // Improve error reporting
      minify: mode === 'development' ? false : 'esbuild',
      sourcemap: true,
      // Handle environment variables
      rollupOptions: {
        // Ensure external dependencies are properly handled
        external: ['canvas-confetti'],
      },
    },
    optimizeDeps: {
      include: ['@clerk/clerk-react', 'canvas-confetti'],
    },
  }
})
