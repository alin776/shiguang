<template>
  <div class="dashboard-layout">
    <!-- 侧边栏 -->
    <div class="sidebar">
      <div class="logo">
        <h2>时光后台</h2>
      </div>
      <el-menu
        :default-active="activeMenuIndex"
        router
        class="sidebar-menu"
        :collapse="isCollapsed"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/">
          <el-icon><Menu /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/posts">
          <el-icon><Document /></el-icon>
          <span>帖子管理</span>
        </el-menu-item>
        <el-menu-item index="/categories">
          <el-icon><FolderOpened /></el-icon>
          <span>分类管理</span>
        </el-menu-item>
        <el-menu-item index="/feedbacks">
          <el-icon><ChatDotRound /></el-icon>
          <span>反馈管理</span>
        </el-menu-item>
        <el-menu-item index="/notes">
          <el-icon><Notebook /></el-icon>
          <span>小记管理</span>
        </el-menu-item>
        <el-menu-item index="/versions">
          <el-icon><Connection /></el-icon>
          <span>版本管理</span>
        </el-menu-item>
      </el-menu>
    </div>
    
    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 顶部导航 -->
      <div class="top-nav">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'posts'">帖子管理</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'post-detail'">帖子详情</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'categories'">分类管理</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'feedbacks'">反馈管理</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'notes'">小记管理</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'versions'">版本管理</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="user-actions">
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              {{ userStore.userInfo.username || '管理员' }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      
      <!-- 路由视图 -->
      <div class="page-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Menu, Document, FolderOpened, ArrowDown, ChatDotRound, Notebook, Connection } from '@element-plus/icons-vue'

const userStore = useUserStore()
const router = useRouter()
const isCollapsed = ref(false)
const username = computed(() => userStore.username)

// 计算当前激活的菜单项
const activeMenuIndex = computed(() => {
  return router.currentRoute.value.path
})

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      router.push('/login')
    }).catch(() => {})
  }
}
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 230px;
  background-color: #304156;
  color: #fff;
  height: 100%;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  border-bottom: 1px solid #45526b;
}

.logo h2 {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
}

.sidebar-menu {
  border-right: none;
  flex: 1;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-nav {
  height: 60px;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: #fff;
}

.user-dropdown {
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.user-dropdown i {
  margin-left: 5px;
}

.page-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style> 