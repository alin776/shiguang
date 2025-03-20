<template>
  <el-menu
    :default-active="activeIndex"
    class="sidebar-menu"
    router
    :collapse="isCollapse"
  >
    <div class="logo-container">
      <img src="@/assets/logo.png" alt="Logo" class="logo" v-if="!isCollapse">
      <img src="@/assets/logo-mini.png" alt="Logo" class="logo-mini" v-else>
    </div>
    
    <el-menu-item index="/">
      <el-icon><House /></el-icon>
      <span>控制面板</span>
    </el-menu-item>
    
    <el-menu-item index="/posts">
      <el-icon><Document /></el-icon>
      <span>文章管理</span>
    </el-menu-item>
    
    <el-menu-item index="/categories">
      <el-icon><Collection /></el-icon>
      <span>分类管理</span>
    </el-menu-item>
    
    <el-menu-item index="/feedbacks">
      <el-icon><ChatLineRound /></el-icon>
      <span>反馈管理</span>
    </el-menu-item>
    
    <el-menu-item index="/tasks">
      <el-icon><List /></el-icon>
      <span>任务管理</span>
    </el-menu-item>
    
    <el-menu-item index="/settings">
      <el-icon><Setting /></el-icon>
      <span>系统设置</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { 
  House, 
  Document, 
  Collection, 
  Setting,
  ChatLineRound,
  List
} from '@element-plus/icons-vue'

const route = useRoute()
const activeIndex = computed(() => route.path)

// 从父组件接收是否折叠状态
const props = defineProps({
  isCollapse: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.sidebar-menu {
  height: 100%;
  border-right: none;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 220px;
}

.logo-container {
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px 0;
}

.logo {
  height: 40px;
}

.logo-mini {
  height: 30px;
}
</style> 