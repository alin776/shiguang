import { createApp, h, Suspense } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "./style.css";
import "./mine/css/profile.css";
import App from "./App.vue";
import router from "./router";
import { setupAxios } from './utils/axios-interceptor';
import networkMonitor from './utils/network-monitor';

// 初始化网络监控器
networkMonitor.init();

const app = createApp({
  setup() {
    return () =>
      h(Suspense, null, {
        default: () => h(App),
        fallback: () => h("div", "Loading..."), // 加载时显示
      });
  },
});

const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(ElementPlus);

// 设置全局axios拦截器
setupAxios(app);

// 将网络监控器添加到全局属性
app.config.globalProperties.$networkMonitor = networkMonitor;
// 在window对象上也提供网络监控器，方便在非组件中使用
window.networkMonitor = networkMonitor;

app.mount("#app");
