<template>
  <div>
    <!-- 底部导航栏 -->
    <div class="bottom-nav">
      <div
        v-for="item in navItems"
        :key="item.path"
        class="nav-item"
        :class="{ active: currentRoute === item.path }"
        @click="navigate(item.path)"
      >
        <div class="icon-container" :class="{ active: currentRoute === item.path }">
          <img
            :src="currentRoute === item.path ? item.activeIcon : item.icon"
            class="nav-icon"
            :alt="item.label"
          />
        </div>
        <span>{{ item.label }}</span>
      </div>
    </div>
    
    <!-- 底部导航栏占位元素 -->
    <div class="bottom-nav-placeholder"></div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

const navItems = [
  {
    path: "/note",
    label: "小记",
    icon: "/icons/note.svg",
    activeIcon: "/icons/note-active.svg",
  },
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

const currentRoute = computed(() => {
  // 处理路由匹配逻辑，确保子路由也能正确高亮对应的底部导航项
  const path = route.path;
  if (path.startsWith('/calendar/')) {
    return '/calendar';
  } else if (path.startsWith('/community/')) {
    return '/community';
  } else if (path.startsWith('/profile/')) {
    return '/profile';
  } else if (path.startsWith('/note/')) {
    return '/note';
  }
  return path;
});

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
  height: 60px;
  background: #ffffff;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 100;
  max-width: inherit;
  margin: 0 auto;
  border-radius: 20px 20px 0 0;
  padding: 0 10px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  border-top: 1px solid #f5f5f5;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 0;
  min-width: 70px;
  color: #a0a0a0;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: all 0.3s ease;
  margin-bottom: 2px;
}

.icon-container.active {
  background-color: #ff9f43;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 159, 67, 0.3);
}

.nav-item.active {
  color: #ff9f43;
  transform: scale(1.05);
  font-weight: 500;
}

.nav-item:not(.active) {
  color: #a0a0a0;
  opacity: 0.8;
}

.nav-icon {
  width: 24px;
  height: 24px;
  transition: all 0.3s ease;
}

/* 在大屏幕上限制宽度 */
@media screen and (min-width: 768px) {
  .bottom-nav {
    max-width: 480px;
    left: 50%;
    transform: translateX(-50%);
  }
}

/* 底部导航栏占位元素 */
.bottom-nav-placeholder {
  height: 60px;
  width: 100%;
  margin-bottom: 0;
}
</style>
