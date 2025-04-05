<template>
  <div class="top-spacing"></div>
  <div class="private-chat-list-view">
    <div class="header">
      <div class="title">我的私聊</div>
      <el-button @click="showNewChatDialog" text :icon="Plus" />
    </div>

    <div class="chat-list" v-loading="loading">
      <template v-if="chats.length > 0">
        <div
          v-for="(chat, index) in chats"
          :key="chat.id"
          class="chat-swipe-wrapper"
        >
          <div 
            class="chat-item" 
            :class="{ unread: chat.unread_count > 0, pinned: chat.is_pinned, 'show-actions': activeIndex === index }"
            @click="openChat(chat.id)"
            @touchstart="handleTouchStart($event, index)"
            @touchmove="handleTouchMove($event, index)"
            @touchend="handleTouchEnd(index)"
          >
            <div v-if="chat.is_pinned" class="pin-badge">
              <el-icon><Top /></el-icon>
            </div>
            <div class="chat-avatar">
              <el-avatar
                :size="50"
                :src="getChatAvatar(chat)"
                @error="handleAvatarError"
              />
              <div v-if="chat.is_ephemeral" class="ephemeral-badge" title="无痕会话">
                <el-icon><Lock /></el-icon>
              </div>
            </div>
            <div class="chat-info">
              <div class="chat-name">{{ getChatName(chat) }}</div>
              <div class="last-message">{{ chat.last_message_preview || '暂无消息' }}</div>
            </div>
            <div class="chat-meta">
              <div class="time">{{ formatTime(chat.updated_at) }}</div>
              <div v-if="chat.unread_count > 0" class="unread-count">
                {{ chat.unread_count > 99 ? '99+' : chat.unread_count }}
              </div>
            </div>
            
            <div class="action-buttons">
              <div class="action-button pin" @click.stop="toggleChatPin(chat)">
                <el-icon><component :is="chat.is_pinned ? 'Bottom' : 'Top'" /></el-icon>
                <span>{{ chat.is_pinned ? '取消置顶' : '置顶' }}</span>
              </div>
              <div class="action-button delete" @click.stop="deleteChat(chat)">
                <el-icon><Delete /></el-icon>
                <span>删除</span>
              </div>
            </div>
          </div>
        </div>
      </template>
      <el-empty v-else description="暂无会话" />
    </div>

    <!-- 新建会话对话框 -->
    <el-dialog
      v-model="showNewChat"
      title="新建私聊"
      width="90%"
      class="mobile-dialog"
    >
      <el-form @submit.native.prevent>
        <el-form-item label="搜索用户">
          <el-input
            v-model="searchQuery"
            placeholder="输入用户名或昵称"
            clearable
            @change="handleSearchInput"
            @keyup.enter="handleSearchInput"
          >
            <template #suffix>
              <el-button :icon="Search" @click="handleSearchInput" :loading="isSearching" />
            </template>
          </el-input>
        </el-form-item>

        <el-divider>搜索结果</el-divider>

        <div class="user-search-results" v-loading="isSearching">
          <div v-if="!searchedUsers.length && searchQuery && !isSearching" class="no-results">
            未找到匹配的用户
          </div>
          <div
            v-for="user in searchedUsers"
            :key="user.id"
            class="user-item"
          >
            <el-avatar :size="40" :src="getAvatarUrl(user.avatar)" @error="handleAvatarError" />
            <div class="user-info">
              <div class="username">{{ user.nickname || user.username }}</div>
              <div class="user-id">ID: {{ user.id }}</div>
            </div>
            <el-button size="small" type="primary" @click="createChatWithUser(user.id)">发起会话</el-button>
          </div>
        </div>
      </el-form>
    </el-dialog>

    <BottomNavBar />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Lock, InfoFilled, Plus, Search, Delete, Top, Bottom } from '@element-plus/icons-vue';
import { usePrivateChatStore } from '@/stores/privateChat';
import { useAuthStore } from '@/stores/auth';
import BottomNavBar from '@/components/BottomNavBar.vue';
import axios from 'axios';
import { API_BASE_URL } from '@/config';
import dayjs from 'dayjs';
import { getAvatarUrl, getDefaultAvatarUrl } from '@/utils/imageHelpers';

