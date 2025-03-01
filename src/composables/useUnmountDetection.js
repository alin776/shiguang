import { ref, onBeforeUnmount } from 'vue';

/**
 * 组合式函数：检测组件是否已卸载
 * 用于防止在组件卸载后继续进行状态更新，导致内存泄漏
 */
export function useUnmountDetection() {
  const isMounted = ref(true);

  // 在组件卸载前将标志设置为 false
  onBeforeUnmount(() => {
    isMounted.value = false;
  });

  // 检查组件是否仍然挂载
  const checkMounted = () => {
    return isMounted.value;
  };

  return {
    isMounted,
    checkMounted
  };
}
