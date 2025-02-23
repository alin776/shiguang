import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import autoprefixer from "autoprefixer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://47.98.210.7:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
        configure: (proxy, options) => {
          proxy.on("error", (err, req, res) => {
            console.log("代理错误:", err);
          });
          proxy.on("proxyReq", (proxyReq, req, res) => {
            console.log("发送请求:", req.method, req.url);
            proxyReq.setHeader("Host", "47.98.210.7:3000");
            proxyReq.setHeader("Accept", "application/json");
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            console.log("收到响应:", proxyRes.statusCode, req.url);
          });
        },
      },
    },
    host: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["vue", "vue-router", "pinia"],
          ui: ["element-plus"],
          dayjs: ["dayjs"],
          axios: ["axios"],
        },
      },
    },
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  css: {
    postcss: {
      plugins: [
        autoprefixer({
          overrideBrowserslist: ["Android >= 4.0", "iOS >= 8"],
        }),
      ],
    },
  },
});
