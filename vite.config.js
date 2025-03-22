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
            console.log("请求URL:", req.url);
            console.log("请求方法:", req.method);
            console.log("请求头:", req.headers);
            
            // 如果可能，发送错误响应给客户端
            if (!res.headersSent) {
              res.writeHead(500, {
                'Content-Type': 'application/json'
              });
              res.end(JSON.stringify({ 
                message: '代理请求失败', 
                error: err.message || '未知错误'
              }));
            }
          });
          proxy.on("proxyReq", (proxyReq, req, res) => {
            console.log("发送请求:", req.method, req.url);
            console.log("目标服务器:", "http://47.98.210.7:3000" + req.url);
            proxyReq.setHeader("Host", "47.98.210.7:3000");
            proxyReq.setHeader("Accept", "application/json");
            
            // 打印所有请求头部
            console.log("代理请求头:", proxyReq._headers);
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            console.log("收到响应:", proxyRes.statusCode, req.url);
            console.log("响应头:", proxyRes.headers);
            
            // 如果响应不是JSON格式，记录警告
            const contentType = proxyRes.headers['content-type'] || '';
            if (!contentType.includes('application/json')) {
              console.warn("警告: 响应不是JSON格式:", contentType);
            }
          });
        },
      },
      "/api/proxy": {
        target: "http://47.98.210.7:3000",
        changeOrigin: true,
        rewrite: (path) => {
          const url = new URLSearchParams(path.split('?')[1]).get('url');
          return url ? url.replace(/^https?:\/\/[^\/]+/, '') : path;
        },
        configure: (proxy, options) => {
          proxy.on("error", (err, req, res) => {
            console.log("图片代理错误:", err);
          });
          proxy.on("proxyReq", (proxyReq, req, res) => {
            console.log("图片请求:", req.url);
          });
        },
      },
      "/uploads": {
        target: "http://47.98.210.7:3000",
        changeOrigin: true,
      },
      "/api/uploads": {
        target: "http://47.98.210.7:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
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
