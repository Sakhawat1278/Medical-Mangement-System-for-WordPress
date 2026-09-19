import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    manifest: true,
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './src/main.jsx',
        auth: './src/auth.jsx',
        registration: './src/registration.jsx',
        instantBooking: './src/instantBooking.jsx',
        cartPage: './src/cartPage.jsx',
        doctorsPage: './src/doctorsPage.jsx',
        ambulanceBooking: './src/ambulanceBooking.jsx',
        labBooking: './src/labBooking.jsx',
        careProviderBooking: './src/careProviderBooking.jsx',
        bloodBankPage: './src/bloodBankPage.jsx',
        wardBooking: './src/wardBooking.jsx',
      },
    },
  },
})
