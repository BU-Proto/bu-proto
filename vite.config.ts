import { cloudflare } from '@cloudflare/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// The Cloudflare plugin runs worker/ in the Workers runtime during `vite dev`, with a local D1,
// so the site and its API share one port, as they do in production. PROTO_STATE_DIR points the
// local D1 somewhere other than .wrangler/state (handy for running two dev servers at once).
export default defineConfig({
  plugins: [
    react(),
    cloudflare({
      persistState: process.env.PROTO_STATE_DIR ? { path: process.env.PROTO_STATE_DIR } : true,
    }),
  ],
})
