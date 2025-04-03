<template>
  <div class="dashboard-layout">
    <!-- 侧边栏 -->
    <div class="sidebar" :class="{ show: isSidebarVisible }">
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
        
        <!-- 内容管理 -->
        <el-sub-menu index="content">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>内容管理</span>
          </template>
          <el-menu-item index="/posts">
            <el-icon><Document /></el-icon>
            <span>帖子管理</span>
          </el-menu-item>
          <el-menu-item index="/notes">
            <el-icon><Notebook /></el-icon>
            <span>小记管理</span>
          </el-menu-item>
          <el-menu-item index="/categories">
            <el-icon><FolderOpened /></el-icon>
            <span>分类管理</span>
          </el-menu-item>
          <el-menu-item index="/content-review">
            <el-icon><Check /></el-icon>
            <span>内容审核</span>
          </el-menu-item>
          <el-menu-item index="/rate-post-categories">
            <el-icon><Star /></el-icon>
            <span>评分贴分类</span>
          </el-menu-item>
          <el-menu-item index="/rate-posts">
            <el-icon><StarFilled /></el-icon>
            <span>评分贴管理</span>
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 用户管理 -->
        <el-sub-menu index="users">
          <template #title>
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </template>
          <el-menu-item index="/users">
            <el-icon><User /></el-icon>
            <span>用户列表</span>
          </el-menu-item>
          <el-menu-item index="/feedbacks">
            <el-icon><ChatDotRound /></el-icon>
            <span>反馈管理</span>
          </el-menu-item>
          <el-menu-item index="/reports">
            <el-icon><Warning /></el-icon>
            <span>举报管理</span>
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 活动管理 -->
        <el-sub-menu index="activities">
          <template #title>
            <el-icon><Calendar /></el-icon>
            <span>活动管理</span>
          </template>
          <el-menu-item index="/activities">
            <el-icon><Calendar /></el-icon>
            <span>活动列表</span>
          </el-menu-item>
          <el-menu-item index="/tasks">
            <el-icon><List /></el-icon>
            <span>任务管理</span>
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 积分系统 -->
        <el-sub-menu index="points">
          <template #title>
            <el-icon><GoodsFilled /></el-icon>
            <span>积分系统</span>
          </template>
          <el-menu-item index="/points-products">
            <el-icon><GoodsFilled /></el-icon>
            <span>积分商品</span>
          </el-menu-item>
          <el-menu-item index="/points-exchanges">
            <el-icon><Tickets /></el-icon>
            <span>兑换记录</span>
          </el-menu-item>
          <el-menu-item index="/card-game-records">
            <el-icon><VideoPlay /></el-icon>
            <span>抽卡记录</span>
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 系统设置 -->
        <el-sub-menu index="system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </template>
          <el-menu-item index="/announcements">
            <el-icon><Bell /></el-icon>
            <span>公告管理</span>
          </el-menu-item>
          <el-menu-item index="/versions">
            <el-icon><Connection /></el-icon>
            <span>版本管理</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>
    
    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 顶部导航 -->
      <div class="top-nav">
        <div class="menu-toggle" @click="toggleSidebar">
          <el-icon><Menu /></el-icon>
        </div>
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'posts'">帖子管理</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'post-detail'">帖子详情</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'users'">用户管理</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'tasks'">任务管理</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'categories'">分类管理</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'feedbacks'">反馈管理</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'notes'">小记管理</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'versions'">版本管理</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'content-review'">内容审核</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'reports'">举报管理</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'announcements'">公告管理</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'points-products'">积分商品管理</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'points-exchanges'">积分兑换记录</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'card-game-records'">抽卡游戏记录</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'rate-post-categories'">评分贴分类管理</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'rate-posts'">评分贴管理</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name === 'rate-post-detail'">评分贴详情</el-breadcrumb-item>
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
import { ref, computed, watch } from 'vue'
import { useUserStore } from '@/store/user'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { 
  Menu, Document, FolderOpened, ArrowDown, ChatDotRound, 
  Notebook, Connection, User, List, Check, Warning, Bell, 
  Calendar, GoodsFilled, Tickets, VideoPlay, Setting, Star, StarFilled
} from '@element-plus/icons-vue'

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

// 控制侧边栏显示/隐藏
const isSidebarVisible = ref(false)

const toggleSidebar = () => {
  isSidebarVisible.value = !isSidebarVisible.value
}

// 监听路由变化，在移动端自动隐藏侧边栏
watch(() => router.currentRoute.value, () => {
  if (window.innerWidth <= 768) {
    isSidebarVisible.value = false
  }
})
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  height: 100vh;
  width: 100%;
}

.sidebar {
  width: 230px;
  background-color: #304156;
  color: #fff;
  height: 100%;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
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
  min-width: 0; /* 防止flex子元素溢出 */
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

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .dashboard-layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }

  .sidebar.show {
    transform: translateX(0);
  }

  .main-content {
    margin-left: 0;
  }

  .top-nav {
    padding: 0 10px;
  }

  .page-content {
    padding: 10px;
  }

  .logo h2 {
    font-size: 18px;
  }

  .el-menu-item, .el-sub-menu__title {
    padding: 0 10px;
  }

  .user-dropdown {
    font-size: 12px;
  }
}

/* 添加汉堡菜单按钮 */
.menu-toggle {
  display: none;
  font-size: 24px;
  cursor: pointer;
  color: #303133;
}

@media screen and (max-width: 768px) {
  .menu-toggle {
    display: block;
  }
}
</style> 