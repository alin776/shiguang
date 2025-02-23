import { defineAsyncComponent, ref, onMounted } from "vue";

export default {
  setup() {
    const component = ref(null);
    const isLoading = ref(true);
    const error = ref(null);

    onMounted(async () => {
      try {
        component.value = await import("./SomeComponent.vue");
      } catch (e) {
        error.value = e;
      } finally {
        isLoading.value = false;
      }
    });

    return { component, isLoading, error };
  },
  render() {
    if (this.isLoading) return h("div", "加载中...");
    if (this.error) return h("div", "加载失败");
    return h(this.component.default);
  },
};
