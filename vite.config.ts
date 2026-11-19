import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuração do Vite para o frontend do Print 360.
// O Tauri 2 consome os arquivos de `dist` ou o dev server na porta 1420.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: { ignored: ["**/src-tauri/**"] },
  },
});