const router = useRouter();
const privateChatStore = usePrivateChatStore();
const authStore = useAuthStore();

const loading = ref(false);
const showNewChat = ref(false);
const searchQuery = ref('');
const searchedUsers = ref([]);
const isSearching = ref(false);
const activeIndex = ref(null);
const touchStartX = ref(0);
const touchStartY = ref(0);
const currentIndex = ref(null);

const chats = computed(() => privateChatStore.chats || []);

// 防抖定时器
let searchDebounceTimer = null;
const DEBOUNCE_DELAY = 300; // 毫秒

// 防抖包装的搜索函数
const debouncedSearch = () => {
  // 清除之前的定时器
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  
  // 设置新的定时器
  searchDebounceTimer = setTimeout(() => {
    searchUsers();
  }, DEBOUNCE_DELAY);
};

// 清理定时器
onBeforeUnmount(() => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
});

// 更新输入框监听，使用防抖
const handleSearchInput = () => {
  debouncedSearch();
};

onMounted(async () => {
  loading.value = true;
  try {
    await privateChatStore.getChats();
  } catch (error) {
    ElMessage.error('获取会话列表失败');
    console.error('获取会话列表错误:', error);
  } finally {
    loading.value = false;
  }
});

const showNewChatDialog = () => {
  showNewChat.value = true;
  searchQuery.value = '';
  searchedUsers.value = [];
};

const searchUsers = async () => {
  // 验证搜索查询
  const query = searchQuery.value.trim();
  if (!query) {
    searchedUsers.value = [];
    return;
  }
  
  // 至少输入2个字符
  if (query.length < 2) {
    ElMessage.warning('请至少输入2个字符');
    return;
  }
  
  try {
    isSearching.value = true;
    const response = await axios.get(
      `${API_BASE_URL}/api/users`,
      {
        params: { 
          query: query,
          type: 'search' 
        },
        headers: { Authorization: `Bearer ${authStore.token}` }
      }
    );
    
    // 检查是否搜索到当前用户，并排除
    const users = response.data.users || [];
    searchedUsers.value = users.filter(user => user.id !== authStore.user.id);
    
    // 如果结果为空
    if (searchedUsers.value.length === 0 && users.length > 0) {
      ElMessage.info('搜索结果中只有您自己');
    }
  } catch (error) {
    ElMessage.error('搜索用户失败');
    console.error('搜索用户错误:', error);
  } finally {
    isSearching.value = false;
  }
};

const createChatWithUser = async (userId) => {
  try {
    const chatId = await privateChatStore.createChat(userId);
    showNewChat.value = false;
    
    // 导航到会话页面
    router.push(`/private-chat/${chatId}`);
  } catch (error) {
    ElMessage.error('创建会话失败');
    console.error('创建会话错误:', error);
  }
};

const openChat = (chatId) => {
  router.push(`/private-chat/${chatId}`);
};

const getChatName = (chat) => {
  if (!chat.members || !chat.members.length) {
    return '未知联系人';
  }
  
  // 返回第一个非当前用户的成员名称
  const otherMember = chat.members.find(m => m.id !== authStore.user.id);
  return otherMember ? (otherMember.nickname || otherMember.username) : '未知联系人';
};

const getChatAvatar = (chat) => {
  if (!chat.members || !chat.members.length) {
    return getDefaultAvatarUrl();
  }
  
  // 返回第一个非当前用户的成员头像
  const otherMember = chat.members.find(m => m.id !== authStore.user.id);
  return otherMember && otherMember.avatar ? getAvatarUrl(otherMember.avatar) : getDefaultAvatarUrl();
};

const handleAvatarError = () => {
  return true; // 保持错误会话头像
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = dayjs(timestamp);
  const now = dayjs();
  
  if (date.isSame(now, 'day')) {
    // 今天，只显示时间
    return date.format('HH:mm');
  } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
    // 昨天
    return '昨天';
  } else if (date.isSame(now, 'year')) {
    // 今年，显示月日
    return date.format('MM-DD');
  } else {
    // 其他年份
    return date.format('YYYY-MM-DD');
  }
};

