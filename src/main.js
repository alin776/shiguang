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
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

// 引入Vant UI组件
import { SwipeCell } from 'vant';
import 'vant/lib/index.css';

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
app.use(ElementPlus, {
  locale: zhCn,
});

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 注册Vant组件
app.use(SwipeCell);

// 设置全局axios拦截器
setupAxios(app);

// 将网络监控器添加到全局属性
app.config.globalProperties.$networkMonitor = networkMonitor;
// 在window对象上也提供网络监控器，方便在非组件中使用
window.networkMonitor = networkMonitor;

app.mount("#app");
