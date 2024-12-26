import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
    },
    build: {
      // Improve error reporting
      minify: mode === 'development' ? false : 'esbuild',
      sourcemap: true,
      // Handle environment variables
      rollupOptions: {
        // Ensure external dependencies are properly handled
        external: [],
      },
    },
    optimizeDeps: {
      include: ['@clerk/clerk-react'],
    },
    // Define environment variables
    define: {
      'process.env': {
        VITE_CLERK_PUBLISHABLE_KEY: JSON.stringify(env.VITE_CLERK_PUBLISHABLE_KEY),
        VITE_SITE_URL: JSON.stringify(env.VITE_SITE_URL),
        VITE_CLERK_SIGN_IN_URL: JSON.stringify(env.VITE_CLERK_SIGN_IN_URL),
        VITE_CLERK_SIGN_UP_URL: JSON.stringify(env.VITE_CLERK_SIGN_UP_URL),
        VITE_CLERK_AFTER_SIGN_IN_URL: JSON.stringify(env.VITE_CLERK_AFTER_SIGN_IN_URL),
        VITE_CLERK_AFTER_SIGN_UP_URL: JSON.stringify(env.VITE_CLERK_AFTER_SIGN_UP_URL),
      },
    },
  }
})
