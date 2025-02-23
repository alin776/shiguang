import { createApp, h, Suspense } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "./style.css";
import App from "./App.vue";
import router from "./router";

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

app.mount("#app");
