<template>
  <div class="bottom-nav">
    <div
      v-for="item in navItems"
      :key="item.path"
      class="nav-item"
      :class="{ active: currentRoute === item.path }"
      @click="navigate(item.path)"
    >
      <img
        :src="currentRoute === item.path ? item.activeIcon : item.icon"
        class="nav-icon"
        :alt="item.label"
      />
      <span>{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

const navItems = [
  {
    path: "/calendar",
    label: "日程",
    icon: "/icons/calendar.svg",
    activeIcon: "/icons/calendar-active.svg",
  },
  {
    path: "/community",
    label: "小镇",
    icon: "/icons/community.svg",
    activeIcon: "/icons/community-active.svg",
  },
  {
    path: "/profile",
    label: "我的",
    icon: "/icons/profile.svg",
    activeIcon: "/icons/profile-active.svg",
  },
];

const currentRoute = computed(() => route.path);

const navigate = (path) => {
  if (route.path === path) return;
  router.push(path);
};
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #fff;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
  max-width: inherit;
  margin: 0 auto;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 0;
  min-width: 56px;
  color: #909399;
  font-size: 12px;
  cursor: pointer;
}

.nav-item.active {
  color: #409eff;
}

.nav-icon {
  width: 24px;
  height: 24px;
}

/* 在大屏幕上限制宽度 */
@media screen and (min-width: 768px) {
  .bottom-nav {
    max-width: 480px;
    left: 50%;
    transform: translateX(-50%);
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .bottom-nav {
    background: #242424;
  }

  .nav-item {
    color: #909399;
  }

  .nav-item.active {
    color: var(--el-color-primary);
  }
}
</style>
