<template>
  <div class="note-page no-extra-padding">
    <!-- 背景改为白色 -->
    <div class="white-background"></div>

    <!-- 内容主体 -->
    <div class="note-content">
      <!-- 顶部标题栏 -->
      <div class="header-switch">
        <div class="switch-button" @click="toggleView">
          <div :class="['option', { active: currentView === 'note' }]">小记</div>
          <div :class="['divider']"></div>
          <div :class="['option', { active: currentView === 'calendar' }]">记事打卡</div>
        </div>
      </div>

      <!-- 日期显示 -->
      <div class="date-display">
        <div class="date-number">{{ currentDay }}</div>
        <div class="date-info">
          Mar.{{ currentYear }}
          <div class="location">{{ location }} {{ temperature }}</div>
        </div>
      </div>

      <!-- 卡片区域 - 使用swiper实现滑动效果 -->
      <div class="card-container">
        <swiper
          :slides-per-view="1"
          :space-between="0"
          :effect="'cards'"
          :modules="swiperModules"
          @swiper="onSwiper"
          @slideChange="onSlideChange"
          class="note-swiper"
        >
          <swiper-slide v-for="(note, index) in notes" :key="index" class="note-slide">
            <div class="note-card">
              <!-- 卡片图片 -->
              <div class="note-image-container" v-if="note.image">
                <img :src="note.image" :alt="note.author" class="note-image">
              </div>
              
              <!-- 卡片内容 -->
              <div class="note-text-container">
                <div class="note-text">{{ note.content }}</div>
              </div>
              
              <!-- 卡片底部信息 -->
              <div class="note-footer">
                <div class="author-info">
                  <div class="author-avatar">
                    <el-avatar :size="36" :src="note.avatar" class="user-avatar">
                      {{ note.author.charAt(0) }}
                    </el-avatar>
                  </div>
                  <div class="author-name">{{ note.author }}</div>
                </div>
                
                <div class="like-area">
                  <el-icon class="like-icon"><Star /></el-icon>
                  <span class="like-count">{{ note.likes }}</span>
                </div>
              </div>
            </div>
          </swiper-slide>
        </swiper>
      </div>
    </div>
    
    <!-- 底部工具栏 -->
    <div class="bottom-tools">
      <div class="tool-button home-button">
        <el-icon class="tool-icon"><Notebook /></el-icon>
        <span>小记</span>
      </div>
      <div class="tool-button edit-button" @click="goToSubmitNote">
        <el-icon class="tool-icon"><EditPen /></el-icon>
      </div>
      <div class="tool-button share-button">
        <el-icon class="tool-icon"><Share /></el-icon>
      </div>
    </div>

    <!-- 底部导航 -->
    <BottomNavBar />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { Star, EditPen, Notebook, Share } from "@element-plus/icons-vue";
// 移除原来的背景
// import SpaceBackground from "./calendar/components/SpaceBackground.vue";
import BottomNavBar from "../components/BottomNavBar.vue";

// 引入Swiper组件
import { Swiper, SwiperSlide } from 'swiper/vue';
import { EffectCards } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-cards';

const router = useRouter();
const currentView = ref("note");
const currentNoteIndex = ref(0);
const swiperModules = [EffectCards];
const swiperInstance = ref(null);

// 绑定swiper实例
const onSwiper = (swiper) => {
  swiperInstance.value = swiper;
};

// 处理滑动变化
const onSlideChange = (swiper) => {
  currentNoteIndex.value = swiper.activeIndex;
};

// 页面加载时，设置整个文档背景为白色并只禁止水平滚动
onMounted(() => {
  // 初始化页面
  currentView.value = "note";
  
  // 设置html和body为白色背景，但只禁止水平滚动
  document.documentElement.style.backgroundColor = '#ffffff';
  document.documentElement.style.overflowX = 'hidden';
  document.documentElement.style.overflowY = 'auto';
  document.documentElement.style.position = 'static'; // 移除固定定位
  
  document.body.style.backgroundColor = '#ffffff';
  document.body.style.overflowX = 'hidden';
  document.body.style.overflowY = 'auto';
  document.body.style.position = 'static'; // 移除固定定位
  document.body.style.touchAction = 'pan-y'; // 允许垂直触摸手势
});

// 小记数据
const notes = ref([
  {
    id: 1,
    content: "怀着床榻的萌晖看下一张小记，我每时每刻都在填平希望的湖泊。",
    author: "阿多尼斯",
    avatar: "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
    likes: 5108,
    timestamp: "2025-03-16T10:30:00",
    image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
  },
  {
    id: 2,
    content: "今天天气真好，阳光明媚，一起出去走走吧。",
    author: "alin",
    avatar: "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
    likes: 423,
    timestamp: "2025-03-16T09:15:00",
    image: "https://images.unsplash.com/photo-1611709911780-2b7232d97457?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
  },
  {
    id: 3,
    content: "写代码写到凌晨三点，终于解决了那个bug。成就感满满！",
    author: "alin",
    avatar: "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
    likes: 256,
    timestamp: "2025-03-15T03:10:00",
    image: null
  }
]);

