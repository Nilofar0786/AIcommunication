import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev
export default defineConfig({
  plugins: [react()],
  base: './', // 👈 इसका मतलब है "Relative Path", यह सब-फोल्डर की सारी दिक्कतों को खत्म कर देगा!
})