const toggleChatPin = async (chat) => {
  try {
    await privateChatStore.toggleChatPin(chat.id);
    ElMessage.success(!chat.is_pinned ? '已置顶' : '已取消置顶');
  } catch (error) {
    ElMessage.error(!chat.is_pinned ? '置顶失败' : '取消置顶失败');
    console.error('置顶操作失败:', error);
  }
};

const deleteChat = async (chat) => {
  try {
    await ElMessageBox.confirm('确定要删除此会话吗？', '删除会话', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await privateChatStore.deleteChat(chat.id);
    ElMessage.success('会话已删除');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除会话失败');
      console.error('删除会话失败:', error);
    }
  }
};

const handleTouchStart = (event, index) => {
  // 记录起始触摸点
  if (event.touches.length === 1) {
    const touch = event.touches[0];
    touchStartX.value = touch.clientX;
    touchStartY.value = touch.clientY;
    currentIndex.value = index;
  }
};

const handleTouchMove = (event, index) => {
  // 如果不是当前处理的索引，忽略
  if (currentIndex.value !== index) return;
  
  if (event.touches.length === 1) {
    const touch = event.touches[0];
    const deltaX = touchStartX.value - touch.clientX;
    
    // 如果是向左滑动（正值）并且大于最小阈值，显示按钮
    if (deltaX > 50) {
      activeIndex.value = index;
    } else {
      activeIndex.value = null;
    }
  }
};

const handleTouchEnd = (index) => {
  // 重置状态
  touchStartX.value = 0;
  touchStartY.value = 0;
  currentIndex.value = null;
};
</script>

<style scoped>
.private-chat-list-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f8fa;
}
.top-spacing {
  height: 20px;
  width: 100%;
  background-color: #f8f9fa;
}
.header {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 10;
}

.title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 500;
  margin-left: 40px;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.chat-swipe-wrapper {
  margin-bottom: 10px;
  background-color: transparent;
  border-radius: 8px;
  overflow: hidden;
}

.chat-item {
  display: flex;
  padding: 15px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.chat-item.pinned {
  background-color: #f5faff;
  border-left: 3px solid #409eff;
}

.chat-item.unread {
  background-color: #f0f9ff;
}

.pin-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  color: #409eff;
  font-size: 12px;
}

.chat-avatar {
  position: relative;
  margin-right: 15px;
}

.ephemeral-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: #409eff;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.chat-info {
  flex: 1;
  overflow: hidden;
}

.chat-name {
  font-weight: 500;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}

.last-message {
  color: #666;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}

.chat-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  min-width: 50px;
}

.time {
  font-size: 12px;
  color: #999;
  margin-bottom: 5px;
}

.unread-count {
  background-color: #f56c6c;
  color: #fff;
  border-radius: 50%;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  padding: 0 5px;
}

.action-buttons {
  display: flex;
  position: absolute;
  right: -160px; /* 初始位置，隐藏在右侧 */
  top: 0;
  height: 100%;
  transition: transform 0.3s ease;
}

.chat-item.show-actions .action-buttons {
  transform: translateX(-160px); /* 显示按钮 */
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 100%;
  color: #fff;
  font-size: 14px;
  z-index: 10;
}

.action-button.pin {
  background-color: #409eff;
}

.action-button.delete {
  background-color: #f56c6c;
}

.action-button .el-icon {
  font-size: 20px;
  margin-bottom: 5px;
}

.user-search-results {
  max-height: 300px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.user-info {
  flex: 1;
  margin-left: 10px;
}

.username {
  font-weight: 500;
}

.user-id {
  font-size: 12px;
  color: #999;
}

.no-results {
  text-align: center;
  color: #999;
  padding: 20px;
}

.ephemeral-hint {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
}

.ephemeral-hint .el-icon {
  margin-right: 5px;
  color: #409eff;
}

/* 移除不需要的Vant样式覆盖 */
:deep(.van-swipe-cell__left) {
  display: none;
}

:deep(.van-swipe-cell__right) {
  display: none;
}

:deep(.van-swipe-cell__wrapper) {
  display: none;
}
</style> 