// 当前日期信息
const now = new Date();
const currentDay = computed(() => now.getDate());
const currentYear = computed(() => now.getFullYear());
const location = ref("上海·阴");
const temperature = ref("8.6°C");

// 切换视图
const toggleView = () => {
  if (currentView.value === "note") {
    router.push("/calendar");
  } else {
    currentView.value = "note";
  }
};

// 跳转到投稿页面
const goToSubmitNote = () => {
  router.push("/note/submit");
};
</script>

<style scoped>
.note-page {
  min-height: 100vh;
  height: auto; /* 允许高度自适应内容 */
  position: relative; /* 改回相对定位，允许滚动 */
  display: flex;
  flex-direction: column;
  text-align: left;
  background-color: #ffffff;
  overflow-x: hidden; /* 只禁止水平滚动 */
  overflow-y: auto; /* 允许垂直滚动 */
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  touch-action: pan-y; /* 允许垂直滑动，禁止水平滑动 */
}

.white-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background-color: #ffffff;
  z-index: -10;
}

.note-content {
  padding: 0 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  z-index: 1;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden; /* 只禁止水平滚动 */
  overflow-y: visible; /* 允许垂直滚动 */
  touch-action: pan-y; /* 允许垂直滑动，禁止水平滑动 */
}

/* 顶部标题栏和切换按钮 */
.header-switch {
  display: flex;
  justify-content: center;
  padding: 16px 0;
  margin-top: 10px;
  width: 100%;
  overflow: visible;
}

.switch-button {
  display: flex;
  background-color: rgba(242, 242, 242, 0.8);
  border-radius: 20px;
  padding: 3px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(236, 240, 241, 0.9);
  overflow: hidden;
}

.option {
  padding: 8px 20px;
  font-size: 14px;
  cursor: pointer;
  color: #7f8c8d;
  transition: all 0.3s ease;
  border-radius: 18px;
  white-space: nowrap;
}

.option.active {
  background-color: #2c3e50;
  color: white;
  font-weight: 500;
}

.divider {
  width: 1px;
  background-color: #e0e0e0;
  margin: 8px 0;
}

/* 日期显示 */
.date-display {
  display: flex;
  align-items: center;
  margin: 10px 0; /* 减少上下间距 */
}

.date-number {
  font-size: 60px;
  font-weight: 800;
  line-height: 1;
  color: #2c3e50;
  margin-right: 15px;
}

.date-info {
  font-size: 16px;
  color: #34495e;
  font-weight: 500;
  margin-bottom: 5px;
}

.location {
  font-size: 14px;
  color: #7f8c8d;
  margin-top: 4px;
  font-weight: normal;
}

/* 卡片容器 */
.card-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  overflow-x: hidden; /* 只禁止水平溢出 */
  overflow-y: visible; /* 允许垂直溢出 */
  touch-action: pan-y; /* 允许垂直方向的触摸手势 */
}

.note-swiper {
  width: 100%;
  height: 46vh; /* 再减小高度 */
  max-width: 100%;
  margin: 0 auto;
  overflow: visible;
}

.note-slide {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

/* 修改Swiper卡片效果样式 */
:deep(.swiper-cards) {
  overflow: visible;
  touch-action: pan-y; /* 只允许垂直方向的触摸手势 */
}

:deep(.swiper-wrapper) {
  overflow: visible !important;
  touch-action: pan-y; /* 只允许垂直方向的触摸手势 */
}

.note-card {
  width: 94%;
  height: 95%;
  margin: 0 auto;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
}

.note-image-container {
  width: 100%;
  height: 60%;
  overflow: hidden;
}

.note-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.note-text-container {
  padding: 16px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.note-text {
  font-size: 16px;
  line-height: 1.6;
  color: #2c3e50;
  font-weight: 500;
  text-align: center;
}

.note-footer {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  display: flex;
  align-items: center;
}

.user-avatar {
  border: 2px solid white;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

.author-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.like-area {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: rgba(240, 240, 240, 0.8);
  padding: 6px 14px;
  border-radius: 20px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
}

.like-icon {
  font-size: 18px;
  color: #e74c3c;
}

.like-count {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

/* 底部工具栏 */
.bottom-tools {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 5px 20px;
  background-color: #ffffff;
  border-top: 1px solid #f0f0f0;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  z-index: 10;
  overflow: hidden; /* 防止溢出 */
}

.tool-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.tool-icon {
  font-size: 22px;
  color: #2c3e50;
}

.edit-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.edit-button .tool-icon {
  font-size: 22px;
  color: #2c3e50;
}

/* 响应式调整 */
@media screen and (max-width: 480px) {
  .date-number {
    font-size: 48px;
  }
  
  .note-swiper {
    height: 44vh; /* 在小屏幕上进一步减小高度 */
  }
  
  .option {
    padding: 7px 14px;
    font-size: 13px;
  }
  
  .bottom-tools {
    padding: 5px 12px;
  }
  
  .note-card {
    width: 92%;
    height: 94%;
  }
  
  .note-text {
    font-size: 15px;
  }
}
</style> 